You are one of two authors of a blind test set for a clinical text de-identification tool. The tool will later be scored on your documents, so the documents must read like genuine clinical records, not like exercises. Everything you write is synthetic.

You may read fresh-test-spec.md in your working directory (its text is also pasted below). Never run terminal commands. Do not write any files. Your final message must contain the documents themselves, in the exact format described at the end of this prompt, and nothing else of importance.

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

HARD RULES. A document that breaks one of these is rejected and has to be rewritten.
1. Invented people, facilities and numbers only. No real patient data, no real people, no real hospitals, pharmacies, insurers, employers or schools. Do not name any organization other than healthcare facilities and pharmacies that you invent. Refer to payers generically ("her health plan").
2. Phone and fax numbers: the last seven digits must be 555-0100 to 555-0199, with any area code and in any format. International forms may use +1 with such a number, or +44 20 7946 0xxx, +44 7700 900xxx, or +61 491 570 xxx.
3. Email addresses must use example.com, example.org, example.net or example.test. That includes obfuscated forms such as "name at example dot com".
4. URLs must use the same four example domains. IP addresses must come from 192.0.2.x, 198.51.100.x or 203.0.113.x.
5. A social security number, if you use one, must start with 000, 666 or 9.
6. Plain text only. No markdown (no asterisks for bold, no # headers, no code fences, no pipe tables). Plain-text tables use spaces or dashes. Use letters (accented letters are fine in names), digits and ordinary punctuation. Use Unicode dashes only where a required item asks for them. No emoji.
7. Stay inside the word range given for each slot. Every document is between 150 and 1,500 words.
8. Never mention that the document is synthetic, a test, or de-identified. Never put placeholders such as [NAME], XXXX or [REDACTED] in the text.
9. When a person is 90 or older, give the exact age. Do not write "90+" or "in her nineties".
10. Invent fresh names. Avoid stock names (John Smith, Maria Garcia, Sarah Johnson, Wei Chen, Priya Patel and the like). Do not reuse a person across documents in this batch.
11. Do not copy text you know from any existing de-identification test, repository, tool or published dataset. Write original documents.
12. Do not avoid names, facility names or drug names because they collide with ordinary words, diseases or drugs. Those collisions are exactly what the test needs.
13. Write like a busy clinician or staff member really writes: headers, footers, signature blocks, lists, plain-text tables, abbreviations, line wrapping where asked, and the occasional typo where asked. Clinical content must be accurate enough to be believable. Include drug names, doses, routes, frequencies, labs, vitals, diagnoses, section headers and procedure names as a real document of that kind would.
14. Aim for roughly one identifier mention per 40 to 60 words in a document that contains identifiers. A name that appears several times counts every time.


REWRITE REQUEST. Earlier versions of the documents below were rejected. For each slot, write a complete new version that satisfies every rule and every requirement of the slot. Keep what was good, fix what is listed, and do not mention this request.

BATCH: 4 slot(s). Write one document per slot.

SLOT s-014
Kind: Progress note or history and physical (H&P) note. An outpatient visit note, an inpatient SOAP progress note, or a full H&P. Headers, a signature block and an author line.
Length: about 1250 words (acceptable range 1000 to 1500)
Layout: hard-wrap the lines at about 76 characters, as in a text export or fax
Typos: include two to four realistic typos or slips, but not inside identifiers
Identifiers: yes
People: patient naming tradition: Anglo-American (English, Scottish or German-American descent). Clinician and staff naming tradition: South Asian: Punjabi or Hindi. Relative or caregiver naming tradition: Anglo-American (English, Scottish or German-American descent). Invent fresh names, with the patient's surname starting with the letter F unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_split] Let at least one person's full name break across a line, with the first name ending one line and the surname starting the next (in a hard-wrapped passage or a header).
- [ad_caps] Give a street address in ALL CAPS (label or fax header style).
- [u_url_end] Give a URL at the very end of a sentence, followed by a period.
- [n_lastfirst] Write at least one person's name in LAST, FIRST order (a header, label, sign-in line or list entry).
- [n_middle] Give at least one person a middle initial ("Maria L. Hernandez").
- [n_list] Include a list that holds several names together (care team, attendees, cc line, covering physicians, family members present).
- [n_relative] Name at least one relative or caregiver of the patient (spouse, parent, adult child, sibling) and say how they are related.
- [f_proper] Name one facility with an invented proper name (like "St. Brendan Medical Center" or "Calloway Regional Hospital").
- [f_ordinary] Name one facility whose name is made of ordinary words (like "Riverside Clinic", "Lakeside Pediatrics", "Maple Street Pharmacy").
- [d_dash] Write a numeric date with dashes (03-04-2026).
- [d_abbr] Write a date with an abbreviated month and no period ("Mar 4 2026", "4 Sep 2026").
- [d_monthyear] Write a date as month and year only ("March 2026").
- [d_header] Put a date inside a header or form field (Date of Service:, Collected:, Admitted:, Discharged:).
- [d_range] Write a date range ("03/01/2026 to 03/05/2026" or "March 1 through March 5").
- [i_mrn_labeled] Give a medical record number with a label (MRN:, Record #, Chart no.).
- [i_dashes] Give an ID with dashes between groups (4821-9932-07).
- [i_account] Give an account number or claim number.
- [p_plain] Give a phone number in common US format with an area code.
- [p_ext] Give a phone number with an extension ("x214" or "ext. 3307").
- [p_dots] Give a phone number written with dots or spaces (415.555.0142 or 415 555 0142).
- [ad_title] Give a street address in Title Case with city, state and ZIP.
- [ad_split] Give an address that breaks across lines (street on one line, city state ZIP on the next).
- [a_under] Give at least one age under 90 (patient or relative) in any common form. Ages under 90 are not identifiers.
- [k_labs] Include lab values and vital signs with units.

REJECTED VERSION OF s-014:
=== BEGIN REJECTED TEXT ===
DUNWOODY MEMORIAL HOSPITAL
OUTPATIENT CARDIOLOGY CLINIC CONSULTATION NOTE
Date of Service: 10/16/2026

PATIENT DEMOGRAPHICS AND REGISTRATION DATA
Name: FAIRCHILD, GREGORY M.
MRN: 7492018
Account Number: AC-8820491
Device Transmitter ID: 4821-9932-07
Date of Birth: 04/12/1959
Age: 67-year-old male
Home Phone: (512) 555-0134
Cellular Phone: 512.555.0191
Patient Address:
412 NORTH HEATHER BLVD, AUSTIN, TX 78759

Referring Provider / Practice:
Pine Creek Family Medicine
1408 Oak Ridge Lane
Round Rock, TX 78681
Office Contact: 512-555-0182 ext. 409

CARE TEAM PRESENT:
Attending Physician: Harpreet K. Varma, MD
Cardiology Fellow: Rajesh Gill, MD
Resident Physician: Simran Chawla, MD
Clinical Nurse Specialist: Navdeep Kaur, RN

CHIEF COMPLAINT:
Follow-up for recent acute decompensated heart failure discharge,
shortness of breath on exertion, and medication reconciliation.

HISTORY OF PRESENT ILLNESS:
Gregory M. Fairchild is a 67-year-old male with a significant past medical
history of ischemic cardiomyopathy with reduced ejection fraction (LVEF 30%
established in August 2024), coronary artery disease status post percutaneous
coronary intervention to the left anterior descending artery in 2021, type 2
diabetes mellitus, and stage 3a chronic kidney disease, who presents for an
urgent outpatient post-hospitalization evaluation. He was recently admitted
to Dunwoody Memorial Hospital from October 10 through October 14, 2026, for
volume overload characterized by progressive dyspnea, orthopnea requiring
three pillows, and bilateral lower extremity edema. He was discharged on
10-14-2026 after aggressive intravenous diuresis with furosemide, which
achieved a net negative fluid balance of 4.2 liters and improved his weight
from 88.4 kg down to 84.2 kg at discharge.

The patient was accompanied to today's appointment by his wife, Eleanor
Fairchild, who assisted with the interval history. Mr. Fairchild reports
that since returning home on Oct 15 2026, he has felt moderately improved
compared to his status prior to admission, though he continues to have mild
exertional dyspnea when walking up more than one flight of stairs. He denies
acute chest tightness, chest pressure, resting orthopnea, or paroxysmal
nocturnal dyspnea over the last 48 hours. He notes intermittent palpatations
lasting only a few seconds when bending over, without lightheadedness or
syncope. Mrs. Fairchild maintains a daily log of morning weights and blood
pressures. His weight this morning was 84.5 kg, which is stable relative to
his discharge weight. He has adhered strictly to a 2000 mg sodium restriction
and 1.5-liter daily fluid limitation. He completed lab draws yesterday at
Pine Creek Family Medicine, located at 1408 Oak Ridge Lane, Round Rock, TX
78681, as instructed upon hospital release.

PAST MEDICAL HISTORY:
1. Ischemic cardiomyopathy (LVEF 30% on echocardiogram in August 2024).
2. Coronary artery disease with bare-metal stent to proximal LAD (2021).
3. Primary hypertension, diagnosed 12 years ago.
4. Type 2 diabetes mellitus without retinopathy, non-insulin dependent.
5. Chronic kidney disease stage 3a, baseline serum creatinine 1.1 to 1.3 mg/dL.
6. Hyperlipidemia, mixed etiology.
7. Obstructive sleep apnea, noncompliant with CPAP therapy.

PAST SURGICAL HISTORY:
1. Percutaneous coronary intervention with single drug-eluting stent (2021).
2. Right inguinal hernia repair (open mesh, 2015).
3. Appendectomy in childhood.

CURRENT MEDICATIONS:
1. Sacubitril / valsartan (Entresto) 49/51 mg PO BID.
2. Carvedilol 12.5 mg PO BID with meals.
3. Spironolactone 25 mg PO daily.
4. Furosemide 40 mg PO every morning (titrated from 20 mg at discharge).
5. Empagliflozin (Jardiance) 10 mg PO every morning.
6. Atorvastatin 40 mg PO nightly at bedtime.
7. Aspirin 81 mg PO daily.
8. Metformin hydrochloride 500 mg PO BID (held during recent admission).
9. Potassium chloride 20 mEq PO daily.

ALLERGIES:
Lisinopril (angioedema, lips and tongue swelling in 2018).
No known drug allergies to iodinated contrast or shellfish.

FAMILY HISTORY:
Father died of myocardial infarction at age 62.
Mother had hypertension and stroke at age 81.
One younger brother, age 63, living with coronary disease and stent.
No family history of early cardiomyopathy, sudden cardiac arrest, or long QT.

SOCIAL HISTORY:
Mr. Fairchild lives with his wife Eleanor in a single-story home. Retired
civil engineer. Former tobacco use: 25 pack-years, quit 15 years ago. Denies
current or past illicit substance use. Alcohol intake is minimal, limited to
one glass of red wine once a month. Independent in activities of daily living
prior to this acute exacerbation.

REVIEW OF SYSTEMS:
Constitutional: No fever, chills, diaphoresis, or recent weight gain.
Cardiovascular: Mild exertional dyspnea, occasional brief palpitations as
noted in HPI. Denies chest pain, angina, orthopnea, or presyncope.
Respiratory: Denies cough, hemoptysis, or audible wheezing.
Gastrointestinal: Denies nausea, vomiting, abdominal pain, or early satiety.
Genitourinary: Denies dysuria, gross hematuria, or daytime urinary urgency;
reports mild nocturia twice nightly secondary to evening diuretic timing.
Musculoskeletal: No acute joint pain or myalgias. Ambulatroy without cane.
Neurological: No focal weakness, sensory loss, gait ataxia, or dizziness.
Skin: Warm, dry, no active breakdown or stasis ulcerations.
Psychiatric: Normal mood and affect, denies anxiety or depressive symptoms.

PHYSICAL EXAMINATION:
Vital Signs:
Temperature: 98.4 F (36.9 C), oral
Pulse: 72 beats per minute, regular rhythm
Blood Pressure: 138/84 mmHg, right arm, seated
Respiratory Rate: 16 breaths per minute, unlabored
Oxygen Saturation: 97% on ambient room air
Weight: 84.5 kg (186.3 lbs)
Height: 70 inches (177.8 cm)
Body Mass Index (BMI): 26.7 kg/m2

General: 67-year-old male sitting comfortably in chair, well-developed,
well-nourished, alert, oriented x4, in no acute respiratory distress.
HEENT: Normocephalic, atraumatic. Pupils equal, round, and reactive to light.
Sclerae anicteric. Oropharynx clear, moist mucous membranes, no angioedema.
Neck: Supple. Jugular venous pulse estimated at 7 cm H2O at 45 degrees, which
is down from 11 cm noted during hospitalization. Carotid pulses 2+ bilaterally
without bruits. No thyromegaly or cervical lymphadenopathy.
Cardiovascular: Regular rate and rhythm. S1 and S2 present. Soft grade 2/6
holosystolic murmur heard best at the cardiac apex, radiating to axilla,
consistent with functional mitral regurgitation. S3 gallop has resolved; no
pericardial friction rub or S4 gallop appreciated.
Lungs: Clear to auscultation bilaterally in anterior and mid lung fields;
scant bibasilar end-inspiratory crackles, significantly improved from the
diffuse coarse rales observed on hospital admission. No expiratory wheezing.
Abdomen: Soft, non-distended, non-tender to light and deep palpation. Normal
active bowel sounds in all four quadrants. No hepatomegaly; liver span 9 cm.
No hepatojugular reflux elicited with sustained abdominal pressure.
Extremities: Warm extremities with trace (1+) non-tender pitting edema at both
ankles; no calves tenderness, erythema, or cord. Bilateral dorsalis pedis and
posterior tibial pulses 2+ palpable. Capillary refill less than 2 seconds.
Neurological: Cranial nerves II-XII grossly intact. Motor strength 5/5 in
bilateral upper and lower extremities. Sensation intact to light touch.
Gait is steady without assistive device.

DIAGNOSTIC DATA:
Serum Chemistry and Hematology (drawn Oct 15 2026):
  Sodium: 137 mmol/L (reference 135 - 145)
  Potassium: 4.2 mmol/L (reference 3.5 - 5.0)
  Chloride: 101 mmol/L (reference 98 - 107)
  Bicarbonate (CO2): 24 mmol/L (reference 22 - 29)
  Blood Urea Nitrogen (BUN): 22 mg/dL (reference 7 - 20)
  Serum Creatinine: 1.15 mg/dL (reference 0.70 - 1.30)
  Estimated GFR: 64 mL/min/1.73m2 (baseline stable)
  Serum Glucose: 118 mg/dL (reference 70 - 99)
  B-type Natriuretic Peptide (BNP): 340 pg/mL (down from 1,210 during stay)
  Hemoglobin: 13.4 g/dL (reference 13.0 - 17.5)
  Hematocrit: 40.2% (reference 39.0 - 50.0)
  White Blood Cell Count: 6.4 x10^3/uL (reference 4.0 - 11.0)
  Platelet Count: 215 x10^3/uL (reference 150 - 450)
  Hemoglobin A1c: 6.8% (reference < 5.7%)

12-Lead Electrocardiogram (clinic today, 10/16/2026):
Normal sinus rhythm at 70 bpm. Normal PR interval 168 ms. QRS duration
106 ms. QTc interval 438 ms. Old anterior infarct pattern with Q waves in V1
through V3, unchanged from tracing obtained on 10-14-2026 at discharge. No
acute ST-segment elevation, depression, or T-wave inversion.

Transthoracic Echocardiogram (Dunwoody Memorial Hospital summary review):
Severe left ventricular systolic dysfunction with calculated ejection fraction
of 30%. Moderate anterior and apical hypokinesis. Moderate functional mitral
regurgitation. Right ventricular systolic pressure estimated at 38 mmHg.

ASSESSMENT AND CLINICAL IMPRESSION:
1. Chronic systolic heart failure (HFrEF, NYHA functional class II, ACC/AHA
Stage C) due to ischemic cardiomyopathy. Patient shows favorable clinical
response following recent inpatient diuresis at Dunwoody Memorial Hospital.
Volume status is currently near euvolemic with JVP 7 cm H2O and trace peripheal
edema. BNP has decreased significantly from peak admission levels. Renal
function and serum electrolytes remain reassuringly stable on guideline-
directed medical therapy (GDMT).
2. Coronary artery disease: Clinically stable, without angina or ischemic
equivalents. Stented proximal LAD remains silent.
3. Hypertension: Adequately controlled on carvedilol and Entresto.
4. Type 2 diabetes mellitus: Stable glycemic control with HbA1c 6.8%.
5. Chronic kidney disease stage 3a: Preserved baseline eGFR 64 mL/min/1.73m2.

PLAN AND RECOMMENDATIONS:
1. Heart Failure Medical Management:
   - Continue sacubitril / valsartan (Entresto) 49/51 mg PO BID.
   - Continue carvedilol 12.5 mg PO BID; will consider uptitration to 25 mg
     BID at next visit if resting heart rate and blood pressures permit.
   - Continue spironolactone 25 mg PO daily.
   - Adjust furosemide: Patient is near dry weight. Continue furosemide 40 mg
     PO daily in morning for 5 additional days, then reduce to maintenance
     dose of 20 mg PO daily if home weight remains stable below 85.0 kg.
   - Continue empagliflozin 10 mg PO daily for dual cardioprotective and
     glycemic benefit.
   - Continue potassium chloride 20 mEq PO daily while on loop diuretic.
2. Fluid and Dietary Counseling:
   - Reenforced strict 2000 mg/day sodium intake and 1.5-liter fluid limit.
   - Instructed patient and wife Eleanor to record morning weights daily
     after voiding and prior to breakfast.
   - Specific red-flag parameters given: call clinic if weight increases by
     more than 3 lbs in 24 hours or 5 lbs in one week.
3. Diabetes and Preventative Care:
   - Resume metformin 500 mg PO BID next week given stable renal function.
   - Continue atorvastatin 40 mg PO daily and aspirin 81 mg PO daily.
4. Monitoring and Follow-Up:
   - Repeat BMP (chem 7) and magnesium in 10 to 14 days to monitor potassium
     and creatinine following diuretic adjustment.
   - Return to Dunwoody Memorial Hospital Outpatient Cardiology Clinic in
     four weeks for repeat clinical evaluation and GDMT optimization.
   - If severe shortness of breath, chest pressure, or syncope occurs, the
     patient is instructed to proceed immediately to the nearest emergency
     department.
   - Patient educational resources regarding heart failure self-management
     were provided and are accessible online at
     https://portal.example.org/chf-care.

Care Team Signoff:
Electronically signed by:
Simran Chawla, MD, Resident Physician
Rajesh Gill, MD, Fellow in Cardiovascular Disease
Harpreet K. Varma, MD, Attending Cardiologist
Clinic Primary Contact: Navdeep Kaur, RN, BSN
Dunwoody Memorial Hospital Cardiovascular Institute

=== END REJECTED TEXT ===

Rules broken by that version:

- length: The document must be between 150 and 1,500 words. Offending text or numbers in your version: your text has 1715 words. The hard limits are 150 and 1,500 and this slot targets about 1250.

SLOT s-019
Kind: Progress note or history and physical (H&P) note. An outpatient visit note, an inpatient SOAP progress note, or a full H&P. Headers, a signature block and an author line.
Length: about 1150 words (acceptable range 920 to 1380)
Layout: flowing lines with no hard wrapping
Typos: no deliberate typos needed
Identifiers: NONE. This slot must contain NO identifier of any kind. That means no personal names (patient, relative, clinician or staff), no facility or pharmacy names, no dates in any form (not even month and year, but a bare year such as 2019 is allowed), no ages of 90 or over, no phone, fax, email, street address, city or ZIP, no record or plan or account numbers, and no URL or IP address. Write it so it still reads like a real document of this kind, for example with "the patient", "her daughter", "the clinic", "the covering pharmacist". It must still be full of clinical content (drug names, doses, labs, diagnoses, section headers, procedures). Ages under 90 are fine.
Required items:
- [f_service] Mention a clinic or center as a SERVICE and not as a named practice (a referral to Pain Clinic, Diabetes Center, Cardiology, Wound Care). Also use the phrase "Outside Hospital" once as the source of outside records or imaging.
- [d_year_only] Use a bare year on its own as a clinical fact ("diagnosed in 2019", "since 2021"). A bare year is not an identifier.
- [a_under] Give at least one age under 90 (patient or relative) in any common form. Ages under 90 are not identifiers.
- [k_brand] Mention a brand-name drug whose name looks like a given name or a word (for example Allegra, Lyrica or similar), alongside generic names.
- [k_eponym] Use an eponymous disease, sign or score with its full term (Bell palsy, Wells score, Glasgow Coma Scale, Apgar score, Gleason score, Tanner stage, Graves disease, Parkinson disease, Wilson disease and similar).
- [k_taper] Include a taper or fraction written with slashes ("prednisone 40/30/20/10 mg", "every 2/3 weeks").
- [k_sig] Include medication lines with dose, route and frequency (for example 40 mg PO BID, 5 mL IV q8h PRN).
- [k_labs] Include lab values and vital signs with units.
- [k_proc] Mention procedure names and diagnoses by their ordinary clinical names.

REJECTED VERSION OF s-019:
=== BEGIN REJECTED TEXT ===
INPATIENT CONSULTATION REPORT
DIVISION OF RHEUMATOLOGY AND CLINICAL IMMUNOLOGY
Inpatient Consultation Note

PATIENT IDENTIFIERS AND DEMOGRAPHICS:
De-identified inpatient consultation record.

REASON FOR CONSULTATION:
Evaluation and inpatient management of acute multi-joint inflammatory arthritis flare, corticosteroid tapering strategy, optimization of painful peripheral neuropathy, and management of steroid-induced hyperglycemia.

HISTORY OF PRESENT ILLNESS:
The patient is a 56-year-old female with a long-standing clinical history of seropositive rheumatoid arthritis diagnosed in 2017, type 2 diabetes mellitus diagnosed in 2019, essential hypertension, and a documented episode of acute right-sided Bell palsy in 2021 that resolved completely with no residual facial weakness or asymmetry. She was admitted to the general medicine inpatient service three days ago following an acute, disabling polyarticular flare characterized by progressive symmetrical joint swelling, warmth, severe pain, and morning stiffness exceeding two hours across the bilateral wrists, metacarpophalangeal joints, proximal interphalangeal joints, and right knee.

The current flare began approximately four weeks ago following a temporary disruption in her baseline subcutaneous biologic regimen. Prior to admission, she was maintained on certolizumab pegol 200 mg subcutaneously every 2/3 weeks alongside daily oral hydroxychloroquine. Historical records, synovial biopsies, and plain radiographs transferred from Outside Hospital confirm symmetrical marginal erosions of the second and third metacarpal heads and progressive carpal space narrowing first identified in 2023. During emergency triage prior to inpatient transfer, she received parenteral analgesia and high-dose systemic corticosteroid therapy was initiated.

On hospital day 1, she underwent diagnostic and therapeutic right knee arthrocentesis, yielding 38 mL of cloudy yellow synovial fluid. Synovial fluid analysis demonstrated a total nucleated cell count of 18,400 /uL with 78% polymorphonuclear leukocytes, negative Gram stain, and absent intracellular or extracellular birefringent crystals under polarizing light microscopy, confirming non-crystalline inflammatory synovitis without evidence of septic arthritis. Aerobic and anaerobic cultures of the synovial aspirate demonstrate no bacterial growth at 48 hours.

Over the preceding 48 hours, the patient has reported burning dysesthesias, sharp tingling sensations, and contact allodynia over both feet and distal lower extremities in a classic stocking distribution, representing diabetic distal symmetric polyneuropathy aggravated by physiologic stress and systemic inflammation. She also noted mild right lower extremity fullness. Her 32-year-old daughter was interviewed at the bedside and corroborated that the patient has struggled with nocturnal foot burning over the past six months and regularly experiences marked blood glucose elevations whenever systemic corticosteroids are administered.

The primary inpatient medical team requested formal rheumatology consultation to establish an outpatient glucocorticoid taper, optimize neuropathic symptom management, assist with inpatient glycemic stabilization, and coordinate post-discharge specialty referrals, including referral to Diabetes Center for glycemic management and Pain Clinic for multidisciplinary pain rehabilitation.

REVIEW OF SYSTEMS:
Constitutional: Fatigue present; denies fever, chills, night sweats, or unexpected weight loss.
HEENT: Denies visual blurring, dry eyes, dry mouth, oral ulcers, or recurrent facial droop; prior Bell palsy remains completely quiescent. Chronic allergic rhinitis is controlled with daily oral antihistamines.
Cardiovascular: Denies chest tightness, exertional pressure, palpitations, or orthopnea.
Respiratory: Denies cough, dyspnea on exertion, pleurisy, or wheezing.
Gastrointestinal: Mild epigastric burning attributed to oral prednisone; denies nausea, vomiting, melena, or hematochezia.
Genitourinary: Denies dysuria, urgency, or gross hematuria.
Musculoskeletal: Marked tenderness and soft-tissue swelling in bilateral wrists, MCP joints, and right knee; morning stiffness improved from 120 minutes down to 30 minutes following steroid administration.
Neurological: Burning pain and allodynia involving bilateral plantar surfaces and toes; denies focal motor weakness, drop foot, or bowel and bladder dysfunction.
Integumentary: No rheumatoid nodules, active vasculitic purpura, psoriasis plaques, or cutaneous ulcerations.
Psychiatric: Mild situational anxiety related to functional impairment; cognition intact.

PAST MEDICAL HISTORY:
1. Seropositive rheumatoid arthritis, diagnosed in 2017.
2. Type 2 diabetes mellitus, diagnosed in 2019.
3. Essential hypertension, diagnosed in 2018.
4. Right peripheral facial paralysis (Bell palsy), diagnosed in 2021, resolved.
5. Distal symmetric diabetic polyneuropathy, diagnosed in 2023.
6. Allergic rhinitis, longstanding.

PAST SURGICAL HISTORY:
1. Diagnostic and therapeutic right knee arthrocentesis (inpatient hospital day 1).
2. Laparoscopic cholecystectomy in 2019.
3. Total abdominal hysterectomy for benign leiomyomata in 2018.

MEDICATIONS PRIOR TO ADMISSION:
1. Certolizumab pegol 200 mg subcutaneously every 2/3 weeks (held during current admission).
2. Hydroxychloroquine sulfate 200 mg PO BID.
3. Lyrica 75 mg PO BID for peripheral neuropathic pain.
4. Allegra 180 mg PO daily for allergic rhinitis.
5. Metformin hydrochloride 1000 mg PO BID.
6. Lisinopril 20 mg PO daily.
7. Pantoprazole sodium 40 mg PO daily before breakfast.
8. Acetaminophen 650 mg PO q6h PRN musculoskeletal pain.

CURRENT INPATIENT MEDICATIONS:
1. Prednisone 40 mg PO daily every morning with food.
2. Hydroxychloroquine sulfate 200 mg PO BID.
3. Lyrica 75 mg PO BID.
4. Allegra 180 mg PO daily.
5. Insulin glargine 16 units subcutaneously nightly at bedtime.
6. Insulin lispro subcutaneously before meals per hospital medium-dose correction protocol.
7. Enoxaparin sodium 40 mg subcutaneous once daily for deep vein thrombosis prophylaxis.
8. Pantoprazole sodium 40 mg PO daily.

ALLERGIES:
Sulfamethoxazole-trimethoprim (diffuse pruritic maculopapular drug eruption).
Codeine phosphate (severe nausea and lightheadedness).

FAMILY HISTORY:
Mother had seropositive rheumatoid arthritis and ischemic coronary disease.
Father had type 2 diabetes mellitus and hypertension.
Sister, age 52, living with autoimmune thyroiditis.
No family history of inflammatory bowel disease or systemic lupus erythematosus.

SOCIAL HISTORY:
The patient resides with her spouse in a single-level home; her adult daughter lives nearby and assists with community errands. Lifetime non-smoker. Denies alcohol or illicit substance use. Retired municipal accountant.

PHYSICAL EXAMINATION:
Vital Signs:
Temperature: 98.6 F (37.0 C)
Blood Pressure: 132/80 mmHg
Pulse: 76 beats per minute, regular
Respiratory Rate: 16 breaths per minute
Oxygen Saturation: 98% on ambient air
Body Mass Index: 28.4 kg/m2

General: 56-year-old female, alert, oriented x4, pleasant, in no acute distress, resting comfortably in hospital bed.
HEENT: Normocephalic, atraumatic. Sclerae anicteric, conjunctivae pink. Oropharynx clear, moist membranes, without ulcerations. Facial musculature symmetric, forehead wrinkles symmetrically, eyelid closure complete bilaterally without lagophthalmos, smile symmetric; no sequelae of prior Bell palsy.
Neck: Supple, trachea midline, thyroid non-palpable, no jugular venous distention, no carotid bruits.
Cardiovascular: Regular rate and rhythm, normal S1 and S2, no murmurs, gallops, or friction rubs. Radial, dorsalis pedis, and posterior tibial pulses 2+ bilaterally.
Lungs: Clear to auscultation bilaterally in anterior, lateral, and posterior lung fields. No crackles, rhonchi, or expiratory wheezes. Normal unlabored excursion.
Abdomen: Soft, non-distended, non-tender to light and deep palpation. Normoactive bowel sounds. No hepatosplenomegaly or rebound tenderness.
Musculoskeletal Examination:
Bilateral hands and wrists: Symmetrical boggy synovial swelling and tenderness along bilateral dorsal radiocarpal joints and second, third, and fourth MCP joints. Mild ulnar drift without fixed subluxations. Grip strength reduced bilaterally secondary to wrist pain.
Right knee: Trace residual suprapatellar effusion, markedly improved post-arthrocentesis; mild local warmth without erythema; active flexion to 115 degrees with terminal discomfort.
Left knee: No effusion, warmth, or joint tenderness; full painless active range of motion.
Ankles and feet: Mild tenderness across bilateral second and third MTP joints on compression; no acute erythema or warm effusion.
Neurological Examination:
Mental status: Alert, oriented, fluent speech, intact memory.
Cranial nerves II through XII intact bilaterally.
Motor: Muscle strength 5/5 in proximal upper and lower extremities; 4+/5 in bilateral hand intrinsics due to joint tenderness; 5/5 in bilateral ankle dorsiflexion and plantarflexion.
Sensory: Diminished sensation to light touch and pinprick in a symmetrical stocking pattern distal to mid-calves. Vibratory sensation reduced at bilateral great toes. Hyperalgesia and light touch allodynia elicited across bilateral plantar surfaces.
Reflexes: Deep tendon reflexes 2+ at biceps, triceps, and brachioradialis; 2+ patellar reflexes; 1+ Achilles reflexes bilaterally. Plantar responses flexor bilaterally; negative Babinski sign.
Vascular / Lower Extremity Circumference:
Right calf circumference 35.5 cm; left calf circumference 35.0 cm (0.5 cm difference). Calves soft and non-tender without cord. No pitting edema. Wells score for deep vein thrombosis calculated at 0 points (low pretest probability).
Skin: No subcutaneous rheumatoid nodules over pressure points. No periungual infarcts, digital gangrene, purpura, or active ulcerations.

LABORATORY AND DIAGNOSTIC DATA:
Serum Chemistry and Complete Blood Count:
  Sodium: 139 mmol/L
  Potassium: 4.1 mmol/L
  Chloride: 102 mmol/L
  Bicarbonate: 25 mmol/L
  Blood Urea Nitrogen: 16 mg/dL
  Serum Creatinine: 0.82 mg/dL
  Estimated GFR: > 60 mL/min/1.73m2
  Serum Glucose: 164 mg/dL
  Hemoglobin A1c: 7.6% (measured on admission)
  C-reactive protein: 24.6 mg/L (elevated, down from 68.2 mg/L on admission)
  Erythrocyte sedimentation rate: 48 mm/h (down from 76 mm/h)
  Rheumatoid Factor: 84 IU/mL (positive)
  Anti-Cyclic Citrullinated Peptide (anti-CCP): > 250 U/mL (strongly positive)
  Antinuclear Antibody (ANA): 1:80, speckled pattern
Synovial Fluid Analysis (Right Knee):
  Total Nucleated Cells: 18,400 /uL (78% neutrophils, 18% lymphocytes, 4% monocytes)
  Erythrocyte Count: 1,200 /uL
  Crystals: Negative for monosodium urate and calcium pyrophosphate crystals
  Gram Stain: No organisms seen
  Bacterial Culture: No growth at 48 hours
Venous Duplex Ultrasound (Bilateral Lower Extremities):
  Common femoral, femoral, and popliteal veins fully compressible bilaterally with normal respiratory phasicity and augmentation. No evidence of deep vein thrombosis.

ASSESSMENT:
1. Seropositive rheumatoid arthritis flare: Polyarticular inflammatory synovitis involving bilateral wrists, MCP joints, and right knee, demonstrating rapid therapeutic response to oral corticosteroid induction and joint arthrocentesis. Synovial analysis confirms inflammatory etiology without infection or microcrystalline disease.
2. Diabetic peripheral neuropathy: Painful distal symmetric polyneuropathy with marked stocking allodynia, currently poorly controlled on current dose of gabapentinoid therapy.
3. Type 2 diabetes mellitus: Steroid-associated glycemic excursions superimposed on baseline non-insulin dependent diabetes.
4. History of right Bell palsy: Resolved, completely quiescent with normal facial nerve function.
5. Mild calf asymmetry: Negative venous duplex ultrasonography and Wells score of 0, excluding deep vein thrombosis.

PLAN AND RECOMMENDATIONS:
1. Rheumatoid Arthritis Management and Corticosteroid Taper:
   - Initiate oral prednisone 40/30/20/10 mg daily taper: administer prednisone 40 mg PO daily for 7 days, then reduce to 30 mg PO daily for 7 days, then 20 mg PO daily for 7 days, then 10 mg PO daily for 7 days, followed by 5 mg PO daily maintenance until formal outpatient rheumatology re-evaluation.
   - Continue oral hydroxychloroquine sulfate 200 mg PO BID.
   - Maintain temporary hold on certolizumab pegol until completion of prednisone taper and clinical resolution of acute flare; plan for resumption of certolizumab pegol 200 mg subcutaneously every 2/3 weeks under outpatient rheumatology supervision.
   - Continue pantoprazole sodium 40 mg PO daily before breakfast for gastrointestinal mucosal cytoprotection while receiving systemic glucocorticoids.
   - Calcium carbonate 500 mg / vitamin D3 400 IU PO BID for bone health maintenance during corticosteroid therapy.
2. Neuropathic Pain Optimization:
   - Titrate Lyrica (pregabalin): Increase Lyrica from 75 mg PO BID to 150 mg PO BID (administer 75 mg in morning and 150 mg nightly for 3 days, then advance to 150 mg PO BID as tolerated) to achieve nocturnal relief of dysesthesias.
   - Continue Allegra 180 mg PO daily as needed for allergic rhinitis symptoms; no pharmacokinetic interactions with current neuropathic regimen.
   - Formal outpatient consultation referral submitted to Pain Clinic for comprehensive multidisciplinary evaluation, including consideration of topical compounding and non-pharmacologic modalities.
3. Glycemic Control and Metabolic Monitoring:
   - Continue inpatient subcutaneous basal-bolus insulin regimen to treat steroid-induced postprandial glycemic excursions, targeting blood glucose between 110 and 180 mg/dL.
   - Place outpatient referral to Diabetes Center for comprehensive diabetes self-management education, continuous glucose monitoring placement, and oral antihyperglycemic readjustment as oral prednisone is tapered.
   - Repeat basic metabolic panel and fasting blood glucose in 5 to 7 days.
4. Venous Thromboembolism Prophylaxis:
   - Continue enoxaparin sodium 40 mg subcutaneous once daily while inpatient; discontinue at discharge given active ambulation and Wells score of 0.
5. Discharge Coordination and Post-Acute Care:
   - Outpatient follow-up with Rheumatology in 3 weeks.
   - Follow-up with Diabetes Center within 2 weeks.
   - Consultation visit at Pain Clinic within 4 weeks.
   - If cutaneous breakdown occurs over dependent pressure areas, referral to Wound Care will be expedited.
   - All diagnostic reports and historical records forwarded from Outside Hospital have been reviewed and archived in the permanent electronic record.

Care Team Signoff:
Consultant: Fellow in Rheumatology and Clinical Immunology
Supervising Attending: Attending Physician, Division of Rheumatology and Internal Medicine

=== END REJECTED TEXT ===

Rules broken by that version:

- length: The document must be between 150 and 1,500 words. Offending text or numbers in your version: your text has 1972 words. The hard limits are 150 and 1,500 and this slot targets about 1150.

- meta-talk: The text talks about being synthetic, a test, or de-identification. Remove that. Offending text or numbers in your version: De-identified

SLOT s-022
Kind: Progress note or history and physical (H&P) note. An outpatient visit note, an inpatient SOAP progress note, or a full H&P. Headers, a signature block and an author line.
Length: about 900 words (acceptable range 720 to 1080)
Layout: flowing lines with no hard wrapping
Typos: no deliberate typos needed
Identifiers: yes
People: patient naming tradition: Portuguese or Brazilian. Clinician and staff naming tradition: South Asian: Punjabi or Hindi. Relative or caregiver naming tradition: Polish or Czech with diacritics. Invent fresh names, with the patient's surname starting with the letter T unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [i_vehicle] Give a vehicle identifier such as a license plate or VIN (an accident history, a transport note, a towing mention).
- [u_url] Give a URL on one of the example domains (a patient portal link, a results page).
- [i_rx] Give a prescription (Rx) number.
- [n_title] Put a title in front of at least two names (Dr., Mrs., Mr., Ms., Prof., Rev.). The title is not part of the name.
- [n_relative] Name at least one relative or caregiver of the patient (spouse, parent, adult child, sibling) and say how they are related.
- [n_nonanglo_part] Include a person whose surname has a particle or several parts (de la Cruz, van der Merwe, bin Hamad, al-Rashid, O'Connor-Silva, Garcia Lopez) or whose name carries accents, hyphens or apostrophes.
- [f_clinical] Name one facility whose name is made of clinical words or a specialty (like "Valley Hospital", "Pain Clinic" used as the name of one specific practice, "Heart and Vascular Center of Pine Ridge").
- [d_abbr_dot] Write a date with an abbreviated month and a period ("Mar. 4, 2026", "Sept. 12").
- [d_monthyear] Write a date as month and year only ("March 2026").
- [d_range] Write a date range ("03/01/2026 to 03/05/2026" or "March 1 through March 5").
- [i_mrn_labeled] Give a medical record number with a label (MRN:, Record #, Chart no.).
- [i_dashes] Give an ID with dashes between groups (4821-9932-07).
- [i_license] Give a license number (driver license, professional license, NPI or DEA number).
- [p_ext] Give a phone number with an extension ("x214" or "ext. 3307").
- [e_plain] Give an email address.
- [ad_unit] Give an address with an apartment, suite or unit number.
- [a_under] Give at least one age under 90 (patient or relative) in any common form. Ages under 90 are not identifiers.
- [k_proc] Mention procedure names and diagnoses by their ordinary clinical names.
- [n_collision] Use these ordinary or clinical words as people's names, each as a person (patient, relative, clinician or staff): Little as a staff member; Major as a clinician. Write them as plain names and never as a different word.

REJECTED VERSION OF s-022:
=== BEGIN REJECTED TEXT ===
TRAUMA AND ORTHOPEDIC SPECIALTY HOSPITAL
OUTPATIENT SURGICAL FOLLOW-UP PROGRESS NOTE
Date of Evaluation: Nov. 2, 2026

PATIENT DEMOGRAPHIC AND CLINICAL RECORD:
Patient Name: Mr. Thiago da Silva Tavares
Medical Record Number: MRN: 8830194
Universal Encounter Tracking ID: 9481-2204-71
Date of Birth: 06/18/1983 (Age: 43-year-old male)
Home Address: 842 Blossom Hill Road, Suite 210, San Jose, CA 95123
Contact Email: thiago.tavares@example.net
Attending Surgical Practice Telephone: (408) 555-0177 ext. 234

CLINICAL CARE TEAM:
Attending Orthopedic Surgeon: Dr. Major Singh, MD (NPI: 1982730194)
Orthopedic Clinical Assistant: Little Sharma, MA
Accompanied By: Wife, Mrs. Agnieszka Dąbrowska (Age: 41-year-old)

CHIEF COMPLAINT:
Initial post-discharge surgical follow-up evaluation for open reduction and internal fixation (ORIF) of the right distal radius fracture, splint removal, wound inspection, and cast application.

HISTORY OF PRESENT ILLNESS:
Mr. Thiago da Silva Tavares is a 43-year-old right-hand-dominant male software engineer who presents for his first scheduled post-operative visit following orthopedic trauma surgery. The patient was involved in a motor vehicle collision on 10/28/2026 when his sedan was struck on the passenger side by another vehicle. Emergency transport documentation notes that the vehicle, bearing VIN: 1HGCR2F83HA029184, sustained significant front-end damage with airbag deployment. The patient was transported directly to Trauma and Orthopedic Specialty Hospital, where physical examination and emergency radiographic imaging confirmed an acute, displaced, intra-articular fracture of the right distal radius with dorsal comminution and associated ulnar styloid fracture.

Following emergent closed reduction and sugar-tong splint immobilization in the emergency department, the patient was admitted to the inpatient orthopedic surgery service from 10/28/2026 to 11/02/2026. On 10/29/2026, he underwent definitive operative management comprising open reduction and internal fixation utilizing a volar locking plate system with intraoperative fluoroscopic guidance. The surgical procedure was uncomplicated, achieving anatomic restoration of the radial articular surface, radial inclination, and volar tilt. He was discharged home on Nov. 2, 2026, in stable condition with a sterile surgical dressing and plaster volar-dorsal immobilization splint.

Today, Mr. Thiago da Silva Tavares is accompanied by his wife, Mrs. Agnieszka Dąbrowska, who assists with his daily activities and medication administration. The patient reports that his postoperative pain has been manageable and steadily improving. He has been taking oral acetaminophen and ibuprofen as prescribed, having required only two doses of oxycodone over the last 48 hours. He notes mild swelling and tightness over the dorsum of the right fingers, which improves when the extremity is elevated above the level of his heart. He denies fever, chills, numbness, tingling in the median nerve distribution, or progressive throbbing pain. His postoperative digital radiographs and operative summary were retrieved and reviewed through the regional PACS imaging portal at https://imaging.example.com/reports/ortho-trauma.

PAST MEDICAL AND SURGICAL HISTORY:
1. Right distal radius intra-articular fracture, status post ORIF on 10/29/2026.
2. Mild hypercholesterolemia, diagnosed in September 2025.
3. Left knee arthroscopic partial meniscectomy in 2016.
4. No prior wrist fractures, carpal tunnel syndrome, or inflammatory arthropathy.

CURRENT MEDICATIONS:
1. Oxycodone hydrochloride 5 mg PO q4-6h PRN severe pain (Rx # 8492013).
2. Acetaminophen 650 mg PO q6h PRN mild-to-moderate pain.
3. Ibuprofen 600 mg PO TID with meals.
4. Enoxaparin sodium 40 mg subcutaneous daily for venous thromboembolism prophylaxis (completed 5-day post-injury course).
5. Atorvastatin calcium 10 mg PO daily at bedtime.

ALLERGIES:
No known drug allergies.

PHYSICAL EXAMINATION:
Vital Signs (measured by Little Sharma, MA):
Blood Pressure: 122/78 mmHg
Pulse: 68 beats per minute, regular
Respiratory Rate: 14 breaths per minute
Temperature: 98.2 F (36.8 C), oral
Oxygen Saturation: 99% on ambient room air
Weight: 78.4 kg (172.8 lbs)

General: The patient is a healthy-appearing 43-year-old male, alert, oriented x4, comfortable, in no acute distress.
Right Upper Extremity Examination:
The postoperative plaster splint and bulky gauze dressing were removed under clean technique. Inspection reveals a 7 cm longitudinal volar incision over the distal forearm and wrist, well-approximated with intact non-absorbable monofilament sutures. There is mild surrounding ecchymosis and expected postoperative edema, but no erythema, purulent drainage, hematoma, or skin necrosis. Mild tenderness is elicited along the surgical site, without fluctuance.
Compartments of the forearm and hand are soft and completely compressible.
Neurovascular Examination: Radial and ulnar pulses are 2+ palpable at the wrist. Capillary refill is brisk at less than 2 seconds across all five digits. Sensation to light touch and two-point discrimination is completely intact across the thumb, index, long, and radial ring fingers (median nerve distribution), small finger (ulnar nerve distribution), and dorsal first webspace (superficial radial nerve distribution). No signs of acute carpal tunnel syndrome. Active range of motion of the thumb interphalangeal joint and all finger MCP, PIP, and DIP joints is full and symmetric without significant discomfort.

DIAGNOSTIC IMAGING REVIEW:
Three-View Radiographs of the Right Wrist (clinic today, Nov. 2, 2026):
Orthopedic radiographs demonstrate stable anatomical alignment of the right distal radius fracture. The volar locking plate and screws remain well-seated without loosening, hardware failure, or articular penetration. Radial length, radial inclination (22 degrees), and volar tilt (10 degrees) are anatomically restored. The ulnar styloid base fracture is stable and non-displaced. No periosteal reaction or heterotopic ossification observed.

ASSESSMENT AND CLINICAL IMPRESSION:
1. Status post open reduction and internal fixation of acute right distal radius intra-articular fracture: Healing appropriately on postoperative day 4. Clean surgical incision without wound infection, dehiscence, or median nerve neurapraxia.
2. Post-traumatic pain and soft tissue edema: Improving, well-controlled on multimodal non-opioid analgesia.

PLAN AND RECOMMENDATIONS:
1. Wound Management and Immobilization: The incision was cleansed with sterile saline and dressed with sterile Telfa pads. A short arm fiberglass cast was applied in neutral wrist alignment by orthopedic staff under my direct supervision. Cast care instructions were provided, emphasizing the need to keep the cast dry and clean.
2. Analgesia and Medications: Discontinue scheduled opioids; continue acetaminophen 650 mg PO q6h PRN and ibuprofen 600 mg PO TID with meals. Continue atorvastatin 10 mg PO daily.
3. Activity and Rehabilitation: Maintain right arm elevation when resting. Gentle active finger and thumb range-of-motion exercises encouraged. Strict non-weight-bearing restriction on the right upper extremity (no lifting greater than 1 pound).
4. Follow-Up: The patient will return to Trauma and Orthopedic Specialty Hospital in ten days for cast bivalving, suture removal, and transition to a removable thermoplastic wrist orthosis with formal occupational hand therapy initiation. Patient and Mrs. Agnieszka Dąbrowska were instructed to call the office immediately or seek urgent evaluation if finger numbness, blue discoloration, intractable pain, or cast tightness develops.

Attending Physician Signoff:
Electronically signed by:
Dr. Major Singh, MD
Trauma and Reconstructive Orthopedic Surgery
NPI: 1982730194
major.singh@example.org
Trauma and Orthopedic Specialty Hospital

=== END REJECTED TEXT ===

Rules broken by that version:

- phone-range: A phone or fax number is outside the allowed range. The last seven digits must be 555-0100 to 555-0199 (international forms: +1 with such a number, +44 20 7946 0xxx, +44 7700 900xxx or +61 491 570 xxx). If the number is really a record number that only looks like a phone number, change its format, for example by adding a letter prefix. Offending text or numbers in your version: 1982730194 | 1982730194

SLOT s-026
Kind: Progress note or history and physical (H&P) note. An outpatient visit note, an inpatient SOAP progress note, or a full H&P. Headers, a signature block and an author line.
Length: about 1200 words (acceptable range 960 to 1440)
Layout: hard-wrap the lines at about 72 characters, as in a text export or fax
Typos: no deliberate typos needed
Identifiers: yes
People: patient naming tradition: Samoan, Tongan or Native Hawaiian. Clinician and staff naming tradition: Anglo-American (English, Scottish or German-American descent). Relative or caregiver naming tradition: Japanese. Invent fresh names, with the patient's surname starting with the letter L unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_split] Let at least one person's full name break across a line, with the first name ending one line and the surname starting the next (in a hard-wrapped passage or a header).
- [ad_caps] Give a street address in ALL CAPS (label or fax header style).
- [i_device] Give a device identifier such as the serial number of an implanted or home device (pacemaker, insulin pump, CPAP).
- [n_initials] Refer to at least one person by initials with periods, such as "T.G." or "M.R.K.".
- [n_title] Put a title in front of at least two names (Dr., Mrs., Mr., Ms., Prof., Rev.). The title is not part of the name.
- [n_list] Include a list that holds several names together (care team, attendees, cc line, covering physicians, family members present).
- [n_nonanglo_part] Include a person whose surname has a particle or several parts (de la Cruz, van der Merwe, bin Hamad, al-Rashid, O'Connor-Silva, Garcia Lopez) or whose name carries accents, hyphens or apostrophes.
- [f_proper] Name one facility with an invented proper name (like "St. Brendan Medical Center" or "Calloway Regional Hospital").
- [f_clinical] Name one facility whose name is made of clinical words or a specialty (like "Valley Hospital", "Pain Clinic" used as the name of one specific practice, "Heart and Vascular Center of Pine Ridge").
- [d_monthname] Write a date with the full month name ("March 4, 2026").
- [d_ordinal] Write a date with an ordinal ("March 4th", "the 4th of March").
- [d_dob] Give a date of birth, either labeled ("DOB:") or in prose ("born on ...").
- [d_twodigit] Write a numeric date with a two-digit year (3/4/26).
- [a_over_yo] Give an age of 90 or over as "92 y.o." or "91 yo".
- [i_unlabeled] Give a record number with no label at all, for example as the first token in a header line.
- [i_plan] Give a health plan member number or group number.
- [i_ssn] Give one social security number written with an invalid area (starting 000, 666 or 9).
- [p_plain] Give a phone number in common US format with an area code.
- [p_fax] Give a fax number, labeled Fax.
- [e_obf] Give an email address written to avoid detection ("name at example dot com" or "name (at) example.org").
- [ad_pobox] Give a PO box address with city, state and ZIP.
- [ad_zip] Give a ZIP code on its own (a pharmacy or clinic location, a service area).
- [k_labs] Include lab values and vital signs with units.
- [n_collision] Use these ordinary or clinical words as people's names, each as a person (patient, relative, clinician or staff): Grace as a relative. Write them as plain names and never as a different word.

REJECTED VERSION OF s-026:
=== BEGIN REJECTED TEXT ===
77104928
BANNISTER MEMORIAL HOSPITAL
INPATIENT CARDIOLOGY CONSULTATION SERVICE
CLINICAL FACILITY ADDRESS:
824 WAIALAE AVENUE, HONOLULU, HI 96816
MAILING AND BILLING OFFICE:
PO Box 3914, Honolulu, HI 96815
TELEPHONE: (808) 555-0163
CONSULTATION FAX: (808) 555-0197
EMAIL INQUIRIES: campbell.team at example dot org

PATIENT IDENTIFICATION AND DEMOGRAPHICS:
Patient Name: Kelemete Luafutu
Date of Birth: 05/22/1934
Current Age: 92 y.o.
Biological Sex: Male
Social Security Number: 000-48-9124
Insurance Plan Member ID: HPN-70491823-01
Date of Consultation: October 14, 2026
Date of Inpatient Admission: October 12th
Date of Service Recorded: 10/14/26

CARE TEAM AND ENCOUNTER ATTENDEES:
- Harrison Campbell, MD (Attending Cardiologist)
- Megan Crawford, MD (Cardiology Clinical Fellow)
- Elena de la Cruz, MD (Cardiac Electrophysiology Consultant)
- Brenda Miller, RN (Inpatient Telemetry Unit Coordinator)
- R.J.C., RN (Primary Bedside Telemetry Nurse)
- Grace Takahashi (Daughter-in-law and Designated Healthcare Proxy)

CONSULTATION REASON:
Inpatient cardiology consultation requested for optimization of medical
therapy and pacemaker evaluation in a 92 y.o. male admitted with acute
on chronic decompensated heart failure with preserved ejection
fraction (HFpEF) and volume overload.

HISTORY OF PRESENT ILLNESS:
Mr. Kelemete Luafutu is a 92 y.o. gentleman with a past medical history
significant for heart failure with preserved ejection fraction (NYHA
Class II at baseline), persistent atrial fibrillation on apixaban,
dual-chamber permanent pacemaker placement three years prior for sick
sinus syndrome, stage 3b chronic kidney disease, and hypertension. He
was admitted through the emergency department on October 12th after
experiencing four days of worsening exertional dyspnea, orthopnea
requiring elevation with three pillows, and bilateral lower extremity
pitting edema progressing up to the mid-calf level.

Today, on hospital day three (10/14/26), the cardiology consultation
team was asked to evaluate his volume status, transition his intravenous
loop diuretic therapy to an optimized oral maintenance regimen, and
review his implanted permanent pacemaker function. The clinical fellow,
Dr. Megan Crawford, and the attending physician, Dr. Harrison
Campbell, conducted a comprehensive bedside evaluation. We also
discussed the inpatient progress and transition plan with Grace
Takahashi, the patient's 54-year-old daughter-in-law and proxy, who was
present at the bedside throughout the morning examination.

Mr. Luafutu states that his breathing has improved substantially
following forty-eight hours of scheduled intravenous furosemide
diuresis. His dyspnea at rest has completely resolved. He is now
able to lie flat with only a single pillow without developing cough
or air hunger. He denies chest tightness, pressure,
radiating discomfort, or palpitations. He denies lightheadedness,
near-syncope, diaphoresis, nausea, or fever. He notes that the heaviness
in both legs has decreased noticeably. Over the past 48 hours, his
cumulative net fluid balance is negative 2,850 milliliters, with a
corresponding weight loss of 2.9 kilograms since hospital admission.

IMPLANTED CARDIAC DEVICE ASSESSMENT:
Interrogation performed at bedside by Dr. Elena de la Cruz on
October 14, 2026.
Device Type: Dual-chamber permanent pacemaker
Manufacturer and Model: Medtronic Azure XT DR, Model W1SR01
Device Serial Number: PXR492018H
Atrial Lead: Model 5076-52, Serial Number: LAL901248
Ventricular Lead: Model 5076-58, Serial Number: LVR441029
Device Parameters and Findings:
Programmed mode: DDDR, lower rate limit 60 bpm, upper sensor rate
120 bpm. Battery voltage is 3.08 Volts with estimated longevity of
7.4 years remaining. Atrial sensing amplitude 2.8 mV, pacing threshold
0.75 V at 0.4 ms, pacing impedance 520 ohms. Ventricular sensing
amplitude 11.2 mV, pacing threshold 0.8 V at 0.4 ms, pacing impedance
560 ohms. Pacing percentages: Atrial pacing 62%, ventricular pacing
8%. Device memory demonstrated no sustained ventricular arrhythmias,
no pacemaker-mediated tachycardia, and no lead integrity alerts.

PAST MEDICAL HISTORY:
1. Heart failure with preserved ejection fraction (left ventricular
   ejection fraction 55% to 60% on prior echocardiogram).
2. Persistent atrial fibrillation, rate-controlled, CHA2DS2-VASc
   score of 4 (age, hypertension, heart failure).
3. Sick sinus syndrome with symptomatic bradycardia status post
   dual-chamber permanent pacemaker.
4. Chronic kidney disease stage 3b (baseline creatinine 1.3 to
   1.5 mg/dL).
5. Essential hypertension, longstanding.
6. Dyslipidemia.
7. Bilateral primary knee osteoarthritis.

PAST SURGICAL HISTORY:
1. Permanent pacemaker implantation, right prepectoral pocket.
2. Left eye cataract extraction with intraocular lens implant.
3. Remote open appendectomy in young adulthood, uncomplicated.

CURRENT INPATIENT MEDICATIONS:
1. Intravenous furosemide 40 mg IV twice daily (last dose given 06:00)
2. Sacubitril/valsartan (Entresto) 24/26 mg oral tablet twice daily
3. Carvedilol 6.25 mg oral tablet twice daily with meals
4. Apixaban 2.5 mg oral tablet twice daily (renal dose adjusted)
5. Atorvastatin 20 mg oral tablet once daily at bedtime
6. Potassium chloride 20 mEq oral tablet once daily (holding if K > 4.5)

ALLERGIES:
Lisinopril (developed intractable dry cough; no angioedema).

SOCIAL HISTORY:
Mr. Luafutu is a retired harbor logistics supervisor. He lives in a
multi-generational home with his son and his daughter-in-law, Grace.
He has never used tobacco, cigarettes, or recreational substances.
He reports no alcohol intake. His family provides daily support with
meal preparation, household maintenance, and transportation to clinical
appointments. Prior to this hospitalization, he walked indoors with a
walker and remained largely independent with basic personal hygiene.

REVIEW OF SYSTEMS:
Constitutional: Denies chills, fever, night sweats, or recent anorexia.
Eyes: Denies acute visual disturbances, photophobia, or eye pain.
ENT: Denies sore throat, rhinorrhea, nasal congestion, or hearing loss.
Cardiovascular: Significant improvement in orthopnea; denies chest
pressure, angina, palpitations, or lightheadedness.
Respiratory: Denies cough, hemoptysis, wheezing, or resting dyspnea.
Gastrointestinal: Appetite improving. Denies nausea, abdominal pain,
bloating, vomiting, constipation, or diarrhea.
Genitourinary: Diuresing briskly via bedpan and urinal. Denies dysuria
or gross hematuria.
Musculoskeletal: Chronic bilateral knee stiffness; denies acute joint
swelling or warmth.
Neurologic: Denies focal weakness, numbness, syncope, or headache.
Psychiatric: Calm, cooperative, pleasant, denies sleep difficulties.

PHYSICAL EXAMINATION:
Vital Signs Recorded at 09:30 on 10/14/26:
Temperature: 98.4 deg F (36.9 deg C), oral
Blood Pressure: 124/76 mmHg, right arm, seated
Heart Rate: 68 beats per minute, regular
Respiratory Rate: 17 breaths per minute, unlabored
Pulse Oximetry: 97% on ambient room air
Current Inpatient Weight: 84.1 kg (admission weight 87.0 kg)

General: Awake, alert, pleasant, well-nourished 92 y.o. male lying in
hospital bed in no acute cardiopulmonary distress.
Head and Neck: Normocephalic. Moist oral mucosa. Trachea midline.
Jugular venous pressure estimated at 6 cm of water at 45 degrees
(significantly improved from 11 cm on admission). Carotid upstrokes
are brisk and symmetric without audible bruits.
Cardiovascular: Pacemaker pocket in right prepectoral region is clean,
intact, non-tender, without erythema, fluctuance, or erosion. Normal
S1 and S2 heart sounds. Grade 2/6 soft systolic ejection murmur at
the apex without radiation to axilla. No S3 gallop, S4, or friction rub.
Radial and dorsalis pedis pulses palpable 2+ bilaterally.
Pulmonary: Good chest excursion. Clear to auscultation bilaterally
throughout upper and middle lung zones; faint bibasilar crackles at
extreme lung bases, markedly improved compared to admission. No
expiratory wheezing or rhonchi.
Abdomen: Soft, non-tender, non-distended. Bowel sounds normoactive.
No hepatojugular reflux elicited today. No hepatomegaly or ascites.
Extremities: Trace pitting edema over bilateral medial malleoli (reduced
from 2+ pretibial edema on admission). No erythema, warmth, or calf
tenderness. Wells score for lower extremity DVT is 0 points.
Neurological: Alert and fully oriented x4. Converses appropriately.
Cranial nerves II-XII grossly intact. Motor power 5/5 in upper
extremities, 4+/5 in lower extremities bilaterally. Normal sensation
to light touch.

DIAGNOSTIC AND LABORATORY DATA:
Morning Labs (October 14, 2026):
Sodium: 138 mEq/L (reference 135-145)
Potassium: 4.2 mEq/L (reference 3.5-5.0)
Chloride: 102 mEq/L (reference 98-107)
Bicarbonate: 25 mEq/L (reference 22-29)
Blood Urea Nitrogen (BUN): 24 mg/dL (reference 7-20)
Serum Creatinine: 1.34 mg/dL (baseline 1.30-1.50; admission was 1.58)
Estimated GFR: 52 mL/min/1.73m2 (reference > 60)
Serum Glucose: 114 mg/dL (reference 70-99)
Total Serum Calcium: 9.2 mg/dL (reference 8.6-10.2)
B-type Natriuretic Peptide (BNP): 195 pg/mL (admission value 680 pg/mL)
Hemoglobin: 12.2 g/dL | Hematocrit: 36.8% | Platelets: 204 K/uL
White Blood Cell Count: 6.6 K/uL
Electrocardiogram (10/14/26): Atrial paced rhythm at 68 bpm, normal PR
interval, narrow QRS complex (92 ms), non-specific ST-T changes, no
acute ischemic ST segment elevation or depression.

ASSESSMENT AND CLINICAL IMPRESSIONS:
Mr. Kelemete Luafutu is a 92 y.o. male with chronic HFpEF, persistent
atrial fibrillation on oral anticoagulation, sick sinus syndrome with
dual-chamber pacemaker, and chronic kidney disease stage 3b, who has
shown substantial clinical improvement following aggressive intravenous
diuresis for acute decompensated heart failure. He is now clinically
euvolemic with normalized JVP, minimal trace ankle edema, stable renal
function, and a falling BNP.

DETAILED MANAGEMENT PLAN:
1. Heart Failure with Preserved Ejection Fraction (HFpEF):
The patient has achieved effective decongestion with a cumulative net
negative fluid balance of 2,850 mL. Given stable
creatinine of 1.34 mg/dL and resolution of orthopnea, we will
discontinue IV furosemide today.
Transition patient to oral furosemide 40 mg PO every morning.
Continue sacubitril/valsartan 24/26 mg PO twice daily. Maintain daily
morning weights and record strict intake and output. Fluid restriction
of 2 liters daily and a 2-gram sodium diet maintained during stay.

2. Arrhythmia and Cardiac Device:
Rate control is excellent on carvedilol 6.25 mg PO twice daily, with
telemetry demonstrating underlying atrial fibrillation with
predominantly atrial-paced ventricular response ranging between
62 and 76 bpm.
Interrogation of Medtronic Azure pacemaker (SN: PXR492018H) confirms
normal lead parameters and sensing. Pacing thresholds are stable.
No reprogramming required. Continue carvedilol 6.25 mg PO twice daily.
Stroke prevention: Continue apixaban 2.5 mg PO twice daily for atrial
fibrillation with CHA2DS2-VASc score of 4.

3. Chronic Kidney Disease Stage 3b:
Renal profile has remained remarkably stable during diuresis, with
serum creatinine improving from 1.58 mg/dL at presentation to 1.34 mg/dL
today. Serum potassium is optimal at 4.2 mEq/L. Hold supplemental
potassium chloride unless serum level drops below 4.0 mEq/L. Re-check
basic metabolic panel tomorrow morning.

4. Post-Discharge Rehabilitation and Care Coordination:
Patient is nearing readiness for discharge, anticipated within 24 to 48
hours pending successful transition to oral diuretics. Upon discharge,
Mr. Luafutu is referred to the Cardiopulmonary Rehabilitation Center
for outpatient monitored exercise and heart failure education.
Outpatient prescription refills and delivery will be coordinated
through the regional pharmacy depot servicing ZIP 96822 to ensure
medications are in the home before discharge.

All elements of this plan were reviewed in detail with the patient
and his daughter-in-law, Grace Takahashi, who verbalized good
comprehension and expressed agreement with the goals of care.

CLINICIAN SIGNATURE BLOCK:
Megan Crawford, MD
Cardiology Fellow, PGY-5
Bannister Memorial Hospital

ATTENDING ATTESTATION:
I have personally examined Mr. Kelemete Luafutu on October 14, 2026,
reviewed his diagnostic labs, device interrogation, and clinical data,
and discussed the assessment and management plan with Dr. Crawford
and the patient's family. I agree with the findings and plan recorded
in this consultation note.

Harrison Campbell, MD, FACC
Attending Cardiologist, Division of Cardiology
Bannister Memorial Hospital
Contact: campbell.team at example dot org
Date/Time Authenticated: 10/14/26 13:40 HST

=== END REJECTED TEXT ===

Rules broken by that version:

- length: The document must be between 150 and 1,500 words. Offending text or numbers in your version: your text has 1756 words. The hard limits are 150 and 1,500 and this slot targets about 1200.

OUTPUT FORMAT. For each slot, in order, output exactly this and nothing between the blocks except blank lines. Replace SLOT-ID with the slot id exactly as given above (for example s-085):

<<<DOC SLOT-ID>>>
(the full text of the document, exactly as it would appear in a text file)
<<<END>>>
<<<NOTES SLOT-ID>>>
{"identifiers": [{"text": "exact string as it appears in the document", "type": "NAME", "tags": ["n_lastfirst"]}], "tricky_keeps": ["exact strings of clinical content that could be mistaken for an identifier"], "no_identifier": false}
<<<END>>>

Rules for the NOTES block:
- It is valid JSON on one or more lines.
- "identifiers" lists every identifier mention, once per distinct string. "text" is copied exactly from the document. "type" is one of: NAME, RELATIVE, CLINICIAN, FACILITY, DATE, DOB, AGE, PHONE, FAX, EMAIL, ADDRESS, ID, URL, IP, DEVICE, VEHICLE. Use RELATIVE for named relatives and CLINICIAN for named clinicians and staff.
- Also list ages under 90 (type AGE) and bare years (type DATE), and put the tag "not_identifier" on them. Put the tag "over89" on ages of 90 or over.
- "tags" holds the ids of the required items that the string satisfies (for example n_lastfirst, d_iso, p_ext), when it satisfies one. Add other short tags if useful (for example non_anglo, collision).
- "tricky_keeps" lists clinical strings that must survive de-identification and could be mistaken for identifiers (eponyms, brand names that look like names, service names, tapers and fractions, doses).
- "no_identifier" is true only for a slot that must contain no identifier, and then "identifiers" holds only items tagged not_identifier.
The DOC block holds only the document text. Do not add a title line, commentary or code fences around it.
