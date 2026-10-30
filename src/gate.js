// gate.js — the ONE redaction gate for a record-ingest pipeline. Every writer
// that sends text across the trust boundary (a model call, a record write)
// calls it the same way, so there is a single chokepoint to audit.
//
// CONTRACT:
//   1. gateParsedTranscript() runs BEFORE any model call — that call is
//      egress; it must only ever see redacted text.
//   2. The SAME gated record feeds the record builder — the write is egress
//      too; firstUserMsg / lastAssistantMsg / text ride redacted.
//   3. gateSummary() re-gates the model's OUTPUT before it lands in the
//      record (the model only saw redacted input, but its output is a writer
//      surface too).
//   4. If any field was blocked (a tier threw, bad profile, non-string field),
//      gate.blocked is true and that field carries BLOCKED_TEXT. Callers
//      should skip the write; assertSendable() throws for them.
//   5. redactionMetaForRow() stamps meta.redaction (hit types/counts, NEVER
//      original text); quarantineGate() writes the local-only sidecar with the
//      originals. Sidecar failure does not block the (already redacted)
//      write — one loud stderr line instead.
//
// Profile per source comes from profiles.js; unknown sources land on standard.

import {
  redactParsedTranscript,
  redactSummaryFields,
  redactText,
  redactionMeta,
  profileForSource,
  loadPeopleMap,
  writeQuarantineSidecar,
} from "./index.js";

/**
 * Gate a parsed transcript record (and an optional raw body text) before any
 * model call or record build.
 *
 * @param {object} args
 * @param {object} args.parsed      parsed record ({ firstUserMsg, operatorTurns[], … })
 * @param {string} args.source      a source id (selects the profile)
 * @param {string|null} [args.body] optional raw body text (redacted under the same profile)
 * @param {object} [args.peopleMap] injectable people map (tests); default: loadPeopleMap()
 * @returns {{ parsed: object, body: string|null, profile: string, redacted: boolean,
 *             blocked: boolean, hits: Array, changes: Array }}
 */
export function gateParsedTranscript({ parsed, source, body = null, peopleMap } = {}) {
  const map = peopleMap ?? loadPeopleMap();
  const opts = { source, peopleMap: map };
  const gate = redactParsedTranscript(parsed, opts);
  let gatedBody = body;
  let blocked = Boolean(gate.blocked);
  if (body !== null && body !== undefined && body !== "") {
    const r = redactText(body, opts);
    gatedBody = r.text;
    if (r.blocked) blocked = true;
    if (r.text !== body) {
      gate.changes.push({ field: "body", before: body, after: r.text });
      for (const h of r.hits) {
        const existing = gate.hits.find((x) => x.tier === h.tier && x.type === h.type);
        if (existing) existing.count += h.count;
        else gate.hits.push(h);
      }
    }
  }
  return {
    parsed: gate.parsed,
    body: gatedBody,
    profile: gate.profile || profileForSource(source),
    redacted: gate.changes.length > 0,
    blocked,
    hits: gate.hits,
    changes: gate.changes,
  };
}

/**
 * Gate the model's summary output under the same profile. Merges any new
 * hits/changes into the transcript gate so ONE sidecar carries the record.
 *
 * @param {object|null} summary  model output ({ summary, topics, operatorDirections }) or null
 * @param {object} gate          gateParsedTranscript() result (mutated: hits/changes grow)
 * @param {string} source
 * @param {object} [peopleMap]
 * @returns {object|null} the gated summary (same object shape)
 */
export function gateSummary(summary, gate, source, peopleMap) {
  if (!summary) return summary;
  const map = peopleMap ?? loadPeopleMap();
  const r = redactSummaryFields(summary, { source, peopleMap: map });
  if (r.blocked) gate.blocked = true;
  if (r.redacted) {
    gate.redacted = true;
    for (const c of r.changes) gate.changes.push({ ...c, field: `summary.${c.field}` });
    for (const h of r.hits) {
      const existing = gate.hits.find((x) => x.tier === h.tier && x.type === h.type);
      if (existing) existing.count += h.count;
      else gate.hits.push(h);
    }
  }
  return r.summary;
}

/**
 * Gate a standalone body text under the same profile,
 * merging hits/changes into the record gate (one sidecar per record).
 *
 * @param {string} body
 * @param {object} gate    gateParsedTranscript() result (mutated)
 * @param {string} source
 * @param {object} [peopleMap]
 * @returns {string} the gated body
 */
export function gateBodyText(body, gate, source, peopleMap) {
  if (body === null || body === undefined || body === "") return body;
  const map = peopleMap ?? loadPeopleMap();
  const r = redactText(body, { source, peopleMap: map });
  if (r.blocked) gate.blocked = true;
  if (r.text !== body) {
    gate.redacted = true;
    gate.changes.push({ field: "body", before: body, after: r.text });
    for (const h of r.hits) {
      const existing = gate.hits.find((x) => x.tier === h.tier && x.type === h.type);
      if (existing) existing.count += h.count;
      else gate.hits.push(h);
    }
  }
  return r.text;
}

/**
 * Throw if the gate blocked anything. Writers call this before egress so a
 * blocked record is never sent, even in redacted-placeholder form.
 */
export function assertSendable(gate) {
  if (!gate || gate.blocked) {
    const err = new Error("redaction gate blocked this record; refusing to send");
    err.name = "RedactionBlockedError";
    throw err;
  }
  return gate;
}

/**
 * Provenance stamp for the row meta. Hit types + counts only — the original
 * text NEVER rides into the row (it lives in the local quarantine sidecar).
 */
export function redactionMetaForRow(gate) {
  if (!gate || !gate.redacted) return null;
  return redactionMeta({ profile: gate.profile, hits: gate.hits });
}

/**
 * Write the local-only quarantine sidecar for a gated record. Call only on
 * real writes (on a dry run nothing left the machine, so there is nothing to
 * quarantine). Failure → one loud stderr line, ingest proceeds.
 *
 * @param {object} gate    gateParsedTranscript()/gateSummary() accumulated result
 * @param {object} args    { source, ref, dir? }
 * @returns {string|null}  sidecar path (or null when nothing was redacted)
 */
export function quarantineGate(gate, { source, ref, dir } = {}) {
  if (!gate || !gate.redacted || gate.changes.length === 0) return null;
  const { path: sidecarPath, error } = writeQuarantineSidecar({
    source,
    ref,
    profile: gate.profile,
    hits: gate.hits,
    changes: gate.changes,
    dir,
  });
  if (error) {
    process.stderr.write(`ingest-redaction: QUARANTINE SIDECAR FAILED (${error}) — redacted ingest proceeding; original spans NOT recorded\n`);
  }
  return sidecarPath;
}

/** One human line for the writer logs. */
export function describeGate(gate) {
  if (gate && gate.blocked) return `redaction: BLOCKED under ${gate.profile} profile (record must not be sent)`;
  if (!gate || !gate.redacted) return "redaction: clean (no spans masked)";
  const parts = gate.hits.map((h) => `${h.type}×${h.count}`).join(", ");
  return `redaction: ${gate.changes.length} span(s) masked under ${gate.profile} profile (${parts})`;
}

export default { gateParsedTranscript, gateSummary, gateBodyText, assertSendable, redactionMetaForRow, quarantineGate, describeGate };
