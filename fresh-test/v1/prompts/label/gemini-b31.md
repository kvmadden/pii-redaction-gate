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


=== DOCUMENT fd-0223 ===
   1| Calloway Regional Hospital
   2| Inpatient Discharge Summary
   3| 
   4| PATIENT INFORMATION:
   5| Patient Name: WELLS, KENJI
   6| MRN: 492-108-72
   7| Billing Account Number: 8412-0941-63
   8| Admission Date: 10/12/2026
   9| Discharge Date: 10/17/2026
  10| Date of Birth: 03/19/1963
  11| Home Address: 1420 University Street, Apartment 6B, Seattle, WA 98101
  12| Telephone: (206) 555-0149 ext. 3307
  13| Online Portal: https://records.example.org/portal/discharge-summary
  14| Primary Caregiver / Next of Kin: Mrs. Margaret Wells (wife)
  15| Attending Physician: Dr. Arthur Free, MD (NPI: 1487629031, Email: afree@example.org)
  16| Consulting Specialist: Dr. Catherine Hayes, MD (Pulmonary Medicine)
  17| 
  18| DISCHARGE DIAGNOSES:
  19| 1. Acute pulmonary embolism of the right lower lobe segmental pulmonary arteries, hemodynamically stable.
  20| 2. Acute exacerbation of moderate chronic obstructive pulmonary disease, stabilized.
  21| 3. Community-acquired right lower lobe bacterial pneumonia, resolving.
  22| 4. Essential hypertension.
  23| 
  24| HISTORY OF PRESENT ILLNESS:
  25| The patient is a 63-year-old male with a history of tobacco use disorder and chronic obstructive pulmonary disease who presented to the emergency department at Calloway Regional Hospital on 10/12/2026 complaining of three days of acute pleuritic right chest pain, low-grade fever, and progressive breathlessness. He reported that his exercise tolerance had decreased from climbing two flights of stairs to experiencing dyspnea while walking across a room. He also noted mild asymmetric swelling and dull aching in his right calf over the preceding week following a prolonged automobile trip.
  26| 
  27| In the emergency department, triage vital signs revealed a resting pulse of 108 bpm, respiratory rate 24 breaths per minute, blood pressure 138/84 mmHg, temperature 38.1 C, and ambient oxygen saturation 89%, improving to 94% on 3 L/min via nasal cannula. Physical examination revealed crackles over the right lung base and tenderness upon palpation of the right gastrocnemius. Given the presence of tachycardia, right calf swelling, and suspected venous thromboembolism, his clinical Wells score was calculated as 6.0 points, indicating high pre-test probability for acute pulmonary embolism.
  28| 
  29| HOSPITAL COURSE:
  30| Diagnostic Workup and Initial Management:
  31| Urgent CT pulmonary angiography was performed, demonstrating an occlusive filling defect within the medial and posterior basal segmental branches of the right lower lobe pulmonary artery. The right ventricle to left ventricle diameter ratio was measured at 0.94, without evidence of frank right ventricular dilatation or septal flattening. The scan also identified a dense airspace consolidation in the superior and posterior segments of the right lower lobe with surrounding ground-glass opacities, consistent with concurrent post-obstructive bacterial pneumonia. Initial cardiac biomarkers showed high-sensitivity troponin I mildly elevated at 0.04 ng/mL and NT-proBNP at 420 pg/mL, establishing an intermediate-low risk clinical category. Serum lactate was normal at 1.1 mmol/L.
  32| 
  33| Dr. Arthur Free admitted Mr. Wells to the intermediate care stepdown unit. Therapeutic anticoagulation was initiated immediately with a continuous unfractionated heparin infusion utilizing the hospital standard weight-based titration protocol, successfully reaching a therapeutic activated partial thromboplastin time of 68 to 82 seconds within ten hours. Intravenous antimicrobial therapy with ceftriaxone 1 g daily and azithromycin 500 mg daily was initiated for community-acquired pneumonia. Sputum Gram stain demonstrated gram-positive diplococci; blood cultures obtained prior to antibiotic administration demonstrated no bacterial growth after five days.
  34| 
  35| Specialist Consultation and Floor Course:
  36| On hospital day two, Dr. Catherine Hayes from Pulmonary Medicine evaluated the patient. Dr. Hayes reviewed prior outpatient spirometry records from October 2026, which had demonstrated moderate airflow obstruction with an FEV1 of 62% predicted. In light of his acute chronic obstructive pulmonary disease exacerbation, nebulized ipratropium bromide-albuterol sulfate treatments every four hours were initiated, accompanied by a five-day course of systemic corticosteroids (intravenous methylprednisolone 40 mg daily). Transthoracic echocardiogram obtained on 10/15/2026 revealed normal left ventricular systolic function with an estimated left ventricular ejection fraction of 60%, normal right ventricular size with preserved systolic function (tricuspid annular plane systolic excursion 2.2 cm), and estimated pulmonary artery systolic pressure of 34 mmHg. Bilateral lower extremity venous duplex ultrasound confirmed an occlusive deep vein thrombosis within the right popliteal vein.
  37| 
  38| By hospital day four, the patient demonstrated marked clinical improvement. He was successfully weaned off supplemental oxygen, maintaining 96% on ambient air while resting and 93% with gentle ambulation. Respiratory rate normalized to 16 breaths per minute and chest pain completely resolved. Intravenous heparin was bridged to oral apixaban 10 mg twice daily. Antibiotic therapy was converted to oral cefpodoxime 200 mg twice daily to complete a planned total seven-day course. Pre-discharge arterial blood gas on room air revealed pH 7.41, PaCO2 42 mmHg, and PaO2 76 mmHg. Complete blood count demonstrated a leukocytosis resolving from 14.8 K/uL to 7.4 K/uL, hemoglobin 13.9 g/dL, and platelet count 218 K/uL. Comprehensive metabolic panel revealed serum creatinine 0.94 mg/dL and normal liver enzymes.
  39| 
  40| DISCHARGE COUNSELING AND EDUCATION:
  41| Extensive discharge education was conducted with Mr. Wells and his wife, Mrs. Margaret Wells. Mrs. Wells participated in medication reconciliation and agreed to assist her husband with medication adherence and monitoring. They were counseled on anticoagulant safety, recognizing signs of major bleeding, and red-flag symptoms such as sudden dyspnea, syncope, or hemoptysis. Mr. Wells confirmed access to his digital medical records through the patient portal at https://records.example.org/portal/discharge-summary.
  42| 
  43| DISCHARGE MEDICATIONS:
  44| 1. Apixaban 10 mg oral tablet, take 1 tablet PO BID through 10/26/2026, then transition to apixaban 5 mg PO BID for a minimum duration of 6 months.
  45| 2. Cefpodoxime 200 mg oral tablet, take 1 tablet PO BID for 3 additional days to finish the antibiotic course.
  46| 3. Fluticasone-umeclidinium-vilanterol 100/62.5/25 mcg inhaler, 1 inhalation once daily.
  47| 4. Albuterol sulfate 90 mcg HFA inhaler, 2 puffs inhaled every 4 to 6 hours as needed for wheezing or acute dyspnea.
  48| 5. Prednisone 20 mg oral tablet, 1 tablet PO daily for 2 days, then stop.
  49| 
  50| FOLLOW-UP PLAN:
  51| 1. Primary Care: Dr. Arthur Free, Internal Medicine Clinic, on Nov. 3, 2026, at 10:30 AM. For scheduling questions or concerns, call (206) 555-0149 ext. 3307 or contact afree@example.org.
  52| 2. Pulmonary Medicine: Dr. Catherine Hayes, Pulmonary Clinic, in 4 weeks for repeat spirometry and functional assessment.
  53| 3. Repeat lower extremity duplex ultrasound is recommended in 3 to 6 months to evaluate vein recanalization.
  54| 
  55| DISPOSITION: Discharged home in stable condition in the care of his wife.
  56| 
  57| Arthur Free, MD
  58| Department of Internal Medicine, Calloway Regional Hospital
  59| NPI: 1487629031
=== END DOCUMENT ===

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

Now output the label blocks, one per document, in the order shown.