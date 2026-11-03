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


=== DOCUMENT fd-0119 ===
   1| TRANSCRIPT OF CLINICAL PHARMACY RECONCILIATION CALL
   2| SERVICE: Endocrinology
   3| REFERRAL DESTINATION: Diabetes Center
   4| SOURCE OF PREVIOUS RECORDS: Outside Hospital
   5| PATIENT AGE: 68-year-old male
   6| SPEAKERS: Clinical Pharmacist, Patient's Son
   7| 
   8| [Call Audio Recording Commenced]
   9| 
  10| Clinical Pharmacist: Ambulatory pharmacy consultation line, this is the clinical pharmacist speaking. Who am I speaking with today?
  11| 
  12| Patient's Son: Hello, yes, uh, good afternoon. I am calling on behalf of my father. He is, uh, he is a 68-year-old patient following with your endocrine service. He had, uh, he had some blood work drawn earlier this week, and we received a notification that his thyroid levels were markedly abnormal. Also, the records transferred over from Outside Hospital indicated that his anti-thyroid regimen needed adjustment, so we wanted to review his current medications.
  13| 
  14| Clinical Pharmacist: Certainly, I can help reconcile his medications and review those lab trends with you. Looking at his chart history, he was initially diagnosed with Graves disease in 2019, and he has had intermittent relapses of thyrotoxicosis. Can you tell me what symptoms he is currently experiencing at home?
  15| 
  16| Patient's Son: Well, um, over the past week he has had noticeable palpitations, heat intolerance, and a fine tremor in his fingers. He also says he feels anxious and has trouble sleeping. We checked his vitals this morning: his blood pressure was 142/86 mmHg, heart rate was elevated at 104 bpm regular, respiratory rate was 18 breaths per minute, and his weight was down 2.4 kg compared to last month.
  17| 
  18| Clinical Pharmacist: Those clinical signs are very consistent with excess circulating thyroid hormone. Looking at the laboratory values drawn two days ago, his thyroid stimulating hormone is suppressed at less than 0.01 uIU/mL, his free thyroxine, or free T4, is elevated at 2.8 ng/dL, and his free triiodothyronine is 6.2 pg/mL. He also had a radioactive iodine uptake scan documented from Outside Hospital which showed diffuse homogeneous uptake of 58% at 24 hours, confirming active Graves disease rather than destructive thyroiditis.
  19| 
  20| Patient's Son: Yes, exactly. And what about his current prescriptions? He takes methimazole, but we were confused about the dose because of his recent allergic rash.
  21| 
  22| Clinical Pharmacist: Let us review every medication he is currently taking. He was restarted on methimazole 10 mg PO daily, but then developed a diffuse pruritic maculopapular rash. To manage that allergic reaction, the covering clinician prescribed brand Allegra 180 mg PO daily alongside a rapid steroid taper using prednisone 40/30/20/10 mg PO daily, stepping down the dose every 3 days. Did he finish that prednisone taper?
  23| 
  24| Patient's Son: Yes, he took the last 10 mg prednisone tablet three days ago. The hives cleared up completely with the Allegra, and he is still taking the Allegra 180 mg PO once every morning without any issues. But now that the steroid is done, his palpitations seem more prominent.
  25| 
  26| Clinical Pharmacist: That makes clinical sense. The corticosteroids suppress peripheral conversion of T4 to T3, so stopping the taper unmasked his hyperadrenergic symptoms. For his tachycardia and tremor, the attending endocrinologist has placed an order for propranolol 20 mg PO TID PRN for heart rate greater than 90 bpm or bothersome tremors. Have you picked up that propranolol prescription yet?
  27| 
  28| Patient's Son: Yes, we have the propranolol bottle here at home, but we were waiting to talk to someone before giving him the first pill.
  29| 
  30| Clinical Pharmacist: You can go ahead and give him his first dose of propranolol 20 mg PO right now with water. It should help slow his pulse and relieve that internal shakiness within thirty to sixty minutes. In addition, because his glycemic parameters have fluctuated with the steroids—his fasting blood glucose was 158 mg/dL on the recent metabolic panel—we are placing a formal referral to the Diabetes Center for lifestyle education and blood glucose surveillance while his thyroid levels normalize.
  31| 
  32| Patient's Son: That is very reassuring. Should he continue taking the methimazole 10 mg daily as well?
  33| 
  34| Clinical Pharmacist: Yes, please continue methimazole 10 mg PO daily in the morning. If he develops any recurrence of severe rash, facial swelling, high fever, or a severe sore throat, stop the methimazole immediately and notify us, as those can be signs of agranulocytosis. We will repeat his complete blood count and liver function tests, along with free T4 and total T3, in four weeks.
  35| 
  36| Patient's Son: Understood. Give the propranolol 20 mg PO now for the palpitations, keep taking methimazole 10 mg and Allegra 180 mg daily, watch for fever or throat pain, and attend the Diabetes Center appointment.
  37| 
  38| Clinical Pharmacist: That is exactly right. If his heart rate stays over 110 bpm at rest despite the propranolol, or if he develops chest pain, shortness of breath, or confusion, seek emergency medical care immediately.
  39| 
  40| Patient's Son: Thank you very much for explaining everything so clearly.
  41| 
  42| Clinical Pharmacist: You are very welcome. Take good care.
  43| 
  44| [Call Audio Recording Concluded]
=== END DOCUMENT ===
ITEMS FOR fd-0119:
K1 | line 2 | KEEP "Endocrinology"
K2 | line 16 | KEEP "palpitations"
K3 | line 16 | KEEP "heat intolerance"
K4 | line 16 | KEEP "fine tremor"
K5 | line 16 | KEEP "weight was down 2.4 kg"
K6 | line 18 | KEEP "diffuse homogeneous uptake of 58% at 24 hours"
K7 | line 20 | KEEP "allergic rash"
K8 | line 22 | KEEP "diffuse pruritic maculopapular rash"
K9 | line 22 | KEEP "allergic reaction"
K10 | line 22 | KEEP "every 3 days"
K11 | line 22 | KEEP "prednisone"
K12 | line 24 | KEEP "hives"
K13 | line 24 | KEEP "once every morning"
K14 | line 24 | KEEP "palpitations"
K15 | line 26 | KEEP "hyperadrenergic symptoms"
K16 | line 26 | KEEP "tremor"
K17 | line 26 | KEEP "heart rate greater than 90 bpm"
K18 | line 26 | KEEP "tremors"
K19 | line 30 | KEEP "metabolic panel"
K20 | line 34 | KEEP "in the morning"
K21 | line 34 | KEEP "severe rash"
K22 | line 34 | KEEP "facial swelling"
K23 | line 34 | KEEP "high fever"
K24 | line 34 | KEEP "severe sore throat"
K25 | line 34 | KEEP "complete blood count"
K26 | line 34 | KEEP "liver function tests"
K27 | line 34 | KEEP "free T4"
K28 | line 34 | KEEP "total T3"
K29 | line 36 | KEEP "palpitations"
K30 | line 36 | KEEP "fever"
K31 | line 36 | KEEP "throat pain"
K32 | line 38 | KEEP "heart rate stays over 110 bpm"
K33 | line 38 | KEEP "chest pain"
K34 | line 38 | KEEP "shortness of breath"
K35 | line 38 | KEEP "confusion"

=== DOCUMENT fd-0120 ===
   1| MRN: 8841206
   2| Patient: Kiriaki M. Famelis    DOB: 2 February 1934    Age: 92
   3| Health plan member 662190443    group 44188
   4| Orchard Street Pharmacy  refill line
   5| Pharmacy: Hi, um, this is Kavitha Nellaiappan at Orchard Street Pharmacy. I am calling about a refill and a dose change for Kiriaki M. Famelis. Am I speaking with her son-in-law?
   6| Caller: Yes, this is Seydou Traoré. She is in the chair beside me. Her English on the phone wanders, so, uh, so I will take the call. I am 58.
   7| Pharmacy: Thank you. I have a text from this morning with the address in lowercase, 22 birch avenue apt 3. Is that where the delivery should go?
   8| Caller: Yes, that is the apartment. Do not send it to the old house.
   9| Pharmacy: All right. Before the medicines, the portal shows a sign-in alert from 198.51.100.23 yesterday evening. That computer is not one we had stored for her. Did you log in?
  10| Caller: That was me, from the computer at my shop. The email line would not take the symbol, so my wife wrote it as kfamelis at example dot com.
  11| Pharmacy: That spelling matches what we have, with the words in place of the symbols. I can see the approval now. Her health plan cleared the empagliflozin, the Jardiance, so we can fill it. She did not recieve last month's bottle because the request was still open. It is open no longer.
  12| Caller: Good, because she was down to four tablets and I was getting nervous.
  13| Pharmacy: Let me, um, let me go through the whole box so the new bottle does not surprise you. The reason for the call is the swelling. You told the clerk she is up five pounds since last Friday and her ankles are leaving a dent. Anirban Ghatak sent a new order this morning. Furosemide, which some older bottles call Lasix, goes from 40 mg by mouth every morning to 40 mg by mouth twice a day. The second dose should be at midday, not at bedtime, or she will be up all night. Start that extra tablet tommorow. Keep the morning dose as it is.
  14| Caller: Tomorrow, midday, 40 mg, and the morning 40 mg stays. What if the midday one is still sitting there at dinner?
  15| Pharmacy: Give it if, wait, give it if dinner is still the same day. If you find it the next morning, skip it. Do not double onto the morning tablet. And please keep the morning pills seperate from the evening ones so the atorvastatin does not end up in the noon slot. The atorvastatin is 40 mg at bedtime, and that one does not change.
  16| Caller: She had a couple of ibuprofen yesterday for the knee. I know, I know, you are going to tell me to stop. Her knee was bad and she would not wait.
  17| Pharmacy: Yes. Please stop the ibuprofen, and do not use naproxen either. With heart failure and with chronic kidney disease stage 3a, those medicines hold salt and water and they can bump the creatinine. Her eGFR last month was 52, which is acceptable for what she is on, and I do not want ibuprofen pushing it the wrong way. For the knee, acetaminophen 650 mg is all right, up to three times a day, and I do not see a liver problem on her list. The right knee corticosteroid injection from the fall does not conflict with today's fill.
  18| Caller: The heart ultrasound was the recent one. They said the squeeze was normal and the filling was the problem.
  19| Pharmacy: Transthoracic echocardiogram on 18 February 2026. The report we have says the ejection fraction was 60 percent, with diastolic dysfunction, which fits heart failure with preserved ejection fraction. That diagnosis stays. So do type 2 diabetes mellitus, gout, and osteoarthritis of the right knee. Nobody added a new blood pressure pill. The swelling is being treated with the diuretic.
  20| Caller: Is the diabetes pill the one that needed the approval?
  21| Pharmacy: The empagliflozin is the one, 10 mg by mouth every morning, brand name Jardiance when the plan prints it that way. Metformin stays 500 mg by mouth twice a day with food. Allopurinol stays 100 mg by mouth daily for the gout. None of those three change today. If she is vomiting or not eating, hold the empagliflozin and the metformin and call us. Do not stop the furosemide unless she is dizzy or her weight is dropping fast. Allopurinol is not a pain pill, and she should not stop it on her own if the toe flares.
  22| Caller: Weights. She will fight me, but I can do the scale. What number makes you want a call?
  23| Pharmacy: A gain of three pounds in one day, or five pounds in a week, from her usual dry weight. She already met the week rule, which is why the dose is changing. Also call for shortness of breath at rest, needing extra pillows, or swelling that climbs above the ankles.
  24| Caller: The visit is soon. I have it on a card somewhere. The screen at your place probably has it cleaner than my card.
  25| Pharmacy: The schedule on my screen shows 2026-03-04. Out loud that is March fourth, twenty twenty-six, with the heart failure clinic in the morning. Bring the weight log and the pillbox.
  26| Caller: Who is actually allowed to change these if I call back and get someone else? She likes the names ahead of time.
  27| Pharmacy: The care team list I have is refill nurse Kavitha Nellaiappan, pharmacist Lakshmi V. Sripada, physician Anirban Ghatak, and technician Deepa Varadarajan. If you need something in writing, our fax line is on the delivery slip.
  28| Caller: Read me the fax and the street, please. I write slow.
  29| Pharmacy: Fax: (508) 555-0192. The building address is on two lines.
  30| 140 Orchard Street
  31| Lowell, MA 01852
  32| If the driver cannot find you, the callback we have is (508) 555-0136. That is the number you left this morning.
  33| Caller: That is my phone, yes. Leave the bag with me if she is napping. And, uh, and thank you for not making her get on the phone.
  34| Pharmacy: She may have occassional calf cramps with the higher furosemide. Do not start a potassium pill unless someone orders it. Her potassium on the last lab was in range. The ibuprofen stays out of the bag. Say the midday dose back to me and we can hang up.
  35| Caller: Midday furosemide 40 mg starting tomorrow, morning dose unchanged, no ibuprofen, weights on the scale. I have it.
  36| Pharmacy: End of call. Dose change and delivery address confirmed with the son-in-law.
=== END DOCUMENT ===
ITEMS FOR fd-0120:
D1 | line 17 | A: KEEP "right knee corticosteroid injection" | B: KEEP "corticosteroid injection"
K1 | line 13 | KEEP "at midday"
K2 | line 14 | KEEP "midday"
K3 | line 17 | KEEP "eGFR last month was 52"
K4 | line 18 | KEEP "heart ultrasound"
K5 | line 19 | KEEP "ejection fraction was 60 percent"
K6 | line 34 | KEEP "potassium"
K7 | line 34 | KEEP "potassium on the last lab was in range"
K8 | line 35 | KEEP "Midday"

=== DOCUMENT fd-0128 ===
   1| Chart no. 7301948
   2| Patient: Albright, Arthur
   3| Encounter Date: 05/12/2026
   4| Email Contact: arthur.albright@example.org
   5| Subject: Prescription renewal request and follow-up consultation
   6| 
   7| Message 1
   8| From: arthur
   9| Sent: 05/12/2026 08:45 AM
  10| To: Dr. Laura Hastings
  11| 
  12| hello dr. hastings,
  13| i am writing to request a renewal for my maintenance eye drops and to ask about my recent facial weakness. as you know, back in August 2025 when i was first evaluated as a 62-year-old male with hypertension, we established my baseline care plan. recently my sister Clara Bell noticed that the right side of my mouth was slightly drooping when i smiled, and my right eyelid was not fully closing. she was concerned because our father had a history of stroke. however, i had no arm weakness, confusion, or difficulty speaking. when i saw the urgent care provider on 05/10/2026, he diagnosed idiopathic facial nerve paralysis, specifically Bell palsy, and started me on oral corticosteroids and valacyclovir.
  14| 
  15| my prednisone taper is now complete, and the facial motor strength is gradually recovering. however, my right eye remains dry and irritated, especially in the wind. my current artificial tears prescription under Rx # 4820194 has run out of refills at the pharmacy. could you please submit an updated electronic renewal for carboxymethylcellulose 0.5% ophthalmic solution, instill 1 to 2 drops in the right eye four times daily PRN? my sister Clara Bell has been helping me with the drops and driving me to my appointments. my home vitals this morning were BP 128/82 mmHg and pulse 74 bpm. thank you for your help.
  16| 
  17| Message 2
  18| From: Dr. Laura Hastings, MD
  19| Sent: 05/12/2026 11:20 AM
  20| To: Albright, Arthur
  21| 
  22| Dear Mr. Albright,
  23| 
  24| Thank you for reaching out through the portal. I reviewed the urgent care clinical notes from your visit on 05/10/2026. The presentation and rapid partial recovery are characteristic of Bell palsy, and I am glad that your sister Clara Bell promptly had you evaluated to exclude an acute cerebrovascular event.
  25| 
  26| I have transmitted a renewed authorization for carboxymethylcellulose 0.5% ophthalmic drops under Rx # 4820194 to your designated pharmacy, with three refills authorized. Please continue to instill 1 to 2 drops in the right eye four times daily PRN, and remember to use lubricating ophthalmic ointment at bedtime with eye taping if nocturnal lagophthalmos persists to prevent corneal abrasion.
  27| 
  28| For your records and insurance documentation, my supervising provider credentials are NPI: 1487029381. If you experience worsening facial asymmetry, hyperacusis, or vision changes, please email our clinical nursing pool at triage@example.org or notify us immediately through the portal. We will schedule a comprehensive follow-up examination in June 2026.
  29| 
  30| Sincerely,
  31| Laura Hastings, MD
=== END DOCUMENT ===
ITEMS FOR fd-0128:
D1 | line 24 | A: KEEP "acute cerebrovascular event" | B: KEEP "cerebrovascular event"
D2 | line 26 | A: KEEP "lubricating ophthalmic ointment" | B: KEEP "ophthalmic"
K1 | line 13 | KEEP "facial weakness"
K2 | line 13 | KEEP "oral"
K3 | line 15 | KEEP "artificial tears"
K4 | line 15 | KEEP "0.5%"
K5 | line 26 | KEEP "0.5%"
K6 | line 26 | KEEP "eye taping"
K7 | line 28 | KEEP "facial asymmetry"
K8 | line 28 | KEEP "hyperacusis"
K9 | line 28 | KEEP "vision changes"
K10 | line 28 | KEEP "comprehensive follow-up examination"

=== DOCUMENT fd-0151 ===
   1| From: Patient
   2| Sent: 8:16 AM
   3| 
   4| hi, i recieved the lab message and i am pretty worried. my heart has been racing with palpatations, and i get shakey when i climb stairs. it doesnt feel like the medicine is keeping up. i was told this is Graves disease back in 2019, and i have been on methimazole 10 mg PO daily plus propranolol 20 mg PO TID. i am 61 and i do not want this to turn into a heart problem. the thyroid uptake scan was done at Outside Hospital and nobody at the clinic has gone over it with me. can someone look and tell me if a high free T4 means the dose is too small. my daughter keeps asking whether this runs in the family.
   5| 
   6| From: Covering clinician
   7| Sent: 11:02 AM
   8| 
   9| Thanks for writing. A free T4 of 2.8 ng/dL with a TSH under 0.01 mIU/L still fits active Graves disease, so the current methimazole dose looks low. Please increase methimazole to 20 mg PO daily and keep propranolol 20 mg PO TID for the tremor and the fast heart rate. For a 61-year-old, a heart rhythm check is warranted, and I am placing a referral to Cardiology. The home blood pressure was 148/86 mmHg and the pulse was 112 bpm at the last nurse visit, which is too fast to leave alone. ALT was 34 U/L, so it is acceptable to continue methimazole, but stop it and send a portal note for jaundice, a severe rash, or a sore throat with fever. The uptake images show diffuse increased uptake, which supports Graves disease rather than a single nodule. This can cluster in families, though that does not diagnose your daughter. Take the two medicines at the same times each day, and do not stop propranolol all at once.
  10| 
  11| Endocrinology
=== END DOCUMENT ===
ITEMS FOR fd-0151:
K1 | line 4 | KEEP "free T4"
K2 | line 9 | KEEP "heart rhythm check"
K3 | line 9 | KEEP "single nodule"

=== DOCUMENT fd-0154 ===
   1| OUTPATIENT CONSULTATION NOTE
   2| REASON FOR CONSULTATION: Evaluation of chronic bilateral lower extremity pain and suspected radiculopathy versus peripheral neuropathy.
   3| 
   4| HISTORY OF PRESENT ILLNESS:
   5| The patient is a 64-year-old female who presents for comprehensive outpatient evaluation of worsening bilateral lower extremity burning discomfort, numbness, and paresthesias. Her symptoms initially began distally in both feet in 2018 and have gradually progressed proximally to mid-calf level over the intervening years. She describes the sensation as a persistent "fire-like" ache accompanied by intermittent sharp, electric shocks that intensify at night, significantly disrupting her sleep architecture. She was previously treated with gabapentin, which was discontinued due to excessive daytime sedation. In 2021, she was initiated on Lyrica 75 mg PO BID, which provided partial relief; however, over the past year her pain has escalated to an average severity of 7/10 on the visual analog scale.
   6| Records transferred from Outside Hospital document an emergency department encounter in 2023 for acute right lower extremity swelling, at which time a Wells score was calculated at 0 points (low probability), and bilateral venous duplex ultrasound ruled out deep vein thrombosis. An electromyogram and nerve conduction study performed at that facility demonstrated findings consistent with distal symmetric sensorimotor polyneuropathy. Additionally, the patient reports a history of recurrent right-sided facial weakness that occurred in 2019, which was diagnosed as idiopathic Bell palsy and resolved almost completely following an oral steroid taper.
   7| She denies bowel or bladder incontinence, saddle anesthesia, focal lower extremity weakness, fevers, chills, or unintentional weight loss. Her daughter accompanies the patient to the visit and confirms that balance has deteriorated mildly over the past six months, prompting the patient to utilize a single-point cane for prolonged ambulation.
   8| 
   9| PAST MEDICAL HISTORY:
  10| 1. Type 2 diabetes mellitus without acute complications, diagnosed in 2012.
  11| 2. Distal symmetric sensorimotor polyneuropathy.
  12| 3. Essential hypertension.
  13| 4. Hyperlipidemia.
  14| 5. History of right-sided Bell palsy in 2019, resolved.
  15| 6. Mild osteoarthritis of bilateral knees.
  16| 
  17| PAST SURGICAL HISTORY:
  18| 1. Laparoscopic cholecystectomy in 2015.
  19| 2. Right carpal tunnel release in 2017.
  20| 
  21| CURRENT MEDICATIONS:
  22| 1. Lyrica (pregabalin) 75 mg PO BID.
  23| 2. Metformin 1000 mg PO BID.
  24| 3. Glipizide 5 mg PO daily before breakfast.
  25| 4. Lisinopril 20 mg PO daily.
  26| 5. Atorvastatin 40 mg PO QHS.
  27| 6. Allegra (fexofenadine) 180 mg PO daily PRN seasonal allergies.
  28| 7. Prednisone 40/30/20/10 mg oral taper completed earlier this year for an inflammatory flare.
  29| 8. Acetaminophen 650 mg PO q8h PRN musculoskeletal pain.
  30| 
  31| ALLERGIES:
  32| Codeine (causes nausea and pruritus). No known food or environmental allergies.
  33| 
  34| REVIEW OF SYSTEMS:
  35| Constitutional: Negative for fever, diaphoresis, fatigue, or anorexia.
  36| Cardiovascular: Negative for chest pain, orthopnea, or paroxysmal nocturnal dyspnea.
  37| Respiratory: Negative for shortness of breath, chronic cough, or wheezing.
  38| Gastrointestinal: Negative for abdominal pain, nausea, vomiting, melena, or hematochezia.
  39| Musculoskeletal: Positive for bilateral knee stiffness; negative for joint erythema or effusion.
  40| Neurological: Positive for distal bilateral lower extremity numbness, tingling, and burning; negative for tremors, syncope, or focal motor weakness.
  41| 
  42| PHYSICAL EXAMINATION:
  43| Vitals: BP 134/82 mmHg, HR 72 bpm regular, RR 16 /min, SpO2 99% on room air, temperature 98.4 F (36.9 C), BMI 28.4 kg/m2.
  44| General: Well-nourished, comfortable, in no acute distress. Alert and oriented x 4.
  45| Cardiovascular: Regular rate and rhythm, normal S1 and S2, no murmurs, rubs, or gallops. Peripheral pulses (radial, dorsalis pedis, posterior tibial) 2+ bilaterally.
  46| Pulmonary: Lungs clear to auscultation bilaterally; no wheezes, rales, or rhonchi.
  47| Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds.
  48| Musculoskeletal: Normal range of motion in hips and knees. No joint swelling. Minimal crepitus noted on bilateral knee palpattion.
  49| Neurologic: Cranial nerves II-XII intact, with trace residual right facial asymmetry from remote Bell palsy. Motor strength 5/5 throughout upper and lower extremities bilaterally. Deep tendon reflexes 2+ at biceps and patellae bilaterally, 0 at Achilles tendons bilaterally. Sensory exam reveals symmetric decreased sensation to light touch and pinprick in a stocking distribution extending to mid-calf bilaterally. Vibratory sensation diminished at great toes bilaterally. Proprioception intact at the ankles. Gait is mildly antalgic but stable with cane. Romberg test is negative.
  50| Integumentary: Warm, dry, intact. No plantar ulcerations. Mild erythmatous patch over the anterior right tibia without induration or warmth.
  51| 
  52| DIAGNOSTIC DATA:
  53| Serum sodium 140 mEq/L, potassium 4.3 mEq/L, chloride 102 mEq/L, bicarbonate 24 mEq/L, BUN 18 mg/dL, serum creatinine 0.9 mg/dL, eGFR 78 mL/min/1.73m2, fasting glucose 142 mg/dL. Hemoglobin A1c 7.6%. Complete blood count: WBC 6.8 x10^3/uL, hemoglobin 13.4 g/dL, hematocrit 40.2%, platelets 245 x10^3/uL. Thyroid-stimulating hormone 2.1 mIU/L, vitamin B12 480 pg/mL, methylmalonic acid 0.18 umol/L (within normal limits).
  54| 
  55| ASSESSMENT AND PLAN:
  56| The patient is a 64-year-old female with longstanding type 2 diabetes mellitus presenting with symptomatic progressive diabetic peripheral neuropathy, asesssed as inadequately controlled on current regimen.
  57| 1. Neuropathic Pain:
  58| - Titrate Lyrica from 75 mg PO BID to 150 mg PO BID over the next two weeks. Advise patient regarding potential side effects including peripheral edema and somnolence.
  59| - Referral placed to Pain Clinic for multimodal pain assessment, physical therapy evaluation, and consideration of adjunctive topical compounded therapy.
  60| - Diabetic foot care education reinforced today, emphasizing daily self-inspection of feet and proper footwear.
  61| 2. Diabetes Mellitus:
  62| - Glycemic control suboptimal with HbA1c 7.6%. Referral initiated to Diabetes Center for specialized diabetic education and medical nutrition therapy.
  63| - Continue metformin 1000 mg PO BID and glipizide 5 mg PO daily.
  64| 3. Preventative & Follow-up:
  65| - Follow-up appointment scheduled in the clinic in 8 weeks to assess symptomatic response to dosage adjustment and review repeat renal profile.
  66| 
  67| Author: Clinical Attending Physician
  68| Department of Internal Medicine
  69| Cosigner: Supervising Staff Physician
=== END DOCUMENT ===
ITEMS FOR fd-0154:
D1 | line 5 | A: KEEP "7/10 on the visual analog scale" | B: KEEP "visual analog scale"
D2 | line 10 | A: KEEP "Type 2 diabetes mellitus without acute complications" | B: KEEP "Type 2 diabetes mellitus"
D3 | line 15 | A: KEEP "Mild osteoarthritis of bilateral knees" | B: KEEP "osteoarthritis"
D4 | line 19 | A: KEEP "Right carpal tunnel release" | B: KEEP "carpal tunnel release"
D5 | line 43 | A: KEEP "SpO2 99% on room air" | B: KEEP "SpO2 99%"
D6 | line 43 | A: KEEP "temperature 98.4 F (36.9 C)" | B: KEEP "temperature 98.4 F"
K1 | line 2 | KEEP "chronic bilateral lower extremity pain"
K2 | line 5 | KEEP "daytime sedation"
K3 | line 6 | KEEP "oral"
K4 | line 6 | KEEP "steroid"
K5 | line 24 | KEEP "before breakfast"
K6 | line 28 | KEEP "inflammatory flare"
K7 | line 29 | KEEP "musculoskeletal pain"
K8 | line 32 | KEEP "nausea"
K9 | line 32 | KEEP "pruritus"
K10 | line 35 | KEEP "Constitutional"
K11 | line 36 | KEEP "Cardiovascular"
K12 | line 37 | KEEP "Respiratory"
K13 | line 38 | KEEP "Gastrointestinal"
K14 | line 39 | KEEP "Musculoskeletal"
K15 | line 40 | KEEP "Neurological"
K16 | line 43 | KEEP "Vitals"
K17 | line 44 | KEEP "General"
K18 | line 44 | KEEP "oriented x 4"
K19 | line 45 | KEEP "Cardiovascular"
K20 | line 45 | KEEP "2+"
K21 | line 46 | KEEP "Pulmonary"
K22 | line 47 | KEEP "Abdomen"
K23 | line 48 | KEEP "Musculoskeletal"
K24 | line 49 | KEEP "Neurologic"
K25 | line 49 | KEEP "5/5"
K26 | line 49 | KEEP "2+"
K27 | line 49 | KEEP "Romberg test"
K28 | line 50 | KEEP "Integumentary"
K29 | line 53 | KEEP "Complete blood count"
K30 | line 58 | KEEP "peripheral edema"
K31 | line 58 | KEEP "somnolence"
K32 | line 59 | KEEP "multimodal pain assessment"
K33 | line 59 | KEEP "physical therapy evaluation"
K34 | line 60 | KEEP "Diabetic foot care"
K35 | line 60 | KEEP "daily"
K36 | line 62 | KEEP "diabetic education"
K37 | line 62 | KEEP "medical nutrition therapy"
K38 | line 64 | KEEP "Preventative & Follow-up"
K39 | line 65 | KEEP "renal profile"

=== DOCUMENT fd-0160 ===
   1| NURSE: Cinderleaf Pharmacy nurse line, this is Shirin Dalvand. Uh, how can I help you?
   2| CALLER: Hi, um, this is Hae-won Gwak. I'm calling about my mother-in-law, Ngọc Quỳnh An. She she missed the refill window and I want the blister pack to go out before the weekend.
   3| NURSE: Okay, let me pull An's chart. Can you confirm the date of birth?
   4| CALLER: She was born on August 19, 1933. The face sheet lists her as 92F. The health plan member number is 7741-3308-62.
   5| NURSE: Thank you. I have Ngọc Quỳnh An, born on August 19, 1933. Mara Hunt signed the last reconciliation on 18.02.2026. Parisa Dehghan, the covering pharmacist, left a note that the apixaban bottle was short.
   6| CALLER: That's why I'm calling. Hunt's instruction was apixaban 5 mg PO BID, but she only weighs 52 kilograms and her creatinine was 1.7 mg/dL, so I think the dose should be 2.5 mg PO BID. She also takes metoprolol succinate 25 mg PO daily, furosemide 20 mg PO every morning, and acetaminophen 650 mg PO q6h PRN for the knee. Cholecalciferol 1000 units PO daily is in the same pack. Please don't seperate the heart pills from the water pill.
   7| NURSE: Understood. Home address on file is 418 North Laurel Avenue, Harrow Bend, OR 97341. Is delivery still going there?
   8| CALLER: Send it to me. She texted the ship-to in lowercase, 22 cedar lane, harrow bend. My phone, if the driver gets lost, is +1 971 555 0164.
   9| NURSE: Reading that back. Delivery to 22 cedar lane, harrow bend, callback +1 971 555 0164. The follow-up Mara Hunt asked for is March fourth, twenty twenty-six, in the afternoon, for a blood pressure check and a basic metabolic panel. Last potassium was 3.4 mmol/L, a little low, so nobody should bump the furosemide untill those labs are back.
  10| CALLER: She gets dizzy when she stands. Last week at home the pressure was 98/60 mmHg and the heart rate was 58. I recieved a voicemail but the message cut off after a few seconds. There was a mechanical fall in the kitchen last month. No loss of consciousness, and she did not hit her head.
  11| NURSE: I see no head CT on the list. We will not send her for imaging from this call unless the dizziness changes. I'll flag the low pressure for Mara Hunt. An's weight is down two pounds since the winter visit. No chest pain, no melena, no new edema above the ankle. Diagnoses on the list are persistent atrial fibrillation, heart failure with preserved ejection fraction, stage 3 chronic kidney disease, and osteoarthritis of the right knee. If the systolic stays under 100 mmHg, hold the metoprolol and call us. Do not double the apixaban.
  12| CALLER: Parisa Dehghan told my husband the same thing, um, about the dose. Can you note that Hae-won Gwak is the caregiver who can pick up the pack? Ngọc Quỳnh An does not drive anymore.
  13| NURSE: Noted on An's chart. Parisa Dehghan will release the pack once the plan pays member number 7741-3308-62. If the claim bounces we will call her at the number you gave. The reconciliation date stays 18.02.2026. Anything else today?
  14| CALLER: No. Uh, actually, yes. Please ask Mara Hunt whether the acetaminophen is still okay with the kidney disease. She takes it most evenings.
  15| NURSE: I will send that question. We are not changing Hunt's acetaminophen 650 mg PO q6h PRN until she answers. Thank you for calling Cinderleaf Pharmacy.
  16| CALLER: Thank you. Bye.
=== END DOCUMENT ===
ITEMS FOR fd-0160:
D1 | line 6 | A: KEEP "52 kilograms" | B: KEEP "weighs 52 kilograms" [unsure]
D2 | line 11 | A: KEEP "100 mmHg" | B: KEEP "systolic stays under 100 mmHg" [unsure]

=== DOCUMENT fd-0165 ===
   1| MEDICATION RECONCILIATION AND PRIOR AUTHORIZATION
   2| 
   3| The covering pharmacist completed this review by telephone after a
   4| syncope admission. Records from Outside Hospital supplied the
   5| administration list and the discharge diagnoses. The patient is a
   6| 69-year-old man. His son brought every bottle from the house and stayed
   7| for the teaching.
   8| 
   9| Reason for review
  10| He was admitted after a brief loss of consciousness at home with prompt
  11| recovery. The Glasgow Coma Scale was 15 on arrival and stayed there.
  12| Telemetry showed atrial fibrillation with ventricular rates mostly under
  13| 100 and no prolonged pause. An echocardiogram showed a normal ejection
  14| fraction, no large effusion, and left atrial enlargement. Orthostatic
  15| vital signs were positive, and the working judgment was volume depletion
  16| plus rate-related lightheadedness rather than a primary neurologic
  17| event. He has Graves disease, diagnosed in 2018, still treated with an
  18| antithyroid drug, along with hypertension, type 2 diabetes mellitus,
  19| stage 3 chronic kidney disease, and gout. A shin ulcer has been open for
  20| months. Allopurinol has been on the list since 2020.
  21| 
  22| During the stay a gout flare began in the right great toe. Nonsteroidal
  23| anti-inflammatory drugs were avoided because of kidney disease and
  24| because he takes an anticoagulant. Colchicine was also held to avoid
  25| stacking interacting drugs. A short steroid taper was chosen instead.
  26| Cardiology will follow the syncope and the atrial fibrillation as a
  27| service. Wound Care will follow the ulcer.
  28| 
  29| Diagnoses relevant to dispensing
  30| Graves disease on antithyroid therapy.
  31| Atrial fibrillation, rate controlled.
  32| Hypertension.
  33| Type 2 diabetes mellitus.
  34| Chronic kidney disease, stage 3.
  35| Gout, recent flare.
  36| Venous stasis ulcer of the shin.
  37| Allergic rhinitis.
  38| 
  39| Allergies
  40| No drug allergy is recorded.
  41| 
  42| Current regimen
  43| methimazole 10 mg PO daily
  44| propranolol 20 mg PO TID with meals
  45| apixaban 5 mg PO BID with breakfast and supper
  46| metformin 500 mg PO BID with meals
  47| empagliflozin 10 mg PO every morning
  48| lisinopril 10 mg PO daily
  49| atorvastatin 20 mg PO at bedtime
  50| allopurinol 100 mg PO daily
  51| prednisone 40/30/20/10 mg PO every morning with food, four days at
  52| each step, then stop
  53| Allegra 180 mg PO daily for rhinitis, generic fexofenadine acceptable
  54| acetaminophen 650 mg PO q6h PRN pain, maximum 3 g in a day
  55| cholecalciferol 1000 units PO daily
  56| 
  57| Prednisone will be dispensed as 10 mg tablets: four tablets, then
  58| three, then two, then one, each for four days. That matches the
  59| 40/30/20/10 mg taper and totals forty tablets. He should not stretch
  60| the course because the toe feels better early.
  61| 
  62| Apixaban stays at 5 mg rather than 2.5 mg. Dose-reduction criteria that
  63| combine advanced age with kidney function are not met, and body weight
  64| is above 60 kg. Do not add aspirin for the arrhythmia. If a dose of
  65| apixaban is missed, he should not double the next one.
  66| 
  67| Brand Allegra was requested on an old bottle. The son agreed to generic
  68| fexofenadine at the same dose and schedule, which avoids a needless
  69| prior authorization.
  70| 
  71| The ulcer is cleaned with saline and covered with a nonadherent foam
  72| under compression arranged by Wound Care. No topical antibiotic was
  73| added. Debridement of loose fibrin was done during the admission and is
  74| the procedure of record. An ankle-brachial index before compression was
  75| adequate, so compression stays appropriate.
  76| 
  77| Vitals at the clinic recheck, seated then standing
  78| Seated blood pressure 138/82 mmHg, heart rate 76 beats per minute.
  79| Standing blood pressure 116/74 mmHg, heart rate 92 beats per minute.
  80| Temperature 36.6 C. Respiratory rate 14 breaths per minute. Oxygen
  81| saturation 97 percent on room air. Weight 78 kg.
  82| 
  83| Laboratory results used for renal and thyroid decisions
  84| Sodium 136 mmol/L. Potassium 4.3 mmol/L. Chloride 101 mmol/L.
  85| Bicarbonate 24 mmol/L. Creatinine 1.3 mg/dL.
  86| eGFR 52 mL/min/1.73 m2.
  87| Fasting glucose 128 mg/dL. Hemoglobin A1c 7.1 percent.
  88| Hemoglobin 13.4 g/dL. Platelets 228 K/uL. WBC 6.9 K/uL.
  89| TSH 1.6 mIU/L. Free T4 1.2 ng/dL.
  90| Urate 7.1 mg/dL, not a reason to raise allopurinol during
  91| an acute flare.
  92| 
  93| Counseling and monitoring
  94| Hold empagliflozin and metformin on days he cannot eat or drink, then
  95| restart when intake is normal, to limit ketoacidosis and lactic
  96| acidosis. Hold lisinopril if vomiting persists. He should rise slowly
  97| and sit before walking because the standing pressure drops. On
  98| methimazole, fever, sore throat, or mouth ulcers need a same-day call
  99| because of agranulocytosis. Propranolol should not be stopped abruptly.
 100| Keep a steady apixaban schedule and avoid naproxen, ibuprofen, and
 101| aspirin. Allopurinol continues through the flare at the current dose
 102| and is not increased now. Acetaminophen is the analgesic for the toe
 103| and for ulcer pain. Prednisone will raise glucose, so fingerstick
 104| checks increase until the taper ends. The clinic should hear about
 105| repeated readings above 250 mg/dL. Fexofenadine is preferred to
 106| diphenhydramine, which would add fall risk. The son repeated the taper
 107| counts correctly. A thirty-day supply of the chronic medicines was
 108| prepared, with prednisone limited to forty tablets. No colchicine and
 109| no nonsteroidal drug were dispensed.
=== END DOCUMENT ===
ITEMS FOR fd-0165:
D1 | line 11 | A: KEEP "Glasgow Coma Scale was 15" | B: KEEP "Glasgow Coma Scale"
D2 | line 22 | A: KEEP "gout flare" | B: KEEP "gout"
D3 | line 31 | A: KEEP "Atrial fibrillation, rate controlled" | B: KEEP "Atrial fibrillation"
D4 | line 35 | A: KEEP "Gout, recent flare" | B: KEEP "Gout"
D5 | line 36 | A: KEEP "Venous stasis ulcer of the shin" | B: KEEP "Venous stasis ulcer"
D6 | line 54 | A: KEEP "q6h" ; KEEP "PRN" | B: KEEP "q6h PRN"
D7 | line 80 | A: KEEP "Oxygen\nsaturation 97 percent on room air" | B: KEEP "Oxygen\nsaturation 97 percent"
K1 | line 4 | KEEP "syncope"
K2 | line 9 | KEEP "Reason for review"
K3 | line 15 | KEEP "volume depletion"
K4 | line 19 | KEEP "shin ulcer"
K5 | line 23 | KEEP "kidney disease"
K6 | line 26 | KEEP "syncope"
K7 | line 27 | KEEP "ulcer"
K8 | line 63 | KEEP "body weight\nis above 60 kg"
K9 | line 71 | KEEP "ulcer"
K10 | line 71 | KEEP "saline"
K11 | line 72 | KEEP "topical"
K12 | line 103 | KEEP "ulcer"

=== DOCUMENT fd-0171 ===
   1| Lantern Annex Laboratory
   2| Gastrointestinal Pathology
   3| 
   4| Patient: de la Varenne, Élodie
   5| DOB: May 12, 1978
   6| Age: 47 years
   7| MRN: 8834217
   8| Accession: GI-26-19028
   9| Group no.: 44128
  10| Specimen: colon biopsies, surveillance
  11| Collected: 04.03.2026
  12| Ordering: Dr. Stanley Yarrow
  13| Phone: +44 20 7946 0144
  14| Address: 55 Harbor Lantern Road, Apt 4B, West Alder, OR 97381
  15| Brother: Mr. Gordon Phelps
  16| 
  17| CLINICAL HISTORY
  18| 47-year-old woman with ulcerative colitis diagnosed in adulthood, on
  19| surveillance colonoscopy. Eight biopsies were taken from the cecum to
  20| the rectum. She reports two formed stools a day and no nocturnal
  21| waking. Her brother, Mr. Gordon Phelps, is the contact if results
  22| need to be discussed, because she is traveling the week after the
  23| procedure. Élodie de la Varenne's prior biopsies, described in the
  24| request, showed chronic colitis without dysplasia.
  25| 
  26| The medicine list on the requisition reads mesalamine DR 1.2 g PO TID
  27| and prednisone 20 mg PO daily, the latter started for a flare last
  28| season and still being tapered by her clinician. She also takes
  29| ondansetron 4 mg PO q8h PRN nausea around the bowel prep. No biologic
  30| is listed.
  31| 
  32| GROSS
  33| Received in formalin are eight specimens in separate jars, each a
  34| fragment of tan mucosa, 0.3 to 0.5 cm. They are submitted entirely,
  35| one cassette per jar, after filtration.
  36| 
  37| MICROSCOPIC
  38| All eight sites show distorted crypt architecture, basal plasmacytosis,
  39| and crypt shortening, in keeping with chronic colitis. The inflamation
  40| is mild and patchy, with cryptitis in the sigmoid and rectal samples
  41| and little activity in the right colon. No granulomas are seen. No
  42| dysplasia and no carcinoma are identified in the tissue examined. The
  43| findings are consistant with quiescent to mildly active chronic
  44| ulcerative colitis. A seperate comment on the requisition asks that
  45| dysplasia be excluded, and it is excluded here.
  46| 
  47| The right-colon samples show Paneth cell metaplasia distal to the point
  48| where those cells are normally expected, which supports chronicity.
  49| Mucin preservation is good. No viral cytopathic effect is present.
  50| 
  51| DIAGNOSIS
  52| Colon, cecum through rectum, biopsies: chronic colitis, mildly active
  53| in the distal samples, inactive in the proximal samples. Negative for
  54| dysplasia and negative for carcinoma.
  55| 
  56| The degree of activity fits a patient who has improved on steroids but
  57| is not fully healed. Correlation with the endoscopic score, which was
  58| not included on this requisition, is suggested. Results may be
  59| telephoned to the number in the header.
  60| 
  61| COMMENT
  62| The chronic changes are present in every jar, so this is read as
  63| extensive rather than limited colitis. Activity, scored simply as
  64| cryptitis without crypt abscesses, is confined to the two most distal
  65| jars. That pattern often tracks the endoscopic appearance, although
  66| no score was written on the bottle labels.
  67| 
  68| A cytomegalovirus immunostain was reviewed on the rectal block and is
  69| negative, which matters because she is still on daily prednisone. No
  70| amoeba, no granuloma, and no basal giant cells are seen. The tissue
  71| is well oriented on most levels. One cecal fragment is superficial and
  72| includes only the upper half of the mucosa, so a deep basal
  73| lymphoplasmacytic band cannot be judged in that single jar; the other
  74| seven jars do show the band.
  75| 
  76| These findings can be discussed with the patient at the address and
  77| phone already printed above. No amended diagnosis is anticipated unless
  78| new levels, which were not needed, are cut later.
  79| 
  80| Interpreted by Dr. Margaret Ashcombe, gastrointestinal pathology.
  81| End of report.
=== END DOCUMENT ===
ITEMS FOR fd-0171:
D1 | line 43 | A: KEEP "quiescent to mildly active chronic\nulcerative colitis" | B: KEEP "ulcerative colitis"
D2 | line 63 | A: KEEP "limited colitis" | B: KEEP "colitis"
K1 | line 10 | KEEP "colon biopsies"
K2 | line 19 | KEEP "biopsies"
K3 | line 23 | KEEP "biopsies"
K4 | line 29 | KEEP "bowel prep"
K5 | line 38 | KEEP "distorted crypt architecture"
K6 | line 38 | KEEP "basal plasmacytosis"
K7 | line 39 | KEEP "crypt shortening"
K8 | line 40 | KEEP "cryptitis"
K9 | line 41 | KEEP "granulomas"
K10 | line 47 | KEEP "Paneth cell metaplasia"
K11 | line 49 | KEEP "viral cytopathic effect"
K12 | line 52 | KEEP "biopsies"
K13 | line 57 | KEEP "endoscopic score" [labeler unsure]
K14 | line 64 | KEEP "cryptitis"
K15 | line 64 | KEEP "crypt abscesses"
K16 | line 68 | KEEP "cytomegalovirus immunostain"
K17 | line 70 | KEEP "amoeba"
K18 | line 70 | KEEP "granuloma"
K19 | line 70 | KEEP "basal giant cells"

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
ITEMS FOR fd-0178:
D1 | line 20 | A: KEEP "Colonoscopy" ; KEEP "polypectomy" | B: KEEP "Colonoscopy with polypectomy"
K1 | line 12 | KEEP "2.0 to 3.0"
K2 | line 12 | KEEP "3.4"
K3 | line 12 | KEEP "daily"
K4 | line 12 | KEEP "three quarters"
K5 | line 13 | KEEP "a day"
K6 | line 16 | KEEP "each evening"
K7 | line 16 | KEEP "INR"
K8 | line 19 | KEEP "x-ray"
K9 | line 20 | KEEP "polyps"
K10 | line 20 | KEEP "3.0"

=== DOCUMENT fd-0192 ===
   1| 74019284
   2| Date of Service: 04.03.2026
   3| PATIENT: Yaroslav Wozniak
   4| DOB: 12.08.1933
   5| Demographics: 92M
   6| Account Number: AC-9938120
   7| ADDRESS: 842 NORTH HAMPTON ROAD, APT 4D, OAK BROOK, IL 60523
   8| Phone: (312) 555-0184
   9| Facility: Highland Creek Care Center
  10| Attending Physician: Arthur Campbell, MD
  11| Contact Email: arthur.campbell@example.org
  12| 
  13| CLINICAL COMPREHENSIVE PROGRESS AND REHABILITATION ASSESSMENT
  14| 
  15| CHIEF COMPLAINT AND REASON FOR ENCOUNTER:
  16| Evaluation of rehabilitation progress following acute hospitalization for subcapital femoral neck fracture, management of underlying cognitive decline, monitoring of obstructive sleep apnea therapy, and discharge planning.
  17| 
  18| HISTORY OF PRESENT ILLNESS:
  19| Mr. Yaroslav Wozniak is a 92M retired metallurgical engineer who was admitted to Highland Creek Care Center on 18 Oct 2025 following an acute inpatient stay for an operative right hemiarthroplasty secondary to a mechanical fall at home. He currently lives in Oak Brook with his adult daughter, Mrs. Clara Cross, who serves as his primary caregiver and medical power of attorney. On the morning of today's evaluation, 04.03.2026, the patient was transported from the physical therapy suite via specialized medical wheelchair van, transport license plate 7XYZ912, for this comprehensive monthly interdisciplinary re-assessment.
  20| 
  21| According to his daughter, Mrs. Clara Cross, who was contacted by telephone at (312) 555-0119 ext. 204 and via email at clara.cross@example.net, Mr. Wozniak has demonstrated steady, albeit slow, improvement in transfer capabilities and standing tolerance over the past month. However, Mrs. Cross noted intermittent periods of sundowning and nocturnal disorientation, particularly when awakening during the night. The patient utilizes a home CPAP machine nightly for severe obstructive sleep apnea; interrogation of his Respironics DreamStation device, serial number CP-9082341, demonstrates an average nightly usage of 5.8 hours over the preceding thirty consecutive days, with an 90th-percentile pressure of 11.2 cmH2O and a residual apnea-hypopnea index of 3.4 events per hour, confirming therapeutic adherence and efficacy.
  22| 
  23| He denies active localized pain in the right hip, chest pressure, palpitations, dyspnea at rest, fevers, chills, or acute gastrointestinal distress. He reports occasional chronic bilateral knee aching rated 2/10, managed adequately with scheduled topical therapy. Review of his inpatient chart reveals that a formal geriatric psychiatry consultation was completed earlier this week on Mar 4 2026 by Dr. Andrew van der Beek, who recommended maintaining low-dose nighttime melatonin and continuing structured daytime orientation prompts while strictly avoiding sedating antihistamines or benzodiazepines.
  24| 
  25| PAST MEDICAL HISTORY:
  26| 1. Right subcapital femoral neck fracture status post right hip hemiarthroplasty (October 2025).
  27| 2. Vascular dementia with mild behavioral disturbance.
  28| 3. Obstructive sleep apnea, adherent to CPAP therapy.
  29| 4. Essential hypertension, well controlled.
  30| 5. Hyperlipidemia.
  31| 6. Stage 3 chronic kidney disease (baseline creatinine 1.4 to 1.6 mg/dL).
  32| 7. Benign prostatic hyperplasia with mild lower urinary tract symptoms.
  33| 8. History of deep venous thrombosis in 2021, completed therapeutic course.
  34| 
  35| PAST SURGICAL HISTORY:
  36| 1. Right hip hemiarthroplasty (October 2025).
  37| 2. Transurethral resection of the prostate (2018).
  38| 3. Bilateral cataract extraction with intraocular lens implantation (2014, 2016).
  39| 
  40| CURRENT MEDICATIONS:
  41| 1. Lisinopril 10 mg PO daily.
  42| 2. Amlodipine 5 mg PO daily.
  43| 3. Atorvastatin 20 mg PO at bedtime.
  44| 4. Tamsulosin 0.4 mg PO daily at bedtime.
  45| 5. Donepezil 10 mg PO daily at bedtime.
  46| 6. Melatonin 3 mg PO nightly at 21:00.
  47| 7. Acetaminophen 650 mg PO TID PRN joint pain.
  48| 8. Diclofenac 1% topical gel, 2 grams applied to bilateral knees TID PRN.
  49| 9. Polyethylene glycol 17 g PO daily in water for constipation prophylaxis.
  50| 10. Ergocalciferol (Vitamin D2) 50,000 units PO once weekly.
  51| 
  52| REVIEW OF SYSTEMS:
  53| Constitutional: No fevers, diaphoresis, rigors, or unassisted weight changes.
  54| HEENT: Vision corrected with lenses. Hearing mildly impaired bilaterally; wears hearing aids. No dysphagia.
  55| Cardiovascular: No chest tightness, peripheral edema, or orthopnea.
  56| Respiratory: No cough, sputum production, wheezing, or shortness of breath.
  57| Gastrointestinal: Appetite good. Bowel movements regular every 1 to 2 days without straining.
  58| Genitourinary: Nocturia x 1-2. No dysuria, gross hematuria, or acute urinary retention.
  59| Musculoskeletal: Right hip incision healed without pain on passive mobilization. Mild crepitus in bilateral knees.
  60| Neurologic: Mild baseline expressive word-finding difficulty; no focal motor deficits, seizures, or tremors.
  61| Psychiatric: Mild nocturnal confusion noted by staff; no visual hallucinations or aggressive behaviors.
  62| 
  63| PHYSICAL EXAMINATION:
  64| Vital Signs: Blood pressure 126/74 mmHg, pulse 68 bpm regular, respiratory rate 16 breaths/min, temperature 98.2 F (36.8 C), oxygen saturation 98% on room air.
  65| General: Frail elderly male, resting comfortably in a high-back wheelchair with footrests, well-groomed, pleasant, in no acute distress.
  66| Cognition: Alert. Oriented to person and partially to place (identifies facility as a recovery hospital); disoriented to exact date, estimating the year correctly. Montreal Cognitive Assessment (MoCA) completed last week scored 18/30.
  67| HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to light. Oropharynx clear with moist mucous membranes. Dentition intact with well-fitting lower partial denture.
  68| Cardiovascular: Regular rhythm, normal S1 and S2. Soft 1/6 systolic ejection murmur heard best at the right upper sternal border, non-radiating. No peripheral edema of the lower extremities. Radial and dorsalis pedis pulses 2+ bilaterally.
  69| Pulmonary: Lungs clear to auscultation bilaterally in anterior and posterior lung fields. Good air movement. No wheezing, rales, or rhonchi.
  70| Abdomen: Soft, non-tender, non-distended. Normal active bowel sounds present in all four quadrants. No organomegaly or palpable masses.
  71| Musculoskeletal / Surgical Site: Well-healed 12 cm linear surgical scar along the right lateral hip without erythema, warmth, dehiscence, or purulence. Range of motion of right hip reveals flexion to 95 degrees, abduction to 25 degrees, with no pain elicited on internal or external rotation. Upper extremity strength 5/5 bilaterally. Lower extremity strength 4+/5 on right hip flexion and knee extension, 5/5 on the left.
  72| Neurologic: Cranial nerves II through XII grossly intact. Deep tendon reflexes 1+ symmetrically at biceps, triceps, and patellae. Plantar reflexes flexor bilaterally. Sensation to light touch intact across all four extremities.
  73| Skin: Skin turgor normal for age. No sacral, trochanteric, or calcaneal pressure injuries. Mild senile purpura on bilateral dorsal forearms.
  74| 
  75| FUNCTIONAL MOBILITY AND THERAPY SUMMARY:
  76| Review of physical and occupational therapy progress notes indicates Mr. Wozniak has achieved modified independence for bed mobility and transfers from sit-to-stand with standby assistance of one person. He ambulates up to 150 feet utilizing a front-wheeled walker with contact guard assistance. Activities of daily living (upper body dressing and hygiene) are performed with minimal assistance; lower body dressing requires moderate assistance due to hip precautions.
  77| 
  78| LABORATORY VALUES (Collected 03.03.2026):
  79| Serum sodium 139 mEq/L, potassium 4.2 mEq/L, chloride 103 mEq/L, bicarbonate 25 mEq/L, blood urea nitrogen 22 mg/dL, serum creatinine 1.4 mg/dL (estimated GFR 49 mL/min/1.73m2, baseline), glucose 96 mg/dL. Complete blood count: white blood cell count 6.2 x10^3/uL, hemoglobin 12.1 g/dL, hematocrit 36.8%, platelet count 210 x10^3/uL. Urinalysis negative for nitrites, leukocyte esterase, or bacteria.
  80| 
  81| ASSESSMENT AND CLINICAL IMPRESSION:
  82| Yaroslav Wozniak is a 92M who is making satisfactory functional recovery following surgical repair of a right subcapital femoral neck fracture, with stable comorbid vascular dementia and obstructive sleep apnea.
  83| 1. Right Hip Arthroplasty Rehabilitation:
  84| - Surgical wound is fully healed. Functional ambulation progressing appropriately with walker. Continue skilled physical therapy 5 days per week targeting endurance and balance.
  85| - Maintain weight-bearing as tolerated with standard posterior hip precautions through the end of the month.
  86| 2. Vascular Dementia and Sundowning:
  87| - Continue donepezil 10 mg PO at bedtime.
  88| - Non-pharmacologic interventions prioritized: sleep hygiene, routine daytime ambulation, natural lighting exposure in morning, calming environment at dusk. Continue melatonin 3 mg PO at 21:00. Dr. van der Beek to re-evaluate in four weeks.
  89| 3. Obstructive Sleep Apnea:
  90| - Stable on CPAP device CP-9082341 at 11 cmH2O pressure. Continue current settings.
  91| 4. Hypertension and Cardiovascular Risk:
  92| - Well controlled on lisinopril and amlodipine. Continue current dosing.
  93| 5. Chronic Kidney Disease:
  94| - Stable renal function with creatinine 1.4 mg/dL. Avoid nephrotoxic agents including systemic nonsteroidal anti-inflammatory drugs.
  95| 6. Discharge Planning:
  96| - Target discharge to his home in Oak Brook under the care of Mrs. Cross anticipated within three weeks. Home health physical therapy and occupational therapy referrals to be finalized prior to transition. Case management will arrange delivery of shower chair, raised toilet seat, and home CPAP supplies.
  97| 
  98| Provider Signature:
  99| Arthur Campbell, MD
 100| Attending Geriatric Physician, Highland Creek Care Center
 101| Supervising Physician Cosignature:
 102| P.J. Abernathy, MD
=== END DOCUMENT ===
ITEMS FOR fd-0192:
D1 | line 21 | A: KEEP "severe obstructive sleep apnea" | B: KEEP "obstructive sleep apnea"
D2 | line 21 | A: KEEP "90th-percentile pressure of 11.2 cmH2O" | B: KEEP "11.2 cmH2O"
D3 | line 31 | A: KEEP "baseline creatinine 1.4 to 1.6 mg/dL" | B: KEEP "creatinine 1.4 to 1.6 mg/dL"
D4 | line 32 | A: KEEP "Benign prostatic hyperplasia with mild lower urinary tract symptoms" | B: KEEP "Benign prostatic hyperplasia"
D5 | line 50 | A: KEEP "Ergocalciferol (Vitamin D2)" | B: KEEP "Ergocalciferol" ; KEEP "Vitamin D2"
D6 | line 64 | A: KEEP "temperature 98.2 F (36.8 C)" | B: KEEP "temperature 98.2 F"
D7 | line 64 | A: KEEP "oxygen saturation 98% on room air" | B: KEEP "oxygen saturation 98%"
D8 | line 83 | A: KEEP "Right Hip Arthroplasty Rehabilitation" | B: KEEP "Right Hip Arthroplasty"
D9 | line 86 | A: KEEP "Vascular Dementia and Sundowning" | B: KEEP "Vascular Dementia" ; KEEP "Sundowning"
D10 | line 90 | A: KEEP "11 cmH2O pressure" | B: KEEP "11 cmH2O"
D11 | line 91 | A: KEEP "Hypertension and Cardiovascular Risk" | B: KEEP "Hypertension"
K1 | line 13 | KEEP "CLINICAL COMPREHENSIVE PROGRESS AND REHABILITATION ASSESSMENT"
K2 | line 21 | KEEP "nocturnal disorientation"
K3 | line 21 | KEEP "CPAP"
K4 | line 21 | KEEP "nightly"
K5 | line 21 | KEEP "Respironics DreamStation"
K6 | line 21 | KEEP "average nightly usage of 5.8 hours"
K7 | line 21 | KEEP "residual apnea-hypopnea index of 3.4 events per hour"
K8 | line 23 | KEEP "2/10"
K9 | line 23 | KEEP "geriatric psychiatry"
K10 | line 23 | KEEP "nighttime"
K11 | line 28 | KEEP "CPAP"
K12 | line 46 | KEEP "Melatonin"
K13 | line 48 | KEEP "1%"
K14 | line 49 | KEEP "constipation"
K15 | line 53 | KEEP "Constitutional"
K16 | line 54 | KEEP "HEENT"
K17 | line 55 | KEEP "Cardiovascular"
K18 | line 56 | KEEP "Respiratory"
K19 | line 57 | KEEP "Gastrointestinal"
K20 | line 58 | KEEP "Genitourinary"
K21 | line 59 | KEEP "Musculoskeletal"
K22 | line 60 | KEEP "Neurologic"
K23 | line 61 | KEEP "Psychiatric"
K24 | line 64 | KEEP "Vital Signs"
K25 | line 65 | KEEP "General"
K26 | line 66 | KEEP "Cognition"
K27 | line 66 | KEEP "18/30"
K28 | line 67 | KEEP "HEENT"
K29 | line 68 | KEEP "Cardiovascular"
K30 | line 68 | KEEP "S1 and S2"
K31 | line 68 | KEEP "1/6 systolic ejection murmur"
K32 | line 68 | KEEP "Radial and dorsalis pedis pulses 2+"
K33 | line 69 | KEEP "Pulmonary"
K34 | line 70 | KEEP "Abdomen"
K35 | line 71 | KEEP "Musculoskeletal / Surgical Site"
K36 | line 71 | KEEP "flexion to 95 degrees"
K37 | line 71 | KEEP "abduction to 25 degrees"
K38 | line 71 | KEEP "Upper extremity strength 5/5"
K39 | line 71 | KEEP "Lower extremity strength 4+/5 on right hip flexion and knee extension, 5/5 on the left"
K40 | line 72 | KEEP "Neurologic"
K41 | line 72 | KEEP "Cranial nerves II through XII"
K42 | line 72 | KEEP "Deep tendon reflexes 1+"
K43 | line 72 | KEEP "Plantar reflexes flexor"
K44 | line 73 | KEEP "Skin"
K45 | line 76 | KEEP "physical and occupational therapy"
K46 | line 79 | KEEP "Complete blood count"
K47 | line 79 | KEEP "Urinalysis negative for nitrites, leukocyte esterase, or bacteria"
K48 | line 84 | KEEP "skilled physical therapy"
K49 | line 84 | KEEP "5 days per week"
K50 | line 85 | KEEP "weight-bearing as tolerated"
K51 | line 85 | KEEP "posterior hip precautions"
K52 | line 90 | KEEP "CPAP"
K53 | line 94 | KEEP "systemic"
K54 | line 95 | KEEP "Discharge Planning"
K55 | line 96 | KEEP "Home health physical therapy"
K56 | line 96 | KEEP "occupational therapy"
K57 | line 96 | KEEP "CPAP"

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
ITEMS FOR fd-0193:
K1 | line 5 | KEEP "Cytology"
K2 | line 5 | KEEP "TSH" [labeler unsure]
K3 | line 5 | KEEP "free T4" [labeler unsure]
K4 | line 7 | KEEP "heart rate stays under 55" [labeler unsure]
K5 | line 8 | KEEP "palpitations" [labeler unsure]
K6 | line 8 | KEEP "2.4 centimeter right lobe nodule"
K7 | line 9 | KEEP "2.4 centimeters"
K8 | line 9 | KEEP "cytology stays benign"
K9 | line 9 | KEEP "liver enzymes were normal"
K10 | line 9 | KEEP "TSH" [labeler unsure]
K11 | line 9 | KEEP "free T4" [labeler unsure]
K12 | line 16 | KEEP "thirty tablets" [labeler unsure]
K13 | line 20 | KEEP "beta blockers" [labeler unsure]

=== DOCUMENT fd-0195 ===
   1| NURSE: Halebourne Memorial Hospital nurse line, this is Nola
   2| Pruitt. Uh, am I talking with the husband?
   3| CALLER: Yes. Joaquín Peña Ríos. I am calling about my wife,
   4| Jasleen Zaveri. The prep sheet has me worried and I keep
   5| reading it wrong.
   6| NURSE: Okay. MRN: 3309812. I see Jasleen Zaveri, 57 years old,
   7| on the gastroenterology list for Dr. King. Willa King signs
   8| the letter as W.R.K. The colonoscopy is 03-04-2026. The
   9| low-residue days run 03/01/2026 to 03/05/2026, so the
  10| procedure sits inside that range.
  11| CALLER: She started seeing blood on the 4th of July. It was
  12| on the paper, not mixed in, and then it kept happening.
  13| They told us internal hemorrhoids at first, then they wanted
  14| a colonoscopy with snare polypectomy if they find anything.
  15| Her mother had colon cancer, which is the other reason Dr.
  16| King would not delay. I don't have those records in the
  17| house.
  18| NURSE: Family history is already on the referral. We do not
  19| need the outside records for this date. Diagnoses on the
  20| referral are rectal bleeding, iron deficiency anemia, and
  21| type 2 diabetes mellitus. Procedures planned are a
  22| colonoscopy and a possible snare polypectomy. Upper
  23| endoscopy is not on this order. Ferrous sulfate 325 mg PO
  24| daily, metformin 500 mg PO BID, and pantoprazole 40 mg PO
  25| daily are the home meds I show. Hold the iron for five days
  26| before the procedure so it does not stain the view. Keep the
  27| metformin off the morning of the procedure. Last labs I will
  28| read so you have them. Hemoglobin 10.2 g/dL, ferritin 8
  29| ng/mL, creatinine 0.7 mg/dL, and A1c 7.1 percent. Blood
  30| pressure at the clinic was 134/78 mmHg, heart rate 82. The
  31| anemia is why we are not waiting a year for a screening
  32| slot. This is a diagnostic colonoscopy.
  33| CALLER: She was told the polyp, if there is one, comes out
  34| during the same procedure. No separate surgery. I have the
  35| day off. The account number on the estimate is 2291844736.
  36| I don't know if you need it. Her phone, if you call her and
  37| not me, is 503-555-0183. She said it out loud to the desk as
  38| five zero three, five five five, zero one eight three,
  39| because the clerk would not take the card.
  40| NURSE: I have 503-555-0183 and account number 2291844736.
  41| Email on the portal invite is jpenarios@example.com. That
  42| goes to you, the husband, not to her. She lives in
  43| Marrowgate. The prep text she forwarded is all lowercase,
  44| 19 willow bend road, no apartment.
  45| CALLER: Yes. 19 willow bend road. We don't have a unit
  46| number. Um, she is 57, I am 60, and I will be the driver.
  47| She can not take a cab home after sedation.
  48| NURSE: Driver has to be Joaquín Peña Ríos or another adult
  49| she names. I need to tell you I opened the wrong chart a
  50| minute ago. I clicked May Epstein. That chart has an old
  51| Epstein-Barr virus serology in it. May Epstein is a
  52| different patient. The virus note is not your wife's, and
  53| the surname is a coincidence. Jasleen Zaveri was never
  54| tested for Epstein-Barr virus. I closed that chart. MRN:
  55| 3309812 is the one I am reading now.
  56| CALLER: You scared me for a second. So May Epstein is not
  57| in our family. Good. Does Dr. King still want the diabetes
  58| medicines written on the front of the prep sheet?
  59| NURSE: Yes. Dr. King, W.R.K. on the signature line, wants
  60| metformin held only on the morning of 03-04-2026. Restart
  61| it the next evening if she is eating. Pantoprazole 40 mg PO
  62| daily can continue. Do not take ibuprofen. Acetaminophen
  63| 650 mg PO q6h PRN is the pain plan if she has cramps after
  64| a polypectomy. Call for bleeding that fills a cup, fever,
  65| or severe belly pain. The range 03/01/2026 to 03/05/2026
  66| is diet and bowel prep, not a hospital stay.
  67| CALLER: The 4th of July bleeding is what got us here, and I
  68| don't want to miss the 03-04-2026 date. If the ride falls
  69| through I will call this line. You can reach me at
  70| 503-555-0183 or jpenarios@example.com.
  71| NURSE: Noted. Halebourne Memorial Hospital will see Jasleen
  72| Zaveri on 03-04-2026. Bring the account number 2291844736
  73| and the photo card. Ask for Dr. King's list at the desk,
  74| not for May Epstein. I, I think that covers it.
  75| CALLER: Thank you. I will tell my wife.
=== END DOCUMENT ===
ITEMS FOR fd-0195:
D1 | line 29 | A: KEEP "Blood\npressure at the clinic was 134/78 mmHg" [unsure] | B: KEEP "134/78 mmHg" [unsure]
D2 | line 32 | A: KEEP "diagnostic colonoscopy" | B: KEEP "colonoscopy"
K1 | line 47 | KEEP "sedation"
K2 | line 66 | KEEP "bowel prep"

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
ITEMS FOR fd-0202:
D1 | line 12 | A: KEEP "chronic nonvalvular atrial\nfibrillation" | B: KEEP "atrial\nfibrillation"
D2 | line 16 | A: KEEP "severe coagulopathy" | B: KEEP "coagulopathy"
D3 | line 16 | A: KEEP "gross\nhematuria" | B: KEEP "hematuria"
D4 | line 19 | A: KEEP "stage 3 chronic\nkidney disease" | B: KEEP "chronic\nkidney disease"
K1 | line 17 | KEEP "INR values between 1.2 and 5.1"
K2 | line 21 | KEEP "serum creatinine is 1.24 mg/dL"

Now output the result blocks.