#!/usr/bin/env node
// eval/fresh/make-manifest.mjs: write manifest.json for a set folder.
//
//   node eval/fresh/make-manifest.mjs <set-dir> [--meta meta.json]
//
// Lists the SHA-256 of labels.jsonl and every documents/<id>.txt, and the set
// hash: SHA-256 of the sorted file hashes joined by newlines. Fields from
// --meta (authoring and labeling families, dates, prompts) are copied in.
// eval/fresh/set.mjs reads exactly this shape. The people who lock the blind
// set may use this script or write the same fields themselves.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256, setHashCandidates } from "./set.mjs";

export function buildManifest(dir, meta = {}) {
  const root = path.resolve(dir);
  const rels = ["labels.jsonl", ...fs.readdirSync(path.join(root, "documents")).filter((f) => f.endsWith(".txt")).sort().map((f) => `documents/${f}`)];
  const files = Object.fromEntries(rels.map((rel) => [rel, sha256(fs.readFileSync(path.join(root, rel)))]));
  return {
    version: 1,
    offset_unit: "codepoint",
    set_hash_rule: "sha256 of the sorted file hashes (lowercase hex) joined by newlines",
    ...meta,
    files,
    set_sha256: setHashCandidates(Object.values(files))["newline-joined"],
  };
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  const [dir, flag, metaPath] = process.argv.slice(2);
  if (!dir) {
    process.stderr.write("usage: node eval/fresh/make-manifest.mjs <set-dir> [--meta meta.json]\n");
    process.exit(1);
  }
  const meta = flag === "--meta" && metaPath ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : {};
  const manifest = buildManifest(dir, meta);
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  process.stdout.write(`set_sha256 ${manifest.set_sha256}\n`);
}

export default { buildManifest };
