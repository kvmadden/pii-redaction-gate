// fresh-score.test.js: the blind-set scorer (eval/fresh/), tested on a
// synthetic fixture in the blind set's exact format
// (test/fixtures/fresh-sample, built by its build.mjs). The blind set itself
// is never read here.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { loadSet, setHashCandidates, SetIntegrityError } from "../eval/fresh/set.mjs";
import { wilson, alignOutput, scoreOutputs } from "../eval/fresh/measure.mjs";
import { gateEngine, doNothing, removeEveryWord, presidioEngine } from "../eval/fresh/engines.mjs";
import { headerPeopleMap, HEADER_RULE_VERSION } from "../eval/fresh/header-map.mjs";
import { scoreSet } from "../eval/fresh/score.mjs";
import { markdown, belowBaseline } from "../eval/fresh/report.mjs";
import { buildManifest } from "../eval/fresh/make-manifest.mjs";

const FIXTURE = fileURLToPath(new URL("./fixtures/fresh-sample/", import.meta.url));
const SCORE = fileURLToPath(new URL("../eval/fresh/score.mjs", import.meta.url));
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

function copyFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fresh-"));
  fs.cpSync(FIXTURE, dir, { recursive: true });
  fs.rmSync(path.join(dir, "build.mjs"));
  return dir;
}
function relock(dir) {
  const m = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const fresh = buildManifest(dir, { fixture: m.fixture });
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(fresh, null, 2) + "\n");
}
const refuses = (dir, pattern) => assert.throws(() => loadSet(dir), (e) => e instanceof SetIntegrityError && pattern.test(e.message));

const set = loadSet(FIXTURE);
const all = set.documents.flatMap((d) => d.spans.map((s) => ({ ...s, doc: d })));
const M = all.filter((s) => s.policy === "identifier").length;
const K = all.filter((s) => s.type === "KEEP").length;
const O = all.filter((s) => s.policy === "not-identifier" && s.type !== "KEEP").length;
const D = set.documents.length;
const DI = set.documents.filter((d) => d.spans.some((s) => s.policy === "identifier")).length;

/** Outputs from a function of the document. */
function outputs(fn) {
  return new Map(set.documents.map((d, i) => [d.id, fn(d, i)]));
}
/** Replace the given spans of a document with "[x]", right to left. */
function replaceSpans(doc, spans) {
  let text = doc.text;
  for (const s of [...spans].sort((a, b) => b.start - a.start)) text = text.slice(0, s.start) + "[x]" + text.slice(s.end);
  return text;
}
const ids = (doc) => doc.spans.filter((s) => s.policy === "identifier");

// ── the set and its integrity checks ─────────────────────────────────────
test("fresh: the fixture loads, with code-point offsets mapped to string indices", () => {
  assert.equal(D, 12);
  assert.ok(M >= 40 && K >= 15 && O >= 1);
  assert.equal(set.setHashEncoding, "newline-joined");
  const wren = set.documents.find((d) => d.id === "msg-009").spans[0];
  assert.equal(wren.value, "Wren Halvorsen", "an emoji before the span is one code point and two string units");
  assert.equal(set.manifest.fixture, true);
});

test("fresh: the three common set-hash encodings are accepted, nothing else", () => {
  const c = setHashCandidates(["b", "a"].map((x) => sha(x)));
  assert.equal(new Set(Object.values(c)).size, 3);
});

test("fresh: a changed document is refused by its manifest hash", () => {
  const dir = copyFixture();
  fs.appendFileSync(path.join(dir, "documents", "note-001.txt"), " ");
  refuses(dir, /hash mismatch for documents\/note-001\.txt/);
});

test("fresh: a re-locked manifest does not hide a document that no longer matches its label", () => {
  const dir = copyFixture();
  const p = path.join(dir, "documents", "note-001.txt");
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace("Inez", "Ines"));
  relock(dir);
  refuses(dir, /text_sha256 mismatch for note-001/);
});

test("fresh: a wrong set hash, an unlisted document, a missing label and a bad span are refused", () => {
  let dir = copyFixture();
  const mp = path.join(dir, "manifest.json");
  const m = JSON.parse(fs.readFileSync(mp, "utf8"));
  m.set_sha256 = sha("something else");
  fs.writeFileSync(mp, JSON.stringify(m));
  refuses(dir, /set hash mismatch/);

  dir = copyFixture();
  fs.writeFileSync(path.join(dir, "documents", "extra.txt"), "Extra text.");
  refuses(dir, /not listed in the manifest: documents\/extra\.txt/);

  dir = copyFixture();
  const lp = path.join(dir, "labels.jsonl");
  fs.writeFileSync(lp, fs.readFileSync(lp, "utf8").split("\n").filter((l) => !l.includes('"note-008"')).join("\n"));
  relock(dir);
  refuses(dir, /document has no label line: note-008/);

  dir = copyFixture();
  const lines = fs.readFileSync(path.join(dir, "labels.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  lines[0].spans[0].end = 100000;
  fs.writeFileSync(path.join(dir, "labels.jsonl"), lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  relock(dir);
  refuses(dir, /out of bounds/);

  dir = copyFixture();
  lines[0].spans[0].end = lines[0].spans[0].start + 3;
  lines[0].spans[0].type = "SSN";
  fs.writeFileSync(path.join(dir, "labels.jsonl"), lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  relock(dir);
  refuses(dir, /unknown type "SSN"/);
});

// ── measures with known answers ──────────────────────────────────────────
test("fresh: Wilson 95% intervals", () => {
  const w = wilson(8, 10);
  assert.equal(w.rate, 0.8);
  assert.ok(Math.abs(w.low - 0.4902) < 1e-3 && Math.abs(w.high - 0.9433) < 1e-3);
  assert.ok(Math.abs(wilson(0, 10).high - 0.2775) < 1e-3);
  assert.equal(wilson(0, 0).rate, null);
});

test("fresh: do nothing leaves every identifier and keeps every clinical span", () => {
  const s = scoreOutputs(set, outputs((d) => doNothing.run(d))).overall;
  assert.deepEqual([s.rates.silentLeaks.k, s.rates.silentLeaks.n], [M, M]);
  assert.deepEqual([s.rates.cleanDocsWithLeak.k, s.rates.cleanDocsWithLeak.n], [DI, D]);
  assert.equal(s.rates.fullRemoval.k, 0);
  assert.deepEqual([s.rates.keepIntact.k, s.rates.keepIntact.n], [K, K]);
  assert.equal(s.rates.overRemoval.k, 0);
  assert.equal(s.counts.missed, M);
});

test("fresh: remove every word removes every identifier and every clinical span", () => {
  const s = scoreOutputs(set, outputs((d) => removeEveryWord.run(d))).overall;
  assert.deepEqual([s.rates.fullRemoval.k, s.rates.fullRemoval.n], [M, M]);
  assert.equal(s.rates.silentLeaks.k, 0);
  assert.equal(s.rates.keepIntact.k, 0);
  assert.equal(s.rates.overRemoval.k, s.rates.overRemoval.n);
});

test("fresh: an engine that removes exactly the identifiers scores perfectly", () => {
  const s = scoreOutputs(set, outputs((d) => ({ text: replaceSpans(d, ids(d)), status: "clean" })), (t) => t === "x").overall;
  assert.deepEqual([s.rates.fullRemoval.k, s.rates.fullRemoval.n], [M, M]);
  assert.deepEqual([s.rates.keepIntact.k, s.rates.otherKept.k], [K, O]);
  assert.equal(s.rates.overRemoval.k, 0);
});

test("fresh: partial removal, review at and away from the span, and blocked documents", () => {
  // Document 0 is blocked. Odd documents go to review with their first
  // identifier left: on half of them a review span covers it. Even documents
  // remove only the first character of every identifier.
  let flaggedExpected = 0;
  let reviewWithLeft = 0;
  let reviewNothing = 0;
  let partialExpected = 0;
  const outs = outputs((d, i) => {
    const I = ids(d);
    if (i === 0) return { text: "[redaction-blocked]", status: "blocked" };
    if (i % 2 === 1) {
      if (!I.length) {
        reviewNothing++;
        return { text: d.text, status: "review", review: [] };
      }
      const [first, ...rest] = [...I].sort((a, b) => a.start - b.start);
      const text = replaceSpans(d, rest);
      reviewWithLeft++;
      const flag = (i % 4 === 1);
      if (flag) flaggedExpected++;
      return { text, status: "review", review: flag ? [{ start: first.start, end: first.end }] : [{ start: text.length - 1, end: text.length }] };
    }
    partialExpected += I.length;
    return { text: replaceSpans(d, I.map((s) => ({ start: s.start, end: s.start + 1 }))), status: "clean" };
  });
  const r = scoreOutputs(set, outs, (t) => t === "x").overall;
  const blockedIds = ids(set.documents[0]).length;
  assert.equal(r.counts.blocked, 1);
  assert.equal(r.counts.withheld, blockedIds);
  assert.equal(r.counts.mentions, M - blockedIds);
  assert.equal(r.counts.leftInReview, reviewWithLeft);
  assert.equal(r.counts.leftAtReviewSpan, flaggedExpected);
  assert.equal(r.counts.reviewNothingLeft, reviewNothing);
  assert.equal(r.counts.partial, partialExpected);
  assert.equal(r.counts.leftInClean, partialExpected);
  assert.equal(r.counts.removed + r.counts.partial + r.counts.missed, r.counts.mentions);
  assert.equal(r.rates.reviewShare.k, r.counts.review);
});

test("fresh: by type and by kind add up to the overall counts", () => {
  const s = scoreOutputs(set, outputs((d) => doNothing.run(d)));
  const sum = (o, f) => Object.values(o).reduce((n, x) => n + x.counts[f], 0);
  assert.equal(sum(s.byType, "mentions"), s.overall.counts.mentions);
  assert.equal(sum(s.byKind, "mentions"), s.overall.counts.mentions);
  assert.equal(sum(s.byKind, "documents"), D);
});

// ── alignment ────────────────────────────────────────────────────────────
test("fresh: alignment handles multi-word spans, adjacent tokens and input brackets", () => {
  const a = alignOutput("Dr. John Smith saw Mary Jones [sic] today", "Dr. [name] saw [name] [sic] today", (t) => t === "name");
  assert.ok(a);
  const removed = (s, e) => [...a.removed.slice(s, e)].every((x) => x === 1);
  assert.ok(removed(4, 14) && removed(19, 29));
  assert.equal(a.removed[31], 0, "the input's own [sic] is kept");
  assert.ok(alignOutput("AB", "[x][x]", (t) => t === "x"));
  assert.equal(alignOutput("same", "different", () => true), null);
});

test("fresh: an output that cannot be aligned is scored by text search and counted", () => {
  const s = scoreOutputs(set, outputs((d) => ({ text: d.text.toUpperCase(), status: "clean" }))).overall;
  assert.equal(s.counts.searchScored, D);
});

// ── engines ──────────────────────────────────────────────────────────────
test("fresh: the header-block rule is frozen", () => {
  const src = fs.readFileSync(new URL("../eval/fresh/header-map.mjs", import.meta.url));
  assert.equal(HEADER_RULE_VERSION, 1);
  assert.equal(sha(src), "5f54134d682a690966cefa749fc6e78d4b6ddc0c33fd6204f6431f6e3ff2116e");
});

test("fresh: the header-block rule reads names from person fields only", () => {
  const map = headerPeopleMap("DISCHARGE SUMMARY\nPatient: OKONKWO, Adaeze B.   MRN: 00-482-1173\nPCP: Dr. Price\nRe: Prior Authorization Request\nName: none\n\nPatient: Not Header");
  assert.deepEqual(map.people.map((p) => [p.role, p.name]), [["patient", "OKONKWO, Adaeze B."]]);
  assert.ok(map.people[0].aliases.includes("Adaeze OKONKWO"));
  assert.ok(map.people[0].aliases.includes("Adaeze"));
});

test("fresh: both gate configurations run on every document and their counts add up", () => {
  for (const withMap of [false, true]) {
    const engine = gateEngine(withMap);
    const s = scoreOutputs(set, outputs((d) => engine.run(d))).overall;
    const c = s.counts;
    assert.equal(c.removed + c.partial + c.missed + c.withheld, M);
    assert.equal(c.leftInClean + c.leftInReview, c.partial + c.missed);
    assert.equal(c.clean + c.review + c.blocked, D);
    assert.equal(c.searchScored, 0, "gate outputs always align");
  }
});

test("fresh: Presidio outputs must come from the exact documents", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "presidio-"));
  const good = { engine: { versions: { "presidio-analyzer": "test" } }, outputs: Object.fromEntries(set.documents.map((d) => [d.id, { input_sha256: d.sha256, text: d.text }])) };
  fs.writeFileSync(path.join(dir, "ok.json"), JSON.stringify(good));
  const s = scoreOutputs(set, outputs((d) => presidioEngine(path.join(dir, "ok.json")).run(d))).overall;
  assert.equal(s.counts.missed, M);
  good.outputs["note-001"].input_sha256 = sha("another text");
  fs.writeFileSync(path.join(dir, "bad.json"), JSON.stringify(good));
  assert.throws(() => presidioEngine(path.join(dir, "bad.json")).run(set.documents.find((d) => d.id === "note-001")), /made from a different text/);
});

// ── the run and the report ───────────────────────────────────────────────
test("fresh: the report shows every engine and every place a gate is below another engine", () => {
  const results = scoreSet(FIXTURE, { engines: ["gate-empty", "gate-header", "do-nothing", "remove-every-word"], mode: "sample" });
  const md = markdown(results);
  for (const id of ["gate-empty", "gate-header", "do-nothing", "remove-every-word"]) assert.match(md, new RegExp(`\\b${id}\\b`));
  assert.match(md, /Sample run on a test fixture \(not the blind set, not a result\)/);
  const below = belowBaseline(results);
  assert.ok(below.some((r) => r.other === "remove-every-word" && r.measure === "fullRemoval") || below.some((r) => r.other === "do-nothing"));
  for (const r of below) assert.match(md, new RegExp(`\\| ${r.gate} \\| ${r.other} \\|`));
});

test("fresh: the command refuses a second scored run of the same set", () => {
  const dir = copyFixture();
  const m = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  delete m.fixture;
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(m));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "fresh-out-"));
  const run = (...extra) => spawnSync(process.execPath, [SCORE, dir, "--out", out, "--engines", "do-nothing", ...extra], { encoding: "utf8" });
  assert.equal(run().status, 0);
  const again = run();
  assert.equal(again.status, 2);
  assert.match(again.stderr, /already scored/);
  assert.equal(run("--regression-check").status, 0);
  const tampered = copyFixture();
  fs.appendFileSync(path.join(tampered, "labels.jsonl"), "\n");
  const refused = spawnSync(process.execPath, [SCORE, tampered, "--out", out, "--engines", "do-nothing"], { encoding: "utf8" });
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /REFUSED: hash mismatch for labels\.jsonl/);
});
