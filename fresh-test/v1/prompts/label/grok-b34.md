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


=== DOCUMENT fd-0009 ===
   1| Silver Maple Clinic
   2| Endocrine Laboratory
   3| 
   4| Patient: Calloway, Nora
   5| DOB: July 22, 1967
   6| Age: 58 years
   7| MRN: 7304 2281 56
   8| Accession: THY-26-22840
   9| Collected: Mar. 4, 2026
  10| Ordering: Dr. Niall O'Rourke-McBride
  11| Phone: (207) 555-0155
  12| Email: n.calloway at example dot com
  13| Husband: Lewis Tabor
  14| 
  15| CLINICAL INDICATION
  16| Woman with weight loss, heat intolerance, a resting tremor, and a
  17| diffuse goiter. The working diagnosis is Graves disease. Her husband,
  18| Lewis Tabor, confirms she has not missed doses of methimazole. Prior
  19| thyroid tests from last season are not in this file.
  20| 
  21| CARE TEAM
  22| Names on the care-team line: Dr. Niall O'Rourke-McBride, Dr. Ellen Short,
  23| and Dr. Ada Victory.
  24| 
  25| RESULTS
  26| TSH 0.08 mIU/L (reference 0.40 to 4.50). Free T4 2.4 ng/dL (reference
  27| 0.8 to 1.8). Total T3 248 ng/dL (reference 80 to 200).
  28| Thyroid-stimulating immunoglobulin 3.8 IU/L (reference less than 1.3).
  29| Thyroglobulin antibody and thyroid peroxidase antibody were both
  30| negative.
  31| 
  32| A complete blood count drawn on the same collection showed leukocytes
  33| 6.4 K/uL, hemoglobin 12.8 g/dL, and platelets 231,000/uL. The
  34| absolute neutrophil count was 3.1 K/uL, which does not suggest
  35| agranulocytosis on this sample. Comprehensive metabolic panel: sodium
  36| 139 mmol/L, potassium 4.0 mmol/L, creatinine 0.7 mg/dL, ALT 28 U/L,
  37| AST 24 U/L, alkaline phosphatase 96 U/L, and total bilirubin
  38| 0.6 mg/dL.
  39| 
  40| Current medicines recorded on the requisition: methimazole 10 mg PO
  41| TID, propranolol 20 mg PO TID, and a daily multivitamin. She was
  42| advised not to take biotin for two days before the draw, and the
  43| husband states she complied.
  44| 
  45| HISTORY SUPPLEMENT
  46| Pulse on the requisition is 104 beats per minute and blood pressure
  47| is 138/74 mmHg. She describes gritty eyes without a clear loss of
  48| color vision. There is no reported neck pain and no fever. She is
  49| not pregnant. The goiter is recorded as diffuse and soft, without a
  50| dominant nodule that would have changed this blood order into a biopsy.
  51| 
  52| METHOD
  53| TSH, free T4, and total T3 were run on the chemiluminescent
  54| immunoassay platform in this laboratory. Thyroid-stimulating
  55| immunoglobulin was a binding assay sent to the same building's
  56| reference bench, still under this accession. Hemoglobin and the
  57| leukocyte count were run on the hematology line. Specimens were serum
  58| and EDTA whole blood, both received labeled and not hemolyzed. The
  59| free T4 was repeated in duplicate because the first read sat well
  60| above the reference interval, and the duplicate agreed.
  61| 
  62| The husband can be reached at the phone number in the header if a
  63| recollection is required. No add-on test was ordered after release of
  64| these values.
  65| 
  66| INTERPRETATION
  67| The suppressed TSH with elevated free T4 and total T3, together with
  68| a high thyroid-stimulating immunoglobulin, is consistant with Graves
  69| disease in a patient already on a thionamide. Antibody negativity
  70| for TPO and thyroglobulin does not exclude that diagnosis. There is
  71| no signifcant cytopenia on the accompanying blood count. A seperate
  72| uptake and scan, if still desired, would be arranged by nuclear
  73| medicine and is not part of this accession. The numeric results above
  74| were verified by the endocrine laboratory director on duty. Questions
  75| about dosing should go back to the ordering clinician. End of report.
=== END DOCUMENT ===

=== DOCUMENT fd-0036 ===
   1| Cedar Lane Pharmacy
   2| Refill call note
   3| Date of Service: Sept. 12, 2026
   4| Patient: MAIMOUNA LOUM
   5| DOB: Apr. 3, 1987
   6| Rx: 6621904
   7| Plan ID: 3190 6621 44
   8| Phone: (504) 555-0118
   9| Email: maimouna.loum at example dot com
  10| 
  11| Present for the call: Daisy Keene, technician; Chase Elwood, MD; Nadir al-Hashim, husband of the patient.
  12| 
  13| The technician took a refill request for methimazole and propranolol and read the profile back to the husband, who had the bottles in hand at home. Maimouna Loum is a 39-year-old woman with Graves disease. She was at the market during the call and asked that the details be settled with her husband. He confirmed she has not missed more than an occasional tablet in the past month.
  14| 
  15| Profile after the call. Methimazole 10 mg tablet by mouth once daily in the morning. This is the current step of a taper of 30/20/10 mg, and 10 mg is the dose the prescriber wants continued. Propranolol 10 mg tablet by mouth twice daily, morning and late afternoon, for residual tremor. A multivitamin once daily and calcium 500 mg by mouth twice daily with food are also on the shelf and do not need a new prescription today. No biotin was reported.
  16| 
  17| Last values, from the clinic note filed with the profile. Free T4 1.3 ng/dL. TSH 0.18 mIU/L, still low, which is expected this early after the dose reduction. White blood cell count 6.4 K/uL with a normal neutrophil count. Pulse 78 beats per minute. Blood pressure 118/70 mmHg. Weight 64 kg. She has no fever, sore throat, mouth ulcers, or jaundice. Heart rate has stayed under 100 without palpitations that stop her work.
  18| 
  19| Counseling on the call. Stop methimazole and seek a same-day blood count for fever, severe sore throat, or mouth ulcers. Do not restart it until a clinician says the count is safe. Take it at the same time each morning, with or without food. Propranolol should not be stopped abruptly. Take it with food if the stomach is uneasy, and call for wheezing or a pulse that feels too slow. The husband read those points back correctly.
  20| 
  21| Refill plan. Dispense methimazole 10 mg, ninety tablets, one daily, with two refills remaining on the current prescription. Dispense propranolol 10 mg, one hundred eighty tablets, one twice daily, which covers the same ninety days. No early refill override was needed. The prescriber does not need a new signature for this fill. A follow-up thyroid panel is already scheduled, and the result should be on the profile before the next refill is released. If free T4 drifts high, hold further fills and send the profile back for a dose change rather than continuing 10 mg by habit.
  22| 
  23| The husband will pick up both bottles this evening. He was asked to bring an identification card. The patient wants the pharmacy email used for ready notices, written as on this form so the message is not missed by a filter. No allergy to methimazole or to propranolol is on the profile. She does not take an iodine supplement. End of refill call note.
=== END DOCUMENT ===

=== DOCUMENT fd-0008 ===
   1| From: the patient
   2| To: the diabetes and rheumatology care team
   3| Subject: ankle swelling on the steroid taper
   4| 
   5| hi team, this is the patient. i am a 67-year-old and my daughter has been lining up the pill box since the flare that started after i was diagnosed in 2019. the hands have been stiffer since 2021, and recently the left ankle blew up so i could not get a shoe on. the home cuff this morning showed blood pressure 148/92 mmHg, pulse 96 beats per minute, and weight 71.4 kg. medicines i took: methotrexate 15 mg PO once weekly, folic acid 1 mg PO daily, metformin 500 mg PO BID, and Allegra 180 mg PO daily for the allergies. the taper card says prednisone 40/30/20/10 mg PO daily, five days on each dose, and i am in the middle of the 30 mg step. i did not take the tramadol. please tell me if i should come in or just wait on labs. my daughter can read the reply with me tonight.
   6| 
   7| From: the covering pharmacist
   8| To: the patient
   9| Subject: re: ankle swelling on the steroid taper
  10| 
  11| Thank you for writing this out so clearly. We compared your note with the records that arrived from Outside Hospital and with the bloodwork drawn at the clinic.
  12| 
  13| Past Medical History: seropositive rheumatoid arthritis, seasonal allergic rhinitis, prediabetes, and a remote Bell palsy that resolved without residual weakness.
  14| 
  15| Medications to continue: methotrexate 15 mg PO once weekly, folic acid 1 mg PO daily, metformin 500 mg PO BID, and Allegra 180 mg PO daily. Stay on the written taper, prednisone 40/30/20/10 mg PO daily, and do not skip a step or go backward unless we tell you to. For pain use acetaminophen 650 mg PO q6h PRN, limit 3 g in 24 hours. Hold tramadol 50 mg PO q6h PRN unless the pain is severe and the ankle is not hot or red.
  16| 
  17| Labs from the clinic visit: creatinine 0.9 mg/dL, eGFR 78 mL/min/1.73 m2, ESR 42 mm/hr, CRP 1.8 mg/dL, hemoglobin 11.6 g/dL, potassium 4.1 mmol/L, hemoglobin A1c 7.4%. Vitals that day: temperature 36.8 C, respiratory rate 16 breaths per minute, oxygen saturation 97% on room air, blood pressure 142/86 mmHg.
  18| 
  19| Assessment: the ankle swelling can come from the prednisone itself, from a rheumatoid flare, or less often from a clot. A Wells score of 1 puts the clot risk in the low range, so no lower-extremity duplex ultrasound is planned today. No arthrocentesis and no joint injection are planned either.
  20| 
  21| Plan: we are sending a referral to Pain Clinic for the chronic joint pain and a referral to Diabetes Center so the metformin dose can be reviewed against the A1c. Cardiology does not need a new visit. Wound Care is not indicated unless the skin opens. Please send a portal update in two days with a repeat home blood pressure and whether the ankle still will not take a shoe. If the joint becomes hot, you cannot bear weight, or you have chest pain or sudden shortness of breath, go to urgent care the same day rather than waiting on this thread.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.