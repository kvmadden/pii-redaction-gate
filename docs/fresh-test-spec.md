# Fresh blind test set: specification

This set will give the gate its first headline number. Every number published so far comes from development data: sets whose failures were read while the rules changed. This page says what the new set must contain, how it is labeled, how it is locked and how it is scored. It is a spec only. Nothing here has been written or run.

## 1. Independence

- The documents and labels are written by model families that did not write the gate's rules. Two families write documents. A third family, or Kevin, adjudicates labels.
- Authors receive this spec and nothing else from this repository. They do not read the source, the tests, the evaluation sets, the README, the PR history or the published case page.
- Authors do not run the gate, and nobody runs the gate on any part of the set before it is locked.
- After its single scored run the set is development data. Any rule change made after seeing its results needs another fresh set before a new headline is claimed.

## 2. What the set contains

**Size.** At least 100 documents and at least 600 labeled identifier mentions, with at least 60 mentions each for names, dates, record and plan numbers, phone and fax numbers, and addresses. That gives a 95% interval of roughly 4 points on recall near 90% overall and about 8 points per type. At least 20 of the documents contain no identifier at all.

**Documents, not snippets.** Each document is 150 to 1,500 words and reads like the real thing, with headers, footers, signature blocks, lists, plain-text tables, line wrapping and the occasional typo. The mix:

| Kind | Share |
|---|---|
| Progress notes and history and physical notes | 20% |
| Discharge summaries and referral letters | 15% |
| Patient portal messages and replies, including lowercase and texting style | 15% |
| Call and voice transcripts with disfluencies and speaker labels | 15% |
| Pharmacy notes: refill calls, prior authorization requests transcribed from fax, medication reconciliation | 15% |
| Lab, imaging and pathology reports with demographic headers | 10% |
| Emails and administrative letters about care | 10% |

**Identifiers to include**, with each kind in several written forms:

- Names of patients, relatives, clinicians and staff. At least 30% of names from outside Anglo naming traditions, with accents, hyphens, apostrophes, particles (de la, van, bin) and multi-part surnames. Names written LAST, FIRST, in ALL CAPS, in lowercase, as initials ("T.G."), with a middle initial, with a title, possessive, inside lists, and split across a line break.
- Names that are ordinary words or clinical words: at least 25 mentions across Grace, Hope, Will, Faith, Rose, Bell, Price, Long, Young, Brown, Gold, Short, King, Wilson, Graves, Parkinson and similar. Do not avoid names because they collide with drug, diagnosis or ordinary words. A set that drops them measures the easy case.
- Facility names of three kinds: proper names (Mayo Clinic), ordinary words (Riverside Clinic, Lakeside Pediatrics) and clinical words (Valley Hospital, Pain Clinic as a named practice).
- Dates in every form: numeric with slashes, dashes and dots, ISO, month names, abbreviations with and without periods, ordinals, day first, "the 4th of July", month and year only, dates of birth, and dates inside headers.
- Ages over 89 in labeled, hyphenated ("104-year-old"), "y.o.", spelled-out and shorthand ("92F") forms. Include ages under 90 too. They are labeled as not identifiers (see section 3).
- Record, plan, member, account, claim, prescription, license, device and vehicle numbers, labeled and unlabeled, with spaces or dashes between groups, and a few with scan errors (O for 0, l for 1).
- Phone and fax numbers with extensions, international forms and Unicode dashes. Email addresses, including a few written to avoid detection ("name at domain dot com"). Street addresses in Title Case, lowercase and ALL CAPS, with unit numbers, PO boxes, and city, state and ZIP. URLs and IP addresses, some at the end of a sentence.

**Clinical content that must survive**, labeled as keep spans: brand and generic drug names (including brands that look like names), doses, routes and frequencies, labs and vitals, diagnoses, eponymous diseases, scores and signs (Bell palsy, Wells score, Glasgow Coma Scale, Apgar, Gleason, Tanner stage), section headers (Past Medical History), service names (Pain Clinic, Diabetes Center as a service), "Outside Hospital", procedure names, and fractions and tapers ("2/3 weeks", "40/30/20/10 mg").

**Never include** real patient data, real people's identifiers, real phone numbers outside 555-0100 to 555-0199, email domains other than example.com, example.org and example.net, or any value, template or sentence from this repository or its pull requests.

## 3. Labels

Each document gets a JSON line: `{ id, kind, text_sha256, spans: [{ start, end, type, policy }] }`, with character offsets into the UTF-8 text. A character is a Unicode code point, so an emoji counts as one (Python string indices work as written). `text_sha256` is the SHA-256 of the document file's bytes. `id` is the file name without `.txt`, using letters, digits, dots, hyphens and underscores. A manifest may declare `"offset_unit": "utf16"` or `"byte"` instead of code points. The scorer reads every span in all three units and refuses a set whose spans fit another unit better than the declared one, or whose spans split a word or a character too often to be right (more than a tenth of them, and at least five).

- `type`: NAME, RELATIVE, CLINICIAN, FACILITY, DATE, DOB, AGE, PHONE, FAX, EMAIL, ADDRESS, ID, URL, IP, DEVICE, VEHICLE, or KEEP for clinical content that must survive.
- `policy`: `identifier` or `not-identifier`. The policy is fixed here, once, for every document:
  - All person names are identifiers, including clinicians and staff.
  - All named facilities are identifiers.
  - Ages over 89 are identifiers. Ages under 90 and years on their own are not.
  - Titles (Dr., Mrs.) and a possessive 's are not part of a name span.
  - Dates of service, admission and discharge are identifiers, as under HIPAA Safe Harbor.

Two labelers from different families label every document independently. A third labeler adjudicates every disagreement. Report agreement by type (span-level F1 between the two labelers) with the results. A pharmacist (Kevin) reviews the keep spans on a random 25% of documents.

Labels are never edited after the lock. Errors found after scoring go into an errata file, and the scores are published both ways.

## 4. Lock

1. Layout: `fresh-test/v1/documents/<id>.txt`, `fresh-test/v1/labels.jsonl`, `fresh-test/v1/manifest.json`. The manifest lists each file's SHA-256, a SHA-256 over the sorted list of file hashes, the authoring families, the labeling families, dates, and the prompts used to write and label. The scorer reads `files` (an object of relative path to SHA-256, covering `labels.jsonl` and every document) and `set_sha256` (the SHA-256 of the sorted lowercase file hashes joined by newlines). `node eval/fresh/make-manifest.mjs <set-dir>` writes exactly this shape. Before the lock, `node eval/fresh/score.mjs <set-dir> --check` verifies the hashes, the labels and the offsets, prints counts by kind, type and policy, and runs no engine.
2. The scorer is fixed before the lock: `eval/fresh/score.mjs` and the files beside it, at scorer commit `047c19326ad0fcd570c55bc480ccd6878c350829`, content hash `ddd1cfa5d2e8714c87ec25d8f6ac5add2ada974079f6a633f29af767d9218815` (recorded in `eval/fresh/scorer-lock.json`). Record both in the manifest. Every report states whether the scorer that ran matches this content hash.
3. Commit the set and manifest, and publish the set hash in that commit's message and in the README, before any gate run.
4. Run the gate once in each of two configurations declared here in advance, at a named commit: the identifiers profile with an empty people map, and the identifiers profile with a people map built from each document's header block. The header-block rule is `eval/fresh/header-map.mjs`, version 1, SHA-256 `5f54134d682a690966cefa749fc6e78d4b6ddc0c33fd6204f6431f6e3ff2116e`, frozen by a test. Publish both outputs, whatever they are.
5. The command for the single scored run: `node eval/fresh/score.mjs fresh-test/v1 --out <dir> --presidio-python ~/dev/toolchains/presidio/venv/bin/python`. It refuses a set whose hashes, labels or offsets do not check out. It refuses a scored run that could not stand as the one result: a second scored run of the set in the same output folder, a run that leaves out an engine or has no Presidio outputs, a scorer whose content hash differs from the lock, or uncommitted changes in `src` or `eval/fresh`. A later run must say `--regression-check`, and its report calls it development data.

## 5. Scoring, run once

Report each of these with counts, denominators and Wilson 95% intervals, overall and by type and document kind:

- **Silent leaks**: identifier mentions left in documents the gate marked `clean`, and the share of `clean` documents that still hold any identifier. This is the number that matters most.
- **Full removal**: identifier mentions with every letter and digit removed.
- **Caught by review**: identifier mentions left in documents marked `review`.
- **Review burden**: share of documents marked `review`, and the share of those with nothing left to find.
- **Clinical preservation**: keep spans left intact.
- **Blocked**: documents the gate blocked.

Run the same set, with the same scorer, through a do-nothing gate, a remove-every-word gate, and at least one external tool run offline (Microsoft Presidio with its default English recognizers, Philter, or the PhysioNet deid tool). Publish all of them side by side, including any result where this gate is below a baseline.

The external tool is Microsoft Presidio: presidio-analyzer 2.2.360 and presidio-anonymizer 2.2.360 with spaCy 3.8.7 and en_core_web_lg 3.8.0 on Python 3.9.6, default English recognizers, no score threshold. It is installed outside the repository (`eval/fresh/presidio-requirements.txt`) and runs with all network access denied. Its email check uses the public-suffix list bundled with tldextract instead of fetching one. Engines with no status (Presidio and the two bounds) count as `clean`, since what they return is what would be sent.

Every mention rate counts the mentions in documents that were sent. Mentions in blocked documents are reported as withheld, counted as neither removed nor left. The scorer also reports letters and digits removed outside identifier spans. An output that cannot be aligned to its input is scored by text search after folding case, width and accents: a span is missed when its text is still in the output, partial when any word of it is, and removed only when neither is true. The number of documents scored that way is in the report.

## 6. What the result may be called

- The single scored run may be called a held-out result, with the set hash, the gate commit and the scorer commit next to it.
- Any later run on the same set is a regression check on development data.
