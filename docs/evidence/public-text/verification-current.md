# Public text acquisition handoff

Status: blocked on source clearance. This is a draft acquisition PR, not completion of the requested evaluation and inspector feature.

## Source blocker

The selected DailyMed metformin label is company-submitted material. Its indications paragraph has no explicit copyright notice, but NLM states that private contributions can remain copyrighted without a notice. No affirmative redistribution rights were established. The required spec says unresolved files are left out. The label was therefore excluded and its text is not committed. openFDA terms also reserve possible third-party rights, so moving the same label into that API would not resolve the issue.

- Selected source: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=583f2a2e-a9d7-f266-e063-6294a90ad0ab
- Provenance: https://dailymed.nlm.nih.gov/dailymed/about-dailymed.cfm
- Rights policy: https://www.nlm.nih.gov/web_policies.html#copyright
- openFDA terms: https://open.fda.gov/terms/

An asynchronous question requests either a label source with explicit reuse permission or authorization to proceed with PMC and CMS only. No answer has been received. That scope change is not assumed.

PMC's legacy OA Web Service returns 404 and its official documentation says it was retired in August 2026. The official successor is the anonymous PMC Cloud Service. That acquisition path is working. Documentation: https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/. VAERS remains deferred. No CAPTCHA was bypassed.

## Preparation and ownership

Fetched current origin/main at 63ac3abc48094e86f6883f99c1586b45bf6ebd3f. Repeated the tracked-tree and keyword search across the repo and the operator ecosystem source, parked, archived and state brief paths. Checked open PRs, queued and started jobs and recent run evidence. Job 35 owns this work. PR 3 owns inspector polish and does not supply this corpus or evaluation. No duplicate implementation was found. The active job storage receipt resolves evidence to /Volumes/HubData/evidence.

The supplied isolated worktree is attached to /Users/kevin/dev/repos/pii-redaction-gate and starts at fetched origin/main. No applicable additional repository or ancestor instruction files were found. Existing untracked RED preparation was preserved. The previous spec copy was stale, so it was replaced byte for byte with the current required v3 spec. The reused manifest contract was updated from mandatory VAERS to CMS as the new brief requires. It still requires DailyMed and stays RED.

## Implemented preparation

- 18 distinct CC BY PMC case reports and two CMS NCD narrative excerpts, with source-level dev and heldout partitions assigned before any planting or gate tuning
- Per-source original and API URLs, title, authors, publisher, retrieval date, license URL, notices and retrieved and transformed sha256
- A pinned standard-library fetch script that verifies offline by default and reproduces exact excerpts from official downloads with --online
- An exclusion record for unresolved DailyMed rights and deferred VAERS
- Two focused acquisition tests, alongside the six reused RED evaluation contracts

No gate rules, synthetic fixtures or frozen synthetic results were changed. No public score was produced. No generator was frozen, no key or scoring implementation exists and no unreviewed label was presented as reviewed. No UI change or screenshot was made because this is acquisition preparation. The full requested held-out planting, metadata invariance, swap and indistinguishability checks, hand-label utility scoring, controls, intervals, failure gallery, coverage matrix, inspector integration and visual verification remain outstanding.

## Exact verification

Toolchain: Node v24.14.1, npm 11.11.0 and Python 3.9.6 standard library. No dependencies were installed.

- `node --test test/public-text.test.js` before implementation: exit 1. Six failures. First assertion: `Missing required public evaluation artifact: data/public/manifest.json`. Logs: red-current.txt and red-revised-sources.txt.
- `python3 data/public/fetch.py`: exit 0. All 20 committed excerpt hashes verify offline. No scratch directories are created.
- `python3 data/public/fetch.py --online`: exit 0. All 20 exact downloaded source hashes and reproduced excerpt bytes match. Downloads are sequential and held only in memory.
- `node --test test/public-acquisition.test.js`: exit 0. Two passing acquisition checks.
- `npm test` on the candidate: exit 1. 117 tests, 111 pass and six fail. All six failures are the new public evaluation contracts. The source contract reports missing DailyMed. The other failures identify the absent generator, scorer, labels, UI source switch and public runner. This is a RED full gate.
- Untouched control at 63ac3abc48094e86f6883f99c1586b45bf6ebd3f in a fresh /tmp clone, with `MFW_UMBRELLA_ROOT` and `OPERATOR_ECOSYSTEM_ROOT` unset, `npm test`: exit 0. 109 tests pass. Identical Node installation, no dependencies and the same committed synthetic fixtures. The Python TemporaryDirectory context removed the clone.

The previous run's logs remain historical evidence. Current control and candidate counts supersede them. No skip flags, disabled hooks, forced push or merge was used.
