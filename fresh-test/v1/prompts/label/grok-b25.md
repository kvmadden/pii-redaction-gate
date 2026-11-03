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


=== DOCUMENT fd-0050 ===
   1| TELEPHONE ENCOUNTER LOG - CEDAR GROVE CLINIC
   2| Date of Service: 10/14/2026
   3| Facility: Cedar Grove Clinic - Gastroenterology Specialty Pavilion
   4| Telephone: (503) 555-0164
   5| Fax: (503) 555-0178
   6| Patient Name: Roger M. Miller
   7| MRN: 7392015
   8| Account: Claim Number: CLM-4920815
   9| Subscriber ID: Policy ID: 8492 0184 73
  10| Patient Street Address:
  11| 842 Meadow Lane
  12| Eugene, Oregon 97405
  13| Attending Care Team: Dr. Thomas Barrett, Dr. Laura Vance, Mark Becker, PA-C, Hannah Clark, RN
  14| 
  15| HANNAH CLARK: Cedar Grove Clinic gastroenterology triage line, this is Hannah Clark, RN. How, um, how can I help you today?
  16| 
  17| MATEO GÓMEZ-NAVARRO: Hello, yes, uh, good afternoon. My name is Mateo Gómez-Navarro. I am calling, um, calling on behalf of my father-in-law, Roger M. Miller. I am his primary caregiver and healthcare proxy. We, uh, we had a few urgent questions regarding his pathology results and his medication instructions following his upper endoscopy last week.
  18| 
  19| HANNAH CLARK: Hello, Mr. Gómez-Navarro. I can certainly help you review those results and connect with the clinical team. Before we open the chart, I just need to verify a few patient identifiers for security. Could you please confirm his full legal name, his date of birth, and his residential address?
  20| 
  21| MATEO GÓMEZ-NAVARRO: Sure, absolutely. His name is Roger M. Miller. His DOB: 05/17/1958, so he is currently a 68-year-old gentleman. And his address is 842 Meadow Lane, Eugene, Oregon 97405.
  22| 
  23| HANNAH CLARK: Thank you very much. Let me locate his file in our electronic record system... Okay, I see him here. It looks like the intake clerk entered a quick triage note this morning with his name written just as roger miller without capitals, but the medical record number MRN: 7392015 matches completely. And I see your caregiver authorization on file. What specific concerns did you and Mr. Miller have today?
  24| 
  25| MATEO GÓMEZ-NAVARRO: Well, um, the doctor who did the procedure, Dr. Thomas Barrett, spoke with us briefly in recovery, but my father-in-law was still quite groggy from the intravenous sedation. Then yesterday we received an automated portal notification stating that new pathology findings were posted from the specimen collected on October fourteenth, twenty twenty-six. When I opened the documnet, it mentioned something called Barrett esophagus with intestinal metaplasia. We got really scared that it meant cancer, so we wanted to speak with a nurse or doctor right away.
  26| 
  27| HANNAH CLARK: I completely understand why seeing that terminology would cause anxiety, Mr. Gómez-Navarro. Let me reassure you right away: the pathology report specifically states that the biopsy specimens demonstrated specialized columnar epithelium with goblet cells, which is the definition of Barrett esophagus, but there is no dysplasia and no evidence of malignancy. In plain terms, that means chronic stomach acid exposure has caused the normal lining of the distal food pipe to adapt, but the cells are not cancerous. Dr. Barrett reviewed the histology slides this morning and confirmed that finding.
  28| 
  29| MATEO GÓMEZ-NAVARRO: Oh, wow, that is such a huge relief. We were so worried all night. Dr. Barrett told us in recovery that his sedation went smoothly—I remember the discharge nurse noted his Glasgow Coma Scale was 15 before he walked out to the car—but we still were not sure what the biopsy would show.
  30| 
  31| HANNAH CLARK: Yes, his post-anesthesia recovery was uneventful, and a Glasgow Coma Scale of 15 confirms he was fully oriented at discharge. Because the biopsy showed Barrett esophagus without dysplasia, the standard medical guideline is long-term acid suppression and surveillance upper endoscopy every three to five years to keep a close watch on the tissue. Dr. Barrett wants him to take omeprazole 40 mg PO BID, thirty to sixty minutes before breakfast and dinner, rather than once daily. If he experiences persistent breakthrough heartburn, he can also use sucralfate 1 g PO QID as an oral suspension one hour before meals and at bedtime.
  32| 
  33| MATEO GÓMEZ-NAVARRO: Okay, I am writing this infromation down carefully. Omeprazole 40 mg twice a day, before meals. What about his routine blood pressure pills and his daily aspirin?
  34| 
  35| HANNAH CLARK: He should resume all of his baseline chronic medications as previously prescribed. In addition, Dr. Barrett recommends standard lifestyle measures: elevating the head of his bed by six inches, avoiding eating within three hours of lying down, and limiting triggers like citrus, tomato sauce, caffeine, and peppermint.
  36| 
  37| MATEO GÓMEZ-NAVARRO: Understood. Now, we also had a quick question about portal access. When I logged into the portal system from my home computer this morning to review the discharge summary, I got a security email alert saying someone accessed the account from IP address 203.0.113.52. I wanted to make sure his medical record had not been compromised.
  38| 
  39| HANNAH CLARK: Thank you for checking on that. Our technical support logs show that IP address 203.0.113.52 corresponds to the secure public gateway for your local fiber internet provider in the Eugene area. Since that matches your sign-in timestamp at 08:32 AM, it was simply our automated system confirming an authorized caregiver login. There is no breach or unauthorized access.
  40| 
  41| MATEO GÓMEZ-NAVARRO: That is reassuring, thank you. Lastly, Dr. Barrett's discharge paperwork mentioned that we should set up a routine follow-up consultation with the gastroenterology clinic to check his symptom response and review the long-term surveillance plan.
  42| 
  43| HANNAH CLARK: Yes, exactly. Let me check our specialty clinic calendar right now. Dr. Barrett has an opening for a follow-up telehealth visit on 18 Nov 2026 at 10:30 AM. Would that date and time work for you and Mr. Miller?
  44| 
  45| MATEO GÓMEZ-NAVARRO: Yes, 18 Nov 2026 at 10:30 AM works wonderfully for both of us. I will put it on our family calendar.
  46| 
  47| HANNAH CLARK: Perfect. I have locked in that apointment for 18 Nov 2026 with Dr. Barrett. I am sending an electronic order for the increased omeprazole dosing to your pharmacy now, and I will route this telephone note to Dr. Barrett, Dr. Laura Vance, and Mark Becker, PA-C for their review. Please give us a call back if he experiences any persistent difficulty swallowing, chest pain, black tarry stools, or persistent vomiting.
  48| 
  49| MATEO GÓMEZ-NAVARRO: Thank you so much for your patience, Nurse Clark. This was incredibly helpful.
  50| 
  51| HANNAH CLARK: You are very welcome, Mr. Gómez-Navarro. Tell Mr. Miller we wish him the best, and have a good afternoon.
=== END DOCUMENT ===

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

Now output the label blocks, one per document, in the order shown.