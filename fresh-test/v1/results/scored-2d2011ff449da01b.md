# Blind set: the scored run

| | |
|---|---|
| Set | fresh-test/v1, 132 documents, set hash 2d2011ff449da01bb3200b5f2832cb40faa70323cc85a5f97a79446dd4f71055 |
| Set hash encoding | newline-joined |
| Offsets | codepoint. Of 11973 spans, these split a word or a character when read as code points: 0, as UTF-16: 0, as bytes: 2929 |
| Commit | 30b6061e96371104c041d3fa5fd0fd1ccd9674c3, no uncommitted changes in src or eval/fresh |
| Scorer | content hash ddd1cfa5d2e8714c87ec25d8f6ac5add2ada974079f6a633f29af767d9218815, matches eval/fresh/scorer-lock.json |
| Gate | REDACTION_VERSION 3, identifiers profile |
| Header rule | version 1, sha256 5f54134d682a690966cefa749fc6e78d4b6ddc0c33fd6204f6431f6e3ff2116e |
| Run | 2026-11-03T16:26:56.532Z, Node v24.14.1 |

## Side by side

Counts are identifier mentions, documents or spans. Each cell is a count of a denominator, the rate, and its Wilson 95% interval.

| Measure | gate-empty | gate-header | do-nothing | remove-every-word | presidio |
|---|---|---|---|---|---|
| Silent leaks: identifier mentions left in documents marked clean (lower is better) | 12 of 2577 (0.5%, 0.3% to 0.8%) | 11 of 2577 (0.4%, 0.2% to 0.8%) | 2577 of 2577 (100.0%, 99.9% to 100.0%) | 0 of 2577 (0.0%, 0.0% to 0.1%) | 701 of 2577 (27.2%, 25.5% to 29.0%) |
| Clean documents that still hold an identifier (lower is better) | 8 of 12 (66.7%, 39.1% to 86.2%) | 7 of 12 (58.3%, 32.0% to 80.7%) | 104 of 132 (78.8%, 71.1% to 84.9%) | 0 of 132 (0.0%, 0.0% to 2.8%) | 101 of 132 (76.5%, 68.6% to 82.9%) |
| Identifier mentions fully removed (higher is better) | 2037 of 2577 (79.0%, 77.4% to 80.6%) | 2053 of 2577 (79.7%, 78.1% to 81.2%) | 0 of 2577 (0.0%, 0.0% to 0.1%) | 2577 of 2577 (100.0%, 99.9% to 100.0%) | 1876 of 2577 (72.8%, 71.0% to 74.5%) |
| Mentions left in documents marked review | 528 of 2577 (20.5%, 19.0% to 22.1%) | 513 of 2577 (19.9%, 18.4% to 21.5%) | 0 of 2577 (0.0%, 0.0% to 0.1%) | 0 of 2577 (0.0%, 0.0% to 0.1%) | 0 of 2577 (0.0%, 0.0% to 0.1%) |
| Mentions left with a review span on them | 294 of 2577 (11.4%, 10.2% to 12.7%) | 285 of 2577 (11.1%, 9.9% to 12.3%) | 0 of 2577 (0.0%, 0.0% to 0.1%) | 0 of 2577 (0.0%, 0.0% to 0.1%) | 0 of 2577 (0.0%, 0.0% to 0.1%) |
| Documents sent to review (lower is better) | 120 of 132 (90.9%, 84.8% to 94.7%) | 120 of 132 (90.9%, 84.8% to 94.7%) | 0 of 132 (0.0%, 0.0% to 2.8%) | 0 of 132 (0.0%, 0.0% to 2.8%) | 0 of 132 (0.0%, 0.0% to 2.8%) |
| Review documents with nothing left to find (lower is better) | 29 of 120 (24.2%, 17.4% to 32.6%) | 29 of 120 (24.2%, 17.4% to 32.6%) | 0 of 0 | 0 of 0 | 0 of 0 |
| Clinical spans (KEEP) intact (higher is better) | 9142 of 9198 (99.4%, 99.2% to 99.5%) | 9142 of 9198 (99.4%, 99.2% to 99.5%) | 9198 of 9198 (100.0%, 100.0% to 100.0%) | 0 of 9198 (0.0%, 0.0% to 0.0%) | 8445 of 9198 (91.8%, 91.2% to 92.4%) |
| Other not-identifier spans intact (ages under 90, years) (higher is better) | 198 of 198 (100.0%, 98.1% to 100.0%) | 198 of 198 (100.0%, 98.1% to 100.0%) | 198 of 198 (100.0%, 98.1% to 100.0%) | 0 of 198 (0.0%, 0.0% to 1.9%) | 13 of 198 (6.6%, 3.9% to 10.9%) |
| Documents blocked (lower is better) | 0 of 132 (0.0%, 0.0% to 2.8%) | 0 of 132 (0.0%, 0.0% to 2.8%) | 0 of 132 (0.0%, 0.0% to 2.8%) | 0 of 132 (0.0%, 0.0% to 2.8%) | 0 of 132 (0.0%, 0.0% to 2.8%) |
| Letters and digits removed outside identifier spans (lower is better) | 1184 of 391855 (0.3%, 0.3% to 0.3%) | 1184 of 391855 (0.3%, 0.3% to 0.3%) | 0 of 391855 (0.0%, 0.0% to 0.0%) | 391855 of 391855 (100.0%, 100.0% to 100.0%) | 15471 of 391855 (3.9%, 3.9% to 4.0%) |
| Documents scored by text search because the output could not be aligned | 0 | 0 | 0 | 0 | 0 |

### Engines

- **gate-empty**: Gate, identifiers profile, empty people map. REDACTION_VERSION 3.
- **gate-header**: Gate, identifiers profile, people map from the header block (rule v1). REDACTION_VERSION 3.
- **do-nothing**: Do nothing (sends the text unchanged). 1.
- **remove-every-word**: Remove every word (replaces every run of letters and digits). 1.
- **presidio**: Microsoft Presidio, default English recognizers (offline). presidio-analyzer 2.2.360, presidio-anonymizer 2.2.360, spacy 3.8.7, en_core_web_lg 3.8.0, Python 3.9.6.

## Where a gate configuration is below another engine

| Gate | Below | Measure | Gate | Other | 95% intervals overlap |
|---|---|---|---|---|---|
| gate-empty | do-nothing | Documents sent to review | 120/132 (90.9%) | 0/132 (0.0%) | no |
| gate-empty | do-nothing | Clinical spans (KEEP) intact | 9142/9198 (99.4%) | 9198/9198 (100.0%) | no |
| gate-empty | do-nothing | Letters and digits removed outside identifier spans | 1184/391855 (0.3%) | 0/391855 (0.0%) | no |
| gate-empty | remove-every-word | Silent leaks: identifier mentions left in documents marked clean | 12/2577 (0.5%) | 0/2577 (0.0%) | no |
| gate-empty | remove-every-word | Clean documents that still hold an identifier | 8/12 (66.7%) | 0/132 (0.0%) | no |
| gate-empty | remove-every-word | Identifier mentions fully removed | 2037/2577 (79.0%) | 2577/2577 (100.0%) | no |
| gate-empty | remove-every-word | Documents sent to review | 120/132 (90.9%) | 0/132 (0.0%) | no |
| gate-empty | presidio | Documents sent to review | 120/132 (90.9%) | 0/132 (0.0%) | no |
| gate-header | do-nothing | Documents sent to review | 120/132 (90.9%) | 0/132 (0.0%) | no |
| gate-header | do-nothing | Clinical spans (KEEP) intact | 9142/9198 (99.4%) | 9198/9198 (100.0%) | no |
| gate-header | do-nothing | Letters and digits removed outside identifier spans | 1184/391855 (0.3%) | 0/391855 (0.0%) | no |
| gate-header | remove-every-word | Silent leaks: identifier mentions left in documents marked clean | 11/2577 (0.4%) | 0/2577 (0.0%) | no |
| gate-header | remove-every-word | Clean documents that still hold an identifier | 7/12 (58.3%) | 0/132 (0.0%) | no |
| gate-header | remove-every-word | Identifier mentions fully removed | 2053/2577 (79.7%) | 2577/2577 (100.0%) | no |
| gate-header | remove-every-word | Documents sent to review | 120/132 (90.9%) | 0/132 (0.0%) | no |
| gate-header | presidio | Documents sent to review | 120/132 (90.9%) | 0/132 (0.0%) | no |

## By identifier type

### Identifier mentions fully removed

| Type | gate-empty | gate-header | do-nothing | remove-every-word | presidio |
|---|---|---|---|---|---|
| ADDRESS | 121/157 (77.1%) | 121/157 (77.1%) | 0/157 (0.0%) | 157/157 (100.0%) | 24/157 (15.3%) |
| AGE | 63/91 (69.2%) | 63/91 (69.2%) | 0/91 (0.0%) | 91/91 (100.0%) | 51/91 (56.0%) |
| CLINICIAN | 473/595 (79.5%) | 475/595 (79.8%) | 0/595 (0.0%) | 595/595 (100.0%) | 530/595 (89.1%) |
| DATE | 320/339 (94.4%) | 320/339 (94.4%) | 0/339 (0.0%) | 339/339 (100.0%) | 316/339 (93.2%) |
| DEVICE | 5/19 (26.3%) | 5/19 (26.3%) | 0/19 (0.0%) | 19/19 (100.0%) | 3/19 (15.8%) |
| DOB | 61/64 (95.3%) | 61/64 (95.3%) | 0/64 (0.0%) | 64/64 (100.0%) | 60/64 (93.8%) |
| EMAIL | 27/38 (71.1%) | 27/38 (71.1%) | 0/38 (0.0%) | 38/38 (100.0%) | 27/38 (71.1%) |
| FACILITY | 118/212 (55.7%) | 118/212 (55.7%) | 0/212 (0.0%) | 212/212 (100.0%) | 23/212 (10.8%) |
| FAX | 35/35 (100.0%) | 35/35 (100.0%) | 0/35 (0.0%) | 35/35 (100.0%) | 35/35 (100.0%) |
| ID | 157/231 (68.0%) | 157/231 (68.0%) | 0/231 (0.0%) | 231/231 (100.0%) | 144/231 (62.3%) |
| IP | 11/11 (100.0%) | 11/11 (100.0%) | 0/11 (0.0%) | 11/11 (100.0%) | 11/11 (100.0%) |
| NAME | 248/326 (76.1%) | 261/326 (80.1%) | 0/326 (0.0%) | 326/326 (100.0%) | 243/326 (74.5%) |
| PHONE | 110/118 (93.2%) | 110/118 (93.2%) | 0/118 (0.0%) | 118/118 (100.0%) | 111/118 (94.1%) |
| RELATIVE | 249/298 (83.6%) | 250/298 (83.9%) | 0/298 (0.0%) | 298/298 (100.0%) | 264/298 (88.6%) |
| URL | 33/33 (100.0%) | 33/33 (100.0%) | 0/33 (0.0%) | 33/33 (100.0%) | 33/33 (100.0%) |
| VEHICLE | 6/10 (60.0%) | 6/10 (60.0%) | 0/10 (0.0%) | 10/10 (100.0%) | 1/10 (10.0%) |

### Silent leaks: identifier mentions left in documents marked clean

| Type | gate-empty | gate-header | do-nothing | remove-every-word | presidio |
|---|---|---|---|---|---|
| ADDRESS | 0/157 (0.0%) | 0/157 (0.0%) | 157/157 (100.0%) | 0/157 (0.0%) | 133/157 (84.7%) |
| AGE | 1/91 (1.1%) | 1/91 (1.1%) | 91/91 (100.0%) | 0/91 (0.0%) | 40/91 (44.0%) |
| CLINICIAN | 0/595 (0.0%) | 0/595 (0.0%) | 595/595 (100.0%) | 0/595 (0.0%) | 65/595 (10.9%) |
| DATE | 3/339 (0.9%) | 3/339 (0.9%) | 339/339 (100.0%) | 0/339 (0.0%) | 23/339 (6.8%) |
| DEVICE | 0/19 (0.0%) | 0/19 (0.0%) | 19/19 (100.0%) | 0/19 (0.0%) | 16/19 (84.2%) |
| DOB | 0/64 (0.0%) | 0/64 (0.0%) | 64/64 (100.0%) | 0/64 (0.0%) | 4/64 (6.3%) |
| EMAIL | 0/38 (0.0%) | 0/38 (0.0%) | 38/38 (100.0%) | 0/38 (0.0%) | 11/38 (28.9%) |
| FACILITY | 3/212 (1.4%) | 3/212 (1.4%) | 212/212 (100.0%) | 0/212 (0.0%) | 189/212 (89.2%) |
| FAX | 0/35 (0.0%) | 0/35 (0.0%) | 35/35 (100.0%) | 0/35 (0.0%) | 0/35 (0.0%) |
| ID | 1/231 (0.4%) | 1/231 (0.4%) | 231/231 (100.0%) | 0/231 (0.0%) | 87/231 (37.7%) |
| IP | 0/11 (0.0%) | 0/11 (0.0%) | 11/11 (100.0%) | 0/11 (0.0%) | 0/11 (0.0%) |
| NAME | 2/326 (0.6%) | 1/326 (0.3%) | 326/326 (100.0%) | 0/326 (0.0%) | 83/326 (25.5%) |
| PHONE | 0/118 (0.0%) | 0/118 (0.0%) | 118/118 (100.0%) | 0/118 (0.0%) | 7/118 (5.9%) |
| RELATIVE | 2/298 (0.7%) | 2/298 (0.7%) | 298/298 (100.0%) | 0/298 (0.0%) | 34/298 (11.4%) |
| URL | 0/33 (0.0%) | 0/33 (0.0%) | 33/33 (100.0%) | 0/33 (0.0%) | 0/33 (0.0%) |
| VEHICLE | 0/10 (0.0%) | 0/10 (0.0%) | 10/10 (100.0%) | 0/10 (0.0%) | 9/10 (90.0%) |


## By document kind

### Identifier mentions fully removed

| Kind | gate-empty | gate-header | do-nothing | remove-every-word | presidio |
|---|---|---|---|---|---|
| call-transcript | 506/693 (73.0%) | 509/693 (73.4%) | 0/693 (0.0%) | 693/693 (100.0%) | 492/693 (71.0%) |
| discharge-referral | 432/528 (81.8%) | 432/528 (81.8%) | 0/528 (0.0%) | 528/528 (100.0%) | 396/528 (75.0%) |
| email-admin-letter | 68/91 (74.7%) | 69/91 (75.8%) | 0/91 (0.0%) | 91/91 (100.0%) | 70/91 (76.9%) |
| lab-imaging-pathology | 145/174 (83.3%) | 145/174 (83.3%) | 0/174 (0.0%) | 174/174 (100.0%) | 111/174 (63.8%) |
| pharmacy-note | 247/296 (83.4%) | 247/296 (83.4%) | 0/296 (0.0%) | 296/296 (100.0%) | 243/296 (82.1%) |
| portal-message | 189/230 (82.2%) | 195/230 (84.8%) | 0/230 (0.0%) | 230/230 (100.0%) | 172/230 (74.8%) |
| progress-note-hp | 450/565 (79.6%) | 456/565 (80.7%) | 0/565 (0.0%) | 565/565 (100.0%) | 392/565 (69.4%) |

### Silent leaks: identifier mentions left in documents marked clean

| Kind | gate-empty | gate-header | do-nothing | remove-every-word | presidio |
|---|---|---|---|---|---|
| call-transcript | 3/693 (0.4%) | 3/693 (0.4%) | 693/693 (100.0%) | 0/693 (0.0%) | 201/693 (29.0%) |
| discharge-referral | 0/528 (0.0%) | 0/528 (0.0%) | 528/528 (100.0%) | 0/528 (0.0%) | 132/528 (25.0%) |
| email-admin-letter | 2/91 (2.2%) | 2/91 (2.2%) | 91/91 (100.0%) | 0/91 (0.0%) | 21/91 (23.1%) |
| lab-imaging-pathology | 3/174 (1.7%) | 3/174 (1.7%) | 174/174 (100.0%) | 0/174 (0.0%) | 63/174 (36.2%) |
| pharmacy-note | 2/296 (0.7%) | 2/296 (0.7%) | 296/296 (100.0%) | 0/296 (0.0%) | 53/296 (17.9%) |
| portal-message | 2/230 (0.9%) | 1/230 (0.4%) | 230/230 (100.0%) | 0/230 (0.0%) | 58/230 (25.2%) |
| progress-note-hp | 0/565 (0.0%) | 0/565 (0.0%) | 565/565 (100.0%) | 0/565 (0.0%) | 173/565 (30.6%) |

## Definitions

A labeled span is removed when every letter and digit in it is gone from the output, partial when some are, and missed when none are. A mention is left when it is partial or missed. Engines with no status (the bounds and Presidio) count as clean: what they return is what would be sent. Mentions in blocked documents are withheld, counted in neither removal nor leaks. Caught by review counts left mentions in documents marked review. Caught at the span counts only those with a review span on what remains of them. An output that cannot be aligned to its input is scored by text search, after folding case, width and accents: a span is missed when its text is still in the output, partial when any word of it is, and removed only when neither is true.
