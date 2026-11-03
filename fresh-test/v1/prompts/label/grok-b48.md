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


=== DOCUMENT fd-0111 ===
   1| NORTH FIELD HOSPITAL
   2| 410 Quarry Street
   3| Calder, MI 49655
   4| Phone: (231) 555-0128
   5| Email: referrals@example.org
   6| 
   7| DISCHARGE SUMMARY AND REFERRAL
   8| 
   9| Date: March 6, 2026
  10| Patient: Olena D. Luchanko
  11| DOB: June 18, 1933
  12| MRN: 5502-7741-18
  13| 
  14| To: Meadow Brook Clinic
  15| 18 Meadow Brook Road
  16| Calder, MI 49621
  17| 
  18| Dear colleagues,
  19| 
  20| On March 2, 2026, a 92 y.o. woman, Olena D. Luchanko, was
  21| admitted to North Field Hospital with three days of dyspnea,
  22| orthopnea, and swelling of both ankles. Her daughter, Claire
  23| Ellison, shares the house and gave the admission history.
  24| She described a gain of about five pounds, a new need to
  25| sleep on two pillows, and a shorter walking distance inside
  26| the house. There was no chest pain, no syncope, no fever,
  27| and no change in stool or urine color. Home medicines were
  28| furosemide 20 mg by mouth daily, carvedilol 6.25 mg twice
  29| daily, losartan 25 mg daily, and levothyroxine 88 mcg each
  30| morning. She has no known drug allergy.
  31| 
  32| Past history includes heart failure with preserved ejection
  33| fraction, hypertension, stage 3 chronic kidney disease, and
  34| hypothyroidism. She also has Raynaud phenomenon, present
  35| for many years, with cold-triggered color change in the
  36| fingers and no digital ulcer. Gloves have been enough, and
  37| she takes no vasodilator for it. There has been no stroke,
  38| no myocardial infarction, and no prior intubation.
  39| 
  40| On arrival the blood pressure was 168/90 mmHg, the pulse was
  41| 108 beats per minute, the respiratory rate was 24, and the
  42| oxygen saturation was 90 percent on room air. She was
  43| speaking in short phrases, with crackles halfway up both
  44| lung fields, an elevated jugular venous pressure, and pitting
  45| edema to the mid shins. The abdomen was soft. She was
  46| afebrile and oriented to person and place.
  47| 
  48| Laboratory results included sodium 134 mmol/L, potassium
  49| 3.2 mmol/L, creatinine 1.6 mg/dL (baseline near 1.3 mg/dL),
  50| blood urea nitrogen 32 mg/dL, BNP 1860 pg/mL, hemoglobin
  51| 11.2 g/dL, and troponin I 0.02 ng/mL, unchanged on repeat.
  52| The chest radiograph showed pulmonary edema without a focal
  53| infiltrate. An echocardiogram showed an ejection fraction of
  54| 58 percent, diastolic dysfunction, and moderate mitral
  55| regurgitation. The fingers were warm during the exam, and
  56| the Raynaud phenomenon was not active.
  57| 
  58| She received intravenous furosemide, with a net loss of 3.4
  59| liters over three days. Oxygen was weaned from 2 liters by
  60| nasal cannula to room air. Potassium was replaced by mouth.
  61| Creatinine returned to 1.4 mg/dL. Carvedilol and losartan
  62| were held on the first day and then resumed. Daily weights
  63| fell from 61.2 kg to 57.6 kg. She slept flat enough to rest,
  64| and Claire Ellison practiced the new diuretic plan at the
  65| bedside before discharge on March 6, 2026.
  66| 
  67| Her weight on the morning of discharge was 57.6 kg. Blood
  68| pressure was 136/72 mmHg, pulse 76 beats per minute, and
  69| oxygen saturation 96 percent on room air. The lungs had only
  70| faint basilar crackles. She walked the hall once with a
  71| walker and did not report chest pain. Teaching limited
  72| fluids to about 1.5 liters a day and asked for a weight
  73| each morning, recorded by Claire Ellison.
  74| 
  75| Discharge medicines are furosemide 40 mg by mouth each
  76| morning, carvedilol 6.25 mg by mouth twice daily, losartan
  77| 25 mg by mouth daily, and levothyroxine 88 mcg by mouth
  78| each morning. Acetaminophen 650 mg by mouth every six hours
  79| is available for pain. No vasodilator was added for the
  80| Raynaud phenomenon. Please obtain a basic metabolic panel
  81| within one week at Meadow Brook Clinic, and see her sooner
  82| for a gain of more than two pounds in a day, new dyspnea at
  83| rest, or swelling that returns. Printed teaching was reviewed
  84| with Claire Ellison before she left the unit.
  85| Family instructions are posted at https://www.example.org/hf.
  86| 
  87| I was the attending physician for this admission. Questions
  88| about the stay may be directed to Howard M. Raynaud in the
  89| Department of Medicine.
  90| 
  91| Howard M. Raynaud, MD
  92| Hospital Medicine
  93| North Field Hospital
=== END DOCUMENT ===

=== DOCUMENT fd-0071 ===
   1| PHARMACY REFILL CALL NOTE
   2| Bramble Corner Pharmacy
   3| 
   4| Patient: BEATRICE TROWBRIDGE
   5| Date of Service: Mar. 4, 2026
   6| Member ID: 7394 2218 56
   7| Prescription number: Rx 4482196
   8| Callback: (541) 555-0162
   9| Home address: 2184 Cedar Hollow Lane, Grants Pass, OR 97526
  10| 
  11| The patient's son, Spyros Karageorgos, called the refill line this afternoon and asked us to prepare carbidopa-levodopa before the weekend. His mother has Parkinson disease and has been stable for months on carbidopa-levodopa 25-100 mg, two tablets by mouth three times daily, taken on an empty stomach when she can manage it. She also uses entacapone 200 mg by mouth with each carbidopa-levodopa dose, and docusate sodium 100 mg by mouth at bedtime for constipation, which has been her main nonmotor complaint. The prescriber of record is Dr. Calvin Henshaw. No dose change was requested.
  12| 
  13| He explained that a visiting cousin filled the weekly pill box and doubled the midday carbidopa-levodopa for several days, so the bottle is nearly empty with about a week still left on the usual schedule. There has been no fall, no new rest tremor, no hallucination, and no sudden sleepiness. She is still walking indoors with a single-point cane. Blood pressure at the last clinic visit was acceptable and she was told to rise slowly because of orthostasis, which she already does. I did not recieve a new prescription. This request is a refill of the existing order, and two refills remain on the carbidopa-levodopa. The entacapone has refills as well and was not requested today.
  14| 
  15| Trowbridge's profile shows a health plan that wants the member ID printed on the claim, and the son read the card slowly enough that I could check each group. He declined delivery. He will pick up at the counter tomorrow after 3 pm and will bring the old bottles so we can reconcile the count. I warned him that an early refill can reject, in which case we will call him at the callback number above rather than guessing at a seperate number. Counseling points reviewed with him: take the carbidopa-levodopa at the same times each day, keep the entacapone paired with it, do not stop it abruptly, and hold the dose and call the prescriber if she becomes markedly confused or rigid. Dietary protein can delay absorption, so the midday dose is better before lunch than in the middle of a heavy meal. He said she already follows that pattern most days, though he was not entierly sure about weekends.
  16| 
  17| I left a short note for the prescriber describing the pill-box mixup so the early refill is not mistaken for a dose increase. Please store the two bottles in seperate bags at pickup so they are not poured into one vial. The cousin is not to fill the box again. Quantity prepared will be a thirty-day supply of each requested medication, labeled in the usual way, with the patient name and the prescription number on every label.
  18| 
  19| Pharmacist on duty: Greta Feldmann, RPh
=== END DOCUMENT ===

=== DOCUMENT fd-0015 ===
   1| MEDICATION RECONCILIATION
   2| Plum Street Pharmacy
   3| Phone: (208) 555-0174
   4| Member: 6104-8831-29
   5| DOB: March 4, 1934
   6| 
   7| Her daughter, Clara M. Bemis, called about a full reconciliation for Anežka
   8| Vávrová, a 92 y.o. woman, before the weekend fill.
   9| Dr. Thủy K. Lâm remains the prescriber. Ross Carter, clinical pharmacist,
  10| reviewed the interaction screen. Ellen Ward, pharmacy technician, read
  11| each bottle aloud. She can be reached at 208.555.0133 if a claim rejects.
  12| Please send any paper denial that may come later to 220 Plum Street
  13| Boise, ID 83702 rather than to the daughter.
  14| 
  15| The home list was rebuilt from those bottles and from the prescriber's
  16| last note. Diagnoses that drive the list are nonvalvular atrial
  17| fibrillation, heart failure with preserved ejection fraction,
  18| hypothyroidism, and osteoarthritis of both knees. There is a remote
  19| history of stomach upset when a nonsteroidal drug was used, so none is on
  20| the list now. She lives alone and uses a cane outside the apartment. Her
  21| daughter fills the pill box on weekends and checks weights by phone.
  22| 
  23| Current regimen, confirmed label by label:
  24| apixaban 2.5 mg PO BID
  25| metoprolol succinate 25 mg PO daily
  26| furosemide 20 mg PO every morning
  27| potassium chloride 10 mEq PO daily with breakfast
  28| levothyroxine 75 mcg PO daily on an empty stomach
  29| amlodipine 2.5 mg PO daily
  30| acetaminophen 650 mg PO TID with meals
  31| cholecalciferol 1000 units PO daily
  32| docusate sodium 100 mg PO BID
  33| senna 8.6 mg PO at bedtime PRN no stool for two days
  34| 
  35| Apixaban is at the reduced strength on purpose. She meets two labeled
  36| reduction criteria by age and by a weight of 52 kg, so 2.5 mg twice daily
  37| is correct. Creatinine did not have to be high for that decision. She
  38| should not double a missed dose. No aspirin was added.
  39| 
  40| Vitals at the last clinic check, which the daughter read from a pocket
  41| card:
  42| blood pressure seated 132/68 mmHg, standing 118/60 mmHg
  43| heart rate seated 62 beats per minute, standing 74 beats per minute
  44| weight 52 kg
  45| temperature 36.5 C
  46| oxygen saturation 95 percent on room air
  47| 
  48| Laboratory results on that same card:
  49| sodium 138 mmol/L
  50| potassium 4.0 mmol/L
  51| chloride 104 mmol/L
  52| bicarbonate 25 mmol/L
  53| creatinine 1.2 mg/dL
  54| glucose 98 mg/dL
  55| hemoglobin 11.4 g/dL
  56| TSH 2.4 mIU/L
  57| 
  58| The potassium and the modest furosemide dose can stay together.
  59| Levothyroxine is at goal by the TSH and should stay separated from
  60| calcium and from the morning antacid she used to take. That antacid and a
  61| bedtime diphenhydramine product were both stopped. Diphenhydramine is a
  62| poor sleep aid at this age because of confusion and falls, and
  63| acetaminophen alone covers the knee pain. The daughter was told to buy
  64| plain acetaminophen, not a combination night tablet.
  65| 
  66| Counseling covered slow rising, a daily weight, and a call for a gain of
  67| three pounds, for new swelling, for black stools, or for a cough that
  68| wakes her. Breakfast should wait at least thirty minutes after
  69| levothyroxine, and apixaban can be taken with that meal or without it.
  70| Amlodipine is the medicine to revisit if seated systolic readings stay
  71| near the current number, because a beta blocker and a diuretic are already
  72| on board and the standing pressure is softer. No dose was changed on this
  73| call. The interaction screen found no further pair that had to be stopped.
  74| Fall precautions were reviewed, including night lighting and avoiding a
  75| rush to the bathroom after the evening senna. Constipation care stays with
  76| scheduled docusate and senna only after two days without a stool, so she
  77| is not taking a stimulant every night. Fluid advice was modest: she should
  78| not tank up, because of heart failure, and should not restrict so hard
  79| that the standing pressure falls further. The daughter will report
  80| dizziness, a new limp, or any vomit that looks like coffee grounds. Black
  81| stool teaching used plain language and she repeated it back. A thirty-day
  82| supply of each chronic medicine was queued. Inhalers are not part of this
  83| list, and no nebulizer was requested. The prescriber does not need a new
  84| prior authorization for these strengths. Refill status can be viewed at
  85| https://plumstreet.example.net/refill.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.