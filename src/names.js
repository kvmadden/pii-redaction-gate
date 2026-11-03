// names.js: NAME tier. Known names from a people map, then (identifiers and
// strict profiles) unknown person and facility names.
//
// Pure: no I/O, no env. The people map is injected by the engine.
//
// Pass 1, known names. Every listed name or alias becomes its role token
// ("Avery Sample" becomes "[patient]"). Matching ignores case, uses Unicode
// letter edges, takes the longest name first, and never touches an existing
// [token].
//
// Pass 2, unknown names. A token classifier decides each capitalized word
// from evidence, in this order:
//   1. Titles: "Dr.", "Mrs.", "Nurse" put a name after them, whatever the word.
//   2. Cues: a field label ("Name:", "Signed by:"), a relation word ("daughter",
//      "wife"), a greeting or sign-off ("Hi", "Thanks,") or "this is" before a
//      name-shaped word. LAST, FIRST is read as one name.
//   3. Facilities: proper words before a facility type ("Mercy Ridge Hospital").
//   4. An initial before a surname ("J. Smith").
//   5. Eponyms are kept when a clinical head noun follows ("Bell palsy").
//   6. A first name followed by a surname ("June Park").
//   7. A run of capitals that holds an ordinary English or clinical word is a
//      heading or phrase and is kept ("Acute Kidney Injury").
//   8. A single capitalized word is judged by the public word lists in
//      ./lexicon.js and its position. When the evidence conflicts, the word is
//      marked for review instead of passing silently.
//
// No list of drug, diagnosis or test words is written by hand here. Those come
// from public vocabularies (data/lexicon/manifest.json). The closed-class lists
// (titles, relation words, facility types) live in ./grammar.js.

import { wordClass, lookup } from "./lexicon.js";
import { foldKey } from "./text-fold.js";
import {
  HONORIFICS,
  RELATION_CUES,
  LABEL_CUES,
  GREETINGS,
  SIGNOFFS,
  INTRO_PHRASES,
  PERSON_VERBS,
  EPONYM_HEADS,
  FACILITY_HEADS,
  SERVICE_MODIFIERS,
  REFERENCE_MODIFIERS,
  FUNCTION_WORDS,
  AUXILIARIES,
  CALENDAR_WORDS,
  CONTRACTION,
  LOWERCASE_TITLES,
  PARTICLES,
  DOTTED_ABBREVIATIONS,
} from "./grammar.js";

const MIN_KNOWN_NAME = 2;

/** Normalize an injected people map; tolerate missing/partial shapes. */
export function normalizePeopleMap(peopleMap) {
  const people = [];
  const safe = new Set();
  if (peopleMap && typeof peopleMap === "object") {
    for (const entry of Array.isArray(peopleMap.people) ? peopleMap.people : []) {
      if (!entry || typeof entry.name !== "string" || !entry.name.trim()) continue;
      const role = typeof entry.role === "string" && entry.role.trim()
        ? entry.role.trim().toLowerCase().replace(/[^a-z-]+/g, "-").replace(/^-+|-+$/g, "")
        : "name";
      const names = [entry.name, ...(Array.isArray(entry.aliases) ? entry.aliases : [])]
        .filter((n) => typeof n === "string")
        .map((n) => n.trim().replace(/\s+/g, " "))
        .filter((n) => n.length >= MIN_KNOWN_NAME);
      if (names.length) people.push({ names, role: role || "name" });
    }
    for (const s of Array.isArray(peopleMap.safe) ? peopleMap.safe : []) {
      if (typeof s === "string" && s.trim()) safe.add(s.trim());
    }
  }
  return { people, safe };
}

/** The tokens that stand for a person: "[name]" and every role in the people map. */
export function nameTokensFor(map) {
  const out = new Set(["[name]"]);
  for (const p of map?.people || []) if (p && typeof p.role === "string") out.add(`[${p.role}]`);
  return out;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TOKEN_SPLIT = /(\[[a-z-]+\])/;

/** Pass 1: known names to role tokens, longest first, never inside a [token]. */
function applyKnownNames(text, people, bump) {
  const entries = [];
  for (const person of people) for (const name of person.names) entries.push({ name: name.normalize("NFC"), role: person.role });
  if (!entries.length) return text;
  entries.sort((a, b) => b.name.length - a.name.length);
  const roleOf = new Map();
  for (const e of entries) {
    const key = e.name.toLowerCase();
    if (!roleOf.has(key)) roleOf.set(key, e.role);
  }
  const alternation = entries.map((e) => escapeRe(e.name).replace(/ /g, "\\s+")).join("|");
  const re = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(?:${alternation})(?![\\p{L}\\p{M}\\p{N}])`, "giu");
  return text
    .split(TOKEN_SPLIT)
    .map((piece, i) => {
      if (i % 2 === 1) return piece; // an existing [token]
      return piece.replace(re, (m) => {
        const role = roleOf.get(m.normalize("NFC").replace(/\s+/g, " ").toLowerCase()) || "name";
        bump(role);
        return `[${role}]`;
      });
    })
    .join("");
}

// ── tokenizer ────────────────────────────────────────────────────────
const WORD = "\\p{L}[\\p{L}\\p{M}]*(?:['’][\\p{L}\\p{M}]+)*(?:-\\p{L}[\\p{L}\\p{M}]*(?:['’][\\p{L}\\p{M}]+)*)*";
const TOKEN_RE = new RegExp(`\\[[a-z-]+\\]|${WORD}|\\p{N}+|\\r?\\n|[^\\S\\r\\n]+|[\\s\\S]`, "gu");

function tokenize(text) {
  const toks = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const s = m[0];
    let t = "p";
    if (/^\[[a-z-]+\]$/.test(s)) t = "red";
    else if (/^\p{L}/u.test(s)) t = "word";
    else if (/^\p{N}/u.test(s)) t = "num";
    else if (/^\r?\n$/.test(s)) t = "nl";
    else if (/^\s+$/u.test(s)) t = "sp";
    toks.push({ t, text: s, s: m.index, e: m.index + s.length });
  }
  return toks;
}

function partShape(p) {
  const letters = p.replace(/['’]/g, "");
  if (/^\p{Lu}$/u.test(letters)) return "initial";
  if (/^[\p{Ll}\p{M}]+$/u.test(letters)) return "lower";
  if (/^[\p{Lu}\p{M}]+$/u.test(letters)) return "upper";
  if (/^\p{Lu}[\p{Ll}\p{M}]*(?:\p{Lu}[\p{Ll}\p{M}]+)?$/u.test(letters)) return "title";
  return "mixed";
}

const CLASS_RANK = ["nameStrong", "unknown", "eponymous", "nameWeak", "clinical", "english"];

function info(tok, safe) {
  if (tok.info) return tok.info;
  let base = tok.text;
  let possessive = false;
  const pm = /^(.*\p{L})['’][sS]$/u.exec(base);
  if (pm && pm[1].length >= 2) {
    base = pm[1];
    possessive = true;
  }
  const parts = base.split("-");
  const shapes = parts.map(partShape);
  let shape;
  if (shapes.every((s) => s === "lower")) shape = "lower";
  else if (shapes.length === 1 && shapes[0] === "initial") shape = "initial";
  else if (shapes[0] !== "initial" && shapes.every((s) => s === "title" || s === "initial")) shape = "title";
  else if (shapes.every((s) => s === "upper" || s === "initial") && shapes.some((s) => s === "upper")) shape = "upper";
  else if ((shapes[0] === "title" || shapes[0] === "upper") && shapes.slice(1).some((s) => s === "lower")) shape = "compound";
  else shape = "mixed";
  const letters = base.replace(/[^\p{L}]/gu, "").length;
  let cls;
  if (safe && (safe.has(base) || safe.has(tok.text))) cls = "safe";
  else if (CALENDAR_WORDS.has(base.toLowerCase())) cls = "english";
  else {
    const classes = parts.map((p) => wordClass(p));
    cls = CLASS_RANK.find((c) => classes.includes(c)) || "unknown";
  }
  const lower = base.toLowerCase();
  const isFunction = FUNCTION_WORDS.has(lower) || (shape === "lower" && AUXILIARIES.has(lower)) || CONTRACTION.test(tok.text);
  // Role and title words ("Patient", "Daughter", "Nurse") are cues, never names themselves.
  const isRole = RELATION_CUES.has(lower) || HONORIFICS.has(lower);
  tok.info = { base, possessive, shape, cls, letters, lower, isFunction, isRole };
  return tok.info;
}

const listCache = new Map();
/** "first", "surname" or both, for the word or any hyphen part of it. */
function nameLists(word) {
  const base = String(word).replace(/['’][sS]$/, "");
  const key = foldKey(base) + (base.includes("-") ? "-" : "");
  if (listCache.has(key)) return listCache.get(key);
  let tags = "";
  for (const p of base.includes("-") ? [base, ...base.split("-")] : [base]) {
    const f = lookup(p);
    if (f.first) tags += " first";
    if (f.surname) tags += " surname";
  }
  if (listCache.size > 50000) listCache.clear();
  listCache.set(key, tags);
  return tags;
}

// ── navigation helpers ───────────────────────────────────────────────
function nextSig(toks, i, { newline = false } = {}) {
  let j = i + 1;
  while (j < toks.length && (toks[j].t === "sp" || (newline && toks[j].t === "nl"))) j++;
  return j < toks.length ? j : -1;
}

/** Index of the next word if only spaces (and optionally one newline) separate it. */
function nextWordAfterSpace(toks, i, { allowNewline = false } = {}) {
  let j = i + 1;
  let newlines = 0;
  let spaced = false;
  while (j < toks.length && (toks[j].t === "sp" || toks[j].t === "nl")) {
    if (toks[j].t === "nl") newlines++;
    spaced = true;
    j++;
  }
  if (!spaced || j >= toks.length || toks[j].t !== "word") return -1;
  if (newlines > (allowNewline ? 1 : 0)) return -1;
  return j;
}

const OPENERS = /^["'“‘(\[«]$/;
const START_PUNCT = /^[.!?:;|/•·>*#=—–-]$/;

function boundaryBefore(toks, i) {
  let j = i - 1;
  let newline = false;
  while (j >= 0) {
    const t = toks[j];
    if (t.t === "sp") { j--; continue; }
    if (t.t === "nl") { newline = true; j--; continue; }
    if (t.t === "p" && OPENERS.test(t.text)) { j--; continue; }
    break;
  }
  if (newline || j < 0) return "start";
  const t = toks[j];
  if (t.t === "p") {
    if (START_PUNCT.test(t.text)) return "start";
    if (t.text === ",") return "comma";
  }
  return "mid";
}

function isCapShape(inf) {
  return inf.shape === "title" || inf.shape === "upper";
}

/** A clinical word that is not also an ordinary English word ("thyroiditis", "lymphoma"). */
function technicalWord(inf) {
  const f = lookup(inf.base);
  return (f.icd || f.drug) && !f.english && !f.first && !f.surname;
}

/** True when the word at i is followed by an eponym head noun or a technical clinical word. */
function eponymHeadAfter(toks, i, safe) {
  const inf = info(toks[i], safe);
  const j = nextWordAfterSpace(toks, i);
  if (j < 0) return inf.possessive && inf.cls === "eponymous";
  const nxt = info(toks[j], safe);
  if (EPONYM_HEADS.has(nxt.lower)) return true;
  if (nxt.shape === "lower" && technicalWord(nxt)) return true;
  return false;
}

function personVerbAfter(toks, i) {
  const j = nextWordAfterSpace(toks, i);
  return j >= 0 && PERSON_VERBS.has(toks[j].text.toLowerCase());
}

function numberAfter(toks, i) {
  return toks[i + 1]?.t === "sp" && toks[i + 2]?.t === "num";
}

// ── name sequence parsing ────────────────────────────────────────────
// mode: "title" (after Dr./Mrs.), "cue" (after a label, relation word or greeting),
// "lower" (a lowercase cue: lowercase name words accepted when they are on a name list),
// "titleLower" (a lowercase title: "dr smith", where a surname-list word is enough).
function acceptable(toks, i, mode, first, safe) {
  const tok = toks[i];
  if (!tok || tok.t !== "word") return false;
  const inf = info(tok, safe);
  if (inf.isFunction || inf.isRole) return false;
  // A title is person evidence that outranks the operator's safe list:
  // "Dr. Bell" is a person even when "Bell" is listed as safe.
  if (inf.cls === "safe" && !((mode === "title" || mode === "titleLower") && first)) return false;
  const named = inf.cls === "nameStrong" || inf.cls === "nameWeak" || inf.cls === "eponymous";
  if (inf.shape === "lower") {
    if ((mode !== "lower" && mode !== "titleLower") || inf.letters < 2) return false;
    // A lowercase word right before a colon is a field label ("re:", "cc:").
    if (!first && toks[i + 1]?.text === ":") return false;
    // A lowercase name needs a name list behind it: a first name after a
    // relation word ("wife maria"), any name-list word after a title ("dr smith").
    if (inf.cls === "nameStrong" || inf.cls === "eponymous") return true;
    if (inf.cls !== "nameWeak" || AUXILIARIES.has(inf.lower)) return false;
    return mode === "titleLower" || /first/.test(nameLists(tok.text));
  }
  if (!isCapShape(inf)) return false;
  if (mode !== "title" && mode !== "titleLower" && eponymHeadAfter(toks, i, safe)) return false;
  if (mode === "title" || mode === "titleLower") {
    if (first) return inf.cls !== "clinical" || named || inf.cls === "safe";
    return named || (inf.cls === "unknown" && inf.letters >= 2) || continuationWord(inf);
  }
  if (named) return true;
  if (inf.cls === "unknown" && inf.letters >= 3) return true;
  // After a first name, a capitalized ordinary word is the surname ("Pt Dana Example").
  return !first && continuationWord(inf);
}

/** A capitalized ordinary word that can be a surname when it follows a name. */
function continuationWord(inf) {
  if (inf.shape !== "title" || inf.isFunction || CALENDAR_WORDS.has(inf.lower)) return false;
  if (inf.cls !== "english" && inf.cls !== "nameWeak") return false;
  return !technicalWord(inf);
}

function isInitialAt(toks, i) {
  const tok = toks[i];
  return Boolean(tok && tok.t === "word" && /^\p{Lu}$/u.test(tok.text));
}

/**
 * Parse a person name starting at token k. Returns {start, end} token indices
 * (inclusive) or null. Reads LAST, FIRST [M] when allowComma is set.
 */
function parseName(toks, k, mode, safe, { allowComma = false } = {}) {
  if (k < 0 || k >= toks.length) return null;
  if (allowComma && acceptable(toks, k, mode, true, safe) && toks[k + 1]?.text === ",") {
    const j = nextWordAfterSpace(toks, k + 1);
    if (j > 0 && acceptable(toks, j, mode, false, safe)) {
      const firstInf = info(toks[j], safe);
      const lastInf = info(toks[k], safe);
      // Same shape ("Thorn, Inez", "THORN, INEZ"), or the record-header form
      // with the surname in capitals ("OKONKWO, Adaeze").
      if (lastInf.shape === firstInf.shape || (lastInf.shape === "upper" && firstInf.shape === "title")) {
        let end = j;
        const m = nextWordAfterSpace(toks, j);
        if (m > 0 && isInitialAt(toks, m)) end = toks[m + 1]?.text === "." ? m + 1 : m;
        return { start: k, end };
      }
    }
  }
  let i = k;
  let words = 0;
  let end = -1;
  for (let n = 0; n < 6 && i >= 0 && i < toks.length; n++) {
    const tok = toks[i];
    if (tok.t !== "word") break;
    const inf = info(tok, safe);
    if (isInitialAt(toks, i)) {
      end = toks[i + 1]?.text === "." ? i + 1 : i;
      const after = nextWordAfterSpace(toks, end);
      if (after < 0 || !(acceptable(toks, after, mode, false, safe) || isInitialAt(toks, after))) break;
      i = after;
      continue;
    }
    if (words > 0 && inf.shape === "lower" && PARTICLES.has(inf.lower)) {
      const after = nextWordAfterSpace(toks, i);
      if (after < 0 || !acceptable(toks, after, mode, false, safe)) break;
      i = after;
      continue;
    }
    if (!acceptable(toks, i, mode, words === 0, safe)) break;
    words++;
    end = i;
    if (inf.possessive) break;
    const after = nextWordAfterSpace(toks, i, { allowNewline: words === 1 && mode !== "lower" && mode !== "titleLower" });
    if (after < 0) break;
    const ai = info(toks[after], safe);
    const continues = acceptable(toks, after, mode, false, safe) || isInitialAt(toks, after) || (ai.shape === "lower" && PARTICLES.has(ai.lower));
    if (!continues) break;
    i = after;
  }
  if (end < 0 || words === 0) return null;
  return { start: k, end };
}

/** Initials written together: "T.G." or "P.H." Returns the end token index or -1. */
function initialsRun(toks, i) {
  let j = i;
  let n = 0;
  while (isInitialAt(toks, j) && toks[j + 1]?.text === ".") {
    n++;
    j += 2;
  }
  return n >= 2 ? j - 1 : -1;
}

// ── cue detection ────────────────────────────────────────────────────
function phraseAt(toks, i, phrase) {
  const words = phrase.split(" ");
  let j = i;
  for (let w = 0; w < words.length; w++) {
    if (!toks[j] || toks[j].t !== "word" || toks[j].text.toLowerCase().replace(/’/g, "'") !== words[w]) return -1;
    if (w < words.length - 1) {
      if (toks[j + 1]?.t !== "sp") return -1;
      j += 2;
    }
  }
  return j;
}

function afterCuePunct(toks, i, chars) {
  let j = nextSig(toks, i);
  if (j >= 0 && toks[j].t === "p" && chars.includes(toks[j].text)) j = nextSig(toks, j, { newline: true });
  return j;
}

const HEAD_PHRASES = [...FACILITY_HEADS].sort((a, b) => b.length - a.length);

/** Decide every word: "name", "keep", "review" or undecided (null). */
function classify(text, safe, nameTokens = new Set(["[name]"])) {
  const toks = tokenize(text);
  const isNameToken = (t) => Boolean(t && t.t === "red" && nameTokens.has(t.text));
  const decided = new Array(toks.length).fill(null);
  const spans = [];
  const reasons = new Map();
  const mark = (a, b, d, reason) => {
    for (let x = a; x <= b; x++) if (toks[x].t === "word" && !decided[x]) decided[x] = d;
    if (d === "name") spans.push({ start: a, end: b, reason });
  };
  const free = (a, b) => {
    for (let x = a; x <= b; x++) if (decided[x]) return false;
    return true;
  };
  const tryName = (k, mode, opts, reason) => {
    const span = parseName(toks, k, mode, safe, opts);
    if (span && free(span.start, span.end)) {
      mark(span.start, span.end, "name", reason);
      return true;
    }
    return false;
  };
  const review = (i, reason) => {
    decided[i] = "review";
    reasons.set(i, reason);
  };

  // 1. Titles.
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t !== "word" || decided[i]) continue;
    const low = toks[i].text.toLowerCase();
    if (!HONORIFICS.has(low)) continue;
    const isLower = toks[i].text === low;
    if (isLower && !LOWERCASE_TITLES.has(low)) continue; // "nurse line" is not a title
    let j = i + 1;
    if (toks[j]?.text === ".") j++;
    if (toks[j]?.t !== "sp") continue;
    if (tryName(j + 1, isLower ? "titleLower" : "title", {}, "title")) decided[i] = "keep";
  }

  // 2. Cues.
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    if (tok.t !== "word" || decided[i]) continue;
    const low = tok.text.toLowerCase().replace(/’/g, "'");
    const mode = tok.text === tok.text.toLowerCase() ? "lower" : "cue";
    for (const label of LABEL_CUES) {
      const end = phraseAt(toks, i, label);
      if (end < 0) continue;
      const colon = nextSig(toks, end);
      if (colon < 0 || toks[colon].text !== ":") continue;
      const k = nextSig(toks, colon, { newline: true });
      if (k >= 0 && toks[k].t === "word") {
        const run = initialsRun(toks, k);
        const kMode = toks[k].text === toks[k].text.toLowerCase() ? "lower" : "cue";
        if (run > 0) { if (free(k, run)) mark(k, run, "name", "label"); }
        else tryName(k, kMode, { allowComma: true }, "label");
      }
      break;
    }
    if (RELATION_CUES.has(low) && !info(tok, safe).possessive) {
      const k = afterCuePunct(toks, i, [",", ":", "(", "-", "—"]);
      if (k >= 0 && toks[k].t === "word") {
        const run = initialsRun(toks, k);
        if (run > 0) { if (free(k, run)) mark(k, run, "name", "relation"); }
        else tryName(k, mode, {}, "relation");
      }
    }
    if (GREETINGS.has(low)) {
      const k = afterCuePunct(toks, i, [","]);
      if (k >= 0 && toks[k].t === "word") tryName(k, mode, {}, "greeting");
    }
    for (const phrase of SIGNOFFS) {
      const end = phraseAt(toks, i, phrase);
      if (end < 0) continue;
      const k = afterCuePunct(toks, end, [",", "!", "."]);
      if (k >= 0 && toks[k].t === "word") {
        const span = parseName(toks, k, toks[k].text === toks[k].text.toLowerCase() ? "lower" : "cue", safe, {});
        if (span && free(span.start, span.end)) {
          const after = nextSig(toks, span.end);
          const closes = after < 0 || ["nl", "p", "red"].includes(toks[after].t) || ["and", "for"].includes(toks[after].text.toLowerCase());
          if (closes) mark(span.start, span.end, "name", "signoff");
        }
      }
      break;
    }
    for (const phrase of INTRO_PHRASES) {
      const end = phraseAt(toks, i, phrase);
      if (end < 0) continue;
      const k = nextSig(toks, end);
      if (k >= 0 && toks[k].t === "word") {
        const inf = info(toks[k], safe);
        const nxt = nextWordAfterSpace(toks, k);
        const strong =
          inf.cls === "nameStrong" ||
          (inf.cls === "unknown" && inf.letters >= 3 && isCapShape(inf)) ||
          (isCapShape(inf) && (inf.cls === "nameWeak" || inf.cls === "eponymous") && nxt > 0 && acceptable(toks, nxt, "cue", false, safe));
        if (strong) tryName(k, inf.shape === "lower" ? "lower" : "cue", {}, "intro");
      }
      break;
    }
  }
  // Dash sign-off at the start of a line: "-- Inez".
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t !== "p" || !/^[-—–]$/.test(toks[i].text)) continue;
    if (boundaryBefore(toks, i) !== "start") continue;
    let j = i;
    while (toks[j + 1]?.t === "p" && /^[-—–]$/.test(toks[j + 1].text)) j++;
    const k = nextSig(toks, j);
    if (k >= 0 && toks[k].t === "word") tryName(k, "cue", {}, "signoff");
    i = j;
  }

  // 3. Facilities: proper modifiers + facility type.
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t !== "word" || decided[i] || !isCapShape(info(toks[i], safe))) continue;
    let headEnd = -1;
    for (const h of HEAD_PHRASES) {
      const e = phraseAt(toks, i, h);
      if (e >= 0) { headEnd = e; break; }
    }
    if (headEnd < 0) continue;
    let start = i;
    let nameLike = false; // a modifier that is not an ordinary English word ("Mercy", "Okafor")
    const plainModifiers = []; // ordinary English words that may or may not be a name ("Riverside")
    let j = i;
    for (let n = 0; n < 4; n++) {
      if (toks[j - 1]?.t !== "sp") break;
      let m = j - 2;
      if (toks[m]?.text === "." && /^(St|Ste)$/.test(toks[m - 1]?.text || "")) m -= 1;
      const t = toks[m];
      if (!t || t.t !== "word" || decided[m]) break;
      const mi = info(t, safe);
      if (!isCapShape(mi) || mi.isFunction || REFERENCE_MODIFIERS.has(mi.lower)) break;
      if (mi.cls === "english" && /(?:ed|ing)$/.test(mi.lower)) break;
      // A service word (a clinical vocabulary word on no name list: "Diabetes
      // Center", "Wound Clinic") says what the facility does, not which one it
      // is. A clinical word that is also a name ("Valley", "Pain") or an
      // ordinary word ("Riverside") could be either, so it goes to review.
      const f = lookup(mi.base);
      const generic = SERVICE_MODIFIERS.has(mi.lower) || HEAD_PHRASES.includes(mi.lower) || mi.cls === "clinical";
      if (!generic) {
        if (mi.cls === "english" || f.drug || f.icd) plainModifiers.push(m);
        else nameLike = true;
      }
      start = m;
      j = m;
    }
    if (start === i) continue;
    if (!nameLike) {
      // Only ordinary words before the facility type: "Riverside Clinic" is a
      // facility name, "Sunday Clinic" is not, and the word lists cannot tell
      // them apart. The words go to review.
      for (const m of plainModifiers) if (!decided[m]) review(m, "ordinary word before a facility type (possible facility name)");
      continue;
    }
    let end = headEnd;
    const nx = nextWordAfterSpace(toks, end);
    if (nx > 0) {
      for (const h of HEAD_PHRASES) {
        const e = phraseAt(toks, nx, h);
        if (e >= 0) { end = e; break; }
      }
    }
    if (free(start, end)) mark(start, end, "name", "facility");
  }

  // 4. Initial + surname: "J. Smith", "A. B. Ng".
  for (let i = 0; i < toks.length; i++) {
    if (decided[i] || !isInitialAt(toks, i) || toks[i + 1]?.text !== ".") continue;
    let j = i;
    while (toks[j + 2]?.t === "sp" && isInitialAt(toks, j + 3) && toks[j + 4]?.text === ".") j += 3;
    // One ordinary space: "B.        MRN" across a column gap is not "J. Smith".
    if (toks[j + 2]?.t !== "sp" || toks[j + 2].text.length > 2) continue;
    const k = j + 3;
    const t = toks[k];
    if (!t || t.t !== "word" || decided[k]) continue;
    const inf = info(t, safe);
    if (!isCapShape(inf) || inf.isFunction || inf.cls === "safe" || inf.cls === "clinical" || inf.cls === "english") continue;
    // A short capitals word on no name list ("MRN", "DOB") or a word before a
    // colon is a field label, not a surname.
    if (inf.shape === "upper" && inf.letters <= 4 && !/surname/.test(nameLists(t.text))) continue;
    if (nextSig(toks, k) >= 0 && toks[nextSig(toks, k)].text === ":") continue;
    if (eponymHeadAfter(toks, k, safe)) continue;
    const dotted = toks.slice(i, j + 2).map((x) => x.text).join("").toLowerCase();
    if (DOTTED_ABBREVIATIONS.has(dotted)) continue;
    // A name-like word right before the initial is the first name: "Bríd W. Nurlanovna".
    let start = i;
    const p = i - 2;
    if (toks[i - 1]?.t === "sp" && toks[p]?.t === "word" && !decided[p]) {
      const pi = info(toks[p], safe);
      const firstName = pi.cls === "unknown" || pi.cls === "nameStrong" || ((pi.cls === "nameWeak" || pi.cls === "eponymous") && /first/.test(nameLists(toks[p].text)));
      if (isCapShape(pi) && pi.shape === inf.shape && !pi.isFunction && !pi.isRole && pi.letters >= 2 && firstName) start = p;
    }
    if (free(start, k)) mark(start, k, "name", "initial");
  }

  // 5. Eponyms with a clinical head noun are clinical vocabulary.
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t !== "word" || decided[i] || !isCapShape(info(toks[i], safe))) continue;
    if (eponymHeadAfter(toks, i, safe)) decided[i] = "keep";
  }

  // 6. First name + surname, with or without a middle initial, or LAST, FIRST.
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t !== "word" || decided[i]) continue;
    const a = info(toks[i], safe);
    if (!isCapShape(a) || a.isFunction || a.cls === "safe") continue;
    if (toks[i + 1]?.text === ",") {
      const j = nextWordAfterSpace(toks, i + 1);
      if (j > 0 && !decided[j]) {
        const b = info(toks[j], safe);
        const lastOk = /surname/.test(nameLists(toks[i].text)) && a.cls !== "clinical";
        const firstOk = /first/.test(nameLists(toks[j].text)) && (b.cls === "nameStrong" || a.cls === "nameStrong");
        if (lastOk && firstOk && a.shape === b.shape && isCapShape(b)) {
          mark(i, j, "name", "last-first");
          continue;
        }
      }
    }
    const onFirstList = /first/.test(nameLists(toks[i].text));
    const calendarName = CALENDAR_WORDS.has(a.lower) && onFirstList; // "June Park"
    // Any word on the first-name list can open a pair, including one that is
    // also an ordinary or clinical word ("Grace Okafor", "Brian Oduya").
    const firstLike = a.cls === "unknown" ? a.letters >= 3 : (["nameStrong", "nameWeak", "eponymous"].includes(a.cls) && onFirstList) || calendarName;
    if (!firstLike) continue;
    let j = nextWordAfterSpace(toks, i);
    if (j > 0 && isInitialAt(toks, j) && toks[j + 1]?.text === ".") j = nextWordAfterSpace(toks, j + 1);
    if (j < 0 || decided[j]) continue;
    const b = info(toks[j], safe);
    const surnameLike =
      isCapShape(b) && b.shape === a.shape && !b.isFunction && b.cls !== "clinical" && b.cls !== "safe" &&
      !eponymHeadAfter(toks, j, safe) &&
      ((b.cls !== "english" && /surname/.test(nameLists(toks[j].text))) ||
        (b.cls === "unknown" && b.letters >= 3 && (a.cls === "unknown" || onFirstList)) ||
        // A first name that is not an ordinary word, then a capitalized word: "Dana Example".
        (a.cls === "nameStrong" && onFirstList && continuationWord(b)));
    if (!surnameLike) continue;
    let end = j;
    const k = nextWordAfterSpace(toks, j);
    if (k > 0 && !decided[k]) {
      const c = info(toks[k], safe);
      if (isCapShape(c) && c.shape === a.shape && c.cls !== "clinical" && c.cls !== "english" && c.cls !== "safe" && (/surname/.test(nameLists(toks[k].text)) || c.cls === "unknown") && !eponymHeadAfter(toks, k, safe)) end = k;
    }
    if (free(i, end)) mark(i, end, "name", "pair");
  }

  // 7. Runs of adjacent capitals holding ordinary or clinical words are
  //    headings or terms ("Glasgow Coma Scale", "Prior Authorization Request").
  //    A word already kept (an eponym before its head noun) still counts.
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t !== "word" || (decided[i] && decided[i] !== "keep") || !isCapShape(info(toks[i], safe))) continue;
    const run = [i];
    let j = i;
    for (;;) {
      const k = nextWordAfterSpace(toks, j);
      if (k < 0 || (decided[k] && decided[k] !== "keep") || !isCapShape(info(toks[k], safe))) break;
      run.push(k);
      j = k;
    }
    if (run.length < 2) continue;
    // Two or more ordinary, clinical or ambiguous words make the run a heading.
    // These do not count as evidence:
    //   - the first word at a sentence or line start, whose capital comes from
    //     its position ("Called Price back", "Spoke Jones")
    //   - a word on the first-name list ("Gave Grace", "Escalated Brian")
    const atStart = boundaryBefore(toks, i) === "start";
    const plain = run.filter((x, n) => {
      if (decided[x] === "keep") return true;
      if (n === 0 && atStart) return false;
      const c = info(toks[x], safe);
      if ((c.cls === "nameWeak" || c.cls === "eponymous") && /first/.test(nameLists(toks[x].text))) return false;
      return ["english", "clinical", "eponymous", "nameWeak", "safe"].includes(c.cls);
    });
    if (plain.length >= 2) for (const x of run) if (!decided[x]) decided[x] = "keep";
    i = j;
  }

  // 8. Single words.
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    if (tok.t !== "word" || decided[i]) continue;
    const inf = info(tok, safe);
    if (inf.cls === "safe" || inf.isFunction || inf.isRole) continue;
    // Facility types and service words are common nouns ("Pulmonology", "Clinic").
    if (HEAD_PHRASES.includes(inf.lower) || SERVICE_MODIFIERS.has(inf.lower)) continue;
    if (inf.shape === "lower") {
      if (inf.cls === "nameStrong" && inf.letters >= 3 && /first/.test(nameLists(tok.text))) {
        // "tanya called": a first name that is not an ordinary word, as the subject of a person verb.
        if (personVerbAfter(toks, i)) mark(i, i, "name", "lowercase first name before a person verb");
        else review(i, "lowercase word that is on the first-name list");
      } else if (inf.cls === "nameWeak" && !AUXILIARIES.has(inf.lower) && /first/.test(nameLists(tok.text)) && personVerbAfter(toks, i) && boundaryBefore(toks, i) !== "mid") {
        // "grace reported pain": an ordinary word that is also a first name,
        // opening a clause as the subject of a person verb.
        mark(i, i, "name", "lowercase first name before a person verb");
      }
      continue;
    }
    if (inf.shape === "upper") {
      if (inf.cls === "nameStrong" && inf.letters >= 4 && !inf.base.includes("-")) review(i, "all-capitals word that is on a name list");
      continue;
    }
    if (inf.shape !== "title") continue;
    const pos = boundaryBefore(toks, i);
    const person = personVerbAfter(toks, i);
    const number = numberAfter(toks, i);
    const lists = nameLists(tok.text);
    // Next to a person token, a name-shaped word is part of that name: "Avery
    // [patient]", "Bríd [name]".
    const nextTok = toks[i + 1]?.t === "sp" ? toks[i + 2] : null;
    const prevTok = toks[i - 1]?.t === "sp" ? toks[i - 2] : null;
    if ((isNameToken(nextTok) || isNameToken(prevTok)) && inf.cls !== "english" && inf.cls !== "clinical" && inf.letters >= 2) {
      mark(i, i, "name", "next to a person token");
      continue;
    }
    // A field label: a capitalized word right before a colon or a non-person
    // redaction token ("Fax:", "Email [email]"), unless it is a first name.
    const after = nextSig(toks, i);
    if (after >= 0 && (toks[after].text === ":" || (toks[after].t === "red" && !isNameToken(toks[after]))) && !/first/.test(lists)) continue;
    switch (inf.cls) {
      case "clinical":
      case "english":
        break;
      case "eponymous":
        // Not an ordinary English word, so its capital is not explained by the
        // sentence start alone: without a clinical head noun after it, it could
        // be the name or the term ("Parkinson's is worse", "Brian's wife called").
        if (person) mark(i, i, "name", "person verb");
        else review(i, "clinical term that is also a name");
        break;
      case "nameWeak": {
        if (person) { mark(i, i, "name", "person verb"); break; }
        if (pos === "start" && inf.possessive) { review(i, "possessive of a word that is also a name"); break; }
        if (pos === "start") {
          const c = nextSig(toks, i);
          const w = c >= 0 && toks[c].text === "," ? nextWordAfterSpace(toks, c) : -1;
          if (w > 0 && !decided[w] && isCapShape(info(toks[w], safe)) && ["nameStrong", "unknown"].includes(info(toks[w], safe).cls)) mark(i, i, "name", "name list");
          break;
        }
        review(i, "word that is both a name and an ordinary word");
        break;
      }
      case "nameStrong":
        if (number) review(i, "name-list word before a number");
        else if (person) mark(i, i, "name", "person verb");
        else if (pos === "start" && !/first/.test(lists) && !lookup(inf.base).commonSurname) review(i, "rare surname at a sentence or field start");
        else mark(i, i, "name", "name list");
        break;
      default: // unknown
        if (inf.letters < 3) break;
        if (number) break; // a measurement name before its value ("Ferritin 12", "QTc 478")
        else if (person) mark(i, i, "name", "person verb");
        else if (pos === "mid") mark(i, i, "name", "unrecognized capitalized word");
        else review(i, pos === "start" ? "unrecognized capitalized word at a sentence or field start" : "unrecognized capitalized word in a list");
    }
  }
  return { toks, decided, spans, reasons };
}

/**
 * Apply the NAME tier to one prose segment.
 * @param {string} text
 * @param {object} opts
 * @param {{people:Array,safe:Set<string>}} opts.map   normalized people map
 * @param {boolean} [opts.unknownNames=false]          run the unknown-name pass
 * @returns {{ text: string, hits: Array<{tier:"name", type:string, count:number}> }}
 */
export function applyNames(text, { map, unknownNames = false } = {}) {
  if (typeof text !== "string" || !text) return { text, hits: [] };
  const { people, safe } = map || { people: [], safe: new Set() };
  const counts = new Map();
  const bump = (type) => counts.set(type, (counts.get(type) || 0) + 1);
  let out = applyKnownNames(text, people || [], bump);

  if (unknownNames) {
    const { toks, spans } = classify(out, safe, nameTokensFor({ people }));
    spans.sort((a, b) => toks[a.start].s - toks[b.start].s);
    let rebuilt = "";
    let cursor = 0;
    for (const sp of spans) {
      const s = toks[sp.start].s;
      let e = toks[sp.end].e;
      const last = toks[sp.end];
      if (last.t === "word" && info(last, safe).possessive) e = last.s + info(last, safe).base.length;
      if (s < cursor) continue;
      rebuilt += out.slice(cursor, s) + "[name]";
      cursor = e;
      bump("name");
    }
    out = rebuilt + out.slice(cursor);
  }
  const hits = [...counts.entries()].map(([type, count]) => ({ tier: "name", type, count }));
  return { text: out, hits };
}

const COMMON_DOTTED = new Set(["u.s.", "u.s.a.", "u.k.", "a.m.", "p.m.", "e.g.", "i.e.", "d.c.", "m.d.", "r.n.", "n.p.", "p.a.", "d.o.", "e.d.", "o.r.", "i.v.", "p.o."]);

/**
 * Words in already-redacted text that the unknown-name pass would still remove
 * or could not decide. Used by the residual scan. Offsets are into `text`.
 * @returns {Array<{start:number,end:number,check:string,reason:string}>}
 */
export function nameReviewSpans(text, { safe = new Set(), nameTokens } = {}) {
  if (typeof text !== "string" || !text) return [];
  const { toks, decided, spans, reasons } = classify(text, safe, nameTokens);
  const out = [];
  for (const sp of spans) out.push({ start: toks[sp.start].s, end: toks[sp.end].e, check: "names", reason: "name-shaped words left in the output" });
  for (let i = 0; i < toks.length; i++) {
    if (decided[i] === "review") out.push({ start: toks[i].s, end: toks[i].e, check: "names", reason: reasons.get(i) || "possible name" });
  }
  for (let i = 0; i < toks.length; i++) {
    const end = initialsRun(toks, i);
    if (end < 0) continue;
    const dotted = toks.slice(i, end + 1).map((t) => t.text).join("").toLowerCase();
    if (!COMMON_DOTTED.has(dotted) && !decided[i]) out.push({ start: toks[i].s, end: toks[end].e, check: "names", reason: "initials" });
    i = end;
  }
  return out.sort((a, b) => a.start - b.start);
}

export default { applyNames, normalizePeopleMap, nameReviewSpans, nameTokensFor };
