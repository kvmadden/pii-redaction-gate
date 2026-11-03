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


=== DOCUMENT fd-0005 ===
   1| CALLOWAY REGIONAL HOSPITAL
   2| DEPARTMENT OF DIAGNOSTIC RADIOLOGY
   3| ULTRASOUND EXAMINATION REPORT
   4| 
   5| PATIENT: Warren Scott
   6| MRN: 88392104
   7| ACCESSION: ACC-7719402
   8| DOB: 08/19/1954
   9| DATE OF EXAM: July 12 2026
  10| ORDERING PHYSICIAN: Dr. Kenneth Albright
  11| SONOGRAPHER: T.G.
  12| READING RADIOLOGIST: Dr. Martin Vance
  13| PRIMARY CONTACT: Fisher (nephew)
  14| CAREGIVER: Ananya Sen
  15| DEPARTMENT TELEPHONE: (617) 555-0118 ext. 3307
  16| 
  17| EXAMINATION:
  18| Ultrasound duplex scan of the right upper quadrant and biliary tree.
  19| 
  20| CLINICAL HISTORY:
  21| The patient is a 71-year-old male with persistent right upper quadrant
  22| discomfort, postprandial nausea, and mild jaundice. He has a past medical
  23| history of hypertension and hyperlipidemia. Caregiver Ananya Sen noted
  24| intermittent postprandial emesis over the preceding week. Episodic biliary
  25| colic reportedly intensified around the 4th of July after an outdoor picnic.
  26| The patient lives in Greenfield and was referred by Dr. Kenneth Albright for
  27| diagnostic evaluation. Nephew Fisher assisted with transportation.
  28| 
  29| TECHNIQUE:
  30| Real-time gray-scale, color, and spectral Doppler ultrasound imaging of the
  31| liver, gallbladder, bile ducts, pancreas, and right kidney was performed
  32| using curvilinear and phased-array transducers.
  33| 
  34| FINDINGS:
  35| The liver measures 14.8 cm in craniocaudal dimension, demonstrating normal
  36| parenchymal echogenicity without focal mass or hepatic surface nodularity.
  37| Main portal vein is patent with hepatopetal flow at 22 cm/s.
  38| 
  39| The gallbladder is distended with mild diffuse wall thickening measuring
  40| 3.8 mm (normal less than 3 mm). Several mobile, shadowing, hyperechoic
  41| calculi are present in the gallbladder lumen, the largest measuring 1.4 cm
  42| in maximal dimension. A positive sonographic Murphy sign was elicited
  43| during direct probe palpation over the fundus. There is a small rim of
  44| pericholecystic fluid adjacent to the gallbladder wall.
  45| 
  46| The common bile duct is mildly dilated, measuring 7.5 mm in diameter at the
  47| porta hepatis, but tapers smoothly toward the ampulla without demonstrable
  48| choledocholithiasis. Visualized portions of the pancreatic head and body
  49| appear unremarkable. Pancreatic duct is not dilated, measuring 1.6 mm.
  50| Right kidney demonstrates normal cortical thickness (11.2 cm length) without
  51| hydronephrosis or calculi. Spleen is normal in size, measuring 10.4 cm.
  52| 
  53| IMPRESSION:
  54| 1. Cholelithiasis with sonographic Murphy sign and mild gallbladder wall
  55|    thickening, indicative of acute calculous cholecystitis.
  56| 2. Borderline common bile duct dilation without visible intraductal stone.
  57| 3. Findings were phoned and discussed with ordering provider Dr. Kenneth
  58|    Albright at 14:15 on the exam date. Surgical consultation for
  59|    laparoscopic cholecystectomy is recommended.
  60| 
  61| Reported by:
  62| Dr. Martin Vance, MD
  63| Staff Radiologist, Calloway Regional Hospital
=== END DOCUMENT ===

=== DOCUMENT fd-0070 ===
   1| Date of Service: October 14, 2026
   2| Patient: BAHADOR-ZADEH, NILOUFAR
   3| Health Plan Member ID: HPM-84920411
   4| Subject: Question regarding glipizide dose and lab paperwork
   5| 
   6| Message 1
   7| From: niloufar
   8| Sent: October 14, 2026 08:22 AM
   9| To: Dr. Craig Halloway
  10| 
  11| hello dr. halloway,
  12| i am writing to ask about my morning blood sugars over the last week. i have been taking glipizide 5 mg PO daily before breakfast along with metformin 1000 mg PO BID. my fasting redings have been running between 148 and 165 mg/dL, and my bedtime check yesterday was 182 mg/dL. i spoke with my husband Alan Cooper becasue i felt a little dizzy on tuesday, but my blood pressure was 128/76 mmHg and heart rate was 72 bpm. my daughter checked my ketone strips and they were negative.
  13| also, we recently relocated and i currently work in Kirkland, so the local diagnostic center near my office asked for the order form. could your medical assistant please transmit the updated requisition for my HbA1c, comprehensive metabolic panel, and urine microalbumin? the imaging and draw station there gave me their direct transmission line: Fax: (425) 555-0148. i want to make sure the lab has everything ready before my scheduld fasting draw. thank you so much for checking on this.
  14| 
  15| Message 2
  16| From: Dr. Craig Halloway
  17| Sent: October 14, 2026 11:45 AM
  18| To: BAHADOR-ZADEH, NILOUFAR
  19| 
  20| Dear Mrs. Bahador-Zadeh,
  21| 
  22| Thank you for the detailed log. Given that your fasting blood glucose levels remain above our target of 90-130 mg/dL despite metformin 1000 mg PO BID, we will increase your glipizide to 10 mg PO daily taken 30 minutes before your morning meal. Please continue logging both preprandial and 2-hour postprandial values. If you experience any episodes of hypoglycemia (blood glucose under 70 mg/dL, diaphoresis, or tremor), take 15 grams of fast-acting carbohydrate immediately and notify our office.
  23| 
  24| Regarding your lab orders, our clinical coordinator just transmitted your requisition for hemoglobin A1c, CMP, and urine albumin-to-creatinine ratio to the facility at Fax: (425) 555-0148. I have also verified that your coverage under Health Plan Member ID: HPM-84920411 is attached to the requisition so there will be no billing delay. If your dizziness recurs or systolic blood pressure drops below 110 mmHg, please let Alan Cooper or our triage nurse know right away. We will review your new lab results together during our follow-up consultation on November 4, 2026.
  25| 
  26| Sincerely,
  27| Craig Halloway, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0183 ===
   1| HENSLEY MEMORIAL HOSPITAL
   2| OUTPATIENT NEUROLOGY CLINIC
   3| REFERRAL INTAKE AND SCHEDULING CONFIRMATION
   4| 
   5| Date: 14 March 2026
   6| Patient Name: Jeffrey Townsend
   7| MRN: 7048219
   8| Referral Origin: Dr. R.J. Prescott
   9| 
  10| Dear Mr. Townsend,
  11| 
  12| This letter comfirms that Hensley Memorial Hospital has received and processed your clinical referral for comprehensive neurological assessment. Your upcoming diagnostic consultation is scheduled for 14 March 2026 at 10:15 AM with our neuromuscular clinical service.
  13| 
  14| Please report directly to our outpatient reception suite at the following address:
  15| 742 Hensley Boulevard, Suite 300
  16| Charleston, SC 29401
  17| 
  18| Your referring physician, Dr. R.J. Prescott, requested this specialty consultation to evaluate progressive sensory paresthesias in your lower extremities and intermittent gait instability. Our clinical intake team has reviewed your preliminary electromyography results and routine blood panels. To prepare for your clinical apointment, please adhere to these pre-visit instuctions:
  19| 1. Arrive fifteen minutes prior to your scheduled time to finalize registration and health plan eligibility verification.
  20| 2. Bring a current, comprehensive list of all prescription medications, over-the-counter supplements, and precise dosing regimens.
  21| 3. Bring any recent external imaging discs or neurophysiology paper reports not performed within our facility.
  22| 4. Wear loose, comfortable clothing to facilitate a complete neuromuscular examination.
  23| 
  24| Our intake coordinator notes that your spouse, Nancy Townsend, is listed as your primary medical emergency contact and is welcome to attend the consultation to participate in discussions regarding your diagnostic management plan.
  25| 
  26| If you must reschedule or have clinical questions prior to your visit, please contact our administrative desk at (843) 555-0164 ext. 248 between 8:30 AM and 4:30 PM, Monday through Friday. Secure scheduling messages or pre-visit questionnaires may also be routed directly to our designated intake coordinator, claire webster, through our secure patient communication portal.
  27| 
  28| We look forward to participating in your care at Hensley Memorial Hospital.
  29| 
  30| Sincerely,
  31| 
  32| Arthur Holloway, MD
  33| Chief of Clinical Neurology
  34| Hensley Memorial Hospital
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.