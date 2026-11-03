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


=== DOCUMENT fd-0084 ===
   1| 77104928
   2| BANNISTER MEMORIAL HOSPITAL
   3| INPATIENT CARDIOLOGY CONSULTATION SERVICE
   4| FACILITY ADDRESS:
   5| 824 WAIALAE AVENUE, HONOLULU, HI 96816
   6| MAILING ADDRESS:
   7| PO Box 3914, Honolulu, HI 96815
   8| TELEPHONE: (808) 555-0163
   9| CONSULTATION FAX: (808) 555-0197
  10| EMAIL INQUIRIES: campbell.team at example dot org
  11| 
  12| PATIENT IDENTIFICATION AND REGISTRATION:
  13| Patient Name: Mr. Kelemete Luafutu
  14| Date of Birth: 05/22/1934
  15| Current Age: 92 y.o.
  16| Biological Sex: Male
  17| Social Security Number: 000-48-9124
  18| Insurance Plan Member ID: HPN-70491823-01
  19| Date of Consultation: October 14, 2026
  20| Date of Inpatient Admission: October 12th
  21| Date of Encounter Documentation: 10/14/26
  22| 
  23| CARE TEAM AND ENCOUNTER ATTENDEES:
  24| - Harrison Campbell, MD (Attending Cardiologist)
  25| - Megan Crawford, MD (Cardiology Clinical Fellow)
  26| - Elena de la Cruz, MD (Cardiac Electrophysiology Consultant)
  27| - Brenda Miller, RN (Inpatient Telemetry Unit Coordinator)
  28| - R.J.C., RN (Primary Bedside Telemetry Nurse)
  29| - Grace Takahashi (Daughter-in-law and Healthcare Proxy)
  30| 
  31| REASON FOR CONSULTATION:
  32| Inpatient cardiology consultation requested for medical management
  33| optimization and pacemaker interrogation in a 92 y.o. male admitted
  34| with acute decompensated heart failure with preserved ejection
  35| fraction (HFpEF) and volume overload.
  36| 
  37| HISTORY OF PRESENT ILLNESS:
  38| Mr. Kelemete Luafutu is a 92 y.o. gentleman with a past medical history
  39| significant for heart failure with preserved ejection fraction (NYHA
  40| Class II at baseline), persistent atrial fibrillation on apixaban,
  41| dual-chamber permanent pacemaker placed three years prior for sick sinus
  42| syndrome, stage 3b chronic kidney disease, and primary hypertension.
  43| He was admitted through the emergency department on October 12th after
  44| experiencing four days of progressive exertional dyspnea, orthopnea
  45| requiring elevation with three pillows, and bilateral lower extremity
  46| pitting edema extending up to the mid-calves.
  47| 
  48| Today, on hospital day 3 (10/14/26), the cardiology consultation team
  49| was requested to evaluate volume status, assist with diuretic transition,
  50| and verify permanent pacemaker parameters. The clinical fellow,
  51| Dr. Megan Crawford, and the attending physician, Dr. Harrison
  52| Campbell, conducted a bedside evaluation of his clinical progress.
  53| A detailed interval history and care plan were reviewed with Grace
  54| Takahashi, the patient's 54-year-old daughter-in-law and healthcare proxy,
  55| who was present at the bedside during rounds.
  56| 
  57| Mr. Luafutu reports marked symptomatic relief following forty-eight hours
  58| of scheduled intravenous diuresis. Resting dyspnea has resolved completely,
  59| and he is now able to lie flat with a single pillow without cough or air
  60| hunger. He denies angina, chest tightness, palpitations, presyncope,
  61| nausea, or fever. He notes that the dependent swelling in both lower
  62| extremities has resolved significantly. Over the past 48 hours, his
  63| cumulative net fluid balance is negative 2,850 mL, with an associated
  64| weight reduction of 2.9 kg (down from 87.0 kg at admission to 84.1 kg).
  65| 
  66| IMPLANTED CARDIAC DEVICE ASSESSMENT:
  67| Interrogation completed at bedside by Dr. Elena de la Cruz on
  68| October 14, 2026.
  69| Device Type: Dual-chamber permanent pacemaker
  70| Model: Medtronic Azure XT DR dual-chamber system
  71| Device Serial Number: PXR492018H
  72| Device Findings: Programmed mode DDDR, lower rate limit 60 bpm. Battery
  73| longevity remains robust at 7.4 years. Atrial and ventricular pacing
  74| thresholds, sensing amplitudes, and lead impedances are stable and within
  75| normal limits. Telemetry memory shows underlying atrial fibrillation
  76| with appropriate rate control and no sustained ventricular arrhythmias.
  77| 
  78| PAST MEDICAL HISTORY:
  79| 1. Heart failure with preserved ejection fraction (LVEF 55% to 60%).
  80| 2. Persistent atrial fibrillation, CHA2DS2-VASc score of 4.
  81| 3. Sick sinus syndrome status post dual-chamber pacemaker.
  82| 4. Chronic kidney disease stage 3b (baseline creatinine 1.3-1.5 mg/dL).
  83| 5. Essential hypertension, longstanding.
  84| 6. Dyslipidemia.
  85| 7. Bilateral primary knee osteoarthritis.
  86| 
  87| PAST SURGICAL HISTORY:
  88| 1. Dual-chamber permanent pacemaker implantation.
  89| 2. Cataract extraction with intraocular lens implant, left eye.
  90| 3. Remote appendectomy in youth, uncomplicated.
  91| 
  92| CURRENT MEDICATIONS:
  93| 1. Furosemide 40 mg IV twice daily (last intravenous dose at 06:00).
  94| 2. Sacubitril/valsartan (Entresto) 24/26 mg PO twice daily.
  95| 3. Carvedilol 6.25 mg PO twice daily with meals.
  96| 4. Apixaban 2.5 mg PO twice daily (dose-adjusted for age and renal function).
  97| 5. Atorvastatin 20 mg PO daily at bedtime.
  98| 6. Potassium chloride 20 mEq PO daily (held if serum potassium > 4.5).
  99| 
 100| ALLERGIES:
 101| Lisinopril (intractable dry cough; no history of angioedema).
 102| 
 103| SOCIAL HISTORY:
 104| Mr. Luafutu resides in a multi-generational home with his son and his
 105| daughter-in-law, Grace. Never used tobacco products. Denies alcohol or
 106| illicit substance use. His family provides daily assistance with meal
 107| preparation and transportation. Prior to admission, he ambulated with
 108| a walker and was independent in personal activities of daily living.
 109| 
 110| REVIEW OF SYSTEMS:
 111| Constitutional: Denies fever, chills, diaphoresis, or acute fatigue.
 112| Cardiovascular: Resolution of orthopnea; denies chest pressure or flutter.
 113| Respiratory: Denies cough, wheezing, hemoptysis, or resting dyspnea.
 114| Gastrointestinal: Appetite good; denies nausea, vomiting, or diarrhea.
 115| Genitourinary: Diuresing well; denies dysuria or gross hematuria.
 116| Musculoskeletal: Chronic bilateral knee stiffness without acute warmth.
 117| Neurological: Denies lightheadedness, syncope, focal weakness, or numbness.
 118| 
 119| PHYSICAL EXAMINATION:
 120| Vital Signs (Recorded at 09:30 on 10/14/26):
 121| Temperature: 98.4 F (36.9 C), oral
 122| Blood Pressure: 124/76 mmHg, right arm, seated
 123| Heart Rate: 68 beats per minute, regular
 124| Respiratory Rate: 17 breaths per minute, unlabored
 125| Pulse Oximetry: 97% on ambient room air
 126| Current Inpatient Weight: 84.1 kg (admission weight 87.0 kg)
 127| 
 128| General: Pleasant, alert 92 y.o. male resting comfortably in bed.
 129| Head and Neck: Normocephalic, atraumatic. Moist mucous membranes.
 130| Jugular venous pressure estimated at 6 cm H2O at 45 degrees, improved
 131| from 11 cm on admission. Carotid upstrokes symmetric without bruits.
 132| Cardiovascular: Pacemaker pocket in right prepectoral area clean and
 133| intact without erythema, tenderness, or fluctuance. Normal S1 and S2.
 134| Grade 2/6 soft systolic murmur at apex without axillary radiation. No S3,
 135| S4, or pericardial friction rub. Peripheral pulses 2+ bilaterally.
 136| Pulmonary: Good excursion. Lungs clear to auscultation bilaterally in
 137| anterior and mid zones, with faint end-inspiratory crackles at extreme
 138| bases, markedly improved from admission. No wheezing or rhonchi.
 139| Abdomen: Soft, non-tender, non-distended. Bowel sounds normoactive.
 140| Extremities: Trace pitting edema over bilateral medial malleoli; no calf
 141| tenderness, cords, or erythema. Capillary refill under 2 seconds.
 142| Neurological: Alert and oriented x4. Cranial nerves II-XII intact.
 143| Motor strength 5/5 upper extremities, 4+/5 lower extremities bilaterally.
 144| 
 145| LABORATORY AND DIAGNOSTIC DATA:
 146| Serum Chemistry and Hematology (October 14, 2026):
 147|   Sodium: 138 mEq/L (reference 135-145)
 148|   Potassium: 4.2 mEq/L (reference 3.5-5.0)
 149|   Chloride: 102 mEq/L (reference 98-107)
 150|   Bicarbonate: 25 mEq/L (reference 22-29)
 151|   Blood Urea Nitrogen (BUN): 24 mg/dL (reference 7-20)
 152|   Serum Creatinine: 1.34 mg/dL (baseline 1.30-1.50; admission was 1.58)
 153|   Estimated GFR: 52 mL/min/1.73m2 (reference > 60)
 154|   Serum Glucose: 114 mg/dL (reference 70-99)
 155|   B-type Natriuretic Peptide (BNP): 195 pg/mL (admission 680 pg/mL)
 156|   Hemoglobin: 12.2 g/dL | Hematocrit: 36.8% | WBC: 6.6 K/uL
 157|   Platelet Count: 204 K/uL
 158| 12-Lead ECG (10/14/26): Atrial paced rhythm at 68 bpm, narrow QRS
 159| duration (92 ms), non-specific ST-T changes, no acute ischemic shifts.
 160| 
 161| ASSESSMENT AND CLINICAL IMPRESSION:
 162| Mr. Kelemete Luafutu is a 92 y.o. male with chronic HFpEF, persistent
 163| atrial fibrillation on oral anticoagulation, sick sinus syndrome with
 164| dual-chamber pacemaker, and chronic kidney disease stage 3b, who has
 165| demonstrated substantial clinical improvement following diuresis for
 166| acute decompensation. He is now euvolemic with normalized JVP, minimal
 167| trace ankle edema, stable renal function, and significant BNP reduction.
 168| 
 169| DETAILED MANAGEMENT PLAN:
 170| 1. Heart Failure with Preserved Ejection Fraction (HFpEF):
 171|    - Discontinue IV furosemide today following negative balance of 2,850 mL.
 172|    - Transition to oral furosemide 40 mg PO every morning.
 173|    - Continue sacubitril/valsartan 24/26 mg PO twice daily.
 174|    - Maintain 2000 mg daily sodium restriction and 2-liter fluid limit.
 175| 2. Cardiac Rhythm and Device Management:
 176|    - Interrogation of Medtronic Azure pacemaker (SN: PXR492018H) confirms
 177|      normal lead parameters and sensing. Mode remains DDDR.
 178|    - Continue carvedilol 6.25 mg PO twice daily for rate control.
 179|    - Continue apixaban 2.5 mg PO twice daily for stroke prevention.
 180| 3. Renal Function and Monitoring:
 181|    - Serum creatinine improved to 1.34 mg/dL with potassium 4.2 mEq/L.
 182|    - Repeat basic metabolic panel tomorrow morning.
 183| 4. Post-Discharge Care Coordination:
 184|    - Anticipate hospital discharge within 24 to 48 hours.
 185|    - Referral placed to Cardiopulmonary Rehabilitation Center for monitored
 186|      outpatient conditioning and education.
 187|    - Outpatient medication delivery arranged through the regional pharmacy
 188|      depot servicing ZIP 96822.
 189|    - Plan reviewed with patient and daughter-in-law, Grace Takahashi.
 190| 
 191| Care Team Signatures:
 192| Megan Crawford, MD
 193| Cardiology Clinical Fellow, PGY-5
 194| Bannister Memorial Hospital
 195| 
 196| Attending Physician Attestation:
 197| I have evaluated Mr. Kelemete Luafutu on October 14, 2026, reviewed his
 198| device interrogation and laboratory data, and discussed the findings
 199| with Dr. Crawford and Grace Takahashi. I agree with the plan of care.
 200| 
 201| Harrison Campbell, MD, FACC
 202| Attending Cardiologist, Division of Cardiology
 203| Bannister Memorial Hospital
 204| Contact: campbell.team at example dot org
 205| Authenticated: 10/14/26 13:40 HST
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.