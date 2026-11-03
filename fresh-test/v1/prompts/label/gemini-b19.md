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


=== DOCUMENT fd-0040 ===
   1| CASCADIA ENDOCRINOLOGY AND IMAGING CENTER
   2| CLINICAL ULTRASOUND AND FINE NEEDLE ASPIRATION REPORT
   3| 
   4| PATIENT: VONG, MEI-LING
   5| DOB: 12.04.1934
   6| AGE/SEX: 92F
   7| ACCOUNT NUMBER: ACT-6091448-B
   8| ACCESSION: ACC-2026-90412
   9| DATE OF PROCEDURE: 18.06.2026
  10| ORDERING PHYSICIAN: Dr. Rodrigo Barcellos
  11| ATTENDING RADIOLOGIST: Dra. Luciana da Silva Peixoto
  12| CONSULTING CLINICIAN: Dr. Graves
  13| PRIMARY RESIDENCE: 714 NW Blossom Hill Rd, Apt 4B, Portland, OR 97229
  14| CONTACT TELEPHONE: +1-503-555-0178
  15| FAMILY CONTACT: Patience (daughter)
  16| PRIMARY CAREGIVER: Nguyễn Thị Mai
  17| 
  18| PROCEDURE PERFORMED:
  19| High-resolution diagnostic ultrasound of the thyroid gland and fine-needle
  20| aspiration (FNA) biopsy of dominant right thyroid nodule under direct
  21| sonographic guidance (three passes).
  22| 
  23| CLINICAL INDICATION:
  24| The patient is a 92F (Mrs. Vong) with a history of toxic multinodular goiter
  25| and atrial fibrillation, presenting with progressive dysphagia and enlarging
  26| anterior neck mass. Evaluated in consultation with endocrinologist Dr. Graves
  27| and primary physician Dr. Rodrigo Barcellos. Daughter Patience reported mild
  28| stridor in recumbent posture. Caregiver Nguyễn Thị Mai assists with daily
  29| medication administration. Recent laboratory evaluation showed suppressed serum
  30| TSH at less than 0.01 uIU/mL, elevated free T4 at 2.4 ng/dL, and elevated total
  31| T3 at 210 ng/dL. Previous thyroid scintigraphy demonstrated patchy heterogeneous
  32| uptake with a photopenic defect corresponding to the palpable right lobe mass.
  33| Baseline vital signs prior to biopsy: blood pressure 138/76 mmHg, pulse rate 82
  34| bpm irregularly irregular, respiratory rate 18 breaths per minute, oxygen
  35| saturation 97% on ambient air.
  36| 
  37| CURRENT MEDICATIONS:
  38| 1. methimazole 10 mg PO daily
  39| 2. propranolol 20 mg PO TID
  40| 3. apixaban 2.5 mg PO BID
  41| 4. levothyroxine 25 mcg PO daily
  42| 
  43| PROCEDURE TECHNIQUE AND FINDINGS:
  44| Prior to needle placement, informed written consent was reviewed with Mrs. Vong
  45| and her daughter Patience, assisted by medical interpreter. Time-out verified
  46| patient identity, procedure site, and anticoagulation hold (apixaban held 48h).
  47| 
  48| Diagnostic gray-scale and power Doppler sonography of the neck was performed.
  49| The thyroid gland is markedly enlarged and multinodular.
  50| Right thyroid lobe measures 6.2 x 3.1 x 2.9 cm.
  51| Left thyroid lobe measures 5.4 x 2.4 x 2.2 cm.
  52| The thyroid isthmus is thickened at 0.8 cm.
  53| 
  54| In the mid-to-lower pole of the right thyroid lobe, there is a dominant, solid,
  55| hypoechoic nodule measuring 2.8 x 2.1 x 1.9 cm. The nodule displays irregular
  56| margins, wider-than-tall orientation, and punctate echogenic foci suspicious
  57| for microcalcifications (ACR TI-RADS 5, 7 points). Color Doppler interrogation
  58| demonstrated peripheral and internal chaotic flow signals within the nodule.
  59| Surrounding parenchyma shows patchy vascularity without discrete retrosternal
  60| extension. Visualized jugular and carotid vessels were patent.
  61| 
  62| Following sterile preparation with chlorhexidine and local anesthesia using 4 mL
  63| of 1% lidocaine, a 25-gauge needle attached to a 10 mL syringe was advanced into
  64| the dominant right thyroid nodule under continuous real-time ultrasound guidance.
  65| Three separate passes were performed. Adequate colloid and cellular material
  66| were obtained. On-site cytotechnologist confirmed adequate cellularity. No
  67| immediate hematoma or airway compromise occurred. Pressure dressing applied.
  68| 
  69| IMPRESSION:
  70| 1. Successful ultrasound-guided fine needle aspiration of dominant right
  71|    thyroid nodule (2.8 cm, ACR TI-RADS 5). Specimen submitted to cytology.
  72| 2. Marked multinodular goiter causing slight leftward tracheal deviation.
  73| 3. Post-procedure instructions provided to patient, daughter Patience, and
  74|    caregiver Nguyễn Thị Mai. Resume apixaban 2.5 mg PO BID tomorrow morning.
  75| 4. Cytology results are pending and will be communicated directly to Dr. Graves
  76|    and Dr. Rodrigo Barcellos within 48 to 72 hours. Endocrine surgery
  77|    consultation will be scheduled if cytology shows high-grade neoplasm.
  78| 
  79| Dra. Luciana da Silva Peixoto, MD
  80| Department of Interventional Radiology
  81| Cascadia Endocrinology and Imaging Center
=== END DOCUMENT ===

=== DOCUMENT fd-0290 ===
   1| Cedar Ridge Clinic
   2| Outpatient Progress Note
   3| 
   4| Patient: Cora J. Whitacre
   5| DOB: March 4, 1934
   6| Age: 92 y.o.
   7| Record no. 7394-2281-56
   8| Date of visit: March 4, 2026
   9| 
  10| Chief complaint
  11| Ankle swelling, shorter walking distance, and a bruise after a parking lot fall.
  12| 
  13| History of present illness
  14| She came in with her son Nolan Whitacre, who lives in the house with her and does the driving. Over about ten days the ankles have become puffier by evening and she gets short of breathe walking from the kitchen to the front porch. She denies chest pain, a new cough, waking orthopnea, and fever. Last month she slipped while climbing out of the sedan in the lot. She was not thrown clear, did not strike her head, and did not black out. The sedan, plate 8HWT392, had to be towed that afternoon because it would not start after the bump. A broad bruise rose over the left hip. She chose to rest at home instead of going to an emergency department. Her son has kept a morning weight log on the refrigerator.
  15| 
  16| Medications sit in a weekly box that he fills on Sundays. She missed two doses of the loop diuretic when that box was left on her daughter's counter. Appetite is fair, with a smaller breakfast than usual. There is no melena, no vomiting, and no pain with urination. Knee pain is occassional and she has been taking acetaminophen, which is the right choice. She was asked to keep NSAIDs off to the side, and she recieved that advice again today.
  17| 
  18| Past medical history
  19| Heart failure with reduced ejection fraction, last measured at 35 percent. Stage 3b chronic kidney disease. Hypothyroidism. Osteoarthritis of the knees. Cataract extraction years ago. No diabetes.
  20| 
  21| Medications
  22| Furosemide 40 mg by mouth daily
  23| Carvedilol 6.25 mg by mouth twice daily
  24| Lisinopril 5 mg by mouth daily
  25| Levothyroxine 88 mcg by mouth each morning
  26| Acetaminophen 650 mg by mouth three times daily as needed for pain
  27| 
  28| Allergies
  29| Rash after a sulfa antibiotic.
  30| 
  31| Social history
  32| She lives in a single-story house with her son. She worked as a school librarian and retired in her sixties. No tobacco.
  33| 
  34| Examination
  35| Blood pressure 138/76 mmHg, pulse 64 beats per minute, respirations 18 per minute, oxygen saturation 95 percent on room air, temperature 97.8 F, weight 61.4 kg, which is 1.8 kg above the last visit.
  36| She is alert and speaking in full sentences. Lungs have fine crackles at both bases without wheeze. Heart rhythm is regular, with no new murmur and no gallop. There is pitting edema to mid shin bilaterally. The left hip bruise is yellow-green and not tender when pressed. Gait with a cane is slow and steady.
  37| 
  38| Laboratory studies drawn this morning
  39| Sodium 136 mmol/L, potassium 4.6 mmol/L, chloride 102 mmol/L, bicarbonate 26 mmol/L, blood urea nitrogen 28 mg/dL, creatinine 1.48 mg/dL against a baseline near 1.3 mg/dL, BNP 640 pg/mL, hemoglobin 11.9 g/dL, TSH 2.4 mIU/L.
  40| 
  41| Assessment and plan
  42| 1. Volume overload on known HFrEF. The extra salt at a birthday lunch and the two missed diuretic doses are enough to explain the gain. Furosemide will increase to 40 mg by mouth twice daily for five days, then return to daily dosing if the morning weight is back at baseline. A basic metabolic panel is due in one week. She should call for a gain over 2 kg, dyspnea at rest, or new dizziness.
  43| 2. Chronic kidney disease, stage 3b. Creatinine is mildly above her usual number. Lisinopril stays on for now. Hold it if she is lightheaded or if the repeat creatinine climbs by more than 30 percent. No NSAIDs. A seperate renal clinic referral is not needed if the repeat panel is stable.
  44| 3. Contusion after a low-speed collision. History and exam do not suggest fracture or head injury, so radiographs are deferred. Acetaminophen is adequate. Her son will move the door mat and the boots so the path from the car is clear.
  45| 4. Hypothyroidism. TSH is in range on levothyroxine 88 mcg, and the dose stays the same.
  46| 
  47| The plan was reviewed slowly with her son, and a paper copy went home in her bag. She can also send a note through the portal at https://portal.example.org/phim/whitacre-msg.
  48| 
  49| Address confirmed at check-in:
  50| 418 Siltstone Court
  51| Bend, OR 97702
  52| Home phone (541) 555-0148. Her son's mobile is 541.555.0136.
  53| 
  54| Electronically signed
  55| Ruby Seo, MD
  56| Internal Medicine
  57| 
  58| Author: Ruby Seo, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0003 ===
   1| CLINICAL PHARMACY DISPENSARY CONSULTATION NOTE
   2| TRANSCRIBED FROM AMBULATORY CARE REFILL SYSTEM
   3| 
   4| PATIENT NAME: Kenji
   5| Fujimoto
   6| DOB: 12.08.1934
   7| AGE: The patient is ninety-two years old.
   8| PLAN IDENTIFIER: Plan Member ID: GHP-9938201
   9| PRESCRIPTION NUMBER: Rx # 8392014
  10| ADDRESS: 518 Evergreen Point Road, Bellevue, WA 98004
  11| CAREGIVER: Ms. Alice Taylor (patient's adult stepdaughter)
  12| CONTACT PHONE: +1-206-555-0158
  13| PRIMARY PHYSICIAN: Dr. Thomas Crawford, MD
  14| CONSULTING GERIATRICIAN: Dr. Eleanor O'Connor-Bates, MD
  15| CLINICAL PHARMACIST: Robert Miller, PharmD, BCGP
  16| DATE OF CONSULTATION: 04.11.2026
  17| 
  18| REASON FOR CONSULTATION:
  19| Comprehensive
  20|  medication reconciliation and blister-pack compliance
  21| review requested by Dr. Crawford following recent clinic discharge.
  22| Mr. Fujimoto is a ninety-two years old male with chronic open-angle
  23| glaucoma, mild vascular cognitive impairment, hypertension, and
  24| benign prostatic hyperplasia. Previous outpatient records indicate
  25| occasional missed doses when taking loose tablets from individual
  26| manufacturer bottles. Outreach was completed to evaluate current
  27| tolerability, verify caregiver administration, and coordinate refill
  28| dispensing through our specialized packaging pharmacy.
  29| 
  30| CAREGIVER INTERVIEW & COMPLIANCE ASSESSMENT:
  31| Robert Miller conducted an extensive structured telephone intake with
  32| Ms. Alice Taylor, who oversees daily pill organizers and eye drop
  33| instillation. Ms. Taylor reported that Mr. Fujimoto has maintained
  34| consistent compliance since the implementation of weekly pre-sorted
  35| blister packaging. Baseline intraocular pressures measured last week
  36| were 15 mmHg in the right eye and 16 mmHg in the left eye, indicating
  37| effective therapeutic response to latanoprost. No episodes of
  38| orthostatic lightheadedness, syncope, or acute visual changes have
  39| occurred over the preceding month. Blood pressure logs recorded at
  40| home average 126/74 mmHg seated.
  41| 
  42| MEDICATION PROFILE RECONCILED:
  43| 1. Latanoprost 0.005% ophthalmic solution, instill 1 drop into both
  44| eyes once daily in the evening for intraocular pressure control.
  45| Dispensed under Rx # 8392014 for 30-day cycle.
  46| 2. Amlodipine besylate 5 mg PO daily each morning.
  47| 3. Tamsulosin hydrochloride 0.4 mg PO daily approximately 30 minutes
  48| after the evening meal.
  49| 4. Donepezil hydrochloride 5 mg PO daily at bedtime for cognitive
  50| support; Dr. O'Connor-Bates recommended continuing current dose
  51| without escalation to minimize bradycardia risk.
  52| 5. Cholecalciferol 1,000 IU PO daily with breakfast.
  53| 6. Artificial tears, instill 1 to 2 drops in both eyes topically
  54| PRN for dry eye irritation.
  55| 
  56| CLINICAL PHARMACY EVALUATION & PLAN:
  57| 1. Reconciled full regimen against hospital discharge summary and clinic
  58| records provided by Dr. Thomas Crawford. Serum creatinine measured on
  59| 04.11.2026 was 1.02 mg/dL with eGFR 66 mL/min/1.73 m2, confirming stable
  60| renal clearance for all maintenance agents.
  61| 2. Verified coverage under Plan Member ID: GHP-9938201. Prior
  62| authorization renewal for latanoprost multi-pack was validated with the
  63| patient's health plan to prevent lapse in therapy.
  64| 3. Synchronized refill schedules for all oral maintenance medications to
  65| dispense concurrently in 30-day multi-dose blister compliance cards.
  66| Blister packaging organizes morning and evening doses into separate
  67| sealed compartments to enhance safety and prevent inadvertent dose
  68| duplication.
  69| 4. Ms. Taylor confirmed pharmacy courier delivery to 518 Evergreen
  70| Point Road is arranged for tomorrow afternoon.
  71| 5. Follow-up medication therapy review scheduled with Dr. Eleanor
  72| O'Connor-Bates in three months.
  73| 
  74| Robert Miller, PharmD, BCGP
  75| Clinical Specialist in Geriatric Pharmacotherapy
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.