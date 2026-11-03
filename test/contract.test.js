// contract.test.js: the API contract around statuses, scan reports, records,
// the send path, the people map and the quarantine. Each test names the
// register issue it guards (see the PR description).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  redactText,
  redactParsedTranscript,
  redactSummaryFields,
  redactionMeta,
  assertSendable,
  loadPeopleMap,
  writeQuarantineSidecar,
  profileForSource,
  PATTERN_RULES,
  KNOWN_GAPS,
  BLOCKED_TEXT,
  REDACTION_VERSION,
} from "../src/index.js";
import { gateParsedTranscript, gateSummary, sendRedacted, redactionMetaForRow, describeGate } from "../src/gate.js";

const EMPTY = { people: [], safe: [] };
const ID = { profile: "identifiers", peopleMap: EMPTY };

// ── statuses and the scan report (register 4, 23) ─────────────────────
test("contract: a clean result reports what was read, which checks ran, and its known gaps", () => {
  const r = redactText("Continue metformin 500 mg BID.", ID);
  assert.equal(r.status, "clean");
  assert.equal(r.scan.characters, 30);
  assert.equal(r.scan.read, 30);
  assert.deepEqual(r.scan.exempt, []);
  assert.ok(r.scan.checks.includes("unknown-names"));
  assert.ok(r.scan.checks.includes("residual:names"));
  assert.deepEqual(r.scan.notChecked, []);
  assert.deepEqual(r.scan.knownGaps, KNOWN_GAPS);
  assert.ok(KNOWN_GAPS.length > 0);
});

test("contract: a weaker profile lists the checks it does not run", () => {
  const r = redactText("Continue metformin.", { profile: "standard", peopleMap: EMPTY });
  for (const c of ["unknown-names", "date", "age", "residual-scan"]) assert.ok(r.scan.notChecked.includes(c), c);
});

test("contract: exempt code spans are reported as not read", () => {
  const r = redactText("see `jane@example.com` here", { profile: "light", peopleMap: EMPTY });
  assert.equal(r.scan.exempt.length, 1);
  assert.ok(r.scan.read < r.scan.characters);
});

test("contract: an undecidable word sends the result to review, with offsets into the output", () => {
  const r = redactText("Patient Inez Thorn seen at Riverside Clinic today.", ID);
  assert.equal(r.status, "review");
  assert.equal(r.review.length, 1);
  assert.equal(r.text.slice(r.review[0].start, r.review[0].end), "Riverside");
  assert.equal(r.review[0].check, "names");
});

test("contract: every result is sealed and the guard follows its status", () => {
  const clean = redactText("Continue metformin.", ID);
  const review = redactText("Seen at Riverside Clinic.", ID);
  const blocked = redactText(42, ID);
  assert.equal(assertSendable(clean), clean);
  assert.throws(() => assertSendable(review), { name: "RedactionReviewRequiredError" });
  assert.equal(assertSendable(review, { acceptReview: true }), review);
  assert.throws(() => assertSendable(blocked, { acceptReview: true }), { name: "RedactionBlockedError" });
  // A copy is not the sealed object: spreading a result does not carry the seal.
  assert.throws(() => assertSendable({ ...clean }), { name: "RedactionBlockedError" });
  assert.throws(() => assertSendable({ text: "x", blocked: false, status: "clean" }), { name: "RedactionBlockedError" });
});

test("contract: describeGate never says clean on its own", () => {
  const g = gateParsedTranscript({ parsed: { firstUserMsg: "Continue metformin." }, source: "clinical-note", peopleMap: EMPTY });
  assert.match(describeGate(g), /Not proof that no identifier remains/);
  const r = gateParsedTranscript({ parsed: { firstUserMsg: "Seen at Riverside Clinic." }, source: "clinical-note", peopleMap: EMPTY });
  assert.match(describeGate(r), /REVIEW REQUIRED/);
});

// ── inputs and options (register 8, 24, 34, 36) ────────────────────────
test("contract: unregistered and prototype-key sources block instead of picking a weaker profile", () => {
  for (const source of ["clinical_note", "constructor", "__proto__", "toString"]) {
    assert.equal(profileForSource(source), null, source);
    const r = redactText("Patient Inez Thorn, MRN 4471023.", { source, peopleMap: EMPTY });
    assert.equal(r.status, "blocked", source);
    assert.equal(r.text, BLOCKED_TEXT);
  }
  const fallback = redactText("Patient Inez Thorn.", { source: "clinical_note", unknownSource: "identifiers", peopleMap: EMPTY });
  assert.equal(fallback.text, "Patient [name].");
});

test("contract: no profile and no source uses the identifiers profile", () => {
  assert.equal(redactText("Patient Inez Thorn.").profile, "identifiers");
});

test("contract: input over maxLength blocks, and an invalid referenceDate blocks", () => {
  assert.equal(redactText("x".repeat(101), { ...ID, maxLength: 100 }).status, "blocked");
  assert.equal(redactText("DOB: 1930", { ...ID, referenceDate: "not a date" }).status, "blocked");
});

test("contract: a birth year is judged against referenceDate, and goes to review without one", () => {
  assert.equal(redactText("Born in 1930. Lives alone.", ID).status, "review");
  const dated = redactText("Born in 1930. Lives alone.", { ...ID, referenceDate: "2026-11-03" });
  assert.match(dated.text, /\[(?:dob|age|date)\]/);
  const young = redactText("Born in 1990. Lives alone.", { ...ID, referenceDate: "2026-11-03" });
  assert.equal(young.status, "clean");
  assert.match(young.text, /1990/);
});

test("contract: an exception object can never put input text into the result", () => {
  const thrower = [{ type: "x", re: /a/g, replace: () => { const e = new Error("ana@example.org"); e.name = "ana@example.org"; throw e; } }];
  const r = redactText("a ana@example.org", { ...ID, extraPatternRules: thrower });
  assert.equal(r.status, "blocked");
  assert.ok(!JSON.stringify(r).includes("ana@example.org"));
});

test("contract: the rule tables are frozen", () => {
  assert.ok(Object.isFrozen(PATTERN_RULES));
  assert.throws(() => PATTERN_RULES.push({}));
});

// ── structured records (register 5, 10) ─────────────────────────────────
test("contract: a non-object record blocks instead of passing through", () => {
  for (const parsed of ["Patient Inez Thorn", 42, ["Inez"]]) {
    const r = redactParsedTranscript(parsed, { source: "clinical-note", peopleMap: EMPTY });
    assert.equal(r.status, "blocked");
    assert.ok(!JSON.stringify(r).includes("Inez"));
  }
});

test("contract: a declared text field of the wrong type blocks (a string is not spread into characters)", () => {
  const r = redactParsedTranscript({ operatorTurns: "Inez Thorn called" }, { source: "clinical-note", peopleMap: EMPTY });
  assert.equal(r.status, "blocked");
  assert.ok(!JSON.stringify(r).includes("Inez"));
});

test("contract: every string anywhere in a record is redacted, including unlisted fields", () => {
  const parsed = { firstUserMsg: "hi", counts: { user: "ana@example.org" }, meta: { notes: ["Call 212-555-0147"] }, n: 3 };
  const r = redactParsedTranscript(parsed, { source: "clinical-note", peopleMap: EMPTY });
  assert.equal(r.parsed.counts.user, "[email]");
  assert.equal(r.parsed.meta.notes[0], "Call [phone]");
  assert.equal(r.parsed.n, 3);
  assert.equal(parsed.counts.user, "ana@example.org", "input untouched");
});

test("contract: unreadable values, cycles and identifier keys block", () => {
  const cyc = { firstUserMsg: "hi" };
  cyc.self = cyc;
  for (const parsed of [{ when: new Date() }, { buf: Buffer.from("x") }, cyc, { "ana@example.org": 1 }]) {
    assert.equal(redactParsedTranscript(parsed, { source: "clinical-note", peopleMap: EMPTY }).status, "blocked");
  }
  let deep = { v: "x" };
  for (let i = 0; i < 40; i++) deep = { deep };
  assert.equal(redactParsedTranscript({ deep }, { source: "clinical-note", peopleMap: EMPTY }).status, "blocked");
});

test("contract: originals live only on the non-enumerable changes list", () => {
  const g = gateParsedTranscript({ parsed: { firstUserMsg: "SSN 123-45-6789" }, source: "clinical-note", peopleMap: EMPTY });
  assert.ok(!JSON.stringify(g).includes("123-45-6789"));
  assert.ok(!Object.keys(g).includes("changes"));
  assert.equal(g.changes[0].before, "SSN 123-45-6789");
});

test("contract: the summary gate accepts a string or an object and blocks anything else", () => {
  const g = gateParsedTranscript({ parsed: { firstUserMsg: "hi" }, source: "clinical-note", peopleMap: EMPTY });
  assert.equal(gateSummary("Email ana@example.org", g, "clinical-note", EMPTY), "Email [email]");
  assert.deepEqual(gateSummary({ summary: "Call 212-555-0147", topics: ["ana@example.org"] }, g, "clinical-note", EMPTY), { summary: "Call [phone]", topics: ["[email]"] });
  assert.equal(redactSummaryFields(42, { source: "clinical-note", peopleMap: EMPTY }).status, "blocked");
});

// ── the send path (register 35) ─────────────────────────────────────────
test("contract: sendRedacted calls the sink only with redacted, sendable records", () => {
  const sent = [];
  const sink = (payload) => sent.push(payload);
  sendRedacted({ parsed: { firstUserMsg: "Email ana@example.org" }, source: "clinical-note", peopleMap: EMPTY, sink });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].parsed.firstUserMsg, "Email [email]");
  assert.equal(sent[0].meta.status, "clean");
  assert.throws(() => sendRedacted({ parsed: { firstUserMsg: "Seen at Riverside Clinic." }, source: "clinical-note", peopleMap: EMPTY, sink }), { name: "RedactionReviewRequiredError" });
  assert.throws(() => sendRedacted({ parsed: "raw", source: "clinical-note", peopleMap: EMPTY, sink }), { name: "RedactionBlockedError" });
  assert.throws(() => sendRedacted({ parsed: { firstUserMsg: "x" }, source: "nope", peopleMap: EMPTY, sink }), { name: "RedactionBlockedError" });
  assert.equal(sent.length, 1);
  sendRedacted({ parsed: { firstUserMsg: "Seen at Riverside Clinic." }, source: "clinical-note", peopleMap: EMPTY, sink, acceptReview: true });
  assert.equal(sent.length, 2);
});

test("contract: provenance stamps every gated row and takes an injected clock (register 40)", () => {
  const g = gateParsedTranscript({ parsed: { firstUserMsg: "hi" }, source: "clinical-note", peopleMap: EMPTY });
  const now = new Date("2026-11-03T12:00:00Z");
  assert.deepEqual(redactionMetaForRow(g, { now }), { version: REDACTION_VERSION, profile: "identifiers", status: "clean", hits: [], redactedAt: "2026-11-03T12:00:00.000Z" });
  assert.equal(redactionMeta({ profile: "x", hits: [], now }).redactedAt, "2026-11-03T12:00:00.000Z");
  assert.equal(REDACTION_VERSION, 3);
});

// ── people map (register 9) ─────────────────────────────────────────────
test("contract: a people map that fails to load is not cached, and required mode blocks", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pmap-"));
  const p = path.join(dir, "map.json");
  fs.writeFileSync(p, "{ not json");
  const stderr = process.stderr.write;
  process.stderr.write = () => true;
  try {
    assert.deepEqual(loadPeopleMap({ mapPath: p }), { people: [], safe: [] });
  } finally {
    process.stderr.write = stderr;
  }
  assert.throws(() => loadPeopleMap({ mapPath: p, required: true }), { name: "RedactionConfigError" });
  fs.writeFileSync(p, JSON.stringify({ people: [{ name: "Avery Sample", role: "patient" }], safe: [] }));
  assert.equal(loadPeopleMap({ mapPath: p }).people[0].name, "Avery Sample", "the fixed file is read, not a cached failure");
  const gate = gateParsedTranscript({ parsed: { firstUserMsg: "hi" }, source: "clinical-note", requirePeopleMap: true, peopleMap: undefined });
  // The committed default map is readable, so required mode passes here.
  assert.notEqual(gate.status, undefined);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("contract: known names map to role tokens and a nearby name part is caught", () => {
  const map = { people: [{ name: "Sample", role: "patient" }], safe: [] };
  const r = redactText("Avery Sample called.", { ...ID, peopleMap: map });
  assert.equal(r.text, "[name] [patient] called.");
});

// ── quarantine (register 10) ────────────────────────────────────────────
test("contract: the quarantine file name carries a hash of the ref, never the ref", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "quar-"));
  const out = writeQuarantineSidecar({ source: "clinical-note", ref: "MRN-4471023", profile: "identifiers", hits: [], changes: [{ field: "x", before: "a", after: "b" }], dir, now: new Date("2026-11-03T00:00:00Z") });
  assert.equal(out.error, null);
  assert.ok(!path.basename(out.path).includes("4471023"));
  assert.match(path.basename(out.path), /^clinical-note--[0-9a-f]{16}--/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("contract: the quarantine never throws on a bad clock or an unwritable path", () => {
  const changes = [{ field: "x", before: "a", after: "b" }];
  const bad = writeQuarantineSidecar({ source: "s", ref: "r", changes, dir: "/dev/null/nope", now: new Date("nope") });
  assert.equal(bad.path, null);
  assert.ok(bad.error);
  assert.ok(!String(bad.error).includes("/dev/null"));
});
