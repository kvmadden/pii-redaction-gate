// eval/fresh/measure.mjs: score engine outputs against a verified set.
//
// An engine returns, for each document, { text, status, review } where text is
// the input with some substrings replaced by bracket tokens, status is
// "clean", "review" or "blocked", and review lists output spans a person must
// look at. Engines with no status (Presidio, the two bounds) are "clean": what
// they return is what would be sent.
//
// Every measure counts letters and digits only (Unicode \p{L} and \p{N}).
// For each labeled span:
//   removed  every letter and digit of the span is gone from the output
//   partial  some are gone
//   missed   none are gone
// A mention is LEFT when it is partial or missed. An output that cannot be
// aligned to its input is scored by text search instead, read cautiously (a
// span counts as removed only when no word of it is left anywhere), and the
// number of such documents is reported.
//
// Measures (docs/fresh-test-spec.md, section 5), each with counts, a
// denominator and a Wilson 95% interval:
//   silentLeaks        identifier mentions left in documents marked clean, out
//                      of identifier mentions in documents that were sent
//   cleanDocsWithLeak  clean documents that still hold an identifier, out of
//                      clean documents
//   fullRemoval        identifier mentions removed, out of mentions sent
//   caughtByReview     mentions left in documents marked review
//   caughtAtSpan       mentions left with a review span on what remains (a
//                      stricter reading: one review span elsewhere does not count)
//   reviewShare        documents marked review, out of all documents
//   reviewNothingLeft  review documents with no identifier left, out of review
//                      documents (the review burden that found nothing)
//   keepIntact         KEEP spans with no letter or digit removed, out of KEEP
//                      spans in documents that were sent
//   otherKept          other not-identifier spans (ages under 90, years) intact
//   blocked            documents blocked, out of all documents. Their mentions
//                      are reported as withheld, not as removed or left.
//   overRemoval        letters and digits removed outside identifier spans, out
//                      of letters and digits outside identifier spans

const Z = 1.959963984540054;

/** Wilson score interval for k of n. */
export function wilson(k, n) {
  if (!n) return { k, n, rate: null, low: null, high: null };
  const p = k / n;
  const z2 = Z * Z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const half = (Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  const r = (x) => Math.round(x * 1e6) / 1e6;
  return { k, n, rate: r(p), low: r(Math.max(0, center - half)), high: r(Math.min(1, center + half)) };
}

const TOKEN = /\[([a-z0-9][a-z0-9-]*)\]/g;

/**
 * Align an output to its input. The output is the input with some substrings
 * replaced by tokens the engine writes (isToken decides). Literal pieces are
 * placed at their earliest position that leaves each replaced span at least
 * one character, which is the leftmost alignment, and the result is checked
 * by rebuilding the output. Returns null when no alignment exists.
 * @returns {null | { removed: Uint8Array, outPos: Int32Array }} per input index:
 *   removed[i] = 1 when the character was replaced, outPos[i] = its output index (or -1)
 */
export function alignOutput(input, output, isToken) {
  const removed = new Uint8Array(input.length);
  const outPos = new Int32Array(input.length).fill(-1);
  if (output === input) {
    for (let i = 0; i < input.length; i++) outPos[i] = i;
    return { removed, outPos };
  }
  const pieces = [];
  const pieceAt = [];
  const tokens = [];
  let last = 0;
  for (const m of output.matchAll(TOKEN)) {
    if (!isToken(m[1])) continue;
    pieces.push(output.slice(last, m.index));
    pieceAt.push(last);
    tokens.push(m[0]);
    last = m.index + m[0].length;
  }
  pieces.push(output.slice(last));
  pieceAt.push(last);
  if (!tokens.length) return null;
  const n = tokens.length;
  if (!input.startsWith(pieces[0]) || !input.endsWith(pieces[n])) return null;
  const tailStart = input.length - pieces[n].length;
  const starts = [0];
  let cur = pieces[0].length;
  for (let k = 1; k < n; k++) {
    const at = input.indexOf(pieces[k], cur + 1);
    if (at < 0 || at + pieces[k].length > tailStart - 1) return null;
    starts.push(at);
    cur = at + pieces[k].length;
  }
  if (tailStart < cur + 1) return null;
  starts.push(tailStart);
  // Literal pieces keep their characters, the gaps between them were replaced.
  for (let k = 0; k <= n; k++) {
    for (let j = 0; j < pieces[k].length; j++) outPos[starts[k] + j] = pieceAt[k] + j;
    if (k < n) for (let i = starts[k] + pieces[k].length; i < starts[k + 1]; i++) removed[i] = 1;
  }
  let rebuilt = "";
  for (let k = 0; k <= n; k++) rebuilt += pieces[k] + (k < n ? tokens[k] : "");
  return rebuilt === output ? { removed, outPos } : null;
}

// Case, width and accents are folded away before a text search, so an engine
// that changes them gets no credit for it.
const fold = (s) => s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
const words = (s) => s.match(/[\p{L}\p{N}]+/gu) || [];

/**
 * Fallback when no alignment exists, read the cautious way. A span is missed
 * when its text is still in the output, partial when any word of it (two or
 * more letters or digits) is still anywhere in the output, and removed only
 * when neither is true.
 */
function searchScore(input, output) {
  const folded = fold(output);
  const left = new Set(words(folded));
  return {
    removed: null,
    outPos: null,
    byText(start, end) {
      const value = fold(input.slice(start, end));
      if (folded.includes(value)) return "missed";
      return words(value).some((w) => [...w].length >= 2 && left.has(w)) ? "partial" : "removed";
    },
  };
}

/** Indices of letters and digits in [start, end), one per code point. */
function alnumIndices(text, start, end) {
  const out = [];
  for (let i = start; i < end; i++) {
    const c = text.codePointAt(i);
    const ch = String.fromCodePoint(c);
    if (/[\p{L}\p{N}]/u.test(ch)) out.push(i);
    if (c > 0xffff) i++;
  }
  return out;
}

function spanState(text, sp, aligned) {
  if (aligned.byText) return aligned.byText(sp.start, sp.end);
  const idx = alnumIndices(text, sp.start, sp.end);
  const gone = idx.filter((i) => aligned.removed[i]).length;
  return gone === idx.length ? "removed" : gone === 0 ? "missed" : "partial";
}

/** A left mention is caught at the span when a review span covers what remains of it. */
function flaggedAt(text, sp, aligned, review) {
  if (!review.length || aligned.byText) return false;
  const kept = alnumIndices(text, sp.start, sp.end).filter((i) => !aligned.removed[i]).map((i) => aligned.outPos[i]);
  return kept.some((o) => review.some((r) => o >= r.start && o < r.end));
}

function emptyTally() {
  return {
    documents: 0, sent: 0, clean: 0, review: 0, blocked: 0, cleanWithLeak: 0, reviewNothingLeft: 0, searchScored: 0,
    mentions: 0, removed: 0, partial: 0, missed: 0, leftInClean: 0, leftInReview: 0, leftAtReviewSpan: 0, withheld: 0,
    keep: 0, keepIntact: 0, keepWithheld: 0, other: 0, otherIntact: 0, outsideChars: 0, outsideRemoved: 0,
  };
}

function rates(t) {
  return {
    silentLeaks: wilson(t.leftInClean, t.mentions),
    cleanDocsWithLeak: wilson(t.cleanWithLeak, t.clean),
    fullRemoval: wilson(t.removed, t.mentions),
    caughtByReview: wilson(t.leftInReview, t.mentions),
    caughtAtSpan: wilson(t.leftAtReviewSpan, t.mentions),
    reviewShare: wilson(t.review, t.documents),
    reviewNothingLeft: wilson(t.reviewNothingLeft, t.review),
    keepIntact: wilson(t.keepIntact, t.keep),
    otherKept: wilson(t.otherIntact, t.other),
    blocked: wilson(t.blocked, t.documents),
    overRemoval: wilson(t.outsideRemoved, t.outsideChars),
  };
}

/**
 * Score one engine's outputs on a verified set.
 * @param {ReturnType<import("./set.mjs").loadSet>} set
 * @param {Map<string, {text:string, status?:string, review?:Array<{start:number,end:number}>}>} outputs  by document id
 * @param {(inner: string) => boolean} [isToken]  which bracket words this engine writes,
 *   when an output does not carry its own isToken
 */
export function scoreOutputs(set, outputs, isToken = () => true) {
  const overall = emptyTally();
  const byType = new Map();
  const byKind = new Map();
  const tallyOf = (map, key) => {
    if (!map.has(key)) map.set(key, emptyTally());
    return map.get(key);
  };
  const documents = [];
  for (const doc of set.documents) {
    const out = outputs.get(doc.id);
    if (!out || typeof out.text !== "string") throw new Error(`engine produced no output for ${doc.id}`);
    const status = out.status === "review" || out.status === "blocked" ? out.status : "clean";
    const kindT = tallyOf(byKind, doc.kind);
    for (const t of [overall, kindT]) {
      t.documents++;
      t[status]++;
      if (status !== "blocked") t.sent++;
    }
    const record = { id: doc.id, kind: doc.kind, status, left: [], keepDamaged: 0, scoredBy: "alignment" };
    if (status === "blocked") {
      for (const sp of doc.spans) {
        for (const t of [overall, kindT, tallyOf(byType, sp.type)]) {
          if (sp.policy === "identifier") t.withheld++;
          else if (sp.type === "KEEP") t.keepWithheld++;
        }
      }
      documents.push(record);
      continue;
    }
    let aligned = alignOutput(doc.text, out.text, out.isToken || isToken);
    if (!aligned) {
      aligned = searchScore(doc.text, out.text);
      record.scoredBy = "text search";
      overall.searchScored++;
      kindT.searchScored++;
    }
    const review = Array.isArray(out.review) ? out.review : [];
    let leftHere = 0;
    for (const sp of doc.spans) {
      const typeT = tallyOf(byType, sp.type);
      const state = spanState(doc.text, sp, aligned);
      if (sp.policy === "identifier") {
        const left = state !== "removed";
        const atSpan = left && status === "review" && flaggedAt(doc.text, sp, aligned, review);
        for (const t of [overall, kindT, typeT]) {
          t.mentions++;
          t[state]++;
          if (left && status === "clean") t.leftInClean++;
          if (left && status === "review") t.leftInReview++;
          if (atSpan) t.leftAtReviewSpan++;
        }
        if (left) {
          leftHere++;
          record.left.push({ type: sp.type, state, flaggedAtSpan: atSpan });
        }
      } else {
        const intact = state === "missed";
        if (sp.type === "KEEP") {
          for (const t of [overall, kindT, typeT]) {
            t.keep++;
            if (intact) t.keepIntact++;
          }
          if (!intact) record.keepDamaged++;
        } else {
          for (const t of [overall, kindT, typeT]) {
            t.other++;
            if (intact) t.otherIntact++;
          }
        }
      }
    }
    if (aligned.removed) {
      const inside = new Uint8Array(doc.text.length);
      for (const sp of doc.spans) if (sp.policy === "identifier") for (let i = sp.start; i < sp.end; i++) inside[i] = 1;
      for (const i of alnumIndices(doc.text, 0, doc.text.length)) {
        if (inside[i]) continue;
        overall.outsideChars++;
        kindT.outsideChars++;
        if (aligned.removed[i]) {
          overall.outsideRemoved++;
          kindT.outsideRemoved++;
        }
      }
    }
    for (const t of [overall, kindT]) {
      if (status === "clean" && leftHere > 0) t.cleanWithLeak++;
      if (status === "review" && leftHere === 0) t.reviewNothingLeft++;
    }
    documents.push(record);
  }
  const withRates = (t) => ({ counts: t, rates: rates(t) });
  return {
    overall: withRates(overall),
    byType: Object.fromEntries([...byType.entries()].sort().map(([k, t]) => [k, withRates(t)])),
    byKind: Object.fromEntries([...byKind.entries()].sort().map(([k, t]) => [k, withRates(t)])),
    documents,
  };
}

export default { wilson, alignOutput, scoreOutputs };
