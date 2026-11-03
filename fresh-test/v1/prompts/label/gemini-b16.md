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


=== DOCUMENT fd-0026 ===
   1| HORIZON GERIATRIC HEALTH CENTER
   2| INTERDISCIPLINARY CARE PLAN NOTICE
   3| 
   4| Date of Review: 04.03.2026
   5| Patient: Mrs. Dorothy Fletcher (92F)
   6| Designated Representative: Mr. Sean O'Donnell-Kelly
   7| 
   8| Dear Mrs. Fletcher,
   9| 
  10| This administrative letter confirms the updated outpatient care plan formulated during your geriatric clinical review on 04.03.2026. Following consultation between Dr. Rodrigo Peixoto and your son-in-law, Mr. Sean O'Donnell-Kelly, your daily pharmacotherapy has been adjusted to optimize cognitive stability while minimizing anticholinergic burden.
  11| 
  12| Your current reconciled medication regimen is confirmed as follows:
  13| - donepezil 10 mg PO daily at bedtime
  14| - memantine 10 mg PO BID with meals
  15| - levothyroxine 50 mcg PO daily on an empty stomach
  16| - cholecalciferol 1,000 IU PO daily
  17| 
  18| Prior authorization paperwork for your maintenance therapies has been submitted to your health plan. Please ensure that serum electrolytes and renal function panels are drawn within four weeks at any licensed outpatient laboratory.
  19| 
  20| Should you or your family require assistance with prescription home delivery or care coordination, please contact our intake desk at (206) 555-0173 ext. 402. Inquiries regarding social work navigation may be directed to our clinic coordinator, luciana tavares, via our secure administrative portal.
  21| 
  22| Sincerely,
  23| 
  24| Rodrigo Peixoto, MD
  25| Horizon Geriatric Health Center
=== END DOCUMENT ===

=== DOCUMENT fd-0292 ===
   1| Red Cedar Clinic
   2| Outpatient Progress Note
   3| 
   4| Patient: RIVERS CALDERÓN
   5| DOB: 14 May 1922
   6| Date of Service: 4 Sep 2026
   7| 
   8| Chief complaint
   9| A slow gait, urinary hesitancy, and a check of blood pressure after a dizzy spell.
  10| 
  11| History of present illness
  12| Rivers Calderón is a 104-year-old man who still tells his own story if given a little time. Present at the visit: Hasmik Davtyan, his wife; Garen Avagyan, his brother; and Love O'Neill-McCarthy, MD. He felt lightheaded one morning last week when he stood up, sat back down, and did not fall. No chest pain, no palpitations, and no focal weakness came with it. Urinary hesitancy is longstanding, with a slower stream and no burning. The stream is weaker than it was five years ago, but he is not incontinent and he has no fever or back pain. He is up twice at night. Bowel habits are regular with prunes, and there is no rectal bleeding. Gait is slower over the past year, and he uses a cane in the hall. He has not driven in several years.
  13| 
  14| The old driver license D5521-8834-02 stays in the wallet Hasmik Davtyan brings, only so the desk can match him. Appetite is steady and weight has not dropped. He has no fever and no cough. Hearing loss makes a crowded room hard, so this visit was kept quiet and one person spoke at a time. He still enjoys the radio news and a slow walk to the mailbox with a hand on the rail.
  15| 
  16| A right cataract extraction years ago left him able to read large print. A forearm basal cell carcinoma was treated with excision, and the scar is soft. He acheived that recovery without complication.
  17| 
  18| Past medical history
  19| Hypertension. Osteoarthritis of both hips. Benign prostatic hyperplasia. Hearing loss. Remote open cholecystectomy. No diabetes, no stroke, and no Parkinson disease.
  20| 
  21| Medications
  22| Amlodipine 5 mg PO daily
  23| Tamsulosin 0.4 mg PO at bedtime
  24| Acetaminophen 650 mg PO BID PRN pain
  25| Artificial tears, one drop each eye BID
  26| No anticoagulant and no sedating antihistamine.
  27| 
  28| Allergies
  29| Sulfa antibiotics, rash.
  30| 
  31| Social history
  32| He lives with his wife in a single-level house. Garen Avagyan works in Alhambra and visits on Saturdays to walk the block with him. A grab bar is already in the bathroom. He does not smoke or drink.
  33| 
  34| Examination
  35| Blood pressure 138/64 mmHg seated and 130/62 mmHg standing, pulse 72 beats per minute, respirations 16 per minute, afebrile, weight 58.0 kg. Alert, hearing better on the right, speech clear. Lungs clear, heart regular, no murmur. Abdomen soft with an old cholecystectomy scar. Hips have limited rotation without warmth. Ankles are without edema. Prostate is not examined today. Gait with a cane is slow, base is acceptable, and he did not stumble. Neurologic exam shows no rest tremor and no rigidity. Cranial nerves are grossly intact aside from the hearing loss, and strength is 5 out of 5 in both arms. There is no facial droop to suggest Bell palsy.
  36| 
  37| Labs
  38| Creatinine 1.05 mg/dL, potassium 4.0 mmol/L, hemoglobin 13.1 g/dL, PSA 2.4 ng/mL, unchanged. Results are also listed at https://portal.example.org/records/calderon-labs for the family to read.
  39| 
  40| Assessment and plan
  41| 1. Hypertension with a brief postural symptom and no measured orthostasis of consequence. Amlodipine 5 mg PO daily stays, because the standing pressure is still adequate and the dizzy spell did not repeat. I advised him to pause at the edge of the bed for a few breaths before standing, which is the change most likely to prevent a fall. If lightheadedness returns, his wife will check a seated pressure and call rather than wait a month.
  42| 2. Benign prostatic hyperplasia with hesitancy. Tamsulosin 0.4 mg PO at bedtime continues. Tamsulosin can drop the pressure on standing, but today's numbers do not show a meaningful fall, so the dose stays, with a reminder to sit if he feels lightheaded. He will folow up sooner for inability to void, fever, or blood in the urine. PSA remains in a range that does not, by itself, push me toward a biopsy at his age, and he does not want cancer screening that would not change his care.
  43| 3. Osteoarthritis and fall risk. Acetaminophen 650 mg PO BID as needed is enough. No steroid injection and no procedure were offered today. The prior cataract extraction and the excision of basal cell carcinoma need no new action. The cholecystectomy scar is quiet and there is no hernia.
  44| 4. Medications were seperated into a morning cup and a bedtime cup by his wife so the tamsulosin is not taken at breakfast. Love O'Neill-McCarthy initialed the instruction as L.O. and reviewed the cups with both of them.
  45| 
  46| A shingles vaccine was discussed and he accepted it, to be given at the pharmacy visit already on his calendar. No new medicine was added, which is deliberate. Return in three months, or sooner for a fall, chest pain, inability to pass urine, or blood in the stool.
  47| 
  48| Address: 418 Wisteria Drive, Glendale, CA 91205.
  49| Phone (818) 555–0133.
  50| 
  51| Electronically signed
  52| Love O'Neill-McCarthy, MD
  53| Geriatrics
  54| 
  55| Author: Love O'Neill-McCarthy, MD
=== END DOCUMENT ===

=== DOCUMENT fd-0281 ===
   1| REFERRAL CONSULTATION SUMMARY AND BENEFIT NOTICE
   2| Date of Service: 09/24/2026
   3| Patient: Mr. Arthur Bishop
   4| SSN: 984-21-6503
   5| Mailing Address: PO Box 842, Greenfield, MA 01301
   6| 
   7| Dear Mr. Bishop,
   8| 
   9| This letter summarizes the administrative and clinical findings from
  10| your specialty consultation conducted on 09/24/2026. You were referred
  11| to our regional clinic by Dr. Katherine
  12| Olmstead for comprehensive diagnostic assessment following persistent
  13| fatigue, migratory arthralgias, and cognitive clouding.
  14| 
  15| During the intake interview, your sister, Mrs. Evelyn Lyme, provided
  16| corroborating collateral history regarding symptom onset following an
  17| outdoor excursion earlier this summer. Laboratory evalutaion was
  18| recieved and reveiwed in detail. Initial screening revealed elevated
  19| erythrocyte sedimentation rate at 38 mm/hr and C-reactive protein at
  20| 14.2 mg/L. Serologic testing via enzyme-linked immunosorbent assay
  21| followed by confirmatory Western blot antibody testing confirmed early
  22| disseminated Lyme disease. Cerebrospinal fluid analysis demonstrated no
  23| intrathecal antibody synthesis, ruling out active neuroborreliosis.
  24| 
  25| Your treatment plan has been finalized. Oral doxycycline 100 mg PO BID
  26| was prescribed for twenty-one consecutive days. You are advised to take
  27| this medication with a full glass of water and avoid concurrent calcium
  28| or iron supplements. In accordance with your benefit structure, prior
  29| authorization for follow-up inflammatory panel testing has been
  30| submitted to your health plan.
  31| 
  32| Should you experience persistent cephalalgia, visual blurring, or joint
  33| effusions, an immediate reassessment will be arranged. If you need to
  34| update your billing records or mailing preferences, please notify our
  35| intake desk in writing at the postal address indicated above.
  36| 
  37| Sincerely,
  38| 
  39| Dr. William Vance, MD
  40| Staff Neurologist, Valley Neurosciences Institute
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.