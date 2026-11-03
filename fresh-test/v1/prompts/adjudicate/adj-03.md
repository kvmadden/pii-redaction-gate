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


=== DOCUMENT fd-0083 ===
   1| RIVER ROAD CLINIC
   2| MEDICATION THERAPY MANAGEMENT & PRIOR AUTHORIZATION INTAKE NOTE
   3| DEPARTMENT OF CLINICAL PHARMACY
   4| 
   5| PATIENT IDENTIFICATION & CONTACT:
   6| NAME: ETIENNE DE LA TOUR
   7| DOB: March 14, 1933
   8| AGE: 93-year-old male
   9| MEMBER ID: 5821-4409-18
  10| HOME ADDRESS:
  11| 418 Royal Street, Suite 2A
  12| New Orleans, LA 70130
  13| PRIMARY CAREGIVER: Dawn M. Campbell (patient's granddaughter and primary caregiver)
  14| CAREGIVER PHONE: (504) 555-0182
  15| 
  16| PRESCRIBING CLINICIAN:
  17| Andrés R. Gómez-Navarro, MD
  18| River Road Clinic - Geriatric Medicine
  19| Clinician Email: andres.gomez@example.org
  20| 
  21| DOCUMENTATION INTAKE:
  22| Intake completed by Valeria Case Velásquez, CPhT.
  23| Date of Intake Review: October 22, 2026.
  24| 
  25| PURPOSE OF NOTE:
  26| Prior authorization appeal and medication regimen review for anticoagulation and cardiopulmonary maintenance therapy following recent cardiology consultation.
  27| 
  28| CLINICAL HISTORY & VITAL SIGNS:
  29| The patient is a 93-year-old male with a medical history notable for non-valvular atrial fibrillation, stage 3 chronic kidney disease, osteoporosis, and recurrent venous thromboembolism. He was seen in clinic on October 22, 2026 by Dr. Andrés R. Gómez-Navarro for routine monitoring and therapy reassessment.
  30| 
  31| Recorded Vitals:
  32| - Blood Pressure: 132/76 mmHg
  33| - Heart Rate: 72 bpm, irregular
  34| - Respiratory Rate: 17 breaths/min
  35| - Oxygen Saturation: 96% on room air
  36| - Weight: 62.4 kg, Height: 168 cm, BMI: 22.1 kg/m2
  37| 
  38| Current Laboratory Values (drawn October 20, 2026):
  39| - Serum Creatinine: 1.34 mg/dL
  40| - Blood Urea Nitrogen: 28 mg/dL
  41| - Estimated GFR (CKD-EPI): 48 mL/min/1.73 m2
  42| - Serum Potassium: 4.4 mEq/L
  43| - Hemoglobin: 11.8 g/dL
  44| - Hematocrit: 35.4%
  45| - Platelet Count: 198,000 /uL
  46| - International Normalized Ratio (INR): 1.1
  47| 
  48| MEDICATION RECONCILIATION & CLINICAL ASSESSMENT:
  49| Valeria Case Velásquez conducted a detailed phone consultation with Dawn M. Campbell regarding home administration. Ms. Campbell confirmed that her grandfather adheres strictly to his pill organizer and has experienced no bleeding episodes, dark stools, or sudden bruising.
  50| 
  51| Reconciled Medication List:
  52| 1. Apixaban (Eliquis) 2.5 mg PO BID. Prior authorization renewal requested. The reduced dose of 2.5 mg BID is clinically indicated based on FDA labeling criteria: patient meets two threshold criteria (age >= 80 at 93 years old, and serum creatinine >= 1.5 mg/dL was noted historically during acute illness, with current serum creatinine 1.34 mg/dL and weight < 60 kg at last nadir).
  53| 2. Metoprolol succinate extended-release 25 mg PO daily for rate control.
  54| 3. Alendronate sodium 70 mg PO once weekly on Sunday mornings with full glass of water.
  55| 4. Calcium carbonate / vitamin D3 600 mg / 400 IU PO BID with meals.
  56| 5. Acetaminophen 500 mg PO q8h PRN for osteoarthritis joint discomfort.
  57| 
  58| PRIOR AUTHORIZATION APPEAL DETAILS:
  59| The patient's health plan issued an initial denial requiring trial of warfarin before approving direct oral anticoagulants. Dr. Gómez-Navarro and the clinical pharmacy team at River Road Clinic are appealing this determination. Dawn explained that Mr. de la Tour has significant mobility limitations making frequent clinic visits for routine venipuncture and INR monitoring hazardous due to fall risk. Furthermore, apixaban has maintained excellent thromboembolic prophylaxis over the past eighteen months without hemorrhagic events.
  60| 
  61| PHARMACY ACTION PLAN:
  62| 1. Valeria Case Velásquez compiled the chart notes, lab panels, and physician letter of medical necessity and transmitted them to the health plan utilization review committee under prior authorization reference 5821-4409-18.
  63| 2. Direct formulary policy guidelines and appeal submission status are tracked online at https://portal.example.org/appeals/case-review.
  64| 3. Follow-up phone consultation arranged with Dawn M. Campbell to convey coverage determination within three business days.
  65| 4. Bridge supply of apixaban 2.5 mg coordinated through River Road Clinic charitable pharmacy dispensary to prevent therapy interruption.
  66| 
  67| Valeria Case Velásquez, CPhT
  68| Clinical Pharmacy Intake Coordinator, River Road Clinic
=== END DOCUMENT ===
ITEMS FOR fd-0083:
D1 | line 33 | A: KEEP "Heart Rate: 72 bpm, irregular" | B: KEEP "Heart Rate: 72 bpm"
D2 | line 35 | A: KEEP "Oxygen Saturation: 96% on room air" | B: KEEP "Oxygen Saturation: 96%"
D3 | line 49 | A: RELATIVE "Campbell" | B: (nothing)
D4 | line 52 | A: AGE "80" | B: (nothing)
K1 | line 2 | KEEP "MEDICATION THERAPY MANAGEMENT & PRIOR AUTHORIZATION INTAKE NOTE"
K2 | line 3 | KEEP "DEPARTMENT OF CLINICAL PHARMACY"
K3 | line 18 | KEEP "Geriatric Medicine"
K4 | line 31 | KEEP "Recorded Vitals"
K5 | line 38 | KEEP "Current Laboratory Values"
K6 | line 49 | KEEP "bleeding episodes"
K7 | line 49 | KEEP "dark stools"
K8 | line 49 | KEEP "sudden bruising"
K9 | line 51 | KEEP "Reconciled Medication List"
K10 | line 52 | KEEP "serum creatinine >= 1.5 mg/dL"
K11 | line 52 | KEEP "serum creatinine 1.34 mg/dL"
K12 | line 52 | KEEP "weight < 60 kg"
K13 | line 55 | KEEP "with meals"
K14 | line 59 | KEEP "INR"
K15 | line 59 | KEEP "hemorrhagic events"

=== DOCUMENT fd-0085 ===
   1| Subject: Paper copy of the visit summary
   2| 
   3| Hello,
   4| 
   5| Please send the paper copy of the full outpatient visit summary for Clara
   6| Steinhauer, who is ninety-three years old, to her son Paul Whitaker, who
   7| holds the signed release. The visit on 28.09.2026 reviewed dizziness on
   8| standing and a small skin tear on the shin. The shin tear was cleaned and
   9| dressed. Watch for spreading redness, pus, or fever, and keep the leg raised
  10| when she is seated. Her appetite is fair and her weight has been steady.
  11| She uses a walker in the hall. The blood pressure log shows lower numbers
  12| after she stands, so she should pause at the side of the bed before walking.
  13| 
  14| Per Dr. Hargreave's note, continue amlodipine 5 mg PO daily, atorvastatin
  15| 20 mg PO nightly, and acetaminophen 650 mg PO q6h PRN pain. Do not start
  16| ibuprofen. Continue the present pills with a full glass of water, and bring
  17| the bottles to the next discussion so they can be matched to this list.
  18| Please recieve the chart back by the end of the week so a seperate referral
  19| can be filed if the tear is not healing. A caregiver reported one fall
  20| without head injury and without loss of conciousness.
  21| 
  22| Call the clinic line at (218) 555-0177 ext. 214 if the family needs the
  23| summary read aloud. Thank you for moving this packet.
  24| 
  25| Health information desk
=== END DOCUMENT ===
ITEMS FOR fd-0085:
K1 | line 8 | KEEP "skin tear"
K2 | line 8 | KEEP "shin tear"
K3 | line 8 | KEEP "cleaned and\ndressed"
K4 | line 19 | KEEP "tear"
K5 | line 19 | KEEP "fall"
K6 | line 20 | KEEP "head injury"
K7 | line 20 | KEEP "loss of conciousness"

=== DOCUMENT fd-0095 ===
   1| 8834219 AVERILL, WHITE
   2| Bramwell Memorial Hospital
   3| Discharge Summary
   4| DOB: January 8, 1932
   5| Admitted: 03/14/2026
   6| Account 4402917
   7| 
   8| White Averill is a 94-year-old man admitted after a ground-level fall with a
   9| left femoral neck fracture. He was discharged on the 18th of March 2026 to
  10| the home of his daughter, Mrs. Anahit Petrosyan, who is 68 and will provide
  11| meals and supervision. He has lived alone since his wife died. Osteoporosis
  12| was known. He also has atrial fibrillation, hypertension, and mild hearing
  13| loss. There is no dementia by his daughter's report, and he manages his own
  14| medicines with a weekly box.
  15| 
  16| Before the fall he was independent in bathing and dressing and walked in his
  17| building without a cane. The fall happened when he turned quickly in the
  18| kitchen. He did not lose consciousness and he did not hit his head. There
  19| was no chest pain and no palpitation beforehand. Home medicines also
  20| included a stool softener used only as needed and artificial tears. He has
  21| no drug allergy. He drank little in recent years and stopped tobacco as a
  22| young man. His daughter, Mrs. Anahit Petrosyan, manages the bills and was
  23| present for consent. She understands the signs of bleeding on apixaban and
  24| will watch the incision each day.
  25| 
  26| On arrival the left leg was shortened and externally rotated. He had pain
  27| with any motion at the hip and no sensory loss in the foot. Dorsalis pedis
  28| pulses were present. Temperature was 36.8 C, blood pressure 148/70 mmHg,
  29| heart rate 82 beats per minute and irregular, respiratory rate 16 breaths
  30| per minute, and oxygen saturation 96 percent on room air. Electrocardiogram
  31| showed atrial fibrillation with a controlled rate and no acute ST-segment
  32| change. Chest radiograph showed no infiltrate and no pleural effusion.
  33| Sodium was 136 mmol/L, potassium 4.0 mmol/L, and glucose 112 mg/dL. The
  34| international normalized ratio was 1.2. A urine dipstick was bland.
  35| 
  36| Radiographs of the pelvis and hip confirmed a displaced femoral neck
  37| fracture, and the implant choice was discussed with his daughter before he
  38| went to the operating room.
  39| 
  40| Dr. Eleanor Briggs of the orthopaedic service performed a cemented bipolar
  41| hemiarthroplasty on the day of admission.
  42| In the preoperative holding area the full consent was read aloud to White
  43| Averill and was also signed by his daughter. Spinal anesthesia was used.
  44| Estimated blood loss was 200 mL. A drain was not placed. He recieved
  45| cefazolin 2 g IV before the incision and two further doses at 8-hour
  46| intervals. Apixaban was held the morning of surgery and restarted on the
  47| first postoperative day once the dressing stayed dry. Metoprolol tartrate 25
  48| mg PO BID and lisinopril 10 mg PO daily were continued. A bladder catheter
  49| placed for the case was removed the next morning, and he voided.
  50| 
  51| Postoperative course. He stood with physical therapy on the first day and
  52| walked a short distance with a walker on the second. Pain was controlled with
  53| acetaminophen 650 mg PO every 6 hours and oxycodone 2.5 mg PO every 6 hours
  54| as needed. Hemoglobin fell from 12.4 g/dL to 9.8 g/dL and then held.
  55| Creatinine remained 1.1 mg/dL. He had one episode of transient confusion at
  56| night that cleared by morning and was felt to be postoperative, not a new
  57| stroke. No wound drainage occured. A seperate therapy note describes safe
  58| transfers with supervision. His daughter stayed each afternoon and practiced
  59| the hip precautions with him: no bending past a right angle, no crossing the
  60| legs, and no twisting to reach the nightstand.
  61| 
  62| Weight bearing was allowed as tolerated in the cemented bipolar implant.
  63| Occupational therapy fitted a sock aid and a reacher. The bed was kept low,
  64| night checks were limited, and his hearing aid stayed in place so that
  65| confusion would not be worsened by isolation. Bowel function returned with
  66| docusate and a dose of senna on the second evening. Appetite was fair. He
  67| ate more than half of his meals on the day before discharge. Venous
  68| thrombosis prophylaxis after the procedure was the resumed apixaban rather
  69| than an injection, which suited him because he had already been stable on
  70| that drug. The case manager arranged a walker for the daughter's home and
  71| confirmed the doorway would clear it. No skilled nursing placement was
  72| required.
  73| 
  74| Discharge condition and medicines.
  75| Apixaban 5 mg PO BID, resumed.
  76| Acetaminophen 650 mg PO every 6 hours for five days, then as needed.
  77| Oxycodone 2.5 mg PO every 6 hours as needed for pain, small supply.
  78| Docusate 100 mg PO BID.
  79| Calcium carbonate 500 mg PO BID with meals and cholecalciferol 1000 IU PO
  80| daily.
  81| Metoprolol tartrate 25 mg PO BID.
  82| Lisinopril 10 mg PO daily.
  83| A bowel regimen should be used while opioid doses continue.
  84| He tolerates a regular diet.
  85| 
  86| Follow-up. Staples or skin adhesive will be checked at the orthopaedic visit.
  87| Call for fever, calf swelling, chest pain, or a wound that opens. The
  88| daughter can reach the orthopaedic office at (415) 555-0142 and the
  89| after-hours line at 415.555.0176.
  90| Printed instructions are also at https://records.example.org/note/8834219.
  91| He will stay at 14 Sable Court, Unit 5, Red Hollow, MT 59777, which is Mrs.
  92| Anahit Petrosyan's home, until he is safe on stairs. A claim for the implant
  93| was filed under Claim number 66120488. Dr. Eleanor Briggs discussed weight
  94| bearing as tolerated and answered his questions on the day of discharge.
  95| 
  96| Signed,
  97| Eleanor Briggs, MD
  98| Orthopaedic Surgery
  99| Bramwell Memorial Hospital
=== END DOCUMENT ===
ITEMS FOR fd-0095:
D1 | line 9 | A: KEEP "left femoral neck fracture" | B: KEEP "femoral neck fracture"
D2 | line 9 | A: DATE "the 18th of March 2026" | B: DATE "18th of March 2026"
D3 | line 12 | A: KEEP "mild hearing\nloss" | B: KEEP "hearing\nloss"
D4 | line 30 | A: KEEP "oxygen saturation 96 percent on room air" | B: KEEP "oxygen saturation 96 percent"
D5 | line 34 | A: KEEP "urine dipstick was bland" | B: KEEP "urine dipstick"
D6 | line 36 | A: KEEP "displaced femoral neck\nfracture" | B: KEEP "femoral neck\nfracture"
K1 | line 8 | KEEP "ground-level fall"
K2 | line 20 | KEEP "as needed"
K3 | line 20 | KEEP "artificial tears"
K4 | line 31 | KEEP "acute ST-segment\nchange"
K5 | line 32 | KEEP "infiltrate"
K6 | line 40 | KEEP "orthopaedic service"
K7 | line 44 | KEEP "Estimated blood loss was 200 mL"
K8 | line 45 | KEEP "8-hour\nintervals"
K9 | line 51 | KEEP "physical therapy"
K10 | line 55 | KEEP "transient confusion"
K11 | line 63 | KEEP "Occupational therapy"
K12 | line 67 | KEEP "Venous\nthrombosis prophylaxis"
K13 | line 98 | KEEP "Orthopaedic Surgery"

=== DOCUMENT fd-0099 ===
   1| TRANSCRIPT LOG: INCOMING CLINICAL CALL
   2| Date of Call: 18.09.2026
   3| Facility: Pine Valley Medical Clinic
   4| Triage Station: East Wing Nurse Line
   5| 
   6| NURSE BROOKS: Pine Valley Medical Clinic triage, this is Nurse Evelyn Brooks speaking. How can I, um, how can I help you today?
   7| 
   8| CALLER: Hello, yes, uh, good morning. My name is Donald Yates. I'm calling, uh, calling about my mother, Kathleen Yates-O'Donnell. She's, um, she's having some trouble with her medicine, and also we got locked out of her online portal this morning.
   9| 
  10| NURSE BROOKS: Okay, Mr. Yates, I can certainly help you with both of those things. Before we go into the clinical details, I just need to verify her information for her chart. Could you give me her date of birth and her current street address?
  11| 
  12| CALLER: Yes, of course. Her DOB is 24.03.1932. She is ninety-four years old now. And her address is 418 Crestview Terrace, Spokane, Washington 99203.
  13| 
  14| NURSE BROOKS: Perfect, thank you. And do you have her account number or billing reference handy from her statement?
  15| 
  16| CALLER: Uh, yeah, let me pull up the paper. The account number is AC-739104.
  17| 
  18| NURSE BROOKS: Got it. And what is the best contact phone number to reach you or her if the provider needs to call back?
  19| 
  20| CALLER: Well, my mobile phone is +1-503-555-0182, but her primary home phone number is, uh, let me read it slowly, five five five, zero one four two.
  21| 
  22| NURSE BROOKS: Thank you, five five five, zero one four two. Now, tell me what is going on with Mrs. Yates-O'Donnell's medications.
  23| 
  24| CALLER: Well, um, her neurologist, Dr. Russell Wagner, started her on carbidopa-levodopa 25/100 mg three times a day for her Parkinson disease about two weeks ago. But yesterday evening and again this morning, she had, uh, she had noticeable resting tremor in her right hand and some stiffness when getting up from her chair. Her blood pressure was 134/78 mmHg and her heart rate was 72 beats per minute. We were trying to send a secure message to Dr. Wagner, but the portal kept throwing an authentication error.
  25| 
  26| NURSE BROOKS: I see. Let me look at the system access logs right now. Ah, yes, I see the portal lockout. It looks like there was a flagged remote login attempt from IP address 198.51.100.68 at approximately 07:15. That triggered an automated security hold. I just reset the credentials and cleared that flag, so you should be able to log back in shortly.
  27| 
  28| CALLER: Oh, thank goodness. That IP address was probably my tablet on my home Wi-Fi network.
  29| 
  30| NURSE BROOKS: That makes sense. As for her Parkinson disease symptoms, I am documenting the increased rigidity and hand tremor in Mrs. Yates-O'Donnell's record right now. I will route an urgent clinical encounter message to Dr. Wagner's medical assistant. If she develops any swallowing difficulty, sudden falls, or severe freezing of gait, please take her to the nearest emergency room immediately. Otherwise, expect a return call from Dr. Wagner or his triage nurse before 3:00 PM today.
  31| 
  32| CALLER: Okay, thank you so much, Nurse Brooks. We will keep a close eye on her.
  33| 
  34| NURSE BROOKS: You are welcome, Mr. Yates. Take care.
=== END DOCUMENT ===
ITEMS FOR fd-0099:
D1 | line 24 | A: KEEP "blood pressure was 134/78 mmHg" | B: KEEP "134/78 mmHg"
D2 | line 24 | A: KEEP "heart rate was 72 beats per minute" | B: KEEP "72 beats per minute"
D3 | line 24 | A: CLINICIAN "Wagner" | B: (nothing)
D4 | line 30 | A: KEEP "rigidity" | B: KEEP "increased rigidity"
K1 | line 1 | KEEP "TRANSCRIPT LOG: INCOMING CLINICAL CALL"
K2 | line 4 | KEEP "East Wing Nurse Line"
K3 | line 24 | KEEP "stiffness"
K4 | line 30 | KEEP "swallowing difficulty"
K5 | line 30 | KEEP "sudden falls"

=== DOCUMENT fd-0103 ===
   1| CLINICAL CASE MANAGEMENT AND REFERRAL COORDINATION SUMMARY
   2| SERVICE COORDINATION MEMORANDUM
   3| 
   4| SUBJECT: COMPLEX CARE TRANSITION AND PHARMACY BENEFIT REVIEW
   5| 
   6| This administrative summary outlines the comprehensive clinical status,
   7| treatment timeline, and ongoing therapeutic regimen for the patient, a
   8| 54-year-old female evaluated for treatment-refractory neuropathic pain
   9| and cranial neuropathy. Diagnostic records transferred from Outside
  10| Hospital corroborate a clinical onset dating back to an initial viral
  11| syndrome diagnosed in 2021, which subsequently manifested as acute
  12| right-sided facial paresis consistent with Bell palsy. Although facial
  13| motor function demonstrated substantial recovery following an initial
  14| course of oral corticosteroids, the patient developed persistent
  15| secondary trigeminal and post-auricular dysesthesias accompanied by
  16| autonomic dysregulation.
  17| 
  18| Current vital signs obtained during the most recent comprehensive
  19| evaluation demonstrate clinical stability: blood pressure 128/76 mmHg,
  20| heart rate 74 bpm, respiratory rate 16 breaths/min, body temperature
  21| 98.4 F, and oxygen saturation 99% on ambient air. Recent laboratory
  22| panels show stable baseline organ function: serum creatinine 0.88 mg/dL,
  23| blood urea nitrogen 14 mg/dL, potassium 4.2 mEq/L, sodium 140 mEq/L,
  24| fasting plasma glucose 96 mg/dL, hemoglobin A1c 5.4%, and white blood
  25| cell count 5.8 x10^3/uL with normal differential. Diagnostic imaging,
  26| including contrast-enhanced magnetic resonance imaging of the brain and
  27| internal auditory canal, demonstrated no structural lesions, vascular
  28| compression, or demyelinating plaques.
  29| 
  30| An active multidisciplinary treatment plan has been established across
  31| several clinical services. The patient has completed an initial intake
  32| evaluation with Pain Clinic for neuromodulatory strategies and targeted
  33| cranial nerve blocks. A concurrent referral to Cardiology was initiated
  34| to evaluate episodic orthostatic lightheadedness prior to escalating
  35| sympatholytic pharmacotherapy. Ongoing wound monitoring through Wound
  36| Care remains on standby following minor cutaneous breakdown secondary
  37| to adhesive patches.
  38| 
  39| Medication reconciliation reflects the current active pharmacotherapy:
  40| - Lyrica 75 mg PO BID, titrated from 50 mg PO BID for neuropathic pain
  41| - gabapentin 300 mg PO TID PRN for breakthrough hyperalgesia
  42| - duloxetine 30 mg PO daily
  43| - artificial tears 1 to 2 drops in the right eye q4h PRN
  44| - prednisone 40/30/20/10 mg oral taper prescribed as a step-down burst
  45|   over twelve consecutive days during the most recent acute exacerbation
  46| 
  47| To ensure continuous coverage and avoid gaps in pharmacy fulfillment,
  48| the health plan has authorized ongoing maintenance therapy under the
  49| chronic care management protocol. The covering pharmacist has reviewed
  50| the combination of gabapentinoids and confirmed that clinical dosing
  51| remains within safe therapeutic parameters. Follow-up consultations
  52| are recommended every 2/3 weeks during the active dose titration phase.
  53| The patient and her adult daughter have received detailed counseling
  54| regarding medication administration schedules, potential somnolence,
  55| and red-flag neurological symptoms that would warrant emergency medical
  56| evaluation.
  57| 
  58| CLINICAL SERVICE COORDINATION TEAM
  59| DIVISION OF AMBULATORY CARE MANAGEMENT
=== END DOCUMENT ===
ITEMS FOR fd-0103:
D1 | line 8 | A: KEEP "treatment-refractory neuropathic pain" | B: KEEP "neuropathic pain"
D2 | line 14 | A: KEEP "oral" ; KEEP "corticosteroids" | B: KEEP "oral corticosteroids"
D3 | line 21 | A: KEEP "oxygen saturation 99% on ambient air" | B: KEEP "oxygen saturation 99%"
D4 | line 26 | A: KEEP "contrast-enhanced magnetic resonance imaging of the brain and\ninternal auditory canal" | B: KEEP "magnetic resonance imaging"
D5 | line 41 | A: KEEP "breakthrough hyperalgesia" | B: KEEP "hyperalgesia"
K1 | line 10 | KEEP "viral\nsyndrome"
K2 | line 11 | KEEP "acute\nright-sided facial paresis"
K3 | line 15 | KEEP "secondary trigeminal and post-auricular dysesthesias"
K4 | line 16 | KEEP "autonomic dysregulation"
K5 | line 27 | KEEP "structural lesions"
K6 | line 27 | KEEP "vascular\ncompression"
K7 | line 28 | KEEP "demyelinating plaques"
K8 | line 34 | KEEP "episodic orthostatic lightheadedness"
K9 | line 35 | KEEP "sympatholytic pharmacotherapy"
K10 | line 36 | KEEP "cutaneous breakdown"
K11 | line 39 | KEEP "Medication reconciliation"
K12 | line 43 | KEEP "in the right eye"
K13 | line 45 | KEEP "acute exacerbation"
K14 | line 49 | KEEP "chronic care management"
K15 | line 50 | KEEP "gabapentinoids"
K16 | line 54 | KEEP "somnolence"

=== DOCUMENT fd-0115 ===
   1| 9482014
   2| PEMBERTON REGIONAL MEDICAL CENTER
   3| DEPARTMENT OF GERIATRIC MEDICINE AND POST-ACUTE CARE
   4| CLINICAL PROGRESS NOTE
   5| Date of Evaluation: 11/04/2026
   6| 
   7| PATIENT IDENTIFICATION:
   8| Name: JENKINS, JOY
   9| Title / Salutation: Mrs. Joy Jenkins
  10| DOB: 03/14/1934
  11| Age: 92-year-old female
  12| Account # AC-7740192
  13| Primary Residence:
  14| 742 Crestview Drive, Apt 3B, Nashville, TN 37215
  15| Home Telephone: (615) 555-0148
  16| Contact Cell: 615.555.0183
  17| 
  18| ATTENDING CLINICIAN:
  19| Dr. Arthur Pendelton, MD, Geriatric Medicine
  20| FELLOW / RESIDENT:
  21| Dr. Thomas Bradley, MD
  22| PRIMARY CLINIC NURSE:
  23| Nurse Nancy Miller, RN
  24| 
  25| CHIEF COMPLAINT:
  26| Follow-up evaluation for acute uncomplicated cystitis, recent confusion,
  27| and mobility assessment following hospitalization.
  28| 
  29| HISTORY OF PRESENT ILLNESS:
  30| Mrs. Joy Jenkins is a 92-year-old widowed female who is accompanied to
  31| the geriatric clinic today by her adult son, Mr. Kenneth
  32| Jenkins, who serves as her primary caregiver and durable healthcare proxy.
  33| The patient was discharged from Pemberton Regional Medical Center on
  34| November 4th, 2026, following a three-day admission for acute delirium in
  35| the setting of an Escherichia coli urinary tract infection and mild acute
  36| kidney injury.
  37| 
  38| According to Mr. Kenneth Jenkins, the patient experienced abrupt cognitive
  39| fluctuation, decreased oral intake, and functional decline beginning five
  40| days prior to admission. During hospitalization, diagnostic workup confirmed
  41| a catheter-associated urinary tract infection treated successfully with
  42| intravenous ceftriaxone, followed by oral cefpodoxime. Diagnostic bedside
  43| cystoscopy and indwelling bladder catheterization were conducted during the
  44| inpatient stay, which confirmed severe trabeculation secondary to chronic
  45| atonic bladder without structural bladder obstruction or calculi. She was
  46| successfully decatheterized prior to release.
  47| 
  48| Today, Mrs. Joy Jenkins is alert and oriented to person, month, and year.
  49| Her son reports that her confusion has almost completely resolved, with her
  50| baseline mild cognitive impairment unchanged. She has had no fever, chills,
  51| gross hematuria, dysuria, flank tenderness, or new urinary retention over
  52| the past 48 hours. Mr. Jenkins, who is a healthy 61-year-old retired school
  53| principal, states that her appetite has improved, though she continues to
  54| require minimal assistance with transfers and ambulation using a rolling
  55| walker. Her complete inpatient records, discharge instructions, and recent
  56| imaging summaries were accessed through the secure patient portal link at
  57| https://patient.example.org/records/discharge-summary for review.
  58| 
  59| PAST MEDICAL AND SURGICAL HISTORY:
  60| 1. Recurrent urinary tract infections and neurogenic bladder.
  61| 2. Mild cognitive impairment, amnestic type.
  62| 3. Essential hypertension, longstanding.
  63| 4. Osteoarthritis of bilateral knees and lumbar spine.
  64| 5. Osteopenia without prior fragility fracture.
  65| 6. Status post right total hip hemiarthroplasty following fall (2019).
  66| 7. Prior cataract extraction with intraocular lens implants bilaterally.
  67| 
  68| CURRENT MEDICATIONS:
  69| 1. Cefpodoxime proxetil 100 mg PO BID (day 5 of 7-day course).
  70| 2. Amlodipine besylate 2.5 mg PO daily.
  71| 3. Donepezil hydrochloride 5 mg PO nightly at bedtime.
  72| 4. Calcium carbonate 600 mg with Vitamin D3 400 IU PO daily.
  73| 5. Polyethylene glycol 3350 powder 17 grams PO daily in water.
  74| 6. Acetaminophen 500 mg PO TID PRN joint pain.
  75| 
  76| ALLERGIES:
  77| Trimethoprim-sulfamethoxazole (pruritic cutaneous rash).
  78| Nitrofurantoin (nausea and peripheral neuropathy).
  79| 
  80| PHYSICAL EXAMINATION:
  81| Vital Signs:
  82| Temperature: 97.8 F (36.6 C), oral
  83| Pulse: 68 beats per minute, regular
  84| Blood Pressure: 124/72 mmHg, seated, right arm
  85| Respiratory Rate: 16 breaths per minute, unlabored
  86| Oxygen Saturation: 98% on room air
  87| Weight: 52.4 kg (115.5 lbs)
  88| Height: 59 inches (149.9 cm)
  89| Body Mass Index (BMI): 23.2 kg/m2
  90| 
  91| General: 92-year-old female, pleasant, frail, resting comfortably in
  92| wheelchair, conversant, in no acute physical distress.
  93| HEENT: Normocephalic, atraumatic. Conjunctivae pink, sclerae anicteric.
  94| Moist oral mucosa without mucosal lesions. Hearing intact with bilateral
  95| digital hearing aids.
  96| Neck: Supple, full active range of motion, no carotid bruit, no JVD.
  97| Cardiovascular: Regular rate and rhythm, normal S1 and S2, soft grade 1/6
  98| systolic ejection murmur at the right upper sternal border. Peripheral
  99| pulses 2+ bilaterally in dorsalis pedis.
 100| Lungs: Clear to auscultation bilaterally anteriorly and posteriorly. No
 101| adventitious sounds, wheezes, or crackles.
 102| Abdomen: Soft, non-tender to light and deep palpation. No guarding, rebound,
 103| or palpable masses. Suprapubic area non-tender and non-distended.
 104| Genitourinary: External female genitalia normal for age without erythema
 105| or discharge; no indwelling catheter in place.
 106| Musculoskeletal: Healed surgical scar over right lateral hip. Stable hip
 107| and knee ranges of motion without acute erythema or effusion.
 108| Neurological: Cranial nerves II-XII grossly intact. Alert, attentive.
 109| Recall 2 of 3 words at five minutes. Motor strength 4+/5 throughout all
 110| four extremities. Deep tendon reflexes 1+ bilaterally.
 111| Gait / Mobility: Able to stand with minimal one-person assistance; ambulates
 112| 30 feet with a standard rolling walker with steady, cautious cadence.
 113| Skin: Dry, intact without stage 1-4 pressure injury over sacrum or heels.
 114| 
 115| LABORATORY AND DIAGNOSTIC DATA:
 116| Serum Chemistry and Complete Blood Count (drawn yesterday, 11/04/2026):
 117|   Sodium: 138 mmol/L
 118|   Potassium: 4.0 mmol/L
 119|   Chloride: 102 mmol/L
 120|   Bicarbonate: 24 mmol/L
 121|   BUN: 18 mg/dL
 122|   Serum Creatinine: 0.88 mg/dL (normalized from peak 1.42 mg/dL)
 123|   Estimated GFR: 58 mL/min/1.73m2
 124|   White Blood Cell Count: 6.8 x10^3/uL (normalized from 14.2 x10^3/uL)
 125|   Hemoglobin: 11.2 g/dL
 126|   Platelets: 232 x10^3/uL
 127| Post-Void Residual Bladder Ultrasound:
 128|   Post-void residual volume measured at 65 mL (well within normal limits).
 129| 
 130| ASSESSMENT AND CLINICAL IMPRESSION:
 131| 1. Acute uncomplicated urinary tract infection (E. coli): Clinically
 132| resolved with significant improvement in delirium and functional status.
 133| Renal function has completely normalized following intravenous hydration.
 134| 2. Delirium, hyperactive type, resolved: Baseline cognitive function restored.
 135| 3. Neurogenic bladder / urinary retention: Favorable post-void residual volume
 136| following removal of indwelling catheter.
 137| 4. Fall risk and mobility impairment: High fall risk secondary to advanced
 138| age (92 years), visual/hearing sensory deficits, and walker dependence.
 139| 
 140| PLAN AND RECOMMENDATIONS:
 141| 1. Antimicrobial Therapy: Complete remaining 2 days of cefpodoxime proxetil
 142| 100 mg PO BID to finish full 7-day therapeutic course.
 143| 2. Bladder Care and Hydration: Maintain oral hydration of 1.5 to 2.0 liters
 144| daily. Scheduled voiding every 3 to 4 hours while awake. Post-void bladder scan
 145| can be performed PRN if abdominal discomfort or oliguria recurs.
 146| 3. Cognitive and Fall Safety: Mr. Kenneth Jenkins has arranged 24-hour home
 147| health aide coverage. Physical therapy home health evaluation ordered for gait
 148| training and home hazard assessment.
 149| 4. Follow-Up: Return to Pemberton Regional Medical Center Geriatric Clinic in
 150| six weeks, or sooner if dysuria, fever, or cognitive decline recurs.
 151| 
 152| Attending Provider Signoff:
 153| Electronically signed by:
 154| Dr. Arthur Pendelton, MD
 155| Geriatric Medicine Specialist
 156| Pemberton Regional Medical Center
=== END DOCUMENT ===
ITEMS FOR fd-0115:
D1 | line 35 | A: KEEP "Escherichia coli urinary tract infection" | B: KEEP "urinary tract infection"
D2 | line 44 | A: KEEP "atonic bladder" | B: KEEP "chronic\natonic bladder"
D3 | line 60 | A: KEEP "Recurrent urinary tract infections" | B: KEEP "urinary tract infections"
D4 | line 61 | A: KEEP "Mild cognitive impairment, amnestic type" | B: KEEP "Mild cognitive impairment"
D5 | line 63 | A: KEEP "Osteoarthritis of bilateral knees and lumbar spine" | B: KEEP "Osteoarthritis"
D6 | line 65 | A: KEEP "right total hip hemiarthroplasty" | B: KEEP "total hip hemiarthroplasty"
D7 | line 71 | A: KEEP "nightly at bedtime" | B: KEEP "nightly"
D8 | line 91 | A: AGE "92-year-old" | B: (nothing)
D9 | line 122 | A: KEEP "Serum Creatinine: 0.88 mg/dL (normalized from peak 1.42 mg/dL)" | B: KEEP "Serum Creatinine: 0.88 mg/dL"
D10 | line 124 | A: KEEP "White Blood Cell Count: 6.8 x10^3/uL (normalized from 14.2 x10^3/uL)" | B: KEEP "White Blood Cell Count: 6.8 x10^3/uL"
D11 | line 131 | A: KEEP "Acute uncomplicated urinary tract infection (E. coli)" | B: KEEP "Acute uncomplicated urinary tract infection"
D12 | line 134 | A: KEEP "Delirium, hyperactive type" | B: KEEP "Delirium"
D13 | line 135 | A: KEEP "Neurogenic bladder / urinary retention" | B: KEEP "Neurogenic bladder" ; KEEP "urinary retention"
K1 | line 4 | KEEP "CLINICAL PROGRESS NOTE"
K2 | line 18 | KEEP "ATTENDING CLINICIAN"
K3 | line 19 | KEEP "Geriatric Medicine"
K4 | line 20 | KEEP "FELLOW / RESIDENT"
K5 | line 22 | KEEP "PRIMARY CLINIC NURSE"
K6 | line 44 | KEEP "severe trabeculation"
K7 | line 45 | KEEP "structural bladder obstruction"
K8 | line 45 | KEEP "calculi"
K9 | line 51 | KEEP "gross hematuria"
K10 | line 64 | KEEP "fragility fracture"
K11 | line 66 | KEEP "intraocular lens implants"
K12 | line 77 | KEEP "pruritic cutaneous rash"
K13 | line 78 | KEEP "peripheral neuropathy"
K14 | line 91 | KEEP "General"
K15 | line 93 | KEEP "HEENT"
K16 | line 96 | KEEP "Neck"
K17 | line 97 | KEEP "Cardiovascular"
K18 | line 97 | KEEP "grade 1/6\nsystolic ejection murmur"
K19 | line 99 | KEEP "pulses 2+"
K20 | line 100 | KEEP "Lungs"
K21 | line 102 | KEEP "Abdomen"
K22 | line 104 | KEEP "Genitourinary"
K23 | line 106 | KEEP "Musculoskeletal"
K24 | line 108 | KEEP "Neurological"
K25 | line 109 | KEEP "Recall 2 of 3 words"
K26 | line 109 | KEEP "Motor strength 4+/5"
K27 | line 110 | KEEP "Deep tendon reflexes 1+"
K28 | line 111 | KEEP "Gait / Mobility"
K29 | line 113 | KEEP "Skin"
K30 | line 113 | KEEP "stage 1-4 pressure injury"
K31 | line 116 | KEEP "Serum Chemistry and Complete Blood Count"
K32 | line 132 | KEEP "delirium"
K33 | line 133 | KEEP "intravenous"
K34 | line 137 | KEEP "Fall risk and mobility impairment"
K35 | line 137 | KEEP "fall risk"
K36 | line 138 | KEEP "visual/hearing sensory deficits"
K37 | line 141 | KEEP "Antimicrobial Therapy"
K38 | line 143 | KEEP "Bladder Care and Hydration"
K39 | line 143 | KEEP "oral"
K40 | line 143 | KEEP "1.5 to 2.0 liters"
K41 | line 144 | KEEP "daily"
K42 | line 144 | KEEP "Scheduled voiding"
K43 | line 144 | KEEP "every 3 to 4 hours"
K44 | line 144 | KEEP "Post-void bladder scan"
K45 | line 145 | KEEP "oliguria"
K46 | line 146 | KEEP "Cognitive and Fall Safety"
K47 | line 146 | KEEP "home\nhealth aide"
K48 | line 147 | KEEP "Physical therapy home health evaluation"
K49 | line 147 | KEEP "gait\ntraining"
K50 | line 148 | KEEP "home hazard assessment"
K51 | line 149 | KEEP "Follow-Up"
K52 | line 150 | KEEP "cognitive decline"
K53 | line 152 | KEEP "Attending Provider Signoff"
K54 | line 155 | KEEP "Geriatric Medicine"

=== DOCUMENT fd-0118 ===
   1| Oak Street Clinic
   2| History and Physical
   3| 
   4| Patient: PACITA GÁLVEZ
   5| Age: 93
   6| MRN: 7741-2208-19
   7| Date of Service: 04/09/2026
   8| Account number 6652109842
   9| 
  10| Chief complaint
  11| Fatigue, a swollen ankle, and a check of her home CPAP.
  12| 
  13| History of present illness
  14| Pacita Gálvez is brought by her daughter, Mrs. Nora Briggs, who stays overnight after work. Since early winter she has been more tired by midday and has dozed in the chair, which is new. The fall occured when she got up from the toilet on Christmas Eve, landing on the left hip without hitting her head. She did not black out, had no chest pain, and was helped back to bed by her daughter. The next morning she could walk with the walker, so they did not go to an emergency department. Pain is now a dull ache and is better with acetaminophen.
  15| 
  16| CPAP use has been spotty since the fall because the mask felt like too much work. The machine serial on the back of the unit is Q19448210, and the daughter photographed it. She usually runs it for about five hours when she does wear it. She denies gasping arousals on the nights she uses it. Ankles swell by supper, right a little more than left, and the left one was bruised after the fall. She takes her anticoagulant and has not missed doses. No black stool, no prolonged bleeding from a cut, and no new headache.
  17| 
  18| Mrs. Nora Briggs works in Bramble and lives with her mother for now. A prior tracing was read by Dr. Reed Tolliver on Sept. 18, 2025, and R.T. thought the rate was controlled.
  19| 
  20| Past medical history
  21| Paroxysmal atrial fibrillation on anticoagulation. Obstructive sleep apnea treated with home CPAP. Hypertension. Stage 3 chronic kidney disease. Osteoarthritis of the knees. Hypothyroidism. Remote hysterectomy. No diabetes and no history of stroke or gastrointestinal bleed.
  22| 
  23| Medications
  24| Apixaban 5 mg PO BID
  25| Metoprolol succinate 25 mg PO daily
  26| Furosemide 20 mg PO daily
  27| Lisinopril 5 mg PO daily
  28| Levothyroxine 88 mcg PO each morning
  29| Acetaminophen 650 mg PO TID PRN pain
  30| Atorvastatin 10 mg PO at bedtime
  31| 
  32| Allergies
  33| Codeine, nausea. No angioedema with lisinopril.
  34| 
  35| Family history
  36| Her parents died in old age, one of a stroke and one of heart failure, and the details are thin. Her daughter has hypertension.
  37| 
  38| Social history
  39| She lives in a one-bedroom apartment with a walk-in shower. She retired from sewing alterations. No tobacco for decades and no alcohol. She uses a walker outside the apartment and furniture inside. Her daughter handles the pharmacy and the portal messages. She still cooks a simple breakfast and lets her daughter handle supper.
  40| 
  41| Review of systems
  42| General: fatigue, no fever. Sleep: as above, with mask leak when she is congested. Cardiac: no chest pain and no rapid pounding this month. Respiratory: no cough with sputum. Gastrointestinal: no black stool and appetite is fair. Urinary: no burning, up once at night. Neurologic: no focal weakness, no resting tremor to suggest Parkinson disease. Mood: a little embarrassed by the fall, not depressed. Skin: resolving bruise on the left hip, no open skin. Hearing is fair if you face her, and she does not want a hearing aid discussed today.
  43| 
  44| Examination
  45| Blood pressure 132/70 mmHg, pulse 76 beats per minute and irregularly irregular, respirations 16 per minute, oxygen saturation 96 percent on room air, temperature 98.0 F, weight 71.2 kg.
  46| She is comfortable, alert, and oriented to person, place, and month. Mood is appropriate. Face is symmetric without Bell palsy. Oral mucosa is moist. Neck veins are not elevated. Lungs are clear without wheeze or crackles. Heart is irregularly irregular with no new murmur. Abdomen is soft and nontender. Left hip bruise is yellow and nontender to palpation. Ankles have trace edema, right slightly more than left, and no calf cord. Gait with the walker is cautious but steady. CPAP mask fit was reviewed at the chair and the headgear is not frayed.
  47| 
  48| Labs and studies
  49| Basic metabolic panel today: sodium 139 mmol/L, potassium 4.1 mmol/L, creatinine 1.18 mg/dL (baseline 1.1 mg/dL), blood urea nitrogen 22 mg/dL, glucose 102 mg/dL. Hemoglobin 12.8 g/dL. TSH 2.2 mIU/L. INR is not used for monitoring because she is on apixaban. Electrocardiogram today shows atrial fibrillation with a ventricular rate of 78 beats per minute and no acute ST change.
  50| 
  51| Assessment and plan
  52| 1. Fall on Christmas Eve without syncope or head injury. Exam now does not suggest fracture, and radiographs are not required untill pain worsens or she cannot bear weight. Acetaminophen 650 mg PO TID remains the pain plan, and a stool softener was discussed if the medicine binds her up.
  53| 2. Obstructive sleep apnea with reduced CPAP use. That serial matches the unit she brought in the rolling bag. Goal is back to at least five hours a night, and her daughter will help with the mask during the overnight stays. If she refuses the mask for more than a few nights, we will revisit whether a different interface is worth a durable medical equipment visit.
  54| 3. Paroxysmal atrial fibrillation, rate controlled, on apixaban 5 mg PO BID. Weight is above 60 kg and creatinine is under 1.5 mg/dL, so the standard dose stays despite her age. Metoprolol succinate 25 mg PO daily is keeping the resting rate acceptable, and I will not increase it after a fall that may have had an orthostatic piece. Orthostatic blood pressures today were 132/70 mmHg supine and 128/68 mmHg standing, so there is no large drop. R.T. can see her if the rhythm becomes persistent or the rate climbs. Continue apixaban and hold it for a head strike, black stool, or a bleed that will not stop.
  55| 4. Swelling and kidney function. Trace edema without crackles does not earn a higher diuretic today. Creatinine is close to baseline. Lisinopril stays at 5 mg PO daily. Recheck the metabolic panel in one month, sooner if she is dizzy or drinking poorly.
  56| 5. Hypothyroidism, euthyroid on the current dose. No change to levothyroxine.
  57| 6. Prevention and home safety. Atorvastatin 10 mg PO at bedtime continues. Throw rugs were already removed. Her daughter will leave a night light on the way to the toilet, since that is where she fell. They reviewed thier plan for calling if she cannot get up.
  58| 
  59| Immunizations were reviewed, and she is current for the vaccines we recommend at her age, including the most recent influenza and COVID doses given last fall. Advance care wishes were not reopened today because she was tired, and her daughter knows she wants a full conversation at the next visit rather than in a rushed slot. Return in one month for the lab, or sooner for chest pain, a black stool, confusion, or a fall she cannot explain.
  60| 
  61| Contacts confirmed today:
  62| 88 PINE COURT APT 4
  63| LINWOOD, CA 95499
  64| Phone (707) 555-0155
  65| Fax (707) 555-0124
  66| Email nora.briggs@example.org
  67| 
  68| Electronically signed by Dr. Helen Gold
  69| Internal Medicine
  70| 
  71| Author: Dr. Helen Gold
=== END DOCUMENT ===
ITEMS FOR fd-0118:
D1 | line 45 | A: KEEP "oxygen saturation 96 percent" | B: KEEP "oxygen saturation 96 percent on room air"
D2 | line 49 | A: KEEP "creatinine 1.18 mg/dL (baseline 1.1 mg/dL)" | B: KEEP "creatinine 1.18 mg/dL"
K1 | line 11 | KEEP "CPAP"
K2 | line 14 | KEEP "fall"
K3 | line 16 | KEEP "CPAP"
K4 | line 16 | KEEP "fall"
K5 | line 16 | KEEP "fall"
K6 | line 21 | KEEP "CPAP"
K7 | line 33 | KEEP "nausea"
K8 | line 42 | KEEP "fall"
K9 | line 46 | KEEP "CPAP"
K10 | line 49 | KEEP "Basic metabolic panel"
K11 | line 49 | KEEP "INR"
K12 | line 49 | KEEP "ventricular rate of 78 beats per minute"
K13 | line 49 | KEEP "acute ST change"
K14 | line 52 | KEEP "Fall"
K15 | line 52 | KEEP "syncope"
K16 | line 52 | KEEP "head injury"
K17 | line 52 | KEEP "fracture"
K18 | line 53 | KEEP "CPAP"
K19 | line 54 | KEEP "60 kg"
K20 | line 54 | KEEP "creatinine"
K21 | line 54 | KEEP "1.5 mg/dL"
K22 | line 54 | KEEP "fall"
K23 | line 54 | KEEP "Orthostatic blood pressures"
K24 | line 54 | KEEP "132/70 mmHg"
K25 | line 54 | KEEP "128/68 mmHg"
K26 | line 54 | KEEP "head strike"
K27 | line 55 | KEEP "Creatinine"
K28 | line 55 | KEEP "metabolic panel"
K29 | line 56 | KEEP "euthyroid"
K30 | line 59 | KEEP "influenza"
K31 | line 59 | KEEP "COVID"
K32 | line 59 | KEEP "fall"

=== DOCUMENT fd-0124 ===
   1| DISCHARGE SUMMARY
   2| 
   3| Patient: SOO-JIN MOON
   4| MRN: 8821046
   5| DOB: 18 August 1932
   6| Age: 93
   7| Admitted: 2026-03-04
   8| Discharged: 2026-03-08
   9| Member no. 440291776
  10| 
  11| Principal diagnosis: non-ST elevation myocardial infarction treated with percutaneous coronary intervention.
  12| 
  13| Soo-jin Moon was admitted on 4 March 2026 with chest pressure and a rising troponin, and she left four days later after percutaneous coronary intervention. She is 93 and lives with her daughter-in-law, Mrs. Olena Kravchuk, who is 62 and manages the medicines. Follow-up is arranged at Cinder Meadow Clinic with Dr. Maren L. Bliss.
  14| 
  15| History of present illness. On 4 March 2026 she noticed heavy pressure across the chest while walking from the kitchen, with shortness of breath and nausea, but no syncope. The discomfort eased and then returned, and Olena Kravchuk called for help. There was no fever and no cough. She has hypertension and stage 3 chronic kidney disease. A similar but milder pressure had occured once in the prior month and had been attributed to indigestion. She does not smoke. She walked in the house with a cane before this illness.
  16| 
  17| Past medical history also includes osteoarthritis of the knees and remote cataract surgery. She has never had a myocardial infarction that she can recall and has never had a stent. There is no diabetes. Her father died of a stroke as an older adult. Korean is her first language, and her daughter-in-law repeated the key points of consent in both languages. Olena Kravchuk is the wife of the patient's son and has been the daytime caregiver since the patient's husband died. The patient still cooks simple meals and manages her cane on one level of the house.
  18| 
  19| Examination and data. Blood pressure on arrival was 162/78 mmHg, heart rate 88 beats per minute, respiratory rate 18 breaths per minute, and oxygen saturation 96 percent on room air. She was uncomfortable but alert. Lungs were clear. There was no peripheral edema. The electrocardiogram showed ST depression in the lateral leads without persistent ST elevation. Initial high-sensitivity troponin I was 180 ng/L and rose to 940 ng/L. Hemoglobin was 11.6 g/dL, platelets 198 thousand per microliter, sodium 136 mmol/L, potassium 4.2 mmol/L, creatinine 1.35 mg/dL, and glucose 128 mg/dL. LDL cholesterol later returned at 96 mg/dL. A transthoracic echocardiogram showed a left ventricular ejection fraction of 50 percent with hypokinesis of the anterior wall and no significant valve disease.
  20| 
  21| Hospital course. She recieved aspirin 324 mg once and was started on heparin infusion and clopidogrel. On teh morning of the second hospital day she went to the catheterization laboratory. Coronary angiography showed a severe stenosis of the proximal left anterior descending artery and moderate disease in a small diagonal branch that was left alone. A drug-eluting stent was placed in the proximal left anterior descending artery with a good angiographic result and no dissection. Hemostasis at the radial access site was uncomplicated. Creatinine the next day was 1.42 mg/dL and then returned toward baseline. She had brief nausea treated with ondansetron 4 mg IV once. No bleeding occured at the access site. A seperate note from the pharmacist documents counseling on dual antiplatelet therapy and on not stopping either agent for minor procedures. Chest pressure did not return. She walked in the hall with her cane and with Olena Kravchuk at her side. Heparin was stopped at the end of the procedure. The radial band was loosened on a schedule and the hand stayed warm with a strong pulse. She ate breakfast the next morning and had no further nausea. Metoprolol was started at a low dose because of the anterior wall motion abnormality, and blood pressure remained acceptable. Atorvastatin was new for her. Amlodipine was continued because home readings had been high. No diuretic was required. Physical therapy cleared her on the cane for level surfaces and advised a tub bench that the family already owns. Discharge teaching was completed by the care team listed below.
  22| 
  23| Care team:
  24| Maren L. Bliss, MD
  25| Colin Harrow, PharmD
  26| Edith Lang, RN
  27| 
  28| Discharge medications.
  29| Aspirin 81 mg PO daily. Do not stop.
  30| Clopidogrel 75 mg PO daily for at least six months, then to be reviewed. Rx 6612048.
  31| Atorvastatin 40 mg PO nightly.
  32| Metoprolol succinate 25 mg PO daily.
  33| Amlodipine 5 mg PO daily, continued from home, and hold for dizziness.
  34| Pantoprazole 40 mg PO daily while on dual antiplatelet therapy.
  35| Acetaminophen 650 mg PO every 6 hours as needed for pain. Avoid nonsteroidal anti-inflammatory drugs.
  36| 
  37| Follow-up. She will be seen at Cinder Meadow Clinic about two weeks after discharge, sooner for recurrent pressure, fainting, black stools, or swelling at the access site. Activity is household walking. She should not lift more than ten pounds with the instrumented arm for several days. Blood pressure checks at home were requested, with a call if readings stay above 170 systolic. Her health plan member number is on the face sheet for authorization of the outpatient visit. Cardiac rehabilitation was offered and declined for now because of the distance. Diet counseling favored smaller meals and steady salt intake given the kidney disease. Warning signs were reviewed in plain words. She is to seek care the same day for pressure that lasts more than a few minutes, for sudden weakness, or for vomiting blood. Bruising is expected on dual therapy, but a nosebleed that will not stop needs a call. Clopidogrel should not be taken with omeprazole, which is why pantoprazole was chosen. A basic metabolic panel is suggested at the clinic visit because of the small creatinine rise.
  38| 
  39| She will stay at the following address.
  40| 1842 Quarry Lane
  41| Brindle, WA 98099
  42| 
  43| Questions can be called to (206) 555-0174. Records may be faxed to Fax: (206) 555-0188. The visit summary is posted at https://portal.example.net/visit/8821046. If the page will not open, write to records at example dot net. Olena Kravchuk has the paper copy.
  44| 
  45| Signed,
  46| Maren L. Bliss, MD
  47| Cinder Meadow Clinic
=== END DOCUMENT ===
ITEMS FOR fd-0124:
D1 | line 19 | A: KEEP "oxygen saturation 96 percent on room air" | B: KEEP "oxygen saturation 96 percent"
D2 | line 19 | A: KEEP "high-sensitivity troponin I was 180 ng/L and rose to 940 ng/L" | B: KEEP "high-sensitivity troponin I was 180 ng/L" [unsure] ; KEEP "940 ng/L"
D3 | line 35 | A: KEEP "every 6 hours" ; KEEP "as needed" | B: KEEP "every 6 hours as needed"
K1 | line 15 | KEEP "indigestion"
K2 | line 17 | KEEP "stent" [labeler unsure]
K3 | line 19 | KEEP "ST depression in the lateral leads"
K4 | line 19 | KEEP "ST elevation"
K5 | line 19 | KEEP "hypokinesis of the anterior wall"
K6 | line 19 | KEEP "valve disease"
K7 | line 21 | KEEP "infusion"
K8 | line 21 | KEEP "severe stenosis of the proximal left anterior descending artery"
K9 | line 21 | KEEP "moderate disease in a small diagonal branch" [labeler unsure]
K10 | line 21 | KEEP "drug-eluting stent"
K11 | line 21 | KEEP "dissection" [labeler unsure]
K12 | line 21 | KEEP "dual antiplatelet therapy"
K13 | line 21 | KEEP "anterior wall motion abnormality"
K14 | line 21 | KEEP "diuretic"
K15 | line 21 | KEEP "Physical therapy"
K16 | line 31 | KEEP "PO"
K17 | line 34 | KEEP "dual antiplatelet therapy"
K18 | line 35 | KEEP "nonsteroidal anti-inflammatory drugs"
K19 | line 37 | KEEP "170 systolic" [labeler unsure]
K20 | line 37 | KEEP "Cardiac rehabilitation"
K21 | line 37 | KEEP "kidney disease"
K22 | line 37 | KEEP "dual therapy" [labeler unsure]

=== DOCUMENT fd-0136 ===
   1| 77291044
   2| BANCROFT MEMORIAL HOSPITAL
   3| DISCHARGE SUMMARY AND COMPREHENSIVE CARE TRANSITION REPORT
   4| 
   5| PATIENT: Long, Vahan
   6| SSN: 984-21-5019
   7| DOB: 05/19/1933
   8| AGE: 93 y.o.
   9| GENDER: Male
  10| ADMISSION DATE: 8/14/26
  11| DISCHARGE DATE: 2026-08-21
  12| ATTENDING PHYSICIAN: Gregory Campbell, MD
  13| REFERRING GERIATRICIAN: M.R. Foster, MD
  14| PRIMARY CARE TEAM: Dr. Gregory Campbell, Dr. Meredith Foster, Lindsay Becker, RN, Dr. Tariq al-Rashid
  15| FACILITY SATELLITE: Cardiovascular Institute of the Foothills
  16| PATIENT RESIDENCE: 1104 NORTH ADAMS STREET, SUITE 200, GLENDALE, CA 91206
  17| PRIMARY CONTACT: Tolga Yilmaz (Son-in-law), Contact Tel: (818) 555-0174
  18| PHYSICIAN OFFICE FAX: Fax: (818) 555-0192
  19| ELECTRONIC COMMUNICATION: gcampbell (at) example.org
  20| INSURANCE: Senior Medicare HMO plan, Policy ID: HPN-77291-03, Group: G-4902A
  21| IMPLANTED CARDIAC DEVICE: Medtronic Azure dual-chamber pacemaker, Model W1SR01, SN: PXR4920187
  22| LOCAL DISPENSING PHARMACY AREA: 91205
  23| ELECTRONIC CHART ACCESS: https://records.example.org/portal/ref?id=49102
  24| 
  25| ADMISSION DIAGNOSIS:
  26| Syncope, high-grade atrioventricular block, and acute pre-renal azotemia.
  27| 
  28| DISCHARGE DIAGNOSES:
  29| 1. Symptomatic high-grade (Mobitz type II) second-degree atrioventricular block progressing to transient third-degree heart block, successfully treated with permanent dual-chamber pacemaker implantation.
  30| 2. Syncope secondary to bradyarrhythmia, fully resolved post-device placement.
  31| 3. Acute kidney injury secondary to pre-renal hypoperfusion, fully resolved to baseline renal status.
  32| 4. Chronic essential hypertension.
  33| 5. Mild vascular dementia, stable.
  34| 6. Senile osteoporosis without current pathological fracture.
  35| 
  36| CONSULTING SPECIALTIES:
  37| 1. Clinical Cardiac Electrophysiology: Dr. Gregory Campbell.
  38| 2. Nephrology: Dr. Tariq al-Rashid.
  39| 3. Geriatric Medicine: Dr. Meredith Foster.
  40| 4. Transition Coordination: Lindsay Becker, RN.
  41| 
  42| HISTORY OF PRESENT ILLNESS:
  43| Mr. Vahan Long is a 93 y.o. gentleman with a medical history notable for essential hypertension, mild vascular cognitive impairment, osteoporosis, and chronic sinus bradycardia, who was admitted on August 14th after experiencing an unwitnessed syncopal episode at home. According to his son-in-law, Mr. Tolga Yilmaz, Mr. Long was walking from his bedroom toward the kitchen at approximately 9:30 AM when he suddenly lost consciousness and fell to the carpeted floor. There was no preceding chest pain, palpitations, diaphoresis, shortness of breath, aura, or focal weakness. The syncopal event lasted an estimated thirty to forty-five seconds without tonic-clonic motor activity or urinary or bowel incontinence. Upon regaining consciousness, Mr. Long was initially confused but returned to his cognitive baseline within ten minutes.
  44| 
  45| Paramedics were summoned to the residence. Initial vital signs obtained on the scene on 8/14/26 demonstrated profound bradycardia with a heart rate of 34 bpm and a blood pressure of 88/54 mmHg. An electrocardiogram demonstrated Mobitz type II second-degree atrioventricular block with intermittent 3:1 AV conduction and ventricular pauses measuring up to 3.8 seconds. Intravenous access was established, and he was transferred directly to the emergency department at Bancroft Memorial Hospital.
  46| 
  47| PAST MEDICAL AND SURGICAL HISTORY:
  48| 1. Cardiovascular: Chronic sinus bradycardia with baseline heart rates in the mid-fifties, essential hypertension. No prior history of coronary revascularization or myocardial infarction.
  49| 2. Neurologic: Mild vascular neurocognitive disorder diagnosed two years prior, baseline Mini-Mental State Examination score 23/30.
  50| 3. Musculoskeletal: Osteoporosis treated with calcium and vitamin D supplementation; bilateral hip bursitis.
  51| 4. Surgical: Left inguinal hernia repair fifteen years prior; bilateral cataract extractions.
  52| 
  53| ALLERGIES:
  54| Sulfa drugs (hives), Codeine (severe nausea).
  55| 
  56| HOSPITAL COURSE:
  57| 1. Electrophysiology / Pacemaker Implantation:
  58| Upon hospital admission on August 14th, Mr. Long was placed on continuous cardiac telemetry and transferred to the cardiac step-down unit under the primary care of Dr. Gregory Campbell. Electrocardiographic telemetry confirmed recurrent high-grade atrioventricular block with prolonged ventricular pauses up to 4.2 seconds accompanied by presyncopal lightheadedness. Temporary transcutaneous pacing pads were placed on standby. Dr. Campbell reviewed the clinical findings with Mr. Long and Mr. Tolga Yilmaz, recommending urgent permanent pacemaker implantation.
  59| 
  60| On August 16, 2026, the patient underwent uneventful surgical placement of a Medtronic Azure dual-chamber transvenous pacemaker, Model W1SR01, SN: PXR4920187, performed in the electrophysiology laboratory at Bancroft Memorial Hospital. Right atrial and right ventricular active-fixation leads were positioned under fluoroscopic guidance with excellent electrical sensing and pacing thresholds (atrial sensing 3.8 mV, impedance 520 ohms; ventricular sensing 12.4 mV, impedance 610 ohms, pacing threshold 0.6 V at 0.4 ms). Interrogation performed twenty-four hours postoperatively revealed 100% ventricular capture and optimal device function programmed in DDDR mode with a lower rate limit of 60 bpm and upper sensor rate of 120 bpm. Post-procedure chest radiography confirmed stable lead positioning without pneumothorax or hemothorax. Mr. Long experienced no further episodes of syncope, presyncope, or pauses.
  61| 
  62| 2. Renal Function / Acute Kidney Injury:
  63| On admission, serum creatinine was elevated at 1.84 mg/dL above his documented baseline of 1.10 mg/dL, with BUN of 42 mg/dL, consistent with acute pre-renal azotemia caused by transient systemic hypoperfusion during severe bradycardia. Nephrology was consulted, and Dr. Tariq al-Rashid evaluated Mr. Long. Renal ultrasonography showed normal kidney size bilaterally without hydronephrosis or structural obstruction. Following pacemaker placement and gentle intravenous fluid administration with 0.45% normal saline at 50 mL/hr for twenty-four hours, renal perfusion normalized rapidly. By 2026-08-21, serum creatinine decreased to 1.12 mg/dL with BUN of 18 mg/dL, reflecting complete recovery of baseline renal function.
  64| 
  65| 3. Geriatric Evaluation and Cognitive Assessment:
  66| Dr. Meredith Foster performed a geriatric evaluation to ensure delirium was not superimposed on baseline cognitive impairment. Mr. Long was found to be oriented to person, hospital, and year, with fluent speech and no visual hallucinations. Physical therapist and occupational therapist assessments were completed on hospital day 4. He ambulated eighty feet with a front-wheeled walker under supervision, maintaining pacemaker precautions (avoidance of left shoulder abduction beyond 90 degrees and heavy lifting over ten pounds for six weeks).
  67| 
  68| 4. Discharge Planning and Nursing Care Coordination:
  69| Lindsay Becker, RN, facilitated multidisciplinary care transition conferences with Mr. Long and Mr. Tolga Yilmaz. In-home physical therapy, occupational therapy, and visiting nurse support were scheduled. A home safety inspection was arranged to mitigate trip hazards. Outpatient electrophysiology follow-up was coordinated through the Cardiovascular Institute of the Foothills. Medications were carefully reconciled, and discharge prescriptions were sent electronically to the retail pharmacy servicing ZIP code 91205.
  70| 
  71| DISCHARGE PHYSICAL EXAMINATION:
  72| Vital Signs: Temperature 98.2 F (36.8 C), blood pressure 130/74 mmHg, heart rate 68 bpm (paced), respiratory rate 16 breaths/min, oxygen saturation 98% on room air.
  73| General: Well-nourished, comfortable gentleman in no acute distress, pleasant and cooperative.
  74| HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to light. Mucous membranes moist. Neck supple without jugular venous distention.
  75| Cardiovascular: Regular rate and rhythm, normal S1 and S2, no murmurs, gallops, or friction rubs. Left pectoral pacemaker pocket incision clean, intact, edges well-approximated with Dermabond, no erythema, fluctuance, hematoma, or drainage. Peripheral pulses 2+ and symmetric.
  76| Pulmonary: Lungs clear to auscultation bilaterally, good air movement throughout all lung zones, no adventitious sounds.
  77| Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds.
  78| Extremities: Warm, dry, no peripheral edema bilaterally, no calf tenderness. Left arm with active range of motion preserved below shoulder level.
  79| Neurologic: Alert, oriented x 3. Cranial nerves II through XII grossly intact. Motor strength 5/5 in bilateral lower extremities and right upper extremity, left upper extremity limited by post-procedure precautions. Sensation intact to light touch throughout.
  80| 
  81| DISCHARGE LABS AND DIAGNOSTICS:
  82| Complete Metabolic Panel:
  83| Sodium: 139 mEq/L
  84| Potassium: 4.3 mEq/L
  85| Chloride: 102 mEq/L
  86| Bicarbonate: 26 mEq/L
  87| BUN: 18 mg/dL
  88| Creatinine: 1.12 mg/dL
  89| eGFR: >60 mL/min/1.73 m2
  90| Glucose: 104 mg/dL
  91| Calcium: 9.2 mg/dL
  92| Total Protein: 6.8 g/dL
  93| Albumin: 4.0 g/dL
  94| Alkaline Phosphatase: 68 U/L
  95| AST: 21 U/L
  96| ALT: 18 U/L
  97| Complete Blood Count:
  98| White Blood Cell Count: 6.4 x 10^3/uL
  99| Hemoglobin: 13.1 g/dL
 100| Hematocrit: 39.4%
 101| Platelet Count: 242 x 10^3/uL
 102| Coagulation:
 103| INR: 1.05
 104| Prothrombin Time: 11.8 seconds
 105| 12-Lead Electrocardiogram: Atrial-sensed ventricular-paced rhythm at 68 bpm, narrow paced QRS morphology, normal axis, no ST-segment deviations.
 106| 
 107| DISCHARGE MEDICATIONS:
 108| 1. Amlodipine 5 mg oral tablet once daily in the morning.
 109| 2. Lisinopril 10 mg oral tablet once daily in the morning.
 110| 3. Calcium carbonate 500 mg with Vitamin D 400 IU oral tablet twice daily with meals.
 111| 4. Acetaminophen 650 mg oral tablet every 8 hours as needed for incisional discomfort (avoid NSAIDs).
 112| 5. Polyethylene glycol 3350 powder 17 grams dissolved in water once daily as needed for constipation.
 113| 
 114| DISCHARGE INSTRUCTIONS AND FOLLOW-UP:
 115| 1. Pacemaker Precautions: Do not lift the left arm above shoulder level for six weeks. Do not lift objects weighing greater than ten pounds with the left arm. Keep the incision site clean and dry; do not submerge in water or soak in a tub.
 116| 2. Device Follow-up: Pacemaker wound check and initial device clinic evaluation scheduled with Dr. Gregory Campbell at Cardiovascular Institute of the Foothills on August 28, 2026 at 9:00 AM.
 117| 3. Geriatric Follow-up: Outpatient appointment scheduled with Dr. Meredith Foster on September 8, 2026 at 1:30 PM.
 118| 4. Nephrology Follow-up: Dr. Tariq al-Rashid will review outpatient lab studies in four weeks.
 119| 5. Online Chart Access: Full medical records, device serial cards, and discharge instructions can be accessed through the patient records portal at https://records.example.org/portal/ref?id=49102.
 120| 
 121| Attending Physician:
 122| Gregory Campbell, MD
 123| Bancroft Memorial Hospital, Division of Cardiology
 124| Date: 2026-08-21
=== END DOCUMENT ===
ITEMS FOR fd-0136:
D1 | line 29 | A: KEEP "Symptomatic high-grade (Mobitz type II) second-degree atrioventricular block" | B: KEEP "Mobitz type II"
D2 | line 43 | A: NAME "Long" | B: (nothing)
D3 | line 45 | A: KEEP "Mobitz type II second-degree atrioventricular block" | B: KEEP "Mobitz type II"
D4 | line 49 | A: KEEP "Mini-Mental State Examination score 23/30" | B: KEEP "Mini-Mental State Examination"
D5 | line 58 | A: CLINICIAN "Campbell" | B: (nothing)
D6 | line 72 | A: KEEP "Temperature 98.2 F (36.8 C)" | B: KEEP "Temperature 98.2 F"
D7 | line 111 | A: KEEP "every 8 hours" ; KEEP "as needed" | B: KEEP "every 8 hours as needed"
D8 | line 112 | A: KEEP "once daily" ; KEEP "as needed" | B: KEEP "once daily as needed"
K1 | line 21 | KEEP "Medtronic Azure dual-chamber pacemaker"
K2 | line 26 | KEEP "Syncope"
K3 | line 26 | KEEP "high-grade atrioventricular block"
K4 | line 26 | KEEP "acute pre-renal azotemia"
K5 | line 29 | KEEP "transient third-degree heart block"
K6 | line 29 | KEEP "permanent dual-chamber pacemaker implantation"
K7 | line 30 | KEEP "Syncope secondary to bradyarrhythmia"
K8 | line 31 | KEEP "Acute kidney injury secondary to pre-renal hypoperfusion"
K9 | line 32 | KEEP "Chronic essential hypertension"
K10 | line 33 | KEEP "Mild vascular dementia"
K11 | line 34 | KEEP "Senile osteoporosis"
K12 | line 34 | KEEP "pathological fracture"
K13 | line 37 | KEEP "Clinical Cardiac Electrophysiology"
K14 | line 38 | KEEP "Nephrology"
K15 | line 39 | KEEP "Geriatric Medicine"
K16 | line 40 | KEEP "Transition Coordination"
K17 | line 43 | KEEP "essential hypertension"
K18 | line 43 | KEEP "mild vascular cognitive impairment"
K19 | line 43 | KEEP "osteoporosis"
K20 | line 43 | KEEP "chronic sinus bradycardia"
K21 | line 43 | KEEP "unwitnessed syncopal episode"
K22 | line 43 | KEEP "syncopal event"
K23 | line 45 | KEEP "profound bradycardia"
K24 | line 45 | KEEP "heart rate of 34 bpm"
K25 | line 45 | KEEP "blood pressure of 88/54 mmHg"
K26 | line 45 | KEEP "electrocardiogram"
K27 | line 45 | KEEP "3:1 AV conduction"
K28 | line 45 | KEEP "ventricular pauses measuring up to 3.8 seconds"
K29 | line 48 | KEEP "Cardiovascular"
K30 | line 48 | KEEP "Chronic sinus bradycardia"
K31 | line 48 | KEEP "essential hypertension"
K32 | line 48 | KEEP "coronary revascularization"
K33 | line 48 | KEEP "myocardial infarction"
K34 | line 49 | KEEP "Neurologic"
K35 | line 49 | KEEP "Mild vascular neurocognitive disorder"
K36 | line 50 | KEEP "Musculoskeletal"
K37 | line 50 | KEEP "Osteoporosis"
K38 | line 50 | KEEP "calcium"
K39 | line 50 | KEEP "vitamin D"
K40 | line 50 | KEEP "bilateral hip bursitis"
K41 | line 51 | KEEP "Surgical"
K42 | line 51 | KEEP "Left inguinal hernia repair"
K43 | line 51 | KEEP "bilateral cataract extractions"
K44 | line 54 | KEEP "hives"
K45 | line 54 | KEEP "nausea"
K46 | line 57 | KEEP "Electrophysiology / Pacemaker Implantation"
K47 | line 58 | KEEP "cardiac telemetry"
K48 | line 58 | KEEP "Electrocardiographic telemetry"
K49 | line 58 | KEEP "recurrent high-grade atrioventricular block"
K50 | line 58 | KEEP "prolonged ventricular pauses up to 4.2 seconds"
K51 | line 58 | KEEP "presyncopal lightheadedness"
K52 | line 58 | KEEP "transcutaneous pacing"
K53 | line 58 | KEEP "permanent pacemaker implantation"
K54 | line 60 | KEEP "surgical placement of a Medtronic Azure dual-chamber transvenous pacemaker"
K55 | line 60 | KEEP "active-fixation leads"
K56 | line 60 | KEEP "fluoroscopic guidance"
K57 | line 60 | KEEP "atrial sensing 3.8 mV"
K58 | line 60 | KEEP "impedance 520 ohms"
K59 | line 60 | KEEP "ventricular sensing 12.4 mV"
K60 | line 60 | KEEP "impedance 610 ohms"
K61 | line 60 | KEEP "pacing threshold 0.6 V at 0.4 ms"
K62 | line 60 | KEEP "100% ventricular capture"
K63 | line 60 | KEEP "DDDR"
K64 | line 60 | KEEP "lower rate limit of 60 bpm"
K65 | line 60 | KEEP "upper sensor rate of 120 bpm"
K66 | line 60 | KEEP "chest radiography"
K67 | line 60 | KEEP "pneumothorax"
K68 | line 60 | KEEP "hemothorax"
K69 | line 60 | KEEP "syncope"
K70 | line 60 | KEEP "presyncope"
K71 | line 62 | KEEP "Renal Function / Acute Kidney Injury"
K72 | line 63 | KEEP "serum creatinine was elevated at 1.84 mg/dL"
K73 | line 63 | KEEP "1.10 mg/dL"
K74 | line 63 | KEEP "BUN of 42 mg/dL"
K75 | line 63 | KEEP "acute pre-renal azotemia"
K76 | line 63 | KEEP "systemic hypoperfusion"
K77 | line 63 | KEEP "severe bradycardia"
K78 | line 63 | KEEP "Nephrology"
K79 | line 63 | KEEP "Renal ultrasonography"
K80 | line 63 | KEEP "hydronephrosis"
K81 | line 63 | KEEP "pacemaker placement"
K82 | line 63 | KEEP "serum creatinine decreased to 1.12 mg/dL"
K83 | line 63 | KEEP "BUN of 18 mg/dL"
K84 | line 65 | KEEP "Geriatric Evaluation and Cognitive Assessment"
K85 | line 66 | KEEP "geriatric evaluation"
K86 | line 66 | KEEP "delirium"
K87 | line 66 | KEEP "cognitive impairment"
K88 | line 66 | KEEP "visual hallucinations"
K89 | line 68 | KEEP "Discharge Planning and Nursing Care Coordination"
K90 | line 69 | KEEP "In-home physical therapy"
K91 | line 69 | KEEP "occupational therapy"
K92 | line 69 | KEEP "visiting nurse"
K93 | line 69 | KEEP "home safety inspection"
K94 | line 69 | KEEP "Outpatient electrophysiology"
K95 | line 72 | KEEP "Vital Signs"
K96 | line 73 | KEEP "General"
K97 | line 74 | KEEP "HEENT"
K98 | line 75 | KEEP "Cardiovascular"
K99 | line 75 | KEEP "Peripheral pulses 2+"
K100 | line 76 | KEEP "Pulmonary"
K101 | line 77 | KEEP "Abdomen"
K102 | line 78 | KEEP "Extremities"
K103 | line 79 | KEEP "Neurologic"
K104 | line 79 | KEEP "oriented x 3"
K105 | line 79 | KEEP "Cranial nerves II through XII"
K106 | line 79 | KEEP "Motor strength 5/5"
K107 | line 105 | KEEP "12-Lead Electrocardiogram"
K108 | line 105 | KEEP "Atrial-sensed ventricular-paced rhythm"
K109 | line 105 | KEEP "68 bpm"
K110 | line 111 | KEEP "NSAIDs"
K111 | line 112 | KEEP "constipation"
K112 | line 116 | KEEP "Pacemaker wound check"
K113 | line 116 | KEEP "device clinic evaluation"
K114 | line 123 | KEEP "Division of Cardiology"

=== DOCUMENT fd-0144 ===
   1| PRE-PROCEDURE COORDINATION AND COVERAGE DETERMINATION
   2| Date of Service: November 18, 2026
   3| Patient Name: Medeiros, Mariana de
   4| Plan Member ID: PHP-904218-01
   5| Facility: Bayside Ambulatory Surgical Pavilion
   6| 
   7| Dear Ms. de Medeiros,
   8| 
   9| This letter confirms that our surgical coordination team has completed the prior authorization review with your health plan for your upcoming laparoscopic cholecystectomy. The procedure is schedulled for the morning of November 18, 2026, with arrival requested two hours prior to incision time at Bayside Ambulatory Surgical Pavilion.
  10| 
  11| During your pre-operative clinical evaluation, Dr. Tariq Siddiqui noted persistent episodic biliary colic following meals. Abdominal ultrasound previously demonstrated multiple mobile calculi within the gallbladder lumen with mild gallbladder wall thickening; however, physical examination elicited a negative Murphy sign without localized peritoneal rebound. Given these findings adn your recurrent symptoms, surgical management remains clinically indicated.
  12| 
  13| Pre-admission blood work, including a complete blood count, basic metabolic panel, and hepatic function panel, must be drawn within fourteen days of the intervention. You may complete these laboratory studies at our outpatient diagnostic laboratory or at any affiliated collection site. Please ensure that all outside diagnostic records and operative consent paperwork are signed and returned prior to admission.
  14| 
  15| Please review the following pre-procedure instructions:
  16| 1. Complete strict NPO status beginning at midnight prior to your scheduled procedre date.
  17| 2. Hold your daily morning antihypertensive regimen as previously directed by anesthesia, unless instructed otherwise during your final telephone intake call.
  18| 3. Arrange for a responsible adult escort to accompany you upon discharge. Our records list your brother-in-law, Arthur Murphy, as your designated primary contact and post-anesthesia driver. He will need to check in at the reception desk prior to patient discharge.
  19| 
  20| If your designated caregiver resides outside our standard clinical service area 02138, transport times should be factored into your postoperative recovery planning. For any questions regarding billing estimates, administrative scheduling, or directions, please contact our intake desk at 617.555.0142 between 8:00 AM and 4:30 PM.
  21| 
  22| Written correspondence or inquiries regarding pre-certification docments may be directed to our patient access representative, bilal qureshi, via secure portal transmission or direct clerical inquiry.
  23| 
  24| Sincerely,
  25| 
  26| Tariq Siddiqui, MD
  27| Department of Gastrointestinal Surgery
  28| Bayside Ambulatory Surgical Pavilion
=== END DOCUMENT ===
ITEMS FOR fd-0144:
K1 | line 1 | KEEP "PRE-PROCEDURE COORDINATION AND COVERAGE DETERMINATION"
K2 | line 11 | KEEP "multiple mobile calculi"
K3 | line 11 | KEEP "gallbladder wall thickening"
K4 | line 11 | KEEP "physical examination"
K5 | line 11 | KEEP "peritoneal rebound"
K6 | line 17 | KEEP "daily"

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
ITEMS FOR fd-0145:
K1 | line 23 | KEEP "neuroendocrine tumor (carcinoid)"

Now output the result blocks.