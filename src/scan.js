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
//   long-number     a run of 7 or more digits with no label and no unit after it
//   grouped-number  eight or more digits split into groups, without a clinical unit
//   code            a letter-and-digit code with 3 or more digits and 6 or more
//                   characters, with no label (not a TNM stage or an ICD code)
//   ocr-number      a number that mixes digits with O, o, I or l
//   birth-year      a birth year that could show an age over 89, when no
//                   referenceDate was given (the same grammar as the rule)
//   script          letters or digits in a script the rules do not read (Han,
//                   Cyrillic, Arabic-Indic digits and others), and Greek words
//   invisible       format characters: zero-width, direction controls, soft hyphen
//   obfuscated-email  "name at domain dot com", "name at example.org", "a @ b.org"
//   name-label      a person field ("Name:", "Patient:") whose value was not
//                   fully redacted, on the same line or the next one
//   spelled-out     four or more letters spelled one at a time ("D-E-L-G-A-D-O",
//                   "d-e-l-g-a-d-o"), as callers spell a name
//   card            a card-shaped number that failed the card check
//   phone           a seven-digit local number with no calling word ("555-0142")
//   age             a number from 90 to 125 next to an age word that no rule removed
//   token-run       a redaction token that runs straight into more characters
//                   ("[url]aaaa"), so the rule may have read only part of a value
//   bracketed-word  a bracketed lowercase word from the input that looks like a
//                   redaction token but is not one ("[smith]")

import { nameReviewSpans } from "./names.js";
import { BIRTH_YEAR_SOURCE, TLDS } from "./clinical-patterns.js";
import { wordClass } from "./lexicon.js";

export const RESIDUAL_CHECKS = Object.freeze([
  "names",
  "long-number",
  "grouped-number",
  "code",
  "ocr-number",
  "birth-year",
  "script",
  "invisible",
  "obfuscated-email",
  "name-label",
  "spelled-out",
  "card",
  "phone",
  "age",
  "token-run",
  "bracketed-word",
]);

const SCRIPTS = ["Han", "Hiragana", "Katakana", "Hangul", "Cyrillic", "Arabic", "Hebrew", "Devanagari", "Bengali", "Thai", "Tamil", "Gujarati", "Gurmukhi", "Ethiopic", "Armenian", "Georgian", "Khmer", "Lao", "Myanmar", "Sinhala", "Tibetan", "Greek"];
const SCRIPT_TESTS = SCRIPTS.map((name) => [name, new RegExp(`\\p{Script=${name}}`, "u")]);
const OTHER_SCRIPT = /(?:(?![\p{Script=Latin}\p{Script=Greek}\p{Script=Common}\p{Script=Inherited}])\p{L})+/gu;
// Greek letters alone are clinical symbols (α, β, μ). A Greek word is not read.
const GREEK_WORD = /\p{Script=Greek}{3,}/gu;
// Decimal digits other than ASCII and fullwidth, which the rules do read.
const OTHER_DIGITS = /(?:(?![0-9０-９])\p{Nd})+/gu;
const BIRTH_YEAR = new RegExp(BIRTH_YEAR_SOURCE, "g");
const UNIT_AFTER = /^\s*(?:copies|cells|iu\b|units?\b|mcg\b|mg\b|ng\b|pg\b|g\b|kg\b|ml\b|l\b|mmol|meq|mm3|\/\s*(?:m?l|[uµ]l|mm3?|hpf|dl)\b|per\b|%)/i;
const CODE_CONTEXT = /\b(?:icd(?:[- ]?10)?(?:[- ]?cm)?|cpt|hcpcs|dx|diagnosis|code)\b[^\n]{0,16}$/i;
const TNM = /^[pcy]?T(?:[0-4][a-d]?|is|x)N(?:[0-3][a-c]?|x)M(?:[01][a-c]?|x)$/i;
// Editorial marks in transcripts and forms that are not names.
const EDITORIAL = new Set(["sic", "x", "ok", "inaudible", "crosstalk", "laughter", "laughs", "pause", "silence", "unclear", "unintelligible", "redacted", "removed", "blank", "signature", "music", "noise", "cough", "applause"]);
const CREDENTIALS = new Set(["md", "do", "rn", "np", "pa", "pharmd", "phd", "dds", "dmd", "lpn", "cna", "crna", "dnp", "aprn", "mph", "mba", "jr", "sr", "ii", "iii"]);
const STRONG_FIELDS = "patient name|pt name|full name|member name|subscriber name|name";
const WEAK_FIELDS = "patient|pt|member|subscriber|insured|guarantor";
const NAME_FIELD = new RegExp(`\\b(${STRONG_FIELDS}|${WEAK_FIELDS})\\s*:[ \\t]*(?:\\r?\\n[ \\t]*)?([^\\n|;]{1,60})`, "gi");
const KNOWN_TOKEN = /\[[a-z-]+\]/g;
const TLD_END = new RegExp(`\\.(?:${TLDS})$`, "i");

function scriptName(s) {
  for (const [name, re] of SCRIPT_TESTS) if (re.test(s)) return name;
  return "non-Latin";
}

function push(out, m, check, reason) {
  out.push({ start: m.index, end: m.index + m[0].length, check, reason });
}

function looksLikeDateGroups(parts) {
  const year = (s) => s.length === 4 && Number(s) >= 1900 && Number(s) <= 2100;
  const month = (s) => Number(s) >= 1 && Number(s) <= 12;
  const day = (s) => Number(s) >= 1 && Number(s) <= 31;
  if (parts.length !== 3) return false;
  const [a, b, c] = parts;
  return (year(a) && month(b) && day(c)) ||
    (year(c) && ((month(a) && day(b)) || (day(a) && month(b))));
}

function luhnOk(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits.charCodeAt(digits.length - 1 - i) - 48;
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * @param {string} text  redacted output
 * @param {{ names?: boolean, safe?: Set<string>, nameTokens?: Set<string>, tokenNames?: Set<string>, referenceDate?: unknown, skip?: Array<{start:number,end:number}> }} opts
 *   names: run the name checks (profiles with the unknown-name pass).
 *   nameTokens: the tokens that stand for a person ("[name]", "[patient]").
 *   tokenNames: the token names this run wrote. A bracketed word that is not
 *     one of them is input text and is read like any other word.
 *   skip: output ranges that were not scanned (exempt code spans).
 * @returns {Array<{start:number,end:number,check:string,reason:string}>}
 */
export function scanResidual(text, { names = true, safe = new Set(), nameTokens, tokenNames, referenceDate = null, skip = [] } = {}) {
  if (typeof text !== "string" || !text) return [];
  const out = [];
  const isToken = (t) => !tokenNames || tokenNames.has(t.slice(1, -1));
  if (names) out.push(...nameReviewSpans(text, { safe, nameTokens, tokenNames }));

  // A decimal point after another digit is a decimal ("3.14159265"). A dot
  // after a space or a label is not (".12345678").
  for (const m of text.matchAll(/(?<!\p{N})(?<!\p{N}[.,])\p{N}{7,}(?!\p{N})/gu)) {
    if (UNIT_AFTER.test(text.slice(m.index + m[0].length, m.index + m[0].length + 12))) continue; // "1250000 copies/mL"
    push(out, m, "long-number", "unlabeled number with 7 or more digits");
  }
  for (const m of text.matchAll(/(?<![\p{L}\p{N}_-])[\p{L}\p{Nd}]+(?:[-_][\p{L}\p{Nd}]+)*(?![\p{L}\p{N}_])/gu)) {
    const s = m[0];
    const digits = (s.match(/\p{Nd}/gu) || []).length;
    if (!/\p{L}/u.test(s) || digits < 3 || s.replace(/[-_]/g, "").length < 6) continue;
    if (TNM.test(s)) continue; // a TNM stage, "T3N2M0"
    if (CODE_CONTEXT.test(text.slice(Math.max(0, m.index - 30), m.index))) continue; // "ICD-10 S52521A"
    push(out, m, "code", "unlabeled letter-and-digit code");
  }
  // OCR mix-ups: a group that mixes digits with O, I or l ("O147"), or a group
  // of capital O or I next to digit groups ("212 555 OOOO"). "lol" is a word.
  for (const m of text.matchAll(/(?<![\p{L}\p{N}])[0-9OoIl]{2,}(?:[-./ ][0-9OoIl]{2,}){1,3}(?![\p{L}\p{N}])/gu)) {
    const groups = m[0].split(/[-./ ]/);
    const mixed = groups.some((g) => /\d/.test(g) && /[OoIl]/.test(g));
    const capitals = groups.some((g) => /^[OI]+$/.test(g)) && groups.some((g) => /^\d+$/.test(g));
    if ((mixed || capitals) && (m[0].match(/[\dOI]/g) || []).length >= 6) push(out, m, "ocr-number", "number mixing digits with O, I or l (possible scan error)");
  }
  if (!referenceDate) {
    for (const m of text.matchAll(BIRTH_YEAR)) {
      const at = m.index + m[1].length;
      out.push({ start: at, end: at + m[2].length, check: "birth-year", reason: "birth year: an age over 89 cannot be checked without referenceDate" });
    }
  }
  for (const m of text.matchAll(OTHER_SCRIPT)) push(out, m, "script", `letters in a script the rules do not read (${scriptName(m[0])})`);
  for (const m of text.matchAll(GREEK_WORD)) push(out, m, "script", "a Greek word, which the rules do not read");
  for (const m of text.matchAll(OTHER_DIGITS)) push(out, m, "script", "digits in a script the rules do not read");
  for (const m of text.matchAll(/\p{Cf}/gu)) {
    if (m.index === 0 && m[0] === "﻿") continue; // a byte-order mark at the start of a file
    push(out, m, "invisible", "invisible or direction-control character");
  }
  for (const m of text.matchAll(/\b[\w.+-]{1,64}\s*(?:\[at\]|\(at\)|\{at\}|\sat\s|\s@\s?|\s?@\s)\s*[\w-]{1,63}(?:\s*(?:\[dot\]|\(dot\)|\{dot\}|\sdot\s|\.)\s*[\w-]{1,63}){1,4}\b/gi)) {
    const bracketed = /\[at\]|\(at\)|\{at\}|\sdot\s|\[dot\]|\(dot\)|\{dot\}/i.test(m[0]);
    const spelledAt = /\sat\s|\s@|@\s/i.test(m[0]) && TLD_END.test(m[0].replace(/\s+/g, ""));
    if (bracketed || spelledAt) push(out, m, "obfuscated-email", "email address written to avoid detection");
  }
  if (names) {
    for (const m of text.matchAll(NAME_FIELD)) {
      const label = m[1].toLowerCase();
      const value = m[2].replace(KNOWN_TOKEN, (t) => (isToken(t) ? " " : t));
      const words = (value.match(/\p{L}[\p{L}\p{M}'’-]*/gu) || []).filter((w) => !CREDENTIALS.has(w.toLowerCase().replace(/\./g, "")));
      if (!words.length) continue;
      // "Name:" must hold a name. "Patient:" can hold a description ("alert and
      // oriented"), so only a first word that is not ordinary English counts.
      const strong = new RegExp(`^(?:${STRONG_FIELDS})$`, "i").test(label);
      if (!strong) {
        // "Patient: alert and oriented" describes; "Patient: xqvrzpl" names.
        const cls = wordClass(words[0]);
        const capital = /^\p{Lu}/u.test(words[0]);
        const nameLike = cls === "nameStrong" || cls === "unknown" || cls === "eponymous" || (cls === "nameWeak" && capital);
        if (!nameLike || /^\d/.test(m[2].trim())) continue;
      }
      const at = m.index + m[0].length - m[2].length;
      out.push({ start: at, end: at + m[2].trimEnd().length, check: "name-label", reason: "person field with a value that was not fully redacted" });
    }
  }
  for (const m of text.matchAll(/(?<![\p{L}\p{N}])\p{Lu}(?:[- ]\p{Lu}){3,}(?![\p{L}\p{N}])/gu)) push(out, m, "spelled-out", "letters spelled out one at a time (a spelled name or code)");
  for (const m of text.matchAll(/(?<![\p{L}\p{N}])\p{Ll}(?:-\p{Ll}){3,}(?![\p{L}\p{N}])/gu)) push(out, m, "spelled-out", "letters spelled out one at a time (a spelled name or code)");
  // Card-shaped numbers that the card rule left because the check digit failed.
  for (const m of text.matchAll(/(?<![\d-])(?:\d[ -]?){12,18}\d(?![\d-])/g)) {
    const digits = m[0].replace(/\D/g, "");
    if (/[ -]/.test(m[0]) && !luhnOk(digits)) push(out, m, "card", "card-shaped number that failed the card check");
  }
  // Unicode spaces from copied documents are also number-group separators.
  // A number can look harmless if every digit group is short. Keep unresolved
  // groups visible to a reviewer, rather than marking the text clean. Do not
  // confuse calendar dates, year ranges or quantities with record identifiers.
  for (const m of text.matchAll(/(?<![\p{L}\p{N}_./-])\d{2,4}(?:(?:[ \t\p{Zs}]*-[ \t\p{Zs}]*|[ \t\p{Zs}]+|[ \t\p{Zs}]*\r?\n[ \t\p{Zs}]*)\d{2,4}){1,5}(?![\p{L}\p{N}_]|[./-]\d)/gu)) {
    const groups = m[0].trim().split(/[ \t\r\n\p{Zs}]*-[ \t\r\n\p{Zs}]*|[ \t\r\n\p{Zs}]+/u);
    const digits = groups.reduce((n, group) => n + group.length, 0);
    if (digits < 8) continue;
    if (groups.length === 2 && groups.every((group) => group.length === 4 && Number(group) >= 1900 && Number(group) <= 2100)) continue;
    if (looksLikeDateGroups(groups) ||
        (groups.length === 4 && looksLikeDateGroups(groups.slice(0, 3)) && Number(groups[3]) <= 23)) continue;
    if (UNIT_AFTER.test(text.slice(m.index + m[0].length, m.index + m[0].length + 12))) continue;
    push(out, m, "grouped-number", "number split into groups (possible identifier)");
  }
  for (const m of text.matchAll(/(?<![\p{N}\-./$])[2-9]\d{2}[-.]\d{4}(?![\p{N}\-./])/gu)) {
    if (UNIT_AFTER.test(text.slice(m.index + m[0].length, m.index + m[0].length + 12))) continue; // "250-1000 mg"
    push(out, m, "phone", "possible local phone number");
  }
  // The word "age" in a sentence, not inside an "[age]" token, then the number.
  for (const m of text.matchAll(/(?<!\[)\b(?:age[d]?)\b\s*(?:[:=\-\u2010-\u2015]|is|was|of)?\s*(?<![\d.])(9\d|1[01]\d|12[0-5])(?![\d.]?\d)|(?<![\d.])(9\d|1[01]\d|12[0-5])\s*(?:yo|y\/o|y\.o\.?|-?\s*years?\s+old|-?\s*yrs?\s+old)\b/gi)) {
    push(out, m, "age", "possible age over 89");
  }
  for (const m of text.matchAll(/\[[a-z-]+\](?=[\p{L}\p{N}]|[-./][\p{L}\p{N}])/gu)) {
    if (isToken(m[0])) push(out, m, "token-run", "a redaction token runs into more characters (the value may be only partly removed)");
  }
  for (const m of text.matchAll(/\[[a-z-]+\]/g)) {
    if (!isToken(m[0]) && !EDITORIAL.has(m[0].slice(1, -1))) push(out, m, "bracketed-word", "bracketed word that looks like a redaction token but is not one");
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
