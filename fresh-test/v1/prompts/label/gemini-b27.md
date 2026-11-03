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

=== DOCUMENT fd-0090 ===
   1| CLINICAL PROGRESS NOTE
   2| Date of Service: 03-18-2026
   3| PATIENT: WURAL, SINAN
   4| DOB: 05-12-1934
   5| Age: ninety-one years old
   6| Account Number: AC-8402917
   7| Address: 1428 Kapiolani Blvd, Apt 6C, Honolulu, HI 96814
   8| Telephone: (808) 555-0142 ext. 312
   9| Attending Physician: TALIA MALIMALI, MD
  10| 
  11| SUBJECTIVE:
  12| Mr. Sinan Wural is a ninety-one years old gentleman with a documented history of Parkinson disease, complete heart block status-post dual-chamber pacemaker placement, essential hypertension, and chronic kidney disease stage 3a who presents for scheduled outpatient geriatric follow-up. The patient is accompanied today by his daughter-in-law, Mrs. Maeve O'Brien-Cleary, who provides supportive collateral history. Mrs. O'Brien-Cleary notes that over the past month, Mr. Wural has experienced increased resting tremors in his right hand and mild freezing episodes when initiating ambulation down hallways. He has had no syncope, palpitations, chest pressure, orthopnea, or falls. Pacemaker interrogation was performed last week; device serial number PXC901842 showed 99% atrial pacing, 2% ventricular pacing, and battery longevity estimated at 6.4 years with normal lead impedance. Appetite is fair. Bowel habits are maintained on scheduled docusate.
  13| 
  14| CURRENT MEDICATIONS:
  15| 1. Carbidopa-levodopa 25/100 mg PO TID.
  16| 2. Amlodipine 5 mg PO daily.
  17| 3. Atorvastatin 20 mg PO at bedtime.
  18| 4. Polyethylene glycol 17 g PO daily PRN constipation.
  19| 
  20| PHYSICAL EXAMINATION:
  21| Vitals: BP 128/76 mmHg, pulse 70 bpm regular (paced), respirations 16 /min, temperature 98.1 F, SpO2 97% on room air. Weight 68.2 kg.
  22| General: Pleasant, frail elderly male in no acute distress, alert and oriented x 3.
  23| HEENT: Normocephalic, atraumatic. Extraocular movements intact without nystagmus. Mild facial masking consistent with Parkinson disease.
  24| Cardiovascular: Regular rate and rhythm, normal S1 and S2, crisp pacing clicks, no murmurs.
  25| Pulmonary: Lungs clear to auculatation bilaterally; no crackles or wheezes.
  26| Abdomen: Soft, non-tender, non-
  27| distended. Bowel sounds normoactive.
  28| Neurological: Cranial nerves II-XII grossly intact. Motor strength 5/5 bilaterally in upper and lower extremities with mild cogwheel rigidity elicited at the right wrist and right elbow. Moderate resting pill-rolling tremor in right hand that suppresses with intentional movement. Rapid alternating movements mildly slowed on the right. Bilatral patellar reflexes 1+. Gait is moderately shuffling with reduced right arm swing, but patient turns without loss of balance using a four-wheeled rolling walker.
  29| Skin: Warm, dry. Pacemaker site in left prepectoral region is clean, dry, and intact with no erythema, tenderness, or erosion.
  30| 
  31| ASSESSMENT AND PLAN:
  32| Sinan Wural is a ninety-one years old male with Parkinson disease and cardiac pacemaker, presenting with progression of motor symptoms.
  33| 1. Parkinson disease: Motor fluctuations with prominent tremor and freezing episodes. Will increase carbidopa-levodopa from 25/100 mg TID to one and a half tablets (37.5/150 mg) PO TID. Physical therapy referral submited for gait retraining and balance maintenance.
  34| 2. Pacemaker status: Device PXC901842 operating satisfactorily with stable parameters. Continue annual cardiology follow-up.
  35| 3. Follow-up: Recheck in geriatric clinic in six weeks. Mrs. O'Brien-Cleary was instructed to contact our office if freezing worsens or dizziness develops.
  36| 
  37| Provider Signature:
  38| TALIA MALIMALI, MD
  39| Attending Geriatrician
  40| Staff Fellow: Dr. Keanu Kalama
=== END DOCUMENT ===

=== DOCUMENT fd-0294 ===
   1| Discharge Summary
   2| Patient Name: BABATUNDE TAGBO
   3| Account Number: 6041 3829 15
   4| Date of Admission: Nov. 8, 2026
   5| Discharge Date: Nov. 12, 2026
   6| Primary Care Clinic: Pine Grove Rehabilitation Center
   7| Contact Telephone: (404) 555-0144
   8| Home Address: 482 Highland Avenue, Atlanta, GA 30312
   9| Emergency Contact: Aylin Demir (partner)
  10| Care Team: Dr. Miriam Feinstein (Attending), Dr. Ari Levin (Resident), Leah Goldfarb, RN (Primary Nurse)
  11| 
  12| Service: Internal Medicine
  13| Admission Diagnosis: Acute unprovoked deep vein thrombosis of the left lower extremity.
  14| Discharge Diagnosis: Left lower extremity deep vein thrombosis, resolved acute pain.
  15| 
  16| History of Present Illness:
  17| Mr. Tagbo is a 52-year-old male who presented with four days of progressive left calf swelling, erythema, and calf tenderness. In the emergency department, his Wells score for DVT was calculated at 3 points (high probability), prompting a lower extremity duplex ultrasound which demonstrated an occlusive thrombus in the left popliteal and posterior tibial veins. He denied chest pain, shortness of breath, or hemoptysis. He has no prior personal history of venous thromboembolism.
  18| 
  19| Hospital Course:
  20| Upon admission to the medical floor under the care of Dr. Miriam Feinstein and Dr. Ari Levin, the patient was initiated on enoxaparin 1 mg/kg subcutaneously every 12 hours as bridging therapy, alongside apixaban 10 mg PO BID. Over the subsequent 72 hours, his leg pain and edema improved significantly. Serial examinations revealed progressive softening of the gastrocnemius compartment with resolving erythema and decreasing circumference discrepancy between the lower extremities. Repeat duplex ultrasound confirmed non-propagation of the popliteal clot. He remained hemodynamically stable throughout the stay with blood pressure averaging 124/78 mmHg and heart rate 68 to 74 beats per minute. Ambulatory saturation remained 98% on room air. PT/INR and complete metabolic panel were unremarkable; baseline serum creatinine was 0.92 mg/dL. He toelrated oral intake and physical therapy without complication. Prior to discharge, apixaban was transitioned to maintenance planning, and he was provided with educational materials regarding signs of bleeding and pulmonary embolism. His partner, Aylin Demir, was present for nursing education delivered by Leah Goldfarb, RN, and confirmed understanding of the medication schedule and red-flag symptoms.
  21| 
  22| Discharge Medications:
  23| 1. Apixaban 10 mg oral tablet, take 1 tablet PO BID through Nov. 15, 2026, then decrease to 5 mg PO BID for 6 months. Rx 6912048-D.
  24| 2. Acetaminophen 500 mg oral tablet, take 1 to 2 tablets PO every 6 hours PRN mild calf ache.
  25| 
  26| Follow-Up Plan:
  27| The patient was dischaged in stable condition. He will follow up with Dr. Miriam Feinstein at Pine Grove Rehabilitation Center on Nov. 24, 2026, for repeat clinical assesment and therapeutic monitoring.
  28| 
  29| Miriam Feinstein, MD
  30| Attending Physician, Department of Medicine
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.