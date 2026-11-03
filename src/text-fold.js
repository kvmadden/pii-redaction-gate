// text-fold.js: one folding rule shared by the lexicon builder and the runtime.
//
// Pure: no I/O. A word is folded to a lookup key by removing diacritics,
// lowercasing, and keeping only the letters a to z. "Núñez" and "NUNEZ" both
// fold to "nunez". "O'Brien" folds to "obrien", the form the Census lists use.

export function foldKey(word) {
  return String(word)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

// Latin letters grouped by their base letter, for accent-insensitive matching
// of people-map names: "e" covers e, é, è, ê, ë, ē and the rest. Letters that
// do not decompose (ø, đ, ł, ı) are added by hand.
const SAME_BASE = (() => {
  const table = {};
  for (let cp = 0x41; cp <= 0x24f; cp++) {
    if (cp > 0x7a && cp < 0xc0) continue;
    const ch = String.fromCodePoint(cp);
    const base = ch.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
    if (/^[a-z]$/.test(base)) table[base] = (table[base] || "") + ch;
  }
  for (const [base, extra] of [["o", "øØ"], ["d", "đĐ"], ["l", "łŁ"], ["i", "ı"]]) table[base] += extra;
  return table;
})();

/**
 * Regular-expression source that matches a name with or without accents, in
 * either case, in composed or decomposed text. Spaces match any whitespace.
 * Use with the "iu" flags.
 */
export function accentPattern(name) {
  let out = "";
  const odd = { "ø": "o", "đ": "d", "ł": "l", "ı": "i" };
  for (const ch of String(name).normalize("NFD").replace(/\p{M}+/gu, "")) {
    const lower = ch.toLowerCase();
    const base = odd[lower] || lower;
    if (SAME_BASE[base]) out += `[${SAME_BASE[base]}]\\p{M}*`;
    else if (/\s/.test(ch)) out += "\\s+";
    // Escape regular-expression syntax characters only: in a "u" pattern an
    // escaped hyphen outside a class is a syntax error ("Vega-Henriquez").
    else out += ch.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  }
  return out;
}

/** Comparison key for a matched name: accents removed, lowercase, spaces single. */
export function accentKey(name) {
  return String(name).normalize("NFKD").replace(/\p{M}+/gu, "").replace(/[øØ]/g, "o").replace(/[đĐ]/g, "d").replace(/[łŁ]/g, "l").replace(/ı/g, "i").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Front-code a sorted list of folded words into one compact string. */
export function frontCode(words) {
  const sorted = [...new Set(words)].filter(Boolean).sort();
  let prev = "";
  let out = "";
  for (const w of sorted) {
    let k = 0;
    const max = Math.min(prev.length, w.length, 35);
    while (k < max && prev[k] === w[k]) k++;
    // Prefix length is one character from 0-9 then A-Z, never a lowercase letter.
    out += (k < 10 ? String.fromCharCode(48 + k) : String.fromCharCode(55 + k)) + w.slice(k);
    prev = w;
  }
  return out;
}

/** Decode a front-coded string back into a Set of words. */
export function frontDecode(encoded) {
  const set = new Set();
  let prev = "";
  let i = 0;
  while (i < encoded.length) {
    const c = encoded.charCodeAt(i);
    const k = c <= 57 ? c - 48 : c - 55;
    let j = i + 1;
    while (j < encoded.length) {
      const d = encoded.charCodeAt(j);
      if (d < 97 || d > 122) break;
      j++;
    }
    const w = prev.slice(0, k) + encoded.slice(i + 1, j);
    set.add(w);
    prev = w;
    i = j;
  }
  return set;
}
