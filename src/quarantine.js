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
 * nothing to record (no changes). NEVER throws on fs trouble — a quarantine
 * failure must not block the (already-redacted) ingest; it reports loudly
 * via the returned { error } instead so callers can print one stderr line.
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
  const at = now instanceof Date ? now : new Date();
  const root = dir || defaultQuarantineDir();
  const day = at.toISOString().slice(0, 10);
  const dayDir = path.join(root, day);
  const file = path.join(
    dayDir,
    `${safeSlug(source)}--${safeSlug(ref)}--${at.getTime()}.json`,
  );
  const payload = {
    version: QUARANTINE_VERSION,
    at: at.toISOString(),
    source: source ?? null,
    ref: ref ?? null,
    profile: profile ?? null,
    hits,
    changes,
  };
  try {
    fs.mkdirSync(dayDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(file, JSON.stringify(payload, null, 2) + "\n", { mode: 0o600 });
    return { path: file, error: null };
  } catch (e) {
    return { path: null, error: String(e?.message || e) };
  }
}

export default { writeQuarantineSidecar, defaultQuarantineDir, QUARANTINE_VERSION };
