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


=== DOCUMENT fd-0095 ===
   1| 8834219 AVERILL, WHITE
   2| Bramwell Memorial Hospital
   3| Discharge Summary
   4| DOB: January 8, 1932
   5| Admitted: 03/14/2026
   6| Account 4402917
   7| 
   8| White Averill is a 94-year-old man admitted after a ground-level fall with a
   9| left femoral neck fracture. He was discharged on the 18th of March 2026 to
  10| the home of his daughter, Mrs. Anahit Petrosyan, who is 68 and will provide
  11| meals and supervision. He has lived alone since his wife died. Osteoporosis
  12| was known. He also has atrial fibrillation, hypertension, and mild hearing
  13| loss. There is no dementia by his daughter's report, and he manages his own
  14| medicines with a weekly box.
  15| 
  16| Before the fall he was independent in bathing and dressing and walked in his
  17| building without a cane. The fall happened when he turned quickly in the
  18| kitchen. He did not lose consciousness and he did not hit his head. There
  19| was no chest pain and no palpitation beforehand. Home medicines also
  20| included a stool softener used only as needed and artificial tears. He has
  21| no drug allergy. He drank little in recent years and stopped tobacco as a
  22| young man. His daughter, Mrs. Anahit Petrosyan, manages the bills and was
  23| present for consent. She understands the signs of bleeding on apixaban and
  24| will watch the incision each day.
  25| 
  26| On arrival the left leg was shortened and externally rotated. He had pain
  27| with any motion at the hip and no sensory loss in the foot. Dorsalis pedis
  28| pulses were present. Temperature was 36.8 C, blood pressure 148/70 mmHg,
  29| heart rate 82 beats per minute and irregular, respiratory rate 16 breaths
  30| per minute, and oxygen saturation 96 percent on room air. Electrocardiogram
  31| showed atrial fibrillation with a controlled rate and no acute ST-segment
  32| change. Chest radiograph showed no infiltrate and no pleural effusion.
  33| Sodium was 136 mmol/L, potassium 4.0 mmol/L, and glucose 112 mg/dL. The
  34| international normalized ratio was 1.2. A urine dipstick was bland.
  35| 
  36| Radiographs of the pelvis and hip confirmed a displaced femoral neck
  37| fracture, and the implant choice was discussed with his daughter before he
  38| went to the operating room.
  39| 
  40| Dr. Eleanor Briggs of the orthopaedic service performed a cemented bipolar
  41| hemiarthroplasty on the day of admission.
  42| In the preoperative holding area the full consent was read aloud to White
  43| Averill and was also signed by his daughter. Spinal anesthesia was used.
  44| Estimated blood loss was 200 mL. A drain was not placed. He recieved
  45| cefazolin 2 g IV before the incision and two further doses at 8-hour
  46| intervals. Apixaban was held the morning of surgery and restarted on the
  47| first postoperative day once the dressing stayed dry. Metoprolol tartrate 25
  48| mg PO BID and lisinopril 10 mg PO daily were continued. A bladder catheter
  49| placed for the case was removed the next morning, and he voided.
  50| 
  51| Postoperative course. He stood with physical therapy on the first day and
  52| walked a short distance with a walker on the second. Pain was controlled with
  53| acetaminophen 650 mg PO every 6 hours and oxycodone 2.5 mg PO every 6 hours
  54| as needed. Hemoglobin fell from 12.4 g/dL to 9.8 g/dL and then held.
  55| Creatinine remained 1.1 mg/dL. He had one episode of transient confusion at
  56| night that cleared by morning and was felt to be postoperative, not a new
  57| stroke. No wound drainage occured. A seperate therapy note describes safe
  58| transfers with supervision. His daughter stayed each afternoon and practiced
  59| the hip precautions with him: no bending past a right angle, no crossing the
  60| legs, and no twisting to reach the nightstand.
  61| 
  62| Weight bearing was allowed as tolerated in the cemented bipolar implant.
  63| Occupational therapy fitted a sock aid and a reacher. The bed was kept low,
  64| night checks were limited, and his hearing aid stayed in place so that
  65| confusion would not be worsened by isolation. Bowel function returned with
  66| docusate and a dose of senna on the second evening. Appetite was fair. He
  67| ate more than half of his meals on the day before discharge. Venous
  68| thrombosis prophylaxis after the procedure was the resumed apixaban rather
  69| than an injection, which suited him because he had already been stable on
  70| that drug. The case manager arranged a walker for the daughter's home and
  71| confirmed the doorway would clear it. No skilled nursing placement was
  72| required.
  73| 
  74| Discharge condition and medicines.
  75| Apixaban 5 mg PO BID, resumed.
  76| Acetaminophen 650 mg PO every 6 hours for five days, then as needed.
  77| Oxycodone 2.5 mg PO every 6 hours as needed for pain, small supply.
  78| Docusate 100 mg PO BID.
  79| Calcium carbonate 500 mg PO BID with meals and cholecalciferol 1000 IU PO
  80| daily.
  81| Metoprolol tartrate 25 mg PO BID.
  82| Lisinopril 10 mg PO daily.
  83| A bowel regimen should be used while opioid doses continue.
  84| He tolerates a regular diet.
  85| 
  86| Follow-up. Staples or skin adhesive will be checked at the orthopaedic visit.
  87| Call for fever, calf swelling, chest pain, or a wound that opens. The
  88| daughter can reach the orthopaedic office at (415) 555-0142 and the
  89| after-hours line at 415.555.0176.
  90| Printed instructions are also at https://records.example.org/note/8834219.
  91| He will stay at 14 Sable Court, Unit 5, Red Hollow, MT 59777, which is Mrs.
  92| Anahit Petrosyan's home, until he is safe on stairs. A claim for the implant
  93| was filed under Claim number 66120488. Dr. Eleanor Briggs discussed weight
  94| bearing as tolerated and answered his questions on the day of discharge.
  95| 
  96| Signed,
  97| Eleanor Briggs, MD
  98| Orthopaedic Surgery
  99| Bramwell Memorial Hospital
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

=== DOCUMENT fd-0042 ===
   1| DISCHARGE SUMMARY
   2| St. Evander Medical Center
   3| 
   4| Patient: MELE KAHALE
   5| MRN: 5502814
   6| Encounter no. 7104-2281-63
   7| Admitted: 03/14/2026
   8| Discharged: Mar. 18, 2026
   9| Age: 54 years
  10| 
  11| Mele Kahale is a 54-year-old woman who was admitted to St. Evander Medical Center for acute calculous cholecystitis and underwent laparoscopic cholecystectomy with intraoperative cholangiogram. She was discharged home on Mar. 18, 2026 in the company of her husband, Mr. Calvin Breitbach, who is 57 and will stay with her through the first week. Biliary colic had been recurring since January 2026, with more constant right upper quadrant pain, nausea, and a fever on the day of admission.
  12| 
  13| Past medical history includes hypertension and symptomatic gastroesophageal reflux. She has had two vaginal deliveries and no prior abdominal surgery. She does not smoke. Alcohol use is a glass of wine on weekends. Home medicines on arrival were amlodipine and omeprazole, and she takes a multivitamin. There is no history of bleeding disorder, no adverse reaction to anesthesia, and no known drug allergy. Her mother had gallstones. She works at a desk and had been missing sleep because the pain woke her. Mr. Calvin Breitbach confirmed the fever at home and the poor oral intake on the morning of admission.
  14| 
  15| Dr. Helen Rice of the general surgery service performed the operation. Preoperative ultrasound showed gallstones, gallbladder wall thickening, and a positive sonographic Murphy sign, without bile duct dilatation. Laboratory studies on admission included a white blood cell count of 14.6 thousand per microliter, hemoglobin 13.1 g/dL, platelets 268 thousand per microliter, total bilirubin 1.1 mg/dL, alkaline phosphatase 118 U/L, AST 42 U/L, ALT 51 U/L, and lipase 28 U/L. Temperature was 38.3 C, blood pressure 132/74 mmHg, and heart rate 98 beats per minute. She received piperacillin-tazobactam 3.375 g IV before the incision and one further dose in the recovery area. Venous thromboembolism prophylaxis was sequential compression during the case and early walking afterward.
  16| 
  17| The procedure was a standard four-port laparoscopic cholecystectomy. The critical view of safety was obtained. Intraoperative cholangiogram showed free flow into the duodenum and no filling defect in the common bile duct. Estimated blood loss was 25 mL. Pathology returned as acute and chronic cholecystitis with cholelithiasis. She had postoperative nausea treated with ondansetron 4 mg IV once, then tolerated a low-fat diet. Pain was managed with acetaminophen and a few doses of oxycodone. She passed flatus, ambulated in the hall, and met discharge criteria. Nora Sharp, RN, reviewed incision care with her and with Mr. Calvin Breitbach before they left the unit.
  18| 
  19| On the morning after surgery she was afebrile, the white blood cell count had fallen to 9.8 thousand per microliter, and creatinine was 0.7 mg/dL. She walked in the hallway with standby assist and used the incentive spirometer. Incisions were clean and dry with plain skin adhesive. A clear liquid breakfast was advanced to toast at lunch. One dose of oxycodone 5 mg PO was given overnight for incisional pain rated 6 out of 10, and by the next day she rated pain 3 out of 10 with acetaminophen alone. She voided without difficulty. Discharge teaching covered the shoulder-tip ache that can follow laparoscopy, the expected timeline for bruising, and when constipation should prompt a call. Nora Sharp also checked that the prescription benefit question had been answered before the medications were sent out.
  20| 
  21| Discharge medications.
  22| Acetaminophen 650 mg PO every 6 hours as needed for pain.
  23| Oxycodone 5 mg PO every 6 hours as needed for severe pain, dispensed as a small supply. Rx 6629014.
  24| Docusate 100 mg PO BID while taking oxycodone.
  25| Ondansetron 4 mg PO every 8 hours as needed for nausea.
  26| Amlodipine 5 mg PO daily and omeprazole 20 mg PO daily, continued from home.
  27| No further intravenous antibiotics are needed.
  28| 
  29| Follow-up and wound care. She may shower and pat the incisions dry. She should call for fever, spreading redness, vomiting that will not stop, or jaundice. Activity is limited to walking and light household tasks. She should not drive while taking oxycodone. A postoperative visit with Dr. Helen Rice is planned about two weeks after discharge. Questions can be called to (503) 555-0168 x214 or sent to surgery.office@example.net. Written instructions are posted at https://portal.example.com/aftervisit/44021. She will recover at 418 Cedar Post Lane, Apt 12B, West Lantern, OR 97990.
  30| 
  31| Diet teaching asked her to keep meals small for several days and to hold greasy food until nausea is gone. She may use a heating pad on the back but not directly on the incisions. Return to desk work is reasonable in about one week if pain medicine is no longer required during the day. Heavy lifting, defined as more than ten pounds, should wait until the postoperative visit. Warning signs were written in plain language and she repeated them back, including fever above 101 degrees Fahrenheit, bile-colored drainage, and pain that suddenly worsens after a period of improvement. If the portal page is hard to open, the same sheets were printed and placed in her discharge folder. Mr. Calvin Breitbach has the surgical office number stored in his own phone. No drain was left in place. The cholangiogram images remain available to her primary clinician on request.
  32| 
  33| Her health plan was notified for the surgical authorization already obtained during this stay. Outside primary care may resume blood pressure checks at the usual interval. Diet may advance from low fat toward her usual meals as tolerated.
  34| 
  35| Signed,
  36| Helen Rice, MD
  37| NPI 1492758306
  38| General Surgery
  39| St. Evander Medical Center
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.