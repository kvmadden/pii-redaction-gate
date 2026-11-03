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


=== DOCUMENT fd-0226 ===
   1| From: Nanami Peshimoto
   2| To: endocrine portal pool
   3| Subject: periods and the new pill
   4| 
   5| hi, this is nanami peshimoto. i am 17. my older brother parkinson okonkwo is the one who usually calls when i freeze up, but i wanted to type this myself. periods have been every two or three months since June 2026, and the acne on the jaw is worse. i also have dark hair on the chin and i get cramps when a period finally comes. i am not pregnant. i do not smoke. Stonebridge Endocrine Clinic started metformin 500 mg PO BID and spironolactone 50 mg PO daily. i take both with food. i skipped the metformin twice last week because of stomach upset and then restarted. this week i weighed 58 kg and had a dull headache, no fevers. please look at Chart no. 7733104. the lab sheet that was scanned shows the account as Oll925, which looks like a misread. my email is nanami.peshimoto@example.net if the portal drops this. also a sign-in alert popped from 192.0.2.77 last night and that was my brother on his phone, not a stranger.
   6| 
   7| From: Hillel Tanner, MD
   8| To: Nanami Peshimoto
   9| 
  10| Thank you for writing it yourself. We will leave the portal sign-in as it is.
  11| 
  12| Medications: continue metformin 500 mg PO BID with food, and spironolactone 50 mg PO daily. Do not double the metformin if a dose is missed. Please take metformin with the largest meal if the stomach upset returns, and you may ease the discomfort by keeping the dose at 500 mg PO BID rather than combining them. Expected effects are lighter acne over six to eight weeks and sometimes more regular cycles. Message us for severe dizziness, muscle weakness, or vomiting.
  13| 
  14| Labs from that panel: LH 11.2 mIU/mL, FSH 5.4 mIU/mL, total testosterone 62 ng/dL, DHEA-S 280 mcg/dL, TSH 1.9 mIU/L, prolactin 14 ng/mL, hemoglobin 13.1 g/dL, potassium 4.0 mmol/L. Vitals in clinic: blood pressure 108/66 mmHg, pulse 72 beats per minute, temperature 36.6 C, respiratory rate 14 breaths per minute, oxygen saturation 99% on room air. The exam note lists Tanner stage 5 for breast and pubic hair, which is expected at your age and is not a new finding. Diagnosis we are treating: polycystic ovary syndrome. A pelvic ultrasound showed no large cyst. No surgery and no endometrial biopsy are planned.
  15| 
  16| We checked that the spironolactone does not conflict with anything else on the list. A fasting lipid panel and a repeat potassium are reasonable at the next visit, and we can order those without another ultrasound. The scanned account string does not match our books, so we will ignore it and use the chart number you sent. Keep a simple cycle calendar in the portal so we can see the longest gap. Write back if cycles stretch past three months or if you start a new supplement.
=== END DOCUMENT ===

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

=== DOCUMENT fd-0173 ===
   1| Red Oak Pharmacy
   2| Prior authorization request transcribed from fax
   3| PAGE 1 OF 1
   4| TRANSMISSION OK
   5| 
   6| PATIENT: GIDEON TEAGUE
   7| Date of Service: Mar. 4, 2026
   8| DOB: Aug. 19, 1954
   9| Member ID: 5508 2214 63
  10| Rx: 9081442
  11| Phone: (608) 555-0164
  12| Address: 1427 Bramble Ridge Road, La Crosse, WI 54601
  13| 
  14| Please accept this retransmission of a prior authorization. The page arrived with a faded top margin and a slight skew, and the clinical body below was read off the fax and typed without changing the doses or the directions.
  15| 
  16| Request. Approve istradefylline (Nourianz) 20 mg by mouth once daily in the morning as adjunct treatment for motor fluctuations in Parkinson disease. Gideon Teague is Hoehn and Yahr stage 3. Off time runs past two hours on most days despite a stable carbidopa/levodopa schedule.
  17| 
  18| Current regimen. Carbidopa/levodopa 25 mg/100 mg, one tablet by mouth at 07:00, 11:00, 15:00, and 19:00. Entacapone 200 mg by mouth with each of those doses. When supper is late the 19:00 dose slips, and the last off period of the day gets longer. He still dresses himself, though buttons take longer in the afternoon.
  19| 
  20| Therapies already tried. Rasagiline 1 mg by mouth once daily was started in 2024 and stopped after six weeks for headache and insomnia that did not ease. A trial of 1.5 tablets of carbidopa/levodopa at 15:00 caused neck dyskinesia and was brought back to one tablet. Amantadine 100 mg by mouth twice daily caused ankle edema and livedo and was stopped. Entacapone is still appropriate and is not part of this request.
  21| 
  22| Rationale. Istradefylline is requested to shorten off time without returning the levodopa dose to the level that caused dyskinesia. The planned course is 12 months, with a movement check at week 8. At the last visit the blood pressure was 128/74 mmHg, the pulse was 72 beats per minute, and the creatinine was 0.9 mg/dL. There is no hepatic disease on the problem list. No deep brain stimulator is in place.
  23| 
  24| Swallow the tablet whole, at the same time each morning, with or without food. If a dose is missed and the next morning is close, skip the missed dose rather than doubling. Nausea, insomnia, and involuntary movements should be reported at the week 8 check.
  25| 
  26| Other medicines. Atorvastatin 20 mg by mouth at bedtime, lisinopril 5 mg by mouth each morning, and cholecalciferol 2000 units by mouth daily. Aspirin is not used. No drug allergy is recorded. Cognition is good enough that he fills his own pill box on ordinary days. His sister helps when off periods cluster after lunch. He fell in the kitchen last winter, with no head injury and no loss of consciousness.
  27| 
  28| Copied to: Lowell Briggs, MD; Sadie Crowe, PharmD; Pearl Dunning, sister.
  29| 
  30| Attestation. The wording above matches the faxed request. Urgent review is not required, although dressing and the walk to the mailbox are slower on off days. Please phone the determination to the number on this form. He has been told not to borrow tablets from a neighbor while the request is open.
  31| 
  32| End of fax transcription.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.