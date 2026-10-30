// eval.test.js — integrity checks for the labeled evaluation set and its
// scorer, so the numbers in the README come from a set that is well-formed
// and a scorer that aligns every output. The metrics themselves are NOT
// asserted here: misses are reported, not hidden behind a threshold.

import { test } from "node:test";
import assert from "node:assert/strict";

import { DATASET } from "../eval/dataset.js";
import { locate, align, scoreSnippet, aggregate } from "../eval/score.js";
import { redactText, PROFILES } from "../src/engine.js";

const GOLD_TYPES = ["NAME", "RELATIVE", "FACILITY", "DOB", "DATE", "AGE", "PHONE", "EMAIL", "ADDRESS", "ID"];
const KEEP_CATS = ["DRUG", "DOSE", "LAB", "VITAL", "CLINICAL", "OTHER"];

test("eval set: at least 150 snippets, unique ids, known labels, every value locatable", () => {
  assert.ok(DATASET.length >= 150, `only ${DATASET.length} snippets`);
  assert.equal(new Set(DATASET.map((e) => e.id)).size, DATASET.length, "duplicate ids");
  const seenTypes = new Set();
  const seenCats = new Set();
  for (const e of DATASET) {
    for (const [t] of e.pii) {
      assert.ok(GOLD_TYPES.includes(t), `${e.id}: unknown type ${t}`);
      seenTypes.add(t);
    }
    for (const [c] of e.keep) {
      assert.ok(KEEP_CATS.includes(c), `${e.id}: unknown category ${c}`);
      seenCats.add(c);
    }
    locate(e.text, e.pii); // throws on a missing value
    locate(e.text, e.keep);
    if (e.kind === "negative") assert.equal(e.pii.length, 0, `${e.id}: negative snippet carries PII`);
  }
  assert.deepEqual([...seenTypes].sort(), [...GOLD_TYPES].sort());
  assert.deepEqual([...seenCats].sort(), [...KEEP_CATS].sort());
});

test("eval set: synthetic shapes only (555-01xx phones, example.* emails)", () => {
  for (const e of DATASET) {
    for (const [t, v] of e.pii) {
      if (t === "PHONE") assert.match(v.replace(/\D/g, ""), /^\d{3}5550[01]\d\d$|^5558670101$/, `${e.id}: ${v}`);
      if (t === "EMAIL") assert.match(v, /@example\.(com|org|net)$/, `${e.id}: ${v}`);
    }
  }
});

test("scorer: align recovers redacted spans and verifies the rebuild", () => {
  const input = "Call Dr. Lee at 212-555-0147 today";
  const output = "Call [name] at [phone] today";
  assert.deepEqual(align(input, output), [
    { start: 5, end: 12, token: "name" },
    { start: 16, end: 28, token: "phone" },
  ]);
  assert.deepEqual(align(input, input), []);
  assert.throws(() => align(input, "something else entirely"));
});

test("scorer: full / partial / missed and damaged hard negatives", () => {
  const entry = {
    id: "t1",
    kind: "clinical",
    text: "Pt Ana Q. Ruiz on Lipitor, seen 01/02/2025.",
    pii: [["NAME", "Ana Q. Ruiz"], ["DATE", "01/02/2025"]],
    keep: [["DRUG", "Lipitor"]],
  };
  const s = scoreSnippet(entry, "[name] Q. Ruiz on [name], seen 01/02/2025.");
  assert.deepEqual(s.entities.map((e) => e.status), ["partial", "missed"]);
  assert.equal(s.negatives[0].damaged, true);
  assert.deepEqual(s.emitted.map((e) => e.tp), [true, false]);
});

test("scorer: every profile's output aligns for every snippet", () => {
  for (const profile of Object.keys(PROFILES)) {
    const scores = DATASET.map((e) => scoreSnippet(e, redactText(e.text, { profile }).text));
    const agg = aggregate(scores);
    assert.equal(agg.overall.entities, DATASET.reduce((n, e) => n + locate(e.text, e.pii).length, 0));
  }
});
