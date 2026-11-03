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


=== DOCUMENT fd-0278 ===
   1| OUTPATIENT PROGRESS NOTE
   2| Location: general internal medicine clinic
   3| Author: attending physician, general internal medicine
   4| 
   5| Chief complaint: Follow-up of gout, heart failure, diabetes, and Parkinson disease.
   6| 
   7| History of present illness: The patient is a 71-year-old woman seen with her 46-year-old daughter, who fills the pillbox. Breathing is better than last week, when she slept on two pillows and had evening ankle swelling after prednisone for acute gout of the right first metatarsophalangeal joint. The taper was prednisone 40/30/20/10 mg by mouth over four days. The joint is now mildly sore. Fasting glucose often ran 180 to 220 mg/dL on the steroid, and weight rose about 1.5 kg, consistent with fluid. She denies chest pain, syncope, and fever. She describes occassional lightheadedness on standing for a few seconds, without palpitations or a fall. Parkinson disease, diagnosed in 2019, is steady, with right-hand rest tremor, soft speech, and slow gait, and without hallucinations. Morning cough with white sputum is baseline, and she uses an albuterol inhaler about twice a week. We recieved the echocardiogram report from Outside Hospital and reviewed it today. She is referred to Cardiology for the heart failure and to the Diabetes Center for insulin teaching. Pain Clinic was offered as a service for lumbar stenosis if walking limits her, and she prefers to wait. Appetite is fair. She denies melena and dysuria. One evening dose of diuretic was missed earlier in the week.
   8| 
   9| Past medical history: Parkinson disease diagnosed in 2019. Type 2 diabetes mellitus since 2014 with distal sensory neuropathy. Heart failure with preserved ejection fraction. Chronic kidney disease stage 3. Gout. Moderate COPD. Lumbar spinal stenosis. Osteoarthritis of the knees. Hypothyroidism. Former smoker, quit in 2008. Colonoscopy in 2018 with a small tubular adenoma. Laparoscopic cholecystectomy in 2011. Right cataract extraction in 2020. No known coronary disease.
  10| 
  11| Allergies: rash with sulfa antibiotics. Penicillin tolerated. Iodine contrast tolerated. No food allergy.
  12| 
  13| Medications: carbidopa-levodopa 25/100 mg PO TID, one hour before meals. pregabalin (Lyrica) 75 mg PO BID. fexofenadine (Allegra) 180 mg PO daily. furosemide 40 mg PO BID. empagliflozin 10 mg PO daily. metformin 1000 mg PO BID with meals. insulin glargine 16 units SQ qHS. lisinopril 10 mg PO daily. atorvastatin 40 mg PO qHS. levothyroxine 75 mcg PO each morning. tiotropium 2.5 mcg inhaled daily. albuterol HFA 2 puffs inhaled q6h PRN wheeze. allopurinol 100 mg PO daily. acetaminophen 650 mg PO q6h PRN pain. aspirin 81 mg PO daily. cholecalciferol 2000 units PO daily. polyethylene glycol 17 g PO daily. The prednisone 40/30/20/10 mg course is finished. Please keep the the evening diuretic seperate from the bedtime dose of carbidopa-levodopa.
  14| 
  15| Social history: Lives with her daughter in a single-level home. Retired clerical worker. No alcohol and no illicit drugs. Uses a cane indoors. Daughter helps with bathing and transportation.
  16| 
  17| Family history: Mother had a late-life stroke. Father had type 2 diabetes. No family history of Parkinson disease. One brother has gout.
  18| 
  19| Review of systems: Mild fatigue. No fever, chest pain, hemoptysis, dysuria, new weakness, or foot ulcer. Dyspnea on one flight of stairs. Constipation stable. Mood even.
  20| 
  21| Physical examination: Comfortable, hypophonic speech, no distress. Blood pressure 142/78 mmHg seated and 118/68 mmHg standing. Heart rate 68 beats per minute, regular. Temperature 36.6 C. Respiratory rate 18 breaths per minute. Oxygen saturation 95 percent on room air. Weight 81.2 kg. Height 162 cm. Body mass index 30.9 kg/m2. No jugular venous distention. Lungs with basilar expiratory wheeze and no crackles. Regular rhythm, S4, no murmur. Abdomen soft and nontender. Trace pretibial edema. Right first metatarsophalangeal joint mildly warm, no large effusion. Feet intact, with monofilament reduced at three of ten sites on each foot. Resting right-hand tremor, mild cogwheel rigidity, and reduced arm swing.
  22| 
  23| Data: Sodium 138 mmol/L, potassium 4.6 mmol/L, chloride 102 mmol/L, bicarbonate 25 mmol/L, urea nitrogen 28 mg/dL, creatinine 1.32 mg/dL, estimated GFR 42 mL/min/1.73 m2. Glucose 162 mg/dL. Hemoglobin A1c 8.1 percent. Hemoglobin 12.4 g/dL. White cell count 7.2 thousand per microliter. Platelets 228 thousand per microliter. TSH 2.1 mIU/L. BNP 318 pg/mL. Uric acid 7.4 mg/dL. Urine albumin-to-creatinine ratio 48 mg/g. Echocardiogram: left ventricular ejection fraction 60 percent, grade II diastolic dysfunction, mild left atrial enlargement, no important valve lesion. Wells score during the dyspneic week was 1 point, low, without hemoptysis, immobilization, prior clot, or a sign of deep-vein thrombosis, so pulmonary embolism was not pursued and no D-dimer was sent.
  24| 
  25| Assessment and plan: Heart failure with preserved ejection fraction, near baseline volume. Continue furosemide 40 mg PO BID, with an extra furosemide 20 mg PO once if weight rises more than 1 kg for two mornings. Continue empagliflozin 10 mg PO daily. Avoid nonsteroidal anti-inflammatory drugs. Daily weight and a 2 g sodium limit were reviewed. Referral placed to Cardiology. No repeat imaging now.
  26| 
  27| Type 2 diabetes mellitus since 2014, hemoglobin A1c 8.1 percent. Continue metformin 1000 mg PO BID. Increase insulin glargine to 18 units SQ qHS. Daughter will call if fasting glucose is under 100 mg/dL. Referral placed to the Diabetes Center for teaching on hypoglycemia and injection technique. Foot examination as above.
  28| 
  29| Parkinson disease. Continue carbidopa-levodopa 25/100 mg PO TID before meals. Do not increase the dose today, given the orthostatic drop. Physical therapy referral for gait. Avoid metoclopramide and antipsychotics.
  30| 
  31| Gout flare resolved. Prednisone 40/30/20/10 mg is complete. Continue allopurinol 100 mg PO daily and acetaminophen 650 mg PO q6h PRN. Call for a hot joint, fever, or inability to bear weight.
  32| 
  33| Chronic kidney disease stage 3, creatinine 1.32 mg/dL, stable. Continue lisinopril 10 mg PO daily. Pregabalin (Lyrica) stays at 75 mg PO BID for the level of renal function. Recheck chemistry in six weeks.
  34| 
  35| COPD. Continue tiotropium 2.5 mcg inhaled daily and albuterol HFA 2 puffs q6h PRN. No antibiotic.
  36| 
  37| Lumbar spinal stenosis with tolerable pain. No Pain Clinic referral today. That service remains available if walking declines.
  38| 
  39| Prevention. Schedule repeat colonoscopy, last done in 2018 after polypectomy of a tubular adenoma. Continue atorvastatin 40 mg PO qHS and aspirin 81 mg PO daily. Levothyroxine 75 mcg PO daily unchanged.
  40| 
  41| Follow up in the clinic in six weeks, sooner for gain in weight, worse dyspnea, syncope, or fasting glucose over 250 mg/dL. The covering pharmacist will go over the pillbox with her daughter, including the glargine change and the completed steroid course.
  42| 
  43| Author: attending physician, general internal medicine
  44| Electronically signed by the attending physician
  45| Clinic: general internal medicine
  46| Copied to the covering pharmacist
=== END DOCUMENT ===

=== DOCUMENT fd-0090 ===
   1| CLINICAL PROGRESS NOTE
   2| Date of Service: 03-18-2026
   3| PATIENT: WURAL, SINAN
   4| DOB: 05-12-1934
   5| Age: ninety-one years old
   6| Account Number: AC-8402917
   7| Address: 1428 Kapiolani Blvd, Apt 6C, Honolulu, HI 96814
   8| Telephone: (808) 555-0142 ext. 312
   9| Attending Physician: TALIA MALIMALI, MD
  10| 
  11| SUBJECTIVE:
  12| Mr. Sinan Wural is a ninety-one years old gentleman with a documented history of Parkinson disease, complete heart block status-post dual-chamber pacemaker placement, essential hypertension, and chronic kidney disease stage 3a who presents for scheduled outpatient geriatric follow-up. The patient is accompanied today by his daughter-in-law, Mrs. Maeve O'Brien-Cleary, who provides supportive collateral history. Mrs. O'Brien-Cleary notes that over the past month, Mr. Wural has experienced increased resting tremors in his right hand and mild freezing episodes when initiating ambulation down hallways. He has had no syncope, palpitations, chest pressure, orthopnea, or falls. Pacemaker interrogation was performed last week; device serial number PXC901842 showed 99% atrial pacing, 2% ventricular pacing, and battery longevity estimated at 6.4 years with normal lead impedance. Appetite is fair. Bowel habits are maintained on scheduled docusate.
  13| 
  14| CURRENT MEDICATIONS:
  15| 1. Carbidopa-levodopa 25/100 mg PO TID.
  16| 2. Amlodipine 5 mg PO daily.
  17| 3. Atorvastatin 20 mg PO at bedtime.
  18| 4. Polyethylene glycol 17 g PO daily PRN constipation.
  19| 
  20| PHYSICAL EXAMINATION:
  21| Vitals: BP 128/76 mmHg, pulse 70 bpm regular (paced), respirations 16 /min, temperature 98.1 F, SpO2 97% on room air. Weight 68.2 kg.
  22| General: Pleasant, frail elderly male in no acute distress, alert and oriented x 3.
  23| HEENT: Normocephalic, atraumatic. Extraocular movements intact without nystagmus. Mild facial masking consistent with Parkinson disease.
  24| Cardiovascular: Regular rate and rhythm, normal S1 and S2, crisp pacing clicks, no murmurs.
  25| Pulmonary: Lungs clear to auculatation bilaterally; no crackles or wheezes.
  26| Abdomen: Soft, non-tender, non-
  27| distended. Bowel sounds normoactive.
  28| Neurological: Cranial nerves II-XII grossly intact. Motor strength 5/5 bilaterally in upper and lower extremities with mild cogwheel rigidity elicited at the right wrist and right elbow. Moderate resting pill-rolling tremor in right hand that suppresses with intentional movement. Rapid alternating movements mildly slowed on the right. Bilatral patellar reflexes 1+. Gait is moderately shuffling with reduced right arm swing, but patient turns without loss of balance using a four-wheeled rolling walker.
  29| Skin: Warm, dry. Pacemaker site in left prepectoral region is clean, dry, and intact with no erythema, tenderness, or erosion.
  30| 
  31| ASSESSMENT AND PLAN:
  32| Sinan Wural is a ninety-one years old male with Parkinson disease and cardiac pacemaker, presenting with progression of motor symptoms.
  33| 1. Parkinson disease: Motor fluctuations with prominent tremor and freezing episodes. Will increase carbidopa-levodopa from 25/100 mg TID to one and a half tablets (37.5/150 mg) PO TID. Physical therapy referral submited for gait retraining and balance maintenance.
  34| 2. Pacemaker status: Device PXC901842 operating satisfactorily with stable parameters. Continue annual cardiology follow-up.
  35| 3. Follow-up: Recheck in geriatric clinic in six weeks. Mrs. O'Brien-Cleary was instructed to contact our office if freezing worsens or dizziness develops.
  36| 
  37| Provider Signature:
  38| TALIA MALIMALI, MD
  39| Attending Geriatrician
  40| Staff Fellow: Dr. Keanu Kalama
=== END DOCUMENT ===

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

=== DOCUMENT fd-0294 ===
   1| Discharge Summary
   2| Patient Name: BABATUNDE TAGBO
   3| Account Number: 6041 3829 15
   4| Date of Admission: Nov. 8, 2026
   5| Discharge Date: Nov. 12, 2026
   6| Primary Care Clinic: Pine Grove Rehabilitation Center
   7| Contact Telephone: (404) 555-0144
   8| Home Address: 482 Highland Avenue, Atlanta, GA 30312
   9| Emergency Contact: Aylin Demir (partner)
  10| Care Team: Dr. Miriam Feinstein (Attending), Dr. Ari Levin (Resident), Leah Goldfarb, RN (Primary Nurse)
  11| 
  12| Service: Internal Medicine
  13| Admission Diagnosis: Acute unprovoked deep vein thrombosis of the left lower extremity.
  14| Discharge Diagnosis: Left lower extremity deep vein thrombosis, resolved acute pain.
  15| 
  16| History of Present Illness:
  17| Mr. Tagbo is a 52-year-old male who presented with four days of progressive left calf swelling, erythema, and calf tenderness. In the emergency department, his Wells score for DVT was calculated at 3 points (high probability), prompting a lower extremity duplex ultrasound which demonstrated an occlusive thrombus in the left popliteal and posterior tibial veins. He denied chest pain, shortness of breath, or hemoptysis. He has no prior personal history of venous thromboembolism.
  18| 
  19| Hospital Course:
  20| Upon admission to the medical floor under the care of Dr. Miriam Feinstein and Dr. Ari Levin, the patient was initiated on enoxaparin 1 mg/kg subcutaneously every 12 hours as bridging therapy, alongside apixaban 10 mg PO BID. Over the subsequent 72 hours, his leg pain and edema improved significantly. Serial examinations revealed progressive softening of the gastrocnemius compartment with resolving erythema and decreasing circumference discrepancy between the lower extremities. Repeat duplex ultrasound confirmed non-propagation of the popliteal clot. He remained hemodynamically stable throughout the stay with blood pressure averaging 124/78 mmHg and heart rate 68 to 74 beats per minute. Ambulatory saturation remained 98% on room air. PT/INR and complete metabolic panel were unremarkable; baseline serum creatinine was 0.92 mg/dL. He toelrated oral intake and physical therapy without complication. Prior to discharge, apixaban was transitioned to maintenance planning, and he was provided with educational materials regarding signs of bleeding and pulmonary embolism. His partner, Aylin Demir, was present for nursing education delivered by Leah Goldfarb, RN, and confirmed understanding of the medication schedule and red-flag symptoms.
  21| 
  22| Discharge Medications:
  23| 1. Apixaban 10 mg oral tablet, take 1 tablet PO BID through Nov. 15, 2026, then decrease to 5 mg PO BID for 6 months. Rx 6912048-D.
  24| 2. Acetaminophen 500 mg oral tablet, take 1 to 2 tablets PO every 6 hours PRN mild calf ache.
  25| 
  26| Follow-Up Plan:
  27| The patient was dischaged in stable condition. He will follow up with Dr. Miriam Feinstein at Pine Grove Rehabilitation Center on Nov. 24, 2026, for repeat clinical assesment and therapeutic monitoring.
  28| 
  29| Miriam Feinstein, MD
  30| Attending Physician, Department of Medicine
=== END DOCUMENT ===

=== DOCUMENT fd-0079 ===
   1| OUTPATIENT HISTORY AND PHYSICAL
   2| Patient: Golnar Pirouzmehr
   3| MRN: 5830241
   4| DOB: 19 August 1931
   5| Age: 94
   6| Date of Service: March 18, 2026
   7| Author: Dorothy K. Ellsworth, MD
   8| Location: general internal medicine clinic
   9| 
  10| Mailing label on the scanned packet:
  11| 1480 CEDAR RIDGE DRIVE, APT 2B, HESTERVILLE, IA 50148
  12| 
  13| Chief complaint: Hospital follow-up after a fall.
  14| 
  15| History of present illness: Golnar Pirouzmehr is a 94-year-old woman with Parkinson disease who is seen with her daughter, Ruth Calder, fourteen days after a short admission to Quenby Memorial Hospital. She was admitted 4 March 2026 after a ground-level fall in the hallway at home. She did not lose consciousness. The Glasgow Coma Scale in the emergency unit was 15, and because she takes an anticoagulant, a noncontrast CT of the head was obtained and showed no hemorrhage and no mass. Radiographs of the pelvis and right hip showed no fracture. A skin tear on the right forearm was closed with adhesive strips. She was dry on arrival, received intravenous fluid, and went home after physical therapy cleared a supervised walk with her rolling walker. Ruth Calder, who is her daughter and healthcare proxy, has stayed overnight since discharge and describes no further fall, no chest pain, and no fever. Pirouzmehr's orthostatic symptoms are the main concern today: lightheadedness on standing, without syncope. Home blood pressures brought in by her daughter run lower upright than seated. Bowel movements have slowed since the stay. Pain at a prior L1 compression fracture, followed at Pain Clinic, is unchanged and is controlled with acetaminophen. Appetite is fair. She denies melena, dysuria, cough, and headache.
  16| 
  17| Past medical history: Parkinson disease diagnosed in 2017. Atrial fibrillation on anticoagulation. Osteoporosis with an L1 vertebral compression fracture after a remote fall, treated with vertebral augmentation. Hypertension. Hypothyroidism. Chronic constipation. Age-related hearing loss. Cataract extraction from both eyes. No diabetes. No known coronary disease. No prior hip fracture.
  18| 
  19| Allergies: No known drug allergy. Adhesive tape causes a mild rash. No contrast reaction during the recent CT.
  20| 
  21| Medications: carbidopa-levodopa 25/100 mg PO TID, on an empty stomach. apixaban 2.5 mg PO BID. amlodipine 5 mg PO daily. levothyroxine 50 mcg PO each morning. acetaminophen 650 mg PO q6h PRN pain. polyethylene glycol 17 g PO daily. calcium carbonate 500 mg PO BID with meals. cholecalciferol 1000 units PO daily. senna 8.6 mg PO qHS PRN constipation. A new prescription for polyethylene glycol was sent today under Rx 7701842 so the daughter can refill it without a delay. Her health plan member ID is 6104-8831-27.
  22| 
  23| Social history: Widowed and lives alone in a single-level apartment, with her daughter staying overnight since the fall. She worked as a seamstress. She does not use alcohol or tobacco. Her daughter can be reached at 27 Willow Lane, Hesterville, IA 50149, and by phone at (515) 555-0136. For a morning weight or blood pressure concern the clinic nurse line is 515.555.0188.
  24| 
  25| Family history: Parents died of old age. One sister had a stroke. No known Parkinson disease in the family. Her daughter is well.
  26| 
  27| Review of systems: No chest pain, no palpitations today, no hemoptysis, no melena, no dysuria, no new weakness, and no severe headache. Constipation as above. Hearing is poor without the right-sided aid. Mood is steady, and she is frustrated by the loss of confidence after the fall.
  28| 
  29| Physical examination: Alert and oriented, hypophonic speech, no distress. Blood pressure 148/72 mmHg seated and 118/64 mmHg standing at two minutes, with reproduced lightheadedness and no syncope. Heart rate 78 beats per minute seated and 86 standing, irregularly irregular. Temperature 36.4 C. Respiratory rate 16 breaths per minute. Oxygen saturation 97 percent on room air. Weight 52.4 kg. Height 155 cm. Hearing aid in the right ear. Dry mucosa. No jugular venous distention. Lungs clear. Heart irregular, no murmur, no gallop. Abdomen soft. No pretibial edema. Right forearm skin tear is closed and clean. Neurologic exam shows masked facies, resting tremor of the left hand, mild rigidity, and shuffling gait with a walker. Strength is symmetric. A healing skin tear does not limit use of the arm.
  30| 
  31| Studies and labs from the admission, reviewed today: sodium 136 mmol/L, potassium 4.1 mmol/L, urea nitrogen 22 mg/dL, creatinine 1.10 mg/dL, glucose 108 mg/dL, hemoglobin 11.8 g/dL, white cell count 6.1 thousand per microliter, platelets 190 thousand per microliter, TSH 3.2 mIU/L. Urinalysis was bland. Electrocardiogram showed atrial fibrillation with a ventricular rate in the 80s and no acute ischemic change. Noncontrast head CT and hip and pelvis radiographs were negative, as above. The scanned face sheet prints an old chart number as 88O21l46. After-visit instructions for the daughter are posted at https://portal.example.com/results/44921.
  32| 
  33| Pain Clinic is the specialty practice following her vertebral fracture. Office address:
  34| 410 North Market Street
  35| Hesterville, IA 50148
  36| 
  37| Assessment and plan: Parkinson disease with a recent ground-level fall and orthostatic hypotension. Continue carbidopa-levodopa 25/100 mg PO TID. Do not add an anticholinergic. Hold amlodipine 5 mg PO daily for now because the standing pressure was 118/64 mmHg with symptoms. Recheck seated and standing pressures with her daughter this week. She should rise slowly, wear compression stockings by day, and aim for about 1.5 liters of fluid if no swelling appears. Physical therapy continues, and the walker is to be used for every transfer. No nighttime sedation.
  38| 
  39| Atrial fibrillation. Continue apixaban 2.5 mg PO BID, reduced for age and for weight under 60 kg. Do not add aspirin. The ventricular rate is acceptable. Bleeding precautions were reviewed with her daughter.
  40| 
  41| Osteoporosis with a prior vertebral compression fracture. Acetaminophen 650 mg PO q6h PRN is sufficient. Avoid nonsteroidal anti-inflammatory drugs. Continue calcium carbonate 500 mg PO BID and cholecalciferol 1000 units PO daily. Further drug therapy for bone was deferred after a discussion of falls and frailty. Follow-up remains with the specialty practice named above.
  42| 
  43| Constipation. Continue polyethylene glycol 17 g PO daily and senna 8.6 mg PO qHS PRN if there is no stool by evening. Call for abdominal pain or vomiting.
  44| 
  45| Hypothyroidism. Continue levothyroxine 50 mcg PO each morning, separated from calcium by four hours. TSH is acceptable.
  46| 
  47| Forearm skin tear. Keep the strips dry and watch for redness, warmth, or drainage.
  48| 
  49| Return to the clinic in two weeks, sooner for a repeated fall, syncope, black stool, focal weakness, or poor intake that threatens the anticoagulant. Her daughter will bring a written pressure log.
  50| 
  51| Dorothy K. Ellsworth, MD
  52| Attending physician, general internal medicine
  53| Electronically signed
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.