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

=== DOCUMENT fd-0093 ===
   1| Round Hill Clinic
   2| History and Physical
   3| 
   4| Patient: Maïmouna Haba
   5| Age: 94
   6| MRN: 6104-8831-27
   7| Date of Service: 03/18/2026
   8| Claim number 8830214461
   9| 
  10| Chief complaint
  11| Dyspnea on exertion, leg swelling, and a medicine review with her daughter.
  12| 
  13| History of present illness
  14| Maïmouna Haba comes in with her daughter, Mrs. Ivy Langford, who sets up the pill box and keeps the pacemaker wallet card in a kitchen drawer. Over three weeks she has needed one pause on the short walk from the bedroom to the kitchen, and she now sleeps on two pillows. She has not had chest pain, noticed palpitations, fever, or a cough that brings up sputum. The home scale is up about four pounds, and supper portions are smaller than they were last month. She does not wake gasping, and she has not fainted.
  15| 
  16| On the 4th of July she was a belted passenger in a low-speed lot collision. She did not hit her head and did not lose consciousness. The sedan would not restart and was towed, and the plate she remembered is 7QRM218. Bruising over the hip and the chest wall faded, and she gave up driving after that day. She has no pain today that she links to the collision.
  17| 
  18| A dual-chamber pacemaker was placed for sick sinus syndrome on Mar. 11, 2024. She does not know her pacing thresholds. The wallet card lists generator serial AX9044182. The pocket does not twitch, and the old incision is flat and pale. Interrogation is due this spring, and her daughter will drive her when the device clinic calls.
  19| 
  20| Mrs. Ivy Langford lives in Calders Ferry and stays in the apartment three nights a week. Ms. June Adeyemi at the front desk changed the refill pharmacy to Willow Lane Pharmacy so bottles are not split between shops. She initialed the medication review as J.A. before I came in.
  21| 
  22| Past medical history
  23| Sick sinus syndrome status post dual-chamber pacemaker. Heart failure with preserved ejection fraction, last ejection fraction 60 percent. Stage 3b chronic kidney disease. Hypertension. Osteoarthritis of the knees and the right hip. Hypothyroidism. Remote cholecystectomy. No diabetes and no prior stroke.
  24| 
  25| Medications
  26| Apixaban 2.5 mg PO BID
  27| Metoprolol succinate 50 mg PO daily
  28| Furosemide 20 mg PO daily
  29| Lisinopril 2.5 mg PO daily
  30| Levothyroxine 75 mcg PO each morning
  31| Acetaminophen 650 mg PO TID PRN pain
  32| Cholecalciferol 1000 units PO daily
  33| 
  34| Allergies
  35| Penicillin caused a rash in childhood, with no airway swelling.
  36| 
  37| Family history
  38| Her mother died of a stroke in late life, and her father died of pneumonia after a fracture. Her daughter is in good health. There is no known bleeding disorder in the family.
  39| 
  40| Social history
  41| She lives in a ground-floor apartment and worked for years as a seamstress before retiring. She does not smoke and has not taken alcohol in many years. Walking is indoors, with a walker for the hall and the ramp. A neighbor sits with her on nights when her daughter is away. She reads with glasses and has not fallen inside the apartment this season.
  42| 
  43| Review of systems
  44| General: fatigue with the dyspnea, no fever and no night sweats. Eyes and ears: no new change in vision and no spinning vertigo. Cardiac and respiratory: as in the present illness, no wheeze. Gastrointestinal: mild constipation, no black stool, no vomiting. Urinary: no burning and no new incontinence. Neurologic: no focal weakness and no new confusion. Mood: frustrated by the limits, not hopeless, and she still enjoys radio in the afternoon. Skin: no new rash around the pacemaker pocket.
  45| 
  46| Examination
  47| Blood pressure 146/72 mmHg, pulse 68 beats per minute and regular, respirations 18 per minute, oxygen saturation 95 percent on room air, temperature 97.9 F, weight 52.4 kg.
  48| She is frail, alert, and oriented to person, place, and year. Mucosa is moist and speech is clear. Jugular venous pressure is about 8 cm of water. Lungs have crackles at both bases without wheeze. The heart is regular, with a soft systolic murmur at the upper sternal border that her daughter says is old. The abdomen is soft, with a cholecystectomy scar and no tenderness. The pacemaker pocket on the left upper chest is flat, without redness or warmth. There is pitting edema to the mid shins. Knees are bony without a warm effusion. Face is symmetric, without the droop of Bell palsy. No pill-rolling tremor of Parkinson disease. Gait with the walker is slow, and the turn is steady. Mood is appropriate and insight is intact.
  49| 
  50| Labs and studies
  51| Basic metabolic panel this morning: sodium 138 mmol/L, potassium 4.3 mmol/L, creatinine 1.28 mg/dL against a baseline near 1.2 mg/dL, blood urea nitrogen 24 mg/dL, glucose 96 mg/dL. Hemoglobin is 12.4 g/dL. TSH was 3.1 mIU/L last autumn and was not repeated today. The electrocardiogram shows a paced rhythm with capture. A chest radiograph was not repeated, because the weight and the lung exam already support volume overload.
  52| 
  53| Assessment and plan
  54| 1. Volume overload on a background of heart failure with preserved ejection fraction. Furosemide will increase from 20 mg PO daily to 40 mg PO daily for five days, then return to 20 mg PO daily if the morning weight is back to her usual number. She should call for a gain over 2 kg, dyspnea at rest, or dizziness. Creatinine and potassium will be rechecked in one week.
  55| 2. Anticoagulation. Two apixaban dose-reduction factors are present, age and weight at 52.4 kg, while creatinine stays under 1.5 mg/dL, so the dose remains apixaban 2.5 mg PO BID. There has been no fall in the apartment this season. Continue the same dose, and hold it for black stool, a nosebleed that will not stop, or any strike to the head. The brand name Eliquis is what the bottle says, and the daughter knows that name.
  56| 3. Pacemaker follow-up. The pocket looks quiet and there is no hiccup at rest. Interrogation will be scheduled with the device clinic rather than forced into this visit. The serial from the card was copied into today's note so the clinic can match the generator.
  57| 4. Blood pressure. Systolic pressure is still above the goal I would like, but I will not raise lisinopril on the same day the diuretic changes, with creatinine already a little above baseline. Recheck the number with the lab draw.
  58| 5. Osteoarthritis and constipation. Acetaminophen may continue. Ibuprofen was discussed again and set aside because of apixaban and the kidneys. Polyethylene glycol 17 g PO daily as needed, one cap in water, was added for constipation. A physical therapy referral can wait unless the walker starts to feel unsafe on the ramp.
  59| 6. Teaching and follow-up. Her daughter repeated the furosemide change, wich is the teach-back I wanted. She recieved a written schedule. A seperate pill box for the five higher-dose days was marked with tape.
  60| 
  61| Contacts confirmed by her daughter:
  62| 1844 BIRCH LANE APT 3B
  63| GREYSTONE, WI 53599
  64| Phone (414) 555-0162
  65| Fax (414) 555-0108
  66| Email m.haba@example.com
  67| 
  68| Electronically signed by Dr. Tosin Balogun
  69| Internal Medicine
  70| 
  71| Author: Dr. Tosin Balogun
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.