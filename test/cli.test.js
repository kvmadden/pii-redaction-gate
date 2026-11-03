// cli.test.js: the command-line interface and its exit codes (register 21).

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run, parseArgs } from "../bin/redaction-gate.js";

const BIN = fileURLToPath(new URL("../bin/redaction-gate.js", import.meta.url));
const cli = (argv, input) => run(argv, { readText: () => input });

test("cli: clean text exits 0 and prints the redacted text", () => {
  const r = cli(["--source", "clinical-note"], "Patient Inez Thorn, DOB 03/04/1961. Continue metformin 500 mg BID.");
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "Patient [name], DOB [dob]. Continue metformin 500 mg BID.\n");
  assert.match(r.stderr, /Not proof that no identifier remains/);
});

test("cli: a span that needs review exits 3 and lists offsets, not the text, on stderr", () => {
  const r = cli([], "Seen at Riverside Clinic today.");
  assert.equal(r.code, 3);
  assert.match(r.stderr, /REVIEW REQUIRED, 1 span/);
  assert.doesNotMatch(r.stderr, /Riverside/);
});

test("cli: an unknown source, an unreadable input or a bad people map exits 2 with the blocked token only", () => {
  const unknown = cli(["--source", "clinical_note"], "Patient Inez Thorn.");
  assert.equal(unknown.code, 2);
  assert.equal(unknown.stdout, "[redaction-blocked]\n");
  const unreadable = run(["/no/such/file"]);
  assert.equal(unreadable.code, 2);
  assert.equal(cli(["--people-map", "/no/such/map.json"], "x").code, 2);
});

test("cli: usage errors exit 1", () => {
  assert.equal(cli(["--bogus"], "x").code, 1);
  assert.equal(cli(["--source"], "x").code, 1);
  assert.equal(cli(["a", "b"], "x").code, 1);
  assert.deepEqual(parseArgs(["--json", "-"]), { json: true, file: "-" });
});

test("cli: --json prints the whole result with the flagged text in each review item", () => {
  const r = cli(["--json"], "Seen at Riverside Clinic today.");
  const out = JSON.parse(r.stdout);
  assert.equal(out.status, "review");
  assert.equal(out.review[0].text, "Riverside");
  assert.ok(Array.isArray(out.scan.knownGaps));
});

test("cli: a people map file and stdin through a real process", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-"));
  const map = path.join(dir, "map.json");
  fs.writeFileSync(map, JSON.stringify({ people: [{ name: "Avery Sample", role: "patient" }], safe: [] }));
  const p = spawnSync(process.execPath, [BIN, "--people-map", map], { input: "Avery Sample called.\n", encoding: "utf8" });
  assert.equal(p.status, 0);
  assert.equal(p.stdout, "[patient] called.\n");
  fs.rmSync(dir, { recursive: true, force: true });
});
