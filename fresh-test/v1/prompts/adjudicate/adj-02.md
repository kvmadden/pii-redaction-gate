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
ITEMS FOR fd-0004:
D1 | line 8 | A: KEEP "SpO2 98% on room air" | B: KEEP "SpO2 98%"
K1 | line 1 | KEEP "CLINICAL PHARMACY CONSULTATION NOTE"
K2 | line 2 | KEEP "Medication reconciliation"
K3 | line 2 | KEEP "pain regimen review"
K4 | line 5 | KEEP "somnolence"
K5 | line 14 | KEEP "mild pain"
K6 | line 15 | KEEP "in affected eye"
K7 | line 15 | KEEP "corneal dryness"
K8 | line 15 | KEEP "facial weakness"
K9 | line 18 | KEEP "dizziness"

=== DOCUMENT fd-0006 ===
   1| CLINICAL TRIAGE CALL TRANSCRIPT
   2| Date of Service: 10/16/2026
   3| Call Intake Time: 14:22 CST
   4| Call Log ID: CL-7729104
   5| Patient: ALENCAR, RODRIGO DE
   6| MRN: 8492018
   7| Health Plan ID: MED-8830192
   8| Primary Clinic: Willow Creek Clinic
   9| Attending: Dr. Bradley Vance, MD
  10| Triage Staff: Sharon Miller, RN
  11| 
  12| [Call Recording Begins]
  13| 
  14| Sharon Miller, RN: Willow Creek Clinic triage, uh, this is Sharon Miller, registered nurse. Who, who am I speaking with today?
  15| 
  16| Brett Jenkins: Hi, uh, hello Sharon. My name is Brett Jenkins. I'm, um, I'm calling for my father-in-law, Rodrigo de Alencar. He's, uh, he's having some pretty bad dizziness when he stands up, and we're, we're kind of worried about him.
  17| 
  18| Sharon Miller, RN: Okay, let me pull up Mr. Alencar's chart here in the system. Just a second... alright, got it. Can you confirm his date of birth and, uh, his address for verification?
  19| 
  20| Brett Jenkins: Sure, uh, he was born on October twelfth, twenty twenty-six—wait, no, sorry, that's ridiculous, I'm looking at my own notes, October twelfth, nineteen forty-six. Sorry, my head is spinning today. And his address is 814 Meadow Ridge Court, Unit 3B, Edmond, OK 73034.
  21| 
  22| Sharon Miller, RN: Thank you, Brett. And is he still residing there, or did he move? Because on the electronic intake note from 2026-10-14, the registration portal had it typed in as 814 meadow ridge court, unit 3b.
  23| 
  24| Brett Jenkins: Yeah, yeah, that's the same place, just lower case from when I, uh, texted it through the app on my phone.
  25| 
  26| Sharon Miller, RN: Perfect. And what is the best callback number for you or for Mr. de Alencar?
  27| 
  28| Brett Jenkins: You can reach me directly at 405-555-0148. That's my cell phone.
  29| 
  30| Sharon Miller, RN: Got it, 405-555-0148. Now tell me what's been happening with Mr. de Alencar. He had, uh, let's see, a left total knee arthroplasty three weeks ago, correct?
  31| 
  32| Brett Jenkins: Yes, exactly. The knee surgery itself went well, but, um, ever since, well, really since New Year's Day he's had bouts of paroxysmal atrial fibrillation, and Dr. Vance started him on apixaban 5 mg PO BID and metoprolol succinate 50 mg PO daily. But, uh, yesterday and then again this morning, every time he gets up from the recliner to use the walker, he gets, you know, lightheaded, woozy. We took his vitals with our home cuff. His sitting blood pressure was 128/76 mmHg with a pulse of 68 beats per minute, but when he stood up, his standing blood pressure dropped down to 96/58 mmHg, and pulse went up to 88.
  33| 
  34| Sharon Miller, RN: That sounds like significant orthostatic hypotension. Has he, uh, has he had any actual syncope, any loss of consciousness, chest pain, shortness of breath, or black tarry stools?
  35| 
  36| Brett Jenkins: No, no fainting. No chest pressure either. He's just, uh, he says the room feels like it's tilting. He hasn't fallen, thank God, because we're being super careful with the walker, especially since his fall back around New Year's Day when he cracked a rib.
  37| 
  38| Sharon Miller, RN: Good, I'm glad he hasn't fallen. Looking at the medication reconciliation from his discharge, is he taking any other antihypertensives or diuretics? What about hydrochlorothiazide or lisinopril?
  39| 
  40| Brett Jenkins: Well, um, he was taking lisinopril 10 mg daily before the surgery, but Dr. Vance told us to hold that if his systolic was under 110. He hasn't taken lisinopril for four days now. But the pharmacy, uh, Pine Hill Pharmacy, they just delivered a refill of his metoprolol, and the bottle says metoprolol succinate 100 mg instead of 50 mg. We didn't know if that was, uh, if Dr. Vance increased it or if the pharmacy made a mistake.
  41| 
  42| Sharon Miller, RN: Oh, let me check the order history. No, Dr. Bradley Vance wrote for metoprolol succinate 50 mg extended-release once daily. It definitely should not be 100 mg. That explains why his standing pressure is dropping so low. Do not give him that 100 mg tablet. Which pharmacy location filled that?
  43| 
  44| Brett Jenkins: It was Pine Hill Pharmacy. They're located in the shopping center over in 73013.
  45| 
  46| Sharon Miller, RN: Okay. I am going to contact Pharmacist Heather Campbell over at Pine Hill Pharmacy right now to verify that dispensation and have them send the correct 50 mg tablets. I will also transmit an urgent clarification via Fax: 405-555-0182 to their dispensing desk. For today, does he have any of the 50 mg tablets left from the previous bottle?
  47| 
  48| Brett Jenkins: Yeah, he has about three or four pills left in the older bottle from last week.
  49| 
  50| Sharon Miller, RN: Excellent. Have him take only the 50 mg tablet with food. Make sure he drinks at least two glasses of water, and have him sit on the edge of the bed for a full two minutes before standing up. If he feels lightheaded at all, he needs to sit right back down. If he has any chest pain, palpitation, or passes out, call 911 immediately.
  51| 
  52| Brett Jenkins: Okay, understood. Sit on the edge first, plenty of fluids, and only the 50 mg pill.
  53| 
  54| Sharon Miller, RN: Exactly. I'm going to put a note in Mr. Alencar's chart for Dr. Vance to review, and our clinic medical assistant will follow up by phone tomorrow morning. Thank you for calling this in promptly, Brett.
  55| 
  56| Brett Jenkins: Thank you so much, Sharon. Bye-bye.
  57| 
  58| Sharon Miller, RN: Goodbye.
  59| 
  60| [End of Call]
=== END DOCUMENT ===
ITEMS FOR fd-0006:
D1 | line 32 | A: KEEP "sitting blood pressure was 128/76 mmHg" | B: KEEP "128/76 mmHg" [unsure]
D2 | line 32 | A: KEEP "standing blood pressure dropped down to 96/58 mmHg" | B: KEEP "96/58 mmHg" [unsure]
D3 | line 50 | A: PHONE "911" [unsure] | B: (nothing)
K1 | line 32 | KEEP "knee surgery"
K2 | line 34 | KEEP "syncope"
K3 | line 42 | KEEP "extended-release"

=== DOCUMENT fd-0008 ===
   1| From: the patient
   2| To: the diabetes and rheumatology care team
   3| Subject: ankle swelling on the steroid taper
   4| 
   5| hi team, this is the patient. i am a 67-year-old and my daughter has been lining up the pill box since the flare that started after i was diagnosed in 2019. the hands have been stiffer since 2021, and recently the left ankle blew up so i could not get a shoe on. the home cuff this morning showed blood pressure 148/92 mmHg, pulse 96 beats per minute, and weight 71.4 kg. medicines i took: methotrexate 15 mg PO once weekly, folic acid 1 mg PO daily, metformin 500 mg PO BID, and Allegra 180 mg PO daily for the allergies. the taper card says prednisone 40/30/20/10 mg PO daily, five days on each dose, and i am in the middle of the 30 mg step. i did not take the tramadol. please tell me if i should come in or just wait on labs. my daughter can read the reply with me tonight.
   6| 
   7| From: the covering pharmacist
   8| To: the patient
   9| Subject: re: ankle swelling on the steroid taper
  10| 
  11| Thank you for writing this out so clearly. We compared your note with the records that arrived from Outside Hospital and with the bloodwork drawn at the clinic.
  12| 
  13| Past Medical History: seropositive rheumatoid arthritis, seasonal allergic rhinitis, prediabetes, and a remote Bell palsy that resolved without residual weakness.
  14| 
  15| Medications to continue: methotrexate 15 mg PO once weekly, folic acid 1 mg PO daily, metformin 500 mg PO BID, and Allegra 180 mg PO daily. Stay on the written taper, prednisone 40/30/20/10 mg PO daily, and do not skip a step or go backward unless we tell you to. For pain use acetaminophen 650 mg PO q6h PRN, limit 3 g in 24 hours. Hold tramadol 50 mg PO q6h PRN unless the pain is severe and the ankle is not hot or red.
  16| 
  17| Labs from the clinic visit: creatinine 0.9 mg/dL, eGFR 78 mL/min/1.73 m2, ESR 42 mm/hr, CRP 1.8 mg/dL, hemoglobin 11.6 g/dL, potassium 4.1 mmol/L, hemoglobin A1c 7.4%. Vitals that day: temperature 36.8 C, respiratory rate 16 breaths per minute, oxygen saturation 97% on room air, blood pressure 142/86 mmHg.
  18| 
  19| Assessment: the ankle swelling can come from the prednisone itself, from a rheumatoid flare, or less often from a clot. A Wells score of 1 puts the clot risk in the low range, so no lower-extremity duplex ultrasound is planned today. No arthrocentesis and no joint injection are planned either.
  20| 
  21| Plan: we are sending a referral to Pain Clinic for the chronic joint pain and a referral to Diabetes Center so the metformin dose can be reviewed against the A1c. Cardiology does not need a new visit. Wound Care is not indicated unless the skin opens. Please send a portal update in two days with a repeat home blood pressure and whether the ankle still will not take a shoe. If the joint becomes hot, you cannot bear weight, or you have chest pain or sudden shortness of breath, go to urgent care the same day rather than waiting on this thread.
=== END DOCUMENT ===
ITEMS FOR fd-0008:
D1 | line 15 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D2 | line 15 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D3 | line 19 | A: KEEP "Wells score of 1" | B: KEEP "Wells score"
K1 | line 17 | KEEP "Labs from the clinic visit"
K2 | line 17 | KEEP "Vitals that day"
K3 | line 19 | KEEP "rheumatoid flare"

=== DOCUMENT fd-0009 ===
   1| Silver Maple Clinic
   2| Endocrine Laboratory
   3| 
   4| Patient: Calloway, Nora
   5| DOB: July 22, 1967
   6| Age: 58 years
   7| MRN: 7304 2281 56
   8| Accession: THY-26-22840
   9| Collected: Mar. 4, 2026
  10| Ordering: Dr. Niall O'Rourke-McBride
  11| Phone: (207) 555-0155
  12| Email: n.calloway at example dot com
  13| Husband: Lewis Tabor
  14| 
  15| CLINICAL INDICATION
  16| Woman with weight loss, heat intolerance, a resting tremor, and a
  17| diffuse goiter. The working diagnosis is Graves disease. Her husband,
  18| Lewis Tabor, confirms she has not missed doses of methimazole. Prior
  19| thyroid tests from last season are not in this file.
  20| 
  21| CARE TEAM
  22| Names on the care-team line: Dr. Niall O'Rourke-McBride, Dr. Ellen Short,
  23| and Dr. Ada Victory.
  24| 
  25| RESULTS
  26| TSH 0.08 mIU/L (reference 0.40 to 4.50). Free T4 2.4 ng/dL (reference
  27| 0.8 to 1.8). Total T3 248 ng/dL (reference 80 to 200).
  28| Thyroid-stimulating immunoglobulin 3.8 IU/L (reference less than 1.3).
  29| Thyroglobulin antibody and thyroid peroxidase antibody were both
  30| negative.
  31| 
  32| A complete blood count drawn on the same collection showed leukocytes
  33| 6.4 K/uL, hemoglobin 12.8 g/dL, and platelets 231,000/uL. The
  34| absolute neutrophil count was 3.1 K/uL, which does not suggest
  35| agranulocytosis on this sample. Comprehensive metabolic panel: sodium
  36| 139 mmol/L, potassium 4.0 mmol/L, creatinine 0.7 mg/dL, ALT 28 U/L,
  37| AST 24 U/L, alkaline phosphatase 96 U/L, and total bilirubin
  38| 0.6 mg/dL.
  39| 
  40| Current medicines recorded on the requisition: methimazole 10 mg PO
  41| TID, propranolol 20 mg PO TID, and a daily multivitamin. She was
  42| advised not to take biotin for two days before the draw, and the
  43| husband states she complied.
  44| 
  45| HISTORY SUPPLEMENT
  46| Pulse on the requisition is 104 beats per minute and blood pressure
  47| is 138/74 mmHg. She describes gritty eyes without a clear loss of
  48| color vision. There is no reported neck pain and no fever. She is
  49| not pregnant. The goiter is recorded as diffuse and soft, without a
  50| dominant nodule that would have changed this blood order into a biopsy.
  51| 
  52| METHOD
  53| TSH, free T4, and total T3 were run on the chemiluminescent
  54| immunoassay platform in this laboratory. Thyroid-stimulating
  55| immunoglobulin was a binding assay sent to the same building's
  56| reference bench, still under this accession. Hemoglobin and the
  57| leukocyte count were run on the hematology line. Specimens were serum
  58| and EDTA whole blood, both received labeled and not hemolyzed. The
  59| free T4 was repeated in duplicate because the first read sat well
  60| above the reference interval, and the duplicate agreed.
  61| 
  62| The husband can be reached at the phone number in the header if a
  63| recollection is required. No add-on test was ordered after release of
  64| these values.
  65| 
  66| INTERPRETATION
  67| The suppressed TSH with elevated free T4 and total T3, together with
  68| a high thyroid-stimulating immunoglobulin, is consistant with Graves
  69| disease in a patient already on a thionamide. Antibody negativity
  70| for TPO and thyroglobulin does not exclude that diagnosis. There is
  71| no signifcant cytopenia on the accompanying blood count. A seperate
  72| uptake and scan, if still desired, would be arranged by nuclear
  73| medicine and is not part of this accession. The numeric results above
  74| were verified by the endocrine laboratory director on duty. Questions
  75| about dosing should go back to the ordering clinician. End of report.
=== END DOCUMENT ===
ITEMS FOR fd-0009:
K1 | line 17 | KEEP "diffuse goiter"
K2 | line 26 | KEEP "0.40 to 4.50"
K3 | line 27 | KEEP "0.8 to 1.8"
K4 | line 27 | KEEP "80 to 200"
K5 | line 28 | KEEP "less than 1.3"
K6 | line 29 | KEEP "Thyroglobulin antibody and thyroid peroxidase antibody were both\nnegative" [labeler unsure]
K7 | line 49 | KEEP "goiter"
K8 | line 71 | KEEP "cytopenia"
K9 | line 71 | KEEP "blood count"
K10 | line 72 | KEEP "nuclear\nmedicine"

=== DOCUMENT fd-0021 ===
   1| From: Mercy Golubeva
   2| To: the endocrine and pain care team
   3| Sent: afternoon
   4| 
   5| hello, this is mercy golubeva. i am 54 and my husband grant alderson is typing part of this because my hands are stiff. since March 2026 the burning in both feet is worse at night and i have been waking up two or three times. Redcedar Pain Clinic started me on Lyrica 75 mg PO BID and i am not sure it is doing enough. i also take metformin 1000 mg PO BID and levothyroxine 88 mcg PO daily on an empty stomach. home glucose this week has been 140 to 180 mg/dL before supper and the cuff showed 136/84 mmHg with pulse 78 beats per minute. please tell me if i should go up on the Lyrica or if the metformin is the problem. my chart is MRN: 6291845. the scanner copy of the old auth page came through as Auth O81l4-22 and i do not know if that is the right number. you can reply to mercy.golubeva@example.com. also the portal said a sign-in was tried from 198.51.100.24 and that was not me, that was my husband on the kitchen tablet, so please do not lock the account.
   6| 
   7| From: Siobhan O'Leary-Quinlan, PharmD
   8| To: Mercy Golubeva
   9| 
  10| Mercy, thank you. I am the covering pharmacist and I read both parts of your note. A sign-in from a home tablet is fine if your husband was the one holding it, and we will not lock the portal. Please still change the password when you can.
  11| 
  12| Your regimen can stay as written for now: Lyrica 75 mg PO BID, metformin 1000 mg PO BID, levothyroxine 88 mcg PO every morning. Do not increase the Lyrica on your own. Neuropathic pain often needs two to four weeks at a steady dose before we judge it. If the evening burning is still sharp after that, the next step we would discuss is Lyrica 100 mg PO BID, not a jump higher.
  13| 
  14| Labs on file from that draw: hemoglobin A1c 7.6%, creatinine 0.8 mg/dL, eGFR 88 mL/min/1.73 m2, TSH 2.4 mIU/L, vitamin B12 410 pg/mL. Vitals in the room were temperature 36.7 C, respiratory rate 14 breaths per minute, oxygen saturation 98% on room air, weight 79 kg. Diagnosis list for this thread: type 2 diabetes mellitus with diabetic peripheral neuropathy, and hypothyroidism. No procedure is scheduled. We do not need a nerve conduction study yet.
  15| 
  16| The scanned authorization string looks like a misread of a zero and a one. We will match it on our side from the labeled chart number rather than the scanned line. The pain practice can keep the pain plan, and we will send them a short note. Write back if you get drowsy, swollen legs, or glucose readings under 70 mg/dL.
=== END DOCUMENT ===
ITEMS FOR fd-0021:
D1 | line 5 | A: KEEP "home glucose this week has been 140 to 180 mg/dL" | B: KEEP "140 to 180 mg/dL" [unsure]
D2 | line 14 | A: KEEP "type 2 diabetes mellitus" ; KEEP "diabetic peripheral neuropathy" | B: KEEP "type 2 diabetes mellitus with diabetic peripheral neuropathy"
K1 | line 16 | KEEP "glucose readings under 70 mg/dL"

=== DOCUMENT fd-0022 ===
   1| PRIOR AUTHORIZATION AND CLINICAL MEDICATION REVIEW
   2| FACILITY: Cedar Grove Clinic
   3| DEPARTMENT: Clinical Pharmacy Services
   4| 
   5| TRANSMISSION HEADER:
   6| Date of Request: October 18, 2026
   7| Prescriber: Dr. Lev M. Rosenberg, MD
   8| Prescriber Specialty: Dermatology
   9| Clinic Telephone: (206) 555-0142
  10| Direct Clinic Fax: 206.555.0188
  11| 
  12| PATIENT DEMOGRAPHICS:
  13| PATIENT: AYLA CEVIK
  14| DOB: June 14, 1934
  15| Age: 92 y.o.
  16| Sex: Female
  17| Home Address:
  18| 742 Orchard View Road
  19| Seattle, WA 98103
  20| Primary Caregiver / Emergency Contact: Sung-ho Kim (husband)
  21| Contact Phone: (206) 555-0177
  22| Health Plan Member ID: 7741-2098-53
  23| Prescription Benefit Group: RX-99410
  24| 
  25| MEDICATION REQUESTED:
  26| Drug Name: Dupixent (dupilumab) pre-filled syringe
  27| Dose and Administration: 600 mg subcutaneous injection loading dose (administered as two 300 mg injections at separate sites), followed by 300 mg SC every 14 days
  28| Quantity: 2 syringes (300 mg/2 mL) per 28 days
  29| Anticipated Duration: 12 months
  30| 
  31| CLINICAL JUSTIFICATION AND HISTORY:
  32| Ayla Cevik is a 92 y.o. female presenting with severe, intractable atopic dermatitis complicated by generalized prurigo nodularis. The patient has been followed longitudinally at Cedar Grove Clinic by Dr. Lev M. Rosenberg. Physical exam demonstrates severe lichenification, excoriations, and erythematous plaques involving approximately 24% of total body surface area, predominantly affecting the bilateral upper extremities, trunk, and neck. Intense nocturnal pruritus has produced persistent sleep deprivation and secondary functional impairment.
  33| 
  34| TREATMENT HISTORY AND PREVIOUS FAILURES:
  35| 1. Topical Corticosteroids: Clobetasol propionate 0.05% cream and ointment applied twice daily to active lesions for eight consecutive weeks between May 2026 and July 2026, with only temporary and marginal reduction in erythema. Chronic application was subsequently tapered due to cutaneous atrophy and telangiectasias.
  36| 2. Topical Calcineurin Inhibitors: Tacrolimus 0.1% ointment applied BID for six weeks resulted in minimal therapeutic benefit and marked localized burning sensations.
  37| 3. Systemic Immunosuppressive Therapy: Oral methotrexate and cyclosporine were evaluated but contraindicated following multidisciplinary evaluation due to age-related renal insufficiency, mild hepatic enzyme elevation, and increased susceptibility to infectious complications.
  38| 
  39| VITAL SIGNS AND LABORATORY MONITORING:
  40| Vitals documented on October 18, 2026:
  41| Blood Pressure: 132/78 mmHg
  42| Pulse: 68 bpm, regular
  43| Respiratory Rate: 16 breaths/min
  44| Body Temperature: 36.8 C
  45| Weight: 54.2 kg, BMI: 23.1 kg/m2
  46| 
  47| Laboratory Findings (sampled October 12, 2026):
  48| Serum Creatinine: 1.05 mg/dL
  49| Estimated GFR: 51 mL/min/1.73m2
  50| Blood Urea Nitrogen: 22 mg/dL
  51| Serum Sodium: 140 mEq/L
  52| Serum Potassium: 4.2 mEq/L
  53| Total Bilirubin: 0.7 mg/dL
  54| AST: 38 U/L
  55| ALT: 41 U/L
  56| Absolute Eosinophil Count: 680 cells/uL (reference 15 to 500 cells/uL)
  57| Total Serum IgE: 1,420 IU/mL (reference <100 IU/mL)
  58| 
  59| COMPREHENSIVE MEDICATION RECONCILIATION:
  60| Reconciliation performed via chart review and structured telephone interview with the patient's husband, Sung-ho Kim:
  61| 1. Clobetasol propionate 0.05% ointment: Apply sparingly to affected areas BID PRN acute flares; dispensed 60 g tube.
  62| 2. Hydroxyzine hydrochloride 25 mg PO QHS PRN nocturnal itching; taking nightly.
  63| 3. Amlodipine besylate 5 mg PO daily for primary hypertension; adherence verified.
  64| 4. Rosuvastatin calcium 10 mg PO daily at bedtime for hyperlipidemia; tolerated well.
  65| 5. Cholecalciferol 1,000 IU PO daily for bone health maintenance.
  66| 6. Artificial tears (carboxymethylcellulose 0.5%) 1 drop into both eyes PRN dryness.
  67| 
  68| CLINICAL PHARMACY ASSESSMENT AND RECOMMENDATION:
  69| The clinical documentation confirms that Ayla Cevik has severe atopic dermatitis unresponsive to standard-of-care high-potency topical therapies. Systemic non-biologic immunosuppressants pose disproportionate toxicity risks. Dupilumab targeting interleukin-4 and interleukin-13 provides an established efficacy and safety profile in geriatric patients. Sung-ho Kim confirmed willingness to assist with proper refrigeration and subcutaneous injection administration at home following clinical training. Prior authorization criteria established by the patient's health plan mandate documented failure of topical therapies and contraindication to phototherapy or systemic agents. The patient cannot travel to the regional phototherapy center due to mobility limitations and lack of transportation. Her spouse also expressed concern regarding potential cutaneous infection given extensive excoriations. Initial authorization is requested for a twelve-month duration, after which objective clinical improvement will be documented using the Eczema Area and Severity Index (EASI) score prior to renewal. Complete dosing algorithms and monitoring guidelines are accessible at https://clinical-pathways.example.com/dermatology/biologics.
  70| 
  71| Reviewing Pharmacist: Rachel B. Klein, PharmD, BCPS
  72| Cedar Grove Clinic Pharmacy Services
=== END DOCUMENT ===
ITEMS FOR fd-0022:
D1 | line 27 | A: KEEP "subcutaneous injection" | B: KEEP "subcutaneous"
D2 | line 56 | A: KEEP "Absolute Eosinophil Count: 680 cells/uL (reference 15 to 500 cells/uL)" | B: KEEP "Absolute Eosinophil Count: 680 cells/uL"
D3 | line 57 | A: KEEP "Total Serum IgE: 1,420 IU/mL (reference <100 IU/mL)" | B: KEEP "Total Serum IgE: 1,420 IU/mL"
D4 | line 69 | A: KEEP "subcutaneous injection" | B: KEEP "subcutaneous"
D5 | line 69 | A: KEEP "Eczema Area and Severity Index (EASI) score" | B: KEEP "Eczema Area and Severity Index"
K1 | line 3 | KEEP "Clinical Pharmacy Services"
K2 | line 35 | KEEP "Topical Corticosteroids"
K3 | line 35 | KEEP "cutaneous atrophy"
K4 | line 35 | KEEP "telangiectasias"
K5 | line 36 | KEEP "Topical Calcineurin Inhibitors"
K6 | line 37 | KEEP "Systemic Immunosuppressive Therapy"
K7 | line 37 | KEEP "hepatic enzyme elevation"
K8 | line 37 | KEEP "infectious complications"
K9 | line 47 | KEEP "Laboratory Findings"
K10 | line 61 | KEEP "60 g"
K11 | line 62 | KEEP "nightly"
K12 | line 64 | KEEP "at bedtime"
K13 | line 66 | KEEP "into both eyes"
K14 | line 69 | KEEP "topical"
K15 | line 69 | KEEP "Systemic"
K16 | line 69 | KEEP "topical"
K17 | line 69 | KEEP "systemic"
K18 | line 69 | KEEP "phototherapy"
K19 | line 69 | KEEP "cutaneous infection"
K20 | line 72 | KEEP "Pharmacy Services"

=== DOCUMENT fd-0026 ===
   1| HORIZON GERIATRIC HEALTH CENTER
   2| INTERDISCIPLINARY CARE PLAN NOTICE
   3| 
   4| Date of Review: 04.03.2026
   5| Patient: Mrs. Dorothy Fletcher (92F)
   6| Designated Representative: Mr. Sean O'Donnell-Kelly
   7| 
   8| Dear Mrs. Fletcher,
   9| 
  10| This administrative letter confirms the updated outpatient care plan formulated during your geriatric clinical review on 04.03.2026. Following consultation between Dr. Rodrigo Peixoto and your son-in-law, Mr. Sean O'Donnell-Kelly, your daily pharmacotherapy has been adjusted to optimize cognitive stability while minimizing anticholinergic burden.
  11| 
  12| Your current reconciled medication regimen is confirmed as follows:
  13| - donepezil 10 mg PO daily at bedtime
  14| - memantine 10 mg PO BID with meals
  15| - levothyroxine 50 mcg PO daily on an empty stomach
  16| - cholecalciferol 1,000 IU PO daily
  17| 
  18| Prior authorization paperwork for your maintenance therapies has been submitted to your health plan. Please ensure that serum electrolytes and renal function panels are drawn within four weeks at any licensed outpatient laboratory.
  19| 
  20| Should you or your family require assistance with prescription home delivery or care coordination, please contact our intake desk at (206) 555-0173 ext. 402. Inquiries regarding social work navigation may be directed to our clinic coordinator, luciana tavares, via our secure administrative portal.
  21| 
  22| Sincerely,
  23| 
  24| Rodrigo Peixoto, MD
  25| Horizon Geriatric Health Center
=== END DOCUMENT ===
ITEMS FOR fd-0026:
K1 | line 14 | KEEP "with meals"

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
ITEMS FOR fd-0027:
D1 | line 27 | A: KEEP "left total hip arthroplasty" | B: KEEP "total hip arthroplasty"
D2 | line 33 | A: ADDRESS "Cedar Avenue in Minneapolis" | B: ADDRESS "Cedar Avenue" ; ADDRESS "Minneapolis"
D3 | line 35 | A: KEEP "estimated blood loss of 150 mL" | B: KEEP "150 mL"
D4 | line 62 | A: KEEP "every 6 hours" ; KEEP "as needed" | B: KEEP "every 6 hours as needed"
K1 | line 20 | KEEP "Geriatric Medicine"
K2 | line 23 | KEEP "subacute rehabilitation"
K3 | line 23 | KEEP "surgical repair"
K4 | line 23 | KEEP "right subtrochanteric femur fracture"
K5 | line 26 | KEEP "Closed right subtrochanteric femur fracture"
K6 | line 26 | KEEP "mechanical ground-level fall"
K7 | line 26 | KEEP "right cephalomedullary nail fixation"
K8 | line 28 | KEEP "Osteopenia"
K9 | line 28 | KEEP "age-related senile gait instability"
K10 | line 29 | KEEP "Essential hypertension"
K11 | line 30 | KEEP "Mild chronic sensorineural hearing loss, bilateral"
K12 | line 33 | KEEP "mechanical fall"
K13 | line 33 | KEEP "Radiographs"
K14 | line 33 | KEEP "displaced, closed right subtrochanteric femur fracture"
K15 | line 35 | KEEP "orthopedic surgery"
K16 | line 35 | KEEP "closed reduction and intramedullary fixation"
K17 | line 35 | KEEP "right trochanteric femoral nail"
K18 | line 35 | KEEP "cephalomedullary lag screw insertion"
K19 | line 35 | KEEP "radiographs"
K20 | line 37 | KEEP "geriatric co-management"
K21 | line 37 | KEEP "nonsteroidal anti-inflammatory"
K22 | line 37 | KEEP "Deep venous thrombosis"
K23 | line 37 | KEEP "Physical therapy"
K24 | line 39 | KEEP "sit-to-stand transfers"
K25 | line 39 | KEEP "inpatient physical therapy"
K26 | line 42 | KEEP "Vital Signs"
K27 | line 43 | KEEP "General"
K28 | line 44 | KEEP "Cardiovascular"
K29 | line 45 | KEEP "Pulmonary"
K30 | line 46 | KEEP "Surgical Site"
K31 | line 46 | KEEP "Distal pulses 2+ dorsalis pedis and posterior tibial"
K32 | line 49 | KEEP "10.1 g/dL"
K33 | line 60 | KEEP "deep venous thrombosis"
K34 | line 64 | KEEP "hypertension"
K35 | line 68 | KEEP "Daily"
K36 | line 68 | KEEP "physical and occupational therapy"
K37 | line 69 | KEEP "Staple removal"
K38 | line 70 | KEEP "Orthopedic re-evaluation"
K39 | line 70 | KEEP "repeat radiographs"
K40 | line 70 | KEEP "Geriatric clinic"

=== DOCUMENT fd-0036 ===
   1| Cedar Lane Pharmacy
   2| Refill call note
   3| Date of Service: Sept. 12, 2026
   4| Patient: MAIMOUNA LOUM
   5| DOB: Apr. 3, 1987
   6| Rx: 6621904
   7| Plan ID: 3190 6621 44
   8| Phone: (504) 555-0118
   9| Email: maimouna.loum at example dot com
  10| 
  11| Present for the call: Daisy Keene, technician; Chase Elwood, MD; Nadir al-Hashim, husband of the patient.
  12| 
  13| The technician took a refill request for methimazole and propranolol and read the profile back to the husband, who had the bottles in hand at home. Maimouna Loum is a 39-year-old woman with Graves disease. She was at the market during the call and asked that the details be settled with her husband. He confirmed she has not missed more than an occasional tablet in the past month.
  14| 
  15| Profile after the call. Methimazole 10 mg tablet by mouth once daily in the morning. This is the current step of a taper of 30/20/10 mg, and 10 mg is the dose the prescriber wants continued. Propranolol 10 mg tablet by mouth twice daily, morning and late afternoon, for residual tremor. A multivitamin once daily and calcium 500 mg by mouth twice daily with food are also on the shelf and do not need a new prescription today. No biotin was reported.
  16| 
  17| Last values, from the clinic note filed with the profile. Free T4 1.3 ng/dL. TSH 0.18 mIU/L, still low, which is expected this early after the dose reduction. White blood cell count 6.4 K/uL with a normal neutrophil count. Pulse 78 beats per minute. Blood pressure 118/70 mmHg. Weight 64 kg. She has no fever, sore throat, mouth ulcers, or jaundice. Heart rate has stayed under 100 without palpitations that stop her work.
  18| 
  19| Counseling on the call. Stop methimazole and seek a same-day blood count for fever, severe sore throat, or mouth ulcers. Do not restart it until a clinician says the count is safe. Take it at the same time each morning, with or without food. Propranolol should not be stopped abruptly. Take it with food if the stomach is uneasy, and call for wheezing or a pulse that feels too slow. The husband read those points back correctly.
  20| 
  21| Refill plan. Dispense methimazole 10 mg, ninety tablets, one daily, with two refills remaining on the current prescription. Dispense propranolol 10 mg, one hundred eighty tablets, one twice daily, which covers the same ninety days. No early refill override was needed. The prescriber does not need a new signature for this fill. A follow-up thyroid panel is already scheduled, and the result should be on the profile before the next refill is released. If free T4 drifts high, hold further fills and send the profile back for a dose change rather than continuing 10 mg by habit.
  22| 
  23| The husband will pick up both bottles this evening. He was asked to bring an identification card. The patient wants the pharmacy email used for ready notices, written as on this form so the message is not missed by a filter. No allergy to methimazole or to propranolol is on the profile. She does not take an iodine supplement. End of refill call note.
=== END DOCUMENT ===
ITEMS FOR fd-0036:
K1 | line 15 | KEEP "10 mg"
K2 | line 17 | KEEP "normal neutrophil count" [labeler unsure]
K3 | line 23 | KEEP "iodine"

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
ITEMS FOR fd-0042:
D1 | line 13 | A: KEEP "symptomatic gastroesophageal reflux" | B: KEEP "gastroesophageal reflux"
D2 | line 15 | A: KEEP "positive sonographic Murphy sign" | B: KEEP "sonographic Murphy sign"
D3 | line 17 | A: KEEP "four-port laparoscopic cholecystectomy" | B: KEEP "laparoscopic cholecystectomy"
D4 | line 17 | A: KEEP "acute and chronic cholecystitis" ; KEEP "cholelithiasis" | B: KEEP "acute and chronic cholecystitis with cholelithiasis"
K1 | line 13 | KEEP "Past medical history"
K2 | line 13 | KEEP "vaginal deliveries"
K3 | line 13 | KEEP "abdominal surgery"
K4 | line 13 | KEEP "multivitamin"
K5 | line 13 | KEEP "bleeding disorder"
K6 | line 15 | KEEP "general surgery service"
K7 | line 15 | KEEP "gallbladder wall thickening"
K8 | line 15 | KEEP "bile duct dilatation"
K9 | line 15 | KEEP "Venous thromboembolism prophylaxis"
K10 | line 17 | KEEP "Estimated blood loss was 25 mL"
K11 | line 19 | KEEP "6 out of 10"
K12 | line 19 | KEEP "3 out of 10"
K13 | line 19 | KEEP "laparoscopy"
K14 | line 19 | KEEP "constipation"
K15 | line 27 | KEEP "intravenous"
K16 | line 29 | KEEP "jaundice"
K17 | line 31 | KEEP "fever above 101 degrees Fahrenheit"
K18 | line 31 | KEEP "cholangiogram"
K19 | line 38 | KEEP "General Surgery"

=== DOCUMENT fd-0047 ===
   1| Patient: Uliana Parfenova
   2| DOB: 14-03-1934
   3| Age: 92F
   4| Account number: 661284503
   5| Date: 11-02-2026
   6| 
   7| Dear family,
   8| 
   9| This letter follows a portal sign-in and a question about medicines for Uliana Parfenova. A session opened the laboratory page from 198.51.100.44. If that session was not started by her daughter-in-law leila karimi-nasab, tell us so the password can be reset before any other page is opened. Mrs. Brown in medical records is the staff member who keeps the release form and can say whether a family member is allowed to see results. She will ask for the account number on this letter before she speaks about the chart.
  10| 
  11| The values that were viewed do not show a new emergency. The creatinine is close to her prior result, the hemoglobin is steady, and the potassium is in range on the supplement. We still want a person to look at how she is breathing and walking, because numbers do not show a fall or new swelling. Please keep the present regimen unless you see bleeding, black stools, fainting, or a fall with head injury: apixaban 2.5 mg PO BID, furosemide 20 mg PO daily, potassium chloride 10 mEq PO daily, and donepezil 5 mg PO every morning. Acetaminophen 650 mg PO q6h PRN may be used for joint pain. Do not add ibuprofen, naproxen, or aspirin for pain. The apixaban is being used because of atrial fibrillation, and a missed dose should be taken only if it is remembered the same day. Do not double the next dose.
  12| 
  13| Please bring a home blood pressure log and a weight log. A single low reading is not a reason to stop furosemide. Stop it and call if she has marked dizziness while standing, if the weight rises more than a few pounds over a few days, or if she wakes short of breath. Donepezil can cause vivid dreams, loose stools, and a slower pulse. If the morning dose is missed and it is already afternoon, skip it rather than giving it at bedtime, so it does not add to vivid dreams overnight.
  14| 
  15| Diet has been a source of confusion. She may salt food lightly unless swelling is active. Potassium-containing salt substitutes are a poor idea while she takes the potassium supplement. Her daughter-in-law already helps set out the morning and bedtime doses. Please do not change the pillbox to a weekly tray without bringing the old bottles, because the donepezil tablet and the furosemide tablet can look similar in a dim kitchen.
  16| 
  17| The after-visit summary sent earlier came back undelivered. Please confirm the home address on file, Apt 6D, 914 Sycamore Street, Redcliff, KS 66914, or send a correction in writing. If leila karimi-nasab recieves mail at a different unit, we need that update before the next summary is printed. We do not need a new release if the current form already names her. A seperate copy of the laboratory page can be mailed once the address is confirmed. Untill then, please do not forward portal screenshots.
  18| 
  19| Questions about the sign-in can go to Mrs. Brown. Questions about bleeding, swelling, confusion that is worse than baseline, or a fall can go to the nurse through the main clinic line at 414–555–0162. Ask for the nurse working with the signing clinician. Thank you for watching the portal and the medicines with care.
  20| 
  21| Dr. Malcolm Heathcott
  22| Internal Medicine
=== END DOCUMENT ===
ITEMS FOR fd-0047:
K1 | line 15 | KEEP "potassium"
K2 | line 22 | KEEP "Internal Medicine" [labeler unsure]

=== DOCUMENT fd-0056 ===
   1| From: Anežka Pěničková
   2| To: wound care portal
   3| Date of Service: November 2, 2026
   4| 
   5| hello, this is the patient. please send the supply refill to Mrs. Marjorie Cartwright, my mother, at PO Box 418, Quarry Hill, KS 66048, because i am staying with her while the graft heals. i was told the left shin ulcer is smaller. i have been doing the saline soak and then mupirocin 2% ointment topically BID and wrapping with a dry gauze. pain is fine on acetaminophen 500 mg PO q6h PRN. my sugar before lunch was 162 mg/dL and the home cuff read 128/76 mmHg, pulse 80. dr. mendel krasner told me the last culture grew ordinary skin bacteria and not to start an oral antibiotic. the form they mailed still has SSN 000-28-4419 on it and i would rather not keep mailing that around. can someone confirm the dressing plan.
   6| 
   7| From: Dr. Mendel Krasner
   8| To: Anežka Pěničková
   9| 
  10| Thank you. We will use your mother's mailing address for the supply box only.
  11| 
  12| Assessment: venous stasis ulcer of the left shin, type 2 diabetes. The graft check showed a clean base and less drainage. Continue mupirocin 2% ointment topically BID for five more days, then stop it and use plain petrolatum gauze daily. Keep acetaminophen 500 mg PO q6h PRN, no more than 3 g a day. Do not start cephalexin unless we call you. Labs from the visit: hemoglobin A1c 8.1%, WBC 7.4 K/uL, creatinine 0.9 mg/dL. Temperature was 36.7 C. No debridement is planned this week. A repeat wound check is the only procedure on the books.
  13| 
  14| Please do not send the social security number again on the portal. We already have what we need in the chart, and that mailing form should be shredded. Kestrel Wound Clinic will stay the site for the in-person checks. Write if the wound turns red, warm, or foul, or if glucose stays over 250 mg/dL.
=== END DOCUMENT ===
ITEMS FOR fd-0056:
D1 | line 5 | A: KEEP "PO" ; ADDRESS "PO Box 418, Quarry Hill, KS 66048" | B: ADDRESS "PO Box 418, Quarry Hill, KS 66048"
K1 | line 5 | KEEP "graft"
K2 | line 5 | KEEP "left shin ulcer"
K3 | line 5 | KEEP "saline soak"
K4 | line 5 | KEEP "2%"
K5 | line 5 | KEEP "PO"
K6 | line 5 | KEEP "sugar before lunch was 162 mg/dL"
K7 | line 5 | KEEP "128/76 mmHg"
K8 | line 5 | KEEP "pulse 80"
K9 | line 5 | KEEP "culture"
K10 | line 5 | KEEP "ordinary skin bacteria"
K11 | line 5 | KEEP "oral"
K12 | line 12 | KEEP "graft check"
K13 | line 12 | KEEP "2%"
K14 | line 12 | KEEP "petrolatum"
K15 | line 12 | KEEP "a day"
K16 | line 12 | KEEP "Temperature was 36.7 C"
K17 | line 14 | KEEP "glucose stays over 250 mg/dL"

=== DOCUMENT fd-0060 ===
   1| Care coordination note
   2| 
   3| This letter asks Pain Clinic to accept a referral for a 71-year-old woman
   4| with Parkinson disease diagnosed in 2016 and with lumbar radiculopathy
   5| that has not improved after conservative care. The referral is to Pain
   6| Clinic as a service of this health system, for consideration of a lumbar
   7| epidural steroid injection. Records from Outside Hospital include the
   8| operative note from a right knee arthroscopy and the images from a lumbar
   9| MRI. Please request those outside records before the procedure visit
  10| so the films can be compared with the local study.
  11| 
  12| Diagnoses relevant to this request are Parkinson disease, lumbar spinal
  13| stenosis with radiculopathy, osteoarthritis of the right knee, and a
  14| recent inflammatory flare of the knee. She had a right knee arthroscopy
  15| several years ago and physical therapy afterward. Walking tolerance is
  16| now limited to about one block. She describes burning pain down the right
  17| leg to the dorsum of the foot, worse with standing. There is no bowel or
  18| bladder incontinence, no saddle anesthesia, and no progressive weakness
  19| that would suggest cauda equina syndrome. Straight leg raise increases
  20| the leg pain. Strength is 5/5 at the hips and 4/5 at the right ankle
  21| dorsiflexion. Resting tremor and mild bradikinesia are present and are
  22| followed by neurology.
  23| 
  24| Current medications are carbidopa-levodopa 25/100 mg PO TID, rasagiline
  25| 1 mg PO daily, Lyrica 75 mg PO BID for neuropathic pain, acetaminophen
  26| 650 mg PO q6h PRN pain, and a short prednisone taper of 40/30/20/10 mg
  27| PO daily, each dose level for three days, for the knee flare. Generic
  28| pregabalin may be substituted for Lyrica if the strength is the same.
  29| Please do not stop carbidopa-levodopa before the procedure without
  30| speaking with neurology. Aspirin 81 mg PO daily is held only if the
  31| injectionist requests it. She does not take an anticoagulant. The
  32| covering pharmacist reconciled this list with the pill bottles recently
  33| and found one extra bottle of acetaminophen.
  34| 
  35| Laboratory results drawn at the clinic: white blood cell count 7.2 K/uL,
  36| hemoglobin 12.8 g/dL, platelets 214 K/uL, creatinine 0.8 mg/dL, eGFR 81
  37| mL/min/1.73 m2, CRP 6.1 mg/L, and hemoglobin A1c 6.2%. Vitals at that
  38| visit were blood pressure 136/78 mmHg, heart rate 64 beats per minute,
  39| respiratory rate 16 breaths per minute, oxygen saturation 97% on room
  40| air, temperature 36.6 C, and weight 68 kg. The knee was warm but not red.
  41| There is no fever and no suspicion of septic arthritis.
  42| 
  43| The procedure requested is a lumbar epidural steroid injection under
  44| flouroscopy, with a possible right L4-L5 transforaminal approach if the
  45| MRI supports it. Diagnoses to link to the procedure are lumbar
  46| radiculopathy and lumbar spinal stenosis. If Pain Clinic prefers a medial
  47| branch block first, that alternative is acceptable to the referring
  48| clinician. The patient has already completed a course of physical therapy
  49| and a home exercise program. She uses a single-point cane. Her daughter
  50| drives her to visits and can stay for teaching.
  51| 
  52| Falls have occured twice this season, both without head injury and
  53| without fracture. Neurology believes the falls relate to shuffling gait
  54| rather than to orthostasis. Blood pressure does not drop when she stands.
  55| She should bring a current list of evening doses, because
  56| carbidopa-levodopa timing is easy to confuse on a procedure morning when
  57| she may be told to arrive without eating. If the service needs a caregiver
  58| present for consent teaching, her daughter is willing. No interpreter is
  59| required.
  60| 
  61| Please send the patient instructions that mention holding further
  62| prednisone if the taper has already finished, continuing Lyrica 75 mg PO
  63| BID the morning of the procedure unless told otherwise, and arranging a
  64| ride home. She should call the clinic for new weakness, loss of bladder
  65| control, headache with fever, or symptoms of very high glucose while on
  66| prednisone. We can send a seperate summary of the neurology notes if Pain
  67| Clinic needs them. Thank you for reviewing this referral. A reply with
  68| the first available procedure day is enough to move scheduling forward.
  69| The referring office will complete any form the service requires.
  70| 
  71| Care coordination
  72| On behalf of the referring clinician
=== END DOCUMENT ===
ITEMS FOR fd-0060:
K1 | line 14 | KEEP "inflammatory flare of the knee"
K2 | line 15 | KEEP "physical therapy"
K3 | line 17 | KEEP "bowel or\nbladder incontinence"
K4 | line 18 | KEEP "saddle anesthesia"
K5 | line 18 | KEEP "progressive weakness"
K6 | line 19 | KEEP "Straight leg raise"
K7 | line 20 | KEEP "5/5"
K8 | line 20 | KEEP "4/5"
K9 | line 21 | KEEP "Resting tremor"
K10 | line 21 | KEEP "bradikinesia"
K11 | line 25 | KEEP "neuropathic pain"
K12 | line 27 | KEEP "knee flare"
K13 | line 41 | KEEP "fever"
K14 | line 44 | KEEP "flouroscopy"
K15 | line 44 | KEEP "right L4-L5 transforaminal approach"
K16 | line 45 | KEEP "MRI"
K17 | line 48 | KEEP "physical therapy"
K18 | line 49 | KEEP "home exercise program"
K19 | line 52 | KEEP "head injury"
K20 | line 53 | KEEP "fracture"
K21 | line 53 | KEEP "shuffling gait"
K22 | line 54 | KEEP "orthostasis"
K23 | line 64 | KEEP "new weakness"
K24 | line 64 | KEEP "loss of bladder\ncontrol"
K25 | line 65 | KEEP "headache"
K26 | line 65 | KEEP "fever"
K27 | line 65 | KEEP "very high glucose"

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
ITEMS FOR fd-0068:
D1 | line 15 | A: KEEP "Outpatient Neurorehabilitation Service" | B: FACILITY "Outpatient Neurorehabilitation Service" [unsure]
D2 | line 25 | A: KEEP "idiopathic Parkinson disease" | B: KEEP "Parkinson disease"
D3 | line 27 | A: RELATIVE "Barbosa" | B: (nothing)
D4 | line 37 | A: KEEP "Lee Silverman Voice Treatment (LSVT) BIG" | B: KEEP "Lee Silverman Voice Treatment" [unsure]
K1 | line 5 | KEEP "REFERRED BY"
K2 | line 7 | KEEP "Department of Neurology"
K3 | line 11 | KEEP "PATIENT MAILING ADDRESS"
K4 | line 14 | KEEP "REFERRED TO"
K5 | line 16 | KEEP "Physical & Occupational Therapy"
K6 | line 18 | KEEP "PATIENT DETAILS"
K7 | line 25 | KEEP "outpatient neurorehabilitation"
K8 | line 27 | KEEP "postural instability"
K9 | line 27 | KEEP "motor fluctuations"
K10 | line 27 | KEEP "resting tremor"
K11 | line 27 | KEEP "cogwheel rigidity"
K12 | line 27 | KEEP "micrographia"
K13 | line 27 | KEEP "autonomic failure"
K14 | line 27 | KEEP "orthostatic hypotension"
K15 | line 27 | KEEP "atypical parkinsonism"
K16 | line 29 | KEEP "hypophonic"
K17 | line 29 | KEEP "Cranial nerve examination"
K18 | line 29 | KEEP "gaze palsy"
K19 | line 29 | KEEP "facial asymmetry"
K20 | line 29 | KEEP "Motor examination"
K21 | line 29 | KEEP "bradykinesia"
K22 | line 29 | KEEP "resting tremor"
K23 | line 29 | KEEP "cogwheel rigidity"
K24 | line 29 | KEEP "Deep tendon reflexes were 2+"
K25 | line 29 | KEEP "flexor plantar responses"
K26 | line 29 | KEEP "Gait assessment"
K27 | line 29 | KEEP "Retropulsion testing"
K28 | line 29 | KEEP "pull test"
K29 | line 32 | KEEP "1 tablet"
K30 | line 32 | KEEP "1.5 tablets"
K31 | line 34 | KEEP "constipation"
K32 | line 37 | KEEP "physical therapy"
K33 | line 37 | KEEP "occupational therapy"
K34 | line 37 | KEEP "adaptive home equipment assessment"
K35 | line 37 | KEEP "speech-language evaluation"
K36 | line 37 | KEEP "vocal intensity training"
K37 | line 41 | KEEP "Department of Neurology"

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
ITEMS FOR fd-0072:
D1 | line 25 | A: KEEP "recurrent left medial ankle ulcer" | B: KEEP "ankle ulcer"
D2 | line 35 | A: KEEP "petrolatum" | B: KEEP "petrolatum dressing"
D3 | line 50 | A: KEEP "oxygen saturation 91 percent on room air and 95 percent on 2 liters nasal cannula" | B: KEEP "oxygen saturation 91 percent"
D4 | line 56 | A: KEEP "CURB-65 score is 1" | B: KEEP "CURB-65 score"
D5 | line 58 | A: KEEP "petrolatum" | B: KEEP "petrolatum dressing"
K1 | line 3 | KEEP "Inpatient History and Physical"
K2 | line 20 | KEEP "temperature taken at home of 101.4 F"
K3 | line 20 | KEEP "Aspiration"
K4 | line 20 | KEEP "a liter"
K5 | line 22 | KEEP "debrided"
K6 | line 41 | KEEP "twice a week"
K7 | line 41 | KEEP "ulcer"
K8 | line 44 | KEEP "lung disease"
K9 | line 47 | KEEP "healing ulcer"
K10 | line 50 | KEEP "Left medial ankle ulcer"
K11 | line 50 | KEEP "nuchal rigidity"
K12 | line 53 | KEEP "sinus rhythm at 98"
K13 | line 53 | KEEP "acute ischemic change"
K14 | line 53 | KEEP "Influenza and COVID swabs"
K15 | line 56 | KEEP "oxygen"
K16 | line 56 | KEEP "every hour while awake"
K17 | line 56 | KEEP "Physical therapy"
K18 | line 58 | KEEP "debrided"
K19 | line 58 | KEEP "ulcer"

=== DOCUMENT fd-0078 ===
   1| From: Brigid Jarrow-O'Neill
   2| To: postpartum portal pool
   3| Subject: pressure and the cuff
   4| 
   5| hi, this is the patient. i delivered at Harwick General Hospital on the 4th of July and the delivery note said the Apgar score was 8 and then 9. i am 28 and my presure is still up. my brother bakary konaté has been staying over becuase i get dizzy on the stairs. bell hargrove at the desk said to message instead of waiting on hold. i was told to keep labetalol 200 mg PO BID and to check pressures at home. this week they were 142/90 mmHg in the morning and 128/82 mmHg at night, pulse 76 beats per minute. i also take a prenatal vitamin PO daily while i am still nursing and sertraline 50 mg PO daily. please look at MRN: 5582104. seperate issue, the cuff they ordered never came. please ship a replacement to
   6| 14 Alden Lane
   7| Cedar Post, WI 53590
   8| if someone needs me by phone it is (218) 555-0173 ext. 3307. T.G. the respiratory therapist is not part of this, that was an inhaler teaching visit in a different month and i am not using an inhaler now.
   9| 
  10| From: Helen Apgar, MD
  11| To: the patient
  12| 
  13| Thank you. We have the home readings and the chart number.
  14| 
  15| Assessment: postpartum hypertension, mood symptoms on treatment. Continue labetalol 200 mg PO BID. Add nifedipine XL 30 mg PO daily if a morning reading is still at or above 140/90 mmHg after three more days. Keep the prenatal vitamin one tablet PO daily. Do not stop sertraline 50 mg PO daily all at once. Headache, vision change, or a reading at or above 160/110 mmHg needs a same-day visit.
  16| 
  17| Labs from the last draw: creatinine 0.6 mg/dL, AST 22 U/L, ALT 19 U/L, hemoglobin 11.4 g/dL, platelets 240 K/uL, urine protein negative. Clinic vitals were blood pressure 138/88 mmHg, pulse 74 beats per minute, temperature 36.7 C, respiratory rate 14 breaths per minute, oxygen saturation 99% on room air. The Apgar score in the delivery note is newborn history only and does not change the blood pressure plan. No magnesium infusion and no re-admission are planned.
  18| 
  19| The front desk can track the cuff. Use the phone line you already sent if the carrier asks for a callback. We do not need the street address repeated on this thread.
=== END DOCUMENT ===
ITEMS FOR fd-0078:
D1 | line 17 | A: KEEP "magnesium infusion" | B: KEEP "magnesium"
K1 | line 15 | KEEP "mood symptoms"
K2 | line 15 | KEEP "one tablet"
K3 | line 15 | KEEP "Headache"
K4 | line 15 | KEEP "vision change"

Now output the result blocks.