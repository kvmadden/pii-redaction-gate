// perf.test.js: the rules run in linear time on long and hostile input
// (register 31, 36). The old email rule took 17 seconds on 100 KB of "a.".
// Budgets are loose on purpose so a slow or busy machine does not fail them.
// The growth check catches a quadratic rule: four times the input takes about
// four times as long when linear and sixteen times when quadratic, so the test
// fails above nine.

import { test } from "node:test";
import assert from "node:assert/strict";
import { redactText } from "../src/engine.js";

const OPTS = { profile: "identifiers", peopleMap: { people: [], safe: [] } };
// The fastest of three runs, so a busy machine does not read as a slow rule.
function ms(text) {
  let best = Infinity;
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    const r = redactText(text, OPTS);
    best = Math.min(best, performance.now() - t0);
    assert.notEqual(r.status, "blocked");
  }
  return best;
}

redactText("warm up the lexicon", OPTS);

test("perf: hostile repeated shapes finish within budget and grow linearly", () => {
  for (const unit of ["a.", "a@", "1-", "Dr. ", "Aa ", "1/", "aa@aa.", "x"]) {
    const small = ms(unit.repeat(5000));
    const big = ms(unit.repeat(20000));
    assert.ok(big < 15000, `${JSON.stringify(unit)} x20000 took ${big.toFixed(0)} ms`);
    assert.ok(big < Math.max(small, 25) * 9, `${JSON.stringify(unit)}: ${small.toFixed(0)} ms, then ${big.toFixed(0)} ms at four times the size`);
  }
});

test("perf: a realistic 100 KB note finishes within budget", () => {
  const note = "Patient Inez Thorn (MRN 4471023), DOB 03/14/1951, seen at Mercy Ridge Hospital by Dr. Emrys Calder.\n" +
    "Past Medical History: HTN, DM2, Parkinson's disease. Continue lisinopril 10 mg daily.\n" +
    "Phone (330) 555-0177. Email inez.thorn@example.org. Lives at 16 Rosewood Terrace, Akron, OH 44301.\n";
  const text = note.repeat(Math.ceil(100000 / note.length));
  assert.ok(ms(text) < 20000);
});
