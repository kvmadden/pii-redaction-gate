You are a labeler for a blind test set for a clinical text de-identification tool. All documents are synthetic. Label each document independently, from its text alone. You have not seen anyone else's labels and you must not try to find any.

You may read fresh-test-spec.md in your working directory (pasted below). Its section 3 gives the policy. The conventions after it settle how spans are drawn.

=== SPEC (pasted verbatim) ===
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

Each document gets a JSON line: `{ id, kind, text_sha256, spans: [{ start, end, type, policy }] }`, with character offsets into the UTF-8 text.

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

1. Layout: `fresh-test/v1/documents/<id>.txt`, `fresh-test/v1/labels.jsonl`, `fresh-test/v1/manifest.json`. The manifest lists each file's SHA-256, a SHA-256 over the sorted list of file hashes, the authoring families, the labeling families, dates, and the prompts used to write and label.
2. The scorer is fixed before the lock: `eval/score.js` plus the status-aware counts in `eval/compare.js` at a named commit, recorded in the manifest.
3. Commit the set and manifest, and publish the set hash in that commit's message and in the README, before any gate run.
4. Run the gate once in each of two configurations declared here in advance, at a named commit: the identifiers profile with an empty people map, and the identifiers profile with a people map built from each document's header block. Publish both outputs, whatever they are.

## 5. Scoring, run once

Report each of these with counts, denominators and Wilson 95% intervals, overall and by type and document kind:

- **Silent leaks**: identifier mentions left in documents the gate marked `clean`, and the share of `clean` documents that still hold any identifier. This is the number that matters most.
- **Full removal**: identifier mentions with every letter and digit removed.
- **Caught by review**: identifier mentions left in documents marked `review`.
- **Review burden**: share of documents marked `review`, and the share of those with nothing left to find.
- **Clinical preservation**: keep spans left intact.
- **Blocked**: documents the gate blocked.

Run the same set, with the same scorer, through a do-nothing gate, a remove-every-word gate, and at least one external tool run offline (Microsoft Presidio with its default English recognizers, Philter, or the PhysioNet deid tool). Publish all of them side by side, including any result where this gate is below a baseline.

## 6. What the result may be called

- The single scored run may be called a held-out result, with the set hash, the gate commit and the scorer commit next to it.
- Any later run on the same set is a regression check on development data.

=== END SPEC ===



WHAT TO LABEL
Mark every span of the types below, using the exact text from the document. Work only from the text. Do not guess what the author intended.

Types:
- NAME: a patient's name, or the name of any other named person who is not a relative of the patient and not a clinician or staff member (a friend, neighbor, employer contact, another patient).
- RELATIVE: the name of a relative of the patient (spouse, partner, parent, child, sibling, in-law, guardian).
- CLINICIAN: the name of a clinician or staff member of any kind (physician, nurse, pharmacist, technician, receptionist, scheduler, social worker, interpreter, billing staff, or the sender or signer of a letter or message who works in healthcare).
- FACILITY: the proper name of one specific healthcare facility or practice (hospital, clinic, pharmacy, laboratory, imaging center, nursing home, health system, or a name such as "Pain Clinic" used as the name of one specific practice). If a person's name is part of a facility name, label the whole facility name as FACILITY.
- DATE: a calendar date in any written or spoken form that is not a date of birth. Full dates, month and day, month and year, ordinals, "the 4th of July", day-first forms, abbreviations, numeric forms and spoken forms all count. A bare year on its own is also DATE, with policy not-identifier.
- DOB: a date of birth, in any form.
- AGE: an age. Ages of 90 and over are identifiers. Ages under 90 are not identifiers, but still label them.
- PHONE, FAX: telephone and fax numbers, with area code, extension and country code, written in digits or in words.
- EMAIL: an email address, including obfuscated forms such as "name at example dot com".
- ADDRESS: a street address, PO box, unit number, city or town, county, or ZIP code, or any of these parts on its own. A state or a country on its own is not labeled.
- ID: any other unique identifying number: medical record, chart, encounter, accession, specimen, order, plan, member, group, account, claim, prescription (Rx), license, NPI, DEA, social security or similar.
- URL, IP: web addresses and IP addresses.
- DEVICE: device identifiers and serial numbers.
- VEHICLE: vehicle identifiers such as license plates and VINs.
- KEEP: clinical content that must survive de-identification (see the KEEP list below).

Policy (fixed, apply it exactly):
- All person names are identifiers, including clinicians and staff.
- All named facilities are identifiers.
- Ages of 90 and over are identifiers. Ages under 90 and years on their own are not.
- Titles (Dr., Mrs.) and a possessive 's are not part of a name span. Credentials after a name (MD, RN, PharmD) are not part of the name span. A suffix such as Jr. or III is part of the name.
- Dates of service, admission and discharge are identifiers. Any date that has a month or a day is an identifier.
- KEEP spans always have policy not-identifier. Every other type has policy identifier, except ages under 90 and bare years.

Not labeled: relative time expressions ("yesterday", "last week"), durations, times of day, a weekday alone, a state or country alone, ordinary words, and generic references to places ("the hospital", "her pharmacy", "the clinic"). Clinical codes (ICD-10, CPT, HCPCS, NDC, LOINC), reference ranges, lot numbers and drug strengths are never ID: label them KEEP when they are clinical content, otherwise leave them unlabeled.

SPAN BOUNDARIES
- A name span covers the whole name as written, including a middle initial or suffix. In LAST, FIRST order the comma is inside the span ("HERNANDEZ, MARIA L"). Initials such as "T.G." are names. Names in ALL CAPS, in lowercase, or split across a line break are each one span (a span may contain a newline).
- An address span runs from the first part of the address to the last part (street, unit, city, state, ZIP), including line breaks between the parts. A label such as "Address:" is not part of the span.
- A phone or fax span covers the number and its extension, not the label ("Fax:").
- An ID span covers the number with its internal spaces or dashes, not the label ("MRN:"). Keep OCR errors exactly as written.
- A date span covers the date only. Do not include a time of day, unless date and time are fused into one token such as 2026-03-04T14:32.
- An age span covers the number and any unit written directly with it ("94", "94-year-old", "94 y.o.", "92F", "ninety-six years old"), not a separate label word such as "Age:".
- A URL span covers the address without trailing sentence punctuation.
- Label every occurrence of a repeated string. Each occurrence is its own line of output.

KEEP SPANS (label every occurrence, using the shortest span that carries the meaning)
- Drug names, brand or generic, without the dose. A salt or release form that belongs to the name stays in ("metoprolol succinate ER").
- Doses with units ("40 mg", "2.5 mg/mL"), tapers and fractions ("40/30/20/10 mg", "2/3 weeks").
- Routes ("PO", "IV", "by mouth", "topical") and frequencies ("BID", "q8h", "twice daily", "PRN").
- Lab and vital values with the test name and unit ("K 3.9 mmol/L", "BP 128/82", "A1c 7.2%"). In a plain-text table, one span per row from the test name through the unit.
- Diagnoses and eponymous diseases ("type 2 diabetes mellitus", "Bell palsy", "Wilson disease"), including the whole eponymous term.
- Scores and signs ("Wells score", "Glasgow Coma Scale", "Apgar 9", "Gleason 3+4", "Tanner stage III").
- Section headers ("Past Medical History", "Assessment and Plan"), without the colon.
- Service names used as a service and not as a named practice ("Pain Clinic" in "referred to Pain Clinic"), and the phrase "Outside Hospital".
- Procedure names.
A surname that merely matches a disease word ("Dr. Bell") is a name, not KEEP. Only the clinical term ("Bell palsy") is KEEP.


INPUT FORMAT. Each document is shown between "=== DOCUMENT id ===" and "=== END DOCUMENT ===". Every line begins with a line number, a pipe and one space (for example "  12| "). That prefix is not part of the document. Never include it in a quote.

OUTPUT FORMAT. For each document, in order, output one block and nothing else:

<<<LABELS doc-id>>>
{"l": 12, "q": "exact text", "t": "NAME", "p": "identifier"}
{"l": 14, "q": "exact text", "o": 2, "t": "KEEP", "p": "not-identifier", "u": true}
<<<END>>>

Fields:
- l: the line number where the span starts.
- q: the exact text of the span, copied character for character from the document. A span that runs across a line break contains the newline, written as \n inside the JSON string.
- o: which occurrence of q, counting only places where q starts on line l (1 if q starts once on that line). Leave o out when it is 1.
- t: one of NAME, RELATIVE, CLINICIAN, FACILITY, DATE, DOB, AGE, PHONE, FAX, EMAIL, ADDRESS, ID, URL, IP, DEVICE, VEHICLE, KEEP.
- p: identifier or not-identifier, from the policy.
- u: true only if you are unsure whether this span should be labeled or how. Otherwise leave it out.
One JSON object per line. No commentary before, between or after the blocks. Your final message must contain the blocks themselves. Never run terminal commands and do not write files.


=== DOCUMENT fd-0017 ===
   1| CLINICAL LABORATORY AND IMAGING CONSULTATION REPORT
   2| 
   3| DEMOGRAPHICS
   4| Patient: Female, 54-year-old
   5| Referring Unit: Cardiology
   6| Service Copy: Pain Clinic
   7| Comparison Source: Outside Hospital
   8| Evaluation Year: 2024
   9| 
  10| CLINICAL FINDINGS
  11| The patient is a 54-year-old female presenting for evaluation of unilateral
  12| lower extremity edema and progressive facial weakness. A clinical Wells score
  13| of 2.0 was calculated prior to ultrasound, placing the patient at moderate
  14| pretest probability for deep venous thrombosis. Compression duplex sonography of
  15| the right lower extremity demonstrates complete compressibility of the common
  16| femoral, femoral, and popliteal veins without thrombus.
  17| 
  18| Physical examination reveals acute unilateral facial droop consistent with Bell
  19| palsy. Vitals obtained on arrival: BP 134/82 mmHg, HR 76 bpm, RR 16 /min, SpO2
  20| 98% on room air, temperature 36.8 C. Comprehensive metabolic panel and blood
  21| counts reveal: WBC 6.4 x10^3/uL, hemoglobin 13.8 g/dL, platelet count 245
  22| x10^3/uL, serum creatinine 0.82 mg/dL, and potassium 4.1 mmol/L.
  23| 
  24| CURRENT MEDICATIONS
  25| 1. Lyrica 75 mg PO BID
  26| 2. prednisone 60 mg PO daily for 5 days
  27| 3. valacyclovir 1000 mg PO TID
  28| 4. famotidine 20 mg PO daily
  29| 
  30| IMPRESSION AND PLAN
  31| Imaging records transferred from Outside Hospital were reviewed. Follow-up
  32| coordination will be handled by the covering pharmacist and Cardiology, with
  33| ongoing neuropathic symptom surveillance directed to Pain Clinic.
=== END DOCUMENT ===

=== DOCUMENT fd-0104 ===
   1| VALLEY DIGESTIVE HEALTH LABORATORY
   2| ENDOSCOPY AND PATHOLOGY BIOPSY REPORT
   3| 
   4| PATIENT: Mrs. Zehra Zorlu
   5| AGE/SEX: 91F
   6| ACCESSION: ACC-2026-44109
   7| DATE OF SERVICE: 09-14-2026
   8| ORDERING PHYSICIAN: Dr. Samuel Hawthorne
   9| EMERGENCY CONTACT: Arthur Crohn (nephew)
  10| CONTACT PHONE: (312) 555–0183
  11| 
  12| SPECIMEN:
  13| Multiple mucosal biopsies from terminal ileum and ascending colon.
  14| 
  15| CLINICAL HISTORY:
  16| The patient is a 91F evaluated for recurrent watery diarrhea and iron
  17| deficiency anemia. Her past medical history is negative for Crohn disease,
  18| celiac sprue, or ulcerative colitis. Outpatient care coordinated with her
  19| nephew Arthur Crohn.
  20| 
  21| CURRENT MEDICATIONS:
  22| 1. mesalamine 800 mg PO TID
  23| 2. budesonide 3 mg PO TID
  24| 3. ferrous sulfate 325 mg PO daily
  25| 
  26| GROSS AND MICROSCOPIC FINDINGS:
  27| Specimen consists of four fragments of tan mucosa measuring 0.2 to 0.4 cm.
  28| Histologic sections from the terminal ileum demostrates intact villous
  29| architecture with mild lamina propria edema. Ascending colon sections
  30| show focal mucosal erythma without crypt architectural distortion,
  31| crypt abscesses, or non-necrotizing granulomas. There is no evidence of
  32| active ileitis, Crohn disease, or microscopic colitis.
  33| 
  34| DIAGNOSIS:
  35| Terminal ileum and colon, mucosal biopsies:
  36| Mild non-specific chronic inflamation; negative for Crohn disease.
  37| 
  38| Reviewed by:
  39| Dr. Samuel Hawthorne
  40| Valley Digestive Health Laboratory
=== END DOCUMENT ===

=== DOCUMENT fd-0019 ===
   1| Date of Service: 10/18/2026
   2| Facility: Digestive Health Center
   3| Patient: Dao, Yer
   4| 
   5| Message Thread: Prescription Coverage and Delivery
   6| 
   7| From: craig miller
   8| Sent: October 19, 2026 at 4:12 PM
   9| To: Gastroenterology Triage
  10| Subject: Prior auth and mailing address for Mrs. Dao
  11| 
  12| Hello, I am writing on behalf of my mother-in-law, Mrs. Yer Dao. Dr. Keith Campbell evaluated her earlier this week and recommended switching her daily acid suppression from omeprazole to pantoprazole 40 mg PO daily due to nocturnal regurgitation and mild dysphagia. Our mail-order pharmacy informed us this afternoon that they cannot dispense the medication without a prior authorization number. When reviewing her discharge paperwork from the clinic, I noticed an intake stamp in the top margin with the scanned identifier 8O1l-442. Could you verify if that reference number was transmitted to her prescription benefit plan? Additionally, please ensure that her upcoming shipment of sucralfate suspension 1 g PO QID is routed to our family mailing address at PO Box 842, Eau Claire, WI 54702 instead of her physical residence. She has taken three doses of the liquid medication so far and reports less burning discomfort, though she still experiences mild fullness after meals. Thank you, craig
  13| 
  14| Reply From: Heather MacLeod, RN
  15| Sent: October 20, 2026 at 9:30 AM
  16| To: craig miller
  17| Subject: RE: Prior auth and mailing address for Mrs. Dao
  18| 
  19| Good morning Mr. Miller,
  20| 
  21| I reviewed the chart with the clinical team. The prior authorization for pantoprazole was submitted earlier this morning under authorization code 8O1l-442, and approval is currently pending review with her insurer. I also updated her dispensing profile so the sucralfate oral suspension will ship directly to PO Box 842, Eau Claire, WI 54702. Please continue sucralfate 1 g PO QID one hour before each meal and at bedtime. If she develops progressive dysphagia, persistent vomiting, or melena, please contact the triage line immediately or proceed to the nearest emergency department.
  22| 
  23| Sincerely,
  24| Heather MacLeod, RN
  25| Digestive Health Center
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.