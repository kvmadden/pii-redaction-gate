import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compare } from "../eval/compare.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const artifacts = ["eval/comparison.json", "eval/comparison.md", "docs/comparison.json", "docs/comparison.md"];

function checkout(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "compare-write-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const entry of ["src", "eval", "data", "package.json"]) {
    fs.cpSync(path.join(root, entry), path.join(dir, entry), { recursive: true });
  }
  fs.mkdirSync(path.join(dir, "docs"));
  for (const entry of artifacts.slice(2)) fs.copyFileSync(path.join(root, entry), path.join(dir, entry));
  const read = () => artifacts.map((entry) => fs.readFileSync(path.join(dir, entry), "utf8"));
  return {
    dir,
    engine: path.join(dir, "src/engine.js"),
    read,
    run: (args) => spawnSync(process.execPath, ["eval/compare.js", ...args], { cwd: dir, encoding: "utf8" }),
  };
}

test("comparison write refuses to drop baseline columns", (t) => {
  const { read, run } = checkout(t);
  const before = read();
  const result = run(["--write"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing baseline release/);
  assert.deepEqual(read(), before);
});

test("comparison write cannot bootstrap over an existing mirror when canonical JSON is missing", (t) => {
  const { dir, read, run } = checkout(t);
  const mirrors = artifacts.slice(1).map((file) => path.join(dir, file));
  const before = read().slice(1);
  const canonical = path.join(dir, artifacts[0]);
  fs.unlinkSync(canonical);

  const result = run(["--write"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /restore eval\/comparison\.json/);
  assert.equal(fs.existsSync(canonical), false);
  assert.deepEqual(mirrors.map((file) => fs.readFileSync(file, "utf8")), before);
});

test("comparison write rejects wrong commits and repeated engine ids", (t) => {
  const { engine, read, run } = checkout(t);
  const before = read();
  const cases = [
    [[`release=wrong-revision=${engine}`], /baseline release requires commit 91c4e16/],
    [[`release=91c4e16=${engine}`, `release=91c4e16=${engine}`], /duplicate engine id release/],
    [[`current=fixture=${engine}`], /reserved engine id current/],
  ];
  for (const [specs, diagnostic] of cases) {
    const result = run(["--write", ...specs.flatMap((spec) => ["--engine", spec])]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, diagnostic);
    assert.deepEqual(read(), before);
  }
});

test("comparison write rejects engines whose results disagree with their historical columns", (t) => {
  const { engine, read, run } = checkout(t);
  const before = read();
  const result = run(["--write", "--engine", `release=91c4e16=${engine}`, "--engine", `previous=facae00=${engine}`]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /baseline release differs for set development/);
  assert.deepEqual(read(), before);
});

test("comparison write refreshes current results and keeps reproduced baselines", async (t) => {
  const { dir, engine, read, run } = checkout(t);
  const spec = { id: "fixture", commit: "fixture-revision", path: engine };
  const expected = JSON.parse(JSON.stringify(await compare([spec])));
  const stale = structuredClone(expected);
  stale.sets.development.results.current.overall.entities += 1;
  fs.writeFileSync(path.join(dir, artifacts[0]), JSON.stringify(stale));

  const result = run(["--write", "--engine", `${spec.id}=${spec.commit}=${spec.path}`]);
  assert.equal(result.status, 0, result.stderr);
  const [json, markdown, mirrorJson, mirrorMarkdown] = read();
  assert.deepEqual(JSON.parse(json), expected);
  assert.equal(json, mirrorJson);
  assert.equal(markdown, mirrorMarkdown);
});
