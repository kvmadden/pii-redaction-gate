# Clinical text redaction gate

A rule-based gate for clinical free text on its way to a model prompt or a record store. It removes identifiers, keeps the clinical content (drugs, doses, labs, diagnoses), and tells you what it could not decide. Every result is one of three things:

- **clean**: every check this profile runs read the whole input and found nothing left to decide. This is not proof that no identifier remains: on the blind set, 8 of the 12 documents marked clean still held one. The result lists what was read, which checks ran, and the known gaps no check can see.
- **review**: some spans could not be decided (a word that could be a name or a term, a number that looks like a scan error, a script the rules do not read). The send guard refuses the result until a person has looked.
- **blocked**: something failed or could not be read. The output is `[redaction-blocked]` and nothing is sent.

![The redaction inspector with a synthetic visit note: identifiers replaced by typed tokens, clinical words kept, and the scan report under the output](docs/media/demo-1440.png)

**This is not validated de-identification.** It is a public demonstration built and tested on synthetic text and on public case reports with fictional identifiers planted in them. No real patient data was used. Do not use it as the only control for protected health information.

## Where the evidence stands

**Held-out result, 3 November 2026.** On a blind set of 132 synthetic clinical documents written and labeled by other model families, the gate left 12 of 2,577 identifier mentions (0.5%) in documents it marked clean. Microsoft Presidio, run offline on the same documents with its default English recognizers, left 701 (27.2%) in the text it returned. The gate gets there by asking for a person: it sent 120 of the 132 documents (91%) to review, including 26 of the 28 documents with no identifier at all, and 29 of those 120 reviews had nothing left to find. Clean is not a guarantee either: 8 of the 12 documents it marked clean still held an identifier.

Set hash `2d2011ff449da01bb3200b5f2832cb40faa70323cc85a5f97a79446dd4f71055`, gate commit `30b6061` (its `src/` is unchanged since `e328c73`), scorer commit `047c193`. Identifiers profile, run once. The full report, with every engine and every type, is [fresh-test/v1/results/scored-2d2011ff449da01b.md](fresh-test/v1/results/scored-2d2011ff449da01b.md).

| Blind set v1 | Gate, empty people map | Gate, people map from the header block | Presidio |
|---|---|---|---|
| Identifier mentions left in documents marked clean | 12 of 2,577 (0.5%, 0.3% to 0.8%) | 11 of 2,577 (0.4%, 0.2% to 0.8%) | 701 of 2,577 (27.2%, 25.5% to 29.0%) |
| Documents marked clean that still hold an identifier | 8 of 12 | 7 of 12 | 101 of 132 |
| Identifier mentions fully removed | 2,037 of 2,577 (79.0%, 77.4% to 80.6%) | 2,053 of 2,577 (79.7%, 78.1% to 81.2%) | 1,876 of 2,577 (72.8%, 71.0% to 74.5%) |
| Clinical spans (KEEP) intact | 9,142 of 9,198 (99.4%) | 9,142 of 9,198 (99.4%) | 8,445 of 9,198 (91.8%) |
| Ages under 90 and bare years kept | 198 of 198 | 198 of 198 | 13 of 198 |
| Letters and digits removed outside identifiers | 1,184 of 391,855 (0.3%) | 1,184 of 391,855 (0.3%) | 15,471 of 391,855 (3.9%) |
| Documents sent to review | 120 of 132 (90.9%, 84.8% to 94.7%) | 120 of 132 | no review status |
| Review documents with nothing left to find | 29 of 120 | 29 of 120 | |
| Documents blocked | 0 of 132 | 0 of 132 | 0 of 132 |

Ranges are Wilson 95% intervals. Presidio has no review status, so everything it returns counts as sent.

Where the gate falls short:

- Presidio fully removes more clinician names (530 of 595, 89.1%, against 473, 79.5%) and relatives' names (264 of 298 against 249). Every clinician name the gate left was in a document marked review.
- The gate fully removed 118 of 212 facility names (55.7%) and 157 of 231 record and plan numbers (68.0%). Most of the rest were in documents marked review.
- Review means reading the whole document. Of the 528 identifier mentions left in review documents, 234 had no review span on them.
- The 12 silent leaks: three dates written out in words in one call transcript, three facility names, two lowercase names, a sister's surname that is also an eponym ("Marfan"), the particle of a removed surname ("van"), an age written against a sex letter ("94F") and an account number written in groups of digits.

The set was written by Grok 4.7 (67 documents) and Gemini 3.8 Flash (65), labeled by both independently, and every disagreement went to GPT 6.1 Sol. Before adjudication the two labelers agreed on identifier spans at F1 0.99 and on keep spans at 0.85. The Claude agents that wrote the gate's rules never saw the documents or the labels, and the scorer was fixed before the lock. A pharmacist's review of 30 keep spans the labelers marked uncertain runs after the lock: labels are never edited, any change goes to an errata file, and the score is then published both ways ([lock note](fresh-test/v1/LOCK-NOTE.md)).

This is one run on one synthetic set. Any later run on it is a regression check on development data ([docs/fresh-test-spec.md](docs/fresh-test-spec.md), section 6), and a rule changed because of it needs a new blind set before the next headline.

### Development results (not quoted)

No set in this table was written blind and locked before its first run. They are kept so the work can be checked, not as results to cite.

| Test set | What it is | Development result | Why it is not a quoted result |
|---|---|---|---|
| Real public case reports, 9 documents, 38 planted fictional identifiers ([PR 4](https://github.com/kvmadden/pii-redaction-gate/pull/4)) | Open-access case reports with identifiers planted by a program | main before this work: 20 of 38 removed, an identifier left in 9 of 9 documents. This branch: 35 of 38 removed, an identifier left in 2 of 9 documents, both marked for review | The planted values and the failure list are public, and this branch's rules were changed while its misses were read |
| 182 synthetic snippets, 207 labeled identifiers | Written with the first release | This branch: 184 of 207. 184 of 195 without the 12 ages under 90 the policy keeps | Rules were changed while looking at it |
| 27-template development check | 27 identifier templates written 4 times each, plus 6 clinical sentences | This branch: 26 of 27 templates. The one miss is the title in "Dr. Emrys Calder", which is kept on purpose | Its vocabulary was added to a protected word list after it was committed, so it was never held out |

Earlier versions of this README and its case page reported **104 of 108 (96.3%)** on a "held-out" set. That set is the 27-template development check above. Its 108 rows are 27 templates written four times, and its own words (Jardiance, Rheumatoid, Arthritis, Telephone, Portal and others) were added to the name tier's protected list after it was frozen. The figure is withdrawn.

## Try it

```bash
# Library
node --input-type=module -e "
import { redactText, assertSendable } from './src/index.js'
const r = redactText('Patient Inez Thorn, DOB 03/04/1961, seen at Riverside Clinic. Continue metformin 500 mg BID.', { source: 'clinical-note' })
console.log(r.text, r.status, r.review)
"

# Command line: exit 0 clean, 3 needs review, 2 blocked, 1 usage error
printf 'Patient Inez Thorn, MRN 4471023. Continue metformin.\n' | node bin/redaction-gate.js --source clinical-note

# Browser demo, local only
npm run demo   # then open the local address it prints
```

No install step and no dependencies with Node 22 or later. Nothing is sent over the network.

In the demo, pick a fictional note, compare the original spans with the redacted text, and read the scan report under the output: characters read, checks run, checks this profile skips, and each span that needs review with its reason. The simulated send passes a clean result, refuses a review result until "Mark as reviewed" is pressed for that exact revision, and refuses a blocked one. The failure toggle makes the engine fail at the pattern stage to show the blocked path.

## How it decides

The text runs through up to three tiers, then a residual scan reads the output again.

1. **Patterns.** Email, SSN (dashed, spaced, dotted or labeled), dates of birth, Luhn-checked cards, phones (including international and Unicode dash forms), street addresses, city with state and ZIP, coordinates. Under the clinical profiles also URLs, validated IPv4 and IPv6, MAC addresses, labeled record and plan numbers, dates in numeric, ISO, month-name and ordinal forms, and ages over 89. Dates must be real calendar dates, so "2026-02-31" and "March 99" stay, and "2/3 weeks", "3/4 strength", "March 5 mg" and a prednisone taper stay. ASCII and fullwidth digits are read. Other digit scripts go to review. Inputs over 2,000,000 characters block, and a caller can lower that cap but not raise it.
2. **Names.** Known names from an optional people map become role tokens (`[patient]`), matched with or without accents. Then a token classifier decides each word from evidence: titles, person labels ("Patient:", "Name:"), relation words, greetings and sign-offs, facility types, initials, eponyms before a clinical head noun ("Bell palsy"), first plus last name pairs, heading runs, and finally the word's class, case and position. A title or a person label outranks every word list: a word after "Dr." that the lists call clinical goes to review instead of being cleared. Bracketed words in the input are read as text, never trusted as redactions. When the evidence conflicts, the word goes to review.
3. **Topics** (standard and strict profiles only). Removes whole sentences about sensitive personal topics.
4. **Residual scan.** Undecided or name-shaped words, unlabeled long numbers and letter-digit codes, digits mixed with O, I or l, birth years without a reference date, scripts and digits the rules do not read, Greek words, invisible format characters, obfuscated email, person fields not fully redacted, names spelled one letter at a time ("D-E-L-G-A-D-O"), card-shaped numbers that failed the card check, local phone numbers with no calling word, ages over 89 the rules missed, tokens that run into more characters ("[url]aaaa"), and bracketed words that look like tokens. Each becomes a review item with offsets into the output.

The name tier's vocabulary is not hand-picked. It is built by [scripts/build-lexicon.mjs](scripts/build-lexicon.mjs) from public-domain sources, each pinned by SHA-256 in [data/lexicon/manifest.json](data/lexicon/manifest.json): US Census 2010 surnames and 1990 first names, Drugs@FDA product names and ingredients, CMS ICD-10-CM 2025 descriptions, and Webster's Second International word list. A test checks that the words the old list took from the template set (Jardiance, Rheumatoid, Arthritis, Portal, Telephone) and the template names do not appear in the name-tier source, and that the public lists still classify those words.

## Profiles and sources

| Profile | Tiers | Used for |
|---|---|---|
| `identifiers` (default) | patterns with clinical rules, names with the unknown-name pass, residual scan | clinical notes, discharge summaries, referral letters, patient messages, call and voice transcripts |
| `strict` | all of the above plus topic sentences | personal email and SMS, where the topic itself is sensitive |
| `standard` | basic patterns, known names, topic sentences | general free text, support tickets, chat exports |
| `light` | basic patterns only, code spans exempt and reported as not read | source code, build logs, commit messages |

A source id that is not registered in `src/profiles.js` blocks. A typo such as `clinical_note` used to select `standard` silently and return a note unchanged. To accept unknown sources on purpose, pass `{ unknownSource: 'identifiers' }`.

## Using it in a pipeline

```js
import { gateParsedTranscript, gateSummary, sendRedacted, describeGate, assertSendable } from './src/gate.js'

// One call: redact, check, then call your sink with the frozen, checked record only.
sendRedacted({ parsed: record, source: 'clinical-note', sink: (payload) => writeRow(payload) })

// Or step by step. Each helper returns a NEW sealed gate.
const gate = gateParsedTranscript({ parsed: record, source: 'clinical-note' })
const withSummary = gateSummary(modelOutput, gate, 'clinical-note')
console.log(describeGate(withSummary))  // says what was checked, never just "clean"
assertSendable(withSummary)             // throws on blocked, and on review unless { acceptReview: true }
```

- Results are sealed and frozen inside the engine, which does not export its sealing function. `assertSendable` accepts only those results, so a hand-built `{ blocked: false }`, a spread copy, or the raw record is refused, and nothing in a result can change after the check. `gateSummary` and `gateBodyText` return a new gate instead of changing the old one.
- Every string and every number in a record is read, wherever it sits. A number is read with its key as a label, so `{ mrn: 4471023 }` and `{ age: 96 }` block. A Map comes back as an array of `[key, value]` pairs and a Set as an array. A declared text field of the wrong type, a value the code cannot read (a Date, a Buffer, a class instance, an array with its own methods), a cycle, nesting deeper than 32, more than 200,000 values, an array longer than 100,000, an object used as a Map key, or a key the rules would change or flag blocks the record. Record and gate results carry the same scan report as text results.
- Originals are kept only on the non-enumerable `changes` list, for the optional local quarantine sidecar. That file is plain JSON with mode 0600, written only into real directories (not symlinks) that the operator owns with no group or other access. It is not encrypted and has no retention limit.
- Put your own facility, clinician and patient names in the people map (`REDACTION_PEOPLE_PATH`). That is how a "needs review" facility becomes a deterministic removal next time. Use `loadPeopleMap({ required: true })` or `requirePeopleMap: true` to block when the map cannot be read.
- Pass `referenceDate` so birth years can be judged against the 89-year limit. Without it a birth year goes to review.

## Development evidence in detail

Development data, not quoted results. All engines run with the identifiers profile and an empty people map. Full removal means every labeled letter and digit is gone. [eval/comparison.md](eval/comparison.md) lists every miss and every false positive.

**182 development snippets** (85 clinical, 35 message, 22 general, 40 negative), 207 labeled identifiers and 227 labeled clinical phrases:

| Measure | First release `91c4e16` | main before this branch `facae00` | This branch |
|---|---|---|---|
| Identifiers fully removed | 146 of 207 (70.5%) | 187 of 207 (90.3%) | 184 of 207 (88.9%) |
| Clinical phrases kept intact | 200 of 227 (88.1%) | 223 of 227 (98.2%) | 226 of 227 (99.6%) |
| Removed spans that overlap a labeled identifier | 157 of 190 (82.6%) | 196 of 202 (97.0%) | 185 of 186 (99.5%) |
| Snippets with an identifier left | 55 of 118 | 19 of 118 | 23 of 118 |
| Of those, marked for review | no status | no status | 10 of 23 |
| Of those, marked clean | no status | no status | 13 of 23: 12 ages under 90 and one unlabeled group number |

Recall fell from 187 to 184 because ten facility names made of ordinary words ("Lakeside Clinic", "Valley Birth Center") now go to review instead of being removed. That trade is deliberate. The rule that removed them also turned "Past Medical History" into "[name] History" and "Outside Hospital" into "[name]", which this set never tested.

**27-template development check** (`eval/heldout.json`, a historical file name): 7 of 27 templates for the first release, 26 of 27 for main, 26 of 27 for this branch. All 6 clinical sentences are kept by this branch. The labels count the unlabeled ZIP in one template as a false positive and the title "Dr." as part of a name. Neither label was changed.

**Real public text** (PR 4, not merged here): PR 4's result for the untuned gate is 20 of 38 planted identifiers in its 9 held-back documents, with at least one left in every document. This branch removes 35 of 38 there and leaves an identifier in 2 of 9 documents, both marked for review. Both are development results: the planted values and the failure list are public. PR 4's own rule changes (its version 2) are not merged, because they made names inferred from one sentence safe across the whole document ("morphine (Alice)" kept Alice everywhere, "internal medicine (Kaplan)" kept "Mr. Kaplan").

**Speed.** Linear in input length on every shape the performance test covers (realistic notes, repeated "a.", "a@", "1-", "Dr. ", "Aa ", "1/", "x", "A. ", "A.B. ", "d-e-" and "[x]"). About 4 seconds per megabyte of realistic note text on an Apple M-series laptop, and the old 17-second email case on 100 KB takes about one second. `test/perf.test.js` fails if eight times the input takes more than twenty times as long. A chain of initials with no surname ("A. A. A.") was quadratic until the second review round. Other shapes are not proven linear.

## Blind-set scorer

`eval/fresh/score.mjs` scored the blind set once, fixed before the set was locked. The result is under [Where the evidence stands](#where-the-evidence-stands).

**Status:** locked on 2026-11-03 (`30b6061`), set hash `2d2011ff449da01bb3200b5f2832cb40faa70323cc85a5f97a79446dd4f71055`, scorer `047c193`, scored once the same day (`a8bea3e`, files in [fresh-test/v1/results](fresh-test/v1/results)). Any later run on this set is a regression check on development data. The set is in [fresh-test/v1](fresh-test/v1). Its [lock note](fresh-test/v1/LOCK-NOTE.md) says who wrote and labeled it and names the one deviation from the spec.

| | |
|---|---|
| Scorer commit | `047c19326ad0fcd570c55bc480ccd6878c350829` |
| Scorer content hash | `ddd1cfa5d2e8714c87ec25d8f6ac5add2ada974079f6a633f29af767d9218815`, SHA-256 over `eval/fresh/*.mjs` and `*.py`, recorded in [eval/fresh/scorer-lock.json](eval/fresh/scorer-lock.json) |
| Header-block rule | `eval/fresh/header-map.mjs` version 1, SHA-256 `5f54134d682a690966cefa749fc6e78d4b6ddc0c33fd6204f6431f6e3ff2116e`, frozen by a test |
| External baseline | presidio-analyzer 2.2.360, presidio-anonymizer 2.2.360, spaCy 3.8.7, en_core_web_lg 3.8.0, Python 3.9.6 |

It runs five engines on the same documents and scores them on the same measures:

- **gate-empty**: this gate, identifiers profile, empty people map.
- **gate-header**: this gate, identifiers profile, with a people map built from each document's header block (the lines before the first blank line, person fields only).
- **do-nothing** and **remove-every-word**: the two ends of the trade. One sends the text unchanged, the other replaces every word.
- **presidio**: Microsoft Presidio with its default English recognizers and no score threshold, run offline.

Each measure is a count of a denominator with a Wilson 95% interval, overall, by identifier type and by document kind: silent leaks (identifier mentions left in documents marked clean, and the share of clean documents that still hold one), full removal (every letter and digit gone), mentions left in documents marked review, the share of documents sent to review and the share of those with nothing left to find, clinical spans kept intact, documents blocked, and letters and digits removed outside identifier spans. The report lists every measure where a gate configuration is below another engine.

It refuses a document whose SHA-256 differs from `labels.jsonl` or the manifest, a set hash that does not match, an unlisted document, a span out of bounds or of an unknown type, and span offsets that look counted in another unit or on different text. It refuses a scored run that could not stand as the one result: a second scored run, a run without every engine or without Presidio, a scorer that does not match the lock, or uncommitted changes in `src` or `eval/fresh`.

```bash
node eval/fresh/score.mjs <set> --check     # verify the set and print counts, runs no engine
node eval/fresh/score.mjs <set> --out <dir> --presidio-python <presidio venv>/bin/python
```

Presidio is installed outside this repository, in a virtual environment written `<presidio venv>` above, from [eval/fresh/presidio-requirements.txt](eval/fresh/presidio-requirements.txt) and runs under macOS `sandbox-exec` with all network access denied. Its email recognizer uses the public-suffix list bundled with tldextract instead of fetching one. The scorer is tested on a 13-document synthetic fixture with known answers ([test/fixtures/fresh-sample](test/fixtures/fresh-sample), [test/fresh-score.test.js](test/fresh-score.test.js)). A run on a fixture is labeled a sample, never a result.

## Limits

- Rules, not a model. English and US formats. Transcribed text only: no OCR, images, PDFs or attachments.
- Known gaps, listed in every clean or review result as `scan.knownGaps`: a lowercase name that is also an ordinary word ("grace", "will") unless a title, relation word, greeting or person verb marks it, a lowercase name on no list or with a rare surname unless a person verb follows it, a short all-capitals name of five letters or fewer on no name list (read as an acronym), a facility named with a clinical word, a name made of two English words joined together, ages under 90 (kept on purpose), unlabeled numbers under 7 digits and codes under 6 characters, identifiers spelled out in words or split across lines, and descriptions that identify a person without naming them.
- The English list is from 1934, so modern words such as "fax" and "email" are unknown words. At a sentence start they go to review.
- Review volume is the cost. On the blind set 120 of 132 documents (91%) went to review, including 26 of the 28 with no identifier, and 29 of the 120 had nothing left to find. On development data, 18 of 182 snippets and 5 of 9 real documents needed review. Causes seen on the blind set: clinical words the vocabulary lacks ("Normocephalic", "NT-proBNP", "HFrEF"), a drug that is also a first name even before a dose ("Allegra 180 mg"), credentials the lists lack ("PharmD", "RPh"), service names ("referral to Pain Clinic", "Wound Care"), and the words that open turns in call transcripts ("Okay", "Uh"). Causes seen in development: facility names made of ordinary words, words missing from the 1934 list at a sentence start, a capitalized ordinary-word surname mid-sentence ("The White count"), an eponym with no head noun ("History of Parkinson."), a common surname in lowercase ("foley in place"), and a longer lab name before a bare number ("Ferritin 12"). It has not been measured on real clinical workloads, and neither has reviewer time.
- A review is a whole-document read. On the blind set, 234 of the 528 identifier mentions left in review documents had no review span on them, and some documents were in review only because of an unrelated word.
- Microsoft Presidio has been run only on the blind set, not on the development sets.
- Structure is lost: tokens replace values, with no consistent surrogates and no date shifting.
- The quarantine sidecar holds originals in plain text.

## Development

```bash
npm test                      # 270 tests, about 15 seconds
npm run check                 # committed comparison matches the engine, lexicon matches its hash
node eval/compare.js          # print the development comparison for this tree
node eval/run.js              # print per-profile results on the development snippets
node scripts/build-demo.js    # copy the runtime modules into docs/runtime (checked by test)
```

To regenerate the comparison with the baselines, export each commit's `src` to a folder outside the tree, written `<export>` here (for example `git archive 91c4e16 src | tar -x -C <export>/91c4e16`, plus a `package.json` with `"type": "module"`) and run `node eval/compare.js --write --engine release=91c4e16=<export>/91c4e16/src/engine.js --engine previous=facae00=<export>/facae00/src/engine.js`.

Rebuilding the lexicon needs the six source files listed in the manifest. The script refuses any file whose SHA-256 differs from the pinned value. CI runs the tests and both checks on Node 22 and 24.

## History and license

Built in June 2026 as a privacy gate for a private knowledge system and published in October as a standalone snapshot. The [first release README](docs/published-readme.md) and the [verification records](docs/evidence/) are kept as records, with corrections at the top where their claims no longer hold. This version replaces the hand-picked clinical word list with public vocabularies, adds the review status, the scan report, the sealed send guard and the command line, and relabels both synthetic sets as development data.

MIT. Copyright 2026 Kevin Madden. All fixtures are fictional or synthetic.
