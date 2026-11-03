// scan.test.js: the residual scan. Each check turns a span the rules could not
// decide into a review item, so a result never reads as clean when part of the
// input was not understood (register 4, 26).

import { test } from "node:test";
import assert from "node:assert/strict";
import { redactText } from "../src/engine.js";
import { scanResidual, RESIDUAL_CHECKS } from "../src/scan.js";

const run = (text, extra = {}) => redactText(text, { profile: "identifiers", peopleMap: { people: [], safe: [] }, ...extra });

function flags(text, check) {
  const r = run(text);
  assert.equal(r.status, "review", `${JSON.stringify(text)} should need review, got ${r.status}: ${JSON.stringify(r.text)}`);
  assert.ok(r.review.some((x) => x.check === check), `${JSON.stringify(text)}: no ${check} item in ${JSON.stringify(r.review)}`);
  return r;
}

test("scan: every check is listed in the scan report", () => {
  const r = run("Continue metformin.");
  for (const c of RESIDUAL_CHECKS) assert.ok(r.scan.checks.includes(`residual:${c}`), c);
});

test("scan: an undecided capitalized word", () => {
  flags("Zarqavi seen today.", "names");
});

test("scan: an unlabeled long number and an unlabeled letter-digit code", () => {
  flags("Reference 12345678 noted.", "long-number");
  flags("Order #A-99812 shipped.", "code");
});

test("scan: a number that mixes digits with O, I or l (a scan error)", () => {
  flags("Callback 212.555.O147 tomorrow.", "ocr-number");
});

test("scan: letters in a script the rules do not read", () => {
  const r = flags("Patient 王伟 called about his refill.", "script");
  assert.match(r.review.find((x) => x.check === "script").reason, /Han/);
});

test("scan: invisible and direction-control characters", () => {
  flags("Inez​Thorn called.", "invisible");
});

test("scan: an email written to avoid detection", () => {
  flags("Write to ana [at] example [dot] org.", "obfuscated-email");
});

test("scan: a name field whose value was not redacted", () => {
  flags("Name: the patient", "name-label");
});

test("scan: a birth year with no reference date", () => {
  flags("DOB: 1930. Lives alone.", "birth-year");
  assert.equal(run("DOB: 1930. Lives alone.", { referenceDate: "2026-11-03" }).review.filter((x) => x.check === "birth-year").length, 0);
});

test("scan: spans in exempt code are not scanned, and say so", () => {
  const r = redactText("see `Okafor 12345678` here", { profile: "light", peopleMap: { people: [], safe: [] } });
  assert.equal(r.scan.exempt.length, 1);
  assert.equal(scanResidual("x 12345678 y", { skip: [{ start: 0, end: 12 }] }).length, 0);
});

test("scan: ordinary clinical text needs no review", () => {
  const r = run("Continue metformin 500 mg BID. A1c 7.4%, BP 138/84. Glasgow Coma Scale 15. Follow up in 2 weeks.");
  assert.equal(r.status, "clean");
  assert.deepEqual(r.review, []);
});

test("scan: a name spelled one letter at a time", () => {
  flags("It's for my mom, D-E-L-G-A-D-O.", "spelled-out");
  assert.equal(run("Moved to the U.S.A. in 1990.").status, "clean");
});
