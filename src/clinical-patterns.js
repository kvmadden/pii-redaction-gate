// clinical-patterns.js: identifier shapes common in clinical text. Pure, no I/O.
//
// Enabled for profiles with clinicalPatterns (identifiers, strict). Each rule
// is written for a general shape, not for a fixture:
//   - web and network: URLs (with a scheme, www., or a domain and a path),
//     IPv4 and IPv6 addresses (validated), MAC addresses
//   - labeled identifiers: a recognized label (MRN, MR#, Rx#, Member ID, MBI,
//     Cardholder ID, Claim #, Accession #, VIN, license, NPI, DEA and others),
//     an optional "is", then a value of one to five groups
//   - dates: numeric with a valid month and day and one separator, ISO, month
//     names with or without a day or ordinal ("17th April 2026", "the 4th of
//     July", "August 2022"), and a bare month/day after a date word
//   - ages over 89 in the common written forms, generalized to [age]
//   - PO boxes and labeled city or ZIP fields

import { DIG, DASH, SEP, NO_DIG_BEFORE, NO_DIG_AFTER, MONTH, ORD, ci, asciiDigits, plausibleMonthDay } from "./shapes.js";
import { QUANTITY_WORDS } from "./grammar.js";

const freeze = (rules) => Object.freeze(rules.map((r) => Object.freeze(r)));

// ── network ──────────────────────────────────────────────────────────
const TLDS = "com|org|net|edu|gov|mil|int|io|us|info|biz|co|health|care|me|app|ca|uk|au|de|fr|in|clinic|hospital|online|site|portal|ai";

function validIpv6(s) {
  if (!/^[0-9A-Fa-f:]+$/.test(s) || !s.includes(":")) return false;
  const doubles = s.split("::").length - 1;
  if (doubles > 1) return false;
  const groups = s.split(":").filter((g, i, a) => !(g === "" && (i === 0 || i === a.length - 1 || doubles)));
  if (groups.some((g) => g.length > 4)) return false;
  if (doubles === 0) return groups.length === 8 && groups.every((g) => g.length >= 1);
  return groups.length <= 7 && /[0-9A-Fa-f]/.test(s);
}

// ── labeled identifiers ──────────────────────────────────────────────
const NUM_SUFFIX = `(?:\\s*(?:${ci("number")}|${ci("num")}\\.?|${ci("no")}\\.?|#|${ci("id")}))`;
const STRONG_LABELS = [
  `${ci("mrn")}`, `${ci("mr")}\\s*(?:#|${ci("no")}\\.?)`, `${ci("med")}(?:${ci("ical")})?\\s*${ci("rec")}(?:${ci("ord")})?${NUM_SUFFIX}?`,
  `${ci("chart")}${NUM_SUFFIX}`, `${ci("csn")}`, `${ci("fin")}`, `${ci("har")}`, `${ci("encounter")}${NUM_SUFFIX}`, `${ci("visit")}${NUM_SUFFIX}`,
  `${ci("acct")}${NUM_SUFFIX}?`, `${ci("account")}${NUM_SUFFIX}?`, `${ci("patient")}${NUM_SUFFIX}`, `${ci("hospital")}${NUM_SUFFIX}`,
  `${ci("member")}${NUM_SUFFIX}`, `${ci("subscriber")}${NUM_SUFFIX}`, `${ci("cardholder")}${NUM_SUFFIX}?`, `${ci("policy")}${NUM_SUFFIX}`,
  `${ci("group")}${NUM_SUFFIX}`, `(?:${ci("health")}\\s+)?${ci("plan")}${NUM_SUFFIX}`, `${ci("insurance")}${NUM_SUFFIX}`,
  `${ci("medicare")}(?:\\s+${ci("beneficiary")})?${NUM_SUFFIX}?`, `${ci("mbi")}`, `${ci("medicaid")}${NUM_SUFFIX}?`,
  `${ci("rx")}${NUM_SUFFIX}`, `${ci("prescription")}${NUM_SUFFIX}`, `${ci("pa")}${NUM_SUFFIX}`, `${ci("prior")}\\s+${ci("auth")}(?:${ci("orization")})?${NUM_SUFFIX}`,
  `${ci("claim")}${NUM_SUFFIX}`, `${ci("accession")}${NUM_SUFFIX}?`, `${ci("specimen")}${NUM_SUFFIX}`, `${ci("case")}${NUM_SUFFIX}`,
  `${ci("device")}\\s+(?:${ci("serial")}|${ci("id")})${NUM_SUFFIX}?`, `${ci("serial")}${NUM_SUFFIX}`, `${ci("s/n")}`, `${ci("udi")}`,
  `${ci("licen")}[cs]${ci("e")}${NUM_SUFFIX}?`, `${ci("driver")}['’]?${ci("s")}?\\s+${ci("licen")}[cs]${ci("e")}${NUM_SUFFIX}?`, `${ci("dl")}\\s*#`,
  `${ci("passport")}${NUM_SUFFIX}?`, `${ci("vin")}`, `${ci("vehicle")}\\s+(?:${ci("id")}|${ci("identification")}\\s+${ci("number")}|${ci("registration")})`,
  `(?:${ci("license")}\\s+)?${ci("plate")}${NUM_SUFFIX}?`, `${ci("dea")}${NUM_SUFFIX}?`, `${ci("npi")}`,
];
const LABEL = `(?:${STRONG_LABELS.join("|")})`;
const VALUE_GROUP = "[A-Za-z0-9\\uFF10-\\uFF19][A-Za-z0-9\\uFF10-\\uFF19-]*";

/** Take value groups while they look like an identifier, keep the rest. */
function labeledValue(m, value) {
  const groups = value.split(/(?<=[ .])/);
  let taken = 0;
  let digits = 0;
  let letters = 0;
  for (const [i, g] of groups.entries()) {
    const word = g.replace(/[ .]$/, "");
    if (!/^[A-Z0-9０-９][A-Z0-9０-９-]*$/i.test(word)) break;
    const d = (asciiDigits(word).match(/\d/g) || []).length;
    const upper = /^[A-Z0-9０-９-]+$/.test(word);
    if (i > 0 && d === 0) break; // later groups must carry a digit ("ZZQ 1029 3847")
    // A first group without digits counts only in capitals, and only when it
    // is long ("ABCDEFG") or a digit group follows ("ZZQ 1029 3847"). Not "pending" or "on".
    const nextHasDigit = /\d/.test(asciiDigits(groups[i + 1] || ""));
    if (i === 0 && d === 0 && !(upper && (word.replace(/-/g, "").length >= 5 || (word.length >= 2 && nextHasDigit)))) break;
    taken = i + 1;
    digits += d;
    letters += (word.match(/[A-Za-z]/g) || []).length;
  }
  if (!taken) return m;
  const kept = groups.slice(0, taken).join("");
  const core = kept.replace(/[ .]$/, "");
  if (digits < 3 && !(digits === 0 && letters >= 5)) return m;
  if (core.replace(/[^A-Za-z0-9]/g, "").length < 4) return m;
  const tail = kept.slice(core.length) + groups.slice(taken).join("");
  return m.slice(0, m.length - value.length) + "[account]" + tail;
}

// ── dates ────────────────────────────────────────────────────────────
const DAY = `${DIG}{1,2}`;
const YEAR = `${DIG}{4}`;
const DATE_WORDS = [
  "on", "dated", "date", "dos", "doi", "visit", "seen", "admitted", "admission", "discharged", "discharge",
  "appointment", "appt", "procedure", "surgery", "follow-up", "follow up", "f/u", "filled", "refilled",
  "picked up", "last", "next", "due", "since", "from", "until", "through", "starting", "effective", "onset",
  "received", "collected", "drawn", "signed", "scheduled", "rescheduled", "returned", "transferred",
];
const DATE_WORD_RE = DATE_WORDS.map((w) => w.split(" ").map((x) => x.replace("/", "\\/").replace("-", "[- ]")).map(ci).join("\\s+")).join("|");

function notFollowedByQuantity(m, rest) {
  const next = String(rest || "").trimStart().split(/[\s,.;:)]/)[0].toLowerCase();
  return !QUANTITY_WORDS.has(next);
}

// ── ages over 89 ─────────────────────────────────────────────────────
const AGE_NUM = `(?:9[0-9]|1[01][0-9]|12[0-5])`;
const NUMBER_WORDS = "(?:one|two|three|four|five|six|seven|eight|nine)";
const SPELLED_AGE = `(?:${ci("ninety")}(?:[-\\s]${NUMBER_WORDS})?|${ci("one")}[-\\s]${ci("hundred")}(?:[-\\s](?:${ci("and")}[-\\s])?(?:${NUMBER_WORDS}|${ci("ten")}|${ci("eleven")}|${ci("twelve")}|${ci("thirteen")}|${ci("fourteen")}|${ci("fifteen")}|${ci("sixteen")}|${ci("seventeen")}|${ci("eighteen")}|${ci("nineteen")}|${ci("twenty")}(?:[-\\s]${NUMBER_WORDS})?))?)`;
const YEARS_OLD = `(?:\\s*-?\\s*(?:${ci("years")}|${ci("year")}|${ci("yrs")}|${ci("yr")}|${ci("y")})\\.?\\s*-?\\s*(?:${ci("old")}|${ci("of")}\\s+${ci("age")}))`;
const PERSON_SUBJECT = `(?:${ci("patient")}|${ci("pt")}|${ci("she")}|${ci("he")}|${ci("i")}|${ci("i am")}|${ci("i'm")}|${ci("who")}|${ci("mother")}|${ci("father")}|${ci("mom")}|${ci("dad")}|${ci("grandmother")}|${ci("grandfather")}|${ci("grandma")}|${ci("grandpa")}|${ci("husband")}|${ci("wife")}|${ci("sister")}|${ci("brother")}|${ci("aunt")}|${ci("uncle")})`;

export const CLINICAL_RULES = freeze([
  // URLs with a scheme or www.
  { type: "url", re: /\b(?:https?:\/\/|www\.)[^\s<>\[\]]{0,2000}[A-Za-z0-9/#=_~-]/gi },
  // URLs written as a domain and a path ("portal.example.org/patient/88213").
  { type: "url", re: new RegExp(`\\b(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.){1,5}(?:${TLDS})\\/[^\\s<>\\[\\]]{0,2000}[A-Za-z0-9/#=_~-]`, "gi") },
  // MAC address (device identifier).
  { type: "device", re: /(?<![\w:-])(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}(?![\w:-])/g },
  // IPv4, validated octets. A sentence period, a colon before, or a port after is fine.
  { type: "ip", re: /(?<![\w.])(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?![\w]|\.\d)/g },
  // IPv6, full or compressed, validated.
  { type: "ip", re: /(?<![\w:])(?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(?![\w:])/g, validate: (m) => validIpv6(m) },
  // Labeled identifiers.
  {
    type: "account",
    re: new RegExp(`(?<![A-Za-z])${LABEL}(?![A-Za-z])\\s*(?:[:#=]\\s*){0,2}(?:(?:${ci("is")}|${ci("was")})\\s+)?(${VALUE_GROUP}(?:[ .]${VALUE_GROUP}){0,4})`, "g"),
    replace: labeledValue,
  },
  // ISO and year-first dates (2025-10-22, 2025.10.22, 2025/10/22), month and day checked.
  {
    type: "date",
    re: new RegExp(`${NO_DIG_BEFORE}(?<![.])(${YEAR})([-./])(${DAY})\\2(${DAY})${NO_DIG_AFTER}(?![.-]\\d)`, "g"),
    validate: (m, y, sep, mo, d) => plausibleMonthDay(mo, d) && Number(asciiDigits(mo)) <= 12,
  },
  // Numeric month/day/year or day/month/year with one consistent separator.
  {
    type: "date",
    re: new RegExp(`${NO_DIG_BEFORE}(?<![./-])(${DAY})([/.\\-\\u2010-\\u2015])(${DAY})\\2(${DIG}{4}|${DIG}{2})${NO_DIG_AFTER}(?![/.\\-\\u2010-\\u2015][0-9])`, "g"),
    validate: (m, a, sep, b) => plausibleMonthDay(a, b),
  },
  // Month name, with a day and an optional year: "Nov 14th", "September 19, 2026".
  { type: "date", re: new RegExp(`(?<![A-Za-z])${MONTH}\\s+${DAY}${ORD}?(?:,?\\s+${YEAR})?${NO_DIG_AFTER}`, "g") },
  // Day first: "17 August 2026", "17th April 2026", "the 4th of July, 2025".
  { type: "date", re: new RegExp(`(?:\\b${ci("the")}\\s+)?${NO_DIG_BEFORE}${DAY}${ORD}?\\s+(?:${ci("of")}\\s+)?${MONTH}(?![A-Za-z])(?:,?\\s+${YEAR})?${NO_DIG_AFTER}`, "g") },
  // Month and year: "August 2022", "Aug. 2022".
  { type: "date", re: new RegExp(`(?<![A-Za-z])${MONTH}(?![A-Za-z]),?\\s+${YEAR}${NO_DIG_AFTER}`, "g") },
  // Month/day or month/year after a date word, unless a quantity word follows ("3/4 strength", "2/3 weeks").
  {
    type: "date",
    re: new RegExp(`\\b((?:${DATE_WORD_RE})\\s*:?\\s*)(${DAY}\\/(?:${DAY}|${YEAR}))(?![\\d/])((?:\\s+[A-Za-z%]+)?)`, "g"),
    validate: (m, prefix, v, rest) => {
      const [a, b] = v.split("/");
      const ok = b.length === 4 ? Number(asciiDigits(a)) >= 1 && Number(asciiDigits(a)) <= 12 : plausibleMonthDay(a, b);
      return ok && notFollowedByQuantity(m, rest);
    },
    replace: (m, prefix, v, rest) => prefix + "[date]" + rest,
  },
  // Ages over 89: "Age: 96", "aged 101".
  {
    type: "age",
    re: new RegExp(`\\b(?:${ci("age")}[dD]?|${ci("aged")})\\s*:?\\s*(${AGE_NUM})${NO_DIG_AFTER}`, "g"),
    replace: (m, v) => m.slice(0, m.length - v.length) + "[age]",
  },
  // "92-year-old", "94-yr-old", "92 y.o.", "101yo", "93 years of age".
  { type: "age", re: new RegExp(`${NO_DIG_BEFORE}${AGE_NUM}(?:${YEARS_OLD}|\\s*(?:${ci("y")}\\/${ci("o")}|${ci("y")}\\.${ci("o")}\\.?|${ci("yo")})(?![A-Za-z]))`, "g") },
  // Spelled out: "ninety-three years old", "one hundred and one year old".
  { type: "age", re: new RegExp(`\\b${SPELLED_AGE}${YEARS_OLD}`, "g") },
  // Sex shorthand with a clinical verb: "92F presents", "94 M with".
  {
    type: "age",
    re: new RegExp(`${NO_DIG_BEFORE}(${AGE_NUM}\\s?[FM])\\b(?=\\s+(?:${ci("with")}|w\\/|${ci("presents")}|${ci("presenting")}|${ci("admitted")}|${ci("who")}|${ci("pt")}|${ci("patient")}|s\\/p|${ci("status")}|${ci("seen")}|${ci("hx")}|${ci("history")}|c\\/o|${ci("complaining")}|${ci("here")}))`, "g"),
  },
  // A person's age in prose: "my grandmother is 101", "she turned 94".
  {
    type: "age",
    re: new RegExp(`\\b(${PERSON_SUBJECT}\\s+(?:${ci("is")}|${ci("was")}|${ci("turns")}|${ci("turned")}|${ci("turning")}|${ci("will be")})\\s+(?:${ci("now")}\\s+)?)(${AGE_NUM})${NO_DIG_AFTER}(?![./]\\d)(?!\\s*(?:mg|mcg|units|%|°|degrees|kg|lb|cm|mm))`, "g"),
    replace: (m, prefix) => prefix + "[age]",
  },
  // Decade of life over 89: "in her 90s", "in his nineties".
  { type: "age", re: new RegExp(`\\b(?:${ci("in")}\\s+(?:${ci("her")}|${ci("his")}|${ci("their")}|${ci("my")})\\s+)(?:90s|${ci("nineties")}|100s)\\b`, "g") },
  // PO box, with an optional city/state/ZIP tail.
  { type: "address", re: new RegExp(`\\b[Pp]\\.?\\s*[Oo]\\.?\\s+${ci("box")}\\s+${DIG}{1,8}(?:,\\s*[A-Za-z][A-Za-z ]{1,40},?\\s*[A-Za-z]{2}\\s+${DIG}{5}(?:-${DIG}{4})?)?`, "g") },
  // Labeled city, town or county: one to three capitalized words.
  {
    type: "address",
    re: new RegExp(`\\b(?:${ci("city")}|${ci("town")}|${ci("county")})\\s*:\\s*([A-Z][A-Za-z.'-]*(?:\\s+[A-Z][A-Za-z.'-]*){0,2})`, "g"),
    replace: (m, v) => m.slice(0, m.length - v.length) + "[address]",
  },
  // Labeled ZIP.
  {
    type: "address",
    re: new RegExp(`\\b${ci("zip")}(?:\\s*${ci("code")})?\\s*:?\\s*(${DIG}{5}(?:${DASH}${DIG}{4})?)${NO_DIG_AFTER}`, "g"),
    replace: (m, v) => m.slice(0, m.length - v.length) + "[address]",
  },
]);

/**
 * Birth year after a birth word, removed when it shows an age over 89 at the
 * reference date ("DOB: 1930", "born in 1931"). Without a reference date the
 * engine cannot judge the age, so the residual scan sends the year to review.
 */
export function birthYearRule(referenceDate) {
  const ref = referenceDate instanceof Date ? referenceDate : new Date(String(referenceDate));
  const refYear = ref.getUTCFullYear();
  if (!Number.isFinite(refYear)) throw new RangeError("referenceDate is not a valid date");
  return Object.freeze({
    type: "dob",
    re: new RegExp(`\\b((?:${ci("dob")}|${ci("d.o.b")}\\.?|${ci("date")}\\s+${ci("of")}\\s+${ci("birth")}|${ci("born")}(?:\\s+${ci("in")})?|${ci("birth")}\\s*${ci("year")}|${ci("yob")})\\s*:?\\s*)((?:18|19|20)${DIG}{2})${NO_DIG_AFTER}(?![/.-]\\d)`, "g"),
    validate: (m, prefix, year) => refYear - Number(asciiDigits(year)) >= 90,
    replace: (m, prefix) => prefix + "[dob]",
  });
}

export default { CLINICAL_RULES, birthYearRule };
