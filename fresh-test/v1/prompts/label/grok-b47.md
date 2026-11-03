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


=== DOCUMENT fd-0048 ===
   1| MEDICATION RECONCILIATION
   2| 
   3| Performed by the covering pharmacist after the patient returned from an
   4| inpatient stay. Records from Outside Hospital were used to rebuild the home
   5| list. The patient is a 72-year-old woman. Her daughter helped with the
   6| bottle count and confirmed which inhalers are actually in the house.
   7| 
   8| Reason for reconciliation
   9| She was treated for community-acquired pneumonia together with an acute
  10| exacerbation of chronic obstructive pulmonary disease. Antibiotics have
  11| been finished and are not continued. A steroid taper was started for the
  12| lung flare and must be dispensed as a short course, not as a chronic
  13| refill. She also lives with Parkinson disease, diagnosed in 2019, and with
  14| type 2 diabetes mellitus since 2021, hypertension, and painful distal
  15| sensory neuropathy in both feet. Recently she stumbled on a rug, did not
  16| hit her head, and did not lose consciousness.
  17| 
  18| While swelling of the ankles was present during the stay, the Wells score
  19| for deep vein thrombosis was low. Duplex ultrasound of both legs showed no
  20| clot, and anticoagulation was not started. A chest radiograph showed a
  21| focal infiltrate judged consistent with pneumonia. Repeat imaging was not
  22| required once fever resolved and oxygen saturation recovered. Sputum
  23| culture was not obtained.
  24| 
  25| Diagnoses relevant to dispensing
  26| Community-acquired pneumonia, improving.
  27| Chronic obstructive pulmonary disease with a recent exacerbation.
  28| Parkinson disease with early-morning stiffness and no current hallucination.
  29| Type 2 diabetes mellitus with distal sensory neuropathy.
  30| Hypertension, usually at goal.
  31| Constipation, mild, related to limited walking.
  32| 
  33| Allergies
  34| Penicillin caused a rash in childhood and remains an avoidance. Codeine
  35| caused nausea and is avoided. No angiotensin-converting enzyme inhibitor
  36| cough is on file.
  37| 
  38| Current regimen
  39| carbidopa-levodopa 25-100 mg PO TID on an empty stomach when she can
  40| entacapone 200 mg PO TID with each carbidopa-levodopa dose
  41| Lyrica 75 mg PO BID for neuropathic pain, with pregabalin as the generic
  42| duloxetine 60 mg PO daily
  43| prednisone 40/30/20/10 mg PO every morning with food, four days at each
  44| dose, then stop
  45| metformin 1000 mg PO BID with meals
  46| empagliflozin 10 mg PO every morning
  47| lisinopril 20 mg PO daily
  48| atorvastatin 40 mg PO at bedtime
  49| docusate sodium 100 mg PO BID
  50| senna 8.6 mg PO at bedtime PRN constipation
  51| albuterol sulfate HFA 2 puffs inhaled q6h PRN wheeze
  52| umeclidinium 62.5 mcg inhaled once daily
  53| acetaminophen 650 mg PO q6h PRN pain, not to exceed 3 g in a day
  54| 
  55| The prednisone supply will be 10 mg tablets. She takes four tablets daily,
  56| then three, then two, then one, each block lasting four days, which is the
  57| same 40/30/20/10 mg taper. That is forty tablets in all. She should not
  58| lengthen the taper on her own.
  59| 
  60| Gabapentin was tried previously at 300 mg PO TID and was stopped for
  61| sedation. That trial is the clinical basis for requesting Lyrica. Brand
  62| Lyrica needs prior authorization from the health plan. Pregabalin at the
  63| same dose is the preferred alternative if the plan denies the brand. Her
  64| daughter understands they are the same drug.
  65| 
  66| Vitals at the clinic recheck
  67| Blood pressure 128/74 mmHg. Heart rate 78 beats per minute. Respiratory
  68| rate 16 breaths per minute. Temperature 36.7 C. Oxygen saturation 96
  69| percent on room air.
  70| 
  71| Laboratory results copied from the discharge summary and the recheck
  72| WBC 8.4 K/uL. Hemoglobin 12.6 g/dL. Platelets 242 K/uL.
  73| Sodium 137 mmol/L. Potassium 4.1 mmol/L. Chloride 102 mmol/L.
  74| Bicarbonate 26 mmol/L. Creatinine 0.9 mg/dL.
  75| eGFR greater than 60 mL/min/1.73 m2.
  76| Fasting glucose 142 mg/dL. Hemoglobin A1c 7.4 percent.
  77| TSH 2.8 mIU/L.
  78| 
  79| Counseling and holds
  80| Sick-day plan: hold empagliflozin and metformin if she cannot eat or
  81| drink, because of ketoacidosis and lactic acidosis risk, and restart when
  82| intake is normal. Hold lisinopril if she has vomiting or marked
  83| lightheadedness, then call the clinic. Do not start metoclopramide,
  84| haloperidol, or a high-dose phenothiazine, because each can worsen
  85| Parkinson disease. Urine may turn brown on entacapone, and that change is
  86| not blood. Separate carbidopa-levodopa from a heavy protein meal when her
  87| stomach allows it. Prednisone will raise glucose, so fingerstick checks
  88| should increase during the taper, and Diabetes Center should see her if
  89| readings stay high after the taper ends. A Pain Clinic referral is in
  90| place if burning pain in the feet does not ease on pregabalin once the
  91| steroid course is done. Inhaler technique was taught back correctly for
  92| both the rescue inhaler and the daily anticholinergic inhaler. She should
  93| rise slowly to limit levodopa-related dizziness. Acetaminophen remains the
  94| analgesic. Ibuprofen was discouraged while blood pressure is being
  95| watched. The bowel regimen is scheduled docusate, with senna only if she
  96| has no stool for two days. A thirty-day supply of the chronic medicines
  97| was queued, and the steroid quantity was limited to the taper. The
  98| prescriber was asked to sign the prior authorization if the plan will not
  99| accept pregabalin.
=== END DOCUMENT ===

=== DOCUMENT fd-0001 ===
   1| REFILL AUTHORIZATION NOTE
   2| PATIENT: HENDRIKA VAN ROOIJEN
   3| DATE: 03-04-2026
   4| CALLBACK: +1 541 555 0148
   5| 
   6| The patient is ninety-three years old. Her daughter, Nell Hargrove,
   7| phoned the refill line because the apixaban bottle is down to four
   8| tablets. Speaking with the patient afterward, she was oriented and
   9| knew each medicine. She denied chest pain, black stools, a new cough,
  10| and any fall. Home weights have been stable, and ankle swelling is no
  11| worse than last week.
  12| 
  13| Regimen confirmed against the labels she read aloud:
  14| apixaban 5 mg PO BID
  15| furosemide 20 mg PO every morning
  16| metoprolol succinate 50 mg PO daily
  17| potassium chloride 10 mEq PO daily with breakfast
  18| 
  19| The apixaban refill on van Rooijen's profile is appropiate and was
  20| queued for tomorrow. Prescriber Eliška Březinová has not changed the
  21| doses. Age alone does not force a lower dose, and the last creatinine
  22| was not high enough to qualify her, so the 5 mg strength stays. She
  23| is to hold furosemide on days she feels too dizzy to stand, and she
  24| should not double apixaban after a missed dose. I reminded her that
  25| NSAIDs do not mix well with apixaban. Acetaminophen is already in the
  26| cabinet for knee pain. She has occassional lightheadedness on
  27| standing. No new allergy was reported. Her daughter will pick up the
  28| filled bottle tomorrow afternoon. The request was recieved with enough
  29| tablets to cover tonight and tomorrow morning.
=== END DOCUMENT ===

=== DOCUMENT fd-0288 ===
   1| PRIOR AUTHORIZATION, TRANSCRIBED FROM FAX
   2| PATIENT: SAMIR BIN HABIB
   3| DATE: 3/4/26
   4| MAILING: PO Box 229, Helena, MT 59601
   5| PLAN ID (scanned): 44O8 l193 2O
   6| 
   7| Mrs. Helen Gray, the patient's wife, asked the pharmacy to resend a prior authorization for pregabalin after the fax from Copper Pine Pain Clinic came through too dark to read. The patient is a 54-year-old man with painful diabetic neuropathy and has already tried gabapentin, which left him too drowsy to drive to work. Pregabalin 75 mg by mouth twice daily is the requested dose, written by Dr. Walter Briggs. The scanned plan ID above replaces a cleaner card number we do not have; the clerk copied the characters as they printed, including the odd letters in the middle groups.
   8| 
   9| She says he has been waking at night with burning in both feet and that acetaminophen does nothing. Duloxetine 60 mg by mouth daily was stopped last month for nausea. The last A1c was high, and metformin 1000 mg by mouth twice daily is still on the profile, along with empagliflozin 10 mg by mouth every morning. No opioid is requested. The portion of the clinic note that we could read suports failure of gabapentin and of a topical lidocaine patch. I told her the health plan usually decides these requests within a few days, and that we will call when the reply is recieved. She confirmed the PO Box is still the best place for a paper denial if one is mailed.
  10| 
  11| Please do not seperate this request from the original fax image, because the plan ID is only as clear as that scan. Quantity requested is a thirty-day supply with two refills. Kidneys are said to be normal, so no renal adjustment was deemed neccesary. Counseling on dizziness and edema was offered, and she will pass it along.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.