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

=== DOCUMENT fd-0165 ===
   1| MEDICATION RECONCILIATION AND PRIOR AUTHORIZATION
   2| 
   3| The covering pharmacist completed this review by telephone after a
   4| syncope admission. Records from Outside Hospital supplied the
   5| administration list and the discharge diagnoses. The patient is a
   6| 69-year-old man. His son brought every bottle from the house and stayed
   7| for the teaching.
   8| 
   9| Reason for review
  10| He was admitted after a brief loss of consciousness at home with prompt
  11| recovery. The Glasgow Coma Scale was 15 on arrival and stayed there.
  12| Telemetry showed atrial fibrillation with ventricular rates mostly under
  13| 100 and no prolonged pause. An echocardiogram showed a normal ejection
  14| fraction, no large effusion, and left atrial enlargement. Orthostatic
  15| vital signs were positive, and the working judgment was volume depletion
  16| plus rate-related lightheadedness rather than a primary neurologic
  17| event. He has Graves disease, diagnosed in 2018, still treated with an
  18| antithyroid drug, along with hypertension, type 2 diabetes mellitus,
  19| stage 3 chronic kidney disease, and gout. A shin ulcer has been open for
  20| months. Allopurinol has been on the list since 2020.
  21| 
  22| During the stay a gout flare began in the right great toe. Nonsteroidal
  23| anti-inflammatory drugs were avoided because of kidney disease and
  24| because he takes an anticoagulant. Colchicine was also held to avoid
  25| stacking interacting drugs. A short steroid taper was chosen instead.
  26| Cardiology will follow the syncope and the atrial fibrillation as a
  27| service. Wound Care will follow the ulcer.
  28| 
  29| Diagnoses relevant to dispensing
  30| Graves disease on antithyroid therapy.
  31| Atrial fibrillation, rate controlled.
  32| Hypertension.
  33| Type 2 diabetes mellitus.
  34| Chronic kidney disease, stage 3.
  35| Gout, recent flare.
  36| Venous stasis ulcer of the shin.
  37| Allergic rhinitis.
  38| 
  39| Allergies
  40| No drug allergy is recorded.
  41| 
  42| Current regimen
  43| methimazole 10 mg PO daily
  44| propranolol 20 mg PO TID with meals
  45| apixaban 5 mg PO BID with breakfast and supper
  46| metformin 500 mg PO BID with meals
  47| empagliflozin 10 mg PO every morning
  48| lisinopril 10 mg PO daily
  49| atorvastatin 20 mg PO at bedtime
  50| allopurinol 100 mg PO daily
  51| prednisone 40/30/20/10 mg PO every morning with food, four days at
  52| each step, then stop
  53| Allegra 180 mg PO daily for rhinitis, generic fexofenadine acceptable
  54| acetaminophen 650 mg PO q6h PRN pain, maximum 3 g in a day
  55| cholecalciferol 1000 units PO daily
  56| 
  57| Prednisone will be dispensed as 10 mg tablets: four tablets, then
  58| three, then two, then one, each for four days. That matches the
  59| 40/30/20/10 mg taper and totals forty tablets. He should not stretch
  60| the course because the toe feels better early.
  61| 
  62| Apixaban stays at 5 mg rather than 2.5 mg. Dose-reduction criteria that
  63| combine advanced age with kidney function are not met, and body weight
  64| is above 60 kg. Do not add aspirin for the arrhythmia. If a dose of
  65| apixaban is missed, he should not double the next one.
  66| 
  67| Brand Allegra was requested on an old bottle. The son agreed to generic
  68| fexofenadine at the same dose and schedule, which avoids a needless
  69| prior authorization.
  70| 
  71| The ulcer is cleaned with saline and covered with a nonadherent foam
  72| under compression arranged by Wound Care. No topical antibiotic was
  73| added. Debridement of loose fibrin was done during the admission and is
  74| the procedure of record. An ankle-brachial index before compression was
  75| adequate, so compression stays appropriate.
  76| 
  77| Vitals at the clinic recheck, seated then standing
  78| Seated blood pressure 138/82 mmHg, heart rate 76 beats per minute.
  79| Standing blood pressure 116/74 mmHg, heart rate 92 beats per minute.
  80| Temperature 36.6 C. Respiratory rate 14 breaths per minute. Oxygen
  81| saturation 97 percent on room air. Weight 78 kg.
  82| 
  83| Laboratory results used for renal and thyroid decisions
  84| Sodium 136 mmol/L. Potassium 4.3 mmol/L. Chloride 101 mmol/L.
  85| Bicarbonate 24 mmol/L. Creatinine 1.3 mg/dL.
  86| eGFR 52 mL/min/1.73 m2.
  87| Fasting glucose 128 mg/dL. Hemoglobin A1c 7.1 percent.
  88| Hemoglobin 13.4 g/dL. Platelets 228 K/uL. WBC 6.9 K/uL.
  89| TSH 1.6 mIU/L. Free T4 1.2 ng/dL.
  90| Urate 7.1 mg/dL, not a reason to raise allopurinol during
  91| an acute flare.
  92| 
  93| Counseling and monitoring
  94| Hold empagliflozin and metformin on days he cannot eat or drink, then
  95| restart when intake is normal, to limit ketoacidosis and lactic
  96| acidosis. Hold lisinopril if vomiting persists. He should rise slowly
  97| and sit before walking because the standing pressure drops. On
  98| methimazole, fever, sore throat, or mouth ulcers need a same-day call
  99| because of agranulocytosis. Propranolol should not be stopped abruptly.
 100| Keep a steady apixaban schedule and avoid naproxen, ibuprofen, and
 101| aspirin. Allopurinol continues through the flare at the current dose
 102| and is not increased now. Acetaminophen is the analgesic for the toe
 103| and for ulcer pain. Prednisone will raise glucose, so fingerstick
 104| checks increase until the taper ends. The clinic should hear about
 105| repeated readings above 250 mg/dL. Fexofenadine is preferred to
 106| diphenhydramine, which would add fall risk. The son repeated the taper
 107| counts correctly. A thirty-day supply of the chronic medicines was
 108| prepared, with prednisone limited to forty tablets. No colchicine and
 109| no nonsteroidal drug were dispensed.
=== END DOCUMENT ===

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

Now output the label blocks, one per document, in the order shown.