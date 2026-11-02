# Public text evaluation evidence

Earlier acquisition logs for this branch were replaced by this summary. They remain in git history.

## Acquisition

- 18 CC BY PMC case-report excerpts and 2 CMS NCD narrative excerpts, fetched through the official PMC Cloud Service and the CMS coverage API. No website scraping.
- `python3 data/public/fetch.py` verifies every committed excerpt against its recorded sha256 offline. `--online` reproduces the excerpts from the pinned downloads.
- DailyMed is excluded because redistribution rights for manufacturer label text are unresolved. VAERS is deferred because its official download requires a CAPTCHA. See `vaers-download-blocker.json` and `manifest.exclusions`.

## Order of work

1. `a30e6ac` committed the Set B generator (`eval/public-plant.js`), its seed, the answer key (`data/public/planted.json`) and the draft Set C labels (`data/public/labels.json`). No score existed at that point.
2. The scoring code and results were committed after that. The gate in `src/` is unchanged from `63ac3ab` on main.
3. `1a5592e` moved the two planted email addresses to reserved example domains (example.com, example.net, example.org) so no planted address can belong to a real mailbox. Every other planted value is unchanged. Both versions were then rescored on the amended key with no gate change. Every recall, precision and control count stayed the same. The header and footer indistinguishability accuracy moved from 81.1% to 81.9%.

## Checks

- `npm test`: 137 tests, 136 pass, 0 fail, 1 todo (the inspector data-source switch, not built yet).
- `node eval/public-run.js --check` reproduces the version 2 results, `eval/public-results-v2.json` and `eval/public-results-v2.md`, byte for byte, offline. The version 1 files `eval/public-results.json` and `eval/public-results.md` are frozen, and a test checks they still match commit `4313491`.
- `node eval/public-plant.js --write` reproduces `data/public/planted.json` byte for byte.
