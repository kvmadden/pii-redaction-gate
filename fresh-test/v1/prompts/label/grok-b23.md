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


=== DOCUMENT fd-0034 ===
   1| DISCHARGE SUMMARY
   2| 
   3| Patient: HALE PAGET
   4| MRN: 7391842
   5| Age: 67 years
   6| 
   7| Hale Paget was admitted to Metabolic Bone Hospital in March 2026 for worsening left hip pain and a suspected stress fracture through pagetic bone. He is a 67 year old man with longstanding Paget disease of the pelvis and proximal femur, previously treated with an oral bisphosphonate that he stopped taking two years ago after dental work. His sister, Summer Braddock, age 61, has been staying with him and will drive him home.
   8| 
   9| The attending physician was Karim ibn Farouk, NPI 1609384725. Endocrinology consultation was provided by Layla al-Najjar. On arrival he was afebrile, blood pressure 146/82 mmHg, heart rate 78 beats per minute, and oxygen saturation 97 percent on room air. Alkaline phosphatase was 512 U/L, calcium 9.0 mg/dL, albumin 3.8 g/dL, creatinine 1.05 mg/dL, and 25-hydroxy vitamin D 19 ng/mL. Pelvic radiographs and a bone scan showed intensely active Paget disease without cortical destruction suggestive of sarcoma. Pain was controlled and no new neurologic deficit occured.
  10| 
  11| Past medical history also includes hypertension, hyperlipidemia, and osteoarthritis of the knees. He does not smoke. He drinks rarely. There is no history of osteosarcoma in the family and no prior fracture of the hip. During the stay his creatinine stayed stable and his calcium did not fall below 8.6 mg/dL. He was advised to report jaw pain, thigh pain, or fever over the next several weeks, and to keep a dental appointment already scheduled for routine cleaning.
  12| 
  13| Hospital course. After dental clearance he recieved zoledronic acid 5 mg IV once, infused over 30 minutes, and tolerated it without fever that required more than acetaminophen. Calcium carbonate 500 mg PO BID and cholecalciferol 2000 IU PO daily were started. Celecoxib 200 mg PO daily was given for five days, then stopped. Physical therapy advanced him to a walker with wieght bearing as tolerated. A seperate copy of the imaging report was printed for his sister.
  14| 
  15| Discharge medications.
  16| Zoledronic acid infusion completed this admission. Next dose to be arranged by endocrinology.
  17| Calcium carbonate 500 mg PO BID with meals.
  18| Cholecalciferol 2000 IU PO daily.
  19| Acetaminophen 650 mg PO every 6 hours as needed for pain. Rx 8841207.
  20| Atorvastatin 40 mg PO nightly and lisinopril 10 mg PO daily, both continued from home.
  21| 
  22| Follow-up. He will be seen in the endocrine clinic within two weeks. Ambulation is limited to household distances with the walker until that visit. His sister will stay at the house until he is steady with the walker. Questions about the infusion can be sent to bone.desk@example.org. Outside films from before March 2026 should be forwarded if they exist. Summer Braddock understands the fever precautions for the first few days at home.
  23| 
  24| Signed,
  25| Karim ibn Farouk
  26| Metabolic Bone Hospital
=== END DOCUMENT ===

=== DOCUMENT fd-0280 ===
   1| Green Valley Health Center
   2| 512 River Road, Suite 200
   3| Columbus, OH 43215
   4| Clinic Phone: (614) 555-0138
   5| Provider Email: marcus.fletcher@example.org
   6| Portal: https://mychart.example.com/patient/summary
   7| 
   8| OUTPATIENT COMPREHENSIVE CLINICAL PROGRESS NOTE
   9| Date of Encounter: March 4, 2026
  10| Patient Identification: 4821-9932-07
  11| Patient Name: Gurdev Grewal
  12| DOB: August 14, 1934
  13| Age: 91 y.o.
  14| Attending: Marcus E. Fletcher, MD
  15| 
  16| SUBJECTIVE:
  17| Mr. Gurdev Grewal is a 91 y.o. gentleman with a medical history of chronic
  18| systolic heart failure, essential hypertension, benign prostatic
  19| hyperplasia, and mild vascular cognitive impairment who presents today
  20| for routine outpatient chronic disease follow-up. The patient arrived
  21| at the clinic via specialized paratransit mobility transport, vehicle
  22| license plate 4KLT892. He is accompanied today by his son-in-law, Brian
  23| Miller, who assists with medication administration and manages his
  24| daily home schedule.
  25| 
  26| Mr. Miller reports that the patient has experienced stable functional
  27| status over the past two months without acute syptoms of decompensation.
  28| There have been no episodes of paroxysmal nocturnal dyspnea, orthopnea,
  29| chest pressure, palpitations, or lightheadedness. Daily home weights
  30| have remained within a narrow range of 152 to 154 lbs. His appetite
  31| is reported as satisfactory, and he drinks adequate fluids. The patient
  32| uses a four-wheeled rolling walker for household amublation. His
  33| son-in-law confirms that all home prescriptions are taken faithfully
  34| and requests an evalution of his latest routine outpatient laboratory
  35| panels.
  36| 
  37| CURRENT MEDICATIONS:
  38| 1. Lisinopril 20 mg PO daily.
  39| 2. Carvedilol 12.5 mg PO BID.
  40| 3. Furosemide 20 mg PO daily in the morning.
  41| 4. Tamsulosin 0.4 mg PO at bedtime.
  42| 5. Atorvastatin 20 mg PO at bedtime.
  43| 6. Aspirin 81 mg PO daily.
  44| 
  45| PHYSICAL EXAMINATION:
  46| Vital Signs: Blood pressure 138/82 mmHg, heart rate 72 bpm regular,
  47| respiratory rate 16 breaths/min, body temperature 98.4 F, oxygen
  48| saturation 97% on ambient room air. Weight 69.4 kg (153 lbs).
  49| General: Pleasant, frail elderly male in no acute distress, resting
  50| comfortably in chair, alert and oriented to person and city.
  51| HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to
  52| light. Sclerae anicteric. Oral mucosa moist.
  53| Cardiovascular: Regular rate and rhythm, normal S1 and S2, soft 1/6
  54| systolic murmur at the apex, no gallops or pericardial friction rubs.
  55| Carotid pulses brisk bilaterally without bruits.
  56| Pulmonary: Lungs clear to auscultation bilaterally in all fields; no
  57| crackles, wheezing, or rhonchi.
  58| Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds.
  59| Extremities: Trace non-pitting edema at bilateral ankles; no calf
  60| tenderness. Dorsalis pedis pulses 2+ bilaterally.
  61| Neurologic: Cranial nerves II-XII grossly intact. Sensation intact
  62| to light touch distally. Motor strength 5/5 upper extremities, 4+/5
  63| lower extremities symmetrically. Gait slow but steady with walker.
  64| 
  65| LABORATORY REVIEW:
  66| Specimen drawn earlier this morning: Serum sodium 138 mEq/L, potassium
  67| 4.5 mEq/L, chloride 101 mEq/L, bicarbonate 26 mEq/L, blood urea nitrogen
  68| 24 mg/dL, serum creatinine 1.2 mg/dL (eGFR 58 mL/min/1.73m2). Fasting
  69| blood glucose 118 mg/dL, hemoglobin A1c 6.9%. Complete blood count:
  70| white blood cell count 6.4 x10^3/uL, hemoglobin 13.2 g/dL, hematocrit
  71| 39.4%, platelet count 198 x10^3/uL.
  72| 
  73| ASSESSMENT AND PLAN:
  74| Gurdev Grewal is a 91 y.o. male with well-compensated heart failure
  75| and hypertension, demonstrating clinical stability.
  76| 1. Chronic Systolic Heart Failure:
  77| - Clinically euvolemic with stable weights and trace ankle edema.
  78| - Continue lisinopril 20 mg PO daily, carvedilol 12.5 mg PO BID, and
  79|   furosemide 20 mg PO daily.
  80| - Continue daily morning weight checks; contact office for 3 lb gain.
  81| 2. Essential Hypertension:
  82| - Blood pressure acceptable at 138/82 mmHg. Regimen unchanged.
  83| 3. Benign Prostatic Hyperplasia:
  84| - Continue tamsulosin 0.4 mg PO at bedtime without adverse effects.
  85| 4. Preventative Health and Follow-up:
  86| - Return to clinic in four months for repeat metabolic panel and clinical
  87|   review. Brian Miller was provided a direct portal link to review
  88|   laboratory results: https://mychart.example.com/patient/summary.
  89| 
  90| Provider Signature:
  91| Marcus E. Fletcher, MD
  92| Internal Medicine, Green Valley Health Center
=== END DOCUMENT ===

=== DOCUMENT fd-0242 ===
   1| INPATIENT CONSULTATION NOTE
   2| SERVICE: CARDIOLOGY CONSULTATION SERVICE
   3| REASON FOR CONSULTATION: Acute decompensated heart failure management and
   4| medication optimization in the setting of ischemic cardiomyopathy.
   5| 
   6| HISTORY OF PRESENT ILLNESS:
   7| The patient is a 72-year-old male with a significant cardiac history including
   8| ischemic cardiomyopathy status post three-vessel coronary artery bypass
   9| grafting in 2018, persistent atrial fibrillation, and Graves disease who was
  10| admitted through the emergency department with worsening dyspnea on exertion,
  11| orthopnea, and progressive lower extremity edema over the past two weeks. He
  12| reports awakening with sudden shortness of breath requiring three pillows to
  13| sleep comfortably. Outside Hospital records indicate an admission in 2022 for
  14| a similar heart failure exacerbation, at which time a transthoracic
  15| echocardiogram demonstrated a left ventricular ejection fraction of 30% with
  16| severe anterior and apical hypokinesis.
  17| 
  18| Prior to admission, the patient was toleratting his home cardiac regimen
  19| without difficulty, but notes poor adherence over the past holiday period due
  20| to increased dietary sodium intake. In addition, the patient has a history of
  21| post-herpetic neuralgia along the right T6 dermatome, for which he takes Lyrica
  22| with modest relief. He has had no chest pressure, syncope, fevers, or cough.
  23| His wife reports that his functional exercise tolerance has dropped from
  24| walking several blocks to struggling with simple household transfers.
  25| 
  26| PAST MEDICAL AND SURGICAL HISTORY:
  27| 1. Ischemic cardiomyopathy (NYHA Class III, Stage C), diagnosed in 2017.
  28| 2. Coronary artery bypass graft x3 in 2018 (LIMA-LAD, SVG-OM1, SVG-PDA).
  29| 3. Persistent atrial fibrillation, rate-controlled.
  30| 4. Graves disease, diagnosed in 2020, clinically euthyroid on therapy.
  31| 5. Post-herpetic neuralgia affecting right thoracic wall.
  32| 6. Chronic stasis dermatitis of bilateral lower extremities.
  33| 
  34| CURRENT INPATIENT MEDICATIONS:
  35| 1. Furosemide 80 mg IV BID (initiated upon admission).
  36| 2. Sacubitril/valsartan 24/26 mg PO BID.
  37| 3. Carvedilol 12.5 mg PO BID.
  38| 4. Spironolactone 25 mg PO daily.
  39| 5. Apixaban 5 mg PO BID.
  40| 6. Methimazole 5 mg PO daily.
  41| 7. Lyrica 50 mg PO TID.
  42| 8. Prednisone 40/30/20/10 mg oral taper prescribed by the outpatient clinic
  43|    for a severe flare of inflammatory dermatosis, currently on 10 mg daily.
  44| 9. Heparin 5000 units subcutaneous q8h (held while on apixaban).
  45| 
  46| PHYSICAL EXAMINATION:
  47| Vitals: BP 114/72 mmHg, HR 68 bpm (irregularly irregular), RR 18 /min,
  48| temperature 98.6 F, SpO2 96% on 2 L/min oxygen via nasal cannula.
  49| General: Moderately ill-appearing male resting in bed with head elevated at
  50| 45 degrees, conversant in full sentences without overt respiratory distress.
  51| HEENT: Normocephalic, no scleral icterus. Mild proptosis secondary to Graves
  52| disease without active conjunctival injection or ophthalmoplegia.
  53| Neck: Jugular venous distension noted at 8 cm above the sternal notch at 45
  54| degrees. Carotid upstrokes normal bilaterally without audible bruits.
  55| Cardiovascular: Irregular rhythm, normal S1, physiologically split S2, S3
  56| gallop appreciated at the apex. Soft 2/6 holosystolic murmur at the lower left
  57| sternal border.
  58| Pulmonary: Bibasilar fine inspiratory crackles extending through the lower
  59| one-third of both lung fields. No wheezing or rhonchi.
  60| Abdomen: Soft, mildly distended, non-tender. Hepatojugular reflux positive.
  61| Extremities: 3+ pitting edema extending bilaterally to mid-calf with chronic
  62| hyperpigmentation and mild weeping skin changes. Peripheal pulses 1+ at the
  63| posterior tibial arteries bilaterally.
  64| Neurologic: Alert, oriented to person, place, and year. Non-focal exam.
  65| 
  66| LABORATORY AND DIAGNOSTIC DATA:
  67| Serum sodium 137 mEq/L, potassium 4.4 mEq/L, chloride 101 mEq/L, bicarbonate
  68| 23 mEq/L, BUN 28 mg/dL, serum creatinine 1.3 mg/dL, eGFR 58 mL/min/1.73m2.
  69| Total bilirubin 0.9 mg/dL, AST 24 U/L, ALT 22 U/L. Serum troponin I <0.02
  70| ng/mL (negative x2). NT-proBNP 2480 pg/mL (elevated). Free T4 1.2 ng/dL,
  71| thyroid-stimulating hormone 1.8 mIU/L.
  72| Electrocardiogram: Atrial fibrillation with controlled ventricular response,
  73| mean heart rate 70 bpm, left bundle branch block, QRS duration 148 ms.
  74| Chest Radiography: Cardiomegaly with pulmonary vascular congestion, prominent
  75| interstitial markings, and small blunting of bilateral costophrenic angles.
  76| 
  77| ASSESSMENT AND PLAN:
  78| Acute decompensated biventricular heart failure in a 72-year-old male with
  79| known ischemic cardiomyopathy, reduced ejection fraction, and baseline atrial
  80| fibrillation, provoked primarily by dietary noncompliance and volume overload.
  81| 1. Volume Overload / Decongestion:
  82| - Continue aggressive intravenous diuresis with furosemide 80 mg IV BID.
  83| - Maintain strict intake and output recording and daily standing weights.
  84| - Goal net fluid removal of 1.5 to 2.0 liters over the next 24 hours.
  85| - Monitor basic metabolic panel every 12 hours during active titration.
  86| 2. Guideline-Directed Medical Therapy:
  87| - Continue sacubitril/valsartan at current dose; defer upward titration until
  88|   euvolumic state is approached and renal function stabilizes.
  89| - Continue carvedilol 12.5 mg PO BID; heart rate is appropriately controlled.
  90| - Continue spironolactone 25 mg PO daily with close monitoring of potassium.
  91| 3. Anticoagulation & Comorbidities:
  92| - Continue apixaban 5 mg PO BID for systemic thromboembolism prophylaxis.
  93| - Maintain methimazole 5 mg PO daily for Graves disease.
  94| - Complete final day of prednisone taper (10 mg PO daily) then discontinue.
  95| - Continue Lyrica 50 mg PO TID for neuropathic symptoms.
  96| - Inpatient referral sent to Wound Care for management of weeping lower
  97|   extremity stasis changes and application of protective barrier dressings.
  98| 4. Disposition:
  99| - Case disussed with the primary inpatient medical service.
 100| - Follow-up cardiology evaluation scheduled tomorrow morning.
 101| 
 102| Consultant Signature:
 103| Attending Cardiologist, Cardiology Service
 104| Consultation Fellow, Cardiovascular Disease
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.