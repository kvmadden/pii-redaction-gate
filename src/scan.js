// scan.js: residual scan of redacted output.
//
// Pure. After the tiers run, this pass reads the whole output again and lists
// spans the rules could not decide, so a result never reports "nothing found"
// when part of the input was not understood. A span listed here sends the
// result to review: the send guard refuses it until a person has looked.
//
// Checks (identifiers and strict profiles):
//   names           words the name classifier could not decide, initials, and
//                   name-shaped words still present
//   long-number     a run of 7 or more digits with no label
//   code            a letter-and-digit code with 3 or more digits and 6 or more
//                   characters, with no label
//   ocr-number      a number that mixes digits with O, o, I or l
//   birth-year      a birth year that could show an age over 89, when no
//                   referenceDate was given
//   script          letters in a script the rules do not read (Han, Cyrillic,
//                   Arabic and others)
//   invisible       zero-width or direction-control characters
//   obfuscated-email  "name at domain dot com" and bracket forms
//   name-label      a "Name:" field whose value was not redacted

import { nameReviewSpans } from "./names.js";

export const RESIDUAL_CHECKS = Object.freeze([
  "names",
  "long-number",
  "code",
  "ocr-number",
  "birth-year",
  "script",
  "invisible",
  "obfuscated-email",
  "name-label",
]);

const SCRIPTS = ["Han", "Hiragana", "Katakana", "Hangul", "Cyrillic", "Arabic", "Hebrew", "Devanagari", "Bengali", "Thai", "Tamil", "Gujarati", "Gurmukhi", "Ethiopic", "Armenian", "Georgian", "Khmer", "Lao", "Myanmar", "Sinhala", "Tibetan"];
const SCRIPT_TESTS = SCRIPTS.map((name) => [name, new RegExp(`\\p{Script=${name}}`, "u")]);
const OTHER_SCRIPT = /(?:(?![\p{Script=Latin}\p{Script=Greek}\p{Script=Common}\p{Script=Inherited}])\p{L})+/gu;

function scriptName(s) {
  for (const [name, re] of SCRIPT_TESTS) if (re.test(s)) return name;
  return "non-Latin";
}

function push(out, m, check, reason) {
  out.push({ start: m.index, end: m.index + m[0].length, check, reason });
}

/**
 * @param {string} text  redacted output
 * @param {{ names?: boolean, safe?: Set<string>, nameTokens?: Set<string>, referenceDate?: unknown, skip?: Array<{start:number,end:number}> }} opts
 *   names: run the name checks (profiles with the unknown-name pass).
 *   nameTokens: the tokens that stand for a person ("[name]", "[patient]").
 *   skip: output ranges that were not scanned (exempt code spans).
 * @returns {Array<{start:number,end:number,check:string,reason:string}>}
 */
export function scanResidual(text, { names = true, safe = new Set(), nameTokens, referenceDate = null, skip = [] } = {}) {
  if (typeof text !== "string" || !text) return [];
  const out = [];
  if (names) out.push(...nameReviewSpans(text, { safe, nameTokens }));
  for (const m of text.matchAll(/(?<![\p{N}.,])\p{N}{7,}(?!\p{N})/gu)) push(out, m, "long-number", "unlabeled number with 7 or more digits");
  for (const m of text.matchAll(/(?<![\p{L}\p{N}_-])[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?![\p{L}\p{N}_])/gu)) {
    const s = m[0];
    const digits = (s.match(/\d/g) || []).length;
    if (/[A-Za-z]/.test(s) && digits >= 3 && s.replace(/-/g, "").length >= 6) push(out, m, "code", "unlabeled letter-and-digit code");
  }
  for (const m of text.matchAll(/(?<![\p{L}\p{N}])(?=[0-9OoIl]*[0-9])(?=[0-9OoIl]*[OoIl])[0-9OoIl]{2,}(?:[-./ ][0-9OoIl]{2,}){1,3}(?![\p{L}\p{N}])/gu)) {
    if ((m[0].match(/\d/g) || []).length >= 4) push(out, m, "ocr-number", "number mixing digits with O, I or l (possible scan error)");
  }
  if (!referenceDate) {
    for (const m of text.matchAll(/\b(?:dob|d\.o\.b\.?|date of birth|born(?: in)?|birth ?year|yob)\s*:?\s*((?:18|19|20)\d{2})(?![\d/-]|\.\d)/gi)) {
      const at = m.index + m[0].length - m[1].length;
      out.push({ start: at, end: at + m[1].length, check: "birth-year", reason: "birth year: an age over 89 cannot be checked without referenceDate" });
    }
  }
  for (const m of text.matchAll(OTHER_SCRIPT)) push(out, m, "script", `letters in a script the rules do not read (${scriptName(m[0])})`);
  for (const m of text.matchAll(/[​-‏‪-‮⁠-⁤﻿­]/g)) push(out, m, "invisible", "invisible or direction-control character");
  for (const m of text.matchAll(/\b[\w.+-]{1,64}\s*(?:\[at\]|\(at\)|\{at\}|\sat\s)\s*[\w-]{1,63}(?:\s*(?:\[dot\]|\(dot\)|\{dot\}|\sdot\s|\.)\s*[\w-]{1,63}){1,4}\b/gi)) {
    if (/\[at\]|\(at\)|\{at\}|\sdot\s|\[dot\]|\(dot\)|\{dot\}/i.test(m[0])) push(out, m, "obfuscated-email", "email address written to avoid detection");
  }
  if (names) {
    for (const m of text.matchAll(/\b(?:patient name|pt name|full name|member name|subscriber name|name)\s*:(?![ \t]*\[)[ \t]*([^\n|;]{1,60})/gi)) {
      if (/\p{L}/u.test(m[1])) {
        const at = m.index + m[0].length - m[1].length;
        out.push({ start: at, end: at + m[1].trimEnd().length, check: "name-label", reason: "name field with an unredacted value" });
      }
    }
  }
  const kept = out.filter((r) => !skip.some((s) => r.start >= s.start && r.end <= s.end) && r.end > r.start);
  kept.sort((a, b) => a.start - b.start || a.end - b.end);
  const dedup = [];
  for (const r of kept) {
    const last = dedup[dedup.length - 1];
    if (last && last.start === r.start && last.end === r.end) continue;
    dedup.push(r);
  }
  return dedup;
}

export default { scanResidual, RESIDUAL_CHECKS };
