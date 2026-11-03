// eval/fresh/header-map.mjs: the header-block people map, FROZEN for the blind set.
//
// The second pre-declared gate configuration runs the identifiers profile with
// a people map built from each document's own header block, the way an EHR
// integration would pass the patient's and clinicians' names it already knows.
// This rule was written before the blind set was seen and must not change
// after the lock: test/fresh-score.test.js fails if this file's SHA-256 changes.
//
// RULE (version 1)
//   1. The header block is the document's opening lines, up to the first blank
//      line, at most 20 lines.
//   2. Each header line is split into fields at a tab, " | ", or two or more
//      spaces. A field is "Label: value".
//   3. Only person labels count (PERSON_LABELS below). The label decides the
//      role: patient, clinician or family.
//   4. The value is cleaned: anything from "<", "(" or "[" on is dropped (an
//      email address or a note), a leading title (Dr., Mr., Mrs., Ms., Mx.,
//      Miss, Prof.) is dropped, and trailing credentials (MD, RN, PharmD and
//      the like, after a comma or a space) are dropped.
//   5. "LAST, FIRST M." is read as last name, first name, initials. Otherwise
//      the value is read as written, first name first.
//   6. The value is a name only if it has 1 to 5 words of letters (with
//      apostrophes, hyphens and initials), no digits, every word starts with
//      a capital letter (or is a surname particle such as "de" or "van"), it
//      is not a placeholder (none, unknown, self, pending and the like), and
//      at least one word of 2 or more letters is a strong name: on a name
//      list and not an ordinary English word, on no list at all, or on the
//      first-name list. A one-word value must itself be a strong name of 3
//      or more letters that is not on the first-name list as an ordinary
//      word, so "Price" alone is not a known name but "Okonkwo" is.
//   7. Each name gives one people-map entry: the full name as written, plus
//      aliases "First Last", "First M. Last", "Last, First", and each single
//      first or last name of 3 or more letters that is not an ordinary
//      English or clinical word (so "Grace" or "Bell" alone never becomes a
//      known name, but "Okonkwo" does).

import { wordClass, lookup } from "../../src/lexicon.js";

export const HEADER_RULE_VERSION = 1;

const MAX_HEADER_LINES = 20;

const ROLE_OF = new Map([
  ...["patient", "patient name", "pt", "pt name", "name", "full name", "member", "member name", "subscriber", "subscriber name", "insured", "guarantor", "re", "regarding"].map((l) => [l, "patient"]),
  ...["attending", "attending physician", "physician", "provider", "pcp", "primary care", "primary care physician", "referring", "referring physician", "referring provider", "ordering physician", "ordering provider", "prescriber", "pharmacist", "nurse", "rn", "np", "signed by", "electronically signed by", "cosigned by", "dictated by", "transcribed by", "author", "seen by", "requested by"].map((l) => [l, "clinician"]),
  // Message headers: the sender or recipient can be the patient or a clinician.
  ...["from", "to", "cc", "attn", "attention"].map((l) => [l, "person"]),
  ...["caregiver", "guardian", "emergency contact", "next of kin", "nok", "contact", "caller", "proxy", "spouse", "parent"].map((l) => [l, "family"]),
]);
export const PERSON_LABELS = Object.freeze([...ROLE_OF.keys()]);

const TITLES = /^(?:dr|mr|mrs|ms|mx|miss|prof|rev)\.?\s+/i;
const CREDENTIALS = /(?:,?\s+(?:md|do|rn|np|pa|pa-c|pharmd|phd|dnp|aprn|lpn|cna|crna|msw|lcsw|dds|dmd|mph|mba|jr|sr|ii|iii)\.?)+$/i;
const PLACEHOLDERS = new Set(["none", "n/a", "na", "unknown", "self", "same", "pending", "see below", "see above", "not applicable", "declined", "on file", "tbd", "none listed", "not on file"]);
const WORD = /^[\p{L}][\p{L}\p{M}'’.-]*$/u;
const PARTICLES = new Set(["de", "del", "della", "da", "di", "du", "la", "le", "van", "von", "der", "den", "bin", "ibn", "al", "el", "dos", "das", "ter", "ten"]);

/** The header block: opening lines up to the first blank line, at most 20. */
export function headerLines(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim() || out.length >= MAX_HEADER_LINES) break;
    out.push(line);
  }
  return out;
}

function cleanValue(value) {
  let v = value.split(/[<([]/)[0];
  v = v.replace(/\s+/g, " ").trim();
  v = v.replace(TITLES, "");
  v = v.replace(CREDENTIALS, "");
  if (/(?:^|\s)\p{L}\.$/u.test(v)) return v; // ends with an initial: "Adaeze B."
  return v.replace(/[\s.,;:]+$/, "");
}

/** A word that names a person on its own: not an ordinary English or clinical word. */
function strongName(w) {
  const letters = w.replace(/[^\p{L}]/gu, "");
  if (letters.length < 2) return false;
  const cls = wordClass(letters);
  if (cls === "unknown" || cls === "nameStrong") return true;
  return (cls === "nameWeak" || cls === "eponymous") && lookup(letters).first;
}

function nameLike(words) {
  if (words.length < 1 || words.length > 5) return false;
  if (!words.every((w) => WORD.test(w) && (/^\p{Lu}/u.test(w) || PARTICLES.has(w.toLowerCase())))) return false;
  if (words.length === 1) return singleAlias(words[0]) !== null;
  return words.some(strongName);
}

/** Parse one cleaned value into { first: [...], last: [...] } words, or null. */
export function parseNameValue(raw) {
  const v = cleanValue(raw);
  if (!v || PLACEHOLDERS.has(v.toLowerCase())) return null;
  const comma = v.match(/^([^,]+),\s*([^,]+)$/);
  if (comma) {
    const last = comma[1].trim().split(" ");
    const first = comma[2].trim().split(" ");
    return nameLike([...first, ...last]) ? { first, last } : null;
  }
  const words = v.split(" ");
  if (!nameLike(words)) return null;
  return words.length === 1 ? { first: [], last: words } : { first: words.slice(0, -1), last: words.slice(-1) };
}

const isInitial = (w) => /^\p{L}\.?$/u.test(w);

function singleAlias(word) {
  const letters = word.replace(/[^\p{L}]/gu, "");
  if (letters.length < 3 || isInitial(word)) return null;
  const cls = wordClass(letters);
  return cls === "nameStrong" || cls === "unknown" ? word : null;
}

/** One people-map entry from parsed name words. */
function entryFor(value, parsed, role) {
  const given = parsed.first.filter((w) => !isInitial(w));
  const initials = parsed.first.filter(isInitial);
  const last = parsed.last.join(" ");
  const aliases = new Set();
  if (given.length) {
    aliases.add(`${given.join(" ")} ${last}`);
    aliases.add(`${given[0]} ${last}`);
    aliases.add(`${last}, ${given.join(" ")}`);
    if (initials.length) aliases.add(`${given.join(" ")} ${initials.join(" ")} ${last}`);
  }
  for (const w of [...given, ...parsed.last]) {
    const a = singleAlias(w);
    if (a) aliases.add(a);
  }
  const name = cleanValue(value);
  aliases.delete(name);
  return { name, role, aliases: [...aliases] };
}

/**
 * The people map for one document, from its header block. Deterministic.
 * @returns {{ people: Array<{name:string, role:string, aliases:string[]}>, safe: string[] }}
 */
export function headerPeopleMap(text) {
  const people = [];
  const seen = new Set();
  for (const line of headerLines(text)) {
    for (const field of line.split(/\t| \| |\s{2,}/)) {
      const m = field.match(/^\s*([A-Za-z][A-Za-z .'/-]{0,40}?)\s*:\s*(.+?)\s*$/);
      if (!m) continue;
      const role = ROLE_OF.get(m[1].toLowerCase().replace(/\s+/g, " ").trim());
      if (!role) continue;
      const parsed = parseNameValue(m[2]);
      if (!parsed) continue;
      const entry = entryFor(m[2], parsed, role);
      const key = `${role}:${entry.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      people.push(entry);
    }
  }
  return { people, safe: [] };
}

export default { headerPeopleMap, headerLines, parseNameValue, HEADER_RULE_VERSION, PERSON_LABELS };
