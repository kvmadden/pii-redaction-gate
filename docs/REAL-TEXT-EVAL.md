# Testing redaction on real public text (v3)

Shared spec for pii-redaction-gate (job 35) and clinical-evidence-map (job 34). Written by Claude on the M1, 11/1. v2 folds in the Codex review in review-real-text-codex.md. Keep the build small and inspectable. This is a portfolio evaluation, not a compliance study, and it says so.

## The problem

Public clinical text usually has direct identifiers removed or generalized before publication, but publication does not make it HIPAA de-identified, and some identifying details survive. Two things follow. Running the gate on real text and reporting "100% removed" would be meaningless, because there are few or no gold identifiers to find (recall with no gold spans is reported as N/A, never 100%). And we audit what real text still contains instead of assuming it is clean. Case reports also read differently from routine chart notes, so no result here is claimed as performance on real patient charts.

## Three questions, three test sets, shown side by side

| Set | Question | Data | Primary result | Limit stated next to it |
|---|---|---|---|---|
| A | Does it catch identifiers? | Frozen synthetic held-out notes (already in the repo), plus Synthea text if used | Recall, precision, F1 per identifier type | Synthetic text is cleaner than real notes |
| B | Does it catch identifiers inside real clinical language? | Real public narratives with fictional identifiers planted in | Planted-span recall per type and challenge group | Planted by a program, not written by a clinician |
| C | Does it leave the clinical meaning alone? | Real public narratives, untouched | Over-redaction rate and extraction score before and after redaction | Small hand-labeled pilot set |

All three are shown as equal panels. Never pool them into one number.

## Coverage matrix

The README lists the 18 HIPAA Safe Harbor categories (names, geography smaller than a state, dates and ages over 89, phone, fax, email, SSN, MRN, health plan number, account number, license number, vehicle ID, device ID, URL, IP address, biometrics, photos, other unique codes) with tested or untested for each set. Untested categories say untested, never passed. Identifiers of relatives and employers count. The policy on clinician and hospital names is stated once.

## Splitting so nothing leaks

Split by source document before any tuning. A document and every version of it (clean, planted, OCR) lives in exactly one partition, dev or test, across both B and C. VAERS initial and follow-up reports of the same case stay together. Format families and identifier values are also split. The gate may be tuned only on dev. Results are reported on test.

## Set B: planting, done so it is not rigged

1. **Place identifiers where a chart would have them**, and also in the hard places: headers, footers, signatures, tables, family references, initials, surname-only mentions, possessives, and identifiers broken across lines. Do not change clinical facts or the timeline. Record every replacement.
2. **Many formats and hard cases.** Dates as 03/04/2025, 3-4-25, March 4th, 4 Mar 2025. Phones with and without extensions. Varied MRN shapes. Names from many origins, with hyphens and apostrophes, and names that are also everyday words. Matched hard negatives with the same surface form, for example patient Bell versus Bell's palsy.
3. **Fake values.** Generated, realistic-looking and random. Reserved values (555-01xx, example.com) may be used in a minority, and the gate is barred from knowing them (see below). We never claim a generated value cannot match a real person, and none is ever linked to real health information.
4. **Honest framing of the test.** The generator, seed and answer key are committed before the final run and the results file records their commit. Because the key is public, the README calls this a fixed public benchmark, not a blind test.
5. **The gate never sees test metadata.** Planted markers, gold spans, source labels and partition IDs are added to the inspector only after prediction. A test asserts that changing them does not change predictions.
6. **Planted marker in the UI** so a viewer can see exactly what was added and what the gate did.

## The gate must not be able to tell what was planted

Kevin's rule: the way identifiers get put in must not give them away to the engine. If planted text looks different from the text around it, the gate can score well by spotting the edit instead of the identifier, and the test is fake. So:

1. **One pipeline for every document.** Planted, unplanted and synthetic documents all go through the same final step: same encoding, Unicode normalization, line endings, whitespace and file format. No byte-level or spacing difference marks an edited document. Test: after this step, a diff of a planted document against its original shows changes only inside the planted spans.
2. **Edits match the writing around them.** Match case, articles, pronouns, punctuation and the document's own conventions (a UK journal gets UK date order, a VAERS report stays in its terse style). No doubled spaces, stray brackets, or capitalization that breaks the sentence. No reused template sentences across documents.
3. **No repeating values or patterns.** Large name and value pools, no value used twice across the corpus, formats chosen per document rather than cycling in a fixed order, and a realistic number of identifiers per document (some get one, some get several).
4. **Unplanted documents mixed in.** The real-text run mixes planted and untouched documents with random IDs, in shuffled order, through one call. Being in the run says nothing about whether a document has identifiers.
5. **The gate cannot know the generator.** Gate code, rules, word lists and config may not contain anything from the generator (its name pools, value ranges, reserved numbers like 555-01xx, example.com, or seeds). A test greps for these and fails if found. A swap test reruns Set B with every planted value replaced by a fresh random value of the same type and format: the scores must match within noise, which proves the gate is reading context and format, not memorized values.
6. **Indistinguishability check, automatic.** Mask the identifier itself, then train a simple classifier (character n-grams, logistic regression) to tell sentence windows around planted spans from matched windows of untouched text. Report its accuracy on held-out windows. Near 50 percent means the edits leave no trace. Clearly above that means fix the planting before scoring.
7. **Indistinguishability check, human.** Kevin is shown 20 sentences without labels, half edited and half untouched, and guesses which were edited. The hit rate is reported. This doubles as a good demo moment.
8. **Gate frozen before Set B is scored.** Any change after seeing Set B results makes that version a regression check, and the README says so.
9. **Known limit.** If any step uses a language model, it may have read the original public article during training and could notice a name that was never there. This is stated as a limit and the rule-based path is reported on its own.

## Scoring

- Per type: true positives, false positives, misses, support, precision, recall, F1, using one frozen span-matching rule.
- **Fully removed** means every character of the identifier is gone from the output. Partial leaks are counted, and we report the share of documents with any identifier left behind. Any-overlap matching is shown only as a diagnostic.
- Set B scores planted spans only, so it reports planted-span recall and does not call other detections false positives.
- Two sanity controls on identical inputs: a do-nothing gate (privacy score should collapse) and a redact-everything gate (utility score should collapse). This proves the metrics catch both failures.
- Counts always shown with their denominators. Small categories are shown as counts, not percentages. A simple document-level bootstrap interval for the main numbers. Zero misses is never presented as zero risk.

## Set C: the untouched real text

Clinical writing is full of things that look like identifiers and are not: eponyms (Parkinson's, Bell's palsy, Graves' disease), drug and brand names, doses and readings that look like dates (5/325 mg, BP 140/90), lab values (INR 2.5, A1c 7.2), states and countries. The age rules have edge cases: exact ages 89 and under can stay, 90 and over must be generalized to "90 or older", and a date that reveals an age over 89 counts too.

- **Over-redaction**: on 20 to 30 hand-labeled documents with keep and remove spans, report removed keep-tokens divided by all keep-tokens, with both numbers shown. Removal the policy requires is not an error, but its utility cost is shown separately.
- **Extraction utility**: medications, doses, units, routes, frequencies and diagnoses (with negation) are labeled in the same documents. The same extractor is scored against those labels on the original and on the redacted text, and both scores are published. Agreement between the two runs is not a quality score and is never presented as one. Every extracted fact must point to a span in the actual input.
- **Identifiers the source left in**: labeled separately from planted spans. Nothing is ever looked up to re-identify anyone. Any document with a likely real direct identifier is excluded from the public corpus and noted in an exclusion list that does not repeat the identifier.

## Labels

AI-proposed labels are drafts. Kevin reviews them as the pharmacist on the project, and every metric built on unreviewed labels is marked "draft, pending pharmacist review". Disagreements Kevin makes with the drafts are logged. A second independent reviewer would strengthen it, and the README says this is not yet done.

## OCR (clinical-evidence-map only)

Report clean-text redaction separately from scan-to-OCR-to-redaction. For the scan condition, plant identifiers before rendering the fax image, with skew, compression, low contrast, headers and tables, so OCR errors are part of the test. Count identifiers that OCR garbled and the gate then missed. Check that identifiers do not leak through logs, summaries, exports or the original image in the UI. Handwriting and photos are listed as untested.

## Sources and rights

- **PMC Open Access case reports**: explicit CC BY or CC0 only, fetched through the PMC OA service or API, never by scraping the site. Attribution kept and our changes (planting, OCR, redaction) noted. NC, ND, SA, custom or unknown licenses are excluded.
- **VAERS public narratives**: official versioned downloads. Reports do not establish that a vaccine caused anything, and the UI never implies it.
- **CMS NCD narrative text** (no LCD material or CPT codes), **DailyMed or openFDA label text**, **Drugs@FDA scanned letters** for OCR. Check each excerpt for third-party notices before committing. Unresolved files are left out.
- **Synthea** counts as synthetic, Set A.
- Labels, coverage policies and letters are reported as their own genres, never as clinical-note performance.
- Excluded from this public corpus: MIMIC, n2c2, i2b2, MTSamples.
- Manifest per document: source ID and URL, title, authors, publisher, retrieval date, exact license and its URL, required notice, sha256 of the retrieved file and of each transformed fixture. Corpus licenses live apart from the code license. A hash proves file identity, not permission.

## How it is presented

- **README**: a short "How we test on real text" section with the table above, the coverage matrix, each result with its limit beside it, and the limits paragraph below.
- **Inspector UI**: a data-source switch (Synthetic, Real public text, Real text with planted identifiers), a license chip on every real document linking to the original, and the planted marker.
- **Failure gallery**: a full machine-readable error list, with the displayed cases chosen by a fixed severity rule (missed identifier, partial leak, over-redaction, meaning change, pipeline failure), the first k shown with a link to the full list.
- **One sentence for a reader in a hurry**: "We test the gate three ways: synthetic notes for identifier recall, real public case reports with fictional identifiers planted in for recall inside real clinical language, and untouched real text to show it keeps the medications and diagnoses intact, each reported separately with its limits."

## Limits paragraph (goes in the README as written)

These results are an offline engineering evaluation over the stated sources, categories and tasks. They are not an Expert Determination, a certification of Safe Harbor compliance, an estimate of re-identification risk, or validation for clinical use. Removing listed identifiers does not address identification through rare histories or combinations of details.

## Rules

Tests run offline on committed files. No pooled score. No tuning on test documents or test format families. Planted identifiers are fictional and generated.
