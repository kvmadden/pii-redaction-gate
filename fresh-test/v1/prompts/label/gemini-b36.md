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


=== DOCUMENT fd-0277 ===
   1| 99482015
   2| GRAFTON MEMORIAL HOSPITAL
   3| DEPARTMENT OF INPATIENT MEDICINE
   4| DISCHARGE SUMMARY
   5| 
   6| PATIENT NAME: CHAKRABORTY, SUBHASHISH
   7| DATE OF BIRTH: 03/12/1934
   8| AGE: 92 y.o.
   9| GENDER: Male
  10| ADMISSION DATE: 10/14/2026
  11| DISCHARGE DATE: 2026-10-18
  12| ATTENDING PHYSICIAN: ALISTAIR MACINTYRE, MD
  13| PRIMARY CARE TEAM: Dr. Alistair MacIntyre, Dr. Rebecca Vogel, Bradley Miller, NP, Dr. Fiona O'Connor-Silva
  14| PATIENT RESIDENCE: 742 EAST HIGHLAND AVENUE, APT 4B, TAMPA, FL 33602
  15| CORRESPONDENCE ADDRESS: PO Box 4819, Tampa, FL 33682
  16| PRIMARY CONTACT: Mr. Derek Sterling (Son-in-law), Home Phone: (813) 555-0143
  17| COORDINATION PHONE: 813.555.0187
  18| PHYSICIAN LIAISON: amacintyre at example dot org
  19| HEALTH PLAN: Senior Medicare Advantage health plan
  20| PLAN MEMBER ID: HPM-49201844-01
  21| GROUP NUMBER: G-88301A
  22| PRIOR AUTHORIZATION TRACKING: PA-8O19l43-O2
  23| 
  24| DISCHARGE DIAGNOSES:
  25| 1. Acute-on-chronic decompensated heart failure with mildly reduced ejection fraction (EF 40%), resolved to euvolemic baseline.
  26| 2. Chronic ischemic cardiomyopathy.
  27| 3. Permanent atrial fibrillation, rate-controlled on discharge.
  28| 4. Stage 3a chronic kidney disease, stable baseline.
  29| 5. History of Bell palsy, remote, resolved.
  30| 
  31| CHIEF COMPLAINT:
  32| Shortness of breath, orthopnea, and worsening bilateral lower extremity swelling.
  33| 
  34| HISTORY OF PRESENT ILLNESS:
  35| Mr. Subhashish Chakraborty is a 92 y.o. gentleman with ischemic cardiomyopathy, atrial fibrillation, chronic kidney disease, and hypertension, who presented on October 14th after five days of progressive dyspnea. He noted severe orthopnea requiring four pillows, paroxysmal nocturnal dyspnea, and marked bilateral pedal edema with an eight-pound weight gain. On the morning of 10/14/2026, his son-in-law, Mr. Derek Sterling, noted that Mr. Chakraborty was tachypneic at rest. Emergency services transported him directly to Grafton Memorial Hospital, where oxygen saturation was 88% on room air, improving to 95% on 3 L/min nasal cannula.
  36| 
  37| HOSPITAL COURSE:
  38| 1. Acute Decompensated Heart Failure:
  39| Upon arrival on October 14th, Mr. Chakraborty exhibited jugular venous distention of 12 cm H2O and bibasilar crackles. Transthoracic echocardiogram showed left ventricular ejection fraction of 40% and moderate mitral regurgitation. NT-proBNP was elevated at 4,820 pg/mL. Intravenous furosemide 40 mg twice daily produced a brisk diuresis with 4.2 L total negative balance over 48 hours. Peripheral edema improved to trace pretibial edema. He was transitioned to oral bumetanide 1 mg daily. Asymmetric calf fullness prompted calculation of a Wells score of 0 points, and duplex ultrasonography excluded deep vein thrombosis. At discharge on 2026-10-18, the patient was clinically euvolemic, ambulating comfortably on ambient air.
  40| 
  41| 2. Atrial Fibrillation:
  42| Initial electrocardiogram showed atrial fibrillation with rapid ventricular response at 124 bpm. Dr. Rebecca Vogel from cardiology recommended titrating metoprolol succinate to 50 mg daily, stabilizing the ventricular rate between 68 and 82 bpm. Eliquis (apixaban) was maintained at the dose-adjusted regimen of 2.5 mg PO BID.
  43| 
  44| 3. Neurologic Assessment:
  45| Dr. Fiona O'Connor-Silva performed neurological evaluation for transient lightheadedness on day 2. Glasgow Coma Scale was 15/15. Cranial nerve examination demonstrated symmetric facial grimace, with no recurrence of prior Bell palsy. Lightheadedness was determined to be transient benign positional dizziness from fluid shifts.
  46| 
  47| 4. Disposition and Coordination:
  48| Bradley Miller, NP, coordinated discharge planning. Although Mr. Chakraborty typically resides at his apartment on Highland Avenue in Tampa, his son-in-law Derek Sterling arranged for him to stay at his single-story home in Clearwater during rehabilitation. Home health nursing was arranged through Grafton Memorial Hospital home services.
  49| 
  50| DISCHARGE PHYSICAL EXAMINATION:
  51| Vital Signs: Temperature 98.4 F (36.9 C), blood pressure 126/72 mmHg, heart rate 72 beats/min regular, respiratory rate 16 breaths/min, oxygen saturation 98% on room air. Weight 74.2 kg (down 3.8 kg from admission weight of 78.0 kg).
  52| General: Frail elderly male, resting comfortably.
  53| Neck: JVP 6 cm H2O.
  54| Cardiovascular: Irregular rhythm, rate-controlled, grade II/VI systolic apical murmur. Peripheral pulses 2+ bilaterally.
  55| Lungs: Clear to auscultation bilaterally without wheezing or crackles.
  56| Extremities: Trace pedal edema bilaterally.
  57| Neurologic: Alert and oriented x4, Glasgow Coma Scale 15, symmetric facial grimace, motor strength 5/5 upper and 4+/5 lower extremities.
  58| 
  59| DISCHARGE LABS:
  60| Sodium: 138 mEq/L, Potassium: 4.2 mEq/L, Chloride: 101 mEq/L, Bicarbonate: 25 mEq/L, BUN: 21 mg/dL, Serum Creatinine: 1.20 mg/dL (baseline 1.18 mg/dL), Estimated GFR: 52 mL/min/1.73 m2, Glucose: 112 mg/dL, Hemoglobin: 11.4 g/dL, Platelets: 218 x 10^3/uL, NT-proBNP: 1,410 pg/mL.
  61| 
  62| DISCHARGE MEDICATIONS:
  63| 1. Bumetanide 1 mg PO every morning.
  64| 2. Metoprolol succinate 50 mg PO daily.
  65| 3. Eliquis 2.5 mg PO BID.
  66| 4. Atorvastatin 20 mg PO nightly.
  67| 5. Potassium chloride 20 mEq PO daily.
  68| 6. Acetaminophen 500 mg PO q8h PRN joint pain.
  69| 
  70| DISCHARGE INSTRUCTIONS AND FOLLOW-UP:
  71| 1. Daily morning weights: Derek Sterling will assist with logging. Call clinic if weight increases by 2 pounds overnight or 4 pounds in one week.
  72| 2. Diet: 2,000 mg sodium daily restriction and 2.0 L fluid limit.
  73| 3. Follow-up appointments: Outpatient visit with Dr. Rebecca Vogel on October 28, 2026, and primary care follow-up with Dr. Heather Campbell on November 2, 2026.
  74| 4. Discharge summary, care plans, and rehabilitation schedules are accessible at https://portal.example.org/discharge-summary/7041.
  75| 
  76| Attending Signoff:
  77| Electronically signed by:
  78| ALISTAIR MACINTYRE, MD
  79| Grafton Memorial Hospital Inpatient Medicine
  80| Date: 2026-10-18
=== END DOCUMENT ===

=== DOCUMENT fd-0056 ===
   1| From: Anežka Pěničková
   2| To: wound care portal
   3| Date of Service: November 2, 2026
   4| 
   5| hello, this is the patient. please send the supply refill to Mrs. Marjorie Cartwright, my mother, at PO Box 418, Quarry Hill, KS 66048, because i am staying with her while the graft heals. i was told the left shin ulcer is smaller. i have been doing the saline soak and then mupirocin 2% ointment topically BID and wrapping with a dry gauze. pain is fine on acetaminophen 500 mg PO q6h PRN. my sugar before lunch was 162 mg/dL and the home cuff read 128/76 mmHg, pulse 80. dr. mendel krasner told me the last culture grew ordinary skin bacteria and not to start an oral antibiotic. the form they mailed still has SSN 000-28-4419 on it and i would rather not keep mailing that around. can someone confirm the dressing plan.
   6| 
   7| From: Dr. Mendel Krasner
   8| To: Anežka Pěničková
   9| 
  10| Thank you. We will use your mother's mailing address for the supply box only.
  11| 
  12| Assessment: venous stasis ulcer of the left shin, type 2 diabetes. The graft check showed a clean base and less drainage. Continue mupirocin 2% ointment topically BID for five more days, then stop it and use plain petrolatum gauze daily. Keep acetaminophen 500 mg PO q6h PRN, no more than 3 g a day. Do not start cephalexin unless we call you. Labs from the visit: hemoglobin A1c 8.1%, WBC 7.4 K/uL, creatinine 0.9 mg/dL. Temperature was 36.7 C. No debridement is planned this week. A repeat wound check is the only procedure on the books.
  13| 
  14| Please do not send the social security number again on the portal. We already have what we need in the chart, and that mailing form should be shredded. Kestrel Wound Clinic will stay the site for the in-person checks. Write if the wound turns red, warm, or foul, or if glucose stays over 250 mg/dL.
=== END DOCUMENT ===

=== DOCUMENT fd-0085 ===
   1| Subject: Paper copy of the visit summary
   2| 
   3| Hello,
   4| 
   5| Please send the paper copy of the full outpatient visit summary for Clara
   6| Steinhauer, who is ninety-three years old, to her son Paul Whitaker, who
   7| holds the signed release. The visit on 28.09.2026 reviewed dizziness on
   8| standing and a small skin tear on the shin. The shin tear was cleaned and
   9| dressed. Watch for spreading redness, pus, or fever, and keep the leg raised
  10| when she is seated. Her appetite is fair and her weight has been steady.
  11| She uses a walker in the hall. The blood pressure log shows lower numbers
  12| after she stands, so she should pause at the side of the bed before walking.
  13| 
  14| Per Dr. Hargreave's note, continue amlodipine 5 mg PO daily, atorvastatin
  15| 20 mg PO nightly, and acetaminophen 650 mg PO q6h PRN pain. Do not start
  16| ibuprofen. Continue the present pills with a full glass of water, and bring
  17| the bottles to the next discussion so they can be matched to this list.
  18| Please recieve the chart back by the end of the week so a seperate referral
  19| can be filed if the tear is not healing. A caregiver reported one fall
  20| without head injury and without loss of conciousness.
  21| 
  22| Call the clinic line at (218) 555-0177 ext. 214 if the family needs the
  23| summary read aloud. Thank you for moving this packet.
  24| 
  25| Health information desk
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.