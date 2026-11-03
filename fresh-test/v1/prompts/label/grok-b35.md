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


=== DOCUMENT fd-0206 ===
   1| INPATIENT CONSULTATION REPORT
   2| DIVISION OF RHEUMATOLOGY AND CLINICAL IMMUNOLOGY
   3| Author: Fellow in Rheumatology and Clinical Immunology
   4| Supervising Attending: Attending Physician, Division of Rheumatology
   5| 
   6| REASON FOR CONSULTATION:
   7| Evaluation and inpatient management of acute polyarticular rheumatoid arthritis flare, corticosteroid taper planning, and optimization of neuropathic pain.
   8| 
   9| HISTORY OF PRESENT ILLNESS:
  10| The patient is a 56-year-old female with seropositive rheumatoid arthritis diagnosed in 2017, type 2 diabetes mellitus diagnosed in 2019, essential hypertension, and an episode of right-sided Bell palsy in 2021 that resolved completely. She was admitted to the inpatient medicine service three days ago following a severe multi-joint flare involving symmetrical swelling, warmth, and morning stiffness in bilateral wrists, metacarpophalangeal joints, proximal interphalangeal joints, and the right knee.
  11| 
  12| The flare began four weeks ago after a lapse in her baseline subcutaneous biologic regimen. Prior to admission, she was maintained on certolizumab pegol 200 mg subcutaneously every 2/3 weeks alongside oral hydroxychloroquine. Historical records and plain radiographs forwarded from Outside Hospital confirm symmetrical marginal erosions of the metacarpal heads and carpal joint space narrowing first identified in 2023.
  13| 
  14| On hospital day 1, she underwent diagnostic and therapeutic right knee arthrocentesis, yielding 38 mL of cloudy yellow synovial fluid. Synovial fluid analysis revealed a total nucleated cell count of 18,400 /uL with 78% polymorphonuclear leukocytes, negative Gram stain, and no birefringent crystals under polarizing microscopy, confirming inflammatory synovitis without septic arthritis or crystalline disease. Bacterial cultures show no growth.
  15| 
  16| Over the past 48 hours, the patient has reported burning dysesthesias over bilateral feet in a stocking pattern. Her 32-year-old daughter at the bedside confirms progressive nocturnal burning over six months and steroid-induced glucose elevations. The primary inpatient team requested consultation for corticosteroid tapering, neuropathic pain management, and specialty referrals to Diabetes Center and Pain Clinic.
  17| 
  18| PAST MEDICAL HISTORY:
  19| 1. Seropositive rheumatoid arthritis, diagnosed in 2017.
  20| 2. Type 2 diabetes mellitus, diagnosed in 2019.
  21| 3. Essential hypertension, diagnosed in 2018.
  22| 4. Right peripheral facial paralysis (Bell palsy), diagnosed in 2021, resolved.
  23| 5. Diabetic peripheral neuropathy, diagnosed in 2023.
  24| 
  25| MEDICATIONS PRIOR TO ADMISSION:
  26| 1. Certolizumab pegol 200 mg subcutaneously every 2/3 weeks (held).
  27| 2. Hydroxychloroquine sulfate 200 mg PO BID.
  28| 3. Lyrica 75 mg PO BID for neuropathic pain.
  29| 4. Allegra 180 mg PO daily for allergic rhinitis.
  30| 5. Metformin hydrochloride 1000 mg PO BID.
  31| 6. Lisinopril 20 mg PO daily.
  32| 
  33| PHYSICAL EXAMINATION:
  34| Vital Signs:
  35| Temperature: 98.6 F (37.0 C)
  36| Blood Pressure: 132/80 mmHg
  37| Pulse: 76 beats per minute, regular
  38| Respiratory Rate: 16 breaths per minute
  39| Oxygen Saturation: 98% on ambient air
  40| 
  41| General: 56-year-old female, alert, oriented, in no acute distress.
  42| HEENT: Normocephalic. Moist oral mucosa. Facial movements symmetric without residual Bell palsy.
  43| Cardiovascular: Regular rhythm, normal S1 and S2. Pulses 2+ bilaterally.
  44| Lungs: Clear to auscultation bilaterally without wheezing or crackles.
  45| Abdomen: Soft, non-tender, non-distended.
  46| Musculoskeletal: Symmetrical synovial swelling and tenderness of bilateral radiocarpal and MCP joints. Right knee with trace effusion and mild warmth without erythema, improved post-arthrocentesis.
  47| Neurological: Light touch and pinprick reduced in stocking distribution distal to mid-calves. Bilateral plantar allodynia.
  48| Vascular: Calves soft and non-tender. Wells score for deep vein thrombosis calculated at 0 points.
  49| 
  50| LABORATORY AND DIAGNOSTIC DATA:
  51| Serum Chemistry and Inflammatory Markers:
  52| Sodium: 139 mmol/L, Potassium: 4.1 mmol/L, Chloride: 102 mmol/L, Bicarbonate: 25 mmol/L, BUN: 16 mg/dL, Creatinine: 0.82 mg/dL, Glucose: 164 mg/dL.
  53| C-reactive protein: 24.6 mg/L, ESR: 48 mm/h, Rheumatoid Factor: 84 IU/mL, Anti-CCP: > 250 U/mL.
  54| Synovial fluid: Total nucleated cells 18,400 /uL, neutrophils 78%, crystals negative, Gram stain negative.
  55| Duplex ultrasound: Bilateral lower extremities negative for deep vein thrombosis.
  56| 
  57| ASSESSMENT:
  58| 1. Rheumatoid arthritis flare: Polyarticular inflammatory synovitis improving after corticosteroid therapy and right knee arthrocentesis; synovial analysis negative for crystals and infection.
  59| 2. Diabetic peripheral neuropathy: Stocking sensory deficit and allodynia.
  60| 3. Type 2 diabetes mellitus: Steroid-associated hyperglycemia.
  61| 4. History of Bell palsy: Resolved without residual deficit.
  62| 5. Low DVT probability: Wells score 0 points and duplex ultrasound negative.
  63| 
  64| PLAN AND RECOMMENDATIONS:
  65| 1. Rheumatoid Arthritis Management and Corticosteroid Taper:
  66| - Initiate oral prednisone 40/30/20/10 mg daily taper: administer prednisone 40 mg PO daily for 7 days, 30 mg PO daily for 7 days, 20 mg PO daily for 7 days, then 10 mg PO daily for 7 days, followed by 5 mg PO daily maintenance until outpatient rheumatology re-evaluation.
  67| - Continue hydroxychloroquine sulfate 200 mg PO BID.
  68| - Maintain hold on certolizumab pegol until completion of prednisone taper; resume certolizumab pegol 200 mg subcutaneously every 2/3 weeks under outpatient rheumatology supervision.
  69| - Pantoprazole sodium 40 mg PO daily for gastric protection.
  70| 2. Neuropathic Pain Optimization:
  71| - Increase Lyrica from 75 mg PO BID to 150 mg PO BID.
  72| - Continue Allegra 180 mg PO daily.
  73| - Outpatient referral submitted to Pain Clinic for multidisciplinary pain rehabilitation.
  74| 3. Metabolic Management:
  75| - Outpatient referral to Diabetes Center for glycemic titration and education during steroid taper.
  76| 4. Venous Thromboembolism Prophylaxis:
  77| - Enoxaparin sodium 40 mg subcutaneous once daily while inpatient; discontinue at discharge given ambulation and Wells score of 0.
  78| 5. Follow-Up:
  79| - Outpatient follow-up with Rheumatology in 3 weeks, Diabetes Center in 2 weeks, and Pain Clinic within 4 weeks. If pressure injury occurs, referral to Wound Care will be arranged. Records from Outside Hospital have been archived.
  80| 
  81| Care Team Signoff:
  82| Electronically signed by:
  83| Fellow in Rheumatology and Clinical Immunology
  84| Attending Physician, Division of Rheumatology and Internal Medicine
=== END DOCUMENT ===

=== DOCUMENT fd-0269 ===
   1| From: Fiona Egan-O'Rourke
   2| To: neurology portal
   3| Date of Service: Mar 4 2026
   4| Subject: face droop and the eye
   5| 
   6| hi this is fiona egan-o'rourke. since yesterday the left side of my face feels flat and my eye will not close all the way. i have occassional tearing and the taste on the left side of my tongue is off. i can still lift both arms and my speech is clear, so i do not think this is a stroke, but i am scared. i am 41 and this has never happened before. i am not pregnant. i take no daily medicines other than the new ones they just called in. chewing feels odd and loud sounds bother the left ear. Bramble Hollow Clinic told me to start prednisone and an antiviral and to message the portal if the droop got worse. i definately want someone to look at the plan. home blood pressure was 128/76 mmHg, pulse 82 beats per minute, and i had no fever. glucose on the home meter was 104 mg/dL. please copy my sister Dorothy Keene, Narek Avagyan, and Lilit Barseghyan. she can recieve a call at (415) 555-0188 if you cannot reach me. the portal also flagged a sign-in from 203.0.113.42 which was me on the library computer, not a stranger. my account code on the printout is 7104 2281 63. mail any eye shield to 1842 Cinder Lane, Brindle Ford, OR 97035.
   7| 
   8| From: Narek Avagyan, MD
   9| To: the patient
  10| 
  11| Thank you for the detail, and for saying the arms and speech are normal. That history fits Bell palsy more than a brain event, as long as the weakness stays in the face. We still want a same-day exam if the face droop spreads, if you get a severe headache, or if an arm or a leg becomes weak.
  12| 
  13| Medications: prednisone 50 mg PO daily for 10 days, then stop. Do not taper this short course on your own and do not stretch it. Valacyclovir 1 g PO TID for 7 days. Artificial tears, 1 drop in the left eye every 2 hours while awake, and lubricating ointment in the left eye at bedtime. Tape the eyelid shut at night if it will not close. Keep the eye shield on when you are outdoors. Protect the cornea until the eyelid closes on its own, which often takes a few weeks.
  14| 
  15| The account code with the spaces and the library sign-in can stay as you wrote them. We do not need them sent again. Your sister may join a call, and the clinicians already named can read this thread.
  16| 
  17| Vitals you sent are reassuring. If we draw labs at the visit we will check a basic metabolic panel and a glucose, because prednisone can push sugar up even when a fasting value was 104 mg/dL. No MRI and no lumbar puncture are planned unless the exam finds a second neurologic sign. Diagnosis for this message: left Bell palsy. Write back for a rash in the ear, worsening pain, or vision change.
=== END DOCUMENT ===

=== DOCUMENT fd-0121 ===
   1| Subject: Follow-up visit and medication check
   2| 
   3| Hello,
   4| 
   5| This message confirms a follow-up visit for Eun-Kyung Vahn, 94F, on 17.06.2026. Her niece day padmanabhan usually arranges the ride and sits in on medication teaching. If that plan falls through, Mr. Walter Kline at the scheduling desk can offer another morning. We already left a voicemail and the mailbox was full.
   6| 
   7| She has been more short of breath on the walk from the bedroom, and her niece reports ankle swelling by evening. Please note whether the swelling is new and whether she has missed any doses. Her appetite has been fair. Please tell us if the swelling reaches the knee or if she wakes short of breath at night.
   8| 
   9| Please keep the current regimen until the visit, unless bleeding, a fall, or fainting occurs: apixaban 2.5 mg PO BID, metoprolol succinate 25 mg PO daily, and acetaminophen 650 mg PO q6h PRN pain. Do not stop the apixaban for ordinary bruises. Bring each bottle, including mail-order fills, so the count can be cheked against the chart. A seperate vitamin list would help, becuase the last reconciliation missed two products.
  10| 
  11| Questions can go to the nurse line at (503) 555-0148 ext. 3307. Please ask for the covering nurse. The after-visit summary will be mailed to the address already on file. Thank you for helping her get here safely.
  12| 
  13| Dr. Lydia Haskett
  14| Internal Medicine
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.