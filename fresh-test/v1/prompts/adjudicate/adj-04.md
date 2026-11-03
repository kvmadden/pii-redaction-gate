You are the adjudicator, the third labeler, for a blind test set for a clinical text de-identification tool. All documents are synthetic. Two labelers (A and B) labeled each document independently. Below are the documents and the places where A and B disagree, plus strings the document's author says are identifiers that neither labeler marked. Decide each case from the document text and the fixed policy and conventions.

You may read fresh-test-spec.md in your working directory (pasted below). Never run commands that change anything.

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

HOW TO ANSWER
Each document has a list of items. Items named D1, D2, ... are disputes: each shows labeler A's spans and labeler B's spans for the same stretch of text, with the line number. Items named C1, C2, ... are author candidates: a string the author says is an identifier of the given type that neither labeler marked at that line. Items named K1, K2, ... are KEEP candidates: a clinical span that only one labeler marked.

For every D and C item output one JSON line:
{"d": "D3", "res": "A", "u": false, "why": "short reason"}
- res "A": take labeler A's spans for this item as written. "B": take B's. "none": no span should be labeled there. "custom": give your own spans in "spans". "disputed": only if the document text and the fixed policy truly cannot settle it.
- For a C item, "A" means: label it with the author's string and type as shown. "none" means: it is not an identifier in this context (for example the word is used as an ordinary word, or a clinical term).
- "custom" needs "spans": [{"l": 12, "q": "exact text", "o": 1, "t": "NAME", "p": "identifier"}] with l the line number, q the exact text copied from the document without the line prefix, o the occurrence on that line (omit when 1), t the type and p the policy.
- "u": true if you are unsure or a careful clinician could reasonably disagree. "why": at most 20 words.
For the K items output ONE line per document: {"k_reject": ["K2"], "k_unsure": ["K4"]}. k_reject lists KEEP candidates that are not clinical content that must survive (or that are wrongly drawn). k_unsure lists ones you are unsure about. Everything not in k_reject is accepted. Output the line even when both lists are empty.
Output one block per document in this form and nothing else. Include a line for EVERY D and C item:

<<<RES doc-id>>>
{"d": "D1", "res": "B", "u": false, "why": "..."}
{"k_reject": [], "k_unsure": []}
<<<END>>>


=== DOCUMENT fd-0149 ===
   1| Hearthstone Imaging
   2| Neuroradiology Report
   3| 
   4| Patient: Kaveri Elangovan
   5| DOB: August 2, 1933
   6| Age/sex: 92F
   7| MRN: 9022441
   8| Accession: HCT-26-33091
   9| Plan member no.: 66291-44
  10| Exam: CT head without contrast
  11| Collected: 04.03.2026
  12| Ordering: Dr. Paul Redmond
  13| Device: pacemaker serial PM8-4419-KX2
  14| Phone: +1 603 555-0174
  15| Address: 418 Willow Mercer Lane, Bellwether, NH 03244
  16| Son and historian: Mr. Curtis Glasgow
  17| 
  18| CLINICAL INDICATION
  19| Fall from standing at home, with impact to the occiput. Mr. Curtis Glasgow's
  20| account is that his mother reached for a cupboard, missed the shelf, and
  21| struck the back of her head on the counter edge. She did not lose
  22| consciousness. Glasgow Coma Scale on arrival to the scanner was 14
  23| (eyes 4, verbal 4, motor 6), with mild confusion about the date.
  24| She is anticoagulated for atrial fibrillation. The pacemaker was
  25| interrogated by the device clinic before transport and was functioning.
  26| Robin Moon, the CT technologist, confirmed the device card against the
  27| header before the scout image.
  28| 
  29| TECHNIQUE
  30| Noncontrast helical CT of the head from the foramen magnum through the
  31| vertex, 2.5 mm reconstructions in bone and soft-tissue algorithms.
  32| Dose-reduction settings were used. No iodinated contrast.
  33| 
  34| COMPARISON
  35| No comparision study is available in this archive.
  36| 
  37| FINDINGS
  38| No acutue intracranial hemorrhage. No extra-axial collection. No midline
  39| shift. The ventricles are prominent, in keeping with volume loss, and
  40| there is periventricular hypoattenuation consistent with chronic
  41| small-vessel change. No territorial hypodensity. The basal cisterns are
  42| patent. The visualized orbits and mastoids are unremarkable. Calvarial
  43| cortical irregularity at the occiput has no depressed fragment and no
  44| pneumocephalus.
  45| 
  46| Scout images include the upper chest. A left pectoral pacemaker
  47| generator is present, with two leads projecting toward the right atrium
  48| and right ventricle. A seperate note in the chart records that the
  49| generator serial is PM8-4419-KX2. No acute osseous abnormality is seen
  50| on the included spine.
  51| 
  52| Laboratory values from the same visit: hemoglobin 11.4 g/dL, platelets
  53| 188,000/uL, creatinine 0.9 mg/dL, sodium 138 mmol/L, and glucose
  54| 126 mg/dL. Blood pressure in the department was 168/78 mmHg and the
  55| paced heart rate was 62 beats per minute.
  56| 
  57| Medicines verified with the son: apixaban 5 mg PO BID, last dose held
  58| after the fall; metoprolol tartrate 25 mg PO BID; donepezil 10 mg PO
  59| QHS; acetaminophen 650 mg PO q6h PRN headache. No new contrast-related
  60| medicine was given.
  61| 
  62| The scalp soft tissues show a small crescent of swelling over the
  63| occiput, measuring about 1.8 cm, without a foreign body. The paranasal
  64| sinuses and mastoid air cells are clear. Gray-white differentiation is
  65| preserved in the cerebral hemispheres and in the posterior fossa. No
  66| hyperdense artery sign is present in the proximal middle cerebral
  67| arteries. Dental artifact limits the anterior fossa floor but does not
  68| hide a sizable bleed.
  69| 
  70| The study was discussed with the ordering clinician by telephone.
  71| Observation, a repeat neurologic check, and continued hold of the morning
  72| anticoagulant were advised from the imaging side, with final medical
  73| decisions left to the referring service. The son remained in the waiting
  74| room for the result. No additional imaging of the cervical spine was
  75| performed under this accession.
  76| 
  77| IMPRESSION
  78| 1. No acute intracranial hemorrhage, mass effect, or depressed skull
  79| fracture after a ground-level fall.
  80| 2. Cerebral volume loss and chronic small-vessel ischemic change.
  81| 3. Pacemaker generator and leads as described. Glasgow Coma Scale and
  82| the anticoagulation history were used only as clinical context for this
  83| dictation.
  84| 
  85| Interpreted by Dr. Clara Smythe-Collins, neuroradiology.
  86| End of report.
=== END DOCUMENT ===
ITEMS FOR fd-0149:
D1 | line 54 | A: KEEP "Blood pressure in the department was 168/78 mmHg" | B: KEEP "168/78 mmHg"
D2 | line 55 | A: KEEP "paced heart rate was 62 beats per minute" | B: KEEP "62 beats per minute"
K1 | line 30 | KEEP "Noncontrast helical CT of the head"
K2 | line 38 | KEEP "acutue intracranial hemorrhage"
K3 | line 38 | KEEP "extra-axial collection"
K4 | line 38 | KEEP "midline\nshift"
K5 | line 39 | KEEP "volume loss"
K6 | line 40 | KEEP "periventricular hypoattenuation"
K7 | line 40 | KEEP "chronic\nsmall-vessel change"
K8 | line 41 | KEEP "territorial hypodensity"
K9 | line 44 | KEEP "pneumocephalus"
K10 | line 49 | KEEP "acute osseous abnormality"
K11 | line 59 | KEEP "headache"
K12 | line 63 | KEEP "foreign body"
K13 | line 66 | KEEP "hyperdense artery sign"
K14 | line 74 | KEEP "imaging of the cervical spine"
K15 | line 78 | KEEP "acute intracranial hemorrhage"
K16 | line 78 | KEEP "mass effect"
K17 | line 78 | KEEP "depressed skull\nfracture"
K18 | line 80 | KEEP "Cerebral volume loss"
K19 | line 80 | KEEP "chronic small-vessel ischemic change"

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
ITEMS FOR fd-0157:
D1 | line 9 | A: KEEP "basal insulin" | B: KEEP "insulin"
D2 | line 11 | A: KEEP "lumbar MRI" | B: KEEP "MRI"
D3 | line 17 | A: KEEP "every 6 hours" ; KEEP "as needed" | B: KEEP "every 6 hours as needed"
D4 | line 24 | A: KEEP "oxygen saturation 91 percent on room air, improving to 96 percent" | B: KEEP "oxygen saturation 91 percent"
D5 | line 28 | A: KEEP "occlusive thrombus" | B: KEEP "thrombus in the left popliteal vein"
D6 | line 28 | A: KEEP "limited echocardiogram" | B: KEEP "echocardiogram"
D7 | line 39 | A: KEEP "every 6 hours" ; KEEP "as needed" | B: KEEP "every 6 hours as needed"
K1 | line 3 | KEEP "right heart strain"
K2 | line 4 | KEEP "former tobacco use"
K3 | line 5 | KEEP "radicular pain"
K4 | line 5 | KEEP "insulin"
K5 | line 7 | KEEP "Heart rate remained under 100 beats per minute"
K6 | line 7 | KEEP "hypoxemia"
K7 | line 9 | KEEP "foraminal narrowing at L4-L5"
K8 | line 9 | KEEP "cancer"
K9 | line 9 | KEEP "diabetes"
K10 | line 22 | KEEP "rash"
K11 | line 24 | KEEP "2 liters"
K12 | line 24 | KEEP "nasal cannula"
K13 | line 24 | KEEP "straight-leg raise"
K14 | line 24 | KEEP "radicular pain"
K15 | line 28 | KEEP "saddle embolus"
K16 | line 28 | KEEP "right ventricular enlargement"
K17 | line 28 | KEEP "pericardial effusion"
K18 | line 30 | KEEP "hemoglobin"
K19 | line 30 | KEEP "physical therapy"
K20 | line 30 | KEEP "twice a day"
K21 | line 30 | KEEP "in the morning"
K22 | line 30 | KEEP "Fingerstick glucose rose into the low 200s mg/dL"
K23 | line 30 | KEEP "Oxygen"
K24 | line 30 | KEEP "saturation 95 percent at rest and 93 percent"
K25 | line 30 | KEEP "Diabetes teaching"
K26 | line 30 | KEEP "hypoglycemia"
K27 | line 40 | KEEP "with meals"
K28 | line 44 | KEEP "as needed"
K29 | line 44 | KEEP "constipation"
K30 | line 46 | KEEP "Glucose checks"

=== DOCUMENT fd-0163 ===
   1| TRANSCRIPT OF CLINICAL NURSE TRIAGE CALL
   2| SERVICE: Neurology
   3| CROSS-REFERENCE: Outside Hospital records received
   4| PATIENT PROFILE: 74-year-old female
   5| CALL PARTICIPANTS: Triage Nurse, Patient's Daughter
   6| 
   7| [Call Audio Recording Begins]
   8| 
   9| Triage Nurse: Neurology triage line, this is the triage nurse. How can I help you today?
  10| 
  11| Patient's Daughter: Hello, uh, yes, good morning. I'm calling about my mother. She is, uh, she is a 74-year-old patient seen in your movement disorder clinic, and I'm calling because her tremors and neuropathic pain have, uh, have gotten significantly worse over the past couple of weeks. We also received her consultation notes from Outside Hospital where she had an admission last year, and they suggested we contact her regular clinic to adjust her medicaiton.
  12| 
  13| Triage Nurse: Okay, I have her electronic health record pulled up on my screen. I see she was diagnosed with Parkinson disease back in 2021, and she also has documented diabetic peripheral neuropathy and degenerative lumbar canal stenosis. Can you tell me what symptoms she is experiencing right now?
  14| 
  15| Patient's Daughter: Well, um, her resting tremor in the right hand has become much more pronounced, and she describes a severe burning, shooting pain in both lower extremities, from the calves down into the feet. She says the pain is an 8 out of 10. She also had a recent flare of inflammatory radiculopathy. The covering physician at Outside Hospital started her on a steroid burst with prednisone 40/30/20/10 mg tapering down by 10 mg every four days. She completed that taper last week, but as soon as the prednisone finished, the neuropathic burning rebounded with a vengeance.
  16| 
  17| Triage Nurse: I see the discharge summary from Outside Hospital in our document viewer. Let me reivew her current medication list. For her Parkinson disease, she is taking carbidopa-levodopa 25/100 mg PO TID. And for the peripheral neuropathy, she was on gabapentin 300 mg PO TID, but according to the outside note, they transitioned her to brand Lyrica 75 mg PO BID. Has she started the Lyrica yet?
  18| 
  19| Patient's Daughter: Yes, she began taking the Lyrica 75 mg PO BID four days ago. It seems to take the edge off slightly, but she complains of marked grogginess in the morning, and her walking is unsteady. We checked her vital signs this morning using her automated home cuff. Her blood pressure was 118/72 mmHg, heart rate was 64 bpm, respiratory rate was 16 breaths per minute, and her fingerstick blood glucose was 142 mg/dL.
  20| 
  21| Triage Nurse: Those vital signs are stable, but the somnolence and unsteady gait can increase her fall risk, especially given her underlying motor fluctuations. Did Outside Hospital obtain any updated neuroimaging or laboratory work during her stay?
  22| 
  23| Patient's Daughter: Yes, they did a lumbar spine magnetic resonance imaging without contrast, which showed moderate L4-L5 spinal stenosis with facet arthropathy, but no acute cord compression. Her recent labs showed serum creatinine 1.1 mg/dL, blood urea nitrogen 18 mg/dL, serum potassium 4.2 mEq/L, and hemoglobin A1c 6.8%. Her hepatic function panel was completely within normal limits, with AST 22 U/L and ALT 19 U/L.
  24| 
  25| Triage Nurse: That is very helpful. Because her neuropathic pain remains refractory and she had excessive sedation from titration, she may benefit from an interdisciplinary referral to Pain Clinic for targeted lumbar epidural steroid injection evaluation. Additionally, looking at her skin assessment from the home health report, she has a stage 2 sacral pressure injury that requires specialized dressing management, so I am submitting an urgent referral to Wound Care as well.
  26| 
  27| Patient's Daughter: That would be wonderful. The home health nurse said the sacral area has minimal serosanguinous drainage and no cellulitis, but Wound Care would definitely know the best barrier dressings. What should we do about her morning grogginess and the Lyrica?
  28| 
  29| Triage Nurse: I will send a clinical priority message to the attending neurologist. The plan will likely be to shift her dosing schedule so she takes Lyrica 75 mg PO at bedtime only for the next five days to allow her body to acclimate, rather than taking it twice daily. For her Parkinson disease motor symtpoms, the neurologist may evaluate whether adjusting the carbidopa-levodopa timing or adding an adjunct dopamine agonist is indicated. Please monitor her closely when she mobilizes, ensure her four-wheel walker is always within arm's reach, and assist her with transfers.
  30| 
  31| Patient's Daughter: Understood. We will keep her walker right by her chair, assist with walking, and wait for the pharmacy update regarding shifting the Lyrica dose to nighttime.
  32| 
  33| Triage Nurse: Excellent. If she experiences any acute worsening of weakness, inability to bear weight, bowel or bladder incontinence, or acute confusion, take her to the nearest emergency department right away. Otherwise, our clinical coordinator will call you back this afternoon once the neurologist reviews the chart.
  34| 
  35| Patient's Daughter: Thank you so much for your thorough help.
  36| 
  37| Triage Nurse: You are very welcome. Take care.
  38| 
  39| [Call Audio Recording Concluded]
=== END DOCUMENT ===
ITEMS FOR fd-0163:
D1 | line 23 | A: KEEP "lumbar spine magnetic resonance imaging without contrast" | B: KEEP "magnetic resonance imaging without contrast"
K1 | line 9 | KEEP "Neurology"
K2 | line 11 | KEEP "movement disorder clinic" [labeler unsure]
K3 | line 11 | KEEP "neuropathic pain" [labeler unsure]
K4 | line 15 | KEEP "8 out of 10" [labeler unsure]
K5 | line 15 | KEEP "10 mg"
K6 | line 23 | KEEP "L4-L5 spinal stenosis"
K7 | line 23 | KEEP "facet arthropathy"
K8 | line 23 | KEEP "acute cord compression"
K9 | line 25 | KEEP "neuropathic pain" [labeler unsure]
K10 | line 25 | KEEP "home health" [labeler unsure]
K11 | line 25 | KEEP "stage 2 sacral pressure injury"
K12 | line 27 | KEEP "home health" [labeler unsure]
K13 | line 27 | KEEP "cellulitis"
K14 | line 27 | KEEP "Lyrica"
K15 | line 33 | KEEP "bowel or bladder incontinence" [labeler unsure]
K16 | line 33 | KEEP "acute confusion" [labeler unsure]

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
ITEMS FOR fd-0164:
K1 | line 30 | KEEP "neck surgery"
K2 | line 43 | KEEP "myelopathy"
K3 | line 44 | KEEP "radicular deficit"

=== DOCUMENT fd-0170 ===
   1| CLEARWATER MEDICAL LABORATORIES
   2| SURGICAL PATHOLOGY REPORT
   3| 
   4| PATIENT: YURTSEVER, CEMAL
   5| HOME ADDRESS: 842 Crestview Terrace, Bellevue, WA 98004
   6| TELEPHONE: (206) 555-0142
   7| MRN / MASTER ID: 7142 0839 51
   8| ACCESSION NUMBER: SP-2026-88341
   9| ORDERING PHYSICIAN: Dr. Alistair MacIntyre
  10| PATHOLOGIST: Dr. Bradley Keller
  11| EMERGENCY CONTACT: Dagmara Dvořáková (sister)
  12| Date of Service: Oct 14 2026
  13| Report Date: Oct 16 2026
  14| 
  15| SPECIMEN SUBMITTED:
  16| Prostate needle core biopsies (12 cores, designated A through L).
  17| 
  18| CLINICAL INDICATION:
  19| Elevated serum PSA of 7.8 ng/mL and abnormal digital rectal examination.
  20| Prior transrectal ultrasound noted hypoechoic nodule in left peripheral
  21| zone. Patient is a 65-year-old male presenting with urinary frequency.
  22| Serum PSA density was calculated at 0.16 ng/mL2 based on a prostate
  23| volume of 48 cc measured on recent pelvic MRI.
  24| 
  25| GROSS DESCRIPTION:
  26| Specimen received in twelve formalin-filled containers, each labeled
  27| with patient identifiers and designated part letters A through L.
  28| Part A: Labeled "right apex", consists of two tan-white cylindrical
  29| tissue cores measuring 1.2 cm and 1.4 cm in length, entirely submitted.
  30| Part B through Part L: Each consists of one to three tan cylindrical
  31| cores measuring between 0.9 cm and 1.6 cm in length, processed in routine
  32| fashion without complication.
  33| 
  34| MICROSCOPIC EXAMINATION:
  35| Sections of Mr. Yurtsever's prostate core biopsies were examined under
  36| standard light microscopy following hematoxylin and eosin staining.
  37| 
  38| Parts A through E (Right lobe cores):
  39| Cores show benign prostatic glandular tissue and fibromuscular stroma.
  40| No acute or chronic prostatitis is identified. No atypia or malignancy.
  41| 
  42| Part F (Left mid gland peripheral zone):
  43| Infiltrating small, crowded, distinct and well-formed neoplastic glands
  44| infiltrating between benign acini. The neoplastic cells display nuclear
  45| enlargement, prominent nucleoli, and absence of basal cell layer,
  46| confirmed by immunohistochemical cocktail (p63 and high-molecular-weight
  47| cytokeratin negative; AMACR/racemase positive). Appropriate positive and
  48| negative external controls reacted as expected.
  49| Gleason pattern: 3 + 4 = 7 (Grade Group 2).
  50| Tumor involves approximately 35% of the core length (5 mm of 14 mm).
  51| No perineural invasion is identified in this part.
  52| 
  53| Part G (Left apex):
  54| Adenocarcinoma, acinar type.
  55| Gleason pattern: 3 + 3 = 6 (Grade Group 1).
  56| Tumor involves approximately 15% of the core length.
  57| 
  58| Parts H through L (Remaining left base and lateral cores):
  59| Benign prostatic hypertrophy with focal stromal hyperplasia.
  60| No evidence of extraprostatic extension or lymphovascular invasion.
  61| 
  62| FINAL DIAGNOSIS:
  63| Acinar adenocarcinoma of the prostate, involving left mid gland and
  64| left apex (2 of 12 cores positive).
  65| Primary Gleason score: Gleason score 3 + 4 = 7, Grade Group 2.
  66| Secondary Gleason pattern 4 comprises approximately 10% of tumor volume.
  67| Surgical margins cannot be assessed on needle core biopsy.
  68| 
  69| COMMENT:
  70| The histology and immunohistochemistry results were reviewed with the
  71| ordering clinician, Dr. Alistair MacIntyre. Patient Cemal Yurtsever will
  72| be scheduled for consultation regarding active surveillance versus
  73| definitive treatment options. Multidisciplinary tumor board review is
  74| recommended prior to final management selection.
  75| 
  76| Signed,
  77| Dr. Bradley Keller, MD, FCAP
  78| Clearwater Medical Laboratories
=== END DOCUMENT ===
ITEMS FOR fd-0170:
D1 | line 49 | A: KEEP "Gleason pattern: 3 + 4 = 7 (Grade Group 2)" | B: KEEP "Gleason pattern: 3 + 4 = 7" ; KEEP "Grade Group 2"
D2 | line 55 | A: KEEP "Gleason pattern: 3 + 3 = 6 (Grade Group 1)" | B: KEEP "Gleason pattern: 3 + 3 = 6" ; KEEP "Grade Group 1"
D3 | line 65 | A: KEEP "Primary Gleason score: Gleason score 3 + 4 = 7, Grade Group 2" | B: KEEP "Gleason score 3 + 4 = 7" ; KEEP "Grade Group 2"
D4 | line 66 | A: KEEP "Secondary Gleason pattern 4" | B: KEEP "Gleason pattern 4"
K1 | line 2 | KEEP "SURGICAL PATHOLOGY REPORT"
K2 | line 22 | KEEP "prostate\nvolume of 48 cc"
K3 | line 36 | KEEP "hematoxylin and eosin staining"
K4 | line 38 | KEEP "Parts A through E (Right lobe cores)"
K5 | line 39 | KEEP "benign prostatic glandular tissue"
K6 | line 42 | KEEP "Part F (Left mid gland peripheral zone)"
K7 | line 46 | KEEP "immunohistochemical cocktail"
K8 | line 46 | KEEP "p63 and high-molecular-weight\ncytokeratin negative"
K9 | line 47 | KEEP "AMACR/racemase positive"
K10 | line 51 | KEEP "perineural invasion"
K11 | line 53 | KEEP "Part G (Left apex)"
K12 | line 58 | KEEP "Parts H through L (Remaining left base and lateral cores)"
K13 | line 60 | KEEP "extraprostatic extension"
K14 | line 60 | KEEP "lymphovascular invasion"

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
ITEMS FOR fd-0173:
K1 | line 16 | KEEP "Request"
K2 | line 16 | KEEP "motor fluctuations"
K3 | line 18 | KEEP "one tablet"
K4 | line 18 | KEEP "with each of those doses"
K5 | line 20 | KEEP "1.5 tablets"
K6 | line 20 | KEEP "neck dyskinesia"
K7 | line 20 | KEEP "one tablet"
K8 | line 22 | KEEP "Rationale"
K9 | line 22 | KEEP "dyskinesia"
K10 | line 22 | KEEP "hepatic disease"
K11 | line 22 | KEEP "deep brain stimulator"
K12 | line 24 | KEEP "each morning"
K13 | line 30 | KEEP "Attestation"

=== DOCUMENT fd-0177 ===
   1| CRESTVIEW SPECIALTY PHARMACY
   2| PRIOR AUTHORIZATION & MEDICATION RECONCILIATION NOTE
   3| TRANSCRIBED FROM CLINICAL FAX / PORTAL REFILL QUEUE
   4| 
   5| PATIENT: SWEENEY-O'SULLIVAN, CONNOR
   6| DOB / AGE: 67-year-old male
   7| MRN: 8492014
   8| PRESCRIBER: KAUFMAN, ARTHUR, MD
   9| PRESCRIBER NPI: 1497283401
  10| CONTACT EMAIL: arthur.kaufman@example.org
  11| CLINIC PHONE: (617) 555-0128
  12| DATE OF REQUEST: 10/14/2026
  13| 
  14| CALL AND QUEUE DETAILS:
  15| Staff intake completed by Sweet, CPhT at Crestview Specialty Pharmacy following electronic transmission receipt. Outreach call made to patient home to clarify prior auth renewal documentation for biologic therapy. Patient was unavailable; spoke directly with Clara Higgins, the patient's sister and primary caregiver, who assists with medication administration and home deliveries.
  16| 
  17| CLINICAL BACKGROUND & INDICATION:
  18| Mr. Sweeney-O'Sullivan is a 67-year-old male with severe refractory plaque psoriasis and psoriatic arthritis diagnosed in October 2026. The patient also carries diagnoses of hypertension and gastroesophageal reflux disease, both managed stably on oral therapies. The rheumatology team noted extensive plaque involvement covering approximately 18% body surface area prior to starting targeted biologic treatment. Previous therapies failed due to inadequate disease control or intolerable adverse effects, including oral methotrexate 15 mg weekly discontinued due to persistent transaminitis, and adalimumab 40 mg subcutaneous every two weeks discontinued after six months due to secondary loss of efficacy. Prescriber Arthur Kaufman submitted an urgent prior authorization request for ustekinumab.
  19| 
  20| PHARMACY RECONCILIATION & LAB REVIEW:
  21| Clara Higgins reported that Connor Sweeney-O'Sullivan received his initial loading dose without complications and experienced marked clearance of cutaneous plaques. Sister confirms patient has not had any recent fever, chronic cough, or active infectious symptoms. No injection-site reactions or systemic hypersensitivity was noted following the previous administration. Patient's sister reiterated that prescription adherence has remained consistent at home. Baseline QuantiFERON-TB Gold test completed prior to initiation was negative. Recent laboratory reivew from 10/14/2026 demonstrates stable hepatic and renal profiles: AST 24 U/L, ALT 28 U/L, serum creatinine 0.94 mg/dL, and absolute neutrophil count 3,800/uL.
  22| 
  23| CURRENT MEDICATION PROFILE:
  24| 1. Ustekinumab 90 mg subcutaneous injection every 12 weeks. Prior authorization required for maintenance refil.
  25| 2. Naproxen 500 mg PO BID with meals PRN joint stiffness.
  26| 3. Omeprazole 20 mg PO daily before breakfast for gastroprotection.
  27| 4. Cholecalciferol 2,000 IU PO daily.
  28| 
  29| PLAN AND ACTIONS TAKEN:
  30| 1. Urgent prior authorization clinical narrative compiled by Hannah Sweet and forwarded to teh patient's commercial health plan along with relevant clinic notes and charted lab panels.
  31| 2. Sent secure message confirmation to Arthur Kaufman at arthur.kaufman@example.org outlining submitted authorization forms and clinical rationale.
  32| 3. Advised Clara Higgins that once approval is granted by the health plan, Crestview Specialty Pharmacy will arrange refrigerated courier delivery to their residence.
  33| 4. Follow-up scheduled for 48 hours to monitor authorization determination status.
  34| 
  35| Hannah Sweet, Lead Pharmacy Technician
  36| Crestview Specialty Pharmacy
=== END DOCUMENT ===
ITEMS FOR fd-0177:
D1 | line 11 | A: PHONE "(617) 555-0128" | B: (nothing)
K1 | line 2 | KEEP "PRIOR AUTHORIZATION & MEDICATION RECONCILIATION NOTE"
K2 | line 18 | KEEP "oral"
K3 | line 18 | KEEP "18% body surface area"
K4 | line 18 | KEEP "oral"
K5 | line 21 | KEEP "injection-site reactions"
K6 | line 21 | KEEP "systemic hypersensitivity"
K7 | line 25 | KEEP "with meals"
K8 | line 26 | KEEP "before breakfast"

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
ITEMS FOR fd-0180:
K1 | line 16 | KEEP "bleeding disorder"
K2 | line 22 | KEEP "Solar elastosis"
K3 | line 22 | KEEP "ulceration"
K4 | line 22 | KEEP "perineural invasion"
K5 | line 24 | KEEP "Medicines at the time of biopsy" [labeler unsure]
K6 | line 29 | KEEP "dermatopathology" [labeler unsure]

=== DOCUMENT fd-0181 ===
   1| St. Leander Medical Center
   2| 800 HARBOR STREET, MOSSBRIDGE, ID 83477
   3| Outpatient Progress Note
   4| Hematology and General Medicine
   5| 
   6| Patient: Ida M. Prestwick
   7| Age: 93
   8| DOB: 8 June 1932
   9| MRN: 6601943
  10| SSN: 000-28-4419
  11| Account: 7031-4482-16
  12| Date of Service: March 18, 2026
  13| Author: Neil Braddock, MD
  14| Home: 15 Quarry Lane, Mossbridge, ID 83477
  15| 
  16| Chief complaint
  17| Follow-up after excisional biopsy of a right cervical lymph node, including review of the written report.
  18| 
  19| History of present illness
  20| Ida M. Prestwick is seen with her daughter for results and a wound check. She lives in Mossbridge. About five weeks before the biopsy she noticed a firm lump below the right jaw while washing her face. It was not painful. She was evaluated in the emergency department on 2/11/2026, where examination found a mobile node and no airway concern. A contrast CT of the neck and chest showed the dominant right level II node and no bulky mediastinal disease. Excisional biopsy of that node was performed on 4 March 2026. Pain at the incision was moderate for three days and is now a tug when she turns her head. She finished no antibiotic. Swallowing has been normal, and her voice did not change. She slept in a recliner for four nights and is back in her own bed. There has been no drainage on the pillow and no temperature she or her daughter could measure since leaving the procedure area. She is more worried about the word lymphoma than about the scar, and most of today's visit was spent on that fear. She had occassional night sweats earlier in the winter, none since the biopsy, and she denies fever and unintentional weight loss. Appetite is back to usual. The two adjacent nodes were measured seperately on the CT and were both under a centimeter.
  21| 
  22| She has a remote history of Bell palsy on the left, with full recovery and no recurrence. Hypertension has been quiet. She does not drive. Her daughter drove her today, and the sedan plate 2MPL-774 was written on the transport line at registration.
  23| 
  24| Past medical history
  25| Bell palsy, left, resolved. Hypertension. Osteoarthritis of the hands. Hypothyroidism. Removal of a cataract from the right eye several years ago. No cancer. No tuberculosis. No rheumatoid arthritis.
  26| 
  27| Medications
  28| 1. Amlodipine 5 mg by mouth daily, Rx 8831204.
  29| 2. Levothyroxine 75 mcg by mouth each morning.
  30| 3. Acetaminophen 650 mg by mouth as needed, rarely used.
  31| 4. Cholecalciferol 1000 units by mouth daily.
  32| 
  33| Allergies
  34| No known drug allergies. Iodine contrast at the CT caused only a warm feeling, which was expected, and no rash.
  35| 
  36| Social history
  37| She lives in a single-level house with her daughter, Yasemin Kortan, who manages the pillbox and the calendar. She never smoked. Alcohol is none. She walks daily in the driveway with a cane she rarely leans on. She still cooks simple meals and manages her own bath. Dressing is independent. She does not climb stairs at home. Hearing is reduced on the right, and her daughter repeats questions when the room is noisy. There is no home oxygen and no CPAP. Advance directives are already on file, and she confirmed today that her daughter may speak with us about results. Daughter's phone is (208) 555-0155. The clinic direct line is 208.555.0108.
  38| 
  39| Family history
  40| Her sister died of a stroke. No family history of lymphoma was known to the daughter.
  41| 
  42| Review of systems
  43| No current fever, no drenching sweats, no pruritus, no cough, no chest pain, no abdominal pain, no change in bowel habit, no focal weakness, and no new facial droop. Sleep is fair. The remainder is negative.
  44| 
  45| Physical examination
  46| Blood pressure 146/78 mmHg, heart rate 74, respiratory rate 16, temperature 97.6 F, oxygen saturation 97 percent on room air, weight 54 kg. She is alert, oriented, and pleasant. There is no scleral icterus and no petechiae. Prestwick's incision along the right upper neck is a 4 cm line, dry, closed, with steri-strips off and no erythema, fluctuance, or drainage. No facial asymmetry and no residual weakness from the old palsy. The mouth opens fully. A small shotty node remains low in the right neck, soft and mobile. The left neck, axillae, and groins are quiet. Lungs clear. Heart regular. Abdomen soft without a palpable spleen. No leg edema.
  47| 
  48| Pathology and studies
  49| Before the slides were back, the working differential included a dental source, metastatic carcinoma from a head and neck primary, and lymphoma. The oral exam and the chest images did not show a mucosal lesion or a lung mass. Lactate dehydrogenase was not elevated on the pre-procedure panel, at 180 U/L, and the metabolic panel that day showed creatinine 0.8 mg/dL, which is why contrast was given without a renal hold. Those results were not repeated. The outside report was recieved yesterday and scanned into the chart. Excisional biopsy shows reactive follicular hyperplasia with preserved architecture. Immunohistochemistry does not support lymphoma. There is no Hodgkin lymphoma. Flow cytometry was negative for a clonal population. Caroline Hodgkin reviewed the slides this week and agrees with that reading. Her addendum is filed with the report. The blood count from the biopsy day showed hemoglobin 13.1 g/dL, white cells 6.2 x 10 to the 9 per liter, and platelets 210,000/microliter. No laboratories were drawn today.
  50| 
  51| Assessment and plan
  52| 1. Right cervical lymphadenopathy, status post excisional biopsy, with pathology showing reactive follicular hyperplasia and no lymphoma. No chemotherapy, no radiation, and no further node removal. Observe. Return sooner for a rapidly growing mass, drenching sweats, fever, or unexplained weight loss. A routine visit is set in three months.
  53| 2. Healing surgical incision. Wound care was reviewed. She may shower. No ointment is required while the skin stays closed. Call for redness, drainage, or opening. She may walk as usual and should avoid lifting more than ten pounds for another week, mostly so the neck skin is not tugged. Acetaminophen is enough for the residual soreness. A second CT is not scheduled. We will examine the neck again at three months and order imaging only for a new or enlarging node, persistent drenching sweats, or weight loss over five pounds. Her daughter will call if the incision opens.
  54| 3. Remote Bell palsy, no residual deficit on today's cranial nerve exam. No action.
  55| 4. Hypertension and hypothyroidism. Continue amlodipine and levothyroxine without change. Recheck the pressure at the next visit.
  56| 5. Transport and paperwork. The account number above is the one billing should use for the biopsy claim. Her daughter has a copy of the instructions.
  57| 
  58| She understood that the result is benign and asked that we avoid repeating the scan unless a new node appears. The plan was restated and she agreed.
  59| 
  60| Electronically signed by Neil Braddock, MD
  61| General Medicine
=== END DOCUMENT ===
ITEMS FOR fd-0181:
D1 | line 25 | A: KEEP "Osteoarthritis of the hands" | B: KEEP "Osteoarthritis"
D2 | line 46 | A: KEEP "oxygen saturation 97 percent on room air" | B: KEEP "oxygen saturation 97 percent"
K1 | line 20 | KEEP "biopsy"
K2 | line 20 | KEEP "contrast CT of the neck and chest"
K3 | line 20 | KEEP "biopsy"
K4 | line 20 | KEEP "CT"
K5 | line 34 | KEEP "Iodine contrast"
K6 | line 34 | KEEP "CT"
K7 | line 40 | KEEP "stroke"
K8 | line 49 | KEEP "metastatic carcinoma from a head and neck primary"
K9 | line 49 | KEEP "oral exam"
K10 | line 49 | KEEP "Lactate dehydrogenase was not elevated on the pre-procedure panel, at 180 U/L" [labeler unsure]
K11 | line 49 | KEEP "contrast" [labeler unsure]
K12 | line 49 | KEEP "reactive follicular hyperplasia"
K13 | line 49 | KEEP "Immunohistochemistry"
K14 | line 49 | KEEP "Flow cytometry"
K15 | line 49 | KEEP "biopsy"
K16 | line 52 | KEEP "Right cervical lymphadenopathy"
K17 | line 52 | KEEP "reactive follicular hyperplasia"
K18 | line 52 | KEEP "chemotherapy"
K19 | line 52 | KEEP "radiation"
K20 | line 52 | KEEP "node removal"
K21 | line 53 | KEEP "Healing surgical incision" [labeler unsure]
K22 | line 53 | KEEP "CT"
K23 | line 54 | KEEP "cranial nerve exam"
K24 | line 56 | KEEP "biopsy"

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
ITEMS FOR fd-0199:
D1 | line 11 | A: KEEP "oxygen saturation 88 percent on room air, improving to 95 percent" | B: KEEP "oxygen saturation 88 percent"
D2 | line 13 | A: KEEP "Glucose stayed under 180 mg/dL" | B: KEEP "180 mg"
D3 | line 23 | A: KEEP "every 4 hours" ; KEEP "as needed" | B: KEEP "every 4 hours as needed"
D4 | line 24 | A: KEEP "every 6 hours" ; KEEP "as needed" | B: KEEP "every 6 hours as needed"
K1 | line 5 | KEEP "swallow teaching"
K2 | line 5 | KEEP "speech therapy"
K3 | line 5 | KEEP "pulmonology"
K4 | line 7 | KEEP "silent aspiration"
K5 | line 9 | KEEP "one inhalation"
K6 | line 11 | KEEP "3 liters"
K7 | line 11 | KEEP "nasal cannula"
K8 | line 11 | KEEP "hemiparesis"
K9 | line 11 | KEEP "right lower lobe infiltrate"
K10 | line 11 | KEEP "Blood cultures"
K11 | line 13 | KEEP "oxygen"
K12 | line 13 | KEEP "legionella antigen"
K13 | line 13 | KEEP "Speech therapy"
K14 | line 13 | KEEP "chin tuck"
K15 | line 13 | KEEP "Oxygen"
K16 | line 13 | KEEP "resting saturation stayed stabel at 94 percent"
K17 | line 13 | KEEP "180 mg"
K18 | line 20 | KEEP "one inhalation"
K19 | line 26 | KEEP "speech therapy"
K20 | line 26 | KEEP "Pulmonology"
K21 | line 26 | KEEP "inhaled"
K22 | line 26 | KEEP "neurology"

=== DOCUMENT fd-0206 ===
   1| INPATIENT CONSULTATION REPORT
   2| DIVISION OF RHEUMATOLOGY AND CLINICAL IMMUNOLOGY
   3| Author: Fellow in Rheumatology and Clinical Immunology
   4| Supervising Attending: Attending Physician, Division of Rheumatology
   5| 
   6| REASON FOR CONSULTATION:
   7| Evaluation and inpatient management of acute polyarticular rheumatoid arthritis flare, corticosteroid taper planning, and optimization of neuropathic pain.
   8| 
   9| HISTORY OF PRESENT ILLNESS:
  10| The patient is a 56-year-old female with seropositive rheumatoid arthritis diagnosed in 2017, type 2 diabetes mellitus diagnosed in 2019, essential hypertension, and an episode of right-sided Bell palsy in 2021 that resolved completely. She was admitted to the inpatient medicine service three days ago following a severe multi-joint flare involving symmetrical swelling, warmth, and morning stiffness in bilateral wrists, metacarpophalangeal joints, proximal interphalangeal joints, and the right knee.
  11| 
  12| The flare began four weeks ago after a lapse in her baseline subcutaneous biologic regimen. Prior to admission, she was maintained on certolizumab pegol 200 mg subcutaneously every 2/3 weeks alongside oral hydroxychloroquine. Historical records and plain radiographs forwarded from Outside Hospital confirm symmetrical marginal erosions of the metacarpal heads and carpal joint space narrowing first identified in 2023.
  13| 
  14| On hospital day 1, she underwent diagnostic and therapeutic right knee arthrocentesis, yielding 38 mL of cloudy yellow synovial fluid. Synovial fluid analysis revealed a total nucleated cell count of 18,400 /uL with 78% polymorphonuclear leukocytes, negative Gram stain, and no birefringent crystals under polarizing microscopy, confirming inflammatory synovitis without septic arthritis or crystalline disease. Bacterial cultures show no growth.
  15| 
  16| Over the past 48 hours, the patient has reported burning dysesthesias over bilateral feet in a stocking pattern. Her 32-year-old daughter at the bedside confirms progressive nocturnal burning over six months and steroid-induced glucose elevations. The primary inpatient team requested consultation for corticosteroid tapering, neuropathic pain management, and specialty referrals to Diabetes Center and Pain Clinic.
  17| 
  18| PAST MEDICAL HISTORY:
  19| 1. Seropositive rheumatoid arthritis, diagnosed in 2017.
  20| 2. Type 2 diabetes mellitus, diagnosed in 2019.
  21| 3. Essential hypertension, diagnosed in 2018.
  22| 4. Right peripheral facial paralysis (Bell palsy), diagnosed in 2021, resolved.
  23| 5. Diabetic peripheral neuropathy, diagnosed in 2023.
  24| 
  25| MEDICATIONS PRIOR TO ADMISSION:
  26| 1. Certolizumab pegol 200 mg subcutaneously every 2/3 weeks (held).
  27| 2. Hydroxychloroquine sulfate 200 mg PO BID.
  28| 3. Lyrica 75 mg PO BID for neuropathic pain.
  29| 4. Allegra 180 mg PO daily for allergic rhinitis.
  30| 5. Metformin hydrochloride 1000 mg PO BID.
  31| 6. Lisinopril 20 mg PO daily.
  32| 
  33| PHYSICAL EXAMINATION:
  34| Vital Signs:
  35| Temperature: 98.6 F (37.0 C)
  36| Blood Pressure: 132/80 mmHg
  37| Pulse: 76 beats per minute, regular
  38| Respiratory Rate: 16 breaths per minute
  39| Oxygen Saturation: 98% on ambient air
  40| 
  41| General: 56-year-old female, alert, oriented, in no acute distress.
  42| HEENT: Normocephalic. Moist oral mucosa. Facial movements symmetric without residual Bell palsy.
  43| Cardiovascular: Regular rhythm, normal S1 and S2. Pulses 2+ bilaterally.
  44| Lungs: Clear to auscultation bilaterally without wheezing or crackles.
  45| Abdomen: Soft, non-tender, non-distended.
  46| Musculoskeletal: Symmetrical synovial swelling and tenderness of bilateral radiocarpal and MCP joints. Right knee with trace effusion and mild warmth without erythema, improved post-arthrocentesis.
  47| Neurological: Light touch and pinprick reduced in stocking distribution distal to mid-calves. Bilateral plantar allodynia.
  48| Vascular: Calves soft and non-tender. Wells score for deep vein thrombosis calculated at 0 points.
  49| 
  50| LABORATORY AND DIAGNOSTIC DATA:
  51| Serum Chemistry and Inflammatory Markers:
  52| Sodium: 139 mmol/L, Potassium: 4.1 mmol/L, Chloride: 102 mmol/L, Bicarbonate: 25 mmol/L, BUN: 16 mg/dL, Creatinine: 0.82 mg/dL, Glucose: 164 mg/dL.
  53| C-reactive protein: 24.6 mg/L, ESR: 48 mm/h, Rheumatoid Factor: 84 IU/mL, Anti-CCP: > 250 U/mL.
  54| Synovial fluid: Total nucleated cells 18,400 /uL, neutrophils 78%, crystals negative, Gram stain negative.
  55| Duplex ultrasound: Bilateral lower extremities negative for deep vein thrombosis.
  56| 
  57| ASSESSMENT:
  58| 1. Rheumatoid arthritis flare: Polyarticular inflammatory synovitis improving after corticosteroid therapy and right knee arthrocentesis; synovial analysis negative for crystals and infection.
  59| 2. Diabetic peripheral neuropathy: Stocking sensory deficit and allodynia.
  60| 3. Type 2 diabetes mellitus: Steroid-associated hyperglycemia.
  61| 4. History of Bell palsy: Resolved without residual deficit.
  62| 5. Low DVT probability: Wells score 0 points and duplex ultrasound negative.
  63| 
  64| PLAN AND RECOMMENDATIONS:
  65| 1. Rheumatoid Arthritis Management and Corticosteroid Taper:
  66| - Initiate oral prednisone 40/30/20/10 mg daily taper: administer prednisone 40 mg PO daily for 7 days, 30 mg PO daily for 7 days, 20 mg PO daily for 7 days, then 10 mg PO daily for 7 days, followed by 5 mg PO daily maintenance until outpatient rheumatology re-evaluation.
  67| - Continue hydroxychloroquine sulfate 200 mg PO BID.
  68| - Maintain hold on certolizumab pegol until completion of prednisone taper; resume certolizumab pegol 200 mg subcutaneously every 2/3 weeks under outpatient rheumatology supervision.
  69| - Pantoprazole sodium 40 mg PO daily for gastric protection.
  70| 2. Neuropathic Pain Optimization:
  71| - Increase Lyrica from 75 mg PO BID to 150 mg PO BID.
  72| - Continue Allegra 180 mg PO daily.
  73| - Outpatient referral submitted to Pain Clinic for multidisciplinary pain rehabilitation.
  74| 3. Metabolic Management:
  75| - Outpatient referral to Diabetes Center for glycemic titration and education during steroid taper.
  76| 4. Venous Thromboembolism Prophylaxis:
  77| - Enoxaparin sodium 40 mg subcutaneous once daily while inpatient; discontinue at discharge given ambulation and Wells score of 0.
  78| 5. Follow-Up:
  79| - Outpatient follow-up with Rheumatology in 3 weeks, Diabetes Center in 2 weeks, and Pain Clinic within 4 weeks. If pressure injury occurs, referral to Wound Care will be arranged. Records from Outside Hospital have been archived.
  80| 
  81| Care Team Signoff:
  82| Electronically signed by:
  83| Fellow in Rheumatology and Clinical Immunology
  84| Attending Physician, Division of Rheumatology and Internal Medicine
=== END DOCUMENT ===
ITEMS FOR fd-0206:
D1 | line 14 | A: KEEP "right knee arthrocentesis" | B: KEEP "arthrocentesis"
D2 | line 58 | A: KEEP "right knee arthrocentesis" | B: KEEP "arthrocentesis"
D3 | line 65 | A: KEEP "Rheumatoid Arthritis Management and Corticosteroid Taper" | B: KEEP "Rheumatoid Arthritis"
D4 | line 70 | A: KEEP "Neuropathic Pain Optimization" | B: KEEP "Neuropathic Pain"
K1 | line 12 | KEEP "plain radiographs"
K2 | line 14 | KEEP "total nucleated cell count of 18,400 /uL"
K3 | line 14 | KEEP "78% polymorphonuclear leukocytes"
K4 | line 14 | KEEP "negative Gram stain"
K5 | line 14 | KEEP "no birefringent crystals"
K6 | line 14 | KEEP "polarizing microscopy"
K7 | line 16 | KEEP "steroid-induced glucose elevations"
K8 | line 16 | KEEP "neuropathic pain"
K9 | line 22 | KEEP "Right peripheral facial paralysis"
K10 | line 41 | KEEP "General"
K11 | line 42 | KEEP "HEENT"
K12 | line 43 | KEEP "Cardiovascular"
K13 | line 44 | KEEP "Lungs"
K14 | line 45 | KEEP "Abdomen"
K15 | line 46 | KEEP "Musculoskeletal"
K16 | line 47 | KEEP "Neurological"
K17 | line 48 | KEEP "Vascular"
K18 | line 51 | KEEP "Serum Chemistry and Inflammatory Markers"
K19 | line 52 | KEEP "BUN: 16 mg/dL"
K20 | line 54 | KEEP "crystals negative"
K21 | line 54 | KEEP "Gram stain negative"
K22 | line 55 | KEEP "Duplex ultrasound"
K23 | line 58 | KEEP "inflammatory synovitis"
K24 | line 60 | KEEP "Steroid-associated hyperglycemia"
K25 | line 62 | KEEP "DVT"
K26 | line 62 | KEEP "duplex ultrasound"
K27 | line 66 | KEEP "10 mg"
K28 | line 66 | KEEP "rheumatology"
K29 | line 68 | KEEP "rheumatology"
K30 | line 74 | KEEP "Metabolic Management"
K31 | line 76 | KEEP "Venous Thromboembolism Prophylaxis"
K32 | line 78 | KEEP "Follow-Up"
K33 | line 79 | KEEP "Rheumatology"
K34 | line 79 | KEEP "pressure injury"

=== DOCUMENT fd-0223 ===
   1| Calloway Regional Hospital
   2| Inpatient Discharge Summary
   3| 
   4| PATIENT INFORMATION:
   5| Patient Name: WELLS, KENJI
   6| MRN: 492-108-72
   7| Billing Account Number: 8412-0941-63
   8| Admission Date: 10/12/2026
   9| Discharge Date: 10/17/2026
  10| Date of Birth: 03/19/1963
  11| Home Address: 1420 University Street, Apartment 6B, Seattle, WA 98101
  12| Telephone: (206) 555-0149 ext. 3307
  13| Online Portal: https://records.example.org/portal/discharge-summary
  14| Primary Caregiver / Next of Kin: Mrs. Margaret Wells (wife)
  15| Attending Physician: Dr. Arthur Free, MD (NPI: 1487629031, Email: afree@example.org)
  16| Consulting Specialist: Dr. Catherine Hayes, MD (Pulmonary Medicine)
  17| 
  18| DISCHARGE DIAGNOSES:
  19| 1. Acute pulmonary embolism of the right lower lobe segmental pulmonary arteries, hemodynamically stable.
  20| 2. Acute exacerbation of moderate chronic obstructive pulmonary disease, stabilized.
  21| 3. Community-acquired right lower lobe bacterial pneumonia, resolving.
  22| 4. Essential hypertension.
  23| 
  24| HISTORY OF PRESENT ILLNESS:
  25| The patient is a 63-year-old male with a history of tobacco use disorder and chronic obstructive pulmonary disease who presented to the emergency department at Calloway Regional Hospital on 10/12/2026 complaining of three days of acute pleuritic right chest pain, low-grade fever, and progressive breathlessness. He reported that his exercise tolerance had decreased from climbing two flights of stairs to experiencing dyspnea while walking across a room. He also noted mild asymmetric swelling and dull aching in his right calf over the preceding week following a prolonged automobile trip.
  26| 
  27| In the emergency department, triage vital signs revealed a resting pulse of 108 bpm, respiratory rate 24 breaths per minute, blood pressure 138/84 mmHg, temperature 38.1 C, and ambient oxygen saturation 89%, improving to 94% on 3 L/min via nasal cannula. Physical examination revealed crackles over the right lung base and tenderness upon palpation of the right gastrocnemius. Given the presence of tachycardia, right calf swelling, and suspected venous thromboembolism, his clinical Wells score was calculated as 6.0 points, indicating high pre-test probability for acute pulmonary embolism.
  28| 
  29| HOSPITAL COURSE:
  30| Diagnostic Workup and Initial Management:
  31| Urgent CT pulmonary angiography was performed, demonstrating an occlusive filling defect within the medial and posterior basal segmental branches of the right lower lobe pulmonary artery. The right ventricle to left ventricle diameter ratio was measured at 0.94, without evidence of frank right ventricular dilatation or septal flattening. The scan also identified a dense airspace consolidation in the superior and posterior segments of the right lower lobe with surrounding ground-glass opacities, consistent with concurrent post-obstructive bacterial pneumonia. Initial cardiac biomarkers showed high-sensitivity troponin I mildly elevated at 0.04 ng/mL and NT-proBNP at 420 pg/mL, establishing an intermediate-low risk clinical category. Serum lactate was normal at 1.1 mmol/L.
  32| 
  33| Dr. Arthur Free admitted Mr. Wells to the intermediate care stepdown unit. Therapeutic anticoagulation was initiated immediately with a continuous unfractionated heparin infusion utilizing the hospital standard weight-based titration protocol, successfully reaching a therapeutic activated partial thromboplastin time of 68 to 82 seconds within ten hours. Intravenous antimicrobial therapy with ceftriaxone 1 g daily and azithromycin 500 mg daily was initiated for community-acquired pneumonia. Sputum Gram stain demonstrated gram-positive diplococci; blood cultures obtained prior to antibiotic administration demonstrated no bacterial growth after five days.
  34| 
  35| Specialist Consultation and Floor Course:
  36| On hospital day two, Dr. Catherine Hayes from Pulmonary Medicine evaluated the patient. Dr. Hayes reviewed prior outpatient spirometry records from October 2026, which had demonstrated moderate airflow obstruction with an FEV1 of 62% predicted. In light of his acute chronic obstructive pulmonary disease exacerbation, nebulized ipratropium bromide-albuterol sulfate treatments every four hours were initiated, accompanied by a five-day course of systemic corticosteroids (intravenous methylprednisolone 40 mg daily). Transthoracic echocardiogram obtained on 10/15/2026 revealed normal left ventricular systolic function with an estimated left ventricular ejection fraction of 60%, normal right ventricular size with preserved systolic function (tricuspid annular plane systolic excursion 2.2 cm), and estimated pulmonary artery systolic pressure of 34 mmHg. Bilateral lower extremity venous duplex ultrasound confirmed an occlusive deep vein thrombosis within the right popliteal vein.
  37| 
  38| By hospital day four, the patient demonstrated marked clinical improvement. He was successfully weaned off supplemental oxygen, maintaining 96% on ambient air while resting and 93% with gentle ambulation. Respiratory rate normalized to 16 breaths per minute and chest pain completely resolved. Intravenous heparin was bridged to oral apixaban 10 mg twice daily. Antibiotic therapy was converted to oral cefpodoxime 200 mg twice daily to complete a planned total seven-day course. Pre-discharge arterial blood gas on room air revealed pH 7.41, PaCO2 42 mmHg, and PaO2 76 mmHg. Complete blood count demonstrated a leukocytosis resolving from 14.8 K/uL to 7.4 K/uL, hemoglobin 13.9 g/dL, and platelet count 218 K/uL. Comprehensive metabolic panel revealed serum creatinine 0.94 mg/dL and normal liver enzymes.
  39| 
  40| DISCHARGE COUNSELING AND EDUCATION:
  41| Extensive discharge education was conducted with Mr. Wells and his wife, Mrs. Margaret Wells. Mrs. Wells participated in medication reconciliation and agreed to assist her husband with medication adherence and monitoring. They were counseled on anticoagulant safety, recognizing signs of major bleeding, and red-flag symptoms such as sudden dyspnea, syncope, or hemoptysis. Mr. Wells confirmed access to his digital medical records through the patient portal at https://records.example.org/portal/discharge-summary.
  42| 
  43| DISCHARGE MEDICATIONS:
  44| 1. Apixaban 10 mg oral tablet, take 1 tablet PO BID through 10/26/2026, then transition to apixaban 5 mg PO BID for a minimum duration of 6 months.
  45| 2. Cefpodoxime 200 mg oral tablet, take 1 tablet PO BID for 3 additional days to finish the antibiotic course.
  46| 3. Fluticasone-umeclidinium-vilanterol 100/62.5/25 mcg inhaler, 1 inhalation once daily.
  47| 4. Albuterol sulfate 90 mcg HFA inhaler, 2 puffs inhaled every 4 to 6 hours as needed for wheezing or acute dyspnea.
  48| 5. Prednisone 20 mg oral tablet, 1 tablet PO daily for 2 days, then stop.
  49| 
  50| FOLLOW-UP PLAN:
  51| 1. Primary Care: Dr. Arthur Free, Internal Medicine Clinic, on Nov. 3, 2026, at 10:30 AM. For scheduling questions or concerns, call (206) 555-0149 ext. 3307 or contact afree@example.org.
  52| 2. Pulmonary Medicine: Dr. Catherine Hayes, Pulmonary Clinic, in 4 weeks for repeat spirometry and functional assessment.
  53| 3. Repeat lower extremity duplex ultrasound is recommended in 3 to 6 months to evaluate vein recanalization.
  54| 
  55| DISPOSITION: Discharged home in stable condition in the care of his wife.
  56| 
  57| Arthur Free, MD
  58| Department of Internal Medicine, Calloway Regional Hospital
  59| NPI: 1487629031
=== END DOCUMENT ===
ITEMS FOR fd-0223:
D1 | line 19 | A: KEEP "Acute pulmonary embolism of the right lower lobe segmental pulmonary arteries" | B: KEEP "Acute pulmonary embolism"
D2 | line 20 | A: KEEP "Acute exacerbation of moderate chronic obstructive pulmonary disease" | B: KEEP "chronic obstructive pulmonary disease"
D3 | line 21 | A: KEEP "Community-acquired right lower lobe bacterial pneumonia" | B: KEEP "bacterial pneumonia"
D4 | line 27 | A: KEEP "ambient oxygen saturation 89%, improving to 94%" | B: KEEP "ambient oxygen saturation 89%"
D5 | line 31 | A: KEEP "post-obstructive bacterial pneumonia" | B: KEEP "bacterial pneumonia"
D6 | line 36 | A: KEEP "acute chronic obstructive pulmonary disease exacerbation" | B: KEEP "chronic obstructive pulmonary disease"
D7 | line 36 | A: KEEP "Bilateral lower extremity venous duplex ultrasound" | B: KEEP "venous duplex ultrasound"
D8 | line 38 | A: KEEP "leukocytosis resolving from 14.8 K/uL to 7.4 K/uL" | B: KEEP "leukocytosis"
D9 | line 58 | A: FACILITY "Department of Internal Medicine" | B: (nothing)
K1 | line 2 | KEEP "Inpatient Discharge Summary"
K2 | line 27 | KEEP "3 L/min"
K3 | line 27 | KEEP "nasal cannula"
K4 | line 31 | KEEP "right ventricle to left ventricle diameter ratio was measured at 0.94"
K5 | line 31 | KEEP "high-sensitivity troponin I mildly elevated at 0.04 ng/mL"
K6 | line 31 | KEEP "NT-proBNP at 420 pg/mL"
K7 | line 31 | KEEP "Serum lactate was normal at 1.1 mmol/L"
K8 | line 33 | KEEP "infusion"
K9 | line 33 | KEEP "activated partial thromboplastin time of 68 to 82 seconds"
K10 | line 33 | KEEP "Intravenous"
K11 | line 33 | KEEP "Sputum Gram stain"
K12 | line 33 | KEEP "gram-positive diplococci"
K13 | line 33 | KEEP "blood cultures"
K14 | line 36 | KEEP "moderate airflow obstruction"
K15 | line 36 | KEEP "FEV1 of 62% predicted"
K16 | line 36 | KEEP "systemic"
K17 | line 36 | KEEP "corticosteroids"
K18 | line 36 | KEEP "left ventricular ejection fraction of 60%"
K19 | line 36 | KEEP "tricuspid annular plane systolic excursion 2.2 cm"
K20 | line 36 | KEEP "pulmonary artery systolic pressure of 34 mmHg"
K21 | line 38 | KEEP "oxygen"
K22 | line 38 | KEEP "Respiratory rate normalized to 16 breaths per minute"
K23 | line 41 | KEEP "medication reconciliation"
K24 | line 44 | KEEP "oral"
K25 | line 44 | KEEP "1 tablet"
K26 | line 45 | KEEP "oral"
K27 | line 45 | KEEP "1 tablet"
K28 | line 46 | KEEP "1 inhalation"
K29 | line 47 | KEEP "2 puffs"
K30 | line 47 | KEEP "inhaled"
K31 | line 48 | KEEP "oral"
K32 | line 48 | KEEP "1 tablet"
K33 | line 51 | KEEP "Primary Care"
K34 | line 52 | KEEP "Pulmonary Medicine"
K35 | line 52 | KEEP "functional assessment"

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
ITEMS FOR fd-0226:
D1 | line 5 | A: KEEP "58 kg" | B: KEEP "weighed 58 kg" [unsure]
K1 | line 16 | KEEP "fasting lipid panel"
K2 | line 16 | KEEP "potassium"

Now output the result blocks.