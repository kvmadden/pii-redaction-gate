// cli.test.js: the command-line interface and its exit codes (register 21).

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run, parseArgs } from "../bin/redaction-gate.js";
import { DEFAULT_MAX_LENGTH } from "../src/engine.js";

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

test("cli: malformed people map fields block without printing source or config", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-people-map-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "people.json");
  for (const [field, map] of [
    ["people", { people: { name: "Avery Sample", role: "patient" } }],
    ["safe", { people: [], safe: "Avery Sample" }],
    ["person name", { people: [{ name: 42, role: "patient" }] }],
    ["blank person name", { people: [{ name: " " }] }],
    ["alias type", { people: [{ name: "Avery Sample", aliases: ["A. Sample", null] }] }],
    ["aliases list", { people: [{ name: "Avery Sample", aliases: "A. Sample" }] }],
    ["role type", { people: [{ name: "Avery Sample", role: 42 }] }],
    ["safe entry", { safe: [false] }],
  ]) {
    fs.writeFileSync(file, JSON.stringify(map));
    const result = cli(["--profile", "standard", "--people-map", file, "--json"], "Avery Sample called.");
    assert.equal(result.code, 2, field);
    assert.deepEqual(JSON.parse(result.stdout), {
      status: "blocked", blocked: true, text: "[redaction-blocked]", error: { stage: "people-map" },
    });
    assert.equal(result.stderr, "redaction-gate: BLOCKED (people-map)\n");
  }
  fs.writeFileSync(file, JSON.stringify({ people: [{ name: "Avery Sample", aliases: ["A. Sample"] }], safe: ["metformin"] }));
  const accepted = cli(["--people-map", file, "--profile", "standard"], "A. Sample called.");
  assert.equal(accepted.code, 0);
  assert.equal(accepted.stdout, "[name] called.\n");
});

test("cli: malformed UTF-8 in a people map blocks without echoing bytes", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-utf8-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "people.json");
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from('{"people":[{"name":"Avery '), Buffer.from([0xff]),
    Buffer.from('Sample","role":"patient"}]}'),
  ]));
  const args = [BIN, "--people-map", file];
  const result = spawnSync(process.execPath, [...args, "--json"], { input: "Avery Sample called.", encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "blocked", blocked: true, text: "[redaction-blocked]", error: { stage: "people-map" },
  });
  assert.equal(result.stderr, "redaction-gate: BLOCKED (people-map)\n");
  fs.writeFileSync(file, JSON.stringify({ people: [{ name: "Évelyne Sample", role: "patient" }] }));
  const accepted = spawnSync(process.execPath, args, { input: "Évelyne Sample called.", encoding: "utf8" });
  assert.equal(accepted.status, 0);
  assert.equal(accepted.stdout, "[patient] called.\n");
});

test("cli: an explicit people map is read again on each invocation", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-people-map-reload-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "people.json");
  const args = ["--profile", "standard", "--people-map", file];
  fs.writeFileSync(file, JSON.stringify({ people: [{ name: "Avery Sample", role: "patient" }] }));
  const accepted = cli(args, "Avery Sample called.");
  assert.equal(accepted.code, 0);
  assert.equal(accepted.stdout, "[patient] called.\n");

  fs.writeFileSync(file, JSON.stringify({ people: "invalid" }));
  const refused = cli(args, "Avery Sample called.");
  assert.equal(refused.code, 2);
  assert.equal(refused.stdout, "[redaction-blocked]\n");
});

test("cli: oversized stdin blocks before the writer closes the pipe", async (t) => {
  const child = spawn(process.execPath, [BIN, "--json", "-"]);
  t.after(() => {
    child.stdin.destroy();
    child.kill();
  });
  let stdout = "";
  let stderr = "";
  const inputErrors = [];
  child.stdout.setEncoding("utf8").on("data", (part) => { stdout += part; });
  child.stderr.setEncoding("utf8").on("data", (part) => { stderr += part; });
  child.stdin.on("error", (error) => inputErrors.push(error.code));
  // Leave stdin open. The reader must stop as soon as the input is too long.
  child.stdin.write(Buffer.alloc(DEFAULT_MAX_LENGTH + 1, 0x61));
  const [code] = await once(child, "close", { signal: AbortSignal.timeout(5000) });
  assert.equal(code, 2);
  assert.deepEqual(JSON.parse(stdout), {
    status: "blocked", blocked: true, text: "[redaction-blocked]", error: { stage: "input" },
  });
  assert.equal(stderr, "redaction-gate: BLOCKED (input)\n");
  assert.ok(inputErrors.every((code) => code === "EPIPE"));
});

test("cli: file decoding preserves UTF-8 characters split across reads", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-utf8-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "fictional.txt");
  const input = Buffer.concat([Buffer.from("\uFEFFFictional café 🧪"), Buffer.from([0xe2, 0x82])]);
  fs.writeFileSync(file, input);
  const read = fs.readSync;
  t.mock.method(fs, "readSync", (fd, buffer, offset, length, position) =>
    read(fd, buffer, offset, Math.min(length, 2), position));
  const result = run(["--profile", "light", file]);
  assert.equal(result.code, 0);
  assert.equal(result.stdout, input.toString("utf8") + "\n");
});

test("cli: the input limit counts UTF-16 units rather than encoded bytes", () => {
  const text = "é".repeat(DEFAULT_MAX_LENGTH);
  const accepted = spawnSync(process.execPath, [BIN, "--profile", "light"], {
    input: text, encoding: "utf8", maxBuffer: Buffer.byteLength(text) + 1024, timeout: 5000,
  });
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.ok(accepted.stdout === text + "\n");
  const refused = spawnSync(process.execPath, [BIN, "--profile", "light"], {
    input: text + "é", encoding: "utf8", timeout: 5000,
  });
  assert.equal(refused.status, 2);
  assert.equal(refused.stdout, "[redaction-blocked]\n");
});
