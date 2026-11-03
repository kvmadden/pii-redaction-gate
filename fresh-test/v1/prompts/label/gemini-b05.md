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


=== DOCUMENT fd-0072 ===
   1| REEDSMILL COMMUNITY HOSPITAL
   2| 410 MERRITT AVENUE, REEDSMILL, OR 97044
   3| Inpatient History and Physical
   4| 
   5| PATIENT: BEATRICE L. CROWELL
   6| Age: 94
   7| MRN: 5582104
   8| Group number: 61509
   9| Admitted: March 4, 2026
  10| Author: Ellen Pryor, MD
  11| 
  12| Home address:
  13| 12 Sycamore Court
  14| Reedsmill, OR 97044
  15| 
  16| Chief complaint
  17| Fever, cough, and increased shortness of breath for two days.
  18| 
  19| History of present illness
  20| Beatrice L. Crowell is admitted from home with an acute respiratory illness. Two days ago she developed a dry cough that became productive of yellow sputum, with feverishness and a new need to pause while walking from the bed to the chair. Her daughter noted faster breathing overnight and a temperature taken at home of 101.4 F. There is no chest pain, no hemoptysis, no orthopnea different from baseline, and no leg swelling that is new. Appetite is down. She has not traveled and has had no known ill contacts. Aspiration is a concern because meals have been slower this winter, but there was no witnessed choking event. She takes fluids poorly when short of breath and had only sips of tea yesterday. Urine output, by her daughter's account, has been less today but still present. There is no rash, no stiff neck, and no complaint of pain with urination. The emergency unit gave the first dose of the antibiotic and a liter of normal saline before she came upstairs. She felt slightly less winded after the fluid but was not back to her usual self.
  21| 
  22| A venous ulcer on the left medial ankle was last debrided on 20 February 2026 at Wound Care Center. Drainage has not increased, and the pain there is unchanged. Her Parkinson disease has been stable, with no recent fall, no new hallucination, and no missed doses of carbidopa-levodopa.
  23| 
  24| Past medical history
  25| Parkinson disease. Chronic venous insufficiency with a recurrent left medial ankle ulcer. Hypertension. Osteoarthritis of the knees. Remote hysterectomy. No diabetes. No heart failure. No chronic lung disease previously diagnosed. No tobacco use.
  26| 
  27| Past surgical history
  28| Hysterectomy in middle age. No thoracic surgery. Ulcer debridement as noted above, without a skin graft.
  29| 
  30| Medications on admission
  31| 1. Carbidopa-levodopa 25/100 mg by mouth three times daily.
  32| 2. Amlodipine 5 mg by mouth daily.
  33| 3. Acetaminophen 650 mg by mouth every eight hours as needed for pain.
  34| 4. Doxycycline 100 mg by mouth twice daily for five days, started in the emergency unit, Rx 7741208.
  35| 5. A plain petrolatum dressing to the ankle ulcer daily.
  36| 
  37| Allergies
  38| Penicillin, which caused a diffuse rash in the remote past. No other drug allergy.
  39| 
  40| Social history
  41| She lives with her daughter in a single-level house and does not drive. She never smoked and does not drink alcohol. A home health nurse visits twice a week for the ulcer. Caregiver and daughter Chantal de la Roche can be reached at 541.555.0190. The ward desk for this admission is (541) 555-0128 ext. 214.
  42| 
  43| Family history
  44| Her mother had a stroke in late life. No family history of lung disease was known to the daughter.
  45| 
  46| Review of systems
  47| Fever and cough as above. No dysuria, no abdominal pain, no diarrhea, no rash except the healing ulcer, no headache, no focal weakness that is new. The rest of the review is negative or unreliable where her soft voice made details thin, and her daughter confirmed the negatives.
  48| 
  49| Physical examination
  50| Blood pressure 132/70 mmHg, heart rate 98, respiratory rate 24, temperature 38.4 C, oxygen saturation 91 percent on room air and 95 percent on 2 liters nasal cannula. Weight 48 kg. She is alert and oriented to person and place, mildly tired, not toxic. Speech is hypophonic. On exam, Crowell's breathing is slightly labored, with coarse crackles at the right base and no wheeze. Heart regular, no murmur. Abdomen soft. Left medial ankle ulcer measures about 1.5 cm, pink base, minimal serous drainage, no new erythema tracking up the leg. No calf swelling. Tremor at rest is mild in both hands. Tone is somewhat increased. Strength is near baseline. Gait was not tested. Face is mildly masked. Extraocular movements are intact. There is no nuchal rigidity. Cogwheel tone is present at the wrists. She can rise from the chair only with two tries and a hand on the rail, which her daughter says is usual since last winter.
  51| 
  52| Studies
  53| White cells 13.6 x 10 to the 9 per liter. Hemoglobin 12.4 g/dL. Platelets 242,000/microliter. Sodium 138 mmol/L. Creatinine 0.9 mg/dL. Glucose 112 mg/dL. Chest radiograph shows a right lower lobe infiltrate without effusion or pneumothorax. Electrocardiogram shows sinus rhythm at 98, no acute ischemic change. Sputum culture is pending. Influenza and COVID swabs from the emergency unit were negative. Venous duplex was not required; the leg exam does not suggest thrombosis.
  54| 
  55| Assessment and plan
  56| 1. Community-acquired pneumonia, likely, with hypoxia and a right lower lobe infiltrate. Admission is for hypoxia and limited home reserve. The CURB-65 score is 1 on age alone, since the respiratory rate is under 30 and the pressure is adequate. Continue doxycycline under the existing prescription, add close nursing observation, and keep oxygen for a saturation at or above 92 percent. Blood cultures were drawn before the second dose. Advance diet as she tolerates, with aspiration precautions and an upright position for meals. Reassess tomorrow for clinical response. Incentive spirometry every hour while awake was ordered. Physical therapy will evaluate her tomorrow for safe transfers. If the white count and the work of breathing are not improved by the second morning, coverage will be broadened and a chest film repeated.
  57| 2. Parkinson disease, stable. Continue carbidopa-levodopa 25/100 mg three times daily on her home schedule so doses are not delayed. Fall precautions are in place. Speech is at baseline per her daughter.
  58| 3. Venous ulcer, chronic, recently debrided. Continue daily petrolatum dressing and elevation when in bed. The same clinic will see her after discharge. No antibiotic is directed at the ulcer, which shows no cellulitis.
  59| 4. Hypertension. Hold amlodipine tonight if systolic pressure is under 110, otherwise continue 5 mg daily.
  60| 5. Code status was discussed with her and with her daughter. She wants treatment of reversible problems, including antibiotics and a brief trial of noninvasive ventilation if it were ever needed, and she does not want chest compressions or intubation. This was entered in the chart.
  61| 
  62| She was tired but able to agree with the plan. Her daughter stayed for the discussion.
  63| 
  64| Electronically signed by Ellen Pryor, MD
  65| DEA FP2291846
  66| Pulmonary and Critical Care
  67| Date of note matches the admission field above.
=== END DOCUMENT ===

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

=== DOCUMENT fd-0004 ===
   1| CLINICAL PHARMACY CONSULTATION NOTE
   2| REASON FOR CONSULT: Medication reconciliation and pain regimen review.
   3| 
   4| PATIENT STATUS:
   5| The patient is a 58-year-old female referred to Pain Clinic for ongoing management of post-herpetic neuralgia and suspected secondary Bell palsy. Outside Hospital records from 2024 note intolerance to gabapentin due to pronounced somnolence and peripheral edema. Her daughter confirmed home adherence at bedside.
   6| 
   7| CURRENT VITALS AND LABS:
   8| BP 128/78 mmHg, HR 72 bpm, SpO2 98% on room air, temp 36.8 C.
   9| Serum creatinine 0.82 mg/dL, eGFR > 60 mL/min/1.73 m2, K+ 4.1 mEq/L, Na+ 139 mEq/L, ALT 22 U/L, AST 19 U/L.
  10| 
  11| ACTIVE MEDICATIONS RECONCILED:
  12| 1. Lyrica (pregabalin) 75 mg PO BID; increase to 150 mg PO BID recommended.
  13| 2. Duloxetine 30 mg PO daily.
  14| 3. Acetaminophen 500 mg PO q6h PRN mild pain.
  15| 4. Artificial tears 1 drop in affected eye q4h PRN corneal dryness secondary to facial weakness.
  16| 
  17| ASSESSMENT AND RECOMMENDATIONS:
  18| Renal function is stable and supports cautious dose escalation of pregabalin. Recommended gradual upward titration of Lyrica to target therapeutic dosing while monitoring for ataxia or dizziness. Follow-up coordination will be handled through the outpatient clinic. Covering clinical pharmacist signed.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.