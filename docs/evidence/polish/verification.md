# Clinical inspector verification

Base: origin/main `63ac3abc48094e86f6883f99c1586b45bf6ebd3f`. Candidate branch: `grok/pii-redaction-gate-polish`. Node v24.14.1, npm 11.11.0. No runtime or test dependencies added.

## Pickup and scope

The worktree starts at fetched origin/main and was clean. No applicable repository or ancestor guidance files were found.

Fetched origin/main and repeated `git ls-tree -r --name-only origin/main` and `git grep -n -i -E 'review|precision|recall|fax|discharge|refill' origin/main -- docs eval test`. Inspected existing inspector, CSS tokens, canonical evaluation, tests and build script. Existing upgrade and showcase work is already on main. `gh pr list --state open --json number,title,headRefName,url` returned an empty list at pickup and again before publication. No duplicate implementation owner was found.

## RED to GREEN

`node --test test/workspace.test.js` first failed for the missing module. A minimal stub then produced RED, exit 1 with three failures, preserved in red.txt. In particular the review test asserted `entry.action === 'flagged'` and received undefined. Fixture and metric tests also failed because data was absent. The same assertions pass after implementation. A parity test was added for the generated comparison artifact.

| Exact command | Exit | Result |
|---|---:|---|
| `node --test test/workspace.test.js` before implementation | 1 | 3 failed tests, red.txt |
| `node --test test/workspace.test.js` final | 0 | 4 passed, green.txt |
| `node scripts/build-demo.js` | 0 | Runtime modules and comparison JSON generated from canonical sources |
| `npm test` candidate | 0 | 113 passed, candidate-full.txt |
| `python3 docs/evidence/polish/check-isolated.py` | 0 | Main 109 passed, candidate overlay 113 passed |
| `FRAME_DIR=/tmp/pii-polish-frames PLAYWRIGHT_MODULE=<path-to-playwright> node scripts/check-demo.cjs` | 0 | UI assertions and media, browser.txt and ui.json |
| `git diff --check` | 0 | No whitespace errors |

The isolation script uses a fresh `git clone --no-local` under `/tmp`, outside the estate, pinned to untouched main. The candidate is overlaid onto that clone. Both runs use identical Node, no installed repository dependencies and unchanged synthetic evaluation fixtures, with MFW_UMBRELLA_ROOT and OPERATOR_ECOSYSTEM_ROOT unset. TemporaryDirectory removes the clone on success or failure. No baseline failures or final candidate-only failures. Trailing whitespace in two RED log lines was removed after the staged comparison caught it. Assertion evidence is unchanged. No detector, send-guard or fail-closed changes.

An initial browser harness attempt timed out because its clear-log button was inside a closed details element. The harness was corrected to open the details through its summary before clicking. The product action worked. No assertion was removed or forced click used. Visible browser creation was attempted, but the access host reported unavailable. Repeatable browser testing used the existing installed Playwright and Chrome.

## Visual and behavior checks

Rendered 1440x900, 430x932 and 390x844 in light and dark themes. Inspected all three full-page light captures. Existing green ink, paper, accent, removed and kept tokens retained. No horizontal page overflow, no browser errors and visible button, select and toggle targets at least 44 CSS pixels. Existing keyboard traversal plus Enter activation of reviewed action verified. Tables remain within the mobile page and the region is keyboard focusable.

Three clinical transcriptions run through the actual engine. Original and held-out metrics use frozen identifier-type recall with explicitly shared family precision. Not document-type performance. All demo documents are labeled curated, not held-out test cases. Custom edits replace source provenance with a draft label.

Browser assertions cover persistent review metadata across reload, flagging, clearing, disabled stale and blocked review actions, profile invalidation, injected failure, empty input, HTML-safe rendering, simulated send blocking and both themes. Separate browser context asserts readable evaluation failure and unsuccessful storage writes. The local log has no note text, reviewer identity, authentication or tamper protection. A review acknowledgment does not release a payload or change detector behavior.

Recaptured exact viewport images, full inspector views, dark and blocked states at all three sizes. GIF frames are real UI states: empty, fax inspection, local missed-identifier flag, injected engine failure. Eight seconds, 1008x630. Pillow was installed in a disposable environment solely for export. No paid API or model used.

## Assessment and remaining limits

See assessment.md for the 15-row self-assessment, 10.5/15 before and 14.5/15 after. The remaining half point is unmeasured workflow value. No clinical outcomes, real-world accuracy, OCR coverage, deployment, compliance or authenticated review are claimed. Younger ages are intentionally kept. Existing lowercase-name and held-out IP misses remain.

Evidence and media are also retained in a local evidence home outside the repository. Scratch clone, GIF frames and media environment removed after export. Local demo server stopped after capture. No deployment, service reload, paid API, force push or merge.
