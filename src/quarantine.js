// quarantine.js — local-only sidecar writer for redacted originals.
//
// THE RULE (the whole point of this file): the ORIGINAL text NEVER leaves the
// machine. Every redaction that changes text writes a sidecar here so the
// operator can always answer "what did the redactor eat?" — locally.
//
//   <home>/_redaction-quarantine/<YYYY-MM-DD>/<file>.json
//
// Hardening:
//   - directory 0700, files 0600 (operator-only on a multi-user machine)
//   - create-only writes: an existing path or symlink is never overwritten
//   - the record ref is hashed in the file name
//   - not encrypted: anyone who can read the operator's files can read this.
//     Encryption at rest and a retention limit are open work (README "Limits").
//   - the quarantine directory MUST be gitignored and MUST be excluded from any
//     offsite-backup lane — it is the one place original PII lives on disk
//   - the path default lands outside any package's tracked tree
//
// Sidecar shape (small on purpose — only the CHANGED fields, before/after):
//   {
//     "version": 1, "at": ISO, "source": "chat-export", "ref": "<recordId>",
//     "profile": "light", "hits": [{tier,type,count}],
//     "changes": [{ "field": "operatorTurns[3]", "before": "...", "after": "..." }]
//   }

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export const QUARANTINE_VERSION = 1;

/** Default quarantine root. Override with env REDACTION_QUARANTINE_DIR. */
export function defaultQuarantineDir(env = process.env) {
  if (env.REDACTION_QUARANTINE_DIR && env.REDACTION_QUARANTINE_DIR.trim()) {
    return env.REDACTION_QUARANTINE_DIR.trim();
  }
  return path.join(os.homedir(), "_redaction-quarantine");
}

function safeSlug(s, max = 80) {
  return String(s ?? "unknown").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max) || "unknown";
}

/**
 * Write one sidecar. Returns the absolute file path, or null when there is
 * nothing to record (no changes). Never throws: a quarantine failure must not
 * block the already-redacted ingest, so it returns { error } (an error code,
 * never a message that could carry a path or input) for one stderr line.
 *
 * @param {object} args
 * @param {string} args.source           source id ("chat-export", "clinical-note", …)
 * @param {string} args.ref              stable reference (record id)
 * @param {string} args.profile          profile name the gate ran
 * @param {Array}  args.hits             [{tier,type,count}]
 * @param {Array}  args.changes          [{field,before,after}] — the originals
 * @param {string} [args.dir]            quarantine root (default: defaultQuarantineDir())
 * @param {Date}   [args.now]            injectable clock (tests)
 * @returns {{ path: string|null, error: string|null }}
 */
export function writeQuarantineSidecar({ source, ref, profile, hits = [], changes = [], dir, now } = {}) {
  if (!Array.isArray(changes) || changes.length === 0) return { path: null, error: null };
  try {
    const at = now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
    const root = dir || defaultQuarantineDir();
    const day = at.toISOString().slice(0, 10);
    const dayDir = path.join(root, day);
    // The record ref can itself be an identifier (an MRN): only a short hash of
    // it goes into the file name, and a random suffix prevents collisions.
    const refHash = crypto.createHash("sha256").update(String(ref ?? "")).digest("hex").slice(0, 16);
    const file = path.join(dayDir, `${safeSlug(source)}--${refHash}--${at.getTime()}-${crypto.randomBytes(4).toString("hex")}.json`);
    const payload = {
      version: QUARANTINE_VERSION,
      at: at.toISOString(),
      source: source ?? null,
      ref: ref ?? null,
      profile: profile ?? null,
      hits,
      changes,
    };
    fs.mkdirSync(dayDir, { recursive: true, mode: 0o700 });
    // "wx": create only. An existing file or a planted symlink at that path fails
    // instead of being overwritten or followed.
    fs.writeFileSync(file, JSON.stringify(payload, null, 2) + "\n", { mode: 0o600, flag: "wx" });
    return { path: file, error: null };
  } catch (e) {
    return { path: null, error: String((e && e.code) || (e && e.name) || "Error") };
  }
}

export default { writeQuarantineSidecar, defaultQuarantineDir, QUARANTINE_VERSION };
