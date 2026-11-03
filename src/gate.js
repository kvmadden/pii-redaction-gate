// gate.js: the one redaction gate for a record pipeline. Every writer that
// sends text across the trust boundary (a model call, a record write) goes
// through it, so there is a single chokepoint to audit.
//
// CONTRACT
//   1. gateParsedTranscript() runs before any model call or record build.
//   2. gateSummary() and gateBodyText() re-gate model output or a raw body.
//      Each returns a NEW sealed gate that covers everything the earlier gate
//      covered plus the new part. Nothing is changed in place.
//   3. Every gate is sealed and frozen and has a status: clean, review or
//      blocked. assertSendable() refuses blocked gates, refuses review gates
//      unless the caller says a person reviewed them, and refuses anything
//      this library did not build. Because a gate is frozen, what was checked
//      is what is sent.
//   4. sendRedacted() wraps the whole sequence: redact, check, then call the
//      sink with the frozen, checked payload. A blocked or unreviewed record
//      never reaches the sink.
//   5. redactionMetaForRow() stamps provenance on every gated row (types and
//      counts only). quarantineGate() writes the local-only sidecar with the
//      originals. A sidecar failure does not block the already-redacted write.
//
// Profiles come from profiles.js. An unregistered source id blocks. A people
// map that cannot be read blocks when the caller requires one.

import { assertSendable } from "./send-guard.js";
import {
  redactParsedTranscript,
  redactSummaryFields,
  redactText,
  redactionMeta,
  profileForSource,
  loadPeopleMap,
  writeQuarantineSidecar,
  combineGate,
  blockedGate,
  isSealed,
} from "./index.js";

export { assertSendable };

function resolveMap(peopleMap, requirePeopleMap) {
  if (peopleMap !== undefined && peopleMap !== null) return { map: peopleMap };
  try {
    return { map: loadPeopleMap({ required: requirePeopleMap }) };
  } catch (e) {
    return { error: e };
  }
}

/**
 * Gate a parsed transcript record (and an optional raw body text) before any
 * model call or record build. Returns a sealed, frozen gate.
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
  const { map, error } = resolveMap(peopleMap, requirePeopleMap);
  if (error) return blockedGate(profileForSource(source), "people-map");
  const opts = { source, peopleMap: map, referenceDate };
  const r = redactParsedTranscript(parsed, opts);
  const hasBody = body !== null && body !== undefined && body !== "";
  return combineGate(null, { parsed: r, body: hasBody ? redactText(body, opts) : null, bodyOriginal: hasBody ? body : null });
}

/**
 * Gate the model's output (a string or an object) under the same profile.
 * Returns a NEW sealed gate covering the earlier gate plus the summary
 * (gate.summary holds the redacted summary). A gate this library did not
 * build, or a people map that cannot be read when one is required, blocks.
 */
export function gateSummary(summary, gate, source, peopleMap, { requirePeopleMap = false, referenceDate } = {}) {
  if (!isSealed(gate)) return blockedGate(profileForSource(source), "gate");
  const { map, error } = resolveMap(peopleMap, requirePeopleMap);
  if (error) return blockedGate(gate.profile, "people-map");
  return combineGate(gate, { summary: redactSummaryFields(summary, { source, peopleMap: map, referenceDate }) });
}

/** Gate a standalone body text under the same profile. Returns a NEW sealed gate (gate.body). */
export function gateBodyText(body, gate, source, peopleMap, { requirePeopleMap = false, referenceDate } = {}) {
  if (!isSealed(gate)) return blockedGate(profileForSource(source), "gate");
  const { map, error } = resolveMap(peopleMap, requirePeopleMap);
  if (error) return blockedGate(gate.profile, "people-map");
  if (body === null || body === undefined || body === "") return gate;
  return combineGate(gate, { body: redactText(body, { source, peopleMap: map, referenceDate }), bodyOriginal: typeof body === "string" ? body : null });
}

/**
 * Redact, check, then send. The sink is called only when the gate is clean, or
 * under review with acceptReview. It receives the frozen, checked payload,
 * never the input. Returns the sink's result.
 *
 * @param {{ parsed: object, source: string, body?: string, peopleMap?: object,
 *           sink: (payload: {parsed, body, meta}) => any, acceptReview?: boolean,
 *           requirePeopleMap?: boolean, referenceDate?: string|Date }} args
 */
export function sendRedacted({ parsed, source, body = null, peopleMap, sink, acceptReview = false, requirePeopleMap = false, referenceDate } = {}) {
  if (typeof sink !== "function") throw new TypeError("sendRedacted needs a sink function");
  const gate = gateParsedTranscript({ parsed, source, body, peopleMap, requirePeopleMap, referenceDate });
  assertSendable(gate, { acceptReview });
  return sink(Object.freeze({ parsed: gate.parsed, body: gate.body, meta: Object.freeze(redactionMetaForRow(gate)) }));
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
  if (!isSealed(gate) || !Array.isArray(gate.changes) || gate.changes.length === 0) return null;
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
  return `redaction: ${head}. Residual scan found nothing to decide. Not proof that no identifier remains (see result.scan.knownGaps)`;
}

export default { gateParsedTranscript, gateSummary, gateBodyText, sendRedacted, assertSendable, redactionMetaForRow, quarantineGate, describeGate };
