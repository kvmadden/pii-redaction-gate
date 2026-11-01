# Real-text evaluation results

Fixed public benchmark. The generator, seed and answer key are public, so this is not a blind test. Gate commit `63ac3ab`, generator `a30e6ac`, answer key `a30e6ac`, labels `a30e6ac`. Seed 60417233. Produced by `node eval/public-run.js`, offline. Three separate panels. There is no pooled score.

## Panel A. Synthetic held-out notes

Question: does it catch identifiers? Limit: synthetic text is cleaner than real notes.

| Gate | Identifiers fully removed | Partial | Span precision | Clinical negatives kept |
|---|---|---|---|---|
| gate | 104/108 (96.3%) | 0 | 96.4% | 114/114 (100.0%) |
| doNothing | 0/108 (0.0%) | 0 | N/A | 114/114 (100.0%) |
| redactEverything | 108/108 (100.0%) | 0 | 26.7% | 0/114 (0.0%) |

## Panel B. Real public text with planted fictional identifiers

Question: does it catch identifiers inside real clinical language? Limit: planted by a program, not written by a clinician. Planted-span recall only, so other detections are not called false positives.

| Gate | Split | Planted docs | Untouched docs in run | Spans fully removed | Partial | Missed | 95% interval | Docs with any identifier left |
|---|---|---|---|---|---|---|---|---|
| gate | heldout | 9 | 4 | 20/38 (52.6%) | 0 | 18 | 41.0% to 64.9% | 9/9 |
| gate | dev | 4 | 3 | 12/20 (60.0%) | 2 | 6 | 50.0% to 66.7% | 4/4 |
| doNothing | heldout | 9 | 4 | 0/38 (0.0%) | 0 | 38 |  | 9/9 |
| doNothing | dev | 4 | 3 | 0/20 (0.0%) | 0 | 20 |  | 4/4 |
| redactEverything | heldout | 9 | 4 | 38/38 (100.0%) | 0 | 0 |  | 0/9 |
| redactEverything | dev | 4 | 3 | 20/20 (100.0%) | 0 | 0 |  | 0/4 |

### Gate, heldout, by type, format family and challenge group

Counts under 10 are shown as counts only.

| Group | Fully removed |
|---|---|
| type: ADDRESS | 1/1 |
| type: DATE | 4/7 |
| type: EMAIL | 2/2 |
| type: HEALTH_PLAN | 2/5 |
| type: MRN | 1/2 |
| type: NAME | 9/20 (45.0%) |
| type: PHONE | 1/1 |
| family: address:street-only | 1/1 |
| family: date:dashed-short-year | 2/2 |
| family: date:month-ordinal | 2/5 |
| family: email:initial-digits | 2/2 |
| family: mrn:dashed | 1/2 |
| family: name:first-initial-last | 5/6 |
| family: name:initials | 0/4 |
| family: name:surname-only | 4/9 |
| family: name:upper-last-comma-first | 0/1 |
| family: phone:dot-ext | 1/1 |
| family: plan:alnum-dash | 2/5 |
| challenge: birth-date | 1/3 |
| challenge: common-word | 3/3 |
| challenge: footer | 5/6 |
| challenge: header | 9/17 (52.9%) |
| challenge: initials | 0/4 |
| challenge: line-break | 0/1 |
| challenge: narrative | 4/9 |
| challenge: possessive | 2/2 |
| challenge: relative | 1/2 |
| challenge: surname-only | 2/6 |

### Gate, dev, by type, format family and challenge group

Counts under 10 are shown as counts only.

| Group | Fully removed |
|---|---|
| type: ADDRESS | 0/2 |
| type: DATE | 2/2 |
| type: HEALTH_PLAN | 0/3 |
| type: MRN | 0/3 |
| type: NAME | 9/9 |
| type: PHONE | 1/1 |
| family: address:street-city | 0/2 |
| family: date:numeric-slash | 2/2 |
| family: mrn:alpha-prefix | 0/2 |
| family: mrn:digits | 0/1 |
| family: name:first-last | 4/4 |
| family: name:title-surname | 5/5 |
| family: phone:paren | 1/1 |
| family: plan:alpha-digits | 0/3 |
| challenge: birth-date | 1/1 |
| challenge: footer | 2/4 |
| challenge: header | 4/10 (40.0%) |
| challenge: line-break | 1/1 |
| challenge: narrative | 5/5 |
| challenge: possessive | 1/1 |
| challenge: relative | 1/1 |
| challenge: surname-only | 3/3 |

Swap test: five reruns with every planted value redrawn. Held-out recall 20/38, 19/38, 18/38, 20/38, 20/38 against 20/38 for the key. All inside the key run's 95% interval.

Metadata invariance: identical outputs after reversing order with fresh random IDs.

### Can the edits be told apart from untouched text?

| Windows | Planted windows | Held-out accuracy, mean of 20 draws | Range | 95% interval |
|---|---|---|---|---|
| body | 21 | 57.0% | 42.9% to 69.0% | 42.1% to 70.8% |
| header-footer | 21 | 81.1% | 71.4% to 88.1% | 66.8% to 90.1% |

Near 50% means the masked context gives the edit away no better than chance. Header and footer lines only exist in planted documents, so they are a structural trace by construction. The human blind check is not yet done.

## Panel C. Untouched real public text

Question: does it leave the clinical meaning alone? Limit: small hand-labeled pilot set. Labels are draft, pending pharmacist review.

| Gate | Split | Docs | Keep tokens removed | 95% interval | Labeled facts extracted before | After | Source-left-in dates removed |
|---|---|---|---|---|---|---|---|
| gate | heldout | 13 | 5/402 (1.2%) | 0.3% to 2.4% | 51/52 | 50/52 | 1/12 |
| gate | dev | 7 | 2/268 (0.7%) | 0.0% to 2.2% | 35/35 | 33/35 | 2/2 |
| doNothing | heldout | 13 | 0/402 (0.0%) |  | 51/52 | 51/52 | 0/12 |
| doNothing | dev | 7 | 0/268 (0.0%) |  | 35/35 | 35/35 | 0/2 |
| redactEverything | heldout | 13 | 402/402 (100.0%) |  | 51/52 | 0/52 | 12/12 |
| redactEverything | dev | 7 | 268/268 (100.0%) |  | 35/35 | 0/35 | 2/2 |

### Gate, heldout, extraction by type (draft, pending pharmacist review)

| Type | Labeled | Before | After |
|---|---|---|---|
| diagnosis | 39 | 38 | 38 |
| dose | 1 | 1 | 1 |
| frequency | 1 | 1 | 1 |
| medication | 7 | 7 | 6 |
| route | 4 | 4 | 4 |

### Gate, dev, extraction by type (draft, pending pharmacist review)

| Type | Labeled | Before | After |
|---|---|---|---|
| diagnosis | 18 | 18 | 17 |
| dose | 6 | 6 | 6 |
| frequency | 2 | 2 | 2 |
| medication | 6 | 6 | 5 |
| route | 3 | 3 | 3 |

Extraction before and after are each scored against the labels. Agreement between the two runs is not a quality score.

## Failure gallery

Severity order: missed planted identifier, partial leak, removed clinical keep token, source-left-in identifier not removed. Within a class, document id then position. The first 10 of each list are shown. Full lists are in `eval/public-results.json` under `failures`.

### Missed or partly removed planted identifiers (26)

| Split | Document | Type | Family | Challenge | Value | Result |
|---|---|---|---|---|---|---|
| dev | pmc-13719311 | HEALTH_PLAN | plan:alpha-digits | header | NKM 4531 4136 | missed |
| dev | pmc-13719403 | HEALTH_PLAN | plan:alpha-digits | header | PUN 4154 9263 | missed |
| dev | pmc-13719403 | MRN | mrn:digits | header | 528972951 | missed |
| dev | pmc-13720340 | MRN | mrn:alpha-prefix | header | UJ-906320 | missed |
| heldout | pmc-13720511 | NAME | name:initials | initials | P.H. | missed |
| heldout | pmc-13720511 | NAME | name:surname-only | narrative, surname-only | Hrytsenko | missed |
| heldout | pmc-13720755 | NAME | name:initials | initials | T.G. | missed |
| heldout | pmc-13720756 | DATE | date:month-ordinal | header | 17th April 2026 | missed |
| heldout | pmc-13720758 | NAME | name:initials | initials | D.I. | missed |
| heldout | pmc-13720758 | NAME | name:surname-only | narrative, surname-only | Iyer | missed |

### Clinical keep tokens removed (7)

| Split | Document | Token |
|---|---|---|
| heldout | pmc-13721315 | Han |
| heldout | pmc-13720756 | Moroccan |
| heldout | pmc-13720755 | Gold |
| heldout | cms-ncd-211-3 | Positron |
| heldout | cms-ncd-211-3 | Fluoro |
| dev | pmc-13719627 | Borrelia |
| dev | pmc-13719627 | Dexaven |

### Source-left-in dates not fully removed (11)

| Split | Document | Value | Result |
|---|---|---|---|
| heldout | pmc-13721315 | August 2022 | missed |
| heldout | pmc-13721315 | August 2022 | missed |
| heldout | pmc-13721315 | May 2022 | missed |
| heldout | pmc-13721315 | September 2022 | missed |
| heldout | pmc-13720603 | 21st January 2026 | missed |
| heldout | pmc-13720603 | 4th March 2026 | missed |
| heldout | pmc-13720603 | 21 Jan 2026 | partial |
| heldout | pmc-13720603 | 23 Jan 2026 | partial |
| heldout | pmc-13720603 | 22 Feb 2026 | partial |
| heldout | pmc-13720603 | 4 Mar 2026 | partial |
