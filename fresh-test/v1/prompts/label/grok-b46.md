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


=== DOCUMENT fd-0178 ===
   1| KAG-773184  Pine Hill Pharmacy nurse line  recorded 2026-11-02
   2| Patient: Basya R. Kaganoff    DOB: 15 January 1932    Age: 94
   3| Health plan member 448291776    group 220641
   4| Home phone (603) 555-0148    Email: bkaganoff@example.net
   5| Emergency contact: Faith N'Guessan, daughter
   6| Nurse: Hi, um, this is Shabnam Akhter on the nurse line at Pine Hill Pharmacy. I am calling back about Basya R. Kaganoff. Am I speaking with her daughter?
   7| Caller: Yes, this is Faith N'Guessan. She is right here, but her hearing on the phone is, uh, not great, so I am going to do the talking if that is all right.
   8| Nurse: That is fine. Before the medicines I should confirm where she is staying. The address she texted this morning, all in lowercase, was 14 cedar lane apt b. Is that your apartment?
   9| Caller: Yes. She moved in after the fall. I am 61, and I can fill a pillbox, but I need the change said out loud so I do not, uh, do not guess and give the old dose.
  10| Nurse: Good. One more thing before the warfarin. The patient portal flagged a sign-in from 203.0.113.48 overnight. We have not seen that computer on her account. Was that you?
  11| Caller: That was me, on a library computer. The password would not come and I did not finish. Sorry if it looked like a stranger.
  12| Nurse: I will note that it was you. Here is the reason for the call. This morning the INR was 3.4. For atrial fibrillation the aim has been 2.0 to 3.0, so 3.4 is a little high, and with the recent fall our pharmacist wants a cautious change rather than a tiny one. No warfarin tonight. Starting tomorrow, warfarin 3 mg by mouth once daily. She has been taking 4 mg by mouth daily except Saturday, when she takes 2 mg, and Saturday stays 2 mg. Do not use the 4 mg tablets to make the new dose. If the bottle is the 4 mg strength, give three quarters, wait, no, I am not going to have you split them. We will, um, we will send a fresh bottle of 3 mg tablets so nothing has to be cut.
  13| Caller: Hold tonight, then 3 mg a day, Saturday still 2 mg. What if tonight is already in the box?
  14| Nurse: Take it out. If she already swallowed it, do not skip extra days to catch up. From what you said, it is still in there. Good.
  15| Caller: What time should the new dose be? She has been taking it with the evening news, but some nights she dozes off and I am not sure if I should wake her.
  16| Nurse: Same time each evening is what matters, and waking her is reasonable. If she misses a dose and remembers the same night, she can take it. If she does not remember until the next day, skip it. Do not double. Large swings in spinach, kale, or collards can move the INR. She does not have to stop those foods, but the amount should stay steady, and tell us if her appetite falls off.
  17| Caller: She will ask who signed this. A new name makes her anxious. Who should I tell her?
  18| Nurse: The care team list on the chart is pharmacist Farhana S. Talukder, Shahana Parveen, Imran Kabir, and covering clinician Mark Barua. He is not her usual doctor. The other problems stay put. She has chronic kidney disease stage 3, essential hypertension, hypothyroidism, and osteoporosis. Lisinopril stays 10 mg by mouth daily. Levothyroxine stays 75 mcg every morning on an empty stomach, half an hour before food. Households sometimes still say Synthroid, but our bottle is generic levothyroxine. Alendronate stays 70 mg once a week on Sunday, with a full glass of water, and she stays upright for half an hour. On Sunday the alendronate is first and the levothyroxine waits. Do not give them together. If she missed last Sunday, give the usual 70 mg this Sunday and do not double it.
  19| Caller: She did miss it. Her stomach was sour. I will give it this Sunday. I keep thinking about the hip. After the fall they did a left hip hemiarthroplasty, and last week's x-ray showed no new break. There was also a colonoscopy. I forget the day.
  20| Nurse: Colonoscopy with polypectomy on 4 March 2026, two polyps, pathology benign. The hemiarthroplasty is on the surgical history. Neither one, by itself, accounts for an INR of 3.4. We will recheck this Friday. If it is still above 3.0, the covering clinician may hold a dose. Please watch for black stools, a sudden severe headache, bleeding that will not stop, or a fall with a hit to the head. Those are for the emergency department, not a next-day call.
  21| Caller: She has been lightheaded when she stands. I have been holding her elbow on the way to the bathroom. There is a walker in the hall but she hates it.
  22| Nurse: Keep the walker where she can reach it. The lisinopril, well, the blood pressure pill, can contribute to that lightheaded feeling, and so can being dry if she is not drinking. This warfarin change does not treat the dizziness. If she faints, or the lightheaded spell comes with chest pain, one-sided weakness, or trouble speaking, that is an emergency, the same as a head injury.
  23| Caller: And if she feels well and the number is only a little high?
  24| Nurse: Call us on the daytime number. After hours, use the clinic. I am going to read the clinic line as the digits are printed. Six zero three, five five five, zero one one eight. The medication list is going by fax to Willow Brook Clinic so they have the plan before Friday. The sheet says Fax: (603) 555-0177. The address is printed across two lines.
  25| 410 Maple Street
  26| Hollis, NH 03049
  27| Caller: I will keep that with the pillbox note. Can you repeat just the warfarin part, slowly? She is getting tired.
  28| Nurse: Tonight, no warfarin. Tomorrow, warfarin 3 mg by mouth once daily. Saturday, warfarin 2 mg. Keep the new bottle away from the old 4 mg bottle. The chart number is the unlabeled one at the top of this recording, and the member number and group number under her name are for the health plan, not for the lab. Thank you for staying on.
  29| Caller: Thank you. I will take tonight's tablet out of the box now.
  30| Nurse: End of call. Hold and dose change reviewed with the daughter. Fax requested.
=== END DOCUMENT ===

=== DOCUMENT fd-0240 ===
   1| BRIGHTWATER HOSPITAL
   2| Discharge Summary
   3| 
   4| Patient: EIRÍNI TZAMALAS
   5| DOB: 1930-01-15
   6| Account no.: 8833412
   7| Admitted: 2026-03-04
   8| Discharged: 2026-03-09
   9| 
  10| Mrs. Eiríni Tzamalas is a ninety-six years old woman who was admitted to Brightwater Hospital on 2026-03-04 with fever, cough, and an increased oxygen need. Her daughter, Mrs. Clare Pendleton, reported three days of a wet cough, poorer intake, and a new tendency to cough while drinking thin liquids. There was no chest pain and no new unilateral weakness.
  11| 
  12| She has longstanding Parkinson disease, followed by Dr. Ruth Gable, with bradykinesia, a soft voice, and a shuffling gait. Carbidopa-levodopa has been stable. She also has hypothyroidism and osteoarthritis of the knees. She does not smoke. She lives with Mrs. Clare Pendleton.
  13| 
  14| Medications at home were carbidopa-levodopa 25-100 mg by mouth three times daily, levothyroxine 75 mcg by mouth each morning, and acetaminophen as needed. There is no drug allergy.
  15| 
  16| On arrival her temperature was 38.2 C, pulse 98 beats per minute, blood pressure 142/78 mmHg, respiratory rate 22, and oxygen saturation 89 percent on room air, rising to 95 percent on 2 liters by nasal cannula. She was awake and oriented to person. Lung sounds had crackles at the right base. There was resting tremor of the hands and increased tone, unchanged by her daughter's account. The examination showed no meningismus.
  17| 
  18| A chest radiograph showed a right lower lobe infiltrate. The leukocyte count was 13.6 K/uL, creatinine 0.9 mg/dL, and sodium 136 mmol/L. Blood cultures were drawn before antibiotics and remained negative. A swallow evaluation on 2026-03-06 found delayed initiation and penetration of thin liquids without aspiration of nectar-thick liquids.
  19| 
  20| She recieved ceftriaxone 1 g intravenously daily and azithromycin 500 mg by mouth daily for community-acquired pneumonia, with concern for aspiration given the Parkinson disease and the cough with liquids. Fever resolved on the second day. Oxygen was weaned to room air. A seperate speech pathology note advised nectar-thick liquids and an upright position for meals. Carbidopa-levodopa was given on her usual schedule, and no doses were missed. The episode of coughing with water occured less often once the liquid consistency was changed.
  21| 
  22| Discharge diagnoses are aspiration pneumonia and Parkinson disease. She left on 2026-03-09 with her daughter, walking with a walker, afebrile, and saturating 96 percent on room air.
  23| 
  24| Discharge medicines:
  25| 1. Amoxicillin-clavulanate 875-125 mg by mouth twice daily for two more days, to complete a seven-day course. Prescription number 2201784 was sent to the daughter's preferred pharmacy.
  26| 2. Carbidopa-levodopa 25-100 mg by mouth three times daily. Continue.
  27| 3. Levothyroxine 75 mcg by mouth each morning on an empty stomach. Continue.
  28| 4. Acetaminophen 650 mg by mouth every six hours as needed for pain.
  29| 
  30| Code status is full treatment, confirmed with Mrs. Clare Pendleton on admission. Physical therapy cleared her to walk in the home with the walker she already uses. No new imaging is planned unless fever or cough returns. The amoxicillin-clavulanate should be taken with food to limit nausea.
  31| 
  32| Please follow up with Dr. Ruth Gable within two weeks for the Parkinson disease, and sooner for fever, worse cough, confusion, or a fall. Dr. Samuel Parkinson is available to the specialist by phone at (508) 555-0133 ext. 214 if questions about the admission arise before that visit.
  33| 
  34| Home address for the chart: 14 Olive Court, Apt 3B, Lindell, Massachusetts 02590.
  35| 
  36| Dictated by Dr. Samuel Parkinson, Hospital Medicine, Brightwater Hospital.
=== END DOCUMENT ===

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

Now output the label blocks, one per document, in the order shown.