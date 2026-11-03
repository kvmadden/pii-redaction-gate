// fail-closed.test.js — if any stage of the redaction errors, the text is
// BLOCKED, never passed through. Each test injects a real failure into one
// stage (a broken pattern rule, a broken people map, a broken topic category,
// a misspelled profile, a non-string input) and asserts:
//   - the result is blocked and carries BLOCKED_TEXT, not the input
//   - no PII literal from the input appears anywhere in the result object
//   - at the writer surfaces, nothing from the input reaches the prompt or the
//     record, and assertSendable() refuses the record

import { test } from "node:test";
import assert from "node:assert/strict";

import { redactText, redactParsedTranscript, redactSummaryFields, BLOCKED_TEXT } from "../src/engine.js";
import { gateParsedTranscript, gateSummary, assertSendable, describeGate } from "../src/gate.js";
import { buildSummaryInput, buildTranscriptRow } from "../src/writers.js";

const PII = "Pt Dana Example, DOB 03/04/1961, cell 212-555-0147, dana.example@example.org";
const LITERALS = ["Dana", "Example", "03/04/1961", "212-555-0147", "dana.example@example.org"];
const EMPTY_MAP = { people: [], safe: [] };

function assertNoLeak(obj, label) {
  const s = JSON.stringify(obj);
  for (const lit of LITERALS) assert.ok(!s.includes(lit), `${label}: "${lit}" leaked → ${s.slice(0, 200)}`);
}

/** A pattern rule that throws (optionally only on a trigger). The rule tables
 *  are frozen, so failures are injected per call through extraPatternRules. */
function brokenRule(trigger = null) {
  return {
    type: "broken",
    re: /[\s\S]+/g,
    validate: (m) => {
      if (trigger === null || m.includes(trigger)) throw new RangeError("injected pattern failure");
      return false; // leave non-trigger text alone
    },
  };
}

test("fail-closed: a throwing PATTERN rule blocks the text (every profile)", () => {
  for (const profile of ["light", "standard", "identifiers", "strict"]) {
    const r = redactText(PII, { profile, peopleMap: EMPTY_MAP, extraPatternRules: [brokenRule()] });
    assert.equal(r.blocked, true, profile);
    assert.equal(r.text, BLOCKED_TEXT, profile);
    assert.equal(r.error.stage, "pattern");
    assert.equal(r.error.name, "RangeError");
    assertNoLeak(r, profile);
  }
  // the injected rule affects only that call: the next call redacts normally
  const ok = redactText(PII, { profile: "identifiers", peopleMap: EMPTY_MAP });
  assert.equal(ok.blocked, false);
  assert.ok(ok.text.includes("[phone]"), ok.text);
});

test("fail-closed: a broken people map blocks at normalization", () => {
  const poisoned = {
    get people() {
      throw new Error("map store unavailable");
    },
  };
  const r = redactText(PII, { profile: "standard", peopleMap: poisoned });
  assert.equal(r.blocked, true);
  assert.equal(r.text, BLOCKED_TEXT);
  assert.equal(r.error.stage, "people-map");
  assertNoLeak(r, "people-map");
});

test("fail-closed: a throwing NAME tier blocks the text", () => {
  // The people map is copied during normalization, so nothing caller-supplied
  // can make the name tier throw. A fault is injected at that stage instead.
  const r = redactText(PII, { profile: "identifiers", peopleMap: EMPTY_MAP, injectFault: "name" });
  assert.equal(r.blocked, true);
  assert.equal(r.text, BLOCKED_TEXT);
  assert.equal(r.error.stage, "name");
  assertNoLeak(r, "name");
});

test("fail-closed: a caller-marked __normalized map is normalized anyway", () => {
  const bad = { toString() { throw new TypeError("bad name entry"); } };
  const map = { __normalized: true, people: [{ names: [bad], role: "patient" }], safe: new Set() };
  const r = redactText(PII, { profile: "identifiers", peopleMap: map });
  assert.equal(r.blocked, false);
  assertNoLeak(r, "normalized");
});

test("fail-closed: a throwing TOPIC category blocks, and its error message (built from input) is not echoed", () => {
  const categories = [
    {
      type: "boom",
      test: (sentence) => {
        throw new Error(`could not classify: ${sentence}`);
      },
    },
  ];
  const r = redactText(PII, { profile: "standard", peopleMap: EMPTY_MAP, topicCategories: categories });
  assert.equal(r.blocked, true);
  assert.equal(r.text, BLOCKED_TEXT);
  assert.equal(r.error.stage, "topic");
  assert.deepEqual(Object.keys(r.error).sort(), ["name", "stage"]);
  assertNoLeak(r, "topic");
});

test("fail-closed: a misspelled explicit profile blocks instead of falling back to a weaker one", () => {
  for (const profile of ["strcit", "STRICT", "toString", 42]) {
    const r = redactText(PII, { profile, peopleMap: EMPTY_MAP });
    assert.equal(r.blocked, true, String(profile));
    assert.equal(r.text, BLOCKED_TEXT);
    assert.equal(r.error.stage, "profile");
    assertNoLeak(r, String(profile));
  }
});

test("fail-closed: non-string input is blocked, not returned as-is", () => {
  for (const input of [Buffer.from(PII), { text: PII }, [PII], 2125550147]) {
    const r = redactText(input, { profile: "strict", peopleMap: EMPTY_MAP });
    assert.equal(r.blocked, true);
    assert.equal(r.text, BLOCKED_TEXT);
    assert.equal(r.error.stage, "input");
    assertNoLeak(r, typeof input);
  }
  // null / undefined / "" carry nothing and still pass through unblocked
  for (const empty of [null, undefined, ""]) {
    assert.equal(redactText(empty, { profile: "strict" }).blocked, false);
  }
});

test("fail-closed: one failing field blocks that field and flags the whole record", () => {
  const parsed = {
    firstUserMsg: `TRIGGER ${PII}`,
    lastAssistantMsg: "follow-up booked, call 212-555-0199",
    operatorTurns: [{ text: `TRIGGER ${PII}` }, { text: "email front.desk@example.org" }],
    assistantTail: ["noted"],
    counts: { user: 2, assistant: 1 },
  };
  const r = redactParsedTranscript(parsed, { profile: "standard", peopleMap: EMPTY_MAP, extraPatternRules: [brokenRule("TRIGGER")] });
  assert.equal(r.blocked, true);
  assert.equal(r.parsed.firstUserMsg, BLOCKED_TEXT);
  assert.equal(r.parsed.operatorTurns[0].text, BLOCKED_TEXT);
  // the healthy fields were still redacted normally
  assert.equal(r.parsed.lastAssistantMsg, "follow-up booked, call [phone]");
  assert.equal(r.parsed.operatorTurns[1].text, "email [email]");
  assertNoLeak(r.parsed, "record");
});

test("fail-closed: a non-string field inside a record is blocked, not copied through", () => {
  const parsed = { firstUserMsg: { nested: PII }, operatorTurns: [{ text: [PII] }], assistantTail: [] };
  const r = redactParsedTranscript(parsed, { profile: "standard", peopleMap: EMPTY_MAP });
  assert.equal(r.blocked, true);
  assertNoLeak(r.parsed, "non-string field");
});

test("fail-closed: model-output summary with a failing field is blocked", () => {
  const r = redactSummaryFields({ summary: PII, topics: [PII], operatorDirections: [] }, { profile: "strict", peopleMap: EMPTY_MAP, extraPatternRules: [brokenRule()] });
  assert.equal(r.blocked, true);
  assert.equal(r.summary.summary, BLOCKED_TEXT);
  assertNoLeak(r.summary, "summary");
});

test("fail-closed: at the writer surfaces nothing leaks and assertSendable refuses the record", () => {
  const parsed = {
    firstUserMsg: PII,
    lastAssistantMsg: PII,
    operatorTurns: [{ text: PII }],
    assistantTail: [PII],
    counts: { user: 1, assistant: 1 },
    operatorTurnCount: 1,
  };
  // A people map that fails while it is being read makes every field fail.
  const poisoned = { get people() { throw new Error("map store unavailable"); } };
  const gate = gateParsedTranscript({ parsed, source: "clinical-note", body: PII, peopleMap: poisoned });
  const summaryGate = gateSummary({ summary: PII, topics: [], operatorDirections: [] }, gate, "clinical-note", poisoned);
  assert.equal(gate.blocked, true);
  assert.equal(gate.body, BLOCKED_TEXT);
  assert.equal(summaryGate.blocked, true);
  const prompt = buildSummaryInput(gate.parsed);
  const row = buildTranscriptRow({ recordId: "r1", parsed: gate.parsed, summary: summaryGate.summary, body: gate.body, source: "clinical-note" });
  assertNoLeak(prompt, "prompt");
  assertNoLeak(row, "row");
  assert.throws(() => assertSendable(gate), { name: "RedactionBlockedError" });
  assert.ok(describeGate(gate).includes("BLOCKED"));
});

test("fail-closed: a healthy gate is sendable", () => {
  const gate = gateParsedTranscript({
    parsed: { firstUserMsg: PII, operatorTurns: [], assistantTail: [] },
    source: "clinical-note",
    peopleMap: EMPTY_MAP,
  });
  assert.equal(gate.blocked, false);
  assert.equal(assertSendable(gate), gate);
});
