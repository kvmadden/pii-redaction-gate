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


=== DOCUMENT fd-0287 ===
   1| Clearwater Medical Center
   2| Department of Hematology and Medical Oncology
   3| CLINICAL CONSULTATION AND MULTIDISCIPLINARY ONCOLOGY NOTE
   4| Date of Consultation: 2026-03-04
   5| PATIENT: MARC CÉLESTIN DE LA COUR
   6| DOB: 14 January 1932
   7| Age: 94
   8| MRN: 8940129
   9| Health Plan Member ID: HPM-4920184
  10| Patient Address:
  11| 782 Highland View Avenue
  12| Seattle, WA 98104
  13| Contact Telephone: (206) 555-0163
  14| Department Fax: (206) 555-0177
  15| Provider Contact: babatunde.adeyemi at example dot org
  16| Clinical Portal Access: https://portal.example.org/records/oncology-summary
  17| 
  18| MULTIDISCIPLINARY CARE CONFERENCE ATTENDEES:
  19| 1. Babatunde Adeyemi, MD (Attending Medical Oncologist)
  20| 2. Ngozi Okonkwo, MD (Hematology-Oncology Fellow)
  21| 3. Chidubem Eze, MD (Palliative Medicine Consultant)
  22| 4. Olumide Adeleke, RN (Oncology Nurse Navigator)
  23| 5. Laura M. Sage (Patient Granddaughter and Healthcare Proxy)
  24| 
  25| HISTORY OF PRESENT ILLNESS:
  26| Mr. Marc Célestin de la Cour is an Age: 94 retired school administrator who presents for an initial outpatient hematology-oncology consultation following a recent diagnostic workup for iron deficiency anemia and lower gastrointestinal bleeding. The patient was accompanied to the clinic by his 28-year-old granddaughter and primary caregiver, Laura M. Sage. 
  27| 
  28| The patient's clinical trajectory began on 4 March 2026 when routine screening laboratories demonstrated an unexpected drop in hemoglobin to 7.8 g/dL. Subsequent diagnostic colonoscopy performed on 18 February 2026 revealed an ulcerated, partially obstructing mass measuring 4.2 cm in maximal diameter located at the rectosigmoid junction, approximately 16 cm from the anal verge. Multiple endoscopic biopsies were obtained. Histopathological analysis confirmed moderately differentiated invasive adenocarcinoma of the rectosigmoid colon. Staging computed tomography of the chest, abdomen, and pelvis with intravenous contrast performed on 24 February 2026 revealed localized circumferential wall thickening of the rectosigmoid junction with pericolic fat stranding and two prominent regional mesenteric lymph nodes measuring 1.1 cm and 1.3 cm in short axis. No evidence of distant hepatic, pulmonary, or peritoneal metastatic disease was identified (clinical stage T3, N1, M0, Stage III).
  29| 
  30| Over the preceding three months, Mr. Célestin de la Cour has endorsed intermittent passage of dark red blood mixed with formed stools, progressive fatigue, and a 4 kg unintentional weight loss. He denies severe abdominal pain, nausea, vomiting, tenesmus, or obstipation. He reports that his appetite remains fair, though he requires assistance with meal preparation, which Laura Sage coordinates alongside home nursing visits. Current performance status is assessed as Eastern Cooperative Oncology Group (ECOG) grade 2, reflecting ambulation with a cane and capability of all self-care but restricted from strenuous activity.
  31| 
  32| PAST MEDICAL HISTORY:
  33| 1. Adenocarcinoma of the rectosigmoid colon, clinical Stage III (T3 N1 M0).
  34| 2. Iron deficiency anemia secondary to chronic gastrointestinal blood loss.
  35| 3. Essential hypertension for over 25 years.
  36| 4. Paroxysmal atrial fibrillation, anticoagulated.
  37| 5. Mild bilateral sensorineural hearing loss.
  38| 
  39| PAST SURGICAL HISTORY:
  40| 1. Diagnostic colonoscopy with rectosigmoid biopsies (February 2026).
  41| 2. Right inguinal herniorrhaphy with mesh repair (2011).
  42| 3. Bilateral cataract surgery (2018).
  43| 
  44| CURRENT MEDICATIONS:
  45| 1. Apixaban 2.5 mg PO BID (temporarily held prior to planned surgical evaluation).
  46| 2. Amlodipine 5 mg PO daily.
  47| 3. Lisinopril 10 mg PO daily.
  48| 4. Ferrous sulfate 325 mg PO daily (dispensed under outpatient Rx # 9481024).
  49| 5. Polyethylene glycol 17 g PO daily in water.
  50| 6. Cyanocobalamin (Vitamin B12) 1000 mcg PO daily.
  51| 
  52| PHYSICAL EXAMINATION:
  53| Vital Signs: BP 132/78 mmHg, pulse 74 bpm regular, respirations 16 breaths/min, temperature 98.4 F, SpO2 98% on room air. Weight 64.5 kg, height 170 cm, ECOG performance status 2.
  54| General: Frail but alert, engaging, pleasant gentleman in no acute distress.
  55| HEENT: Normocephalic, atraumatic. Conjunctivae show moderate pallor. Sclerae anicteric. Oropharynx pink and moist without mucositis or ulcerations.
  56| Cardiovascular: Regular rate and rhythm, normal S1 and S2. Soft 2/6 systolic flow murmur heard best over the aortic listening area. Peripheral pulses 2+ in radial and posterior tibial arteries bilaterally. No peripheral lower extremity edema.
  57| Pulmonary: Clear to auscultation bilaterally; vesicular breath sounds throughout all lung fields. No wheezes, crackles, or rhonchi.
  58| Abdomen: Scaphoid, soft, non-tender to light and deep palpation. No guarding, rigidity, or rebound tenderness. Well-healed right inguinal scar. No palpable hepatomegaly or splenomegaly. Normoactive bowel sounds.
  59| Rectal Exam: Deferred today in clinic in light of recent colonoscopy.
  60| Neurologic: Cranial nerves II-XII intact. Sensation intact to light touch. Motor strength 5/5 in upper extremities, 4+/5 in lower extremities. Gait steady with single-point cane.
  61| Lymphatics: No cervical, supraclavicular, axillary, or inguinal lymphadenopathy palpable.
  62| 
  63| LABORATORY REVIEW:
  64| Hemoglobin 8.6 g/dL (improved post oral iron), hematocrit 27.2%, MCV 74 fL, white blood cell count 5.8 x10^3/uL, platelet count 265 x10^3/uL. Serum ferritin 18 ng/mL, iron saturation 9%. Serum sodium 141 mEq/L, potassium 4.1 mEq/L, BUN 19 mg/dL, serum creatinine 1.0 mg/dL, eGFR 66 mL/min/1.73m2. Total bilirubin 0.6 mg/dL, alkaline phosphatase 72 U/L, AST 18 U/L, ALT 20 U/L, albumin 3.6 g/dL. Carcinoembryonic antigen (CEA) 6.4 ng/mL (moderately elevated).
  65| 
  66| ASSESSMENT AND MANAGEMENT PLAN:
  67| Marc Célestin de la Cour is an Age: 94 gentleman with newly diagnosed, non-metastatic clinical Stage III adenocarcinoma of the rectosigmoid junction who presents with symptomatic anemia and functional frailty. His case was formally discussed during today's multidisciplinary conference involving Babatunde Adeyemi, MD, Ngozi Okonkwo, MD, Chidubem Eze, MD, Olumide Adeleke, RN, and Laura M. Sage.
  68| 1. Surgical Oncology Referral:
  69| - Given the partially obstructing nature of the rectosigmoid lesion and ongoing bleeding, primary surgical resection remains the definitive local modality. Urgent consultation arranged with colorectal surgery to evaluate candidacy for laparoscopic versus robotic low anterior resection with total mesorectal excision.
  70| 2. Medical Oncology Consideration:
  71| - Discussion held regarding adjuvant chemotherapy in a patient of Age: 94. While standard adjuvant FOLFOX or CAPOX yields survival benefit in Stage III disease in younger populations, the substantial toxicity risk of oxaliplatin-induced sensory neuropathy and myelosuppression necessitates extreme caution. If surgery proceeds successfully, single-agent fluoropyrimidine monotherapy (capecitabine) or active surveillance with close imaging will be reconsidered postoperatively depending on final pathologic staging and performance status.
  72| 3. Supportive Care and Anemia Optimization:
  73| - Continue oral iron supplementation (dispensed under Rx # 9481024). Consider intravenous iron sucrose if oral tolerance wanes.
  74| - Palliative medicine consultation conducted today by Chidubem Eze, MD, focused on goal concordance, caregiver support for Ms. Sage, advance care planning, and symptom management.
  75| 4. Follow-up:
  76| - Re-evaluation in medical oncology clinic following surgical consultation in 2 weeks. Comprehensive notes and pathology uploaded to portal: https://portal.example.org/records/oncology-summary.
  77| 
  78| Electronic Signature:
  79| BABATUNDE ADEYEMI, MD
  80| Attending Physician, Medical Oncology
  81| Clearwater Medical Center
  82| Fellow Cosignature:
  83| Ngozi Okonkwo, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0202 ===
   1| PRIOR AUTHORIZATION REFILL TRIAGE NOTE
   2| Date: 11-14-2026
   3| Patient: Mr. Charles Stone
   4| Age: ninety-four years old
   5| Prescriber: Dr. Donald Fraser
   6| Authorized Representative: Ms. Page Stone (daughter)
   7| Callback Phone: 617–555–0184
   8| 
   9| Clinical Context:
  10| Telephone triage request received from patient's daughter, Ms. Page
  11| Stone, regarding coverage denial for apixaban (Eliquis) 5 mg PO BID.
  12| Mr. Stone is a ninety-four years old male with chronic nonvalvular atrial
  13| fibrillation and history of transient ischemic attack. Documentation from
  14| Dr. Donald Fraser confirms stable renal clearance (CrCl 44 mL/min). Payer
  15| mandates step therapy with warfarin sodium; however, records from 03-12-2026
  16| show Mr. Stone suffered severe coagulopathy on warfarin in 2024 with gross
  17| hematuria and labile INR values between 1.2 and 5.1.
  18| 
  19| Patient profile review indicates concurrent treatment for stage 3 chronic
  20| kidney disease, coronary artery disease status post percutaneous coronary
  21| intervention, and hypertension. Baseline serum creatinine is 1.24 mg/dL
  22| with potassium 4.6 mEq/L documented at last clinic visit. Caregiver
  23| emphasizes patient cannot afford out-of-pocket retail costs while awaiting
  24| coverage determination.
  25| 
  26| Current Orders:
  27| 1. Apixaban 5 mg PO BID #60, 30-day supply
  28| 2. Metoprolol succinate 25 mg PO daily #30
  29| 3. Lisinopril 5 mg PO daily #30
  30| 
  31| Intervention:
  32| Submitted urgent prior authorization redetermination appeal with clinical
  33| chart notes. Faxed clinical appeal packet directly to payer utilization
  34| management division. Dispensed 7-day emergency bridge supply of apixaban
  35| 5 mg PO BID to ensure continuity of care. Advised Ms. Page Stone of
  36| anticipated 48-hour payer review window.
  37| 
  38| Triage Pharmacist: Heather MacLeod, RPh
=== END DOCUMENT ===

=== DOCUMENT fd-0213 ===
   1| CALL LOG RECORDING - SPECIALTY CLINIC
   2| RECORDING ID: 7391 0482 19
   3| DATE: 18 Oct 2026
   4| FACILITY: Silver Lake Clinic
   5| COVERING PROVIDERS: Dr. Fox, Dr. Zhang Yong-Kang, Lin Wei-Chen, RN
   6| CALLER: Chen Xiao-Mei (daughter-in-law)
   7| PATIENT: Lương Văn Phát
   8| DOB: 12 Jan 1934
   9| AGE: 92-year-old male
  10| 
  11| [Audio Recording Transcript]
  12| 
  13| Lin Wei-Chen, RN: Silver Lake Clinic nursing line, this is Wei-Chen,
  14| how, um, how can I help you today?
  15| 
  16| Chen Xiao-Mei: Hello, yes, uh, good morning. I'm calling about my
  17| father-in-law, Mr. Lương Văn Phát. He, uh, he had a transcatheter
  18| aortic valve replacement about two weeks ago, and we're looking at
  19| his home care schedulign sheet, but we're confused about his
  20| warfarin dosgae.
  21| 
  22| Lin Wei-Chen, RN: Okay, let me bring up Mr. Phát's record. You said
  23| his name is Lương Văn Phát, DOB 12 Jan 1934?
  24| 
  25| Chen Xiao-Mei: Yes, that is correct. He is a 92-year-old gentleman, and
  26| he lives in San Jose with my husband and me.
  27| 
  28| Lin Wei-Chen, RN: Alright, I have his file right here. Can you verify
  29| his current home address for security?
  30| 
  31| Chen Xiao-Mei: It is 620 Forest Ridge Drive, San Jose, CA 95129. I also
  32| sent it on the patient portal earlier in lowercase as 620 forest ridge
  33| drive just in case you needed to update it.
  34| 
  35| Lin Wei-Chen, RN: Perfect, thank you. And what is your callback number?
  36| 
  37| Chen Xiao-Mei: You can reach me on my cell phone. It is, uh, let me read
  38| it slowly: four one five, five five five, zero one three six.
  39| 
  40| Lin Wei-Chen, RN: Thank you, let me read that back: four one five,
  41| five five five, zero one three six. I have it written in the intake
  42| form as 415–555–0136 with a direct tag to your profile. Now,
  43| regarding his warfarin, what did his discharge instructions say?
  44| 
  45| Chen Xiao-Mei: Well, uh, his discharge summary said warfarin 2.5 mg PO
  46| daily in the evening, but then Dr. Fox, who covered for Dr. Zhang over
  47| the weekend, told us after his lab draw that his INR was 1.6, which
  48| was, uh, which was subtherapeutic. The target range was 2.0 to 3.0
  49| for his valve. Dr. Fox wrote an updated prescription under NPI:
  50| 1942850192 for warfarin 5 mg PO on Mondays and Thursdays, and 2.5 mg
  51| on the other days. We just wanted to confirm if today, Monday, he
  52| should take the 5 mg."
  53| 
  54| Lin Wei-Chen, RN: Let me check the care team communication note from
  55| this morning. Yes, Dr. Fox and Dr. Zhang Yong-Kang both reviewed his
  56| recent transthoracic echocardiogram and that INR result. Dr. Fox noted
  57| that Mr. Lương should indeed take warfarin 5 mg tonight, and then have
  58| a repeat prothrombin time and INR drawn on Wednesday. Also, his chart
  59| mentions that his primary cardiologist, Dr. Zhang, signed off on the
  60| tapered adjustment. The attending list here shows Dr. Fox, Dr. Zhang
  61| Yong-Kang, and our clinical pharmacist all agreed on the plan.
  62| 
  63| Chen Xiao-Mei: Oh, that makes sense. We, we were just nervous because
  64| at 92 years old, any change in blood thinner makes us worry about
  65| bleeding or bruising. He had, uh, he had a tiny nosebleed yesterday,
  66| just a few drops, but it stopped right away when we pinched his nose.
  67| 
  68| Lin Wei-Chen, RN: Good, I'm glad it stopped quickly. Did he have any
  69| dark stools, coughing up blood, or sudden weakness?
  70| 
  71| Chen Xiao-Mei: No, nothing like that at all. His vitals this morning
  72| were blood pressure 134/78 mmHg, heart rate 72 bpm, oxygen saturation
  73| 98% on room air, and weight 61.2 kg. His congestive heart failure
  74| symptoms seem stable; no shortness of breath when lying flat.
  75| 
  76| Lin Wei-Chen, RN: Those vitals look very reassuring. For his
  77| follow-up, we have his next clinic appoitment scheduled with
  78| Dr. Zhang on Friday. Dr. Fox will also be covering the
  79| anticoagulation clinic that morning. In his chart, I've noted that
  80| caregiver C.X.M. called and confirmed the dose. If he has any active
  81| bleeding or dizziness, call us immediately or go to the nearest
  82| emergency room.
  83| 
  84| Chen Xiao-Mei: Thank you so much, Wei-Chen. That clarifies
  85| everything. We will give him the 5 mg dose tonight. Have a wonderful
  86| day.
  87| 
  88| Lin Wei-Chen, RN: You are very welcome, Mrs. Chen. Take care,
  89| goodbye.
  90| 
  91| [End of Call]
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.