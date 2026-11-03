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


=== DOCUMENT fd-0149 ===
   1| Hearthstone Imaging
   2| Neuroradiology Report
   3| 
   4| Patient: Kaveri Elangovan
   5| DOB: August 2, 1933
   6| Age/sex: 92F
   7| MRN: 9022441
   8| Accession: HCT-26-33091
   9| Plan member no.: 66291-44
  10| Exam: CT head without contrast
  11| Collected: 04.03.2026
  12| Ordering: Dr. Paul Redmond
  13| Device: pacemaker serial PM8-4419-KX2
  14| Phone: +1 603 555-0174
  15| Address: 418 Willow Mercer Lane, Bellwether, NH 03244
  16| Son and historian: Mr. Curtis Glasgow
  17| 
  18| CLINICAL INDICATION
  19| Fall from standing at home, with impact to the occiput. Mr. Curtis Glasgow's
  20| account is that his mother reached for a cupboard, missed the shelf, and
  21| struck the back of her head on the counter edge. She did not lose
  22| consciousness. Glasgow Coma Scale on arrival to the scanner was 14
  23| (eyes 4, verbal 4, motor 6), with mild confusion about the date.
  24| She is anticoagulated for atrial fibrillation. The pacemaker was
  25| interrogated by the device clinic before transport and was functioning.
  26| Robin Moon, the CT technologist, confirmed the device card against the
  27| header before the scout image.
  28| 
  29| TECHNIQUE
  30| Noncontrast helical CT of the head from the foramen magnum through the
  31| vertex, 2.5 mm reconstructions in bone and soft-tissue algorithms.
  32| Dose-reduction settings were used. No iodinated contrast.
  33| 
  34| COMPARISON
  35| No comparision study is available in this archive.
  36| 
  37| FINDINGS
  38| No acutue intracranial hemorrhage. No extra-axial collection. No midline
  39| shift. The ventricles are prominent, in keeping with volume loss, and
  40| there is periventricular hypoattenuation consistent with chronic
  41| small-vessel change. No territorial hypodensity. The basal cisterns are
  42| patent. The visualized orbits and mastoids are unremarkable. Calvarial
  43| cortical irregularity at the occiput has no depressed fragment and no
  44| pneumocephalus.
  45| 
  46| Scout images include the upper chest. A left pectoral pacemaker
  47| generator is present, with two leads projecting toward the right atrium
  48| and right ventricle. A seperate note in the chart records that the
  49| generator serial is PM8-4419-KX2. No acute osseous abnormality is seen
  50| on the included spine.
  51| 
  52| Laboratory values from the same visit: hemoglobin 11.4 g/dL, platelets
  53| 188,000/uL, creatinine 0.9 mg/dL, sodium 138 mmol/L, and glucose
  54| 126 mg/dL. Blood pressure in the department was 168/78 mmHg and the
  55| paced heart rate was 62 beats per minute.
  56| 
  57| Medicines verified with the son: apixaban 5 mg PO BID, last dose held
  58| after the fall; metoprolol tartrate 25 mg PO BID; donepezil 10 mg PO
  59| QHS; acetaminophen 650 mg PO q6h PRN headache. No new contrast-related
  60| medicine was given.
  61| 
  62| The scalp soft tissues show a small crescent of swelling over the
  63| occiput, measuring about 1.8 cm, without a foreign body. The paranasal
  64| sinuses and mastoid air cells are clear. Gray-white differentiation is
  65| preserved in the cerebral hemispheres and in the posterior fossa. No
  66| hyperdense artery sign is present in the proximal middle cerebral
  67| arteries. Dental artifact limits the anterior fossa floor but does not
  68| hide a sizable bleed.
  69| 
  70| The study was discussed with the ordering clinician by telephone.
  71| Observation, a repeat neurologic check, and continued hold of the morning
  72| anticoagulant were advised from the imaging side, with final medical
  73| decisions left to the referring service. The son remained in the waiting
  74| room for the result. No additional imaging of the cervical spine was
  75| performed under this accession.
  76| 
  77| IMPRESSION
  78| 1. No acute intracranial hemorrhage, mass effect, or depressed skull
  79| fracture after a ground-level fall.
  80| 2. Cerebral volume loss and chronic small-vessel ischemic change.
  81| 3. Pacemaker generator and leads as described. Glasgow Coma Scale and
  82| the anticoagulation history were used only as clinical context for this
  83| dictation.
  84| 
  85| Interpreted by Dr. Clara Smythe-Collins, neuroradiology.
  86| End of report.
=== END DOCUMENT ===

=== DOCUMENT fd-0078 ===
   1| From: Brigid Jarrow-O'Neill
   2| To: postpartum portal pool
   3| Subject: pressure and the cuff
   4| 
   5| hi, this is the patient. i delivered at Harwick General Hospital on the 4th of July and the delivery note said the Apgar score was 8 and then 9. i am 28 and my presure is still up. my brother bakary konaté has been staying over becuase i get dizzy on the stairs. bell hargrove at the desk said to message instead of waiting on hold. i was told to keep labetalol 200 mg PO BID and to check pressures at home. this week they were 142/90 mmHg in the morning and 128/82 mmHg at night, pulse 76 beats per minute. i also take a prenatal vitamin PO daily while i am still nursing and sertraline 50 mg PO daily. please look at MRN: 5582104. seperate issue, the cuff they ordered never came. please ship a replacement to
   6| 14 Alden Lane
   7| Cedar Post, WI 53590
   8| if someone needs me by phone it is (218) 555-0173 ext. 3307. T.G. the respiratory therapist is not part of this, that was an inhaler teaching visit in a different month and i am not using an inhaler now.
   9| 
  10| From: Helen Apgar, MD
  11| To: the patient
  12| 
  13| Thank you. We have the home readings and the chart number.
  14| 
  15| Assessment: postpartum hypertension, mood symptoms on treatment. Continue labetalol 200 mg PO BID. Add nifedipine XL 30 mg PO daily if a morning reading is still at or above 140/90 mmHg after three more days. Keep the prenatal vitamin one tablet PO daily. Do not stop sertraline 50 mg PO daily all at once. Headache, vision change, or a reading at or above 160/110 mmHg needs a same-day visit.
  16| 
  17| Labs from the last draw: creatinine 0.6 mg/dL, AST 22 U/L, ALT 19 U/L, hemoglobin 11.4 g/dL, platelets 240 K/uL, urine protein negative. Clinic vitals were blood pressure 138/88 mmHg, pulse 74 beats per minute, temperature 36.7 C, respiratory rate 14 breaths per minute, oxygen saturation 99% on room air. The Apgar score in the delivery note is newborn history only and does not change the blood pressure plan. No magnesium infusion and no re-admission are planned.
  18| 
  19| The front desk can track the cuff. Use the phone line you already sent if the carrier asks for a callback. We do not need the street address repeated on this thread.
=== END DOCUMENT ===

=== DOCUMENT fd-0060 ===
   1| Care coordination note
   2| 
   3| This letter asks Pain Clinic to accept a referral for a 71-year-old woman
   4| with Parkinson disease diagnosed in 2016 and with lumbar radiculopathy
   5| that has not improved after conservative care. The referral is to Pain
   6| Clinic as a service of this health system, for consideration of a lumbar
   7| epidural steroid injection. Records from Outside Hospital include the
   8| operative note from a right knee arthroscopy and the images from a lumbar
   9| MRI. Please request those outside records before the procedure visit
  10| so the films can be compared with the local study.
  11| 
  12| Diagnoses relevant to this request are Parkinson disease, lumbar spinal
  13| stenosis with radiculopathy, osteoarthritis of the right knee, and a
  14| recent inflammatory flare of the knee. She had a right knee arthroscopy
  15| several years ago and physical therapy afterward. Walking tolerance is
  16| now limited to about one block. She describes burning pain down the right
  17| leg to the dorsum of the foot, worse with standing. There is no bowel or
  18| bladder incontinence, no saddle anesthesia, and no progressive weakness
  19| that would suggest cauda equina syndrome. Straight leg raise increases
  20| the leg pain. Strength is 5/5 at the hips and 4/5 at the right ankle
  21| dorsiflexion. Resting tremor and mild bradikinesia are present and are
  22| followed by neurology.
  23| 
  24| Current medications are carbidopa-levodopa 25/100 mg PO TID, rasagiline
  25| 1 mg PO daily, Lyrica 75 mg PO BID for neuropathic pain, acetaminophen
  26| 650 mg PO q6h PRN pain, and a short prednisone taper of 40/30/20/10 mg
  27| PO daily, each dose level for three days, for the knee flare. Generic
  28| pregabalin may be substituted for Lyrica if the strength is the same.
  29| Please do not stop carbidopa-levodopa before the procedure without
  30| speaking with neurology. Aspirin 81 mg PO daily is held only if the
  31| injectionist requests it. She does not take an anticoagulant. The
  32| covering pharmacist reconciled this list with the pill bottles recently
  33| and found one extra bottle of acetaminophen.
  34| 
  35| Laboratory results drawn at the clinic: white blood cell count 7.2 K/uL,
  36| hemoglobin 12.8 g/dL, platelets 214 K/uL, creatinine 0.8 mg/dL, eGFR 81
  37| mL/min/1.73 m2, CRP 6.1 mg/L, and hemoglobin A1c 6.2%. Vitals at that
  38| visit were blood pressure 136/78 mmHg, heart rate 64 beats per minute,
  39| respiratory rate 16 breaths per minute, oxygen saturation 97% on room
  40| air, temperature 36.6 C, and weight 68 kg. The knee was warm but not red.
  41| There is no fever and no suspicion of septic arthritis.
  42| 
  43| The procedure requested is a lumbar epidural steroid injection under
  44| flouroscopy, with a possible right L4-L5 transforaminal approach if the
  45| MRI supports it. Diagnoses to link to the procedure are lumbar
  46| radiculopathy and lumbar spinal stenosis. If Pain Clinic prefers a medial
  47| branch block first, that alternative is acceptable to the referring
  48| clinician. The patient has already completed a course of physical therapy
  49| and a home exercise program. She uses a single-point cane. Her daughter
  50| drives her to visits and can stay for teaching.
  51| 
  52| Falls have occured twice this season, both without head injury and
  53| without fracture. Neurology believes the falls relate to shuffling gait
  54| rather than to orthostasis. Blood pressure does not drop when she stands.
  55| She should bring a current list of evening doses, because
  56| carbidopa-levodopa timing is easy to confuse on a procedure morning when
  57| she may be told to arrive without eating. If the service needs a caregiver
  58| present for consent teaching, her daughter is willing. No interpreter is
  59| required.
  60| 
  61| Please send the patient instructions that mention holding further
  62| prednisone if the taper has already finished, continuing Lyrica 75 mg PO
  63| BID the morning of the procedure unless told otherwise, and arranging a
  64| ride home. She should call the clinic for new weakness, loss of bladder
  65| control, headache with fever, or symptoms of very high glucose while on
  66| prednisone. We can send a seperate summary of the neurology notes if Pain
  67| Clinic needs them. Thank you for reviewing this referral. A reply with
  68| the first available procedure day is enough to move scheduling forward.
  69| The referring office will complete any form the service requires.
  70| 
  71| Care coordination
  72| On behalf of the referring clinician
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.