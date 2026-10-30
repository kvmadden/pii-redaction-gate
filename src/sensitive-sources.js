// sensitive-sources.js — the declared list of high-sensitivity sources:
// clinical-style documentation and personal correspondence. This file only
// DECLARES the ids; it ingests nothing.
//
// THE RULE: every source declared here must resolve to a profile that runs the
// unknown-name pass (`identifiers` or `strict`, see profiles.js). The covenant
// test in test/tripwire.test.js fails if any declared source resolves to
// `light` or `standard`, so a sensitive source cannot be added that bypasses
// the stronger gate.

/** Profiles a sensitive source may resolve to. */
export const SENSITIVE_SOURCE_PROFILES = Object.freeze(["identifiers", "strict"]);

/** Every declared sensitive-source id (frozen). */
export const SENSITIVE_SOURCE_IDS = Object.freeze([
  // clinical-style documentation
  "clinical-note",
  "discharge-summary",
  "referral-letter",
  // personal correspondence
  "patient-message",
  "email",
  "sms",
  "call-transcript",
  "voice-transcript",
]);

export default { SENSITIVE_SOURCE_PROFILES, SENSITIVE_SOURCE_IDS };
