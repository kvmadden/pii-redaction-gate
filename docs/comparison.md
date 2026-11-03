# Development comparison

Both sets below are development data. Rules were changed while looking at each of them, so these numbers show progress on known cases, not performance on unseen text. Engines run with the identifiers profile and an empty people map. Full removal requires every labeled letter and digit to be removed.

| Engine | Commit |
|---|---|
| First public release | 91c4e16 |
| main before this branch | facae00 |
| This tree (REDACTION_VERSION 3) | this tree |

## Development snippets: 182 synthetic snippets, 207 labeled identifiers

Written with the first release. Every later rule change was made while looking at it.

| Measure | First public release | main before this branch | This tree (REDACTION_VERSION 3) |
|---|---|---|---|
| Identifiers fully removed | 146/207 (70.5%) | 187/207 (90.3%) | 184/207 (88.9%) |
| Clinical phrases kept | 200/227 (88.1%) | 223/227 (98.2%) | 226/227 (99.6%) |
| Spans removed that overlap a labeled identifier | 82.6% of 190 | 97.0% of 202 | 99.5% of 186 |
| Snippets with an identifier left | 55/118 | 19/118 | 23/118 |
| Of those, marked for review | no status reported | no status reported | 10/23 |
| Of those, marked clean | no status reported | no status reported | 13/23 |
| All snippets marked for review | no status reported | no status reported | 17/182 |

### Every miss in this tree

| Snippet | Type | Value | Status | Result status |
|---|---|---|---|---|
| c001 | FACILITY | Lakeside Clinic | missed | review |
| c002 | AGE | 72 | missed | clean |
| c003 | FACILITY | Riverside General Hospital | missed | review |
| c007 | FACILITY | Northgate Cardiology | missed | review |
| c009 | AGE | 54 | missed | clean |
| c012 | FACILITY | Brightpath Home Care | missed | review |
| c014 | AGE | 81 | missed | clean |
| c024 | FACILITY | Eastside Kidney Center | missed | review |
| c033 | AGE | 67 | missed | clean |
| c047 | AGE | 82 | missed | clean |
| c056 | AGE | 45 | missed | clean |
| c060 | FACILITY | Lakeside Clinic Pulmonology | missed | review |
| c064 | FACILITY | Hillcrest Pediatrics | missed | review |
| c065 | AGE | 3 | missed | clean |
| c072 | AGE | 88 | missed | clean |
| c077 | AGE | 86 | missed | clean |
| c080 | FACILITY | Valley Birth Center | missed | review |
| c082 | AGE | 47 | missed | clean |
| m007 | FACILITY | Harborview Family Medicine | missed | review |
| m012 | AGE | 68 | missed | clean |
| m013 | ID | 77821 | missed | clean |
| m026 | FACILITY | Lakeview Behavioral Health | missed | review |
| m030 | AGE | 79 | missed | clean |

### Every false-positive span in this tree

| Snippet | Token | Removed text |
|---|---|---|
| g015 | [date] | 2025-03-01 |

## 27-template development check: 27 identifier templates x 4 copies, plus 6 clinical sentences

Committed before the rule changes in dc528aa, but those changes added this set's own vocabulary to a protected word list, so it was never blind. The 108 identifier rows are 27 templates written four times, so counts are given per template.

| Measure | First public release | main before this branch | This tree (REDACTION_VERSION 3) |
|---|---|---|---|
| Identifier templates removed in every copy | 7/27 | 26/27 | 26/27 |
| Clinical phrases kept in every copy | 5/6 | 6/6 | 6/6 |
| Snippets with an identifier left | 80/108 | 4/108 | 4/108 |
| Of those, marked for review | no status reported | no status reported | 0/4 |
| Of those, marked clean | no status reported | no status reported | 4/4 |
| All snippets marked for review | no status reported | no status reported | 0/114 |

Templates not removed in every copy by this tree:

- NAME `Dr. Emrys Calder`: 0 of 4 copies fully removed

### Every miss in this tree

| Snippet | Type | Value | Status | Result status |
|---|---|---|---|---|
| h2 | NAME | Dr. Emrys Calder | partial | clean |
| h29 | NAME | Dr. Emrys Calder | partial | clean |
| h56 | NAME | Dr. Emrys Calder | partial | clean |
| h83 | NAME | Dr. Emrys Calder | partial | clean |

### Every false-positive span in this tree

| Snippet | Token | Removed text |
|---|---|---|
| h19 | [address] | 90000 |
| h46 | [address] | 90000 |
| h73 | [address] | 90000 |
| h100 | [address] | 90000 |
