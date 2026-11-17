import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ENGINE_ORDER } from "../eval/fresh/engines.mjs";
import { scorerContentHash } from "../eval/fresh/score.mjs";
import { loadSet, sha256 } from "../eval/fresh/set.mjs";

const frozen = new URL("../fresh-test/v1/", import.meta.url);
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const manifest = readJson(new URL("manifest.json", frozen));
const provenance = readJson(new URL("provenance.json", frozen));
const lock = readJson(new URL("../eval/fresh/scorer-lock.json", import.meta.url));

test("the frozen benchmark still passes strict label and offset validation", () => {
  const set = loadSet(fileURLToPath(frozen));
  assert.equal(set.manifest.fixture, false);
  assert.equal(set.setHash, provenance.set_hash_sha256_over_sorted_file_hashes);
  assert.equal(set.manifest.files, provenance.set_files_count);
  assert.equal(set.documents.length, provenance.documents_accepted);
  assert.ok(set.documents.length > 0);
  assert.ok(set.offsetCheck.spans > 0);
  assert.equal(set.offsetCheck.misfits[set.offsetCheck.declared], 0);
});

test("the frozen prompt inventory still matches its recorded hashes", () => {
  const prompts = Object.entries(manifest.prompts_sha256);
  assert.equal(prompts.length, provenance.prompt_files);
  assert.ok(prompts.length > 0);
  for (const [file, hash] of prompts) {
    assert.ok(/^prompts\/(?:[\w-]+\/)*[\w-]+\.md$/u.test(file), "expected a local prompt path");
    assert.equal(hash, provenance.prompts_sha256[file], `recorded hash for ${file}`);
    assert.equal(sha256(fs.readFileSync(new URL(file, frozen))), hash, `file hash for ${file}`);
  }
});

test("the scorer source still matches the lock that the benchmark names", () => {
  assert.equal(manifest.scorer.commit, lock.scorerCommit);
  assert.equal(manifest.scorer.content_hash, lock.contentHash);
  assert.equal(scorerContentHash(), lock.contentHash);
});

test("the archived scored run belongs to this set and names every engine", () => {
  const resultId = manifest.set_sha256.slice(0, 16);
  const report = readJson(new URL(`results/scored-${resultId}.json`, frozen));
  assert.equal(report.set.setHash, manifest.set_sha256);
  assert.equal(report.set.documents, provenance.documents_accepted);
  assert.equal(report.set.offsetUnit, manifest.offset_unit);
  assert.equal(report.run.mode, "scored");
  assert.equal(report.run.scorer.contentHash, lock.contentHash);
  assert.equal(report.run.scorer.matchesLock, true);
  assert.equal(report.run.scorer.dirty, false);
  assert.ok(Array.isArray(report.run.skipped) && report.run.skipped.length === 0, "no engine may be skipped");
  assert.deepEqual(report.engines.map(({ id }) => id), ENGINE_ORDER);
});
