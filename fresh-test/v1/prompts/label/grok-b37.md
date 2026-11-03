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

=== DOCUMENT fd-0293 ===
   1| From: SÖLLNER, MAJA
   2| Sent: 2026-03-04
   3| Subject: methimazole question
   4| 
   5| hi, this is Maja von Söllner. i am 34. my husband wilson hart is reading over my shoulder because teh screen is small. i did not recieve the thyroid lab from 3/4/26. rose van der horst had said the TSH was low and to stay on methimazole 10 mg PO daily. i also take propranolol 20 mg PO BID for the tremor. stomache upset is mild. i have not missed a dose this week. sleep has been light and i feel warm in a cool room. i am not pregnant. a seperate question: the health plan form asks for member number 88412097, and they want the records sent by Fax: (617) 555-0144. please tell me if the dose changes. i felt flushed this morning. pulse on the home cuff was 108 beats per minute and blood pressure was 124/78 mmHg.
   6| 
   7| From: Rose van der Horst
   8| To: the patient
   9| 
  10| Thank you for the careful note. The draw from that morning is in. TSH 0.08 mIU/L, free T4 2.4 ng/dL, free T3 5.1 pg/mL, WBC 6.2 K/uL, absolute neutrophil count 3.1 K/uL, ALT 28 U/L, AST 24 U/L. Vitals recorded with the lab were blood pressure 118/74 mmHg, pulse 104 beats per minute, temperature 36.8 C, respiratory rate 16 breaths per minute, oxygen saturation 99% on room air, weight 63 kg. Diagnosis: Graves disease, still hyperthyroid. Continue methimazole 10 mg PO daily and propranolol 20 mg PO BID. Pieter Down, the covering pharmacist, will check the interaction list before we consider methimazole 15 mg PO daily. His review is a medication check only. It has nothing to do with a Down syndrome handout that was scanned into the media tab by mistake. That page belongs to a pediatric file and will be removed from this chart.
  11| 
  12| Recheck TSH, free T4, and a CBC in four weeks. Keep propranolol if the pulse stays over 90, and skip a propranolol dose only if the pulse drops under 60 or you feel faint. Dairy and antacids are fine with this pair, just not at the same minute as the methimazole if you can space them. We will use the member number and the fax number you already wrote, so you do not need to send them again. No thyroid uptake scan and no surgery are planned. Call the clinic the same day for fever, sore throat, mouth ulcers, or yellow eyes, because methimazole can lower the white count. Your husband may sit with you for the next portal reply if the print is hard to read on a phone.
=== END DOCUMENT ===

=== DOCUMENT fd-0180 ===
   1| Red Lantern Laboratory
   2| Surgical Pathology
   3| 
   4| Patient: Edna Mossman
   5| DOB: June 19, 1929
   6| Age: ninety-six years old
   7| MRN: 6612048
   8| Accession: SP-26-77419
   9| Specimen: shave biopsy, left forearm
  10| Collected: 04.03.2026
  11| Ordering: Dr. Ruth Calder
  12| Daughter: Mrs. Bilqis Rehman
  13| Phone: +1 802 555-0118
  14| 
  15| CLINICAL INFORMATION
  16| The patient is ninety-six years old and was seen for a slowly growing pearly papule on the left forearm. Her daughter, Mrs. Bilqis Rehman, attended the visit and confirmed the medicine list. No bleeding disorder is known. Bleeding at the site was controlled with pressure and a small amount of aluminum chloride before the dressing. The site was photographed before the shave.
  17| 
  18| GROSS
  19| The specimen is a tan-white skin shave, 0.8 x 0.6 x 0.1 cm, inked and entirely submitted in one cassette after processing.
  20| 
  21| MICROSCOPIC
  22| Sections show nests of basaloid cells with peripheral palisading and retraction artifact in the dermis, connected to the epidermis. The tumor islands show focal melanin pigment, and a connection to the overlying epidermis is confirmed on the deeper levels. The inflammatory infiltrate around the tumor is sparse. Solar elastosis is present in the adjacent dermis. No ulceration is identified on these sections. No perineural invasion is seen in the planes examined. Margins are positive at the deep edge, as expected for a shave.
  23| 
  24| Medicines at the time of biopsy: levothyroxine 88 mcg PO daily, atorvastatin 20 mg PO QHS, acetaminophen 650 mg PO q8h PRN pain, and cholecalciferol 1000 units PO daily.
  25| 
  26| DIAGNOSIS
  27| Skin, left forearm, shave biopsy: nodular basal cell carcinoma, present at the deep margin. Clinical correlation and a plan for definitive treatment are suggested.
  28| 
  29| Interpreted by Dr. Owen Bramble, dermatopathology.
  30| End of report.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.