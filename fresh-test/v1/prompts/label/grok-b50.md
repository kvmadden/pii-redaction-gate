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

=== DOCUMENT fd-0193 ===
   1| HUDA: Quiet Harbor Clinic phone nurse, this is Lamia al-Mutairi. Uh, who is the chart for?
   2| CALLER: Colin Hargrove, I'm her son. The patient is Maeve O'Phelan-Graves. On your sign-in she is O'Phelan-Graves, Maeve. Everybody at the pharmacy shortens it to Graves. I recieved a call that her thyroid medicine is on hold.
   3| HUDA: Thank you. MRN: 4471208. Member ID M440-2291-775. I want to say this carefully so the names do not get tangled. Graves's chart does not carry a diagnosis of Graves disease. That wording was a coding error. Bashir al-Najjar corrected it after the biopsy. The diagnosis is toxic multinodular goiter. She does not have Graves disease, and the surname is just a surname.
   4| CALLER: Good, because my sister saw Graves disease on a printout and got scared. The fine-needle aspiration was 2026-01-22. The prescription bottle says 1/22/26 under that. They told us the next labs are March fourth, twenty twenty-six, and the label also shows 3/4/26.
   5| HUDA: Yes. 2026-01-22 was the fine-needle aspiration, with the thyroid ultrasound the same morning. Cytology was benign colloid nodule. March 2026 is only the month the bridge supply of methimazole is supposed to cover. The draw on March fourth, twenty twenty-six is a TSH and a free T4, not a new biopsy.
   6| CALLER: What is she actually supposed to take? I, I don't want to seperate the bottles wrong.
   7| HUDA: Current sigs from al-Najjar's note: methimazole 10 mg PO daily, propranolol 20 mg PO TID, and atorvastatin 20 mg PO at bedtime. No levothyroxine. If the heart rate stays under 55, hold the propranolol and call. Acetaminophen 650 mg PO q6h PRN is fine for the neck soreness. Do not start aspirin.
   8| CALLER: Her resting pulse at home was 64. Weight is 71 kilograms. She had palpitations in the fall, which is why the propranolol was started. The ultrasound measured a 2.4 centimeter right lobe nodule. They did not do a radioiodine uptake scan.
   9| HUDA: 2.4 centimeters matches the report I have. No uptake scan, no thyroidectomy, and no plan for one while cytology stays benign. Free T4 last time was 1.6 ng/dL, TSH was 0.08 mIU/L, and the liver enzymes were normal on methimazole. We will repeat the TSH and free T4 at that draw. If she gets a fever or a bad sore throat, stop the methimazole and call the same day, because agranulocytosis is the risk we watch for.
  10| YUSUF: Tariq bin Hashim, pharmacy, I stepped on the line. The claim rejected once because the old code said Graves disease. I rewrote it as toxic multinodular goiter and it went through on member ID M440-2291-775. I can fax the correction to the office.
  11| HUDA: Please do. Fax 207-555-0129. That is the clinic fax, labeled Fax on the cover sheet. The home address on the order is 44 Quinlan Road, Moss Harbor, ME 04619. The text your mother sent, all lowercase, says leave it at 8 birch alley if nobody answers at the house.
  12| CALLER: 8 birch alley is my house. Her phone is 207-555-0166. She is 63, she drives, but the neck is still sore from the aspiration, so I have been picking up. Courier only comes out for ZIP 04622, wich is not her ZIP, so don't promise a driver.
  13| HUDA: I will not. Service area on the board is 04622 and she is outside it. She can use 207-555-0166 as the callback. MRN: 4471208 stays on the fax cover so Tariq bin Hashim and the front desk do not pull a different Graves.
  14| CALLER: There is another Graves in town?
  15| HUDA: I am not going to say another patient's details. I am saying O'Phelan-Graves, Maeve, MRN: 4471208, is teh chart I have open. Procedure history is thyroid ultrasound and fine-needle aspiration. No thyroidectomy. Diagnoses are toxic multinodular goiter, benign colloid nodule, and hyperlipidemia. Graves disease is not on the active list. It was entered in error and removed.
  16| YUSUF: I'll add a line on the fax that the methimazole is for the goiter, not for Graves disease, so the next person who reads al-Najjar's note does not correct it backward. March 2026 supply is thirty tablets of methimazole 10 mg. Refill after the labs on 3/4/26.
  17| CALLER: Can you read the address once more, the proper one, not the lowercase one?
  18| HUDA: 44 Quinlan Road, Moss Harbor, ME 04619. Backup from her text is 8 birch alley. Phone 207-555-0166. Fax 207-555-0129 if your pharmacy needs the letter. The spoken date for labs is March fourth, twenty twenty-six. I think that is all of it.
  19| CALLER: Uh, one more. She occasionally takes an old atenolol from before the propranolol. I told her to stop.
  20| HUDA: Stop the atenolol. Two beta blockers will drop the rate too far. Propranolol 20 mg PO TID is the one Bashir al-Najjar wants. If she feels faint, call us, or come in. Thank you for calling Quiet Harbor Clinic.
  21| CALLER: Thanks. I'll tell her.
=== END DOCUMENT ===

=== DOCUMENT fd-0225 ===
   1| LILY: Pine Hollow Pharmacy, this is Lily Brennan. Uh, tech line. Who am I pulling up?
   2| CALLER: Hi, it's Luísa Conceição. I'm calling for my mother, Clémence de la Serigny. The sign-in from this morning was written de la Serigny, Clémence. I recieved a text that the prior auth is stuck.
   3| LILY: Okay, give me one second. MRN: 6621904. I have her as a 58-year-old. Member number WLP-2291845. Is that the plan you have on the card?
   4| CALLER: Yes. That's the one. Dr. Cushing, Edward Cushing, wrote the adalimumab. His office said the auth runs through March 2026, and the next infusion, no, it's an injection, is on March 4, 2026. She said it out loud to me as March fourth, twenty twenty-six, so I woudln't forget. On the bottle the date is printed 3/4/26.
   5| LILY: I see 3/4/26 on the label too. Cushing's note says rheumatoid arthritis, failed methotrexate at a full dose, and a negative workup for Cushing syndrome. The syndrome and the clinician are, um, obviously not the same person. He wrote that the urinary free cortisol was normal, so nobody should treat her as if she has Cushing syndrome.
   6| CALLER: Good, because the name kept confusing my aunt. She had a left carpal tunnel release two winters ago, and a screening colonoscopy the year before that. Current list is rheumatoid arthritis, steroid-induced hyperglycemia, and osteoporosis. Her right knee was aspirated in the clinic. No crystals on the smear. They called it a rheumatoid flare rather than a septic joint. There is no plan for a total knee arthroplasty. The swelling is worse in the morning and better after she moves.
   7| LILY: Meds I show: methotrexate 15 mg PO weekly, folic acid 1 mg PO daily, prednisone 5 mg PO daily, and adalimumab 40 mg subcutaneous every 2 weeks. Calcium with vitamin D is over the counter. Lily's screen, sorry, my screen, also shows a hold if the white count drops. Aspiration is on the procedure list under the colonoscopy and the carpal tunnel release.
   8| CALLER: They also did a tuberculosis screen before the adalimumab. The quantiferon was negative, and the hepatitis B surface antigen was negative. She had a chest radiograph with no old granuloma. Last CBC was fine, she said. They do the injection at the clinic, not here. Can you fax the auth packet so Dr. Cushing's nurse has it before March 4, 2026?
   9| LILY: I see that. Last creatinine was 0.8 mg/dL, ALT 22 U/L, and white count 6.4 K/uL. Blood pressure at the last visit was 128/74 mmHg, heart rate 76. No live vaccines while she is on adalimumab. The shingles vaccine she already finished can stay on the list. Fax number I have for the office is Fax 360-555-0133. I'll send the approval and the medication list. Home address on the prescription is 907 West Briar Street, Lumen Falls, WA 98520. The text she forwarded, the one in lowercase, says deliver instead to 14 poplar court, lumen falls. Which one is right?
  10| CALLER: 14 poplar court is my house. She stays with me the week of the injection because the methotrexate makes her queasy. Her own phone is 360-555-0148 if the driver needs the gate code. Please don't seperate the folic acid from the methotrexate or she will take one and forget the other.
  11| LILY: Noted on de la Serigny's profile. I'll tell Ned Haskill, the pharmacist on duty, that the ship-to is 14 poplar court, lumen falls, and that the member number WLP-2291845 has to be on the claim. I will not let the pharmacy substitute the adalimumab for a biosimilar unless Edward Cushing signs it. He was asking why the auth expired.
  12| CALLER: It expired because nobody sent the joint count. Her hands are swollen most mornings. She is 58, she still works, and she does not want the prednisone increased. Occassionally she skips the prednisone when her glucose is high. I told her not to.
  13| LILY: Please don't skip. Prednisone 5 mg PO daily is a fixed dose, not a sliding scale. If glucose is high, call Edward Cushing's office rather than stopping it. Adalimumab stays 40 mg subcutaneous every 2 weeks as long as the auth for March 2026 is honored. The visit on March fourth, twenty twenty-six is the one they will bill.
  14| CALLER: Can you read the chart header back so I know you are in the right record?
  15| LILY: de la Serigny, Clémence. MRN: 6621904. Date on the label 3/4/26. Fax 360-555-0133 for the office. Phone 360-555-0148. I think that's the whole string.
  16| CALLER: Thank you. Uh, one more thing. If Ned Haskill wants to talk to her directly, she is home after four. She gets tired of me being the one on the phone.
  17| LILY: I'll leave that for Ned Haskill. Thanks for calling Pine Hollow Pharmacy.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.