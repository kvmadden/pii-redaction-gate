# Verification record

> **Correction, 3 November 2026.** The set this record calls held out (`eval/heldout.json`) is a 27-template development check: 27 identifier templates written four times each, plus 6 clinical sentences. `dc528aa` added its own vocabulary (Jardiance, Rheumatoid, Portal, Telephone) to the protected word list after `d05d144` committed it, so it was never blind, and its 104 of 108 is 26 of 27 templates. The commands, exit codes and hashes below are an accurate record of what was run. The conclusions drawn from them about held-out performance are withdrawn. See the main [README](../../README.md).

Node v24.14.1, macOS arm64. No package dependencies or install step. Baseline `91c4e16`, fetched from origin/main before work and rechecked before publication. No open PRs were present on either check. Source and archive searches found no separate implementation of this upgrade.

## RED then GREEN

| Command | State | Exit | Evidence |
|---|---|---|---|
| `node --test test/clinical.test.js` | Untouched baseline source plus new fixtures | 1 | red.txt, 14 failures and 3 passes |
| `npm test` | Untouched baseline source plus new fixtures | 1 | control-pre-change.txt |
| `node --test test/clinical.test.js` | Candidate detector | 0 | green-focused.txt |
| `npm test` | Candidate detector | 0 | candidate-full.txt |
| `npm test` | Final candidate including demo parity checks | 0 | candidate-final.txt, 105 passes |
| `npm test` | Fresh untouched baseline clone outside estate | 0 | control-full.txt, 79 passes |
| `git diff --check` | Final patch | 0 | Rechecked before commit |

Example RED assertion: `assert.ok(!redact(text).includes(value))` failed for `Admitted 10/22/2025`. Preservation assertions failed for `Continue Ozempic 0.5 mg weekly.` and `Chief Complaint: Crohn disease.` The same fixtures pass after the change.

An intermediate full run found two candidate-only regressions in the direct pattern API. It was red, not treated as green. Clinical rules were made opt-in within `applyPatterns` and enabled through the existing identifiers and strict profiles. This restored lighter-profile and direct-call behavior. Final full runs have zero candidate-only failures. Existing fail-closed tests passed without changes.

## Evaluation provenance

- `d05d144` commits generator and held-out data before source changes.
- `dc528aa` commits final detection rules before held-out scoring.
- `BASELINE_ENGINE="$(cat /tmp/pii-control-path)/src/engine.js" node eval/compare.js` exited 0. The temporary path file identified a fresh clone of the named repository at baseline main.
- Baseline original recall reproduces 146/207 exactly. Published `eval/dataset.js` and `eval/results.*` are unchanged.
- Held-out JSON SHA-256: `74bb137789e647d9a37e928b09817ca55c826a9eb3fcd9036fa0d9776b28116a`.
- `node eval/generate-heldout.js` exited 0 and reproduced identical bytes. A regression test locks the hash.
- Held-out scoring revealed the IPv4 sentence-end miss. No detector changes were made after that observation. The report includes all four repeated examples.

## Demo checks

No existing product screens or imported tokens existed in this repository. The demo defines local light-theme tokens in demo.css. The runtime is copied byte for byte from source by `node scripts/build-demo.js` and checked by the repository suite. The send guard is shared with Node writers, with its existing behavior and export preserved.

Server command: `python3 -m http.server 8769 --bind 127.0.0.1`.

Browser command: `PLAYWRIGHT_MODULE=<path-to-playwright> node scripts/check-demo.cjs`. Uses the already installed Playwright and Chrome, with no download or account. Exit 0.

At 1440×900, 430×932 and 390×844, checked normal and injected-failure flows, rendered removal explanations, normal simulated send, blocked send, stale-input blocking, HTML-safe output and keyboard focus from example selector to note. No page errors or horizontal overflow. Form buttons and select have minimum 46 CSS pixel height, the checkbox label has a 44 pixel click target. Screenshots were rendered at those viewport sizes and captured full page. Desktop, mobile and blocked screenshots were visually inspected. JSON results are in ui.json. Synthetic screenshots are under docs/media.

The demo has no service integration and makes no note-text requests. It shows execution failure blocking, not a guarantee that detection is complete.

## Final isolation and cleanup

A fresh `git clone --no-local` under the system temporary directory ran `npm test` with `MFW_UMBRELLA_ROOT` and `OPERATOR_ECOSYSTEM_ROOT` removed from its environment. Exit 0, 105 passes. The final whitespace-only send-guard correction was overlaid identically in source and its generated copy. The clone was removed in a finally block. See fresh-clone.txt.

Captured test logs have trailing whitespace removed for a clean patch. The assertions, counts and exit outcomes are unchanged. `git diff origin/main --check` exits 0 after that normalization.

Evidence is committed here for PR inspection. A copy is also kept in a local evidence directory outside the repository.
