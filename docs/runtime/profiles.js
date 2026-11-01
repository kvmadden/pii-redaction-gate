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
//   identifiers  clinical-style documentation (visit notes, discharge
//                summaries, referral letters). PATTERN + NAME tiers with the
//                unknown-name pass ON; TOPIC tier OFF. The goal is to strip
//                identifiers and keep the clinical content: a topic tier that
//                collapses every sentence mentioning a medication or diagnosis
//                would erase the text the downstream reader needs.
//
//   strict       personal correspondence (patient messages, email, SMS, call
//                and voice transcripts). All three tiers; unknown name-shaped
//                tokens also redacted; topic personal-marker gate OFF.
//                Over-redaction is the accepted cost.
//
// UNKNOWN SOURCES default to `standard` — a new source must EARN the light
// profile by being declared, never fall into it. An explicit profile NAME that
// does not exist is a configuration error and throws (redactText turns that
// into a blocked result): a typo must not silently pick a weaker profile.

export const PROFILES = Object.freeze({
  light: Object.freeze({
    name: "light",
    tiers: Object.freeze(["pattern"]),
    exemptCode: true,
    unknownNames: false,
    topicStrict: false,
  }),
  standard: Object.freeze({
    name: "standard",
    tiers: Object.freeze(["pattern", "name", "topic"]),
    exemptCode: false,
    unknownNames: false,
    topicStrict: false,
  }),
  identifiers: Object.freeze({
    name: "identifiers",
    tiers: Object.freeze(["pattern", "name"]),
    exemptCode: false,
    unknownNames: true,
    topicStrict: false,
  }),
  strict: Object.freeze({
    name: "strict",
    tiers: Object.freeze(["pattern", "name", "topic"]),
    exemptCode: false,
    unknownNames: true,
    topicStrict: true,
  }),
});

export const DEFAULT_PROFILE = "standard";

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

  // clinical-style documentation — identifiers
  "clinical-note": "identifiers",
  "discharge-summary": "identifiers",
  "referral-letter": "identifiers",

  // personal correspondence — strict
  "patient-message": "strict",
  email: "strict",
  sms: "strict",
  "call-transcript": "strict",
  "voice-transcript": "strict",
});

/** Thrown for an explicit profile name that does not exist. */
export class RedactionConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "RedactionConfigError";
  }
}

/**
 * Resolve the profile name for a source id. Unknown → standard (never light).
 * @param {string} source
 * @returns {"light"|"standard"|"identifiers"|"strict"}
 */
export function profileForSource(source) {
  const key = typeof source === "string" ? source.trim().toLowerCase() : "";
  return SOURCE_PROFILES[key] || DEFAULT_PROFILE;
}

/**
 * Resolve a profile object from a name or a source. A null/undefined or
 * non-object argument degrades to the default profile. An explicit `profile`
 * that is not a known profile name throws RedactionConfigError.
 * @param {{ profile?: string, source?: string }} [opts]
 */
export function resolveProfile(opts = {}) {
  const { profile, source } = opts && typeof opts === "object" ? opts : {};
  if (profile !== undefined && profile !== null && profile !== "") {
    if (typeof profile === "string" && Object.hasOwn(PROFILES, profile)) return PROFILES[profile];
    throw new RedactionConfigError(`unknown redaction profile: ${JSON.stringify(String(profile)).slice(0, 40)}`);
  }
  if (source) return PROFILES[profileForSource(source)];
  return PROFILES[DEFAULT_PROFILE];
}

export default { PROFILES, SOURCE_PROFILES, DEFAULT_PROFILE, profileForSource, resolveProfile, RedactionConfigError };
