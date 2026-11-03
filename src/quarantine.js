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
//   - the quarantine root and the day directory must be real directories (not
//     symlinks), owned by this user, with no group or other access. An existing
//     directory that fails this is refused, never written into or repaired
//   - the file is opened create-only with O_NOFOLLOW: an existing path or a
//     planted symlink is never overwritten or followed
//   - the record ref is hashed in the file name, and so is a source id that is
//     not a registered one
//   - errors are reported as a fixed code from a short list, never a message
//     or a value from the input
//   - remaining risk: a local user who controls the PARENT of the quarantine
//     root can swap the root between the check and the write. Keep the root in
//     a directory only the operator can write (the default is in the home)
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
import { SOURCE_PROFILES } from "./profiles.js";

export const QUARANTINE_VERSION = 1;

/** Default quarantine root. Override with env REDACTION_QUARANTINE_DIR. */
export function defaultQuarantineDir(env = process.env) {
  if (env.REDACTION_QUARANTINE_DIR && env.REDACTION_QUARANTINE_DIR.trim()) {
    return env.REDACTION_QUARANTINE_DIR.trim();
  }
  return path.join(os.homedir(), "_redaction-quarantine");
}

const ERROR_CODES = new Set(["EACCES", "EPERM", "ENOENT", "EEXIST", "ENOSPC", "EROFS", "ENOTDIR", "EISDIR", "ELOOP", "EMFILE", "ENFILE", "EIO", "EDQUOT", "unsafe-directory"]);

function hash(value, n) {
  return crypto.createHash("sha256").update(String(value ?? "")).digest("hex").slice(0, n);
}

/** A registered source id is safe in a file name. Anything else is hashed. */
function sourceSlug(source) {
  return typeof source === "string" && Object.hasOwn(SOURCE_PROFILES, source) && /^[a-z0-9-]{1,40}$/.test(source) ? source : `source-${hash(source, 8)}`;
}

/** A real directory (not a symlink), owned by this user, with no group or other access. */
function checkDirectory(dir) {
  const st = fs.lstatSync(dir);
  const uid = typeof process.getuid === "function" ? process.getuid() : null;
  if (!st.isDirectory() || st.isSymbolicLink() || (st.mode & 0o077) !== 0 || (uid !== null && st.uid !== uid)) {
    const e = new Error("unsafe quarantine directory");
    e.code = "unsafe-directory";
    throw e;
  }
}

/** Create one directory level if missing, then check it. */
function ensureDirectory(dir) {
  try {
    fs.mkdirSync(dir, { mode: 0o700 });
  } catch (e) {
    if (!e || e.code !== "EEXIST") throw e;
  }
  checkDirectory(dir);
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
    const root = path.resolve(dir || defaultQuarantineDir());
    const day = at.toISOString().slice(0, 10);
    const dayDir = path.join(root, day);
    // The record ref can itself be an identifier (an MRN): only a short hash of
    // it goes into the file name, and a random suffix prevents collisions.
    const file = path.join(dayDir, `${sourceSlug(source)}--${hash(ref, 16)}--${at.getTime()}-${crypto.randomBytes(4).toString("hex")}.json`);
    const payload = {
      version: QUARANTINE_VERSION,
      at: at.toISOString(),
      source: source ?? null,
      ref: ref ?? null,
      profile: profile ?? null,
      hits,
      changes,
    };
    fs.mkdirSync(path.dirname(root), { recursive: true, mode: 0o700 });
    ensureDirectory(root);
    ensureDirectory(dayDir);
    // Create only, and never through a symlink at the final path.
    const { O_WRONLY, O_CREAT, O_EXCL, O_NOFOLLOW = 0 } = fs.constants;
    const fd = fs.openSync(file, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW, 0o600);
    try {
      fs.writeSync(fd, JSON.stringify(payload, null, 2) + "\n");
    } finally {
      fs.closeSync(fd);
    }
    return { path: file, error: null };
  } catch (e) {
    const code = e && typeof e.code === "string" && ERROR_CODES.has(e.code) ? e.code : "write-failed";
    return { path: null, error: code };
  }
}

export default { writeQuarantineSidecar, defaultQuarantineDir, QUARANTINE_VERSION };
