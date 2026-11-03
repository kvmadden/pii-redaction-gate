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


=== DOCUMENT fd-0061 ===
   1| Liver and Biliary Center
   2| Surgical Pathology Report
   3| 
   4| Patient: Käthe Höfer
   5| DOB: 08/19/1964
   6| Age: 61 years
   7| SSN: 000-48-2291
   8| MRN: 5582104
   9| Accession: LBC-26-10934
  10| Specimen: liver, core biopsy
  11| Date of Service: March 4, 2026
  12| Ordering: Dr. Amos Whitaker
  13| Contact: Ms. Đặng Ngọc Quỳnh
  14| Address: PO Box 905, Quillhaven, WI 54481
  15| 
  16| CLINICAL HISTORY
  17| Woman with longstanding psoriasis treated with methotrexate. ALT and AST have
  18| risen over the past season. Her daughter, Ms. Đặng Ngọc Quỳnh, translates
  19| at visits and fills the pill box. There is no family history of cirrhosis.
  20| Viral hepatitis serologies were negative on outside labs that
  21| accompanied the referral.
  22| 
  23| GROSS DESCRIPTION
  24| Received in formalin are two cylindrical cores of tan-brown tissue,
  25| measuring 1.4 cm and 1.1 cm in length. The entire speciman is submitted
  26| in one cassette after standard processing.
  27| 
  28| MICROSCOPIC DESCRIPTION
  29| The cores show portal tracts with a mild lymphocytic infiltrate. The
  30| limiting plate is intact. No signifcant steatosis, no ballooning, and
  31| no Mallory-Denk bodies are seen. A trichrome stain shows portal fibrous
  32| expansion without bridging, consistant with METAVIR stage F1. Reticulin
  33| stain shows preserved hepatic-plate architecture. Bile ducts are present
  34| in the sampled portal tracts. An iron stain is negative. The PAS-D stain
  35| shows no diastase-resistant globules.
  36| 
  37| Methotrexate has been taken at 15 mg PO once weekly, with folic acid
  38| 1 mg PO daily on the other days. Labs drawn for this procedure were
  39| ALT 96 U/L, AST 71 U/L, alkaline phosphatase 88 U/L, total bilirubin
  40| 0.7 mg/dL, albumin 4.1 g/dL, INR 1.0, and platelets 242,000/uL.
  41| 
  42| DIAGNOSIS
  43| Liver, core biopsy: mild portal inflammation with early periportal
  44| fibrosis, METAVIR F1. There is no steatohepatitis and no malignancy.
  45| The findings are nonspecific and may be seen with methotrexate
  46| exposure. Clinical correlation is advised.
  47| 
  48| Interpreted by Prof. Lillian Crowe, gastrointestinal pathology.
  49| End of report.
=== END DOCUMENT ===
ITEMS FOR fd-0061:
K1 | line 2 | KEEP "Surgical Pathology Report"
K2 | line 29 | KEEP "lymphocytic infiltrate"
K3 | line 30 | KEEP "ballooning"
K4 | line 31 | KEEP "trichrome stain"
K5 | line 31 | KEEP "portal fibrous\nexpansion"
K6 | line 32 | KEEP "Reticulin\nstain"
K7 | line 34 | KEEP "iron stain"
K8 | line 34 | KEEP "PAS-D stain"
K9 | line 35 | KEEP "diastase-resistant globules"
K10 | line 43 | KEEP "mild portal inflammation with early periportal\nfibrosis"

=== DOCUMENT fd-0071 ===
   1| PHARMACY REFILL CALL NOTE
   2| Bramble Corner Pharmacy
   3| 
   4| Patient: BEATRICE TROWBRIDGE
   5| Date of Service: Mar. 4, 2026
   6| Member ID: 7394 2218 56
   7| Prescription number: Rx 4482196
   8| Callback: (541) 555-0162
   9| Home address: 2184 Cedar Hollow Lane, Grants Pass, OR 97526
  10| 
  11| The patient's son, Spyros Karageorgos, called the refill line this afternoon and asked us to prepare carbidopa-levodopa before the weekend. His mother has Parkinson disease and has been stable for months on carbidopa-levodopa 25-100 mg, two tablets by mouth three times daily, taken on an empty stomach when she can manage it. She also uses entacapone 200 mg by mouth with each carbidopa-levodopa dose, and docusate sodium 100 mg by mouth at bedtime for constipation, which has been her main nonmotor complaint. The prescriber of record is Dr. Calvin Henshaw. No dose change was requested.
  12| 
  13| He explained that a visiting cousin filled the weekly pill box and doubled the midday carbidopa-levodopa for several days, so the bottle is nearly empty with about a week still left on the usual schedule. There has been no fall, no new rest tremor, no hallucination, and no sudden sleepiness. She is still walking indoors with a single-point cane. Blood pressure at the last clinic visit was acceptable and she was told to rise slowly because of orthostasis, which she already does. I did not recieve a new prescription. This request is a refill of the existing order, and two refills remain on the carbidopa-levodopa. The entacapone has refills as well and was not requested today.
  14| 
  15| Trowbridge's profile shows a health plan that wants the member ID printed on the claim, and the son read the card slowly enough that I could check each group. He declined delivery. He will pick up at the counter tomorrow after 3 pm and will bring the old bottles so we can reconcile the count. I warned him that an early refill can reject, in which case we will call him at the callback number above rather than guessing at a seperate number. Counseling points reviewed with him: take the carbidopa-levodopa at the same times each day, keep the entacapone paired with it, do not stop it abruptly, and hold the dose and call the prescriber if she becomes markedly confused or rigid. Dietary protein can delay absorption, so the midday dose is better before lunch than in the middle of a heavy meal. He said she already follows that pattern most days, though he was not entierly sure about weekends.
  16| 
  17| I left a short note for the prescriber describing the pill-box mixup so the early refill is not mistaken for a dose increase. Please store the two bottles in seperate bags at pickup so they are not poured into one vial. The cousin is not to fill the box again. Quantity prepared will be a thirty-day supply of each requested medication, labeled in the usual way, with the patient name and the prescription number on every label.
  18| 
  19| Pharmacist on duty: Greta Feldmann, RPh
=== END DOCUMENT ===
ITEMS FOR fd-0071:
D1 | line 7 | A: ID "4482196" | B: ID "Rx 4482196" [unsure]
D2 | line 11 | A: KEEP "with each carbidopa-levodopa dose" [unsure] | B: KEEP "carbidopa-levodopa"
K1 | line 1 | KEEP "PHARMACY REFILL CALL NOTE"
K2 | line 11 | KEEP "two tablets"
K3 | line 11 | KEEP "constipation"

=== DOCUMENT fd-0079 ===
   1| OUTPATIENT HISTORY AND PHYSICAL
   2| Patient: Golnar Pirouzmehr
   3| MRN: 5830241
   4| DOB: 19 August 1931
   5| Age: 94
   6| Date of Service: March 18, 2026
   7| Author: Dorothy K. Ellsworth, MD
   8| Location: general internal medicine clinic
   9| 
  10| Mailing label on the scanned packet:
  11| 1480 CEDAR RIDGE DRIVE, APT 2B, HESTERVILLE, IA 50148
  12| 
  13| Chief complaint: Hospital follow-up after a fall.
  14| 
  15| History of present illness: Golnar Pirouzmehr is a 94-year-old woman with Parkinson disease who is seen with her daughter, Ruth Calder, fourteen days after a short admission to Quenby Memorial Hospital. She was admitted 4 March 2026 after a ground-level fall in the hallway at home. She did not lose consciousness. The Glasgow Coma Scale in the emergency unit was 15, and because she takes an anticoagulant, a noncontrast CT of the head was obtained and showed no hemorrhage and no mass. Radiographs of the pelvis and right hip showed no fracture. A skin tear on the right forearm was closed with adhesive strips. She was dry on arrival, received intravenous fluid, and went home after physical therapy cleared a supervised walk with her rolling walker. Ruth Calder, who is her daughter and healthcare proxy, has stayed overnight since discharge and describes no further fall, no chest pain, and no fever. Pirouzmehr's orthostatic symptoms are the main concern today: lightheadedness on standing, without syncope. Home blood pressures brought in by her daughter run lower upright than seated. Bowel movements have slowed since the stay. Pain at a prior L1 compression fracture, followed at Pain Clinic, is unchanged and is controlled with acetaminophen. Appetite is fair. She denies melena, dysuria, cough, and headache.
  16| 
  17| Past medical history: Parkinson disease diagnosed in 2017. Atrial fibrillation on anticoagulation. Osteoporosis with an L1 vertebral compression fracture after a remote fall, treated with vertebral augmentation. Hypertension. Hypothyroidism. Chronic constipation. Age-related hearing loss. Cataract extraction from both eyes. No diabetes. No known coronary disease. No prior hip fracture.
  18| 
  19| Allergies: No known drug allergy. Adhesive tape causes a mild rash. No contrast reaction during the recent CT.
  20| 
  21| Medications: carbidopa-levodopa 25/100 mg PO TID, on an empty stomach. apixaban 2.5 mg PO BID. amlodipine 5 mg PO daily. levothyroxine 50 mcg PO each morning. acetaminophen 650 mg PO q6h PRN pain. polyethylene glycol 17 g PO daily. calcium carbonate 500 mg PO BID with meals. cholecalciferol 1000 units PO daily. senna 8.6 mg PO qHS PRN constipation. A new prescription for polyethylene glycol was sent today under Rx 7701842 so the daughter can refill it without a delay. Her health plan member ID is 6104-8831-27.
  22| 
  23| Social history: Widowed and lives alone in a single-level apartment, with her daughter staying overnight since the fall. She worked as a seamstress. She does not use alcohol or tobacco. Her daughter can be reached at 27 Willow Lane, Hesterville, IA 50149, and by phone at (515) 555-0136. For a morning weight or blood pressure concern the clinic nurse line is 515.555.0188.
  24| 
  25| Family history: Parents died of old age. One sister had a stroke. No known Parkinson disease in the family. Her daughter is well.
  26| 
  27| Review of systems: No chest pain, no palpitations today, no hemoptysis, no melena, no dysuria, no new weakness, and no severe headache. Constipation as above. Hearing is poor without the right-sided aid. Mood is steady, and she is frustrated by the loss of confidence after the fall.
  28| 
  29| Physical examination: Alert and oriented, hypophonic speech, no distress. Blood pressure 148/72 mmHg seated and 118/64 mmHg standing at two minutes, with reproduced lightheadedness and no syncope. Heart rate 78 beats per minute seated and 86 standing, irregularly irregular. Temperature 36.4 C. Respiratory rate 16 breaths per minute. Oxygen saturation 97 percent on room air. Weight 52.4 kg. Height 155 cm. Hearing aid in the right ear. Dry mucosa. No jugular venous distention. Lungs clear. Heart irregular, no murmur, no gallop. Abdomen soft. No pretibial edema. Right forearm skin tear is closed and clean. Neurologic exam shows masked facies, resting tremor of the left hand, mild rigidity, and shuffling gait with a walker. Strength is symmetric. A healing skin tear does not limit use of the arm.
  30| 
  31| Studies and labs from the admission, reviewed today: sodium 136 mmol/L, potassium 4.1 mmol/L, urea nitrogen 22 mg/dL, creatinine 1.10 mg/dL, glucose 108 mg/dL, hemoglobin 11.8 g/dL, white cell count 6.1 thousand per microliter, platelets 190 thousand per microliter, TSH 3.2 mIU/L. Urinalysis was bland. Electrocardiogram showed atrial fibrillation with a ventricular rate in the 80s and no acute ischemic change. Noncontrast head CT and hip and pelvis radiographs were negative, as above. The scanned face sheet prints an old chart number as 88O21l46. After-visit instructions for the daughter are posted at https://portal.example.com/results/44921.
  32| 
  33| Pain Clinic is the specialty practice following her vertebral fracture. Office address:
  34| 410 North Market Street
  35| Hesterville, IA 50148
  36| 
  37| Assessment and plan: Parkinson disease with a recent ground-level fall and orthostatic hypotension. Continue carbidopa-levodopa 25/100 mg PO TID. Do not add an anticholinergic. Hold amlodipine 5 mg PO daily for now because the standing pressure was 118/64 mmHg with symptoms. Recheck seated and standing pressures with her daughter this week. She should rise slowly, wear compression stockings by day, and aim for about 1.5 liters of fluid if no swelling appears. Physical therapy continues, and the walker is to be used for every transfer. No nighttime sedation.
  38| 
  39| Atrial fibrillation. Continue apixaban 2.5 mg PO BID, reduced for age and for weight under 60 kg. Do not add aspirin. The ventricular rate is acceptable. Bleeding precautions were reviewed with her daughter.
  40| 
  41| Osteoporosis with a prior vertebral compression fracture. Acetaminophen 650 mg PO q6h PRN is sufficient. Avoid nonsteroidal anti-inflammatory drugs. Continue calcium carbonate 500 mg PO BID and cholecalciferol 1000 units PO daily. Further drug therapy for bone was deferred after a discussion of falls and frailty. Follow-up remains with the specialty practice named above.
  42| 
  43| Constipation. Continue polyethylene glycol 17 g PO daily and senna 8.6 mg PO qHS PRN if there is no stool by evening. Call for abdominal pain or vomiting.
  44| 
  45| Hypothyroidism. Continue levothyroxine 50 mcg PO each morning, separated from calcium by four hours. TSH is acceptable.
  46| 
  47| Forearm skin tear. Keep the strips dry and watch for redness, warmth, or drainage.
  48| 
  49| Return to the clinic in two weeks, sooner for a repeated fall, syncope, black stool, focal weakness, or poor intake that threatens the anticoagulant. Her daughter will bring a written pressure log.
  50| 
  51| Dorothy K. Ellsworth, MD
  52| Attending physician, general internal medicine
  53| Electronically signed
=== END DOCUMENT ===
ITEMS FOR fd-0079:
D1 | line 21 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D2 | line 21 | A: KEEP "qHS" ; KEEP "PRN" | B: KEEP "qHS PRN"
D3 | line 37 | A: KEEP "standing pressure was 118/64 mmHg" | B: KEEP "118/64 mmHg"
D4 | line 41 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D5 | line 43 | A: KEEP "qHS" ; KEEP "PRN" | B: KEEP "qHS PRN"
D6 | line 47 | A: KEEP "skin tear" | B: KEEP "Forearm skin tear"
K1 | line 15 | KEEP "ground-level fall"
K2 | line 15 | KEEP "intravenous"
K3 | line 15 | KEEP "physical therapy"
K4 | line 15 | KEEP "syncope"
K5 | line 21 | KEEP "each morning"
K6 | line 21 | KEEP "with meals"
K7 | line 21 | KEEP "constipation"
K8 | line 29 | KEEP "syncope"
K9 | line 31 | KEEP "Studies and labs from the admission, reviewed today"
K10 | line 31 | KEEP "Urinalysis"
K11 | line 37 | KEEP "ground-level fall"
K12 | line 37 | KEEP "1.5 liters"
K13 | line 37 | KEEP "Physical therapy"
K14 | line 37 | KEEP "sedation"
K15 | line 39 | KEEP "60 kg"
K16 | line 41 | KEEP "frailty"
K17 | line 45 | KEEP "each morning"
K18 | line 45 | KEEP "calcium"
K19 | line 45 | KEEP "TSH"
K20 | line 49 | KEEP "syncope"

=== DOCUMENT fd-0081 ===
   1| NURSE: Nurse line, uh, thanks for holding. I have the chart up. You're his daughter, is that right?
   2| DAUGHTER: Yes. I'm his daughter. I'm calling because the discharge packet from Outside Hospital is confusing and the blister pack the pharmacy sent does not match what he was taking in the hospital.
   3| NURSE: Okay. Let me, let me read what I have. He is a 78-year-old man. Parkinson disease was diagnosed in 2019. Type 2 diabetes mellitus has been on the list since 2021. He was treated for a COPD exacerbation and came home on a steroid taper. The covering pharmacist is on the other line if we need a dose check.
   4| DAUGHTER: The taper is the part I'm afraid I'll mess up. The bottle says prednisone 40/30/20/10 mg, but it doesn't say how many days.
   5| PHARMACIST: I can take that. Prednisone 40/30/20/10 mg PO daily means 40 mg PO daily for five days, then 30 mg PO daily for five days, then 20 mg PO daily for five days, then 10 mg PO daily for five days, then stop. Do not crush it. Give it with breakfast so the Parkinson doses stay on time.
   6| DAUGHTER: He also has a bottle of Lyrica and a box of Allegra. I don't know which is the pain one.
   7| PHARMACIST: Lyrica is the brand of pregabalin, 75 mg PO BID, for the neuropathic pain in his feet. Allegra is the brand of fexofenadine, 180 mg PO daily, for allergic rhinitis. Neither one replaces the steroid. He should keep carbidopa-levodopa 25/100 mg PO TID, metformin 1000 mg PO BID with meals, and atorvastatin 40 mg PO at bedtime. Albuterol 2 puffs INH q6h PRN for wheeze. Hold the albuterol if the heart rate is racing and call us.
   8| NURSE: Vitals this morning, from his daughter, were blood pressure 146/82 mmHg, heart rate 76 beats per minute, respiratory rate 18, temperature 37.4 C, and oxygen saturation 95 percent on room air. Last labs before discharge were white blood cell count 11.2 K/uL, creatinine 1.1 mg/dL, potassium 4.1 mmol/L, and hemoglobin A1c 7.8 percent.
   9| DAUGHTER: They said his sugar was high because of the prednisone. Um, does he need a new doctor for that?
  10| NURSE: The A1c is above goal, so there is a referral to Diabetes Center as a service, not a new primary clinician. For the shoulder that froze while he was in bed, the discharge summary also refers him to Pain Clinic.
  11| DAUGHTER: He fell getting off the commode. They did a head check. I can't remember the score.
  12| NURSE: Glasgow Coma Scale was 15. He was alert, no focal weakness beyond his baseline tremor, and no lumbar puncture was done. Chest radiograph showed a right lower lobe infiltrate, which fits the exacerbation. A swallowing evaluation cleared him for thin liquids. The fall did not earn him a scan of the neck.
  13| DAUGHTER: His shoulder still hurts when he tries to lift the spoon. They called it a frozen shoulder. Is that the same as the Parkinson stiffness?
  14| NURSE: No. The shoulder diagnosis is adhesive capsulitis. It is separate from the Parkinson disease rigidity. Pain Clinic will see him for that. We did not schedule a procedure. If they inject the joint later, that order will come from them.
  15| PHARMACIST: One warning on the taper. If his glucose stays over 250 mg/dL, or if he gets confused, call the nurse line before you give the next prednisone. Do not double a missed carbidopa-levodopa dose. If he misses one, give the next one at the usual time.
  16| DAUGHTER: He is 78, not frail in the way people assume, but I am 51 and I am the only one giving the pills. I think I have it. Forty, then thirty, then twenty, then ten.
  17| NURSE: That's right. Diagnoses to keep straight are COPD exacerbation, Parkinson disease, type 2 diabetes mellitus, allergic rhinitis, and adhesive capsulitis. Procedures already done are the chest radiograph and the swallowing evaluation. Nothing else is pending tonight. If the breathing gets harder, or the oxygen saturation falls under 88 percent, he needs an urgent visit, not a refill call.
  18| DAUGHTER: Uh, can the pharmacy deliver the corrected blister pack, or do I pick it up?
  19| PHARMACIST: The pharmacy can deliver on the address already in the chart. I do not need you to repeat it. If you would rather pick up, bring the Lyrica bottle and the Allegra box so we can see what was already opened.
  20| NURSE: Any chest pain, any one-sided weakness, or any new confusion, don't wait for the Pain Clinic visit. That's the whole list from me.
  21| DAUGHTER: Okay. Thank you. I think, I think that's everything.
=== END DOCUMENT ===
ITEMS FOR fd-0081:
D1 | line 12 | A: KEEP "Glasgow Coma Scale was 15" | B: KEEP "Glasgow Coma Scale"
D2 | line 15 | A: KEEP "glucose stays over 250 mg/dL" [unsure] | B: KEEP "250 mg/dL" [unsure]
D3 | line 17 | A: KEEP "oxygen saturation falls under 88 percent" [unsure] | B: KEEP "88 percent" [unsure]
K1 | line 5 | KEEP "with breakfast"
K2 | line 7 | KEEP "with meals"
K3 | line 10 | KEEP "A1c"
K4 | line 12 | KEEP "exacerbation"

=== DOCUMENT fd-0084 ===
   1| 77104928
   2| BANNISTER MEMORIAL HOSPITAL
   3| INPATIENT CARDIOLOGY CONSULTATION SERVICE
   4| FACILITY ADDRESS:
   5| 824 WAIALAE AVENUE, HONOLULU, HI 96816
   6| MAILING ADDRESS:
   7| PO Box 3914, Honolulu, HI 96815
   8| TELEPHONE: (808) 555-0163
   9| CONSULTATION FAX: (808) 555-0197
  10| EMAIL INQUIRIES: campbell.team at example dot org
  11| 
  12| PATIENT IDENTIFICATION AND REGISTRATION:
  13| Patient Name: Mr. Kelemete Luafutu
  14| Date of Birth: 05/22/1934
  15| Current Age: 92 y.o.
  16| Biological Sex: Male
  17| Social Security Number: 000-48-9124
  18| Insurance Plan Member ID: HPN-70491823-01
  19| Date of Consultation: October 14, 2026
  20| Date of Inpatient Admission: October 12th
  21| Date of Encounter Documentation: 10/14/26
  22| 
  23| CARE TEAM AND ENCOUNTER ATTENDEES:
  24| - Harrison Campbell, MD (Attending Cardiologist)
  25| - Megan Crawford, MD (Cardiology Clinical Fellow)
  26| - Elena de la Cruz, MD (Cardiac Electrophysiology Consultant)
  27| - Brenda Miller, RN (Inpatient Telemetry Unit Coordinator)
  28| - R.J.C., RN (Primary Bedside Telemetry Nurse)
  29| - Grace Takahashi (Daughter-in-law and Healthcare Proxy)
  30| 
  31| REASON FOR CONSULTATION:
  32| Inpatient cardiology consultation requested for medical management
  33| optimization and pacemaker interrogation in a 92 y.o. male admitted
  34| with acute decompensated heart failure with preserved ejection
  35| fraction (HFpEF) and volume overload.
  36| 
  37| HISTORY OF PRESENT ILLNESS:
  38| Mr. Kelemete Luafutu is a 92 y.o. gentleman with a past medical history
  39| significant for heart failure with preserved ejection fraction (NYHA
  40| Class II at baseline), persistent atrial fibrillation on apixaban,
  41| dual-chamber permanent pacemaker placed three years prior for sick sinus
  42| syndrome, stage 3b chronic kidney disease, and primary hypertension.
  43| He was admitted through the emergency department on October 12th after
  44| experiencing four days of progressive exertional dyspnea, orthopnea
  45| requiring elevation with three pillows, and bilateral lower extremity
  46| pitting edema extending up to the mid-calves.
  47| 
  48| Today, on hospital day 3 (10/14/26), the cardiology consultation team
  49| was requested to evaluate volume status, assist with diuretic transition,
  50| and verify permanent pacemaker parameters. The clinical fellow,
  51| Dr. Megan Crawford, and the attending physician, Dr. Harrison
  52| Campbell, conducted a bedside evaluation of his clinical progress.
  53| A detailed interval history and care plan were reviewed with Grace
  54| Takahashi, the patient's 54-year-old daughter-in-law and healthcare proxy,
  55| who was present at the bedside during rounds.
  56| 
  57| Mr. Luafutu reports marked symptomatic relief following forty-eight hours
  58| of scheduled intravenous diuresis. Resting dyspnea has resolved completely,
  59| and he is now able to lie flat with a single pillow without cough or air
  60| hunger. He denies angina, chest tightness, palpitations, presyncope,
  61| nausea, or fever. He notes that the dependent swelling in both lower
  62| extremities has resolved significantly. Over the past 48 hours, his
  63| cumulative net fluid balance is negative 2,850 mL, with an associated
  64| weight reduction of 2.9 kg (down from 87.0 kg at admission to 84.1 kg).
  65| 
  66| IMPLANTED CARDIAC DEVICE ASSESSMENT:
  67| Interrogation completed at bedside by Dr. Elena de la Cruz on
  68| October 14, 2026.
  69| Device Type: Dual-chamber permanent pacemaker
  70| Model: Medtronic Azure XT DR dual-chamber system
  71| Device Serial Number: PXR492018H
  72| Device Findings: Programmed mode DDDR, lower rate limit 60 bpm. Battery
  73| longevity remains robust at 7.4 years. Atrial and ventricular pacing
  74| thresholds, sensing amplitudes, and lead impedances are stable and within
  75| normal limits. Telemetry memory shows underlying atrial fibrillation
  76| with appropriate rate control and no sustained ventricular arrhythmias.
  77| 
  78| PAST MEDICAL HISTORY:
  79| 1. Heart failure with preserved ejection fraction (LVEF 55% to 60%).
  80| 2. Persistent atrial fibrillation, CHA2DS2-VASc score of 4.
  81| 3. Sick sinus syndrome status post dual-chamber pacemaker.
  82| 4. Chronic kidney disease stage 3b (baseline creatinine 1.3-1.5 mg/dL).
  83| 5. Essential hypertension, longstanding.
  84| 6. Dyslipidemia.
  85| 7. Bilateral primary knee osteoarthritis.
  86| 
  87| PAST SURGICAL HISTORY:
  88| 1. Dual-chamber permanent pacemaker implantation.
  89| 2. Cataract extraction with intraocular lens implant, left eye.
  90| 3. Remote appendectomy in youth, uncomplicated.
  91| 
  92| CURRENT MEDICATIONS:
  93| 1. Furosemide 40 mg IV twice daily (last intravenous dose at 06:00).
  94| 2. Sacubitril/valsartan (Entresto) 24/26 mg PO twice daily.
  95| 3. Carvedilol 6.25 mg PO twice daily with meals.
  96| 4. Apixaban 2.5 mg PO twice daily (dose-adjusted for age and renal function).
  97| 5. Atorvastatin 20 mg PO daily at bedtime.
  98| 6. Potassium chloride 20 mEq PO daily (held if serum potassium > 4.5).
  99| 
 100| ALLERGIES:
 101| Lisinopril (intractable dry cough; no history of angioedema).
 102| 
 103| SOCIAL HISTORY:
 104| Mr. Luafutu resides in a multi-generational home with his son and his
 105| daughter-in-law, Grace. Never used tobacco products. Denies alcohol or
 106| illicit substance use. His family provides daily assistance with meal
 107| preparation and transportation. Prior to admission, he ambulated with
 108| a walker and was independent in personal activities of daily living.
 109| 
 110| REVIEW OF SYSTEMS:
 111| Constitutional: Denies fever, chills, diaphoresis, or acute fatigue.
 112| Cardiovascular: Resolution of orthopnea; denies chest pressure or flutter.
 113| Respiratory: Denies cough, wheezing, hemoptysis, or resting dyspnea.
 114| Gastrointestinal: Appetite good; denies nausea, vomiting, or diarrhea.
 115| Genitourinary: Diuresing well; denies dysuria or gross hematuria.
 116| Musculoskeletal: Chronic bilateral knee stiffness without acute warmth.
 117| Neurological: Denies lightheadedness, syncope, focal weakness, or numbness.
 118| 
 119| PHYSICAL EXAMINATION:
 120| Vital Signs (Recorded at 09:30 on 10/14/26):
 121| Temperature: 98.4 F (36.9 C), oral
 122| Blood Pressure: 124/76 mmHg, right arm, seated
 123| Heart Rate: 68 beats per minute, regular
 124| Respiratory Rate: 17 breaths per minute, unlabored
 125| Pulse Oximetry: 97% on ambient room air
 126| Current Inpatient Weight: 84.1 kg (admission weight 87.0 kg)
 127| 
 128| General: Pleasant, alert 92 y.o. male resting comfortably in bed.
 129| Head and Neck: Normocephalic, atraumatic. Moist mucous membranes.
 130| Jugular venous pressure estimated at 6 cm H2O at 45 degrees, improved
 131| from 11 cm on admission. Carotid upstrokes symmetric without bruits.
 132| Cardiovascular: Pacemaker pocket in right prepectoral area clean and
 133| intact without erythema, tenderness, or fluctuance. Normal S1 and S2.
 134| Grade 2/6 soft systolic murmur at apex without axillary radiation. No S3,
 135| S4, or pericardial friction rub. Peripheral pulses 2+ bilaterally.
 136| Pulmonary: Good excursion. Lungs clear to auscultation bilaterally in
 137| anterior and mid zones, with faint end-inspiratory crackles at extreme
 138| bases, markedly improved from admission. No wheezing or rhonchi.
 139| Abdomen: Soft, non-tender, non-distended. Bowel sounds normoactive.
 140| Extremities: Trace pitting edema over bilateral medial malleoli; no calf
 141| tenderness, cords, or erythema. Capillary refill under 2 seconds.
 142| Neurological: Alert and oriented x4. Cranial nerves II-XII intact.
 143| Motor strength 5/5 upper extremities, 4+/5 lower extremities bilaterally.
 144| 
 145| LABORATORY AND DIAGNOSTIC DATA:
 146| Serum Chemistry and Hematology (October 14, 2026):
 147|   Sodium: 138 mEq/L (reference 135-145)
 148|   Potassium: 4.2 mEq/L (reference 3.5-5.0)
 149|   Chloride: 102 mEq/L (reference 98-107)
 150|   Bicarbonate: 25 mEq/L (reference 22-29)
 151|   Blood Urea Nitrogen (BUN): 24 mg/dL (reference 7-20)
 152|   Serum Creatinine: 1.34 mg/dL (baseline 1.30-1.50; admission was 1.58)
 153|   Estimated GFR: 52 mL/min/1.73m2 (reference > 60)
 154|   Serum Glucose: 114 mg/dL (reference 70-99)
 155|   B-type Natriuretic Peptide (BNP): 195 pg/mL (admission 680 pg/mL)
 156|   Hemoglobin: 12.2 g/dL | Hematocrit: 36.8% | WBC: 6.6 K/uL
 157|   Platelet Count: 204 K/uL
 158| 12-Lead ECG (10/14/26): Atrial paced rhythm at 68 bpm, narrow QRS
 159| duration (92 ms), non-specific ST-T changes, no acute ischemic shifts.
 160| 
 161| ASSESSMENT AND CLINICAL IMPRESSION:
 162| Mr. Kelemete Luafutu is a 92 y.o. male with chronic HFpEF, persistent
 163| atrial fibrillation on oral anticoagulation, sick sinus syndrome with
 164| dual-chamber pacemaker, and chronic kidney disease stage 3b, who has
 165| demonstrated substantial clinical improvement following diuresis for
 166| acute decompensation. He is now euvolemic with normalized JVP, minimal
 167| trace ankle edema, stable renal function, and significant BNP reduction.
 168| 
 169| DETAILED MANAGEMENT PLAN:
 170| 1. Heart Failure with Preserved Ejection Fraction (HFpEF):
 171|    - Discontinue IV furosemide today following negative balance of 2,850 mL.
 172|    - Transition to oral furosemide 40 mg PO every morning.
 173|    - Continue sacubitril/valsartan 24/26 mg PO twice daily.
 174|    - Maintain 2000 mg daily sodium restriction and 2-liter fluid limit.
 175| 2. Cardiac Rhythm and Device Management:
 176|    - Interrogation of Medtronic Azure pacemaker (SN: PXR492018H) confirms
 177|      normal lead parameters and sensing. Mode remains DDDR.
 178|    - Continue carvedilol 6.25 mg PO twice daily for rate control.
 179|    - Continue apixaban 2.5 mg PO twice daily for stroke prevention.
 180| 3. Renal Function and Monitoring:
 181|    - Serum creatinine improved to 1.34 mg/dL with potassium 4.2 mEq/L.
 182|    - Repeat basic metabolic panel tomorrow morning.
 183| 4. Post-Discharge Care Coordination:
 184|    - Anticipate hospital discharge within 24 to 48 hours.
 185|    - Referral placed to Cardiopulmonary Rehabilitation Center for monitored
 186|      outpatient conditioning and education.
 187|    - Outpatient medication delivery arranged through the regional pharmacy
 188|      depot servicing ZIP 96822.
 189|    - Plan reviewed with patient and daughter-in-law, Grace Takahashi.
 190| 
 191| Care Team Signatures:
 192| Megan Crawford, MD
 193| Cardiology Clinical Fellow, PGY-5
 194| Bannister Memorial Hospital
 195| 
 196| Attending Physician Attestation:
 197| I have evaluated Mr. Kelemete Luafutu on October 14, 2026, reviewed his
 198| device interrogation and laboratory data, and discussed the findings
 199| with Dr. Crawford and Grace Takahashi. I agree with the plan of care.
 200| 
 201| Harrison Campbell, MD, FACC
 202| Attending Cardiologist, Division of Cardiology
 203| Bannister Memorial Hospital
 204| Contact: campbell.team at example dot org
 205| Authenticated: 10/14/26 13:40 HST
=== END DOCUMENT ===
ITEMS FOR fd-0084:
D1 | line 34 | A: KEEP "acute decompensated heart failure with preserved ejection\nfraction (HFpEF)" | B: KEEP "acute decompensated heart failure with preserved ejection\nfraction" ; KEEP "HFpEF"
D2 | line 76 | A: KEEP "sustained ventricular arrhythmias" | B: KEEP "ventricular arrhythmias"
D3 | line 94 | A: KEEP "Sacubitril/valsartan (Entresto)" | B: KEEP "Sacubitril/valsartan" ; KEEP "Entresto"
D4 | line 104 | A: (nothing) | B: NAME "Luafutu"
D5 | line 121 | A: KEEP "Temperature: 98.4 F (36.9 C)" | B: KEEP "Temperature: 98.4 F"
D6 | line 162 | A: KEEP "chronic HFpEF" | B: KEEP "HFpEF"
D7 | line 170 | A: KEEP "Heart Failure with Preserved Ejection Fraction (HFpEF)" | B: KEEP "Heart Failure with Preserved Ejection Fraction" ; KEEP "HFpEF"
D8 | line 185 | A: KEEP "Cardiopulmonary Rehabilitation Center" | B: FACILITY "Cardiopulmonary Rehabilitation Center" [unsure]
K1 | line 12 | KEEP "PATIENT IDENTIFICATION AND REGISTRATION"
K2 | line 23 | KEEP "CARE TEAM AND ENCOUNTER ATTENDEES"
K3 | line 41 | KEEP "dual-chamber permanent pacemaker"
K4 | line 50 | KEEP "permanent pacemaker"
K5 | line 58 | KEEP "intravenous"
K6 | line 63 | KEEP "cumulative net fluid balance is negative 2,850 mL"
K7 | line 64 | KEEP "weight reduction of 2.9 kg"
K8 | line 64 | KEEP "87.0 kg"
K9 | line 64 | KEEP "84.1 kg"
K10 | line 69 | KEEP "Dual-chamber permanent pacemaker"
K11 | line 81 | KEEP "dual-chamber pacemaker"
K12 | line 95 | KEEP "with meals"
K13 | line 97 | KEEP "at bedtime"
K14 | line 98 | KEEP "serum potassium > 4.5"
K15 | line 111 | KEEP "Constitutional"
K16 | line 112 | KEEP "Cardiovascular"
K17 | line 113 | KEEP "Respiratory"
K18 | line 114 | KEEP "Gastrointestinal"
K19 | line 115 | KEEP "Genitourinary"
K20 | line 116 | KEEP "Musculoskeletal"
K21 | line 117 | KEEP "Neurological"
K22 | line 120 | KEEP "Vital Signs"
K23 | line 126 | KEEP "admission weight 87.0 kg"
K24 | line 128 | KEEP "General"
K25 | line 129 | KEEP "Head and Neck"
K26 | line 130 | KEEP "Jugular venous pressure estimated at 6 cm H2O"
K27 | line 131 | KEEP "11 cm"
K28 | line 132 | KEEP "Cardiovascular"
K29 | line 133 | KEEP "S1"
K30 | line 133 | KEEP "S2"
K31 | line 134 | KEEP "Grade 2/6 soft systolic murmur"
K32 | line 134 | KEEP "S3"
K33 | line 135 | KEEP "S4"
K34 | line 135 | KEEP "pericardial friction rub"
K35 | line 135 | KEEP "Peripheral pulses 2+"
K36 | line 136 | KEEP "Pulmonary"
K37 | line 139 | KEEP "Abdomen"
K38 | line 140 | KEEP "Extremities"
K39 | line 141 | KEEP "Capillary refill under 2 seconds"
K40 | line 142 | KEEP "Neurological"
K41 | line 142 | KEEP "Alert and oriented x4"
K42 | line 142 | KEEP "Cranial nerves II-XII intact"
K43 | line 143 | KEEP "Motor strength 5/5"
K44 | line 143 | KEEP "4+/5"
K45 | line 146 | KEEP "Serum Chemistry and Hematology"
K46 | line 147 | KEEP "135-145"
K47 | line 148 | KEEP "3.5-5.0"
K48 | line 149 | KEEP "98-107"
K49 | line 150 | KEEP "22-29"
K50 | line 151 | KEEP "7-20"
K51 | line 152 | KEEP "1.30-1.50"
K52 | line 152 | KEEP "1.58"
K53 | line 153 | KEEP "> 60"
K54 | line 154 | KEEP "70-99"
K55 | line 155 | KEEP "680 pg/mL"
K56 | line 158 | KEEP "Atrial paced rhythm at 68 bpm"
K57 | line 158 | KEEP "narrow QRS\nduration (92 ms)"
K58 | line 159 | KEEP "non-specific ST-T changes"
K59 | line 159 | KEEP "acute ischemic shifts"
K60 | line 163 | KEEP "oral"
K61 | line 164 | KEEP "dual-chamber pacemaker"
K62 | line 171 | KEEP "negative balance of 2,850 mL"
K63 | line 174 | KEEP "2000 mg"
K64 | line 174 | KEEP "daily"
K65 | line 174 | KEEP "2-liter"
K66 | line 175 | KEEP "Cardiac Rhythm and Device Management"
K67 | line 176 | KEEP "pacemaker"
K68 | line 180 | KEEP "Renal Function and Monitoring"
K69 | line 181 | KEEP "Serum creatinine improved to 1.34 mg/dL"
K70 | line 183 | KEEP "Post-Discharge Care Coordination"
K71 | line 191 | KEEP "Care Team Signatures"
K72 | line 196 | KEEP "Attending Physician Attestation"
K73 | line 198 | KEEP "device interrogation"
K74 | line 202 | KEEP "Division of Cardiology"

=== DOCUMENT fd-0090 ===
   1| CLINICAL PROGRESS NOTE
   2| Date of Service: 03-18-2026
   3| PATIENT: WURAL, SINAN
   4| DOB: 05-12-1934
   5| Age: ninety-one years old
   6| Account Number: AC-8402917
   7| Address: 1428 Kapiolani Blvd, Apt 6C, Honolulu, HI 96814
   8| Telephone: (808) 555-0142 ext. 312
   9| Attending Physician: TALIA MALIMALI, MD
  10| 
  11| SUBJECTIVE:
  12| Mr. Sinan Wural is a ninety-one years old gentleman with a documented history of Parkinson disease, complete heart block status-post dual-chamber pacemaker placement, essential hypertension, and chronic kidney disease stage 3a who presents for scheduled outpatient geriatric follow-up. The patient is accompanied today by his daughter-in-law, Mrs. Maeve O'Brien-Cleary, who provides supportive collateral history. Mrs. O'Brien-Cleary notes that over the past month, Mr. Wural has experienced increased resting tremors in his right hand and mild freezing episodes when initiating ambulation down hallways. He has had no syncope, palpitations, chest pressure, orthopnea, or falls. Pacemaker interrogation was performed last week; device serial number PXC901842 showed 99% atrial pacing, 2% ventricular pacing, and battery longevity estimated at 6.4 years with normal lead impedance. Appetite is fair. Bowel habits are maintained on scheduled docusate.
  13| 
  14| CURRENT MEDICATIONS:
  15| 1. Carbidopa-levodopa 25/100 mg PO TID.
  16| 2. Amlodipine 5 mg PO daily.
  17| 3. Atorvastatin 20 mg PO at bedtime.
  18| 4. Polyethylene glycol 17 g PO daily PRN constipation.
  19| 
  20| PHYSICAL EXAMINATION:
  21| Vitals: BP 128/76 mmHg, pulse 70 bpm regular (paced), respirations 16 /min, temperature 98.1 F, SpO2 97% on room air. Weight 68.2 kg.
  22| General: Pleasant, frail elderly male in no acute distress, alert and oriented x 3.
  23| HEENT: Normocephalic, atraumatic. Extraocular movements intact without nystagmus. Mild facial masking consistent with Parkinson disease.
  24| Cardiovascular: Regular rate and rhythm, normal S1 and S2, crisp pacing clicks, no murmurs.
  25| Pulmonary: Lungs clear to auculatation bilaterally; no crackles or wheezes.
  26| Abdomen: Soft, non-tender, non-
  27| distended. Bowel sounds normoactive.
  28| Neurological: Cranial nerves II-XII grossly intact. Motor strength 5/5 bilaterally in upper and lower extremities with mild cogwheel rigidity elicited at the right wrist and right elbow. Moderate resting pill-rolling tremor in right hand that suppresses with intentional movement. Rapid alternating movements mildly slowed on the right. Bilatral patellar reflexes 1+. Gait is moderately shuffling with reduced right arm swing, but patient turns without loss of balance using a four-wheeled rolling walker.
  29| Skin: Warm, dry. Pacemaker site in left prepectoral region is clean, dry, and intact with no erythema, tenderness, or erosion.
  30| 
  31| ASSESSMENT AND PLAN:
  32| Sinan Wural is a ninety-one years old male with Parkinson disease and cardiac pacemaker, presenting with progression of motor symptoms.
  33| 1. Parkinson disease: Motor fluctuations with prominent tremor and freezing episodes. Will increase carbidopa-levodopa from 25/100 mg TID to one and a half tablets (37.5/150 mg) PO TID. Physical therapy referral submited for gait retraining and balance maintenance.
  34| 2. Pacemaker status: Device PXC901842 operating satisfactorily with stable parameters. Continue annual cardiology follow-up.
  35| 3. Follow-up: Recheck in geriatric clinic in six weeks. Mrs. O'Brien-Cleary was instructed to contact our office if freezing worsens or dizziness develops.
  36| 
  37| Provider Signature:
  38| TALIA MALIMALI, MD
  39| Attending Geriatrician
  40| Staff Fellow: Dr. Keanu Kalama
=== END DOCUMENT ===
ITEMS FOR fd-0090:
D1 | line 12 | A: RELATIVE "O'Brien-Cleary" | B: (nothing)
D2 | line 12 | A: NAME "Wural" | B: (nothing)
K1 | line 1 | KEEP "CLINICAL PROGRESS NOTE"
K2 | line 12 | KEEP "Pacemaker interrogation"
K3 | line 12 | KEEP "99% atrial pacing"
K4 | line 12 | KEEP "2% ventricular pacing"
K5 | line 12 | KEEP "battery longevity estimated at 6.4 years"
K6 | line 12 | KEEP "normal lead impedance"
K7 | line 22 | KEEP "General"
K8 | line 23 | KEEP "HEENT"
K9 | line 24 | KEEP "Cardiovascular"
K10 | line 25 | KEEP "Pulmonary"
K11 | line 26 | KEEP "Abdomen"
K12 | line 28 | KEEP "Neurological"
K13 | line 29 | KEEP "Skin"
K14 | line 33 | KEEP "one and a half tablets"
K15 | line 33 | KEEP "gait retraining"
K16 | line 34 | KEEP "Pacemaker status"
K17 | line 35 | KEEP "Follow-up"

=== DOCUMENT fd-0093 ===
   1| Round Hill Clinic
   2| History and Physical
   3| 
   4| Patient: Maïmouna Haba
   5| Age: 94
   6| MRN: 6104-8831-27
   7| Date of Service: 03/18/2026
   8| Claim number 8830214461
   9| 
  10| Chief complaint
  11| Dyspnea on exertion, leg swelling, and a medicine review with her daughter.
  12| 
  13| History of present illness
  14| Maïmouna Haba comes in with her daughter, Mrs. Ivy Langford, who sets up the pill box and keeps the pacemaker wallet card in a kitchen drawer. Over three weeks she has needed one pause on the short walk from the bedroom to the kitchen, and she now sleeps on two pillows. She has not had chest pain, noticed palpitations, fever, or a cough that brings up sputum. The home scale is up about four pounds, and supper portions are smaller than they were last month. She does not wake gasping, and she has not fainted.
  15| 
  16| On the 4th of July she was a belted passenger in a low-speed lot collision. She did not hit her head and did not lose consciousness. The sedan would not restart and was towed, and the plate she remembered is 7QRM218. Bruising over the hip and the chest wall faded, and she gave up driving after that day. She has no pain today that she links to the collision.
  17| 
  18| A dual-chamber pacemaker was placed for sick sinus syndrome on Mar. 11, 2024. She does not know her pacing thresholds. The wallet card lists generator serial AX9044182. The pocket does not twitch, and the old incision is flat and pale. Interrogation is due this spring, and her daughter will drive her when the device clinic calls.
  19| 
  20| Mrs. Ivy Langford lives in Calders Ferry and stays in the apartment three nights a week. Ms. June Adeyemi at the front desk changed the refill pharmacy to Willow Lane Pharmacy so bottles are not split between shops. She initialed the medication review as J.A. before I came in.
  21| 
  22| Past medical history
  23| Sick sinus syndrome status post dual-chamber pacemaker. Heart failure with preserved ejection fraction, last ejection fraction 60 percent. Stage 3b chronic kidney disease. Hypertension. Osteoarthritis of the knees and the right hip. Hypothyroidism. Remote cholecystectomy. No diabetes and no prior stroke.
  24| 
  25| Medications
  26| Apixaban 2.5 mg PO BID
  27| Metoprolol succinate 50 mg PO daily
  28| Furosemide 20 mg PO daily
  29| Lisinopril 2.5 mg PO daily
  30| Levothyroxine 75 mcg PO each morning
  31| Acetaminophen 650 mg PO TID PRN pain
  32| Cholecalciferol 1000 units PO daily
  33| 
  34| Allergies
  35| Penicillin caused a rash in childhood, with no airway swelling.
  36| 
  37| Family history
  38| Her mother died of a stroke in late life, and her father died of pneumonia after a fracture. Her daughter is in good health. There is no known bleeding disorder in the family.
  39| 
  40| Social history
  41| She lives in a ground-floor apartment and worked for years as a seamstress before retiring. She does not smoke and has not taken alcohol in many years. Walking is indoors, with a walker for the hall and the ramp. A neighbor sits with her on nights when her daughter is away. She reads with glasses and has not fallen inside the apartment this season.
  42| 
  43| Review of systems
  44| General: fatigue with the dyspnea, no fever and no night sweats. Eyes and ears: no new change in vision and no spinning vertigo. Cardiac and respiratory: as in the present illness, no wheeze. Gastrointestinal: mild constipation, no black stool, no vomiting. Urinary: no burning and no new incontinence. Neurologic: no focal weakness and no new confusion. Mood: frustrated by the limits, not hopeless, and she still enjoys radio in the afternoon. Skin: no new rash around the pacemaker pocket.
  45| 
  46| Examination
  47| Blood pressure 146/72 mmHg, pulse 68 beats per minute and regular, respirations 18 per minute, oxygen saturation 95 percent on room air, temperature 97.9 F, weight 52.4 kg.
  48| She is frail, alert, and oriented to person, place, and year. Mucosa is moist and speech is clear. Jugular venous pressure is about 8 cm of water. Lungs have crackles at both bases without wheeze. The heart is regular, with a soft systolic murmur at the upper sternal border that her daughter says is old. The abdomen is soft, with a cholecystectomy scar and no tenderness. The pacemaker pocket on the left upper chest is flat, without redness or warmth. There is pitting edema to the mid shins. Knees are bony without a warm effusion. Face is symmetric, without the droop of Bell palsy. No pill-rolling tremor of Parkinson disease. Gait with the walker is slow, and the turn is steady. Mood is appropriate and insight is intact.
  49| 
  50| Labs and studies
  51| Basic metabolic panel this morning: sodium 138 mmol/L, potassium 4.3 mmol/L, creatinine 1.28 mg/dL against a baseline near 1.2 mg/dL, blood urea nitrogen 24 mg/dL, glucose 96 mg/dL. Hemoglobin is 12.4 g/dL. TSH was 3.1 mIU/L last autumn and was not repeated today. The electrocardiogram shows a paced rhythm with capture. A chest radiograph was not repeated, because the weight and the lung exam already support volume overload.
  52| 
  53| Assessment and plan
  54| 1. Volume overload on a background of heart failure with preserved ejection fraction. Furosemide will increase from 20 mg PO daily to 40 mg PO daily for five days, then return to 20 mg PO daily if the morning weight is back to her usual number. She should call for a gain over 2 kg, dyspnea at rest, or dizziness. Creatinine and potassium will be rechecked in one week.
  55| 2. Anticoagulation. Two apixaban dose-reduction factors are present, age and weight at 52.4 kg, while creatinine stays under 1.5 mg/dL, so the dose remains apixaban 2.5 mg PO BID. There has been no fall in the apartment this season. Continue the same dose, and hold it for black stool, a nosebleed that will not stop, or any strike to the head. The brand name Eliquis is what the bottle says, and the daughter knows that name.
  56| 3. Pacemaker follow-up. The pocket looks quiet and there is no hiccup at rest. Interrogation will be scheduled with the device clinic rather than forced into this visit. The serial from the card was copied into today's note so the clinic can match the generator.
  57| 4. Blood pressure. Systolic pressure is still above the goal I would like, but I will not raise lisinopril on the same day the diuretic changes, with creatinine already a little above baseline. Recheck the number with the lab draw.
  58| 5. Osteoarthritis and constipation. Acetaminophen may continue. Ibuprofen was discussed again and set aside because of apixaban and the kidneys. Polyethylene glycol 17 g PO daily as needed, one cap in water, was added for constipation. A physical therapy referral can wait unless the walker starts to feel unsafe on the ramp.
  59| 6. Teaching and follow-up. Her daughter repeated the furosemide change, wich is the teach-back I wanted. She recieved a written schedule. A seperate pill box for the five higher-dose days was marked with tape.
  60| 
  61| Contacts confirmed by her daughter:
  62| 1844 BIRCH LANE APT 3B
  63| GREYSTONE, WI 53599
  64| Phone (414) 555-0162
  65| Fax (414) 555-0108
  66| Email m.haba@example.com
  67| 
  68| Electronically signed by Dr. Tosin Balogun
  69| Internal Medicine
  70| 
  71| Author: Dr. Tosin Balogun
=== END DOCUMENT ===
ITEMS FOR fd-0093:
D1 | line 23 | A: KEEP "Stage 3b chronic kidney disease" | B: KEEP "chronic kidney disease"
D2 | line 23 | A: KEEP "Osteoarthritis of the knees and the right hip" | B: KEEP "Osteoarthritis"
D3 | line 47 | A: KEEP "oxygen saturation 95 percent on room air" | B: KEEP "oxygen saturation 95 percent"
K1 | line 11 | KEEP "Dyspnea on exertion"
K2 | line 11 | KEEP "leg swelling"
K3 | line 11 | KEEP "medicine review"
K4 | line 14 | KEEP "pacemaker"
K5 | line 14 | KEEP "four pounds"
K6 | line 18 | KEEP "dual-chamber pacemaker"
K7 | line 18 | KEEP "Interrogation"
K8 | line 20 | KEEP "medication review"
K9 | line 23 | KEEP "dual-chamber pacemaker"
K10 | line 23 | KEEP "ejection fraction 60 percent"
K11 | line 35 | KEEP "rash"
K12 | line 35 | KEEP "airway swelling"
K13 | line 38 | KEEP "fracture"
K14 | line 38 | KEEP "bleeding disorder"
K15 | line 44 | KEEP "General"
K16 | line 44 | KEEP "Eyes and ears"
K17 | line 44 | KEEP "Cardiac and respiratory"
K18 | line 44 | KEEP "Gastrointestinal"
K19 | line 44 | KEEP "constipation"
K20 | line 44 | KEEP "Urinary"
K21 | line 44 | KEEP "Neurologic"
K22 | line 44 | KEEP "Mood"
K23 | line 44 | KEEP "Skin"
K24 | line 44 | KEEP "rash"
K25 | line 44 | KEEP "pacemaker"
K26 | line 48 | KEEP "oriented to person, place, and year"
K27 | line 48 | KEEP "Jugular venous pressure is about 8 cm of water"
K28 | line 48 | KEEP "pacemaker"
K29 | line 48 | KEEP "pitting edema"
K30 | line 48 | KEEP "pill-rolling tremor"
K31 | line 51 | KEEP "Basic metabolic panel"
K32 | line 51 | KEEP "1.2 mg/dL"
K33 | line 51 | KEEP "paced rhythm with capture"
K34 | line 54 | KEEP "2 kg"
K35 | line 55 | KEEP "Anticoagulation"
K36 | line 55 | KEEP "52.4 kg"
K37 | line 55 | KEEP "creatinine stays under 1.5 mg/dL"
K38 | line 56 | KEEP "Pacemaker follow-up"
K39 | line 57 | KEEP "Blood pressure"
K40 | line 57 | KEEP "Systolic pressure"
K41 | line 58 | KEEP "constipation"
K42 | line 58 | KEEP "constipation"
K43 | line 58 | KEEP "physical therapy"
K44 | line 59 | KEEP "Teaching and follow-up"

=== DOCUMENT fd-0104 ===
   1| VALLEY DIGESTIVE HEALTH LABORATORY
   2| ENDOSCOPY AND PATHOLOGY BIOPSY REPORT
   3| 
   4| PATIENT: Mrs. Zehra Zorlu
   5| AGE/SEX: 91F
   6| ACCESSION: ACC-2026-44109
   7| DATE OF SERVICE: 09-14-2026
   8| ORDERING PHYSICIAN: Dr. Samuel Hawthorne
   9| EMERGENCY CONTACT: Arthur Crohn (nephew)
  10| CONTACT PHONE: (312) 555–0183
  11| 
  12| SPECIMEN:
  13| Multiple mucosal biopsies from terminal ileum and ascending colon.
  14| 
  15| CLINICAL HISTORY:
  16| The patient is a 91F evaluated for recurrent watery diarrhea and iron
  17| deficiency anemia. Her past medical history is negative for Crohn disease,
  18| celiac sprue, or ulcerative colitis. Outpatient care coordinated with her
  19| nephew Arthur Crohn.
  20| 
  21| CURRENT MEDICATIONS:
  22| 1. mesalamine 800 mg PO TID
  23| 2. budesonide 3 mg PO TID
  24| 3. ferrous sulfate 325 mg PO daily
  25| 
  26| GROSS AND MICROSCOPIC FINDINGS:
  27| Specimen consists of four fragments of tan mucosa measuring 0.2 to 0.4 cm.
  28| Histologic sections from the terminal ileum demostrates intact villous
  29| architecture with mild lamina propria edema. Ascending colon sections
  30| show focal mucosal erythma without crypt architectural distortion,
  31| crypt abscesses, or non-necrotizing granulomas. There is no evidence of
  32| active ileitis, Crohn disease, or microscopic colitis.
  33| 
  34| DIAGNOSIS:
  35| Terminal ileum and colon, mucosal biopsies:
  36| Mild non-specific chronic inflamation; negative for Crohn disease.
  37| 
  38| Reviewed by:
  39| Dr. Samuel Hawthorne
  40| Valley Digestive Health Laboratory
=== END DOCUMENT ===
ITEMS FOR fd-0104:
D1 | line 1 | A: (nothing) | B: FACILITY "VALLEY DIGESTIVE HEALTH LABORATORY"
D2 | line 32 | A: KEEP "active ileitis" | B: KEEP "ileitis"
K1 | line 2 | KEEP "ENDOSCOPY AND PATHOLOGY BIOPSY REPORT"
K2 | line 16 | KEEP "recurrent watery diarrhea"
K3 | line 36 | KEEP "Mild non-specific chronic inflamation"

=== DOCUMENT fd-0106 ===
   1| 88301942
   2| ST. ANSELM REGIONAL MEDICAL CENTER
   3| OUTPATIENT GERIATRIC MEDICINE CLINIC
   4| 4820 Highland Terrace, Suite 300, Minneapolis, MN 55416
   5| Telephone: (612) 555-0144 | Direct: 612.555.0182
   6| Patient Portal: https://portal.example.org/records/patient-access
   7| 
   8| ENCOUNTER DOCUMENTATION: CLINICAL PROGRESS NOTE
   9| PATIENT: VON LINDEMANN, JÜRGEN
  10| DOB: 03/18/1932
  11| AGE: 94-year-old
  12| GENDER: Male
  13| ACCOUNT NUMBER: ACCT-904128
  14| DATE OF SERVICE: 11/04/2026
  15| PREVIOUS VISIT: 14 Oct 2026
  16| ATTENDING PHYSICIAN: Arthur Pendelton, MD
  17| 
  18| SUBJECTIVE:
  19| REASON FOR VISIT:
  20| Routine follow-up evaluation for chronic hypertension, bilateral knee
  21| osteoarthritis, and benign prostatic hyperplasia.
  22| 
  23| HISTORY OF PRESENT ILLNESS:
  24| Mr. Jürgen von Lindemann is a 94-year-old gentleman who presents to
  25| the outpatient geriatric clinic today for routine interval follow-up.
  26| He is accompanied to the visit by his 61-year-old daughter, Martha
  27| Caldwell, who serves as his primary caregiver and assists with his
  28| instrumental activities of daily living, including grocery shopping and
  29| weekly medication organization. Mr. von Lindemann reports that he has
  30| been feeling generally well since his prior evaluation on 14 Oct 2026.
  31| He notes persistent but mild early morning stiffness in his right knee
  32| that typically resolves within twenty to thirty minutes after he begins
  33| moving around his residence. He reports no acute joint swelling, heat,
  34| or redness. He ambulates using a single-point cane and denies falls or
  35| near-fall episodes over the past three months.
  36| 
  37| From a cardiovascular and pulmonary standpoint, Mr. von Lindemann
  38| denies chest tightness, exertional chest pressure, palpitations,
  39| orthopnea, paroxysmal nocturnal dyspnea, or lower extremity swelling.
  40| He has not experienced lightheadedness, postural dizziness, or visual
  41| changes upon standing. Home blood pressure measurements recorded by
  42| his daughter have been stable, typically running from 122/70 mmHg to
  43| 134/76 mmHg.
  44| 
  45| Regarding his urologic history, he reports no dysuria, urgency, or
  46| acute urinary symtoms. He awakens twice per night to void, which has
  47| been his stable baseline for over three years. He maintains a good
  48| stream without hesitancy or terminal dribbling. Appetite is intact,
  49| weight has been steady, and bowel habits remain regular without
  50| melena or hematochezia.
  51| 
  52| CURRENT MEDICATIONS:
  53| 1. Lisinopril 20 mg oral tablet once daily every morning
  54| 2. Atorvastatin 20 mg oral tablet once daily at bedtime
  55| 3. Tamsulosin hydrochloride 0.4 mg oral capsule daily after dinner
  56| 4. Acetaminophen 500 mg oral tablet as needed for knee discomfort
  57| 5. Cholecalciferol (Vitamin D3) 1000 international units oral daily
  58| 
  59| ALLERGIES:
  60| No known drug allergies (NKDA).
  61| 
  62| PAST MEDICAL HISTORY:
  63| 1. Essential hypertension, longstanding, well controlled.
  64| 2. Primary osteoarthritis of bilateral knees, right worse than left.
  65| 3. Benign prostatic hyperplasia without urinary retention.
  66| 4. Hyperlipidemia, controlled on moderate-intensity statin therapy.
  67| 5. Bilateral sensorineural hearing impairment, corrected with aids.
  68| 
  69| PAST SURGICAL HISTORY:
  70| 1. Right total knee arthroplasty, eleven years prior, uncomplicated.
  71| 2. Left inguinal herniorrhaphy, fifteen years prior, uncomplicated.
  72| 3. Bilateral cataract phacoemulsification with intraocular lenses.
  73| 
  74| SOCIAL HISTORY:
  75| Mr. von Lindemann resides in a private senior apartment situated at
  76| 712 Cedar Ridge Lane, Apt 4B, St. Paul, MN 55105. He is a retired
  77| structural draftsman. His daughter, Mrs. Caldwell, lives within ten
  78| minutes and visits four times weekly. He is a lifetime non-smoker
  79| with no history of tobacco or recreational substance use. He does not
  80| consume alcoholic beverages. He remains independent with feeding,
  81| dressing, grooming, and personal hygiene.
  82| 
  83| REVIEW OF SYSTEMS:
  84| General: Denies fever, chills, diaphoresis, fatigue, or anorexia.
  85| HEENT: Wears hearing aids. Denies vision loss, epistaxis,
  86| or sore throat.
  87| Respiratory: Denies cough, wheeze, dyspnea, or hemoptysis.
  88| Cardiovascular: Denies chest pain, palpitations, or pedal edema.
  89| Gastrointestinal: Denies nausea, vomiting, dysphagia, or constipation.
  90| Genitourinary: Denies dysuria, gross hematuria, or incontinence.
  91| Musculoskeletal: Reports mild right knee ache, denies hip or back pain.
  92| Neurological: Denies transient weakness, numbness, vertigo, or tremor.
  93| Psychiatric: Denies anxiety, restlessness, or sleep disturbances.
  94| 
  95| OBJECTIVE:
  96| PHYSICAL EXAMINATION:
  97| Vitals:
  98| Blood pressure: 126/72 mmHg (right arm, seated)
  99| Heart rate: 66 beats per minute, regular rhythm
 100| Respiratory rate: 16 breaths per minute, unlabored
 101| Temperature: 98.2 deg F (36.8 deg C) oral
 102| Pulse oximetry: 98% on room air
 103| Weight: 166.0 lbs (75.3 kg) | Height: 68.0 in | BMI: 25.2 kg/m2
 104| 
 105| General: Well-appearing, cooperative, articulate 94-year-old gentleman
 106| sitting comfortably on the examination table in no distress.
 107| Head/Eyes: Normocephalic. Pupils equal, round, reactive to light.
 108| Extraocular motions intact. Sclerae anicteric.
 109| Ears/Nose/Throat: Hearing aids in place bilaterally. Moist mucous
 110| membranes. Pharynx non-erythematous without exudates.
 111| Neck: Supple. Trachea midline. Jugular venous distension absent. No
 112| cervical lymphadenopathy or carotid bruits.
 113| Cardiovascular: Regular rhythm, normal S1 and S2. No murmur, gallop,
 114| or pericardial friction rub. Peripheral pulses palpable 2+ bilaterally.
 115| Pulmonary: Thorax symmetric with normal respiratory effort. Clear to
 116| auscultaion bilaterally across all lung fields. No wheeze or rales.
 117| Abdomen: Soft, non-distended, non-tender to light and deep palpation.
 118| Bowel sounds normoactive in all four quadrants. No organomegaly.
 119| Extremities: No clubbing, cyanosis, or peripheral edema. Right knee
 120| demonstrates a well-healed midline anterior arthroplasty scar.
 121| Passive range of motion reveals mild crepitation without joint effusion,
 122| warmth, or erythema. Left knee has full range of motion. Wells score
 123| for deep vein thrombosis equals 0 (low clinical probability).
 124| Neurologic: Alert and oriented to person, place, time, and situation.
 125| Cranial nerves II through XII intact. Motor strength 5/5 in bilateral
 126| upper and lower extremities. Light touch sensation intact distally.
 127| Gait is steady with single-point cane.
 128| 
 129| IN-CLINIC LABORATORY DATA:
 130| Point-of-care capillary glucose: 104 mg/dL
 131| Urinalysis dipstick: Negative for leukocytes, nitrites, protein, blood.
 132| Serum creatinine from 11/04/2026: 1.12 mg/dL, eGFR 64 mL/min/1.73m2.
 133| Serum potassium from 11/04/2026: 4.4 mEq/L.
 134| 
 135| ASSESSMENT AND PLAN:
 136| Mr. Jürgen von Lindemann is a pleasant 94-year-old male who presents
 137| for scheduled chronic disease management. Findings and management plans
 138| are organized by active medical problem below:
 139| 
 140| 1. Essential hypertension:
 141| Blood pressure is currently at goal on lisinopril 20 mg daily, with no
 142| postural symptoms or adverse effects. Renal function and electrolytes
 143| are stable. Plan is to continue lisinopril 20 mg oral daily. Home log
 144| monitoring will continue with assistance from his daughter.
 145| 
 146| 2. Bilateral knee osteoarthritis:
 147| Mild, chronic symptoms managed adequately with prn acetaminophen and
 148| assistive cane ambulation. Wells score is 0 with no evidence of deep
 149| venous thrombosis. Joint exam is stable without effusion. Plan: Continue
 150| current acetaminophen 500 mg as needed (not to exceed 2000 mg daily).
 151| Formal outpatient physical therapy will be recomended if mobility
 152| becomes impaired.
 153| 
 154| 3. Benign prostatic hyperplasia:
 155| Lower urinary tract symptoms remain mild and stable on tamsulosin.
 156| No urinary tract infection on in-clinic urinalysis. Plan: Continue
 157| tamsulosin 0.4 mg oral capsule daily after dinner.
 158| 
 159| 4. Preventive and health maintenance:
 160| Seasonal influenza vaccine (FL-90214) administered intramuscularly
 161| into the left deltoid today after discussion of risks and benefits.
 162| Fall risk precautions reviewed; home environment is well adapted.
 163| 
 164| PATIENT EDUCATION AND FOLLOW-UP:
 165| Diagnostic results, appointment reminders, and visit summaries remain
 166| accessible through the patient portal at:
 167| https://portal.example.org/records/patient-access
 168| 
 169| Follow-up visit scheduled in six months for routine geriatric review,
 170| or sooner if interval medical concerns arise. Patient and caregiver
 171| instructed to contact the clinic nursing staff at (612) 555-0144 with
 172| any interim questions.
 173| 
 174| Arthur Pendelton, MD
 175| Division of Geriatric Medicine
 176| St. Anselm Regional Medical Center
 177| Direct provider line: 612.555.0182
 178| Signed electronically: 11/04/2026 14:15 CST
=== END DOCUMENT ===
ITEMS FOR fd-0106:
D1 | line 20 | A: KEEP "bilateral knee\nosteoarthritis" | B: KEEP "osteoarthritis"
D2 | line 54 | A: KEEP "once daily" ; KEEP "at bedtime" | B: KEEP "once daily at bedtime"
D3 | line 55 | A: KEEP "daily" ; KEEP "after dinner" | B: KEEP "daily after dinner"
D4 | line 64 | A: KEEP "Primary osteoarthritis of bilateral knees" | B: KEEP "Primary osteoarthritis"
D5 | line 67 | A: KEEP "Bilateral sensorineural hearing impairment" | B: KEEP "sensorineural hearing impairment"
D6 | line 70 | A: KEEP "Right total knee arthroplasty" | B: KEEP "total knee arthroplasty"
D7 | line 71 | A: KEEP "Left inguinal herniorrhaphy" | B: KEEP "inguinal herniorrhaphy"
D8 | line 72 | A: KEEP "Bilateral cataract phacoemulsification with intraocular lenses" | B: KEEP "cataract phacoemulsification"
D9 | line 146 | A: KEEP "Bilateral knee osteoarthritis" | B: KEEP "osteoarthritis"
D10 | line 157 | A: KEEP "daily" ; KEEP "after dinner" | B: KEEP "daily after dinner"
D11 | line 160 | A: KEEP "Seasonal influenza vaccine" | B: KEEP "influenza vaccine"
K1 | line 8 | KEEP "ENCOUNTER DOCUMENTATION"
K2 | line 8 | KEEP "CLINICAL PROGRESS NOTE"
K3 | line 53 | KEEP "every morning"
K4 | line 65 | KEEP "urinary retention"
K5 | line 66 | KEEP "statin"
K6 | line 83 | KEEP "REVIEW OF SYSTEMS"
K7 | line 84 | KEEP "General"
K8 | line 85 | KEEP "HEENT"
K9 | line 87 | KEEP "Respiratory"
K10 | line 88 | KEEP "Cardiovascular"
K11 | line 89 | KEEP "Gastrointestinal"
K12 | line 90 | KEEP "Genitourinary"
K13 | line 91 | KEEP "Musculoskeletal"
K14 | line 92 | KEEP "Neurological"
K15 | line 93 | KEEP "Psychiatric"
K16 | line 101 | KEEP "oral"
K17 | line 105 | KEEP "General"
K18 | line 107 | KEEP "Head/Eyes"
K19 | line 109 | KEEP "Ears/Nose/Throat"
K20 | line 111 | KEEP "Neck"
K21 | line 113 | KEEP "Cardiovascular"
K22 | line 115 | KEEP "Pulmonary"
K23 | line 117 | KEEP "Abdomen"
K24 | line 119 | KEEP "Extremities"
K25 | line 124 | KEEP "Neurologic"
K26 | line 131 | KEEP "Urinalysis dipstick: Negative for leukocytes, nitrites, protein, blood"
K27 | line 132 | KEEP "Serum creatinine"
K28 | line 133 | KEEP "Serum potassium"
K29 | line 155 | KEEP "Lower urinary tract symptoms"
K30 | line 156 | KEEP "urinalysis"
K31 | line 159 | KEEP "Preventive and health maintenance"
K32 | line 160 | KEEP "FL-90214"

=== DOCUMENT fd-0111 ===
   1| NORTH FIELD HOSPITAL
   2| 410 Quarry Street
   3| Calder, MI 49655
   4| Phone: (231) 555-0128
   5| Email: referrals@example.org
   6| 
   7| DISCHARGE SUMMARY AND REFERRAL
   8| 
   9| Date: March 6, 2026
  10| Patient: Olena D. Luchanko
  11| DOB: June 18, 1933
  12| MRN: 5502-7741-18
  13| 
  14| To: Meadow Brook Clinic
  15| 18 Meadow Brook Road
  16| Calder, MI 49621
  17| 
  18| Dear colleagues,
  19| 
  20| On March 2, 2026, a 92 y.o. woman, Olena D. Luchanko, was
  21| admitted to North Field Hospital with three days of dyspnea,
  22| orthopnea, and swelling of both ankles. Her daughter, Claire
  23| Ellison, shares the house and gave the admission history.
  24| She described a gain of about five pounds, a new need to
  25| sleep on two pillows, and a shorter walking distance inside
  26| the house. There was no chest pain, no syncope, no fever,
  27| and no change in stool or urine color. Home medicines were
  28| furosemide 20 mg by mouth daily, carvedilol 6.25 mg twice
  29| daily, losartan 25 mg daily, and levothyroxine 88 mcg each
  30| morning. She has no known drug allergy.
  31| 
  32| Past history includes heart failure with preserved ejection
  33| fraction, hypertension, stage 3 chronic kidney disease, and
  34| hypothyroidism. She also has Raynaud phenomenon, present
  35| for many years, with cold-triggered color change in the
  36| fingers and no digital ulcer. Gloves have been enough, and
  37| she takes no vasodilator for it. There has been no stroke,
  38| no myocardial infarction, and no prior intubation.
  39| 
  40| On arrival the blood pressure was 168/90 mmHg, the pulse was
  41| 108 beats per minute, the respiratory rate was 24, and the
  42| oxygen saturation was 90 percent on room air. She was
  43| speaking in short phrases, with crackles halfway up both
  44| lung fields, an elevated jugular venous pressure, and pitting
  45| edema to the mid shins. The abdomen was soft. She was
  46| afebrile and oriented to person and place.
  47| 
  48| Laboratory results included sodium 134 mmol/L, potassium
  49| 3.2 mmol/L, creatinine 1.6 mg/dL (baseline near 1.3 mg/dL),
  50| blood urea nitrogen 32 mg/dL, BNP 1860 pg/mL, hemoglobin
  51| 11.2 g/dL, and troponin I 0.02 ng/mL, unchanged on repeat.
  52| The chest radiograph showed pulmonary edema without a focal
  53| infiltrate. An echocardiogram showed an ejection fraction of
  54| 58 percent, diastolic dysfunction, and moderate mitral
  55| regurgitation. The fingers were warm during the exam, and
  56| the Raynaud phenomenon was not active.
  57| 
  58| She received intravenous furosemide, with a net loss of 3.4
  59| liters over three days. Oxygen was weaned from 2 liters by
  60| nasal cannula to room air. Potassium was replaced by mouth.
  61| Creatinine returned to 1.4 mg/dL. Carvedilol and losartan
  62| were held on the first day and then resumed. Daily weights
  63| fell from 61.2 kg to 57.6 kg. She slept flat enough to rest,
  64| and Claire Ellison practiced the new diuretic plan at the
  65| bedside before discharge on March 6, 2026.
  66| 
  67| Her weight on the morning of discharge was 57.6 kg. Blood
  68| pressure was 136/72 mmHg, pulse 76 beats per minute, and
  69| oxygen saturation 96 percent on room air. The lungs had only
  70| faint basilar crackles. She walked the hall once with a
  71| walker and did not report chest pain. Teaching limited
  72| fluids to about 1.5 liters a day and asked for a weight
  73| each morning, recorded by Claire Ellison.
  74| 
  75| Discharge medicines are furosemide 40 mg by mouth each
  76| morning, carvedilol 6.25 mg by mouth twice daily, losartan
  77| 25 mg by mouth daily, and levothyroxine 88 mcg by mouth
  78| each morning. Acetaminophen 650 mg by mouth every six hours
  79| is available for pain. No vasodilator was added for the
  80| Raynaud phenomenon. Please obtain a basic metabolic panel
  81| within one week at Meadow Brook Clinic, and see her sooner
  82| for a gain of more than two pounds in a day, new dyspnea at
  83| rest, or swelling that returns. Printed teaching was reviewed
  84| with Claire Ellison before she left the unit.
  85| Family instructions are posted at https://www.example.org/hf.
  86| 
  87| I was the attending physician for this admission. Questions
  88| about the stay may be directed to Howard M. Raynaud in the
  89| Department of Medicine.
  90| 
  91| Howard M. Raynaud, MD
  92| Hospital Medicine
  93| North Field Hospital
=== END DOCUMENT ===
ITEMS FOR fd-0111:
D1 | line 49 | A: KEEP "creatinine 1.6 mg/dL (baseline near 1.3 mg/dL)" | B: KEEP "creatinine 1.6 mg/dL"
D2 | line 54 | A: KEEP "moderate mitral\nregurgitation" | B: KEEP "mitral\nregurgitation"
D3 | line 73 | A: (nothing) | B: RELATIVE "Claire Ellison"
K1 | line 7 | KEEP "DISCHARGE SUMMARY AND REFERRAL"
K2 | line 29 | KEEP "daily"
K3 | line 40 | KEEP "blood pressure was 168/90 mmHg"
K4 | line 40 | KEEP "pulse was\n108 beats per minute"
K5 | line 41 | KEEP "respiratory rate was 24" [labeler unsure]
K6 | line 42 | KEEP "oxygen saturation was 90 percent"
K7 | line 52 | KEEP "focal\ninfiltrate" [labeler unsure]
K8 | line 53 | KEEP "ejection fraction of\n58 percent"
K9 | line 60 | KEEP "Potassium"
K10 | line 61 | KEEP "Creatinine returned to 1.4 mg/dL"
K11 | line 62 | KEEP "Daily weights\nfell from 61.2 kg to 57.6 kg"
K12 | line 67 | KEEP "weight on the morning of discharge was 57.6 kg"
K13 | line 67 | KEEP "Blood\npressure was 136/72 mmHg"
K14 | line 68 | KEEP "pulse 76 beats per minute"
K15 | line 69 | KEEP "oxygen saturation 96 percent"
K16 | line 89 | KEEP "Department of Medicine" [labeler unsure]
K17 | line 92 | KEEP "Hospital Medicine" [labeler unsure]

=== DOCUMENT fd-0113 ===
   1| Red Oak Clinic nurse line
   2| Patient: Halina Frąckowiak    DOB: 12 January 1930
   3| Nurse: Hi, um, this is Clara Benson on the nurse line. I am returning a call about Halina Frąckowiak. Am I speaking with her daughter?
   4| Caller: Yes, this is Mrs. Rosaria D'Amico. I am, uh, I am the one who took her to the visit. She is ninety-six years old and I do not want to miss a dose.
   5| Nurse: You will not. The note from Dr. Helen Early says the facial droop is Bell palsy, not a stroke. The forehead was involved, and the Glasgow Coma Scale was 15. That part was explaned at the visit, but the prednisone directions on the bottle are easy to misread, so let me, wait, let me walk through them.
   6| Caller: Please. The droop has not worsend, but her left eye does not close all the way and it looks dry.
   7| Nurse: For the eye, artificial tears every two hours while she is awake, and a lubricating ointment at bedtime. She is suposed to tape the eyelid shut at night only if it is still open after the ointment. Do not tape it during the day. Call if the eye gets painful, or if the vision drops.
   8| Caller: She keeps rubbing it. I bought lubricating drops at the store. Is that the right kind?
   9| Nurse: Plain lubricating drops are the right kind. Do not use a redness-relief drop, and do not use a leftover antibiotic bottle unless it was prescribed for this eye. Have her blink on purpose when she is watching television.
  10| Caller: And the steroid?
  11| Nurse: Prednisone 60 mg by mouth every morning with food for five days, then 40 mg every morning for three days, then 20 mg every morning for two days, then stop. Do not stop in the middle of a step unless Dr. Early tells you to. Take it with breakfast so it sits better. If she becomes confused, very restless, or she is much more agitated than usual, call us the same day.
  12| Caller: Steroids make her sharp with me. Last time she was up at night rearranging a drawer. Should I hide the bottle?
  13| Nurse: Do not hide it, or a dose will be missed. Give it with breakfast, not at night. If she is pacing or seeing things, call the same day and we will ask her physician whether to cut the dose.
  14| Caller: The follow-up card has a dotted date and I cannot tell which number is the month.
  15| Nurse: The card reads 04.03.2026. On that form the day is the first number, so it is the fourth of March. Out loud, that visit is March fourth, twenty twenty-six, with her physician. Bring the bottle so she can see what is left.
  16| Caller: I tried the portal to read the visit and it warned me about a sign-in from 192.0.2.44. That was my laptop. I got nervous and closed it.
  17| Nurse: I will note that the sign-in was you. If the pharmacy questions which encounter covered the prednisone, the paperwork lists claim number 775320918. The after-hours line, the one printed with the country code, is +1 401 555 0155.
  18| Caller: And you have the right house? I do not want the eye ointment delivered somewhere old.
  19| Nurse: The address on the chart is 14 Lantern Hill Road, Providence, RI 02903. That is the one we will use.
  20| Caller: Yes, that house. Thank you. I think, um, I think that is all I needed.
  21| Nurse: If the droop is joined by arm weakness, trouble speaking, or a sudden severe headache, that is an emergency, not a nurse line question. Otherwise we will see her at that March visit. Thank you for calling.
  22| Caller: Thank you. I will set an alarm for the prednisone with breakfast.
  23| Nurse: End of call.
=== END DOCUMENT ===
ITEMS FOR fd-0113:
D1 | line 5 | A: KEEP "Glasgow Coma Scale was 15" | B: KEEP "Glasgow Coma Scale"
K1 | line 7 | KEEP "lubricating ointment"
K2 | line 8 | KEEP "lubricating drops"
K3 | line 9 | KEEP "lubricating drops"
K4 | line 9 | KEEP "redness-relief drop"

=== DOCUMENT fd-0116 ===
   1| TRANSCRIPT OF CLINICAL TELEPHONE CALL
   2| Facility: Pulmonary and Allergy Center of Green Valley
   3| Reference Encounter: 4821-9932-07
   4| Date: 8 Sep 2026
   5| Care Team: Dr. Douglas McAllister, Hannah Weaver, RN, Dr. Craig Stewart
   6| Patient: Pearl al-Zuhair
   7| DOB: 15 Feb 1934
   8| Age: 92-year-old female
   9| Caller: Kerem Celik (son-in-law)
  10| Additional Contact: Clara Turner (daughter)
  11| 
  12| [Recording Commenced]
  13| 
  14| Hannah Weaver, RN: Pulmonary and Allergy Center of Green Valley, triage line, this is Hannah Weaver, registered nurse. How can I, uh, help you today?
  15| 
  16| Kerem Celik: Hello, yes, uh, Nurse Hannah. My name is Kerem Celik. I am calling, um, on behalf of my mother-in-law, Pearl al-Zuhair. She had, uh, she had a bronchoscopy with transbronchial biopsy last week, and she is having some increased shortness of breath and coughing up some thick mucus today.
  17| 
  18| Hannah Weaver, RN: Alright, let me pull up Pearl's chart here. Could you please confirm her date of birth and home address for me?
  19| 
  20| Kerem Celik: Yes, her date of birth is February fifteenth, nineteen thirty-four—born on 15 Feb 1934. She is a 92-year-old woman, and she currently lives in Phoenix with my wife and me. Her address is 519 Crescent Summit Way, Suite 200, Phoenix, AZ 85032.
  21| 
  22| Hannah Weaver, RN: Thank you, Mr. Celik. I see that her daughter, Clara Turner, also updated her profile on the online portal yesterday, and she entered the address in lowercase as 519 crescent summit way, suite 200. Does Mrs. al-Zuhair have any fever, chest pain, or frank blood in her sputum?
  23| 
  24| Kerem Celik: No fever. Her temperature this morning was 98.4 F. Her oxygen saturation on room air dropped to 89%, so we put her on 2 liters per minute of nasal cannula oxygen, which brought her pulse oximetry up to 93%. Pulse was 82 beats per minute, blood pressure 126/74 mmHg. There is no bright red blood, just, you know, yellowish thick phlegm. But she feels very tired and her wheezing sounds louder.
  25| 
  26| Hannah Weaver, RN: Okay. The hypoxemia is concerning given her chronic obstructive pulmonary disease exacerbation risk after the procedure. Let me review her medication list. Is she using her budesonide-formoterol 160/4.5 mcg 2 puffs BID regularly?
  27| 
  28| Kerem Celik: Yes, she took that this morning at 8:00 AM. And she did a nebulizer treatment of albuterol-ipratropium 0.5 mg/3 mg about two hours ago. It helped a little bit, but her breathing still feels tight.
  29| 
  30| Hannah Weaver, RN: Understood. Let me check the post-procedure notes from Dr. Douglas McAllister. He performed the bronchoscopy on 8 Sep 2026—wait, the procedure was last week, today is September eighth, twenty twenty-six. Dr. McAllister noted that her baseline forced expiratory volume in 1 second was 1.1 liters, and she had mild tracheal secretions. Also, in her family history notes, her daughter Clara Turner had asked previously about genetic screenings because a niece had Turner syndrome, but the note confirms Mrs. al-Zuhair has no genetic anomalies or Turner syndrome. Dr. McAllister's provider credentials are on file under Medical License: MD-492817.
  31| 
  32| Kerem Celik: Right, exactly. We just wanted to make sure she doesn't need oral steroids or an antibiotic like azithromycin. Clara Turner, her daughter, is an occupational therapist and she thought Pearl might need a short burst of prednisone.
  33| 
  34| Hannah Weaver, RN: Dr. McAllister is in clinic right now, and I just sent an urgent flag to his desktop with the initials P.Z. to review her oxygen levels. He wants us to start a 5-day course of prednisone 40 mg PO daily and send a prescription for azithromycin 250 mg PO daily for 5 days. Which pharmacy should we send those to?
  35| 
  36| Kerem Celik: The local pharmacy on Desert Willow Road has them on file, but if you need to fax the orders, their direct clinical line is Fax: 602-555-0164.
  37| 
  38| Hannah Weaver, RN: Perfect, I will transmit the electronic script and also send a confirmation to Fax: 602-555-0164 immediately. While waiting for the medication, please keep her on the 2 liters of supplemental oxygen. Continue the albuterol-ipratropium nebulizer every 4 to 6 hours as needed. If her oxygen saturation drops below 90% on oxygen, or if she develops blue lips, confusion, chest pressure, or hemoptysis, call 911 immediately.
  39| 
  40| Kerem Celik: Okay, we will do that. We will pick up the prednisone and azithromycin as soon as the pharmacy alerts us. Thank you very much, Hannah.
  41| 
  42| Hannah Weaver, RN: You're very welcome, Kerem. We will follow up by phone tomorrow afternoon. Take care.
  43| 
  44| Kerem Celik: Thank you, goodbye.
  45| 
  46| [Call Terminated]
=== END DOCUMENT ===
ITEMS FOR fd-0116:
D1 | line 16 | A: KEEP "bronchoscopy" ; KEEP "transbronchial biopsy" | B: KEEP "bronchoscopy with transbronchial biopsy"
D2 | line 26 | A: KEEP "chronic obstructive pulmonary disease exacerbation" | B: KEEP "chronic obstructive pulmonary disease"
D3 | line 30 | A: CLINICIAN "McAllister" | B: (nothing)
D4 | line 38 | A: KEEP "every 4 to 6 hours" ; KEEP "as needed" | B: KEEP "every 4 to 6 hours as needed"
K1 | line 24 | KEEP "temperature this morning was 98.4 F"
K2 | line 24 | KEEP "oxygen saturation on room air dropped to 89%"
K3 | line 24 | KEEP "2 liters per minute"
K4 | line 24 | KEEP "nasal cannula"
K5 | line 24 | KEEP "pulse oximetry up to 93%"
K6 | line 24 | KEEP "Pulse was 82 beats per minute"
K7 | line 28 | KEEP "nebulizer"
K8 | line 30 | KEEP "forced expiratory volume in 1 second was 1.1 liters"
K9 | line 30 | KEEP "genetic screenings"
K10 | line 38 | KEEP "2 liters"
K11 | line 38 | KEEP "nebulizer"
K12 | line 38 | KEEP "oxygen saturation drops below 90%"

Now output the result blocks.