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


=== DOCUMENT fd-0170 ===
   1| CLEARWATER MEDICAL LABORATORIES
   2| SURGICAL PATHOLOGY REPORT
   3| 
   4| PATIENT: YURTSEVER, CEMAL
   5| HOME ADDRESS: 842 Crestview Terrace, Bellevue, WA 98004
   6| TELEPHONE: (206) 555-0142
   7| MRN / MASTER ID: 7142 0839 51
   8| ACCESSION NUMBER: SP-2026-88341
   9| ORDERING PHYSICIAN: Dr. Alistair MacIntyre
  10| PATHOLOGIST: Dr. Bradley Keller
  11| EMERGENCY CONTACT: Dagmara Dvořáková (sister)
  12| Date of Service: Oct 14 2026
  13| Report Date: Oct 16 2026
  14| 
  15| SPECIMEN SUBMITTED:
  16| Prostate needle core biopsies (12 cores, designated A through L).
  17| 
  18| CLINICAL INDICATION:
  19| Elevated serum PSA of 7.8 ng/mL and abnormal digital rectal examination.
  20| Prior transrectal ultrasound noted hypoechoic nodule in left peripheral
  21| zone. Patient is a 65-year-old male presenting with urinary frequency.
  22| Serum PSA density was calculated at 0.16 ng/mL2 based on a prostate
  23| volume of 48 cc measured on recent pelvic MRI.
  24| 
  25| GROSS DESCRIPTION:
  26| Specimen received in twelve formalin-filled containers, each labeled
  27| with patient identifiers and designated part letters A through L.
  28| Part A: Labeled "right apex", consists of two tan-white cylindrical
  29| tissue cores measuring 1.2 cm and 1.4 cm in length, entirely submitted.
  30| Part B through Part L: Each consists of one to three tan cylindrical
  31| cores measuring between 0.9 cm and 1.6 cm in length, processed in routine
  32| fashion without complication.
  33| 
  34| MICROSCOPIC EXAMINATION:
  35| Sections of Mr. Yurtsever's prostate core biopsies were examined under
  36| standard light microscopy following hematoxylin and eosin staining.
  37| 
  38| Parts A through E (Right lobe cores):
  39| Cores show benign prostatic glandular tissue and fibromuscular stroma.
  40| No acute or chronic prostatitis is identified. No atypia or malignancy.
  41| 
  42| Part F (Left mid gland peripheral zone):
  43| Infiltrating small, crowded, distinct and well-formed neoplastic glands
  44| infiltrating between benign acini. The neoplastic cells display nuclear
  45| enlargement, prominent nucleoli, and absence of basal cell layer,
  46| confirmed by immunohistochemical cocktail (p63 and high-molecular-weight
  47| cytokeratin negative; AMACR/racemase positive). Appropriate positive and
  48| negative external controls reacted as expected.
  49| Gleason pattern: 3 + 4 = 7 (Grade Group 2).
  50| Tumor involves approximately 35% of the core length (5 mm of 14 mm).
  51| No perineural invasion is identified in this part.
  52| 
  53| Part G (Left apex):
  54| Adenocarcinoma, acinar type.
  55| Gleason pattern: 3 + 3 = 6 (Grade Group 1).
  56| Tumor involves approximately 15% of the core length.
  57| 
  58| Parts H through L (Remaining left base and lateral cores):
  59| Benign prostatic hypertrophy with focal stromal hyperplasia.
  60| No evidence of extraprostatic extension or lymphovascular invasion.
  61| 
  62| FINAL DIAGNOSIS:
  63| Acinar adenocarcinoma of the prostate, involving left mid gland and
  64| left apex (2 of 12 cores positive).
  65| Primary Gleason score: Gleason score 3 + 4 = 7, Grade Group 2.
  66| Secondary Gleason pattern 4 comprises approximately 10% of tumor volume.
  67| Surgical margins cannot be assessed on needle core biopsy.
  68| 
  69| COMMENT:
  70| The histology and immunohistochemistry results were reviewed with the
  71| ordering clinician, Dr. Alistair MacIntyre. Patient Cemal Yurtsever will
  72| be scheduled for consultation regarding active surveillance versus
  73| definitive treatment options. Multidisciplinary tumor board review is
  74| recommended prior to final management selection.
  75| 
  76| Signed,
  77| Dr. Bradley Keller, MD, FCAP
  78| Clearwater Medical Laboratories
=== END DOCUMENT ===

=== DOCUMENT fd-0083 ===
   1| RIVER ROAD CLINIC
   2| MEDICATION THERAPY MANAGEMENT & PRIOR AUTHORIZATION INTAKE NOTE
   3| DEPARTMENT OF CLINICAL PHARMACY
   4| 
   5| PATIENT IDENTIFICATION & CONTACT:
   6| NAME: ETIENNE DE LA TOUR
   7| DOB: March 14, 1933
   8| AGE: 93-year-old male
   9| MEMBER ID: 5821-4409-18
  10| HOME ADDRESS:
  11| 418 Royal Street, Suite 2A
  12| New Orleans, LA 70130
  13| PRIMARY CAREGIVER: Dawn M. Campbell (patient's granddaughter and primary caregiver)
  14| CAREGIVER PHONE: (504) 555-0182
  15| 
  16| PRESCRIBING CLINICIAN:
  17| Andrés R. Gómez-Navarro, MD
  18| River Road Clinic - Geriatric Medicine
  19| Clinician Email: andres.gomez@example.org
  20| 
  21| DOCUMENTATION INTAKE:
  22| Intake completed by Valeria Case Velásquez, CPhT.
  23| Date of Intake Review: October 22, 2026.
  24| 
  25| PURPOSE OF NOTE:
  26| Prior authorization appeal and medication regimen review for anticoagulation and cardiopulmonary maintenance therapy following recent cardiology consultation.
  27| 
  28| CLINICAL HISTORY & VITAL SIGNS:
  29| The patient is a 93-year-old male with a medical history notable for non-valvular atrial fibrillation, stage 3 chronic kidney disease, osteoporosis, and recurrent venous thromboembolism. He was seen in clinic on October 22, 2026 by Dr. Andrés R. Gómez-Navarro for routine monitoring and therapy reassessment.
  30| 
  31| Recorded Vitals:
  32| - Blood Pressure: 132/76 mmHg
  33| - Heart Rate: 72 bpm, irregular
  34| - Respiratory Rate: 17 breaths/min
  35| - Oxygen Saturation: 96% on room air
  36| - Weight: 62.4 kg, Height: 168 cm, BMI: 22.1 kg/m2
  37| 
  38| Current Laboratory Values (drawn October 20, 2026):
  39| - Serum Creatinine: 1.34 mg/dL
  40| - Blood Urea Nitrogen: 28 mg/dL
  41| - Estimated GFR (CKD-EPI): 48 mL/min/1.73 m2
  42| - Serum Potassium: 4.4 mEq/L
  43| - Hemoglobin: 11.8 g/dL
  44| - Hematocrit: 35.4%
  45| - Platelet Count: 198,000 /uL
  46| - International Normalized Ratio (INR): 1.1
  47| 
  48| MEDICATION RECONCILIATION & CLINICAL ASSESSMENT:
  49| Valeria Case Velásquez conducted a detailed phone consultation with Dawn M. Campbell regarding home administration. Ms. Campbell confirmed that her grandfather adheres strictly to his pill organizer and has experienced no bleeding episodes, dark stools, or sudden bruising.
  50| 
  51| Reconciled Medication List:
  52| 1. Apixaban (Eliquis) 2.5 mg PO BID. Prior authorization renewal requested. The reduced dose of 2.5 mg BID is clinically indicated based on FDA labeling criteria: patient meets two threshold criteria (age >= 80 at 93 years old, and serum creatinine >= 1.5 mg/dL was noted historically during acute illness, with current serum creatinine 1.34 mg/dL and weight < 60 kg at last nadir).
  53| 2. Metoprolol succinate extended-release 25 mg PO daily for rate control.
  54| 3. Alendronate sodium 70 mg PO once weekly on Sunday mornings with full glass of water.
  55| 4. Calcium carbonate / vitamin D3 600 mg / 400 IU PO BID with meals.
  56| 5. Acetaminophen 500 mg PO q8h PRN for osteoarthritis joint discomfort.
  57| 
  58| PRIOR AUTHORIZATION APPEAL DETAILS:
  59| The patient's health plan issued an initial denial requiring trial of warfarin before approving direct oral anticoagulants. Dr. Gómez-Navarro and the clinical pharmacy team at River Road Clinic are appealing this determination. Dawn explained that Mr. de la Tour has significant mobility limitations making frequent clinic visits for routine venipuncture and INR monitoring hazardous due to fall risk. Furthermore, apixaban has maintained excellent thromboembolic prophylaxis over the past eighteen months without hemorrhagic events.
  60| 
  61| PHARMACY ACTION PLAN:
  62| 1. Valeria Case Velásquez compiled the chart notes, lab panels, and physician letter of medical necessity and transmitted them to the health plan utilization review committee under prior authorization reference 5821-4409-18.
  63| 2. Direct formulary policy guidelines and appeal submission status are tracked online at https://portal.example.org/appeals/case-review.
  64| 3. Follow-up phone consultation arranged with Dawn M. Campbell to convey coverage determination within three business days.
  65| 4. Bridge supply of apixaban 2.5 mg coordinated through River Road Clinic charitable pharmacy dispensary to prevent therapy interruption.
  66| 
  67| Valeria Case Velásquez, CPhT
  68| Clinical Pharmacy Intake Coordinator, River Road Clinic
=== END DOCUMENT ===

=== DOCUMENT fd-0099 ===
   1| TRANSCRIPT LOG: INCOMING CLINICAL CALL
   2| Date of Call: 18.09.2026
   3| Facility: Pine Valley Medical Clinic
   4| Triage Station: East Wing Nurse Line
   5| 
   6| NURSE BROOKS: Pine Valley Medical Clinic triage, this is Nurse Evelyn Brooks speaking. How can I, um, how can I help you today?
   7| 
   8| CALLER: Hello, yes, uh, good morning. My name is Donald Yates. I'm calling, uh, calling about my mother, Kathleen Yates-O'Donnell. She's, um, she's having some trouble with her medicine, and also we got locked out of her online portal this morning.
   9| 
  10| NURSE BROOKS: Okay, Mr. Yates, I can certainly help you with both of those things. Before we go into the clinical details, I just need to verify her information for her chart. Could you give me her date of birth and her current street address?
  11| 
  12| CALLER: Yes, of course. Her DOB is 24.03.1932. She is ninety-four years old now. And her address is 418 Crestview Terrace, Spokane, Washington 99203.
  13| 
  14| NURSE BROOKS: Perfect, thank you. And do you have her account number or billing reference handy from her statement?
  15| 
  16| CALLER: Uh, yeah, let me pull up the paper. The account number is AC-739104.
  17| 
  18| NURSE BROOKS: Got it. And what is the best contact phone number to reach you or her if the provider needs to call back?
  19| 
  20| CALLER: Well, my mobile phone is +1-503-555-0182, but her primary home phone number is, uh, let me read it slowly, five five five, zero one four two.
  21| 
  22| NURSE BROOKS: Thank you, five five five, zero one four two. Now, tell me what is going on with Mrs. Yates-O'Donnell's medications.
  23| 
  24| CALLER: Well, um, her neurologist, Dr. Russell Wagner, started her on carbidopa-levodopa 25/100 mg three times a day for her Parkinson disease about two weeks ago. But yesterday evening and again this morning, she had, uh, she had noticeable resting tremor in her right hand and some stiffness when getting up from her chair. Her blood pressure was 134/78 mmHg and her heart rate was 72 beats per minute. We were trying to send a secure message to Dr. Wagner, but the portal kept throwing an authentication error.
  25| 
  26| NURSE BROOKS: I see. Let me look at the system access logs right now. Ah, yes, I see the portal lockout. It looks like there was a flagged remote login attempt from IP address 198.51.100.68 at approximately 07:15. That triggered an automated security hold. I just reset the credentials and cleared that flag, so you should be able to log back in shortly.
  27| 
  28| CALLER: Oh, thank goodness. That IP address was probably my tablet on my home Wi-Fi network.
  29| 
  30| NURSE BROOKS: That makes sense. As for her Parkinson disease symptoms, I am documenting the increased rigidity and hand tremor in Mrs. Yates-O'Donnell's record right now. I will route an urgent clinical encounter message to Dr. Wagner's medical assistant. If she develops any swallowing difficulty, sudden falls, or severe freezing of gait, please take her to the nearest emergency room immediately. Otherwise, expect a return call from Dr. Wagner or his triage nurse before 3:00 PM today.
  31| 
  32| CALLER: Okay, thank you so much, Nurse Brooks. We will keep a close eye on her.
  33| 
  34| NURSE BROOKS: You are welcome, Mr. Yates. Take care.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.