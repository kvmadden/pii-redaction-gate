// patterns.js: PATTERN tier. Deterministic identifier shapes, no model call.
//
// One of three tiers in the layered redaction (see ./engine.js):
//   pattern (this file and ./clinical-patterns.js) -> name (./names.js) -> topic (./topics.js)
//
// Runs on free text before any record write or model call. It is not a
// secrets scanner (API keys, tokens): that is a different job.
//
// Pure: no I/O, no env, no Date. Browser and Deno portable.
//
// Design rules
//   - Deny-aggressive: masking a harmless number is cheaper than shipping a
//     phone number.
//   - Typed lowercase tokens ([phone], [email], [address]) so no tier re-matches
//     them and redaction is idempotent.
//   - Replacement through callbacks only ($-safe).
//   - Every quantifier is bounded, so run time grows linearly with input size.
//   - The rule tables are frozen. Tests inject failures through
//     applyPatterns(text, { rules }) instead of editing a shared array.

import { CLINICAL_RULES, birthYearRule } from "./clinical-patterns.js";
import { DIG, DASH, SEP, NO_DIG_BEFORE, NO_DIG_AFTER, MONTH, ORD, ci, asciiDigits, STREET_WORDS } from "./shapes.js";
import { STATE_CODES } from "./grammar.js";

/** Luhn checksum: separates real card numbers from arbitrary digit runs. */
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

const freeze = (rules) => Object.freeze(rules.map((r) => Object.freeze(r)));

// Street address parts.
const SUFFIX_FULL = STREET_WORDS.map(([w]) => w);
const SUFFIX_ABBR = STREET_WORDS.map(([, a]) => a).filter(Boolean);
const titleOrUpper = (w) => `${w[0].toUpperCase()}${w.slice(1)}|${w.toUpperCase()}`;
// "Dr" and "St" are also a title and "Saint": not a suffix when a capitalized word follows.
const SUFFIX_TITLE =
  "(?:" +
  [...SUFFIX_FULL.map(titleOrUpper), ...SUFFIX_ABBR.filter((a) => a !== "dr" && a !== "st").map(titleOrUpper)].join("|") +
  "|(?:Dr|DR|St|ST)(?!\\.?\\s+[A-Z][a-z]))";
const STREET_WORD_TITLE = "(?:[A-Z][A-Za-z'.-]*|[0-9]{1,3}(?:st|nd|rd|th))";
const UNIT = `(?:,?\\s*(?:${ci("apt")}|${ci("unit")}|${ci("suite")}|${ci("ste")}|#)\\.?\\s*[A-Za-z0-9-]{1,8})?`;
const STATES = [...STATE_CODES].map((s) => s.toUpperCase()).join("|");
const ZIP = `${NO_DIG_BEFORE}\\d{5}(?:-\\d{4})?${NO_DIG_AFTER}`;
const CITY_TAIL = `(?:,\\s*[A-Z][A-Za-z .'-]{1,40}?,?\\s*(?:${STATES})\\.?\\s*${ZIP})?`;
// A city word is not a function word or a living-place verb ("lives in boston ma 02118").
const CITY_STOP = "(?:in|at|to|from|of|on|and|or|the|lives|lived|living|moved|resides|resided|near|with|is|was|home|address|city)";
const CITY_WORD = (shape) => `(?!${CITY_STOP}\\b)(?!${ci("lives")}\\b|${ci("lived")}\\b|${ci("in")}\\b)${shape}`;
const NOT_QUANTITY = "(?!(?:week|weeks|day|days|month|months|year|years|hour|hours|time|times|tablet|tablets|mg|units)\\b)";

export const PATTERN_RULES = freeze([
  // email (bounded parts: linear time)
  {
    type: "email",
    re: /\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?){0,8}\.[A-Za-z]{2,24}\b/g,
  },
  // SSN, dashed shape (ddd-dd-dddd), any dash, never inside a longer run.
  { type: "ssn", re: new RegExp(`(?<![0-9\\uFF10-\\uFF19-])${DIG}{3}${DASH}${DIG}{2}${DASH}${DIG}{4}(?![0-9\\uFF10-\\uFF19-])`, "g") },
  // SSN after a label, also "SSN is 123456789" and "social is ...".
  {
    type: "ssn",
    re: new RegExp(`\\b(?:${ci("ssn")}|${ci("social")}(?:\\s+${ci("security")})?(?:\\s+(?:${ci("number")}|${ci("no")}\\.?|#))?)\\s*(?:[:#=]|${ci("is")}|${ci("was")})?\\s*(${DIG}{3}${SEP}?${DIG}{2}${SEP}?${DIG}{4})${NO_DIG_AFTER}`, "g"),
    replace: (m, v) => m.slice(0, m.length - v.length) + "[ssn]",
  },
  // Date of birth after a birth marker, in any common date form.
  {
    type: "dob",
    re: new RegExp(
      `\\b(?:${ci("dob")}|${ci("d.o.b")}\\.?|${ci("date")}\\s+${ci("of")}\\s+${ci("birth")}|${ci("born")}(?:\\s+${ci("on")})?|${ci("birth")}\\s*${ci("date")}|${ci("birthday")})\\b[\\s:,-]{0,8}(?:(?:${ci("is")}|${ci("was")}|${ci("of")})\\s+)?` +
        `((?:${DIG}{1,2}[/.-]${DIG}{1,2}[/.-]${DIG}{2,4})|(?:${DIG}{4}-${DIG}{1,2}-${DIG}{1,2})|(?:${MONTH}\\s+${DIG}{1,2}${ORD}?(?:,?\\s+${DIG}{2,4})?)|(?:${DIG}{1,2}${ORD}?\\s+(?:${ci("of")}\\s+)?${MONTH}(?:,?\\s+${DIG}{2,4})?)|(?:${DIG}{1,2}[/-]${DIG}{4})|(?:${DIG}{8}))${NO_DIG_AFTER}`,
      "g",
    ),
    replace: (m, date) => m.slice(0, m.length - date.length) + "[dob]",
  },
  // credit / debit card, Luhn-checked.
  {
    type: "card",
    re: /(?<![\d-])(?:\d[ -]?){12,18}\d(?![\d-])/g,
    validate: (m) => luhnOk(m.replace(/[^\d]/g, "")),
  },
  // labeled account / routing / policy / MRN numbers (digits).
  {
    type: "account",
    re: /\b(?:account|acct|routing|iban|member\s+id|policy\s+(?:number|no\.?|#)|mrn|medical\s+record)\b(?:\s+(?:number|no\.?|#))?\s*[:#]?\s*(\d[\d -]{4,22}\d)(?!\d)/gi,
    replace: (m, digits) => m.slice(0, m.length - digits.length) + "[account]",
  },
  // phone, separator form: (212) 555-0123, (212)555-0123, 212-555-0123, +1 212.555.0123, any dash.
  {
    type: "phone",
    re: new RegExp(`${NO_DIG_BEFORE}(?:\\+?1${SEP}?)?(?:\\(${DIG}{3}\\)\\s?|${DIG}{3}${SEP})${DIG}{3}${SEP}${DIG}{4}${NO_DIG_AFTER}(?:\\s*(?:${ci("ext")}\\.?|x|${ci("extension")})\\s*${DIG}{1,6})?`, "g"),
  },
  // phone, international: + country code and 8 to 15 digits.
  {
    type: "phone",
    re: new RegExp(`(?<![\\w+])\\+${DIG}{1,3}(?:${SEP}?\\(?${DIG}{1,4}\\)?){2,5}${NO_DIG_AFTER}`, "g"),
    validate: (m) => {
      const n = asciiDigits(m).replace(/\D/g, "").length;
      return n >= 8 && n <= 15;
    },
  },
  // phone, local seven digits after a calling word: "call 555-0142".
  {
    type: "phone",
    re: new RegExp(`\\b((?:${ci("call")}|${ci("phone")}|${ci("tel")}|${ci("cell")}|${ci("mobile")}|${ci("fax")}|${ci("callback")}|${ci("reach")}(?:\\s+${ci("me")})?\\s+${ci("at")}|${ci("at")})\\.?:?\\s*)(${DIG}{3}${DASH}${DIG}{4})${NO_DIG_AFTER}`, "g"),
    replace: (m, prefix) => prefix + "[phone]",
  },
  // phone, bare 10-digit NANP run (area code and exchange both [2-9]xx).
  { type: "phone", re: /(?<![\d.-])[2-9]\d{2}[2-9]\d{2}\d{4}(?![\d.-])/g },
  // coordinates: decimal pair with 4+ decimals each, or degree notation.
  { type: "coords", re: /(?<![\d.])-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}(?![\d.])/g },
  { type: "coords", re: /\b\d{1,3}\.\d+\s*°\s*[NS]\b\s*,?\s*\d{1,3}\.\d+\s*°\s*[EW]\b/gi },
  // street address, Title Case or ALL CAPS: number (221B too) + 1 to 3 words + suffix, optional unit and city/state/ZIP.
  {
    type: "address",
    re: new RegExp(`\\b\\d{1,6}[A-Za-z]?\\s+${NOT_QUANTITY}(?:${STREET_WORD_TITLE}\\s+){1,3}${SUFFIX_TITLE}\\.?\\b${UNIT}${CITY_TAIL}`, "g"),
  },
  // street address, lowercase, full suffix words only ("42 willow road").
  {
    type: "address",
    re: new RegExp(`\\b\\d{1,6}[a-z]?\\s+(?:(?!(?:the|a|an|of|and|to|in|on|at|for|with|by|from|this|that|my|his|her|their|our|your|mg|units|weeks|days|times|tablets)\\b)[a-z][a-z'-]{1,30}\\s+){1,3}(?:${SUFFIX_FULL.join("|")})\\b${UNIT}`, "g"),
  },
  // city, state and ZIP without a street: "Springfield, IL 62704", "SPRINGFIELD IL 62704", "boston ma 02118".
  {
    type: "address",
    re: new RegExp(`\\b(?:${CITY_WORD("[A-Z][a-z]{1,20}")}(?:[ -]${CITY_WORD("[A-Z][a-z]{1,20}")}){0,2}|${CITY_WORD("[A-Z]{2,20}")}(?:[ -]${CITY_WORD("[A-Z]{2,20}")}){0,2}|${CITY_WORD("[a-z]{2,20}")}(?:[ -]${CITY_WORD("[a-z]{2,20}")}){0,2}),?\\s+(?:${STATES}|${STATES.toLowerCase()})\\.?\\s+${ZIP}`, "g"),
  },
]);

/** The typed tokens this tier can emit (UI and report vocabulary). */
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
  "device",
]);

/** Rule order: core identity shapes, then clinical shapes, then the rest. */
export function rulesFor({ clinical = false, referenceDate = null } = {}) {
  if (!clinical) return PATTERN_RULES;
  const head = PATTERN_RULES.slice(0, 4); // email, ssn, ssn label, dob
  const tail = PATTERN_RULES.slice(4);
  const extra = referenceDate ? [birthYearRule(referenceDate)] : [];
  return [...head, ...CLINICAL_RULES, ...extra, ...tail];
}

/**
 * Apply the PATTERN tier to one prose segment.
 * @param {string} text
 * @param {{clinical?: boolean, referenceDate?: string|Date|null, rules?: Array}} [opts]
 *   clinical: add the clinical identifier rules. referenceDate: enables the
 *   birth-year age check. rules: test seam, replaces the rule list.
 * @returns {{ text: string, hits: Array<{tier:"pattern", type:string, count:number}> }}
 */
export function applyPatterns(text, { clinical = false, referenceDate = null, rules = null } = {}) {
  if (typeof text !== "string" || !text) return { text, hits: [] };
  let out = text;
  const counts = new Map();
  for (const rule of rules || rulesFor({ clinical, referenceDate })) {
    out = out.replace(rule.re, (...args) => {
      const m = args[0];
      const named = typeof args[args.length - 1] === "object" && args[args.length - 1] !== null;
      const groups = args.slice(1, named ? -3 : -2);
      if (rule.validate && !rule.validate(m, ...groups)) return m;
      counts.set(rule.type, (counts.get(rule.type) || 0) + 1);
      if (rule.replace) return rule.replace(m, ...groups);
      return `[${rule.type}]`;
    });
  }
  const hits = [...counts.entries()].map(([type, count]) => ({ tier: "pattern", type, count }));
  return { text: out, hits };
}

export default { applyPatterns, luhnOk, PATTERN_RULES, PATTERN_TOKEN_TYPES, rulesFor };
