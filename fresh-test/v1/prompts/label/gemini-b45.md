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

Now output the label blocks, one per document, in the order shown.