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

Now output the label blocks, one per document, in the order shown.