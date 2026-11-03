# Changelog

## 2.0.0 (November 2026)

Breaking changes:

- An unregistered source id blocks. It used to select `standard`, which skips the unknown-name pass. Pass `{ unknownSource: '<profile>' }` to accept unknown sources on purpose.
- The default profile is `identifiers`. Patient messages and call and voice transcripts map to `identifiers` instead of `strict`, because strict's topic tier deleted the clinical sentences they carry.
- `assertSendable` accepts only results this library sealed, and refuses `review` results unless called with `{ acceptReview: true }`.
- Results carry `status` (`clean`, `review` or `blocked`), `review` items and a `scan` report. `REDACTION_VERSION` is 3.
- Record helpers redact every string in a record and block values they cannot read, non-object records and identifiers used as keys. `changes` is no longer enumerable.

Added:

- A name tier built on public vocabularies (Census names, Drugs@FDA, ICD-10-CM, Webster's Second), pinned by SHA-256.
- The residual scan and `KNOWN_GAPS`.
- `sendRedacted`, the `redaction-gate` command, `index.d.ts`, CI on Node 22 and 24.
- Validated dates, IPv4 and IPv6, labeled IDs, ages over 89, international phones, Unicode digits and dashes, lowercase and city-state-ZIP addresses.

Evaluation:

- Both synthetic sets are development data. The set called held out in 1.x is a 27-template development check, reported per template. See the README.

## 1.0.0 (October 2026)

First public release.
