#!/usr/bin/env node
// eval/fresh/score.mjs: score a locked blind set once, with the gate and its baselines.
//
//   node eval/fresh/score.mjs <set-dir> --out <dir>
//        [--presidio-python <path to the venv python>]   run Presidio offline now
//        [--presidio-outputs <file>]                     or use outputs made earlier
//        [--engines gate-empty,gate-header,do-nothing,remove-every-word,presidio]
//        [--regression-check]
//
// What it does, in order:
//   1. Verifies the set (eval/fresh/set.mjs). Any hash or label mismatch stops
//      the run before an engine sees a document.
//   2. Refuses a second scored run of the same set in the same output folder.
//      A later run must say --regression-check, and its report says it is
//      development data (docs/fresh-test-spec.md, section 6). A set whose
//      manifest says "fixture": true (a test fixture) only ever gets a sample
//      run, labeled as not a result.
//   3. Runs the two pre-declared gate configurations and the baselines, scores
//      each on the same measures (eval/fresh/measure.mjs), and writes a JSON
//      file and a Markdown report side by side (eval/fresh/report.mjs).
//
// Presidio runs in its own Python venv (see eval/fresh/presidio_run.py). With
// --presidio-python, it runs under macOS sandbox-exec with all network access
// denied when sandbox-exec exists, and the report records which applied.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadSet, sha256 } from "./set.mjs";
import { scoreOutputs } from "./measure.mjs";
import { gateEngine, doNothing, removeEveryWord, presidioEngine, ENGINE_ORDER } from "./engines.mjs";
import { HEADER_RULE_VERSION } from "./header-map.mjs";
import { markdown } from "./report.mjs";
import { REDACTION_VERSION } from "../../src/engine.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");

/** SHA-256 over the scorer's own files (name and content, sorted by name). scorer-lock.json is left out. */
export function scorerContentHash() {
  const h = crypto.createHash("sha256");
  for (const f of fs.readdirSync(HERE).filter((f) => /\.(mjs|py)$/.test(f)).sort()) {
    h.update(f + "\0");
    h.update(fs.readFileSync(path.join(HERE, f)));
    h.update("\0");
  }
  return h.digest("hex");
}

function gitInfo() {
  try {
    const commit = execFileSync("git", ["-C", REPO, "rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const dirty = execFileSync("git", ["-C", REPO, "status", "--porcelain", "--", "eval/fresh", "src"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() !== "";
    return { commit, dirty };
  } catch {
    return { commit: null, dirty: null };
  }
}

function lockInfo(contentHash) {
  const p = path.join(HERE, "scorer-lock.json");
  if (!fs.existsSync(p)) return { matchesLock: null, lock: null };
  const lock = JSON.parse(fs.readFileSync(p, "utf8"));
  return { matchesLock: lock.contentHash === contentHash, lock };
}

/** Run eval/fresh/presidio_run.py with network access denied where the OS allows it. */
export function runPresidio(python, setDir, outFile) {
  const script = path.join(HERE, "presidio_run.py");
  const env = { ...process.env, HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1", PIP_NO_INDEX: "1" };
  const sandbox = "/usr/bin/sandbox-exec";
  const args = [script, setDir, outFile];
  let network = "offline settings only (sandbox-exec not available)";
  let r;
  if (process.platform === "darwin" && fs.existsSync(sandbox)) {
    network = "denied by sandbox-exec (deny network*)";
    r = spawnSync(sandbox, ["-p", "(version 1)(allow default)(deny network*)", python, ...args], { env, encoding: "utf8" });
  } else {
    r = spawnSync(python, args, { env, encoding: "utf8" });
  }
  if (r.status !== 0) throw new Error(`presidio_run.py failed (exit ${r.status}): ${String(r.stderr).slice(-2000)}`);
  const data = JSON.parse(fs.readFileSync(outFile, "utf8"));
  data.engine.network = network;
  fs.writeFileSync(outFile, JSON.stringify(data, null, 1) + "\n");
  return outFile;
}

/** Collect one engine's outputs for every document. */
function runEngine(engine, set) {
  const outputs = new Map();
  for (const doc of set.documents) outputs.set(doc.id, engine.run(doc));
  return outputs;
}

/**
 * Score a set with the given engines. Pure apart from reading the set.
 * @param {string} setDir
 * @param {{ engines?: string[], presidioOutputs?: string, mode?: "scored"|"regression" }} [opts]
 */
export function scoreSet(setDir, { engines = ENGINE_ORDER, presidioOutputs = null, mode = "regression" } = {}) {
  const set = loadSet(setDir);
  const available = {
    "gate-empty": () => gateEngine(false),
    "gate-header": () => gateEngine(true),
    "do-nothing": () => doNothing,
    "remove-every-word": () => removeEveryWord,
    presidio: () => (presidioOutputs ? presidioEngine(presidioOutputs) : null),
  };
  const rows = [];
  const skipped = [];
  for (const id of engines) {
    if (!available[id]) throw new Error(`unknown engine ${id}`);
    const engine = available[id]();
    if (!engine) {
      skipped.push({ id, reason: "no Presidio outputs given" });
      continue;
    }
    const score = scoreOutputs(set, runEngine(engine, set));
    rows.push({ id: engine.id, label: engine.label, family: engine.family, version: engine.version, meta: engine.meta ?? null, score });
  }
  const contentHash = scorerContentHash();
  const { commit, dirty } = gitInfo();
  const { matchesLock } = lockInfo(contentHash);
  const headerSource = fs.readFileSync(path.join(HERE, "header-map.mjs"));
  return {
    set: { dir: set.dir, setHash: set.setHash, setHashEncoding: set.setHashEncoding, offsetUnit: set.offsetUnit, documents: set.documents.length, manifest: set.manifest },
    run: {
      mode,
      at: new Date().toISOString(),
      node: process.version,
      platform: `${os.platform()} ${os.arch()}`,
      scorer: { contentHash, commit, dirty, matchesLock },
      gate: `REDACTION_VERSION ${REDACTION_VERSION}, identifiers profile`,
      headerRule: { version: HEADER_RULE_VERSION, sha256: sha256(headerSource) },
      skipped,
    },
    engines: rows,
  };
}

function args(argv) {
  const out = { set: null, out: null, presidioPython: null, presidioOutputs: null, engines: null, regression: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out.out = argv[++i];
    else if (a === "--presidio-python") out.presidioPython = argv[++i];
    else if (a === "--presidio-outputs") out.presidioOutputs = argv[++i];
    else if (a === "--engines") out.engines = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--regression-check") out.regression = true;
    else if (!a.startsWith("--") && !out.set) out.set = a;
    else throw new Error(`unknown argument ${a}`);
  }
  if (!out.set || !out.out) throw new Error("usage: node eval/fresh/score.mjs <set-dir> --out <dir> [--presidio-python <python> | --presidio-outputs <file>] [--engines ...] [--regression-check]");
  return out;
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    const a = args(process.argv.slice(2));
    const set = loadSet(a.set); // verify before anything else, and before any engine runs
    fs.mkdirSync(a.out, { recursive: true });
    const tag = set.setHash.slice(0, 16);
    const mode = set.manifest.fixture ? "sample" : a.regression ? "regression" : "scored";
    const scoredJson = path.join(a.out, `scored-${tag}.json`);
    if (mode === "scored" && fs.existsSync(scoredJson)) throw new Error(`this set was already scored (${scoredJson}). A second run is a regression check on development data: pass --regression-check`);
    let presidioOutputs = a.presidioOutputs;
    if (a.presidioPython) presidioOutputs = runPresidio(a.presidioPython, set.dir, path.join(a.out, `presidio-outputs-${tag}.json`));
    const results = scoreSet(a.set, { engines: a.engines || ENGINE_ORDER, presidioOutputs, mode });
    const base = mode === "scored" ? path.join(a.out, `scored-${tag}`) : path.join(a.out, `${mode}-${tag}-${Date.now()}`);
    fs.writeFileSync(`${base}.json`, JSON.stringify(results, null, 1) + "\n");
    fs.writeFileSync(`${base}.md`, markdown(results));
    process.stdout.write(`wrote ${base}.json and ${base}.md\n`);
  } catch (e) {
    process.stderr.write(`score.mjs: ${e.name === "SetIntegrityError" ? "REFUSED: " : ""}${e.message}\n`);
    process.exitCode = 2;
  }
}

export default { scoreSet, runPresidio, scorerContentHash };
