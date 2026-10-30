// writers.js — minimal stand-ins for the two egress surfaces, used by the
// covenant tests (test/tripwire.test.js, test/fail-closed.test.js) to prove
// that nothing survives the gate to either one:
//
//   buildSummaryInput(parsed)   → the prompt string handed to a model
//   buildTranscriptRow(args)    → the record object written to a datastore
//   transcriptPatchBody(row)    → the body of an update to that record
//
// These are deliberately small. They carry every text surface of the parsed
// record that would cross the boundary, so "no fixture survives to writer
// output" is checked against a realistic shape, not just against redactText.

/**
 * Build the prompt string handed to the summarizing model: every operator
 * turn plus the assistant tail.
 */
export function buildSummaryInput(parsed) {
  const header = `turns: ${parsed.operatorTurnCount ?? (parsed.operatorTurns || []).length} operator · ${parsed.counts?.assistant || 0} assistant`;
  const turns = (parsed.operatorTurns || []).map((t, i) => `[${i + 1}] ${t.text}`).join("\n");
  const tail = (parsed.assistantTail || []).map((t) => `- ${t}`).join("\n");
  return [header, "", "OPERATOR TURNS:", turns, "", "ASSISTANT (tail):", tail].join("\n");
}

/**
 * Build the record written to the datastore. Carries the display `text`, the
 * summary fields, and the record provenance (firstUserMsg / lastAssistantMsg
 * and the optional body). The gate must have run on `parsed`, `summary` and
 * `body` already.
 */
export function buildTranscriptRow({ recordId, parsed, summary = null, body = null, source = "unknown" }) {
  const text = summary
    ? `[record] ${summary.summary}`.slice(0, 900)
    : `[record] ${parsed.counts?.user || 0}u/${parsed.counts?.assistant || 0}a · ${String(parsed.firstUserMsg || "").slice(0, 80)}`;

  return {
    id: recordId,
    text,
    source,
    tags: [`source:${source}`, ...(summary ? ["summarized"] : [])],
    meta: {
      ...(summary
        ? {
            summary: summary.summary,
            topics: summary.topics,
            operator_directions: summary.operatorDirections,
          }
        : {}),
      record: {
        counts: parsed.counts,
        firstUserMsg: parsed.firstUserMsg,
        lastAssistantMsg: parsed.lastAssistantMsg,
        ...(body ? { body } : {}),
      },
    },
  };
}

/** The body of an update to an existing record. */
export function transcriptPatchBody(row) {
  return { meta: row.meta, text: row.text, tags: row.tags, source: row.source };
}

export default { buildSummaryInput, buildTranscriptRow, transcriptPatchBody };
