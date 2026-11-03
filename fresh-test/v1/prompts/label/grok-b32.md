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


=== DOCUMENT fd-0199 ===
   1| DISCHARGE SUMMARY
   2| 
   3| Principal diagnosis: aspiration pneumonia, improved, with a concurrent exacerbation of chronic obstructive pulmonary disease.
   4| Additional diagnoses: Parkinson disease, oropharyngeal dysphagia, and allergic rhinitis.
   5| Disposition: home with his son after swallow teaching. A referral was placed to speech therapy and to pulmonology as outpatient services.
   6| 
   7| History of present illness. The patient is a 71-year-old man who came in with two days of fever, productive cough, and a choking spell while drinking water. Parkinson disease was diagnosed in 2017 and has caused a soft voice, a shuffling gait, and slowing of his swallow. A videofluoroscopic swallow study in 2022 showed delayed initiation and silent aspiration of thin liquids. He had been eating in bed. His son, who is 44 and lives nearby, noticed milder confusion than the patient's usual baseline and brought him in.
   8| 
   9| Past history. COPD has been present since 2014, with two exacerbations treated with steroids in recent years, though not with intubation. Allergic rhinitis is longstanding and is the reason he keeps Allegra at home. There is no heart failure, no prior stroke, and no gastrointestinal bleeding. He stopped tobacco years ago. Home medicines were carbidopa-levodopa 25/100 mg PO TID, tiotropium 18 mcg inhaled once daily, fluticasone-salmeterol 250/50 one inhalation BID, Allegra 180 mg PO daily, and aspirin 81 mg PO daily. He has no known drug allergy. The brand Allegra and the generic fexofenadine were both listed on old bottles, and only one was continued.
  10| 
  11| Examination and data. Temperature 38.4 C, blood pressure 128/72 mmHg, heart rate 104 beats per minute, respiratory rate 24 breaths per minute, and oxygen saturation 88 percent on room air, improving to 95 percent on 3 liters by nasal cannula. Crackles were heard at the right base. The examination fit Parkinson disease, with resting tremor, rigidity, and a stooped posture, and there was no new hemiparesis. White blood cell count 16.2 thousand per microliter, hemoglobin 13.4 g/dL, platelets 210 thousand per microliter, sodium 133 mmol/L, potassium 3.8 mmol/L, creatinine 1.0 mg/dL, glucose 142 mg/dL, and lactate 1.4 mmol/L. Procalcitonin was 0.8 ng/mL. Chest radiograph showed a right lower lobe infiltrate without a large effusion. Blood cultures were sent before antibiotics.
  12| 
  13| Hospital course. He was transfered from the emergency department to the ward on supplemental oxygen. Ceftriaxone 1 g IV q24h and azithromycin 500 mg IV daily were begun for pneumonia. Azithromycin was stopped when the legionella antigen came back negative, and ceftriaxone was changed to amoxicillin-clavulanate 875 mg PO BID to complete seven days. Prednisone was given as 40/30/20/10 mg PO each morning for the COPD flare, two days at each step, with food. Glucose stayed under 180 mg/dL without insulin. A bedside swallow evaluation was followed by a repeat videofluoroscopic swallow study, wich confirmed ongoing risk with thin liquids and safer handling of nectar-thick liquids and soft solids. Speech therapy practiced chin tuck and smaller bites. Oxygen was weaned to room air, and resting saturation stayed stabel at 94 percent. He walked with a walker and standby assist. Carbidopa-levodopa was kept on the home schedule. The covering pharmacist stopped the duplicate fexofenadine so that Allegra 180 mg PO daily was the only antihistamine. We reccomend that the son set out the levodopa doses and watch the evening meal.
  14| 
  15| Discharge medications.
  16| Amoxicillin-clavulanate 875 mg PO BID for the remaining days of a seven-day course.
  17| Prednisone 40/30/20/10 mg PO each morning, two days at each step, then stop.
  18| Carbidopa-levodopa 25/100 mg PO TID.
  19| Tiotropium 18 mcg inhaled once daily.
  20| Fluticasone-salmeterol 250/50 mcg one inhalation BID.
  21| Allegra 180 mg PO daily. Do not also take fexofenadine.
  22| Aspirin 81 mg PO daily.
  23| Albuterol 2 puffs inhaled every 4 hours as needed for wheeze.
  24| Acetaminophen 650 mg PO every 6 hours as needed for fever.
  25| 
  26| Follow-up and precautions. He should return for worse dyspnea, new fever, chest pain, or confusion that comes back. Liquids at home should stay nectar-thick until speech therapy says otherwise. Meals are best taken upright, with no lying back for half an hour. His son will stay overnight for the first several nights. Pulmonology follow-up is requested to review whether the inhaled combination should continue, and neurology follow-up is requested for the Parkinson disease medicines. The instructions were read back by the patient and his son.
  27| 
  28| Signed by the discharging hospitalist for the inpatient team.
=== END DOCUMENT ===

=== DOCUMENT fd-0157 ===
   1| DISCHARGE SUMMARY
   2| 
   3| Principal diagnosis: acute pulmonary embolism involving segmental branches of the right lower lobe, without right heart strain.
   4| Additional diagnoses: left popliteal deep vein thrombosis, type 2 diabetes mellitus, chronic lumbar radiculopathy, obesity, and former tobacco use.
   5| Disposition: home with her daughter, with a referral to Pain Clinic for persistent radicular pain and a request that Diabetes Center review the insulin plan.
   6| 
   7| History of present illness. The patient is a 64-year-old woman who came to the emergency department with two days of pleuritic chest pain and new dyspnea. She had been less active because of lumbar pain and had taken a long car ride to visit family earlier in the week. She denied hemoptysis, syncope, and leg swelling at first, though the left calf was tender on examination. Symptoms began gradually and then limited her to a few steps before she needed to stop. Her daughter, who is 41, stayed with her and confirmed that the patient had been skipping walks since the back pain flared. Her Wells score for pulmonary embolism was 6, from clinical signs of deep vein thrombosis and an alternative diagnosis less likely than embolism. Heart rate remained under 100 beats per minute. Given the score and the hypoxemia, CT pulmonary angiography was obtained rather than a D-dimer alone.
   8| 
   9| Past history. Type 2 diabetes was diagnosed in 2019 and has been managed with metformin and, more recently, basal insulin. Lumbar radiculopathy has been present since 2021 after a lifting injury, with MRI at that time showing degenerative disc disease and foraminal narrowing at L4-L5. She has had no prior venous thromboembolism, no known cancer, and no recent surgery. Family history is notable for diabetes in her mother and for no early sudden death.
  10| 
  11| Outside records. A disc of imaging was sent from Outside Hospital and showed the earlier lumbar MRI plus a chest radiograph from a respiratory illness that was read as clear. Those images were reviewed with radiology and did not change the plan. No further outside studies were pending at discharge.
  12| 
  13| Medications before admission.
  14| Metformin 1000 mg PO BID.
  15| Insulin glargine 18 units subcutaneously at bedtime.
  16| Lyrica 75 mg PO BID for neuropathic pain, reconciled on admission to pregabalin 75 mg PO BID so that brand and generic would not be taken together.
  17| Acetaminophen 650 mg PO every 6 hours as needed.
  18| Ibuprofen had been used most days and was stopped on arrival because of the clot and the kidney risk.
  19| Atorvastatin 20 mg PO nightly.
  20| Lisinopril 10 mg PO daily.
  21| 
  22| Allergies. She reports a rash with sulfamethoxazole and tolerates penicillins.
  23| 
  24| Examination and data on arrival. Temperature 37.2 C, blood pressure 138/76 mmHg, heart rate 96 beats per minute, respiratory rate 22 breaths per minute, and oxygen saturation 91 percent on room air, improving to 96 percent on 2 liters by nasal cannula. Body mass index was 34 kg/m2. Lungs were clear. Heart sounds were regular without a murmur. The left calf was 2 cm larger than the right and tender along the popliteal fossa. Lumbar flexion was limited. Strength was intact in both legs and straight-leg raise reproduced the left-sided radicular pain.
  25| 
  26| Labs. Hemoglobin 12.8 g/dL, white blood cell count 9.4 thousand per microliter, platelets 246 thousand per microliter. Sodium 138 mmol/L, potassium 4.1 mmol/L, chloride 102 mmol/L, bicarbonate 24 mmol/L, blood urea nitrogen 16 mg/dL, creatinine 0.9 mg/dL, and glucose 168 mg/dL. D-dimer was elevated at 2.4 mg/L FEU. Troponin I was 0.02 ng/mL and did not rise. NT-proBNP was 180 pg/mL. INR was 1.0. Hemoglobin A1c was 7.8 percent.
  27| 
  28| Imaging and procedures. Lower extremity duplex ultrasound demonstrated an occlusive thrombus in the left popliteal vein. CT pulmonary angiography showed filling defects in segmental arteries of the right lower lobe. There was no saddle embolus and no right ventricular enlargement. A limited echocardiogram showed normal left ventricular systolic function and no large pericardial effusion.
  29| 
  30| Hospital course. Unfractionated heparin was given as an intravenous bolus and infusion, then changed to apixaban once the hemoglobin was stable and she could swallow her medicines. Back pain limited walking at first, so physical therapy worked with her twice a day. Because she had been taking ibuprofen daily, a steroid taper was chosen for the radicular flare instead of another nonsteroidal anti-inflammatory drug. Prednisone was written as 40/30/20/10 mg PO daily, with each dose used for five days and taken in the morning. Pantoprazole 40 mg PO daily was added for the length of that taper. Fingerstick glucose rose into the low 200s mg/dL, and insulin glargine was increased from 18 units to 20 units at bedtime. The covering pharmacist reconciled Lyrica with pregabalin so the brand and the generic would not both be given. Oxygen was weaned to room air, with saturation 95 percent at rest and 93 percent during a short walk. Diabetes teaching covered hypoglycemia and what to do with insulin on a sick day. A referral to Pain Clinic was placed so that a lumbar epidural can be considered if the leg pain is still limiting after the taper. Diabetes Center was asked to see her in clinic to decide whether a GLP-1 receptor agonist should be added to metformin.
  31| 
  32| Anticoagulation counseling. She will take apixaban 10 mg PO BID for the first seven days and then apixaban 5 mg PO BID. Bleeding precautions and the signs of a recurrent clot were reviewed with her and with her daughter. Treatment is planned for at least three months and will be reconsidered at the anticoagulation visit.
  33| 
  34| Discharge medications.
  35| Apixaban 10 mg PO BID for seven days, then apixaban 5 mg PO BID.
  36| Prednisone 40/30/20/10 mg PO daily, each step for five days.
  37| Pantoprazole 40 mg PO daily during the prednisone taper, then stop.
  38| Pregabalin 75 mg PO BID. She should not also take Lyrica.
  39| Acetaminophen 650 mg PO every 6 hours as needed for pain.
  40| Metformin 1000 mg PO BID with meals.
  41| Insulin glargine 20 units subcutaneously at bedtime.
  42| Atorvastatin 20 mg PO nightly.
  43| Lisinopril 10 mg PO daily.
  44| Docusate 100 mg PO BID as needed for constipation while activity is limited.
  45| 
  46| Follow-up and precautions. She should return for chest pain, worsening dyspnea, fainting, black stools, or new leg swelling. Glucose checks were requested twice daily during the prednisone taper. She may walk as tolerated and should stand and stretch during any car ride that lasts more than an hour. Her daughter will stay in the home for the first week. The instructions were read back by the patient, and the covering pharmacist checked the anticoagulant pack before discharge. Signed by the discharging hospitalist for the inpatient team.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.