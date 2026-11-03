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


=== DOCUMENT fd-0203 ===
   1| TELEPHONE ENCOUNTER TRANSCRIPT
   2| DEPARTMENT: AMBULATORY CARE PHARMACY AND CLINICAL TRIAGE
   3| COMMUNICATION TYPE: POST-DISCHARGE RECONCILIATION AND CARE COORDINATION
   4| STATUS: ROUTINE ENCOUNTER
   5| 
   6| TRIAGE NURSE: Good morning, clinical triage line. This is the triage nurse on duty. How can I assist pharmacy today?
   7| 
   8| COVERING PHARMACIST: Hello, good morning. This is the covering pharmacist from the outpatient clinical team. I am calling to review the transition of care orders and discharge documentation recieved from Outside Hospital for a 54-year-old patient who was recently evaluated for acute unilateral facial paralysis and diagnosed with Bell palsy. The clinical notes also noted pre-existing focal neuropathic pain diagnosed in 2021. I noticed a few discrepancies on the discharge medication reconciliation and wanted to clarify the dosing schedule and prior authorization status with the clinical team before sending the maintenance prescriptions through for dispensing.
   9| 
  10| TRIAGE NURSE: Thank you for following up on this. I have teh scanned chart and the consultation packet from Outside Hospital open in front of me right now. The patient was initially evaluated in the emergency department and then admitted to the clinical observation unit before being discharged home in stable condition. What specific questions did you have regarding the medication regimen?
  11| 
  12| COVERING PHARMACIST: First, regarding the systemic steroid therapy for the acute Bell palsy. The inpatient team initiated an oral corticosteroid taper, but the discharge summary and the electronic discharge order transmitted to the pharmacy contained conflicting directions. The written discharge summary recommended a standard prednisone 60/40/20/10 mg taper over twelve days, but the electronic order was entered as prednisone 40 mg PO daily for five days without tapering instructions. Given the severity of the facial weakness at presentation, the standard clinical protocol recommends the higher initial dose burst followed by a gradual reduction: prednisone 60 mg PO daily for five days, then 40 mg PO daily for two days, 20 mg PO daily for two days, and 10 mg PO daily for two days. Has the attending physician confirmed which taper schedule we should follow?
  13| 
  14| TRIAGE NURSE: Yes, let me look at the clinical addendum entered this morning. The attending physician reviewed the outside records and confirmed that the prednisone 60/40/20/10 mg taper is indeed the intended course. In addition, the current orders include valacyclovir 1000 mg PO TID for seven days for antiviral coverage, plus preservative-free artificial tears 1 drop in the right eye q2h PRN while awake, and lubricating ophthalmic ointment 0.25 inch to the right eye at bedtime. Because the patient cannot achieve full right eyelid closure, corneal protection is critical right now.
  15| 
  16| COVERING PHARMACIST: Excellent, that provides clear direction on the acute regimen. Next, I wanted to address the neuropathic pain therapy. According to the medical history dating back to 2019, the patient has chronic peripheral neuropathy. During the observation stay, the inpatient team started Lyrica 75 mg PO BID. However, the pre-admission medication profile still includes gabapentin 300 mg PO TID. This represents dual gabapentinoid therapy. Combining Lyrica and gabapentin creates an unnecessary risk of additive central nervous system depression, marked somnolence, dizziness, and peripheral edema. My clinical recommendation is to discontinue the outpatient gabapentin completely and continue the Lyrica monotherapy, titrating upward as tolerated.
  17| 
  18| TRIAGE NURSE: That makes total sense. I will submit an order modification to discontinue gabapentin 300 mg PO TID and keep Lyrica 75 mg PO BID as the single agent for neuropathic pain. The primary care provider also placed an electronic referral to Pain Clinic for comprehensive multidisciplinary evaluation once the steroid taper is completed. Has the patient's health plan cleared the Lyrica prescription, or will an appeal be required?
  19| 
  20| COVERING PHARMACIST: The electronic pharmacy adjudication system initially rejected the prescription claim, requesting prior authorization due to formulary step-therapy requirements. However, because the historical records confirm documented trials and therapeutic failure of both gabapentin and duloxetine since 2022, we have strong justification. I am preparing the prior authorization appeal documentation right now. Could you please share the most recent vital signs and laboratory findings from the clinical records so I can attach them to the justification package?
  21| 
  22| TRIAGE NURSE: Absolutely. At the discharge evaluation, vital signs were documented as follows: blood pressure 126/82 mmHg, heart rate 70 bpm, respiratory rate 16 breaths per minute, body temperature 98.4 F, and oxygen saturation 99% on room air. The patient was alert, oriented, and experiencing no systemic symtoms. Laboratory results from the hospital admission were: fasting blood glucose 106 mg/dL, hemoglobin A1c 5.9%, serum sodium 140 mEq/L, serum potassium 4.2 mEq/L, blood urea nitrogen 15 mg/dL, serum creatinine 0.84 mg/dL, estimated glomerular filtration rate 96 mL/min/1.73 m2, aspartate aminotransferase 24 U/L, alanine aminotransferase 28 U/L, and complete blood count showing a white blood cell count of 7.8 x10^3/uL, hemoglobin 14.1 g/dL, and platelet count 245 x10^3/uL. Renal and hepatic parameters are completely normal, so no dose adjustment is necessary for Lyrica.
  23| 
  24| COVERING PHARMACIST: Those laboratory values are very helpful and support the clinical need. Were there any diagnostic imaging studies or specialty procedures completed during the hospitalization?
  25| 
  26| TRIAGE NURSE: Yes. Diagnostic magnetic resonance imaging of the brain and internal auditory canal with intravenous gadolinium contrast was performed at Outside Hospital. The radiologist reported prominent enhancement of the right facial nerve within the geniculate ganglion and tympanic segments, entirely consistent with acute Bell palsy, without evidence of intracranial mass, acute ischemia, or vascular compression. High-resolution computed tomography of the temporal bone showed clear mastoid air cells and intact bony architecture. The neurology consultant documented a House-Brackmann score of grade IV facial paresis and advised follow-up electromyography in three weeks if clinical recovery is delayed.
  27| 
  28| COVERING PHARMACIST: Perfect. I will assemble the prior authorization request with the clinical summary, imaging reports, and renal panel, and submit it directly to the health plan. In the meantime, I will dispense the prednisone 60/40/20/10 mg taper, valacyclovir 1000 mg PO TID, and the ocular lubricants for immediate courier delivery so there is no delay in treating the Bell palsy.
  29| 
  30| TRIAGE NURSE: Thank you so much for your thorough review and for streamlining this transition. I will alert the primary care team and place a note in the electronic chart. Have a wonderful rest of your shift.
  31| 
  32| COVERING PHARMACIST: You too. Thank you, goodbye.
=== END DOCUMENT ===

=== DOCUMENT fd-0205 ===
   1| CALLOWAY REGIONAL HOSPITAL
   2| DEPARTMENT OF PHARMACY SERVICES
   3| AMBULATORY MEDICATION RECONCILIATION & PRIOR AUTHORIZATION REVIEW
   4| 
   5| DOCUMENT REFERENCE: REF-88391-B
   6| TRANSCRIBED FROM FAX COVER AND INPATIENT DISCHARGE TRANSMISSION
   7| SUBMISSION DATE: 11-04-2026
   8| EFFECTIVE REFILL DATE: 14 November 2026
   9| ORIGINAL ADMISSION DATE: 10/28/26
  10| 
  11| PATIENT DEMOGRAPHICS:
  12| NAME: HENDRIK VAN OUDSHOORN
  13| MRN: 9028314
  14| CLAIM NO: Claim # 77492015
  15| HOME ADDRESS:
  16| 742 North Meadowbrook Drive
  17| Springfield, IL 62704
  18| PRIMARY CAREGIVER: Eleni Papas (patient's adult daughter and designated healthcare proxy)
  19| CAREGIVER CONTACT: (312) 555-0164 ext. 4182
  20| 
  21| PRESCRIBER OF RECORD:
  22| Walter J. Henderson, MD
  23| Division of Cardiology, Calloway Regional Hospital
  24| Prescriber Contact: walter.henderson@example.org
  25| Direct Line: (312) 555-0164 ext. 3310
  26| Portal Auth URL: https://portal.example.org/records/pharmacy-auth
  27| 
  28| REVIEWING PHARMACIST:
  29| Rachel M. Albright, PharmD, BCPS
  30| 
  31| REASON FOR REVIEW & CLINICAL SUMMARY:
  32| Medication reconciliation requested following recent hospital discharge for acute decompensated heart failure with reduced ejection fraction (HFrEF, LVEF 30-35%) and poorly controlled type 2 diabetes mellitus. Transcribed fax documentation from Dr. Walter J. Henderson requests formulary prior authorization for empagliflozin (Jardiance) and sacubitril/valsartan (Entresto), which require health plan level-two exception criteria validation.
  33| 
  34| VITAL SIGNS & OBJECTIVE LAB DATA:
  35| Vitals recorded at discharge on 11/4/26: BP 118/74 mmHg, HR 68 bpm (regular), RR 16 breaths/min, SpO2 97% on ambient air, Weight 84.5 kg, BMI 27.8 kg/m2.
  36| Pertinent laboratory panel:
  37| - Serum potassium: 4.6 mEq/L
  38| - Serum sodium: 138 mEq/L
  39| - Blood urea nitrogen (BUN): 24 mg/dL
  40| - Serum creatinine: 1.12 mg/dL (baseline 1.05 mg/dL)
  41| - Estimated GFR: 64 mL/min/1.73 m2
  42| - Hemoglobin A1c: 8.4%
  43| - B-type natriuretic peptide (BNP): 310 pg/mL (down from admission peak of 1,420 pg/mL)
  44| - Liver function tests (AST/ALT): 22/26 U/L, total bilirubin 0.6 mg/dL.
  45| 
  46| MEDICATION RECONCILIATION & REGIMEN ASSESSMENT:
  47| Conducted comprehensive telephone reconciliation with the patient and his adult daughter, Eleni Papas. Ms. Papas confirms that Mr. van Oudshoorn understands the newly initiated heart failure medications and has discontinued his previous home angiotensin-converting enzyme inhibitor (lisinopril) to avoid angioedema risk prior to starting sacubitril/valsartan.
  48| 
  49| Reconciled Discharge Regimen:
  50| 1. Sacubitril/valsartan 24/26 mg PO BID with meals. Target maintenance titration to 49/51 mg PO BID in 2 to 4 weeks pending renal profile and tolerability.
  51| 2. Empagliflozin 10 mg PO once daily each morning. Indicated for cardiovascular risk reduction and glycemic control in HFrEF.
  52| 3. Carvedilol 6.25 mg PO BID; taken with food to reduce orthostatic effects.
  53| 4. Furosemide 20 mg PO every morning; instructed to weigh daily and notify clinic if weight increases by more than 3 lbs in 24 hours.
  54| 5. Metformin extended-release 500 mg PO daily with evening meal; reduced from 1,000 mg BID due to recent acute heart failure stabilization.
  55| 6. Atorvastatin 40 mg PO at bedtime for secondary atherosclerotic prevention.
  56| 
  57| PRIOR AUTHORIZATION JUSTIFICATION:
  58| Clinical rationale for coverage was submitted under Claim # 77492015. Patient meets clinical guideline criteria for guideline-directed medical therapy in chronic heart failure NYHA Class II-III. Prior trial and failure of lisinopril 20 mg PO daily documented due to chronic dry cough and suboptimal symptom control. Documentation of renal function (eGFR 64 mL/min/1.73 m2) satisfies coverage safety parameters for SGLT2 inhibitor initiation. Complete documentation and clinical discharge summaries have been uploaded to the health plan portal at https://portal.example.org/records/pharmacy-auth.
  59| 
  60| PLAN & PHARMACY FOLLOW-UP:
  61| 1. Prior authorization packet submitted electronically to the patient's commercial health plan by Rachel M. Albright, PharmD.
  62| 2. Provided discharge counseling to Hendrik van Oudshoorn and Eleni Papas regarding symptoms of hypotension, volume depletion, and euglycemic ketoacidosis.
  63| 3. Outpatient clinic follow-up scheduled with Dr. Henderson for repeat basic metabolic panel and vitals check on 14 November 2026.
  64| 4. Urgent contact information provided for Calloway Regional Hospital Pharmacy triage line.
  65| 
  66| Rachel M. Albright, PharmD, BCPS
  67| Clinical Pharmacy Specialist
  68| Calloway Regional Hospital
=== END DOCUMENT ===

=== DOCUMENT fd-0038 ===
   1| ALDEN REGIONAL HOSPITAL
   2| DEPARTMENT OF GENERAL SURGERY - SURGICAL CONSULTATION NOTE
   3| CONSULTATION DATE: 11-04-2026
   4| HOSPITAL SERVICE: INPATIENT GENERAL SURGERY
   5| 
   6| PATIENT IDENTIFICATION:
   7| Name: Wong Văn Khải
   8| MRN: 4892015
   9| Account #: AC-9938102
  10| Admission Date: 11-04-2026
  11| DOB: 12 August 1958
  12| Gender: Male
  13| Patient Address:
  14| 4280 SEATTLE BOULEVARD, APT 3C
  15| SEATTLE, WA 98104
  16| Patient Contact: (206) 555-0138
  17| Digital Portal Reference: https://records.example.net/portal/view?id=804
  18| 
  19| CONSULTING SURGICAL TEAM:
  20| Consulting Attending Surgeon: Dr. Violet Morita
  21| Surgical Fellow: Dr. H. Sato
  22| Consultant Email: violet.morita@example.org
  23| Referring Hospitalist: Dr. Kenji Takahashi
  24| 
  25| REASON FOR CONSULTATION:
  26| Evaluation of acute calculous cholecystitis with suspected
  27| choledocholithiasis and surgical recommendation for urgent
  28| intervention.
  29| 
  30| HISTORY OF PRESENT ILLNESS:
  31| Mr. Wong Văn Khải is a 68-year-old gentleman who presented to the
  32| emergency department at Alden Regional Hospital on the evening of 4
  33| November 2026 with an 18-hour history of severe, unrelenting right
  34| upper quadrant abdominal pain radiating to his right infrascapular
  35| region. The pain began roughly two hours following a fatty evening meal
  36| and was accompanied by persistent nausea, four episodes of bilious
  37| emesis, subjective chills, and low-grade fever. He noted dark
  38| tea-colored urine over the preceding twelve hours. He denied
  39| hematemesis, melena, hematochezia, chest pain, or dyspnea.
  40| 
  41| The patient was accompanied to the hospital by his son-in-law Brian
  42| Miller, who provided collateral history and assisted with
  43| communication. The initial inpatient workup was initiated by the
  44| attending hospitalist, Dr. Kenji
  45| Takahashi, who noted significant right upper quadrant tenderness with a
  46| positive Murphy sign. Laboratory evaluation demonstrated leukocytosis
  47| with elevated alkaline phosphatase and total bilirubin. Inpatient
  48| surgical consultation was formally requested on 11-04-2026.
  49| 
  50| PAST MEDICAL AND SURGICAL HISTORY:
  51| 1. Type 2 diabetes mellitus, controlled without insulin.
  52| 2. Hyperlipidemia.
  53| 3. Gastroesophageal reflux disease.
  54| 4. No prior abdominal surgical procedures.
  55| 
  56| PHYSICAL EXAMINATION:
  57| Vital Signs: Temperature 38.2 C (100.8 F), blood pressure 138/84 mmHg,
  58| heart rate 92 bpm, respiratory rate 18 breaths/min, SpO2 97% on ambient
  59| air.
  60| General: Moderately uncomfortable gentleman lying still on the
  61| stretcher, grimacing with deep respiration.
  62| HEENT: Mild scleral icterus noted. Oral mucosa moist.
  63| Cardiovascular: Regular rate, normal heart sounds, no murmurs.
  64| Pulmonary: Lungs clear to auscultation bilaterally, no wheezes.
  65| Abdomen: Moderate distention. Marked tenderness to palpation in the
  66| right upper quadrant with inspiratory arrest (positive Murphy sign).
  67| Voluntary guarding present. No peritoneal rebound tenderness. Normal
  68| bowel sounds.
  69| Extremities: Warm, well-perfused, no peripheral edema.
  70| 
  71| DIAGNOSTIC WORKUP:
  72| 1. Complete Blood Count:
  73|    WBC: 14.8 x 10^3/uL (82% neutrophils)
  74|    Hemoglobin: 14.2 g/dL
  75|    Platelets: 230 x 10^3/uL
  76| 2. Comprehensive Metabolic Panel:
  77|    Total Bilirubin: 3.4 mg/dL
  78|    Direct Bilirubin: 2.6 mg/dL
  79|    Alkaline Phosphatase: 284 U/L
  80|    AST: 142 U/L
  81|    ALT: 188 U/L
  82|    Serum Lipase: 38 U/L (normal)
  83|    Serum Creatinine: 0.94 mg/dL
  84| 3. Abdominal Ultrasonography:
  85|    Demonstrated a distended gallbladder with marked wall thickening
  86|    measuring 4.8 mm, prominent pericholecystic fluid, multiple
  87|    shadowing gallstones, and a sonographic Murphy sign. The common bile
  88|    duct was dilated measuring 8.6 mm with acoustic shadowing in the
  89|    distal duct concerning for an impacted stone.
  90| 
  91| ASSESSMENT AND CLINICAL IMPRESSION:
  92| Mr. Wong Văn Khải is a 68-year-old male with acute calculous
  93| cholecystitis complicated by choledocholithiasis, biliary obstruction,
  94| and mild secondary ascending cholangitis. He requires therapeutic
  95| biliary decompression followed by definitive surgical source control.
  96| 
  97| RECOMMENDATIONS AND PLAN OF CARE:
  98| 1. Maintain strict NPO status with intravenous fluid resuscitation
  99|    (lactated Ringer's solution at 125 mL/hr).
 100| 2. Intravenous antimicrobial therapy: Continue piperacillin-tazobactam
 101|    3.375 grams IV every 6 hours.
 102| 3. Gastroenterology Consultation: Endoscopic retrograde
 103|    cholangiopancreatography (ERCP) with biliary sphincterotomy and stone
 104|    extraction is recommended first thing tomorrow morning to clear the
 105|    common bile duct.
 106| 4. Surgical Intervention: Following successful duct clearance via ERCP,
 107|    we will proceed with laparoscopic cholecystectomy, with conversion to
 108|    open cholecystectomy if severe inflammation or adhesions preclude
 109|    safe dissection.
 110| 5. Informed Consent: Risks, benefits, and procedural alternatives were
 111|    discussed in detail with Mr. Wong and his son-in-law Brian Miller.
 112|    The patient expressed understanding and agreed with the proposed
 113|    surgical plan.
 114| 6. Dr. H. Sato and I will re-evaluate the patient post-procedure.
 115| 
 116| Violet Morita, MD, FACS
 117| Attending Surgeon, Department of General Surgery
 118| Alden Regional Hospital
 119| Pager: (206) 555-0138
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.