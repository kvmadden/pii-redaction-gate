// shapes.js: shared regular-expression parts for the pattern tiers.
//
// Pure. Digits include fullwidth forms and dashes include the Unicode dash
// family, so text pasted from a word processor or PDF ("212–555–0147",
// "１２３-４５-６７８９") matches the same rules as plain ASCII. The original
// characters stay in the output: only the match is replaced.

/** One digit, ASCII or fullwidth. */
export const DIG = "[0-9\\uFF10-\\uFF19]";
/** One dash: hyphen-minus, the U+2010 to U+2015 dashes, minus sign, small and fullwidth hyphen. */
export const DASH = "[\\-\\u2010-\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]";
/** A separator inside a number: space, dot or any dash. */
export const SEP = "[\\s.\\-\\u2010-\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]";
/** No digit (ASCII or fullwidth) right before. */
export const NO_DIG_BEFORE = "(?<![0-9\\uFF10-\\uFF19])";
/** No digit (ASCII or fullwidth) right after. */
export const NO_DIG_AFTER = "(?![0-9\\uFF10-\\uFF19])";

/** Convert fullwidth digits to ASCII (same length). */
export function asciiDigits(s) {
  return String(s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xff10 + 48));
}

/** Case-insensitive pattern source for plain words, without the i flag on the whole regex. */
export function ci(word) {
  return String(word).replace(/[A-Za-z]/g, (c) => `[${c.toUpperCase()}${c.toLowerCase()}]`);
}

/**
 * Month names. "May" and "Mar" must be capitalized so the verb "may" never
 * reads as a date. A period is part of the match only after an abbreviation
 * ("Sept."), so a sentence-final period after "July" stays in the text.
 */
const month = (full, ...abbrs) => [ci(full), ...abbrs.map((a) => `${ci(a)}\\.?`)].join("|");
export const MONTH = `(?:${[
  month("january", "jan"),
  month("february", "feb"),
  "March|MARCH|Mar\\.?|MAR",
  month("april", "apr"),
  "May|MAY",
  month("june", "jun"),
  month("july", "jul"),
  month("august", "aug"),
  month("september", "sept", "sep"),
  month("october", "oct"),
  month("november", "nov"),
  month("december", "dec"),
].join("|")})`;

/** Ordinal suffix: st, nd, rd, th. */
export const ORD = `(?:${ci("st")}|${ci("nd")}|${ci("rd")}|${ci("th")})`;

/** Street suffixes. Full words and their common abbreviations. */
export const STREET_WORDS = [
  ["street", "st"], ["avenue", "ave"], ["boulevard", "blvd"], ["road", "rd"], ["drive", "dr"],
  ["lane", "ln"], ["court", "ct"], ["circle", "cir"], ["way", null], ["place", "pl"],
  ["terrace", "ter"], ["parkway", "pkwy"], ["highway", "hwy"], ["trail", "trl"], ["loop", null],
  ["plaza", null], ["square", "sq"],
];

/** True when month and day can be a calendar date, read either way round. */
export function plausibleMonthDay(a, b) {
  const x = Number(asciiDigits(a));
  const y = Number(asciiDigits(b));
  const md = x >= 1 && x <= 12 && y >= 1 && y <= 31;
  const dm = y >= 1 && y <= 12 && x >= 1 && x <= 31;
  return md || dm;
}
