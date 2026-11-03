// index.js — Node entry. Re-exports the pure engine + tiers and adds the two
// Node-only conveniences:
//
//   loadPeopleMap()          data/redaction-people.json (or env override
//                            REDACTION_PEOPLE_PATH for a local-only map that
//                            is never committed). Successful reads are cached.
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
  profileChecks,
  isSealed,
  combineGate,
  blockedGate,
  KNOWN_GAPS,
  REDACTION_VERSION,
  BLOCKED_TEXT,
  DEFAULT_MAX_LENGTH,
} from "./engine.js";
export { PROFILES, SOURCE_PROFILES, DEFAULT_PROFILE, profileForSource, resolveProfile, RedactionConfigError } from "./profiles.js";
export { SENSITIVE_SOURCE_IDS, SENSITIVE_SOURCE_PROFILES } from "./sensitive-sources.js";
export { applyPatterns, luhnOk, PATTERN_RULES, PATTERN_TOKEN_TYPES, rulesFor } from "./patterns.js";
export { applyNames, normalizePeopleMap, nameReviewSpans, nameTokensFor } from "./names.js";
export { applyTopics, DEFAULT_TOPIC_CATEGORIES } from "./topics.js";
export { scanResidual, RESIDUAL_CHECKS } from "./scan.js";
export { assertSendable } from "./send-guard.js";
export { writeQuarantineSidecar, defaultQuarantineDir, QUARANTINE_VERSION } from "./quarantine.js";

import { RedactionConfigError as ConfigError } from "./profiles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PEOPLE_PATH = path.resolve(__dirname, "../data/redaction-people.json");

const peopleCache = new Map();

function validMapShape(map) {
  return map && typeof map === "object" && !Array.isArray(map) &&
    (map.people === undefined || Array.isArray(map.people)) && (map.safe === undefined || Array.isArray(map.safe));
}

/**
 * Load the people map. Resolution order:
 *   1. explicit `mapPath` argument
 *   2. env REDACTION_PEOPLE_PATH (a local-only map that is never committed)
 *   3. data/redaction-people.json (committed default: empty)
 *
 * Only a successful read is cached, so a map that becomes readable later is
 * picked up on the next call.
 *
 * A missing, unreadable or malformed map:
 *   - required: true  throws RedactionConfigError. The gate turns that into a
 *     blocked result, so known names cannot silently stop being removed.
 *   - otherwise       returns an empty map and writes one stderr line. The
 *     known-name pass then has nothing to match. Pattern rules and the
 *     unknown-name pass still run.
 *
 * @param {{ mapPath?: string, env?: object, force?: boolean, required?: boolean }} [opts]
 * @returns {object} raw people-map JSON ({ people: [], safe: [] })
 */
export function loadPeopleMap({ mapPath, env = process.env, force = false, required = false } = {}) {
  const p = mapPath || (env.REDACTION_PEOPLE_PATH && env.REDACTION_PEOPLE_PATH.trim()) || DEFAULT_PEOPLE_PATH;
  if (!force && peopleCache.has(p)) return peopleCache.get(p);
  let map;
  let problem = null;
  try {
    map = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!validMapShape(map)) problem = "people and safe must be arrays";
  } catch (e) {
    problem = e instanceof SyntaxError ? "not valid JSON" : "cannot be read";
  }
  if (problem) {
    if (required) throw new ConfigError(`people map ${problem}`);
    process.stderr.write(`redaction: PEOPLE MAP ${problem.toUpperCase()}: name tier running without known names\n`);
    return { people: [], safe: [] };
  }
  peopleCache.set(p, map);
  return map;
}
