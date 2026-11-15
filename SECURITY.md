# Report a privacy issue without sharing private data

This project is a demonstration, **not validated de-identification**. A `clean` result does not prove that all identifiers are gone. The [README](README.md#limits) describes known gaps.

**Never put real patient information, real identifiers, original documents, unredacted output, or production logs into an issue, pull request, screenshot, or email.** A private email is not a safe substitute for a synthetic reproduction.

## What to report

The most important failure is an identifier that remains in text the gate marks `clean`. A result marked `review` is intentionally withheld by the default send guard until reviewed; `blocked` is withheld entirely. Either status can still reveal a useful gap, but report the status accurately.

1. Create a **fully fictional, minimal example** with the same text shape as the failure: punctuation, spacing, line breaks, field labels, and character types where relevant. Invent names, use `example.com` domains, and use fictional numbers; never paste a real source and replace only its name.
2. Include the profile and `source` setting, the command or API call, and the relevant version or commit if known.
3. Show the fictional input, the actual redacted output and status (`clean`, `review`, or `blocked`), plus what you expected. If applicable, describe which scan or review check did not recognize the fictional pattern.
4. Remove unrelated material. Inspect screenshots, traces and attachments before posting: they must contain **only synthetic data**.

## Where to report

Open a [GitHub issue](https://github.com/kvmadden/pii-redaction-gate/issues) with the fictional reproduction. For an initial report you do not want to post publicly, you can email kevin@kvmadden.com with a **high-level description only**. Do not attach raw data, notes, screenshots, logs, or actual identifiers. The same synthetic-only rule applies to follow-up discussion.

These reports help improve the rules; they do not certify the gate for protected health information or authorize sending patient data through it.
