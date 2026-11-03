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


=== DOCUMENT fd-0289 ===
   1| PHARMACY PRIOR AUTHORIZATION & RECONCILIATION DISPENSARY RECORD
   2| TRANSCRIBED FROM CLINICAL FAX - ONCOLOGY SUPPORT SERVICES
   3| 
   4| PATIENT DEMOGRAPHICS & DISPENSARY DATA:
   5| PATIENT: Nasser
   6| al-Yousef
   7| DOB: 02-17-1935
   8| AGE / SEX: 91M
   9| CLAIM / ACCOUNT: Claim # CL-8840217
  10| PRESCRIPTION NUMBER: Rx # 6492018
  11| RESIDENTIAL ADDRESS: 842 Ala Moana Boulevard, Apt 14C, Honolulu, HI 96813
  12| CAREGIVER: Dimitra Vasilakis (patient's adult daughter and legal guardian)
  13| PHARMACY INTAKE PHONE: (808) 555-0134 ext. 502
  14| ORDERING ONCOLOGIST: Dr. Arthur Reed, MD
  15| CLINICAL PHARMACIST: Mele Tuipulotu, PharmD, BCOP
  16| INTAKE TECHNICIAN: Talia Cook, CPhT
  17| DATE OF ENTRY: 11-04-2026
  18| 
  19| REFERRAL & CLINICAL INDICATION:
  20| Prior authorization appeal transmited from outpatient oncology following
  21| routine treatment review. The patient is a 91M with classical Hodgkin
  22| lymphoma diagnosed four months ago following lymph node biopsy
  23| demonstrating classic Reed-Sternberg cells with positive CD30 expression.
  24| In view of patient's advanced age and mild underlying cardiotoxicity,
  25| standard cytotoxic bleomycin was omitted from frontline therapy.
  26| The initial presentation included night sweats, generalized pruritus, and
  27| enlarging cervical adenopathy. Restaging PET-CT confirmed partial metabolic
  28| response after two treatment cycles. Dr. Reed's clinical plan recommended
  29| brentuximab vedotin maintenance alongside supportive antiemetic therapy.
  30| 
  31| PHARMACY RECONCILIATION & CAREGIVER OUTREACH:
  32| Phone consultation conducted by Talia Cook with Dimitra Vasilakis to verify
  33| current home medication tolerances. Ms. Vasilakis stated that
  34| Mr. al-Yousef's appetite has improved and reported excellent tolerabilty
  35| following cycle 2. No evidence of peripheral sensory neuropathy,
  36| constipation, or mucosal ulcerations was noted during the preceding two
  37| weeks.
  38| 
  39| ACTIVE RECONCILED REGIMEN:
  40| 1. Brentuximab vedotin (Adcetris) 1.2 mg/kg IV infusion every 3 weeks. Prior
  41| authorization required under Rx # 6492018; appeal submitted.
  42| 2. Ondansetron 8 mg PO q8h PRN nausea, 30 minutes prior to chemotherapy.
  43| 3. Dexamethasone 4 mg PO daily on days 1 through 3 of each cycle.
  44| 4. Sulfamethoxazole/trimethoprim 800/160 mg PO three times weekly for
  45| Pneumocystis jirovecii prophylaxis.
  46| 5. Acyclovir 400 mg PO BID for antiviral prophylaxis during therapy.
  47| 6. Senna 17.2 mg PO daily at bedtime PRN constipation.
  48| 
  49| ASSESSMENT & PRIOR AUTHORIZATION JUSTIFICATION:
  50| Coverage denial was originally issued by the payer citing age parameters and
  51| requesting step therapy with conventional ABVD. Dr. Reed submitted an appeal
  52| letter emphasizing that omission of pulmonary toxic agents is standard of
  53| care for elderly individuals. Recent biopsy documentation verifying CD30+
  54| Reed-Sternberg cells and baseline cardiac ejection fraction (LVEF 55%)
  55| support targeted biologic use. Renal parameters remain acceptable with
  56| serum creatinine 1.15 mg/dL and eGFR 58 mL/min/1.73 m2. Complete blood counts
  57| from 11-04-2026 show absolute neutrophil count 2,400/uL, platelets
  58| 175,000/uL, and hemoglobin 10.4 g/dL. Liver enzymes remain normal with
  59| AST 21 U/L and ALT 24 U/L.
  60| 
  61| DISPENSARY ACTIONS & RESOLUTION:
  62| 1. Complete clinical package under Claim # CL-8840217 resent to insurer by
  63| Mele Tuipulotu, PharmD.
  64| 2. Talia Cook verified insurance receipt via portal triage queue.
  65| 3. Delivery of cycle 3 supportive medications scheduld to 842 Ala Moana
  66| Boulevard, Apt 14C following authorization confirmation.
  67| 4. Direct pharmacy escalation line provided to Dimitra Vasilakis.
  68| 
  69| Mele Tuipulotu, PharmD, BCOP
  70| Specialty Clinical Pharmacist
=== END DOCUMENT ===

=== DOCUMENT fd-0274 ===
   1| 44918273
   2| St. Idris Medical Center
   3| Outpatient History and Physical
   4| Department of Geriatric Medicine
   5| 
   6| Patient: Montecillo, Rosalía
   7| DOB: 17 February 1934
   8| Age: 92 y.o.
   9| Date of service: 2026-03-11
  10| Residence: 418 WILLOW TRACE DRIVE, GREYHOLLOW, OR 97302
  11| Mailing address: PO Box 188, Greyhollow, OR 97302
  12| Member number: WX4402918
  13| Author: Dr. Helen Wolf
  14| 
  15| The faxed face sheet from the prior cardiology file is faint. Registration read the old chart as 22O91l4 and will confirm it before any records are released.
  16| 
  17| Chief complaint
  18| Low-speed motor vehicle collision one week ago, chest wall pain, and a review of anticoagulation.
  19| 
  20| History of present illness
  21| Rosalía Bautista Montecillo returns for follow-up after a parking-aisle collision. On March 4th she was the restrained front passenger in her son-in-law's sedan, plate 6TKM-219, when a slowly reversing van struck the passenger door. The speed was a walking pace. The airbag did not deploy. She did not strike her head, did not lose consciousness, and stepped out of the car with help. Paramedics were not called. Since that afternoon she has had a band of aching pain along the right chest wall, worse with a deep breath, a cough, or turning in bed. She has no dyspnea at rest, no hemoptysis, and no palpitations. A purple bruise appeared over the right breast and lateral ribs on the second day and is now yellow at the edges. She reports no dizziness, no melena, no hematuria, no epistaxis, and no new headache. Appetite is fair. She is anxious about another fall and has stayed inside unless someone is with her.
  22| 
  23| She has heart failure with preserved ejection fraction, followed at the Heart and Vascular Center of Greyhollow, and she takes apixaban for atrial fibrillation. She missed no doses. Heart failure symptoms were stable from March 1 through March 5, with no change since: no new orthopnea beyond her usual single pillow, no nocturnal cough, and no rapid weight gain. Home health for this plan is assigned by ZIP 97306, and a nurse has been recording weights twice a week. Those weights have stayed within 0.5 kg of baseline.
  24| 
  25| Past medical history
  26| Heart failure with preserved ejection fraction, last echocardiogram with an ejection fraction of 60 percent and grade 2 diastolic dysfunction. Persistent atrial fibrillation, rate controlled. Stage 3 chronic kidney disease. Hypothyroidism on a stable replacement dose. Osteoporosis, with a remote right distal radius fracture managed without surgery. Bilateral cataract extraction in the remote past. No diabetes. No prior gastrointestinal bleed. No stroke and no transient ischemic attack. No diagnosed dementia. She does get help filling a weekly pillbox.
  27| 
  28| Medications, reviewed today and unchanged
  29| 1. Apixaban 2.5 mg by mouth twice daily, reduced for age and body weight.
  30| 2. Metoprolol succinate 50 mg by mouth daily.
  31| 3. Furosemide 20 mg by mouth each morning. She was told this may also be called Lasix at the pharmacy window.
  32| 4. Lisinopril 5 mg by mouth daily.
  33| 5. Levothyroxine 88 mcg by mouth each morning, thirty minutes before breakfast.
  34| 6. Cholecalciferol 2000 units by mouth daily.
  35| 7. Acetaminophen 650 mg by mouth every eight hours as needed for pain, not to exceed 3 grams in a day.
  36| 
  37| She was instructed again not to take ibuprofen, naproxen, or aspirin while on apixaban.
  38| 
  39| Allergies
  40| Rash after sulfamethoxazole-trimethoprim as a younger adult. No latex allergy. No contrast reaction.
  41| 
  42| Social history
  43| She lives with her daughter and does not drive. She never smoked. She does not drink alcohol. She walks in the house without a device and uses a cane outside. A neighbor helps with groceries. She is a retired seamstress and still mends clothes at the kitchen table.
  44| 
  45| Family and staff present
  46| Mrs. Claire Keene, daughter
  47| Mr. Paul Keene, son-in-law
  48| Nora Pembroke, RN
  49| 
  50| Her daughter can be reached at (503) 555-0133 during the workday. Her son-in-law's mobile is 503.555.0177 if the house line is busy. She asked that afternoon messages go to claire.keene at example dot com, because the telephone is hard to hear after supper.
  51| 
  52| Review of systems
  53| No fever or chills. No syncope. No vision change beyond her known cataracts history. No neck pain, no arm numbness, no abdominal pain, no change in stool color, and no dysuria. Chronic knee ache is unchanged. Mood is worried but she is sleeping and she is not without hope. The remainder of a fourteen-system review is negative.
  54| 
  55| Physical examination
  56| Blood pressure 148/76 mmHg, heart rate 88 beats per minute and irregularly irregular, respiratory rate 18 breaths per minute, temperature 97.8 F, oxygen saturation 96 percent on room air, weight 51.2 kg. That weight is 0.4 kg above the reading from last week. She is alert and oriented to person, place, and month, seated without distress, and able to give the history with her daughter adding only the dates. Speech is clear. There is a fading ecchymosis over the right lateral chest and the lateral right breast, tender to firm palpation, without crepitus, flail segment, open skin, or hematoma that is expanding. No seatbelt sign across the abdomen. Heart sounds are irregularly irregular, no new murmur, no rub. Lungs are clear without rales or wheeze. The abdomen is soft and nontender, with normal bowel sounds. No leg edema. Cranial nerves II through XII are intact. Strength is 5 out of 5 in the arms and 4+ out of 5 at the hips, which is her baseline. Sensation is symmetric. Gait with the cane is slow and steady, and Romberg is negative.
  57| 
  58| Studies on the date of service
  59| Hemoglobin 11.8 g/dL, prior 12.0 g/dL two months ago. Platelets 188,000/microliter. White cells 7.4 x 10 to the 9 per liter. Sodium 136 mmol/L. Potassium 4.2 mmol/L. Chloride 102 mmol/L. Bicarbonate 24 mmol/L. BUN 22 mg/dL. Creatinine 1.32 mg/dL, baseline about 1.2 to 1.4 mg/dL. eGFR 41 mL/min/1.73 m2. Glucose 96 mg/dL. TSH 2.1 mIU/L. Troponin I 0.01 ng/mL, below the 99th percentile cutoff for this assay. A chest radiograph shows no rib fracture, no pneumothorax, no infiltrate, and no pulmonary edema. The electrocardiogram shows atrial fibrillation with a ventricular rate of 88 and no acute ST-segment shift.
  60| 
  61| The outside comparison film is on the portal at https://results.example.com/rad/montecillo-4491.
  62| 
  63| Assessment and plan
  64| 1. Chest wall contusion after a low-speed passenger-side collision, on therapeutic anticoagulation. Pain is improving and there is no evidence of bleeding, pneumothorax, or cardiac injury. Continue acetaminophen. Ice for ten minutes at a time if it eases the ache. No rib belt. Return for worse pain, shortness of breath, fainting, black stools, vomiting blood, or a rapidly expanding bruise. Repeat the hemoglobin only if a bleeding symptom appears.
  65| 2. Atrial fibrillation, rate controlled, on apixaban 2.5 mg twice daily. Continue without interruption. The reduced dose remains appropriate given age over 80 and weight under 60 kg. Counseled on bleeding precautions and on not adding an anti-inflammatory drug.
  66| 3. Heart failure with preserved ejection fraction, clinically stable. Continue furosemide 20 mg daily, metoprolol succinate 50 mg daily, and lisinopril 5 mg daily. She will call if her weight rises more than 2 kg over three days or if she needs extra pillows.
  67| 4. Stage 3 chronic kidney disease, stable creatinine. Recheck a chemistry panel with the next routine visit. Avoid dehydration while the bruise heals and she is less active.
  68| 5. Hypothyroidism, euthyroid on the current levothyroxine dose. No change.
  69| 6. Osteoporosis and fall risk. The cane is appropriate. Vitamin D will stay at the current dose. I did not start a new agent today. Physical therapy for balance was offered and accepted, and the referral was entered.
  70| 7. Advance care planning was not reopened today. Her daughter already holds the healthcare proxy paperwork in the chart.
  71| 
  72| She and her daughter repeated the bleeding precautions and the reasons to return. Questions were answered. Follow-up is planned in three weeks, sooner if needed.
  73| 
  74| Electronically signed by Dr. Helen Wolf
  75| Geriatric Medicine
=== END DOCUMENT ===

=== DOCUMENT fd-0144 ===
   1| PRE-PROCEDURE COORDINATION AND COVERAGE DETERMINATION
   2| Date of Service: November 18, 2026
   3| Patient Name: Medeiros, Mariana de
   4| Plan Member ID: PHP-904218-01
   5| Facility: Bayside Ambulatory Surgical Pavilion
   6| 
   7| Dear Ms. de Medeiros,
   8| 
   9| This letter confirms that our surgical coordination team has completed the prior authorization review with your health plan for your upcoming laparoscopic cholecystectomy. The procedure is schedulled for the morning of November 18, 2026, with arrival requested two hours prior to incision time at Bayside Ambulatory Surgical Pavilion.
  10| 
  11| During your pre-operative clinical evaluation, Dr. Tariq Siddiqui noted persistent episodic biliary colic following meals. Abdominal ultrasound previously demonstrated multiple mobile calculi within the gallbladder lumen with mild gallbladder wall thickening; however, physical examination elicited a negative Murphy sign without localized peritoneal rebound. Given these findings adn your recurrent symptoms, surgical management remains clinically indicated.
  12| 
  13| Pre-admission blood work, including a complete blood count, basic metabolic panel, and hepatic function panel, must be drawn within fourteen days of the intervention. You may complete these laboratory studies at our outpatient diagnostic laboratory or at any affiliated collection site. Please ensure that all outside diagnostic records and operative consent paperwork are signed and returned prior to admission.
  14| 
  15| Please review the following pre-procedure instructions:
  16| 1. Complete strict NPO status beginning at midnight prior to your scheduled procedre date.
  17| 2. Hold your daily morning antihypertensive regimen as previously directed by anesthesia, unless instructed otherwise during your final telephone intake call.
  18| 3. Arrange for a responsible adult escort to accompany you upon discharge. Our records list your brother-in-law, Arthur Murphy, as your designated primary contact and post-anesthesia driver. He will need to check in at the reception desk prior to patient discharge.
  19| 
  20| If your designated caregiver resides outside our standard clinical service area 02138, transport times should be factored into your postoperative recovery planning. For any questions regarding billing estimates, administrative scheduling, or directions, please contact our intake desk at 617.555.0142 between 8:00 AM and 4:30 PM.
  21| 
  22| Written correspondence or inquiries regarding pre-certification docments may be directed to our patient access representative, bilal qureshi, via secure portal transmission or direct clerical inquiry.
  23| 
  24| Sincerely,
  25| 
  26| Tariq Siddiqui, MD
  27| Department of Gastrointestinal Surgery
  28| Bayside Ambulatory Surgical Pavilion
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.