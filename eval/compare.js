#!/usr/bin/env node
// eval/compare.js: score several engines on the two synthetic sets.
//
// Both sets are DEVELOPMENT DATA. Rules were changed while looking at each of
// them, so no number here is a held-out or generalization result.
//
//   development  eval/dataset.js: 182 synthetic snippets, 207 labeled identifiers
//   templates    eval/heldout.json: a 27-template development check. 27
//                identifier templates written four times each (108 rows) plus
//                6 clinical sentences. It was committed before the rule changes
//                in dc528aa, but those changes added its own vocabulary
//                (Jardiance, Rheumatoid, Portal, Telephone) to a protected word
//                list, so it was never blind. Its counts are reported per
//                template (26 of 27), not as a rate over 108 copies.
//
// Usage:
//   node eval/compare.js                       print a summary for this tree's engine
//   node eval/compare.js --engine id=commit=/path/to/src/engine.js ...
//                                              add engines exported from other commits
//   node eval/compare.js --write ...           also write eval/comparison.{json,md}
//                                              and the docs/ copies
//   node eval/compare.js --check               fail if this tree's engine no longer
//                                              matches the committed comparison.json
//
// Every engine runs with the identifiers profile and an empty people map.

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { DATASET } from "./dataset.js";
import { aggregate, scoreSnippet, align, locate } from "./score.js";
import { redactText, REDACTION_VERSION } from "../src/engine.js";

const root = new URL("../", import.meta.url);
const TEMPLATES = JSON.parse(fs.readFileSync(new URL("./heldout.json", import.meta.url))).entries;

export const SETS = {
  development: {
    label: "Development snippets: 182 synthetic snippets, 207 labeled identifiers",
    data: "development",
    note: "Written with the first release. Every later rule change was made while looking at it.",
    entries: DATASET,
  },
  templates: {
    label: "27-template development check: 27 identifier templates x 4 copies, plus 6 clinical sentences",
    data: "development",
    note: "Committed before the rule changes in dc528aa, but those changes added this set's own vocabulary to a protected word list, so it was never blind. The 108 identifier rows are 27 templates written four times, so counts are given per template.",
    entries: TEMPLATES,
  },
};

const FAMILY = (t) => ({ RELATIVE: "NAME", FACILITY: "NAME", DOB: "DATE", MRN: "ID", ACCOUNT: "ID", PLAN: "ID", LICENSE: "ID", DEVICE: "ID", VEHICLE: "ID", FAX: "PHONE", AGE_OVER_89: "AGE" })[t] || t;
const TOKEN_FAMILY = (t) => ({ name: "NAME", dob: "DATE", date: "DATE", age: "AGE", account: "ID", device: "ID", license: "ID", vehicle: "ID", phone: "PHONE", fax: "PHONE", email: "EMAIL", ssn: "ID", card: "ID", address: "ADDRESS", coords: "ADDRESS", url: "URL", ip: "IP" })[t] || t.toUpperCase();
const OPTS = { profile: "identifiers", peopleMap: { people: [], safe: [] } };

function round(x) {
  return x === null || x === undefined ? x : Math.round(x * 1e6) / 1e6;
}

/** Score one engine on one set. Status counts are null for engines that report no status. */
export function runSet(engine, entries, { templateCounts = false } = {}) {
  const outputs = entries.map((e) => {
    const r = engine(e.text, OPTS);
    if (r.blocked) throw new Error(`unexpected block: ${e.id}`);
    return r;
  });
  const scores = entries.map((e, i) => scoreSnippet(e, outputs[i].text));
  const result = aggregate(scores);
  result.precisionByFamily = {};
  for (let i = 0; i < entries.length; i++) {
    const gold = locate(entries[i].text, entries[i].pii);
    for (const span of align(entries[i].text, outputs[i].text)) {
      const overlaps = gold.filter((g) => g.start < span.end && g.end > span.start);
      const families = new Set(overlaps.length ? overlaps.map((g) => FAMILY(g.label)) : [TOKEN_FAMILY(span.token)]);
      for (const f of families) {
        const row = (result.precisionByFamily[f] ||= { tp: 0, fp: 0 });
        row[overlaps.length ? "tp" : "fp"]++;
      }
    }
  }
  for (const row of Object.values(result.precisionByFamily)) row.precision = round(row.tp / (row.tp + row.fp));
  // Status: does the engine say "review" where it left an identifier?
  const reportsStatus = outputs.every((r) => typeof r.status === "string");
  const missedIds = new Set(result.misses.map((m) => m.id));
  result.status = reportsStatus
    ? {
        snippets: entries.length,
        review: outputs.filter((r) => r.status === "review").length,
        snippetsWithAMiss: missedIds.size,
        snippetsWithAMissInReview: entries.filter((e, i) => missedIds.has(e.id) && outputs[i].status === "review").length,
        snippetsWithAMissMarkedClean: entries.filter((e, i) => missedIds.has(e.id) && outputs[i].status === "clean").length,
      }
    : null;
  for (const m of result.misses) {
    const i = entries.findIndex((e) => e.id === m.id);
    m.resultStatus = reportsStatus ? outputs[i].status : null;
  }
  if (templateCounts) result.templates = countTemplates(scores);
  for (const t of Object.values(result.byType)) t.recall = round(t.recall);
  for (const k of Object.keys(result.overall)) if (typeof result.overall[k] === "number") result.overall[k] = round(result.overall[k]);
  for (const t of Object.values(result.byToken)) t.precision = round(t.precision);
  for (const c of Object.values(result.byCategory)) c.keptRate = round(c.keptRate);
  return result;
}

/** Template-level counts: a template counts as removed only when every copy is fully removed. */
function countTemplates(scores) {
  const ids = new Map();
  const kept = new Map();
  for (const s of scores) {
    for (const ent of s.entities) {
      const key = `${ent.type}\u0000${ent.value}`;
      const row = ids.get(key) || { type: ent.type, value: ent.value, copies: 0, full: 0 };
      row.copies++;
      if (ent.status === "full") row.full++;
      ids.set(key, row);
    }
    for (const neg of s.negatives) {
      const row = kept.get(neg.value) || { value: neg.value, copies: 0, kept: 0 };
      row.copies++;
      if (!neg.damaged) row.kept++;
      kept.set(neg.value, row);
    }
  }
  const idRows = [...ids.values()];
  const keptRows = [...kept.values()];
  return {
    identifierTemplates: idRows.length,
    identifierTemplatesRemovedInEveryCopy: idRows.filter((r) => r.full === r.copies).length,
    identifierTemplatesMissed: idRows.filter((r) => r.full < r.copies).map((r) => ({ type: r.type, value: r.value, fullCopies: r.full, copies: r.copies })),
    clinicalPhrases: keptRows.length,
    clinicalPhrasesKeptInEveryCopy: keptRows.filter((r) => r.kept === r.copies).length,
    clinicalPhrasesDamaged: keptRows.filter((r) => r.kept < r.copies).map((r) => ({ value: r.value, keptCopies: r.kept, copies: r.copies })),
  };
}

function parseEngines(argv) {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== "--engine") continue;
    const [id, commit, ...rest] = String(argv[i + 1] || "").split("=");
    const path = rest.join("=");
    if (!id || !commit || !path) throw new Error("--engine needs id=commit=/path/to/src/engine.js");
    out.push({ id, commit, path });
  }
  return out;
}

const LABELS = {
  release: "First public release",
  previous: "main before this branch",
  current: `This tree (REDACTION_VERSION ${REDACTION_VERSION})`,
};

export async function compare(engineSpecs) {
  const engines = [];
  for (const spec of engineSpecs) {
    const mod = await import(pathToFileURL(spec.path).href);
    engines.push({ id: spec.id, label: LABELS[spec.id] || spec.id, commit: spec.commit, run: mod.redactText });
  }
  engines.push({ id: "current", label: LABELS.current, commit: "this tree", run: redactText });
  const sets = {};
  for (const [key, set] of Object.entries(SETS)) {
    const results = {};
    for (const e of engines) results[e.id] = runSet(e.run, set.entries, { templateCounts: key === "templates" });
    sets[key] = { label: set.label, data: set.data, note: set.note, results };
  }
  return {
    note: "Both sets are development data, so no number here measures performance on unseen text. A headline number needs the fresh locked set described in the README.",
    profile: "identifiers",
    peopleMap: "empty",
    engines: engines.map(({ id, label, commit }) => ({ id, label, commit })),
    sets,
  };
}

const pct = (n) => (n === null || n === undefined ? "n/a" : `${(n * 100).toFixed(1)}%`);
const frac = (a, b) => `${a}/${b}`;
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

export function markdown(c) {
  const L = ["# Development comparison", ""];
  L.push("Both sets below are development data. Rules were changed while looking at each of them, so these numbers show progress on known cases, not performance on unseen text. Engines run with the identifiers profile and an empty people map. Full removal requires every labeled letter and digit to be removed.", "");
  L.push("| Engine | Commit |", "|---|---|");
  for (const e of c.engines) L.push(`| ${e.label} | ${e.commit} |`);
  for (const [key, set] of Object.entries(c.sets)) {
    L.push("", `## ${set.label}`, "", set.note, "");
    L.push("| Measure | " + c.engines.map((e) => e.label).join(" | ") + " |", "|---|" + c.engines.map(() => "---").join("|") + "|");
    const row = (name, fn) => L.push(`| ${name} | ${c.engines.map((e) => fn(set.results[e.id])).join(" | ")} |`);
    if (key === "templates") {
      row("Identifier templates removed in every copy", (r) => frac(r.templates.identifierTemplatesRemovedInEveryCopy, r.templates.identifierTemplates));
      row("Clinical phrases kept in every copy", (r) => frac(r.templates.clinicalPhrasesKeptInEveryCopy, r.templates.clinicalPhrases));
    } else {
      row("Identifiers fully removed", (r) => `${frac(Math.round(r.overall.entityRecall * r.overall.entities), r.overall.entities)} (${pct(r.overall.entityRecall)})`);
      row("Clinical phrases kept", (r) => `${frac(Math.round(r.overall.hardNegativesKept * r.overall.hardNegatives), r.overall.hardNegatives)} (${pct(r.overall.hardNegativesKept)})`);
      row("Spans removed that overlap a labeled identifier", (r) => `${pct(r.overall.spanPrecision)} of ${r.overall.spansEmitted}`);
    }
    row("Snippets with an identifier left", (r) => frac(r.overall.snippetsWithPii - r.overall.snippetsNoLeak, r.overall.snippetsWithPii));
    row("Of those, marked for review", (r) => (r.status ? frac(r.status.snippetsWithAMissInReview, r.status.snippetsWithAMiss) : "no status reported"));
    row("Of those, marked clean", (r) => (r.status ? frac(r.status.snippetsWithAMissMarkedClean, r.status.snippetsWithAMiss) : "no status reported"));
    row("All snippets marked for review", (r) => (r.status ? frac(r.status.review, r.status.snippets) : "no status reported"));
    const cur = set.results.current;
    if (key === "templates" && cur.templates.identifierTemplatesMissed.length) {
      L.push("", "Templates not removed in every copy by this tree:", "");
      for (const m of cur.templates.identifierTemplatesMissed) L.push(`- ${m.type} \`${m.value}\`: ${m.fullCopies} of ${m.copies} copies fully removed`);
    }
    L.push("", "### Every miss in this tree", "", "| Snippet | Type | Value | Status | Result status |", "|---|---|---|---|---|");
    for (const m of cur.misses) L.push(`| ${m.id} | ${m.type} | ${cell(m.value)} | ${m.status} | ${m.resultStatus ?? "n/a"} |`);
    L.push("", "### Every false-positive span in this tree", "", "| Snippet | Token | Removed text |", "|---|---|---|");
    for (const f of cur.falsePositives) L.push(`| ${f.id} | [${f.token}] | ${cell(f.text)} |`);
  }
  return L.join("\n") + "\n";
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2);
  if (argv.includes("--check")) {
    const committed = JSON.parse(fs.readFileSync(new URL("eval/comparison.json", root)));
    const fresh = await compare([]);
    let ok = true;
    for (const key of Object.keys(SETS)) {
      const a = JSON.stringify(committed.sets[key].results.current);
      const b = JSON.stringify(JSON.parse(JSON.stringify(fresh.sets[key].results.current)));
      if (a !== b) {
        ok = false;
        console.error(`eval/comparison.json is stale for set "${key}": regenerate with --write`);
      }
    }
    if (!ok) process.exit(1);
    console.log("eval/comparison.json matches this tree's engine");
  } else {
    const c = await compare(parseEngines(argv));
    const md = markdown(c);
    if (argv.includes("--write")) {
      const json = JSON.stringify(c, null, 2) + "\n";
      for (const dir of ["eval", "docs"]) {
        fs.writeFileSync(new URL(`${dir}/comparison.json`, root), json);
        fs.writeFileSync(new URL(`${dir}/comparison.md`, root), md);
      }
      console.log("wrote eval/comparison.{json,md} and docs/comparison.{json,md}");
    } else process.stdout.write(md);
  }
}
