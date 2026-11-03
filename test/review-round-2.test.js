// review-round-2.test.js: one test per confirmed finding from the second
// outside review of PR 8 (GPT 6.1 Sol "G", Grok 4.7 "K"). Each failed on the
// branch before its fix. Inputs are fictional.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import * as lib from "../src/index.js";
import { redactText, redactParsedTranscript, assertSendable, writeQuarantineSidecar, rulesFor, DEFAULT_MAX_LENGTH } from "../src/index.js";
import { gateParsedTranscript, gateSummary, gateBodyText, sendRedacted } from "../src/gate.js";
import { run as cli } from "../bin/redaction-gate.js";

const EMPTY = { people: [], safe: [] };
const ID = { profile: "identifiers", peopleMap: EMPTY };
const REC = { source: "clinical-note", peopleMap: EMPTY };
const rt = (t, o = {}) => redactText(t, { ...ID, ...o });
const rec = (p) => redactParsedTranscript(p, REC);
/** Every occurrence of v left in the output sits inside a review span with the given check. */
function flaggedAt(r, v, check) {
  assert.notEqual(r.text.indexOf(v), -1, `${JSON.stringify(v)} is not in the output`);
  for (let at = r.text.indexOf(v); at >= 0; at = r.text.indexOf(v, at + 1)) {
    const end = at + v.length;
    assert.ok(r.review.some((x) => x.start < end && x.end > at && (!check || x.check === check)), `${JSON.stringify(v)} has no ${check || "review"} span in ${JSON.stringify(r.review)}`);
  }
}

// ── the send path ───────────────────────────────────────────────────────
test("R2 G1, K13: a sealed result cannot change after the check", () => {
  const r = rt("hi");
  assert.throws(() => { r.text = "ana@example.org"; }, TypeError);
  assert.equal(assertSendable(r).text, "hi");
  const review = rt("Seen at Riverside Clinic.");
  assert.throws(() => { review.status = "clean"; }, TypeError);
  assert.throws(() => assertSendable(review), { name: "RedactionReviewRequiredError" });
  const record = rec({ firstUserMsg: "Continue metformin." });
  assert.throws(() => { record.parsed.firstUserMsg = "SSN 123-45-6789"; }, TypeError);
  assert.throws(() => { record.review.push({}); }, TypeError);
  assert.equal(Object.getOwnPropertyDescriptor(record, "changes").writable, false);
});

test("R2 G1: no module exports a way to seal a hand-built object", () => {
  assert.equal(fs.existsSync(new URL("../src/seal.js", import.meta.url)), false);
  assert.equal("seal" in lib, false);
  for (const file of fs.readdirSync(new URL("../src/", import.meta.url))) {
    const src = fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /export\s+(?:function\s+seal\b|\{[^}]*\bseal\b[^}]*\})/, file);
  }
});

test("R2 K14: the summary and body helpers return new sealed gates and never change the old one", () => {
  const g = gateParsedTranscript({ parsed: { firstUserMsg: "hi" }, ...REC });
  const s = gateSummary("Call 212-555-0147", g, "clinical-note", EMPTY);
  const b = gateBodyText("Email ana@example.org", g, "clinical-note", EMPTY);
  assert.equal(assertSendable(s).summary, "Call [phone]");
  assert.equal(assertSendable(b).body, "Email [email]");
  assert.equal(g.summary, null);
  assert.equal(g.body, null);
  assert.equal(gateBodyText("x", { ...g }, "clinical-note", EMPTY).status, "blocked", "a copy of a gate is not a gate");
});

test("R2 K13: the sink gets the frozen, checked payload", () => {
  let got;
  sendRedacted({ parsed: { firstUserMsg: "Email ana@example.org" }, ...REC, sink: (p) => { got = p; } });
  assert.ok(Object.isFrozen(got) && Object.isFrozen(got.parsed));
  assert.throws(() => { got.parsed.firstUserMsg = "ana@example.org"; }, TypeError);
});

// ── the record walker ───────────────────────────────────────────────────
test("R2 G2: an array with its own map() or a changed prototype blocks", () => {
  const a = [];
  a.map = () => ["ana@example.org"];
  for (const parsed of [{ assistantTail: a }, { list: a }]) {
    const r = rec(parsed);
    assert.equal(r.status, "blocked");
    assert.ok(!JSON.stringify(r).includes("ana@example.org"));
  }
  class Tail extends Array {}
  assert.equal(rec({ assistantTail: Tail.from(["hi"]) }).status, "blocked");
});

test("R2 G3: an object used as a Map key blocks, and Maps and Sets come back as frozen arrays", () => {
  assert.equal(rec({ data: new Map([[{ email: "ana@example.org" }, 1]]) }).status, "blocked");
  const r = rec({ counts: new Map([["Bash", 2]]), models: new Set(["model-a"]) });
  assert.equal(r.status, "clean");
  assert.deepEqual(r.parsed.counts, [["Bash", 2]]);
  assert.deepEqual(r.parsed.models, ["model-a"]);
  assert.ok(Object.isFrozen(r.parsed.counts));
});

test("R2 G4, K16, G17d: a key the rules would flag blocks, and never appears in error fields", () => {
  for (const parsed of [{ "12345678": 1 }, { "4471023": "stable" }, { m: new Map([["4471023", "stable"]]) }, { "12345678": new Date() }]) {
    const r = rec(parsed);
    assert.equal(r.status, "blocked");
    assert.ok(!JSON.stringify(r).includes("4471023") && !JSON.stringify(r).includes("12345678"));
  }
});

test("R2 G5, K15: a number is read with its key as a label", () => {
  for (const parsed of [{ mrn: 12345678 }, { age: 96 }, { phone: 2125550147 }, { zip: 43017 }, { id: 123456789n }]) {
    assert.equal(rec(parsed).status, "blocked", JSON.stringify(parsed, (k, v) => (typeof v === "bigint" ? `${v}n` : v)));
  }
  assert.deepEqual(rec({ hr: 72, count: 3, dose: 2.5, age: 45 }).parsed, { hr: 72, count: 3, dose: 2.5, age: 45 });
  assert.throws(() => sendRedacted({ parsed: { firstUserMsg: "stable", mrn: 4471023 }, ...REC, sink: () => {} }), { name: "RedactionBlockedError" });
});

test("R2 G17a: an unknown source blocks a record even when it is empty", () => {
  const r = redactParsedTranscript({}, { source: "clinical_note" });
  assert.equal(r.status, "blocked");
  assert.throws(() => assertSendable(r), { name: "RedactionBlockedError" });
});

test("R2 G17b: a Proxy that throws while being read blocks instead of escaping with input text", () => {
  const p = new Proxy({}, { getPrototypeOf() { throw new Error("ana@example.org"); } });
  const r = rec(p);
  assert.equal(r.status, "blocked");
  assert.ok(!JSON.stringify(r).includes("ana@example.org"));
});

test("R2 G17c: a shared, acyclic reference is not a cycle", () => {
  const shared = { note: "hi" };
  assert.equal(rec({ a: shared, b: shared }).status, "clean");
});

test("R2 G17e, K19: a huge sparse array blocks at once", () => {
  const a = [];
  a[50_000_000] = "ok";
  const t0 = performance.now();
  assert.equal(rec({ list: a }).status, "blocked");
  assert.ok(performance.now() - t0 < 1000);
});

test("R2 G17f: record and gate results carry a scan report", () => {
  const r = rec({ firstUserMsg: "Email ana@example.org", turns: [{ text: "hi" }] });
  assert.equal(r.scan.fields, 2);
  assert.equal(r.scan.characters, "Email ana@example.org".length + 2);
  assert.ok(r.scan.knownGaps.length > 0);
  assert.ok(gateParsedTranscript({ parsed: { firstUserMsg: "hi" }, ...REC }).scan.checks.length > 0);
});

test("R2 K20: a __proto__ key stays an own property and does not change the prototype", () => {
  const r = rec(JSON.parse('{"__proto__": {"note": "Call 212-555-0147"}, "firstUserMsg": "hi"}'));
  assert.ok(Object.prototype.hasOwnProperty.call(r.parsed, "__proto__"));
  assert.equal(Object.getPrototypeOf(r.parsed), Object.prototype);
  assert.equal(r.parsed.__proto__.note, "Call [phone]");
});

test("R2 K23: a caller cannot raise the input length cap", () => {
  assert.equal(rt("x".repeat(DEFAULT_MAX_LENGTH + 1), { maxLength: Number.MAX_VALUE }).status, "blocked");
});

test("R2 K30: requirePeopleMap blocks when the map cannot be read", () => {
  const before = process.env.REDACTION_PEOPLE_PATH;
  process.env.REDACTION_PEOPLE_PATH = path.join(os.tmpdir(), "no-such-people-map.json");
  try {
    assert.equal(gateParsedTranscript({ parsed: { firstUserMsg: "hi" }, source: "clinical-note", requirePeopleMap: true }).status, "blocked");
    const g = gateParsedTranscript({ parsed: { firstUserMsg: "hi" }, ...REC });
    assert.equal(gateSummary("hi", g, "clinical-note", undefined, { requirePeopleMap: true }).status, "blocked");
  } finally {
    if (before === undefined) delete process.env.REDACTION_PEOPLE_PATH;
    else process.env.REDACTION_PEOPLE_PATH = before;
  }
});

// ── names ───────────────────────────────────────────────────────────────
test("R2 G6: a bracketed word from the input is not trusted as a redaction", () => {
  flaggedAt(rt("[smith]"), "[smith]", "bracketed-word");
  flaggedAt(rt("[jane] called."), "[jane]");
  flaggedAt(rt("Name: [jane] smith"), "smith", "name-label");
  assert.equal(rt("Name: [name], MD").status, "clean");
  assert.equal(rt("He said [sic] it hurt.").status, "clean");
});

test("R2 G7, K2: names in capitals, mixed case or before a bare number are not passed", () => {
  for (const t of ["ZARQAVI", "zArQaVi", "Zarqavi 12"]) flaggedAt(rt(t), t.split(" ")[0]);
  assert.equal(rt("Hgb 9.1 and QTc 478.").status, "clean");
  flaggedAt(rt("GRACE IS 72 AND LIVES ALONE."), "GRACE");
  for (const t of ["BROWN, GRACE is stable on metformin.", "XQVRZPL ARRIVED THIS MORNING.", "OKONKWO-DIAZ arrived."]) {
    assert.match(rt(t).text, /^\[name\]/, t);
  }
});

test("R2 G8: a person label outranks an eponym construction", () => {
  assert.equal(rt("Patient: Okafor lymphoma").text, "Patient: [name] lymphoma");
  assert.equal(rt("Patient: Smith disease").text, "Patient: [name] disease");
  assert.equal(rt("Re: Parkinson disease follow-up").text, "Re: Parkinson disease follow-up");
});

test("R2 G9: a capitalized word after a title is never cleared by a word list", () => {
  for (const [t, w] of [["Dr. Synthroid", "Synthroid"], ["Dr. Sclerosis", "Sclerosis"], ["Dr. The", "The"]]) flaggedAt(rt(t), w);
  assert.equal(rt("Mr. and Mrs. Smith arrived.").text, "Mr. and Mrs. [name] arrived.");
});

test("R2 K1: lowercase names that are not first names", () => {
  assert.equal(rt("hrytsenko called about his refill.").text, "[name] called about his refill.");
  flaggedAt(rt("saw okafor yesterday."), "okafor");
  assert.equal(rt("foley catheter in place").status, "clean");
  assert.equal(rt("okay thx").status, "clean");
});

test("R2 K3: a name-list word as the subject of a copula at a sentence start", () => {
  const r = rt("Brown is a 54-year-old man with diabetes. White is allergic to penicillin.");
  flaggedAt(r, "Brown");
  flaggedAt(r, "White");
});

test("R2 K27: people-map names match with or without accents", () => {
  const map = { people: [{ name: "Jose", role: "patient" }, { name: "Søren Ng", role: "family" }], safe: [] };
  assert.equal(rt("josé called. Then SOREN NG called.", { peopleMap: map }).text, "[patient] called. Then [family] called.");
});

test("R2: pronouns are never names (found while checking G7)", () => {
  for (const t of ["He reports chest pain.", "You called yesterday.", "He said it hurt."]) assert.equal(rt(t).text, t);
});

test("R2 G15, K24: clinical words after a medication or culture word are kept or flagged, never removed", () => {
  flaggedAt(rt("Culture grew Candida."), "Candida");
  assert.equal(rt("CBC WBC RBC HGB HCT MCV MCH MCHC PLT").text, "CBC WBC RBC HGB HCT MCV MCH MCHC PLT");
  assert.equal(rt("Start Allegra daily.").status, "clean");
  flaggedAt(rt("Start Zorvathin daily."), "Zorvathin");
});

// ── pattern rules ───────────────────────────────────────────────────────
test("R2 G16: dates are real calendar dates, and a month before a dose is not a date", () => {
  assert.equal(rt("Seen 2026-02-31.").text, "Seen 2026-02-31.");
  assert.equal(rt("March 99, 2026").text, "March 99, 2026");
  assert.equal(rt("March 5 mg prednisone.").text, "March 5 mg prednisone.");
  assert.equal(rt("Admitted 02/29/2024 and 02/29/2023.").text, "Admitted [date] and 02/29/2023.");
  assert.equal(rt("Seen 17th April 2026 in clinic.").text, "Seen [date] in clinic.");
});

test("R2 register 48: the date-of-birth rule runs before the clinical date rules, by name not position", () => {
  const types = rulesFor({ clinical: true }).map((r) => r.type);
  assert.ok(types.indexOf("dob") < types.indexOf("date"));
  assert.equal(rt("DOB 03/04/1961.").text, "DOB [dob].");
});

test("R2 K7: an unlabeled SSN with spaces or dots", () => {
  assert.equal(rt("123 45 6789").text, "[ssn]");
  assert.equal(rt("123.45.6789").text, "[ssn]");
  assert.equal(rt("666 12 3456").text, "666 12 3456");
});

test("R2 K8, G10: ages over 89 with =, a Unicode dash or fullwidth digits", () => {
  assert.equal(rt("Age=96.").text, "Age=[age].");
  assert.equal(rt("A 96–year–old man.").text, "A [age] man.");
  assert.equal(rt("Age: ９６.").text, "Age: [age].");
  flaggedAt(rt("Age - 97 per daughter"), "97", "age");
});

test("R2 G11, K9: one birth-year grammar for the rule and the scan", () => {
  for (const t of ["Year of birth: 1930.", "born on 1930.", "birthday: 1930.", "DOB: １９３０."]) {
    assert.match(rt(t, { referenceDate: "2026-11-03" }).text, /\[dob\]/, t);
    flaggedAt(rt(t), t.match(/[0-9０-９]{4}/)[0], "birth-year");
  }
});

test("R2 K12: a local number after 'number is', and the residual check for the rest", () => {
  assert.equal(rt("Best number is 555-0142.").text, "Best number is [phone].");
  flaggedAt(rt("Reach her on 555-0142 later."), "555-0142", "phone");
  assert.equal(rt("Dose 250-1000 mg daily.").status, "clean");
});

// ── residual scan ───────────────────────────────────────────────────────
test("R2 G10: digits and words in scripts the rules do not read", () => {
  flaggedAt(rt("Phone: ٥٥٥-١٢٣٤"), "٥٥٥", "script");
  flaggedAt(rt("abc１２３４５６"), "abc", "code");
  flaggedAt(rt("ΔΗΜΗΤΡΗΣ"), "ΔΗΜ");
  assert.equal(rt("β-blocker started").status, "clean");
});

test("R2 G12, K4, K6: residual escapes", () => {
  flaggedAt(rt("Reference: .12345678"), "12345678", "long-number");
  flaggedAt(rt("ABC_123456"), "ABC_123456", "code");
  flaggedAt(rt("Phone 212 555 OOOO"), "OOOO", "ocr-number");
  flaggedAt(rt("write to ana at example.org"), "example", "obfuscated-email");
  flaggedAt(rt("Write to billing @ example.com about it."), "example", "obfuscated-email");
  flaggedAt(rt("the surname is d-e-l-g-a-d-o."), "d-e-l-g-a-d-o", "spelled-out");
  assert.equal(rt("Seen at 10.30 today.").status, "clean");
});

test("R2 K5: a person field on the next line or after Patient:", () => {
  flaggedAt(rt("Patient: xqvrzpl"), "xqvrzpl", "name-label");
  flaggedAt(rt("Name:\nxqvrzpl"), "xqvrzpl", "name-label");
  assert.equal(rt("Patient: alert and oriented").status, "clean");
});

test("R2 K10, K11: a Luhn-failing card number and a hidden direction control", () => {
  flaggedAt(rt("Card 4111 1111 1111 1112."), "4111", "card");
  flaggedAt(rt("Call 123⁦-45-6789 now"), "⁦", "invisible");
});

test("R2 G13: a value longer than its rule reads goes to review", () => {
  flaggedAt(rt("URL https://example.org/" + "a".repeat(2500)), "[url]", "token-run");
});

test("R2 K21, G15: clinical codes, units and abbreviations do not flood review", () => {
  for (const t of ["C.O.P.D. and G.E.R.D. and M.R.S.A.", "Stage T3N2M0 disease.", "ICD S52521A", "HIV RNA 1250000 copies/mL"]) assert.equal(rt(t).status, "clean", t);
});

test("R2 K31: the scan report says the topic tier did not run", () => {
  assert.ok(rt("hi").scan.notChecked.includes("topics"));
});

// ── quarantine ──────────────────────────────────────────────────────────
test("R2 G18: the quarantine refuses a symlinked or shared directory and reports only fixed codes", () => {
  const changes = [{ field: "x", before: "a", after: "b" }];
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "r2q-"));
  const root = path.join(base, "root");
  const elsewhere = path.join(base, "elsewhere");
  fs.mkdirSync(root, { mode: 0o700 });
  fs.mkdirSync(elsewhere);
  fs.symlinkSync(elsewhere, path.join(root, "2026-11-03"));
  const linked = writeQuarantineSidecar({ source: "clinical-note", ref: "r", changes, dir: root, now: new Date("2026-11-03T00:00:00Z") });
  assert.deepEqual(linked, { path: null, error: "unsafe-directory" });
  assert.equal(fs.readdirSync(elsewhere).length, 0);
  const shared = fs.mkdtempSync(path.join(os.tmpdir(), "r2q-shared-"));
  fs.chmodSync(shared, 0o777);
  assert.equal(writeQuarantineSidecar({ source: "s", ref: "r", changes, dir: shared }).error, "unsafe-directory");
  const ref = { toString() { const e = new Error("x"); e.code = "ana@example.org"; throw e; } };
  assert.equal(writeQuarantineSidecar({ source: "s", ref, changes, dir: fs.mkdtempSync(path.join(os.tmpdir(), "r2q-")) }).error, "write-failed");
  const ok = writeQuarantineSidecar({ source: "Inez Thorn notes", ref: "MRN-1", changes, dir: path.join(base, "fresh") });
  assert.match(path.basename(ok.path), /^source-[0-9a-f]{8}--/, "an unregistered source is hashed in the file name");
  fs.rmSync(base, { recursive: true, force: true });
  fs.rmSync(shared, { recursive: true, force: true });
});

// ── command line ────────────────────────────────────────────────────────
test("R2 K29: help never exits 0 or writes to stdout, and options take --name=value", () => {
  const help = cli(["--help"]);
  assert.equal(help.code, 1);
  assert.equal(help.stdout, "");
  assert.match(help.stderr, /usage:/);
  const r = cli(["--source=clinical-note"], { readText: () => "Patient Inez Thorn." });
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "Patient [name].\n");
});

test("R2 G20: the command runs from a path with a space", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "r2 cli "));
  const repo = fileURLToPath(new URL("../", import.meta.url));
  for (const d of ["bin", "src"]) fs.cpSync(path.join(repo, d), path.join(dir, d), { recursive: true });
  fs.copyFileSync(path.join(repo, "package.json"), path.join(dir, "package.json"));
  const p = spawnSync(process.execPath, [path.join(dir, "bin", "redaction-gate.js")], { input: "Call 212-555-0147\n", encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  assert.equal(p.status, 0, p.stderr);
  assert.equal(p.stdout, "Call [phone]\n");
});
