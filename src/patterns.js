import { CLINICAL_RULES } from './clinical-patterns.js'
// patterns.js — PATTERN tier: deterministic PII shapes, no model call.
//
// One of three tiers in the layered redaction (see ./engine.js):
//   pattern (this file) → name (./names.js) → topic (./topics.js)
//
// Runs on free text BEFORE any record write or model call. It is not a
// secrets scanner (API keys, tokens): that is a different job.
//
// Pure: no I/O, no env, no Date. Browser/Deno-portable (can be vendored
// unchanged into an edge function).
//
// Design rules
//   - Deny-aggressive: a false positive that masks a numeric id is cheaper
//     than a false negative that ships a phone number off-device.
//   - Typed tokens, never bare "[REDACTED]": [phone] [email] [address] [ssn]
//     [dob] [card] [account] [coords]. Tokens are /\[[a-z-]+\]/ — lowercase so
//     no tier re-matches them (idempotence).
//   - Replacement via function callbacks only ($-safe).
//   - ADD-ONLY maintenance: never delete a pattern (silent loosening).

/** Luhn checksum — separates real card numbers from arbitrary digit runs. */
export function luhnOk(digits) {
  if (typeof digits !== "string" || digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    const c = digits.charCodeAt(i) - 48;
    if (c < 0 || c > 9) return false;
    let d = c;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

// Each entry: { type, re } and optionally:
//   validate(match) → false to leave the match untouched
//   replace(match)  → custom replacement (default: the whole match → token)
// ORDER MATTERS: longer/more-specific shapes run before subsumable ones
// (card before phone; ssn before phone; contextual account before bare runs).
const STREET_SUFFIX =
  "Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Way|Place|Pl|Terrace|Ter|Parkway|Pkwy|Highway|Hwy|Trail|Trl|Loop|Plaza|Square|Sq";

export const PATTERN_RULES = [
  // ── email ───────────────────────────────────────────────────────────
  {
    type: "email",
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}\b/g,
  },

  // ── SSN ─────────────────────────────────────────────────────────────
  // Dashed shape (ddd-dd-dddd) with guards so it never fires inside a
  // longer digit/dash run (phone numbers are ddd-ddd-dddd — different shape).
  { type: "ssn", re: /(?<![\d-])\d{3}-\d{2}-\d{4}(?![\d-])/g },
  // Context-labelled 9-digit runs ("SSN: 123456789", "social security no 123 45 6789").
  {
    type: "ssn",
    re: /\b(?:ssn|social\s+security(?:\s+(?:number|no\.?|#))?)\s*[:#]?\s*\d{3}[\s-]?\d{2}[\s-]?\d{4}(?!\d)/gi,
    replace: (m) => m.replace(/\d[\d\s-]*\d/g, "[ssn]"),
  },

  // ── DOB ─────────────────────────────────────────────────────────────
  // Context-gated: most dates in ordinary text are not PII; a date within
  // reach of a birth marker is. Other dates (visit, admission) are NOT caught. Only the date part is replaced.
  {
    type: "dob",
    re: /\b(?:dob|d\.o\.b\.?|date\s+of\s+birth|born(?:\s+on)?|birth\s*date|birthday(?:\s+is)?)\b[\s:,-]{0,8}((?:\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})|(?:\d{4}-\d{2}-\d{2})|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{2,4})?))/gi,
    replace: (m, date) => m.slice(0, m.length - date.length) + "[dob]",
  },

  // ── credit / debit card ─────────────────────────────────────────────
  // 13–19 digits, optionally space/dash grouped, Luhn-validated so build
  // numbers and row ids survive. Guards prevent partial matches in longer runs.
  {
    type: "card",
    re: /(?<![\d-])(?:\d[ -]?){12,18}\d(?![\d-])/g,
    validate: (m) => luhnOk(m.replace(/[^\d]/g, "")),
  },

  // ── labelled account / routing / policy / MRN numbers ───────────────
  {
    type: "account",
    re: /\b(?:account|acct|routing|iban|member\s+id|policy|mrn|medical\s+record)\b(?:\s+(?:number|no\.?|#))?\s*[:#]?\s*(\d[\d -]{4,22}\d)(?!\d)/gi,
    replace: (m, digits) => m.slice(0, m.length - digits.length) + "[account]",
  },

  // ── phone ───────────────────────────────────────────────────────────
  // Separator form: (212) 555-0123 · 212-555-0123 · +1 212.555.0123
  {
    type: "phone",
    re: /(?<!\d)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)(?:\s*(?:ext\.?|x|extension)\s*\d{1,6})?/gi,
  },
  // Bare 10-digit NANP run (area code + exchange both [2-9]xx). Lookarounds
  // exclude decimals, longer ids, and epoch-ms timestamps.
  { type: "phone", re: /(?<![\d.-])[2-9]\d{2}[2-9]\d{2}\d{4}(?![\d.-])/g },

  // ── coordinates ─────────────────────────────────────────────────────
  // Decimal pair with 4+ decimals each (version/build numbers never carry 4).
  {
    type: "coords",
    re: /(?<![\d.])-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}(?![\d.])/g,
  },
  // Degree notation: 12.3456° N, 45.6789° W
  {
    type: "coords",
    re: /\b\d{1,3}\.\d+\s*°\s*[NS]\b\s*,?\s*\d{1,3}\.\d+\s*°\s*[EW]\b/gi,
  },

  // ── street address ──────────────────────────────────────────────────
  // Number + 1–3 capitalized words + street suffix, optional unit + city/state/zip tail.
  {
    type: "address",
    re: new RegExp(
      "\\b\\d{1,6}\\s+(?:[A-Z][A-Za-z'.-]*\\s+){1,3}(?:" +
        STREET_SUFFIX +
        ")\\.?\\b" +
        "(?:,?\\s*(?:Apt|Unit|Suite|Ste|#)\\s*[\\w-]+)?" +
        "(?:,\\s*[A-Z][A-Za-z .]+,?\\s*[A-Z]{2}\\s*\\d{5}(?:-\\d{4})?)?",
      "g",
    ),
  },
];

/** The typed tokens this tier can emit (UI/report vocabulary). */
export const PATTERN_TOKEN_TYPES = Object.freeze([
  "email",
  "ssn",
  "dob",
  "card",
  "account",
  "phone",
  "coords",
  "address",
  "date",
  "age",
  "url",
  "ip",
]);

/**
 * Apply the PATTERN tier to one prose segment.
 * @param {string} text
 * @returns {{ text: string, hits: Array<{tier:"pattern", type:string, count:number}> }}
 */
export function applyPatterns(text, { clinical = false } = {}) {
  if (typeof text !== "string" || !text) return { text, hits: [] };
  let out = text;
  const counts = new Map();
  const rules = clinical ? [...PATTERN_RULES.slice(0, 4), ...CLINICAL_RULES, ...PATTERN_RULES.slice(4)] : PATTERN_RULES
  for (const rule of rules) {
    out = out.replace(rule.re, (...args) => {
      const m = args[0];
      if (rule.validate && !rule.validate(m)) return m;
      counts.set(rule.type, (counts.get(rule.type) || 0) + 1);
      if (rule.replace) {
        // Custom replacers receive (fullMatch, ...captureGroups).
        return rule.replace(m, ...args.slice(1, -2));
      }
      return `[${rule.type}]`;
    });
  }
  const hits = [...counts.entries()].map(([type, count]) => ({ tier: "pattern", type, count }));
  return { text: out, hits };
}

export default { applyPatterns, luhnOk, PATTERN_RULES, PATTERN_TOKEN_TYPES };
