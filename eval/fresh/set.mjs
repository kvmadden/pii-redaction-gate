// eval/fresh/set.mjs: load and verify a locked test set (docs/fresh-test-spec.md, section 4).
//
// A set folder holds:
//   documents/<id>.txt   UTF-8 text
//   labels.jsonl         one line per document:
//                        { id, kind, text_sha256, spans: [{ start, end, type, policy }] }
//   manifest.json        each file's SHA-256 and a set hash over the sorted list
//                        of file hashes
//
// loadSet() refuses to return a set (it throws SetIntegrityError) when:
//   - a file listed in the manifest is missing or its SHA-256 differs
//   - a document or labels.jsonl is not listed in the manifest
//   - the manifest's set hash does not match the listed file hashes
//   - a document's SHA-256 differs from its text_sha256 in labels.jsonl
//   - a document has no label line, or a label line has no document
//   - a span is out of bounds, empty of letters and digits, or has an unknown
//     type or policy
//
// Offsets are Unicode code points into the document text unless the manifest
// says "offset_unit": "utf16" or "byte". They are converted to JavaScript
// string indices here, once, so the measures never see the difference.
//
// Offsets in the wrong unit would shift every span that follows an emoji or
// an accented letter, and no hash would notice. Offsets counted on different
// text (other line endings, a byte-order mark, another Unicode normalization)
// would shift spans too. So every span is read in all three units. A span
// fits a reading when its edges fall on word or character boundaries (and
// match the span's own "text" field, if it has one). The set is refused when
// another unit fits the spans clearly better than the declared one, or when
// more than a tenth of the spans (and at least five) split a word or a
// character as declared. A person who has checked the labels can pass
// trustOffsets (score.mjs --trust-offsets), and the report says so.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const TYPES = Object.freeze(["NAME", "RELATIVE", "CLINICIAN", "FACILITY", "DATE", "DOB", "AGE", "PHONE", "FAX", "EMAIL", "ADDRESS", "ID", "URL", "IP", "DEVICE", "VEHICLE", "KEEP"]);
export const POLICIES = Object.freeze(["identifier", "not-identifier"]);

export class SetIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = "SetIntegrityError";
  }
}

const fail = (msg) => {
  throw new SetIntegrityError(msg);
};

export function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/** The three common ways to hash a sorted list of hex hashes. The first is canonical. */
export function setHashCandidates(fileHashes) {
  const sorted = [...fileHashes].map((h) => h.toLowerCase()).sort();
  return {
    "newline-joined": sha256(sorted.join("\n")),
    "newline-terminated": sha256(sorted.join("\n") + "\n"),
    concatenated: sha256(sorted.join("")),
  };
}

/** The manifest's file list as a Map of relative path to SHA-256, from either common shape. */
function manifestFiles(manifest) {
  const files = new Map();
  const add = (p, h) => {
    if (typeof p !== "string" || typeof h !== "string" || !/^[0-9a-fA-F]{64}$/.test(h)) fail(`manifest: bad file entry ${JSON.stringify([p, h])}`);
    const rel = p.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^fresh-test\/v\d+\//, "");
    if (rel.startsWith("/") || rel.split("/").includes("..")) fail(`manifest: file path outside the set: ${p}`);
    files.set(rel, h.toLowerCase());
  };
  const list = manifest.files ?? manifest.file_hashes ?? manifest.fileHashes;
  if (Array.isArray(list)) for (const f of list) add(f && (f.path ?? f.file ?? f.name), f && (f.sha256 ?? f.hash));
  else if (list && typeof list === "object") for (const [p, h] of Object.entries(list)) add(p, typeof h === "object" && h ? h.sha256 ?? h.hash : h);
  else fail("manifest: no file list (expected \"files\" as an object of path to sha256, or an array of { path, sha256 })");
  return files;
}

function manifestSetHash(manifest) {
  const h = manifest.set_sha256 ?? manifest.setSha256 ?? manifest.set_hash ?? manifest.setHash ?? manifest.sha256;
  if (typeof h !== "string" || !/^[0-9a-fA-F]{64}$/.test(h)) fail("manifest: no set hash (expected \"set_sha256\")");
  return h.toLowerCase();
}

/** Map an offset in the given unit to a JavaScript string index. */
function indexMapper(text, unit) {
  if (unit === "utf16") return (o) => o;
  const units = [0]; // units[k] = string index after k code points (or k bytes)
  if (unit === "byte") {
    const toIndex = new Map([[0, 0]]);
    let bytes = 0;
    let idx = 0;
    for (const ch of text) {
      bytes += Buffer.byteLength(ch, "utf8");
      idx += ch.length;
      toIndex.set(bytes, idx);
    }
    return (o) => (toIndex.has(o) ? toIndex.get(o) : NaN);
  }
  for (const ch of text) units.push(units[units.length - 1] + ch.length);
  return (o) => (Number.isInteger(o) && o >= 0 && o < units.length ? units[o] : NaN);
}

const ALNUM = /[\p{L}\p{N}]/u;
const WORD = /[\p{L}\p{N}\p{M}]/u;
export const OFFSET_UNITS = Object.freeze(["codepoint", "utf16", "byte"]);

/** The manifest's offset unit, allowing common spellings. Undefined means code points. */
function offsetUnitOf(manifest) {
  const raw = manifest.offset_unit ?? manifest.offsetUnit;
  if (raw === undefined || raw === null) return "codepoint";
  const k = String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["codepoint", "codepoints", "character", "characters", "char", "chars"].includes(k)) return "codepoint";
  if (["utf16", "utf16codeunit", "utf16codeunits", "codeunit", "codeunits"].includes(k)) return "utf16";
  if (["byte", "bytes", "utf8", "utf8byte", "utf8bytes"].includes(k)) return "byte";
  fail(`manifest: unknown offset_unit ${JSON.stringify(raw)} (expected codepoint, utf16 or byte)`);
}

const isHigh = (c) => c >= 0xd800 && c <= 0xdbff;
const isLow = (c) => c >= 0xdc00 && c <= 0xdfff;

/** True when string index i falls inside a surrogate pair or between two word characters. */
function splitsAt(text, i) {
  if (i <= 0 || i >= text.length) return false;
  if (isHigh(text.charCodeAt(i - 1)) && isLow(text.charCodeAt(i))) return true;
  const before = i >= 2 && isLow(text.charCodeAt(i - 1)) && isHigh(text.charCodeAt(i - 2)) ? String.fromCodePoint(text.codePointAt(i - 2)) : text[i - 1];
  const after = String.fromCodePoint(text.codePointAt(i));
  return WORD.test(before) && WORD.test(after);
}

/** Where a span lands under one reading, and whether it fits there. */
function placeSpan(text, toIndex, sp) {
  const start = toIndex(sp.start);
  const end = toIndex(sp.end);
  const key = `${start}:${end}`;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > text.length || start >= end) return { key, fits: false };
  let fits = !splitsAt(text, start) && !splitsAt(text, end);
  if (typeof sp.text === "string" && text.slice(start, end) !== sp.text) fits = false;
  return { key, fits };
}

/**
 * Read every span in all three units and compare each other unit with the
 * declared one, on the spans the two place differently.
 */
function checkOffsets(docs, declared) {
  const misfits = Object.fromEntries(OFFSET_UNITS.map((u) => [u, 0]));
  const compared = Object.fromEntries(OFFSET_UNITS.filter((u) => u !== declared).map((u) => [u, { placedDifferently: 0, declaredMisfits: 0, otherMisfits: 0 }]));
  const examples = []; // misfits as declared: document id, span index and type, never text
  let spansRead = 0;
  for (const { id, text, spans } of docs) {
    const mappers = Object.fromEntries(OFFSET_UNITS.map((u) => [u, indexMapper(text, u)]));
    for (const [k, sp] of spans.entries()) {
      if (!sp || !Number.isInteger(sp.start) || !Number.isInteger(sp.end)) continue;
      spansRead++;
      const placed = Object.fromEntries(OFFSET_UNITS.map((u) => [u, placeSpan(text, mappers[u], sp)]));
      for (const u of OFFSET_UNITS) if (!placed[u].fits) misfits[u]++;
      if (!placed[declared].fits && examples.length < 20) examples.push({ id, span: k, type: String(sp.type) });
      for (const u of Object.keys(compared)) {
        if (placed[u].key === placed[declared].key) continue;
        const c = compared[u];
        c.placedDifferently++;
        if (!placed[declared].fits) c.declaredMisfits++;
        if (!placed[u].fits) c.otherMisfits++;
      }
    }
  }
  // Another unit wins when the declared one misfits spans and the other
  // misfits fewer than half as many of the same spans.
  const better = Object.entries(compared)
    .filter(([, c]) => c.declaredMisfits > 0 && c.declaredMisfits > 2 * c.otherMisfits)
    .sort((a, b) => b[1].declaredMisfits - b[1].otherMisfits - (a[1].declaredMisfits - a[1].otherMisfits))[0];
  return { declared, spans: spansRead, misfits, compared, betterUnit: better ? better[0] : null, examples };
}

/** The ceiling on spans that split a word or a character as declared. */
export const MISFIT_CEILING = Object.freeze({ share: 0.1, atLeast: 5 });
const tooManyMisfits = (c) => c.misfits[c.declared] >= MISFIT_CEILING.atLeast && c.misfits[c.declared] > MISFIT_CEILING.share * c.spans;

/**
 * Load and verify a set folder. Throws SetIntegrityError on any mismatch.
 * @param {string} dir
 * @param {{ trustOffsets?: boolean }} [opts]  keep the declared offsets when the offset
 *   check would refuse them (the check still runs and its findings are reported)
 * @returns {{ dir, setHash, setHashEncoding, offsetUnit, offsetCheck, manifest, documents: Array<{id, kind, text, sha256, spans}> }}
 */
export function loadSet(dir, { trustOffsets = false } = {}) {
  const root = path.resolve(dir);
  const read = (rel) => {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) fail(`missing file: ${rel}`);
    return fs.readFileSync(p);
  };
  let manifest;
  try {
    manifest = JSON.parse(read("manifest.json").toString("utf8"));
  } catch (e) {
    if (e instanceof SetIntegrityError) throw e;
    fail("manifest.json is not valid JSON");
  }
  const files = manifestFiles(manifest);
  const setHash = manifestSetHash(manifest);

  // Every listed file exists and matches its hash.
  for (const [rel, h] of files) {
    const got = sha256(read(rel));
    if (got !== h) fail(`hash mismatch for ${rel}: manifest says ${h}, file is ${got}`);
  }
  // Every document and the labels file are listed.
  const docDir = path.join(root, "documents");
  if (!fs.existsSync(docDir)) fail("missing folder: documents/");
  const docFiles = fs.readdirSync(docDir).filter((f) => !f.startsWith("."));
  for (const f of docFiles) {
    if (!f.endsWith(".txt")) fail(`unexpected file in documents/: ${f}`);
    if (!files.has(`documents/${f}`)) fail(`not listed in the manifest: documents/${f}`);
  }
  if (!files.has("labels.jsonl")) fail("not listed in the manifest: labels.jsonl");
  // The set hash covers exactly the listed files.
  const candidates = setHashCandidates([...files.values()]);
  const setHashEncoding = Object.keys(candidates).find((k) => candidates[k] === setHash);
  if (!setHashEncoding) fail(`set hash mismatch: manifest says ${setHash}, the listed files give ${candidates["newline-joined"]} (sha256 of the sorted file hashes joined by newlines)`);

  const offsetUnit = offsetUnitOf(manifest);

  const labels = new Map();
  const lines = read("labels.jsonl").toString("utf8").split(/\r?\n/);
  lines.forEach((line, n) => {
    if (!line.trim()) return;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      fail(`labels.jsonl line ${n + 1} is not valid JSON`);
    }
    if (!rec || typeof rec.id !== "string" || !/^[A-Za-z0-9._-]{1,128}$/.test(rec.id)) fail(`labels.jsonl line ${n + 1}: bad id`);
    if (labels.has(rec.id)) fail(`labels.jsonl: duplicate id ${rec.id}`);
    if (typeof rec.kind !== "string" || !rec.kind.trim()) fail(`labels.jsonl ${rec.id}: missing kind`);
    if (typeof rec.text_sha256 !== "string" || !/^[0-9a-fA-F]{64}$/.test(rec.text_sha256)) fail(`labels.jsonl ${rec.id}: missing text_sha256`);
    if (!Array.isArray(rec.spans)) fail(`labels.jsonl ${rec.id}: spans must be an array`);
    labels.set(rec.id, rec);
  });

  for (const f of docFiles.sort()) {
    const id = f.slice(0, -4);
    if (!labels.has(id)) fail(`document has no label line: ${id}`);
  }
  const texts = [];
  for (const [id, rec] of [...labels.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (!docFiles.includes(`${id}.txt`)) fail(`label line has no document: ${id}`);
    const bytes = read(`documents/${id}.txt`);
    const sha = sha256(bytes);
    if (sha !== rec.text_sha256.toLowerCase()) fail(`text_sha256 mismatch for ${id}: labels say ${rec.text_sha256.toLowerCase()}, file is ${sha}`);
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      fail(`document is not valid UTF-8: ${id}`);
    }
    texts.push({ id, rec, sha, text });
  }

  // The offsets, checked before any span is read in them.
  const check = checkOffsets(texts.map((t) => ({ id: t.id, text: t.text, spans: t.rec.spans })), offsetUnit);
  const offsetCheck = { ...check, tooManyMisfits: tooManyMisfits(check), trusted: trustOffsets };
  if (!trustOffsets) {
    const where = offsetCheck.examples.slice(0, 5).map((e) => `${e.id} span ${e.span}`).join(", ");
    if (offsetCheck.betterUnit) {
      const u = offsetCheck.betterUnit;
      const c = offsetCheck.compared[u];
      fail(`span offsets look like ${u} offsets, not ${offsetUnit}: of ${c.placedDifferently} spans the two readings place differently, ${c.declaredMisfits} split a word or a character as ${offsetUnit} and ${c.otherMisfits} as ${u}. Set "offset_unit": "${u}" in manifest.json, or pass --trust-offsets if ${offsetUnit} is right`);
    }
    if (offsetCheck.tooManyMisfits) {
      fail(`${offsetCheck.misfits[offsetUnit]} of ${offsetCheck.spans} spans split a word or a character when read as ${offsetUnit} offsets (${where}, and so on). The offsets may have been counted on different text: other line endings, a byte-order mark or another Unicode normalization. Check the labels, or pass --trust-offsets if they are right`);
    }
  }

  const documents = [];
  for (const { id, rec, sha, text } of texts) {
    const toIndex = indexMapper(text, offsetUnit);
    const spans = rec.spans.map((sp, k) => {
      const where = `${id} span ${k}`;
      if (!sp || !Number.isInteger(sp.start) || !Number.isInteger(sp.end)) fail(`${where}: start and end must be integers`);
      if (!TYPES.includes(sp.type)) fail(`${where}: unknown type ${JSON.stringify(sp.type)}`);
      if (!POLICIES.includes(sp.policy)) fail(`${where}: unknown policy ${JSON.stringify(sp.policy)}`);
      if (sp.type === "KEEP" && sp.policy !== "not-identifier") fail(`${where}: a KEEP span must have policy not-identifier`);
      const start = toIndex(sp.start);
      const end = toIndex(sp.end);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > text.length || start >= end) fail(`${where}: offsets ${sp.start} to ${sp.end} are out of bounds or empty`);
      const value = text.slice(start, end);
      if (!ALNUM.test(value)) fail(`${where}: the span ${JSON.stringify(value)} has no letter or digit`);
      return { start, end, type: sp.type, policy: sp.policy, value };
    });
    documents.push({ id, kind: rec.kind.trim(), text, sha256: sha, spans });
  }
  return {
    dir: root,
    setHash,
    setHashEncoding,
    offsetUnit,
    offsetCheck,
    manifest: { version: manifest.version ?? null, files: files.size, fixture: manifest.fixture === true, authors: manifest.authoring_families ?? manifest.authors ?? null, labelers: manifest.labeling_families ?? manifest.labelers ?? null },
    documents,
  };
}

export default { loadSet, setHashCandidates, sha256, TYPES, POLICIES, OFFSET_UNITS, SetIntegrityError };
