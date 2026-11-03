// Type declarations for layered-pii-redaction (src/index.js and src/gate.js).

export type ProfileName = "light" | "standard" | "identifiers" | "strict";
export type Status = "clean" | "review" | "blocked";

export interface Hit {
  tier: "pattern" | "name" | "topic" | "engine";
  type: string;
  count: number;
}

/** A span the rules could not decide. Offsets are into the redacted text. */
export interface ReviewItem {
  start: number;
  end: number;
  check: string;
  reason: string;
  /** Present on record results: which field the span is in. */
  field?: string;
}

/** What a result read, which checks ran, and what no check can see. */
export interface ScanReport {
  profile: ProfileName;
  characters: number;
  read: number;
  exempt: Array<{ start: number; end: number; reason: string }>;
  checks: string[];
  notChecked: string[];
  knownGaps: readonly string[];
}

export interface PeopleMap {
  people?: Array<{ name: string; role?: string; aliases?: string[] }>;
  safe?: string[];
}

export interface RedactOptions {
  profile?: ProfileName;
  /** A registered source id. An unregistered id blocks unless unknownSource names a profile. */
  source?: string;
  unknownSource?: ProfileName;
  peopleMap?: PeopleMap;
  topicCategories?: unknown[];
  /** Used to judge birth years (ages over 89). Without it a birth year goes to review. */
  referenceDate?: string | Date;
  /** Longest input accepted. Default 2,000,000 characters. */
  maxLength?: number;
  /** Append-only extra rules. The built-in rules always run. */
  extraPatternRules?: Array<{ type: string; re: RegExp; validate?: (...args: unknown[]) => boolean; replace?: (...args: unknown[]) => string }>;
  /** Test seam: throw at a stage. It can only turn a result into a blocked one. */
  injectFault?: "pattern" | "name" | "topic" | "scan";
}

/** A sealed result. Only objects this library returns pass assertSendable. */
export interface RedactResult {
  text: string;
  redacted: boolean;
  blocked: boolean;
  status: Status;
  hits: Hit[];
  review: ReviewItem[];
  scan: ScanReport | null;
  profile: ProfileName | null;
  error?: { stage: string; name?: string };
}

export interface RecordResult<K extends string, V> {
  redacted: boolean;
  blocked: boolean;
  status: Status;
  hits: Hit[];
  review: ReviewItem[];
  profile: ProfileName | null;
  error?: { stage: string; fields?: string[] };
  /** Not enumerable. Original and redacted values, for the local quarantine only. */
  readonly changes: Array<{ field: string; before: string; after: string }>;
  [key: string]: unknown;
}

export const REDACTION_VERSION: number;
export const BLOCKED_TEXT: "[redaction-blocked]";
export const DEFAULT_MAX_LENGTH: number;
export const KNOWN_GAPS: readonly string[];
export const DEFAULT_PROFILE: ProfileName;
export const PROFILES: Readonly<Record<ProfileName, Readonly<{ name: ProfileName; tiers: readonly string[]; exemptCode: boolean; unknownNames: boolean; clinicalPatterns: boolean; residualScan: boolean; topicStrict: boolean }>>>;
export const SOURCE_PROFILES: Readonly<Record<string, ProfileName>>;
export const RESIDUAL_CHECKS: readonly string[];
export const PATTERN_RULES: readonly unknown[];
export const PATTERN_TOKEN_TYPES: readonly string[];

export class RedactionConfigError extends Error {}

export function redactText(text: string | null | undefined, opts?: RedactOptions): RedactResult;
export function redactParsedTranscript(parsed: object | null | undefined, opts?: RedactOptions): RecordResult<"parsed", object | null>;
export function redactSummaryFields(summary: string | object | null | undefined, opts?: RedactOptions): RecordResult<"summary", string | object | null>;
export function redactionMeta(args: { profile: ProfileName | null; hits: Hit[]; status?: Status; now?: Date }): { version: number; profile: ProfileName | null; status?: Status; hits: Hit[]; redactedAt: string };
export function profileForSource(source: string): ProfileName | null;
export function resolveProfile(opts?: RedactOptions): Readonly<{ name: ProfileName }>;
export function profileChecks(profile: object): { checks: string[]; notChecked: string[] };
export function scanResidual(text: string, opts?: { names?: boolean; safe?: Set<string>; nameTokens?: Set<string>; referenceDate?: unknown; skip?: Array<{ start: number; end: number }> }): ReviewItem[];
export function normalizePeopleMap(map: PeopleMap | null | undefined): { people: Array<{ names: string[]; role: string }>; safe: Set<string> };
export function loadPeopleMap(opts?: { mapPath?: string; env?: Record<string, string | undefined>; force?: boolean; required?: boolean }): PeopleMap;

/**
 * Throw unless the result may be sent: it must be a sealed result from this
 * library, not blocked, and not waiting for review unless acceptReview is set.
 * Returns the result so the caller sends exactly what was checked.
 */
export function assertSendable<T>(result: T, opts?: { acceptReview?: boolean }): T;

export function writeQuarantineSidecar(args: { source?: string; ref?: string; profile?: string; hits?: Hit[]; changes?: unknown[]; dir?: string; now?: Date }): { path: string | null; error: string | null };
export function defaultQuarantineDir(env?: Record<string, string | undefined>): string;
