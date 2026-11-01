# Clinical text redaction gate

For teams exploring how to protect free text before a model prompt or a record write. Clinical notes mix identifiers with useful information. This small, deterministic engine removes recognized identifier shapes while preserving medications, doses, lab values and conditions. If a redaction stage fails, the send gate refuses the record.

**This is a synthetic-data demonstration, not validated clinical de-identification.** A successful run can still contain identifiers. No real patient, employer or clinical data was used.

![Interactive redaction flow with synthetic text](docs/media/demo-1440.png)

## Try it

Run `python3 -m http.server 8769` in this repository, then open [the interactive demo](http://localhost:8769/docs/). Pick a fictional note or paste synthetic text, review the removed spans and their rule explanations, and try the simulated send. Toggle a pattern failure to see the same engine return a blocked placeholder and the shared send guard refuse it. Editing a note invalidates the previous result. No note text is transmitted or persisted by the demo.

The static demo also works when the `docs` directory is served on its own. Its runtime modules are exact generated copies of the production modules, checked by a test. No build service, API key or paid model is involved. The send action is a local simulation, not a clinical workflow integration.

## What changed and how it was tested

The [original published evaluation](eval/results.md) remains unchanged: **70.5% recall, 146 of 207 identifiers**, on 182 synthetic snippets. The original dataset is unchanged too. It now serves as development evidence, not an unseen test.

Before changing detection rules, a [seeded generator](eval/generate-heldout.js) and its [held-out fixtures](eval/heldout.json) were committed in `d05d144`. The engine changes were committed in `dc528aa` before the held-out set was scored. No detection changes followed that scoring. The held-out set has 114 snippets, 108 identifiers, and 114 labeled clinical negatives. It uses four variants of each of 27 identifier templates plus six clinical-only notes. Its repeated grammar and single author limit its independence and diversity.

Both engines were scored with an empty people map, the `identifiers` profile, the same scorer and identical fixtures. The baseline engine is untouched `origin/main` at `91c4e16`. Full removal requires every labeled letter and digit to be removed. Hard-negative preservation requires every labeled clinical character to survive.

| Dataset | Identifier recall before → after | Span precision before → after | Clinical negatives preserved before → after |
|---|---|---|---|
| Original, 207 identifiers | 70.5% → **90.3%** (187/207) | 82.6% → **97.0%** | 88.1% → **98.2%** (223/227) |
| Held out, 108 identifiers | 25.9% → **96.3%** (104/108) | 66.7% → **96.4%** | 84.2% → **100%** (114/114) |

[Before and after tables](eval/comparison.md) report every identifier type's recall, precision by compatible type family, and every remaining miss and false-positive span. [Raw results](eval/comparison.json) also include damaged clinical spans and character precision. Precision uses emitted spans overlapping gold, rather than exact entity boundaries. Names, relatives and facilities share a prediction family, as do labeled account and record IDs. These grouping choices are explicit in the report. They do not establish regulatory performance.

New regression tests were run RED before implementation, then GREEN. The full repository suite passes on untouched main and on the candidate. Existing tests inject failing stages, test blocked writer behavior and check that failures never return input text. [Verification evidence](docs/evidence/verification.md) records commands, exit codes and visual checks.

## Results and limits a reader should inspect

- Dates now include numeric, ISO, month-name and contextual month/day forms. Year alone remains. Ages over 89 are targeted. Younger ages are retained. The original set labels younger ages as identifiers, so its recall intentionally includes those misses.
- Labeled MRNs, accounts, plan numbers, device serials, licenses and vehicle identifiers now accept alphanumeric values. URLs and some IP formats are covered. Unlabeled IDs and unsupported international formats can survive.
- The name pass handles middle initials, compound surnames and family context. A finite clinical vocabulary protects common brands, eponyms and section headings. It is not a comprehensive drug dictionary or named-entity model. Unknown clinical terms may still be removed, and names that overlap vocabulary can survive.
- All four held-out misses are the same IPv4 template, `192.0.2.87.` at sentence end. IPv6 in this set was caught. This known boundary bug was retained after held-out scoring to honor the no-tuning rule. It needs a future independently frozen test set before another improvement claim.
- Original-set misses include lowercase `tanya`, single names such as `Omar`, and grouped member numbers. False positives and damaged negatives remain, including some clinical or section vocabulary. See the complete lists rather than relying on the aggregate.
- The held-out city-plus-ZIP template labels only the city. Its unlabeled ZIP is correctly removed but counted as a false positive by the frozen annotations. Neither labels nor reported precision were changed after scoring.
- English and US-centric rules, synthetic text only, small samples and repeated held-out templates. No claim of HIPAA compliance, Safe Harbor certification, or readiness to process real PHI. There is no verified coverage of every identifier format.

## Technical detail

`identifiers` runs patterns, then known and unknown names. It keeps the topic tier off so medical content is not deleted wholesale. `strict` adds sensitive-topic sentence removal. `standard` uses known names and context-gated topic rules. `light` applies the original pattern behavior and exempts code spans. New clinical patterns are enabled for `identifiers` and `strict`, preserving the direct `applyPatterns(text)` default and lighter profiles.

```js
import { redactText } from './src/index.js'
const result = redactText(
  'Patient Inez Thorn, admitted 10/22/2025. Continue metformin 500 mg BID.',
  { source: 'clinical-note' }
)
// result.text includes typed replacement tokens and the clinical instruction
// result.blocked signals an execution failure, not detection completeness
```

The API remains additive. `redactText` returns redacted text, hit types and counts, and a blocked flag. Unknown explicit profiles, invalid inputs and failing tiers return `[redaction-blocked]`. Record helpers accumulate that state. Writers must call `assertSendable` before egress. The demo and Node writers use the same pure guard.

Originals belong only in the optional local quarantine sidecar, with directory mode 0700 and file mode 0600. A failed quarantine write logs an error but does not block already-redacted output. A missing people-map file falls back to an empty map. Unselected record fields are copied unchanged. These existing limits remain.

```bash
npm test
node scripts/build-demo.js
npm run eval
# Reproduce the comparison with a checkout of 91c4e16 outside this tree
BASELINE_ENGINE=/path/to/baseline/src/engine.js node eval/compare.js
```

`npm run eval` refreshes the legacy report files with the current engine. The committed `eval/results.*` files deliberately retain the published before result. Use `eval/compare.js` for the separate before and after report. Regenerate the held-out JSON only to verify byte identity, never to select favorable samples.

## Development history and license

Originally built in June 2026 as a privacy gate for a private knowledge system, maintained through October and published as a standalone snapshot. The original release evidence and technical background are preserved in the [published README](docs/published-readme.md). This upgrade adds clinical identifier coverage, a frozen synthetic evaluation and an inspectable demo.

MIT. Copyright 2026 Kevin Madden. All fixtures are fictional or synthetic.
