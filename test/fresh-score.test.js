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
import { gateEngine, doNothing, removeEveryWord, presidioEngine, ENGINE_ORDER } from "../eval/fresh/engines.mjs";
import { headerPeopleMap, HEADER_RULE_VERSION } from "../eval/fresh/header-map.mjs";
import { scoreSet, scoredRunProblems } from "../eval/fresh/score.mjs";
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
  assert.equal(D, 13);
  assert.ok(M >= 40 && K >= 15 && O >= 1);
  assert.equal(set.setHashEncoding, "newline-joined");
  const wren = set.documents.find((d) => d.id === "msg-009").spans[0];
  assert.equal(wren.value, "Wren Halvorsen", "an emoji before the span is one code point and two string units");
  const jose = set.documents.find((d) => d.id === "msg-013").spans;
  assert.deepEqual(jose.slice(0, 2).map((s) => s.value), ["José Pérez-Ibáñez", "Mónica"]);
  assert.equal(set.manifest.fixture, true);
  assert.equal(set.offsetCheck.betterUnit, null);
  assert.equal(set.offsetCheck.misfits.codepoint, 0);
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

// ── offset units ─────────────────────────────────────────────────────────
/** Write a small set from {TYPE|value} templates, with offsets counted in the given unit. */
function writeSet(templates, { unit = "codepoint", declared = "codepoint", withText = false, crlf = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fresh-units-"));
  fs.mkdirSync(path.join(dir, "documents"));
  const count = { codepoint: (x) => [...x].length, utf16: (x) => x.length, byte: (x) => Buffer.byteLength(x, "utf8") }[unit];
  const lines = templates.map((tpl, n) => {
    const id = `u-${n}`;
    let text = "";
    let last = 0;
    const spans = [];
    for (const m of tpl.matchAll(/\{([A-Z]+)\|([^}]+)\}/g)) {
      text += tpl.slice(last, m.index);
      const start = count(text);
      text += m[2];
      spans.push({ start, end: count(text), type: m[1], policy: m[1] === "KEEP" ? "not-identifier" : "identifier", ...(withText ? { text: m[2] } : {}) });
      last = m.index + m[0].length;
    }
    text += tpl.slice(last);
    if (crlf) text = text.replace(/\n/g, "\r\n"); // the offsets above were counted on the LF text
    fs.writeFileSync(path.join(dir, "documents", `${id}.txt`), text);
    return JSON.stringify({ id, kind: "note", text_sha256: sha(text), spans });
  });
  fs.writeFileSync(path.join(dir, "labels.jsonl"), lines.join("\n") + "\n");
  const manifest = buildManifest(dir, {});
  if (declared === undefined) delete manifest.offset_unit;
  else manifest.offset_unit = declared;
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest));
  return dir;
}
const UNIT_DOCS = [
  "Thanks 🙏 {NAME|Wren Halvorsen} here. Call {PHONE|212-555-0147}, my {KEEP|insulin glargine} is fine.",
  "Hi, this is {NAME|José Pérez-Ibáñez}. My wife {RELATIVE|Mónica} says the “refill” didn’t arrive. Call {PHONE|(415) 555-0172}.",
  "Patient: {NAME|Inez Thorn}   MRN: {ID|4471023}",
];
const values = (s) => s.documents.flatMap((d) => d.spans.map((x) => x.value));
const WANT = ["Wren Halvorsen", "212-555-0147", "insulin glargine", "José Pérez-Ibáñez", "Mónica", "(415) 555-0172", "Inez Thorn", "4471023"];

test("fresh: offsets in the declared unit load, in any of the three units", () => {
  for (const unit of ["codepoint", "utf16", "byte"]) {
    const s = loadSet(writeSet(UNIT_DOCS, { unit, declared: unit }));
    assert.deepEqual(values(s), WANT, unit);
    assert.equal(s.offsetCheck.betterUnit, null, unit);
  }
  assert.deepEqual(values(loadSet(writeSet(UNIT_DOCS, { declared: undefined }))), WANT, "no offset_unit means code points");
  assert.deepEqual(values(loadSet(writeSet(UNIT_DOCS, { declared: "characters" }))), WANT, "a common spelling");
  refuses(writeSet(UNIT_DOCS, { declared: "glyphs" }), /unknown offset_unit "glyphs"/);
});

test("fresh: offsets in another unit than the manifest says are refused, naming the unit that fits", () => {
  refuses(writeSet(UNIT_DOCS, { unit: "utf16", declared: "codepoint" }), /span offsets look like utf16 offsets, not codepoint/);
  refuses(writeSet(UNIT_DOCS, { unit: "byte", declared: "codepoint" }), /span offsets look like byte offsets, not codepoint/);
  refuses(writeSet(UNIT_DOCS, { unit: "codepoint", declared: "byte" }), /span offsets look like codepoint offsets, not byte/);
  // A span's own text field is evidence too.
  refuses(writeSet(UNIT_DOCS, { unit: "codepoint", declared: "utf16", withText: true }), /look like codepoint offsets, not utf16/);
  // A person who has checked can keep the declared unit, and the report says so.
  // Spans still have to be in bounds.
  const kept = loadSet(writeSet(UNIT_DOCS, { unit: "utf16", declared: "codepoint" }), { trustOffsets: true });
  assert.equal(kept.offsetCheck.trusted, true);
  assert.equal(kept.offsetCheck.betterUnit, "utf16");
  assert.equal(values(kept)[0], "ren Halvorsen ", "read as declared, so shifted");
  assert.match(markdown({ set: { ...kept, dir: "x/y", documents: 3 }, run: { mode: "regression", scorer: { contentHash: "h", commit: null, dirty: null, matchesLock: null }, gate: "g", headerRule: { version: 1, sha256: "s" }, at: "t", node: "n" }, engines: [] }), /kept by --trust-offsets although utf16 fit the spans better/);
  assert.throws(() => loadSet(writeSet(UNIT_DOCS, { unit: "byte", declared: "codepoint" }), { trustOffsets: true }), /out of bounds/);
});

const NOTE = "PROGRESS NOTE\nPatient: {NAME|Inez Thorn}\nMRN: {ID|4471023}\nDOB: {DOB|03/14/1951}\nCall {PHONE|212-555-0147}.\nSeen by {CLINICIAN|Lena Moreau}.\nContinue {KEEP|metformin 500 mg}.";

test("fresh: offsets counted on different text are refused, whatever the unit", () => {
  assert.deepEqual(values(loadSet(writeSet([NOTE]))).slice(0, 2), ["Inez Thorn", "4471023"]);
  // Counted on LF line endings, written with CRLF: every span after a line break shifts.
  const dir = writeSet([NOTE], { crlf: true });
  refuses(dir, /6 of 6 spans split a word or a character when read as codepoint offsets \(u-0 span 0, u-0 span 1/);
  refuses(dir, /other line endings, a byte-order mark or another Unicode normalization/);
  const kept = loadSet(dir, { trustOffsets: true });
  assert.equal(kept.offsetCheck.tooManyMisfits, true);
  const check = spawnSync(process.execPath, [SCORE, dir, "--check", "--trust-offsets"], { encoding: "utf8" });
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /kept by --trust-offsets/);
  assert.match(check.stdout, /spans that split a word or a character as read: u-0 span 0 \(NAME\), u-0 span 1 \(ID\)/);
  assert.doesNotMatch(check.stdout, /Inez|4471023/, "the check prints ids and counts, never document text");
  // A few split spans are normal labeling (an ID glued to its label, "74yo") and pass.
  const glued = ["MRN{ID|4471023} seen", "age {AGE|74}yo today", "Patient: {NAME|Inez Thorn}", "Call {PHONE|212-555-0147}", "DOB {DOB|03/14/1951}", "Seen {DATE|10/22/2025}", "Dr. {CLINICIAN|Lena Moreau}", "Son {RELATIVE|Chidi}", "Fax {FAX|202-555-0196}", "at {FACILITY|Riverbend Medical Center}"];
  const ok = loadSet(writeSet(glued));
  assert.equal(ok.offsetCheck.misfits.codepoint, 2);
  assert.equal(ok.offsetCheck.tooManyMisfits, false);
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

test("fresh: an output that cannot be aligned is scored by text search, cautiously, and counted", () => {
  const upper = scoreOutputs(set, outputs((d) => ({ text: d.text.toUpperCase(), status: "clean" }))).overall.counts;
  assert.equal(upper.searchScored, D);
  assert.equal(upper.missed, M, "changing case removes nothing");
  assert.equal(upper.keepIntact, K);
  const plain = scoreOutputs(set, outputs((d) => ({ text: d.text.normalize("NFD").replace(/\p{M}/gu, ""), status: "clean" }))).overall.counts;
  assert.equal(plain.removed, 0, "dropping accents removes nothing");
  // A full name replaced while the first name is still elsewhere in the output is partial, not removed.
  const note = set.documents.find((d) => d.id === "note-001");
  const one = scoreOutputs({ ...set, documents: [note] }, new Map([[note.id, { text: note.text.toUpperCase().replace("INEZ Q. THORN", "THE PATIENT"), status: "clean" }]]));
  assert.deepEqual(one.documents[0].left[0], { type: "NAME", state: "partial", flaggedAtSpan: false });
  assert.equal(one.overall.counts.removed, 0);
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

test("fresh: a scored run must be able to stand as the one result", () => {
  const good = { engines: ENGINE_ORDER, presidio: true, scorer: { matchesLock: true, dirty: false } };
  assert.deepEqual(scoredRunProblems(good), []);
  const one = (change, pattern) => {
    const p = scoredRunProblems({ ...good, ...change, scorer: { ...good.scorer, ...(change.scorer || {}) } });
    assert.equal(p.length, 1, JSON.stringify(p));
    assert.match(p[0], pattern);
  };
  one({ alreadyScored: "out/scored-x.json" }, /already scored .*--regression-check/);
  one({ engines: ENGINE_ORDER.filter((e) => e !== "remove-every-word") }, /leaves out remove-every-word/);
  one({ presidio: false }, /Presidio has no outputs/);
  one({ scorer: { matchesLock: false } }, /does not match the content hash/);
  one({ scorer: { matchesLock: null } }, /scorer-lock\.json is missing/);
  one({ scorer: { dirty: true } }, /uncommitted changes/);
  one({ scorer: { dirty: null } }, /not a git checkout/);
});

test("fresh: the command checks a set, refuses runs that cannot stand, and labels later runs", () => {
  const cli = (...a) => spawnSync(process.execPath, [SCORE, ...a], { encoding: "utf8" });
  const check = cli(FIXTURE, "--check");
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /13 documents, \d+ spans/);
  assert.match(check.stdout, /offsets: codepoint\. Of \d+ spans, these split a word or a character when read as code points 0, as UTF-16 4, as bytes 7/);
  assert.match(check.stdout, /spans that split a word or a character as read: none/);

  const dir = copyFixture();
  const m = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  delete m.fixture;
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(m));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "fresh-out-"));
  const noPresidio = cli(dir, "--out", out);
  assert.equal(noPresidio.status, 2);
  assert.match(noPresidio.stderr, /REFUSED: not a scored run:[\s\S]*Presidio has no outputs/);
  const partial = cli(dir, "--out", out, "--engines", "do-nothing");
  assert.match(partial.stderr, /leaves out gate-empty, gate-header, remove-every-word, presidio/);
  fs.writeFileSync(path.join(out, `scored-${m.set_sha256.slice(0, 16)}.json`), "{}");
  assert.match(cli(dir, "--out", out, "--engines", "do-nothing").stderr, /already scored/);
  assert.equal(fs.readdirSync(out).length, 1, "a refused run writes nothing");

  const later = cli(dir, "--out", out, "--engines", "do-nothing", "--regression-check");
  assert.equal(later.status, 0, later.stderr);
  const md = fs.readdirSync(out).find((f) => f.startsWith("regression-") && f.endsWith(".md"));
  assert.match(fs.readFileSync(path.join(out, md), "utf8"), /^# Regression check \(development data\)/);

  const tampered = copyFixture();
  fs.appendFileSync(path.join(tampered, "labels.jsonl"), "\n");
  for (const r of [cli(tampered, "--check"), cli(tampered, "--out", out, "--engines", "do-nothing")]) {
    assert.equal(r.status, 2);
    assert.match(r.stderr, /REFUSED: hash mismatch for labels\.jsonl/);
  }
  assert.equal(cli(FIXTURE, "--out").status, 1, "a usage error is not a refusal");
});
