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


=== DOCUMENT fd-0001 ===
   1| REFILL AUTHORIZATION NOTE
   2| PATIENT: HENDRIKA VAN ROOIJEN
   3| DATE: 03-04-2026
   4| CALLBACK: +1 541 555 0148
   5| 
   6| The patient is ninety-three years old. Her daughter, Nell Hargrove,
   7| phoned the refill line because the apixaban bottle is down to four
   8| tablets. Speaking with the patient afterward, she was oriented and
   9| knew each medicine. She denied chest pain, black stools, a new cough,
  10| and any fall. Home weights have been stable, and ankle swelling is no
  11| worse than last week.
  12| 
  13| Regimen confirmed against the labels she read aloud:
  14| apixaban 5 mg PO BID
  15| furosemide 20 mg PO every morning
  16| metoprolol succinate 50 mg PO daily
  17| potassium chloride 10 mEq PO daily with breakfast
  18| 
  19| The apixaban refill on van Rooijen's profile is appropiate and was
  20| queued for tomorrow. Prescriber Eliška Březinová has not changed the
  21| doses. Age alone does not force a lower dose, and the last creatinine
  22| was not high enough to qualify her, so the 5 mg strength stays. She
  23| is to hold furosemide on days she feels too dizzy to stand, and she
  24| should not double apixaban after a missed dose. I reminded her that
  25| NSAIDs do not mix well with apixaban. Acetaminophen is already in the
  26| cabinet for knee pain. She has occassional lightheadedness on
  27| standing. No new allergy was reported. Her daughter will pick up the
  28| filled bottle tomorrow afternoon. The request was recieved with enough
  29| tablets to cover tonight and tomorrow morning.
=== END DOCUMENT ===
ITEMS FOR fd-0001:
K1 | line 13 | KEEP "Regimen confirmed against the labels she read aloud"

=== DOCUMENT fd-0003 ===
   1| CLINICAL PHARMACY DISPENSARY CONSULTATION NOTE
   2| TRANSCRIBED FROM AMBULATORY CARE REFILL SYSTEM
   3| 
   4| PATIENT NAME: Kenji
   5| Fujimoto
   6| DOB: 12.08.1934
   7| AGE: The patient is ninety-two years old.
   8| PLAN IDENTIFIER: Plan Member ID: GHP-9938201
   9| PRESCRIPTION NUMBER: Rx # 8392014
  10| ADDRESS: 518 Evergreen Point Road, Bellevue, WA 98004
  11| CAREGIVER: Ms. Alice Taylor (patient's adult stepdaughter)
  12| CONTACT PHONE: +1-206-555-0158
  13| PRIMARY PHYSICIAN: Dr. Thomas Crawford, MD
  14| CONSULTING GERIATRICIAN: Dr. Eleanor O'Connor-Bates, MD
  15| CLINICAL PHARMACIST: Robert Miller, PharmD, BCGP
  16| DATE OF CONSULTATION: 04.11.2026
  17| 
  18| REASON FOR CONSULTATION:
  19| Comprehensive
  20|  medication reconciliation and blister-pack compliance
  21| review requested by Dr. Crawford following recent clinic discharge.
  22| Mr. Fujimoto is a ninety-two years old male with chronic open-angle
  23| glaucoma, mild vascular cognitive impairment, hypertension, and
  24| benign prostatic hyperplasia. Previous outpatient records indicate
  25| occasional missed doses when taking loose tablets from individual
  26| manufacturer bottles. Outreach was completed to evaluate current
  27| tolerability, verify caregiver administration, and coordinate refill
  28| dispensing through our specialized packaging pharmacy.
  29| 
  30| CAREGIVER INTERVIEW & COMPLIANCE ASSESSMENT:
  31| Robert Miller conducted an extensive structured telephone intake with
  32| Ms. Alice Taylor, who oversees daily pill organizers and eye drop
  33| instillation. Ms. Taylor reported that Mr. Fujimoto has maintained
  34| consistent compliance since the implementation of weekly pre-sorted
  35| blister packaging. Baseline intraocular pressures measured last week
  36| were 15 mmHg in the right eye and 16 mmHg in the left eye, indicating
  37| effective therapeutic response to latanoprost. No episodes of
  38| orthostatic lightheadedness, syncope, or acute visual changes have
  39| occurred over the preceding month. Blood pressure logs recorded at
  40| home average 126/74 mmHg seated.
  41| 
  42| MEDICATION PROFILE RECONCILED:
  43| 1. Latanoprost 0.005% ophthalmic solution, instill 1 drop into both
  44| eyes once daily in the evening for intraocular pressure control.
  45| Dispensed under Rx # 8392014 for 30-day cycle.
  46| 2. Amlodipine besylate 5 mg PO daily each morning.
  47| 3. Tamsulosin hydrochloride 0.4 mg PO daily approximately 30 minutes
  48| after the evening meal.
  49| 4. Donepezil hydrochloride 5 mg PO daily at bedtime for cognitive
  50| support; Dr. O'Connor-Bates recommended continuing current dose
  51| without escalation to minimize bradycardia risk.
  52| 5. Cholecalciferol 1,000 IU PO daily with breakfast.
  53| 6. Artificial tears, instill 1 to 2 drops in both eyes topically
  54| PRN for dry eye irritation.
  55| 
  56| CLINICAL PHARMACY EVALUATION & PLAN:
  57| 1. Reconciled full regimen against hospital discharge summary and clinic
  58| records provided by Dr. Thomas Crawford. Serum creatinine measured on
  59| 04.11.2026 was 1.02 mg/dL with eGFR 66 mL/min/1.73 m2, confirming stable
  60| renal clearance for all maintenance agents.
  61| 2. Verified coverage under Plan Member ID: GHP-9938201. Prior
  62| authorization renewal for latanoprost multi-pack was validated with the
  63| patient's health plan to prevent lapse in therapy.
  64| 3. Synchronized refill schedules for all oral maintenance medications to
  65| dispense concurrently in 30-day multi-dose blister compliance cards.
  66| Blister packaging organizes morning and evening doses into separate
  67| sealed compartments to enhance safety and prevent inadvertent dose
  68| duplication.
  69| 4. Ms. Taylor confirmed pharmacy courier delivery to 518 Evergreen
  70| Point Road is arranged for tomorrow afternoon.
  71| 5. Follow-up medication therapy review scheduled with Dr. Eleanor
  72| O'Connor-Bates in three months.
  73| 
  74| Robert Miller, PharmD, BCGP
  75| Clinical Specialist in Geriatric Pharmacotherapy
=== END DOCUMENT ===
ITEMS FOR fd-0003:
D1 | line 23 | A: KEEP "mild vascular cognitive impairment" | B: KEEP "vascular cognitive impairment"
D2 | line 58 | A: KEEP "Serum creatinine measured on\n04.11.2026 was 1.02 mg/dL" ; DATE "04.11.2026" | B: DATE "04.11.2026"
K1 | line 20 | KEEP "medication reconciliation"
K2 | line 35 | KEEP "intraocular pressures measured last week\nwere 15 mmHg in the right eye and 16 mmHg in the left eye"
K3 | line 38 | KEEP "syncope"
K4 | line 39 | KEEP "Blood pressure logs recorded at\nhome average 126/74 mmHg"
K5 | line 43 | KEEP "0.005%"
K6 | line 44 | KEEP "in the evening"
K7 | line 46 | KEEP "each morning"
K8 | line 49 | KEEP "at bedtime"
K9 | line 51 | KEEP "bradycardia"
K10 | line 52 | KEEP "with breakfast"
K11 | line 54 | KEEP "dry eye irritation"
K12 | line 71 | KEEP "medication therapy review"

=== DOCUMENT fd-0011 ===
   1| Willow Creek Pharmacy
   2| Medication Reconciliation Note
   3| Prepared: March 4, 2026
   4| 
   5| Patient: Helen M. Bruckner
   6| DOB: November 18, 1933
   7| Age: 92 y.o.
   8| MRN: 7044-1183-26
   9| Home phone: (937) 555-0148
  10| Email: hbruckner@example.com
  11| Home address:
  12| 418 Hickory Court
  13| Kettering, OH 45429
  14| 
  15| Prescriber: Ellis Dowd, MD
  16| Caller: Ifeoma Nwosu, daughter-in-law of the patient
  17| 
  18| Source. Reconciliation opened after a morning call to the refill
  19| line. The caller fills the weekly pill boxes and said a discharge
  20| packet arrived by fax from the prescriber's office. Two bottles in
  21| the cabinet no longer match that packet. We recieved the fax at the
  22| counter just after 09:40. The scan was light, so the new diuretic
  23| sig was read twice against the list she held to the phone.
  24| 
  25| Reason for the call. Ninety-day supplies of warfarin, metoprolol
  26| succinate, lisinopril, and levothyroxine were due out today. A
  27| furosemide 40 mg tablet was added last week for fluid. She wanted
  28| the warfarin and the diuretic kept seperate from the morning slots until a
  29| pharmacist signed the list. She also asked that we speak with the patient Helen
  30| Bruckner before any bottle is mailed. There have been occassional
  31| nosebleeds, and the evening warfarin was skipped on those days.
  32| 
  33| History used for the check. Atrial fibrillation, longstanding.
  34| Heart failure with preserved ejection fraction. Hypertension.
  35| Stage 3 chronic kidney disease. Hypothyroidism. The only allergy
  36| is a rash to a sulfa antibiotic years ago. Furosemide was continued
  37| with a rash check, since the prescriber had already accepted that
  38| risk. No statin. Fall risk is high and a walker is used indoors.
  39| Vitamin K intake has been steady. No new antibiotic or herbal
  40| product was reported.
  41| 
  42| Medications after reconciliation.
  43| 
  44| Warfarin 4 mg tablet by mouth once daily at 18:00. Goal INR 2.0 to
  45| 3.0. Evening only. Do not add aspirin or any NSAID. Hold and call
  46| for black stool, a nosebleed that will not stop, or a fall with a
  47| blow to the head.
  48| 
  49| Metoprolol succinate 50 mg tablet by mouth once daily. Do not
  50| crush. Hold for a heart rate under 50 or for new wheezing.
  51| 
  52| Lisinopril 10 mg tablet by mouth once daily. Call for dizziness on
  53| standing, a new cough, or swelling of the tongue or lips.
  54| 
  55| Furosemide 40 mg tablet by mouth each morning. New on the faxed
  56| packet. Weigh each morning. Call for a gain over 2 pounds in a day,
  57| for cramps, or for a weight that drops quickly.
  58| 
  59| Levothyroxine 88 mcg tablet by mouth once daily on an empty stomach,
  60| thirty minutes before food. Keep it away from the fiber supplement,
  61| which was stopped last month and should stay stopped.
  62| 
  63| Cholecalciferol 1000 units by mouth once daily. Family supplied, not
  64| dispensed from our stock today.
  65| 
  66| Acetaminophen 500 mg tablet by mouth every six hours as needed for
  67| pain. Do not exceed 3 g from all sources in 24 hours.
  68| 
  69| Stopped. Aspirin 81 mg daily was retired at the last visit because
  70| of nosebleeds on warfarin. An old bottle remains in a kitchen drawer
  71| and will be brought in for disposal. Ibuprofen stays off.
  72| 
  73| Labs and vitals copied from the clinic note of February 26, 2026.
  74| 
  75|     Test                 Result
  76|     INR                  2.6 (goal 2.0 to 3.0)
  77|     Creatinine           1.4 mg/dL
  78|     eGFR                 46 mL/min/1.73 m2
  79|     Potassium            4.1 mmol/L
  80|     TSH                  2.8 mIU/L
  81|     Hemoglobin           11.8 g/dL
  82|     Blood pressure       138/72 mmHg
  83|     Heart rate           64 beats per minute
  84|     Weight               61.2 kg
  85|     Temperature          36.7 C
  86|     Oxygen saturation    96 percent on room air
  87|     Respiratory rate     16 breaths per minute
  88| 
  89| Assessment. Refill is acceptable once the evening warfarin time is
  90| confirmed with the patient. Furosemide 40 mg each morning matches
  91| the faxed sig. Lisinopril 10 mg is reasonable with potassium 4.1
  92| mmol/L and creatinine 1.4 mg/dL. Metoprolol succinate 50 mg fits a
  93| heart rate of 64 beats per minute. No interacting drug was added.
  94| 
  95| Plan. Fill 90 days of warfarin 4 mg, metoprolol succinate 50 mg,
  96| lisinopril 10 mg, and levothyroxine 88 mcg. Fill furosemide 40 mg
  97| for 30 days, then review home weights. The caller read back the
  98| warfarin time, the morning diuretic, and the NSAID hold. The patient
  99| was sleepy and did not come to the phone. A second call is set for
 100| tomorrow morning before the courier leaves. A short note goes to the
 101| prescriber that the aspirin bottle is being retired. Mail to the
 102| home address on this form.
 103| Tracking will post at https://portal.example.org/medrec/status.
 104| 
 105| Calvin R. Hensley, RPh
 106| Willow Creek Pharmacy
 107| End of medication reconciliation
=== END DOCUMENT ===
ITEMS FOR fd-0011:
D1 | line 29 | A: (nothing) | B: NAME "Helen\nBruckner"
D2 | line 66 | A: KEEP "every six hours" ; KEEP "as needed" | B: KEEP "every six hours as needed"
K1 | line 2 | KEEP "Medication Reconciliation Note"
K2 | line 39 | KEEP "Vitamin K"
K3 | line 56 | KEEP "each morning"

=== DOCUMENT fd-0013 ===
   1| Date of Service: 03/18/2026
   2| From: Marit von Kästel
   3| To: Metabolic Liver Clinic
   4| Sent: 7:42 AM
   5| 
   6| Hi, this is marit von kästel writing from my phone. I recieved my lab note and i am mixed up. Ceruloplasmin is still low at 8 mg/dL and the 24 hour urine copper came back at 410 mcg/24 h. My stomache has been crampy since trientine went to 500 mg PO TID, and zinc acetate is 50 mg PO at bedtime, an hour apart. I have Wilson disease, found after Kayser-Fleischer rings, and I worry the urine copper means the chelator is failing. Mrs. Maeve O'Hearn-Wilson, my sister in law, is driving me because of the tremor. She does not have Wilson disease and is only helping with rides. Please send the apointment reminder to her house at 418 Willowglass Lane, Apt 2D, Brambley, VT 05099 if you cannot reach me on the portal. The fax blurred a zero and a one on the scanned member card, and the id line reads VK0O4l-7718, so I do not know if teh plan will accept it. Can someone check that before the visit.
   7| 
   8| From: Dr. Helen Brodie
   9| Sent: 11:05 AM
  10| 
  11| A low ceruloplasmin is expected in Wilson disease and does not mean treatment failed. On trientine, urine copper rises because copper is being pulled out, and 410 mcg/24 h is inside the usual range of about 200 to 500 mcg/24 h. Your AST was 42 U/L and ALT 51 U/L on the last draw, only mildly up, and the INR was 1.1. Stay on trientine 500 mg PO TID and zinc acetate 50 mg PO nightly, separated by at least one hour, on an empty stomach. The front desk will check the scanned member number against the plan file. We can see you soon for a tremor check and repeat urine copper. Your sister in law may come in, but she should not start any copper medicine. Send a portal note if cramps worsen, if you notice jaundice, or if you vomit blood.
  12| 
  13| Hepatology
=== END DOCUMENT ===
ITEMS FOR fd-0013:
K1 | line 6 | KEEP "urine copper"
K2 | line 11 | KEEP "ceruloplasmin"
K3 | line 11 | KEEP "urine copper"
K4 | line 11 | KEEP "200 to 500 mcg/24 h"
K5 | line 11 | KEEP "urine copper"
K6 | line 11 | KEEP "jaundice"
K7 | line 13 | KEEP "Hepatology"

=== DOCUMENT fd-0015 ===
   1| MEDICATION RECONCILIATION
   2| Plum Street Pharmacy
   3| Phone: (208) 555-0174
   4| Member: 6104-8831-29
   5| DOB: March 4, 1934
   6| 
   7| Her daughter, Clara M. Bemis, called about a full reconciliation for Anežka
   8| Vávrová, a 92 y.o. woman, before the weekend fill.
   9| Dr. Thủy K. Lâm remains the prescriber. Ross Carter, clinical pharmacist,
  10| reviewed the interaction screen. Ellen Ward, pharmacy technician, read
  11| each bottle aloud. She can be reached at 208.555.0133 if a claim rejects.
  12| Please send any paper denial that may come later to 220 Plum Street
  13| Boise, ID 83702 rather than to the daughter.
  14| 
  15| The home list was rebuilt from those bottles and from the prescriber's
  16| last note. Diagnoses that drive the list are nonvalvular atrial
  17| fibrillation, heart failure with preserved ejection fraction,
  18| hypothyroidism, and osteoarthritis of both knees. There is a remote
  19| history of stomach upset when a nonsteroidal drug was used, so none is on
  20| the list now. She lives alone and uses a cane outside the apartment. Her
  21| daughter fills the pill box on weekends and checks weights by phone.
  22| 
  23| Current regimen, confirmed label by label:
  24| apixaban 2.5 mg PO BID
  25| metoprolol succinate 25 mg PO daily
  26| furosemide 20 mg PO every morning
  27| potassium chloride 10 mEq PO daily with breakfast
  28| levothyroxine 75 mcg PO daily on an empty stomach
  29| amlodipine 2.5 mg PO daily
  30| acetaminophen 650 mg PO TID with meals
  31| cholecalciferol 1000 units PO daily
  32| docusate sodium 100 mg PO BID
  33| senna 8.6 mg PO at bedtime PRN no stool for two days
  34| 
  35| Apixaban is at the reduced strength on purpose. She meets two labeled
  36| reduction criteria by age and by a weight of 52 kg, so 2.5 mg twice daily
  37| is correct. Creatinine did not have to be high for that decision. She
  38| should not double a missed dose. No aspirin was added.
  39| 
  40| Vitals at the last clinic check, which the daughter read from a pocket
  41| card:
  42| blood pressure seated 132/68 mmHg, standing 118/60 mmHg
  43| heart rate seated 62 beats per minute, standing 74 beats per minute
  44| weight 52 kg
  45| temperature 36.5 C
  46| oxygen saturation 95 percent on room air
  47| 
  48| Laboratory results on that same card:
  49| sodium 138 mmol/L
  50| potassium 4.0 mmol/L
  51| chloride 104 mmol/L
  52| bicarbonate 25 mmol/L
  53| creatinine 1.2 mg/dL
  54| glucose 98 mg/dL
  55| hemoglobin 11.4 g/dL
  56| TSH 2.4 mIU/L
  57| 
  58| The potassium and the modest furosemide dose can stay together.
  59| Levothyroxine is at goal by the TSH and should stay separated from
  60| calcium and from the morning antacid she used to take. That antacid and a
  61| bedtime diphenhydramine product were both stopped. Diphenhydramine is a
  62| poor sleep aid at this age because of confusion and falls, and
  63| acetaminophen alone covers the knee pain. The daughter was told to buy
  64| plain acetaminophen, not a combination night tablet.
  65| 
  66| Counseling covered slow rising, a daily weight, and a call for a gain of
  67| three pounds, for new swelling, for black stools, or for a cough that
  68| wakes her. Breakfast should wait at least thirty minutes after
  69| levothyroxine, and apixaban can be taken with that meal or without it.
  70| Amlodipine is the medicine to revisit if seated systolic readings stay
  71| near the current number, because a beta blocker and a diuretic are already
  72| on board and the standing pressure is softer. No dose was changed on this
  73| call. The interaction screen found no further pair that had to be stopped.
  74| Fall precautions were reviewed, including night lighting and avoiding a
  75| rush to the bathroom after the evening senna. Constipation care stays with
  76| scheduled docusate and senna only after two days without a stool, so she
  77| is not taking a stimulant every night. Fluid advice was modest: she should
  78| not tank up, because of heart failure, and should not restrict so hard
  79| that the standing pressure falls further. The daughter will report
  80| dizziness, a new limp, or any vomit that looks like coffee grounds. Black
  81| stool teaching used plain language and she repeated it back. A thirty-day
  82| supply of each chronic medicine was queued. Inhalers are not part of this
  83| list, and no nebulizer was requested. The prescriber does not need a new
  84| prior authorization for these strengths. Refill status can be viewed at
  85| https://plumstreet.example.net/refill.
=== END DOCUMENT ===
ITEMS FOR fd-0015:
D1 | line 18 | A: KEEP "osteoarthritis of both knees" | B: KEEP "osteoarthritis"
D2 | line 46 | A: KEEP "oxygen saturation 95 percent" | B: KEEP "oxygen saturation 95 percent on room air"
K1 | line 1 | KEEP "MEDICATION RECONCILIATION"
K2 | line 36 | KEEP "weight of 52 kg"
K3 | line 58 | KEEP "potassium"
K4 | line 59 | KEEP "TSH"
K5 | line 75 | KEEP "Constipation"

=== DOCUMENT fd-0017 ===
   1| CLINICAL LABORATORY AND IMAGING CONSULTATION REPORT
   2| 
   3| DEMOGRAPHICS
   4| Patient: Female, 54-year-old
   5| Referring Unit: Cardiology
   6| Service Copy: Pain Clinic
   7| Comparison Source: Outside Hospital
   8| Evaluation Year: 2024
   9| 
  10| CLINICAL FINDINGS
  11| The patient is a 54-year-old female presenting for evaluation of unilateral
  12| lower extremity edema and progressive facial weakness. A clinical Wells score
  13| of 2.0 was calculated prior to ultrasound, placing the patient at moderate
  14| pretest probability for deep venous thrombosis. Compression duplex sonography of
  15| the right lower extremity demonstrates complete compressibility of the common
  16| femoral, femoral, and popliteal veins without thrombus.
  17| 
  18| Physical examination reveals acute unilateral facial droop consistent with Bell
  19| palsy. Vitals obtained on arrival: BP 134/82 mmHg, HR 76 bpm, RR 16 /min, SpO2
  20| 98% on room air, temperature 36.8 C. Comprehensive metabolic panel and blood
  21| counts reveal: WBC 6.4 x10^3/uL, hemoglobin 13.8 g/dL, platelet count 245
  22| x10^3/uL, serum creatinine 0.82 mg/dL, and potassium 4.1 mmol/L.
  23| 
  24| CURRENT MEDICATIONS
  25| 1. Lyrica 75 mg PO BID
  26| 2. prednisone 60 mg PO daily for 5 days
  27| 3. valacyclovir 1000 mg PO TID
  28| 4. famotidine 20 mg PO daily
  29| 
  30| IMPRESSION AND PLAN
  31| Imaging records transferred from Outside Hospital were reviewed. Follow-up
  32| coordination will be handled by the covering pharmacist and Cardiology, with
  33| ongoing neuropathic symptom surveillance directed to Pain Clinic.
=== END DOCUMENT ===
ITEMS FOR fd-0017:
K1 | line 1 | KEEP "CLINICAL LABORATORY AND IMAGING CONSULTATION REPORT"
K2 | line 11 | KEEP "unilateral\nlower extremity edema"
K3 | line 12 | KEEP "progressive facial weakness"
K4 | line 18 | KEEP "facial droop"

=== DOCUMENT fd-0019 ===
   1| Date of Service: 10/18/2026
   2| Facility: Digestive Health Center
   3| Patient: Dao, Yer
   4| 
   5| Message Thread: Prescription Coverage and Delivery
   6| 
   7| From: craig miller
   8| Sent: October 19, 2026 at 4:12 PM
   9| To: Gastroenterology Triage
  10| Subject: Prior auth and mailing address for Mrs. Dao
  11| 
  12| Hello, I am writing on behalf of my mother-in-law, Mrs. Yer Dao. Dr. Keith Campbell evaluated her earlier this week and recommended switching her daily acid suppression from omeprazole to pantoprazole 40 mg PO daily due to nocturnal regurgitation and mild dysphagia. Our mail-order pharmacy informed us this afternoon that they cannot dispense the medication without a prior authorization number. When reviewing her discharge paperwork from the clinic, I noticed an intake stamp in the top margin with the scanned identifier 8O1l-442. Could you verify if that reference number was transmitted to her prescription benefit plan? Additionally, please ensure that her upcoming shipment of sucralfate suspension 1 g PO QID is routed to our family mailing address at PO Box 842, Eau Claire, WI 54702 instead of her physical residence. She has taken three doses of the liquid medication so far and reports less burning discomfort, though she still experiences mild fullness after meals. Thank you, craig
  13| 
  14| Reply From: Heather MacLeod, RN
  15| Sent: October 20, 2026 at 9:30 AM
  16| To: craig miller
  17| Subject: RE: Prior auth and mailing address for Mrs. Dao
  18| 
  19| Good morning Mr. Miller,
  20| 
  21| I reviewed the chart with the clinical team. The prior authorization for pantoprazole was submitted earlier this morning under authorization code 8O1l-442, and approval is currently pending review with her insurer. I also updated her dispensing profile so the sucralfate oral suspension will ship directly to PO Box 842, Eau Claire, WI 54702. Please continue sucralfate 1 g PO QID one hour before each meal and at bedtime. If she develops progressive dysphagia, persistent vomiting, or melena, please contact the triage line immediately or proceed to the nearest emergency department.
  22| 
  23| Sincerely,
  24| Heather MacLeod, RN
  25| Digestive Health Center
=== END DOCUMENT ===
ITEMS FOR fd-0019:
D1 | line 12 | A: KEEP "mild dysphagia" | B: KEEP "dysphagia"
D2 | line 12 | A: KEEP "sucralfate suspension" | B: KEEP "sucralfate"
D3 | line 21 | A: KEEP "sucralfate oral suspension" | B: KEEP "sucralfate"
D4 | line 21 | A: KEEP "progressive dysphagia" | B: KEEP "dysphagia"
K1 | line 9 | KEEP "Gastroenterology Triage"
K2 | line 12 | KEEP "nocturnal regurgitation"
K3 | line 21 | KEEP "one hour before each meal and at bedtime"
K4 | line 21 | KEEP "persistent vomiting"

=== DOCUMENT fd-0034 ===
   1| DISCHARGE SUMMARY
   2| 
   3| Patient: HALE PAGET
   4| MRN: 7391842
   5| Age: 67 years
   6| 
   7| Hale Paget was admitted to Metabolic Bone Hospital in March 2026 for worsening left hip pain and a suspected stress fracture through pagetic bone. He is a 67 year old man with longstanding Paget disease of the pelvis and proximal femur, previously treated with an oral bisphosphonate that he stopped taking two years ago after dental work. His sister, Summer Braddock, age 61, has been staying with him and will drive him home.
   8| 
   9| The attending physician was Karim ibn Farouk, NPI 1609384725. Endocrinology consultation was provided by Layla al-Najjar. On arrival he was afebrile, blood pressure 146/82 mmHg, heart rate 78 beats per minute, and oxygen saturation 97 percent on room air. Alkaline phosphatase was 512 U/L, calcium 9.0 mg/dL, albumin 3.8 g/dL, creatinine 1.05 mg/dL, and 25-hydroxy vitamin D 19 ng/mL. Pelvic radiographs and a bone scan showed intensely active Paget disease without cortical destruction suggestive of sarcoma. Pain was controlled and no new neurologic deficit occured.
  10| 
  11| Past medical history also includes hypertension, hyperlipidemia, and osteoarthritis of the knees. He does not smoke. He drinks rarely. There is no history of osteosarcoma in the family and no prior fracture of the hip. During the stay his creatinine stayed stable and his calcium did not fall below 8.6 mg/dL. He was advised to report jaw pain, thigh pain, or fever over the next several weeks, and to keep a dental appointment already scheduled for routine cleaning.
  12| 
  13| Hospital course. After dental clearance he recieved zoledronic acid 5 mg IV once, infused over 30 minutes, and tolerated it without fever that required more than acetaminophen. Calcium carbonate 500 mg PO BID and cholecalciferol 2000 IU PO daily were started. Celecoxib 200 mg PO daily was given for five days, then stopped. Physical therapy advanced him to a walker with wieght bearing as tolerated. A seperate copy of the imaging report was printed for his sister.
  14| 
  15| Discharge medications.
  16| Zoledronic acid infusion completed this admission. Next dose to be arranged by endocrinology.
  17| Calcium carbonate 500 mg PO BID with meals.
  18| Cholecalciferol 2000 IU PO daily.
  19| Acetaminophen 650 mg PO every 6 hours as needed for pain. Rx 8841207.
  20| Atorvastatin 40 mg PO nightly and lisinopril 10 mg PO daily, both continued from home.
  21| 
  22| Follow-up. He will be seen in the endocrine clinic within two weeks. Ambulation is limited to household distances with the walker until that visit. His sister will stay at the house until he is steady with the walker. Questions about the infusion can be sent to bone.desk@example.org. Outside films from before March 2026 should be forwarded if they exist. Summer Braddock understands the fever precautions for the first few days at home.
  23| 
  24| Signed,
  25| Karim ibn Farouk
  26| Metabolic Bone Hospital
=== END DOCUMENT ===
ITEMS FOR fd-0034:
D1 | line 11 | A: KEEP "osteoarthritis of the knees" | B: KEEP "osteoarthritis"
K1 | line 7 | KEEP "oral"
K2 | line 9 | KEEP "Endocrinology consultation"
K3 | line 11 | KEEP "Past medical history"
K4 | line 11 | KEEP "fracture of the hip"
K5 | line 11 | KEEP "calcium did not fall below 8.6 mg/dL"
K6 | line 11 | KEEP "routine cleaning"
K7 | line 16 | KEEP "infusion"
K8 | line 16 | KEEP "endocrinology"
K9 | line 19 | KEEP "as needed"
K10 | line 22 | KEEP "endocrine clinic"
K11 | line 22 | KEEP "infusion"

=== DOCUMENT fd-0040 ===
   1| CASCADIA ENDOCRINOLOGY AND IMAGING CENTER
   2| CLINICAL ULTRASOUND AND FINE NEEDLE ASPIRATION REPORT
   3| 
   4| PATIENT: VONG, MEI-LING
   5| DOB: 12.04.1934
   6| AGE/SEX: 92F
   7| ACCOUNT NUMBER: ACT-6091448-B
   8| ACCESSION: ACC-2026-90412
   9| DATE OF PROCEDURE: 18.06.2026
  10| ORDERING PHYSICIAN: Dr. Rodrigo Barcellos
  11| ATTENDING RADIOLOGIST: Dra. Luciana da Silva Peixoto
  12| CONSULTING CLINICIAN: Dr. Graves
  13| PRIMARY RESIDENCE: 714 NW Blossom Hill Rd, Apt 4B, Portland, OR 97229
  14| CONTACT TELEPHONE: +1-503-555-0178
  15| FAMILY CONTACT: Patience (daughter)
  16| PRIMARY CAREGIVER: Nguyễn Thị Mai
  17| 
  18| PROCEDURE PERFORMED:
  19| High-resolution diagnostic ultrasound of the thyroid gland and fine-needle
  20| aspiration (FNA) biopsy of dominant right thyroid nodule under direct
  21| sonographic guidance (three passes).
  22| 
  23| CLINICAL INDICATION:
  24| The patient is a 92F (Mrs. Vong) with a history of toxic multinodular goiter
  25| and atrial fibrillation, presenting with progressive dysphagia and enlarging
  26| anterior neck mass. Evaluated in consultation with endocrinologist Dr. Graves
  27| and primary physician Dr. Rodrigo Barcellos. Daughter Patience reported mild
  28| stridor in recumbent posture. Caregiver Nguyễn Thị Mai assists with daily
  29| medication administration. Recent laboratory evaluation showed suppressed serum
  30| TSH at less than 0.01 uIU/mL, elevated free T4 at 2.4 ng/dL, and elevated total
  31| T3 at 210 ng/dL. Previous thyroid scintigraphy demonstrated patchy heterogeneous
  32| uptake with a photopenic defect corresponding to the palpable right lobe mass.
  33| Baseline vital signs prior to biopsy: blood pressure 138/76 mmHg, pulse rate 82
  34| bpm irregularly irregular, respiratory rate 18 breaths per minute, oxygen
  35| saturation 97% on ambient air.
  36| 
  37| CURRENT MEDICATIONS:
  38| 1. methimazole 10 mg PO daily
  39| 2. propranolol 20 mg PO TID
  40| 3. apixaban 2.5 mg PO BID
  41| 4. levothyroxine 25 mcg PO daily
  42| 
  43| PROCEDURE TECHNIQUE AND FINDINGS:
  44| Prior to needle placement, informed written consent was reviewed with Mrs. Vong
  45| and her daughter Patience, assisted by medical interpreter. Time-out verified
  46| patient identity, procedure site, and anticoagulation hold (apixaban held 48h).
  47| 
  48| Diagnostic gray-scale and power Doppler sonography of the neck was performed.
  49| The thyroid gland is markedly enlarged and multinodular.
  50| Right thyroid lobe measures 6.2 x 3.1 x 2.9 cm.
  51| Left thyroid lobe measures 5.4 x 2.4 x 2.2 cm.
  52| The thyroid isthmus is thickened at 0.8 cm.
  53| 
  54| In the mid-to-lower pole of the right thyroid lobe, there is a dominant, solid,
  55| hypoechoic nodule measuring 2.8 x 2.1 x 1.9 cm. The nodule displays irregular
  56| margins, wider-than-tall orientation, and punctate echogenic foci suspicious
  57| for microcalcifications (ACR TI-RADS 5, 7 points). Color Doppler interrogation
  58| demonstrated peripheral and internal chaotic flow signals within the nodule.
  59| Surrounding parenchyma shows patchy vascularity without discrete retrosternal
  60| extension. Visualized jugular and carotid vessels were patent.
  61| 
  62| Following sterile preparation with chlorhexidine and local anesthesia using 4 mL
  63| of 1% lidocaine, a 25-gauge needle attached to a 10 mL syringe was advanced into
  64| the dominant right thyroid nodule under continuous real-time ultrasound guidance.
  65| Three separate passes were performed. Adequate colloid and cellular material
  66| were obtained. On-site cytotechnologist confirmed adequate cellularity. No
  67| immediate hematoma or airway compromise occurred. Pressure dressing applied.
  68| 
  69| IMPRESSION:
  70| 1. Successful ultrasound-guided fine needle aspiration of dominant right
  71|    thyroid nodule (2.8 cm, ACR TI-RADS 5). Specimen submitted to cytology.
  72| 2. Marked multinodular goiter causing slight leftward tracheal deviation.
  73| 3. Post-procedure instructions provided to patient, daughter Patience, and
  74|    caregiver Nguyễn Thị Mai. Resume apixaban 2.5 mg PO BID tomorrow morning.
  75| 4. Cytology results are pending and will be communicated directly to Dr. Graves
  76|    and Dr. Rodrigo Barcellos within 48 to 72 hours. Endocrine surgery
  77|    consultation will be scheduled if cytology shows high-grade neoplasm.
  78| 
  79| Dra. Luciana da Silva Peixoto, MD
  80| Department of Interventional Radiology
  81| Cascadia Endocrinology and Imaging Center
=== END DOCUMENT ===
ITEMS FOR fd-0040:
D1 | line 19 | A: KEEP "diagnostic ultrasound of the thyroid gland" | B: KEEP "ultrasound"
D2 | line 19 | A: KEEP "fine-needle\naspiration (FNA) biopsy" | B: KEEP "fine-needle\naspiration" ; KEEP "biopsy"
D3 | line 48 | A: KEEP "gray-scale and power Doppler sonography" | B: KEEP "Doppler sonography"
D4 | line 57 | A: KEEP "ACR TI-RADS 5, 7 points" | B: KEEP "ACR TI-RADS 5"
D5 | line 70 | A: KEEP "ultrasound-guided fine needle aspiration" | B: KEEP "fine needle aspiration"
K1 | line 25 | KEEP "dysphagia"
K2 | line 33 | KEEP "biopsy"
K3 | line 57 | KEEP "Color Doppler interrogation"
K4 | line 62 | KEEP "local anesthesia"
K5 | line 63 | KEEP "1%"
K6 | line 64 | KEEP "ultrasound"
K7 | line 76 | KEEP "Endocrine surgery"
K8 | line 77 | KEEP "high-grade neoplasm"

=== DOCUMENT fd-0043 ===
   1| 4491831
   2| HEART AND VASCULAR CENTER OF ELM CROSSING
   3| PO Box 418
   4| Elm Crossing, WI 54490
   5| Fax: (715) 555-0166
   6| 
   7| DISCHARGE SUMMARY
   8| 
   9| Patient: FREIDA B. ADDISON
  10| Date of Service: March 6, 2026
  11| FAX BANNER 88O2-l194
  12| 
  13| Freida B. Addison is an 81-year-old woman admitted to the Heart and Vascular Center of Elm Crossing after syncope at home. Her daughter-in-law, Hope Yang, saw her slump in a kitchen chair and called for help. Her grandson, Price Yang, arrived during the evaluation and remained for teaching. She had been lightheaded for two days. She denied chest pain, a clearly recalled palpitation, focal weakness, and melena.
  14| 
  15| History includes hypertension, hypothyroidism, and symptomatic bradycardia that had not yet been treated with a device. She does not have diabetes. Because the serum sodium was low, a morning cortisol was obtained and returned at 18.4 mcg/dL, with corticotropin in the reference range. That result argues against Addison disease, and she has never been treated for adrenal insufficiency. Home medicines were levothyroxine 88 mcg by mouth each morning, amlodipine 5 mg by mouth daily, and aspirin 81 mg by mouth daily. She has no known drug allergy.
  16| 
  17| Arrival vitals were blood pressure 96/60 mmHg, pulse 38 beats per minute, respiratory rate 16, and oxygen saturation 97 percent on room air. She was pale, alert, and oriented. The lungs were clear, there was no murmur, and there was no edema. The electrocardiogram showed complete heart block with a slow escape rhythm.
  18| 
  19| Laboratory studies: sodium 131 mmol/L, potassium 4.4 mmol/L, creatinine 0.9 mg/dL, thyroid stimulating hormone 2.2 mIU/L, and troponin I 0.01 ng/mL repeated once without a rise. The hyponatremia was attributed to poor intake around the bradycardia, not to adrenal failure.
  20| 
  21| Dr. Rémi de la Croix implanted a dual-chamber pacemaker on the 4th of March under local anesthesia with light sedation. Thresholds were acceptable and there was no pneumothorax on the post-procedure radiograph. The generator serial number is HVC-2044-881. She was observed overnight on telemetry. The lower rate was programmed to 60 beats per minute. By the next morning the blood pressure was 128/74 mmHg, the paced rate was 72 beats per minute, and she walked the corridor without dizziness or chest pain.
  22| 
  23| Hope Yang practiced checking the incision and reviewed warning symptoms: fever, increasing pocket swelling, persistent hiccups, twitching of the chest wall, or another syncopal spell. Price Yang confirmed he could stay in the house for the first two nights. The left arm on the implant side should not be raised above the shoulder for six weeks, and the dressing should stay dry for five days.
  24| 
  25| Anticoagulation was considered because of a slow atrial rate on the monitor, but there was no atrial fibrillation on telemetry and no prior stroke, so aspirin alone was continued. She may climb the stairs at home. She should not drive for one week, a point Price Yang repeated back to the nurse. A sling was advised for the first day only. Wound check is not required unless the site reddens or drains.
  26| 
  27| Discharge medicines are unchanged aside from acetaminophen 650 mg by mouth every six hours as needed for soreness: levothyroxine 88 mcg each morning, amlodipine 5 mg daily, and aspirin 81 mg daily. No anticoagulant was added. Device interrogation with Dr. Rémi de la Croix is planned in two weeks at the Heart and Vascular Center of Elm Crossing, earlier if the warning symptoms appear.
  28| 
  29| She was discharged home with her family on the date of service above, in stable paced rhythm.
  30| 
  31| Rémi de la Croix, MD
  32| Electrophysiology
  33| Heart and Vascular Center of Elm Crossing
=== END DOCUMENT ===
ITEMS FOR fd-0043:
D1 | line 17 | A: KEEP "oxygen saturation 97 percent" | B: KEEP "oxygen saturation 97 percent on room air"
K1 | line 15 | KEEP "serum sodium was low"
K2 | line 15 | KEEP "morning cortisol"
K3 | line 15 | KEEP "18.4 mcg/dL"
K4 | line 15 | KEEP "corticotropin"
K5 | line 17 | KEEP "electrocardiogram"
K6 | line 17 | KEEP "slow escape rhythm"
K7 | line 21 | KEEP "dual-chamber pacemaker"
K8 | line 21 | KEEP "post-procedure radiograph"
K9 | line 21 | KEEP "60 beats per minute"
K10 | line 23 | KEEP "syncopal spell"
K11 | line 25 | KEEP "Wound check"
K12 | line 32 | KEEP "Electrophysiology"

=== DOCUMENT fd-0044 ===
   1| 8834201 OH, SEO-JIN
   2| Sable Point Clinic nurse line
   3| NURSE: Sable Point Clinic, this is Ms. Thea Reed. Uh, nurse line. Who am I speaking with?
   4| CALLER: This is Caroline Bexley. I'm the daughter. I'm calling for my mother, Mrs. Seo-jin Oh. The sheet in front of me starts with 8834201 and then her name, OH, SEO-JIN, and there is no word in front of the number.
   5| NURSE: That 8834201 is the record we use on this callback. I also have a scanned sticker from the outside packet that shows OO73l88, with letters where the digits should be, letter O and a lowercase l. We are treating OO73l88 as a bad scan of an older number, not as a second person. Date of this follow-up is 3/4/2026, which the card also prints as 3/4/26, and the reminder says March 4th.
   6| CALLER: She said the visit out loud as March fourth, twenty twenty-six. I just need to know which pills are still on after the chest pain admission. I, I get lost between the bottles.
   7| NURSE: Dr. Rivka Sondheimer wrote the list. Aspirin 81 mg PO daily, ticagrelor 90 mg PO BID, metoprolol succinate 25 mg PO daily, atorvastatin 80 mg PO nightly, and levothyroxine 75 mcg PO every morning on an empty stomach. Do not stop the ticagrelor if she bruises a little. Do stop and call for black stool, vomiting blood, or a sudden severe headache.
   8| CALLER: What did the blood work show? She remembers a heart enzyme and not much else.
   9| NURSE: Troponin I was 0.42 ng/mL at the peak and 0.08 ng/mL at discharge. LDL was 96 mg/dL. Potassium 4.0 mmol/L. Creatinine 0.8 mg/dL. TSH 2.1 mIU/L, so the levothyroxine dose stays put. This morning she told us her blood pressure was 118/70 mmHg, heart rate 64, oxygen saturation 98 percent on room air. She is 49, which is on the face sheet as 49 years old, not anywhere near the age cutoff people worry about.
  10| CALLER: They did a left heart catheterization. No stent. The diagnosis was a small NSTEMI, plus type 2 diabetes and hypothyroidism. Is the cath, is the catheterization the same as a stent? I keep saying it wrong.
  11| NURSE: The procedure was a left heart catheterization with coronary angiography. No percutaneous coronary intervention and no stent. Diagnoses are non-ST elevation myocardial infarction, type 2 diabetes mellitus, and hypothyroidism. ECG did not show a persistent ST elevation. Dr. Sondheimer wants her at the March 4th visit, the one on 3/4/2026, for a wound check at the wrist and a review of the ticagrelor.
  12| CALLER: Home is 540 West Elm Street, Apt 12B, Grayheron, NY 11788. She texted the pharmacy in lowercase, 18 crow lane, but that is my apartment, not hers. Please keep the unit address, Apt 12B, as the one for Mrs. Seo-jin Oh.
  13| NURSE: I have 540 West Elm Street, Apt 12B, Grayheron, NY 11788 for Mrs. Oh, and I will not ship to 18 crow lane. If the pharmacy faxes a clarification, the line is Fax 631-555-0150. Caroline Bexley can be the pickup person. Ms. Reed will note that on the callback before she leaves.
  14| CALLER: Please tell Dr. Rivka Sondheimer that the bruise at the wrist is yellow now, not spreading. Um, my mother gets nervous when the heart rate is in the 60s, and I told her 64 is expected on the metoprolol.
  15| NURSE: That is expected. We will see Mrs. Seo-jin Oh on March fourth, twenty twenty-six. Bring the bottles. Call sooner for chest pain, fainting, or bleeding. Thank you for calling Sable Point Clinic.
  16| CALLER: Thank you. Bye.
=== END DOCUMENT ===
ITEMS FOR fd-0044:
D1 | line 9 | A: KEEP "Troponin I was 0.42 ng/mL" ; KEEP "0.08 ng/mL" [unsure] | B: KEEP "Troponin I was 0.42 ng/mL at the peak and 0.08 ng/mL at discharge" [unsure]
D2 | line 9 | A: KEEP "oxygen saturation 98 percent on room air" | B: KEEP "oxygen saturation 98 percent"
D3 | line 11 | A: KEEP "left heart catheterization" ; KEEP "coronary angiography" | B: KEEP "left heart catheterization with coronary angiography"
K1 | line 10 | KEEP "stent"
K2 | line 10 | KEEP "cath" [labeler unsure]
K3 | line 10 | KEEP "catheterization"
K4 | line 10 | KEEP "stent"
K5 | line 11 | KEEP "stent"
K6 | line 11 | KEEP "ECG"
K7 | line 11 | KEEP "ST elevation"
K8 | line 11 | KEEP "wound check" [labeler unsure]

=== DOCUMENT fd-0046 ===
   1| 84729103
   2| REFERRAL CONSULTATION LETTER
   3| Date: 04/18/2026
   4| 
   5| To: Dr. Robert Bauer, MD
   6| Cardiac Arrhythmia Service
   7| 420 Commonwealth Avenue, Suite 305, Boston, MA 02215
   8| Tel: (617) 555-0182 | Fax: (617) 555-0195
   9| 
  10| From: Dr. Alistair MacIntyre, MD
  11| General Cardiology Practice
  12| 
  13| Patient: JOÃO DE HOLANDA-SILVA
  14| Date of Birth: 08/14/1954
  15| Contact Person: Mr. David Miller (son-in-law)
  16| 
  17| Dear Dr. Bauer,
  18| 
  19| I am referring Mr. João de Holanda-Silva, a 71-year-old male with symptomatic paroxysmal atrial fibrillation and sick sinus syndrome, for electrophysiology evaluation regarding possible catheter ablation versus lead revision. He is accompanied by his son-in-law, Mr. David Miller, who assists with medication administration and outpatient transportation.
  20| 
  21| Mr. de Holanda-Silva underwent dual-chamber pacemaker implantation three years ago for symptomatic sinus pauses and bradycardia-tachycardia syndrome. His device is a dual-chamber permanent pacemaker, serial number SN-482019-E. During a recent ambulatory monitoring window from 03/12/2026 to 03/19/2026, he experienced recurrent episodes of palpitations, dizziness, and near-syncope despite compliance with antiarrhythmic therapy. His son-in-law reports that during these episodes, the patient feels lightheaded and fatigued, which significantly restricts his activities of daily living. We have attempted uptitration of beta-blocker therapy, but this was limited by symptomatic resting bradycardia down to 48 bpm while in sinus rhythm.
  22| 
  23| Interrogation on April 18th demonstrated a 24% ventricular pacing burden and multiple sustained runs of atrial fibrillation with rapid ventricular response up to 142 bpm. There was also an intermittent high ventricular pacing threshold recorded on the right ventricular lead.
  24| 
  25| Past Medical History:
  26| 1. Paroxysmal atrial fibrillation with rapid ventricular response.
  27| 2. Sick sinus syndrome status post dual-chamber pacemaker placement.
  28| 3. Essential hypertension.
  29| 4. Mild chronic kidney disease, stage 2.
  30| 
  31| Physical Examination and Vitals:
  32| Vitals recorded today show blood pressure 134/82 mmHg, resting heart rate 54 bpm (paced), respiratory rate 16 breaths per minute, body mass index 27.4 kg/m2, and oxygen saturation 97% on ambient air. Cardiovascular exam reveals regular rate and rhythm without murmurs, rubs, or gallops. Pacemaker pocket site in the left prepectoral area is clean, intact, non-tender, and without erythema, fluctuance, or device erosion. Peripheral pulses are 2+ bilaterally, and there is trace bilateral pretibial edema. Jugular venous pressure is measured at approximately 6 cm H2O.
  33| 
  34| Diagnostic and Laboratory Data:
  35| Recent labs collected on 04/10/2026 show serum sodium 139 mEq/L, potassium 4.4 mEq/L, chloride 102 mEq/L, serum creatinine 1.18 mg/dL, blood urea nitrogen 22 mg/dL, and eGFR 68 mL/min/1.73m2. Hemoglobin is 14.1 g/dL with a platelet count of 224 K/uL. Thyroid-stimulating hormone is normal at 1.84 uIU/mL. NT-proBNP is elevated at 340 pg/mL. Transthoracic echocardiogram completed on March 28th demonstrated left ventricular ejection fraction (LVEF) of 48%, mild concentric left ventricular hypertrophy, left atrial volume index of 38 mL/m2, and trace mitral regurgitation without regional wall motion abnormalities.
  36| 
  37| Current Medications:
  38| - Metoprolol succinate 50 mg PO daily
  39| - Apixaban 5 mg PO BID
  40| - Lisinopril 10 mg PO daily
  41| - Atorvastatin 20 mg PO at bedtime
  42| 
  43| Thank you very much for evaluating Mr. de Holanda-Silva. We would greatly appreciate your guidance on whether he would benefit from pulmonary vein isolation, atrioventricular node ablation with biventricular pacing upgrade, or right ventricular lead repositioning. Please feel free to contact my office directly if any additional records or tracing data are required.
  44| 
  45| Sincerely,
  46| Dr. Alistair MacIntyre, MD
=== END DOCUMENT ===
ITEMS FOR fd-0046:
D1 | line 29 | A: KEEP "Mild chronic kidney disease, stage 2" | B: KEEP "chronic kidney disease, stage 2"
D2 | line 32 | A: KEEP "resting heart rate 54 bpm (paced)" | B: KEEP "resting heart rate 54 bpm"
D3 | line 32 | A: KEEP "oxygen saturation 97% on ambient air" | B: KEEP "oxygen saturation 97%"
D4 | line 35 | A: KEEP "mild concentric left ventricular hypertrophy" | B: KEEP "concentric left ventricular hypertrophy"
D5 | line 35 | A: KEEP "trace mitral regurgitation" | B: KEEP "mitral regurgitation"
K1 | line 2 | KEEP "REFERRAL CONSULTATION LETTER"
K2 | line 19 | KEEP "electrophysiology evaluation"
K3 | line 21 | KEEP "dual-chamber permanent pacemaker"
K4 | line 21 | KEEP "ambulatory monitoring"
K5 | line 21 | KEEP "antiarrhythmic"
K6 | line 21 | KEEP "resting bradycardia"
K7 | line 21 | KEEP "sinus rhythm"
K8 | line 23 | KEEP "Interrogation"
K9 | line 23 | KEEP "24% ventricular pacing burden"
K10 | line 23 | KEEP "intermittent high ventricular pacing threshold"
K11 | line 32 | KEEP "Peripheral pulses are 2+"
K12 | line 32 | KEEP "trace bilateral pretibial edema"
K13 | line 32 | KEEP "Jugular venous pressure is measured at approximately 6 cm H2O"
K14 | line 35 | KEEP "Hemoglobin is 14.1 g/dL"
K15 | line 35 | KEEP "platelet count of 224 K/uL"
K16 | line 35 | KEEP "Thyroid-stimulating hormone is normal at 1.84 uIU/mL"
K17 | line 35 | KEEP "NT-proBNP is elevated at 340 pg/mL"
K18 | line 35 | KEEP "left ventricular ejection fraction (LVEF) of 48%"
K19 | line 35 | KEEP "left atrial volume index of 38 mL/m2"
K20 | line 35 | KEEP "regional wall motion abnormalities"

=== DOCUMENT fd-0048 ===
   1| MEDICATION RECONCILIATION
   2| 
   3| Performed by the covering pharmacist after the patient returned from an
   4| inpatient stay. Records from Outside Hospital were used to rebuild the home
   5| list. The patient is a 72-year-old woman. Her daughter helped with the
   6| bottle count and confirmed which inhalers are actually in the house.
   7| 
   8| Reason for reconciliation
   9| She was treated for community-acquired pneumonia together with an acute
  10| exacerbation of chronic obstructive pulmonary disease. Antibiotics have
  11| been finished and are not continued. A steroid taper was started for the
  12| lung flare and must be dispensed as a short course, not as a chronic
  13| refill. She also lives with Parkinson disease, diagnosed in 2019, and with
  14| type 2 diabetes mellitus since 2021, hypertension, and painful distal
  15| sensory neuropathy in both feet. Recently she stumbled on a rug, did not
  16| hit her head, and did not lose consciousness.
  17| 
  18| While swelling of the ankles was present during the stay, the Wells score
  19| for deep vein thrombosis was low. Duplex ultrasound of both legs showed no
  20| clot, and anticoagulation was not started. A chest radiograph showed a
  21| focal infiltrate judged consistent with pneumonia. Repeat imaging was not
  22| required once fever resolved and oxygen saturation recovered. Sputum
  23| culture was not obtained.
  24| 
  25| Diagnoses relevant to dispensing
  26| Community-acquired pneumonia, improving.
  27| Chronic obstructive pulmonary disease with a recent exacerbation.
  28| Parkinson disease with early-morning stiffness and no current hallucination.
  29| Type 2 diabetes mellitus with distal sensory neuropathy.
  30| Hypertension, usually at goal.
  31| Constipation, mild, related to limited walking.
  32| 
  33| Allergies
  34| Penicillin caused a rash in childhood and remains an avoidance. Codeine
  35| caused nausea and is avoided. No angiotensin-converting enzyme inhibitor
  36| cough is on file.
  37| 
  38| Current regimen
  39| carbidopa-levodopa 25-100 mg PO TID on an empty stomach when she can
  40| entacapone 200 mg PO TID with each carbidopa-levodopa dose
  41| Lyrica 75 mg PO BID for neuropathic pain, with pregabalin as the generic
  42| duloxetine 60 mg PO daily
  43| prednisone 40/30/20/10 mg PO every morning with food, four days at each
  44| dose, then stop
  45| metformin 1000 mg PO BID with meals
  46| empagliflozin 10 mg PO every morning
  47| lisinopril 20 mg PO daily
  48| atorvastatin 40 mg PO at bedtime
  49| docusate sodium 100 mg PO BID
  50| senna 8.6 mg PO at bedtime PRN constipation
  51| albuterol sulfate HFA 2 puffs inhaled q6h PRN wheeze
  52| umeclidinium 62.5 mcg inhaled once daily
  53| acetaminophen 650 mg PO q6h PRN pain, not to exceed 3 g in a day
  54| 
  55| The prednisone supply will be 10 mg tablets. She takes four tablets daily,
  56| then three, then two, then one, each block lasting four days, which is the
  57| same 40/30/20/10 mg taper. That is forty tablets in all. She should not
  58| lengthen the taper on her own.
  59| 
  60| Gabapentin was tried previously at 300 mg PO TID and was stopped for
  61| sedation. That trial is the clinical basis for requesting Lyrica. Brand
  62| Lyrica needs prior authorization from the health plan. Pregabalin at the
  63| same dose is the preferred alternative if the plan denies the brand. Her
  64| daughter understands they are the same drug.
  65| 
  66| Vitals at the clinic recheck
  67| Blood pressure 128/74 mmHg. Heart rate 78 beats per minute. Respiratory
  68| rate 16 breaths per minute. Temperature 36.7 C. Oxygen saturation 96
  69| percent on room air.
  70| 
  71| Laboratory results copied from the discharge summary and the recheck
  72| WBC 8.4 K/uL. Hemoglobin 12.6 g/dL. Platelets 242 K/uL.
  73| Sodium 137 mmol/L. Potassium 4.1 mmol/L. Chloride 102 mmol/L.
  74| Bicarbonate 26 mmol/L. Creatinine 0.9 mg/dL.
  75| eGFR greater than 60 mL/min/1.73 m2.
  76| Fasting glucose 142 mg/dL. Hemoglobin A1c 7.4 percent.
  77| TSH 2.8 mIU/L.
  78| 
  79| Counseling and holds
  80| Sick-day plan: hold empagliflozin and metformin if she cannot eat or
  81| drink, because of ketoacidosis and lactic acidosis risk, and restart when
  82| intake is normal. Hold lisinopril if she has vomiting or marked
  83| lightheadedness, then call the clinic. Do not start metoclopramide,
  84| haloperidol, or a high-dose phenothiazine, because each can worsen
  85| Parkinson disease. Urine may turn brown on entacapone, and that change is
  86| not blood. Separate carbidopa-levodopa from a heavy protein meal when her
  87| stomach allows it. Prednisone will raise glucose, so fingerstick checks
  88| should increase during the taper, and Diabetes Center should see her if
  89| readings stay high after the taper ends. A Pain Clinic referral is in
  90| place if burning pain in the feet does not ease on pregabalin once the
  91| steroid course is done. Inhaler technique was taught back correctly for
  92| both the rescue inhaler and the daily anticholinergic inhaler. She should
  93| rise slowly to limit levodopa-related dizziness. Acetaminophen remains the
  94| analgesic. Ibuprofen was discouraged while blood pressure is being
  95| watched. The bowel regimen is scheduled docusate, with senna only if she
  96| has no stool for two days. A thirty-day supply of the chronic medicines
  97| was queued, and the steroid quantity was limited to the taper. The
  98| prescriber was asked to sign the prior authorization if the plan will not
  99| accept pregabalin.
=== END DOCUMENT ===
ITEMS FOR fd-0048:
K1 | line 52 | KEEP "inhaled"
K2 | line 93 | KEEP "levodopa"

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
ITEMS FOR fd-0050:
D1 | line 25 | A: KEEP "intravenous" | B: KEEP "intravenous sedation"
K1 | line 25 | KEEP "cancer"
K2 | line 27 | KEEP "specialized columnar epithelium with goblet cells"
K3 | line 29 | KEEP "sedation"
K4 | line 31 | KEEP "oral"
K5 | line 31 | KEEP "before meals"
K6 | line 31 | KEEP "at bedtime"
K7 | line 33 | KEEP "before meals"
K8 | line 33 | KEEP "daily"
K9 | line 41 | KEEP "gastroenterology clinic"

=== DOCUMENT fd-0051 ===
   1| 4491830 LANGSTON, BEATRICE
   2| Nurse line callback, St. Idris Medical Center
   3| DOB: June 12, 1921
   4| NURSE: St. Idris Medical Center nurse line, this is Ms. Nora Pellham. Uh, am I speaking with the daughter?
   5| CALLER: Yes. This is Anneliese von Krüger. I'm the daughter of Mrs. Beatrice Langston. I, I have been staying in the guest room since she came home.
   6| NURSE: Thank you. I have the header as 4491830 LANGSTON, BEATRICE, and the date of birth June 12, 1921. She is the 104-year-old who had the left hip done. Your own age on the caregiver line is 78, is that still right?
   7| CALLER: Yes, I'm 78. She is the 104-year-old. Please don't mix us up on the form. Dr. Harlan Whitaker told me to call if her pain or her bowels got worse before the visit on March 4th.
   8| NURSE: The visit is March 4th, and the scheduling screen shows 3/4/2026. Mr. Glenn Harlow in scheduling can move it if the snow is bad, but I would keep it. What is going on today?
   9| CALLER: She has not had a real bowel movement since she left the surgical floor. The oxycodone is the reason, I think. She is also more confused in the evening. Um, her blood pressure this morning was 102 over 64, and I almost held the metoprolol.
  10| NURSE: Do not hold it unless Dr. Whitaker says so. The list I have from him is apixaban 2.5 mg PO BID, metoprolol tartrate 12.5 mg PO BID, acetaminophen 650 mg PO q6h PRN, senna 8.6 mg PO at bedtime, and polyethylene glycol 17 g PO daily. The oxycodone 2.5 mg PO q6h PRN is only for breakthrough, and it is what is slowing the bowel. Give the polyethylene glycol every day, even if she refuses the senna.
  11| CALLER: She had the left hip hemiarthroplasty for a femoral neck fracture. They said no total hip because of her age and the bone. Diagnoses he read to me were the fracture, persistent atrial fibrillation, heart failure with preserved ejection fraction, stage 3 chronic kidney disease, and osteoporosis. There was also a urinary tract infection that finished its antibiotics before discharge.
  12| NURSE: Physical therapy is ordered for gait training with a walker, weight bearing as tolerated on the left leg. No stair training until Mr. Glenn Harlow confirms the home has a rail. Last weight I see is 49 kilograms, which is why the apixaban stayed at 2.5 mg.
  13| CALLER: She was 49 kilograms in the hospital. She is not eating bread. The incision is dry. There is no drainage.
  14| NURSE: That matches. No Foley is in place now. The wound check is part of the March 4th visit, the 4th of March, same day as 3/4/2026. If the incision reddens, or if she has fever, do not wait for that day.
  15| CALLER: The claim they told me to quote, if the walker rental bounces, is claim number 8831942760. I don't have the card in front of me. Her account at the hospital is that claim, I think. I may have said that twice.
  16| NURSE: Claim number 8831942760 is enough for the equipment desk. For the chart itself the first number on the header, 4491830, is the one I use, and it is not printed with a label in front of it on the callback sheet. Home address is 218 Alder Court, Unit 6, Pebble Ridge, OR 97458. Are you staying there?
  17| CALLER: Yes. Unit 6. She texted me the building once in all lowercase, 218 alder court unit 6, because her hands shake and she will not use capitals. My own place, if you have to reach me instead, she wrote as 9 moss street. I am at her unit tonight.
  18| NURSE: I will keep 218 Alder Court, Unit 6, Pebble Ridge, OR 97458 as the home, and 9 moss street as your backup in the note, lowercase the way she sent it. Which phone should we use?
  19| CALLER: Mine. It is 503-555-0142. If the line is bad I can say it the long way. Five zero three, five five five, zero one four two.
  20| NURSE: I have 503-555-0142. The clinic back line, if you get voicemail here, is 503.555.0188. That one is written with dots on the card. Ms. Nora Pellham is on until six, then the night nurse takes the radio.
  21| CALLER: Can you tell Dr. Harlan Whitaker that Mrs. Beatrice Langston's appetite is poor but she is drinking? Anneliese von Krüger will be at the March 4th visit. I do not want her sent back to St. Idris Medical Center unless she falls or the confusion does not clear by morning.
  22| NURSE: I will send that to Dr. Whitaker. Hold the oxycodone if she is too sleepy to swallow, keep the apixaban 2.5 mg PO BID unless she has bleeding, and call again for chest pain, a new facial droop, black stool, or a fall. Mr. Harlow already has the 3/4/2026 slot held under LANGSTON, BEATRICE.
  23| CALLER: Thank you. Um, that is the whole thing. I think I can get the polyethylene glycol into her tonight.
  24| NURSE: Good. We will see Mrs. Langston on the 4th of March. Goodbye.
=== END DOCUMENT ===
ITEMS FOR fd-0051:
D1 | line 9 | A: KEEP "blood pressure this morning was 102 over 64" [unsure] | B: KEEP "102 over 64" [unsure]
D2 | line 12 | A: KEEP "weight I see is 49 kilograms" [unsure] | B: KEEP "49 kilograms"
D3 | line 14 | A: DATE "the 4th of March" | B: DATE "4th of March"
D4 | line 24 | A: DATE "the 4th of March" | B: DATE "4th of March"
K1 | line 14 | KEEP "Foley" [labeler unsure]

=== DOCUMENT fd-0059 ===
   1| Referral and medication summary
   2| 
   3| The clinic is sending this summary so Diabetes Center can see the patient at the next open visit, and so the prednisone course for Bell palsy is not interrupted by a change in the diabetes plan. She is a 54-year-old woman with type 2 diabetes mellitus diagnosed in 2018, hypertension, and allergic rhinitis. Bell palsy was recognized on the recent examination after facial droop began over a single day. Records from Outside Hospital are the source of the initial emergency note and the noncontrast head CT, which showed no acute bleed and no mass.
   4| 
   5| On examination the forehead does not wrinkle on the affected side, eye closure is incomplete, and the nasolabial fold is flat. Hearing is unchanged, vesicles are absent around the ear, and there is no limb weakness, no dysphagia, and no diplopia. The House-Brackmann grade was recorded as IV. Her son has been staying overnight because she is anxious about the eye and about choking, though she has not choked.
   6| 
   7| Diagnoses for this interval are Bell palsy, type 2 diabetes mellitus, hypertension, and allergic rhinitis. The procedures already completed are a noncontrast head CT and a bedside glucose and electrocardiogram during that outside emergency visit. The procedure still requested through Diabetes Center is not a facial study. It is diabetes education with medication adjustment, a dilated retinal examination, and a foot examination with monofilament testing. Neurology will consider electromyography only if useful recovery is not apparent after the prednisone course. No lumbar puncture is planned. Lyme testing was not sent because there was no exposure history the clinician considered relevant.
   8| 
   9| Current medications are prednisone in a taper of 40/30/20/10 mg PO daily, two days at each dose, started after five days of prednisone 60 mg PO daily; valacyclovir 1000 mg PO TID for seven days; metformin 1000 mg PO BID; lisinopril 20 mg PO daily; atorvastatin 20 mg PO nightly; and Allegra 180 mg PO daily for rhinitis. Generic fexofenadine may replace Allegra if the milligram strength is unchanged. Artificial tears, carboxymethylcellulose 0.5% one drop in both eyes four times daily, and a lubricating ointment at night, are in use while the eye does not close. Please do not stop lisinopril for a mild creatinine rise without a repeat measurement. Please do not start a nonsteroidal anti-inflammatory drug for facial pain. Acetaminophen 650 mg PO q6h PRN is the pain plan, with a daily maximum of 3000 mg.
  10| 
  11| The prednisone will raise glucose. Fasting readings at home have been 160 to 210 mg/dL, higher than her baseline near 130 mg/dL. Diabetes Center may add or adjust therapy for the length of the taper and then return her to the prior regimen if glucose settles. Metformin should be continued unless dehydration or a procedure with contrast appears. She does not take insulin. She knows how to check a fingerstick glucose and has strips at home.
  12| 
  13| Laboratory results from the clinic draw: sodium 138 mmol/L, potassium 4.2 mmol/L, creatinine 0.9 mg/dL, eGFR 79 mL/min/1.73 m2, glucose 168 mg/dL, hemoglobin A1c 8.1%, ALT 28 U/L, and white blood cell count 9.4 K/uL. Vitals in the office were blood pressure 138/86 mmHg, heart rate 78 beats per minute, respiratory rate 14 breaths per minute, temperature 36.8 C, oxygen saturation 98% on room air, and weight 86 kg. The affected eye was protected with tape at night as demonstrated. There is no rash and no fever.
  14| 
  15| Please ask Diabetes Center to send the revised medicine list back to the referring office after the visit. The covering pharmacist has already checked the taper against the bottle: the 40 mg step is the current step, and the lower steps are still in the vial. Her son can drive and can stay for teaching. No interpreter is needed. She should seek urgent care for a worsening headache, a new arm or leg weakness, vision loss, chest pain, or glucose persistently above 300 mg/dL with vomiting. Thank you for fitting this visit in while the facial weakness is still evolving.
  16| 
  17| Care coordination
  18| On behalf of the referring clinician
=== END DOCUMENT ===
ITEMS FOR fd-0059:
D1 | line 5 | A: KEEP "House-Brackmann grade was recorded as IV" | B: KEEP "House-Brackmann grade"
D2 | line 9 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D3 | line 11 | A: KEEP "Fasting readings at home have been 160 to 210 mg/dL" | B: KEEP "160 to 210 mg/dL"
D4 | line 15 | A: KEEP "glucose persistently above 300 mg/dL" | B: KEEP "300 mg/dL"
K1 | line 1 | KEEP "Referral and medication summary"
K2 | line 3 | KEEP "diabetes"
K3 | line 7 | KEEP "Diagnoses for this interval"
K4 | line 7 | KEEP "medication adjustment"
K5 | line 9 | KEEP "Current medications"
K6 | line 9 | KEEP "rhinitis"
K7 | line 9 | KEEP "in both eyes"
K8 | line 9 | KEEP "at night"
K9 | line 9 | KEEP "creatinine"
K10 | line 11 | KEEP "dehydration"
K11 | line 13 | KEEP "Laboratory results from the clinic draw"
K12 | line 13 | KEEP "at night"
K13 | line 17 | KEEP "Care coordination"

Now output the result blocks.