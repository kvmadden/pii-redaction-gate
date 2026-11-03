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

=== DOCUMENT fd-0013 ===
   1| Date of Service: 03/18/2026
   2| From: Marit von Kästel
   3| To: Metabolic Liver Clinic
   4| Sent: 7:42 AM
   5| 
   6| Hi, this is marit von kästel writing from my phone. I recieved my lab note and i am mixed up. Ceruloplasmin is still low at 8 mg/dL and the 24 hour urine copper came back at 410 mcg/24 h. My stomache has been crampy since trientine went to 500 mg PO TID, and zinc acetate is 50 mg PO at bedtime, an hour apart. I have Wilson disease, found after Kayser-Fleischer rings, and I worry the urine copper means the chelator is failing. Mrs. Maeve O'Hearn-Wilson, my sister in law, is driving me because of the tremor. She does not have Wilson disease and is only helping with rides. Please send the apointment reminder to her house at 418 Willowglass Lane, Apt 2D, Brambley, VT 05099 if you cannot reach me on the portal. The fax blurred a zero and a one on the scanned member card, and the id line reads VK0O4l-7718, so I do not know if teh plan will accept it. Can someone check that before the visit.
   7| 
   8| From: Dr. Helen Brodie
   9| Sent: 11:05 AM
  10| 
  11| A low ceruloplasmin is expected in Wilson disease and does not mean treatment failed. On trientine, urine copper rises because copper is being pulled out, and 410 mcg/24 h is inside the usual range of about 200 to 500 mcg/24 h. Your AST was 42 U/L and ALT 51 U/L on the last draw, only mildly up, and the INR was 1.1. Stay on trientine 500 mg PO TID and zinc acetate 50 mg PO nightly, separated by at least one hour, on an empty stomach. The front desk will check the scanned member number against the plan file. We can see you soon for a tremor check and repeat urine copper. Your sister in law may come in, but she should not start any copper medicine. Send a portal note if cramps worsen, if you notice jaundice, or if you vomit blood.
  12| 
  13| Hepatology
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.