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


=== DOCUMENT fd-0035 ===
   1| Date: 2026-11-04
   2| Patient: Wood, Keiko (92F)
   3| Caregiver: Amadou Traore
   4| Attending: Dr. Jianhua Zhang
   5| Subject: Medication tolerance and morning refill request
   6| 
   7| Message 1
   8| From: amadou
   9| Sent: 2026-11-04 08:35
  10| To: Dr. Jianhua Zhang
  11| 
  12| hello dr. zhang,
  13| i am contacting the clinic on behalf of Mrs. Wood. as a 92F with moderate cognitive decline, she has been following your updated titration schedule. her home aide and i noted that Mrs. Wood's appetite has decreased slightly over the past three days, but she has had no nausea or vomiting. she continues taking donepezil 10 mg PO at bedtime and memantine 10 mg PO BID with meals. her morning vitals were BP 124/72 mmHg, HR 66 bpm, and pulse oximetry 97% on room air. we had a brief concen about mild sedation in the afternoon, but her gait remains stedy with her walker. could you confirm if we should contnue the same memantine dosage? also, our backup contact line is Phone: (415) 555–0173 if you need to speak with me directly. thank you.
  14| 
  15| Message 2
  16| From: Dr. Jianhua Zhang
  17| Sent: 2026-11-04 11:10
  18| To: amadou
  19| 
  20| Dear Amadou,
  21| 
  22| Thank you for the update regarding Keiko Wood's status. Mild transient anorexia can occur during memantine titration. Because Mrs. Wood's vital signs and ambulatory stability are preserved, please continue memantine 10 mg PO BID alongside donepezil 10 mg PO at bedtime. Offer smaller, more frequent meals to encourage intake. We have updated Wood's chart with your direct callback number (415) 555–0173. Please notify our office if dizziness or worsening lethargy occurs.
  23| 
  24| Sincerely,
  25| Jianhua Zhang, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0190 ===
   1| Message Thread
   2| MRN: 9482015
   3| Patient: Gianna Walder-D'Angelo
   4| Date: 17 November 2026
   5| 
   6| Message 1
   7| From: gianna
   8| Sent: 17 November 2026 09:30 AM
   9| To: Dr. Richard Campbell
  10| 
  11| hello dr. campbell,
  12| i am writing to check on the home health physical therapy referral following my knee arthroscopy performed at Pembroke Regional Hospital. my son-in-law Pieter van der Berg is staying with me to assist with daily ambulation and dressing changes. we have been keeping up with the home exercises twice daily, but i am still experiencing moderate swelling around the patellar incision. i have been taking celecoxib 100 mg PO BID with food and using cryotherapy packs for twenty minutes every three hours. my morning temperature was 98.2 F, and there is no erythema or calf tenderness.
  13| 
  14| the home nursing agency contacted us this morning stating they need to confirm my current residential recovery location and primary contact number before their intake nurse can arrive tomorrow. my home contact details are:
  15| 8422 Crestview Ridge Road
  16| Oakdale, IL 60443
  17| Phone: (312) 555-0134
  18| 
  19| could you also confirm if our care coordinator M.R.K. forwarded the post-op physical therapy protocol to their dispatch team? thank you so much for your assistance.
  20| 
  21| Message 2
  22| From: Dr. Richard Campbell
  23| Sent: 17 November 2026 11:15 AM
  24| To: Gianna Walder-D'Angelo
  25| 
  26| Dear Mrs. Walder-D'Angelo,
  27| 
  28| Thank you for your update. It is encouraging that you have no fever or wound erythema. Mild to moderate peri-incisional edema is expected at this stage. Please continue celecoxib 100 mg PO BID as prescribed and keep the operative lower extremity elevated on two pillows above heart level whenever you are seated or resting in bed.
  29| 
  30| I confirmed that our clinic navigator M.R.K. transmitted your discharge summary from Pembroke Regional Hospital along with the formal phase-one physical therapy orders to the home health coordination office. I also provided them with your phone number (312) 555-0134 and verified your address on Crestview Ridge Road. If your swelling increases significantly, if wound drainage develops, or if Pieter van der Berg notices any calf warmth, please contact our triage desk right away.
  31| 
  32| Sincerely,
  33| Richard Campbell, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0064 ===
   1| CALL RECORDING: AMBULATORY NURSE LINE
   2| FACILITY: St. Anselm Medical Center
   3| MRN: 7301928
   4| PATIENT: Châu Bích Ngân
   5| ATTENDING: Dr. Scott Higgins
   6| STAFF: Heaven Clark, RN
   7| CALLER: Marco D'Angelo (son-in-law)
   8| 
   9| [Call Recording Begins]
  10| 
  11| Heaven Clark, RN: St. Anselm Medical Center outpatient triage, this is Nurse
  12| Heaven Clark. How can I, uh, help you today?
  13| 
  14| Marco D'Angelo: Hi Heaven, yes, um, my name is Marco D'Angelo. I'm calling for
  15| my mother-in-law, Châu Bích Ngân. She, uh, she had an outpatient colonoscopy
  16| with polypectomy back around the 4th of July, and Dr. Higgins scheduled a
  17| repeat flexible sigmoidoscopy. We received, uh, we received an automated
  18| reminder about pre-procedure fasting, but we weren't sure about her morning
  19| medications.
  20| 
  21| Heaven Clark, RN: Okay, let me pull up her chart under MRN: 7301928. Can you
  22| confirm her address for me first?
  23| 
  24| Marco D'Angelo: Yes, she lives at:
  25| 4128 Evergreen Terrace, Apartment 5B
  26| Portland, OR 97221
  27| 
  28| Heaven Clark, RN: Thank you, Marco. And what is the best direct callback number
  29| in case we get disconnected?
  30| 
  31| Marco D'Angelo: You can reach me at 503-555-0118 ext. 240 during business hours.
  32| 
  33| Heaven Clark, RN: Perfect. Looking at the scheduling orders entered on August
  34| fourth, twenty twenty-six, Dr. Higgins noted that for patient C.B.N., she
  35| should hold her lisinopril 20 mg PO on the morning of the procedure. However,
  36| she should take her levothyroxine 75 mcg PO with a small sip of water at
  37| 6:00 AM. Also, she must finish her polyethylene glycol bowel prep tonight
  38| by 10:00 PM.
  39| 
  40| Marco D'Angelo: Got it. Hold the lisinopril, take the levothyroxine with a tiny
  41| sip of water, and finish the prep tonight.
  42| 
  43| Heaven Clark, RN: Exactly. Check in at the endoscopy suite tomorrow morning at
  44| 7:30 AM. If she develops any nausea or abdominal pain tonight, call our
  45| on-call line.
  46| 
  47| Marco D'Angelo: Thank you so much, Heaven. Have a wonderful day.
  48| 
  49| Heaven Clark, RN: You too, Marco. Goodbye.
  50| 
  51| [Call Recording Ends]
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.