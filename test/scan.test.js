// scan.test.js: the residual scan. Each check turns a span the rules could not
// decide into a review item, so a result never reads as clean when part of the
// input was not understood (register 4, 26).

import { test } from "node:test";
import assert from "node:assert/strict";
import { redactText } from "../src/engine.js";
import { scanResidual, RESIDUAL_CHECKS } from "../src/scan.js";
import { gateParsedTranscript, assertSendable, sendRedacted } from "../src/gate.js";

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

test("scan: grouped numeric identifiers require review before clinical text is sent", () => {
  const peopleMap = { people: [], safe: [] };
  for (const [source, text] of [
    ["call-transcript", "Caller quoted reference 58 17 29 44."],
    ["clinical-note", "Unlabeled number 58-17-29-44 was copied."],
    ["patient-message", "The note shows 58\n17\n29\n44."],
    ["clinical-note", "The number was 1234 5678."],
    ["clinical-note", "Tracking: 482 17-2944."],
    ["clinical-note", "Pasted reference 58\u00A017\u00A029\u00A044."],
    ["patient-message", "Reference 58\u202F17\u202F29\u202F44 in the message."],
  ]) {
    const gate = gateParsedTranscript({
      parsed: { firstUserMsg: text, operatorTurns: [], assistantTail: [] },
      source,
      peopleMap,
    });
    assert.equal(gate.status, "review", source + ": " + text);
    assert.ok(gate.review.some((item) => item.check === "grouped-number"), source + ": " + JSON.stringify(gate.review));
    assert.throws(() => assertSendable(gate), { name: "RedactionReviewRequiredError" });
    let sent = false;
    assert.throws(() => sendRedacted({
      parsed: { firstUserMsg: text, operatorTurns: [], assistantTail: [] },
      source,
      peopleMap,
      sink: () => { sent = true; },
    }), { name: "RedactionReviewRequiredError" });
    assert.equal(sent, false, "default send guard must refuse an unreviewed grouped number");
  }
});

test("scan: clinical measurements, dates and dose schedules are not grouped IDs", () => {
  for (const text of [
    "BP 120/80. A1c 7.4%. Take metformin 500 mg BID.",
    "Continue a 10-10-20 mg dose schedule.",
    "2026-11-13 and 11-13-2026 are dates. 2025-2026 is a year range.",
    "Visit 2026 11 13 09:30. BP 138/84.",
    "The dose is 200-100-200-100 mg daily.",
    "The count is 1250000 copies/mL.",
    "Visit date 2026\u202F11\u202F13. Dose 200\u00A0100\u00A0200\u00A0100 mg.",
  ]) {
    const r = run(text);
    assert.equal(r.review.filter((item) => item.check === "grouped-number").length, 0, text);
  }
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
