// eval/score.js — scoring for the labeled evaluation set. Pure functions.
//
// Method
//   1. Locate every gold PII span and hard-negative span in the input.
//   2. Run the redactor and ALIGN its output back to the input: the output is
//      the input with some substrings replaced by typed tokens ([phone],
//      [name], …), so splitting the output on tokens and matching the literal
//      pieces back in order recovers exactly which input characters were
//      redacted and under which token. The alignment is verified by
//      rebuilding the output from the spans.
//   3. Score on alphanumeric characters only (spaces and punctuation inside a
//      span do not count either way).
//      - A gold entity is FULL if every alphanumeric char was redacted,
//        PARTIAL if some were, MISSED if none were. Recall counts FULL only.
//      - A hard negative is DAMAGED if any alphanumeric char was redacted.
//      - Each redacted span the engine emits is a true positive if it covers
//        at least one gold PII char, otherwise a false positive. Precision is
//        reported per emitted token type, because token types do not map 1:1
//        to gold types ([name] covers people, relatives and facilities;
//        [account] covers MRNs, member and account numbers).
//      - Character-level precision/recall: redacted alnum chars inside gold
//        PII ÷ all redacted alnum chars, and ÷ all gold PII alnum chars.

const TOKEN_RE = /\[([a-z-]+)\]/g;
const ALNUM = /[A-Za-z0-9]/;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find spans for [label, value, context?] specs. Returns [{label, value, start, end}]. */
export function locate(text, specs) {
  const out = [];
  for (const [label, value, context] of specs) {
    if (context) {
      const c = text.indexOf(context);
      if (c < 0) throw new Error(`context not found: ${JSON.stringify(context)} in ${JSON.stringify(text)}`);
      const v = context.indexOf(value);
      if (v < 0) throw new Error(`value ${JSON.stringify(value)} not inside context ${JSON.stringify(context)}`);
      out.push({ label, value, start: c + v, end: c + v + value.length });
      continue;
    }
    const pre = ALNUM.test(value[0]) ? "(?<![A-Za-z0-9])" : "";
    const post = ALNUM.test(value[value.length - 1]) ? "(?![A-Za-z0-9])" : "";
    const re = new RegExp(pre + escapeRe(value) + post, "g");
    let found = false;
    for (const m of text.matchAll(re)) {
      out.push({ label, value, start: m.index, end: m.index + value.length });
      found = true;
    }
    if (!found) throw new Error(`value not found: ${JSON.stringify(value)} in ${JSON.stringify(text)}`);
  }
  return out;
}

/**
 * Align redacted output back to the input.
 * @returns {Array<{start:number,end:number,token:string}>} redacted input spans
 */
export function align(input, output) {
  if (output === input) return [];
  const pieces = [];
  const tokens = [];
  let last = 0;
  for (const m of output.matchAll(TOKEN_RE)) {
    pieces.push(output.slice(last, m.index));
    tokens.push(m[1]);
    last = m.index + m[0].length;
  }
  pieces.push(output.slice(last));
  if (tokens.length === 0) throw new Error("output differs from input but carries no tokens");

  const re = new RegExp("^" + pieces.map(escapeRe).join("([\\s\\S]+?)") + "$", "d");
  const m = re.exec(input);
  if (!m) throw new Error(`could not align output to input:\n  in:  ${input}\n  out: ${output}`);
  const spans = tokens.map((token, i) => {
    const [start, end] = m.indices[i + 1];
    return { start, end, token };
  });
  // verify: rebuilding the output from the spans must reproduce it exactly
  let rebuilt = "";
  let cur = 0;
  for (const sp of spans) {
    rebuilt += input.slice(cur, sp.start) + `[${sp.token}]`;
    cur = sp.end;
  }
  rebuilt += input.slice(cur);
  if (rebuilt !== output) throw new Error("alignment verification failed");
  return spans;
}

function alnumPositions(text, start, end) {
  const out = [];
  for (let i = start; i < end; i++) if (ALNUM.test(text[i])) out.push(i);
  return out;
}

/** Score one snippet given the redactor's output text. */
export function scoreSnippet(entry, outputText) {
  const { text } = entry;
  const gold = locate(text, entry.pii);
  const keep = locate(text, entry.keep);
  const spans = align(text, outputText);

  const redacted = new Array(text.length).fill(null);
  for (const sp of spans) for (let i = sp.start; i < sp.end; i++) redacted[i] = sp.token;
  const isGold = new Array(text.length).fill(false);
  for (const g of gold) for (let i = g.start; i < g.end; i++) isGold[i] = true;
  const isKeep = new Array(text.length).fill(false);
  for (const k of keep) for (let i = k.start; i < k.end; i++) isKeep[i] = true;

  const entities = gold.map((g) => {
    const pos = alnumPositions(text, g.start, g.end);
    const covered = pos.filter((i) => redacted[i] !== null).length;
    const status = covered === pos.length ? "full" : covered === 0 ? "missed" : "partial";
    return { type: g.label, value: g.value, status };
  });
  const negatives = keep.map((k) => {
    const pos = alnumPositions(text, k.start, k.end);
    const damaged = pos.some((i) => redacted[i] !== null);
    return { category: k.label, value: k.value, damaged };
  });
  const emitted = spans.map((sp) => {
    const pos = alnumPositions(text, sp.start, sp.end);
    return {
      token: sp.token,
      text: text.slice(sp.start, sp.end),
      tp: pos.some((i) => isGold[i]),
      hitsKeep: pos.some((i) => isKeep[i]),
    };
  });
  let predChars = 0, goldChars = 0, bothChars = 0;
  for (let i = 0; i < text.length; i++) {
    if (!ALNUM.test(text[i])) continue;
    const p = redacted[i] !== null;
    if (p) predChars++;
    if (isGold[i]) goldChars++;
    if (p && isGold[i]) bothChars++;
  }
  return { id: entry.id, kind: entry.kind, entities, negatives, emitted, chars: { predChars, goldChars, bothChars } };
}

/** Aggregate per-snippet scores into tables. */
export function aggregate(scores) {
  const byType = {};
  const byCategory = {};
  const byToken = {};
  const misses = [];
  const damaged = [];
  const falsePositives = [];
  let predChars = 0, goldChars = 0, bothChars = 0;
  let snippetsWithPii = 0, snippetsNoLeak = 0, negativeSnippets = 0, negativeIntact = 0;

  for (const s of scores) {
    for (const e of s.entities) {
      const t = (byType[e.type] ||= { n: 0, full: 0, partial: 0, missed: 0 });
      t.n++;
      t[e.status]++;
      if (e.status !== "full") misses.push({ id: s.id, type: e.type, value: e.value, status: e.status });
    }
    for (const k of s.negatives) {
      const c = (byCategory[k.category] ||= { n: 0, kept: 0, damaged: 0 });
      c.n++;
      if (k.damaged) {
        c.damaged++;
        damaged.push({ id: s.id, category: k.category, value: k.value });
      } else c.kept++;
    }
    for (const sp of s.emitted) {
      const t = (byToken[sp.token] ||= { emitted: 0, tp: 0, fp: 0 });
      t.emitted++;
      if (sp.tp) t.tp++;
      else {
        t.fp++;
        falsePositives.push({ id: s.id, token: sp.token, text: sp.text, hitsKeep: sp.hitsKeep });
      }
    }
    predChars += s.chars.predChars;
    goldChars += s.chars.goldChars;
    bothChars += s.chars.bothChars;
    if (s.entities.length) {
      snippetsWithPii++;
      if (s.entities.every((e) => e.status === "full")) snippetsNoLeak++;
    }
    if (s.kind === "negative") {
      negativeSnippets++;
      if (s.emitted.length === 0) negativeIntact++;
    }
  }
  const ratio = (a, b) => (b === 0 ? null : a / b);
  for (const t of Object.values(byType)) t.recall = ratio(t.full, t.n);
  for (const t of Object.values(byToken)) t.precision = ratio(t.tp, t.emitted);
  for (const c of Object.values(byCategory)) c.keptRate = ratio(c.kept, c.n);

  const all = Object.values(byType).reduce((a, t) => ({ n: a.n + t.n, full: a.full + t.full, partial: a.partial + t.partial }), { n: 0, full: 0, partial: 0 });
  const tok = Object.values(byToken).reduce((a, t) => ({ emitted: a.emitted + t.emitted, tp: a.tp + t.tp }), { emitted: 0, tp: 0 });
  const neg = Object.values(byCategory).reduce((a, c) => ({ n: a.n + c.n, kept: a.kept + c.kept }), { n: 0, kept: 0 });
  return {
    overall: {
      entities: all.n,
      entityRecall: ratio(all.full, all.n),
      entityPartial: all.partial,
      spansEmitted: tok.emitted,
      spanPrecision: ratio(tok.tp, tok.emitted),
      charPrecision: ratio(bothChars, predChars),
      charRecall: ratio(bothChars, goldChars),
      hardNegatives: neg.n,
      hardNegativesKept: ratio(neg.kept, neg.n),
      snippetsWithPii,
      snippetsNoLeak,
      negativeSnippets,
      negativeIntact,
    },
    byType,
    byToken,
    byCategory,
    misses,
    damaged,
    falsePositives,
  };
}

/** Nearest-rank percentile of a numeric array. */
export function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}
