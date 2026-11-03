# Redaction inspector verification

Node v24.14.1, macOS arm64. No application dependencies were added. This is the existing upgrade demo polished into an inspector, with the real byte-identical engine modules and shared send guard.

## Routing and scope

Worktree belongs to `<repo>`. Fetched origin before building and before publication. Untouched main is `91c4e16`. The open upgrade PR is #1 at `c51bb57`. This branch fast-forwards from that upgrade because it already supplies the canonical static demo. The PR targets main and names #1 as a dependency.

Checked open and recent PRs, source trees and function and synonym searches for demo, inspector, showcase and redaction. The existing upgrade owns detector improvements and the basic demo. No separate inspector implementation or PR was found.

No repository or ancestor AGENTS.md, CLAUDE.md, CANONICAL.md or FACTS.md files were found in this standalone clone. Existing screens and the light green ink, paper and accent tokens in demo.css were read before editing. The new UI extends those tokens, with corresponding dark-theme tokens.

## RED and GREEN

The new inspector model first failed to import, then a minimal empty implementation was used to obtain assertion-level RED before implementation. `red.txt` records three failures, including expected `blocked === false` receiving undefined, expected blocked failure receiving undefined and expected empty text receiving undefined. No assertions were weakened afterward.

| Exact command | Result | Evidence |
|---|---|---|
| `node --test test/inspector.test.js` before implementation | exit 1, 3 failed assertions | red.txt |
| `node --test test/inspector.test.js` final | exit 0, 3 passed | green.txt |
| `npm test` final candidate | exit 0, 109 passed | candidate-full.txt |
| `python3 docs/evidence/inspector/check-isolated.py` | exit 0 | control-full.txt, dependency-full.txt, fresh-candidate-full.txt |
| `node scripts/build-demo.js` | exit 0 | generated runtime parity checked in full suite |
| `PLAYWRIGHT_MODULE=<path-to-playwright> node scripts/check-demo.cjs` | exit 0 | ui.json and docs/media |
| `git diff --check` | exit 0 | final publication check |

The isolation harness is preserved beside this record. It creates a clone in the system temporary folder with `git clone --no-local`, checks out untouched origin/main, then the upgrade dependency, then overlays candidate files. Each runs the same `npm test` gate with identical Node, no dependencies, the original synthetic fixtures and the workspace root variables unset. The main control passes 79 tests. The dependency passes 105. The final candidate passes 109. There are no baseline full-gate failures and no candidate-only final failures. The temporary directory is removed by TemporaryDirectory on success or failure.

The new tests verify actual profile differences, exact phone span attribution, counts, preserved clinical phrases, blocked output, no review data on failure, invalid profile blocking, empty input and token-like input without invented spans. An additional parity test checks that the browser alignment module is identical to the canonical evaluation scorer. No detector rules or frozen evaluation data changed in this inspector commit.

## Browser and media

The visible browser host was unavailable when requested. The existing Playwright harness was used as the local application test runner with installed Chrome and an existing Playwright package. No browser download or account was needed.

Rendered and inspected at 1440×900, 430×932 and 390×844 in light and dark themes. Automated checks assert no page errors, no horizontal overflow, controls at least 44 CSS pixels tall, keyboard order through profile and inspect controls, HTML-safe rendering, normal simulated send, injected engine failure blocking, stale-input blocking, profile-change blocking and an empty state. Loading is announced through the live status and aria-busy before two animation frames allow the synchronous engine to run. Inspector errors also clear the send payload and show BLOCKED.

`docs/media/demo-1440.png` and `demo-390.png` are exact viewport screenshots. Full views are `inspector-full-*.png`. Dark and blocked captures cover all three viewport sizes. `inspector-flow.gif` shows real browser states in order: empty, inspected, simulated send allowed, then injected failure with send blocked. It is an 8-second looping animation at 1008×630, downsampled from 1440×900 frames. Only synthetic fixture text appears.

The four clinical phrase highlights are a finite display vocabulary and indicate verbatim preservation only. They are not a recall or completeness measure. Token-like input disables original span attribution rather than guessing. This UI does not improve the detector's known misses or certify de-identification.

## Evidence home and cleanup

Evidence and media are also copied to a local evidence home outside the repository.

The GIF tool used a disposable virtual environment with Pillow and four temporary PNG frames. Both are removed after export. The local development server is stopped after capture. No paid API, deployment, merge or service reload was performed.

Trailing whitespace in the RED log was removed for the diff gate. Assertion text and outcomes are unchanged.
