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

=== DOCUMENT fd-0299 ===
   1| CLINICAL PROGRESS NOTE
   2| Date of Service: October 18, 2026
   3| 
   4| PATIENT REGISTRATION DATA:
   5| Name: AL-GHAZALI, BASHIR
   6| Age: 52-year-old male
   7| Health Plan Member ID: HPM-9920148
   8| Clinic Fax: (415) 555-0162
   9| 
  10| PROVIDER:
  11| Dr. Walter Campbell, MD, Internal Medicine
  12| 
  13| CHIEF COMPLAINT:
  14| Scheduled six-month follow-up for chronic essential hypertension and
  15| hyperlipidemia management.
  16| 
  17| HISTORY OF PRESENT ILLNESS:
  18| Bashir al-Ghazali is a 52-year-old male who presents for scheduled chronic
  19| disease management. The patient arrived with his son-in-law, Prince
  20| Kalani, who assisted with translation and history. Mr. al-Ghazali reports
  21| feeling generally well over the preceding six months and is currently
  22| asymptomtic, denying chest tightness, exertional dyspnea, palpitations,
  23| orthopnea, lightheadedness, or visual disturbances. His son-in-law Prince,
  24| a 34-year-old personal fitness trainer, notes that the patient has adhered
  25| strictly to his prescribed low-sodium dietary regimen and walks 30 minutes
  26| daily without difficulty. Home blood pressure measurements have averaged
  27| 128/78 mmHg. Medications are consistently tollerated without adverse effects.
  28| 
  29| Laboratory results drawn on October 12, 2026, were reviewed with the patient
  30| and his son-in-law, including a fasting blood glucose of 92 mg/dL, serum
  31| creatinine of 0.94 mg/dL with estimated GFR greater than 60 mL/min/1.73m2,
  32| total cholesterol 162 mg/dL, LDL 74 mg/dL, and HDL 46 mg/dL. The patient
  33| denies nocturnal cough, paroxysmal nocturnal dyspnea, or claudication.
  34| 
  35| CURRENT MEDICATIONS:
  36| 1. Lisinopril 20 mg PO daily.
  37| 2. Amlodipine besylate 5 mg PO daily.
  38| 3. Atorvastatin calcium 20 mg PO nightly.
  39| 
  40| PHYSICAL EXAMINATION:
  41| Vital Signs: BP 126/80 mmHg, Pulse 70 bpm, RR 14 /min, SpO2 99% on room air.
  42| General: Well-nourished, well-developed male in no acute distress.
  43| HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to light.
  44| Cardiovascular: Regular rate and rhythm, normal S1 and S2, no murmurs or rubs.
  45| Lungs: Clear to auscultation bilaterally; no wheezes, rhonchi, or crackles.
  46| Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds.
  47| Extremities: Warm, well-perfused extremeties with no peripheral edema.
  48| Neurological: Alert, oriented x4, cranial nerves II-XII grossly intact.
  49| 
  50| ASSESSMENT AND PLAN:
  51| 1. Essential hypertension: Well-controlled on dual therapy. Continue lisinopril
  52| 20 mg PO daily and amlodipine besylate 5 mg PO daily.
  53| 2. Hyperlipidemia: Lipid panel reveals excellent target attainment with LDL
  54| 74 mg/dL. Continue atorvastatin calcium 20 mg PO nightly.
  55| 3. Preventative Health: Routine screening colonoscopy ordered. Seasonal
  56| influenza vaccine administered today in clinic.
  57| 4. Follow-Up: Return to clinic in six months for repeat metabolic panel and
  58| clinical evaluation.
  59| 
  60| Electronically signed by:
  61| Dr. Walter Campbell, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0280 ===
   1| Green Valley Health Center
   2| 512 River Road, Suite 200
   3| Columbus, OH 43215
   4| Clinic Phone: (614) 555-0138
   5| Provider Email: marcus.fletcher@example.org
   6| Portal: https://mychart.example.com/patient/summary
   7| 
   8| OUTPATIENT COMPREHENSIVE CLINICAL PROGRESS NOTE
   9| Date of Encounter: March 4, 2026
  10| Patient Identification: 4821-9932-07
  11| Patient Name: Gurdev Grewal
  12| DOB: August 14, 1934
  13| Age: 91 y.o.
  14| Attending: Marcus E. Fletcher, MD
  15| 
  16| SUBJECTIVE:
  17| Mr. Gurdev Grewal is a 91 y.o. gentleman with a medical history of chronic
  18| systolic heart failure, essential hypertension, benign prostatic
  19| hyperplasia, and mild vascular cognitive impairment who presents today
  20| for routine outpatient chronic disease follow-up. The patient arrived
  21| at the clinic via specialized paratransit mobility transport, vehicle
  22| license plate 4KLT892. He is accompanied today by his son-in-law, Brian
  23| Miller, who assists with medication administration and manages his
  24| daily home schedule.
  25| 
  26| Mr. Miller reports that the patient has experienced stable functional
  27| status over the past two months without acute syptoms of decompensation.
  28| There have been no episodes of paroxysmal nocturnal dyspnea, orthopnea,
  29| chest pressure, palpitations, or lightheadedness. Daily home weights
  30| have remained within a narrow range of 152 to 154 lbs. His appetite
  31| is reported as satisfactory, and he drinks adequate fluids. The patient
  32| uses a four-wheeled rolling walker for household amublation. His
  33| son-in-law confirms that all home prescriptions are taken faithfully
  34| and requests an evalution of his latest routine outpatient laboratory
  35| panels.
  36| 
  37| CURRENT MEDICATIONS:
  38| 1. Lisinopril 20 mg PO daily.
  39| 2. Carvedilol 12.5 mg PO BID.
  40| 3. Furosemide 20 mg PO daily in the morning.
  41| 4. Tamsulosin 0.4 mg PO at bedtime.
  42| 5. Atorvastatin 20 mg PO at bedtime.
  43| 6. Aspirin 81 mg PO daily.
  44| 
  45| PHYSICAL EXAMINATION:
  46| Vital Signs: Blood pressure 138/82 mmHg, heart rate 72 bpm regular,
  47| respiratory rate 16 breaths/min, body temperature 98.4 F, oxygen
  48| saturation 97% on ambient room air. Weight 69.4 kg (153 lbs).
  49| General: Pleasant, frail elderly male in no acute distress, resting
  50| comfortably in chair, alert and oriented to person and city.
  51| HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to
  52| light. Sclerae anicteric. Oral mucosa moist.
  53| Cardiovascular: Regular rate and rhythm, normal S1 and S2, soft 1/6
  54| systolic murmur at the apex, no gallops or pericardial friction rubs.
  55| Carotid pulses brisk bilaterally without bruits.
  56| Pulmonary: Lungs clear to auscultation bilaterally in all fields; no
  57| crackles, wheezing, or rhonchi.
  58| Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds.
  59| Extremities: Trace non-pitting edema at bilateral ankles; no calf
  60| tenderness. Dorsalis pedis pulses 2+ bilaterally.
  61| Neurologic: Cranial nerves II-XII grossly intact. Sensation intact
  62| to light touch distally. Motor strength 5/5 upper extremities, 4+/5
  63| lower extremities symmetrically. Gait slow but steady with walker.
  64| 
  65| LABORATORY REVIEW:
  66| Specimen drawn earlier this morning: Serum sodium 138 mEq/L, potassium
  67| 4.5 mEq/L, chloride 101 mEq/L, bicarbonate 26 mEq/L, blood urea nitrogen
  68| 24 mg/dL, serum creatinine 1.2 mg/dL (eGFR 58 mL/min/1.73m2). Fasting
  69| blood glucose 118 mg/dL, hemoglobin A1c 6.9%. Complete blood count:
  70| white blood cell count 6.4 x10^3/uL, hemoglobin 13.2 g/dL, hematocrit
  71| 39.4%, platelet count 198 x10^3/uL.
  72| 
  73| ASSESSMENT AND PLAN:
  74| Gurdev Grewal is a 91 y.o. male with well-compensated heart failure
  75| and hypertension, demonstrating clinical stability.
  76| 1. Chronic Systolic Heart Failure:
  77| - Clinically euvolemic with stable weights and trace ankle edema.
  78| - Continue lisinopril 20 mg PO daily, carvedilol 12.5 mg PO BID, and
  79|   furosemide 20 mg PO daily.
  80| - Continue daily morning weight checks; contact office for 3 lb gain.
  81| 2. Essential Hypertension:
  82| - Blood pressure acceptable at 138/82 mmHg. Regimen unchanged.
  83| 3. Benign Prostatic Hyperplasia:
  84| - Continue tamsulosin 0.4 mg PO at bedtime without adverse effects.
  85| 4. Preventative Health and Follow-up:
  86| - Return to clinic in four months for repeat metabolic panel and clinical
  87|   review. Brian Miller was provided a direct portal link to review
  88|   laboratory results: https://mychart.example.com/patient/summary.
  89| 
  90| Provider Signature:
  91| Marcus E. Fletcher, MD
  92| Internal Medicine, Green Valley Health Center
=== END DOCUMENT ===

=== DOCUMENT fd-0192 ===
   1| 74019284
   2| Date of Service: 04.03.2026
   3| PATIENT: Yaroslav Wozniak
   4| DOB: 12.08.1933
   5| Demographics: 92M
   6| Account Number: AC-9938120
   7| ADDRESS: 842 NORTH HAMPTON ROAD, APT 4D, OAK BROOK, IL 60523
   8| Phone: (312) 555-0184
   9| Facility: Highland Creek Care Center
  10| Attending Physician: Arthur Campbell, MD
  11| Contact Email: arthur.campbell@example.org
  12| 
  13| CLINICAL COMPREHENSIVE PROGRESS AND REHABILITATION ASSESSMENT
  14| 
  15| CHIEF COMPLAINT AND REASON FOR ENCOUNTER:
  16| Evaluation of rehabilitation progress following acute hospitalization for subcapital femoral neck fracture, management of underlying cognitive decline, monitoring of obstructive sleep apnea therapy, and discharge planning.
  17| 
  18| HISTORY OF PRESENT ILLNESS:
  19| Mr. Yaroslav Wozniak is a 92M retired metallurgical engineer who was admitted to Highland Creek Care Center on 18 Oct 2025 following an acute inpatient stay for an operative right hemiarthroplasty secondary to a mechanical fall at home. He currently lives in Oak Brook with his adult daughter, Mrs. Clara Cross, who serves as his primary caregiver and medical power of attorney. On the morning of today's evaluation, 04.03.2026, the patient was transported from the physical therapy suite via specialized medical wheelchair van, transport license plate 7XYZ912, for this comprehensive monthly interdisciplinary re-assessment.
  20| 
  21| According to his daughter, Mrs. Clara Cross, who was contacted by telephone at (312) 555-0119 ext. 204 and via email at clara.cross@example.net, Mr. Wozniak has demonstrated steady, albeit slow, improvement in transfer capabilities and standing tolerance over the past month. However, Mrs. Cross noted intermittent periods of sundowning and nocturnal disorientation, particularly when awakening during the night. The patient utilizes a home CPAP machine nightly for severe obstructive sleep apnea; interrogation of his Respironics DreamStation device, serial number CP-9082341, demonstrates an average nightly usage of 5.8 hours over the preceding thirty consecutive days, with an 90th-percentile pressure of 11.2 cmH2O and a residual apnea-hypopnea index of 3.4 events per hour, confirming therapeutic adherence and efficacy.
  22| 
  23| He denies active localized pain in the right hip, chest pressure, palpitations, dyspnea at rest, fevers, chills, or acute gastrointestinal distress. He reports occasional chronic bilateral knee aching rated 2/10, managed adequately with scheduled topical therapy. Review of his inpatient chart reveals that a formal geriatric psychiatry consultation was completed earlier this week on Mar 4 2026 by Dr. Andrew van der Beek, who recommended maintaining low-dose nighttime melatonin and continuing structured daytime orientation prompts while strictly avoiding sedating antihistamines or benzodiazepines.
  24| 
  25| PAST MEDICAL HISTORY:
  26| 1. Right subcapital femoral neck fracture status post right hip hemiarthroplasty (October 2025).
  27| 2. Vascular dementia with mild behavioral disturbance.
  28| 3. Obstructive sleep apnea, adherent to CPAP therapy.
  29| 4. Essential hypertension, well controlled.
  30| 5. Hyperlipidemia.
  31| 6. Stage 3 chronic kidney disease (baseline creatinine 1.4 to 1.6 mg/dL).
  32| 7. Benign prostatic hyperplasia with mild lower urinary tract symptoms.
  33| 8. History of deep venous thrombosis in 2021, completed therapeutic course.
  34| 
  35| PAST SURGICAL HISTORY:
  36| 1. Right hip hemiarthroplasty (October 2025).
  37| 2. Transurethral resection of the prostate (2018).
  38| 3. Bilateral cataract extraction with intraocular lens implantation (2014, 2016).
  39| 
  40| CURRENT MEDICATIONS:
  41| 1. Lisinopril 10 mg PO daily.
  42| 2. Amlodipine 5 mg PO daily.
  43| 3. Atorvastatin 20 mg PO at bedtime.
  44| 4. Tamsulosin 0.4 mg PO daily at bedtime.
  45| 5. Donepezil 10 mg PO daily at bedtime.
  46| 6. Melatonin 3 mg PO nightly at 21:00.
  47| 7. Acetaminophen 650 mg PO TID PRN joint pain.
  48| 8. Diclofenac 1% topical gel, 2 grams applied to bilateral knees TID PRN.
  49| 9. Polyethylene glycol 17 g PO daily in water for constipation prophylaxis.
  50| 10. Ergocalciferol (Vitamin D2) 50,000 units PO once weekly.
  51| 
  52| REVIEW OF SYSTEMS:
  53| Constitutional: No fevers, diaphoresis, rigors, or unassisted weight changes.
  54| HEENT: Vision corrected with lenses. Hearing mildly impaired bilaterally; wears hearing aids. No dysphagia.
  55| Cardiovascular: No chest tightness, peripheral edema, or orthopnea.
  56| Respiratory: No cough, sputum production, wheezing, or shortness of breath.
  57| Gastrointestinal: Appetite good. Bowel movements regular every 1 to 2 days without straining.
  58| Genitourinary: Nocturia x 1-2. No dysuria, gross hematuria, or acute urinary retention.
  59| Musculoskeletal: Right hip incision healed without pain on passive mobilization. Mild crepitus in bilateral knees.
  60| Neurologic: Mild baseline expressive word-finding difficulty; no focal motor deficits, seizures, or tremors.
  61| Psychiatric: Mild nocturnal confusion noted by staff; no visual hallucinations or aggressive behaviors.
  62| 
  63| PHYSICAL EXAMINATION:
  64| Vital Signs: Blood pressure 126/74 mmHg, pulse 68 bpm regular, respiratory rate 16 breaths/min, temperature 98.2 F (36.8 C), oxygen saturation 98% on room air.
  65| General: Frail elderly male, resting comfortably in a high-back wheelchair with footrests, well-groomed, pleasant, in no acute distress.
  66| Cognition: Alert. Oriented to person and partially to place (identifies facility as a recovery hospital); disoriented to exact date, estimating the year correctly. Montreal Cognitive Assessment (MoCA) completed last week scored 18/30.
  67| HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to light. Oropharynx clear with moist mucous membranes. Dentition intact with well-fitting lower partial denture.
  68| Cardiovascular: Regular rhythm, normal S1 and S2. Soft 1/6 systolic ejection murmur heard best at the right upper sternal border, non-radiating. No peripheral edema of the lower extremities. Radial and dorsalis pedis pulses 2+ bilaterally.
  69| Pulmonary: Lungs clear to auscultation bilaterally in anterior and posterior lung fields. Good air movement. No wheezing, rales, or rhonchi.
  70| Abdomen: Soft, non-tender, non-distended. Normal active bowel sounds present in all four quadrants. No organomegaly or palpable masses.
  71| Musculoskeletal / Surgical Site: Well-healed 12 cm linear surgical scar along the right lateral hip without erythema, warmth, dehiscence, or purulence. Range of motion of right hip reveals flexion to 95 degrees, abduction to 25 degrees, with no pain elicited on internal or external rotation. Upper extremity strength 5/5 bilaterally. Lower extremity strength 4+/5 on right hip flexion and knee extension, 5/5 on the left.
  72| Neurologic: Cranial nerves II through XII grossly intact. Deep tendon reflexes 1+ symmetrically at biceps, triceps, and patellae. Plantar reflexes flexor bilaterally. Sensation to light touch intact across all four extremities.
  73| Skin: Skin turgor normal for age. No sacral, trochanteric, or calcaneal pressure injuries. Mild senile purpura on bilateral dorsal forearms.
  74| 
  75| FUNCTIONAL MOBILITY AND THERAPY SUMMARY:
  76| Review of physical and occupational therapy progress notes indicates Mr. Wozniak has achieved modified independence for bed mobility and transfers from sit-to-stand with standby assistance of one person. He ambulates up to 150 feet utilizing a front-wheeled walker with contact guard assistance. Activities of daily living (upper body dressing and hygiene) are performed with minimal assistance; lower body dressing requires moderate assistance due to hip precautions.
  77| 
  78| LABORATORY VALUES (Collected 03.03.2026):
  79| Serum sodium 139 mEq/L, potassium 4.2 mEq/L, chloride 103 mEq/L, bicarbonate 25 mEq/L, blood urea nitrogen 22 mg/dL, serum creatinine 1.4 mg/dL (estimated GFR 49 mL/min/1.73m2, baseline), glucose 96 mg/dL. Complete blood count: white blood cell count 6.2 x10^3/uL, hemoglobin 12.1 g/dL, hematocrit 36.8%, platelet count 210 x10^3/uL. Urinalysis negative for nitrites, leukocyte esterase, or bacteria.
  80| 
  81| ASSESSMENT AND CLINICAL IMPRESSION:
  82| Yaroslav Wozniak is a 92M who is making satisfactory functional recovery following surgical repair of a right subcapital femoral neck fracture, with stable comorbid vascular dementia and obstructive sleep apnea.
  83| 1. Right Hip Arthroplasty Rehabilitation:
  84| - Surgical wound is fully healed. Functional ambulation progressing appropriately with walker. Continue skilled physical therapy 5 days per week targeting endurance and balance.
  85| - Maintain weight-bearing as tolerated with standard posterior hip precautions through the end of the month.
  86| 2. Vascular Dementia and Sundowning:
  87| - Continue donepezil 10 mg PO at bedtime.
  88| - Non-pharmacologic interventions prioritized: sleep hygiene, routine daytime ambulation, natural lighting exposure in morning, calming environment at dusk. Continue melatonin 3 mg PO at 21:00. Dr. van der Beek to re-evaluate in four weeks.
  89| 3. Obstructive Sleep Apnea:
  90| - Stable on CPAP device CP-9082341 at 11 cmH2O pressure. Continue current settings.
  91| 4. Hypertension and Cardiovascular Risk:
  92| - Well controlled on lisinopril and amlodipine. Continue current dosing.
  93| 5. Chronic Kidney Disease:
  94| - Stable renal function with creatinine 1.4 mg/dL. Avoid nephrotoxic agents including systemic nonsteroidal anti-inflammatory drugs.
  95| 6. Discharge Planning:
  96| - Target discharge to his home in Oak Brook under the care of Mrs. Cross anticipated within three weeks. Home health physical therapy and occupational therapy referrals to be finalized prior to transition. Case management will arrange delivery of shower chair, raised toilet seat, and home CPAP supplies.
  97| 
  98| Provider Signature:
  99| Arthur Campbell, MD
 100| Attending Geriatric Physician, Highland Creek Care Center
 101| Supervising Physician Cosignature:
 102| P.J. Abernathy, MD
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.