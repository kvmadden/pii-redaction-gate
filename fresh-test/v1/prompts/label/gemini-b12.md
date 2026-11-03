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


=== DOCUMENT fd-0022 ===
   1| PRIOR AUTHORIZATION AND CLINICAL MEDICATION REVIEW
   2| FACILITY: Cedar Grove Clinic
   3| DEPARTMENT: Clinical Pharmacy Services
   4| 
   5| TRANSMISSION HEADER:
   6| Date of Request: October 18, 2026
   7| Prescriber: Dr. Lev M. Rosenberg, MD
   8| Prescriber Specialty: Dermatology
   9| Clinic Telephone: (206) 555-0142
  10| Direct Clinic Fax: 206.555.0188
  11| 
  12| PATIENT DEMOGRAPHICS:
  13| PATIENT: AYLA CEVIK
  14| DOB: June 14, 1934
  15| Age: 92 y.o.
  16| Sex: Female
  17| Home Address:
  18| 742 Orchard View Road
  19| Seattle, WA 98103
  20| Primary Caregiver / Emergency Contact: Sung-ho Kim (husband)
  21| Contact Phone: (206) 555-0177
  22| Health Plan Member ID: 7741-2098-53
  23| Prescription Benefit Group: RX-99410
  24| 
  25| MEDICATION REQUESTED:
  26| Drug Name: Dupixent (dupilumab) pre-filled syringe
  27| Dose and Administration: 600 mg subcutaneous injection loading dose (administered as two 300 mg injections at separate sites), followed by 300 mg SC every 14 days
  28| Quantity: 2 syringes (300 mg/2 mL) per 28 days
  29| Anticipated Duration: 12 months
  30| 
  31| CLINICAL JUSTIFICATION AND HISTORY:
  32| Ayla Cevik is a 92 y.o. female presenting with severe, intractable atopic dermatitis complicated by generalized prurigo nodularis. The patient has been followed longitudinally at Cedar Grove Clinic by Dr. Lev M. Rosenberg. Physical exam demonstrates severe lichenification, excoriations, and erythematous plaques involving approximately 24% of total body surface area, predominantly affecting the bilateral upper extremities, trunk, and neck. Intense nocturnal pruritus has produced persistent sleep deprivation and secondary functional impairment.
  33| 
  34| TREATMENT HISTORY AND PREVIOUS FAILURES:
  35| 1. Topical Corticosteroids: Clobetasol propionate 0.05% cream and ointment applied twice daily to active lesions for eight consecutive weeks between May 2026 and July 2026, with only temporary and marginal reduction in erythema. Chronic application was subsequently tapered due to cutaneous atrophy and telangiectasias.
  36| 2. Topical Calcineurin Inhibitors: Tacrolimus 0.1% ointment applied BID for six weeks resulted in minimal therapeutic benefit and marked localized burning sensations.
  37| 3. Systemic Immunosuppressive Therapy: Oral methotrexate and cyclosporine were evaluated but contraindicated following multidisciplinary evaluation due to age-related renal insufficiency, mild hepatic enzyme elevation, and increased susceptibility to infectious complications.
  38| 
  39| VITAL SIGNS AND LABORATORY MONITORING:
  40| Vitals documented on October 18, 2026:
  41| Blood Pressure: 132/78 mmHg
  42| Pulse: 68 bpm, regular
  43| Respiratory Rate: 16 breaths/min
  44| Body Temperature: 36.8 C
  45| Weight: 54.2 kg, BMI: 23.1 kg/m2
  46| 
  47| Laboratory Findings (sampled October 12, 2026):
  48| Serum Creatinine: 1.05 mg/dL
  49| Estimated GFR: 51 mL/min/1.73m2
  50| Blood Urea Nitrogen: 22 mg/dL
  51| Serum Sodium: 140 mEq/L
  52| Serum Potassium: 4.2 mEq/L
  53| Total Bilirubin: 0.7 mg/dL
  54| AST: 38 U/L
  55| ALT: 41 U/L
  56| Absolute Eosinophil Count: 680 cells/uL (reference 15 to 500 cells/uL)
  57| Total Serum IgE: 1,420 IU/mL (reference <100 IU/mL)
  58| 
  59| COMPREHENSIVE MEDICATION RECONCILIATION:
  60| Reconciliation performed via chart review and structured telephone interview with the patient's husband, Sung-ho Kim:
  61| 1. Clobetasol propionate 0.05% ointment: Apply sparingly to affected areas BID PRN acute flares; dispensed 60 g tube.
  62| 2. Hydroxyzine hydrochloride 25 mg PO QHS PRN nocturnal itching; taking nightly.
  63| 3. Amlodipine besylate 5 mg PO daily for primary hypertension; adherence verified.
  64| 4. Rosuvastatin calcium 10 mg PO daily at bedtime for hyperlipidemia; tolerated well.
  65| 5. Cholecalciferol 1,000 IU PO daily for bone health maintenance.
  66| 6. Artificial tears (carboxymethylcellulose 0.5%) 1 drop into both eyes PRN dryness.
  67| 
  68| CLINICAL PHARMACY ASSESSMENT AND RECOMMENDATION:
  69| The clinical documentation confirms that Ayla Cevik has severe atopic dermatitis unresponsive to standard-of-care high-potency topical therapies. Systemic non-biologic immunosuppressants pose disproportionate toxicity risks. Dupilumab targeting interleukin-4 and interleukin-13 provides an established efficacy and safety profile in geriatric patients. Sung-ho Kim confirmed willingness to assist with proper refrigeration and subcutaneous injection administration at home following clinical training. Prior authorization criteria established by the patient's health plan mandate documented failure of topical therapies and contraindication to phototherapy or systemic agents. The patient cannot travel to the regional phototherapy center due to mobility limitations and lack of transportation. Her spouse also expressed concern regarding potential cutaneous infection given extensive excoriations. Initial authorization is requested for a twelve-month duration, after which objective clinical improvement will be documented using the Eczema Area and Severity Index (EASI) score prior to renewal. Complete dosing algorithms and monitoring guidelines are accessible at https://clinical-pathways.example.com/dermatology/biologics.
  70| 
  71| Reviewing Pharmacist: Rachel B. Klein, PharmD, BCPS
  72| Cedar Grove Clinic Pharmacy Services
=== END DOCUMENT ===

=== DOCUMENT fd-0273 ===
   1| Pellam Ridge Medical Center
   2| Outpatient Progress Note
   3| Department of Family Medicine
   4| 
   5| Date of Service: 03-12-2026
   6| Patient: Calvin J. Nordhoff
   7| MRN: 4472186
   8| Account #: 8821-44019
   9| Author: Thalia Vlachos, MD
  10| 
  11| Chief complaint
  12| Follow-up after a motor vehicle collision, including a suture check of a forehead laceration.
  13| 
  14| History of present illness
  15| Calvin J. Nordhoff is a 54-year-old man who lives in Haysford and works as a cabinet finisher. He was the restrained driver of a 2014 pickup, plate 8RKW-441, when another vehicle turned across his lane on 4 March 2026 near the mill road. The airbag deployed. He was evaluted that evening in the emergency department, where a forehead laceration was irrigated and closed with six simple interrupted sutures and a noncontrast head CT was read as negative for acute intracranial bleed. He was discharged the same night to the care of his wife, Samira al-Hashimi. Today the headache has eased to a dull ache behind the eyes by late afternoon, rated 3 out of 10, without vomiting, visual change, or new weakness. Neck stiffness is worse when he checks a blind spot. Sleep remains broken. He has not driven since the crash because the truck is still at the tow yard. He denies chest pain, shortness of breath, abdominal pain, and hematuria.
  16| 
  17| He takes lisinopril 20 mg by mouth each morning for hypertension and uses ibuprofen 600 mg by mouth every eight hours with food for neck pain. There is no known drug allergy. He does not smoke. Alcohol is two beers on a weekend evening.
  18| 
  19| Past medical history
  20| Hypertension. Remote right inguinal hernia repair in 2011. No diabetes, no seizure disorder, and no earlier head injury.
  21| 
  22| Medications
  23| 1. Lisinopril 20 mg by mouth daily.
  24| 2. Ibuprofen 600 mg by mouth every 8 hours with food as needed for pain.
  25| 3. Acetaminophen 500 mg by mouth up to three times daily if the headache returns, staying under 3 grams a day.
  26| 
  27| Allergies
  28| No known drug allergies.
  29| 
  30| Social history
  31| He lives with his wife. Their adult son has been driving him to appointments. He hopes to return to the shop on light duty once he can turn his head without a sharp pull. A seperate work note was requested for the shop foreman, with lifting limited to fifteen pounds for one week.
  32| 
  33| Review of systems
  34| Fatigue without fever. Mild photophobia that has cleared. Neck stiffness as above. No focal weakness, no syncope, and no vision loss. Remainder of the review is negative.
  35| 
  36| Physical examination
  37| Blood pressure 138/84 mmHg, heart rate 76, respiratory rate 14, temperature 98.2 F, oxygen saturation 98 percent on room air, weight 198 lb. Alert and oriented, in no distress. A 3.5 cm linear laceration of the left forehead is well approximated, sutures intact, no erythema or fluctuance. No Battle sign and no hemotympanum. Neck supple with tenderness over the left trapezius and rotation limited to about 60 degrees each side. Heart regular, lungs clear, abdomen soft. Cranial nerves II through XII intact. Strength 5 out of 5 throughout. Gait steady.
  38| 
  39| Assessment and plan
  40| 1. Mild concussion, improving, after the collision described above. No red-flag symptoms today. Activity as tolerated with screen time in short blocks. Return sooner for vomiting, worsening headache, confusion, or weakness. Follow-up in two weeks.
  41| 2. Forehead laceration, healing after repair with simple interrupted sutures. Sutures were removed today. Wound care: gentle washing, petrolatum, and no soaking for two more days. Call for spreading redness, drainage, or fever.
  42| 3. Cervical strain. Continue ibuprofen with food, use heat, and begin gentle range of motion. Physical therapy if neck motion is not better in two weeks. I did recomend a short course only, not daily long-term use.
  43| 4. Hypertension, acceptable today. Continue lisinopril 20 mg daily and recheck next visit.
  44| 5. If the clinic cannot reach him at the shop, his wife can be reached at (541) 555-0164 or at samira.alhashimi@example.org. After-visit instructions were sent through the portal at https://records.example.org/visit/nordhoff-0312.
  45| 
  46| He was told to stop ibuprofen if dark stools or stomach pain occured. He repeated the return precautions and will not drive until cleared.
  47| 
  48| Electronically signed by Thalia Vlachos, MD
  49| Family Medicine
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.