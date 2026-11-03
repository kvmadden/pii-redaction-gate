# Amendments to the fresh test spec: redaction gate

Dated 2026-11-03. Written before any lock and before any gate run on this set. The spec file itself is unchanged. This page lists every place where the staged set does something the spec did not say, or says it differently.

## 1. The pharmacist review is limited to 30 items
The spec asks a pharmacist to review the keep spans on a random 25 percent of documents. That is more than one person can review. The review is now at most 30 items. Keep spans that a labeler or the adjudicator marked as uncertain come first. If fewer than 30 were marked, the rest are filled at random from the keep spans of a random 25 percent of the documents. The random seed is 20261103. The queue is review/kevin-keep-spans.md. In this staged set 30 items were marked uncertain and 0 came from the random fill. Any change Kevin makes to a keep label should be recorded in a short note before the lock, as the labels are never edited after it.

## 2. How span positions were found
Labelers did not count characters. For every span a labeler gave the line number, the exact quoted text and which occurrence on that line. A script then computed the character offsets. The spec asked for the occurrence number in the whole document. The line number was added because models count occurrences badly in long documents. When a quote was not found on its line, the script looked at nearby lines, repaired differences in whitespace and line breaks, accepted a match that was unique in the document, or accepted a unique match that differed only in letter case. Quotes that still could not be placed were sent back to the same labeler for a fix. The counts are in MANIFEST.json.

## 3. Offsets
Offsets count Unicode code points in the text after NFC normalization. The end offset is exclusive. No document has a character outside the Basic Multilingual Plane, so the offsets are also valid JavaScript string indices. Line breaks are single newline characters.

## 4. Conventions that fill gaps in the fixed policy
The policy in section 3 of the spec is unchanged. The labelers and the adjudicator also received the following conventions, written out in full in prompts/label/.
- A city or town, a county and a ZIP code count as ADDRESS and are identifiers. A state or a country on its own is not labeled.
- A bare year is DATE with policy not-identifier. Any date with a month or a day is an identifier.
- Relative time expressions, durations, times of day and a weekday on its own are not labeled.
- Credentials after a name (MD, RN, PharmD) are not part of the name span. A suffix such as Jr. or III is part of it. A script removed titles, possessive endings and credentials from name spans when a labeler had included them, and removed trailing sentence punctuation from dates, numbers and web addresses.
- An age span holds the number and any unit attached to it, without a label word such as Age.
- ICD, CPT, HCPCS, NDC and LOINC codes are clinical content and never ID.
- Named practices count as facilities. Generic references such as the hospital or her pharmacy are not labeled. A clinic or center named as a service (a referral to Pain Clinic) is KEEP.
- KEEP spans are drawn at a fixed grain: drug names without the dose, doses with units, routes, frequencies, lab and vital values with their name and unit, diagnoses and eponymous terms in full, scores and signs, section headers, service names, procedure names, tapers and fractions.
- The authors were told to keep employers, schools, health plans and other organizations that are not healthcare facilities out of the documents, so those never needed a type.

## 5. The policy field was set by rule
The spec fixes the policy for every type. After labeling, a script set the policy field from the type and the text using those fixed rules. Names, facilities and all other identifier types are identifiers. Ages of 90 and over are identifiers. Ages under 90 and bare years are not. KEEP is not-identifier. The number of labeler answers that this changed is in MANIFEST.json.

## 6. Disagreements, the adjudicator and disputed spans
Every place where the two labelers did not give exactly the same spans went to the adjudicator (GPT 6.1 Sol) together with the document. That covers a span only one labeler marked, a different type, and a different boundary. A KEEP span that only one labeler marked was sent in a short list and was accepted unless the adjudicator rejected it. Strings that the document's author listed as identifiers in its private notes, and that neither labeler marked, were also sent to the adjudicator. The labelers never saw the author's notes or each other's labels. Items the adjudicator could not settle are recorded as disputed in disputed.jsonl and are not in labels.jsonl. A scorer that wants to be careful can run once with disputed spans left out and once with them counted as identifiers.

## 7. How the minimums are counted
Names are NAME, RELATIVE and CLINICIAN spans with policy identifier. Dates are DATE and DOB spans with policy identifier, so a bare year is not counted. Record and plan numbers are ID spans. Phone and fax numbers are PHONE and FAX spans. Addresses are ADDRESS spans, including a city or a ZIP code on its own. A document with no identifier is a document with no span whose policy is identifier. The statistics file lists the counts and the coverage of the hard cases.

## 8. What the authors were told beyond the spec
The authors received the spec text, hard rules for synthetic values and one slot per document that named the document kind, the length, the layout and a list of required items drawn from the spec (name forms, name collisions, date forms, age forms, number forms, address forms and so on). Phone and fax numbers had to end in 555-0100 to 555-0199 or use a short list of reserved international forms. Email addresses, web addresses and IP addresses had to use the example domains and the documentation address ranges. Social security numbers had to start with 000, 666 or 9. The prompts are in prompts/author/.

## 9. Document identifiers
Documents are named fd-NNNN. The numbers come from a seeded shuffle, so the number says nothing about the author, the kind or the time of writing. Some numbers are unused because slots were planned with spare room.

## 10. How the hard-case coverage was measured
Coverage of the hard cases was counted by script from the final labels, not taken from the authors. Dates were sorted into forms by pattern. Names were sorted by case, order, initials, line breaks and particles. The share of names from outside Anglo naming traditions was measured by asking both Grok and Gemini to classify every distinct name, and both answers are in the statistics file. Name collisions with ordinary or clinical words were counted against a fixed word list in the planning script, so the count is a lower bound. Hard-case counts are in validation/stats.json.

## 11. Adjudication coverage
The adjudicator saw every item as a numbered line next to the full document. If an answer line was missing, only that item was asked again. A set of items was ignored and asked again if the items for that document changed after the first prompt was made. The counts of each kind of answer are in MANIFEST.json.

## 12. Labeling process notes
Each labeler worked on batches of three documents, and a few early batches held four or five. One Gemini batch stalled twice, so its six documents were labeled by Gemini one at a time, with an added closing line in the prompt that told the model to use no tools and to answer directly. Gemini produced a small number of lines that were not valid JSON. Those spans were lost on the Gemini side and show up as spans that only Grok marked, which then went to the adjudicator. The count of such lines is in the locator statistics in MANIFEST.json.
