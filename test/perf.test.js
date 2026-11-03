// perf.test.js: the rules run in linear time on long and hostile input
// (register 31, 36). The old email rule took 17 seconds on 100 KB of "a.".
// Budgets are loose on purpose so a slow CI machine does not fail them. The
// growth check catches a quadratic rule: doubling the input must not come near
// quadrupling the time.

import { test } from "node:test";
import assert from "node:assert/strict";
import { redactText } from "../src/engine.js";

const OPTS = { profile: "identifiers", peopleMap: { people: [], safe: [] } };
function ms(text) {
  const t0 = performance.now();
  const r = redactText(text, OPTS);
  const took = performance.now() - t0;
  assert.notEqual(r.status, "blocked");
  return took;
}

redactText("warm up the lexicon", OPTS);

test("perf: hostile repeated shapes finish within budget and grow linearly", () => {
  for (const unit of ["a.", "a@", "1-", "Dr. ", "Aa ", "1/", "aa@aa.", "x"]) {
    const small = ms(unit.repeat(10000));
    const big = ms(unit.repeat(20000));
    assert.ok(big < 15000, `${JSON.stringify(unit)} x20000 took ${big.toFixed(0)} ms`);
    assert.ok(big < Math.max(small, 25) * 3.5, `${JSON.stringify(unit)}: ${small.toFixed(0)} ms then ${big.toFixed(0)} ms when doubled`);
  }
});

test("perf: a realistic 100 KB note finishes within budget", () => {
  const note = "Patient Inez Thorn (MRN 4471023), DOB 03/14/1951, seen at Mercy Ridge Hospital by Dr. Emrys Calder.\n" +
    "Past Medical History: HTN, DM2, Parkinson's disease. Continue lisinopril 10 mg daily.\n" +
    "Phone (330) 555-0177. Email inez.thorn@example.org. Lives at 16 Rosewood Terrace, Akron, OH 44301.\n";
  const text = note.repeat(Math.ceil(100000 / note.length));
  assert.ok(ms(text) < 20000);
});
