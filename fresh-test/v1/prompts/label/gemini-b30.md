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

=== DOCUMENT fd-0177 ===
   1| CRESTVIEW SPECIALTY PHARMACY
   2| PRIOR AUTHORIZATION & MEDICATION RECONCILIATION NOTE
   3| TRANSCRIBED FROM CLINICAL FAX / PORTAL REFILL QUEUE
   4| 
   5| PATIENT: SWEENEY-O'SULLIVAN, CONNOR
   6| DOB / AGE: 67-year-old male
   7| MRN: 8492014
   8| PRESCRIBER: KAUFMAN, ARTHUR, MD
   9| PRESCRIBER NPI: 1497283401
  10| CONTACT EMAIL: arthur.kaufman@example.org
  11| CLINIC PHONE: (617) 555-0128
  12| DATE OF REQUEST: 10/14/2026
  13| 
  14| CALL AND QUEUE DETAILS:
  15| Staff intake completed by Sweet, CPhT at Crestview Specialty Pharmacy following electronic transmission receipt. Outreach call made to patient home to clarify prior auth renewal documentation for biologic therapy. Patient was unavailable; spoke directly with Clara Higgins, the patient's sister and primary caregiver, who assists with medication administration and home deliveries.
  16| 
  17| CLINICAL BACKGROUND & INDICATION:
  18| Mr. Sweeney-O'Sullivan is a 67-year-old male with severe refractory plaque psoriasis and psoriatic arthritis diagnosed in October 2026. The patient also carries diagnoses of hypertension and gastroesophageal reflux disease, both managed stably on oral therapies. The rheumatology team noted extensive plaque involvement covering approximately 18% body surface area prior to starting targeted biologic treatment. Previous therapies failed due to inadequate disease control or intolerable adverse effects, including oral methotrexate 15 mg weekly discontinued due to persistent transaminitis, and adalimumab 40 mg subcutaneous every two weeks discontinued after six months due to secondary loss of efficacy. Prescriber Arthur Kaufman submitted an urgent prior authorization request for ustekinumab.
  19| 
  20| PHARMACY RECONCILIATION & LAB REVIEW:
  21| Clara Higgins reported that Connor Sweeney-O'Sullivan received his initial loading dose without complications and experienced marked clearance of cutaneous plaques. Sister confirms patient has not had any recent fever, chronic cough, or active infectious symptoms. No injection-site reactions or systemic hypersensitivity was noted following the previous administration. Patient's sister reiterated that prescription adherence has remained consistent at home. Baseline QuantiFERON-TB Gold test completed prior to initiation was negative. Recent laboratory reivew from 10/14/2026 demonstrates stable hepatic and renal profiles: AST 24 U/L, ALT 28 U/L, serum creatinine 0.94 mg/dL, and absolute neutrophil count 3,800/uL.
  22| 
  23| CURRENT MEDICATION PROFILE:
  24| 1. Ustekinumab 90 mg subcutaneous injection every 12 weeks. Prior authorization required for maintenance refil.
  25| 2. Naproxen 500 mg PO BID with meals PRN joint stiffness.
  26| 3. Omeprazole 20 mg PO daily before breakfast for gastroprotection.
  27| 4. Cholecalciferol 2,000 IU PO daily.
  28| 
  29| PLAN AND ACTIONS TAKEN:
  30| 1. Urgent prior authorization clinical narrative compiled by Hannah Sweet and forwarded to teh patient's commercial health plan along with relevant clinic notes and charted lab panels.
  31| 2. Sent secure message confirmation to Arthur Kaufman at arthur.kaufman@example.org outlining submitted authorization forms and clinical rationale.
  32| 3. Advised Clara Higgins that once approval is granted by the health plan, Crestview Specialty Pharmacy will arrange refrigerated courier delivery to their residence.
  33| 4. Follow-up scheduled for 48 hours to monitor authorization determination status.
  34| 
  35| Hannah Sweet, Lead Pharmacy Technician
  36| Crestview Specialty Pharmacy
=== END DOCUMENT ===

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

Now output the label blocks, one per document, in the order shown.