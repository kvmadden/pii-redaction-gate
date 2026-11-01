# Clinical text redaction gate

For teams exploring how to protect free text before a model prompt or a record write. Clinical notes mix identifiers with useful information. This small, deterministic engine removes recognized identifier shapes while preserving medications, doses, lab values and conditions. If a redaction stage fails, the send gate refuses the record.

**The hard question:** does the gate catch identifiers without stripping the medicine?

**Short answer:** on its own synthetic held-out notes it removes 104 of 108 identifiers. Inside real published clinical language it removes only 20 of 38 planted fictional identifiers on the held-out documents, while removing 5 of 402 labeled clinical words. The gap between those two numbers is the main finding. Details and limits are in [How we test on real text](#how-we-test-on-real-text).

**This is an engineering evaluation, not validated clinical de-identification.** A successful run can still contain identifiers. No patient, employer or private clinical data was used. Real text comes only from openly licensed public sources, and every identifier planted in it is fictional.

![Interactive redaction flow with synthetic text](docs/media/demo-1440.png)

## Try it

Run `npm run demo` in this repository, then open [the redaction inspector](http://127.0.0.1:8769). No install step is needed with Node 22 or later. Pick a fictional note or paste synthetic text, choose one of the four real profiles, review labeled original spans beside redacted text and per-type counts, and try the simulated send. Switch between light and dark themes with the header button. Choose Blank note to see the empty state. Green marks identify a finite set of clinical phrases preserved verbatim, not every clinical term. Toggle a pattern failure to see the same engine return a blocked placeholder and the shared send guard refuse it. Editing a note invalidates the previous result. No note text is transmitted or persisted by the demo.

Screenshot assets at 1440×900 and 390×844, full mobile views, dark and blocked states, and the short [core flow GIF](docs/media/inspector-flow.gif) are in `docs/media/`.

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

Code is MIT. Copyright 2026 Kevin Madden. Evaluation fixtures are fictional or synthetic. The public text excerpts in `data/public/text` are not covered by the MIT license. Each keeps its own license and notice, listed in [data/public/SOURCES.md](data/public/SOURCES.md).


## How we test on real text

We test the gate three ways: synthetic notes for identifier recall, real public case reports with fictional identifiers planted in for recall inside real clinical language, and untouched real text to show it keeps the medications and diagnoses intact, each reported separately with its limits.

The real text is 18 CC BY case-report excerpts from PMC and two CMS coverage policy excerpts, each with a license, attribution and hashes in [data/public/SOURCES.md](data/public/SOURCES.md). Documents were split into dev (7) and held out (13) by source document before anything was built. Format families and identifier values are split the same way. The gate in `src/` was not changed for this work, so nothing was tuned on any of it. Full tables are in [eval/public-results.md](eval/public-results.md). The spec is [docs/REAL-TEXT-EVAL.md](docs/REAL-TEXT-EVAL.md).

| Set | Question | Data | Held-out result | Limit stated next to it |
|---|---|---|---|---|
| A | Does it catch identifiers? | 114 frozen synthetic held-out notes | 104/108 identifiers fully removed. 114/114 clinical negatives kept | Synthetic text is cleaner than real notes |
| B | Does it catch identifiers inside real clinical language? | 13 real excerpts, 9 with fictional identifiers planted and 4 untouched, in one shuffled run | 20/38 planted spans fully removed (52.6%, document bootstrap 95% interval 41.0% to 64.9%). Every one of the 9 planted documents still had at least one identifier left | Planted by a program, not written by a clinician |
| C | Does it leave the clinical meaning alone? | The same 13 excerpts, untouched | 5/402 labeled clinical tokens removed (1.2%, interval 0.3% to 2.4%). 51/52 labeled facts extracted before redaction and 50/52 after. Draft, pending pharmacist review | Small hand-labeled pilot set |

Each panel is its own number. There is no pooled score.

**What fails.** In Set B the gate misses patient initials (0 of 4), bare surnames in the narrative, dates written as "17th April 2026", dashed plan numbers and record numbers, a name with an accented letter, and a name that wraps onto a second line. In Set C it removes "Han", "Moroccan", "Borrelia", "Dexaven", "Positron", "Fluoro" and the "Gold" in QuantiFERON-TB Gold. It also leaves most dates the published text itself still carries: 1 of 12 removed on held out. Month and year dates such as "August 2022" are a Safe Harbor date element and are not caught. The [failure gallery](eval/public-results.md#failure-gallery) lists the first ten of each kind by a fixed severity rule, and the full lists are in `eval/public-results.json`.

### How the test is kept honest

| Check | What it does | Result |
|---|---|---|
| Frozen before scoring | Generator, seed 60417233, answer key and draft labels committed in `a30e6ac` before any Set B or C score existed. Results record the gate, generator, key and label commits | Gate unchanged from `63ac3ab` |
| Fixed public benchmark | The generator and key are public, so this is not a blind test | Stated in results |
| One serializer | Every document, planted or not, goes through the same final step (NFC, LF, collapsed spaces, one trailing newline) | Tested |
| Edits only where recorded | Undoing each recorded edit gives back the original byte for byte. Untouched documents are byte identical | Tested |
| Matched style | Day-first dates in day-first documents, the document's own hyphen and apostrophe characters, titles that agree with the report's pronouns, birth dates consistent with the stated age | Tested where checkable |
| No repeated values | Pools split in half by partition, one slice per document, no value or name word in two documents | Tested |
| Gate cannot know the generator | Greps gate code for reserved values (555-01xx, example.com), the seed, every planted value and every pool word | Passes |
| Swap test | Five reruns with every planted value redrawn, same structure | Held out 18 to 20 of 38, all inside the key run's interval |
| Metadata invariance | Shuffled order, fresh random IDs, scrambled spans, splits and labels | Identical outputs |
| Controls | Do-nothing gate and redact-everything gate on identical inputs | Do-nothing removes 0 identifiers. Redact-everything removes every clinical token and every extracted fact |
| Indistinguishability, automatic | Mask each edit, character n-gram logistic regression against matched untouched windows, folds grouped by document, 20 draws | Narrative edits 57.0% (draws 42.9% to 69.0%). Header and footer lines 81.1% |
| Indistinguishability, human | 20 blind sentences in [docs/blind-check.md](docs/blind-check.md) | Not yet done |

The automatic check passes for narrative edits but not for header and footer lines. Published case reports have no chart header, so those lines exist only in planted documents and a classifier spots them. The rule-based gate reads each document on its own and has no way to compare it with an untouched version, but this is still a real weakness of the planting and is reported here rather than fixed after seeing scores. Any planting change now would make a new benchmark version.

### Coverage of the 18 Safe Harbor categories

Untested means untested, not passed. Identifiers of relatives count and are planted. Clinician and hospital names are out of scope here. They are not planted in Set B and not labeled in Set C.

| Category | A synthetic | B planted | C source left in (draft audit) |
|---|---|---|---|
| Names | Tested | Tested, including relatives | None found |
| Geography smaller than a state | Tested | Tested (street, city) | None found |
| Dates, and ages over 89 | Tested | Dates tested. Ages over 89 untested | Dates found and scored |
| Phone numbers | Tested | Tested | None found |
| Fax numbers | Tested | Untested | None found |
| Email addresses | Tested | Tested | None found |
| Social Security numbers | Tested | Untested | None found |
| Medical record numbers | Tested | Tested | None found |
| Health plan numbers | Tested | Tested | None found |
| Account numbers | Tested | Untested | None found |
| License numbers | Tested | Untested | None found |
| Vehicle identifiers | Tested | Untested | None found |
| Device identifiers | Tested | Untested | None found |
| URLs | Tested | Untested | None found |
| IP addresses | Tested | Untested | None found |
| Biometric identifiers | Untested | Untested | Untested |
| Photos | Untested | Untested | Untested |
| Other unique codes | Untested | Untested | Untested |

### Labels and review

The Set C keep, extraction and source-left-in labels in [data/public/labels.json](data/public/labels.json) were proposed by an AI coding assistant. Kevin Madden reviews them as the pharmacist on the project. Until he does, every Set C number is draft, pending pharmacist review. No second independent reviewer has checked them. The extractor finds doses, routes and frequencies by pattern but takes medication and diagnosis wording from the labels, so its before score mostly tests negation and patterns. The drop after redaction is the measure that matters.

### Reproduce

```bash
npm test                         # includes the planting, isolation and contract tests
node eval/public-run.js --check  # reruns every panel offline and compares with the committed results
node eval/public-plant.js --write   # regenerates the answer key, which must not change
python3 data/public/fetch.py     # verifies the committed excerpts against their hashes
```

### Limits

These results are an offline engineering evaluation over the stated sources, categories and tasks. They are not an Expert Determination, a certification of Safe Harbor compliance, an estimate of re-identification risk, or validation for clinical use. Removing listed identifiers does not address identification through rare histories or combinations of details.

Also: the corpus is small (13 held-out documents, 38 held-out planted spans), so per-type results are counts, not rates. Case reports read differently from routine chart notes, so none of this is a claim about real charts. Pool words that the gate already contains (for example Bell, Love and Lane) were left out of the name pools so the isolation grep stays meaningful, which means names that collide with the gate's own word list are not tested. DailyMed label text is excluded because its redistribution rights are unresolved, and VAERS is deferred because its download requires a CAPTCHA. The inspector UI does not yet show the real-text data source, license chips or planted markers.
