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

=== DOCUMENT fd-0081 ===
   1| NURSE: Nurse line, uh, thanks for holding. I have the chart up. You're his daughter, is that right?
   2| DAUGHTER: Yes. I'm his daughter. I'm calling because the discharge packet from Outside Hospital is confusing and the blister pack the pharmacy sent does not match what he was taking in the hospital.
   3| NURSE: Okay. Let me, let me read what I have. He is a 78-year-old man. Parkinson disease was diagnosed in 2019. Type 2 diabetes mellitus has been on the list since 2021. He was treated for a COPD exacerbation and came home on a steroid taper. The covering pharmacist is on the other line if we need a dose check.
   4| DAUGHTER: The taper is the part I'm afraid I'll mess up. The bottle says prednisone 40/30/20/10 mg, but it doesn't say how many days.
   5| PHARMACIST: I can take that. Prednisone 40/30/20/10 mg PO daily means 40 mg PO daily for five days, then 30 mg PO daily for five days, then 20 mg PO daily for five days, then 10 mg PO daily for five days, then stop. Do not crush it. Give it with breakfast so the Parkinson doses stay on time.
   6| DAUGHTER: He also has a bottle of Lyrica and a box of Allegra. I don't know which is the pain one.
   7| PHARMACIST: Lyrica is the brand of pregabalin, 75 mg PO BID, for the neuropathic pain in his feet. Allegra is the brand of fexofenadine, 180 mg PO daily, for allergic rhinitis. Neither one replaces the steroid. He should keep carbidopa-levodopa 25/100 mg PO TID, metformin 1000 mg PO BID with meals, and atorvastatin 40 mg PO at bedtime. Albuterol 2 puffs INH q6h PRN for wheeze. Hold the albuterol if the heart rate is racing and call us.
   8| NURSE: Vitals this morning, from his daughter, were blood pressure 146/82 mmHg, heart rate 76 beats per minute, respiratory rate 18, temperature 37.4 C, and oxygen saturation 95 percent on room air. Last labs before discharge were white blood cell count 11.2 K/uL, creatinine 1.1 mg/dL, potassium 4.1 mmol/L, and hemoglobin A1c 7.8 percent.
   9| DAUGHTER: They said his sugar was high because of the prednisone. Um, does he need a new doctor for that?
  10| NURSE: The A1c is above goal, so there is a referral to Diabetes Center as a service, not a new primary clinician. For the shoulder that froze while he was in bed, the discharge summary also refers him to Pain Clinic.
  11| DAUGHTER: He fell getting off the commode. They did a head check. I can't remember the score.
  12| NURSE: Glasgow Coma Scale was 15. He was alert, no focal weakness beyond his baseline tremor, and no lumbar puncture was done. Chest radiograph showed a right lower lobe infiltrate, which fits the exacerbation. A swallowing evaluation cleared him for thin liquids. The fall did not earn him a scan of the neck.
  13| DAUGHTER: His shoulder still hurts when he tries to lift the spoon. They called it a frozen shoulder. Is that the same as the Parkinson stiffness?
  14| NURSE: No. The shoulder diagnosis is adhesive capsulitis. It is separate from the Parkinson disease rigidity. Pain Clinic will see him for that. We did not schedule a procedure. If they inject the joint later, that order will come from them.
  15| PHARMACIST: One warning on the taper. If his glucose stays over 250 mg/dL, or if he gets confused, call the nurse line before you give the next prednisone. Do not double a missed carbidopa-levodopa dose. If he misses one, give the next one at the usual time.
  16| DAUGHTER: He is 78, not frail in the way people assume, but I am 51 and I am the only one giving the pills. I think I have it. Forty, then thirty, then twenty, then ten.
  17| NURSE: That's right. Diagnoses to keep straight are COPD exacerbation, Parkinson disease, type 2 diabetes mellitus, allergic rhinitis, and adhesive capsulitis. Procedures already done are the chest radiograph and the swallowing evaluation. Nothing else is pending tonight. If the breathing gets harder, or the oxygen saturation falls under 88 percent, he needs an urgent visit, not a refill call.
  18| DAUGHTER: Uh, can the pharmacy deliver the corrected blister pack, or do I pick it up?
  19| PHARMACIST: The pharmacy can deliver on the address already in the chart. I do not need you to repeat it. If you would rather pick up, bring the Lyrica bottle and the Allegra box so we can see what was already opened.
  20| NURSE: Any chest pain, any one-sided weakness, or any new confusion, don't wait for the Pain Clinic visit. That's the whole list from me.
  21| DAUGHTER: Okay. Thank you. I think, I think that's everything.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.