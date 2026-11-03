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


=== DOCUMENT fd-0181 ===
   1| St. Leander Medical Center
   2| 800 HARBOR STREET, MOSSBRIDGE, ID 83477
   3| Outpatient Progress Note
   4| Hematology and General Medicine
   5| 
   6| Patient: Ida M. Prestwick
   7| Age: 93
   8| DOB: 8 June 1932
   9| MRN: 6601943
  10| SSN: 000-28-4419
  11| Account: 7031-4482-16
  12| Date of Service: March 18, 2026
  13| Author: Neil Braddock, MD
  14| Home: 15 Quarry Lane, Mossbridge, ID 83477
  15| 
  16| Chief complaint
  17| Follow-up after excisional biopsy of a right cervical lymph node, including review of the written report.
  18| 
  19| History of present illness
  20| Ida M. Prestwick is seen with her daughter for results and a wound check. She lives in Mossbridge. About five weeks before the biopsy she noticed a firm lump below the right jaw while washing her face. It was not painful. She was evaluated in the emergency department on 2/11/2026, where examination found a mobile node and no airway concern. A contrast CT of the neck and chest showed the dominant right level II node and no bulky mediastinal disease. Excisional biopsy of that node was performed on 4 March 2026. Pain at the incision was moderate for three days and is now a tug when she turns her head. She finished no antibiotic. Swallowing has been normal, and her voice did not change. She slept in a recliner for four nights and is back in her own bed. There has been no drainage on the pillow and no temperature she or her daughter could measure since leaving the procedure area. She is more worried about the word lymphoma than about the scar, and most of today's visit was spent on that fear. She had occassional night sweats earlier in the winter, none since the biopsy, and she denies fever and unintentional weight loss. Appetite is back to usual. The two adjacent nodes were measured seperately on the CT and were both under a centimeter.
  21| 
  22| She has a remote history of Bell palsy on the left, with full recovery and no recurrence. Hypertension has been quiet. She does not drive. Her daughter drove her today, and the sedan plate 2MPL-774 was written on the transport line at registration.
  23| 
  24| Past medical history
  25| Bell palsy, left, resolved. Hypertension. Osteoarthritis of the hands. Hypothyroidism. Removal of a cataract from the right eye several years ago. No cancer. No tuberculosis. No rheumatoid arthritis.
  26| 
  27| Medications
  28| 1. Amlodipine 5 mg by mouth daily, Rx 8831204.
  29| 2. Levothyroxine 75 mcg by mouth each morning.
  30| 3. Acetaminophen 650 mg by mouth as needed, rarely used.
  31| 4. Cholecalciferol 1000 units by mouth daily.
  32| 
  33| Allergies
  34| No known drug allergies. Iodine contrast at the CT caused only a warm feeling, which was expected, and no rash.
  35| 
  36| Social history
  37| She lives in a single-level house with her daughter, Yasemin Kortan, who manages the pillbox and the calendar. She never smoked. Alcohol is none. She walks daily in the driveway with a cane she rarely leans on. She still cooks simple meals and manages her own bath. Dressing is independent. She does not climb stairs at home. Hearing is reduced on the right, and her daughter repeats questions when the room is noisy. There is no home oxygen and no CPAP. Advance directives are already on file, and she confirmed today that her daughter may speak with us about results. Daughter's phone is (208) 555-0155. The clinic direct line is 208.555.0108.
  38| 
  39| Family history
  40| Her sister died of a stroke. No family history of lymphoma was known to the daughter.
  41| 
  42| Review of systems
  43| No current fever, no drenching sweats, no pruritus, no cough, no chest pain, no abdominal pain, no change in bowel habit, no focal weakness, and no new facial droop. Sleep is fair. The remainder is negative.
  44| 
  45| Physical examination
  46| Blood pressure 146/78 mmHg, heart rate 74, respiratory rate 16, temperature 97.6 F, oxygen saturation 97 percent on room air, weight 54 kg. She is alert, oriented, and pleasant. There is no scleral icterus and no petechiae. Prestwick's incision along the right upper neck is a 4 cm line, dry, closed, with steri-strips off and no erythema, fluctuance, or drainage. No facial asymmetry and no residual weakness from the old palsy. The mouth opens fully. A small shotty node remains low in the right neck, soft and mobile. The left neck, axillae, and groins are quiet. Lungs clear. Heart regular. Abdomen soft without a palpable spleen. No leg edema.
  47| 
  48| Pathology and studies
  49| Before the slides were back, the working differential included a dental source, metastatic carcinoma from a head and neck primary, and lymphoma. The oral exam and the chest images did not show a mucosal lesion or a lung mass. Lactate dehydrogenase was not elevated on the pre-procedure panel, at 180 U/L, and the metabolic panel that day showed creatinine 0.8 mg/dL, which is why contrast was given without a renal hold. Those results were not repeated. The outside report was recieved yesterday and scanned into the chart. Excisional biopsy shows reactive follicular hyperplasia with preserved architecture. Immunohistochemistry does not support lymphoma. There is no Hodgkin lymphoma. Flow cytometry was negative for a clonal population. Caroline Hodgkin reviewed the slides this week and agrees with that reading. Her addendum is filed with the report. The blood count from the biopsy day showed hemoglobin 13.1 g/dL, white cells 6.2 x 10 to the 9 per liter, and platelets 210,000/microliter. No laboratories were drawn today.
  50| 
  51| Assessment and plan
  52| 1. Right cervical lymphadenopathy, status post excisional biopsy, with pathology showing reactive follicular hyperplasia and no lymphoma. No chemotherapy, no radiation, and no further node removal. Observe. Return sooner for a rapidly growing mass, drenching sweats, fever, or unexplained weight loss. A routine visit is set in three months.
  53| 2. Healing surgical incision. Wound care was reviewed. She may shower. No ointment is required while the skin stays closed. Call for redness, drainage, or opening. She may walk as usual and should avoid lifting more than ten pounds for another week, mostly so the neck skin is not tugged. Acetaminophen is enough for the residual soreness. A second CT is not scheduled. We will examine the neck again at three months and order imaging only for a new or enlarging node, persistent drenching sweats, or weight loss over five pounds. Her daughter will call if the incision opens.
  54| 3. Remote Bell palsy, no residual deficit on today's cranial nerve exam. No action.
  55| 4. Hypertension and hypothyroidism. Continue amlodipine and levothyroxine without change. Recheck the pressure at the next visit.
  56| 5. Transport and paperwork. The account number above is the one billing should use for the biopsy claim. Her daughter has a copy of the instructions.
  57| 
  58| She understood that the result is benign and asked that we avoid repeating the scan unless a new node appears. The plan was restated and she agreed.
  59| 
  60| Electronically signed by Neil Braddock, MD
  61| General Medicine
=== END DOCUMENT ===

=== DOCUMENT fd-0163 ===
   1| TRANSCRIPT OF CLINICAL NURSE TRIAGE CALL
   2| SERVICE: Neurology
   3| CROSS-REFERENCE: Outside Hospital records received
   4| PATIENT PROFILE: 74-year-old female
   5| CALL PARTICIPANTS: Triage Nurse, Patient's Daughter
   6| 
   7| [Call Audio Recording Begins]
   8| 
   9| Triage Nurse: Neurology triage line, this is the triage nurse. How can I help you today?
  10| 
  11| Patient's Daughter: Hello, uh, yes, good morning. I'm calling about my mother. She is, uh, she is a 74-year-old patient seen in your movement disorder clinic, and I'm calling because her tremors and neuropathic pain have, uh, have gotten significantly worse over the past couple of weeks. We also received her consultation notes from Outside Hospital where she had an admission last year, and they suggested we contact her regular clinic to adjust her medicaiton.
  12| 
  13| Triage Nurse: Okay, I have her electronic health record pulled up on my screen. I see she was diagnosed with Parkinson disease back in 2021, and she also has documented diabetic peripheral neuropathy and degenerative lumbar canal stenosis. Can you tell me what symptoms she is experiencing right now?
  14| 
  15| Patient's Daughter: Well, um, her resting tremor in the right hand has become much more pronounced, and she describes a severe burning, shooting pain in both lower extremities, from the calves down into the feet. She says the pain is an 8 out of 10. She also had a recent flare of inflammatory radiculopathy. The covering physician at Outside Hospital started her on a steroid burst with prednisone 40/30/20/10 mg tapering down by 10 mg every four days. She completed that taper last week, but as soon as the prednisone finished, the neuropathic burning rebounded with a vengeance.
  16| 
  17| Triage Nurse: I see the discharge summary from Outside Hospital in our document viewer. Let me reivew her current medication list. For her Parkinson disease, she is taking carbidopa-levodopa 25/100 mg PO TID. And for the peripheral neuropathy, she was on gabapentin 300 mg PO TID, but according to the outside note, they transitioned her to brand Lyrica 75 mg PO BID. Has she started the Lyrica yet?
  18| 
  19| Patient's Daughter: Yes, she began taking the Lyrica 75 mg PO BID four days ago. It seems to take the edge off slightly, but she complains of marked grogginess in the morning, and her walking is unsteady. We checked her vital signs this morning using her automated home cuff. Her blood pressure was 118/72 mmHg, heart rate was 64 bpm, respiratory rate was 16 breaths per minute, and her fingerstick blood glucose was 142 mg/dL.
  20| 
  21| Triage Nurse: Those vital signs are stable, but the somnolence and unsteady gait can increase her fall risk, especially given her underlying motor fluctuations. Did Outside Hospital obtain any updated neuroimaging or laboratory work during her stay?
  22| 
  23| Patient's Daughter: Yes, they did a lumbar spine magnetic resonance imaging without contrast, which showed moderate L4-L5 spinal stenosis with facet arthropathy, but no acute cord compression. Her recent labs showed serum creatinine 1.1 mg/dL, blood urea nitrogen 18 mg/dL, serum potassium 4.2 mEq/L, and hemoglobin A1c 6.8%. Her hepatic function panel was completely within normal limits, with AST 22 U/L and ALT 19 U/L.
  24| 
  25| Triage Nurse: That is very helpful. Because her neuropathic pain remains refractory and she had excessive sedation from titration, she may benefit from an interdisciplinary referral to Pain Clinic for targeted lumbar epidural steroid injection evaluation. Additionally, looking at her skin assessment from the home health report, she has a stage 2 sacral pressure injury that requires specialized dressing management, so I am submitting an urgent referral to Wound Care as well.
  26| 
  27| Patient's Daughter: That would be wonderful. The home health nurse said the sacral area has minimal serosanguinous drainage and no cellulitis, but Wound Care would definitely know the best barrier dressings. What should we do about her morning grogginess and the Lyrica?
  28| 
  29| Triage Nurse: I will send a clinical priority message to the attending neurologist. The plan will likely be to shift her dosing schedule so she takes Lyrica 75 mg PO at bedtime only for the next five days to allow her body to acclimate, rather than taking it twice daily. For her Parkinson disease motor symtpoms, the neurologist may evaluate whether adjusting the carbidopa-levodopa timing or adding an adjunct dopamine agonist is indicated. Please monitor her closely when she mobilizes, ensure her four-wheel walker is always within arm's reach, and assist her with transfers.
  30| 
  31| Patient's Daughter: Understood. We will keep her walker right by her chair, assist with walking, and wait for the pharmacy update regarding shifting the Lyrica dose to nighttime.
  32| 
  33| Triage Nurse: Excellent. If she experiences any acute worsening of weakness, inability to bear weight, bowel or bladder incontinence, or acute confusion, take her to the nearest emergency department right away. Otherwise, our clinical coordinator will call you back this afternoon once the neurologist reviews the chart.
  34| 
  35| Patient's Daughter: Thank you so much for your thorough help.
  36| 
  37| Triage Nurse: You are very welcome. Take care.
  38| 
  39| [Call Audio Recording Concluded]
=== END DOCUMENT ===

=== DOCUMENT fd-0271 ===
   1| Date of Service: April 9, 2026
   2| Patient Name: TADESSE-HAILE, BERHANE
   3| Plan Group Number: GRP-7710394
   4| Provider: Dr. Thomas Fletcher
   5| Subject: Follow-up on asthma maintenance therapy and spirometry paperwork
   6| 
   7| Message 1
   8| From: berhane
   9| Sent: April 9, 2026 09:14 AM
  10| To: Dr. Thomas Fletcher
  11| 
  12| dear dr. fletcher,
  13| i am writing to follow up on my persistent nocturnal cough and shortness of breath after completing the recent taper. i have been taking my Symbicort 160/4.5 mcg two inhalations BID consistently and using albuterol HFA 90 mcg two puffs every four to six hours as needed for wheezing. over the past four days, i needed the rescue inhaler twice each night, and my peak expiratory flow readings dropped to 380 L/min, down from my baseline of 520 L/min. my caregiver Nancy Wheeler noticed i was wheezing heavily while climbing stairs yesterday afternoon. my pulse oximetry at rest was 95% on room air and pulse was 84 bpm.
  14| 
  15| i also need assistance with coordination for pulmonary function testing. i work in Tukwila now and the regional occupational health suite nearby agreed to perform the plethysmography and pre/post bronchodilator spirometry. they stated they can process the intake today if your office can transmit the order form, chart notes, and authorization directly to their reception desk at Fax: (206) 555-0162. please let me know if you would like me to start a burst of oral prednisone or adjust the controller dosage before the test. thank you for your help.
  16| 
  17| Message 2
  18| From: Dr. Thomas Fletcher
  19| Sent: April 9, 2026 01:30 PM
  20| To: TADESSE-HAILE, BERHANE
  21| 
  22| Dear Mr. Tadesse-Haile,
  23| 
  24| Thank you for contacting our clinic with this update. Given the drop in your peak flow from 520 to 380 L/min and frequent nighttime rescue inhaler use, your asthma is currently not adequately controlled. We will initiate a short oral steroid taper: please take prednisone 40 mg PO daily for five days, then discontinue. Continue Symbicort 160/4.5 mcg two inhalations BID, rinsing your mouth thoroughly after each dose, and keep albuterol available for acute dyspnea.
  25| 
  26| My medical assistant has sent the clinical records and spirometry orders to the testing suite at Fax: (206) 555-0162, including your coverage verification under Plan Group Number: GRP-7710394. Please have Nancy Wheeler contact our clinic or go to urgent care if your resting oxygen saturation falls below 92% or if your breathing does not improve within 48 hours of starting prednisone. We will review your spirometry curves during our scheduled video visit on April 23, 2026.
  27| 
  28| Sincerely,
  29| Thomas Fletcher, MD
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.