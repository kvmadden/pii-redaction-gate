# Public text evaluation preparation

Status: blocked before implementation. No PR was opened and no files were committed or pushed.

The required raw VAERS narrative source is not available locally. The official 1990 download returned HTTP 200 with text/html and a CAPTCHA rather than a ZIP. The official data sets page instructs users to enter a verification code before downloading. No challenge was solved or bypassed. A local path to an official CSV or ZIP downloaded after human verification is required to continue source selection and the complete offline evaluation.

Download: https://vaers.hhs.gov/eSubDownload/index.jsp?fn=1990VAERSData.zip

Instructions: https://vaers.hhs.gov/data/datasets.html

No existing VAERS copy was found in the checked Downloads, state or work directories. An asynchronous request for an existing local path was sent to the user. No response had arrived when this record was written.

## Preparation

Fetched origin/main. Inspected its complete tracked tree and searched public text, planting, VAERS, DailyMed and over-redaction terms. Searched parked and archived capabilities and state briefs in the local operator ecosystem origin/main tree. Checked the queued and started jobs and the last day of pii-redaction-gate run evidence. Job 35 owns this scope. PR 3 owns inspector polish and does not supply the public corpus or public evaluation. No duplicate implementation was found.

The supplied worktree belongs to the named canonical clone and begins at origin/main commit 63ac3ab. No applicable additional instruction files were found in the standalone repository or ancestors.

Copied the required shared spec byte for byte to docs/REAL-TEXT-EVAL.md. Added six test contracts before implementation. These cover manifest source and license restrictions with per-document hashes, deterministic planted answer keys with split format families and frozen generator commit provenance, exact planted scoring including partial misses, draft hand labels and clinical extraction loss, UI attribution and planted markers, and an offline results check that preserves the frozen synthetic files. They are intentionally RED until implementation exists.

## Commands and outcomes

- `node --test test/public-text.test.js`: exit 1. Six new tests fail. The first assertion reports `Missing required public evaluation artifact: data/public/manifest.json`. No assertions have been weakened.
- `env -u MFW_UMBRELLA_ROOT -u OPERATOR_ECOSYSTEM_ROOT npm test` in a fresh temporary clone outside the estate at untouched origin/main: exit 0. All 79 tests pass. No dependencies were installed. The clone was deleted using Python TemporaryDirectory.
- `npm test` in the candidate worktree: exit 1. The six new contracts fail. This is not a GREEN full gate.
- `git diff --check`: exit 0. The current changes are new untracked files and were separately checked for trailing whitespace.

No detector rules or existing synthetic fixtures or result files were modified. No gate tuning or public scores were produced. No visual changes or screenshots were made because the source set is incomplete. No merge, paid API, account creation, deployment or service reload occurred.

The active job storage receipt resolves evidence storage to /Volumes/HubData/evidence. Logs, this record and the test contract are preserved under /Volumes/HubData/evidence/pii-redaction-gate-public-text. No registry was modified.
