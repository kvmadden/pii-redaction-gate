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


=== DOCUMENT fd-0164 ===
   1| BRIAR PATH MEDICINE
   2| Outpatient Progress Note
   3| 
   4| Patient: Chukwu, Chiamaka
   5| Date of Service: April 2, 2026
   6| Member number MB620184475
   7| 
   8| Chief complaint
   9| Neck pain and headache after a rear-end collision.
  10| 
  11| History of present illness
  12| She was a front-seat passenger when another car struck the
  13| rear bumper at a light.
  14| Symptoms ran March 9 through March 13, 2026, eased for a
  15| short stretch, and then returned once she was back at a
  16| keyboard for full days. Pain is 5 out of 10, worse when
  17| she turns to the left. She has no arm numbness, no
  18| weakness, and no change in bladder or bowel habits. She
  19| denies vision loss, vomiting, chest pain, and fever. A
  20| seat belt was worn and no airbag deployed. The other
  21| vehicle would not start and was towed from the lane. She
  22| kept the plate she saw, 4GK1928, in her phone notes. Her
  23| husband Stelios Markakis has done the driving since the
  24| crash. She lives in Tesserville, and his job is in the
  25| same town, so most trips are a few minutes.
  26| 
  27| Ibuprofen 400 mg by mouth three times daily with food has
  28| taken the edge off, though it bothers her stomach if
  29| lunch is skipped. She takes no blood thinner and has
  30| never had neck surgery.
  31| 
  32| Examination
  33| Blood pressure 128/74 mmHg, pulse 76 beats per minute,
  34| temperature 98.1 F. She is alert and in no distress.
  35| There is no midline cervical bony tenderness. Rotation
  36| is limited turning left and nearly full turning right.
  37| Spurling test is negative on both sides. Arm strength is
  38| 5 out of 5. Gait is steady, and she can heel walk and
  39| toe walk without pain down the leg.
  40| 
  41| Assessment and plan
  42| Cervical strain after a rear-end collision, with a flare
  43| as typing resumed. Exam shows no myelopathy and no
  44| radicular deficit, so imaging is deferred unless pain is
  45| still limiting her after two further weeks or new
  46| weakness shows up. Stop ibuprofen. Use acetaminophen 500
  47| mg by mouth three times daily for ten days, then as
  48| needed. Methocarbamol 500 mg by mouth at bedtime may be
  49| used for up to seven nights for spasm. She recieved a
  50| one-page exercise sheet for chin tucks and shoulder blade
  51| squeezes. Range of motion should improve with the
  52| exercises over two weeks. A seperate imaging order was
  53| not placed today. Return sooner for arm weakness, saddle
  54| numbness, or a headache that starts suddenly and is
  55| severe. Avoid lifting over 10 pounds until the follow-up
  56| visit. The pain occured mostly at the end of the
  57| workday, which fits strain more than a disc emergency.
  58| 
  59| A claims note was sent by fax. Fax (812) 555-0177. She
  60| will call the office if that desk says the page did not
  61| arrive.
  62| 
  63| Electronically signed
  64| Young Nguyễn, MD
  65| Family Medicine
  66| 
  67| Author: Young Nguyễn, MD
=== END DOCUMENT ===

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

=== DOCUMENT fd-0091 ===
   1| Message Thread
   2| From: Patient
   3| To: Clinical Staff
   4| Subject: Facial droop follow-up and allergy medication
   5| 
   6| hello, i am the daughter of the 48-year-old patient diagnosed with Bell palsy. she finished her course of prednisone 60 mg PO daily. her facial asymmetry is improving, but seasonal rhinitis is bothering her. can she take Allegra 180 mg PO daily along with generic cetirizine 10 mg PO at bedtime? her home vitals this afternoon were BP 122/76 mmHg and HR 70 bpm, with fingerstick glucose 104 mg/dL. we are also waiting for the discharge notes from Outside Hospital to be transferred. does she still need an evaluation through Wound Care for the retroauricular skin tear?
   7| 
   8| Response from Care Team
   9| To: Patient
  10| 
  11| The covering nurse reviewed your note. The 48-year-old patient may take Allegra 180 mg PO daily. Do not combine it with cetirizine; choose one antihistamine only. We received the facial nerve records from Outside Hospital. Her normal vitals are noted. A consult to Wound Care is not required as the retroauricular tear has resolved.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.