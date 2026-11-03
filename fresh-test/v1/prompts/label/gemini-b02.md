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


=== DOCUMENT fd-0154 ===
   1| OUTPATIENT CONSULTATION NOTE
   2| REASON FOR CONSULTATION: Evaluation of chronic bilateral lower extremity pain and suspected radiculopathy versus peripheral neuropathy.
   3| 
   4| HISTORY OF PRESENT ILLNESS:
   5| The patient is a 64-year-old female who presents for comprehensive outpatient evaluation of worsening bilateral lower extremity burning discomfort, numbness, and paresthesias. Her symptoms initially began distally in both feet in 2018 and have gradually progressed proximally to mid-calf level over the intervening years. She describes the sensation as a persistent "fire-like" ache accompanied by intermittent sharp, electric shocks that intensify at night, significantly disrupting her sleep architecture. She was previously treated with gabapentin, which was discontinued due to excessive daytime sedation. In 2021, she was initiated on Lyrica 75 mg PO BID, which provided partial relief; however, over the past year her pain has escalated to an average severity of 7/10 on the visual analog scale.
   6| Records transferred from Outside Hospital document an emergency department encounter in 2023 for acute right lower extremity swelling, at which time a Wells score was calculated at 0 points (low probability), and bilateral venous duplex ultrasound ruled out deep vein thrombosis. An electromyogram and nerve conduction study performed at that facility demonstrated findings consistent with distal symmetric sensorimotor polyneuropathy. Additionally, the patient reports a history of recurrent right-sided facial weakness that occurred in 2019, which was diagnosed as idiopathic Bell palsy and resolved almost completely following an oral steroid taper.
   7| She denies bowel or bladder incontinence, saddle anesthesia, focal lower extremity weakness, fevers, chills, or unintentional weight loss. Her daughter accompanies the patient to the visit and confirms that balance has deteriorated mildly over the past six months, prompting the patient to utilize a single-point cane for prolonged ambulation.
   8| 
   9| PAST MEDICAL HISTORY:
  10| 1. Type 2 diabetes mellitus without acute complications, diagnosed in 2012.
  11| 2. Distal symmetric sensorimotor polyneuropathy.
  12| 3. Essential hypertension.
  13| 4. Hyperlipidemia.
  14| 5. History of right-sided Bell palsy in 2019, resolved.
  15| 6. Mild osteoarthritis of bilateral knees.
  16| 
  17| PAST SURGICAL HISTORY:
  18| 1. Laparoscopic cholecystectomy in 2015.
  19| 2. Right carpal tunnel release in 2017.
  20| 
  21| CURRENT MEDICATIONS:
  22| 1. Lyrica (pregabalin) 75 mg PO BID.
  23| 2. Metformin 1000 mg PO BID.
  24| 3. Glipizide 5 mg PO daily before breakfast.
  25| 4. Lisinopril 20 mg PO daily.
  26| 5. Atorvastatin 40 mg PO QHS.
  27| 6. Allegra (fexofenadine) 180 mg PO daily PRN seasonal allergies.
  28| 7. Prednisone 40/30/20/10 mg oral taper completed earlier this year for an inflammatory flare.
  29| 8. Acetaminophen 650 mg PO q8h PRN musculoskeletal pain.
  30| 
  31| ALLERGIES:
  32| Codeine (causes nausea and pruritus). No known food or environmental allergies.
  33| 
  34| REVIEW OF SYSTEMS:
  35| Constitutional: Negative for fever, diaphoresis, fatigue, or anorexia.
  36| Cardiovascular: Negative for chest pain, orthopnea, or paroxysmal nocturnal dyspnea.
  37| Respiratory: Negative for shortness of breath, chronic cough, or wheezing.
  38| Gastrointestinal: Negative for abdominal pain, nausea, vomiting, melena, or hematochezia.
  39| Musculoskeletal: Positive for bilateral knee stiffness; negative for joint erythema or effusion.
  40| Neurological: Positive for distal bilateral lower extremity numbness, tingling, and burning; negative for tremors, syncope, or focal motor weakness.
  41| 
  42| PHYSICAL EXAMINATION:
  43| Vitals: BP 134/82 mmHg, HR 72 bpm regular, RR 16 /min, SpO2 99% on room air, temperature 98.4 F (36.9 C), BMI 28.4 kg/m2.
  44| General: Well-nourished, comfortable, in no acute distress. Alert and oriented x 4.
  45| Cardiovascular: Regular rate and rhythm, normal S1 and S2, no murmurs, rubs, or gallops. Peripheral pulses (radial, dorsalis pedis, posterior tibial) 2+ bilaterally.
  46| Pulmonary: Lungs clear to auscultation bilaterally; no wheezes, rales, or rhonchi.
  47| Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds.
  48| Musculoskeletal: Normal range of motion in hips and knees. No joint swelling. Minimal crepitus noted on bilateral knee palpattion.
  49| Neurologic: Cranial nerves II-XII intact, with trace residual right facial asymmetry from remote Bell palsy. Motor strength 5/5 throughout upper and lower extremities bilaterally. Deep tendon reflexes 2+ at biceps and patellae bilaterally, 0 at Achilles tendons bilaterally. Sensory exam reveals symmetric decreased sensation to light touch and pinprick in a stocking distribution extending to mid-calf bilaterally. Vibratory sensation diminished at great toes bilaterally. Proprioception intact at the ankles. Gait is mildly antalgic but stable with cane. Romberg test is negative.
  50| Integumentary: Warm, dry, intact. No plantar ulcerations. Mild erythmatous patch over the anterior right tibia without induration or warmth.
  51| 
  52| DIAGNOSTIC DATA:
  53| Serum sodium 140 mEq/L, potassium 4.3 mEq/L, chloride 102 mEq/L, bicarbonate 24 mEq/L, BUN 18 mg/dL, serum creatinine 0.9 mg/dL, eGFR 78 mL/min/1.73m2, fasting glucose 142 mg/dL. Hemoglobin A1c 7.6%. Complete blood count: WBC 6.8 x10^3/uL, hemoglobin 13.4 g/dL, hematocrit 40.2%, platelets 245 x10^3/uL. Thyroid-stimulating hormone 2.1 mIU/L, vitamin B12 480 pg/mL, methylmalonic acid 0.18 umol/L (within normal limits).
  54| 
  55| ASSESSMENT AND PLAN:
  56| The patient is a 64-year-old female with longstanding type 2 diabetes mellitus presenting with symptomatic progressive diabetic peripheral neuropathy, asesssed as inadequately controlled on current regimen.
  57| 1. Neuropathic Pain:
  58| - Titrate Lyrica from 75 mg PO BID to 150 mg PO BID over the next two weeks. Advise patient regarding potential side effects including peripheral edema and somnolence.
  59| - Referral placed to Pain Clinic for multimodal pain assessment, physical therapy evaluation, and consideration of adjunctive topical compounded therapy.
  60| - Diabetic foot care education reinforced today, emphasizing daily self-inspection of feet and proper footwear.
  61| 2. Diabetes Mellitus:
  62| - Glycemic control suboptimal with HbA1c 7.6%. Referral initiated to Diabetes Center for specialized diabetic education and medical nutrition therapy.
  63| - Continue metformin 1000 mg PO BID and glipizide 5 mg PO daily.
  64| 3. Preventative & Follow-up:
  65| - Follow-up appointment scheduled in the clinic in 8 weeks to assess symptomatic response to dosage adjustment and review repeat renal profile.
  66| 
  67| Author: Clinical Attending Physician
  68| Department of Internal Medicine
  69| Cosigner: Supervising Staff Physician
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

=== DOCUMENT fd-0106 ===
   1| 88301942
   2| ST. ANSELM REGIONAL MEDICAL CENTER
   3| OUTPATIENT GERIATRIC MEDICINE CLINIC
   4| 4820 Highland Terrace, Suite 300, Minneapolis, MN 55416
   5| Telephone: (612) 555-0144 | Direct: 612.555.0182
   6| Patient Portal: https://portal.example.org/records/patient-access
   7| 
   8| ENCOUNTER DOCUMENTATION: CLINICAL PROGRESS NOTE
   9| PATIENT: VON LINDEMANN, JÜRGEN
  10| DOB: 03/18/1932
  11| AGE: 94-year-old
  12| GENDER: Male
  13| ACCOUNT NUMBER: ACCT-904128
  14| DATE OF SERVICE: 11/04/2026
  15| PREVIOUS VISIT: 14 Oct 2026
  16| ATTENDING PHYSICIAN: Arthur Pendelton, MD
  17| 
  18| SUBJECTIVE:
  19| REASON FOR VISIT:
  20| Routine follow-up evaluation for chronic hypertension, bilateral knee
  21| osteoarthritis, and benign prostatic hyperplasia.
  22| 
  23| HISTORY OF PRESENT ILLNESS:
  24| Mr. Jürgen von Lindemann is a 94-year-old gentleman who presents to
  25| the outpatient geriatric clinic today for routine interval follow-up.
  26| He is accompanied to the visit by his 61-year-old daughter, Martha
  27| Caldwell, who serves as his primary caregiver and assists with his
  28| instrumental activities of daily living, including grocery shopping and
  29| weekly medication organization. Mr. von Lindemann reports that he has
  30| been feeling generally well since his prior evaluation on 14 Oct 2026.
  31| He notes persistent but mild early morning stiffness in his right knee
  32| that typically resolves within twenty to thirty minutes after he begins
  33| moving around his residence. He reports no acute joint swelling, heat,
  34| or redness. He ambulates using a single-point cane and denies falls or
  35| near-fall episodes over the past three months.
  36| 
  37| From a cardiovascular and pulmonary standpoint, Mr. von Lindemann
  38| denies chest tightness, exertional chest pressure, palpitations,
  39| orthopnea, paroxysmal nocturnal dyspnea, or lower extremity swelling.
  40| He has not experienced lightheadedness, postural dizziness, or visual
  41| changes upon standing. Home blood pressure measurements recorded by
  42| his daughter have been stable, typically running from 122/70 mmHg to
  43| 134/76 mmHg.
  44| 
  45| Regarding his urologic history, he reports no dysuria, urgency, or
  46| acute urinary symtoms. He awakens twice per night to void, which has
  47| been his stable baseline for over three years. He maintains a good
  48| stream without hesitancy or terminal dribbling. Appetite is intact,
  49| weight has been steady, and bowel habits remain regular without
  50| melena or hematochezia.
  51| 
  52| CURRENT MEDICATIONS:
  53| 1. Lisinopril 20 mg oral tablet once daily every morning
  54| 2. Atorvastatin 20 mg oral tablet once daily at bedtime
  55| 3. Tamsulosin hydrochloride 0.4 mg oral capsule daily after dinner
  56| 4. Acetaminophen 500 mg oral tablet as needed for knee discomfort
  57| 5. Cholecalciferol (Vitamin D3) 1000 international units oral daily
  58| 
  59| ALLERGIES:
  60| No known drug allergies (NKDA).
  61| 
  62| PAST MEDICAL HISTORY:
  63| 1. Essential hypertension, longstanding, well controlled.
  64| 2. Primary osteoarthritis of bilateral knees, right worse than left.
  65| 3. Benign prostatic hyperplasia without urinary retention.
  66| 4. Hyperlipidemia, controlled on moderate-intensity statin therapy.
  67| 5. Bilateral sensorineural hearing impairment, corrected with aids.
  68| 
  69| PAST SURGICAL HISTORY:
  70| 1. Right total knee arthroplasty, eleven years prior, uncomplicated.
  71| 2. Left inguinal herniorrhaphy, fifteen years prior, uncomplicated.
  72| 3. Bilateral cataract phacoemulsification with intraocular lenses.
  73| 
  74| SOCIAL HISTORY:
  75| Mr. von Lindemann resides in a private senior apartment situated at
  76| 712 Cedar Ridge Lane, Apt 4B, St. Paul, MN 55105. He is a retired
  77| structural draftsman. His daughter, Mrs. Caldwell, lives within ten
  78| minutes and visits four times weekly. He is a lifetime non-smoker
  79| with no history of tobacco or recreational substance use. He does not
  80| consume alcoholic beverages. He remains independent with feeding,
  81| dressing, grooming, and personal hygiene.
  82| 
  83| REVIEW OF SYSTEMS:
  84| General: Denies fever, chills, diaphoresis, fatigue, or anorexia.
  85| HEENT: Wears hearing aids. Denies vision loss, epistaxis,
  86| or sore throat.
  87| Respiratory: Denies cough, wheeze, dyspnea, or hemoptysis.
  88| Cardiovascular: Denies chest pain, palpitations, or pedal edema.
  89| Gastrointestinal: Denies nausea, vomiting, dysphagia, or constipation.
  90| Genitourinary: Denies dysuria, gross hematuria, or incontinence.
  91| Musculoskeletal: Reports mild right knee ache, denies hip or back pain.
  92| Neurological: Denies transient weakness, numbness, vertigo, or tremor.
  93| Psychiatric: Denies anxiety, restlessness, or sleep disturbances.
  94| 
  95| OBJECTIVE:
  96| PHYSICAL EXAMINATION:
  97| Vitals:
  98| Blood pressure: 126/72 mmHg (right arm, seated)
  99| Heart rate: 66 beats per minute, regular rhythm
 100| Respiratory rate: 16 breaths per minute, unlabored
 101| Temperature: 98.2 deg F (36.8 deg C) oral
 102| Pulse oximetry: 98% on room air
 103| Weight: 166.0 lbs (75.3 kg) | Height: 68.0 in | BMI: 25.2 kg/m2
 104| 
 105| General: Well-appearing, cooperative, articulate 94-year-old gentleman
 106| sitting comfortably on the examination table in no distress.
 107| Head/Eyes: Normocephalic. Pupils equal, round, reactive to light.
 108| Extraocular motions intact. Sclerae anicteric.
 109| Ears/Nose/Throat: Hearing aids in place bilaterally. Moist mucous
 110| membranes. Pharynx non-erythematous without exudates.
 111| Neck: Supple. Trachea midline. Jugular venous distension absent. No
 112| cervical lymphadenopathy or carotid bruits.
 113| Cardiovascular: Regular rhythm, normal S1 and S2. No murmur, gallop,
 114| or pericardial friction rub. Peripheral pulses palpable 2+ bilaterally.
 115| Pulmonary: Thorax symmetric with normal respiratory effort. Clear to
 116| auscultaion bilaterally across all lung fields. No wheeze or rales.
 117| Abdomen: Soft, non-distended, non-tender to light and deep palpation.
 118| Bowel sounds normoactive in all four quadrants. No organomegaly.
 119| Extremities: No clubbing, cyanosis, or peripheral edema. Right knee
 120| demonstrates a well-healed midline anterior arthroplasty scar.
 121| Passive range of motion reveals mild crepitation without joint effusion,
 122| warmth, or erythema. Left knee has full range of motion. Wells score
 123| for deep vein thrombosis equals 0 (low clinical probability).
 124| Neurologic: Alert and oriented to person, place, time, and situation.
 125| Cranial nerves II through XII intact. Motor strength 5/5 in bilateral
 126| upper and lower extremities. Light touch sensation intact distally.
 127| Gait is steady with single-point cane.
 128| 
 129| IN-CLINIC LABORATORY DATA:
 130| Point-of-care capillary glucose: 104 mg/dL
 131| Urinalysis dipstick: Negative for leukocytes, nitrites, protein, blood.
 132| Serum creatinine from 11/04/2026: 1.12 mg/dL, eGFR 64 mL/min/1.73m2.
 133| Serum potassium from 11/04/2026: 4.4 mEq/L.
 134| 
 135| ASSESSMENT AND PLAN:
 136| Mr. Jürgen von Lindemann is a pleasant 94-year-old male who presents
 137| for scheduled chronic disease management. Findings and management plans
 138| are organized by active medical problem below:
 139| 
 140| 1. Essential hypertension:
 141| Blood pressure is currently at goal on lisinopril 20 mg daily, with no
 142| postural symptoms or adverse effects. Renal function and electrolytes
 143| are stable. Plan is to continue lisinopril 20 mg oral daily. Home log
 144| monitoring will continue with assistance from his daughter.
 145| 
 146| 2. Bilateral knee osteoarthritis:
 147| Mild, chronic symptoms managed adequately with prn acetaminophen and
 148| assistive cane ambulation. Wells score is 0 with no evidence of deep
 149| venous thrombosis. Joint exam is stable without effusion. Plan: Continue
 150| current acetaminophen 500 mg as needed (not to exceed 2000 mg daily).
 151| Formal outpatient physical therapy will be recomended if mobility
 152| becomes impaired.
 153| 
 154| 3. Benign prostatic hyperplasia:
 155| Lower urinary tract symptoms remain mild and stable on tamsulosin.
 156| No urinary tract infection on in-clinic urinalysis. Plan: Continue
 157| tamsulosin 0.4 mg oral capsule daily after dinner.
 158| 
 159| 4. Preventive and health maintenance:
 160| Seasonal influenza vaccine (FL-90214) administered intramuscularly
 161| into the left deltoid today after discussion of risks and benefits.
 162| Fall risk precautions reviewed; home environment is well adapted.
 163| 
 164| PATIENT EDUCATION AND FOLLOW-UP:
 165| Diagnostic results, appointment reminders, and visit summaries remain
 166| accessible through the patient portal at:
 167| https://portal.example.org/records/patient-access
 168| 
 169| Follow-up visit scheduled in six months for routine geriatric review,
 170| or sooner if interval medical concerns arise. Patient and caregiver
 171| instructed to contact the clinic nursing staff at (612) 555-0144 with
 172| any interim questions.
 173| 
 174| Arthur Pendelton, MD
 175| Division of Geriatric Medicine
 176| St. Anselm Regional Medical Center
 177| Direct provider line: 612.555.0182
 178| Signed electronically: 11/04/2026 14:15 CST
=== END DOCUMENT ===

=== DOCUMENT fd-0046 ===
   1| 84729103
   2| REFERRAL CONSULTATION LETTER
   3| Date: 04/18/2026
   4| 
   5| To: Dr. Robert Bauer, MD
   6| Cardiac Arrhythmia Service
   7| 420 Commonwealth Avenue, Suite 305, Boston, MA 02215
   8| Tel: (617) 555-0182 | Fax: (617) 555-0195
   9| 
  10| From: Dr. Alistair MacIntyre, MD
  11| General Cardiology Practice
  12| 
  13| Patient: JOÃO DE HOLANDA-SILVA
  14| Date of Birth: 08/14/1954
  15| Contact Person: Mr. David Miller (son-in-law)
  16| 
  17| Dear Dr. Bauer,
  18| 
  19| I am referring Mr. João de Holanda-Silva, a 71-year-old male with symptomatic paroxysmal atrial fibrillation and sick sinus syndrome, for electrophysiology evaluation regarding possible catheter ablation versus lead revision. He is accompanied by his son-in-law, Mr. David Miller, who assists with medication administration and outpatient transportation.
  20| 
  21| Mr. de Holanda-Silva underwent dual-chamber pacemaker implantation three years ago for symptomatic sinus pauses and bradycardia-tachycardia syndrome. His device is a dual-chamber permanent pacemaker, serial number SN-482019-E. During a recent ambulatory monitoring window from 03/12/2026 to 03/19/2026, he experienced recurrent episodes of palpitations, dizziness, and near-syncope despite compliance with antiarrhythmic therapy. His son-in-law reports that during these episodes, the patient feels lightheaded and fatigued, which significantly restricts his activities of daily living. We have attempted uptitration of beta-blocker therapy, but this was limited by symptomatic resting bradycardia down to 48 bpm while in sinus rhythm.
  22| 
  23| Interrogation on April 18th demonstrated a 24% ventricular pacing burden and multiple sustained runs of atrial fibrillation with rapid ventricular response up to 142 bpm. There was also an intermittent high ventricular pacing threshold recorded on the right ventricular lead.
  24| 
  25| Past Medical History:
  26| 1. Paroxysmal atrial fibrillation with rapid ventricular response.
  27| 2. Sick sinus syndrome status post dual-chamber pacemaker placement.
  28| 3. Essential hypertension.
  29| 4. Mild chronic kidney disease, stage 2.
  30| 
  31| Physical Examination and Vitals:
  32| Vitals recorded today show blood pressure 134/82 mmHg, resting heart rate 54 bpm (paced), respiratory rate 16 breaths per minute, body mass index 27.4 kg/m2, and oxygen saturation 97% on ambient air. Cardiovascular exam reveals regular rate and rhythm without murmurs, rubs, or gallops. Pacemaker pocket site in the left prepectoral area is clean, intact, non-tender, and without erythema, fluctuance, or device erosion. Peripheral pulses are 2+ bilaterally, and there is trace bilateral pretibial edema. Jugular venous pressure is measured at approximately 6 cm H2O.
  33| 
  34| Diagnostic and Laboratory Data:
  35| Recent labs collected on 04/10/2026 show serum sodium 139 mEq/L, potassium 4.4 mEq/L, chloride 102 mEq/L, serum creatinine 1.18 mg/dL, blood urea nitrogen 22 mg/dL, and eGFR 68 mL/min/1.73m2. Hemoglobin is 14.1 g/dL with a platelet count of 224 K/uL. Thyroid-stimulating hormone is normal at 1.84 uIU/mL. NT-proBNP is elevated at 340 pg/mL. Transthoracic echocardiogram completed on March 28th demonstrated left ventricular ejection fraction (LVEF) of 48%, mild concentric left ventricular hypertrophy, left atrial volume index of 38 mL/m2, and trace mitral regurgitation without regional wall motion abnormalities.
  36| 
  37| Current Medications:
  38| - Metoprolol succinate 50 mg PO daily
  39| - Apixaban 5 mg PO BID
  40| - Lisinopril 10 mg PO daily
  41| - Atorvastatin 20 mg PO at bedtime
  42| 
  43| Thank you very much for evaluating Mr. de Holanda-Silva. We would greatly appreciate your guidance on whether he would benefit from pulmonary vein isolation, atrioventricular node ablation with biventricular pacing upgrade, or right ventricular lead repositioning. Please feel free to contact my office directly if any additional records or tracing data are required.
  44| 
  45| Sincerely,
  46| Dr. Alistair MacIntyre, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0282 ===
   1| HOSPITAL DISCHARGE SUMMARY
   2| 
   3| Service: Internal Medicine
   4| Admission Status: Inpatient
   5| Patient Demographics: 67-year-old female
   6| 
   7| Principal Diagnosis:
   8| Acute exacerbation of chronic peripheral neuropathic pain and lumbar radiculopathy.
   9| 
  10| Secondary Diagnoses:
  11| 1. Type 2 diabetes mellitus, diagnosed in 2018.
  12| 2. Essential hypertension, diagnosed in 2015.
  13| 3. Lumbar spinal stenosis with L4-L5 degenerative spondylolisthesis.
  14| 4. History of idiopathic peripheral facial nerve palsy (Bell palsy), resolved.
  15| 
  16| History of Present Illness:
  17| The patient is a 67-year-old female admitted for severe, refractory burning pain and paresthesias in the lower extremities radiating along the L5 dermatome bilaterally. The symptoms began insidiously several years ago but worsened markedly over the past month. She experienced intermittant sharp pains that disrupted sleep and walking. Lumbar magnetic resonance imaging performed at an Outside Hospital demonstrated moderate central canal stenosis and bilateral neural foraminal narrowing at the L4-L5 level. On arrival, she was in distress due to neuropathic shooting pains rated 9/10 on the numeric rating scale.
  18| 
  19| Hospital Course:
  20| During the hospital stay, the care team coordinated acute pain stabilization and medication optimization. Physical therapy and occupational therapy evaluated the patient for safe ambulation and transfers. She was noted to be ambualting with a rolling walker under supervision. Given the neuropathic character of her discomfort, she was initiated on pregabalin (Lyrica) 75 mg PO BID, which was titrated upwards with significant symptomatic relief. In addition, an anti-inflammatory oral corticosteroid taper was administered for acute radicular nerve root irritation. Baseline neurological examination demonstrated normal mental status, intact cranial nerves without residual deficits from her remote Bell palsy, 5/5 motor strength in the bilateral upper extremities, and 4/5 strength in bilateral ankle dorsiflexion.
  21| 
  22| Laboratory and Diagnostic Studies:
  23| Complete metabolic panel and hematology results were reviewed:
  24| - Serum sodium: 138 mEq/L
  25| - Serum potassium: 4.2 mEq/L
  26| - Serum creatanine: 0.88 mg/dL
  27| - Blood urea nitrogen: 16 mg/dL
  28| - Fasting blood glucose: 134 mg/dL
  29| - Hemoglobin A1c: 7.2%
  30| - Hemoglobin: 13.1 g/dL
  31| - White blood cell count: 6.4 K/uL
  32| - Platelet count: 245 K/uL
  33| Vitals prior to discharge: Blood pressure 126/74 mmHg, resting pulse 70 bpm, respiratory rate 16 breaths per minute, body temperature 98.4 F, oxygen saturation 98% on room air.
  34| 
  35| Discharge Medications:
  36| 1. Lyrica (pregabalin) 75 mg PO BID for neuropathic pain.
  37| 2. Prednisone oral taper: prednisone 40/30/20/10 mg PO daily for four days each step, then discontinue.
  38| 3. Metformin 500 mg PO BID with meals.
  39| 4. Lisinopril 20 mg PO daily.
  40| 5. Acetaminophen 650 mg PO q8h PRN for breakthrough pain.
  41| 
  42| Discharge Plan and Follow-up:
  43| The patient was discharged in improved condition with her daughter present for counseling. The daughter confirmed that she will assist the patient with daily living activities and medication oversight. Referrals have been submitted for comprehensive follow-up care:
  44| - Referral to Pain Clinic for evaluation of lumbar epidural steroid injection.
  45| - Referral to Diabetes Center for outpatient glycemic education and dietary review.
  46| - Physical therapy home exercise program to continue every 2/3 weeks as scheduled.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.