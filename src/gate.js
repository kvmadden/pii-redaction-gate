// gate.js: the one redaction gate for a record pipeline. Every writer that
// sends text across the trust boundary (a model call, a record write) goes
// through it, so there is a single chokepoint to audit.
//
// CONTRACT
//   1. gateParsedTranscript() runs before any model call or record build.
//   2. gateSummary() re-gates model output (a string or an object) before it
//      lands in the record.
//   3. Every gate result is sealed and has a status: clean, review or blocked.
//      assertSendable() refuses blocked results, refuses review results unless
//      the caller says a person reviewed them, and refuses anything that did
//      not come from this library.
//   4. sendRedacted() wraps the whole sequence: redact, check, then call the
//      sink. A blocked or unreviewed record never reaches the sink.
//   5. redactionMetaForRow() stamps provenance on every gated row (types and
//      counts only). quarantineGate() writes the local-only sidecar with the
//      originals. A sidecar failure does not block the already-redacted write.
//
// Profiles come from profiles.js. An unregistered source id blocks.

import { assertSendable } from "./send-guard.js";
import { seal } from "./seal.js";
import {
  redactParsedTranscript,
  redactSummaryFields,
  redactText,
  redactionMeta,
  profileForSource,
  loadPeopleMap,
  writeQuarantineSidecar,
  BLOCKED_TEXT,
} from "./index.js";

export { assertSendable };

function mergeInto(gate, r, fieldPrefix = "") {
  for (const h of r.hits) {
    const existing = gate.hits.find((x) => x.tier === h.tier && x.type === h.type);
    if (existing) existing.count += h.count;
    else gate.hits.push({ ...h });
  }
  for (const item of r.review || []) gate.review.push({ ...item, field: `${fieldPrefix}${item.field || ""}` || undefined });
  const rank = { clean: 0, review: 1, blocked: 2 };
  if (rank[r.status] > rank[gate.status]) gate.status = r.status;
  if (r.blocked) gate.blocked = true;
  if (r.redacted) gate.redacted = true;
}

function resolveMap(peopleMap, requirePeopleMap) {
  if (peopleMap !== undefined && peopleMap !== null) return { map: peopleMap };
  try {
    return { map: loadPeopleMap({ required: requirePeopleMap }) };
  } catch (e) {
    return { error: e };
  }
}

/** A blocked gate result, for failures before any field was read. */
function blockedGate(profile, stage) {
  const gate = seal({ parsed: null, body: null, profile, redacted: true, blocked: true, status: "blocked", hits: [], review: [], error: { stage } });
  Object.defineProperty(gate, "changes", { value: [], enumerable: false, writable: true });
  return gate;
}

/**
 * Gate a parsed transcript record (and an optional raw body text) before any
 * model call or record build.
 *
 * @param {object} args
 * @param {object} args.parsed      parsed record ({ firstUserMsg, operatorTurns[], … })
 * @param {string} args.source      a registered source id (selects the profile)
 * @param {string|null} [args.body] optional raw body text (same profile)
 * @param {object} [args.peopleMap] injectable people map; default loadPeopleMap()
 * @param {boolean} [args.requirePeopleMap] block when the default map cannot be read
 * @param {string|Date} [args.referenceDate] date used to judge birth years
 */
export function gateParsedTranscript({ parsed, source, body = null, peopleMap, requirePeopleMap = false, referenceDate } = {}) {
  const profile = profileForSource(source);
  const { map, error } = resolveMap(peopleMap, requirePeopleMap);
  if (error) return blockedGate(profile, "people-map");
  const opts = { source, peopleMap: map, referenceDate };
  const r = redactParsedTranscript(parsed, opts);
  const gate = {
    parsed: r.parsed,
    body,
    profile: r.profile,
    redacted: r.redacted,
    blocked: r.blocked,
    status: r.status,
    hits: r.hits.map((h) => ({ ...h })),
    review: [...r.review],
    ...(r.error ? { error: r.error } : {}),
  };
  const changes = [...(r.changes || [])];
  if (body !== null && body !== undefined && body !== "") {
    const b = redactText(body, opts);
    gate.body = b.text;
    mergeInto(gate, { ...b, review: b.review.map((x) => ({ ...x, field: "body" })) });
    if (b.text !== body) changes.push({ field: "body", before: body, after: b.text });
  }
  Object.defineProperty(gate, "changes", { value: changes, enumerable: false, writable: true });
  return seal(gate);
}

/**
 * Gate the model's output under the same profile. Accepts a string or an
 * object. Merges hits, review spans and status into the record gate so one
 * decision and one sidecar cover the record. Returns the redacted summary.
 */
export function gateSummary(summary, gate, source, peopleMap) {
  if (summary === null || summary === undefined) return summary;
  const { map } = resolveMap(peopleMap, false);
  const r = redactSummaryFields(summary, { source, peopleMap: map });
  if (gate && typeof gate === "object") {
    mergeInto(gate, r, "summary.");
    if (Array.isArray(gate.changes)) for (const c of r.changes || []) gate.changes.push({ ...c, field: `summary.${c.field}` });
  }
  return r.blocked && typeof summary === "string" ? BLOCKED_TEXT : r.summary;
}

/** Gate a standalone body text under the same profile, merged into the record gate. */
export function gateBodyText(body, gate, source, peopleMap) {
  if (body === null || body === undefined || body === "") return body;
  const { map } = resolveMap(peopleMap, false);
  const r = redactText(body, { source, peopleMap: map });
  if (gate && typeof gate === "object") {
    mergeInto(gate, { ...r, review: r.review.map((x) => ({ ...x, field: "body" })) });
    if (r.text !== body && Array.isArray(gate.changes)) gate.changes.push({ field: "body", before: body, after: r.text });
  }
  return r.text;
}

/**
 * Redact, check, then send. The sink is called only when the gate is clean, or
 * under review with acceptReview. It receives the redacted record, never the
 * input. Returns the sink's result.
 *
 * @param {{ parsed: object, source: string, body?: string, peopleMap?: object,
 *           sink: (payload: {parsed, body, meta}) => any, acceptReview?: boolean }} args
 */
export function sendRedacted({ parsed, source, body = null, peopleMap, sink, acceptReview = false, referenceDate } = {}) {
  if (typeof sink !== "function") throw new TypeError("sendRedacted needs a sink function");
  const gate = gateParsedTranscript({ parsed, source, body, peopleMap, referenceDate });
  assertSendable(gate, { acceptReview });
  return sink({ parsed: gate.parsed, body: gate.body, meta: redactionMetaForRow(gate) });
}

/**
 * Provenance stamp for the row meta: version, profile, status, hit types and
 * counts. Every gated row gets one, including rows where nothing matched, so a
 * clean gated row can be told apart from a row that never passed the gate.
 */
export function redactionMetaForRow(gate, { now } = {}) {
  if (!gate || typeof gate !== "object" || !Array.isArray(gate.hits)) return null;
  return redactionMeta({ profile: gate.profile, hits: gate.hits, status: gate.status, now });
}

/**
 * Write the local-only quarantine sidecar for a gated record. Call only on
 * real writes. Failure is one stderr line and the ingest proceeds.
 * @returns {string|null} sidecar path, or null when nothing was redacted
 */
export function quarantineGate(gate, { source, ref, dir } = {}) {
  if (!gate || !Array.isArray(gate.changes) || gate.changes.length === 0) return null;
  const { path: sidecarPath, error } = writeQuarantineSidecar({
    source,
    ref,
    profile: gate.profile,
    hits: gate.hits,
    changes: gate.changes,
    dir,
  });
  if (error) process.stderr.write(`ingest-redaction: QUARANTINE SIDECAR FAILED (${error}): redacted ingest proceeding, original spans NOT recorded\n`);
  return sidecarPath;
}

/** One line for the writer logs. It names what was checked, never "clean" on its own. */
export function describeGate(gate) {
  if (!gate || typeof gate !== "object") return "redaction: no gate result (record must not be sent)";
  if (gate.blocked || gate.status === "blocked") return `redaction: BLOCKED under ${gate.profile} profile (record must not be sent)`;
  const masked = gate.hits.reduce((n, h) => n + h.count, 0);
  const parts = gate.hits.map((h) => `${h.type}×${h.count}`).join(", ");
  const head = masked ? `${masked} span(s) masked under ${gate.profile} profile (${parts})` : `no rule matched under ${gate.profile} profile`;
  if (gate.status === "review") return `redaction: REVIEW REQUIRED, ${gate.review.length} uncertain span(s). ${head}`;
  return `redaction: ${head}. Residual scan found nothing to decide. Not proof that no identifier remains`;
}

export default { gateParsedTranscript, gateSummary, gateBodyText, sendRedacted, assertSendable, redactionMetaForRow, quarantineGate, describeGate };
