// profiles.js — per-source redaction profiles.
//
// Pure: no I/O, no env. Browser/Deno-portable.
//
// THE PROFILES TABLE (the contract):
//
//   light        developer text (source code, build logs, commit messages).
//                PATTERN tier only, and fenced/inline CODE SPANS are exempt —
//                an email-shaped string in a test fixture is not PII, and
//                rewriting it breaks the code.
//
//   standard     general free text (chat exports, support tickets, notes).
//                All three tiers; NAME tier redacts KNOWN people-map names
//                only; topic tier keeps the personal-marker gate; code spans
//                are NOT exempt (a paste can hide PII inside a fence).
//
//   identifiers  clinical text (visit notes, discharge summaries, referral
//                letters, patient messages, call transcripts). PATTERN tier
//                with the clinical identifier rules + NAME tier with the
//                unknown-name pass; TOPIC tier OFF. The goal is to strip
//                identifiers and keep the clinical content: a topic tier that
//                collapses every sentence mentioning a medication or diagnosis
//                would erase the text the downstream reader needs. This is the
//                default when no profile and no source is given.
//
//   strict       personal correspondence outside care (email, SMS) where the
//                topic itself is sensitive. All three tiers; unknown names
//                also redacted; topic personal-marker gate OFF. It deletes
//                clinical sentences, so it is not used for patient messages.
//
// UNKNOWN SOURCES are blocked. A source id that is not in SOURCE_PROFILES is a
// configuration error (redactText returns a blocked result), because a typo
// such as "clinical_note" must not silently pick a profile that skips the
// clinical rules. A caller can name a fallback explicitly with
// { unknownSource: "<profile>" }. An explicit profile NAME that does not exist
// is also a configuration error.

export const PROFILES = Object.freeze({
  light: Object.freeze({
    name: "light",
    tiers: Object.freeze(["pattern"]),
    exemptCode: true,
    unknownNames: false,
    clinicalPatterns: false,
    residualScan: false,
    topicStrict: false,
  }),
  standard: Object.freeze({
    name: "standard",
    tiers: Object.freeze(["pattern", "name", "topic"]),
    exemptCode: false,
    unknownNames: false,
    clinicalPatterns: false,
    residualScan: false,
    topicStrict: false,
  }),
  identifiers: Object.freeze({
    name: "identifiers",
    tiers: Object.freeze(["pattern", "name"]),
    exemptCode: false,
    unknownNames: true,
    clinicalPatterns: true,
    residualScan: true,
    topicStrict: false,
  }),
  strict: Object.freeze({
    name: "strict",
    tiers: Object.freeze(["pattern", "name", "topic"]),
    exemptCode: false,
    unknownNames: true,
    clinicalPatterns: true,
    residualScan: true,
    topicStrict: true,
  }),
});

export const DEFAULT_PROFILE = "identifiers";

// source id → profile. These ids are examples; substitute your own.
// ADD-ONLY: never move a source DOWN a tier (e.g. standard → light) without a
// deliberate decision — silently loosening the gate is the failure mode.
export const SOURCE_PROFILES = Object.freeze({
  // developer text — light
  "source-code": "light",
  "build-log": "light",
  "commit-message": "light",

  // general free text — standard
  "chat-export": "standard",
  "free-text": "standard",
  "support-ticket": "standard",

  // clinical text, including patient messages and calls: identifiers
  // (patient-message, call-transcript and voice-transcript moved from strict on
  // 3 Nov 2026: strict deleted the clinical content these sources exist to carry)
  "clinical-note": "identifiers",
  "discharge-summary": "identifiers",
  "referral-letter": "identifiers",
  "patient-message": "identifiers",
  "call-transcript": "identifiers",
  "voice-transcript": "identifiers",

  // personal correspondence outside care: strict
  email: "strict",
  sms: "strict",
});

/** Thrown for an explicit profile name that does not exist. */
export class RedactionConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "RedactionConfigError";
  }
}

/**
 * Profile name for a registered source id, or null when the source is not
 * registered. Only own keys count, so "constructor" or "__proto__" are unknown.
 * @param {string} source
 * @returns {"light"|"standard"|"identifiers"|"strict"|null}
 */
export function profileForSource(source) {
  const key = typeof source === "string" ? source.trim().toLowerCase() : "";
  return key && Object.hasOwn(SOURCE_PROFILES, key) ? SOURCE_PROFILES[key] : null;
}

function profileByName(name, what) {
  if (typeof name === "string" && Object.hasOwn(PROFILES, name)) return PROFILES[name];
  throw new RedactionConfigError(`unknown redaction ${what}: ${JSON.stringify(String(name)).slice(0, 40)}`);
}

/**
 * Resolve a profile object. Order: explicit `profile`, then `source`, then the
 * default profile when neither is given. An unknown profile name or an
 * unregistered source throws RedactionConfigError, unless the caller names a
 * fallback with `unknownSource`. A null or non-object argument means "no
 * options" and resolves to the default profile.
 * @param {{ profile?: string, source?: string, unknownSource?: string }} [opts]
 */
export function resolveProfile(opts = {}) {
  const { profile, source, unknownSource } = opts && typeof opts === "object" ? opts : {};
  if (profile !== undefined && profile !== null && profile !== "") return profileByName(profile, "profile");
  if (source !== undefined && source !== null && source !== "") {
    const mapped = profileForSource(source);
    if (mapped) return PROFILES[mapped];
    if (unknownSource !== undefined) return profileByName(unknownSource, "fallback profile");
    throw new RedactionConfigError(`unregistered source id: ${JSON.stringify(String(source)).slice(0, 40)}`);
  }
  return PROFILES[DEFAULT_PROFILE];
}

export default { PROFILES, SOURCE_PROFILES, DEFAULT_PROFILE, profileForSource, resolveProfile, RedactionConfigError };
