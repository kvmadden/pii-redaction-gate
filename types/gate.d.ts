// Type declarations for layered-pii-redaction/gate (src/gate.js).

import type { Gate, PeopleMap, ProfileName, Status, Hit } from "../index.js";

export type { Gate };

export interface GateOptions {
  /** Block when the default people map cannot be read. */
  requirePeopleMap?: boolean;
  /** Used to judge birth years (ages over 89). */
  referenceDate?: string | Date;
}

/** Redact a parsed record and an optional raw body. Returns a sealed, frozen gate. */
export function gateParsedTranscript(args: { parsed: object; source: string; body?: string | null; peopleMap?: PeopleMap } & GateOptions): Gate;

/** A NEW sealed gate covering `gate` plus the redacted model summary (gate.summary). */
export function gateSummary(summary: string | object | null, gate: Gate, source: string, peopleMap?: PeopleMap, opts?: GateOptions): Gate;

/** A NEW sealed gate covering `gate` plus a redacted body text (gate.body). */
export function gateBodyText(body: string | null, gate: Gate, source: string, peopleMap?: PeopleMap, opts?: GateOptions): Gate;

/**
 * Redact, check, then call the sink with the frozen, checked payload. Throws
 * RedactionBlockedError or RedactionReviewRequiredError instead of calling the sink.
 */
export function sendRedacted<T>(
  args: { parsed: object; source: string; body?: string | null; peopleMap?: PeopleMap; sink: (payload: Readonly<{ parsed: unknown; body: string | null; meta: Readonly<RowMeta> }>) => T; acceptReview?: boolean } & GateOptions,
): T;

export interface RowMeta {
  version: number;
  profile: ProfileName | null;
  status?: Status;
  hits: Hit[];
  redactedAt: string;
}

export function assertSendable<T>(result: T, opts?: { acceptReview?: boolean }): T;
export function redactionMetaForRow(gate: Gate | null | undefined, opts?: { now?: Date }): RowMeta | null;
export function quarantineGate(gate: Gate, opts?: { source?: string; ref?: string; dir?: string }): string | null;
export function describeGate(gate: Gate | null | undefined): string;
