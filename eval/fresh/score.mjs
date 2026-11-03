#!/usr/bin/env node
// eval/fresh/score.mjs: score a locked blind set once, with the gate and its baselines.
//
//   node eval/fresh/score.mjs <set-dir> --check
//        verifies the set and prints what it holds, runs no engine, writes nothing
//
//   node eval/fresh/score.mjs <set-dir> --out <dir>
//        [--presidio-python <path to the venv python>]   run Presidio offline now
//        [--presidio-outputs <file>]                     or use outputs made earlier
//        [--engines gate-empty,gate-header,do-nothing,remove-every-word,presidio]
//        [--regression-check]
//        [--trust-offsets]
//
// What it does, in order:
//   1. Verifies the set (eval/fresh/set.mjs). Any hash, label or offset-unit
//      mismatch stops the run before an engine sees a document.
//   2. Decides the mode. A set whose manifest says "fixture": true (a test
//      fixture) only ever gets a sample run, labeled as not a result. A run
//      with --regression-check is development data (docs/fresh-test-spec.md,
//      section 6). Any other run is the scored run, and it is refused unless
//      it can stand as the one result: no earlier scored run of this set in
//      the output folder, every engine included, Presidio outputs present,
//      this scorer matching eval/fresh/scorer-lock.json, and no uncommitted
//      change in src or eval/fresh, so the gate commit can be named.
//   3. Runs the two pre-declared gate configurations and the baselines, scores
//      each on the same measures (eval/fresh/measure.mjs), and writes a JSON
//      file and a Markdown report side by side (eval/fresh/report.mjs).
//
// Exit codes: 0 done, 2 refused (the set or the run failed a check), 1 any
// other error, including usage.
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

export class RunRefusedError extends Error {
  constructor(message) {
    super(message);
    this.name = "RunRefusedError";
  }
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

/** This scorer's identity: content hash, commit, uncommitted changes, and whether it matches the lock. */
export function scorerInfo() {
  const contentHash = scorerContentHash();
  const { commit, dirty } = gitInfo();
  const { matchesLock } = lockInfo(contentHash);
  return { contentHash, commit, dirty, matchesLock };
}

/**
 * What stops a run from standing as the one scored run. Empty when it may go ahead.
 * @param {{ engines: string[], presidio: boolean, scorer: ReturnType<typeof scorerInfo>, alreadyScored?: string|null }} run
 */
export function scoredRunProblems({ engines, presidio, scorer, alreadyScored = null }) {
  const problems = [];
  if (alreadyScored) problems.push(`this set was already scored (${alreadyScored}). A second run is a regression check on development data: pass --regression-check`);
  const missing = ENGINE_ORDER.filter((id) => !engines.includes(id));
  if (missing.length) problems.push(`the scored run includes every engine, and this one leaves out ${missing.join(", ")}`);
  if (engines.includes("presidio") && !presidio) problems.push("Presidio has no outputs: pass --presidio-python or --presidio-outputs");
  if (scorer.matchesLock !== true) problems.push(scorer.matchesLock === false ? "this scorer does not match the content hash in eval/fresh/scorer-lock.json" : "eval/fresh/scorer-lock.json is missing");
  if (scorer.dirty !== false) problems.push(scorer.dirty ? "src or eval/fresh has uncommitted changes, so the run cannot name the commit it used" : "this is not a git checkout, so the run cannot name the commit it used");
  return problems;
}

/** A short account of a verified set, for --check. Counts only, no document text. */
export function describeSet(set) {
  const byType = {};
  const byKind = {};
  for (const d of set.documents) {
    byKind[d.kind] = (byKind[d.kind] || 0) + 1;
    for (const sp of d.spans) {
      const k = `${sp.type} ${sp.policy}`;
      byType[k] = (byType[k] || 0) + 1;
    }
  }
  const c = set.offsetCheck;
  const lines = [
    `set ${set.dir}`,
    `set hash ${set.setHash} (${set.setHashEncoding})`,
    `${set.documents.length} documents, ${set.documents.reduce((n, d) => n + d.spans.length, 0)} spans`,
    `offsets: ${set.offsetUnit}${c.trusted ? " (kept by --trust-offsets)" : ""}. Of ${c.spans} spans, these split a word or a character when read as code points ${c.misfits.codepoint}, as UTF-16 ${c.misfits.utf16}, as bytes ${c.misfits.byte}`,
    `spans that split a word or a character as read: ${c.examples.length ? c.examples.map((e) => `${e.id} span ${e.span} (${e.type})`).join(", ") + (c.misfits[c.declared] > c.examples.length ? `, and ${c.misfits[c.declared] - c.examples.length} more` : "") : "none"}`,
    "documents by kind:",
    ...Object.entries(byKind).sort().map(([k, n]) => `  ${k} ${n}`),
    "spans by type and policy:",
    ...Object.entries(byType).sort().map(([k, n]) => `  ${k} ${n}`),
  ];
  return lines.join("\n") + "\n";
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
 * @param {{ engines?: string[], presidioOutputs?: string, mode?: "scored"|"regression"|"sample", trustOffsets?: boolean, scorer?: ReturnType<typeof scorerInfo> }} [opts]
 */
export function scoreSet(setDir, { engines = ENGINE_ORDER, presidioOutputs = null, mode = "regression", trustOffsets = false, scorer = null } = {}) {
  const set = loadSet(setDir, { trustOffsets });
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
  const headerSource = fs.readFileSync(path.join(HERE, "header-map.mjs"));
  return {
    set: { dir: set.dir, setHash: set.setHash, setHashEncoding: set.setHashEncoding, offsetUnit: set.offsetUnit, offsetCheck: set.offsetCheck, documents: set.documents.length, manifest: set.manifest },
    run: {
      mode,
      at: new Date().toISOString(),
      node: process.version,
      platform: `${os.platform()} ${os.arch()}`,
      scorer: scorer || scorerInfo(),
      gate: `REDACTION_VERSION ${REDACTION_VERSION}, identifiers profile`,
      headerRule: { version: HEADER_RULE_VERSION, sha256: sha256(headerSource) },
      skipped,
    },
    engines: rows,
  };
}

const USAGE = "usage: node eval/fresh/score.mjs <set-dir> --check\n       node eval/fresh/score.mjs <set-dir> --out <dir> [--presidio-python <python> | --presidio-outputs <file>] [--engines ...] [--regression-check] [--trust-offsets]";

function args(argv) {
  const out = { set: null, out: null, presidioPython: null, presidioOutputs: null, engines: null, regression: false, check: false, trustOffsets: false };
  const value = (i) => {
    if (i >= argv.length || argv[i].startsWith("--")) throw new Error(`${argv[i - 1]} needs a value\n${USAGE}`);
    return argv[i];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out.out = value(++i);
    else if (a === "--presidio-python") out.presidioPython = value(++i);
    else if (a === "--presidio-outputs") out.presidioOutputs = value(++i);
    else if (a === "--engines") out.engines = value(++i).split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--regression-check") out.regression = true;
    else if (a === "--check") out.check = true;
    else if (a === "--trust-offsets") out.trustOffsets = true;
    else if (!a.startsWith("--") && !out.set) out.set = a;
    else throw new Error(`unknown argument ${a}\n${USAGE}`);
  }
  if (!out.set || (!out.out && !out.check)) throw new Error(USAGE);
  if (out.engines) for (const id of out.engines) if (!ENGINE_ORDER.includes(id)) throw new Error(`unknown engine ${id} (engines: ${ENGINE_ORDER.join(", ")})`);
  return out;
}

function main(argv) {
  const a = args(argv);
  const set = loadSet(a.set, { trustOffsets: a.trustOffsets }); // verify before anything else, and before any engine runs
  if (a.check) {
    process.stdout.write(describeSet(set));
    return;
  }
  const tag = set.setHash.slice(0, 16);
  const mode = set.manifest.fixture ? "sample" : a.regression ? "regression" : "scored";
  const engines = a.engines || ENGINE_ORDER;
  const scorer = scorerInfo(); // read once, before anything is written
  if (mode === "scored") {
    const scoredJson = path.join(a.out, `scored-${tag}.json`);
    const problems = scoredRunProblems({ engines, presidio: Boolean(a.presidioPython || a.presidioOutputs), scorer, alreadyScored: fs.existsSync(scoredJson) ? scoredJson : null });
    if (problems.length) throw new RunRefusedError(`not a scored run:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
  fs.mkdirSync(a.out, { recursive: true });
  let presidioOutputs = a.presidioOutputs;
  if (a.presidioPython && engines.includes("presidio")) presidioOutputs = runPresidio(a.presidioPython, set.dir, path.join(a.out, `presidio-outputs-${tag}.json`));
  const results = scoreSet(a.set, { engines, presidioOutputs, mode, trustOffsets: a.trustOffsets, scorer });
  const base = mode === "scored" ? path.join(a.out, `scored-${tag}`) : path.join(a.out, `${mode}-${tag}-${Date.now()}`);
  fs.writeFileSync(`${base}.json`, JSON.stringify(results, null, 1) + "\n");
  fs.writeFileSync(`${base}.md`, markdown(results));
  process.stdout.write(`wrote ${base}.json and ${base}.md\n`);
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    const refused = e.name === "SetIntegrityError" || e.name === "RunRefusedError";
    process.stderr.write(`score.mjs: ${refused ? "REFUSED: " : ""}${e.message}\n`);
    process.exitCode = refused ? 2 : 1;
  }
}

export default { scoreSet, runPresidio, scorerContentHash, scorerInfo, scoredRunProblems, describeSet };
