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


=== DOCUMENT fd-0192 ===
   1| 74019284
   2| Date of Service: 04.03.2026
   3| PATIENT: Yaroslav Wozniak
   4| DOB: 12.08.1933
   5| Demographics: 92M
   6| Account Number: AC-9938120
   7| ADDRESS: 842 NORTH HAMPTON ROAD, APT 4D, OAK BROOK, IL 60523
   8| Phone: (312) 555-0184
   9| Facility: Highland Creek Care Center
  10| Attending Physician: Arthur Campbell, MD
  11| Contact Email: arthur.campbell@example.org
  12| 
  13| CLINICAL COMPREHENSIVE PROGRESS AND REHABILITATION ASSESSMENT
  14| 
  15| CHIEF COMPLAINT AND REASON FOR ENCOUNTER:
  16| Evaluation of rehabilitation progress following acute hospitalization for subcapital femoral neck fracture, management of underlying cognitive decline, monitoring of obstructive sleep apnea therapy, and discharge planning.
  17| 
  18| HISTORY OF PRESENT ILLNESS:
  19| Mr. Yaroslav Wozniak is a 92M retired metallurgical engineer who was admitted to Highland Creek Care Center on 18 Oct 2025 following an acute inpatient stay for an operative right hemiarthroplasty secondary to a mechanical fall at home. He currently lives in Oak Brook with his adult daughter, Mrs. Clara Cross, who serves as his primary caregiver and medical power of attorney. On the morning of today's evaluation, 04.03.2026, the patient was transported from the physical therapy suite via specialized medical wheelchair van, transport license plate 7XYZ912, for this comprehensive monthly interdisciplinary re-assessment.
  20| 
  21| According to his daughter, Mrs. Clara Cross, who was contacted by telephone at (312) 555-0119 ext. 204 and via email at clara.cross@example.net, Mr. Wozniak has demonstrated steady, albeit slow, improvement in transfer capabilities and standing tolerance over the past month. However, Mrs. Cross noted intermittent periods of sundowning and nocturnal disorientation, particularly when awakening during the night. The patient utilizes a home CPAP machine nightly for severe obstructive sleep apnea; interrogation of his Respironics DreamStation device, serial number CP-9082341, demonstrates an average nightly usage of 5.8 hours over the preceding thirty consecutive days, with an 90th-percentile pressure of 11.2 cmH2O and a residual apnea-hypopnea index of 3.4 events per hour, confirming therapeutic adherence and efficacy.
  22| 
  23| He denies active localized pain in the right hip, chest pressure, palpitations, dyspnea at rest, fevers, chills, or acute gastrointestinal distress. He reports occasional chronic bilateral knee aching rated 2/10, managed adequately with scheduled topical therapy. Review of his inpatient chart reveals that a formal geriatric psychiatry consultation was completed earlier this week on Mar 4 2026 by Dr. Andrew van der Beek, who recommended maintaining low-dose nighttime melatonin and continuing structured daytime orientation prompts while strictly avoiding sedating antihistamines or benzodiazepines.
  24| 
  25| PAST MEDICAL HISTORY:
  26| 1. Right subcapital femoral neck fracture status post right hip hemiarthroplasty (October 2025).
  27| 2. Vascular dementia with mild behavioral disturbance.
  28| 3. Obstructive sleep apnea, adherent to CPAP therapy.
  29| 4. Essential hypertension, well controlled.
  30| 5. Hyperlipidemia.
  31| 6. Stage 3 chronic kidney disease (baseline creatinine 1.4 to 1.6 mg/dL).
  32| 7. Benign prostatic hyperplasia with mild lower urinary tract symptoms.
  33| 8. History of deep venous thrombosis in 2021, completed therapeutic course.
  34| 
  35| PAST SURGICAL HISTORY:
  36| 1. Right hip hemiarthroplasty (October 2025).
  37| 2. Transurethral resection of the prostate (2018).
  38| 3. Bilateral cataract extraction with intraocular lens implantation (2014, 2016).
  39| 
  40| CURRENT MEDICATIONS:
  41| 1. Lisinopril 10 mg PO daily.
  42| 2. Amlodipine 5 mg PO daily.
  43| 3. Atorvastatin 20 mg PO at bedtime.
  44| 4. Tamsulosin 0.4 mg PO daily at bedtime.
  45| 5. Donepezil 10 mg PO daily at bedtime.
  46| 6. Melatonin 3 mg PO nightly at 21:00.
  47| 7. Acetaminophen 650 mg PO TID PRN joint pain.
  48| 8. Diclofenac 1% topical gel, 2 grams applied to bilateral knees TID PRN.
  49| 9. Polyethylene glycol 17 g PO daily in water for constipation prophylaxis.
  50| 10. Ergocalciferol (Vitamin D2) 50,000 units PO once weekly.
  51| 
  52| REVIEW OF SYSTEMS:
  53| Constitutional: No fevers, diaphoresis, rigors, or unassisted weight changes.
  54| HEENT: Vision corrected with lenses. Hearing mildly impaired bilaterally; wears hearing aids. No dysphagia.
  55| Cardiovascular: No chest tightness, peripheral edema, or orthopnea.
  56| Respiratory: No cough, sputum production, wheezing, or shortness of breath.
  57| Gastrointestinal: Appetite good. Bowel movements regular every 1 to 2 days without straining.
  58| Genitourinary: Nocturia x 1-2. No dysuria, gross hematuria, or acute urinary retention.
  59| Musculoskeletal: Right hip incision healed without pain on passive mobilization. Mild crepitus in bilateral knees.
  60| Neurologic: Mild baseline expressive word-finding difficulty; no focal motor deficits, seizures, or tremors.
  61| Psychiatric: Mild nocturnal confusion noted by staff; no visual hallucinations or aggressive behaviors.
  62| 
  63| PHYSICAL EXAMINATION:
  64| Vital Signs: Blood pressure 126/74 mmHg, pulse 68 bpm regular, respiratory rate 16 breaths/min, temperature 98.2 F (36.8 C), oxygen saturation 98% on room air.
  65| General: Frail elderly male, resting comfortably in a high-back wheelchair with footrests, well-groomed, pleasant, in no acute distress.
  66| Cognition: Alert. Oriented to person and partially to place (identifies facility as a recovery hospital); disoriented to exact date, estimating the year correctly. Montreal Cognitive Assessment (MoCA) completed last week scored 18/30.
  67| HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to light. Oropharynx clear with moist mucous membranes. Dentition intact with well-fitting lower partial denture.
  68| Cardiovascular: Regular rhythm, normal S1 and S2. Soft 1/6 systolic ejection murmur heard best at the right upper sternal border, non-radiating. No peripheral edema of the lower extremities. Radial and dorsalis pedis pulses 2+ bilaterally.
  69| Pulmonary: Lungs clear to auscultation bilaterally in anterior and posterior lung fields. Good air movement. No wheezing, rales, or rhonchi.
  70| Abdomen: Soft, non-tender, non-distended. Normal active bowel sounds present in all four quadrants. No organomegaly or palpable masses.
  71| Musculoskeletal / Surgical Site: Well-healed 12 cm linear surgical scar along the right lateral hip without erythema, warmth, dehiscence, or purulence. Range of motion of right hip reveals flexion to 95 degrees, abduction to 25 degrees, with no pain elicited on internal or external rotation. Upper extremity strength 5/5 bilaterally. Lower extremity strength 4+/5 on right hip flexion and knee extension, 5/5 on the left.
  72| Neurologic: Cranial nerves II through XII grossly intact. Deep tendon reflexes 1+ symmetrically at biceps, triceps, and patellae. Plantar reflexes flexor bilaterally. Sensation to light touch intact across all four extremities.
  73| Skin: Skin turgor normal for age. No sacral, trochanteric, or calcaneal pressure injuries. Mild senile purpura on bilateral dorsal forearms.
  74| 
  75| FUNCTIONAL MOBILITY AND THERAPY SUMMARY:
  76| Review of physical and occupational therapy progress notes indicates Mr. Wozniak has achieved modified independence for bed mobility and transfers from sit-to-stand with standby assistance of one person. He ambulates up to 150 feet utilizing a front-wheeled walker with contact guard assistance. Activities of daily living (upper body dressing and hygiene) are performed with minimal assistance; lower body dressing requires moderate assistance due to hip precautions.
  77| 
  78| LABORATORY VALUES (Collected 03.03.2026):
  79| Serum sodium 139 mEq/L, potassium 4.2 mEq/L, chloride 103 mEq/L, bicarbonate 25 mEq/L, blood urea nitrogen 22 mg/dL, serum creatinine 1.4 mg/dL (estimated GFR 49 mL/min/1.73m2, baseline), glucose 96 mg/dL. Complete blood count: white blood cell count 6.2 x10^3/uL, hemoglobin 12.1 g/dL, hematocrit 36.8%, platelet count 210 x10^3/uL. Urinalysis negative for nitrites, leukocyte esterase, or bacteria.
  80| 
  81| ASSESSMENT AND CLINICAL IMPRESSION:
  82| Yaroslav Wozniak is a 92M who is making satisfactory functional recovery following surgical repair of a right subcapital femoral neck fracture, with stable comorbid vascular dementia and obstructive sleep apnea.
  83| 1. Right Hip Arthroplasty Rehabilitation:
  84| - Surgical wound is fully healed. Functional ambulation progressing appropriately with walker. Continue skilled physical therapy 5 days per week targeting endurance and balance.
  85| - Maintain weight-bearing as tolerated with standard posterior hip precautions through the end of the month.
  86| 2. Vascular Dementia and Sundowning:
  87| - Continue donepezil 10 mg PO at bedtime.
  88| - Non-pharmacologic interventions prioritized: sleep hygiene, routine daytime ambulation, natural lighting exposure in morning, calming environment at dusk. Continue melatonin 3 mg PO at 21:00. Dr. van der Beek to re-evaluate in four weeks.
  89| 3. Obstructive Sleep Apnea:
  90| - Stable on CPAP device CP-9082341 at 11 cmH2O pressure. Continue current settings.
  91| 4. Hypertension and Cardiovascular Risk:
  92| - Well controlled on lisinopril and amlodipine. Continue current dosing.
  93| 5. Chronic Kidney Disease:
  94| - Stable renal function with creatinine 1.4 mg/dL. Avoid nephrotoxic agents including systemic nonsteroidal anti-inflammatory drugs.
  95| 6. Discharge Planning:
  96| - Target discharge to his home in Oak Brook under the care of Mrs. Cross anticipated within three weeks. Home health physical therapy and occupational therapy referrals to be finalized prior to transition. Case management will arrange delivery of shower chair, raised toilet seat, and home CPAP supplies.
  97| 
  98| Provider Signature:
  99| Arthur Campbell, MD
 100| Attending Geriatric Physician, Highland Creek Care Center
 101| Supervising Physician Cosignature:
 102| P.J. Abernathy, MD
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

=== DOCUMENT fd-0128 ===
   1| Chart no. 7301948
   2| Patient: Albright, Arthur
   3| Encounter Date: 05/12/2026
   4| Email Contact: arthur.albright@example.org
   5| Subject: Prescription renewal request and follow-up consultation
   6| 
   7| Message 1
   8| From: arthur
   9| Sent: 05/12/2026 08:45 AM
  10| To: Dr. Laura Hastings
  11| 
  12| hello dr. hastings,
  13| i am writing to request a renewal for my maintenance eye drops and to ask about my recent facial weakness. as you know, back in August 2025 when i was first evaluated as a 62-year-old male with hypertension, we established my baseline care plan. recently my sister Clara Bell noticed that the right side of my mouth was slightly drooping when i smiled, and my right eyelid was not fully closing. she was concerned because our father had a history of stroke. however, i had no arm weakness, confusion, or difficulty speaking. when i saw the urgent care provider on 05/10/2026, he diagnosed idiopathic facial nerve paralysis, specifically Bell palsy, and started me on oral corticosteroids and valacyclovir.
  14| 
  15| my prednisone taper is now complete, and the facial motor strength is gradually recovering. however, my right eye remains dry and irritated, especially in the wind. my current artificial tears prescription under Rx # 4820194 has run out of refills at the pharmacy. could you please submit an updated electronic renewal for carboxymethylcellulose 0.5% ophthalmic solution, instill 1 to 2 drops in the right eye four times daily PRN? my sister Clara Bell has been helping me with the drops and driving me to my appointments. my home vitals this morning were BP 128/82 mmHg and pulse 74 bpm. thank you for your help.
  16| 
  17| Message 2
  18| From: Dr. Laura Hastings, MD
  19| Sent: 05/12/2026 11:20 AM
  20| To: Albright, Arthur
  21| 
  22| Dear Mr. Albright,
  23| 
  24| Thank you for reaching out through the portal. I reviewed the urgent care clinical notes from your visit on 05/10/2026. The presentation and rapid partial recovery are characteristic of Bell palsy, and I am glad that your sister Clara Bell promptly had you evaluated to exclude an acute cerebrovascular event.
  25| 
  26| I have transmitted a renewed authorization for carboxymethylcellulose 0.5% ophthalmic drops under Rx # 4820194 to your designated pharmacy, with three refills authorized. Please continue to instill 1 to 2 drops in the right eye four times daily PRN, and remember to use lubricating ophthalmic ointment at bedtime with eye taping if nocturnal lagophthalmos persists to prevent corneal abrasion.
  27| 
  28| For your records and insurance documentation, my supervising provider credentials are NPI: 1487029381. If you experience worsening facial asymmetry, hyperacusis, or vision changes, please email our clinical nursing pool at triage@example.org or notify us immediately through the portal. We will schedule a comprehensive follow-up examination in June 2026.
  29| 
  30| Sincerely,
  31| Laura Hastings, MD
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.