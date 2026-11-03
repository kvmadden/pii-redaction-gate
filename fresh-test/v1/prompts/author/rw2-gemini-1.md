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

BATCH: 3 slot(s). Write one document per slot.

SLOT s-014
Kind: Progress note or history and physical (H&P) note. An outpatient visit note, an inpatient SOAP progress note, or a full H&P. Headers, a signature block and an author line.
Length: about 837 words (acceptable range 669 to 1004)
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

Referring Practice:
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
Gregory M. Fairchild is a 67-year-old male with a significant history
of ischemic cardiomyopathy with reduced ejection fraction (LVEF 30%
established in August 2024), coronary artery disease status post
percutaneous coronary intervention to the LAD in 2021, type 2 diabetes
mellitus, and stage 3a chronic kidney disease, who presents for an
urgent outpatient post-hospitalization evaluation. He was admitted
to Dunwoody Memorial Hospital from October 10 through October 14, 2026,
for volume overload characterized by progressive dyspnea, orthopnea,
and bilateral lower extremity edema. He was discharged on 10-14-2026
after intravenous diuresis with furosemide, which achieved a net
negative fluid balance of 4.2 liters and improved his weight from
88.4 kg down to 84.2 kg at discharge.

The patient was accompanied to today's appointment by his wife, Eleanor
Fairchild, who assisted with the interval history. Mr. Fairchild reports
that since returning home on Oct 15 2026, he has felt moderately
improved compared to his status prior to admission, though he continues
to have mild exertional dyspnea when walking up more than one flight of
stairs. He denies acute chest tightness, chest pressure, resting
orthopnea, or paroxysmal nocturnal dyspnea over the last 48 hours. He
notes intermittent palpatations lasting only a few seconds when bending
over, without lightheadedness or syncope. Mrs. Fairchild maintains a
daily log of morning weights and blood pressures. His weight this
morning was 84.5 kg, stable relative to discharge. He has adhered to a
2000 mg sodium restriction and 1.5-liter fluid limit. He completed lab
draws yesterday at Pine Creek Family Medicine, located at 1408 Oak
Ridge Lane, Round Rock, TX 78681, as instructed upon release.

PAST MEDICAL HISTORY:
1. Ischemic cardiomyopathy (LVEF 30% on echocardiogram in August 2024).
2. Coronary artery disease with bare-metal stent to proximal LAD (2021).
3. Primary hypertension, diagnosed 12 years ago.
4. Type 2 diabetes mellitus without retinopathy, non-insulin dependent.
5. Chronic kidney disease stage 3a, baseline creatinine 1.1 to 1.3 mg/dL.
6. Hyperlipidemia, mixed etiology.
7. Obstructive sleep apnea, noncompliant with CPAP therapy.

PAST SURGICAL HISTORY:
1. Percutaneous coronary intervention with drug-eluting stent (2021).
2. Right inguinal hernia repair (open mesh, 2015).
3. Remote appendectomy in childhood.

CURRENT MEDICATIONS:
1. Sacubitril / valsartan (Entresto) 49/51 mg PO BID.
2. Carvedilol 12.5 mg PO BID with meals.
3. Spironolactone 25 mg PO daily.
4. Furosemide 40 mg PO every morning.
5. Empagliflozin (Jardiance) 10 mg PO every morning.
6. Atorvastatin 40 mg PO nightly at bedtime.
7. Aspirin 81 mg PO daily.
8. Metformin hydrochloride 500 mg PO BID (held during admission).
9. Potassium chloride 20 mEq PO daily.

ALLERGIES:
Lisinopril (angioedema, lips and tongue swelling in 2018).
No known drug allergies to iodinated contrast or shellfish.

FAMILY HISTORY:
Father died of myocardial infarction at age 62.
Mother had hypertension and stroke at age 81.
One younger brother, age 63, living with coronary disease and stent.
No family history of early cardiomyopathy or sudden cardiac death.

SOCIAL HISTORY:
Mr. Fairchild lives with his wife Eleanor in a single-story home. He is
a retired civil engineer. Former tobacco use: 25 pack-years, quit 15
years ago. Denies current or past illicit substance use. Alcohol intake
is minimal, limited to one glass of wine monthly. Independent in ADLs.

REVIEW OF SYSTEMS:
Constitutional: No fever, chills, diaphoresis, or recent weight gain.
Cardiovascular: Mild exertional dyspnea, occasional brief palpitations.
Denies chest pain, angina, orthopnea, or presyncope.
Respiratory: Denies cough, hemoptysis, or audible wheezing.
Gastrointestinal: Denies nausea, vomiting, abdominal pain, early satiety.
Genitourinary: Denies dysuria or hematuria; mild nocturia twice nightly.
Musculoskeletal: No acute joint pain. Ambulatroy without assistive device.
Neurological: No focal weakness, sensory loss, gait ataxia, or dizziness.
Skin: Warm, dry, no active breakdown or stasis ulcerations.
Psychiatric: Normal mood and affect, denies anxiety or depression.

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

General: 67-year-old male sitting comfortably, well-developed, alert,
oriented x4, in no acute respiratory distress.
HEENT: Normocephalic, atraumatic. Pupils equal, round, and reactive to
light. Sclerae anicteric. Oropharynx clear, moist mucous membranes.
Neck: Supple. Jugular venous pulse estimated at 7 cm H2O at 45 degrees,
down from 11 cm during stay. Carotid pulses 2+ bilaterally without bruits.
No thyromegaly or cervical lymphadenopathy.
Cardiovascular: Regular rate and rhythm. S1 and S2 present. Soft grade
2/6 holosystolic murmur heard best at the cardiac apex, radiating to
axilla, consistent with mitral regurgitation. S3 gallop has resolved;
no friction rub or S4 appreciated.
Lungs: Clear to auscultation bilaterally in anterior and mid fields;
scant bibasilar end-inspiratory crackles, improved from admission.
Abdomen: Soft, non-distended, non-tender. Normal active bowel sounds in
all quadrants. No hepatomegaly; liver span 9 cm. No hepatojugular reflux.
Extremities: Warm extremities with trace (1+) pitting edema at both
ankles; no calf tenderness or erythema. Dorsalis pedis and posterior
tibial pulses 2+ palpable bilaterally. Capillary refill < 2 seconds.
Neurological: Cranial nerves II-XII intact. Motor strength 5/5 in upper
and lower extremities. Sensation intact. Gait steady.

DIAGNOSTIC DATA:
Serum Chemistry and Hematology (drawn Oct 15 2026):
  Sodium: 137 mmol/L (reference 135 - 145)
  Potassium: 4.2 mmol/L (reference 3.5 - 5.0)
  Chloride: 101 mmol/L (reference 98 - 107)
  Bicarbonate: 24 mmol/L (reference 22 - 29)
  Blood Urea Nitrogen (BUN): 22 mg/dL (reference 7 - 20)
  Serum Creatinine: 1.15 mg/dL (reference 0.70 - 1.30)
  Estimated GFR: 64 mL/min/1.73m2 (baseline stable)
  Serum Glucose: 118 mg/dL (reference 70 - 99)
  B-type Natriuretic Peptide (BNP): 340 pg/mL (peak 1,210 during stay)
  Hemoglobin: 13.4 g/dL (reference 13.0 - 17.5)
  White Blood Cell Count: 6.4 x10^3/uL (reference 4.0 - 11.0)
  Platelet Count: 215 x10^3/uL (reference 150 - 450)
  Hemoglobin A1c: 6.8% (reference < 5.7%)

12-Lead Electrocardiogram (clinic today, 10/16/2026):
Normal sinus rhythm at 70 bpm. Normal PR interval 168 ms. QRS duration
106 ms. QTc interval 438 ms. Old anterior infarct pattern with Q waves
in V1-V3, unchanged from discharge tracing on 10-14-2026. No acute ST
elevation, depression, or T-wave inversion.

Transthoracic Echocardiogram (Dunwoody Memorial Hospital summary):
Left ventricular systolic dysfunction with ejection fraction of 30%.
Moderate anterior and apical hypokinesis. Moderate functional mitral
regurgitation. RVSP estimated at 38 mmHg.

ASSESSMENT AND CLINICAL IMPRESSION:
1. Chronic systolic heart failure (HFrEF, NYHA functional class II,
ACC/AHA Stage C) secondary to ischemic cardiomyopathy. Patient shows
favorable clinical response following inpatient diuresis at Dunwoody
Memorial Hospital. Volume status is near euvolemic with JVP 7 cm H2O
and trace peripheal edema. BNP has decreased significantly from peak
levels. Renal function and electrolytes remain stable on guideline-
directed medical therapy (GDMT).
2. Coronary artery disease: Clinically stable, without angina.
3. Hypertension: Controlled on carvedilol and Entresto.
4. Type 2 diabetes mellitus: Stable glycemic control with HbA1c 6.8%.
5. Chronic kidney disease stage 3a: Preserved baseline eGFR.

PLAN AND RECOMMENDATIONS:
1. Heart Failure Medical Management:
   - Continue sacubitril / valsartan (Entresto) 49/51 mg PO BID.
   - Continue carvedilol 12.5 mg PO BID; will consider uptitration to
     25 mg BID at next follow-up visit.
   - Continue spironolactone 25 mg PO daily.
   - Furosemide titration: Continue furosemide 40 mg PO daily in morning
     for 5 more days, then reduce to maintenance dose of 20 mg PO daily
     if home weight remains stable below 85.0 kg.
   - Continue empagliflozin 10 mg PO daily for cardioprotective benefit.
   - Continue potassium chloride 20 mEq PO daily.
2. Fluid and Dietary Counseling:
   - Reinforced strict 2000 mg/day sodium intake and 1.5-liter fluid limit.
   - Instructed patient and wife Eleanor to record morning weights daily.
   - Red-flag parameters: call clinic if weight increases by > 3 lbs in
     24 hours or > 5 lbs in one week.
3. Diabetes and Preventative Care:
   - Resume metformin 500 mg PO BID next week given stable creatinine.
   - Continue atorvastatin 40 mg PO daily and aspirin 81 mg PO daily.
4. Monitoring and Follow-Up:
   - Repeat BMP in 10 to 14 days to monitor potassium and creatinine.
   - Return to Dunwoody Memorial Hospital Outpatient Cardiology Clinic
     in four weeks for follow-up evaluation.
   - Proceed to emergency department if severe dyspnea or syncope occurs.
   - Educational resources are accessible online at
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

- length: The document must be between 150 and 1,500 words. Offending text or numbers in your version: your text has 1522 words. The hard limits are 150 and 1,500 and this slot targets about 1250.

SLOT s-019
Kind: Progress note or history and physical (H&P) note. An outpatient visit note, an inpatient SOAP progress note, or a full H&P. Headers, a signature block and an author line.
Length: about 762 words (acceptable range 609 to 914)
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

REASON FOR CONSULTATION:
Evaluation and inpatient management of acute multi-joint inflammatory arthritis flare, corticosteroid tapering strategy, optimization of painful peripheral neuropathy, and management of steroid-induced hyperglycemia.

HISTORY OF PRESENT ILLNESS:
The patient is a 56-year-old female with a clinical history of seropositive rheumatoid arthritis diagnosed in 2017, type 2 diabetes mellitus diagnosed in 2019, essential hypertension, and an episode of acute right-sided Bell palsy in 2021 that resolved completely. She was admitted to the general medicine inpatient service three days ago following an acute, disabling polyarticular flare characterized by symmetrical joint swelling, warmth, severe pain, and morning stiffness exceeding two hours across bilateral wrists, metacarpophalangeal joints, proximal interphalangeal joints, and the right knee.

The flare began four weeks ago after temporary disruption in her baseline subcutaneous biologic regimen. Prior to admission, she was maintained on certolizumab pegol 200 mg subcutaneously every 2/3 weeks alongside oral hydroxychloroquine. Historical records, synovial biopsies, and plain radiographs transferred from Outside Hospital confirm symmetrical marginal erosions of the second and third metacarpal heads and progressive carpal space narrowing first identified in 2023. During emergency triage prior to inpatient transfer, she received parenteral analgesia and systemic corticosteroid therapy was initiated.

On hospital day 1, she underwent diagnostic and therapeutic right knee arthrocentesis, yielding 38 mL of cloudy yellow synovial fluid. Synovial fluid analysis demonstrated a total nucleated cell count of 18,400 /uL with 78% polymorphonuclear leukocytes, negative Gram stain, and absent birefringent crystals under polarizing microscopy, confirming non-crystalline inflammatory synovitis without septic arthritis. Bacterial cultures of the synovial aspirate demonstrate no growth at 48 hours.

Over the preceding 48 hours, the patient has reported burning dysesthesias and sharp tingling over both feet and distal lower extremities in a stocking distribution, consistent with diabetic peripheral neuropathy aggravated by physiologic stress. Her 32-year-old daughter was interviewed at the bedside and corroborated that the patient has struggled with nocturnal foot burning over the past six months and experiences marked blood glucose elevations whenever systemic corticosteroids are administered.

The primary inpatient medical team requested rheumatology consultation to establish an outpatient glucocorticoid taper, optimize neuropathic symptom management, assist with inpatient glycemic stabilization, and coordinate post-discharge specialty referrals, including referral to Diabetes Center for glycemic management and Pain Clinic for multidisciplinary pain rehabilitation.

REVIEW OF SYSTEMS:
Constitutional: Fatigue present; denies fever, chills, night sweats, or unintentional weight loss.
HEENT: Denies visual changes, dry eyes, dry mouth, oral ulcers, or recurrent facial weakness; prior Bell palsy remains quiescent. Allergic rhinitis is managed with oral antihistamines.
Cardiovascular: Denies chest tightness, pressure, palpitations, or orthopnea.
Respiratory: Denies cough, dyspnea on exertion, pleurisy, or wheezing.
Gastrointestinal: Mild epigastric burning attributed to oral prednisone; denies nausea, vomiting, melena, or hematochezia.
Genitourinary: Denies dysuria, urinary frequency, or gross hematuria.
Musculoskeletal: Tenderness and soft-tissue swelling in bilateral wrists, MCP joints, and right knee; morning stiffness improved to 30 minutes following steroid administration.
Neurological: Burning pain and allodynia involving bilateral plantar surfaces and toes; denies focal weakness, foot drop, or bowel/bladder dysfunction.
Integumentary: No rheumatoid nodules, vasculitic purpura, psoriasis plaques, or ulcers.
Psychiatric: Mild anxiety related to functional impairment; cognition intact.

PAST MEDICAL HISTORY:
1. Seropositive rheumatoid arthritis, diagnosed in 2017.
2. Type 2 diabetes mellitus, diagnosed in 2019.
3. Essential hypertension, diagnosed in 2018.
4. Right peripheral facial paralysis (Bell palsy), diagnosed in 2021, resolved.
5. Distal symmetric diabetic polyneuropathy, diagnosed in 2023.
6. Allergic rhinitis, longstanding.

PAST SURGICAL HISTORY:
1. Diagnostic and therapeutic right knee arthrocentesis (current admission).
2. Laparoscopic cholecystectomy in 2019.
3. Total abdominal hysterectomy for benign leiomyomata in 2018.

MEDICATIONS PRIOR TO ADMISSION:
1. Certolizumab pegol 200 mg subcutaneously every 2/3 weeks (held).
2. Hydroxychloroquine sulfate 200 mg PO BID.
3. Lyrica 75 mg PO BID for peripheral neuropathic pain.
4. Allegra 180 mg PO daily for allergic rhinitis.
5. Metformin hydrochloride 1000 mg PO BID.
6. Lisinopril 20 mg PO daily.
7. Pantoprazole sodium 40 mg PO daily before breakfast.
8. Acetaminophen 650 mg PO q6h PRN musculoskeletal pain.

CURRENT INPATIENT MEDICATIONS:
1. Prednisone 40 mg PO daily in the morning with food.
2. Hydroxychloroquine sulfate 200 mg PO BID.
3. Lyrica 75 mg PO BID.
4. Allegra 180 mg PO daily.
5. Insulin glargine 16 units subcutaneously nightly at bedtime.
6. Insulin lispro subcutaneously before meals per hospital correction scale.
7. Enoxaparin sodium 40 mg subcutaneous once daily for DVT prophylaxis.
8. Pantoprazole sodium 40 mg PO daily.

ALLERGIES:
Sulfamethoxazole-trimethoprim (pruritic maculopapular drug eruption).
Codeine phosphate (severe nausea).

FAMILY HISTORY:
Mother had seropositive rheumatoid arthritis and coronary disease.
Father had type 2 diabetes mellitus and hypertension.
Sister, age 52, has autoimmune thyroiditis.
No family history of inflammatory bowel disease or lupus.

SOCIAL HISTORY:
The patient resides with her spouse in a single-level residence; her adult daughter lives nearby and assists with community errands. Lifetime non-smoker. Denies alcohol or recreational substance use. Retired accountant.

PHYSICAL EXAMINATION:
Vital Signs:
Temperature: 98.6 F (37.0 C)
Blood Pressure: 132/80 mmHg
Pulse: 76 beats per minute, regular
Respiratory Rate: 16 breaths per minute
Oxygen Saturation: 98% on ambient air
Body Mass Index: 28.4 kg/m2

General: 56-year-old female, alert, oriented x4, pleasant, in no acute distress.
HEENT: Normocephalic, atraumatic. Sclerae anicteric. Oropharynx clear, moist mucous membranes. Facial movements symmetric, eyelid closure complete, smile symmetric; no sequelae of prior Bell palsy.
Neck: Supple, trachea midline, thyroid non-palpable, no jugular venous distention.
Cardiovascular: Regular rhythm, normal S1 and S2, no murmurs, gallops, or rubs. Peripheral pulses 2+ bilaterally.
Lungs: Clear to auscultation bilaterally. No crackles, rhonchi, or wheezes.
Abdomen: Soft, non-distended, non-tender. Normoactive bowel sounds. No organomegaly.
Musculoskeletal Examination:
Bilateral hands and wrists: Symmetrical synovial swelling and tenderness along bilateral dorsal radiocarpal joints and MCP joints. Mild ulnar drift without subluxations. Grip strength reduced bilaterally secondary to wrist pain.
Right knee: Trace residual effusion, improved post-arthrocentesis; mild warmth without erythema; flexion to 115 degrees.
Left knee: No effusion or tenderness; full range of motion.
Ankles and feet: Mild tenderness across bilateral MTP joints; no acute erythema.
Neurological Examination:
Cranial nerves II through XII intact bilaterally.
Motor: Muscle strength 5/5 proximally; 4+/5 in hand intrinsics due to joint tenderness; 5/5 in bilateral ankles.
Sensory: Diminished sensation to light touch and pinprick in stocking pattern distal to mid-calves. Vibratory sensation reduced at great toes. Allodynia across bilateral plantar surfaces.
Reflexes: Deep tendon reflexes 2+ throughout upper extremities; 2+ patellar; 1+ Achilles bilaterally. Plantar responses flexor.
Vascular / Lower Extremity Circumference:
Right calf circumference 35.5 cm; left calf circumference 35.0 cm. Calves soft, non-tender. No pitting edema. Wells score for deep vein thrombosis calculated at 0 points (low probability).
Skin: No subcutaneous rheumatoid nodules, vasculitic purpura, or ulcers.

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
  Hemoglobin A1c: 7.6%
  C-reactive protein: 24.6 mg/L (elevated, down from 68.2 mg/L on admission)
  Erythrocyte sedimentation rate: 48 mm/h (down from 76 mm/h)
  Rheumatoid Factor: 84 IU/mL (positive)
  Anti-Cyclic Citrullinated Peptide (anti-CCP): > 250 U/mL (strongly positive)
Synovial Fluid Analysis (Right Knee):
  Total Nucleated Cells: 18,400 /uL (78% neutrophils, 18% lymphocytes, 4% monocytes)
  Crystals: Negative for monosodium urate and calcium pyrophosphate crystals
  Gram Stain: No organisms seen
  Bacterial Culture: No growth at 48 hours
Venous Duplex Ultrasound (Bilateral Lower Extremities):
  Common femoral, femoral, and popliteal veins fully compressible bilaterally. No evidence of deep vein thrombosis.

ASSESSMENT:
1. Seropositive rheumatoid arthritis flare: Polyarticular inflammatory synovitis involving bilateral wrists, MCP joints, and right knee, demonstrating response to oral corticosteroid induction and joint arthrocentesis. Synovial analysis confirms inflammatory etiology without infection or crystals.
2. Diabetic peripheral neuropathy: Painful distal symmetric polyneuropathy with stocking allodynia, suboptimally controlled on current gabapentinoid dose.
3. Type 2 diabetes mellitus: Steroid-associated hyperglycemia.
4. History of right Bell palsy: Resolved, completely quiescent with normal facial nerve function.
5. Mild calf asymmetry: Negative venous duplex ultrasonography and Wells score of 0, excluding deep vein thrombosis.

PLAN AND RECOMMENDATIONS:
1. Rheumatoid Arthritis Management and Corticosteroid Taper:
   - Initiate oral prednisone 40/30/20/10 mg daily taper: administer prednisone 40 mg PO daily for 7 days, then 30 mg PO daily for 7 days, then 20 mg PO daily for 7 days, then 10 mg PO daily for 7 days, followed by 5 mg PO daily maintenance until outpatient rheumatology re-evaluation.
   - Continue oral hydroxychloroquine sulfate 200 mg PO BID.
   - Maintain temporary hold on certolizumab pegol until completion of prednisone taper; resume certolizumab pegol 200 mg subcutaneously every 2/3 weeks under outpatient rheumatology supervision.
   - Continue pantoprazole sodium 40 mg PO daily before breakfast for gastrointestinal cytoprotection.
   - Calcium carbonate 500 mg / vitamin D3 400 IU PO BID for bone health.
2. Neuropathic Pain Optimization:
   - Titrate Lyrica (pregabalin): Increase Lyrica from 75 mg PO BID to 150 mg PO BID (75 mg in morning, 150 mg nightly for 3 days, then advance to 150 mg PO BID as tolerated).
   - Continue Allegra 180 mg PO daily for allergic rhinitis.
   - Outpatient referral submitted to Pain Clinic for multidisciplinary evaluation and non-pharmacologic modalities.
3. Glycemic Control and Metabolic Monitoring:
   - Continue inpatient subcutaneous basal-bolus insulin regimen targeting blood glucose between 110 and 180 mg/dL.
   - Outpatient referral to Diabetes Center for self-management education and medication adjustments as oral prednisone is tapered.
4. Venous Thromboembolism Prophylaxis:
   - Continue enoxaparin sodium 40 mg subcutaneous once daily while inpatient; discontinue at discharge given ambulation and Wells score of 0.
5. Discharge Coordination and Post-Acute Care:
   - Outpatient follow-up with Rheumatology in 3 weeks.
   - Follow-up with Diabetes Center within 2 weeks.
   - Consultation visit at Pain Clinic within 4 weeks.
   - If skin breakdown occurs over pressure areas, referral to Wound Care will be expedited.
   - Diagnostic reports and historical records forwarded from Outside Hospital have been reviewed and archived.

Care Team Signoff:
Consultant: Fellow in Rheumatology and Clinical Immunology
Supervising Attending: Attending Physician, Division of Rheumatology and Internal Medicine

=== END REJECTED TEXT ===

Rules broken by that version:

- length: The document must be between 150 and 1,500 words. Offending text or numbers in your version: your text has 1661 words. The hard limits are 150 and 1,500 and this slot targets about 1150.

SLOT s-027
Kind: Discharge summary or referral letter. Either a hospital discharge summary (course, medications, follow-up) or a letter that refers a patient from one clinician to another.
Length: about 800 words (acceptable range 640 to 960)
Layout: flowing lines with no hard wrapping
Typos: no deliberate typos needed
Identifiers: yes
People: patient naming tradition: South Asian: Tamil, Telugu or Bengali. Clinician and staff naming tradition: Anglo-American (English, Scottish or German-American descent). Relative or caregiver naming tradition: Anglo-American (English, Scottish or German-American descent). Invent fresh names, with the patient's surname starting with the letter C unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_allcaps] Write at least one person's name in ALL CAPS (a header, label or fax cover).
- [ad_caps] Give a street address in ALL CAPS (label or fax header style).
- [u_url_end] Give a URL at the very end of a sentence, followed by a period.
- [n_lastfirst] Write at least one person's name in LAST, FIRST order (a header, label, sign-in line or list entry).
- [n_title] Put a title in front of at least two names (Dr., Mrs., Mr., Ms., Prof., Rev.). The title is not part of the name.
- [n_list] Include a list that holds several names together (care team, attendees, cc line, covering physicians, family members present).
- [n_nonanglo_part] Include a person whose surname has a particle or several parts (de la Cruz, van der Merwe, bin Hamad, al-Rashid, O'Connor-Silva, Garcia Lopez) or whose name carries accents, hyphens or apostrophes.
- [f_proper] Name one facility with an invented proper name (like "St. Brendan Medical Center" or "Calloway Regional Hospital").
- [d_slash] Write a numeric date with slashes (3/4/2026 or 03/04/26).
- [d_iso] Write an ISO date (2026-03-04).
- [d_ordinal] Write a date with an ordinal ("March 4th", "the 4th of March").
- [d_dob] Give a date of birth, either labeled ("DOB:") or in prose ("born on ...").
- [d_header] Put a date inside a header or form field (Date of Service:, Collected:, Admitted:, Discharged:).
- [a_over_yo] Give an age of 90 or over as "92 y.o." or "91 yo".
- [i_unlabeled] Give a record number with no label at all, for example as the first token in a header line.
- [i_plan] Give a health plan member number or group number.
- [i_scan] Give an ID that has OCR or scan errors (the letter O for zero, a lowercase l for one), as in a faxed or scanned page.
- [p_plain] Give a phone number in common US format with an area code.
- [p_dots] Give a phone number written with dots or spaces (415.555.0142 or 415 555 0142).
- [e_obf] Give an email address written to avoid detection ("name at example dot com" or "name (at) example.org").
- [ad_pobox] Give a PO box address with city, state and ZIP.
- [ad_city] Name a city or town on its own as where someone lives or works ("she lives in Fairview").
- [k_labs] Include lab values and vital signs with units.

REJECTED VERSION OF s-027:
=== BEGIN REJECTED TEXT ===
99482015
GRAFTON MEMORIAL HOSPITAL
DEPARTMENT OF INPATIENT MEDICINE
DISCHARGE SUMMARY

PATIENT NAME: CHAKRABORTY, SUBHASHISH
DATE OF BIRTH: 03/12/1934
AGE: 92 y.o.
GENDER: Male
ADMISSION DATE: 10/14/2026
DISCHARGE DATE: 2026-10-18
ATTENDING PHYSICIAN: ALISTAIR MACINTYRE, MD
PRIMARY CARE TEAM: Dr. Alistair MacIntyre, Dr. Rebecca Vogel, Bradley Miller, NP, Dr. Fiona O'Connor-Silva
PATIENT RESIDENCE: 742 EAST HIGHLAND AVENUE, APT 4B, TAMPA, FL 33602
CORRESPONDENCE ADDRESS: PO Box 4819, Tampa, FL 33682
PRIMARY CONTACT: Derek Sterling (Son-in-law), Home/Cell: (813) 555-0143
CLINICAL COORDINATION TEL: 813.555.0187
PHYSICIAN LIAISON: amacintyre at example dot org
PRIMARY HEALTH PLAN: Senior Medicare Advantage health plan
PLAN MEMBER ID: HPM-49201844-01
GROUP NUMBER: G-88301A
PRIOR AUTHORIZATION SCAN TRACKING: PA-8O19l43-O2

ADMISSION DIAGNOSIS:
Acute decompensated systolic and diastolic heart failure with volume overload.

DISCHARGE DIAGNOSES:
1. Acute-on-chronic decompensated heart failure with mildly reduced ejection fraction (EF 40%), resolved to euvolemic baseline.
2. Chronic ischemic cardiomyopathy.
3. Permanent atrial fibrillation with rapid ventricular response at presentation, rate-controlled on discharge.
4. Essential hypertension.
5. Chronic kidney disease stage 3a, stable baseline.
6. History of Bell palsy, remote, resolved.
7. Bilateral knee osteoarthritis.

CONSULTING SERVICES:
1. Cardiology (Heart Failure Service): Dr. Rebecca Vogel.
2. Neurology: Dr. Fiona O'Connor-Silva.
3. Inpatient Case Management: Bradley Miller, NP.

CHIEF COMPLAINT:
Progressive shortness of breath, orthopnea, and worsening bilateral lower extremity swelling.

HISTORY OF PRESENT ILLNESS:
Mr. Subhashish Chakraborty is a 92 y.o. gentleman with a complex cardiovascular history including ischemic cardiomyopathy, permanent atrial fibrillation on oral anticoagulation, stage 3a chronic kidney disease, and hypertension, who presented through the emergency evaluation pavilion on October 14th after five days of progressively worsening exertional dyspnea. The patient reported that he could previously ambulate fifty feet with a rolling walker without significant respiratory compromise. However, over the week leading up to admission, he developed severe orthopnea requiring four pillows to sleep upright, paroxysmal nocturnal dyspnea waking him after two hours of recumbency, and marked bilateral pedal edema extending to the mid-shins. He noted an unintentional eight-pound weight gain over seven days despite compliance with his prescribed home regimen.

On the morning of 10/14/2026, his son-in-law, Mr. Derek Sterling, noted that Mr. Chakraborty was visibly fatigued, tachypneic at rest, and unable to complete sentences without gasping for breath. The patient denied chest pain, pressure, radiating tightness, syncope, fevers, chills, cough productive of purulent sputum, or calf pain. Paramedics were contacted, and upon initial assessment in the field, oxygen saturation was 88% on room air, which improved to 95% on 3 L/min via nasal cannula. He was transferred directly to Grafton Memorial Hospital for urgent inpatient management.

PAST MEDICAL AND SURGICAL HISTORY:
1. Ischemic cardiomyopathy: Transthoracic echocardiogram ten months prior demonstrated left ventricular ejection fraction of 38-42% with mild anterior wall hypokinesis.
2. Coronary artery disease: Status post two-vessel coronary artery bypass grafting in 2014 with saphenous vein graft to obtuse marginal and left internal mammary artery to left anterior descending artery.
3. Atrial fibrillation: Permanent, rate-controlled with beta-blockers and anticoagulated with Eliquis.
4. Chronic kidney disease: Baseline serum creatinine 1.15 to 1.30 mg/dL, baseline eGFR 48 mL/min/1.73 m2.
5. Hypertension: Controlled on home antihypertensive therapy.
6. Bell palsy: Diagnosed in 2018; right-sided facial weakness that resolved completely over four months without residual deficit.
7. Osteoarthritis: Involving bilateral knees and lumbar spine.

ALLERGIES:
Lisinopril (cough), Penicillin (cutaneous rash).

HOSPITAL COURSE:
1. Cardiovascular / Acute Decompensated Heart Failure:
Upon arrival on October 14th, Mr. Chakraborty was in moderate respiratory distress with prominent jugular venous distention measuring 12 cm of water and bibasilar crackles extending one-third up both lung fields. Transthoracic echocardiogram revealed left ventricular ejection fraction of 40%, moderate mitral regurgitation, and a dilated inferior vena cava with blunted respiratory collapse. His initial NT-proBNP was markedly elevated at 4,820 pg/mL. Given severe fluid retention, he was initiated on intravenous Lasix (furosemide) 40 mg twice daily. Over the initial 48 hours, he demonstrated a brisk diuretic response with net negative fluid balance of 2,400 mL and 1,800 mL respectively. Peripheral edema improved substantially from 3+ pitting edema to trace pretibial edema. By hospital day 3, he was transitioned to oral bumetanide 1 mg daily. A clinical Wells score was calculated to evaluate the possibility of deep vein thrombosis given asymmetric leg swelling on day 2; the Wells score was 0, indicating low probability, and venous duplex ultrasonography confirmed no evidence of deep venous thrombosis. At discharge on 2026-10-18, the patient was clinically euvolemic, ambulating comfortably, and saturating 98% on ambient air.

2. Atrial Fibrillation / Rate Control:
Initial electrocardiogram demonstrated atrial fibrillation with rapid ventricular response at a rate of 124 bpm. Dr. Rebecca Vogel from cardiology evaluated Mr. Chakraborty and recommended titrating Metoprolol succinate to 50 mg daily. The ventricular rate stabilized into the 68 to 82 bpm range throughout telemetry monitoring. Eliquis (apixaban) was continued at the dose-adjusted regimen of 2.5 mg orally twice daily, appropriate for his age and renal status. He remained hemodynamically stable without ischemic changes on serial tracings.

3. Renal Function and Electrolytes:
Serum electrolytes and renal parameters were followed closely during intravenous diuresis. Baseline serum creatinine of 1.18 mg/dL rose transiently to 1.34 mg/dL on hospital day 2, consistent with hemoconcentration, but returned to 1.20 mg/dL by discharge. Serum potassium remained between 4.0 and 4.4 mEq/L with judicious oral potassium chloride supplementation.

4. Neurologic Assessment:
On hospital day 2, the patient described a brief episode of lightheadedness when sitting up from bed. Dr. Fiona O'Connor-Silva performed a comprehensive neurological consultation. The patient was alert, oriented to person, place, time, and situation. His Glasgow Coma Scale score was 15/15. Cranial nerve examination demonstrated symmetric facial movements, confirming no recurrence of prior Bell palsy. Orthostatic blood pressures showed no postural drop (supine BP 132/74 mmHg, standing BP 128/72 mmHg). The episode was determined to be transient benign positional lightheadedness secondary to rapid fluid shifts.

5. Physical Therapy, Case Management, and Disposition:
Bradley Miller, NP, coordinated multidisciplinary discharge planning with physical therapy and occupational therapy. Formal functional assessment demonstrated that Mr. Chakraborty achieved independent bed mobility, transfer ability with minimal contact assistance, and gait endurance of 120 feet with a rolling walker. Although the patient typically resides at his apartment on Highland Avenue in Tampa, his son-in-law Derek Sterling arranged for the patient to stay at his single-story residence in Clearwater during the initial four weeks of rehabilitation to avoid stair navigation. Outpatient physical therapy and home health nursing were arranged through Grafton Home Health Services.

PHYSICAL EXAMINATION AT DISCHARGE:
Vital Signs: Temperature 98.4 F (36.9 C), blood pressure 126/72 mmHg, heart rate 72 bpm regular, respiratory rate 16 breaths/min, oxygen saturation 98% on room air. Weight 74.2 kg (down 3.8 kg from admission weight of 78.0 kg).
General: Pleasant, frail elderly gentleman, alert, resting comfortably in no acute distress.
HEENT: Normocephalic, atraumatic. Moist mucous membranes, no jugular venous distention at 30 degrees.
Cardiovascular: Irregularly irregular rhythm with controlled ventricular rate, normal S1 and S2, grade II/VI holosystolic murmur at the cardiac apex radiating to the axilla, no S3 or S4, peripheral pulses 2+ bilaterally.
Pulmonary: Lungs clear to auscultation bilaterally, no wheezing, rales, or rhonchi.
Abdomen: Soft, non-tender, non-distended, normoactive bowel sounds, no hepatomegaly.
Extremities: Warm and well-perfused, trace pedal edema bilaterally, no cyanosis or clubbing.
Neurologic: Alert and oriented x 4, Glasgow Coma Scale 15, symmetric facial grimace, cranial nerves II-XII intact, motor strength 5/5 in upper extremities and 4+/5 in lower extremities bilaterally.

LABORATORY AND DIAGNOSTIC DATA AT DISCHARGE:
Sodium: 138 mEq/L
Potassium: 4.2 mEq/L
Chloride: 101 mEq/L
Bicarbonate (CO2): 25 mEq/L
Blood Urea Nitrogen (BUN): 21 mg/dL
Serum Creatinine: 1.20 mg/dL
Estimated GFR: 52 mL/min/1.73 m2
Glucose: 112 mg/dL
Calcium: 9.1 mg/dL
Hemoglobin: 11.4 g/dL
Hematocrit: 35.2%
White Blood Cell Count (WBC): 6.8 x 10^3/uL
Platelet Count: 218 x 10^3/uL
Total Bilirubin: 0.7 mg/dL
Aspartate Aminotransferase (AST): 22 U/L
Alanine Aminotransferase (ALT): 19 U/L
Discharge NT-proBNP: 1,410 pg/mL (significantly reduced from admission value of 4,820 pg/mL)
Chest Radiograph: Resolved pulmonary vascular congestion, stable cardiomegaly, clear costophrenic angles.

DISCHARGE MEDICATIONS:
1. Bumetanide 1 mg oral tablet every morning.
2. Metoprolol succinate 50 mg oral extended-release tablet once daily.
3. Eliquis (apixaban) 2.5 mg oral tablet twice daily.
4. Atorvastatin 20 mg oral tablet once daily at bedtime.
5. Potassium chloride 20 mEq oral extended-release tablet once daily.
6. Tylenol (acetaminophen) 500 mg oral tablet every 8 hours as needed for joint pain (maximum 2,000 mg in 24 hours).

DISCHARGE INSTRUCTIONS AND FOLLOW-UP PLAN:
1. Daily weight monitoring: Mr. Chakraborty must record his weight every morning after voiding and prior to breakfast. Derek Sterling will assist with the daily weight log. Call the clinic if weight increases by 2 pounds overnight or 4 pounds over one week.
2. Low-sodium diet: Strict adherence to a 2,000 mg sodium daily restriction. Fluid intake restricted to 2.0 liters per day.
3. Outpatient Cardiology Clinic: Follow-up visit scheduled with Dr. Rebecca Vogel at Grafton Heart Care Pavilion on October 28, 2026 at 10:30 AM.
4. Primary Care Follow-up: Appointment with Dr. Heather Campbell on November 2, 2026 at 2:00 PM.
5. Nephrology and Neurology: Routine follow-up on PRN basis. If positional dizziness recurs, contact Dr. Fiona O'Connor-Silva.
6. Outside Hospital Records: Scanned records from Outside Hospital prior cardiac catheterization were integrated into the chart.
7. Portal Access: Additional instructions, rehabilitation schedules, and printable medication records are available via the patient care portal at https://portal.example.org/discharge-summary/7041.

Attending Signature:
Alistair MacIntyre, MD
Grafton Memorial Hospital, Inpatient Internal Medicine
Staff ID: 94021
Date: 2026-10-18

=== END REJECTED TEXT ===

Rules broken by that version:

- length: The document must be between 150 and 1,500 words. Offending text or numbers in your version: your text has 1564 words. The hard limits are 150 and 1,500 and this slot targets about 1200.

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
