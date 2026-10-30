// index.js — Node entry. Re-exports the pure engine + tiers and adds the two
// Node-only conveniences:
//
//   loadPeopleMap()          data/redaction-people.json (or env override
//                            REDACTION_PEOPLE_PATH for a local-only map that
//                            is never committed), cached per path.
//   writeQuarantineSidecar() local-only original-text sidecars (./quarantine.js)
//
// Import surface:
//   import { redactText, profileForSource, loadPeopleMap } from "./src/index.js";
//
// The pure tiers (engine/patterns/names/topics/profiles) have no Node imports,
// so they can run unchanged in a browser, Deno, or an edge function.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export {
  redactText,
  redactParsedTranscript,
  redactSummaryFields,
  redactionMeta,
  splitCodeSegments,
  REDACTION_VERSION,
  BLOCKED_TEXT,
} from "./engine.js";
export { PROFILES, SOURCE_PROFILES, DEFAULT_PROFILE, profileForSource, resolveProfile, RedactionConfigError } from "./profiles.js";
export { SENSITIVE_SOURCE_IDS, SENSITIVE_SOURCE_PROFILES } from "./sensitive-sources.js";
export { applyPatterns, luhnOk, PATTERN_RULES, PATTERN_TOKEN_TYPES } from "./patterns.js";
export { applyNames, normalizePeopleMap } from "./names.js";
export { applyTopics, DEFAULT_TOPIC_CATEGORIES } from "./topics.js";
export { writeQuarantineSidecar, defaultQuarantineDir, QUARANTINE_VERSION } from "./quarantine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PEOPLE_PATH = path.resolve(__dirname, "../data/redaction-people.json");

const peopleCache = new Map();

/**
 * Load the people map. Resolution order:
 *   1. explicit `mapPath` argument
 *   2. env REDACTION_PEOPLE_PATH (a local-only map that is never committed)
 *   3. data/redaction-people.json (committed default: empty)
 *
 * Missing/unreadable file → empty map + ONE loud stderr line. Note this is
 * NOT fail-closed: the known-name pass then has nothing to match. Pattern
 * rules and the unknown-name pass are unaffected. See README "Limits".
 *
 * @param {{ mapPath?: string, env?: object, force?: boolean }} [opts]
 * @returns {object} raw people-map JSON ({ people: [], safe: [] })
 */
export function loadPeopleMap({ mapPath, env = process.env, force = false } = {}) {
  const p = mapPath || (env.REDACTION_PEOPLE_PATH && env.REDACTION_PEOPLE_PATH.trim()) || DEFAULT_PEOPLE_PATH;
  if (!force && peopleCache.has(p)) return peopleCache.get(p);
  let map = { people: [], safe: [] };
  try {
    map = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    process.stderr.write(`redaction: PEOPLE MAP UNREADABLE (${p}: ${String(e?.message || e).slice(0, 120)}) — NAME tier running on empty map\n`);
  }
  peopleCache.set(p, map);
  return map;
}
