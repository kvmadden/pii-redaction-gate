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


=== DOCUMENT fd-0222 ===
   1| Clinical Pharmacy Consultation Note
   2| 
   3| Reason for Consult: Comprehensive medication reconciliation following discharge.
   4| 
   5| Patient Description: The patient is a 67-year-old individual with a history of Parkinson disease, peripheral neuropathy, and essential hypertension, admitted last week following an acute fall.
   6| 
   7| Subjective: The patient and the patient's spouse report persistent burning dysesthesias in the lower extremities despite gabapentin therapy. Records received from Outside Hospital noted poor response to gabapentin 600 mg PO TID. They request transition to Lyrica as recommended by neurology prior to transfer. The patient also reports mild dry cough and orthostasis.
   8| 
   9| Vitals: BP 118/74 mmHg, HR 72 bpm, SpO2 98% on room air, BMI 26.4 kg/m2.
  10| 
  11| Labs: Serum creatinine 0.92 mg/dL, eGFR >60 mL/min/1.73m2, serum potassium 4.4 mEq/L, AST 22 U/L, ALT 26 U/L, HbA1c 6.1%.
  12| 
  13| Medication Reconciliation and Assessment:
  14| 1. Neuropathic pain: Discontinue gabapentin. Initiate Lyrica 75 mg PO BID for 1 week, then titrate to 150 mg PO BID if tolerated.
  15| 2. Parkinson disease: Carbidopa-levodopa 25/100 mg PO TID with meals. Patient advised to avoid taking doses simultaneously with high-protein meals.
  16| 3. Hypertension: Lisinopril 10 mg PO daily. Blood pressure is currently well controlled.
  17| 4. Dyslipidemia: Atorvastatin 20 mg PO QHS.
  18| 
  19| Plan and Recommendations:
  20| Counseling provided via telephone to the patient regarding sedation and peripheral edema risks with Lyrica. Scheduled follow-up with Pain Clinic in four weeks for evaluation of neuropathic symptoms. Routine lab panel recommended in 2026. Clinical pharmacist review completed.
=== END DOCUMENT ===

=== DOCUMENT fd-0168 ===
   1| Bright Water Clinic
   2| Outpatient Progress Note
   3| 
   4| Patient: Zong, Ntxawm
   5| MRN: 2294518
   6| Member ID HP610293384
   7| Date of Service: April 22, 2026
   8| 
   9| Chief complaint
  10| Diabetes follow-up after a colonoscopy, with home glucose readings that have been runing high.
  11| 
  12| History of present illness
  13| Ntxawm Zong's log shows fasting values mostly 150 to 180 mg/dL over the past two weeks, higher than the 120s she held in the winter. She has not had sweating, shaking, or confusion to suggest hypoglycemia, and she is not waking at night to urinate. Breakfast is rice porridge or toast, lunch is often soup, and supper is rice with vegetables and a small portion of meat. She feels well enough to cook and to walk the grocery aisles, and she denies thirst that wakes her, weight loss, chest pain, and foot ulcers. She walked thirty minutes on most days until the week of the procedure and has started again.
  14| 
  15| A screening colonoscopy was done in March 2026. Two small polyps were removed by cold snare polypectomy, and the report called them tubular adenomas. Images are posted at https://portal.example.net/gi/zong-colon for her son-in-law to open with her. She had some gas pain for two days and then felt like herself. No rectal bleeding since the procedure.
  16| 
  17| Her son-in-law, Chidera Nwankwo, came in with her today, wich has been the pattern since her daughter took a job out of state. On the drive to the clinic a truck clipped the passenger mirror. No one was hurt and they did not need an emergency department. He wrote down plate 6TRD204. He works in Stillwater and she lives in Maplewood, so the visit fits after his shift. He is the one who compares the glucose log with the pill box. She does not drink alcohol and stopped smoking in her thirties. A daughter calls on Sundays from another state, and there is no caregiver strain he wanted to raise today.
  18| 
  19| Past medical history
  20| Type 2 diabetes mellitus diagnosed in her fifties. Essential hypertension. Chronic kidney disease stage 2, with a stable creatinine. Dyslipidemia. No coronary stent and no prior stroke. Right cataract extraction several years ago.
  21| 
  22| Medications
  23| Metformin 1000 mg by mouth twice daily
  24| Glipizide 5 mg by mouth daily with breakfast
  25| Lisinopril 10 mg by mouth daily
  26| Atorvastatin 20 mg by mouth at bedtime
  27| Aspirin 81 mg by mouth daily
  28| She missed two evening metformin doses during teh colonoscopy bowel prep and then restarted.
  29| 
  30| Allergies
  31| No known drug allergy.
  32| 
  33| Examination
  34| Blood pressure 136/78 mmHg, pulse 74 beats per minute, weight 63.5 kg, BMI 26. She is a 67-year-old woman in no distress, alert, and neatly dressed. Lungs clear, heart regular, no new murmur. Abdomen soft and nontender, with no liver edge. Feet have intact skin, palpable dorsalis pedis pulses, and normal monofilament testing at all standard sites. Neck is supple and the clipped-mirror story did not leave a tender muscle or a bruise. Mood is good-humored and she answers questions herself, turning to her son-in-law only for dates. Dilated retinal examination was done by optometry last fall and showed no diabetic retinopathy.
  35| 
  36| Labs
  37| Hemoglobin A1c today is 8.1 percent, up from 7.2 percent. Creatinine 0.92 mg/dL, eGFR 74 mL/min/1.73 m2, urine albumin-to-creatinine ratio 18 mg/g. LDL cholesterol 88 mg/dL on the current statin. Potassium 4.2 mmol/L.
  38| 
  39| Assessment and plan
  40| 1. Type 2 diabetes mellitus, above goal. The missed doses around colonoscopy do not explain an A1c of 8.1 percent. I will raise glipizide to 5 mg by mouth twice daily and keep metformin at 1000 mg by mouth twice daily. She knows the signs of a low and will keep glucose tablets in her purse. I asked her to write down any value under 80 mg/dL and to hold a glipizide dose if she is not eating. Metformin will be stopped if a future creatinine climbs or if she has vomiting that keeps her from fluids. Repeat hemoglobin A1c in three months. Continue foot checks at home and a yearly dilated eye exam.
  41| 2. Tubular adenomas on screening colonoscopy with cold snare polypectomy. Surveillance colonoscopy in three years was the gastroenterologist's interval, and I agree. No anemia to suggest a missed lesion.
  42| 3. Essential hypertension and stage 2 chronic kidney disease. Blood pressure and albumin excretion are acceptable on lisinopril. No change today.
  43| 4. Prevention. Atorvastatin and aspirin stay as written. A shingles vaccine was offered and she will think it over with her daughter on the phone.
  44| 
  45| Return sooner for chest pain, a glucose she cannot bring up, blood in the stool, or a foot wound. The plan was reviewed with Chidera Nwankwo, who will update the pill box tonight.
  46| 
  47| Address on the registration line: 1280 Tamarack Avenue, Maplewood, MN 55109.
  48| Phone (651) 555-0192.
  49| Fax (651) 555-0140 for the colonoscopy office if they need a medication list.
  50| 
  51| Electronically signed
  52| Olena Bondar-Hrytsenko, MD
  53| Internal Medicine
  54| 
  55| Author: Olena Bondar-Hrytsenko, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0074 ===
   1| Patient Name: van Gelder, Jochem
   2| Date of Service: November 12, 2026
   3| Health Plan Member ID: HPN-7734019
   4| Facility: Lakeshore Urological Associates
   5| 
   6| Message Thread: Prostate Biopsy Pathology Review and Prior Auth
   7| 
   8| Message 1:
   9| From: claire albright
  10| Sent: November 14, 2026 10:15 AM
  11| To: Lakeshore Urological Associates Triage
  12| Subject: Pathology follow-up for Jochem van Gelder
  13| 
  14| hello nurse megan, i am writing on behalf of my father jochem van gelder regarding his recent transrectal prostate needle biopsy performed by dr gleason. we reviewed the pathology report that was posted to the portal yesterday. the pathologist noted adenocarcinoma in three of twelve cores with a Gleason score of 3+4=7, corresponding to Grade Group 2. dr gleason had mentioned during our consultation that if the biopsy showed intermediate-risk disease, we would discuss staging pelvic MRI and active surveillance versus radiation therapy. my father is anxious to know what the next steps are and whether a referral to radiation oncology has been initiated. also, our health plan requires prior authorization for pelvic MRI under Plan Group Number GRP-884102. could your office submit that prior auth request? the imaging center requested that the clinical records and authorization approval be sent by Fax: (616) 555-0148. lastly, my father prefers to pick up his tamsulosin 0.4 mg PO daily refill at the pharmacy location in 49503 rather than the suburban outlet. thank you so much for your assistance, claire
  15| 
  16| Message 2:
  17| From: Megan Bauer, RN
  18| Sent: November 14, 2026 02:40 PM
  19| To: claire albright
  20| Subject: RE: Pathology follow-up for Jochem van Gelder
  21| 
  22| Hello Claire,
  23| 
  24| I discussed the pathology findings with Dr. Wayne Gleason this afternoon. He confirmed that the biopsy demonstrates favorable intermediate-risk prostate cancer based on the Gleason score of 3+4=7 and his pre-biopsy PSA of 6.2 ng/mL. Dr. Gleason has ordered a multi-parametric prostate MRI to evaluate for extracapsular extension and has submitted the formal consultation request to Radiation Oncology.
  25| 
  26| Our pre-authorization coordinator has submitted the imaging request to his insurer under Health Plan Member ID HPN-7734019 and Plan Group Number GRP-884102. Once the approval is secured, our office will transmit the clinical notes and authorization to the imaging facility via Fax: (616) 555-0148. In addition, I have routed his tamsulosin 0.4 mg capsule prescription to the pharmacy in 49503. Please have Mr. van Gelder continue tamsulosin 0.4 mg PO daily thirty minutes after the same meal each evening. Dr. Wayne Gleason would like to see him back in clinic for a comprehensive discussion once the MRI is completed. Please reach out if you have any questions in the interim.
  27| 
  28| Warm regards,
  29| Megan Bauer, RN
  30| Lakeshore Urological Associates
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.