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
