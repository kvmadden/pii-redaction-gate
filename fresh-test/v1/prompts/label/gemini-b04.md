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

=== DOCUMENT fd-0068 ===
   1| CONSULTATION REFERRAL SUMMARY
   2| Date of Referral: Sept. 22, 2026
   3| Reference Number: 9302 4810 57
   4| 
   5| REFERRED BY:
   6| Dr. Jean-Luc de la Tour, MD
   7| Department of Neurology, Bayside Medical Center
   8| 820 Brickell Bay Drive, Miami, FL 33131
   9| Phone: (305) 555-0163
  10| 
  11| PATIENT MAILING ADDRESS:
  12| 310 HARBOR VIEW ROAD, MIAMI, FL 33131
  13| 
  14| REFERRED TO:
  15| Outpatient Neurorehabilitation Service
  16| Physical & Occupational Therapy
  17| 
  18| PATIENT DETAILS:
  19| Patient: Edward Lockwood
  20| Age: 73
  21| Caregiver / Emergency Contact: Luciana Barbosa (partner)
  22| 
  23| Dear Colleagues,
  24| 
  25| I am referring Mr. Edward Lockwood, a 73-year-old male with a six-year history of idiopathic Parkinson disease, for an intensive multidisciplinary outpatient neurorehabilitation program focusing on gait stabilization, fall prevention, and upper extremity fine motor coordination.
  26| 
  27| Over the past four months, Mr. Lockwood's family has noted progressive postural instability and motor fluctuations. His partner, Luciana Barbosa, reports that he has experienced two non-injurious falls at home while turning in the kitchen. In addition, Mr. Lockwood's resting tremor has become more prominent in his right hand during the late afternoon, accompanied by mild cogwheel rigidity and micrographia. There are no signs of autonomic failure, orthostatic hypotension, or atypical parkinsonism. He continues to live at home with Ms. Barbosa, who provides daily assistance with meal preparation and medication organization.
  28| 
  29| During our clinic evaluation today at Bayside Medical Center, Mr. Lockwood was alert, oriented, and cooperative. Speech was slightly hypophonic but fully comprehensible. Cranial nerve examination was normal without gaze palsy or facial asymmetry. Motor examination revealed mild bilateral bradykinesia, more pronounced on the right than the left, and moderate right-sided resting tremor that attenuates with action. Muscle tone demonstrated mild cogwheel rigidity at the right wrist and elbow. Deep tendon reflexes were 2+ throughout with bilateral flexor plantar responses. Gait assessment demonstrated mildly reduced right arm swing, slightly shortened stride length, and three steps required to complete a 360-degree turn. Retropulsion testing (pull test) elicited two compensatory backward steps without loss of balance.
  30| 
  31| Current Pharmacotherapy:
  32| 1. Carbidopa-levodopa 25-100 mg oral tablet, 1 tablet PO three times daily (prescribed under Rx 5109284-K). We discussed increasing to 1.5 tablets TID, but deferred pending therapy evaluation.
  33| 2. Rasagiline 1 mg PO once daily in the morning.
  34| 3. Polyethylene glycol 3350 powder, 17 g PO once daily PRN for mild constipation.
  35| 
  36| Goals of Referral:
  37| We request comprehensive physical therapy utilizing the Lee Silverman Voice Treatment (LSVT) BIG protocol, occupational therapy for adaptive home equipment assessment, and speech-language evaluation for vocal intensity training. We will follow up with Mr. Lockwood and Ms. Barbosa in four months to review progress.
  38| 
  39| Warm regards,
  40| Dr. Jean-Luc de la Tour, MD
  41| Department of Neurology, Bayside Medical Center
=== END DOCUMENT ===

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

=== DOCUMENT fd-0027 ===
   1| GERIATRIC EVALUATION AND REHABILITATION CENTER
   2| TRANSITIONAL DISCHARGE AND SUBACUTE TRANSFER SUMMARY
   3| 
   4| PATIENT: DEMISSIE, KIDANE
   5| DOB: May 14 1935
   6| GENDER: Male
   7| ACCOUNT NUMBER: AC-5829104
   8| NATIONAL IDENTIFIER TRACKING: 4821 9932 07
   9| ADMISSION DATE: Sep 18 2026
  10| DISCHARGE DATE: Sep 24 2026
  11| ATTENDING PHYSICIAN: CRAIG CUNNINGHAM, MD
  12| CONSULTING GERIATRICIAN: E.V. Vance, MD
  13| CLINICAL NURSE SPECIALIST: Gordon Hayes, RN
  14| CAREGIVER: Min-ji Park-Choi (Daughter-in-law)
  15| PRIMARY RESIDENCE: 712 Cedar Avenue South, Minneapolis, MN 55454
  16| FACILITY FAX: Fax: (612) 555-0149
  17| PATIENT ELECTRONIC PORTAL: https://portal.example.org/records/view?id=99281
  18| 
  19| MULTIDISCIPLINARY CARE TEAM:
  20| Dr. Craig Cunningham (Attending Orthopedic Surgeon), Dr. E.V. Vance (Geriatric Medicine), Gordon Hayes, RN (Case Coordinator), Min-ji Park-Choi (Primary Family Caregiver).
  21| 
  22| REASON FOR TRANSFER:
  23| Transfer of care to subacute rehabilitation following surgical repair of a right subtrochanteric femur fracture.
  24| 
  25| DIAGNOSES:
  26| 1. Closed right subtrochanteric femur fracture secondary to mechanical ground-level fall, status post right cephalomedullary nail fixation.
  27| 2. History of left total hip arthroplasty (performed in 2019), stable.
  28| 3. Osteopenia and age-related senile gait instability.
  29| 4. Essential hypertension, well-controlled.
  30| 5. Mild chronic sensorineural hearing loss, bilateral.
  31| 
  32| CLINICAL RESUME AND HOSPITAL COURSE:
  33| Mr. Kidane Demissie is a 91-year-old male who was admitted on Sep 18 2026 following a mechanical fall in his kitchen. While the patient maintains an apartment on Cedar Avenue in Minneapolis, he lives in Bloomington with his daughter-in-law, Mrs. Min-ji Park-Choi, and her family during the winter and autumn months. He lost his footing while reaching into a cupboard and landed heavily on his right hip. He experienced immediate right groin and thigh pain and was unable to bear weight. Radiographs obtained in the emergency room confirmed a displaced, closed right subtrochanteric femur fracture.
  34| 
  35| On Sep 19 2026, Dr. Craig Cunningham performed successful orthopedic surgery: closed reduction and intramedullary fixation using a right trochanteric femoral nail with cephalomedullary lag screw insertion. The procedure was completed without intraoperative complication, with estimated blood loss of 150 mL. Postoperative radiographs demonstrated anatomical alignment and rigid internal fixation.
  36| 
  37| Postoperative recovery was monitored closely by the inpatient geriatric co-management team led by Dr. E.V. Vance. Mr. Demissie was initiated on postoperative multimodal analgesia including scheduled acetaminophen and short-term oral oxycodone PRN, deliberately avoiding nonsteroidal anti-inflammatory agents to protect renal function. Deep venous thrombosis prophylaxis was administered with subcutaneous enoxaparin 30 mg once daily, adjusted for geriatric renal clearance. Physical therapy mobilized the patient on postoperative day 1; he was permitted weight-bearing as tolerated on the right lower extremity with a front-wheeled walker.
  38| 
  39| Gordon Hayes, RN, completed functional discharge planning. At the time of transfer on Sep 24 2026, Mr. Demissie required minimal assistance for sit-to-stand transfers and ambulated 45 feet with a walker under contact guard assistance. Given his advanced age and the multi-step entryway at home, the multidisciplinary team recommended two weeks of intensive inpatient physical therapy at the transitional rehabilitation pavilion.
  40| 
  41| PHYSICAL EXAMINATION ON DISCHARGE:
  42| Vital Signs: Temperature 98.1 F, blood pressure 128/76 mmHg, heart rate 70 bpm, respiratory rate 16 breaths/min, oxygen saturation 97% on ambient air.
  43| General: Alert, cooperative 91-year-old gentleman in no acute distress.
  44| Cardiovascular: Regular rhythm, normal S1 and S2, no peripheral edema.
  45| Pulmonary: Lungs clear to auscultation bilaterally.
  46| Surgical Site: Right lateral hip and proximal thigh incision clean, dry, and intact with staples in place; no erythema, warmth, or purulent drainage. Compartments soft. Distal pulses 2+ dorsalis pedis and posterior tibial. Sensation intact throughout the right foot and toes.
  47| 
  48| DISCHARGE LAB VALUES:
  49| Hemoglobin: 10.4 g/dL (stable from postoperative nadir of 10.1 g/dL)
  50| Hematocrit: 31.8%
  51| White Blood Cell Count: 7.1 x 10^3/uL
  52| Platelets: 204 x 10^3/uL
  53| Sodium: 139 mEq/L
  54| Potassium: 4.2 mEq/L
  55| BUN: 17 mg/dL
  56| Creatinine: 0.92 mg/dL
  57| Glucose: 108 mg/dL
  58| 
  59| DISCHARGE MEDICATIONS:
  60| 1. Enoxaparin 30 mg subcutaneous injection once daily for 21 additional days for deep venous thrombosis prophylaxis.
  61| 2. Acetaminophen 650 mg oral tablet every 8 hours scheduled for pain.
  62| 3. Oxycodone 5 mg oral tablet every 6 hours as needed for severe breakthrough pain (maximum 15 mg in 24 hours).
  63| 4. Senna-docusate 8.6-50 mg oral tablet once daily at bedtime for bowel regimen.
  64| 5. Amlodipine 5 mg oral tablet once daily in the morning for hypertension.
  65| 6. Calcium carbonate 600 mg with vitamin D 800 IU oral tablet once daily.
  66| 
  67| REHABILITATION ORDERS AND FOLLOW-UP:
  68| 1. Activity: Weight-bearing as tolerated on the right lower extremity using a front-wheeled walker. Daily physical and occupational therapy sessions.
  69| 2. Incision care: Keep right thigh surgical incision clean and dry. Staple removal is scheduled for Oct 3 2026 by the orthopedic clinic.
  70| 3. Follow-up appointments: Orthopedic re-evaluation and repeat radiographs with Dr. Craig Cunningham on Oct 8 2026 at 1:15 PM. Geriatric clinic visit with Dr. E.V. Vance in four weeks.
  71| 
  72| Craig Cunningham, MD
  73| Geriatric Evaluation and Rehabilitation Center
  74| Date: Sep 24 2026
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.