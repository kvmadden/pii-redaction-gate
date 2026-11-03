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


=== DOCUMENT fd-0252 ===
   1| CLINICAL CARE MANAGEMENT AND PRIOR AUTHORIZATION MEMORANDUM
   2| SERVICE COORDINATION AND PHARMACY REVIEW
   3| 
   4| SUBJECT: INTERDISCIPLINARY CARE PLAN AND PHARMACY BENEFIT SUMMARY
   5| 
   6| This administrative memorandum summarizes the continuing care coordination and clinical management pathway for the patient, a 67-year-old male with complex endocrine and cardiovascular disease. Historical clinical documentation indicates that hyperthyroidism secondary to Graves disease was originally identified in 2019, complicated by mild orbitopathy and persistent sinus tachycardia. Clinical summaries transferred from Outside Hospital confirm that radioactive iodine ablation was deferred in favor of medical management, with episodic clinical monitoring maintained through ambulatory endocrine consults.
   7| 
   8| During the most recent clinical evaluation, baseline vital signs were documented as follows: blood pressure 134/82 mmHg, heart rate 88 bpm regular, respiratory rate 16 breaths/min, body temperature 98.6 F, and oxygen saturation 98% on ambient air. Concurrent laboratory testing revealed thyroid-stimulating hormone (TSH) suppressed at < 0.01 uIU/mL, free thyroxine (free T4) elevated at 2.6 ng/dL, and total triiodothyronine (total T3) at 198 ng/dL. Hepatic functional parameters remained stable with alanine aminotransferase 24 U/L, aspartate aminotransferase 21 U/L, adn total bilirubin 0.7 mg/dL. Complete blood count demonstrated an absolute neutrophil count of 3,400 /uL, reassuring against thionamide-induced agranulocytosis.
   9| 
  10| Active multidisciplinary referrals have been processed to ensure integrated disease oversight. The patient has been scheduld for follow-up nutritional and metabolic consultation through Diabetes Center. A parallel referral to Cardiology was initiated to address rate control and assess left ventricular systolic function via transthoracic echocardiogram. An initial assessment through Pain Clinic was also requested for cervical radicular symptoms.
  11| 
  12| The active outpatient medication regimen includes the following verified prescriptions:
  13| - methimazole 10 mg PO TID for thyrotoxicosis control
  14| - propranolol 20 mg PO TID for sympathetic symptom mitigation
  15| - Allegra 180 mg PO daily for chronic seasonal rhinitis
  16| - prednisone 40/30/20/10 mg daily taper administered over twenty days for acute thyroid eye discomfort
  17| 
  18| The clinical care coordinator and covering clinical pharmacist have reviewed the medication profile to prevent adverse drug-drug interactions. Benefit coverage has been authorized by the health plan for ongoing diagnostic monitoring every 2/3 weeks until biochemical euthyroidism is achieved. For any administrative inquirey regarding this coordination summary, care coordinators may submit requests through the secure clinical communication exchange.
  19| 
  20| DIVISION OF SPECIALTY CARE COORDINATION
=== END DOCUMENT ===

=== DOCUMENT fd-0286 ===
   1| PRIOR AUTHORIZATION & MEDICATION RECONCILIATION REVIEW
   2| TRANSCRIBED FROM SECURE FAX TRANSMISSION
   3| 
   4| PATIENT NAME: Mateo
   5| Guerrero-Méndez
   6| DOB: 05-18-1935
   7| AGE: The patient is ninety-one years old.
   8| ACCOUNT NUMBER: Account #: AC-9948201
   9| RESIDENCE ADDRESS: 724 Willow Ridge Boulevard, Austin, TX 78704
  10| PRIMARY CAREGIVER: Margaret Jenkins (patient's adult stepdaughter)
  11| CONTACT PHONE: +1-512-555-0177
  12| ATTENDING CLINICIAN: Dr. Julian Fair, MD
  13| REVIEWING PHARMACIST: Tariq al-Mansoor, PharmD, BCACP
  14| PRIMARY DEVICE: Tandem t:slim X2 Insulin Pump, Serial SN-7749201
  15| 
  16| CLINICAL BACKGROUND AND ENCOUNTER SUMMARY:
  17| Medication reconciliation and clinical prior authorization intake reivewed
  18| on 11-04-2026 by clinical specialist Tariq al-Mansoor. Dr. Fair's clinic
  19| referred this ninety-one years old male for assistance with ongoing
  20| coverage authorization of disposable infusion sets and rapid-acting
  21| insulin analog supplies. The patient has managed type 1 diabetes mellitus
  22| for over four decades and is currently maintained on automated insulin
  23| delivery using a Tandem t:slim X2 insulin pump, Serial SN-7749201.
  24| Recent point-of-care capillary blood glucose average over fourteen days
  25| is 142 mg/dL. Renal function remains preserved for age with a serum
  26| creatinine of 1.08 mg/dL and urinary albumin-to-creatinine ratio within
  27| baseline limits. No history of severe pump site infection or
  28| unexplained hyperglycemia.
  29| 
  30| TELEPHONE CONSULTATION WITH CAREGIVER:
  31| A telephone reconciliation was conducted with Margaret Jenkins, who
  32| provides daily assistance with infusion site changes and device
  33| calibration. She reports that Mr. Guerrero-Méndez's continuous glucose
  34| monitor confirms a time in range of 74%, with minimal nocturnal
  35| hypoglycemia over the preceding 30 days. Margaret noted that the
  36| inital shipment of reservoir cartridges was delayed by the medical
  37| supplier, requiring a bridge refill authorization.
  38| 
  39| CURRENT ACTIVE MEDICATIONS:
  40| 1. Insulin lispro (Humalog) 100 units/mL subcutaneous continuous basal
  41| infusion via pump at 0.65 units/hour, with mealtime boluses of 1 unit per
  42| 10 grams of carbohydrate PO TID before meals.
  43| 2. Atorvastatin 20 mg PO once daily at bedtime for hyperlipidemia.
  44| 3. Losartan potassium 50 mg PO daily for diabetic nephropathy and
  45| hypertension.
  46| 4. Levothyroxine sodium 75 mcg PO daily in the morning on an empty stomach.
  47| 5. Acetaminophen 650 mg PO q8h PRN for mild knee osteoarthritis pain.
  48| 6. Polyethylene glycol 3350 17 g PO daily PRN constipation.
  49| 
  50| CLINICAL JUSTIFICATION & PRIOR AUTHORIZATION:
  51| Prior authorization approval is requested under Account #: AC-9948201 for
  52| continued insulin cartridge and cannula supplies. Dr. Julian Fair
  53| submitted attestation confirming that Mateo Guerrero-Méndez demonstrates
  54| documented cognitive and manual dexterity with pump operation alongside his
  55| caregiver. Abrupt discontinuation of automated insulin delivery poses
  56| severe risk of diabetic ketoacidosis. The current pump dosgae parameters
  57| have achieved glycemic stability without severe hypoglycemic excursions.
  58| 
  59| PHARMACY PLAN & NEXT ACTIONS:
  60| 1. Prior authorization appeal forms and past three months of device upload
  61| logs transmitted to the patient's prescription benefit plan.
  62| 2. Notified Dr. Fair of successful submission; copy placed in patient
  63| chart.
  64| 3. Contacted medical supply vendor to release emergency 30-day supply of
  65| pump cartridges and infusion sets directly to 724 Willow Ridge Boulevard.
  66| 4. Follow-up call with Margaret Jenkins scheduled within 72 hours.
  67| 
  68| Tariq al-Mansoor, PharmD
  69| Clinical Pharmacy Ambulatory Services
=== END DOCUMENT ===

=== DOCUMENT fd-0119 ===
   1| TRANSCRIPT OF CLINICAL PHARMACY RECONCILIATION CALL
   2| SERVICE: Endocrinology
   3| REFERRAL DESTINATION: Diabetes Center
   4| SOURCE OF PREVIOUS RECORDS: Outside Hospital
   5| PATIENT AGE: 68-year-old male
   6| SPEAKERS: Clinical Pharmacist, Patient's Son
   7| 
   8| [Call Audio Recording Commenced]
   9| 
  10| Clinical Pharmacist: Ambulatory pharmacy consultation line, this is the clinical pharmacist speaking. Who am I speaking with today?
  11| 
  12| Patient's Son: Hello, yes, uh, good afternoon. I am calling on behalf of my father. He is, uh, he is a 68-year-old patient following with your endocrine service. He had, uh, he had some blood work drawn earlier this week, and we received a notification that his thyroid levels were markedly abnormal. Also, the records transferred over from Outside Hospital indicated that his anti-thyroid regimen needed adjustment, so we wanted to review his current medications.
  13| 
  14| Clinical Pharmacist: Certainly, I can help reconcile his medications and review those lab trends with you. Looking at his chart history, he was initially diagnosed with Graves disease in 2019, and he has had intermittent relapses of thyrotoxicosis. Can you tell me what symptoms he is currently experiencing at home?
  15| 
  16| Patient's Son: Well, um, over the past week he has had noticeable palpitations, heat intolerance, and a fine tremor in his fingers. He also says he feels anxious and has trouble sleeping. We checked his vitals this morning: his blood pressure was 142/86 mmHg, heart rate was elevated at 104 bpm regular, respiratory rate was 18 breaths per minute, and his weight was down 2.4 kg compared to last month.
  17| 
  18| Clinical Pharmacist: Those clinical signs are very consistent with excess circulating thyroid hormone. Looking at the laboratory values drawn two days ago, his thyroid stimulating hormone is suppressed at less than 0.01 uIU/mL, his free thyroxine, or free T4, is elevated at 2.8 ng/dL, and his free triiodothyronine is 6.2 pg/mL. He also had a radioactive iodine uptake scan documented from Outside Hospital which showed diffuse homogeneous uptake of 58% at 24 hours, confirming active Graves disease rather than destructive thyroiditis.
  19| 
  20| Patient's Son: Yes, exactly. And what about his current prescriptions? He takes methimazole, but we were confused about the dose because of his recent allergic rash.
  21| 
  22| Clinical Pharmacist: Let us review every medication he is currently taking. He was restarted on methimazole 10 mg PO daily, but then developed a diffuse pruritic maculopapular rash. To manage that allergic reaction, the covering clinician prescribed brand Allegra 180 mg PO daily alongside a rapid steroid taper using prednisone 40/30/20/10 mg PO daily, stepping down the dose every 3 days. Did he finish that prednisone taper?
  23| 
  24| Patient's Son: Yes, he took the last 10 mg prednisone tablet three days ago. The hives cleared up completely with the Allegra, and he is still taking the Allegra 180 mg PO once every morning without any issues. But now that the steroid is done, his palpitations seem more prominent.
  25| 
  26| Clinical Pharmacist: That makes clinical sense. The corticosteroids suppress peripheral conversion of T4 to T3, so stopping the taper unmasked his hyperadrenergic symptoms. For his tachycardia and tremor, the attending endocrinologist has placed an order for propranolol 20 mg PO TID PRN for heart rate greater than 90 bpm or bothersome tremors. Have you picked up that propranolol prescription yet?
  27| 
  28| Patient's Son: Yes, we have the propranolol bottle here at home, but we were waiting to talk to someone before giving him the first pill.
  29| 
  30| Clinical Pharmacist: You can go ahead and give him his first dose of propranolol 20 mg PO right now with water. It should help slow his pulse and relieve that internal shakiness within thirty to sixty minutes. In addition, because his glycemic parameters have fluctuated with the steroids—his fasting blood glucose was 158 mg/dL on the recent metabolic panel—we are placing a formal referral to the Diabetes Center for lifestyle education and blood glucose surveillance while his thyroid levels normalize.
  31| 
  32| Patient's Son: That is very reassuring. Should he continue taking the methimazole 10 mg daily as well?
  33| 
  34| Clinical Pharmacist: Yes, please continue methimazole 10 mg PO daily in the morning. If he develops any recurrence of severe rash, facial swelling, high fever, or a severe sore throat, stop the methimazole immediately and notify us, as those can be signs of agranulocytosis. We will repeat his complete blood count and liver function tests, along with free T4 and total T3, in four weeks.
  35| 
  36| Patient's Son: Understood. Give the propranolol 20 mg PO now for the palpitations, keep taking methimazole 10 mg and Allegra 180 mg daily, watch for fever or throat pain, and attend the Diabetes Center appointment.
  37| 
  38| Clinical Pharmacist: That is exactly right. If his heart rate stays over 110 bpm at rest despite the propranolol, or if he develops chest pain, shortness of breath, or confusion, seek emergency medical care immediately.
  39| 
  40| Patient's Son: Thank you very much for explaining everything so clearly.
  41| 
  42| Clinical Pharmacist: You are very welcome. Take good care.
  43| 
  44| [Call Audio Recording Concluded]
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.