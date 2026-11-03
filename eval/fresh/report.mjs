// eval/fresh/report.mjs: the side-by-side report, as Markdown and JSON.
//
// Every engine is a row. Every measure carries its count, denominator and
// Wilson 95% interval. A section lists every measure where a gate
// configuration is below a baseline, so a worse result is never hidden. The
// two bounds (do nothing, remove every word) are always better on one measure
// each: they show the ends of the trade, not competitors.

const pct = (x) => (x === null || x === undefined ? "n/a" : `${(x * 100).toFixed(1)}%`);

/** "k of n (r%, 95% CI lo to hi)" */
export function fmt(w) {
  if (!w || !w.n) return `${w ? w.k : 0} of 0`;
  return `${w.k} of ${w.n} (${pct(w.rate)}, ${pct(w.low)} to ${pct(w.high)})`;
}

const short = (w) => (!w || !w.n ? "0 of 0" : `${w.k}/${w.n} (${pct(w.rate)})`);

/** The offset unit and the evidence for it. */
function offsets(set) {
  const c = set.offsetCheck;
  if (!c) return set.offsetUnit;
  const why = [c.betterUnit ? `${c.betterUnit} fit the spans better` : null, c.tooManyMisfits ? `${c.misfits[c.declared]} of ${c.spans} spans split a word or a character` : null].filter(Boolean);
  const trusted = c.trusted && why.length ? `, kept by --trust-offsets although ${why.join(" and ")}` : "";
  return `${set.offsetUnit}${trusted}. Of ${c.spans} spans, these split a word or a character when read as code points: ${c.misfits.codepoint}, as UTF-16: ${c.misfits.utf16}, as bytes: ${c.misfits.byte}`;
}

// Which way is better for each measure.
export const MEASURES = [
  { key: "silentLeaks", label: "Silent leaks: identifier mentions left in documents marked clean", better: "lower" },
  { key: "cleanDocsWithLeak", label: "Clean documents that still hold an identifier", better: "lower" },
  { key: "fullRemoval", label: "Identifier mentions fully removed", better: "higher" },
  { key: "caughtByReview", label: "Mentions left in documents marked review", better: null },
  { key: "caughtAtSpan", label: "Mentions left with a review span on them", better: null },
  { key: "reviewShare", label: "Documents sent to review", better: "lower" },
  { key: "reviewNothingLeft", label: "Review documents with nothing left to find", better: "lower" },
  { key: "keepIntact", label: "Clinical spans (KEEP) intact", better: "higher" },
  { key: "otherKept", label: "Other not-identifier spans intact (ages under 90, years)", better: "higher" },
  { key: "blocked", label: "Documents blocked", better: "lower" },
  { key: "overRemoval", label: "Letters and digits removed outside identifier spans", better: "lower" },
];

/** Every measure where a gate row is worse than a baseline or bound row. */
export function belowBaseline(results) {
  const gates = results.engines.filter((e) => e.family === "gate");
  const others = results.engines.filter((e) => e.family !== "gate");
  const rows = [];
  for (const g of gates) {
    for (const b of others) {
      for (const m of MEASURES) {
        if (!m.better) continue;
        const gw = g.score.overall.rates[m.key];
        const bw = b.score.overall.rates[m.key];
        if (gw.rate === null || bw.rate === null) continue;
        const worse = m.better === "higher" ? gw.rate < bw.rate : gw.rate > bw.rate;
        if (!worse) continue;
        const overlap = gw.low <= bw.high && bw.low <= gw.high;
        rows.push({ gate: g.id, other: b.id, measure: m.key, label: m.label, gateValue: gw, otherValue: bw, intervalsOverlap: overlap });
      }
    }
  }
  return rows;
}

export function markdown(results) {
  const L = [];
  const run = results.run;
  const titles = { scored: "Blind set: the scored run", regression: "Regression check (development data)", sample: "Sample run on a test fixture (not the blind set, not a result)" };
  L.push(`# ${titles[run.mode] || titles.regression}`, "");
  if (run.mode === "regression") L.push("This run is not a quoted result: the set was scored before, so it is development data now.", "");
  if (run.mode === "sample") L.push("This run is not a result. The set is a synthetic fixture written by the same model that wrote the gate's rules, to test the scorer.", "");
  L.push("| | |", "|---|---|");
  for (const [k, v] of [
    ["Set", `${results.set.dir.split("/").slice(-2).join("/")}, ${results.set.documents} documents, set hash ${results.set.setHash}`],
    ["Set hash encoding", results.set.setHashEncoding],
    ["Offsets", offsets(results.set)],
    ["Commit", run.scorer.commit ? `${run.scorer.commit}${run.scorer.dirty ? ", with uncommitted changes in src or eval/fresh" : ", no uncommitted changes in src or eval/fresh"}` : "not a git checkout"],
    ["Scorer", `content hash ${run.scorer.contentHash}${run.scorer.matchesLock === null ? ", no lock file" : run.scorer.matchesLock ? ", matches eval/fresh/scorer-lock.json" : ", DOES NOT match eval/fresh/scorer-lock.json"}`],
    ["Gate", run.gate],
    ["Header rule", `version ${run.headerRule.version}, sha256 ${run.headerRule.sha256}`],
    ["Run", `${run.at}, Node ${run.node}`],
  ]) L.push(`| ${k} | ${v} |`);
  L.push("", "## Side by side", "");
  L.push("Counts are identifier mentions, documents or spans. Each cell is a count of a denominator, the rate, and its Wilson 95% interval.", "");
  L.push("| Measure | " + results.engines.map((e) => e.id).join(" | ") + " |");
  L.push("|---|" + results.engines.map(() => "---").join("|") + "|");
  for (const m of MEASURES) L.push(`| ${m.label}${m.better ? ` (${m.better} is better)` : ""} | ${results.engines.map((e) => fmt(e.score.overall.rates[m.key])).join(" | ")} |`);
  L.push(`| Documents scored by text search because the output could not be aligned | ${results.engines.map((e) => String(e.score.overall.counts.searchScored)).join(" | ")} |`);
  L.push("", "### Engines", "");
  for (const e of results.engines) L.push(`- **${e.id}**: ${e.label}. ${e.version}.`);
  const below = belowBaseline(results);
  L.push("", "## Where a gate configuration is below another engine", "");
  if (!below.length) L.push("None.");
  else {
    L.push("| Gate | Below | Measure | Gate | Other | 95% intervals overlap |", "|---|---|---|---|---|---|");
    for (const r of below) L.push(`| ${r.gate} | ${r.other} | ${r.label} | ${short(r.gateValue)} | ${short(r.otherValue)} | ${r.intervalsOverlap ? "yes" : "no"} |`);
  }
  for (const [title, key] of [["By identifier type", "byType"], ["By document kind", "byKind"]]) {
    L.push("", `## ${title}`, "");
    const groups = [...new Set(results.engines.flatMap((e) => Object.keys(e.score[key])))].sort();
    for (const measure of ["fullRemoval", "silentLeaks"]) {
      const label = MEASURES.find((m) => m.key === measure).label;
      L.push(`### ${label}`, "", "| " + (key === "byType" ? "Type" : "Kind") + " | " + results.engines.map((e) => e.id).join(" | ") + " |", "|---|" + results.engines.map(() => "---").join("|") + "|");
      for (const g of groups) {
        const cells = results.engines.map((e) => (e.score[key][g] ? short(e.score[key][g].rates[measure]) : "n/a"));
        if (cells.every((c) => c === "0 of 0" || c === "n/a")) continue;
        L.push(`| ${g} | ${cells.join(" | ")} |`);
      }
      L.push("");
    }
  }
  L.push("## Definitions", "");
  L.push("A labeled span is removed when every letter and digit in it is gone from the output, partial when some are, and missed when none are. A mention is left when it is partial or missed. Engines with no status (the bounds and Presidio) count as clean: what they return is what would be sent. Mentions in blocked documents are withheld, counted in neither removal nor leaks. Caught by review counts left mentions in documents marked review. Caught at the span counts only those with a review span on what remains of them. An output that cannot be aligned to its input is scored by text search, after folding case, width and accents: a span is missed when its text is still in the output, partial when any word of it is, and removed only when neither is true.");
  return L.join("\n") + "\n";
}

export default { markdown, belowBaseline, fmt, MEASURES };
