// engine.js: the pure redaction composition. Profile -> tiers -> redacted text,
// typed hits, a residual scan and a send status.
//
// Pure: no I/O, no env, no fs. Browser and Deno portable. Node conveniences
// (people-map loading, quarantine sidecars) live in ./index.js.
//
// Every result carries a status:
//   clean    every part of the text that this profile scans was read, and the
//            residual scan found nothing left to decide. It is a statement
//            about the checks listed in result.scan.checks, not proof that no
//            identifier remains.
//   review   the residual scan listed spans the rules could not decide
//            (result.review). The send guard refuses the result until a person
//            has reviewed them.
//   blocked  a stage failed, the input or options were invalid, or the input
//            was too long. result.text is "[redaction-blocked]", never the input.
//
// FAIL CLOSED (test/fail-closed.test.js, test/contract.test.js): profile
// resolution, people-map normalization, every tier, and every record helper
// return a blocked result instead of throwing or passing input through.
//
// Tier order is load-bearing: pattern -> name -> topic. The name tier turns a
// mapped name into a role token before the topic tier looks for personal
// context, and the topic tier swallows whole sentences last.

import { applyPatterns } from "./patterns.js";
import { applyNames, normalizePeopleMap, nameTokensFor } from "./names.js";
import { applyTopics } from "./topics.js";
import { scanResidual, RESIDUAL_CHECKS } from "./scan.js";
import { seal } from "./seal.js";
import { resolveProfile, profileForSource, PROFILES, DEFAULT_PROFILE, SOURCE_PROFILES } from "./profiles.js";

export { profileForSource, PROFILES, DEFAULT_PROFILE, SOURCE_PROFILES, normalizePeopleMap };

/** Version stamp for meta.redaction provenance. Bump when tier behavior changes. */
export const REDACTION_VERSION = 3;

/** What a blocked result carries in place of the text. Never the original. */
export const BLOCKED_TEXT = "[redaction-blocked]";

/** Longest input accepted by default, in characters. Longer input is blocked. */
export const DEFAULT_MAX_LENGTH = 2_000_000;

// Error class names that may appear in a blocked result. Anything else becomes
// "Error", so a thrown object cannot carry input text out through error.name.
const ERROR_NAMES = new Set(["Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError", "RedactionConfigError", "RedactionInputError"]);

// ── code-span segmentation (light profile) ───────────────────────────
const CODE_SPAN_RE = /```[\s\S]*?```|`[^`\n]{1,2000}`/g;

/** Split text into [{ code: boolean, text }] segments. */
export function splitCodeSegments(text) {
  const segs = [];
  let last = 0;
  for (const m of String(text).matchAll(CODE_SPAN_RE)) {
    if (m.index > last) segs.push({ code: false, text: text.slice(last, m.index) });
    segs.push({ code: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ code: false, text: text.slice(last) });
  return segs.length ? segs : [{ code: false, text: String(text) }];
}

function mergeHits(into, hits) {
  for (const h of hits) {
    const key = `${h.tier}:${h.type}`;
    into.set(key, (into.get(key) || 0) + h.count);
  }
}

function hitsFromMap(map) {
  return [...map.entries()]
    .map(([key, count]) => {
      const i = key.indexOf(":");
      return { tier: key.slice(0, i), type: key.slice(i + 1), count };
    })
    .sort((a, b) => (a.tier + a.type).localeCompare(b.tier + b.type));
}

function errorName(err) {
  const name = err && typeof err === "object" ? err.name : null;
  return typeof name === "string" && ERROR_NAMES.has(name) ? name : "Error";
}

/** Which checks a profile runs, and which identifier kinds it does not check. */
/**
 * What the checks cannot see even when they all run. A clean result means the
 * checks found nothing left to decide, not that none of these is present.
 */
export const KNOWN_GAPS = Object.freeze([
  "a lowercase name that is also an ordinary English word (grace, will), unless a title, relation word, greeting or person verb marks it",
  "a facility named with a clinical word (Valley Hospital)",
  "a name made of two English words joined together (Quellbrook), read as an ordinary word",
  "ages under 90, which are kept on purpose",
  "unlabeled numbers under 7 digits and unlabeled letter-digit codes under 6 characters",
  "an identifier spelled out in words or split across lines (letters spelled one at a time go to review)",
  "meaning: a description that identifies a person without naming them",
]);

export function profileChecks(profile) {
  const checks = ["email", "ssn", "dob", "card", "account", "phone", "coords", "address"];
  const notChecked = [];
  if (profile.clinicalPatterns) checks.push("url", "ip", "device", "labeled-ids", "date", "age");
  else notChecked.push("url", "ip", "device", "labeled-ids", "date", "age");
  if (profile.tiers.includes("name")) checks.push("known-names");
  else notChecked.push("known-names");
  if (profile.unknownNames) checks.push("unknown-names");
  else notChecked.push("unknown-names");
  if (profile.tiers.includes("topic")) checks.push("topics");
  if (profile.residualScan) checks.push(...RESIDUAL_CHECKS.map((c) => `residual:${c}`));
  else notChecked.push("residual-scan");
  return { checks, notChecked };
}

/** Build the blocked result. Carries the failing stage and an allowlisted error name only. */
function blockedResult(profileName, stage, err) {
  return seal({
    text: BLOCKED_TEXT,
    redacted: true,
    blocked: true,
    status: "blocked",
    hits: [{ tier: "engine", type: "blocked", count: 1 }],
    review: [],
    scan: null,
    profile: profileName,
    error: { stage, name: errorName(err) },
  });
}

/**
 * Redact one string under a profile. THE public primitive.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {"light"|"standard"|"identifiers"|"strict"} [opts.profile]  explicit profile (wins)
 * @param {string} [opts.source]          registered source id; an unregistered id blocks
 * @param {string} [opts.unknownSource]   profile to use for an unregistered source instead of blocking
 * @param {object} [opts.peopleMap]       { people:[{name,role,aliases}], safe:[] }
 * @param {Array}  [opts.topicCategories] override topic categories
 * @param {string|Date} [opts.referenceDate]  date used to judge birth years (age over 89)
 * @param {number} [opts.maxLength]       longest input accepted (default 2,000,000 characters)
 * @param {Array}  [opts.extraPatternRules] rules appended to the pattern tier ({ type, re, validate?, replace? }).
 *                                        Append-only: the built-in rules always run.
 * @param {string} [opts.injectFault]     test seam: "pattern", "name", "topic" or "scan" throws at that
 *                                        stage. It can only turn a result into a blocked one.
 */
export function redactText(text, opts = {}) {
  if (!opts || typeof opts !== "object") opts = {};
  let profile;
  try {
    profile = resolveProfile(opts);
    if (!profile || typeof profile !== "object" || !Array.isArray(profile.tiers)) throw new TypeError("profile did not resolve");
  } catch (e) {
    return blockedResult(null, "profile", e);
  }
  const profileName = profile.name;
  if (text === null || text === undefined || text === "") {
    const { checks, notChecked } = profileChecks(profile);
    return seal({ text, redacted: false, blocked: false, status: "clean", hits: [], review: [], scan: { profile: profileName, characters: 0, read: 0, exempt: [], checks, notChecked, knownGaps: KNOWN_GAPS }, profile: profileName });
  }
  if (typeof text !== "string") return blockedResult(profileName, "input", new TypeError("non-string input"));
  const maxLength = Number.isFinite(opts.maxLength) ? opts.maxLength : DEFAULT_MAX_LENGTH;
  if (text.length > maxLength) return blockedResult(profileName, "input", new RangeError("input too long"));

  let stage = "people-map";
  try {
    const map = normalizePeopleMap(opts.peopleMap);
    let referenceDate = null;
    if (opts.referenceDate !== undefined && opts.referenceDate !== null) {
      stage = "options";
      referenceDate = opts.referenceDate instanceof Date ? opts.referenceDate : new Date(String(opts.referenceDate));
      if (!Number.isFinite(referenceDate.getTime())) throw new RangeError("invalid referenceDate");
    }
    const tiers = new Set(profile.tiers);
    const counts = new Map();
    const extraRules = Array.isArray(opts.extraPatternRules) ? opts.extraPatternRules : [];
    const fault = (name) => {
      if (opts.injectFault === name) throw new Error(`injected fault at ${name}`);
    };
    stage = "segment";
    const segments = profile.exemptCode ? splitCodeSegments(text) : [{ code: false, text }];
    const exempt = [];
    let out = "";
    for (const seg of segments) {
      if (seg.code) {
        exempt.push({ start: out.length, end: out.length + seg.text.length, reason: "code span, exempt under the light profile" });
        out += seg.text; // byte-identical pass-through
        continue;
      }
      let t = seg.text;
      if (tiers.has("pattern")) {
        stage = "pattern";
        fault("pattern");
        const r = applyPatterns(t, { clinical: profile.clinicalPatterns, referenceDate });
        t = r.text;
        mergeHits(counts, r.hits);
        if (extraRules.length) {
          const x = applyPatterns(t, { rules: extraRules });
          t = x.text;
          mergeHits(counts, x.hits);
        }
      }
      if (tiers.has("name")) {
        stage = "name";
        fault("name");
        const r = applyNames(t, { map, unknownNames: profile.unknownNames });
        t = r.text;
        mergeHits(counts, r.hits);
      }
      if (tiers.has("topic")) {
        stage = "topic";
        fault("topic");
        const r = applyTopics(t, { strict: profile.topicStrict, categories: opts.topicCategories });
        t = r.text;
        mergeHits(counts, r.hits);
      }
      if (typeof t !== "string") throw new TypeError(`${stage} tier returned non-string`);
      out += t;
    }
    stage = "scan";
    fault("scan");
    const review = profile.residualScan ? scanResidual(out, { names: profile.unknownNames, safe: map.safe, nameTokens: nameTokensFor(map), referenceDate, skip: exempt }) : [];
    const { checks, notChecked } = profileChecks(profile);
    const hits = hitsFromMap(counts);
    const exemptChars = exempt.reduce((n, e) => n + (e.end - e.start), 0);
    return seal({
      text: out,
      redacted: hits.length > 0,
      blocked: false,
      status: review.length ? "review" : "clean",
      hits,
      review,
      scan: { profile: profileName, characters: text.length, read: text.length - exemptChars, exempt, checks, notChecked, knownGaps: KNOWN_GAPS },
      profile: profileName,
    });
  } catch (e) {
    return blockedResult(profileName, stage, e);
  }
}

// ── structured records ───────────────────────────────────────────────
// Every string in a record is redacted, wherever it sits. The fields declared
// as text (firstUserMsg, lastAssistantMsg, operatorTurns[].text,
// assistantTail[], turns[].text, and the summary fields) must be strings when
// present. Any value this code cannot read (a Date, a Buffer, a class instance,
// a function, a cycle, nesting deeper than 32) blocks the record, and so does
// an identifier inside an object key. Originals are kept only on the
// non-enumerable `changes` property, for the local quarantine.

const MAX_DEPTH = 32;
const TRANSCRIPT_FIELDS = new Set(["firstUserMsg", "lastAssistantMsg", "assistantTail", "operatorTurns", "turns"]);
const SUMMARY_FIELDS = new Set(["summary", "topics", "operatorDirections"]);
const NOT_TEXT = Object.freeze({ notText: true }); // a declared text field that is not a string

function isPlainObject(v) {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function attachChanges(result, changes) {
  Object.defineProperty(result, "changes", { value: changes, enumerable: false, writable: true, configurable: true });
  return result;
}

function worst(a, b) {
  const rank = { clean: 0, review: 1, blocked: 2 };
  return rank[b] > rank[a] ? b : a;
}

function recordWalker(opts) {
  const counts = new Map();
  const changes = [];
  const review = [];
  const seen = new WeakSet();
  const state = { status: "clean", blockedFields: [] };
  const block = (field) => {
    state.status = "blocked";
    state.blockedFields.push(field);
    return BLOCKED_TEXT;
  };
  const text = (value, field) => {
    if (value === null || value === undefined || value === "") return value;
    if (typeof value !== "string") return block(field);
    const r = redactText(value, opts);
    mergeHits(counts, r.hits);
    state.status = worst(state.status, r.status);
    if (r.blocked) state.blockedFields.push(field);
    for (const item of r.review) review.push({ field, ...item });
    if (r.text !== value) changes.push({ field, before: value, after: r.text });
    return r.text;
  };
  const any = (value, field, depth = 0) => {
    if (value === null || value === undefined) return value;
    const t = typeof value;
    if (t === "string") return text(value, field);
    if (t === "number" || t === "boolean" || t === "bigint") return value;
    if (t !== "object" || depth > MAX_DEPTH || seen.has(value)) return block(field);
    seen.add(value);
    if (Array.isArray(value)) return value.map((v, i) => any(v, `${field}[${i}]`, depth + 1));
    if (value instanceof Map) {
      const out = new Map();
      for (const [k, v] of value) {
        if (typeof k === "string" && redactText(k, opts).text !== k) return block(`${field} (key)`);
        out.set(k, any(v, `${field}.get(${typeof k === "string" ? k.slice(0, 40) : typeof k})`, depth + 1));
      }
      return out;
    }
    if (value instanceof Set) return new Set([...value].map((v, i) => any(v, `${field}{${i}}`, depth + 1)));
    if (!isPlainObject(value)) return block(field);
    const out = {};
    for (const key of Object.keys(value)) {
      if (redactText(key, opts).text !== key) return block(`${field} (key)`);
      out[key] = any(value[key], field ? `${field}.${key}` : key, depth + 1);
    }
    return out;
  };
  // A key is read like any other string: one that the rules would change is an
  // identifier used as a key, and the record blocks.
  const keyOk = (key) => typeof key !== "string" || redactText(key, opts).text === key;
  return { text, any, block, keyOk, counts, changes, review, state };
}

function recordResult(key, value, w, profileName) {
  const hits = hitsFromMap(w.counts);
  const blocked = w.state.status === "blocked";
  const result = {
    [key]: value,
    redacted: hits.length > 0 || blocked,
    blocked,
    status: w.state.status,
    hits,
    review: w.review,
    profile: profileName,
  };
  if (blocked) result.error = { stage: "record", fields: w.state.blockedFields.slice(0, 20) };
  return seal(attachChanges(result, w.changes));
}

function safeProfileName(opts) {
  try {
    return resolveProfile(opts).name;
  } catch {
    return null;
  }
}

function transcriptFields(parsed, w) {
  const out = {};
  for (const key of Object.keys(parsed)) {
    const v = parsed[key];
    // Declared field names are schema, not data. Any other key is read like text.
    if (!TRANSCRIPT_FIELDS.has(key) && !w.keyOk(key)) {
      w.block("(key)");
      continue;
    }
    if (key === "firstUserMsg" || key === "lastAssistantMsg") out[key] = w.text(v, key);
    else if (key === "assistantTail") {
      out[key] = v === undefined || v === null ? v : Array.isArray(v) ? v.map((t, i) => w.text(t, `assistantTail[${i}]`)) : w.text(NOT_TEXT, key);
    } else if (key === "operatorTurns" || key === "turns") {
      if (v === undefined || v === null) out[key] = v;
      else if (!Array.isArray(v)) out[key] = w.text(NOT_TEXT, key);
      else {
        out[key] = v.map((turn, i) => {
          if (!isPlainObject(turn)) return w.text(NOT_TEXT, `${key}[${i}]`);
          const { text, ...rest } = turn;
          return { ...w.any(rest, `${key}[${i}]`), text: w.text(text, `${key}[${i}].text`) };
        });
      }
    } else out[key] = w.any(v, key);
  }
  return out;
}

/**
 * Redact a parsed transcript record in a copy (input untouched). A record that
 * is not a plain object is blocked.
 *
 * @param {object} parsed   { firstUserMsg, lastAssistantMsg, operatorTurns[], assistantTail[], turns[], … }
 * @param {object} [opts]   same options as redactText
 */
export function redactParsedTranscript(parsed, opts = {}) {
  const profileName = safeProfileName(opts);
  const w = recordWalker(opts);
  if (parsed === null || parsed === undefined) return recordResult("parsed", parsed, w, profileName);
  if (!isPlainObject(parsed)) {
    w.block("(record)");
    return recordResult("parsed", null, w, profileName);
  }
  let out;
  try {
    out = transcriptFields(parsed, w);
  } catch {
    w.block("(record)");
    out = null;
  }
  return recordResult("parsed", out, w, profileName);
}

/**
 * Redact model output before it is stored or sent. Accepts a plain string or a
 * summary object ({ summary, topics, operatorDirections, … }). Every string in
 * it is redacted. Anything else is blocked.
 *
 * @param {string|object|null} summary
 * @param {object} [opts]  same options as redactText
 */
export function redactSummaryFields(summary, opts = {}) {
  const profileName = safeProfileName(opts);
  const w = recordWalker(opts);
  if (summary === null || summary === undefined) return recordResult("summary", summary, w, profileName);
  let out;
  try {
    if (typeof summary === "string") out = w.text(summary, "summary");
    else if (!isPlainObject(summary)) {
      w.block("(summary)");
      out = null;
    } else {
      out = {};
      for (const key of Object.keys(summary)) {
        const v = summary[key];
        if (!SUMMARY_FIELDS.has(key) && !w.keyOk(key)) {
          w.block("(key)");
          continue;
        }
        if (key === "summary") out[key] = w.text(v, "summary");
        else if (key === "topics") out[key] = v == null ? v : Array.isArray(v) ? v.map((t, i) => w.text(t, `topics[${i}]`)) : w.text(NOT_TEXT, "topics");
        else if (key === "operatorDirections") {
          out[key] = v == null ? v : Array.isArray(v)
            ? v.map((q, i) => (isPlainObject(q) ? w.any(q, `operatorDirections[${i}]`) : w.text(NOT_TEXT, `operatorDirections[${i}]`)))
            : w.text(NOT_TEXT, "operatorDirections");
        } else out[key] = w.any(v, key);
      }
    }
  } catch {
    w.block("(summary)");
    out = null;
  }
  return recordResult("summary", out, w, profileName);
}

/**
 * meta.redaction provenance stamp. Carries which tiers and types hit and how
 * often, never the original text. The clock is injectable for reproducible
 * stamps. It is the only use of Date in the engine.
 */
export function redactionMeta({ profile, hits, status = undefined, now = undefined }) {
  const at = now instanceof Date ? now : new Date();
  return {
    version: REDACTION_VERSION,
    profile,
    ...(status ? { status } : {}),
    hits: hits.map((h) => ({ tier: h.tier, type: h.type, count: h.count })),
    redactedAt: at.toISOString(),
  };
}

export default {
  redactText,
  redactParsedTranscript,
  redactSummaryFields,
  redactionMeta,
  splitCodeSegments,
  profileForSource,
  profileChecks,
  REDACTION_VERSION,
  BLOCKED_TEXT,
};
