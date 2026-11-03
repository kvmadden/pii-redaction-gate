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
import { applyNames, normalizePeopleMap, nameTokensFor, tokenNamesFor } from "./names.js";
import { applyTopics } from "./topics.js";
import { scanResidual, RESIDUAL_CHECKS } from "./scan.js";
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

// ── sealing ──────────────────────────────────────────────────────────
// Results are sealed here and nowhere else, and the sealing function is not
// exported. Sealing deep-freezes the result, so what assertSendable checks is
// exactly what a sink receives: text, status, review items and record
// payloads cannot change after the check. isSealed() only reads the seal.
const SEALED = new WeakSet();

function deepFreeze(value, seen = new Set()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.freeze(value);
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (d && "value" in d) deepFreeze(d.value, seen);
  }
  return value;
}

function seal(result) {
  deepFreeze(result);
  SEALED.add(result);
  return result;
}

/** True only for a result this library built and sealed (and therefore froze). */
export function isSealed(value) {
  return value !== null && typeof value === "object" && SEALED.has(value);
}

/** The longest input a caller may allow. A caller can lower the cap, not raise it. */
function clampLength(maxLength) {
  return Number.isFinite(maxLength) && maxLength > 0 ? Math.min(maxLength, DEFAULT_MAX_LENGTH) : DEFAULT_MAX_LENGTH;
}

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
  "a lowercase name on no list or with a rare surname (nurlanovna), unless a person verb follows it",
  "a short all-capitals name of five letters or fewer that is on no name list, read as an acronym (CBC, COPD)",
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
  else notChecked.push("topics");
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
  if (text.length > clampLength(opts.maxLength)) return blockedResult(profileName, "input", new RangeError("input too long"));

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
    // The token names this run can write. Bracketed words in the input that
    // are not among them are read as text, never trusted as redactions.
    const extraTypes = [opts.topicCategories, opts.extraPatternRules].flatMap((list) => (Array.isArray(list) ? list.map((x) => x && x.type) : []));
    const tokenNames = tokenNamesFor(map, extraTypes);
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
        const r = applyNames(t, { map, unknownNames: profile.unknownNames, tokenNames });
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
    const review = profile.residualScan ? scanResidual(out, { names: profile.unknownNames, safe: map.safe, nameTokens: nameTokensFor(map), tokenNames, referenceDate, skip: exempt }) : [];
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
// Every string and every number in a record is read, wherever it sits. The
// fields declared as text (firstUserMsg, lastAssistantMsg, operatorTurns[].text,
// assistantTail[], turns[].text, and the summary fields) must be strings when
// present. A record blocks when it holds:
//   - a value this code cannot read: a Date, a Buffer, a typed array, a class
//     instance, a function, an array or Map or Set with its own methods or a
//     changed prototype, or a Map key that is an object
//   - a cycle, nesting deeper than 32, more than 200,000 values, an array
//     longer than 100,000, or more text in total than maxLength
//   - a key that the rules would change or could not decide ({ "4471023": 1 })
//   - a number that reads as an identifier with its key as a label
//     ({ mrn: 4471023 }, { age: 96 }, { phone: 2125550147 })
// Output is built from fresh objects and arrays, never input references. A
// Map comes back as an array of [key, value] pairs and a Set as an array, so
// the sealed result can be frozen (a frozen Map can still be changed).
// Originals are kept only on the non-enumerable `changes` list, for the local
// quarantine. Results are sealed and frozen like text results.

const MAX_DEPTH = 32;
const MAX_NODES = 200_000;
const MAX_ARRAY = 100_000;
const TRANSCRIPT_FIELDS = new Set(["firstUserMsg", "lastAssistantMsg", "assistantTail", "operatorTurns", "turns"]);
const SUMMARY_FIELDS = new Set(["summary", "topics", "operatorDirections"]);
const NOT_TEXT = Object.freeze({ notText: true }); // a declared text field that is not a string
const INDEX_KEY = /^(?:0|[1-9]\d*)$/;

function isPlainObject(v) {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/** An ordinary array: Array.prototype, a bounded length, and only index keys (no own "map"). */
function isPlainArray(v) {
  if (!Array.isArray(v) || Object.getPrototypeOf(v) !== Array.prototype || v.length > MAX_ARRAY) return false;
  for (const k of Reflect.ownKeys(v)) if (k !== "length" && (typeof k !== "string" || !INDEX_KEY.test(k))) return false;
  return true;
}

/** An own data property, even for "__proto__". */
function defineOwn(obj, key, value) {
  Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });
}

function attachChanges(result, changes) {
  Object.defineProperty(result, "changes", { value: changes, enumerable: false, writable: false, configurable: false });
  return result;
}

function worst(a, b) {
  const rank = { clean: 0, review: 1, blocked: 2 };
  return rank[b] > rank[a] ? b : a;
}

/** "mrn" -> "mrn", "phoneNumber" -> "phone Number", "member_id" -> "member id". */
function keyLabel(key) {
  if (typeof key !== "string" || !/^[A-Za-z][A-Za-z0-9_ -]{0,40}$/.test(key)) return "value";
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
}

function recordWalker(opts) {
  const counts = new Map();
  const changes = [];
  const review = [];
  const exempt = [];
  const ancestors = new Set();
  const maxChars = clampLength(opts.maxLength);
  const state = { status: "clean", blockedFields: [], nodes: 0, characters: 0, read: 0, fields: 0 };
  const block = (field) => {
    state.status = "blocked";
    if (state.blockedFields.length < 20) state.blockedFields.push(field);
    return BLOCKED_TEXT;
  };
  const text = (value, field) => {
    if (value === null || value === undefined || value === "") return value;
    if (typeof value !== "string") return block(field);
    state.characters += value.length;
    if (state.characters > maxChars) return block(field);
    const r = redactText(value, opts);
    state.fields++;
    if (r.scan) {
      state.read += r.scan.read;
      for (const e of r.scan.exempt) exempt.push({ field, ...e });
    }
    mergeHits(counts, r.hits);
    state.status = worst(state.status, r.status);
    if (r.blocked && state.blockedFields.length < 20) state.blockedFields.push(field);
    for (const item of r.review) review.push({ field, ...item });
    if (r.text !== value) changes.push({ field, before: value, after: r.text });
    return r.text;
  };
  // A key is read like text. A key the rules would change, or could not
  // decide, is an identifier used as a key: the record blocks, and the key
  // never appears in a field path.
  const keyOk = (key) => {
    if (typeof key !== "string") return false;
    if (key === "") return true;
    const r = redactText(key, opts);
    return r.status === "clean" && r.text === key;
  };
  // A number is read with its key as a label, so { mrn: 4471023 } reads as
  // "mrn: 4471023". If the rules would change it or flag it, the record blocks.
  const numberOk = (value, key) => {
    const line = `${keyLabel(key)}: ${typeof value === "bigint" ? value.toString() : String(value)}`;
    const r = redactText(line, opts);
    return r.status === "clean" && r.text === line;
  };
  const array = (value, field, fn) => {
    if (!isPlainArray(value)) return block(field);
    const out = [];
    for (let i = 0; i < value.length; i++) out.push(fn(value[i], i));
    return out;
  };
  const any = (value, field, depth = 0, key = undefined) => {
    if (value === null || value === undefined) return value;
    if (++state.nodes > MAX_NODES) return block(field);
    const t = typeof value;
    if (t === "string") return text(value, field);
    if (t === "boolean") return value;
    if (t === "number" || t === "bigint") return numberOk(value, key) ? value : block(field);
    if (t !== "object" || depth > MAX_DEPTH || ancestors.has(value)) return block(field);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) return array(value, field, (v, i) => any(v, `${field}[${i}]`, depth + 1, key));
      if (value instanceof Map || value instanceof Set) {
        const isMap = value instanceof Map;
        if (Object.getPrototypeOf(value) !== (isMap ? Map.prototype : Set.prototype) || Reflect.ownKeys(value).length || value.size > MAX_ARRAY) return block(field);
        const out = [];
        // The intrinsic iterators, so a method planted on the instance is never called.
        for (const entry of isMap ? Map.prototype.entries.call(value) : Set.prototype.values.call(value)) {
          if (!isMap) {
            out.push(any(entry, `${field}[${out.length}]`, depth + 1, key));
            continue;
          }
          const [k, v] = entry;
          const kt = typeof k;
          if (kt === "string" ? !keyOk(k) : kt === "number" || kt === "bigint" ? !numberOk(k, "key") : kt !== "boolean") return block(`${field} (key)`);
          out.push([k, any(v, `${field}[${out.length}]`, depth + 1, kt === "string" ? k : undefined)]);
        }
        return out;
      }
      if (!isPlainObject(value)) return block(field);
      const out = {};
      for (const k of Object.keys(value)) {
        if (!keyOk(k)) return block(`${field || "(record)"} (key)`);
        defineOwn(out, k, any(value[k], field ? `${field}.${k}` : k, depth + 1, k));
      }
      return out;
    } finally {
      ancestors.delete(value);
    }
  };
  return { text, any, array, block, keyOk, counts, changes, review, exempt, state };
}

function recordResult(key, value, w, profile) {
  const hits = hitsFromMap(w.counts);
  const blocked = w.state.status === "blocked";
  const { checks, notChecked } = profileChecks(profile);
  const result = {
    [key]: value,
    redacted: hits.length > 0 || blocked,
    blocked,
    status: w.state.status,
    hits,
    review: w.review,
    scan: blocked
      ? null
      : { profile: profile.name, characters: w.state.characters, read: w.state.read, exempt: w.exempt, checks, notChecked, knownGaps: KNOWN_GAPS, fields: w.state.fields },
    profile: profile.name,
  };
  if (blocked) result.error = { stage: "record", fields: w.state.blockedFields.slice(0, 20) };
  return seal(attachChanges(result, w.changes));
}

function blockedRecordResult(key, profileName, stage) {
  return seal(attachChanges({
    [key]: null,
    redacted: true,
    blocked: true,
    status: "blocked",
    hits: [{ tier: "engine", type: "blocked", count: 1 }],
    review: [],
    scan: null,
    profile: profileName,
    error: { stage },
  }, []));
}

/** Resolve the profile before any field is read. An unknown source blocks the whole record. */
function recordProfile(opts) {
  try {
    const p = resolveProfile(opts);
    return p && Array.isArray(p.tiers) ? p : null;
  } catch {
    return null;
  }
}

function transcriptFields(parsed, w) {
  const out = {};
  for (const key of Object.keys(parsed)) {
    // Declared field names are schema, not data. Any other key is read like text.
    if (!TRANSCRIPT_FIELDS.has(key) && !w.keyOk(key)) {
      w.block("(key)");
      continue;
    }
    const v = parsed[key];
    let value;
    if (key === "firstUserMsg" || key === "lastAssistantMsg") value = w.text(v, key);
    else if (key === "assistantTail") {
      value = v === undefined || v === null ? v : Array.isArray(v) ? w.array(v, key, (t, i) => w.text(t, `assistantTail[${i}]`)) : w.text(NOT_TEXT, key);
    } else if (key === "operatorTurns" || key === "turns") {
      if (v === undefined || v === null) value = v;
      else if (!Array.isArray(v)) value = w.text(NOT_TEXT, key);
      else {
        value = w.array(v, key, (turn, i) => {
          if (!isPlainObject(turn)) return w.text(NOT_TEXT, `${key}[${i}]`);
          const rest = {};
          for (const k of Object.keys(turn)) if (k !== "text") defineOwn(rest, k, turn[k]);
          const walked = w.any(rest, `${key}[${i}]`, 1);
          if (typeof walked !== "object" || walked === null) return walked;
          defineOwn(walked, "text", w.text(turn.text, `${key}[${i}].text`));
          return walked;
        });
      }
    } else value = w.any(v, key, 0, key);
    defineOwn(out, key, value);
  }
  return out;
}

/**
 * Redact a parsed transcript record in a copy (input untouched). A record that
 * is not a plain object, or any failure while reading it, blocks.
 *
 * @param {object} parsed   { firstUserMsg, lastAssistantMsg, operatorTurns[], assistantTail[], turns[], … }
 * @param {object} [opts]   same options as redactText
 */
export function redactParsedTranscript(parsed, opts = {}) {
  if (!opts || typeof opts !== "object") opts = {};
  const profile = recordProfile(opts);
  if (!profile) return blockedRecordResult("parsed", null, "profile");
  const w = recordWalker(opts);
  let out = null;
  try {
    if (parsed === null || parsed === undefined) out = parsed;
    else if (!isPlainObject(parsed)) w.block("(record)");
    else out = transcriptFields(parsed, w);
  } catch {
    w.block("(record)");
    out = null;
  }
  return recordResult("parsed", out, w, profile);
}

/**
 * Redact model output before it is stored or sent. Accepts a plain string or a
 * summary object ({ summary, topics, operatorDirections, … }). Every string and
 * number in it is read. Anything else is blocked.
 *
 * @param {string|object|null} summary
 * @param {object} [opts]  same options as redactText
 */
export function redactSummaryFields(summary, opts = {}) {
  if (!opts || typeof opts !== "object") opts = {};
  const profile = recordProfile(opts);
  if (!profile) return blockedRecordResult("summary", null, "profile");
  const w = recordWalker(opts);
  let out = null;
  try {
    if (summary === null || summary === undefined) out = summary;
    else if (typeof summary === "string") out = w.text(summary, "summary");
    else if (!isPlainObject(summary)) w.block("(summary)");
    else {
      out = {};
      for (const key of Object.keys(summary)) {
        if (!SUMMARY_FIELDS.has(key) && !w.keyOk(key)) {
          w.block("(key)");
          continue;
        }
        const v = summary[key];
        let value;
        if (key === "summary") value = w.text(v, "summary");
        else if (key === "topics") value = v == null ? v : Array.isArray(v) ? w.array(v, "topics", (t, i) => w.text(t, `topics[${i}]`)) : w.text(NOT_TEXT, "topics");
        else if (key === "operatorDirections") {
          value = v == null ? v : Array.isArray(v)
            ? w.array(v, "operatorDirections", (q, i) => (isPlainObject(q) ? w.any(q, `operatorDirections[${i}]`, 1) : w.text(NOT_TEXT, `operatorDirections[${i}]`)))
            : w.text(NOT_TEXT, "operatorDirections");
        } else value = w.any(v, key, 0, key);
        defineOwn(out, key, value);
      }
    }
  } catch {
    w.block("(summary)");
    out = null;
  }
  return recordResult("summary", out, w, profile);
}

// ── record gates ─────────────────────────────────────────────────────
// A gate is one decision over a whole record: the parsed transcript, an
// optional raw body and an optional model summary. Gates are built here from
// sealed parts only, so ./gate.js never holds the sealing function.

function prefixed(items, prefix) {
  return items.map((x) => ({ ...x, field: x.field ? `${prefix}${x.field}` : prefix.replace(/\.$/, "") }));
}

/** A sealed, blocked gate. Nothing in it can be sent. */
export function blockedGate(profileName, stage) {
  return seal(attachChanges({
    parsed: null,
    body: null,
    summary: null,
    profile: profileName ?? null,
    redacted: true,
    blocked: true,
    status: "blocked",
    hits: [{ tier: "engine", type: "blocked", count: 1 }],
    review: [],
    scan: null,
    error: { stage },
  }, []));
}

/**
 * Combine sealed parts into a new sealed gate. `base` is an earlier gate (or
 * null). `parsed` is a redactParsedTranscript result, `body` a redactText
 * result (with `bodyOriginal` for the quarantine), `summary` a
 * redactSummaryFields result. Any part that this library did not seal blocks.
 */
export function combineGate(base, { parsed = null, body = null, bodyOriginal = null, summary = null } = {}) {
  const isGate = (g) => isSealed(g) && "parsed" in g && "body" in g && "summary" in g;
  if (base !== null && base !== undefined && !isGate(base)) return blockedGate(null, "gate");
  for (const part of [parsed, body, summary]) if (part !== null && !isSealed(part)) return blockedGate(base?.profile ?? null, "gate");
  const parts = [base, parsed, body, summary].filter((p) => p !== null && p !== undefined);
  const profiles = new Set(parts.map((p) => p.profile).filter((p) => p !== null && p !== undefined));
  if (profiles.size > 1) return blockedGate(null, "gate");
  const profileName = profiles.size ? [...profiles][0] : null;
  let status = "clean";
  const counts = new Map();
  for (const p of parts) {
    status = worst(status, p.status);
    mergeHits(counts, p.hits);
  }
  const review = [
    ...(base ? base.review : []),
    ...(parsed ? parsed.review : []),
    ...(body ? prefixed(body.review, "body") : []),
    ...(summary ? prefixed(summary.review, "summary.") : []),
  ];
  const changes = [
    ...(base ? base.changes : []),
    ...(parsed ? parsed.changes : []),
    ...(body && typeof bodyOriginal === "string" && body.text !== bodyOriginal ? [{ field: "body", before: bodyOriginal, after: body.text }] : []),
    ...(summary ? prefixed(summary.changes, "summary.") : []),
  ];
  const blocked = status === "blocked";
  const scans = parts.map((p) => p.scan).filter(Boolean);
  const profile = profileName && PROFILES[profileName];
  const { checks, notChecked } = profile ? profileChecks(profile) : { checks: [], notChecked: [] };
  const gate = {
    parsed: parsed ? parsed.parsed : base ? base.parsed : null,
    body: body ? body.text : base ? base.body : null,
    summary: summary ? summary.summary : base ? base.summary : null,
    profile: profileName,
    redacted: parts.some((p) => p.redacted),
    blocked,
    status,
    hits: hitsFromMap(counts),
    review,
    scan: blocked
      ? null
      : {
          profile: profileName,
          characters: scans.reduce((n, x) => n + x.characters, 0),
          read: scans.reduce((n, x) => n + x.read, 0),
          exempt: scans.flatMap((x) => x.exempt),
          checks,
          notChecked,
          knownGaps: KNOWN_GAPS,
        },
  };
  const error = parts.map((p) => p.error).find(Boolean);
  if (error) gate.error = error;
  return seal(attachChanges(gate, changes));
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
  isSealed,
  combineGate,
  blockedGate,
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
