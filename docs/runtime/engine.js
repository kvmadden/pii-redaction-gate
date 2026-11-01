// engine.js — the pure redaction composition: profile → tiers → redacted
// text + typed hits.
//
// Pure: no I/O, no env, no fs — browser/Deno-portable (engine + patterns +
// names + topics + profiles have no Node imports). Node-side conveniences
// (people-map loading, quarantine sidecars) live in ./index.js.
//
// THE COVENANT (test/tripwire.test.js enforces it):
//   1. No synthetic PII fixture survives to any writer output under each
//      profile's active tiers.
//   2. Idempotent: redacting already-redacted text is a no-op.
//   3. Code-safe: under the light profile, code spans pass through
//      byte-identical.
//
// FAIL CLOSED (test/fail-closed.test.js enforces it): if profile resolution,
// people-map normalization, or any tier throws, redactText returns
// BLOCKED_TEXT with blocked: true. The original text is never returned on an
// error path. Non-string input other than null/undefined/"" is also blocked.
//
// Tier order is load-bearing: pattern → name → topic. The name tier turns a
// mapped name into a role token BEFORE the topic tier looks for personal
// context, and the topic tier swallows whole sentences LAST so pattern/name
// hits inside a redacted sentence are still counted in the hit log.

import { applyPatterns } from "./patterns.js";
import { applyNames, normalizePeopleMap } from "./names.js";
import { applyTopics } from "./topics.js";
import { resolveProfile, profileForSource, PROFILES, DEFAULT_PROFILE, SOURCE_PROFILES } from "./profiles.js";

export { profileForSource, PROFILES, DEFAULT_PROFILE, SOURCE_PROFILES, normalizePeopleMap };

/** Version stamp for meta.redaction provenance. Bump when tier behavior changes. */
export const REDACTION_VERSION = 2;

/** What a blocked result carries in place of the text. Never the original. */
export const BLOCKED_TEXT = "[redaction-blocked]";

// ── code-span segmentation (light profile) ───────────────────────────
// Fenced blocks (``` … ```) and inline code (`…`) are exempt under profiles
// with exemptCode. Works on squashed single-line transcript text too (the
// transcript parser collapses newlines; fences survive as ``` … ``` runs).
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
      const [tier, type] = key.split(":");
      return { tier, type, count };
    })
    .sort((a, b) => (a.tier + a.type).localeCompare(b.tier + b.type));
}

/** Build the blocked result. Carries the failing stage and error NAME only —
 *  never the error message, which a custom tier could have built from input. */
function blockedResult(profileName, stage, err) {
  return {
    text: BLOCKED_TEXT,
    redacted: true,
    blocked: true,
    hits: [{ tier: "engine", type: "blocked", count: 1 }],
    profile: profileName,
    error: { stage, name: (err && err.name) || "Error" },
  };
}

/**
 * Redact one string under a profile. THE public primitive.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {"light"|"standard"|"identifiers"|"strict"} [opts.profile]  explicit profile (wins)
 * @param {string} [opts.source]                        source id → profile
 * @param {object} [opts.peopleMap]                     { people:[{name,role,aliases}], safe:[] }
 *                                                      (raw JSON shape; normalized here)
 * @param {Array}  [opts.topicCategories]               override topic categories
 * @returns {{ text: string, redacted: boolean, blocked: boolean,
 *             hits: Array<{tier,type,count}>, profile: string|null,
 *             error?: {stage: string, name: string} }}
 */
export function redactText(text, opts = {}) {
  if (!opts || typeof opts !== "object") opts = {}; // tolerate an explicit null/non-object arg
  let profile;
  try {
    profile = resolveProfile(opts);
  } catch (e) {
    return blockedResult(null, "profile", e);
  }
  if (text === null || text === undefined || text === "") {
    return { text, redacted: false, blocked: false, hits: [], profile: profile.name };
  }
  if (typeof text !== "string") {
    return blockedResult(profile.name, "input", new TypeError("non-string input"));
  }

  let stage = "people-map";
  try {
    const map = opts.peopleMap && opts.peopleMap.__normalized
      ? opts.peopleMap
      : Object.assign(normalizePeopleMap(opts.peopleMap), { __normalized: true });

    const tiers = new Set(profile.tiers);
    const counts = new Map();
    stage = "segment";
    const segments = profile.exemptCode ? splitCodeSegments(text) : [{ code: false, text }];

    const out = segments
      .map((seg) => {
        if (seg.code) return seg.text; // byte-identical pass-through
        let t = seg.text;
        if (tiers.has("pattern")) {
          stage = "pattern";
          const r = applyPatterns(t, { clinical: profile.unknownNames });
          t = r.text;
          mergeHits(counts, r.hits);
        }
        if (tiers.has("name")) {
          stage = "name";
          const r = applyNames(t, { map, unknownNames: profile.unknownNames });
          t = r.text;
          mergeHits(counts, r.hits);
        }
        if (tiers.has("topic")) {
          stage = "topic";
          const r = applyTopics(t, { strict: profile.topicStrict, categories: opts.topicCategories });
          t = r.text;
          mergeHits(counts, r.hits);
        }
        if (typeof t !== "string") throw new TypeError(`${stage} tier returned non-string`);
        return t;
      })
      .join("");

    const hits = hitsFromMap(counts);
    return { text: out, redacted: hits.length > 0, blocked: false, hits, profile: profile.name };
  } catch (e) {
    return blockedResult(profile.name, stage, e);
  }
}

// ── structured-record helpers ────────────────────────────────────────
// A parsed conversation/transcript record carries FOUR text surfaces that can
// leave the trust boundary: operatorTurns[].text + assistantTail[] (the model
// prompt), firstUserMsg + lastAssistantMsg (stored on the record). Redacting
// the record ONCE, before the prompt is built and before the record is
// written, covers both egress points. Only these named fields (plus turns[])
// are redacted; any other field on the record is copied unchanged.

/** Shared per-field runner: redacts strings, blocks non-strings, accumulates. */
function fieldRunner(opts, counts, changes, state) {
  return (value, field) => {
    if (value === null || value === undefined || value === "") return value;
    const r = redactText(value, opts);
    mergeHits(counts, r.hits);
    if (r.blocked) state.blocked = true;
    if (r.text !== value) changes.push({ field, before: value, after: r.text });
    return r.text;
  };
}

/**
 * Redact a parsed transcript record IN A COPY (input untouched).
 *
 * @param {object} parsed   { firstUserMsg, lastAssistantMsg, operatorTurns[], assistantTail[], turns[], … }
 * @param {object} [opts]   same options as redactText
 * @returns {{ parsed: object, redacted: boolean, blocked: boolean, hits: Array, profile: string|null,
 *             changes: Array<{field: string, before: string, after: string}> }}
 */
export function redactParsedTranscript(parsed, opts = {}) {
  let profileName = null;
  try {
    profileName = resolveProfile(opts).name;
  } catch {
    profileName = null; // redactText below blocks every field for the same reason
  }
  if (!parsed || typeof parsed !== "object") {
    return { parsed, redacted: false, blocked: false, hits: [], profile: profileName, changes: [] };
  }
  const counts = new Map();
  const changes = [];
  const state = { blocked: false };
  const run = fieldRunner(opts, counts, changes, state);

  const out = {
    ...parsed,
    firstUserMsg: run(parsed.firstUserMsg, "firstUserMsg"),
    lastAssistantMsg: run(parsed.lastAssistantMsg, "lastAssistantMsg"),
    operatorTurns: Array.isArray(parsed.operatorTurns)
      ? parsed.operatorTurns.map((t, i) => ({ ...t, text: run(t?.text, `operatorTurns[${i}]`) }))
      : parsed.operatorTurns,
    assistantTail: Array.isArray(parsed.assistantTail)
      ? parsed.assistantTail.map((t, i) => run(t, `assistantTail[${i}]`))
      : parsed.assistantTail,
    turns: Array.isArray(parsed.turns)
      ? parsed.turns.map((t, i) => ({ ...t, text: run(t?.text, `turns[${i}]`) }))
      : parsed.turns,
  };

  const hits = hitsFromMap(counts);
  return { parsed: out, redacted: hits.length > 0, blocked: state.blocked, hits, profile: profileName, changes };
}

/**
 * Redact a model-output summary ({ summary, topics, operatorDirections, … })
 * AFTER the model call. The model only saw redacted input, but its output is
 * also a writer surface, so it passes the same gate.
 *
 * @param {object|null} summary
 * @param {object} [opts]         same options as redactText
 * @returns {{ summary: object|null, redacted: boolean, blocked: boolean, hits: Array,
 *             changes: Array<{field, before, after}> }}
 */
export function redactSummaryFields(summary, opts = {}) {
  if (!summary || typeof summary !== "object") return { summary, redacted: false, blocked: false, hits: [], changes: [] };
  const counts = new Map();
  const changes = [];
  const state = { blocked: false };
  const run = fieldRunner(opts, counts, changes, state);
  const out = {
    ...summary,
    summary: run(summary.summary, "summary"),
    topics: Array.isArray(summary.topics) ? summary.topics.map((t, i) => run(t, `topics[${i}]`)) : summary.topics,
    operatorDirections: Array.isArray(summary.operatorDirections)
      ? summary.operatorDirections.map((q, i) => ({
          intent: run(q.intent, `operatorDirections[${i}].intent`),
          raw_text: run(q.raw_text, `operatorDirections[${i}].raw_text`),
        }))
      : summary.operatorDirections,
  };
  const hits = hitsFromMap(counts);
  return { summary: out, redacted: hits.length > 0, blocked: state.blocked, hits, changes };
}

/**
 * meta.redaction provenance stamp for rows that passed this gate. Carries
 * WHICH tiers/types hit and how often — NEVER the original text (that lives
 * only in the local quarantine sidecar).
 */
export function redactionMeta({ profile, hits }) {
  return {
    version: REDACTION_VERSION,
    profile,
    hits: hits.map((h) => ({ tier: h.tier, type: h.type, count: h.count })),
    redactedAt: new Date().toISOString(),
  };
}

export default {
  redactText,
  redactParsedTranscript,
  redactSummaryFields,
  redactionMeta,
  splitCodeSegments,
  profileForSource,
  REDACTION_VERSION,
  BLOCKED_TEXT,
};
