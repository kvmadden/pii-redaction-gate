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


=== DOCUMENT fd-0145 ===
   1| PACIFIC CREST PATHOLOGY ASSOCIATES
   2| CLINICAL AND SURGICAL PATHOLOGY REPORT
   3| 
   4| PATIENT: VELMURUGAN, ANAND
   5| DOB: 10/12/1967
   6| AGE: 58-year-old
   7| HEALTH PLAN ID: HPM-49201844-01
   8| ACCESSION: ACC-2026-81043
   9| COLLECTION DATE: 2026-05-19
  10| DATE RECEIVED: 5/19/26
  11| ORDERING PHYSICIAN: Dr. Douglas Campbell-Ross
  12| REPORTING PATHOLOGIST: Dr. Wayne Miller
  13| CAREGIVER: Megan Vance (daughter-in-law)
  14| FACILITY FAX: Fax: (415) 555-0164
  15| 
  16| Clinical History:
  17| The patient is a 58-year-old male with a history of recurrent right lower quadrant abdominal pain and low-grade fevers. Patient Anand Velmurugan was admitted through the emergency department following twelve hours of migratory periumbilical pain that localized to McBurney point. Preoperative laboratory testing demonstrated leukocytosis with a white blood cell count of 15.4 x10^3/uL and 84% neutrophils. An ultrasound and contrast-enhanced CT of the abdomen evaluted a thickened appendix measuring 1.2 cm in outer diameter with surrounding mesenteric fat stranding and appendicolith. The patient underwent an uneventful laparoscopic appendectomy performed by Dr. Douglas Campbell-Ross. The operative speciman was submitted for definitive histopathologic evaluation. Caregiver Megan Vance was designated for outpatient postoperative communication.
  18| 
  19| Gross Description:
  20| Recieved in formalin labeled with the patient's name and accession ACC-2026-81043 is an oriented vermiform appendix measuring 6.5 cm in length and up to 1.3 cm in maximum diameter. The serosa is dull, hyperemic, and covered by a patchy fibrinous exudate. The mesoappendix contains multiple congested blood vessels and measures up to 0.8 cm in thickness. Sectioning reveals a dilated lumen containing a calcified fecalith measuring 0.6 cm and purulent luminal exudate. The wall is thickened and congested, measuring up to 0.3 cm. Representative sections submitted in cassettes A1 through A3.
  21| 
  22| Microscopic Examination:
  23| Histologic sections demonstrate extensive mucosal ulceration with transmural infiltration of polymorphonuclear neutrophils extending through the muscularis propria into the subserosa and mesoappendiceal adipose tissue. Focal areas of mucosal necrosis and mucosal hemorrhage are identified. The appendiceal lumen contains abundant neutrophilic debris and cellular detritus. There is no evidence of granulomatous inflammation, viral inclusions, dysplasia, or neuroendocrine tumor (carcinoid). The surgical resection margin at the appendiceal base is free of active inflammation. The regional lymphoid follicles show reactive follicular hyperplasia. Adjacent periappendiceal fat demonstrates unremakable vascular architecture without evidence of vasculitis or thrombus.
  24| 
  25| Final Pathologic Diagnosis:
  26| Appendix, laparoscopic appendectomy:
  27| Acute suppurative and gangrenous appendicitis with periappendicitis.
  28| Appendicolith identified.
  29| Proximal resection margin viable and clear.
  30| 
  31| Reviewed and reported by Dr. Wayne Miller, Pacific Crest Pathology Associates.
=== END DOCUMENT ===

=== DOCUMENT fd-0250 ===
   1| Message Thread
   2| Sender: Patient
   3| To: Triage Nurse
   4| Subject: Medication adjustment and referral question
   5| 
   6| hello, i am writing about my mother who is a 64-year-old female currently recovering from her recent flare. she is still having burning dysesthesias in both lower legs. the covering pharmacist had suggested switching from gabapentin to Lyrica 75 mg PO BID, taken with meals, alongside her current regimen of duloxetine 30 mg PO daily. her vitals recorded this morning on our home cuff were BP 124/78 mmHg, HR 72 bpm, and temp 98.4 F. her latest routine renal panel showed potassium 4.2 mEq/L and serum creatinine 0.88 mg/dL. we also wanted to know if her prior evaluation for possible deep vein thrombosis needs repeating. when she was assessed at Outside Hospital, her Wells score was 0 points and her D-dimer was 210 ng/mL (reference less than 500 ng/mL), which ruled it out at that time. finally, has the electronic order for her formal consult with Pain Clinic been submitted yet? thank you for your help.
   7| 
   8| Care Team Reply
   9| Sender: Registered Nurse
  10| To: Patient
  11| 
  12| Thank you for your message. The covering physician reviewed the update for the 64-year-old patient. The transition to Lyrica 75 mg PO BID is approved to start tonight, and you may continue duloxetine 30 mg PO daily as scheduled. Her reported BP 124/78 mmHg and normal labs are reassuring. Given the low Wells score and negative D-dimer from Outside Hospital, repeat venous duplex imaging is not indicated unless unilateral asymmetric edema or calf tenderness develops. The referral to Pain Clinic for comprehensive neuropathy management was submitted this morning. Please submit a follow-up portal note in two weeks regarding symptom control or if somnolence occurs.
=== END DOCUMENT ===

=== DOCUMENT fd-0229 ===
   1| Message 1
   2| Sender: Patient
   3| Recipient: Care Team
   4| Subject: Follow-up question regarding facial numbness and pain medication
   5| 
   6| hello, I am writing for the 52-year-old patient who was evaluated at the emergency department two days ago. We received the transfer summary and head CT imaging disk sent from Outside Hospital, which confirmed the diagnosis of Bell palsy and ruled out acute infarction. The emergency team started valacyclovir 1000 mg PO TID for seven days along with prednisone 60 mg PO daily with a scheduled taper. However, the sharp burning pain behind the left ear and along the jawline has become increasingly uncomfortable since yesterday evening. The discharge paperwork suggested asking whether adding Lyrica would help with this neuropathic facial pain, or if we should request an expedited referral to Pain Clinic. The patient took the morning steroid dose with breakfast. Recent vital signs checked at home showed BP 132/84 mmHg, HR 76 bpm, and temp 98.4 F. We also reviewed the basic metabolic panel from the transfer records, which reported serum potassium 4.1 mEq/L, sodium 140 mEq/L, and creatinine 0.88 mg/dL. Please let us know if an adjunctive medication can be called in to the local retail pharmacy.
   7| 
   8| Message 2
   9| Sender: Care Team
  10| Recipient: Patient
  11| Subject: RE: Follow-up question regarding facial numbness and pain medication
  12| 
  13| Thank you for reaching out. The covering physician reviewed the records forwarded from Outside Hospital and agrees with managing the acute neuropathic discomfort. We have submitted a prescription for Lyrica 75 mg PO BID to the pharmacy on file. Please continue valacyclovir 1000 mg PO TID to finish the full course, and follow the prednisone taper as directed. We also placed a formal referral to Pain Clinic for comprehensive evaluation if the neuropathic symptoms persist beyond the initial course. If the patient develops new extremity weakness, slurred speech, confusion, or difficulty closing the left eye completely, please contact the triage line or seek immediate emergency care.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.