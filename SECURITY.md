# Report a privacy issue without sharing private data

This project is a demonstration, **not validated de-identification**. A `clean` result does not prove that all identifiers are gone. The [README](README.md#limits) describes known gaps.

**Never put real patient information, real identifiers, original documents, unredacted output, or production logs into an issue, pull request, screenshot, or email.** A private email is not a safe substitute for a synthetic reproduction.

## Use only fictional material

The browser inspector and command-line examples are demonstrations, not a safe place to test real patient records. Start with invented clinical notes. Do not paste actual notes, identifiers, screenshots or transcripts into the browser, terminal, bug reports or CI fixtures.

A result marked `clean` means the selected checks found nothing else to decide, **not** that the text is de-identified. In the locked synthetic evaluation, 8 of the 12 documents marked clean still contained an identifier. Marking a note reviewed in the browser authorizes only its *simulated* send; it is not an independent privacy approval and sends nothing to a remote service.

### Know what remains on the machine

- The browser demo stores review **metadata** (action, time, example label, profile and revision) in that browser's local storage. It does not store the note text in that review log. "Clear local review log" removes those entries and revokes the current review acknowledgment; it does not erase other browser data or undo any copies someone has made. A reported missed identifier stays blocked for the current session.
- The optional local quarantine sidecar can contain **original text fragments** in plain JSON. Owner-only file permissions (0600) do not provide encryption, retention limits or automatic deletion. Do not enable it for real patient data; if using fictional examples, dispose of the files under your own local data-handling procedure.
- The library's sealed result and send guard reduce accidental bypasses in code. They do not supply source verification, authorization, a privacy review process, monitoring, or a production retention policy.

Before any proposed use involving protected information, a separate authorized security and privacy review must establish an appropriate data-flow design, independent validation, access controls, storage and deletion rules, auditability and human review. **This project has not completed that process and is not approved for patient data.**

## What to report

The most important failure is an identifier that remains in text the gate marks `clean`. A result marked `review` is intentionally withheld by the default send guard until reviewed; `blocked` is withheld entirely. Either status can still reveal a useful gap, but report the status accurately.

1. Create a **fully fictional, minimal example** with the same text shape as the failure: punctuation, spacing, line breaks, field labels, and character types where relevant. Invent names, use `example.com` domains, and use fictional numbers; never paste a real source and replace only its name.
2. Include the profile and `source` setting, the command or API call, and the relevant version or commit if known.
3. Show the fictional input, the actual redacted output and status (`clean`, `review`, or `blocked`), plus what you expected. If applicable, describe which scan or review check did not recognize the fictional pattern.
4. Remove unrelated material. Inspect screenshots, traces and attachments before posting: they must contain **only synthetic data**.

## Where to report

Open a [GitHub issue](https://github.com/kvmadden/pii-redaction-gate/issues) with the fictional reproduction. For an initial report you do not want to post publicly, you can email kevin@kvmadden.com with a **high-level description only**. Do not attach raw data, notes, screenshots, logs, or actual identifiers. The same synthetic-only rule applies to follow-up discussion.

These reports help improve the rules; they do not certify the gate for protected health information or authorize sending patient data through it.
