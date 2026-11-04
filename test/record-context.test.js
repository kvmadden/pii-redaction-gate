import { test } from "node:test";
import assert from "node:assert/strict";
import { redactParsedTranscript, redactSummaryFields } from "../src/engine.js";
import { sendRedacted } from "../src/gate.js";

const cases = [
  ["mrn", "12345"],
  ["zip", "43017"],
  ["age", "96"],
  ["name", "will"],
  ["dob", "1930"],
];
const mixedCases = [
  ["12345 and nobody@example.invalid", "email redaction must not hide the MRN"],
  ["12345, email: nobody@example.invalid", "email replacement must not hide the labeled MRN"],
  ["nobody@example.invalid and 12345", "email replacement must not hide a trailing MRN"],
];

const shapes = (key, value) => [
  ["transcript", redactParsedTranscript, { [key]: value }],
  ["summary", redactSummaryFields, { [key]: value }],
  ["nested object", redactParsedTranscript, { nested: { [key]: value } }],
  ["array", redactParsedTranscript, { list: [{ [key]: value }] }],
  ["Map", redactParsedTranscript, { data: new Map([[key, value]]) }],
];

test("structured string labels fail closed across transcript, summary and nested record shapes", () => {
  for (const [key, value] of cases) {
    for (const [shape, redact, input] of shapes(key, value)) {
      const original = structuredClone(input);
      const result = redact(input);
      assert.equal(result.status, "blocked", `${shape} ${key}`);
      assert.deepEqual(input, original, `${shape} ${key} input immutability`);
    }
  }
});

test("contextual string block cannot be bypassed by review acceptance at send sink", () => {
  for (const [key, value] of cases) {
    for (const [shape, , parsed] of shapes(key, value)) {
      let sinkCalled = false;
      assert.throws(() => sendRedacted({
        parsed,
        source: "clinical-note",
        peopleMap: { people: [], safe: [] },
        acceptReview: true,
        sink: () => { sinkCalled = true; },
      }), { name: "RedactionBlockedError" }, `${shape} ${key}`);
      assert.equal(sinkCalled, false, `${shape} ${key}`);
    }
  }
});

test("direct replacements do not hide remaining contextual identifiers", () => {
  for (const [value, description] of mixedCases) {
    for (const [shape, redact, input] of shapes("mrn", value)) {
      const result = redact(input);
      assert.equal(result.status, "blocked", `${shape}: ${description}`);
    }
    for (const [shape, , parsed] of shapes("mrn", value)) {
      let sinkCalled = false;
      assert.throws(() => sendRedacted({
        parsed,
        source: "clinical-note",
        peopleMap: { people: [], safe: [] },
        sink: () => { sinkCalled = true; },
      }), { name: "RedactionBlockedError" }, `${shape}: ${description}`);
      assert.equal(sinkCalled, false, `${shape}: ${description}`);
    }
  }
});

test("ordinary direct value redactions remain available with value-relative changes", () => {
  const input = { note: "Call 212-555-0147 or email nobody@example.invalid" };
  const result = redactParsedTranscript(input);
  assert.equal(result.status, "clean");
  assert.equal(result.parsed.note, "Call [phone] or email [email]");
  assert.deepEqual(result.changes.map(({ before, after }) => ({ before, after })), [
    { before: input.note, after: result.parsed.note },
  ]);
});

test("benign labeled strings, empty values and established numeric blocks keep their behavior", () => {
  const input = { hr: 72, count: 3, dose: "10 mg", age: "45", note: "", visitCount: 8 };
  const result = redactParsedTranscript(input);
  assert.equal(result.status, "clean");
  assert.deepEqual(result.parsed, input);
  assert.equal(redactParsedTranscript({ mrn: 12345 }).status, "blocked");
});

test("camelCase and snake_case identifier keys retain their normalized context", () => {
  for (const input of [{ medicalRecordNumber: "12345" }, { medical_record_number: "12345" }]) {
    assert.equal(redactParsedTranscript(input).status, "blocked");
  }
});
