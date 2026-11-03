You are the adjudicator, the third labeler, for a blind test set for a clinical text de-identification tool. All documents are synthetic. Two labelers (A and B) labeled each document independently. Below are the documents and the places where A and B disagree, plus strings the document's author says are identifiers that neither labeler marked. Decide each case from the document text and the fixed policy and conventions.

You may read fresh-test-spec.md in your working directory (pasted below). Never run commands that change anything.

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

HOW TO ANSWER
Each document has a list of items. Items named D1, D2, ... are disputes: each shows labeler A's spans and labeler B's spans for the same stretch of text, with the line number. Items named C1, C2, ... are author candidates: a string the author says is an identifier of the given type that neither labeler marked at that line. Items named K1, K2, ... are KEEP candidates: a clinical span that only one labeler marked.

For every D and C item output one JSON line:
{"d": "D3", "res": "A", "u": false, "why": "short reason"}
- res "A": take labeler A's spans for this item as written. "B": take B's. "none": no span should be labeled there. "custom": give your own spans in "spans". "disputed": only if the document text and the fixed policy truly cannot settle it.
- For a C item, "A" means: label it with the author's string and type as shown. "none" means: it is not an identifier in this context (for example the word is used as an ordinary word, or a clinical term).
- "custom" needs "spans": [{"l": 12, "q": "exact text", "o": 1, "t": "NAME", "p": "identifier"}] with l the line number, q the exact text copied from the document without the line prefix, o the occurrence on that line (omit when 1), t the type and p the policy.
- "u": true if you are unsure or a careful clinician could reasonably disagree. "why": at most 20 words.
For the K items output ONE line per document: {"k_reject": ["K2"], "k_unsure": ["K4"]}. k_reject lists KEEP candidates that are not clinical content that must survive (or that are wrongly drawn). k_unsure lists ones you are unsure about. Everything not in k_reject is accepted. Output the line even when both lists are empty.
Output one block per document in this form and nothing else. Include a line for EVERY D and C item:

<<<RES doc-id>>>
{"d": "D1", "res": "B", "u": false, "why": "..."}
{"k_reject": [], "k_unsure": []}
<<<END>>>


=== DOCUMENT fd-0207 ===
   1| OAKHAVEN REGIONAL HOSPITAL
   2| OUTPATIENT CARDIOLOGY CLINIC CONSULTATION NOTE
   3| Date of Service: 10/16/2026
   4| Author: Kavita Chadha, MD, Resident Physician
   5| 
   6| PATIENT DEMOGRAPHICS AND CLINIC INTAKE:
   7| Patient Name: FAULKNER, KENNETH R.
   8| MRN: 7492018
   9| Account Number: AC-8820491
  10| Device Transmitter ID: 4821-9932-07
  11| Date of Birth: 04/12/1959
  12| Age: 67-year-old male
  13| Home Phone: (404) 555-0134
  14| Cellular Phone: 404.555.0191
  15| Patient Address:
  16| 742 NORTH BRIARCLIFF RD, DECATUR, GA 30033
  17| 
  18| Referring Practice:
  19| Clear Creek Health Center
  20| 1240 Clear Creek Parkway
  21| Roswell, GA 30075
  22| Practice Telephone: 404-555-0182 ext. 409
  23| 
  24| CARE TEAM PRESENT:
  25| Attending Physician: Gurpreet S. Sandhu, MD
  26| Cardiology Fellow: Rohit Bansal, MD
  27| Resident Physician: Kavita Chadha, MD
  28| Clinical Nurse Specialist: Preeti Dhillon, RN
  29| 
  30| CHIEF COMPLAINT:
  31| Post-hospitalization heart failure follow-up and medication titration.
  32| 
  33| HISTORY OF PRESENT ILLNESS:
  34| Kenneth R. Faulkner is a 67-year-old male with ischemic cardiomyopathy
  35| (LVEF 30% in August 2024), CAD status post stent in 2021, and stage 3a
  36| chronic kidney disease, who presents for post-hospitalization
  37| evaluation. He was admitted to Oakhaven Regional Hospital from
  38| October 10 through October 14, 2026, for volume overload with exertional
  39| dyspnea and lower extremity edema. He was discharged on 10-14-2026 after
  40| intravenous furosemide diuresis achieved a net fluid balance of -4.2
  41| liters and reduced his weight to 84.2 kg.
  42| 
  43| The patient was accompanied to today's appointment by his wife, Eleanor
  44| Faulkner, who corroborated the interval history. Mr. Faulkner reports
  45| that since returning home on Oct 15 2026, his stamina has improved,
  46| though he still notes mild dyspnea when climbing stairs. He denies
  47| orthopnea, chest pressure, or syncope, but reports brief palpatations
  48| when bending forward. Mrs. Faulkner logs his daily morning weights; his
  49| weight this morning was 84.5 kg. He adheres to a 2000 mg daily sodium
  50| restriction and a 1.5 L fluid restriction. Labs were drawn yesterday
  51| at Clear Creek Health Center, located at 1240 Clear Creek Parkway,
  52| Roswell, GA 30075.
  53| 
  54| REVIEW OF SYSTEMS:
  55| Constitutional: Denies fever, chills, or acute fatigue.
  56| Cardiovascular: Mild exertional dyspnea, occasional brief palpitations.
  57| Denies chest pain, orthopnea, or presyncope.
  58| Respiratory: Denies cough or wheezing.
  59| Gastrointestinal: Denies nausea, vomiting, or diarrhea.
  60| Genitourinary: Denies dysuria; mild nocturia once nightly.
  61| Musculoskeletal: Ambulatroy without assistive devices.
  62| Neurological: No focal weakness or dizziness.
  63| Skin: Warm, dry, intact without breakdown.
  64| 
  65| PAST MEDICAL AND SURGICAL HISTORY:
  66| 1. Ischemic cardiomyopathy (LVEF 30% in August 2024).
  67| 2. CAD status post drug-eluting stent to LAD (2021).
  68| 3. Primary hypertension and hyperlipidemia.
  69| 4. CKD stage 3a (baseline creatinine 1.15 mg/dL).
  70| 5. Open right inguinal hernia repair (2015).
  71| 
  72| CURRENT MEDICATIONS:
  73| 1. Sacubitril / valsartan 49/51 mg PO BID.
  74| 2. Carvedilol 12.5 mg PO BID with meals.
  75| 3. Spironolactone 25 mg PO daily.
  76| 4. Furosemide 40 mg PO every morning.
  77| 5. Empagliflozin 10 mg PO every morning.
  78| 6. Atorvastatin 40 mg PO nightly at bedtime.
  79| 7. Aspirin 81 mg PO daily.
  80| 8. Potassium chloride 20 mEq PO daily.
  81| 
  82| ALLERGIES:
  83| Lisinopril (angioedema with lip swelling). No known food allergies.
  84| 
  85| PHYSICAL EXAMINATION:
  86| Vital Signs:
  87| Temperature: 98.4 F (36.9 C), oral
  88| Pulse: 72 beats per minute, regular rhythm
  89| Blood Pressure: 138/84 mmHg, right arm, seated
  90| Respiratory Rate: 16 breaths per minute, unlabored
  91| Oxygen Saturation: 97% on ambient room air
  92| Weight: 84.5 kg (186.3 lbs)
  93| 
  94| General: 67-year-old male sitting comfortably, alert, oriented x4,
  95| in no acute respiratory distress.
  96| HEENT: Normocephalic, atraumatic. Moist mucous membranes.
  97| Neck: Supple. Jugular venous pulse estimated at 7 cm H2O at 45 degrees.
  98| Cardiovascular: Regular rate and rhythm. S1 and S2 present. Soft grade
  99| 2/6 holosystolic murmur at cardiac apex. No S3 gallop or rub.
 100| Lungs: Clear to auscultation bilaterally; scant bibasilar end-
 101| inspiratory crackles, improved from admission.
 102| Abdomen: Soft, non-distended, non-tender. Normoactive bowel sounds.
 103| Extremities: Warm with trace peripheal edema at both ankles; no calf
 104| tenderness. Dorsalis pedis pulses 2+ bilaterally.
 105| 
 106| DIAGNOSTIC DATA:
 107| Serum Chemistry and Hematology (drawn Oct 15 2026):
 108|   Sodium: 137 mmol/L
 109|   Potassium: 4.2 mmol/L
 110|   Chloride: 101 mmol/L
 111|   Bicarbonate: 24 mmol/L
 112|   BUN: 22 mg/dL
 113|   Serum Creatinine: 1.15 mg/dL
 114|   Estimated GFR: 64 mL/min/1.73m2
 115|   Serum Glucose: 118 mg/dL
 116|   B-type Natriuretic Peptide (BNP): 340 pg/mL
 117| 12-Lead Electrocardiogram (clinic today, 10/16/2026):
 118| Normal sinus rhythm at 70 bpm. PR interval 168 ms. QRS duration 106 ms.
 119| Old anterior infarct pattern with Q waves in V1-V3, unchanged from
 120| discharge tracing on 10-14-2026. No acute ST elevations.
 121| 
 122| ASSESSMENT AND CLINICAL IMPRESSION:
 123| 1. Chronic systolic heart failure (HFrEF, NYHA class II) secondary to
 124| ischemic cardiomyopathy. Favorable response to diuresis at Oakhaven
 125| Regional Hospital; near euvolemic with stable renal function on GDMT.
 126| 2. Coronary artery disease: Clinically stable, without angina.
 127| 3. Essential hypertension: Controlled on carvedilol and Entresto.
 128| 4. Chronic kidney disease stage 3a: Preserved baseline eGFR.
 129| 
 130| PLAN AND RECOMMENDATIONS:
 131| 1. Heart Failure Medical Regimen:
 132|    - Continue sacubitril / valsartan 49/51 mg PO BID.
 133|    - Continue carvedilol 12.5 mg PO BID; titrate to 25 mg BID next visit.
 134|    - Continue spironolactone 25 mg PO daily.
 135|    - Continue furosemide 40 mg PO daily for 5 days, then reduce to 20 mg
 136|      PO daily if stable.
 137|    - Continue empagliflozin 10 mg PO daily for cardioprotection.
 138|    - Continue potassium chloride 20 mEq PO daily.
 139| 2. Fluid and Dietary Counseling:
 140|    - Strict 2000 mg sodium and 1.5 L fluid limits reinforced.
 141|    - Instructed patient and wife Eleanor to record morning weights daily.
 142|    - Call clinic if weight increases by > 3 lbs in 24 hours.
 143| 3. Monitoring and Follow-Up:
 144|    - Repeat BMP in 10 to 14 days.
 145|    - Return to Outpatient Cardiology Clinic in four weeks.
 146|    - Educational resources available at
 147|      https://portal.example.org/chf-care.
 148| 
 149| Care Team Signoff:
 150| Electronically signed by:
 151| Kavita Chadha, MD, Resident Physician
 152| Rohit Bansal, MD, Cardiology Fellow
 153| Gurpreet S. Sandhu, MD, Attending Cardiologist
 154| Clinic Primary Contact: Preeti Dhillon, RN
 155| Oakhaven Regional Hospital Cardiovascular Institute
=== END DOCUMENT ===
ITEMS FOR fd-0207:
D1 | line 35 | A: KEEP "stage 3a\nchronic kidney disease" | B: KEEP "chronic kidney disease"
D2 | line 44 | A: NAME "Faulkner" | B: (nothing)
K1 | line 35 | KEEP "LVEF 30%"
K2 | line 35 | KEEP "stent"
K3 | line 38 | KEEP "volume overload"
K4 | line 40 | KEEP "net fluid balance of -4.2\nliters"
K5 | line 41 | KEEP "weight to 84.2 kg"
K6 | line 49 | KEEP "weight this morning was 84.5 kg"
K7 | line 49 | KEEP "2000 mg"
K8 | line 49 | KEEP "daily"
K9 | line 50 | KEEP "1.5 L"
K10 | line 66 | KEEP "LVEF 30%"
K11 | line 67 | KEEP "drug-eluting stent to LAD"
K12 | line 78 | KEEP "at bedtime"
K13 | line 86 | KEEP "Vital Signs"
K14 | line 87 | KEEP "oral"
K15 | line 97 | KEEP "Jugular venous pulse estimated at 7 cm H2O"
K16 | line 107 | KEEP "Serum Chemistry and Hematology"
K17 | line 118 | KEEP "Normal sinus rhythm"
K18 | line 118 | KEEP "70 bpm"
K19 | line 118 | KEEP "PR interval 168 ms"
K20 | line 118 | KEEP "QRS duration 106 ms"
K21 | line 119 | KEEP "Old anterior infarct pattern"
K22 | line 120 | KEEP "ST elevations"
K23 | line 127 | KEEP "Essential hypertension"
K24 | line 128 | KEEP "eGFR"
K25 | line 131 | KEEP "Heart Failure Medical Regimen"
K26 | line 139 | KEEP "Fluid and Dietary Counseling"
K27 | line 140 | KEEP "2000 mg"
K28 | line 140 | KEEP "1.5 L"
K29 | line 143 | KEEP "Monitoring and Follow-Up"
K30 | line 144 | KEEP "BMP"
K31 | line 149 | KEEP "Care Team Signoff"

=== DOCUMENT fd-0213 ===
   1| CALL LOG RECORDING - SPECIALTY CLINIC
   2| RECORDING ID: 7391 0482 19
   3| DATE: 18 Oct 2026
   4| FACILITY: Silver Lake Clinic
   5| COVERING PROVIDERS: Dr. Fox, Dr. Zhang Yong-Kang, Lin Wei-Chen, RN
   6| CALLER: Chen Xiao-Mei (daughter-in-law)
   7| PATIENT: Lương Văn Phát
   8| DOB: 12 Jan 1934
   9| AGE: 92-year-old male
  10| 
  11| [Audio Recording Transcript]
  12| 
  13| Lin Wei-Chen, RN: Silver Lake Clinic nursing line, this is Wei-Chen,
  14| how, um, how can I help you today?
  15| 
  16| Chen Xiao-Mei: Hello, yes, uh, good morning. I'm calling about my
  17| father-in-law, Mr. Lương Văn Phát. He, uh, he had a transcatheter
  18| aortic valve replacement about two weeks ago, and we're looking at
  19| his home care schedulign sheet, but we're confused about his
  20| warfarin dosgae.
  21| 
  22| Lin Wei-Chen, RN: Okay, let me bring up Mr. Phát's record. You said
  23| his name is Lương Văn Phát, DOB 12 Jan 1934?
  24| 
  25| Chen Xiao-Mei: Yes, that is correct. He is a 92-year-old gentleman, and
  26| he lives in San Jose with my husband and me.
  27| 
  28| Lin Wei-Chen, RN: Alright, I have his file right here. Can you verify
  29| his current home address for security?
  30| 
  31| Chen Xiao-Mei: It is 620 Forest Ridge Drive, San Jose, CA 95129. I also
  32| sent it on the patient portal earlier in lowercase as 620 forest ridge
  33| drive just in case you needed to update it.
  34| 
  35| Lin Wei-Chen, RN: Perfect, thank you. And what is your callback number?
  36| 
  37| Chen Xiao-Mei: You can reach me on my cell phone. It is, uh, let me read
  38| it slowly: four one five, five five five, zero one three six.
  39| 
  40| Lin Wei-Chen, RN: Thank you, let me read that back: four one five,
  41| five five five, zero one three six. I have it written in the intake
  42| form as 415–555–0136 with a direct tag to your profile. Now,
  43| regarding his warfarin, what did his discharge instructions say?
  44| 
  45| Chen Xiao-Mei: Well, uh, his discharge summary said warfarin 2.5 mg PO
  46| daily in the evening, but then Dr. Fox, who covered for Dr. Zhang over
  47| the weekend, told us after his lab draw that his INR was 1.6, which
  48| was, uh, which was subtherapeutic. The target range was 2.0 to 3.0
  49| for his valve. Dr. Fox wrote an updated prescription under NPI:
  50| 1942850192 for warfarin 5 mg PO on Mondays and Thursdays, and 2.5 mg
  51| on the other days. We just wanted to confirm if today, Monday, he
  52| should take the 5 mg."
  53| 
  54| Lin Wei-Chen, RN: Let me check the care team communication note from
  55| this morning. Yes, Dr. Fox and Dr. Zhang Yong-Kang both reviewed his
  56| recent transthoracic echocardiogram and that INR result. Dr. Fox noted
  57| that Mr. Lương should indeed take warfarin 5 mg tonight, and then have
  58| a repeat prothrombin time and INR drawn on Wednesday. Also, his chart
  59| mentions that his primary cardiologist, Dr. Zhang, signed off on the
  60| tapered adjustment. The attending list here shows Dr. Fox, Dr. Zhang
  61| Yong-Kang, and our clinical pharmacist all agreed on the plan.
  62| 
  63| Chen Xiao-Mei: Oh, that makes sense. We, we were just nervous because
  64| at 92 years old, any change in blood thinner makes us worry about
  65| bleeding or bruising. He had, uh, he had a tiny nosebleed yesterday,
  66| just a few drops, but it stopped right away when we pinched his nose.
  67| 
  68| Lin Wei-Chen, RN: Good, I'm glad it stopped quickly. Did he have any
  69| dark stools, coughing up blood, or sudden weakness?
  70| 
  71| Chen Xiao-Mei: No, nothing like that at all. His vitals this morning
  72| were blood pressure 134/78 mmHg, heart rate 72 bpm, oxygen saturation
  73| 98% on room air, and weight 61.2 kg. His congestive heart failure
  74| symptoms seem stable; no shortness of breath when lying flat.
  75| 
  76| Lin Wei-Chen, RN: Those vitals look very reassuring. For his
  77| follow-up, we have his next clinic appoitment scheduled with
  78| Dr. Zhang on Friday. Dr. Fox will also be covering the
  79| anticoagulation clinic that morning. In his chart, I've noted that
  80| caregiver C.X.M. called and confirmed the dose. If he has any active
  81| bleeding or dizziness, call us immediately or go to the nearest
  82| emergency room.
  83| 
  84| Chen Xiao-Mei: Thank you so much, Wei-Chen. That clarifies
  85| everything. We will give him the 5 mg dose tonight. Have a wonderful
  86| day.
  87| 
  88| Lin Wei-Chen, RN: You are very welcome, Mrs. Chen. Take care,
  89| goodbye.
  90| 
  91| [End of Call]
=== END DOCUMENT ===
ITEMS FOR fd-0213:
D1 | line 13 | A: CLINICIAN "Lin Wei-Chen" | B: (nothing)
D2 | line 28 | A: (nothing) | B: CLINICIAN "Lin Wei-Chen"
K1 | line 43 | KEEP "warfarin"
K2 | line 47 | KEEP "lab draw"
K3 | line 47 | KEEP "INR was 1.6"
K4 | line 48 | KEEP "2.0 to 3.0"
K5 | line 50 | KEEP "on Mondays and Thursdays"
K6 | line 51 | KEEP "on the other days"
K7 | line 52 | KEEP "5 mg"
K8 | line 56 | KEEP "INR"

=== DOCUMENT fd-0225 ===
   1| LILY: Pine Hollow Pharmacy, this is Lily Brennan. Uh, tech line. Who am I pulling up?
   2| CALLER: Hi, it's Luísa Conceição. I'm calling for my mother, Clémence de la Serigny. The sign-in from this morning was written de la Serigny, Clémence. I recieved a text that the prior auth is stuck.
   3| LILY: Okay, give me one second. MRN: 6621904. I have her as a 58-year-old. Member number WLP-2291845. Is that the plan you have on the card?
   4| CALLER: Yes. That's the one. Dr. Cushing, Edward Cushing, wrote the adalimumab. His office said the auth runs through March 2026, and the next infusion, no, it's an injection, is on March 4, 2026. She said it out loud to me as March fourth, twenty twenty-six, so I woudln't forget. On the bottle the date is printed 3/4/26.
   5| LILY: I see 3/4/26 on the label too. Cushing's note says rheumatoid arthritis, failed methotrexate at a full dose, and a negative workup for Cushing syndrome. The syndrome and the clinician are, um, obviously not the same person. He wrote that the urinary free cortisol was normal, so nobody should treat her as if she has Cushing syndrome.
   6| CALLER: Good, because the name kept confusing my aunt. She had a left carpal tunnel release two winters ago, and a screening colonoscopy the year before that. Current list is rheumatoid arthritis, steroid-induced hyperglycemia, and osteoporosis. Her right knee was aspirated in the clinic. No crystals on the smear. They called it a rheumatoid flare rather than a septic joint. There is no plan for a total knee arthroplasty. The swelling is worse in the morning and better after she moves.
   7| LILY: Meds I show: methotrexate 15 mg PO weekly, folic acid 1 mg PO daily, prednisone 5 mg PO daily, and adalimumab 40 mg subcutaneous every 2 weeks. Calcium with vitamin D is over the counter. Lily's screen, sorry, my screen, also shows a hold if the white count drops. Aspiration is on the procedure list under the colonoscopy and the carpal tunnel release.
   8| CALLER: They also did a tuberculosis screen before the adalimumab. The quantiferon was negative, and the hepatitis B surface antigen was negative. She had a chest radiograph with no old granuloma. Last CBC was fine, she said. They do the injection at the clinic, not here. Can you fax the auth packet so Dr. Cushing's nurse has it before March 4, 2026?
   9| LILY: I see that. Last creatinine was 0.8 mg/dL, ALT 22 U/L, and white count 6.4 K/uL. Blood pressure at the last visit was 128/74 mmHg, heart rate 76. No live vaccines while she is on adalimumab. The shingles vaccine she already finished can stay on the list. Fax number I have for the office is Fax 360-555-0133. I'll send the approval and the medication list. Home address on the prescription is 907 West Briar Street, Lumen Falls, WA 98520. The text she forwarded, the one in lowercase, says deliver instead to 14 poplar court, lumen falls. Which one is right?
  10| CALLER: 14 poplar court is my house. She stays with me the week of the injection because the methotrexate makes her queasy. Her own phone is 360-555-0148 if the driver needs the gate code. Please don't seperate the folic acid from the methotrexate or she will take one and forget the other.
  11| LILY: Noted on de la Serigny's profile. I'll tell Ned Haskill, the pharmacist on duty, that the ship-to is 14 poplar court, lumen falls, and that the member number WLP-2291845 has to be on the claim. I will not let the pharmacy substitute the adalimumab for a biosimilar unless Edward Cushing signs it. He was asking why the auth expired.
  12| CALLER: It expired because nobody sent the joint count. Her hands are swollen most mornings. She is 58, she still works, and she does not want the prednisone increased. Occassionally she skips the prednisone when her glucose is high. I told her not to.
  13| LILY: Please don't skip. Prednisone 5 mg PO daily is a fixed dose, not a sliding scale. If glucose is high, call Edward Cushing's office rather than stopping it. Adalimumab stays 40 mg subcutaneous every 2 weeks as long as the auth for March 2026 is honored. The visit on March fourth, twenty twenty-six is the one they will bill.
  14| CALLER: Can you read the chart header back so I know you are in the right record?
  15| LILY: de la Serigny, Clémence. MRN: 6621904. Date on the label 3/4/26. Fax 360-555-0133 for the office. Phone 360-555-0148. I think that's the whole string.
  16| CALLER: Thank you. Uh, one more thing. If Ned Haskill wants to talk to her directly, she is home after four. She gets tired of me being the one on the phone.
  17| LILY: I'll leave that for Ned Haskill. Thanks for calling Pine Hollow Pharmacy.
=== END DOCUMENT ===
ITEMS FOR fd-0225:
D1 | line 6 | A: KEEP "left carpal tunnel release" | B: KEEP "carpal tunnel release"
D2 | line 6 | A: KEEP "screening colonoscopy" | B: KEEP "colonoscopy"
D3 | line 7 | A: KEEP "Calcium" ; KEEP "vitamin D" | B: KEEP "Calcium with vitamin D"
K1 | line 4 | KEEP "infusion"
K2 | line 4 | KEEP "injection"
K3 | line 5 | KEEP "urinary free cortisol was normal"
K4 | line 6 | KEEP "No crystals on the smear"
K5 | line 7 | KEEP "white count" [labeler unsure]
K6 | line 8 | KEEP "quantiferon was negative"
K7 | line 8 | KEEP "hepatitis B surface antigen was negative"
K8 | line 8 | KEEP "granuloma"
K9 | line 8 | KEEP "CBC was fine"
K10 | line 8 | KEEP "injection"
K11 | line 9 | KEEP "live vaccines" [labeler unsure]
K12 | line 10 | KEEP "injection"
K13 | line 11 | KEEP "biosimilar" [labeler unsure]
K14 | line 12 | KEEP "glucose is high"
K15 | line 13 | KEEP "glucose is high"

=== DOCUMENT fd-0230 ===
   1| 8830142
   2| Heart and Vascular Center of Linden
   3| Outpatient Progress Note
   4| 
   5| Patient: Ifeoma
   6| Hunter
   7| Date of service: the 4th of March
   8| Author: Dr. Pascale de la Croix
   9| Fax: (312) 555-0140
  10| Address: 14 Magnolia Court, Apt 3, Linden, OH 43002
  11| 
  12| The referral page was scanned at an angle. The prior record
  13| reads lO88321, and registration will confirm it before old
  14| notes are merged.
  15| 
  16| Chief complaint
  17| Follow-up of type 2 diabetes and hypertension, plus a family question.
  18| 
  19| History of present illness
  20| She is a 58-year-old woman seen for routine management of type 2
  21| diabetes and hypertension. Morning glucoses at home ran mostly
  22| from 140 to 180 mg/dL from March 1 through March 3, above her
  23| usual range near 110 mg/dL. She ran out of metformin for four
  24| days during that stretch and has restarted 1000 mg by mouth
  25| twice daily with meals. She denies chest pain, dyspnea,
  26| orthopnea, edema, and polyuria today. Toe numbness is stable
  27| and not painful. Her husband, Mr. Spyros Vlahakis, came with
  28| her and confirms the gap in the metformin.
  29| 
  30| She asked whether a nephew's Hunter syndrome means she needs testing.
  31| She has no clinical features of Hunter syndrome, no
  32| developmental history suggesting a mucopolysaccharidosis,
  33| and the diagnosis belongs to the child, not to her. No carrier
  34| testing was ordered.
  35| 
  36| Past medical history
  37| Type 2 diabetes mellitus for twelve years. Hypertension. Obesity.
  38| Dyslipidemia. No coronary disease, no stroke, and no known kidney disease.
  39| 
  40| Medications
  41| 1. Metformin 1000 mg by mouth twice daily.
  42| 2. Lisinopril 20 mg by mouth daily.
  43| 3. Atorvastatin 40 mg by mouth at bedtime.
  44| 4. Aspirin 81 mg by mouth daily.
  45| 
  46| Allergies
  47| No known drug allergies.
  48| 
  49| Social history
  50| She works as a cafeteria supervisor and is on her feet much of the day.
  51| She does not smoke. Alcohol is a glass of wine on some weekends.
  52| She lives with her husband in the apartment listed above.
  53| She walks the parking lot at work after the lunch service
  54| when the weather allows.
  55| 
  56| Review of systems
  57| No chest pain, no visual change, no foot ulcer, no dysuria,
  58| and no depression symptoms she wanted to discuss.
  59| The rest is negative.
  60| 
  61| Physical examination
  62| Blood pressure 148/86 mmHg, heart rate 76, respiratory rate 14,
  63| temperature 98.0 F, oxygen saturation 99 percent on room air, weight 92 kg.
  64| She is comfortable. Lungs are clear, heart is regular without murmur, and there is no edema.
  65| Monofilament sensation is reduced at both great toes.
  66| Skin on the feet is intact. No carotid bruit.
  67| 
  68| Laboratory results from this morning
  69| Hemoglobin A1c 8.1 percent. Creatinine 0.8 mg/dL.
  70| eGFR above 60 mL/min/1.73 m2. Potassium 4.1 mmol/L.
  71| LDL cholesterol 118 mg/dL. Urine albumin-to-creatinine ratio 18 mg/g.
  72| Fingerstick glucose in the office was 162 mg/dL.
  73| 
  74| Assessment and plan
  75| 1. Type 2 diabetes, above the A1c goal. Metformin has been restarted.
  76| Continue 1000 mg twice daily and add empagliflozin 10 mg by mouth
  77| each morning for heart and kidney benefit. Recheck the A1c in three months.
  78| We talked through a short walk after supper and smaller evening portions.
  79| Sick-day rules were reviewed: hold the new agent and the metformin
  80| if she cannot keep fluids down, and call for vomiting that
  81| lasts more than a day. Footwear at work should be closed-toe.
  82| 2. Hypertension, above goal today. Continue lisinopril 20 mg daily.
  83| She will bring home readings to the next visit in four weeks.
  84| 3. Dyslipidemia. Continue atorvastatin 40 mg.
  85| LDL remains above 100 mg/dL. We will recheck it once doses are
  86| steady before raising the statin.
  87| 4. The nephew's Hunter syndrome does not change today's plan
  88| and is not her diagnosis.
  89| Lab results will be posted at https://portal.example.net/lab/hunter.
  90| 
  91| Electronically signed by Dr. Pascale de la Croix
  92| Endocrinology
=== END DOCUMENT ===
ITEMS FOR fd-0230:
K1 | line 22 | KEEP "140 to 180 mg/dL"
K2 | line 23 | KEEP "110 mg/dL"
K3 | line 25 | KEEP "with meals"
K4 | line 33 | KEEP "carrier\ntesting"
K5 | line 72 | KEEP "Fingerstick glucose in the office was 162 mg/dL"
K6 | line 85 | KEEP "LDL remains above 100 mg/dL"

=== DOCUMENT fd-0233 ===
   1| To the medical review team,
   2| 
   3| The clinic is requesting continued coverage of pregabalin, dispensed as Lyrica, for a 67-year-old woman with painful diabetic periphreal neuropathy and a history of Graves disease diagnosed in 2019. She is now euthyroid on methimazole. The covering pharmacist revieweed the regimen before this letter was sent. Her daughter helps with the pill box but does not manage dosing decisions.
   4| 
   5| Current medications include Lyrica 75 mg PO BID, methimazole 5 mg PO daily, metformin 1000 mg PO BID, and atorvastatin 40 mg PO nightly. Duloxetine was tried previously and stopped for nausea. Please do not substitute a different brand without checking the methimazole dose, becuase a gap would risk recurrence of hyperthyroidism.
   6| 
   7| Recent results from the clinic laboratory: TSH 1.8 mIU/L, free T4 1.2 ng/dL, hemoglobin A1c 7.4%, creatinine 0.9 mg/dL, and eGFR 78 mL/min/1.73 m2. Vitals recorded with those laboratories were blood pressure 128/74 mmHg, heart rate 72 beats per minute, weight 71 kg, and temperature 36.7 C. The foot examination showed reduced monofilament sensation at the great toes bilaterally. She has no new ulcer, and pedal pulses are palpable.
   8| 
   9| We ask that coverage of Lyrica 75 mg PO BID continue while glucose control is tightend. A generic pregabalin capsule is acceptable if the milligram strength matches. The patient was counseled on dizziness and edema and told to call the clinic for swelling, rash, or a resting heart rate above 100. Thank you for reviewing this request.
  10| 
  11| The covering pharmacist
  12| Ambulatory care
=== END DOCUMENT ===
ITEMS FOR fd-0233:
D1 | line 3 | A: KEEP "painful diabetic periphreal neuropathy" | B: KEEP "diabetic periphreal neuropathy"
K1 | line 7 | KEEP "foot examination"
K2 | line 7 | KEEP "ulcer"

=== DOCUMENT fd-0236 ===
   1| MEDICATION RECONCILIATION
   2| Patient: BECKWITH, SYLVIA
   3| DOB: 04/17/1958
   4| MRN: 7044182
   5| Age: 68 years
   6| Date: 11/03/2026
   7| Prescriber: Malcolm Ashby, MD
   8| NPI: 1473829054
   9| Caregiver email: c.difranco@example.com
  10| 
  11| The patient was reviewed by phone with her daughter, Caterina Di Franco, who is the caregiver listed on the profile and who manages the pill box. She is followed at Larkspur Heart and Vascular Center for heart failure with reduced ejection fraction, last ejection fraction 35 percent, and for coronary disease treated medically. She is not short of breath at rest. She can walk to the mailbox and back, stopping once. Ankles show trace edema by her daughter's report. No chest pain this week, no orthopnea on two pillows, and weight is down about two pounds from her usual baseline after she cut back on soup.
  12| 
  13| Home list, reconciled to the bottles she read:
  14| sacubitril-valsartan 49-51 mg by mouth twice daily
  15| carvedilol 12.5 mg by mouth twice daily
  16| spironolactone 25 mg by mouth daily
  17| empagliflozin 10 mg by mouth daily
  18| atorvastatin 40 mg by mouth at bedtime
  19| aspirin 81 mg by mouth daily
  20| furosemide 20 mg by mouth daily as needed for a three-pound weight gain
  21| 
  22| The daughter read each label. Sacubitril-valsartan was started after an ACE inhibitor was stopped, with a 36-hour washout, which she remembers. She has not recieved a potassium result since the spironolactone was increased, so the clinic was asked to draw a basic metabolic panel before the next refill cycle. Blood pressure at home this morning was 118/70 and the pulse was 64. She is not dizzy on standing. Empagliflozin caused one yeast infection early in treatment, since resolved, and she wants to continue it.
  23| 
  24| The prescriber's NPI on the hard copy matches the number above. The daughter can be reached at the email on the header if a letter is needed for sacubitril-valsartan; the health plan already approved it through the end of the year, and no new form is required unless the strength changes. She was advised not to use ibuprofen for knee pain and to use acetaminophen instead, because an NSAID fits poorly with heart failure and with the loop diuretic. She will seperate the as-needed furosemide from the daily box so it is not taken every morning by habit.
  25| 
  26| No allergy to these agents is known. Penicillin caused a rash in childhood and is already on the profile. The reconcilation was filed, and the office was asked to send the lab order. Aspirin and atorvastatin can be dispensed now. The remaining monthly fill waits until the panel is back so the potassium and creatinine can be seen before spironolactone and the diuretic are released. Counseling covered rise-slowly precautions, daily weights, and a call to the clinic for a gain of three pounds or more, for waking short of breath, or for swelling that leaves a pit. Salt substitute products that contain potassium were discouraged while spironolactone is on the list.
=== END DOCUMENT ===
ITEMS FOR fd-0236:
D1 | line 20 | A: KEEP "daily" ; KEEP "as needed" | B: KEEP "daily as needed"
D2 | line 22 | A: KEEP "Blood pressure at home this morning was 118/70" | B: KEEP "118/70" [unsure]
K1 | line 22 | KEEP "pulse was 64"
K2 | line 24 | KEEP "as-needed"
K3 | line 24 | KEEP "every morning"

=== DOCUMENT fd-0240 ===
   1| BRIGHTWATER HOSPITAL
   2| Discharge Summary
   3| 
   4| Patient: EIRÍNI TZAMALAS
   5| DOB: 1930-01-15
   6| Account no.: 8833412
   7| Admitted: 2026-03-04
   8| Discharged: 2026-03-09
   9| 
  10| Mrs. Eiríni Tzamalas is a ninety-six years old woman who was admitted to Brightwater Hospital on 2026-03-04 with fever, cough, and an increased oxygen need. Her daughter, Mrs. Clare Pendleton, reported three days of a wet cough, poorer intake, and a new tendency to cough while drinking thin liquids. There was no chest pain and no new unilateral weakness.
  11| 
  12| She has longstanding Parkinson disease, followed by Dr. Ruth Gable, with bradykinesia, a soft voice, and a shuffling gait. Carbidopa-levodopa has been stable. She also has hypothyroidism and osteoarthritis of the knees. She does not smoke. She lives with Mrs. Clare Pendleton.
  13| 
  14| Medications at home were carbidopa-levodopa 25-100 mg by mouth three times daily, levothyroxine 75 mcg by mouth each morning, and acetaminophen as needed. There is no drug allergy.
  15| 
  16| On arrival her temperature was 38.2 C, pulse 98 beats per minute, blood pressure 142/78 mmHg, respiratory rate 22, and oxygen saturation 89 percent on room air, rising to 95 percent on 2 liters by nasal cannula. She was awake and oriented to person. Lung sounds had crackles at the right base. There was resting tremor of the hands and increased tone, unchanged by her daughter's account. The examination showed no meningismus.
  17| 
  18| A chest radiograph showed a right lower lobe infiltrate. The leukocyte count was 13.6 K/uL, creatinine 0.9 mg/dL, and sodium 136 mmol/L. Blood cultures were drawn before antibiotics and remained negative. A swallow evaluation on 2026-03-06 found delayed initiation and penetration of thin liquids without aspiration of nectar-thick liquids.
  19| 
  20| She recieved ceftriaxone 1 g intravenously daily and azithromycin 500 mg by mouth daily for community-acquired pneumonia, with concern for aspiration given the Parkinson disease and the cough with liquids. Fever resolved on the second day. Oxygen was weaned to room air. A seperate speech pathology note advised nectar-thick liquids and an upright position for meals. Carbidopa-levodopa was given on her usual schedule, and no doses were missed. The episode of coughing with water occured less often once the liquid consistency was changed.
  21| 
  22| Discharge diagnoses are aspiration pneumonia and Parkinson disease. She left on 2026-03-09 with her daughter, walking with a walker, afebrile, and saturating 96 percent on room air.
  23| 
  24| Discharge medicines:
  25| 1. Amoxicillin-clavulanate 875-125 mg by mouth twice daily for two more days, to complete a seven-day course. Prescription number 2201784 was sent to the daughter's preferred pharmacy.
  26| 2. Carbidopa-levodopa 25-100 mg by mouth three times daily. Continue.
  27| 3. Levothyroxine 75 mcg by mouth each morning on an empty stomach. Continue.
  28| 4. Acetaminophen 650 mg by mouth every six hours as needed for pain.
  29| 
  30| Code status is full treatment, confirmed with Mrs. Clare Pendleton on admission. Physical therapy cleared her to walk in the home with the walker she already uses. No new imaging is planned unless fever or cough returns. The amoxicillin-clavulanate should be taken with food to limit nausea.
  31| 
  32| Please follow up with Dr. Ruth Gable within two weeks for the Parkinson disease, and sooner for fever, worse cough, confusion, or a fall. Dr. Samuel Parkinson is available to the specialist by phone at (508) 555-0133 ext. 214 if questions about the admission arise before that visit.
  33| 
  34| Home address for the chart: 14 Olive Court, Apt 3B, Lindell, Massachusetts 02590.
  35| 
  36| Dictated by Dr. Samuel Parkinson, Hospital Medicine, Brightwater Hospital.
=== END DOCUMENT ===
ITEMS FOR fd-0240:
K1 | line 16 | KEEP "oxygen saturation 89 percent"
K2 | line 16 | KEEP "95 percent"
K3 | line 16 | KEEP "2 liters"
K4 | line 16 | KEEP "by nasal cannula"
K5 | line 18 | KEEP "chest radiograph"
K6 | line 18 | KEEP "right lower lobe infiltrate"
K7 | line 18 | KEEP "Blood cultures"
K8 | line 18 | KEEP "aspiration"
K9 | line 20 | KEEP "aspiration"
K10 | line 20 | KEEP "Oxygen"
K11 | line 20 | KEEP "speech pathology"
K12 | line 22 | KEEP "96 percent"
K13 | line 30 | KEEP "Physical therapy"
K14 | line 36 | KEEP "Hospital Medicine"

=== DOCUMENT fd-0241 ===
   1| Date of Service: 18 Sep 2026
   2| Record: 7360 4418 25
   3| 
   4| To the medical review desk,
   5| 
   6| Please approve the next pharmacy fill of oral apixaban for Selamawit
   7| Cherenet and keep this note at Meadow Brook Clinic. She is 58 years old.
   8| A leg ultrasound showed a popliteal deep vein thrombosis. Before that
   9| study the Wells score was 4, so imaging was obtained directly rather
  10| than stopping at a d-dimer. Swelling began after a long car ride in her
  11| sister Iris Holcomb's car.
  12| 
  13| A portal session about the ultrasound was opened from 203.0.113.18.
  14| If that address was not expected, reset the password before any result
  15| is discussed by phone. The number on file is (505) 555-0133. Please use
  16| that number rather than one left in a voicemail.
  17| 
  18| Please also note the examination that accompanied the ultrasound.
  19| The left calf measured 3.5 cm larger than the right at a point 10 cm
  20| below the tibial tuberosity. Pitting edema was limited to the left ankle.
  21| Pedal pulses were present. She was not short of breath at rest, the lungs
  22| were clear, and the heart rate was regular at 76 beats per minute.
  23| Blood pressure was 134/82 mmHg. Oxygen saturation was 97 percent on room
  24| air. There was no chest pain. A d-dimer was drawn earlier at the clinic
  25| and was elevated, which fit the decision to image. Creatinine that morning
  26| was 0.8 mg/dL and hemoglobin was 13.1 g/dL, both acceptable before
  27| anticoagulation. No heparin drip and no enoxaparin bridge were required
  28| because apixaban was started at once.
  29| 
  30| The regimen to continue is apixaban 10 mg PO BID for seven days, then
  31| apixaban 5 mg PO BID. The higher dose began on the day of the ultrasound.
  32| Do not add aspirin. Ibuprofen and naproxen should be avoided.
  33| Acetaminophen 500 mg PO q6h PRN may be used for calf pain, not more than
  34| 3000 mg in a day. She also takes amlodipine 5 mg PO daily and atorvastatin
  35| 20 mg PO nightly. Those do not need a change for this clot.
  36| Bleeding precautions were reviewed. Black stool, vomiting blood, a severe
  37| headache of sudden onset, or a fall with head injury should prompt urgent
  38| contact. A missed dose of apixaban may be taken if it is remembered the
  39| same day. Do not double the next dose.
  40| 
  41| Walking inside the home is encouraged. She should not massage the calf.
  42| A compression stocking may be used if it is comfortable, and it does not
  43| replace the anticoagulant. How long to continue apixaban will be decided
  44| at the follow-up visit after the trip is discussed. If the clot is judged
  45| provoked and no cancer or earlier clot is found, a finite course is
  46| likely. If it is unprovoked, a longer course will be considered. No
  47| thrombolysis and no inferior vena cava filter are planned.
  48| 
  49| Please send written approval to 418 Maple Terrace, Fairmeadow, MT 59799,
  50| and place a copy in the chart. The signing clinician will answer questions
  51| from the health plan reviewer. Her sister may pick up printed instructions
  52| if the release on file already names her. Thank you for completing this
  53| review without holding the fill.
  54| 
  55| Dr. Aoife McNally-Kehoe
  56| Meadow Brook Clinic
=== END DOCUMENT ===
ITEMS FOR fd-0241:
K1 | line 9 | KEEP "imaging"
K2 | line 20 | KEEP "Pitting edema"
K3 | line 45 | KEEP "cancer"

=== DOCUMENT fd-0242 ===
   1| INPATIENT CONSULTATION NOTE
   2| SERVICE: CARDIOLOGY CONSULTATION SERVICE
   3| REASON FOR CONSULTATION: Acute decompensated heart failure management and
   4| medication optimization in the setting of ischemic cardiomyopathy.
   5| 
   6| HISTORY OF PRESENT ILLNESS:
   7| The patient is a 72-year-old male with a significant cardiac history including
   8| ischemic cardiomyopathy status post three-vessel coronary artery bypass
   9| grafting in 2018, persistent atrial fibrillation, and Graves disease who was
  10| admitted through the emergency department with worsening dyspnea on exertion,
  11| orthopnea, and progressive lower extremity edema over the past two weeks. He
  12| reports awakening with sudden shortness of breath requiring three pillows to
  13| sleep comfortably. Outside Hospital records indicate an admission in 2022 for
  14| a similar heart failure exacerbation, at which time a transthoracic
  15| echocardiogram demonstrated a left ventricular ejection fraction of 30% with
  16| severe anterior and apical hypokinesis.
  17| 
  18| Prior to admission, the patient was toleratting his home cardiac regimen
  19| without difficulty, but notes poor adherence over the past holiday period due
  20| to increased dietary sodium intake. In addition, the patient has a history of
  21| post-herpetic neuralgia along the right T6 dermatome, for which he takes Lyrica
  22| with modest relief. He has had no chest pressure, syncope, fevers, or cough.
  23| His wife reports that his functional exercise tolerance has dropped from
  24| walking several blocks to struggling with simple household transfers.
  25| 
  26| PAST MEDICAL AND SURGICAL HISTORY:
  27| 1. Ischemic cardiomyopathy (NYHA Class III, Stage C), diagnosed in 2017.
  28| 2. Coronary artery bypass graft x3 in 2018 (LIMA-LAD, SVG-OM1, SVG-PDA).
  29| 3. Persistent atrial fibrillation, rate-controlled.
  30| 4. Graves disease, diagnosed in 2020, clinically euthyroid on therapy.
  31| 5. Post-herpetic neuralgia affecting right thoracic wall.
  32| 6. Chronic stasis dermatitis of bilateral lower extremities.
  33| 
  34| CURRENT INPATIENT MEDICATIONS:
  35| 1. Furosemide 80 mg IV BID (initiated upon admission).
  36| 2. Sacubitril/valsartan 24/26 mg PO BID.
  37| 3. Carvedilol 12.5 mg PO BID.
  38| 4. Spironolactone 25 mg PO daily.
  39| 5. Apixaban 5 mg PO BID.
  40| 6. Methimazole 5 mg PO daily.
  41| 7. Lyrica 50 mg PO TID.
  42| 8. Prednisone 40/30/20/10 mg oral taper prescribed by the outpatient clinic
  43|    for a severe flare of inflammatory dermatosis, currently on 10 mg daily.
  44| 9. Heparin 5000 units subcutaneous q8h (held while on apixaban).
  45| 
  46| PHYSICAL EXAMINATION:
  47| Vitals: BP 114/72 mmHg, HR 68 bpm (irregularly irregular), RR 18 /min,
  48| temperature 98.6 F, SpO2 96% on 2 L/min oxygen via nasal cannula.
  49| General: Moderately ill-appearing male resting in bed with head elevated at
  50| 45 degrees, conversant in full sentences without overt respiratory distress.
  51| HEENT: Normocephalic, no scleral icterus. Mild proptosis secondary to Graves
  52| disease without active conjunctival injection or ophthalmoplegia.
  53| Neck: Jugular venous distension noted at 8 cm above the sternal notch at 45
  54| degrees. Carotid upstrokes normal bilaterally without audible bruits.
  55| Cardiovascular: Irregular rhythm, normal S1, physiologically split S2, S3
  56| gallop appreciated at the apex. Soft 2/6 holosystolic murmur at the lower left
  57| sternal border.
  58| Pulmonary: Bibasilar fine inspiratory crackles extending through the lower
  59| one-third of both lung fields. No wheezing or rhonchi.
  60| Abdomen: Soft, mildly distended, non-tender. Hepatojugular reflux positive.
  61| Extremities: 3+ pitting edema extending bilaterally to mid-calf with chronic
  62| hyperpigmentation and mild weeping skin changes. Peripheal pulses 1+ at the
  63| posterior tibial arteries bilaterally.
  64| Neurologic: Alert, oriented to person, place, and year. Non-focal exam.
  65| 
  66| LABORATORY AND DIAGNOSTIC DATA:
  67| Serum sodium 137 mEq/L, potassium 4.4 mEq/L, chloride 101 mEq/L, bicarbonate
  68| 23 mEq/L, BUN 28 mg/dL, serum creatinine 1.3 mg/dL, eGFR 58 mL/min/1.73m2.
  69| Total bilirubin 0.9 mg/dL, AST 24 U/L, ALT 22 U/L. Serum troponin I <0.02
  70| ng/mL (negative x2). NT-proBNP 2480 pg/mL (elevated). Free T4 1.2 ng/dL,
  71| thyroid-stimulating hormone 1.8 mIU/L.
  72| Electrocardiogram: Atrial fibrillation with controlled ventricular response,
  73| mean heart rate 70 bpm, left bundle branch block, QRS duration 148 ms.
  74| Chest Radiography: Cardiomegaly with pulmonary vascular congestion, prominent
  75| interstitial markings, and small blunting of bilateral costophrenic angles.
  76| 
  77| ASSESSMENT AND PLAN:
  78| Acute decompensated biventricular heart failure in a 72-year-old male with
  79| known ischemic cardiomyopathy, reduced ejection fraction, and baseline atrial
  80| fibrillation, provoked primarily by dietary noncompliance and volume overload.
  81| 1. Volume Overload / Decongestion:
  82| - Continue aggressive intravenous diuresis with furosemide 80 mg IV BID.
  83| - Maintain strict intake and output recording and daily standing weights.
  84| - Goal net fluid removal of 1.5 to 2.0 liters over the next 24 hours.
  85| - Monitor basic metabolic panel every 12 hours during active titration.
  86| 2. Guideline-Directed Medical Therapy:
  87| - Continue sacubitril/valsartan at current dose; defer upward titration until
  88|   euvolumic state is approached and renal function stabilizes.
  89| - Continue carvedilol 12.5 mg PO BID; heart rate is appropriately controlled.
  90| - Continue spironolactone 25 mg PO daily with close monitoring of potassium.
  91| 3. Anticoagulation & Comorbidities:
  92| - Continue apixaban 5 mg PO BID for systemic thromboembolism prophylaxis.
  93| - Maintain methimazole 5 mg PO daily for Graves disease.
  94| - Complete final day of prednisone taper (10 mg PO daily) then discontinue.
  95| - Continue Lyrica 50 mg PO TID for neuropathic symptoms.
  96| - Inpatient referral sent to Wound Care for management of weeping lower
  97|   extremity stasis changes and application of protective barrier dressings.
  98| 4. Disposition:
  99| - Case disussed with the primary inpatient medical service.
 100| - Follow-up cardiology evaluation scheduled tomorrow morning.
 101| 
 102| Consultant Signature:
 103| Attending Cardiologist, Cardiology Service
 104| Consultation Fellow, Cardiovascular Disease
=== END DOCUMENT ===
ITEMS FOR fd-0242:
D1 | line 8 | A: KEEP "three-vessel coronary artery bypass\ngrafting" | B: KEEP "coronary artery bypass\ngrafting"
D2 | line 9 | A: KEEP "persistent atrial fibrillation" | B: KEEP "atrial fibrillation"
D3 | line 14 | A: KEEP "heart failure exacerbation" | B: KEEP "heart failure"
D4 | line 28 | A: KEEP "Coronary artery bypass graft x3" | B: KEEP "Coronary artery bypass graft"
K1 | line 11 | KEEP "lower extremity edema"
K2 | line 15 | KEEP "left ventricular ejection fraction of 30%"
K3 | line 16 | KEEP "severe anterior and apical hypokinesis"
K4 | line 27 | KEEP "Stage C"
K5 | line 28 | KEEP "LIMA-LAD"
K6 | line 28 | KEEP "SVG-OM1"
K7 | line 28 | KEEP "SVG-PDA"
K8 | line 43 | KEEP "inflammatory dermatosis"
K9 | line 47 | KEEP "Vitals"
K10 | line 48 | KEEP "2 L/min"
K11 | line 48 | KEEP "oxygen"
K12 | line 48 | KEEP "nasal cannula"
K13 | line 49 | KEEP "General"
K14 | line 51 | KEEP "HEENT"
K15 | line 51 | KEEP "Mild proptosis"
K16 | line 52 | KEEP "conjunctival injection"
K17 | line 52 | KEEP "ophthalmoplegia"
K18 | line 53 | KEEP "Neck"
K19 | line 53 | KEEP "Jugular venous distension noted at 8 cm"
K20 | line 54 | KEEP "bruits"
K21 | line 55 | KEEP "Cardiovascular"
K22 | line 55 | KEEP "S3\ngallop"
K23 | line 56 | KEEP "Soft 2/6 holosystolic murmur"
K24 | line 58 | KEEP "Pulmonary"
K25 | line 58 | KEEP "Bibasilar fine inspiratory crackles"
K26 | line 59 | KEEP "wheezing"
K27 | line 59 | KEEP "rhonchi"
K28 | line 60 | KEEP "Abdomen"
K29 | line 60 | KEEP "Hepatojugular reflux"
K30 | line 61 | KEEP "Extremities"
K31 | line 61 | KEEP "3+ pitting edema"
K32 | line 62 | KEEP "hyperpigmentation"
K33 | line 62 | KEEP "weeping skin changes"
K34 | line 62 | KEEP "Peripheal pulses 1+"
K35 | line 64 | KEEP "Neurologic"
K36 | line 73 | KEEP "QRS duration 148 ms"
K37 | line 74 | KEEP "pulmonary vascular congestion"
K38 | line 74 | KEEP "prominent\ninterstitial markings"
K39 | line 75 | KEEP "small blunting of bilateral costophrenic angles"
K40 | line 79 | KEEP "reduced ejection fraction"
K41 | line 80 | KEEP "volume overload"
K42 | line 81 | KEEP "Volume Overload / Decongestion"
K43 | line 82 | KEEP "intravenous"
K44 | line 82 | KEEP "diuresis"
K45 | line 83 | KEEP "daily"
K46 | line 84 | KEEP "1.5 to 2.0 liters"
K47 | line 85 | KEEP "basic metabolic panel"
K48 | line 85 | KEEP "every 12 hours"
K49 | line 86 | KEEP "Guideline-Directed Medical Therapy"
K50 | line 91 | KEEP "Anticoagulation & Comorbidities"
K51 | line 92 | KEEP "systemic thromboembolism"
K52 | line 96 | KEEP "weeping lower\n  extremity stasis changes"
K53 | line 97 | KEEP "protective barrier dressings"
K54 | line 98 | KEEP "Disposition"
K55 | line 100 | KEEP "cardiology evaluation"

=== DOCUMENT fd-0244 ===
   1| CEDAR GROVE COMMUNITY HOSPITAL
   2| 1400 HARBOR LANE
   3| REDCEDAR, PA 17246
   4| Phone: (717) 555-0144
   5| Fax: (717) 555-0188
   6| 
   7| DISCHARGE SUMMARY
   8| 
   9| Patient: BEATRICE M. TOLLIVER
  10| MRN: 7394 1182 56
  11| DOB: 11/02/1958
  12| Account no.: 66021844
  13| Admitted: 03/02/2026
  14| Discharged: Mar. 6, 2026
  15| Attending physician: Calvin H. Breck, MD
  16| Primary clinician: Helen R. Crowe, MD, Birch Hollow Clinic
  17| 
  18| Home address:
  19| 27 Aspen Brook Road
  20| Redcedar, Pennsylvania 17202
  21| 
  22| Reason for admission: Right upper quadrant pain, fever, and vomiting.
  23| 
  24| Principal diagnosis: Acute calculous cholecystitis.
  25| Secondary diagnoses: Graves disease, essential hypertension, and obesity.
  26| Procedures: Laparoscopic cholecystectomy with intraoperative cholangiogram on 03/03/2026.
  27| 
  28| History of present illness. Beatrice M. Tolliver is a 67-year-old woman who came to the emergency department at Cedar Grove Community Hospital after two days of pain under the right costal margin. The pain was steady, spread to the right scapula, and worsened after a fried supper. She was nauseated and vomited twice. She denied jaundice, dark urine, clay-colored stool, chest pain, and dyspnea. Her son, Will Tolliver, brought her in and stayed the night. Will reported that she had barely eaten and could not sleep. A milder episode in the autumn had passed without a procedure.
  29| 
  30| Past medical history. Graves disease was diagnosed in 2019. She stayed on methimazole after declining radioactive iodine and thyroidectomy. Visits with Helen R. Crowe have shown stable thyroid tests. Hypertension is treated with metoprolol. An open appendectomy was done in childhood, and a right knee arthroscopy was done in 2016. She does not smoke and rarely drinks wine. She has had no transfusion, bleeding disorder, or anesthesia complication, and no prior biliary procedure.
  31| 
  32| Medications on admission were methimazole 10 mg by mouth each morning, metoprolol succinate 50 mg by mouth daily, and a multivitamin. Allergies: penicillin, with a widespread rash in early adulthood. She has since taken cephalosporins without a reaction.
  33| 
  34| Examination on arrival: temperature 38.4 C, pulse 104 beats per minute, blood pressure 148/86 mmHg, respiratory rate 18, oxygen saturation 97 percent on room air. She was alert and in moderate pain. Sclerae were anicteric. Heart and lungs were unremarkable. The abdomen was soft with a positive Murphy sign and guarding in the right upper quadrant, without rebound. There was no hernia and no leg edema.
  35| 
  36| Studies: leukocyte count 14.8 K/uL, hemoglobin 13.1 g/dL, platelets 242 K/uL, sodium 138 mmol/L, potassium 4.0 mmol/L, creatinine 0.8 mg/dL, glucose 112 mg/dL, total bilirubin 1.1 mg/dL, alkaline phosphatase 118 U/L, AST 42 U/L, ALT 51 U/L, lipase 28 U/L. Free T4 was 1.3 ng/dL and TSH was 1.1 mIU/L. Ultrasound showed gallstones, a 5 mm gallbladder wall, a sonographic Murphy sign, and a common bile duct of 5 mm.
  37| 
  38| Hospital course. She was kept nil by mouth on lactated Ringer solution. Piperacillin-tazobactam 3.375 g intravenously every 6 hours was started, with hydromorphone for pain and ondansetron for nausea. Methimazole and metoprolol continued. There was no sign of thyroid storm. Pain eased somewhat overnight, but the leukocyte count stayed high, and surgery was planned for the next morning.
  39| 
  40| On the morning of 03/03/2026, Calvin H. Breck performed a laparoscopic cholecystectomy under general anesthesia. The gallbladder was distended and edematous. After the critical view of safety was obtained, the cystic duct and cystic artery were clipped and divided. Intraoperative cholangiogram showed flow into the duodenum and no filling defect. The gallbladder was removed in a bag. Blood loss was about 25 mL. No drain was placed, and counts were correct. Pathology showed chronic cholecystitis with cholelithiasis and no carcinoma.
  41| 
  42| Postoperative course was smooth. Acetaminophen and a few doses of oxycodone controlled pain. She tolerated a low-fat diet after nausea on the evening of surgery settled. She walked in the hall with Will Tolliver. The leukocyte count fell to 9.2 K/uL. She was afebrile after the first night. Mild erythema at the umbilical site was present on the morning of discharge, without drainage. Methimazole was not missed. Heart rate stayed in the 80s. She voided, her pain score at rest was 3 out of 10, and her saturation on room air was 98 percent.
  43| 
  44| Tolliver's examination before discharge showed a soft abdomen, clean port sites apart from that mild erythema, and no jaundice. She repeated the warning symptoms correctly. Will Tolliver heard the teaching and agreed to remain in the home for the first week.
  45| 
  46| Social context. She lives with her son in a single-story house and does her own cooking and shopping. She is retired from bookkeeping. No illicit drug use was reported. Code status was discussed, and she requested full treatment.
  47| 
  48| Pending items. Pathology had already returned and was reviewed with her in plain language. No intraoperative culture was sent. Printed instructions covered wounds, diet, and the reasons to call.
  49| 
  50| Discharge medications. Continue methimazole 10 mg by mouth every morning and metoprolol succinate 50 mg by mouth daily. Acetaminophen 650 mg by mouth every 6 hours as needed, not above 3 grams per day. Oxycodone 5 mg by mouth every 6 hours as needed, twelve tablets, no refill. Cephalexin 500 mg by mouth four times daily for five days for the umbilical erythema. Prescription number 8841207 was sent to Orchard Lane Pharmacy. She has tolerated cephalexin before and accepted it after counseling about the penicillin allergy. Ondansetron 4 mg by mouth every 8 hours as needed for nausea. Docusate sodium 100 mg by mouth twice daily while oxycodone is used. Piperacillin-tazobactam was stopped.
  51| 
  52| Follow-up. See Helen R. Crowe at Birch Hollow Clinic on Mar. 18, 2026, or sooner for fever, spreading redness, drainage, vomiting, jaundice, or uncontrolled pain. A wound check with Calvin H. Breck is set for 03/20/2026. Repeat thyroid studies at Birch Hollow Clinic within four weeks, since illness can disturb control of Graves disease. Walk daily. Do not lift more than 10 pounds for two weeks. Keep a low-fat diet for the same period. Showering is allowed. Driving should wait until oxycodone is finished. She went home with her son, walking and eating.
  53| 
  54| Dictated by Calvin H. Breck, MD, attending surgeon, on Mar. 6, 2026, and signed after review.
  55| 
  56| Calvin H. Breck, MD
  57| Department of Surgery
  58| Cedar Grove Community Hospital
=== END DOCUMENT ===
ITEMS FOR fd-0244:
D1 | line 34 | A: KEEP "oxygen saturation 97 percent on room air" | B: KEEP "oxygen saturation 97 percent"
D2 | line 50 | A: KEEP "every 6 hours" ; KEEP "as needed" | B: KEEP "every 6 hours as needed"
D3 | line 50 | A: KEEP "every 6 hours" ; KEEP "as needed" | B: KEEP "every 6 hours as needed"
D4 | line 50 | A: KEEP "every 8 hours" ; KEEP "as needed" | B: KEEP "every 8 hours as needed"
K1 | line 30 | KEEP "bleeding disorder"
K2 | line 32 | KEEP "multivitamin"
K3 | line 40 | KEEP "Blood loss was about 25 mL"
K4 | line 40 | KEEP "carcinoma"
K5 | line 42 | KEEP "Postoperative course"
K6 | line 42 | KEEP "leukocyte count fell to 9.2 K/uL"
K7 | line 42 | KEEP "erythema"
K8 | line 42 | KEEP "pain score at rest was 3 out of 10"
K9 | line 42 | KEEP "saturation on room air was 98 percent"
K10 | line 44 | KEEP "erythema"
K11 | line 50 | KEEP "umbilical erythema"
K12 | line 52 | KEEP "thyroid studies"

=== DOCUMENT fd-0252 ===
   1| CLINICAL CARE MANAGEMENT AND PRIOR AUTHORIZATION MEMORANDUM
   2| SERVICE COORDINATION AND PHARMACY REVIEW
   3| 
   4| SUBJECT: INTERDISCIPLINARY CARE PLAN AND PHARMACY BENEFIT SUMMARY
   5| 
   6| This administrative memorandum summarizes the continuing care coordination and clinical management pathway for the patient, a 67-year-old male with complex endocrine and cardiovascular disease. Historical clinical documentation indicates that hyperthyroidism secondary to Graves disease was originally identified in 2019, complicated by mild orbitopathy and persistent sinus tachycardia. Clinical summaries transferred from Outside Hospital confirm that radioactive iodine ablation was deferred in favor of medical management, with episodic clinical monitoring maintained through ambulatory endocrine consults.
   7| 
   8| During the most recent clinical evaluation, baseline vital signs were documented as follows: blood pressure 134/82 mmHg, heart rate 88 bpm regular, respiratory rate 16 breaths/min, body temperature 98.6 F, and oxygen saturation 98% on ambient air. Concurrent laboratory testing revealed thyroid-stimulating hormone (TSH) suppressed at < 0.01 uIU/mL, free thyroxine (free T4) elevated at 2.6 ng/dL, and total triiodothyronine (total T3) at 198 ng/dL. Hepatic functional parameters remained stable with alanine aminotransferase 24 U/L, aspartate aminotransferase 21 U/L, adn total bilirubin 0.7 mg/dL. Complete blood count demonstrated an absolute neutrophil count of 3,400 /uL, reassuring against thionamide-induced agranulocytosis.
   9| 
  10| Active multidisciplinary referrals have been processed to ensure integrated disease oversight. The patient has been scheduld for follow-up nutritional and metabolic consultation through Diabetes Center. A parallel referral to Cardiology was initiated to address rate control and assess left ventricular systolic function via transthoracic echocardiogram. An initial assessment through Pain Clinic was also requested for cervical radicular symptoms.
  11| 
  12| The active outpatient medication regimen includes the following verified prescriptions:
  13| - methimazole 10 mg PO TID for thyrotoxicosis control
  14| - propranolol 20 mg PO TID for sympathetic symptom mitigation
  15| - Allegra 180 mg PO daily for chronic seasonal rhinitis
  16| - prednisone 40/30/20/10 mg daily taper administered over twenty days for acute thyroid eye discomfort
  17| 
  18| The clinical care coordinator and covering clinical pharmacist have reviewed the medication profile to prevent adverse drug-drug interactions. Benefit coverage has been authorized by the health plan for ongoing diagnostic monitoring every 2/3 weeks until biochemical euthyroidism is achieved. For any administrative inquirey regarding this coordination summary, care coordinators may submit requests through the secure clinical communication exchange.
  19| 
  20| DIVISION OF SPECIALTY CARE COORDINATION
=== END DOCUMENT ===
ITEMS FOR fd-0252:
D1 | line 8 | A: KEEP "thionamide-induced agranulocytosis" | B: KEEP "agranulocytosis"
K1 | line 6 | KEEP "endocrine and cardiovascular disease"
K2 | line 8 | KEEP "Complete blood count"
K3 | line 10 | KEEP "Cardiology"
K4 | line 10 | KEEP "cervical radicular symptoms"
K5 | line 16 | KEEP "acute thyroid eye discomfort"
K6 | line 18 | KEEP "biochemical euthyroidism"

=== DOCUMENT fd-0280 ===
   1| Green Valley Health Center
   2| 512 River Road, Suite 200
   3| Columbus, OH 43215
   4| Clinic Phone: (614) 555-0138
   5| Provider Email: marcus.fletcher@example.org
   6| Portal: https://mychart.example.com/patient/summary
   7| 
   8| OUTPATIENT COMPREHENSIVE CLINICAL PROGRESS NOTE
   9| Date of Encounter: March 4, 2026
  10| Patient Identification: 4821-9932-07
  11| Patient Name: Gurdev Grewal
  12| DOB: August 14, 1934
  13| Age: 91 y.o.
  14| Attending: Marcus E. Fletcher, MD
  15| 
  16| SUBJECTIVE:
  17| Mr. Gurdev Grewal is a 91 y.o. gentleman with a medical history of chronic
  18| systolic heart failure, essential hypertension, benign prostatic
  19| hyperplasia, and mild vascular cognitive impairment who presents today
  20| for routine outpatient chronic disease follow-up. The patient arrived
  21| at the clinic via specialized paratransit mobility transport, vehicle
  22| license plate 4KLT892. He is accompanied today by his son-in-law, Brian
  23| Miller, who assists with medication administration and manages his
  24| daily home schedule.
  25| 
  26| Mr. Miller reports that the patient has experienced stable functional
  27| status over the past two months without acute syptoms of decompensation.
  28| There have been no episodes of paroxysmal nocturnal dyspnea, orthopnea,
  29| chest pressure, palpitations, or lightheadedness. Daily home weights
  30| have remained within a narrow range of 152 to 154 lbs. His appetite
  31| is reported as satisfactory, and he drinks adequate fluids. The patient
  32| uses a four-wheeled rolling walker for household amublation. His
  33| son-in-law confirms that all home prescriptions are taken faithfully
  34| and requests an evalution of his latest routine outpatient laboratory
  35| panels.
  36| 
  37| CURRENT MEDICATIONS:
  38| 1. Lisinopril 20 mg PO daily.
  39| 2. Carvedilol 12.5 mg PO BID.
  40| 3. Furosemide 20 mg PO daily in the morning.
  41| 4. Tamsulosin 0.4 mg PO at bedtime.
  42| 5. Atorvastatin 20 mg PO at bedtime.
  43| 6. Aspirin 81 mg PO daily.
  44| 
  45| PHYSICAL EXAMINATION:
  46| Vital Signs: Blood pressure 138/82 mmHg, heart rate 72 bpm regular,
  47| respiratory rate 16 breaths/min, body temperature 98.4 F, oxygen
  48| saturation 97% on ambient room air. Weight 69.4 kg (153 lbs).
  49| General: Pleasant, frail elderly male in no acute distress, resting
  50| comfortably in chair, alert and oriented to person and city.
  51| HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to
  52| light. Sclerae anicteric. Oral mucosa moist.
  53| Cardiovascular: Regular rate and rhythm, normal S1 and S2, soft 1/6
  54| systolic murmur at the apex, no gallops or pericardial friction rubs.
  55| Carotid pulses brisk bilaterally without bruits.
  56| Pulmonary: Lungs clear to auscultation bilaterally in all fields; no
  57| crackles, wheezing, or rhonchi.
  58| Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds.
  59| Extremities: Trace non-pitting edema at bilateral ankles; no calf
  60| tenderness. Dorsalis pedis pulses 2+ bilaterally.
  61| Neurologic: Cranial nerves II-XII grossly intact. Sensation intact
  62| to light touch distally. Motor strength 5/5 upper extremities, 4+/5
  63| lower extremities symmetrically. Gait slow but steady with walker.
  64| 
  65| LABORATORY REVIEW:
  66| Specimen drawn earlier this morning: Serum sodium 138 mEq/L, potassium
  67| 4.5 mEq/L, chloride 101 mEq/L, bicarbonate 26 mEq/L, blood urea nitrogen
  68| 24 mg/dL, serum creatinine 1.2 mg/dL (eGFR 58 mL/min/1.73m2). Fasting
  69| blood glucose 118 mg/dL, hemoglobin A1c 6.9%. Complete blood count:
  70| white blood cell count 6.4 x10^3/uL, hemoglobin 13.2 g/dL, hematocrit
  71| 39.4%, platelet count 198 x10^3/uL.
  72| 
  73| ASSESSMENT AND PLAN:
  74| Gurdev Grewal is a 91 y.o. male with well-compensated heart failure
  75| and hypertension, demonstrating clinical stability.
  76| 1. Chronic Systolic Heart Failure:
  77| - Clinically euvolemic with stable weights and trace ankle edema.
  78| - Continue lisinopril 20 mg PO daily, carvedilol 12.5 mg PO BID, and
  79|   furosemide 20 mg PO daily.
  80| - Continue daily morning weight checks; contact office for 3 lb gain.
  81| 2. Essential Hypertension:
  82| - Blood pressure acceptable at 138/82 mmHg. Regimen unchanged.
  83| 3. Benign Prostatic Hyperplasia:
  84| - Continue tamsulosin 0.4 mg PO at bedtime without adverse effects.
  85| 4. Preventative Health and Follow-up:
  86| - Return to clinic in four months for repeat metabolic panel and clinical
  87|   review. Brian Miller was provided a direct portal link to review
  88|   laboratory results: https://mychart.example.com/patient/summary.
  89| 
  90| Provider Signature:
  91| Marcus E. Fletcher, MD
  92| Internal Medicine, Green Valley Health Center
=== END DOCUMENT ===
ITEMS FOR fd-0280:
D1 | line 19 | A: KEEP "mild vascular cognitive impairment" | B: KEEP "vascular cognitive impairment"
D2 | line 40 | A: KEEP "daily in the morning" | B: KEEP "daily"
D3 | line 48 | A: KEEP "Weight 69.4 kg (153 lbs)" | B: KEEP "Weight 69.4 kg"
D4 | line 74 | A: KEEP "well-compensated heart failure" | B: KEEP "heart failure"
D5 | line 82 | A: KEEP "Blood pressure acceptable at 138/82 mmHg" | B: KEEP "138/82 mmHg"
K1 | line 30 | KEEP "152 to 154 lbs"
K2 | line 46 | KEEP "Vital Signs"
K3 | line 49 | KEEP "General"
K4 | line 51 | KEEP "HEENT"
K5 | line 53 | KEEP "Cardiovascular"
K6 | line 53 | KEEP "soft 1/6\nsystolic murmur"
K7 | line 54 | KEEP "gallops"
K8 | line 54 | KEEP "pericardial friction rubs"
K9 | line 55 | KEEP "bruits"
K10 | line 56 | KEEP "Pulmonary"
K11 | line 57 | KEEP "crackles"
K12 | line 57 | KEEP "wheezing"
K13 | line 57 | KEEP "rhonchi"
K14 | line 58 | KEEP "Abdomen"
K15 | line 59 | KEEP "Extremities"
K16 | line 59 | KEEP "Trace non-pitting edema"
K17 | line 60 | KEEP "Dorsalis pedis pulses 2+"
K18 | line 61 | KEEP "Neurologic"
K19 | line 62 | KEEP "Motor strength 5/5"
K20 | line 62 | KEEP "4+/5"
K21 | line 69 | KEEP "Complete blood count"
K22 | line 77 | KEEP "trace ankle edema"
K23 | line 80 | KEEP "daily"
K24 | line 80 | KEEP "3 lb"
K25 | line 85 | KEEP "Preventative Health and Follow-up"
K26 | line 86 | KEEP "metabolic panel"

=== DOCUMENT fd-0286 ===
   1| PRIOR AUTHORIZATION & MEDICATION RECONCILIATION REVIEW
   2| TRANSCRIBED FROM SECURE FAX TRANSMISSION
   3| 
   4| PATIENT NAME: Mateo
   5| Guerrero-Méndez
   6| DOB: 05-18-1935
   7| AGE: The patient is ninety-one years old.
   8| ACCOUNT NUMBER: Account #: AC-9948201
   9| RESIDENCE ADDRESS: 724 Willow Ridge Boulevard, Austin, TX 78704
  10| PRIMARY CAREGIVER: Margaret Jenkins (patient's adult stepdaughter)
  11| CONTACT PHONE: +1-512-555-0177
  12| ATTENDING CLINICIAN: Dr. Julian Fair, MD
  13| REVIEWING PHARMACIST: Tariq al-Mansoor, PharmD, BCACP
  14| PRIMARY DEVICE: Tandem t:slim X2 Insulin Pump, Serial SN-7749201
  15| 
  16| CLINICAL BACKGROUND AND ENCOUNTER SUMMARY:
  17| Medication reconciliation and clinical prior authorization intake reivewed
  18| on 11-04-2026 by clinical specialist Tariq al-Mansoor. Dr. Fair's clinic
  19| referred this ninety-one years old male for assistance with ongoing
  20| coverage authorization of disposable infusion sets and rapid-acting
  21| insulin analog supplies. The patient has managed type 1 diabetes mellitus
  22| for over four decades and is currently maintained on automated insulin
  23| delivery using a Tandem t:slim X2 insulin pump, Serial SN-7749201.
  24| Recent point-of-care capillary blood glucose average over fourteen days
  25| is 142 mg/dL. Renal function remains preserved for age with a serum
  26| creatinine of 1.08 mg/dL and urinary albumin-to-creatinine ratio within
  27| baseline limits. No history of severe pump site infection or
  28| unexplained hyperglycemia.
  29| 
  30| TELEPHONE CONSULTATION WITH CAREGIVER:
  31| A telephone reconciliation was conducted with Margaret Jenkins, who
  32| provides daily assistance with infusion site changes and device
  33| calibration. She reports that Mr. Guerrero-Méndez's continuous glucose
  34| monitor confirms a time in range of 74%, with minimal nocturnal
  35| hypoglycemia over the preceding 30 days. Margaret noted that the
  36| inital shipment of reservoir cartridges was delayed by the medical
  37| supplier, requiring a bridge refill authorization.
  38| 
  39| CURRENT ACTIVE MEDICATIONS:
  40| 1. Insulin lispro (Humalog) 100 units/mL subcutaneous continuous basal
  41| infusion via pump at 0.65 units/hour, with mealtime boluses of 1 unit per
  42| 10 grams of carbohydrate PO TID before meals.
  43| 2. Atorvastatin 20 mg PO once daily at bedtime for hyperlipidemia.
  44| 3. Losartan potassium 50 mg PO daily for diabetic nephropathy and
  45| hypertension.
  46| 4. Levothyroxine sodium 75 mcg PO daily in the morning on an empty stomach.
  47| 5. Acetaminophen 650 mg PO q8h PRN for mild knee osteoarthritis pain.
  48| 6. Polyethylene glycol 3350 17 g PO daily PRN constipation.
  49| 
  50| CLINICAL JUSTIFICATION & PRIOR AUTHORIZATION:
  51| Prior authorization approval is requested under Account #: AC-9948201 for
  52| continued insulin cartridge and cannula supplies. Dr. Julian Fair
  53| submitted attestation confirming that Mateo Guerrero-Méndez demonstrates
  54| documented cognitive and manual dexterity with pump operation alongside his
  55| caregiver. Abrupt discontinuation of automated insulin delivery poses
  56| severe risk of diabetic ketoacidosis. The current pump dosgae parameters
  57| have achieved glycemic stability without severe hypoglycemic excursions.
  58| 
  59| PHARMACY PLAN & NEXT ACTIONS:
  60| 1. Prior authorization appeal forms and past three months of device upload
  61| logs transmitted to the patient's prescription benefit plan.
  62| 2. Notified Dr. Fair of successful submission; copy placed in patient
  63| chart.
  64| 3. Contacted medical supply vendor to release emergency 30-day supply of
  65| pump cartridges and infusion sets directly to 724 Willow Ridge Boulevard.
  66| 4. Follow-up call with Margaret Jenkins scheduled within 72 hours.
  67| 
  68| Tariq al-Mansoor, PharmD
  69| Clinical Pharmacy Ambulatory Services
=== END DOCUMENT ===
ITEMS FOR fd-0286:
D1 | line 34 | A: KEEP "nocturnal\nhypoglycemia" | B: KEEP "hypoglycemia"
D2 | line 47 | A: KEEP "knee osteoarthritis" | B: KEEP "osteoarthritis"
K1 | line 17 | KEEP "Medication reconciliation"
K2 | line 22 | KEEP "automated insulin\ndelivery"
K3 | line 24 | KEEP "point-of-care capillary blood glucose average over fourteen days\nis 142 mg/dL"
K4 | line 26 | KEEP "urinary albumin-to-creatinine ratio"
K5 | line 27 | KEEP "pump site infection"
K6 | line 34 | KEEP "time in range of 74%"
K7 | line 41 | KEEP "1 unit per\n10 grams of carbohydrate"
K8 | line 42 | KEEP "before meals"
K9 | line 43 | KEEP "at bedtime"
K10 | line 46 | KEEP "in the morning"
K11 | line 55 | KEEP "automated insulin delivery"
K12 | line 57 | KEEP "hypoglycemic excursions"

=== DOCUMENT fd-0287 ===
   1| Clearwater Medical Center
   2| Department of Hematology and Medical Oncology
   3| CLINICAL CONSULTATION AND MULTIDISCIPLINARY ONCOLOGY NOTE
   4| Date of Consultation: 2026-03-04
   5| PATIENT: MARC CÉLESTIN DE LA COUR
   6| DOB: 14 January 1932
   7| Age: 94
   8| MRN: 8940129
   9| Health Plan Member ID: HPM-4920184
  10| Patient Address:
  11| 782 Highland View Avenue
  12| Seattle, WA 98104
  13| Contact Telephone: (206) 555-0163
  14| Department Fax: (206) 555-0177
  15| Provider Contact: babatunde.adeyemi at example dot org
  16| Clinical Portal Access: https://portal.example.org/records/oncology-summary
  17| 
  18| MULTIDISCIPLINARY CARE CONFERENCE ATTENDEES:
  19| 1. Babatunde Adeyemi, MD (Attending Medical Oncologist)
  20| 2. Ngozi Okonkwo, MD (Hematology-Oncology Fellow)
  21| 3. Chidubem Eze, MD (Palliative Medicine Consultant)
  22| 4. Olumide Adeleke, RN (Oncology Nurse Navigator)
  23| 5. Laura M. Sage (Patient Granddaughter and Healthcare Proxy)
  24| 
  25| HISTORY OF PRESENT ILLNESS:
  26| Mr. Marc Célestin de la Cour is an Age: 94 retired school administrator who presents for an initial outpatient hematology-oncology consultation following a recent diagnostic workup for iron deficiency anemia and lower gastrointestinal bleeding. The patient was accompanied to the clinic by his 28-year-old granddaughter and primary caregiver, Laura M. Sage. 
  27| 
  28| The patient's clinical trajectory began on 4 March 2026 when routine screening laboratories demonstrated an unexpected drop in hemoglobin to 7.8 g/dL. Subsequent diagnostic colonoscopy performed on 18 February 2026 revealed an ulcerated, partially obstructing mass measuring 4.2 cm in maximal diameter located at the rectosigmoid junction, approximately 16 cm from the anal verge. Multiple endoscopic biopsies were obtained. Histopathological analysis confirmed moderately differentiated invasive adenocarcinoma of the rectosigmoid colon. Staging computed tomography of the chest, abdomen, and pelvis with intravenous contrast performed on 24 February 2026 revealed localized circumferential wall thickening of the rectosigmoid junction with pericolic fat stranding and two prominent regional mesenteric lymph nodes measuring 1.1 cm and 1.3 cm in short axis. No evidence of distant hepatic, pulmonary, or peritoneal metastatic disease was identified (clinical stage T3, N1, M0, Stage III).
  29| 
  30| Over the preceding three months, Mr. Célestin de la Cour has endorsed intermittent passage of dark red blood mixed with formed stools, progressive fatigue, and a 4 kg unintentional weight loss. He denies severe abdominal pain, nausea, vomiting, tenesmus, or obstipation. He reports that his appetite remains fair, though he requires assistance with meal preparation, which Laura Sage coordinates alongside home nursing visits. Current performance status is assessed as Eastern Cooperative Oncology Group (ECOG) grade 2, reflecting ambulation with a cane and capability of all self-care but restricted from strenuous activity.
  31| 
  32| PAST MEDICAL HISTORY:
  33| 1. Adenocarcinoma of the rectosigmoid colon, clinical Stage III (T3 N1 M0).
  34| 2. Iron deficiency anemia secondary to chronic gastrointestinal blood loss.
  35| 3. Essential hypertension for over 25 years.
  36| 4. Paroxysmal atrial fibrillation, anticoagulated.
  37| 5. Mild bilateral sensorineural hearing loss.
  38| 
  39| PAST SURGICAL HISTORY:
  40| 1. Diagnostic colonoscopy with rectosigmoid biopsies (February 2026).
  41| 2. Right inguinal herniorrhaphy with mesh repair (2011).
  42| 3. Bilateral cataract surgery (2018).
  43| 
  44| CURRENT MEDICATIONS:
  45| 1. Apixaban 2.5 mg PO BID (temporarily held prior to planned surgical evaluation).
  46| 2. Amlodipine 5 mg PO daily.
  47| 3. Lisinopril 10 mg PO daily.
  48| 4. Ferrous sulfate 325 mg PO daily (dispensed under outpatient Rx # 9481024).
  49| 5. Polyethylene glycol 17 g PO daily in water.
  50| 6. Cyanocobalamin (Vitamin B12) 1000 mcg PO daily.
  51| 
  52| PHYSICAL EXAMINATION:
  53| Vital Signs: BP 132/78 mmHg, pulse 74 bpm regular, respirations 16 breaths/min, temperature 98.4 F, SpO2 98% on room air. Weight 64.5 kg, height 170 cm, ECOG performance status 2.
  54| General: Frail but alert, engaging, pleasant gentleman in no acute distress.
  55| HEENT: Normocephalic, atraumatic. Conjunctivae show moderate pallor. Sclerae anicteric. Oropharynx pink and moist without mucositis or ulcerations.
  56| Cardiovascular: Regular rate and rhythm, normal S1 and S2. Soft 2/6 systolic flow murmur heard best over the aortic listening area. Peripheral pulses 2+ in radial and posterior tibial arteries bilaterally. No peripheral lower extremity edema.
  57| Pulmonary: Clear to auscultation bilaterally; vesicular breath sounds throughout all lung fields. No wheezes, crackles, or rhonchi.
  58| Abdomen: Scaphoid, soft, non-tender to light and deep palpation. No guarding, rigidity, or rebound tenderness. Well-healed right inguinal scar. No palpable hepatomegaly or splenomegaly. Normoactive bowel sounds.
  59| Rectal Exam: Deferred today in clinic in light of recent colonoscopy.
  60| Neurologic: Cranial nerves II-XII intact. Sensation intact to light touch. Motor strength 5/5 in upper extremities, 4+/5 in lower extremities. Gait steady with single-point cane.
  61| Lymphatics: No cervical, supraclavicular, axillary, or inguinal lymphadenopathy palpable.
  62| 
  63| LABORATORY REVIEW:
  64| Hemoglobin 8.6 g/dL (improved post oral iron), hematocrit 27.2%, MCV 74 fL, white blood cell count 5.8 x10^3/uL, platelet count 265 x10^3/uL. Serum ferritin 18 ng/mL, iron saturation 9%. Serum sodium 141 mEq/L, potassium 4.1 mEq/L, BUN 19 mg/dL, serum creatinine 1.0 mg/dL, eGFR 66 mL/min/1.73m2. Total bilirubin 0.6 mg/dL, alkaline phosphatase 72 U/L, AST 18 U/L, ALT 20 U/L, albumin 3.6 g/dL. Carcinoembryonic antigen (CEA) 6.4 ng/mL (moderately elevated).
  65| 
  66| ASSESSMENT AND MANAGEMENT PLAN:
  67| Marc Célestin de la Cour is an Age: 94 gentleman with newly diagnosed, non-metastatic clinical Stage III adenocarcinoma of the rectosigmoid junction who presents with symptomatic anemia and functional frailty. His case was formally discussed during today's multidisciplinary conference involving Babatunde Adeyemi, MD, Ngozi Okonkwo, MD, Chidubem Eze, MD, Olumide Adeleke, RN, and Laura M. Sage.
  68| 1. Surgical Oncology Referral:
  69| - Given the partially obstructing nature of the rectosigmoid lesion and ongoing bleeding, primary surgical resection remains the definitive local modality. Urgent consultation arranged with colorectal surgery to evaluate candidacy for laparoscopic versus robotic low anterior resection with total mesorectal excision.
  70| 2. Medical Oncology Consideration:
  71| - Discussion held regarding adjuvant chemotherapy in a patient of Age: 94. While standard adjuvant FOLFOX or CAPOX yields survival benefit in Stage III disease in younger populations, the substantial toxicity risk of oxaliplatin-induced sensory neuropathy and myelosuppression necessitates extreme caution. If surgery proceeds successfully, single-agent fluoropyrimidine monotherapy (capecitabine) or active surveillance with close imaging will be reconsidered postoperatively depending on final pathologic staging and performance status.
  72| 3. Supportive Care and Anemia Optimization:
  73| - Continue oral iron supplementation (dispensed under Rx # 9481024). Consider intravenous iron sucrose if oral tolerance wanes.
  74| - Palliative medicine consultation conducted today by Chidubem Eze, MD, focused on goal concordance, caregiver support for Ms. Sage, advance care planning, and symptom management.
  75| 4. Follow-up:
  76| - Re-evaluation in medical oncology clinic following surgical consultation in 2 weeks. Comprehensive notes and pathology uploaded to portal: https://portal.example.org/records/oncology-summary.
  77| 
  78| Electronic Signature:
  79| BABATUNDE ADEYEMI, MD
  80| Attending Physician, Medical Oncology
  81| Clearwater Medical Center
  82| Fellow Cosignature:
  83| Ngozi Okonkwo, MD
=== END DOCUMENT ===
ITEMS FOR fd-0287:
D1 | line 28 | A: KEEP "diagnostic colonoscopy" | B: KEEP "colonoscopy"
D2 | line 28 | A: KEEP "endoscopic biopsies" | B: KEEP "biopsies"
D3 | line 28 | A: KEEP "moderately differentiated invasive adenocarcinoma of the rectosigmoid colon" | B: KEEP "adenocarcinoma of the rectosigmoid colon"
D4 | line 28 | A: KEEP "Staging computed tomography of the chest, abdomen, and pelvis with intravenous contrast" | B: KEEP "computed tomography" ; KEEP "intravenous"
D5 | line 28 | A: KEEP "clinical stage T3, N1, M0, Stage III" | B: KEEP "Stage III"
D6 | line 33 | A: KEEP "Adenocarcinoma of the rectosigmoid colon, clinical Stage III (T3 N1 M0)" | B: KEEP "Adenocarcinoma of the rectosigmoid colon" ; KEEP "Stage III"
D7 | line 34 | A: KEEP "Iron deficiency anemia secondary to chronic gastrointestinal blood loss" | B: KEEP "Iron deficiency anemia"
D8 | line 37 | A: KEEP "Mild bilateral sensorineural hearing loss" | B: KEEP "sensorineural hearing loss"
D9 | line 40 | A: KEEP "Diagnostic colonoscopy with rectosigmoid biopsies" | B: KEEP "colonoscopy" ; KEEP "biopsies"
D10 | line 41 | A: KEEP "Right inguinal herniorrhaphy with mesh repair" | B: KEEP "inguinal herniorrhaphy"
D11 | line 42 | A: KEEP "Bilateral cataract surgery" | B: KEEP "cataract surgery"
D12 | line 67 | A: KEEP "non-metastatic clinical Stage III adenocarcinoma of the rectosigmoid junction" | B: KEEP "Stage III" ; KEEP "adenocarcinoma of the rectosigmoid junction"
D13 | line 67 | A: KEEP "symptomatic anemia" | B: KEEP "anemia"
D14 | line 69 | A: KEEP "laparoscopic versus robotic low anterior resection with total mesorectal excision" | B: KEEP "low anterior resection with total mesorectal excision"
D15 | line 71 | A: KEEP "oxaliplatin-induced sensory neuropathy" | B: KEEP "oxaliplatin" ; KEEP "sensory neuropathy"
K1 | line 26 | KEEP "hematology-oncology consultation"
K2 | line 26 | KEEP "lower gastrointestinal bleeding"
K3 | line 28 | KEEP "hemoglobin to 7.8 g/dL"
K4 | line 28 | KEEP "Histopathological analysis"
K5 | line 53 | KEEP "Vital Signs"
K6 | line 54 | KEEP "General"
K7 | line 55 | KEEP "HEENT"
K8 | line 56 | KEEP "Cardiovascular"
K9 | line 57 | KEEP "Pulmonary"
K10 | line 58 | KEEP "Abdomen"
K11 | line 59 | KEEP "Rectal Exam"
K12 | line 60 | KEEP "Neurologic"
K13 | line 61 | KEEP "Lymphatics"
K14 | line 64 | KEEP "oral"
K15 | line 67 | KEEP "functional frailty"
K16 | line 68 | KEEP "Surgical Oncology Referral"
K17 | line 69 | KEEP "primary surgical resection"
K18 | line 69 | KEEP "colorectal surgery"
K19 | line 70 | KEEP "Medical Oncology Consideration"
K20 | line 71 | KEEP "adjuvant chemotherapy"
K21 | line 71 | KEEP "fluoropyrimidine"
K22 | line 71 | KEEP "active surveillance"
K23 | line 72 | KEEP "Supportive Care and Anemia Optimization"
K24 | line 73 | KEEP "oral"
K25 | line 73 | KEEP "oral"
K26 | line 74 | KEEP "Palliative medicine consultation"
K27 | line 74 | KEEP "advance care planning"
K28 | line 75 | KEEP "Follow-up"
K29 | line 76 | KEEP "medical oncology clinic"

Now output the result blocks.