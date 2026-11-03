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


=== DOCUMENT fd-0230 ===
   1| 8830142
   2| Heart and Vascular Center of Linden
   3| Outpatient Progress Note
   4| 
   5| Patient: Ifeoma
   6| Hunter
   7| Date of service: the 4th of March
   8| Author: Dr. Pascale de la Croix
   9| Fax: (312) 555-0140
  10| Address: 14 Magnolia Court, Apt 3, Linden, OH 43002
  11| 
  12| The referral page was scanned at an angle. The prior record
  13| reads lO88321, and registration will confirm it before old
  14| notes are merged.
  15| 
  16| Chief complaint
  17| Follow-up of type 2 diabetes and hypertension, plus a family question.
  18| 
  19| History of present illness
  20| She is a 58-year-old woman seen for routine management of type 2
  21| diabetes and hypertension. Morning glucoses at home ran mostly
  22| from 140 to 180 mg/dL from March 1 through March 3, above her
  23| usual range near 110 mg/dL. She ran out of metformin for four
  24| days during that stretch and has restarted 1000 mg by mouth
  25| twice daily with meals. She denies chest pain, dyspnea,
  26| orthopnea, edema, and polyuria today. Toe numbness is stable
  27| and not painful. Her husband, Mr. Spyros Vlahakis, came with
  28| her and confirms the gap in the metformin.
  29| 
  30| She asked whether a nephew's Hunter syndrome means she needs testing.
  31| She has no clinical features of Hunter syndrome, no
  32| developmental history suggesting a mucopolysaccharidosis,
  33| and the diagnosis belongs to the child, not to her. No carrier
  34| testing was ordered.
  35| 
  36| Past medical history
  37| Type 2 diabetes mellitus for twelve years. Hypertension. Obesity.
  38| Dyslipidemia. No coronary disease, no stroke, and no known kidney disease.
  39| 
  40| Medications
  41| 1. Metformin 1000 mg by mouth twice daily.
  42| 2. Lisinopril 20 mg by mouth daily.
  43| 3. Atorvastatin 40 mg by mouth at bedtime.
  44| 4. Aspirin 81 mg by mouth daily.
  45| 
  46| Allergies
  47| No known drug allergies.
  48| 
  49| Social history
  50| She works as a cafeteria supervisor and is on her feet much of the day.
  51| She does not smoke. Alcohol is a glass of wine on some weekends.
  52| She lives with her husband in the apartment listed above.
  53| She walks the parking lot at work after the lunch service
  54| when the weather allows.
  55| 
  56| Review of systems
  57| No chest pain, no visual change, no foot ulcer, no dysuria,
  58| and no depression symptoms she wanted to discuss.
  59| The rest is negative.
  60| 
  61| Physical examination
  62| Blood pressure 148/86 mmHg, heart rate 76, respiratory rate 14,
  63| temperature 98.0 F, oxygen saturation 99 percent on room air, weight 92 kg.
  64| She is comfortable. Lungs are clear, heart is regular without murmur, and there is no edema.
  65| Monofilament sensation is reduced at both great toes.
  66| Skin on the feet is intact. No carotid bruit.
  67| 
  68| Laboratory results from this morning
  69| Hemoglobin A1c 8.1 percent. Creatinine 0.8 mg/dL.
  70| eGFR above 60 mL/min/1.73 m2. Potassium 4.1 mmol/L.
  71| LDL cholesterol 118 mg/dL. Urine albumin-to-creatinine ratio 18 mg/g.
  72| Fingerstick glucose in the office was 162 mg/dL.
  73| 
  74| Assessment and plan
  75| 1. Type 2 diabetes, above the A1c goal. Metformin has been restarted.
  76| Continue 1000 mg twice daily and add empagliflozin 10 mg by mouth
  77| each morning for heart and kidney benefit. Recheck the A1c in three months.
  78| We talked through a short walk after supper and smaller evening portions.
  79| Sick-day rules were reviewed: hold the new agent and the metformin
  80| if she cannot keep fluids down, and call for vomiting that
  81| lasts more than a day. Footwear at work should be closed-toe.
  82| 2. Hypertension, above goal today. Continue lisinopril 20 mg daily.
  83| She will bring home readings to the next visit in four weeks.
  84| 3. Dyslipidemia. Continue atorvastatin 40 mg.
  85| LDL remains above 100 mg/dL. We will recheck it once doses are
  86| steady before raising the statin.
  87| 4. The nephew's Hunter syndrome does not change today's plan
  88| and is not her diagnosis.
  89| Lab results will be posted at https://portal.example.net/lab/hunter.
  90| 
  91| Electronically signed by Dr. Pascale de la Croix
  92| Endocrinology
=== END DOCUMENT ===

=== DOCUMENT fd-0116 ===
   1| TRANSCRIPT OF CLINICAL TELEPHONE CALL
   2| Facility: Pulmonary and Allergy Center of Green Valley
   3| Reference Encounter: 4821-9932-07
   4| Date: 8 Sep 2026
   5| Care Team: Dr. Douglas McAllister, Hannah Weaver, RN, Dr. Craig Stewart
   6| Patient: Pearl al-Zuhair
   7| DOB: 15 Feb 1934
   8| Age: 92-year-old female
   9| Caller: Kerem Celik (son-in-law)
  10| Additional Contact: Clara Turner (daughter)
  11| 
  12| [Recording Commenced]
  13| 
  14| Hannah Weaver, RN: Pulmonary and Allergy Center of Green Valley, triage line, this is Hannah Weaver, registered nurse. How can I, uh, help you today?
  15| 
  16| Kerem Celik: Hello, yes, uh, Nurse Hannah. My name is Kerem Celik. I am calling, um, on behalf of my mother-in-law, Pearl al-Zuhair. She had, uh, she had a bronchoscopy with transbronchial biopsy last week, and she is having some increased shortness of breath and coughing up some thick mucus today.
  17| 
  18| Hannah Weaver, RN: Alright, let me pull up Pearl's chart here. Could you please confirm her date of birth and home address for me?
  19| 
  20| Kerem Celik: Yes, her date of birth is February fifteenth, nineteen thirty-four—born on 15 Feb 1934. She is a 92-year-old woman, and she currently lives in Phoenix with my wife and me. Her address is 519 Crescent Summit Way, Suite 200, Phoenix, AZ 85032.
  21| 
  22| Hannah Weaver, RN: Thank you, Mr. Celik. I see that her daughter, Clara Turner, also updated her profile on the online portal yesterday, and she entered the address in lowercase as 519 crescent summit way, suite 200. Does Mrs. al-Zuhair have any fever, chest pain, or frank blood in her sputum?
  23| 
  24| Kerem Celik: No fever. Her temperature this morning was 98.4 F. Her oxygen saturation on room air dropped to 89%, so we put her on 2 liters per minute of nasal cannula oxygen, which brought her pulse oximetry up to 93%. Pulse was 82 beats per minute, blood pressure 126/74 mmHg. There is no bright red blood, just, you know, yellowish thick phlegm. But she feels very tired and her wheezing sounds louder.
  25| 
  26| Hannah Weaver, RN: Okay. The hypoxemia is concerning given her chronic obstructive pulmonary disease exacerbation risk after the procedure. Let me review her medication list. Is she using her budesonide-formoterol 160/4.5 mcg 2 puffs BID regularly?
  27| 
  28| Kerem Celik: Yes, she took that this morning at 8:00 AM. And she did a nebulizer treatment of albuterol-ipratropium 0.5 mg/3 mg about two hours ago. It helped a little bit, but her breathing still feels tight.
  29| 
  30| Hannah Weaver, RN: Understood. Let me check the post-procedure notes from Dr. Douglas McAllister. He performed the bronchoscopy on 8 Sep 2026—wait, the procedure was last week, today is September eighth, twenty twenty-six. Dr. McAllister noted that her baseline forced expiratory volume in 1 second was 1.1 liters, and she had mild tracheal secretions. Also, in her family history notes, her daughter Clara Turner had asked previously about genetic screenings because a niece had Turner syndrome, but the note confirms Mrs. al-Zuhair has no genetic anomalies or Turner syndrome. Dr. McAllister's provider credentials are on file under Medical License: MD-492817.
  31| 
  32| Kerem Celik: Right, exactly. We just wanted to make sure she doesn't need oral steroids or an antibiotic like azithromycin. Clara Turner, her daughter, is an occupational therapist and she thought Pearl might need a short burst of prednisone.
  33| 
  34| Hannah Weaver, RN: Dr. McAllister is in clinic right now, and I just sent an urgent flag to his desktop with the initials P.Z. to review her oxygen levels. He wants us to start a 5-day course of prednisone 40 mg PO daily and send a prescription for azithromycin 250 mg PO daily for 5 days. Which pharmacy should we send those to?
  35| 
  36| Kerem Celik: The local pharmacy on Desert Willow Road has them on file, but if you need to fax the orders, their direct clinical line is Fax: 602-555-0164.
  37| 
  38| Hannah Weaver, RN: Perfect, I will transmit the electronic script and also send a confirmation to Fax: 602-555-0164 immediately. While waiting for the medication, please keep her on the 2 liters of supplemental oxygen. Continue the albuterol-ipratropium nebulizer every 4 to 6 hours as needed. If her oxygen saturation drops below 90% on oxygen, or if she develops blue lips, confusion, chest pressure, or hemoptysis, call 911 immediately.
  39| 
  40| Kerem Celik: Okay, we will do that. We will pick up the prednisone and azithromycin as soon as the pharmacy alerts us. Thank you very much, Hannah.
  41| 
  42| Hannah Weaver, RN: You're very welcome, Kerem. We will follow up by phone tomorrow afternoon. Take care.
  43| 
  44| Kerem Celik: Thank you, goodbye.
  45| 
  46| [Call Terminated]
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.