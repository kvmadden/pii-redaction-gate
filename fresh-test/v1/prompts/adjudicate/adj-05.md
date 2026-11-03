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


=== DOCUMENT fd-0247 ===
   1| BROAD STREET HEALTH CENTER
   2| INPATIENT CLINICAL SERVICES - DISCHARGE SUMMARY
   3| DISCHARGE DATE: 2026-07-22
   4| 
   5| PATIENT DEMOGRAPHICS AND RECORD IDENTIFIERS:
   6| Patient Name: Winter M. Gebreselassie
   7| Age: 94
   8| DOB: 12/04/1931
   9| Gender: Female
  10| MRN: 7029144
  11| Health Plan Policy ID: HPL-8830194A
  12| Discharge Prescription: Rx: 6940182-01
  13| Residential Address:
  14| 840 PARKVIEW TERRACE, BUILDING 4
  15| COLUMBUS, OH 43215
  16| Primary Telephone: (614) 555-0163
  17| Clinic Administration Fax: Fax: (614) 555-0185
  18| Attending Contact: april.siddiqui (at) example.net
  19| 
  20| CARE TEAM AND ATTENDEES:
  21| Inpatient Multidisciplinary Team: Dr. April R. Siddiqui, Dr. Tariq Mahmood,
  22| Farhana Begum, RN, Mateo Castillo Gómez (Caregiver)
  23| 
  24| ADMISSION AND DISCHARGE TIMELINE:
  25| Admission Date: July 15, 2026
  26| Discharge Date: 2026-07-22
  27| 
  28| ADMISSION DIAGNOSES:
  29| 1. Severe community-acquired pneumonia of the right lower lobe.
  30| 2. Parapneumonic pleural effusion, right-sided.
  31| 3. Acute exacerbation of chronic obstructive pulmonary disease.
  32| 4. Hypoxemic respiratory failure, resolved.
  33| 
  34| DISCHARGE DIAGNOSES:
  35| 1. Resolving right lower lobe bacterial pneumonia.
  36| 2. Exudative uncomplicated parapneumonic effusion, status post therapeutic and
  37| diagnostic thoracentesis.
  38| 3. Chronic obstructive pulmonary disease, return to stable baseline.
  39| 4. Essential hypertension, stable.
  40| 
  41| CHIEF COMPLAINT:
  42| Shortness of breath, productive cough, right pleuritic chest pain, and fever.
  43| 
  44| HOSPITAL COURSE SUMMARY:
  45| Ms. Winter M. Gebreselassie is a 94-year-old female with a history of moderate
  46| chronic obstructive pulmonary disease and hypertension who presented on July
  47| 15, 2026 with a three-day history of escalating exertional dyspnea, chills, and
  48| cough productive of thick yellowish sputum. Her 42-year-old son-in-law, Mateo
  49| Castillo Gómez, noted that her mental clarity had declined and her oral intake
  50| was minimal over the forty-eight hours prior to presentation.
  51| 
  52| Upon initial evaluation in the emergency triage unit, she was febrile with a
  53| temprature of 38.7 C, tachycardic at 108 bpm, tachypneic at 26 breaths/min, and
  54| hypoxemic with an oxygen saturation of 86% on ambient air, improving to 93% on
  55| 4 liters nasal cannula. Initial chest radiography and computed tomography of the
  56| thorax revealed a dense consolidation within the right lower lobe accompanied by
  57| a moderate free-flowing right pleural effusion. Initial arterial blood gas
  58| demonstrated acute hypoxemic respiratory failure with pH 7.36, pCO2 46 mmHg, and
  59| pO2 58 mmHg. Empiric broad-spectrum antimicrobial therapy was initiated with
  60| intravenous ceftriaxone and azithromycin.
  61| 
  62| Given the significant pleural fluid collection, pulmonary consultation was
  63| requested and performed promptly by Dr. Tariq
  64| Mahmood. On July 17, 2026, Dr. Mahmood performed an ultrasound-guided bedside
  65| thoracentesis, successfully removing 650 mL of amber, cloudy pleural fluid.
  66| Pleural fluid analysis was consistent with an exudative, non-purulent effusion:
  67| pleural protein 3.8 g/dL (serum 6.4 g/dL), pleural LDH 410 U/L (serum LDH 220
  68| U/L), pH 7.34, glucose 78 mg/dL, and negative Gram stain. Bronchoscopy with
  69| bronchoalveolar lavage was considered but deferred given rapid clinical
  70| improvement following thoracentesis and antibiotic administration. Sputum and
  71| pleural fluid cultures ultimately grew Streptococcus pneumoniae susceptible to
  72| ceftriaxone and amoxicillin-clavulanate.
  73| 
  74| During the middle portion of the hospitalization, the patient received
  75| scheduled nebulized albuterol-ipratropium and a brief five-day course of oral
  76| prednisone 40 mg daily for her chronic obstructive pulmonary disease
  77| exacerbation, which was tapered to completion prior to discharge. Oxygen
  78| requirements decreased steadily, and by July 20th she was successfully weaned
  79| to room air with resting oxygen saturations remaining between 94% and 96%.
  80| 
  81| On July 22nd, Dr. April R. Siddiqui performed the final discharge assessment.
  82| The patient was ambulating forty feet in the corridor with physical therapy
  83| assistance and a rolling walker. Mateo Castillo Gómez was present for all
  84| discharge teaching, including spacer technique for inhalers and warning signs of
  85| recurrent infection. The clinical team dicsussed the importance of hydration
  86| and completion of the oral antibiotic regimen. Farhana Begum, RN, verified
  87| that all discharge instructions and prescriptions were fully understood.
  88| 
  89| DISCHARGE PHYSICAL EXAMINATION:
  90| Vital Signs: Temperature 98.4 F, pulse 74 bpm regular, blood pressure 124/76
  91| mmHg, respiratory rate 16 breaths/min, oxygen saturation 96% on room air.
  92| General: Frail but alert and pleasant elderly female sitting comfortably in
  93| bed in no acute respiratory distress.
  94| HEENT: Normocephalic, atraumatic, moist oral mucosa, no oropharyngeal lesions.
  95| Cardiovascular: Normal S1 and S2, regular rhythm, no murmurs, rubs, or gallops.
  96| Pulmonary: Lungs with coarse breath sounds at the right lung base, markedly
  97| improved from admission; no audible wheezing or crackles bilaterally.
  98| Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds throughout.
  99| Extremities: Warm and dry, no peipheral edema, no calf tenderness, distal
 100| pulses intact.
 101| Neurologic: Alert, oriented to person, place, and date; non-focal motor and
 102| sensory examination.
 103| 
 104| DISCHARGE LAB VALUES:
 105| WBC: 7.2 x 10^3/uL (normalized from 16.4 x 10^3/uL on admission)
 106| Hemoglobin: 11.8 g/dL
 107| Platelet count: 215 x 10^3/uL
 108| Sodium: 137 mEq/L
 109| Potassium: 4.1 mEq/L
 110| Chloride: 100 mEq/L
 111| CO2: 26 mEq/L
 112| BUN: 19 mg/dL
 113| Creatinine: 0.88 mg/dL
 114| Glucose: 106 mg/dL
 115| Repeat Chest Radiograph: Significant clearing of right lower lobe consolidation,
 116| minimal residual blunting of the right costophrenic sulcus.
 117| 
 118| DISCHARGE MEDICATIONS:
 119| 1. Amoxicillin-clavulanate 875-125 mg oral tablet twice daily for an additional
 120|    5 days (completing a 10-day total course; Rx: 6940182-01).
 121| 2. Fluticasone-salmeterol 250/50 mcg diskus, 1 inhalation twice daily.
 122| 3. Albuterol sulfate 90 mcg HFA inhaler, 2 puffs every 4 to 6 hours as needed
 123|    for wheezing or shortness of breath.
 124| 4. Amlodipine besylate 5 mg oral tablet once daily in the morning.
 125| 
 126| FOLLOW-UP APPOINTMENTS AND INSTRUCTIONS:
 127| 1. Broad Street Health Center Pulmonary Clinic: Appointment with Dr. Tariq
 128|    Mahmood on August 12, 2026 at 10:00 AM for follow-up chest radiograph.
 129| 2. Primary Care Follow-up: Clinic visit with Dr. April R. Siddiqui on August 5,
 130|    2026 at 2:30 PM.
 131| 3. Caregiver Support: Son-in-law Mateo Castillo Gómez will oversee medication
 132|    administration and assist with daily meals and transportation.
 133| 
 134| April R. Siddiqui, MD
 135| Broad Street Health Center, Internal Medicine
 136| Date: 2026-07-22
=== END DOCUMENT ===
ITEMS FOR fd-0247:
D1 | line 29 | A: KEEP "Severe community-acquired pneumonia of the right lower lobe" | B: KEEP "community-acquired pneumonia"
D2 | line 30 | A: KEEP "Parapneumonic pleural effusion, right-sided" | B: KEEP "Parapneumonic pleural effusion"
D3 | line 31 | A: KEEP "Acute exacerbation of chronic obstructive pulmonary disease" | B: KEEP "chronic obstructive pulmonary disease"
D4 | line 35 | A: KEEP "right lower lobe bacterial pneumonia" | B: KEEP "bacterial pneumonia"
D5 | line 36 | A: KEEP "Exudative uncomplicated parapneumonic effusion" | B: KEEP "parapneumonic effusion"
D6 | line 36 | A: KEEP "therapeutic and\ndiagnostic thoracentesis" | B: KEEP "thoracentesis"
D7 | line 55 | A: KEEP "computed tomography of the\nthorax" | B: KEEP "computed tomography"
D8 | line 57 | A: KEEP "moderate free-flowing right pleural effusion" | B: KEEP "pleural effusion"
D9 | line 58 | A: KEEP "acute hypoxemic respiratory failure" | B: KEEP "hypoxemic respiratory failure"
D10 | line 64 | A: CLINICIAN "Mahmood" | B: (nothing)
D11 | line 64 | A: KEEP "ultrasound-guided bedside\nthoracentesis" | B: KEEP "thoracentesis"
D12 | line 68 | A: KEEP "Bronchoscopy with\nbronchoalveolar lavage" | B: KEEP "Bronchoscopy" ; KEEP "bronchoalveolar lavage"
D13 | line 76 | A: KEEP "chronic obstructive pulmonary disease\nexacerbation" | B: KEEP "chronic obstructive pulmonary disease"
D14 | line 122 | A: KEEP "every 4 to 6 hours" ; KEEP "as needed" | B: KEEP "every 4 to 6 hours as needed"
K1 | line 5 | KEEP "PATIENT DEMOGRAPHICS AND RECORD IDENTIFIERS"
K2 | line 20 | KEEP "CARE TEAM AND ATTENDEES"
K3 | line 24 | KEEP "ADMISSION AND DISCHARGE TIMELINE"
K4 | line 53 | KEEP "temprature of 38.7 C"
K5 | line 53 | KEEP "108 bpm"
K6 | line 53 | KEEP "26 breaths/min"
K7 | line 54 | KEEP "oxygen saturation of 86%"
K8 | line 54 | KEEP "93%"
K9 | line 55 | KEEP "4 liters"
K10 | line 55 | KEEP "nasal cannula"
K11 | line 62 | KEEP "pulmonary consultation"
K12 | line 65 | KEEP "650 mL"
K13 | line 66 | KEEP "exudative, non-purulent effusion"
K14 | line 68 | KEEP "negative Gram stain"
K15 | line 70 | KEEP "Sputum and\npleural fluid cultures"
K16 | line 71 | KEEP "Streptococcus pneumoniae"
K17 | line 79 | KEEP "oxygen saturations remaining between 94% and 96%"
K18 | line 82 | KEEP "physical therapy"
K19 | line 90 | KEEP "Vital Signs"
K20 | line 92 | KEEP "General"
K21 | line 94 | KEEP "HEENT"
K22 | line 95 | KEEP "Cardiovascular"
K23 | line 96 | KEEP "Pulmonary"
K24 | line 98 | KEEP "Abdomen"
K25 | line 99 | KEEP "Extremities"
K26 | line 101 | KEEP "Neurologic"
K27 | line 105 | KEEP "16.4 x 10^3/uL"
K28 | line 121 | KEEP "diskus"
K29 | line 121 | KEEP "1 inhalation"
K30 | line 122 | KEEP "HFA"
K31 | line 122 | KEEP "2 puffs"
K32 | line 129 | KEEP "Primary Care"
K33 | line 135 | KEEP "Internal Medicine"

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
ITEMS FOR fd-0250:
K1 | line 6 | KEEP "burning dysesthesias" [labeler unsure]
K2 | line 6 | KEEP "less than 500 ng/mL"
K3 | line 12 | KEEP "D-dimer"

=== DOCUMENT fd-0253 ===
   1| CLINICAL INTAKE CALL TRANSCRIPT
   2| Facility: Valley Nephrology and Hypertension Center
   3| Call Session ID: 5820 1938 44
   4| Date of Intake: 14 Nov 2026
   5| Care Team: Dr. Dante Carandang, Carmela de la Torre, RN, Dr. Jocelyn Morales
   6| Patient: Crisanto Custodio
   7| DOB: 28 Aug 1934
   8| Age: 92-year-old male
   9| Caregiver / Caller: Olumide Adebayo (son-in-law)
  10| 
  11| [Call Audio Recorded]
  12| 
  13| Carmela de la Torre, RN: Valley Nephrology and Hypertension Center, my name is Carmela de la Torre, registered nurse. How, uh, how may I help you this afternoon?
  14| 
  15| Olumide Adebayo: Hello, good afternoon nurse. My name is Olumide Adebayo. I am, uh, I am calling regarding my father-in-law, Crisanto Custodio. He is, uh, currently receiving maintenance hemodialysis—well, actually, he transitioned to in-center hemodialysis last month via his left arm arteriovenous fistula, and he has severe cramping and nausea after his treatment session yesterday.
  16| 
  17| Carmela de la Torre, RN: Okay, Mr. Adebayo, let me pull up his electronic chart. One moment... alright, I see Mr. Custodio's record. Could you confirm his date of birth and address?
  18| 
  19| Olumide Adebayo: Yes. His DOB is 28 Aug 1934. He is a 92-year-old gentleman, and he lives in Chicago with my wife and me. His address is 1042 Skyline Boulevard, Apt 12, Chicago, IL 60616.
  20| 
  21| Carmela de la Torre, RN: Thank you. I see in our intake notes that the portal registration had the address in lowercase as 1042 skyline boulevard, apt 12. And your mobile phone ends in 0173?
  22| 
  23| Olumide Adebayo: Yes, my mobile number is 312–555–0173.
  24| 
  25| Carmela de la Torre, RN: Perfect. Tell me about the symptoms Mr. Custodio is experiencing. When did the cramping start, and how is his fistula looking?
  26| 
  27| Olumide Adebayo: Well, um, the cramps in his calves started about, uh, two hours after dialysis yesterday. He felt very nauseated and vomited once. His left arm arteriovenous fistula looks okay—no redness, no swelling, and I can feel the thrill, that buzzing vibration the clinic taught us to check. But he barely ate dinner, and this morning he could only take a few sips of water. We worry about his potassium and fluid balance with his end-stage renal disease.
  28| 
  29| Carmela de la Torre, RN: Checking the thrill was the right thing to do, Olumide. Looking at his treatment sheet from yesterday's hemodialysis session, they removed 3.2 liters of fluid. His post-dialysis weight was 64.5 kg, which was 0.8 kg below his dry weight of 65.3 kg. That over-ultrafiltration causes cramping and nausea. Did you check his blood pressure today?
  30| 
  31| Olumide Adebayo: Yes. Sitting blood pressure was 102/62 mmHg, pulse 74 bpm, temperature 98.2 F. Usually it sits around 135/80 mmHg.
  32| 
  33| Carmela de la Torre, RN: That confirms he is slightly intravascularly depleted from pulling too much fluid. Did he take his sevelamer carbonate 800 mg PO TID with meals today?
  34| 
  35| Olumide Adebayo: He didn't eat breakfast, so he didn't take the sevelamer. He only took his renal multivitamin. We held his carvedilol because his systolic was close to 100.
  36| 
  37| Carmela de la Torre, RN: Holding carvedilol was very smart with a systolic of 102. Reviewing his labs from Thursday: serum potassium was 4.8 mEq/L, blood urea nitrogen was 54 mg/dL, and serum creatinine was 6.8 mg/dL with an estimated GFR under 10 mL/min/1.73m2. Parathyroid hormone was 420 pg/mL. I will consult our attending nephrologist, Dr. Dante Carandang. The internal paging log shows the covering clinician typed in lowercase as carandang under Medical License: MED-839201. I will also log this note under patient initials C.C. so the dialysis unit nurse sees it before his scheduled run on Monday.
  38| 
  39| Olumide Adebayo: Okay, thank you. Should we give him any broth or electrolyte fluids, or would that overload his kidneys?
  40| 
  41| Carmela de la Torre, RN: Avoid high-sodium broth and sports drinks with potassium. Give him small sips of regular water or apple juice, no more than 4 ounces at a time, keeping total fluid intake under his 1000 mL daily limit. Gentle calf massage and a warm compress can help. However, if he develops chest pain, shortness of breath, profound weakness, or if his fistula stops buzzing, call 911 or go to the emergency room immediately.
  42| 
  43| Olumide Adebayo: Understood. Small sips of water, warm compress, watch fluid limit, and check the fistula thrill.
  44| 
  45| Carmela de la Torre, RN: Exactly. Dr. Carandang and I will update his hemodialysis prescription for Monday to increase his dry weight target to 65.5 kg so they pull less fluid. Thank you for calling, Olumide.
  46| 
  47| Olumide Adebayo: Thank you, Nurse Carmela. Have a blessed day.
  48| 
  49| Carmela de la Torre, RN: You too. Goodbye.
  50| 
  51| [End of Audio]
=== END DOCUMENT ===
ITEMS FOR fd-0253:
D1 | line 15 | A: KEEP "maintenance hemodialysis" | B: KEEP "hemodialysis"
D2 | line 15 | A: KEEP "in-center hemodialysis" | B: KEEP "hemodialysis"
D3 | line 15 | A: KEEP "left arm arteriovenous fistula" | B: KEEP "arteriovenous fistula"
D4 | line 19 | A: DOB "28 Aug 1934" | B: (nothing)
D5 | line 27 | A: KEEP "left arm arteriovenous fistula" | B: KEEP "arteriovenous fistula"
K1 | line 25 | KEEP "fistula"
K2 | line 29 | KEEP "3.2 liters"
K3 | line 29 | KEEP "post-dialysis weight was 64.5 kg"
K4 | line 29 | KEEP "0.8 kg"
K5 | line 29 | KEEP "dry weight of 65.3 kg"
K6 | line 29 | KEEP "over-ultrafiltration"
K7 | line 33 | KEEP "intravascularly depleted"
K8 | line 33 | KEEP "with meals"
K9 | line 35 | KEEP "systolic was close to 100"
K10 | line 37 | KEEP "systolic of 102"
K11 | line 37 | KEEP "dialysis"
K12 | line 41 | KEEP "4 ounces"
K13 | line 41 | KEEP "1000 mL"
K14 | line 41 | KEEP "daily"
K15 | line 41 | KEEP "fistula"
K16 | line 43 | KEEP "fistula"
K17 | line 45 | KEEP "dry weight target to 65.5 kg"

=== DOCUMENT fd-0255 ===
   1| TRAUMA AND ORTHOPEDIC SPECIALTY HOSPITAL
   2| OUTPATIENT SURGICAL FOLLOW-UP PROGRESS NOTE
   3| Date of Evaluation: Nov. 2, 2026
   4| 
   5| PATIENT DEMOGRAPHIC AND CLINICAL RECORD:
   6| Patient Name: Mr. Thiago da Silva Tavares
   7| Medical Record Number: MRN: MR-8830194
   8| Universal Encounter Tracking ID: 9481-2204-71
   9| Date of Birth: 06/18/1983 (Age: 43-year-old male)
  10| Home Address: 842 Blossom Hill Road, Suite 210, San Jose, CA 95123
  11| Contact Email: thiago.tavares@example.net
  12| Attending Surgical Practice Telephone: (408) 555-0177 ext. 234
  13| 
  14| CLINICAL CARE TEAM:
  15| Attending Orthopedic Surgeon: Dr. Major Singh, MD (State Medical License # C-489201)
  16| Orthopedic Clinical Assistant: Little Sharma, MA
  17| Accompanied By: Wife, Mrs. Agnieszka Dąbrowska (Age: 41-year-old)
  18| 
  19| CHIEF COMPLAINT:
  20| Initial post-discharge surgical follow-up evaluation for open reduction and internal fixation (ORIF) of the right distal radius fracture, splint removal, wound inspection, and cast application.
  21| 
  22| HISTORY OF PRESENT ILLNESS:
  23| Mr. Thiago da Silva Tavares is a 43-year-old right-hand-dominant male software engineer who presents for his first scheduled post-operative visit following orthopedic trauma surgery. The patient was involved in a motor vehicle collision on 10/28/2026 when his sedan was struck on the passenger side by another vehicle. Emergency transport documentation notes that the vehicle, bearing VIN: 1HGCR2F83HA029184, sustained significant front-end damage with airbag deployment. The patient was transported directly to Trauma and Orthopedic Specialty Hospital, where physical examination and emergency radiographic imaging confirmed an acute, displaced, intra-articular fracture of the right distal radius with dorsal comminution and associated ulnar styloid fracture.
  24| 
  25| Following emergent closed reduction and sugar-tong splint immobilization in the emergency department, the patient was admitted to the inpatient orthopedic surgery service from 10/28/2026 to 11/02/2026. On 10/29/2026, he underwent definitive operative management comprising open reduction and internal fixation utilizing a volar locking plate system with intraoperative fluoroscopic guidance. The surgical procedure was uncomplicated, achieving anatomic restoration of the radial articular surface, radial inclination, and volar tilt. He was discharged home on Nov. 2, 2026, in stable condition with a sterile surgical dressing and plaster volar-dorsal immobilization splint.
  26| 
  27| Today, Mr. Thiago da Silva Tavares is accompanied by his wife, Mrs. Agnieszka Dąbrowska, who assists with his daily activities and medication administration. The patient reports that his postoperative pain has been manageable and steadily improving. He has been taking oral acetaminophen and ibuprofen as prescribed, having required only two doses of oxycodone over the last 48 hours. He notes mild swelling and tightness over the dorsum of the right fingers, which improves when the extremity is elevated above the level of his heart. He denies fever, chills, numbness, tingling in the median nerve distribution, or progressive throbbing pain. His postoperative digital radiographs and operative summary were retrieved and reviewed through the regional PACS imaging portal at https://imaging.example.com/reports/ortho-trauma.
  28| 
  29| PAST MEDICAL AND SURGICAL HISTORY:
  30| 1. Right distal radius intra-articular fracture, status post ORIF on 10/29/2026.
  31| 2. Mild hypercholesterolemia, diagnosed in September 2025.
  32| 3. Left knee arthroscopic partial meniscectomy in 2016.
  33| 4. No prior wrist fractures, carpal tunnel syndrome, or inflammatory arthropathy.
  34| 
  35| CURRENT MEDICATIONS:
  36| 1. Oxycodone hydrochloride 5 mg PO q4-6h PRN severe pain (Rx # RX-8492013).
  37| 2. Acetaminophen 650 mg PO q6h PRN mild-to-moderate pain.
  38| 3. Ibuprofen 600 mg PO TID with meals.
  39| 4. Enoxaparin sodium 40 mg subcutaneous daily for venous thromboembolism prophylaxis (completed 5-day post-injury course).
  40| 5. Atorvastatin calcium 10 mg PO daily at bedtime.
  41| 
  42| ALLERGIES:
  43| No known drug allergies.
  44| 
  45| PHYSICAL EXAMINATION:
  46| Vital Signs (measured by Little Sharma, MA):
  47| Blood Pressure: 122/78 mmHg
  48| Pulse: 68 beats per minute, regular
  49| Respiratory Rate: 14 breaths per minute
  50| Temperature: 98.2 F (36.8 C), oral
  51| Oxygen Saturation: 99% on ambient room air
  52| Weight: 78.4 kg (172.8 lbs)
  53| 
  54| General: The patient is a healthy-appearing 43-year-old male, alert, oriented x4, comfortable, in no acute distress.
  55| Right Upper Extremity Examination:
  56| The postoperative plaster splint and bulky gauze dressing were removed under clean technique. Inspection reveals a 7 cm longitudinal volar incision over the distal forearm and wrist, well-approximated with intact non-absorbable monofilament sutures. There is mild surrounding ecchymosis and expected postoperative edema, but no erythema, purulent drainage, hematoma, or skin necrosis. Mild tenderness is elicited along the surgical site, without fluctuance.
  57| Compartments of the forearm and hand are soft and completely compressible.
  58| Neurovascular Examination: Radial and ulnar pulses are 2+ palpable at the wrist. Capillary refill is brisk at less than 2 seconds across all five digits. Sensation to light touch and two-point discrimination is completely intact across the thumb, index, long, and radial ring fingers (median nerve distribution), small finger (ulnar nerve distribution), and dorsal first webspace (superficial radial nerve distribution). No signs of acute carpal tunnel syndrome. Active range of motion of the thumb interphalangeal joint and all finger MCP, PIP, and DIP joints is full and symmetric without significant discomfort.
  59| 
  60| DIAGNOSTIC IMAGING REVIEW:
  61| Three-View Radiographs of the Right Wrist (clinic today, Nov. 2, 2026):
  62| Orthopedic radiographs demonstrate stable anatomical alignment of the right distal radius fracture. The volar locking plate and screws remain well-seated without loosening, hardware failure, or articular penetration. Radial length, radial inclination (22 degrees), and volar tilt (10 degrees) are anatomically restored. The ulnar styloid base fracture is stable and non-displaced. No periosteal reaction or heterotopic ossification observed.
  63| 
  64| ASSESSMENT AND CLINICAL IMPRESSION:
  65| 1. Status post open reduction and internal fixation of acute right distal radius intra-articular fracture: Healing appropriately on postoperative day 4. Clean surgical incision without wound infection, dehiscence, or median nerve neurapraxia.
  66| 2. Post-traumatic pain and soft tissue edema: Improving, well-controlled on multimodal non-opioid analgesia.
  67| 
  68| PLAN AND RECOMMENDATIONS:
  69| 1. Wound Management and Immobilization: The incision was cleansed with sterile saline and dressed with sterile Telfa pads. A short arm fiberglass cast was applied in neutral wrist alignment by orthopedic staff under my direct supervision. Cast care instructions were provided, emphasizing the need to keep the cast dry and clean.
  70| 2. Analgesia and Medications: Discontinue scheduled opioids; continue acetaminophen 650 mg PO q6h PRN and ibuprofen 600 mg PO TID with meals. Continue atorvastatin 10 mg PO daily.
  71| 3. Activity and Rehabilitation: Maintain right arm elevation when resting. Gentle active finger and thumb range-of-motion exercises encouraged. Strict non-weight-bearing restriction on the right upper extremity (no lifting greater than 1 pound).
  72| 4. Follow-Up: The patient will return to Trauma and Orthopedic Specialty Hospital in ten days for cast bivalving, suture removal, and transition to a removable thermoplastic wrist orthosis with formal occupational hand therapy initiation. Patient and Mrs. Agnieszka Dąbrowska were instructed to call the office immediately or seek urgent evaluation if finger numbness, blue discoloration, intractable pain, or cast tightness develops.
  73| 
  74| Attending Physician Signoff:
  75| Electronically signed by:
  76| Dr. Major Singh, MD
  77| Trauma and Reconstructive Orthopedic Surgery
  78| State Medical License # C-489201
  79| major.singh@example.org
  80| Trauma and Orthopedic Specialty Hospital
=== END DOCUMENT ===
ITEMS FOR fd-0255:
D1 | line 20 | A: KEEP "right distal radius fracture" | B: KEEP "distal radius fracture"
D2 | line 23 | A: KEEP "acute, displaced, intra-articular fracture of the right distal radius with dorsal comminution" | B: KEEP "intra-articular fracture of the right distal radius"
D3 | line 30 | A: KEEP "Right distal radius intra-articular fracture" | B: KEEP "distal radius intra-articular fracture"
D4 | line 31 | A: KEEP "Mild hypercholesterolemia" | B: KEEP "hypercholesterolemia"
D5 | line 32 | A: KEEP "Left knee arthroscopic partial meniscectomy" | B: KEEP "arthroscopic partial meniscectomy"
D6 | line 51 | A: KEEP "Oxygen Saturation: 99% on ambient room air" | B: KEEP "Oxygen Saturation: 99%"
D7 | line 58 | A: KEEP "acute carpal tunnel syndrome" | B: KEEP "carpal tunnel syndrome"
D8 | line 62 | A: KEEP "right distal radius fracture" | B: KEEP "distal radius fracture"
D9 | line 65 | A: KEEP "acute right distal radius intra-articular fracture" | B: KEEP "distal radius intra-articular fracture"
K1 | line 25 | KEEP "orthopedic surgery service"
K2 | line 25 | KEEP "intraoperative fluoroscopic guidance"
K3 | line 25 | KEEP "plaster volar-dorsal immobilization splint"
K4 | line 27 | KEEP "oral"
K5 | line 33 | KEEP "wrist fractures"
K6 | line 38 | KEEP "with meals"
K7 | line 40 | KEEP "at bedtime"
K8 | line 46 | KEEP "Vital Signs"
K9 | line 50 | KEEP "oral"
K10 | line 54 | KEEP "General"
K11 | line 61 | KEEP "Three-View Radiographs of the Right Wrist"
K12 | line 62 | KEEP "hardware failure"
K13 | line 62 | KEEP "articular penetration"
K14 | line 62 | KEEP "radial inclination (22 degrees)"
K15 | line 62 | KEEP "volar tilt (10 degrees)"
K16 | line 62 | KEEP "periosteal reaction"
K17 | line 65 | KEEP "dehiscence"
K18 | line 66 | KEEP "Post-traumatic pain and soft tissue edema"
K19 | line 69 | KEEP "Wound Management and Immobilization"
K20 | line 69 | KEEP "sterile saline"
K21 | line 69 | KEEP "short arm fiberglass cast"
K22 | line 70 | KEEP "Analgesia and Medications"
K23 | line 70 | KEEP "with meals"
K24 | line 71 | KEEP "Activity and Rehabilitation"
K25 | line 71 | KEEP "range-of-motion exercises"
K26 | line 72 | KEEP "Follow-Up"
K27 | line 72 | KEEP "removable thermoplastic wrist orthosis"
K28 | line 72 | KEEP "occupational hand therapy"
K29 | line 74 | KEEP "Attending Physician Signoff"

=== DOCUMENT fd-0269 ===
   1| From: Fiona Egan-O'Rourke
   2| To: neurology portal
   3| Date of Service: Mar 4 2026
   4| Subject: face droop and the eye
   5| 
   6| hi this is fiona egan-o'rourke. since yesterday the left side of my face feels flat and my eye will not close all the way. i have occassional tearing and the taste on the left side of my tongue is off. i can still lift both arms and my speech is clear, so i do not think this is a stroke, but i am scared. i am 41 and this has never happened before. i am not pregnant. i take no daily medicines other than the new ones they just called in. chewing feels odd and loud sounds bother the left ear. Bramble Hollow Clinic told me to start prednisone and an antiviral and to message the portal if the droop got worse. i definately want someone to look at the plan. home blood pressure was 128/76 mmHg, pulse 82 beats per minute, and i had no fever. glucose on the home meter was 104 mg/dL. please copy my sister Dorothy Keene, Narek Avagyan, and Lilit Barseghyan. she can recieve a call at (415) 555-0188 if you cannot reach me. the portal also flagged a sign-in from 203.0.113.42 which was me on the library computer, not a stranger. my account code on the printout is 7104 2281 63. mail any eye shield to 1842 Cinder Lane, Brindle Ford, OR 97035.
   7| 
   8| From: Narek Avagyan, MD
   9| To: the patient
  10| 
  11| Thank you for the detail, and for saying the arms and speech are normal. That history fits Bell palsy more than a brain event, as long as the weakness stays in the face. We still want a same-day exam if the face droop spreads, if you get a severe headache, or if an arm or a leg becomes weak.
  12| 
  13| Medications: prednisone 50 mg PO daily for 10 days, then stop. Do not taper this short course on your own and do not stretch it. Valacyclovir 1 g PO TID for 7 days. Artificial tears, 1 drop in the left eye every 2 hours while awake, and lubricating ointment in the left eye at bedtime. Tape the eyelid shut at night if it will not close. Keep the eye shield on when you are outdoors. Protect the cornea until the eyelid closes on its own, which often takes a few weeks.
  14| 
  15| The account code with the spaces and the library sign-in can stay as you wrote them. We do not need them sent again. Your sister may join a call, and the clinicians already named can read this thread.
  16| 
  17| Vitals you sent are reassuring. If we draw labs at the visit we will check a basic metabolic panel and a glucose, because prednisone can push sugar up even when a fasting value was 104 mg/dL. No MRI and no lumbar puncture are planned unless the exam finds a second neurologic sign. Diagnosis for this message: left Bell palsy. Write back for a rash in the ear, worsening pain, or vision change.
=== END DOCUMENT ===
ITEMS FOR fd-0269:
D1 | line 6 | A: KEEP "blood pressure was 128/76 mmHg" | B: KEEP "128/76 mmHg"
D2 | line 6 | A: KEEP "glucose on the home meter was 104 mg/dL" | B: KEEP "104 mg/dL"
K1 | line 13 | KEEP "every 2 hours"
K2 | line 13 | KEEP "at bedtime"
K3 | line 17 | KEEP "MRI"

=== DOCUMENT fd-0271 ===
   1| Date of Service: April 9, 2026
   2| Patient Name: TADESSE-HAILE, BERHANE
   3| Plan Group Number: GRP-7710394
   4| Provider: Dr. Thomas Fletcher
   5| Subject: Follow-up on asthma maintenance therapy and spirometry paperwork
   6| 
   7| Message 1
   8| From: berhane
   9| Sent: April 9, 2026 09:14 AM
  10| To: Dr. Thomas Fletcher
  11| 
  12| dear dr. fletcher,
  13| i am writing to follow up on my persistent nocturnal cough and shortness of breath after completing the recent taper. i have been taking my Symbicort 160/4.5 mcg two inhalations BID consistently and using albuterol HFA 90 mcg two puffs every four to six hours as needed for wheezing. over the past four days, i needed the rescue inhaler twice each night, and my peak expiratory flow readings dropped to 380 L/min, down from my baseline of 520 L/min. my caregiver Nancy Wheeler noticed i was wheezing heavily while climbing stairs yesterday afternoon. my pulse oximetry at rest was 95% on room air and pulse was 84 bpm.
  14| 
  15| i also need assistance with coordination for pulmonary function testing. i work in Tukwila now and the regional occupational health suite nearby agreed to perform the plethysmography and pre/post bronchodilator spirometry. they stated they can process the intake today if your office can transmit the order form, chart notes, and authorization directly to their reception desk at Fax: (206) 555-0162. please let me know if you would like me to start a burst of oral prednisone or adjust the controller dosage before the test. thank you for your help.
  16| 
  17| Message 2
  18| From: Dr. Thomas Fletcher
  19| Sent: April 9, 2026 01:30 PM
  20| To: TADESSE-HAILE, BERHANE
  21| 
  22| Dear Mr. Tadesse-Haile,
  23| 
  24| Thank you for contacting our clinic with this update. Given the drop in your peak flow from 520 to 380 L/min and frequent nighttime rescue inhaler use, your asthma is currently not adequately controlled. We will initiate a short oral steroid taper: please take prednisone 40 mg PO daily for five days, then discontinue. Continue Symbicort 160/4.5 mcg two inhalations BID, rinsing your mouth thoroughly after each dose, and keep albuterol available for acute dyspnea.
  25| 
  26| My medical assistant has sent the clinical records and spirometry orders to the testing suite at Fax: (206) 555-0162, including your coverage verification under Plan Group Number: GRP-7710394. Please have Nancy Wheeler contact our clinic or go to urgent care if your resting oxygen saturation falls below 92% or if your breathing does not improve within 48 hours of starting prednisone. We will review your spirometry curves during our scheduled video visit on April 23, 2026.
  27| 
  28| Sincerely,
  29| Thomas Fletcher, MD
=== END DOCUMENT ===
ITEMS FOR fd-0271:
D1 | line 13 | A: KEEP "peak expiratory flow readings dropped to 380 L/min, down from my baseline of 520 L/min" [unsure] | B: KEEP "380 L/min" ; KEEP "520 L/min"
D2 | line 15 | A: KEEP "pre/post bronchodilator spirometry" | B: KEEP "spirometry"
K1 | line 13 | KEEP "two inhalations"
K2 | line 13 | KEEP "two puffs"
K3 | line 13 | KEEP "every four to six hours"
K4 | line 13 | KEEP "as needed"
K5 | line 13 | KEEP "twice each night" [labeler unsure]
K6 | line 13 | KEEP "pulse oximetry at rest was 95% on room air"
K7 | line 13 | KEEP "pulse was 84 bpm"
K8 | line 15 | KEEP "occupational health" [labeler unsure]
K9 | line 15 | KEEP "oral"
K10 | line 24 | KEEP "peak flow from 520 to 380 L/min"
K11 | line 24 | KEEP "oral"
K12 | line 24 | KEEP "two inhalations"
K13 | line 26 | KEEP "resting oxygen saturation falls below 92%" [labeler unsure]

=== DOCUMENT fd-0273 ===
   1| Pellam Ridge Medical Center
   2| Outpatient Progress Note
   3| Department of Family Medicine
   4| 
   5| Date of Service: 03-12-2026
   6| Patient: Calvin J. Nordhoff
   7| MRN: 4472186
   8| Account #: 8821-44019
   9| Author: Thalia Vlachos, MD
  10| 
  11| Chief complaint
  12| Follow-up after a motor vehicle collision, including a suture check of a forehead laceration.
  13| 
  14| History of present illness
  15| Calvin J. Nordhoff is a 54-year-old man who lives in Haysford and works as a cabinet finisher. He was the restrained driver of a 2014 pickup, plate 8RKW-441, when another vehicle turned across his lane on 4 March 2026 near the mill road. The airbag deployed. He was evaluted that evening in the emergency department, where a forehead laceration was irrigated and closed with six simple interrupted sutures and a noncontrast head CT was read as negative for acute intracranial bleed. He was discharged the same night to the care of his wife, Samira al-Hashimi. Today the headache has eased to a dull ache behind the eyes by late afternoon, rated 3 out of 10, without vomiting, visual change, or new weakness. Neck stiffness is worse when he checks a blind spot. Sleep remains broken. He has not driven since the crash because the truck is still at the tow yard. He denies chest pain, shortness of breath, abdominal pain, and hematuria.
  16| 
  17| He takes lisinopril 20 mg by mouth each morning for hypertension and uses ibuprofen 600 mg by mouth every eight hours with food for neck pain. There is no known drug allergy. He does not smoke. Alcohol is two beers on a weekend evening.
  18| 
  19| Past medical history
  20| Hypertension. Remote right inguinal hernia repair in 2011. No diabetes, no seizure disorder, and no earlier head injury.
  21| 
  22| Medications
  23| 1. Lisinopril 20 mg by mouth daily.
  24| 2. Ibuprofen 600 mg by mouth every 8 hours with food as needed for pain.
  25| 3. Acetaminophen 500 mg by mouth up to three times daily if the headache returns, staying under 3 grams a day.
  26| 
  27| Allergies
  28| No known drug allergies.
  29| 
  30| Social history
  31| He lives with his wife. Their adult son has been driving him to appointments. He hopes to return to the shop on light duty once he can turn his head without a sharp pull. A seperate work note was requested for the shop foreman, with lifting limited to fifteen pounds for one week.
  32| 
  33| Review of systems
  34| Fatigue without fever. Mild photophobia that has cleared. Neck stiffness as above. No focal weakness, no syncope, and no vision loss. Remainder of the review is negative.
  35| 
  36| Physical examination
  37| Blood pressure 138/84 mmHg, heart rate 76, respiratory rate 14, temperature 98.2 F, oxygen saturation 98 percent on room air, weight 198 lb. Alert and oriented, in no distress. A 3.5 cm linear laceration of the left forehead is well approximated, sutures intact, no erythema or fluctuance. No Battle sign and no hemotympanum. Neck supple with tenderness over the left trapezius and rotation limited to about 60 degrees each side. Heart regular, lungs clear, abdomen soft. Cranial nerves II through XII intact. Strength 5 out of 5 throughout. Gait steady.
  38| 
  39| Assessment and plan
  40| 1. Mild concussion, improving, after the collision described above. No red-flag symptoms today. Activity as tolerated with screen time in short blocks. Return sooner for vomiting, worsening headache, confusion, or weakness. Follow-up in two weeks.
  41| 2. Forehead laceration, healing after repair with simple interrupted sutures. Sutures were removed today. Wound care: gentle washing, petrolatum, and no soaking for two more days. Call for spreading redness, drainage, or fever.
  42| 3. Cervical strain. Continue ibuprofen with food, use heat, and begin gentle range of motion. Physical therapy if neck motion is not better in two weeks. I did recomend a short course only, not daily long-term use.
  43| 4. Hypertension, acceptable today. Continue lisinopril 20 mg daily and recheck next visit.
  44| 5. If the clinic cannot reach him at the shop, his wife can be reached at (541) 555-0164 or at samira.alhashimi@example.org. After-visit instructions were sent through the portal at https://records.example.org/visit/nordhoff-0312.
  45| 
  46| He was told to stop ibuprofen if dark stools or stomach pain occured. He repeated the return precautions and will not drive until cleared.
  47| 
  48| Electronically signed by Thalia Vlachos, MD
  49| Family Medicine
=== END DOCUMENT ===
ITEMS FOR fd-0273:
K1 | line 2 | KEEP "Outpatient Progress Note"
K2 | line 3 | KEEP "Department of Family Medicine"
K3 | line 12 | KEEP "suture check"
K4 | line 15 | KEEP "simple interrupted sutures"
K5 | line 15 | KEEP "3 out of 10"
K6 | line 17 | KEEP "each morning"
K7 | line 34 | KEEP "syncope"
K8 | line 37 | KEEP "linear laceration of the left forehead"
K9 | line 37 | KEEP "Strength 5 out of 5"
K10 | line 41 | KEEP "simple interrupted sutures"
K11 | line 41 | KEEP "Wound care"
K12 | line 42 | KEEP "daily"
K13 | line 49 | KEEP "Family Medicine"

=== DOCUMENT fd-0274 ===
   1| 44918273
   2| St. Idris Medical Center
   3| Outpatient History and Physical
   4| Department of Geriatric Medicine
   5| 
   6| Patient: Montecillo, Rosalía
   7| DOB: 17 February 1934
   8| Age: 92 y.o.
   9| Date of service: 2026-03-11
  10| Residence: 418 WILLOW TRACE DRIVE, GREYHOLLOW, OR 97302
  11| Mailing address: PO Box 188, Greyhollow, OR 97302
  12| Member number: WX4402918
  13| Author: Dr. Helen Wolf
  14| 
  15| The faxed face sheet from the prior cardiology file is faint. Registration read the old chart as 22O91l4 and will confirm it before any records are released.
  16| 
  17| Chief complaint
  18| Low-speed motor vehicle collision one week ago, chest wall pain, and a review of anticoagulation.
  19| 
  20| History of present illness
  21| Rosalía Bautista Montecillo returns for follow-up after a parking-aisle collision. On March 4th she was the restrained front passenger in her son-in-law's sedan, plate 6TKM-219, when a slowly reversing van struck the passenger door. The speed was a walking pace. The airbag did not deploy. She did not strike her head, did not lose consciousness, and stepped out of the car with help. Paramedics were not called. Since that afternoon she has had a band of aching pain along the right chest wall, worse with a deep breath, a cough, or turning in bed. She has no dyspnea at rest, no hemoptysis, and no palpitations. A purple bruise appeared over the right breast and lateral ribs on the second day and is now yellow at the edges. She reports no dizziness, no melena, no hematuria, no epistaxis, and no new headache. Appetite is fair. She is anxious about another fall and has stayed inside unless someone is with her.
  22| 
  23| She has heart failure with preserved ejection fraction, followed at the Heart and Vascular Center of Greyhollow, and she takes apixaban for atrial fibrillation. She missed no doses. Heart failure symptoms were stable from March 1 through March 5, with no change since: no new orthopnea beyond her usual single pillow, no nocturnal cough, and no rapid weight gain. Home health for this plan is assigned by ZIP 97306, and a nurse has been recording weights twice a week. Those weights have stayed within 0.5 kg of baseline.
  24| 
  25| Past medical history
  26| Heart failure with preserved ejection fraction, last echocardiogram with an ejection fraction of 60 percent and grade 2 diastolic dysfunction. Persistent atrial fibrillation, rate controlled. Stage 3 chronic kidney disease. Hypothyroidism on a stable replacement dose. Osteoporosis, with a remote right distal radius fracture managed without surgery. Bilateral cataract extraction in the remote past. No diabetes. No prior gastrointestinal bleed. No stroke and no transient ischemic attack. No diagnosed dementia. She does get help filling a weekly pillbox.
  27| 
  28| Medications, reviewed today and unchanged
  29| 1. Apixaban 2.5 mg by mouth twice daily, reduced for age and body weight.
  30| 2. Metoprolol succinate 50 mg by mouth daily.
  31| 3. Furosemide 20 mg by mouth each morning. She was told this may also be called Lasix at the pharmacy window.
  32| 4. Lisinopril 5 mg by mouth daily.
  33| 5. Levothyroxine 88 mcg by mouth each morning, thirty minutes before breakfast.
  34| 6. Cholecalciferol 2000 units by mouth daily.
  35| 7. Acetaminophen 650 mg by mouth every eight hours as needed for pain, not to exceed 3 grams in a day.
  36| 
  37| She was instructed again not to take ibuprofen, naproxen, or aspirin while on apixaban.
  38| 
  39| Allergies
  40| Rash after sulfamethoxazole-trimethoprim as a younger adult. No latex allergy. No contrast reaction.
  41| 
  42| Social history
  43| She lives with her daughter and does not drive. She never smoked. She does not drink alcohol. She walks in the house without a device and uses a cane outside. A neighbor helps with groceries. She is a retired seamstress and still mends clothes at the kitchen table.
  44| 
  45| Family and staff present
  46| Mrs. Claire Keene, daughter
  47| Mr. Paul Keene, son-in-law
  48| Nora Pembroke, RN
  49| 
  50| Her daughter can be reached at (503) 555-0133 during the workday. Her son-in-law's mobile is 503.555.0177 if the house line is busy. She asked that afternoon messages go to claire.keene at example dot com, because the telephone is hard to hear after supper.
  51| 
  52| Review of systems
  53| No fever or chills. No syncope. No vision change beyond her known cataracts history. No neck pain, no arm numbness, no abdominal pain, no change in stool color, and no dysuria. Chronic knee ache is unchanged. Mood is worried but she is sleeping and she is not without hope. The remainder of a fourteen-system review is negative.
  54| 
  55| Physical examination
  56| Blood pressure 148/76 mmHg, heart rate 88 beats per minute and irregularly irregular, respiratory rate 18 breaths per minute, temperature 97.8 F, oxygen saturation 96 percent on room air, weight 51.2 kg. That weight is 0.4 kg above the reading from last week. She is alert and oriented to person, place, and month, seated without distress, and able to give the history with her daughter adding only the dates. Speech is clear. There is a fading ecchymosis over the right lateral chest and the lateral right breast, tender to firm palpation, without crepitus, flail segment, open skin, or hematoma that is expanding. No seatbelt sign across the abdomen. Heart sounds are irregularly irregular, no new murmur, no rub. Lungs are clear without rales or wheeze. The abdomen is soft and nontender, with normal bowel sounds. No leg edema. Cranial nerves II through XII are intact. Strength is 5 out of 5 in the arms and 4+ out of 5 at the hips, which is her baseline. Sensation is symmetric. Gait with the cane is slow and steady, and Romberg is negative.
  57| 
  58| Studies on the date of service
  59| Hemoglobin 11.8 g/dL, prior 12.0 g/dL two months ago. Platelets 188,000/microliter. White cells 7.4 x 10 to the 9 per liter. Sodium 136 mmol/L. Potassium 4.2 mmol/L. Chloride 102 mmol/L. Bicarbonate 24 mmol/L. BUN 22 mg/dL. Creatinine 1.32 mg/dL, baseline about 1.2 to 1.4 mg/dL. eGFR 41 mL/min/1.73 m2. Glucose 96 mg/dL. TSH 2.1 mIU/L. Troponin I 0.01 ng/mL, below the 99th percentile cutoff for this assay. A chest radiograph shows no rib fracture, no pneumothorax, no infiltrate, and no pulmonary edema. The electrocardiogram shows atrial fibrillation with a ventricular rate of 88 and no acute ST-segment shift.
  60| 
  61| The outside comparison film is on the portal at https://results.example.com/rad/montecillo-4491.
  62| 
  63| Assessment and plan
  64| 1. Chest wall contusion after a low-speed passenger-side collision, on therapeutic anticoagulation. Pain is improving and there is no evidence of bleeding, pneumothorax, or cardiac injury. Continue acetaminophen. Ice for ten minutes at a time if it eases the ache. No rib belt. Return for worse pain, shortness of breath, fainting, black stools, vomiting blood, or a rapidly expanding bruise. Repeat the hemoglobin only if a bleeding symptom appears.
  65| 2. Atrial fibrillation, rate controlled, on apixaban 2.5 mg twice daily. Continue without interruption. The reduced dose remains appropriate given age over 80 and weight under 60 kg. Counseled on bleeding precautions and on not adding an anti-inflammatory drug.
  66| 3. Heart failure with preserved ejection fraction, clinically stable. Continue furosemide 20 mg daily, metoprolol succinate 50 mg daily, and lisinopril 5 mg daily. She will call if her weight rises more than 2 kg over three days or if she needs extra pillows.
  67| 4. Stage 3 chronic kidney disease, stable creatinine. Recheck a chemistry panel with the next routine visit. Avoid dehydration while the bruise heals and she is less active.
  68| 5. Hypothyroidism, euthyroid on the current levothyroxine dose. No change.
  69| 6. Osteoporosis and fall risk. The cane is appropriate. Vitamin D will stay at the current dose. I did not start a new agent today. Physical therapy for balance was offered and accepted, and the referral was entered.
  70| 7. Advance care planning was not reopened today. Her daughter already holds the healthcare proxy paperwork in the chart.
  71| 
  72| She and her daughter repeated the bleeding precautions and the reasons to return. Questions were answered. Follow-up is planned in three weeks, sooner if needed.
  73| 
  74| Electronically signed by Dr. Helen Wolf
  75| Geriatric Medicine
=== END DOCUMENT ===
ITEMS FOR fd-0274:
D1 | line 65 | A: AGE "80" | B: (nothing)
K1 | line 18 | KEEP "chest wall pain"
K2 | line 23 | KEEP "twice a week"
K3 | line 26 | KEEP "ejection fraction of 60 percent"
K4 | line 35 | KEEP "as needed"
K5 | line 40 | KEEP "Rash"
K6 | line 42 | KEEP "Social history"
K7 | line 56 | KEEP "seatbelt sign"
K8 | line 56 | KEEP "5 out of 5"
K9 | line 56 | KEEP "4+ out of 5"
K10 | line 59 | KEEP "12.0 g/dL"
K11 | line 59 | KEEP "1.2 to 1.4 mg/dL"
K12 | line 59 | KEEP "99th percentile"
K13 | line 59 | KEEP "rib fracture"
K14 | line 59 | KEEP "pneumothorax"
K15 | line 59 | KEEP "infiltrate"
K16 | line 59 | KEEP "pulmonary edema"
K17 | line 59 | KEEP "ST-segment shift"
K18 | line 64 | KEEP "cardiac injury"
K19 | line 67 | KEEP "chemistry panel"
K20 | line 69 | KEEP "fall risk"
K21 | line 70 | KEEP "Advance care planning"

=== DOCUMENT fd-0277 ===
   1| 99482015
   2| GRAFTON MEMORIAL HOSPITAL
   3| DEPARTMENT OF INPATIENT MEDICINE
   4| DISCHARGE SUMMARY
   5| 
   6| PATIENT NAME: CHAKRABORTY, SUBHASHISH
   7| DATE OF BIRTH: 03/12/1934
   8| AGE: 92 y.o.
   9| GENDER: Male
  10| ADMISSION DATE: 10/14/2026
  11| DISCHARGE DATE: 2026-10-18
  12| ATTENDING PHYSICIAN: ALISTAIR MACINTYRE, MD
  13| PRIMARY CARE TEAM: Dr. Alistair MacIntyre, Dr. Rebecca Vogel, Bradley Miller, NP, Dr. Fiona O'Connor-Silva
  14| PATIENT RESIDENCE: 742 EAST HIGHLAND AVENUE, APT 4B, TAMPA, FL 33602
  15| CORRESPONDENCE ADDRESS: PO Box 4819, Tampa, FL 33682
  16| PRIMARY CONTACT: Mr. Derek Sterling (Son-in-law), Home Phone: (813) 555-0143
  17| COORDINATION PHONE: 813.555.0187
  18| PHYSICIAN LIAISON: amacintyre at example dot org
  19| HEALTH PLAN: Senior Medicare Advantage health plan
  20| PLAN MEMBER ID: HPM-49201844-01
  21| GROUP NUMBER: G-88301A
  22| PRIOR AUTHORIZATION TRACKING: PA-8O19l43-O2
  23| 
  24| DISCHARGE DIAGNOSES:
  25| 1. Acute-on-chronic decompensated heart failure with mildly reduced ejection fraction (EF 40%), resolved to euvolemic baseline.
  26| 2. Chronic ischemic cardiomyopathy.
  27| 3. Permanent atrial fibrillation, rate-controlled on discharge.
  28| 4. Stage 3a chronic kidney disease, stable baseline.
  29| 5. History of Bell palsy, remote, resolved.
  30| 
  31| CHIEF COMPLAINT:
  32| Shortness of breath, orthopnea, and worsening bilateral lower extremity swelling.
  33| 
  34| HISTORY OF PRESENT ILLNESS:
  35| Mr. Subhashish Chakraborty is a 92 y.o. gentleman with ischemic cardiomyopathy, atrial fibrillation, chronic kidney disease, and hypertension, who presented on October 14th after five days of progressive dyspnea. He noted severe orthopnea requiring four pillows, paroxysmal nocturnal dyspnea, and marked bilateral pedal edema with an eight-pound weight gain. On the morning of 10/14/2026, his son-in-law, Mr. Derek Sterling, noted that Mr. Chakraborty was tachypneic at rest. Emergency services transported him directly to Grafton Memorial Hospital, where oxygen saturation was 88% on room air, improving to 95% on 3 L/min nasal cannula.
  36| 
  37| HOSPITAL COURSE:
  38| 1. Acute Decompensated Heart Failure:
  39| Upon arrival on October 14th, Mr. Chakraborty exhibited jugular venous distention of 12 cm H2O and bibasilar crackles. Transthoracic echocardiogram showed left ventricular ejection fraction of 40% and moderate mitral regurgitation. NT-proBNP was elevated at 4,820 pg/mL. Intravenous furosemide 40 mg twice daily produced a brisk diuresis with 4.2 L total negative balance over 48 hours. Peripheral edema improved to trace pretibial edema. He was transitioned to oral bumetanide 1 mg daily. Asymmetric calf fullness prompted calculation of a Wells score of 0 points, and duplex ultrasonography excluded deep vein thrombosis. At discharge on 2026-10-18, the patient was clinically euvolemic, ambulating comfortably on ambient air.
  40| 
  41| 2. Atrial Fibrillation:
  42| Initial electrocardiogram showed atrial fibrillation with rapid ventricular response at 124 bpm. Dr. Rebecca Vogel from cardiology recommended titrating metoprolol succinate to 50 mg daily, stabilizing the ventricular rate between 68 and 82 bpm. Eliquis (apixaban) was maintained at the dose-adjusted regimen of 2.5 mg PO BID.
  43| 
  44| 3. Neurologic Assessment:
  45| Dr. Fiona O'Connor-Silva performed neurological evaluation for transient lightheadedness on day 2. Glasgow Coma Scale was 15/15. Cranial nerve examination demonstrated symmetric facial grimace, with no recurrence of prior Bell palsy. Lightheadedness was determined to be transient benign positional dizziness from fluid shifts.
  46| 
  47| 4. Disposition and Coordination:
  48| Bradley Miller, NP, coordinated discharge planning. Although Mr. Chakraborty typically resides at his apartment on Highland Avenue in Tampa, his son-in-law Derek Sterling arranged for him to stay at his single-story home in Clearwater during rehabilitation. Home health nursing was arranged through Grafton Memorial Hospital home services.
  49| 
  50| DISCHARGE PHYSICAL EXAMINATION:
  51| Vital Signs: Temperature 98.4 F (36.9 C), blood pressure 126/72 mmHg, heart rate 72 beats/min regular, respiratory rate 16 breaths/min, oxygen saturation 98% on room air. Weight 74.2 kg (down 3.8 kg from admission weight of 78.0 kg).
  52| General: Frail elderly male, resting comfortably.
  53| Neck: JVP 6 cm H2O.
  54| Cardiovascular: Irregular rhythm, rate-controlled, grade II/VI systolic apical murmur. Peripheral pulses 2+ bilaterally.
  55| Lungs: Clear to auscultation bilaterally without wheezing or crackles.
  56| Extremities: Trace pedal edema bilaterally.
  57| Neurologic: Alert and oriented x4, Glasgow Coma Scale 15, symmetric facial grimace, motor strength 5/5 upper and 4+/5 lower extremities.
  58| 
  59| DISCHARGE LABS:
  60| Sodium: 138 mEq/L, Potassium: 4.2 mEq/L, Chloride: 101 mEq/L, Bicarbonate: 25 mEq/L, BUN: 21 mg/dL, Serum Creatinine: 1.20 mg/dL (baseline 1.18 mg/dL), Estimated GFR: 52 mL/min/1.73 m2, Glucose: 112 mg/dL, Hemoglobin: 11.4 g/dL, Platelets: 218 x 10^3/uL, NT-proBNP: 1,410 pg/mL.
  61| 
  62| DISCHARGE MEDICATIONS:
  63| 1. Bumetanide 1 mg PO every morning.
  64| 2. Metoprolol succinate 50 mg PO daily.
  65| 3. Eliquis 2.5 mg PO BID.
  66| 4. Atorvastatin 20 mg PO nightly.
  67| 5. Potassium chloride 20 mEq PO daily.
  68| 6. Acetaminophen 500 mg PO q8h PRN joint pain.
  69| 
  70| DISCHARGE INSTRUCTIONS AND FOLLOW-UP:
  71| 1. Daily morning weights: Derek Sterling will assist with logging. Call clinic if weight increases by 2 pounds overnight or 4 pounds in one week.
  72| 2. Diet: 2,000 mg sodium daily restriction and 2.0 L fluid limit.
  73| 3. Follow-up appointments: Outpatient visit with Dr. Rebecca Vogel on October 28, 2026, and primary care follow-up with Dr. Heather Campbell on November 2, 2026.
  74| 4. Discharge summary, care plans, and rehabilitation schedules are accessible at https://portal.example.org/discharge-summary/7041.
  75| 
  76| Attending Signoff:
  77| Electronically signed by:
  78| ALISTAIR MACINTYRE, MD
  79| Grafton Memorial Hospital Inpatient Medicine
  80| Date: 2026-10-18
=== END DOCUMENT ===
ITEMS FOR fd-0277:
D1 | line 25 | A: KEEP "Acute-on-chronic decompensated heart failure with mildly reduced ejection fraction" | B: KEEP "Acute-on-chronic decompensated heart failure"
D2 | line 39 | A: KEEP "moderate mitral regurgitation" | B: KEEP "mitral regurgitation"
D3 | line 39 | A: KEEP "Wells score of 0 points" | B: KEEP "Wells score"
D4 | line 45 | A: KEEP "Glasgow Coma Scale was 15/15" | B: KEEP "Glasgow Coma Scale"
D5 | line 48 | A: ADDRESS "Highland Avenue in Tampa" | B: ADDRESS "Highland Avenue" ; ADDRESS "Tampa"
D6 | line 51 | A: KEEP "Temperature 98.4 F" ; KEEP "36.9 C" | B: KEEP "Temperature 98.4 F (36.9 C)"
D7 | line 51 | A: KEEP "oxygen saturation 98%" | B: KEEP "oxygen saturation 98% on room air"
D8 | line 60 | A: KEEP "Serum Creatinine: 1.20 mg/dL (baseline 1.18 mg/dL)" | B: KEEP "Serum Creatinine: 1.20 mg/dL"
K1 | line 35 | KEEP "oxygen saturation was 88%"
K2 | line 35 | KEEP "95% on 3 L/min"
K3 | line 39 | KEEP "jugular venous distention of 12 cm H2O"
K4 | line 39 | KEEP "NT-proBNP was elevated at 4,820 pg/mL"
K5 | line 42 | KEEP "rapid ventricular response at 124 bpm"
K6 | line 42 | KEEP "ventricular rate between 68 and 82 bpm"
K7 | line 45 | KEEP "neurological evaluation"
K8 | line 45 | KEEP "Cranial nerve examination"
K9 | line 51 | KEEP "3.8 kg"
K10 | line 51 | KEEP "admission weight of 78.0 kg"
K11 | line 52 | KEEP "General"
K12 | line 53 | KEEP "Neck"
K13 | line 53 | KEEP "JVP 6 cm H2O"
K14 | line 54 | KEEP "Cardiovascular"
K15 | line 54 | KEEP "grade II/VI systolic apical murmur"
K16 | line 54 | KEEP "Peripheral pulses 2+"
K17 | line 55 | KEEP "Lungs"
K18 | line 56 | KEEP "Extremities"
K19 | line 57 | KEEP "Neurologic"
K20 | line 57 | KEEP "Alert and oriented x4"
K21 | line 57 | KEEP "motor strength 5/5 upper and 4+/5 lower extremities"
K22 | line 71 | KEEP "2 pounds"
K23 | line 71 | KEEP "4 pounds"
K24 | line 72 | KEEP "2,000 mg"
K25 | line 72 | KEEP "daily"
K26 | line 72 | KEEP "2.0 L"

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
ITEMS FOR fd-0278:
D1 | line 7 | A: KEEP "acute gout of the right first metatarsophalangeal joint" | B: KEEP "acute gout"
D2 | line 9 | A: KEEP "Moderate COPD" | B: KEEP "COPD"
D3 | line 9 | A: KEEP "small tubular adenoma" | B: KEEP "tubular adenoma"
D4 | line 9 | A: KEEP "Right cataract extraction" | B: KEEP "cataract extraction"
D5 | line 13 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D6 | line 13 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D7 | line 21 | A: KEEP "Blood pressure 142/78 mmHg seated and 118/68 mmHg" | B: KEEP "Blood pressure 142/78 mmHg" ; KEEP "118/68 mmHg"
D8 | line 21 | A: KEEP "Oxygen saturation 95 percent on room air" | B: KEEP "Oxygen saturation 95 percent"
D9 | line 31 | A: KEEP "Gout flare" | B: KEEP "Gout"
D10 | line 31 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D11 | line 35 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
K1 | line 7 | KEEP "Fasting glucose often ran 180 to 220 mg/dL"
K2 | line 7 | KEEP "steroid"
K3 | line 7 | KEEP "weight rose about 1.5 kg"
K4 | line 7 | KEEP "twice a week"
K5 | line 7 | KEEP "insulin"
K6 | line 7 | KEEP "diuretic"
K7 | line 11 | KEEP "rash" [labeler unsure]
K8 | line 11 | KEEP "sulfa antibiotics"
K9 | line 11 | KEEP "Iodine contrast"
K10 | line 11 | KEEP "food allergy"
K11 | line 13 | KEEP "one hour before meals"
K12 | line 13 | KEEP "with meals"
K13 | line 13 | KEEP "each morning"
K14 | line 13 | KEEP "100 mg"
K15 | line 13 | KEEP "diuretic"
K16 | line 19 | KEEP "foot ulcer"
K17 | line 19 | KEEP "Constipation" [labeler unsure]
K18 | line 23 | KEEP "grade II diastolic dysfunction"
K19 | line 23 | KEEP "mild left atrial enlargement"
K20 | line 23 | KEEP "valve lesion"
K21 | line 23 | KEEP "1 point" [labeler unsure]
K22 | line 25 | KEEP "weight rises more than 1 kg"
K23 | line 25 | KEEP "nonsteroidal anti-inflammatory drugs"
K24 | line 25 | KEEP "2 g sodium" [labeler unsure]
K25 | line 27 | KEEP "fasting glucose is under 100 mg/dL"
K26 | line 27 | KEEP "Foot examination" [labeler unsure]
K27 | line 29 | KEEP "before meals"
K28 | line 29 | KEEP "orthostatic drop" [labeler unsure]
K29 | line 29 | KEEP "Physical therapy"
K30 | line 29 | KEEP "antipsychotics"
K31 | line 35 | KEEP "antibiotic"
K32 | line 41 | KEEP "fasting glucose over 250 mg/dL"
K33 | line 41 | KEEP "steroid"

=== DOCUMENT fd-0281 ===
   1| REFERRAL CONSULTATION SUMMARY AND BENEFIT NOTICE
   2| Date of Service: 09/24/2026
   3| Patient: Mr. Arthur Bishop
   4| SSN: 984-21-6503
   5| Mailing Address: PO Box 842, Greenfield, MA 01301
   6| 
   7| Dear Mr. Bishop,
   8| 
   9| This letter summarizes the administrative and clinical findings from
  10| your specialty consultation conducted on 09/24/2026. You were referred
  11| to our regional clinic by Dr. Katherine
  12| Olmstead for comprehensive diagnostic assessment following persistent
  13| fatigue, migratory arthralgias, and cognitive clouding.
  14| 
  15| During the intake interview, your sister, Mrs. Evelyn Lyme, provided
  16| corroborating collateral history regarding symptom onset following an
  17| outdoor excursion earlier this summer. Laboratory evalutaion was
  18| recieved and reveiwed in detail. Initial screening revealed elevated
  19| erythrocyte sedimentation rate at 38 mm/hr and C-reactive protein at
  20| 14.2 mg/L. Serologic testing via enzyme-linked immunosorbent assay
  21| followed by confirmatory Western blot antibody testing confirmed early
  22| disseminated Lyme disease. Cerebrospinal fluid analysis demonstrated no
  23| intrathecal antibody synthesis, ruling out active neuroborreliosis.
  24| 
  25| Your treatment plan has been finalized. Oral doxycycline 100 mg PO BID
  26| was prescribed for twenty-one consecutive days. You are advised to take
  27| this medication with a full glass of water and avoid concurrent calcium
  28| or iron supplements. In accordance with your benefit structure, prior
  29| authorization for follow-up inflammatory panel testing has been
  30| submitted to your health plan.
  31| 
  32| Should you experience persistent cephalalgia, visual blurring, or joint
  33| effusions, an immediate reassessment will be arranged. If you need to
  34| update your billing records or mailing preferences, please notify our
  35| intake desk in writing at the postal address indicated above.
  36| 
  37| Sincerely,
  38| 
  39| Dr. William Vance, MD
  40| Staff Neurologist, Valley Neurosciences Institute
=== END DOCUMENT ===
ITEMS FOR fd-0281:
D1 | line 21 | A: KEEP "early\ndisseminated Lyme disease" | B: KEEP "Lyme disease"
K1 | line 20 | KEEP "enzyme-linked immunosorbent assay"
K2 | line 21 | KEEP "Western blot antibody testing"
K3 | line 22 | KEEP "Cerebrospinal fluid analysis"
K4 | line 27 | KEEP "calcium"
K5 | line 28 | KEEP "iron"

=== DOCUMENT fd-0282 ===
   1| HOSPITAL DISCHARGE SUMMARY
   2| 
   3| Service: Internal Medicine
   4| Admission Status: Inpatient
   5| Patient Demographics: 67-year-old female
   6| 
   7| Principal Diagnosis:
   8| Acute exacerbation of chronic peripheral neuropathic pain and lumbar radiculopathy.
   9| 
  10| Secondary Diagnoses:
  11| 1. Type 2 diabetes mellitus, diagnosed in 2018.
  12| 2. Essential hypertension, diagnosed in 2015.
  13| 3. Lumbar spinal stenosis with L4-L5 degenerative spondylolisthesis.
  14| 4. History of idiopathic peripheral facial nerve palsy (Bell palsy), resolved.
  15| 
  16| History of Present Illness:
  17| The patient is a 67-year-old female admitted for severe, refractory burning pain and paresthesias in the lower extremities radiating along the L5 dermatome bilaterally. The symptoms began insidiously several years ago but worsened markedly over the past month. She experienced intermittant sharp pains that disrupted sleep and walking. Lumbar magnetic resonance imaging performed at an Outside Hospital demonstrated moderate central canal stenosis and bilateral neural foraminal narrowing at the L4-L5 level. On arrival, she was in distress due to neuropathic shooting pains rated 9/10 on the numeric rating scale.
  18| 
  19| Hospital Course:
  20| During the hospital stay, the care team coordinated acute pain stabilization and medication optimization. Physical therapy and occupational therapy evaluated the patient for safe ambulation and transfers. She was noted to be ambualting with a rolling walker under supervision. Given the neuropathic character of her discomfort, she was initiated on pregabalin (Lyrica) 75 mg PO BID, which was titrated upwards with significant symptomatic relief. In addition, an anti-inflammatory oral corticosteroid taper was administered for acute radicular nerve root irritation. Baseline neurological examination demonstrated normal mental status, intact cranial nerves without residual deficits from her remote Bell palsy, 5/5 motor strength in the bilateral upper extremities, and 4/5 strength in bilateral ankle dorsiflexion.
  21| 
  22| Laboratory and Diagnostic Studies:
  23| Complete metabolic panel and hematology results were reviewed:
  24| - Serum sodium: 138 mEq/L
  25| - Serum potassium: 4.2 mEq/L
  26| - Serum creatanine: 0.88 mg/dL
  27| - Blood urea nitrogen: 16 mg/dL
  28| - Fasting blood glucose: 134 mg/dL
  29| - Hemoglobin A1c: 7.2%
  30| - Hemoglobin: 13.1 g/dL
  31| - White blood cell count: 6.4 K/uL
  32| - Platelet count: 245 K/uL
  33| Vitals prior to discharge: Blood pressure 126/74 mmHg, resting pulse 70 bpm, respiratory rate 16 breaths per minute, body temperature 98.4 F, oxygen saturation 98% on room air.
  34| 
  35| Discharge Medications:
  36| 1. Lyrica (pregabalin) 75 mg PO BID for neuropathic pain.
  37| 2. Prednisone oral taper: prednisone 40/30/20/10 mg PO daily for four days each step, then discontinue.
  38| 3. Metformin 500 mg PO BID with meals.
  39| 4. Lisinopril 20 mg PO daily.
  40| 5. Acetaminophen 650 mg PO q8h PRN for breakthrough pain.
  41| 
  42| Discharge Plan and Follow-up:
  43| The patient was discharged in improved condition with her daughter present for counseling. The daughter confirmed that she will assist the patient with daily living activities and medication oversight. Referrals have been submitted for comprehensive follow-up care:
  44| - Referral to Pain Clinic for evaluation of lumbar epidural steroid injection.
  45| - Referral to Diabetes Center for outpatient glycemic education and dietary review.
  46| - Physical therapy home exercise program to continue every 2/3 weeks as scheduled.
=== END DOCUMENT ===
ITEMS FOR fd-0282:
D1 | line 8 | A: KEEP "Acute exacerbation of chronic peripheral neuropathic pain" | B: KEEP "peripheral neuropathic pain"
D2 | line 13 | A: KEEP "Lumbar spinal stenosis with L4-L5 degenerative spondylolisthesis" | B: KEEP "Lumbar spinal stenosis" ; KEEP "degenerative spondylolisthesis"
D3 | line 17 | A: KEEP "moderate central canal stenosis" | B: KEEP "central canal stenosis"
D4 | line 17 | A: KEEP "bilateral neural foraminal narrowing" | B: KEEP "neural foraminal narrowing"
D5 | line 33 | A: KEEP "oxygen saturation 98%" | B: KEEP "oxygen saturation 98% on room air"
K1 | line 5 | KEEP "Patient Demographics"
K2 | line 17 | KEEP "9/10 on the numeric rating scale"
K3 | line 20 | KEEP "Physical therapy"
K4 | line 20 | KEEP "occupational therapy"
K5 | line 20 | KEEP "oral"
K6 | line 20 | KEEP "acute radicular nerve root irritation"
K7 | line 20 | KEEP "neurological examination"
K8 | line 20 | KEEP "5/5 motor strength"
K9 | line 20 | KEEP "4/5 strength"
K10 | line 23 | KEEP "Complete metabolic panel"
K11 | line 37 | KEEP "oral"
K12 | line 38 | KEEP "with meals"
K13 | line 40 | KEEP "breakthrough pain"
K14 | line 46 | KEEP "Physical therapy"
K15 | line 46 | KEEP "home exercise program"

=== DOCUMENT fd-0289 ===
   1| PHARMACY PRIOR AUTHORIZATION & RECONCILIATION DISPENSARY RECORD
   2| TRANSCRIBED FROM CLINICAL FAX - ONCOLOGY SUPPORT SERVICES
   3| 
   4| PATIENT DEMOGRAPHICS & DISPENSARY DATA:
   5| PATIENT: Nasser
   6| al-Yousef
   7| DOB: 02-17-1935
   8| AGE / SEX: 91M
   9| CLAIM / ACCOUNT: Claim # CL-8840217
  10| PRESCRIPTION NUMBER: Rx # 6492018
  11| RESIDENTIAL ADDRESS: 842 Ala Moana Boulevard, Apt 14C, Honolulu, HI 96813
  12| CAREGIVER: Dimitra Vasilakis (patient's adult daughter and legal guardian)
  13| PHARMACY INTAKE PHONE: (808) 555-0134 ext. 502
  14| ORDERING ONCOLOGIST: Dr. Arthur Reed, MD
  15| CLINICAL PHARMACIST: Mele Tuipulotu, PharmD, BCOP
  16| INTAKE TECHNICIAN: Talia Cook, CPhT
  17| DATE OF ENTRY: 11-04-2026
  18| 
  19| REFERRAL & CLINICAL INDICATION:
  20| Prior authorization appeal transmited from outpatient oncology following
  21| routine treatment review. The patient is a 91M with classical Hodgkin
  22| lymphoma diagnosed four months ago following lymph node biopsy
  23| demonstrating classic Reed-Sternberg cells with positive CD30 expression.
  24| In view of patient's advanced age and mild underlying cardiotoxicity,
  25| standard cytotoxic bleomycin was omitted from frontline therapy.
  26| The initial presentation included night sweats, generalized pruritus, and
  27| enlarging cervical adenopathy. Restaging PET-CT confirmed partial metabolic
  28| response after two treatment cycles. Dr. Reed's clinical plan recommended
  29| brentuximab vedotin maintenance alongside supportive antiemetic therapy.
  30| 
  31| PHARMACY RECONCILIATION & CAREGIVER OUTREACH:
  32| Phone consultation conducted by Talia Cook with Dimitra Vasilakis to verify
  33| current home medication tolerances. Ms. Vasilakis stated that
  34| Mr. al-Yousef's appetite has improved and reported excellent tolerabilty
  35| following cycle 2. No evidence of peripheral sensory neuropathy,
  36| constipation, or mucosal ulcerations was noted during the preceding two
  37| weeks.
  38| 
  39| ACTIVE RECONCILED REGIMEN:
  40| 1. Brentuximab vedotin (Adcetris) 1.2 mg/kg IV infusion every 3 weeks. Prior
  41| authorization required under Rx # 6492018; appeal submitted.
  42| 2. Ondansetron 8 mg PO q8h PRN nausea, 30 minutes prior to chemotherapy.
  43| 3. Dexamethasone 4 mg PO daily on days 1 through 3 of each cycle.
  44| 4. Sulfamethoxazole/trimethoprim 800/160 mg PO three times weekly for
  45| Pneumocystis jirovecii prophylaxis.
  46| 5. Acyclovir 400 mg PO BID for antiviral prophylaxis during therapy.
  47| 6. Senna 17.2 mg PO daily at bedtime PRN constipation.
  48| 
  49| ASSESSMENT & PRIOR AUTHORIZATION JUSTIFICATION:
  50| Coverage denial was originally issued by the payer citing age parameters and
  51| requesting step therapy with conventional ABVD. Dr. Reed submitted an appeal
  52| letter emphasizing that omission of pulmonary toxic agents is standard of
  53| care for elderly individuals. Recent biopsy documentation verifying CD30+
  54| Reed-Sternberg cells and baseline cardiac ejection fraction (LVEF 55%)
  55| support targeted biologic use. Renal parameters remain acceptable with
  56| serum creatinine 1.15 mg/dL and eGFR 58 mL/min/1.73 m2. Complete blood counts
  57| from 11-04-2026 show absolute neutrophil count 2,400/uL, platelets
  58| 175,000/uL, and hemoglobin 10.4 g/dL. Liver enzymes remain normal with
  59| AST 21 U/L and ALT 24 U/L.
  60| 
  61| DISPENSARY ACTIONS & RESOLUTION:
  62| 1. Complete clinical package under Claim # CL-8840217 resent to insurer by
  63| Mele Tuipulotu, PharmD.
  64| 2. Talia Cook verified insurance receipt via portal triage queue.
  65| 3. Delivery of cycle 3 supportive medications scheduld to 842 Ala Moana
  66| Boulevard, Apt 14C following authorization confirmation.
  67| 4. Direct pharmacy escalation line provided to Dimitra Vasilakis.
  68| 
  69| Mele Tuipulotu, PharmD, BCOP
  70| Specialty Clinical Pharmacist
=== END DOCUMENT ===
ITEMS FOR fd-0289:
D1 | line 2 | A: KEEP "ONCOLOGY SUPPORT SERVICES" [unsure] | B: FACILITY "ONCOLOGY SUPPORT SERVICES" [unsure]
D2 | line 47 | A: KEEP "daily" ; KEEP "at bedtime" | B: KEEP "daily at bedtime"
K1 | line 1 | KEEP "PHARMACY PRIOR AUTHORIZATION & RECONCILIATION DISPENSARY RECORD"
K2 | line 20 | KEEP "outpatient oncology"
K3 | line 23 | KEEP "positive CD30 expression"
K4 | line 27 | KEEP "cervical adenopathy"
K5 | line 43 | KEEP "days 1 through 3 of each cycle"
K6 | line 53 | KEEP "CD30+"
K7 | line 56 | KEEP "Complete blood counts"

Now output the result blocks.