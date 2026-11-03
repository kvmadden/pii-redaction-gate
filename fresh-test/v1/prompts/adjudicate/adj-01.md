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


=== DOCUMENT fd-0005 ===
   1| CALLOWAY REGIONAL HOSPITAL
   2| DEPARTMENT OF DIAGNOSTIC RADIOLOGY
   3| ULTRASOUND EXAMINATION REPORT
   4| 
   5| PATIENT: Warren Scott
   6| MRN: 88392104
   7| ACCESSION: ACC-7719402
   8| DOB: 08/19/1954
   9| DATE OF EXAM: July 12 2026
  10| ORDERING PHYSICIAN: Dr. Kenneth Albright
  11| SONOGRAPHER: T.G.
  12| READING RADIOLOGIST: Dr. Martin Vance
  13| PRIMARY CONTACT: Fisher (nephew)
  14| CAREGIVER: Ananya Sen
  15| DEPARTMENT TELEPHONE: (617) 555-0118 ext. 3307
  16| 
  17| EXAMINATION:
  18| Ultrasound duplex scan of the right upper quadrant and biliary tree.
  19| 
  20| CLINICAL HISTORY:
  21| The patient is a 71-year-old male with persistent right upper quadrant
  22| discomfort, postprandial nausea, and mild jaundice. He has a past medical
  23| history of hypertension and hyperlipidemia. Caregiver Ananya Sen noted
  24| intermittent postprandial emesis over the preceding week. Episodic biliary
  25| colic reportedly intensified around the 4th of July after an outdoor picnic.
  26| The patient lives in Greenfield and was referred by Dr. Kenneth Albright for
  27| diagnostic evaluation. Nephew Fisher assisted with transportation.
  28| 
  29| TECHNIQUE:
  30| Real-time gray-scale, color, and spectral Doppler ultrasound imaging of the
  31| liver, gallbladder, bile ducts, pancreas, and right kidney was performed
  32| using curvilinear and phased-array transducers.
  33| 
  34| FINDINGS:
  35| The liver measures 14.8 cm in craniocaudal dimension, demonstrating normal
  36| parenchymal echogenicity without focal mass or hepatic surface nodularity.
  37| Main portal vein is patent with hepatopetal flow at 22 cm/s.
  38| 
  39| The gallbladder is distended with mild diffuse wall thickening measuring
  40| 3.8 mm (normal less than 3 mm). Several mobile, shadowing, hyperechoic
  41| calculi are present in the gallbladder lumen, the largest measuring 1.4 cm
  42| in maximal dimension. A positive sonographic Murphy sign was elicited
  43| during direct probe palpation over the fundus. There is a small rim of
  44| pericholecystic fluid adjacent to the gallbladder wall.
  45| 
  46| The common bile duct is mildly dilated, measuring 7.5 mm in diameter at the
  47| porta hepatis, but tapers smoothly toward the ampulla without demonstrable
  48| choledocholithiasis. Visualized portions of the pancreatic head and body
  49| appear unremarkable. Pancreatic duct is not dilated, measuring 1.6 mm.
  50| Right kidney demonstrates normal cortical thickness (11.2 cm length) without
  51| hydronephrosis or calculi. Spleen is normal in size, measuring 10.4 cm.
  52| 
  53| IMPRESSION:
  54| 1. Cholelithiasis with sonographic Murphy sign and mild gallbladder wall
  55|    thickening, indicative of acute calculous cholecystitis.
  56| 2. Borderline common bile duct dilation without visible intraductal stone.
  57| 3. Findings were phoned and discussed with ordering provider Dr. Kenneth
  58|    Albright at 14:15 on the exam date. Surgical consultation for
  59|    laparoscopic cholecystectomy is recommended.
  60| 
  61| Reported by:
  62| Dr. Martin Vance, MD
  63| Staff Radiologist, Calloway Regional Hospital
=== END DOCUMENT ===
ITEMS FOR fd-0005:
K1 | line 22 | KEEP "jaundice"
K2 | line 40 | KEEP "less than 3 mm"
K3 | line 56 | KEEP "common bile duct dilation"

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
ITEMS FOR fd-0038:
D1 | line 73 | A: KEEP "WBC: 14.8 x 10^3/uL (82% neutrophils)" | B: KEEP "WBC: 14.8 x 10^3/uL"
D2 | line 94 | A: KEEP "secondary ascending cholangitis" | B: KEEP "ascending cholangitis"
D3 | line 102 | A: KEEP "Endoscopic retrograde\n   cholangiopancreatography (ERCP)" | B: KEEP "Endoscopic retrograde\n   cholangiopancreatography" ; KEEP "ERCP"
K1 | line 2 | KEEP "DEPARTMENT OF GENERAL SURGERY"
K2 | line 4 | KEEP "INPATIENT GENERAL SURGERY"
K3 | line 6 | KEEP "PATIENT IDENTIFICATION"
K4 | line 19 | KEEP "CONSULTING SURGICAL TEAM"
K5 | line 57 | KEEP "Vital Signs"
K6 | line 60 | KEEP "General"
K7 | line 62 | KEEP "HEENT"
K8 | line 62 | KEEP "scleral icterus"
K9 | line 63 | KEEP "Cardiovascular"
K10 | line 64 | KEEP "Pulmonary"
K11 | line 65 | KEEP "Abdomen"
K12 | line 69 | KEEP "Extremities"
K13 | line 72 | KEEP "Complete Blood Count"
K14 | line 76 | KEEP "Comprehensive Metabolic Panel"
K15 | line 87 | KEEP "gallstones"
K16 | line 89 | KEEP "impacted stone"
K17 | line 95 | KEEP "biliary decompression"
K18 | line 98 | KEEP "intravenous"
K19 | line 100 | KEEP "Intravenous"
K20 | line 102 | KEEP "Gastroenterology Consultation"
K21 | line 103 | KEEP "stone\n   extraction"
K22 | line 106 | KEEP "Surgical Intervention"
K23 | line 110 | KEEP "Informed Consent"
K24 | line 117 | KEEP "Department of General Surgery"

=== DOCUMENT fd-0064 ===
   1| CALL RECORDING: AMBULATORY NURSE LINE
   2| FACILITY: St. Anselm Medical Center
   3| MRN: 7301928
   4| PATIENT: Châu Bích Ngân
   5| ATTENDING: Dr. Scott Higgins
   6| STAFF: Heaven Clark, RN
   7| CALLER: Marco D'Angelo (son-in-law)
   8| 
   9| [Call Recording Begins]
  10| 
  11| Heaven Clark, RN: St. Anselm Medical Center outpatient triage, this is Nurse
  12| Heaven Clark. How can I, uh, help you today?
  13| 
  14| Marco D'Angelo: Hi Heaven, yes, um, my name is Marco D'Angelo. I'm calling for
  15| my mother-in-law, Châu Bích Ngân. She, uh, she had an outpatient colonoscopy
  16| with polypectomy back around the 4th of July, and Dr. Higgins scheduled a
  17| repeat flexible sigmoidoscopy. We received, uh, we received an automated
  18| reminder about pre-procedure fasting, but we weren't sure about her morning
  19| medications.
  20| 
  21| Heaven Clark, RN: Okay, let me pull up her chart under MRN: 7301928. Can you
  22| confirm her address for me first?
  23| 
  24| Marco D'Angelo: Yes, she lives at:
  25| 4128 Evergreen Terrace, Apartment 5B
  26| Portland, OR 97221
  27| 
  28| Heaven Clark, RN: Thank you, Marco. And what is the best direct callback number
  29| in case we get disconnected?
  30| 
  31| Marco D'Angelo: You can reach me at 503-555-0118 ext. 240 during business hours.
  32| 
  33| Heaven Clark, RN: Perfect. Looking at the scheduling orders entered on August
  34| fourth, twenty twenty-six, Dr. Higgins noted that for patient C.B.N., she
  35| should hold her lisinopril 20 mg PO on the morning of the procedure. However,
  36| she should take her levothyroxine 75 mcg PO with a small sip of water at
  37| 6:00 AM. Also, she must finish her polyethylene glycol bowel prep tonight
  38| by 10:00 PM.
  39| 
  40| Marco D'Angelo: Got it. Hold the lisinopril, take the levothyroxine with a tiny
  41| sip of water, and finish the prep tonight.
  42| 
  43| Heaven Clark, RN: Exactly. Check in at the endoscopy suite tomorrow morning at
  44| 7:30 AM. If she develops any nausea or abdominal pain tonight, call our
  45| on-call line.
  46| 
  47| Marco D'Angelo: Thank you so much, Heaven. Have a wonderful day.
  48| 
  49| Heaven Clark, RN: You too, Marco. Goodbye.
  50| 
  51| [Call Recording Ends]
=== END DOCUMENT ===
ITEMS FOR fd-0064:
D1 | line 15 | A: KEEP "colonoscopy" ; KEEP "polypectomy" | B: KEEP "colonoscopy\nwith polypectomy" [unsure]
K1 | line 37 | KEEP "bowel prep"

=== DOCUMENT fd-0070 ===
   1| Date of Service: October 14, 2026
   2| Patient: BAHADOR-ZADEH, NILOUFAR
   3| Health Plan Member ID: HPM-84920411
   4| Subject: Question regarding glipizide dose and lab paperwork
   5| 
   6| Message 1
   7| From: niloufar
   8| Sent: October 14, 2026 08:22 AM
   9| To: Dr. Craig Halloway
  10| 
  11| hello dr. halloway,
  12| i am writing to ask about my morning blood sugars over the last week. i have been taking glipizide 5 mg PO daily before breakfast along with metformin 1000 mg PO BID. my fasting redings have been running between 148 and 165 mg/dL, and my bedtime check yesterday was 182 mg/dL. i spoke with my husband Alan Cooper becasue i felt a little dizzy on tuesday, but my blood pressure was 128/76 mmHg and heart rate was 72 bpm. my daughter checked my ketone strips and they were negative.
  13| also, we recently relocated and i currently work in Kirkland, so the local diagnostic center near my office asked for the order form. could your medical assistant please transmit the updated requisition for my HbA1c, comprehensive metabolic panel, and urine microalbumin? the imaging and draw station there gave me their direct transmission line: Fax: (425) 555-0148. i want to make sure the lab has everything ready before my scheduld fasting draw. thank you so much for checking on this.
  14| 
  15| Message 2
  16| From: Dr. Craig Halloway
  17| Sent: October 14, 2026 11:45 AM
  18| To: BAHADOR-ZADEH, NILOUFAR
  19| 
  20| Dear Mrs. Bahador-Zadeh,
  21| 
  22| Thank you for the detailed log. Given that your fasting blood glucose levels remain above our target of 90-130 mg/dL despite metformin 1000 mg PO BID, we will increase your glipizide to 10 mg PO daily taken 30 minutes before your morning meal. Please continue logging both preprandial and 2-hour postprandial values. If you experience any episodes of hypoglycemia (blood glucose under 70 mg/dL, diaphoresis, or tremor), take 15 grams of fast-acting carbohydrate immediately and notify our office.
  23| 
  24| Regarding your lab orders, our clinical coordinator just transmitted your requisition for hemoglobin A1c, CMP, and urine albumin-to-creatinine ratio to the facility at Fax: (425) 555-0148. I have also verified that your coverage under Health Plan Member ID: HPM-84920411 is attached to the requisition so there will be no billing delay. If your dizziness recurs or systolic blood pressure drops below 110 mmHg, please let Alan Cooper or our triage nurse know right away. We will review your new lab results together during our follow-up consultation on November 4, 2026.
  25| 
  26| Sincerely,
  27| Craig Halloway, MD
=== END DOCUMENT ===
ITEMS FOR fd-0070:
K1 | line 12 | KEEP "148 and 165 mg/dL"
K2 | line 12 | KEEP "182 mg/dL"
K3 | line 13 | KEEP "HbA1c"
K4 | line 13 | KEEP "comprehensive metabolic panel"
K5 | line 13 | KEEP "urine microalbumin"
K6 | line 22 | KEEP "fasting blood glucose"
K7 | line 22 | KEEP "90-130 mg/dL"
K8 | line 22 | KEEP "blood glucose under 70 mg/dL"
K9 | line 22 | KEEP "diaphoresis"
K10 | line 22 | KEEP "tremor"
K11 | line 22 | KEEP "15 grams"
K12 | line 24 | KEEP "hemoglobin A1c"
K13 | line 24 | KEEP "CMP"
K14 | line 24 | KEEP "urine albumin-to-creatinine ratio"
K15 | line 24 | KEEP "dizziness"
K16 | line 24 | KEEP "systolic blood pressure drops below 110 mmHg"

=== DOCUMENT fd-0074 ===
   1| Patient Name: van Gelder, Jochem
   2| Date of Service: November 12, 2026
   3| Health Plan Member ID: HPN-7734019
   4| Facility: Lakeshore Urological Associates
   5| 
   6| Message Thread: Prostate Biopsy Pathology Review and Prior Auth
   7| 
   8| Message 1:
   9| From: claire albright
  10| Sent: November 14, 2026 10:15 AM
  11| To: Lakeshore Urological Associates Triage
  12| Subject: Pathology follow-up for Jochem van Gelder
  13| 
  14| hello nurse megan, i am writing on behalf of my father jochem van gelder regarding his recent transrectal prostate needle biopsy performed by dr gleason. we reviewed the pathology report that was posted to the portal yesterday. the pathologist noted adenocarcinoma in three of twelve cores with a Gleason score of 3+4=7, corresponding to Grade Group 2. dr gleason had mentioned during our consultation that if the biopsy showed intermediate-risk disease, we would discuss staging pelvic MRI and active surveillance versus radiation therapy. my father is anxious to know what the next steps are and whether a referral to radiation oncology has been initiated. also, our health plan requires prior authorization for pelvic MRI under Plan Group Number GRP-884102. could your office submit that prior auth request? the imaging center requested that the clinical records and authorization approval be sent by Fax: (616) 555-0148. lastly, my father prefers to pick up his tamsulosin 0.4 mg PO daily refill at the pharmacy location in 49503 rather than the suburban outlet. thank you so much for your assistance, claire
  15| 
  16| Message 2:
  17| From: Megan Bauer, RN
  18| Sent: November 14, 2026 02:40 PM
  19| To: claire albright
  20| Subject: RE: Pathology follow-up for Jochem van Gelder
  21| 
  22| Hello Claire,
  23| 
  24| I discussed the pathology findings with Dr. Wayne Gleason this afternoon. He confirmed that the biopsy demonstrates favorable intermediate-risk prostate cancer based on the Gleason score of 3+4=7 and his pre-biopsy PSA of 6.2 ng/mL. Dr. Gleason has ordered a multi-parametric prostate MRI to evaluate for extracapsular extension and has submitted the formal consultation request to Radiation Oncology.
  25| 
  26| Our pre-authorization coordinator has submitted the imaging request to his insurer under Health Plan Member ID HPN-7734019 and Plan Group Number GRP-884102. Once the approval is secured, our office will transmit the clinical notes and authorization to the imaging facility via Fax: (616) 555-0148. In addition, I have routed his tamsulosin 0.4 mg capsule prescription to the pharmacy in 49503. Please have Mr. van Gelder continue tamsulosin 0.4 mg PO daily thirty minutes after the same meal each evening. Dr. Wayne Gleason would like to see him back in clinic for a comprehensive discussion once the MRI is completed. Please reach out if you have any questions in the interim.
  27| 
  28| Warm regards,
  29| Megan Bauer, RN
  30| Lakeshore Urological Associates
=== END DOCUMENT ===
ITEMS FOR fd-0074:
D1 | line 14 | A: KEEP "staging pelvic MRI" | B: KEEP "pelvic MRI"
D2 | line 24 | A: KEEP "favorable intermediate-risk prostate cancer" | B: KEEP "prostate cancer"
D3 | line 24 | A: KEEP "pre-biopsy PSA of 6.2 ng/mL" | B: KEEP "PSA of 6.2 ng/mL"
K1 | line 6 | KEEP "Prostate Biopsy"
K2 | line 14 | KEEP "three of twelve cores"
K3 | line 14 | KEEP "intermediate-risk disease"
K4 | line 14 | KEEP "active surveillance"
K5 | line 24 | KEEP "extracapsular extension"
K6 | line 26 | KEEP "each evening"

=== DOCUMENT fd-0134 ===
   1| CT PULMONARY ANGIOGRAM
   2| 
   3| Patient: the patient
   4| Sex: female
   5| Age: 67 years
   6| Ordering service: Diabetes Center
   7| Comparison: outside imaging from 2019, brought over from Outside Hospital
   8| 
   9| INDICATION
  10| 67-year-old woman with dyspnea and a Wells score of 6. Her daughter supplied the medication list. The request came through Diabetes Center on the day of a glucose check.
  11| 
  12| TECHNIQUE
  13| CT pulmonary angiography was performed from the lung apices through the upper abdomen after injection of 80 mL of iohexol 350 mg I/mL at 4.5 mL/sec. Images were reconstructed at 1 mm.
  14| 
  15| VITALS AND LABS
  16| Blood pressure 148/86 mmHg. Heart rate 104 beats per minute. Respiratory rate 22 breaths per minute. Oxygen saturation 93 percent on room air. Temperature 37.1 C. D-dimer 1.84 mg/L FEU. Creatinine 1.1 mg/dL. Glucose 214 mg/dL. Hemoglobin A1c 8.4 percent. BNP 88 pg/mL.
  17| 
  18| MEDICATIONS
  19| Lyrica (pregabalin) 75 mg PO BID. Metformin 1000 mg PO BID. Insulin glargine 18 units SUBQ at bedtime. Apixaban had not been started before the scan.
  20| 
  21| FINDINGS
  22| The main, lobar, segmental, and subsegmental pulmonary arteries opacify without a filling defect. There is no evidance of acute pulmonary embolism. The right ventricle is not enlarged. No pleural effusion is seen. Mild dependant atelectasis is present at the bases.
  23| 
  24| IMPRESSION
  25| 1. No pulmonary embolus. The Wells score remains a clinical score and is not changed by this negative study.
  26| 2. Glycemic control is outside the scope of this report. Follow-up stays with Diabetes Center. Comparison with the 2019 images showed no new central embolus, and a seperate note is on file.
  27| 
  28| End of report.
=== END DOCUMENT ===
ITEMS FOR fd-0134:
D1 | line 10 | A: KEEP "Wells score of 6" | B: KEEP "Wells score"
K1 | line 10 | KEEP "dyspnea"
K2 | line 22 | KEEP "filling defect"

=== DOCUMENT fd-0152 ===
   1| From: Patient
   2| Sent: 6:22 PM
   3| 
   4| hi, the left side of my face is still droopping and the tingeling around my ear is worse at night. i cannot blink that eye all the way and it waters. they called it Bell palsy after the scan at Outside Hospital did not show a stroke. i have had type 2 diabetes since 2016 and now my morning glucose is 246 mg/dL, which scares me. someone started prednisone 40/30/20/10 mg and i do not know if i am supposed to drop a step every two days. i also take metformin 1000 mg PO BID. can you reccomend whether i keep going down on the steroid, because i am 68 and i do not want my sugar stuck this high. the eye wont shut when i sleep.
   5| 
   6| From: Care team
   7| Sent: 8:05 PM
   8| 
   9| The face weakness with a normal stroke workup fits Bell palsy, and the steroid course should be finished rather than stopped in the middle. Take prednisone 40/30/20/10 mg PO daily, two days at each step, then stop. Keep metformin 1000 mg PO BID with food. A morning glucose of 246 mg/dL is high and expected while prednisone is on board, and it should ease as the dose falls. For a 68-year-old with diabetes, I am placing a referral to Diabetes Center so the steroid-related highs can be watched. Your blood pressure at the last visit was 138/82 mmHg and the pulse was 92 bpm. Creatinine was 0.9 mg/dL and A1c was 7.8%, so metformin is still appropriate. Check a fingerstick before breakfast and again later in the day. Send a portal note if glucose stays above 300 mg/dL, if you have vomiting, or if the weak eye hurts or the vision blurs. Use lubricating eye drops, 1 drop to the weak eye QID while awake, and a bland ophthalmic ointment at bedtime. Protect the cornea, because the lid is not closing fully. Do not patch the eye, because a patch can rub the cornea. A short course of prednisone is the usual drug treatment for Bell palsy, together with that eye care.
  10| 
  11| Primary care
=== END DOCUMENT ===
ITEMS FOR fd-0152:
D1 | line 9 | A: KEEP "stroke" | B: KEEP "stroke workup"
D2 | line 9 | A: KEEP "QID while awake" | B: KEEP "QID"
K1 | line 4 | KEEP "every two days"
K2 | line 9 | KEEP "two days at each step"

=== DOCUMENT fd-0168 ===
   1| Bright Water Clinic
   2| Outpatient Progress Note
   3| 
   4| Patient: Zong, Ntxawm
   5| MRN: 2294518
   6| Member ID HP610293384
   7| Date of Service: April 22, 2026
   8| 
   9| Chief complaint
  10| Diabetes follow-up after a colonoscopy, with home glucose readings that have been runing high.
  11| 
  12| History of present illness
  13| Ntxawm Zong's log shows fasting values mostly 150 to 180 mg/dL over the past two weeks, higher than the 120s she held in the winter. She has not had sweating, shaking, or confusion to suggest hypoglycemia, and she is not waking at night to urinate. Breakfast is rice porridge or toast, lunch is often soup, and supper is rice with vegetables and a small portion of meat. She feels well enough to cook and to walk the grocery aisles, and she denies thirst that wakes her, weight loss, chest pain, and foot ulcers. She walked thirty minutes on most days until the week of the procedure and has started again.
  14| 
  15| A screening colonoscopy was done in March 2026. Two small polyps were removed by cold snare polypectomy, and the report called them tubular adenomas. Images are posted at https://portal.example.net/gi/zong-colon for her son-in-law to open with her. She had some gas pain for two days and then felt like herself. No rectal bleeding since the procedure.
  16| 
  17| Her son-in-law, Chidera Nwankwo, came in with her today, wich has been the pattern since her daughter took a job out of state. On the drive to the clinic a truck clipped the passenger mirror. No one was hurt and they did not need an emergency department. He wrote down plate 6TRD204. He works in Stillwater and she lives in Maplewood, so the visit fits after his shift. He is the one who compares the glucose log with the pill box. She does not drink alcohol and stopped smoking in her thirties. A daughter calls on Sundays from another state, and there is no caregiver strain he wanted to raise today.
  18| 
  19| Past medical history
  20| Type 2 diabetes mellitus diagnosed in her fifties. Essential hypertension. Chronic kidney disease stage 2, with a stable creatinine. Dyslipidemia. No coronary stent and no prior stroke. Right cataract extraction several years ago.
  21| 
  22| Medications
  23| Metformin 1000 mg by mouth twice daily
  24| Glipizide 5 mg by mouth daily with breakfast
  25| Lisinopril 10 mg by mouth daily
  26| Atorvastatin 20 mg by mouth at bedtime
  27| Aspirin 81 mg by mouth daily
  28| She missed two evening metformin doses during teh colonoscopy bowel prep and then restarted.
  29| 
  30| Allergies
  31| No known drug allergy.
  32| 
  33| Examination
  34| Blood pressure 136/78 mmHg, pulse 74 beats per minute, weight 63.5 kg, BMI 26. She is a 67-year-old woman in no distress, alert, and neatly dressed. Lungs clear, heart regular, no new murmur. Abdomen soft and nontender, with no liver edge. Feet have intact skin, palpable dorsalis pedis pulses, and normal monofilament testing at all standard sites. Neck is supple and the clipped-mirror story did not leave a tender muscle or a bruise. Mood is good-humored and she answers questions herself, turning to her son-in-law only for dates. Dilated retinal examination was done by optometry last fall and showed no diabetic retinopathy.
  35| 
  36| Labs
  37| Hemoglobin A1c today is 8.1 percent, up from 7.2 percent. Creatinine 0.92 mg/dL, eGFR 74 mL/min/1.73 m2, urine albumin-to-creatinine ratio 18 mg/g. LDL cholesterol 88 mg/dL on the current statin. Potassium 4.2 mmol/L.
  38| 
  39| Assessment and plan
  40| 1. Type 2 diabetes mellitus, above goal. The missed doses around colonoscopy do not explain an A1c of 8.1 percent. I will raise glipizide to 5 mg by mouth twice daily and keep metformin at 1000 mg by mouth twice daily. She knows the signs of a low and will keep glucose tablets in her purse. I asked her to write down any value under 80 mg/dL and to hold a glipizide dose if she is not eating. Metformin will be stopped if a future creatinine climbs or if she has vomiting that keeps her from fluids. Repeat hemoglobin A1c in three months. Continue foot checks at home and a yearly dilated eye exam.
  41| 2. Tubular adenomas on screening colonoscopy with cold snare polypectomy. Surveillance colonoscopy in three years was the gastroenterologist's interval, and I agree. No anemia to suggest a missed lesion.
  42| 3. Essential hypertension and stage 2 chronic kidney disease. Blood pressure and albumin excretion are acceptable on lisinopril. No change today.
  43| 4. Prevention. Atorvastatin and aspirin stay as written. A shingles vaccine was offered and she will think it over with her daughter on the phone.
  44| 
  45| Return sooner for chest pain, a glucose she cannot bring up, blood in the stool, or a foot wound. The plan was reviewed with Chidera Nwankwo, who will update the pill box tonight.
  46| 
  47| Address on the registration line: 1280 Tamarack Avenue, Maplewood, MN 55109.
  48| Phone (651) 555-0192.
  49| Fax (651) 555-0140 for the colonoscopy office if they need a medication list.
  50| 
  51| Electronically signed
  52| Olena Bondar-Hrytsenko, MD
  53| Internal Medicine
  54| 
  55| Author: Olena Bondar-Hrytsenko, MD
=== END DOCUMENT ===
ITEMS FOR fd-0168:
D1 | line 15 | A: KEEP "screening colonoscopy" | B: KEEP "colonoscopy"
D2 | line 20 | A: KEEP "Right cataract extraction" | B: KEEP "cataract extraction"
D3 | line 37 | A: KEEP "Hemoglobin A1c today is 8.1 percent, up from 7.2 percent" | B: KEEP "Hemoglobin A1c today is 8.1 percent" [unsure]
D4 | line 41 | A: KEEP "screening colonoscopy" | B: KEEP "colonoscopy"
D5 | line 41 | A: KEEP "Surveillance colonoscopy" | B: KEEP "colonoscopy"
K1 | line 2 | KEEP "Outpatient Progress Note"
K2 | line 13 | KEEP "150 to 180 mg/dL"
K3 | line 13 | KEEP "weight loss"
K4 | line 13 | KEEP "chest pain"
K5 | line 13 | KEEP "foot ulcers"
K6 | line 15 | KEEP "polyps"
K7 | line 15 | KEEP "gas pain"
K8 | line 15 | KEEP "rectal bleeding"
K9 | line 20 | KEEP "creatinine"
K10 | line 20 | KEEP "coronary stent"
K11 | line 20 | KEEP "stroke"
K12 | line 24 | KEEP "with breakfast"
K13 | line 28 | KEEP "bowel prep"
K14 | line 31 | KEEP "No known drug allergy"
K15 | line 34 | KEEP "monofilament testing"
K16 | line 40 | KEEP "glucose tablets"
K17 | line 40 | KEEP "creatinine"
K18 | line 40 | KEEP "vomiting"
K19 | line 40 | KEEP "hemoglobin A1c"
K20 | line 40 | KEEP "foot checks"
K21 | line 45 | KEEP "chest pain"
K22 | line 45 | KEEP "blood in the stool"
K23 | line 45 | KEEP "foot wound"

=== DOCUMENT fd-0183 ===
   1| HENSLEY MEMORIAL HOSPITAL
   2| OUTPATIENT NEUROLOGY CLINIC
   3| REFERRAL INTAKE AND SCHEDULING CONFIRMATION
   4| 
   5| Date: 14 March 2026
   6| Patient Name: Jeffrey Townsend
   7| MRN: 7048219
   8| Referral Origin: Dr. R.J. Prescott
   9| 
  10| Dear Mr. Townsend,
  11| 
  12| This letter comfirms that Hensley Memorial Hospital has received and processed your clinical referral for comprehensive neurological assessment. Your upcoming diagnostic consultation is scheduled for 14 March 2026 at 10:15 AM with our neuromuscular clinical service.
  13| 
  14| Please report directly to our outpatient reception suite at the following address:
  15| 742 Hensley Boulevard, Suite 300
  16| Charleston, SC 29401
  17| 
  18| Your referring physician, Dr. R.J. Prescott, requested this specialty consultation to evaluate progressive sensory paresthesias in your lower extremities and intermittent gait instability. Our clinical intake team has reviewed your preliminary electromyography results and routine blood panels. To prepare for your clinical apointment, please adhere to these pre-visit instuctions:
  19| 1. Arrive fifteen minutes prior to your scheduled time to finalize registration and health plan eligibility verification.
  20| 2. Bring a current, comprehensive list of all prescription medications, over-the-counter supplements, and precise dosing regimens.
  21| 3. Bring any recent external imaging discs or neurophysiology paper reports not performed within our facility.
  22| 4. Wear loose, comfortable clothing to facilitate a complete neuromuscular examination.
  23| 
  24| Our intake coordinator notes that your spouse, Nancy Townsend, is listed as your primary medical emergency contact and is welcome to attend the consultation to participate in discussions regarding your diagnostic management plan.
  25| 
  26| If you must reschedule or have clinical questions prior to your visit, please contact our administrative desk at (843) 555-0164 ext. 248 between 8:30 AM and 4:30 PM, Monday through Friday. Secure scheduling messages or pre-visit questionnaires may also be routed directly to our designated intake coordinator, claire webster, through our secure patient communication portal.
  27| 
  28| We look forward to participating in your care at Hensley Memorial Hospital.
  29| 
  30| Sincerely,
  31| 
  32| Arthur Holloway, MD
  33| Chief of Clinical Neurology
  34| Hensley Memorial Hospital
=== END DOCUMENT ===
ITEMS FOR fd-0183:
K1 | line 12 | KEEP "comprehensive neurological assessment"
K2 | line 18 | KEEP "progressive sensory paresthesias"
K3 | line 18 | KEEP "intermittent gait instability"
K4 | line 18 | KEEP "routine blood panels"
K5 | line 22 | KEEP "neuromuscular examination"

=== DOCUMENT fd-0190 ===
   1| Message Thread
   2| MRN: 9482015
   3| Patient: Gianna Walder-D'Angelo
   4| Date: 17 November 2026
   5| 
   6| Message 1
   7| From: gianna
   8| Sent: 17 November 2026 09:30 AM
   9| To: Dr. Richard Campbell
  10| 
  11| hello dr. campbell,
  12| i am writing to check on the home health physical therapy referral following my knee arthroscopy performed at Pembroke Regional Hospital. my son-in-law Pieter van der Berg is staying with me to assist with daily ambulation and dressing changes. we have been keeping up with the home exercises twice daily, but i am still experiencing moderate swelling around the patellar incision. i have been taking celecoxib 100 mg PO BID with food and using cryotherapy packs for twenty minutes every three hours. my morning temperature was 98.2 F, and there is no erythema or calf tenderness.
  13| 
  14| the home nursing agency contacted us this morning stating they need to confirm my current residential recovery location and primary contact number before their intake nurse can arrive tomorrow. my home contact details are:
  15| 8422 Crestview Ridge Road
  16| Oakdale, IL 60443
  17| Phone: (312) 555-0134
  18| 
  19| could you also confirm if our care coordinator M.R.K. forwarded the post-op physical therapy protocol to their dispatch team? thank you so much for your assistance.
  20| 
  21| Message 2
  22| From: Dr. Richard Campbell
  23| Sent: 17 November 2026 11:15 AM
  24| To: Gianna Walder-D'Angelo
  25| 
  26| Dear Mrs. Walder-D'Angelo,
  27| 
  28| Thank you for your update. It is encouraging that you have no fever or wound erythema. Mild to moderate peri-incisional edema is expected at this stage. Please continue celecoxib 100 mg PO BID as prescribed and keep the operative lower extremity elevated on two pillows above heart level whenever you are seated or resting in bed.
  29| 
  30| I confirmed that our clinic navigator M.R.K. transmitted your discharge summary from Pembroke Regional Hospital along with the formal phase-one physical therapy orders to the home health coordination office. I also provided them with your phone number (312) 555-0134 and verified your address on Crestview Ridge Road. If your swelling increases significantly, if wound drainage develops, or if Pieter van der Berg notices any calf warmth, please contact our triage desk right away.
  31| 
  32| Sincerely,
  33| Richard Campbell, MD
=== END DOCUMENT ===
ITEMS FOR fd-0190:
K1 | line 12 | KEEP "home health physical therapy"
K2 | line 12 | KEEP "dressing changes"
K3 | line 12 | KEEP "cryotherapy"
K4 | line 12 | KEEP "every three hours"
K5 | line 19 | KEEP "physical therapy"
K6 | line 28 | KEEP "peri-incisional edema"
K7 | line 30 | KEEP "physical therapy"

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
ITEMS FOR fd-0203:
D1 | line 14 | A: KEEP "preservative-free artificial tears" | B: KEEP "artificial tears"
D2 | line 26 | A: KEEP "magnetic resonance imaging of the brain and internal auditory canal" | B: KEEP "magnetic resonance imaging"
D3 | line 26 | A: KEEP "High-resolution computed tomography of the temporal bone" | B: KEEP "computed tomography"
D4 | line 26 | A: KEEP "House-Brackmann score of grade IV" | B: KEEP "House-Brackmann score"
K1 | line 2 | KEEP "AMBULATORY CARE PHARMACY AND CLINICAL TRIAGE"
K2 | line 12 | KEEP "oral"
K3 | line 12 | KEEP "10 mg"
K4 | line 14 | KEEP "while awake"
K5 | line 14 | KEEP "at bedtime"
K6 | line 16 | KEEP "gabapentin"
K7 | line 26 | KEEP "intravenous"
K8 | line 26 | KEEP "intracranial mass"
K9 | line 26 | KEEP "acute ischemia"
K10 | line 26 | KEEP "vascular compression"
K11 | line 26 | KEEP "facial paresis"

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
ITEMS FOR fd-0205:
D1 | line 40 | A: KEEP "Serum creatinine: 1.12 mg/dL (baseline 1.05 mg/dL)" | B: KEEP "Serum creatinine: 1.12 mg/dL"
D2 | line 43 | A: KEEP "B-type natriuretic peptide (BNP): 310 pg/mL (down from admission peak of 1,420 pg/mL)" | B: KEEP "B-type natriuretic peptide (BNP): 310 pg/mL"
D3 | line 44 | A: KEEP "Liver function tests (AST/ALT): 22/26 U/L, total bilirubin 0.6 mg/dL" | B: KEEP "total bilirubin 0.6 mg/dL"
D4 | line 47 | A: RELATIVE "Papas" | B: (nothing)
D5 | line 54 | A: KEEP "acute heart failure" | B: KEEP "heart failure"
K1 | line 2 | KEEP "DEPARTMENT OF PHARMACY SERVICES"
K2 | line 11 | KEEP "PATIENT DEMOGRAPHICS"
K3 | line 21 | KEEP "PRESCRIBER OF RECORD"
K4 | line 23 | KEEP "Division of Cardiology"
K5 | line 28 | KEEP "REVIEWING PHARMACIST"
K6 | line 32 | KEEP "LVEF 30-35%"
K7 | line 36 | KEEP "Pertinent laboratory panel"
K8 | line 49 | KEEP "Reconciled Discharge Regimen"
K9 | line 50 | KEEP "with meals"
K10 | line 51 | KEEP "each morning"
K11 | line 52 | KEEP "with food"
K12 | line 53 | KEEP "every morning"
K13 | line 54 | KEEP "with evening meal"
K14 | line 55 | KEEP "at bedtime"
K15 | line 58 | KEEP "chronic dry cough"
K16 | line 62 | KEEP "volume depletion"
K17 | line 63 | KEEP "basic metabolic panel"

=== DOCUMENT fd-0222 ===
   1| Clinical Pharmacy Consultation Note
   2| 
   3| Reason for Consult: Comprehensive medication reconciliation following discharge.
   4| 
   5| Patient Description: The patient is a 67-year-old individual with a history of Parkinson disease, peripheral neuropathy, and essential hypertension, admitted last week following an acute fall.
   6| 
   7| Subjective: The patient and the patient's spouse report persistent burning dysesthesias in the lower extremities despite gabapentin therapy. Records received from Outside Hospital noted poor response to gabapentin 600 mg PO TID. They request transition to Lyrica as recommended by neurology prior to transfer. The patient also reports mild dry cough and orthostasis.
   8| 
   9| Vitals: BP 118/74 mmHg, HR 72 bpm, SpO2 98% on room air, BMI 26.4 kg/m2.
  10| 
  11| Labs: Serum creatinine 0.92 mg/dL, eGFR >60 mL/min/1.73m2, serum potassium 4.4 mEq/L, AST 22 U/L, ALT 26 U/L, HbA1c 6.1%.
  12| 
  13| Medication Reconciliation and Assessment:
  14| 1. Neuropathic pain: Discontinue gabapentin. Initiate Lyrica 75 mg PO BID for 1 week, then titrate to 150 mg PO BID if tolerated.
  15| 2. Parkinson disease: Carbidopa-levodopa 25/100 mg PO TID with meals. Patient advised to avoid taking doses simultaneously with high-protein meals.
  16| 3. Hypertension: Lisinopril 10 mg PO daily. Blood pressure is currently well controlled.
  17| 4. Dyslipidemia: Atorvastatin 20 mg PO QHS.
  18| 
  19| Plan and Recommendations:
  20| Counseling provided via telephone to the patient regarding sedation and peripheral edema risks with Lyrica. Scheduled follow-up with Pain Clinic in four weeks for evaluation of neuropathic symptoms. Routine lab panel recommended in 2026. Clinical pharmacist review completed.
=== END DOCUMENT ===
ITEMS FOR fd-0222:
D1 | line 9 | A: KEEP "SpO2 98% on room air" | B: KEEP "SpO2 98%"
K1 | line 1 | KEEP "Clinical Pharmacy Consultation Note"
K2 | line 3 | KEEP "medication reconciliation"
K3 | line 5 | KEEP "acute fall"
K4 | line 7 | KEEP "burning dysesthesias"
K5 | line 7 | KEEP "dry cough"
K6 | line 7 | KEEP "orthostasis"
K7 | line 15 | KEEP "with meals"
K8 | line 20 | KEEP "sedation"
K9 | line 20 | KEEP "peripheral edema"

=== DOCUMENT fd-0245 ===
   1| Chest and Vascular Center
   2| CT Angiography Report
   3| 
   4| Patient: Elspeth Grainger
   5| DOB: 11/02/1971
   6| Age: 54 years
   7| MRN: 4O8l-229O
   8| Accession: AVC-26-55184
   9| Exam: CT angiography of the chest
  10| Collected: 3/4/26
  11| Ordering: Dr. Mateus Cavalcanti
  12| Address: PO Box 2284, Briarwick, ME 04982
  13| 
  14| CLINICAL INDICATION
  15| Outpatient evaluation for Marfan syndrome. The patient has an arm span
  16| greater than her height, mild scoliosis, and a maternal uncle who
  17| died suddenly of a reported aortic event. Her sister,
  18| Mrs. Rivka Marfan, gave the history by telephone. The sister
  19| has no connective-tissue diagnosis of her own, and the shared
  20| surname is not being treated as evidence of disease.
  21| 
  22| TECHNIQUE
  23| Helical CT angiography was performed from the thoracic inlet through
  24| the upper abdomen after 100 mL of iohexol 350 mg I/mL injected at
  25| 4 mL/sec. ECG-gated reconstructions of the aortic root were made
  26| at 0.6 mm. Heart rate during acquisition was 62 beats per minute.
  27| 
  28| COMPARISON
  29| No earlier examination is stored in this archive.
  30| 
  31| FINDINGS
  32| The aortic root measures 4.1 cm at the sinuses of Valsalva. The
  33| sinotubular junction measures 3.3 cm, and the mid ascending aorta
  34| measures 3.4 cm. No intimal flap, intramural hematoma, or
  35| penetrating ulcer is identified. The descending thoracic aorta
  36| measures 2.6 cm. The main pulmonary artery measures 2.7 cm. The
  37| lungs are clear. There is no pleural effusion and no pericardial
  38| effusion. A gentle thoracic scoliosis is present.
  39| 
  40| Serum creatinine on the morning of the examination was 0.8 mg/dL,
  41| and the eGFR was 94 mL/min/1.73 m2. Medicines taken that morning
  42| were metoprolol succinate 50 mg PO daily and losartan 50 mg PO daily.
  43| 
  44| IMPRESSION
  45| 1. Mild aortic root dilatation, in keeping with the stated concern
  46| for Marfan syndrome. There is no acute aortic syndrome.
  47| 2. Echocardiography and a genetics consultation are suggested.
  48| The doses listed above may continue unless the ordering
  49| clinician changes them.
  50| 
  51| Interpreted by Dr. Inês Barroso, cardiovascular radiology.
  52| The report was signed on the date of collection. End of report.
=== END DOCUMENT ===
ITEMS FOR fd-0245:
D1 | line 38 | A: KEEP "thoracic scoliosis" | B: KEEP "scoliosis"
K1 | line 2 | KEEP "CT Angiography"
K2 | line 47 | KEEP "genetics consultation"

Now output the result blocks.