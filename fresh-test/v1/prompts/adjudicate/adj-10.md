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


=== DOCUMENT fd-0288 ===
   1| PRIOR AUTHORIZATION, TRANSCRIBED FROM FAX
   2| PATIENT: SAMIR BIN HABIB
   3| DATE: 3/4/26
   4| MAILING: PO Box 229, Helena, MT 59601
   5| PLAN ID (scanned): 44O8 l193 2O
   6| 
   7| Mrs. Helen Gray, the patient's wife, asked the pharmacy to resend a prior authorization for pregabalin after the fax from Copper Pine Pain Clinic came through too dark to read. The patient is a 54-year-old man with painful diabetic neuropathy and has already tried gabapentin, which left him too drowsy to drive to work. Pregabalin 75 mg by mouth twice daily is the requested dose, written by Dr. Walter Briggs. The scanned plan ID above replaces a cleaner card number we do not have; the clerk copied the characters as they printed, including the odd letters in the middle groups.
   8| 
   9| She says he has been waking at night with burning in both feet and that acetaminophen does nothing. Duloxetine 60 mg by mouth daily was stopped last month for nausea. The last A1c was high, and metformin 1000 mg by mouth twice daily is still on the profile, along with empagliflozin 10 mg by mouth every morning. No opioid is requested. The portion of the clinic note that we could read suports failure of gabapentin and of a topical lidocaine patch. I told her the health plan usually decides these requests within a few days, and that we will call when the reply is recieved. She confirmed the PO Box is still the best place for a paper denial if one is mailed.
  10| 
  11| Please do not seperate this request from the original fax image, because the plan ID is only as clear as that scan. Quantity requested is a thirty-day supply with two refills. Kidneys are said to be normal, so no renal adjustment was deemed neccesary. Counseling on dizziness and edema was offered, and she will pass it along.
=== END DOCUMENT ===
ITEMS FOR fd-0288:
D1 | line 7 | A: KEEP "painful diabetic neuropathy" | B: KEEP "diabetic neuropathy"

=== DOCUMENT fd-0290 ===
   1| Cedar Ridge Clinic
   2| Outpatient Progress Note
   3| 
   4| Patient: Cora J. Whitacre
   5| DOB: March 4, 1934
   6| Age: 92 y.o.
   7| Record no. 7394-2281-56
   8| Date of visit: March 4, 2026
   9| 
  10| Chief complaint
  11| Ankle swelling, shorter walking distance, and a bruise after a parking lot fall.
  12| 
  13| History of present illness
  14| She came in with her son Nolan Whitacre, who lives in the house with her and does the driving. Over about ten days the ankles have become puffier by evening and she gets short of breathe walking from the kitchen to the front porch. She denies chest pain, a new cough, waking orthopnea, and fever. Last month she slipped while climbing out of the sedan in the lot. She was not thrown clear, did not strike her head, and did not black out. The sedan, plate 8HWT392, had to be towed that afternoon because it would not start after the bump. A broad bruise rose over the left hip. She chose to rest at home instead of going to an emergency department. Her son has kept a morning weight log on the refrigerator.
  15| 
  16| Medications sit in a weekly box that he fills on Sundays. She missed two doses of the loop diuretic when that box was left on her daughter's counter. Appetite is fair, with a smaller breakfast than usual. There is no melena, no vomiting, and no pain with urination. Knee pain is occassional and she has been taking acetaminophen, which is the right choice. She was asked to keep NSAIDs off to the side, and she recieved that advice again today.
  17| 
  18| Past medical history
  19| Heart failure with reduced ejection fraction, last measured at 35 percent. Stage 3b chronic kidney disease. Hypothyroidism. Osteoarthritis of the knees. Cataract extraction years ago. No diabetes.
  20| 
  21| Medications
  22| Furosemide 40 mg by mouth daily
  23| Carvedilol 6.25 mg by mouth twice daily
  24| Lisinopril 5 mg by mouth daily
  25| Levothyroxine 88 mcg by mouth each morning
  26| Acetaminophen 650 mg by mouth three times daily as needed for pain
  27| 
  28| Allergies
  29| Rash after a sulfa antibiotic.
  30| 
  31| Social history
  32| She lives in a single-story house with her son. She worked as a school librarian and retired in her sixties. No tobacco.
  33| 
  34| Examination
  35| Blood pressure 138/76 mmHg, pulse 64 beats per minute, respirations 18 per minute, oxygen saturation 95 percent on room air, temperature 97.8 F, weight 61.4 kg, which is 1.8 kg above the last visit.
  36| She is alert and speaking in full sentences. Lungs have fine crackles at both bases without wheeze. Heart rhythm is regular, with no new murmur and no gallop. There is pitting edema to mid shin bilaterally. The left hip bruise is yellow-green and not tender when pressed. Gait with a cane is slow and steady.
  37| 
  38| Laboratory studies drawn this morning
  39| Sodium 136 mmol/L, potassium 4.6 mmol/L, chloride 102 mmol/L, bicarbonate 26 mmol/L, blood urea nitrogen 28 mg/dL, creatinine 1.48 mg/dL against a baseline near 1.3 mg/dL, BNP 640 pg/mL, hemoglobin 11.9 g/dL, TSH 2.4 mIU/L.
  40| 
  41| Assessment and plan
  42| 1. Volume overload on known HFrEF. The extra salt at a birthday lunch and the two missed diuretic doses are enough to explain the gain. Furosemide will increase to 40 mg by mouth twice daily for five days, then return to daily dosing if the morning weight is back at baseline. A basic metabolic panel is due in one week. She should call for a gain over 2 kg, dyspnea at rest, or new dizziness.
  43| 2. Chronic kidney disease, stage 3b. Creatinine is mildly above her usual number. Lisinopril stays on for now. Hold it if she is lightheaded or if the repeat creatinine climbs by more than 30 percent. No NSAIDs. A seperate renal clinic referral is not needed if the repeat panel is stable.
  44| 3. Contusion after a low-speed collision. History and exam do not suggest fracture or head injury, so radiographs are deferred. Acetaminophen is adequate. Her son will move the door mat and the boots so the path from the car is clear.
  45| 4. Hypothyroidism. TSH is in range on levothyroxine 88 mcg, and the dose stays the same.
  46| 
  47| The plan was reviewed slowly with her son, and a paper copy went home in her bag. She can also send a note through the portal at https://portal.example.org/phim/whitacre-msg.
  48| 
  49| Address confirmed at check-in:
  50| 418 Siltstone Court
  51| Bend, OR 97702
  52| Home phone (541) 555-0148. Her son's mobile is 541.555.0136.
  53| 
  54| Electronically signed
  55| Ruby Seo, MD
  56| Internal Medicine
  57| 
  58| Author: Ruby Seo, MD
=== END DOCUMENT ===
ITEMS FOR fd-0290:
D1 | line 19 | A: KEEP "ejection fraction, last measured at 35 percent" | B: KEEP "Heart failure with reduced ejection fraction"
D2 | line 35 | A: KEEP "oxygen saturation 95 percent" | B: KEEP "oxygen saturation 95 percent on room air"
D3 | line 35 | A: KEEP "weight 61.4 kg, which is 1.8 kg" | B: KEEP "weight 61.4 kg"
D4 | line 39 | A: KEEP "creatinine 1.48 mg/dL against a baseline near 1.3 mg/dL" | B: KEEP "creatinine 1.48 mg/dL"
K1 | line 16 | KEEP "NSAIDs"
K2 | line 38 | KEEP "Laboratory studies"
K3 | line 42 | KEEP "daily"
K4 | line 42 | KEEP "basic metabolic panel"
K5 | line 43 | KEEP "NSAIDs"
K6 | line 43 | KEEP "renal clinic"
K7 | line 44 | KEEP "fracture"
K8 | line 44 | KEEP "head injury"
K9 | line 44 | KEEP "radiographs"

=== DOCUMENT fd-0292 ===
   1| Red Cedar Clinic
   2| Outpatient Progress Note
   3| 
   4| Patient: RIVERS CALDERÓN
   5| DOB: 14 May 1922
   6| Date of Service: 4 Sep 2026
   7| 
   8| Chief complaint
   9| A slow gait, urinary hesitancy, and a check of blood pressure after a dizzy spell.
  10| 
  11| History of present illness
  12| Rivers Calderón is a 104-year-old man who still tells his own story if given a little time. Present at the visit: Hasmik Davtyan, his wife; Garen Avagyan, his brother; and Love O'Neill-McCarthy, MD. He felt lightheaded one morning last week when he stood up, sat back down, and did not fall. No chest pain, no palpitations, and no focal weakness came with it. Urinary hesitancy is longstanding, with a slower stream and no burning. The stream is weaker than it was five years ago, but he is not incontinent and he has no fever or back pain. He is up twice at night. Bowel habits are regular with prunes, and there is no rectal bleeding. Gait is slower over the past year, and he uses a cane in the hall. He has not driven in several years.
  13| 
  14| The old driver license D5521-8834-02 stays in the wallet Hasmik Davtyan brings, only so the desk can match him. Appetite is steady and weight has not dropped. He has no fever and no cough. Hearing loss makes a crowded room hard, so this visit was kept quiet and one person spoke at a time. He still enjoys the radio news and a slow walk to the mailbox with a hand on the rail.
  15| 
  16| A right cataract extraction years ago left him able to read large print. A forearm basal cell carcinoma was treated with excision, and the scar is soft. He acheived that recovery without complication.
  17| 
  18| Past medical history
  19| Hypertension. Osteoarthritis of both hips. Benign prostatic hyperplasia. Hearing loss. Remote open cholecystectomy. No diabetes, no stroke, and no Parkinson disease.
  20| 
  21| Medications
  22| Amlodipine 5 mg PO daily
  23| Tamsulosin 0.4 mg PO at bedtime
  24| Acetaminophen 650 mg PO BID PRN pain
  25| Artificial tears, one drop each eye BID
  26| No anticoagulant and no sedating antihistamine.
  27| 
  28| Allergies
  29| Sulfa antibiotics, rash.
  30| 
  31| Social history
  32| He lives with his wife in a single-level house. Garen Avagyan works in Alhambra and visits on Saturdays to walk the block with him. A grab bar is already in the bathroom. He does not smoke or drink.
  33| 
  34| Examination
  35| Blood pressure 138/64 mmHg seated and 130/62 mmHg standing, pulse 72 beats per minute, respirations 16 per minute, afebrile, weight 58.0 kg. Alert, hearing better on the right, speech clear. Lungs clear, heart regular, no murmur. Abdomen soft with an old cholecystectomy scar. Hips have limited rotation without warmth. Ankles are without edema. Prostate is not examined today. Gait with a cane is slow, base is acceptable, and he did not stumble. Neurologic exam shows no rest tremor and no rigidity. Cranial nerves are grossly intact aside from the hearing loss, and strength is 5 out of 5 in both arms. There is no facial droop to suggest Bell palsy.
  36| 
  37| Labs
  38| Creatinine 1.05 mg/dL, potassium 4.0 mmol/L, hemoglobin 13.1 g/dL, PSA 2.4 ng/mL, unchanged. Results are also listed at https://portal.example.org/records/calderon-labs for the family to read.
  39| 
  40| Assessment and plan
  41| 1. Hypertension with a brief postural symptom and no measured orthostasis of consequence. Amlodipine 5 mg PO daily stays, because the standing pressure is still adequate and the dizzy spell did not repeat. I advised him to pause at the edge of the bed for a few breaths before standing, which is the change most likely to prevent a fall. If lightheadedness returns, his wife will check a seated pressure and call rather than wait a month.
  42| 2. Benign prostatic hyperplasia with hesitancy. Tamsulosin 0.4 mg PO at bedtime continues. Tamsulosin can drop the pressure on standing, but today's numbers do not show a meaningful fall, so the dose stays, with a reminder to sit if he feels lightheaded. He will folow up sooner for inability to void, fever, or blood in the urine. PSA remains in a range that does not, by itself, push me toward a biopsy at his age, and he does not want cancer screening that would not change his care.
  43| 3. Osteoarthritis and fall risk. Acetaminophen 650 mg PO BID as needed is enough. No steroid injection and no procedure were offered today. The prior cataract extraction and the excision of basal cell carcinoma need no new action. The cholecystectomy scar is quiet and there is no hernia.
  44| 4. Medications were seperated into a morning cup and a bedtime cup by his wife so the tamsulosin is not taken at breakfast. Love O'Neill-McCarthy initialed the instruction as L.O. and reviewed the cups with both of them.
  45| 
  46| A shingles vaccine was discussed and he accepted it, to be given at the pharmacy visit already on his calendar. No new medicine was added, which is deliberate. Return in three months, or sooner for a fall, chest pain, inability to pass urine, or blood in the stool.
  47| 
  48| Address: 418 Wisteria Drive, Glendale, CA 91205.
  49| Phone (818) 555–0133.
  50| 
  51| Electronically signed
  52| Love O'Neill-McCarthy, MD
  53| Geriatrics
  54| 
  55| Author: Love O'Neill-McCarthy, MD
=== END DOCUMENT ===
ITEMS FOR fd-0292:
D1 | line 19 | A: KEEP "Osteoarthritis of both hips" | B: KEEP "Osteoarthritis"
K1 | line 14 | KEEP "Hearing loss"
K2 | line 25 | KEEP "each eye"
K3 | line 29 | KEEP "Sulfa antibiotics"
K4 | line 35 | KEEP "hearing loss"
K5 | line 43 | KEEP "hernia"
K6 | line 46 | KEEP "shingles vaccine"

=== DOCUMENT fd-0293 ===
   1| From: SÖLLNER, MAJA
   2| Sent: 2026-03-04
   3| Subject: methimazole question
   4| 
   5| hi, this is Maja von Söllner. i am 34. my husband wilson hart is reading over my shoulder because teh screen is small. i did not recieve the thyroid lab from 3/4/26. rose van der horst had said the TSH was low and to stay on methimazole 10 mg PO daily. i also take propranolol 20 mg PO BID for the tremor. stomache upset is mild. i have not missed a dose this week. sleep has been light and i feel warm in a cool room. i am not pregnant. a seperate question: the health plan form asks for member number 88412097, and they want the records sent by Fax: (617) 555-0144. please tell me if the dose changes. i felt flushed this morning. pulse on the home cuff was 108 beats per minute and blood pressure was 124/78 mmHg.
   6| 
   7| From: Rose van der Horst
   8| To: the patient
   9| 
  10| Thank you for the careful note. The draw from that morning is in. TSH 0.08 mIU/L, free T4 2.4 ng/dL, free T3 5.1 pg/mL, WBC 6.2 K/uL, absolute neutrophil count 3.1 K/uL, ALT 28 U/L, AST 24 U/L. Vitals recorded with the lab were blood pressure 118/74 mmHg, pulse 104 beats per minute, temperature 36.8 C, respiratory rate 16 breaths per minute, oxygen saturation 99% on room air, weight 63 kg. Diagnosis: Graves disease, still hyperthyroid. Continue methimazole 10 mg PO daily and propranolol 20 mg PO BID. Pieter Down, the covering pharmacist, will check the interaction list before we consider methimazole 15 mg PO daily. His review is a medication check only. It has nothing to do with a Down syndrome handout that was scanned into the media tab by mistake. That page belongs to a pediatric file and will be removed from this chart.
  11| 
  12| Recheck TSH, free T4, and a CBC in four weeks. Keep propranolol if the pulse stays over 90, and skip a propranolol dose only if the pulse drops under 60 or you feel faint. Dairy and antacids are fine with this pair, just not at the same minute as the methimazole if you can space them. We will use the member number and the fax number you already wrote, so you do not need to send them again. No thyroid uptake scan and no surgery are planned. Call the clinic the same day for fever, sore throat, mouth ulcers, or yellow eyes, because methimazole can lower the white count. Your husband may sit with you for the next portal reply if the print is hard to read on a phone.
=== END DOCUMENT ===
ITEMS FOR fd-0293:
D1 | line 5 | A: KEEP "pulse on the home cuff was 108 beats per minute" | B: KEEP "108 beats per minute" [unsure]
D2 | line 5 | A: KEEP "blood pressure was 124/78 mmHg" | B: KEEP "124/78 mmHg" [unsure]
K1 | line 10 | KEEP "Diagnosis" [labeler unsure]

=== DOCUMENT fd-0294 ===
   1| Discharge Summary
   2| Patient Name: BABATUNDE TAGBO
   3| Account Number: 6041 3829 15
   4| Date of Admission: Nov. 8, 2026
   5| Discharge Date: Nov. 12, 2026
   6| Primary Care Clinic: Pine Grove Rehabilitation Center
   7| Contact Telephone: (404) 555-0144
   8| Home Address: 482 Highland Avenue, Atlanta, GA 30312
   9| Emergency Contact: Aylin Demir (partner)
  10| Care Team: Dr. Miriam Feinstein (Attending), Dr. Ari Levin (Resident), Leah Goldfarb, RN (Primary Nurse)
  11| 
  12| Service: Internal Medicine
  13| Admission Diagnosis: Acute unprovoked deep vein thrombosis of the left lower extremity.
  14| Discharge Diagnosis: Left lower extremity deep vein thrombosis, resolved acute pain.
  15| 
  16| History of Present Illness:
  17| Mr. Tagbo is a 52-year-old male who presented with four days of progressive left calf swelling, erythema, and calf tenderness. In the emergency department, his Wells score for DVT was calculated at 3 points (high probability), prompting a lower extremity duplex ultrasound which demonstrated an occlusive thrombus in the left popliteal and posterior tibial veins. He denied chest pain, shortness of breath, or hemoptysis. He has no prior personal history of venous thromboembolism.
  18| 
  19| Hospital Course:
  20| Upon admission to the medical floor under the care of Dr. Miriam Feinstein and Dr. Ari Levin, the patient was initiated on enoxaparin 1 mg/kg subcutaneously every 12 hours as bridging therapy, alongside apixaban 10 mg PO BID. Over the subsequent 72 hours, his leg pain and edema improved significantly. Serial examinations revealed progressive softening of the gastrocnemius compartment with resolving erythema and decreasing circumference discrepancy between the lower extremities. Repeat duplex ultrasound confirmed non-propagation of the popliteal clot. He remained hemodynamically stable throughout the stay with blood pressure averaging 124/78 mmHg and heart rate 68 to 74 beats per minute. Ambulatory saturation remained 98% on room air. PT/INR and complete metabolic panel were unremarkable; baseline serum creatinine was 0.92 mg/dL. He toelrated oral intake and physical therapy without complication. Prior to discharge, apixaban was transitioned to maintenance planning, and he was provided with educational materials regarding signs of bleeding and pulmonary embolism. His partner, Aylin Demir, was present for nursing education delivered by Leah Goldfarb, RN, and confirmed understanding of the medication schedule and red-flag symptoms.
  21| 
  22| Discharge Medications:
  23| 1. Apixaban 10 mg oral tablet, take 1 tablet PO BID through Nov. 15, 2026, then decrease to 5 mg PO BID for 6 months. Rx 6912048-D.
  24| 2. Acetaminophen 500 mg oral tablet, take 1 to 2 tablets PO every 6 hours PRN mild calf ache.
  25| 
  26| Follow-Up Plan:
  27| The patient was dischaged in stable condition. He will follow up with Dr. Miriam Feinstein at Pine Grove Rehabilitation Center on Nov. 24, 2026, for repeat clinical assesment and therapeutic monitoring.
  28| 
  29| Miriam Feinstein, MD
  30| Attending Physician, Department of Medicine
=== END DOCUMENT ===
ITEMS FOR fd-0294:
D1 | line 13 | A: KEEP "Acute unprovoked deep vein thrombosis of the left lower extremity" | B: KEEP "deep vein thrombosis"
D2 | line 14 | A: KEEP "Left lower extremity deep vein thrombosis" | B: KEEP "deep vein thrombosis"
D3 | line 17 | A: KEEP "lower extremity duplex ultrasound" | B: KEEP "duplex ultrasound"
D4 | line 20 | A: KEEP "blood pressure averaging 124/78 mmHg" | B: KEEP "124/78 mmHg"
D5 | line 20 | A: KEEP "serum creatinine was 0.92 mg/dL" | B: KEEP "0.92 mg/dL"
K1 | line 17 | KEEP "occlusive thrombus in the left popliteal and posterior tibial veins"
K2 | line 20 | KEEP "Ambulatory saturation remained 98%"
K3 | line 23 | KEEP "1 tablet"
K4 | line 24 | KEEP "1 to 2 tablets"

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
ITEMS FOR fd-0299:
D1 | line 14 | A: KEEP "chronic essential hypertension" | B: KEEP "essential hypertension"
D2 | line 41 | A: KEEP "SpO2 99% on room air" | B: KEEP "SpO2 99%"
D3 | line 55 | A: KEEP "screening colonoscopy" | B: KEEP "colonoscopy"
K1 | line 11 | KEEP "Internal Medicine"
K2 | line 26 | KEEP "Home blood pressure measurements have averaged\n128/78 mmHg"
K3 | line 41 | KEEP "Vital Signs"
K4 | line 42 | KEEP "General"
K5 | line 43 | KEEP "HEENT"
K6 | line 44 | KEEP "Cardiovascular"
K7 | line 45 | KEEP "Lungs"
K8 | line 46 | KEEP "Abdomen"
K9 | line 47 | KEEP "Extremities"
K10 | line 48 | KEEP "Neurological"
K11 | line 53 | KEEP "Lipid panel"
K12 | line 55 | KEEP "Preventative Health"
K13 | line 57 | KEEP "Follow-Up"
K14 | line 57 | KEEP "metabolic panel"

Now output the result blocks.