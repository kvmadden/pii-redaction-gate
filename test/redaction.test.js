// redaction.test.js — unit coverage for the layered redaction:
// pattern tier, name tier, topic tier, profiles, engine composition,
// quarantine sidecars, and the ingest gate helper.
// The COVENANT tests (corpus survival / idempotence / code-safety against
// real writer outputs) live in ./tripwire.test.js.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { applyPatterns, luhnOk } from "../src/patterns.js";
import { applyNames, normalizePeopleMap } from "../src/names.js";
import { applyTopics } from "../src/topics.js";
import { PROFILES, profileForSource, resolveProfile, DEFAULT_PROFILE } from "../src/profiles.js";
import { redactText, redactParsedTranscript, redactSummaryFields, splitCodeSegments, redactionMeta, REDACTION_VERSION } from "../src/engine.js";
import { writeQuarantineSidecar, defaultQuarantineDir } from "../src/quarantine.js";
import { loadPeopleMap, DEFAULT_PEOPLE_PATH } from "../src/index.js";
import { gateParsedTranscript, gateSummary, redactionMetaForRow, quarantineGate, describeGate } from "../src/gate.js";

// Synthetic test people map — these names are fictional placeholders.
const TEST_MAP = {
  people: [
    { name: "Alex", role: "family" },
    { name: "Sam", role: "family" },
    { name: "Robin", role: "kid" },
    { name: "Jordan", role: "kid" },
    { name: "Quinn", role: "kid" },
  ],
  safe: ["Acme", "Northwind", "Contoso"],
};

// ── pattern tier ─────────────────────────────────────────────────────

test("pattern: emails become [email]", () => {
  const r = applyPatterns("reach me at jane.doe+test@example.com or ops@sub.example.co.uk thanks");
  assert.ok(!r.text.includes("jane.doe+test@example.com"));
  assert.ok(!r.text.includes("ops@sub.example.co.uk"));
  assert.equal((r.text.match(/\[email\]/g) || []).length, 2);
});

test("pattern: phone shapes — parens, dashes, dots, +1, bare NANP", () => {
  const shapes = ["(312) 555-0147", "212-555-0147", "212.555.0147", "+1 212 555 0147", "7185550147"];
  for (const s of shapes) {
    const r = applyPatterns(`call ${s} tonight`);
    assert.ok(!r.text.includes(s), `should redact ${s} — got: ${r.text}`);
    assert.ok(r.text.includes("[phone]"), `token for ${s}`);
  }
});

test("pattern: phone does NOT eat versions, dates, epochs, or row ids", () => {
  const survivors = ["v0.61.0", "2026-06-11", "1749690000000", "id 1234567", "0.57.1"];
  for (const s of survivors) {
    const r = applyPatterns(`context ${s} more`);
    assert.ok(r.text.includes(s), `should keep ${s} — got: ${r.text}`);
  }
});

test("pattern: SSN dashed + labelled", () => {
  const a = applyPatterns("ssn is 123-45-6789 ok");
  assert.ok(!a.text.includes("123-45-6789"));
  const b = applyPatterns("SSN: 123456789 on file");
  assert.ok(!b.text.includes("123456789"), b.text);
  assert.ok(b.text.includes("[ssn]"));
});

test("pattern: DOB requires birth context; bare dates survive", () => {
  const hit = applyPatterns("her DOB: 4/12/1988 per the form");
  assert.ok(!hit.text.includes("4/12/1988"), hit.text);
  assert.ok(hit.text.includes("[dob]"));
  const words = applyPatterns("born on March 5, 2019 in the morning");
  assert.ok(!words.text.includes("March 5, 2019"), words.text);
  const miss = applyPatterns("the meeting is 4/12/2026 at noon");
  assert.ok(miss.text.includes("4/12/2026"));
});

test("pattern: credit cards are Luhn-gated", () => {
  assert.equal(luhnOk("4111111111111111"), true);
  assert.equal(luhnOk("1234567890123456"), false);
  const hit = applyPatterns("card 4111 1111 1111 1111 exp 11/28");
  assert.ok(!hit.text.includes("4111 1111 1111 1111"), hit.text);
  assert.ok(hit.text.includes("[card]"));
  const miss = applyPatterns("build artifact 1234 5678 9012 3456 cached");
  assert.ok(miss.text.includes("1234 5678 9012 3456"), miss.text);
});

test("pattern: labelled account/routing numbers", () => {
  const a = applyPatterns("account # 4421 8852 33 at the branch");
  assert.ok(!a.text.includes("4421 8852 33"), a.text);
  assert.ok(a.text.includes("[account]"));
  const b = applyPatterns("routing number 021000021 confirmed");
  assert.ok(!b.text.includes("021000021"), b.text);
});

test("pattern: street addresses with and without city/state tail", () => {
  const a = applyPatterns("ship to 742 Evergreen Terrace, Springfield, IL 62704 today");
  assert.ok(!a.text.includes("742 Evergreen Terrace"), a.text);
  assert.ok(a.text.includes("[address]"));
  const b = applyPatterns("met at 1600 Pennsylvania Ave before lunch");
  assert.ok(!b.text.includes("1600 Pennsylvania Ave"), b.text);
});

test("pattern: coordinates — decimal pair and degree notation", () => {
  const a = applyPatterns("pin at 12.3456, -45.6789 saved");
  assert.ok(!a.text.includes("12.3456"), a.text);
  assert.ok(a.text.includes("[coords]"));
  const b = applyPatterns("location 12.3456° N, 45.6789° W noted");
  assert.ok(!b.text.includes("12.3456"), b.text);
  const c = applyPatterns("versions 1.2, 3.4 are out"); // <4 decimals — survives
  assert.ok(c.text.includes("1.2, 3.4"));
});

test("pattern: hits carry tier/type/count, never raw text", () => {
  const r = applyPatterns("a@example.com and c@example.org plus 212-555-0147");
  const email = r.hits.find((h) => h.type === "email");
  assert.deepEqual(email, { tier: "pattern", type: "email", count: 2 });
  assert.ok(JSON.stringify(r.hits).indexOf("a@example.com") === -1);
});

// ── name tier ────────────────────────────────────────────────────────

test("names: known people become role tokens, case-insensitive, possessive-safe", () => {
  const map = normalizePeopleMap(TEST_MAP);
  const r = applyNames("Alex said ALEX's plan beats Jordan's idea, per robin", { map });
  assert.ok(!/alex/i.test(r.text), r.text);
  assert.ok(!/jordan/i.test(r.text), r.text);
  assert.ok(!/robin/i.test(r.text), r.text);
  assert.ok(r.text.includes("[family]") && r.text.includes("[kid]"));
  assert.ok(r.text.includes("[family]'s") || r.text.includes("[kid]'s"));
});

test("names: unknown-name pass is OFF by default (standard posture)", () => {
  const map = normalizePeopleMap(TEST_MAP);
  const r = applyNames("I met Sarah Connor near the office", { map, unknownNames: false });
  assert.ok(r.text.includes("Sarah Connor"));
});

test("names: strict unknown-name pass — pairs, honorifics, mid-sentence singles", () => {
  const map = normalizePeopleMap(TEST_MAP);
  const r = applyNames("I met Sarah Connor and Dr. Alvarez, then talked to Brandon about it", {
    map,
    unknownNames: true,
  });
  assert.ok(!r.text.includes("Sarah Connor"), r.text);
  assert.ok(!r.text.includes("Alvarez"), r.text);
  assert.ok(!r.text.includes("Brandon"), r.text);
  assert.ok(r.text.includes("[name]"));
});

test("names: strict pass keeps safe names, common words, and sentence starts", () => {
  const map = normalizePeopleMap(TEST_MAP);
  const r = applyNames("Monday I asked Northwind about Contoso. Acme shipped it. Thanks again", {
    map,
    unknownNames: true,
  });
  assert.ok(r.text.includes("Monday"), r.text);
  assert.ok(r.text.includes("Northwind"), r.text);
  assert.ok(r.text.includes("Contoso"), r.text);
  assert.ok(r.text.includes("Acme"), r.text);
  assert.ok(r.text.includes("Thanks"), r.text);
});

// ── topic tier ───────────────────────────────────────────────────────

test("topics: medical sentence with personal marker dies under standard gating", () => {
  const r = applyTopics("My doctor prescribed 40mg Lexapro for my anxiety. The build is green.", { strict: false });
  assert.ok(!r.text.includes("Lexapro"), r.text);
  assert.ok(!r.text.includes("40mg"), r.text);
  assert.ok(r.text.includes("[medical]"));
  assert.ok(r.text.includes("The build is green."));
});

test("topics: professional vocabulary WITHOUT personal marker survives standard", () => {
  const r = applyTopics("The team reviews prescription workflows end to end.", { strict: false });
  assert.ok(r.text.includes("prescription workflows"), r.text);
});

test("topics: strict drops the personal-marker gate", () => {
  const r = applyTopics("The patient was diagnosed with diabetes last spring.", { strict: true });
  assert.ok(!r.text.includes("diabetes"), r.text);
  assert.ok(r.text.includes("[medical]"));
});

test("topics: finances need amount + institution co-occurrence", () => {
  const hit = applyTopics("Moved $12,000 from Chase to the Vanguard brokerage.", { strict: false });
  assert.ok(!hit.text.includes("$12,000"), hit.text);
  assert.ok(hit.text.includes("[account]"));
  const amountOnly = applyTopics("The plan costs $20 a month.", { strict: false });
  assert.ok(amountOnly.text.includes("$20"), amountOnly.text);
  const instOnly = applyTopics("Chase finally fixed their login page.", { strict: false });
  assert.ok(instOnly.text.includes("Chase"), instOnly.text);
});

test("topics: legal sentence with personal marker", () => {
  const r = applyTopics("I talked to my attorney about the custody case. Lunch was fine.", { strict: false });
  assert.ok(!r.text.includes("attorney"), r.text);
  assert.ok(r.text.includes("[legal]"));
  assert.ok(r.text.includes("Lunch was fine."));
});

test("topics: kid details require kid context; honorific periods don't split the sentence", () => {
  const gated = applyTopics("[kid] starts at Lincoln Elementary, her teacher is Mrs. Tran. Then standup.", { strict: false });
  assert.ok(!gated.text.includes("Lincoln Elementary"), gated.text);
  assert.ok(!gated.text.includes("Tran"), gated.text);
  assert.ok(gated.text.includes("[kid-detail]"));
  assert.ok(gated.text.includes("Then standup."));
  const ungated = applyTopics("The school of thought on caching is split.", { strict: false });
  assert.ok(ungated.text.includes("school"), ungated.text);
});

// ── profiles ─────────────────────────────────────────────────────────

test("profiles: source mapping — dev light, free text standard, clinical identifiers, correspondence strict, unknown standard", () => {
  assert.equal(profileForSource("source-code"), "light");
  assert.equal(profileForSource("build-log"), "light");
  assert.equal(profileForSource("commit-message"), "light");
  assert.equal(profileForSource("chat-export"), "standard");
  assert.equal(profileForSource("free-text"), "standard");
  assert.equal(profileForSource("support-ticket"), "standard");
  assert.equal(profileForSource("free-text"), "standard");
  assert.equal(profileForSource("sms"), "strict");
  assert.equal(profileForSource("email"), "strict");
  assert.equal(profileForSource("voice-transcript"), "strict");
  assert.equal(profileForSource("call-transcript"), "strict");
  assert.equal(profileForSource("clinical-note"), "identifiers");
  assert.equal(profileForSource("discharge-summary"), "identifiers");
  assert.equal(profileForSource("some-new-app"), "standard");
  assert.equal(profileForSource(undefined), DEFAULT_PROFILE);
});

test("profiles: resolveProfile — explicit profile beats source", () => {
  assert.equal(resolveProfile({ profile: "strict", source: "source-code" }).name, "strict");
  assert.equal(resolveProfile({ source: "commit-message" }).name, "light");
  assert.equal(resolveProfile({}).name, "standard");
  assert.deepEqual(PROFILES.light.tiers, ["pattern"]);
});

test("profiles: resolveProfile degrades to default on null/undefined/non-object (never crashes)", () => {
  // A gate-first primitive must not throw "Cannot destructure" on a null arg —
  // it degrades to the default profile. redactText(text, null) relies on this.
  for (const bad of [undefined, null, "nope", 0, false]) {
    assert.equal(resolveProfile(bad).name, DEFAULT_PROFILE, `resolveProfile(${JSON.stringify(bad)}) should default`);
  }
  assert.equal(redactText("plain text, nothing here", null).profile, DEFAULT_PROFILE);
});

// ── engine ───────────────────────────────────────────────────────────

test("engine: light profile = patterns only — names and topics survive", () => {
  const r = redactText("Alex texted 212-555-0147 about my anxiety diagnosis", {
    source: "source-code",
    peopleMap: TEST_MAP,
  });
  assert.equal(r.profile, "light");
  assert.ok(!r.text.includes("212-555-0147"));
  assert.ok(r.text.includes("Alex"), r.text); // name tier inactive under light
  assert.ok(r.text.includes("anxiety"), r.text); // topic tier inactive under light
});

test("engine: standard profile runs all three tiers", () => {
  const r = redactText("Alex texted 212-555-0147. My doctor prescribed Lexapro for me.", {
    source: "free-text",
    peopleMap: TEST_MAP,
  });
  assert.equal(r.profile, "standard");
  assert.ok(!r.text.includes("212-555-0147"));
  assert.ok(!r.text.includes("Alex"));
  assert.ok(!r.text.includes("Lexapro"));
  assert.ok(r.redacted);
  const tiers = new Set(r.hits.map((h) => h.tier));
  assert.deepEqual([...tiers].sort(), ["name", "pattern", "topic"]);
});

test("engine: code spans are exempt under light, NOT under standard", () => {
  const text = "ping me at dana@example.com after running `sendMail('ops@example.com')` ok";
  const light = redactText(text, { source: "commit-message", peopleMap: TEST_MAP });
  assert.ok(!light.text.includes("dana@example.com"), light.text);
  assert.ok(light.text.includes("`sendMail('ops@example.com')`"), light.text);
  const standard = redactText(text, { source: "chat-export", peopleMap: TEST_MAP });
  assert.ok(!standard.text.includes("ops@example.com"), standard.text);
});

test("engine: splitCodeSegments handles fenced + inline + unfenced text", () => {
  const segs = splitCodeSegments("a `x` b ```js code()``` c");
  assert.deepEqual(segs.map((s) => s.code), [false, true, false, true, false]);
  assert.equal(segs.map((s) => s.text).join(""), "a `x` b ```js code()``` c");
  assert.deepEqual(splitCodeSegments("plain"), [{ code: false, text: "plain" }]);
});

test("engine: non-string and empty inputs pass through", () => {
  assert.equal(redactText("", { source: "email" }).redacted, false);
  assert.equal(redactText(null, { source: "email" }).text, null);
  assert.equal(redactText(undefined, {}).redacted, false);
});

test("engine: redactParsedTranscript covers all four text surfaces, input untouched", () => {
  const parsed = {
    firstUserMsg: "call 212-555-0147",
    lastAssistantMsg: "sent to a@example.com",
    operatorTurns: [{ at: null, text: "my ssn is 123-45-6789" }],
    assistantTail: ["card 4111 1111 1111 1111 saved"],
    durationMin: 5,
  };
  const r = redactParsedTranscript(parsed, { source: "source-code", peopleMap: TEST_MAP });
  assert.ok(!JSON.stringify(r.parsed).includes("212-555-0147"));
  assert.ok(!JSON.stringify(r.parsed).includes("123-45-6789"));
  assert.ok(!JSON.stringify(r.parsed).includes("4111 1111 1111 1111"));
  assert.ok(!JSON.stringify(r.parsed).includes("a@example.com"));
  assert.equal(r.parsed.durationMin, 5);
  assert.equal(r.changes.length, 4);
  // input untouched
  assert.ok(parsed.firstUserMsg.includes("212-555-0147"));
  assert.ok(parsed.operatorTurns[0].text.includes("123-45-6789"));
});

test("engine: redactSummaryFields gates summary/topics/quotes", () => {
  const r = redactSummaryFields(
    {
      summary: "You set up forwarding to dana@example.com.",
      topics: ["forwarding", "212-555-0147"],
      operatorDirections: [{intent: "send email", raw_text: "send it to dana@example.com"}],
      model: "m",
    },
    { source: "source-code", peopleMap: TEST_MAP },
  );
  assert.ok(!JSON.stringify(r.summary).includes("dana@example.com"));
  assert.ok(!JSON.stringify(r.summary).includes("212-555-0147"));
  assert.equal(r.summary.model, "m");
  assert.ok(r.redacted);
});

test("engine: redactionMeta carries version/profile/hits, no text", () => {
  const meta = redactionMeta({ profile: "light", hits: [{ tier: "pattern", type: "email", count: 2 }] });
  assert.equal(meta.version, REDACTION_VERSION);
  assert.equal(meta.profile, "light");
  assert.deepEqual(meta.hits, [{ tier: "pattern", type: "email", count: 2 }]);
  assert.ok(meta.redactedAt);
});

// ── quarantine ───────────────────────────────────────────────────────

test("quarantine: sidecar lands under <dir>/<day>/ with originals, mode 0600", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "redaction-quarantine-"));
  const { path: sidecar, error } = writeQuarantineSidecar({
    source: "source-code",
    ref: "session-abc",
    profile: "light",
    hits: [{ tier: "pattern", type: "phone", count: 1 }],
    changes: [{ field: "operatorTurns[0]", before: "call 212-555-0147", after: "call [phone]" }],
    dir,
    now: new Date("2026-06-12T10:00:00Z"),
  });
  assert.equal(error, null);
  assert.ok(sidecar.startsWith(path.join(dir, "2026-06-12")));
  const body = JSON.parse(fs.readFileSync(sidecar, "utf8"));
  assert.equal(body.changes[0].before, "call 212-555-0147");
  assert.equal(body.profile, "light");
  const mode = fs.statSync(sidecar).mode & 0o777;
  assert.equal(mode, 0o600);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("quarantine: no changes → no file; fs failure → error, never throw", () => {
  const none = writeQuarantineSidecar({ source: "x", ref: "y", profile: "light", changes: [] });
  assert.deepEqual(none, { path: null, error: null });
  const bad = writeQuarantineSidecar({
    source: "x",
    ref: "y",
    profile: "light",
    changes: [{ field: "f", before: "b", after: "a" }],
    dir: "/dev/null/not-a-dir",
  });
  assert.equal(bad.path, null);
  assert.ok(bad.error);
});

test("quarantine: default dir is <home>/_redaction-quarantine, env-overridable", () => {
  assert.ok(defaultQuarantineDir({}).endsWith(path.join(os.homedir(), "_redaction-quarantine")));
  assert.equal(defaultQuarantineDir({ REDACTION_QUARANTINE_DIR: "/tmp/q" }), "/tmp/q");
});

// ── people map loading ───────────────────────────────────────────────

test("people map: committed default is empty; the example map is synthetic and loads", () => {
  const map = loadPeopleMap({ mapPath: DEFAULT_PEOPLE_PATH, force: true });
  assert.ok(fs.existsSync(DEFAULT_PEOPLE_PATH));
  assert.deepEqual(map.people, []);
  assert.deepEqual(map.safe, []);
  const examplePath = path.join(path.dirname(DEFAULT_PEOPLE_PATH), "people-map.example.json");
  const example = loadPeopleMap({ mapPath: examplePath, force: true });
  const r = redactText("Avery Sample called; Dr. Testwell reviewed the chart with Jordan.", {
    profile: "standard",
    peopleMap: example,
  });
  assert.equal(r.text, "[patient] called; [clinician] reviewed the chart with [family].");
});

test("people map: unreadable path → empty map, no throw", () => {
  const map = loadPeopleMap({ mapPath: "/nope/missing.json", force: true });
  assert.deepEqual(map, { people: [], safe: [] });
});

// ── gate helper ──────────────────────────────────────────────────────

function fixtureParsed() {
  return {
    firstUserMsg: "email jane.doe@example.com about the visit",
    lastAssistantMsg: "done — confirmation sent",
    operatorTurns: [
      { at: null, text: "email jane.doe@example.com about the visit" },
      { at: null, text: "my cell is (312) 555-0147 if anything breaks" },
    ],
    assistantTail: ["I emailed jane.doe@example.com and left a note."],
    counts: { user: 2, assistant: 1 },
    toolUseCounts: new Map(),
    modelsUsed: new Set(),
    topTools: [],
    durationMin: 12,
    durationMs: 720000,
    firstTurnAt: null,
    lastTurnAt: null,
    dayMinutes: null,
    operatorTurnCount: 2,
    lineCount: 3,
    parsedCount: 3,
  };
}

test("gate: gateParsedTranscript redacts under the per-source profile and reports changes", () => {
  const gate = gateParsedTranscript({ parsed: fixtureParsed(), source: "source-code", peopleMap: TEST_MAP });
  assert.equal(gate.profile, "light");
  assert.ok(gate.redacted);
  assert.ok(!JSON.stringify(gate.parsed).includes("jane.doe@example.com"));
  assert.ok(!JSON.stringify(gate.parsed).includes("(312) 555-0147"));
  assert.ok(gate.changes.length >= 3);
  assert.ok(describeGate(gate).includes("light"));
});

test("gate: body text is gated and merged into the same sidecar payload", () => {
  const gate = gateParsedTranscript({
    parsed: fixtureParsed(),
    source: "source-code",
    body: "raw line with 212-555-0147 inside",
    peopleMap: TEST_MAP,
  });
  assert.ok(!gate.body.includes("212-555-0147"));
  assert.ok(gate.changes.some((c) => c.field === "body"));
});

test("gate: gateSummary re-gates model output and accumulates into the gate", () => {
  const gate = gateParsedTranscript({ parsed: fixtureParsed(), source: "source-code", peopleMap: TEST_MAP });
  const before = gate.changes.length;
  const summary = gateSummary(
    { summary: "You emailed jane.doe@example.com twice.", topics: ["email"], operatorDirections: [] },
    gate,
    "source-code",
    TEST_MAP,
  );
  assert.ok(!summary.summary.includes("jane.doe@example.com"));
  assert.ok(gate.changes.length > before);
  assert.ok(gate.changes.some((c) => c.field.startsWith("summary.")));
});

test("gate: redactionMetaForRow stamps provenance only when something was redacted", () => {
  const gate = gateParsedTranscript({ parsed: fixtureParsed(), source: "source-code", peopleMap: TEST_MAP });
  const meta = redactionMetaForRow(gate);
  assert.equal(meta.profile, "light");
  assert.ok(meta.hits.length >= 1);
  assert.ok(!JSON.stringify(meta).includes("jane.doe"));
  const cleanParsed = { ...fixtureParsed(), firstUserMsg: "hi", lastAssistantMsg: "ok", operatorTurns: [], assistantTail: [] };
  const cleanGate = gateParsedTranscript({ parsed: cleanParsed, source: "source-code", peopleMap: TEST_MAP });
  assert.equal(redactionMetaForRow(cleanGate), null);
});

test("gate: quarantineGate writes one sidecar per gated session", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "redaction-gate-"));
  const gate = gateParsedTranscript({ parsed: fixtureParsed(), source: "source-code", peopleMap: TEST_MAP });
  const sidecar = quarantineGate(gate, { source: "source-code", ref: "sess-1", dir });
  assert.ok(sidecar && fs.existsSync(sidecar));
  const body = JSON.parse(fs.readFileSync(sidecar, "utf8"));
  assert.ok(body.changes.some((c) => String(c.before).includes("jane.doe@example.com")));
  fs.rmSync(dir, { recursive: true, force: true });
});
