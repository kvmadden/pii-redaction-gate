// tripwire.test.js — THE COVENANT for the redaction layer: personal details,
// names, and sensitive topics are removed before any text crosses the trust
// boundary (a model prompt or a record write).
//
//   1. CORPUS SURVIVAL — a synthetic PII fixture corpus (phones / SSNs /
//      addresses / cards / emails / coords / names / medical / finance /
//      legal / kid lines). NO fixture survives to any WRITER OUTPUT
//      (buildSummaryInput → the LLM egress; buildTranscriptRow +
//      transcriptPatchBody → the row egress) under each profile's active
//      tiers.
//   2. IDEMPOTENCE — re-redacting redacted text is a no-op, every profile.
//   2b. CONTENT KEPT — under `identifiers`, clinical content (drug, dose, lab
//      value) survives while the identifiers in the same note die.
//   3. CODE-SAFETY — a code block with an email-shaped string in a
//      dev-profile source survives BYTE-IDENTICAL (code must not be mangled).
//
// MAINTENANCE RULE: fixtures are ADD-ONLY. Removing a fixture silently
// narrows the covenant. All PII here is SYNTHETIC (555 numbers, invalid SSNs,
// fictional people/addresses).

import { test } from "node:test";
import assert from "node:assert/strict";

import { redactText, PROFILES } from "../src/engine.js";
import { SOURCE_PROFILES, profileForSource } from "../src/profiles.js";
import { SENSITIVE_SOURCE_IDS, SENSITIVE_SOURCE_PROFILES } from "../src/sensitive-sources.js";
import { gateParsedTranscript, gateSummary } from "../src/gate.js";
import { buildSummaryInput, buildTranscriptRow, transcriptPatchBody } from "../src/writers.js";

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

// ── the PII fixture corpus (synthetic, add-only) ─────────────────────
// tier:
//   pattern       → must die under every profile
//   name          → must die under standard + identifiers + strict (known people map)
//   name-unknown  → must die under identifiers + strict
//   topic         → must die under standard + strict (personal-marker present)
//   topic-strict  → must die under strict only (no personal marker)
export const PII_CORPUS = [
  // pattern — phones
  { tier: "pattern", text: "call me at (312) 555-0147 when it deploys", mustDie: ["(312) 555-0147"] },
  { tier: "pattern", text: "backup line 415-555-0186 if the first rings out", mustDie: ["415-555-0186"] },
  { tier: "pattern", text: "her cell 617.555.0123 is on the fridge", mustDie: ["617.555.0123"] },
  { tier: "pattern", text: "text +1 646 555 0177 before 9", mustDie: ["+1 646 555 0177"] },
  { tier: "pattern", text: "dial 7185550147 from the lobby phone", mustDie: ["7185550147"] },
  // pattern — emails
  { tier: "pattern", text: "forward it to jane.doe+billing@example.com today", mustDie: ["jane.doe+billing@example.com"] },
  { tier: "pattern", text: "the contractor uses bids@acme-roofing.example.net for quotes", mustDie: ["bids@acme-roofing.example.net"] },
  // pattern — SSN / DOB
  { tier: "pattern", text: "the form wants 123-45-6789 again", mustDie: ["123-45-6789"] },
  { tier: "pattern", text: "SSN: 987654321 was typed into the portal", mustDie: ["987654321"] },
  { tier: "pattern", text: "her DOB: 4/12/1988 goes in box 3", mustDie: ["4/12/1988"] },
  { tier: "pattern", text: "he was born on March 5, 2019 at home", mustDie: ["March 5, 2019"] },
  // pattern — card / account
  { tier: "pattern", text: "card on file 4111 1111 1111 1111 expires soon", mustDie: ["4111 1111 1111 1111"] },
  { tier: "pattern", text: "use card 5500-0000-0000-0004 for the renewal", mustDie: ["5500-0000-0000-0004"] },
  { tier: "pattern", text: "checking account # 4421 8852 33 at the branch", mustDie: ["4421 8852 33"] },
  { tier: "pattern", text: "routing number 021000021 plus the account", mustDie: ["021000021"] },
  // pattern — address / coords
  { tier: "pattern", text: "ship it to 742 Evergreen Terrace, Springfield, IL 62704 please", mustDie: ["742 Evergreen Terrace"] },
  { tier: "pattern", text: "the open house is at 4501 W Cypress Street tomorrow", mustDie: ["4501 W Cypress Street"] },
  { tier: "pattern", text: "dropped a pin at 12.3456, -45.6789 for the meetup", mustDie: ["12.3456", "-45.6789"] },
  { tier: "pattern", text: "site survey at 12.3456° N, 45.6789° W after lunch", mustDie: ["12.3456"] },

  // name — known people map (family deny-list parity)
  { tier: "name", text: "Alex wants the porch lights on a timer", mustDie: ["Alex"] },
  { tier: "name", text: "pick Robin up after practice, then grab Jordan", mustDie: ["Robin", "Jordan"] },
  { tier: "name", text: "Quinn drew on the wall again, Sam laughed", mustDie: ["Quinn", "Sam"] },

  // name-unknown — strict only
  { tier: "name-unknown", text: "I met Sarah Connor at the school fair", mustDie: ["Sarah Connor"] },
  { tier: "name-unknown", text: "we owe Dr. Alvarez a call back", mustDie: ["Alvarez"] },
  { tier: "name-unknown", text: "ask coach about Brandon and the carpool", mustDie: ["Brandon"] },

  // topic — personal-marker present (standard + strict)
  { tier: "topic", text: "My doctor prescribed 40mg Lexapro for my anxiety.", mustDie: ["Lexapro", "40mg", "anxiety"] },
  { tier: "topic", text: "I was diagnosed with type 2 diabetes in March.", mustDie: ["diabetes"] },
  { tier: "topic", text: "Moved $12,000 from Chase into the Vanguard brokerage.", mustDie: ["$12,000", "Chase", "Vanguard"] },
  { tier: "topic", text: "I talked to my attorney about the custody filing.", mustDie: ["attorney", "custody"] },
  { tier: "topic", text: "[kid] starts at Lincoln Elementary and her teacher is Mrs. Tran.", mustDie: ["Lincoln Elementary", "Tran"] },

  // topic-strict — no personal marker (strict only)
  { tier: "topic-strict", text: "The biopsy results came back after the oncology consult.", mustDie: ["biopsy", "oncology"] },
  { tier: "topic-strict", text: "The deposition got moved and the subpoena expanded.", mustDie: ["deposition", "subpoena"] },
];

const TIERS_BY_PROFILE = {
  light: new Set(["pattern"]),
  standard: new Set(["pattern", "name", "topic"]),
  identifiers: new Set(["pattern", "name", "name-unknown"]),
  strict: new Set(["pattern", "name", "topic", "name-unknown", "topic-strict"]),
};

function fixturesFor(profileName) {
  const active = TIERS_BY_PROFILE[profileName];
  return PII_CORPUS.filter((f) => active.has(f.tier));
}

// ── 1. corpus survival per profile (redactText, the primitive) ───────

for (const profileName of Object.keys(PROFILES)) {
  test(`tripwire: NO fixture survives redactText under the ${profileName} profile`, () => {
    for (const fixture of fixturesFor(profileName)) {
      const r = redactText(fixture.text, { profile: profileName, peopleMap: TEST_MAP });
      for (const literal of fixture.mustDie) {
        assert.ok(
          !r.text.includes(literal),
          `[${profileName}] "${literal}" survived: "${fixture.text}" → "${r.text}"`,
        );
      }
      assert.ok(r.redacted, `[${profileName}] fixture should register as redacted: "${fixture.text}"`);
    }
  });
}

// ── 1b. corpus survival at the WRITER OUTPUTS (the actual egress) ────
// The fixtures ride a realistic parsed-transcript shape through the SAME gate
// the writers call, then through buildSummaryInput (LLM egress) and
// buildTranscriptRow/transcriptPatchBody (row egress). Nothing may survive.

function parsedWithCorpus(fixtures) {
  const turns = fixtures.map((f, i) => ({ at: null, text: `turn ${i}: ${f.text}` }));
  return {
    firstUserMsg: fixtures[0].text,
    lastAssistantMsg: fixtures[fixtures.length - 1].text,
    operatorTurns: turns,
    assistantTail: fixtures.slice(0, 5).map((f) => `noted: ${f.text}`),
    counts: { user: turns.length, assistant: 5 },
    toolUseCounts: new Map([["Bash", 3]]),
    modelsUsed: new Set(["example-model"]),
    topTools: [["Bash", 3]],
    durationMin: 30,
    durationMs: 1_800_000,
    firstTurnAt: "2026-06-11T01:00:00.000Z",
    lastTurnAt: "2026-06-11T01:30:00.000Z",
    dayMinutes: { "2026-06-11": 30 },
    operatorTurnCount: turns.length,
    lineCount: turns.length + 5,
    parsedCount: turns.length + 5,
  };
}

const WRITER_CASES = [
  { source: "source-code", profile: "light" },
  { source: "build-log", profile: "light" },
  { source: "commit-message", profile: "light" },
  { source: "free-text", profile: "standard" }, // future chat-source ingest, same gate
  { source: "support-ticket", profile: "standard" },
  { source: "clinical-note", profile: "identifiers" },
  { source: "sms", profile: "strict" },
];

for (const { source, profile } of WRITER_CASES) {
  test(`tripwire: NO fixture survives to writer outputs (source=${source} → ${profile})`, () => {
    const fixtures = fixturesFor(profile);
    const gate = gateParsedTranscript({
      parsed: parsedWithCorpus(fixtures),
      source,
      body: fixtures.map((f) => f.text).join("\n"),
      peopleMap: TEST_MAP,
    });
    assert.equal(gate.profile, profile);

    // Simulate the model echoing its (already-redacted) input PLUS a raw
    // PII string it could only confabulate — the output gate must catch it.
    const summaryGate = gateSummary(
      {
        summary: `You handled ${fixtures.length} items. ${fixtures[0].text}`,
        topics: ["wiring", fixtures[1].text.slice(0, 50)],
        operatorDirections: [{intent: "intent", raw_text: fixtures[2].text}],
        model: "example-model",
        usage: { input_tokens: 1, output_tokens: 1 },
        generatedAt: "2026-06-12T00:00:00.000Z",
        promptVersion: 2,
      },
      gate,
      source,
      TEST_MAP,
    );

    // The summary gate covers the record and the summary in one sealed decision.
    assert.equal(summaryGate.profile, profile);
    assert.deepEqual(summaryGate.parsed, gate.parsed);

    // LLM egress surface
    const llmInput = buildSummaryInput(summaryGate.parsed);
    // Row egress surfaces
    const row = buildTranscriptRow({
      recordId: "rec-tripwire",
      parsed: summaryGate.parsed,
      summary: summaryGate.summary,
      body: summaryGate.body,
      source,
    });
    const patch = transcriptPatchBody(row);

    for (const fixture of fixtures) {
      for (const literal of fixture.mustDie) {
        assert.ok(!llmInput.includes(literal), `[${source}] "${literal}" reached the LLM input`);
        assert.ok(!JSON.stringify(row).includes(literal), `[${source}] "${literal}" reached the row write`);
        assert.ok(!JSON.stringify(patch).includes(literal), `[${source}] "${literal}" reached the PATCH body`);
      }
    }
  });
}

// ── 1c. coverage guard — every wired source's profile has a writer case ──
// Redaction behavior is per-PROFILE (the source only selects a profile), so
// the writer-output covenant is complete as long as EVERY profile any source
// maps to is exercised above. This fails the day a source is mapped to a
// profile that no WRITER_CASE covers (e.g. a new 4th profile) — turning the
// "remember to add a writer case" discipline into a test.
test("tripwire: every source in SOURCE_PROFILES maps to a profile a WRITER_CASE exercises", () => {
  const coveredProfiles = new Set(WRITER_CASES.map((c) => c.profile));
  for (const [source, profile] of Object.entries(SOURCE_PROFILES)) {
    assert.ok(
      coveredProfiles.has(profile),
      `source "${source}" → "${profile}" has no WRITER_CASE — add one so the writer-output covenant covers it`,
    );
  }
});

// ── 1d. sensitive-source covenant ──────────────────────────────────────
// Every DECLARED sensitive source (../src/sensitive-sources.js) must resolve
// to identifiers or strict AND that profile must be exercised by a
// WRITER_CASE. A new sensitive source mapped to light/standard fails HERE.
test("tripwire: every declared sensitive source resolves to identifiers/strict + has a WRITER_CASE", () => {
  const coveredProfiles = new Set(WRITER_CASES.map((c) => c.profile));
  assert.ok(SENSITIVE_SOURCE_IDS.length > 0, "expected declared sensitive sources");
  for (const id of SENSITIVE_SOURCE_IDS) {
    const p = profileForSource(id);
    assert.ok(
      SENSITIVE_SOURCE_PROFILES.includes(p),
      `sensitive source "${id}" must resolve to ${SENSITIVE_SOURCE_PROFILES.join("/")} (it resolves to "${p}")`,
    );
    assert.ok(PROFILES[p].unknownNames, `sensitive source "${id}" resolves to a profile without the unknown-name pass`);
    assert.ok(coveredProfiles.has(p), `profile "${p}" (sensitive source "${id}") has no WRITER_CASE — add one`);
  }
});

// ── 2. idempotence — re-redacting redacted text is a no-op ───────────

for (const profileName of Object.keys(PROFILES)) {
  test(`tripwire: idempotent under the ${profileName} profile`, () => {
    const kitchenSink = [
      ...fixturesFor(profileName).map((f) => f.text),
      "plain sentence with nothing sensitive in it.",
      "My doctor prescribed 40mg. Call (312) 555-0147. Alex and Robin at 742 Evergreen Terrace.",
    ].join(" \n");
    const once = redactText(kitchenSink, { profile: profileName, peopleMap: TEST_MAP });
    const twice = redactText(once.text, { profile: profileName, peopleMap: TEST_MAP });
    assert.equal(twice.text, once.text, `[${profileName}] second pass changed the text`);
  });
}

test("tripwire: redaction tokens themselves are never re-eaten", () => {
  const tokens = "[phone] [email] [address] [ssn] [dob] [card] [account] [coords] [family] [kid] [family] [name] [medical] [legal] [kid-detail]";
  for (const profileName of Object.keys(PROFILES)) {
    const r = redactText(tokens, { profile: profileName, peopleMap: TEST_MAP });
    assert.equal(r.text, tokens, `[${profileName}] mangled the token vocabulary`);
  }
});

test("tripwire: identifiers profile keeps clinical content and removes identifiers", () => {
  const note =
    "Pt seen by Dr. Alvarez on follow-up. DOB: 4/12/1958, MRN 40417733, cell 212-555-0147. " +
    "Continue metformin 500 mg BID; A1c 7.4%, BP 138/84. Biopsy of left forearm lesion was benign.";
  const r = redactText(note, { source: "clinical-note", peopleMap: TEST_MAP });
  assert.equal(r.profile, "identifiers");
  for (const gone of ["Alvarez", "4/12/1958", "40417733", "212-555-0147"]) {
    assert.ok(!r.text.includes(gone), `"${gone}" survived: ${r.text}`);
  }
  for (const kept of ["metformin 500 mg BID", "A1c 7.4%", "BP 138/84", "Biopsy of left forearm lesion was benign."]) {
    assert.ok(r.text.includes(kept), `clinical content "${kept}" was removed: ${r.text}`);
  }
  // The same note under strict loses the clinical sentences (topic tier, no personal-marker gate).
  const strict = redactText(note, { profile: "strict", peopleMap: TEST_MAP });
  assert.ok(!strict.text.includes("metformin"), strict.text);
});

// ── 3. code-safety — dev-profile code spans are byte-identical ───────

test("tripwire: dev-profile code blocks with PII-shaped strings survive intact", () => {
  const fence = "```js\nconst to = \"jane.doe+billing@example.com\";\nsendMail(to, \"212-555-0147\");\n```";
  const inline = "`SMTP_USER=jane.doe+billing@example.com`";
  const text = `set the env first: ${inline} then run ${fence} and email jane.doe+billing@example.com when done`;
  for (const source of ["source-code", "build-log", "commit-message"]) {
    const r = redactText(text, { source, peopleMap: TEST_MAP });
    assert.ok(r.text.includes(fence), `[${source}] fenced block was mangled`);
    assert.ok(r.text.includes(inline), `[${source}] inline code was mangled`);
    // …while the SAME string in prose still dies:
    assert.ok(r.text.endsWith("and email [email] when done"), `[${source}] prose email survived: ${r.text.slice(-80)}`);
  }
});

test("tripwire: code-safety does NOT extend to standard/identifiers/strict profiles", () => {
  const text = "she pasted ```text\ncall 212-555-0147\n``` into the thread";
  for (const profileName of ["standard", "identifiers", "strict"]) {
    const r = redactText(text, { profile: profileName, peopleMap: TEST_MAP });
    assert.ok(!r.text.includes("212-555-0147"), `[${profileName}] PII hid inside a code fence`);
  }
});

// ── covenant guards on the corpus itself ─────────────────────────────

test("tripwire: corpus covers every tier the profiles can activate", () => {
  const tiers = new Set(PII_CORPUS.map((f) => f.tier));
  assert.deepEqual(
    [...tiers].sort(),
    ["name", "name-unknown", "pattern", "topic", "topic-strict"],
  );
  // Floor, not ceiling — fixtures are add-only.
  assert.ok(PII_CORPUS.length >= 30, `corpus shrank to ${PII_CORPUS.length} — fixtures are add-only`);
});
