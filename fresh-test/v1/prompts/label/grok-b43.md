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


=== DOCUMENT fd-0233 ===
   1| To the medical review team,
   2| 
   3| The clinic is requesting continued coverage of pregabalin, dispensed as Lyrica, for a 67-year-old woman with painful diabetic periphreal neuropathy and a history of Graves disease diagnosed in 2019. She is now euthyroid on methimazole. The covering pharmacist revieweed the regimen before this letter was sent. Her daughter helps with the pill box but does not manage dosing decisions.
   4| 
   5| Current medications include Lyrica 75 mg PO BID, methimazole 5 mg PO daily, metformin 1000 mg PO BID, and atorvastatin 40 mg PO nightly. Duloxetine was tried previously and stopped for nausea. Please do not substitute a different brand without checking the methimazole dose, becuase a gap would risk recurrence of hyperthyroidism.
   6| 
   7| Recent results from the clinic laboratory: TSH 1.8 mIU/L, free T4 1.2 ng/dL, hemoglobin A1c 7.4%, creatinine 0.9 mg/dL, and eGFR 78 mL/min/1.73 m2. Vitals recorded with those laboratories were blood pressure 128/74 mmHg, heart rate 72 beats per minute, weight 71 kg, and temperature 36.7 C. The foot examination showed reduced monofilament sensation at the great toes bilaterally. She has no new ulcer, and pedal pulses are palpable.
   8| 
   9| We ask that coverage of Lyrica 75 mg PO BID continue while glucose control is tightend. A generic pregabalin capsule is acceptable if the milligram strength matches. The patient was counseled on dizziness and edema and told to call the clinic for swelling, rash, or a resting heart rate above 100. Thank you for reviewing this request.
  10| 
  11| The covering pharmacist
  12| Ambulatory care
=== END DOCUMENT ===

=== DOCUMENT fd-0061 ===
   1| Liver and Biliary Center
   2| Surgical Pathology Report
   3| 
   4| Patient: Käthe Höfer
   5| DOB: 08/19/1964
   6| Age: 61 years
   7| SSN: 000-48-2291
   8| MRN: 5582104
   9| Accession: LBC-26-10934
  10| Specimen: liver, core biopsy
  11| Date of Service: March 4, 2026
  12| Ordering: Dr. Amos Whitaker
  13| Contact: Ms. Đặng Ngọc Quỳnh
  14| Address: PO Box 905, Quillhaven, WI 54481
  15| 
  16| CLINICAL HISTORY
  17| Woman with longstanding psoriasis treated with methotrexate. ALT and AST have
  18| risen over the past season. Her daughter, Ms. Đặng Ngọc Quỳnh, translates
  19| at visits and fills the pill box. There is no family history of cirrhosis.
  20| Viral hepatitis serologies were negative on outside labs that
  21| accompanied the referral.
  22| 
  23| GROSS DESCRIPTION
  24| Received in formalin are two cylindrical cores of tan-brown tissue,
  25| measuring 1.4 cm and 1.1 cm in length. The entire speciman is submitted
  26| in one cassette after standard processing.
  27| 
  28| MICROSCOPIC DESCRIPTION
  29| The cores show portal tracts with a mild lymphocytic infiltrate. The
  30| limiting plate is intact. No signifcant steatosis, no ballooning, and
  31| no Mallory-Denk bodies are seen. A trichrome stain shows portal fibrous
  32| expansion without bridging, consistant with METAVIR stage F1. Reticulin
  33| stain shows preserved hepatic-plate architecture. Bile ducts are present
  34| in the sampled portal tracts. An iron stain is negative. The PAS-D stain
  35| shows no diastase-resistant globules.
  36| 
  37| Methotrexate has been taken at 15 mg PO once weekly, with folic acid
  38| 1 mg PO daily on the other days. Labs drawn for this procedure were
  39| ALT 96 U/L, AST 71 U/L, alkaline phosphatase 88 U/L, total bilirubin
  40| 0.7 mg/dL, albumin 4.1 g/dL, INR 1.0, and platelets 242,000/uL.
  41| 
  42| DIAGNOSIS
  43| Liver, core biopsy: mild portal inflammation with early periportal
  44| fibrosis, METAVIR F1. There is no steatohepatitis and no malignancy.
  45| The findings are nonspecific and may be seen with methotrexate
  46| exposure. Clinical correlation is advised.
  47| 
  48| Interpreted by Prof. Lillian Crowe, gastrointestinal pathology.
  49| End of report.
=== END DOCUMENT ===

=== DOCUMENT fd-0171 ===
   1| Lantern Annex Laboratory
   2| Gastrointestinal Pathology
   3| 
   4| Patient: de la Varenne, Élodie
   5| DOB: May 12, 1978
   6| Age: 47 years
   7| MRN: 8834217
   8| Accession: GI-26-19028
   9| Group no.: 44128
  10| Specimen: colon biopsies, surveillance
  11| Collected: 04.03.2026
  12| Ordering: Dr. Stanley Yarrow
  13| Phone: +44 20 7946 0144
  14| Address: 55 Harbor Lantern Road, Apt 4B, West Alder, OR 97381
  15| Brother: Mr. Gordon Phelps
  16| 
  17| CLINICAL HISTORY
  18| 47-year-old woman with ulcerative colitis diagnosed in adulthood, on
  19| surveillance colonoscopy. Eight biopsies were taken from the cecum to
  20| the rectum. She reports two formed stools a day and no nocturnal
  21| waking. Her brother, Mr. Gordon Phelps, is the contact if results
  22| need to be discussed, because she is traveling the week after the
  23| procedure. Élodie de la Varenne's prior biopsies, described in the
  24| request, showed chronic colitis without dysplasia.
  25| 
  26| The medicine list on the requisition reads mesalamine DR 1.2 g PO TID
  27| and prednisone 20 mg PO daily, the latter started for a flare last
  28| season and still being tapered by her clinician. She also takes
  29| ondansetron 4 mg PO q8h PRN nausea around the bowel prep. No biologic
  30| is listed.
  31| 
  32| GROSS
  33| Received in formalin are eight specimens in separate jars, each a
  34| fragment of tan mucosa, 0.3 to 0.5 cm. They are submitted entirely,
  35| one cassette per jar, after filtration.
  36| 
  37| MICROSCOPIC
  38| All eight sites show distorted crypt architecture, basal plasmacytosis,
  39| and crypt shortening, in keeping with chronic colitis. The inflamation
  40| is mild and patchy, with cryptitis in the sigmoid and rectal samples
  41| and little activity in the right colon. No granulomas are seen. No
  42| dysplasia and no carcinoma are identified in the tissue examined. The
  43| findings are consistant with quiescent to mildly active chronic
  44| ulcerative colitis. A seperate comment on the requisition asks that
  45| dysplasia be excluded, and it is excluded here.
  46| 
  47| The right-colon samples show Paneth cell metaplasia distal to the point
  48| where those cells are normally expected, which supports chronicity.
  49| Mucin preservation is good. No viral cytopathic effect is present.
  50| 
  51| DIAGNOSIS
  52| Colon, cecum through rectum, biopsies: chronic colitis, mildly active
  53| in the distal samples, inactive in the proximal samples. Negative for
  54| dysplasia and negative for carcinoma.
  55| 
  56| The degree of activity fits a patient who has improved on steroids but
  57| is not fully healed. Correlation with the endoscopic score, which was
  58| not included on this requisition, is suggested. Results may be
  59| telephoned to the number in the header.
  60| 
  61| COMMENT
  62| The chronic changes are present in every jar, so this is read as
  63| extensive rather than limited colitis. Activity, scored simply as
  64| cryptitis without crypt abscesses, is confined to the two most distal
  65| jars. That pattern often tracks the endoscopic appearance, although
  66| no score was written on the bottle labels.
  67| 
  68| A cytomegalovirus immunostain was reviewed on the rectal block and is
  69| negative, which matters because she is still on daily prednisone. No
  70| amoeba, no granuloma, and no basal giant cells are seen. The tissue
  71| is well oriented on most levels. One cecal fragment is superficial and
  72| includes only the upper half of the mucosa, so a deep basal
  73| lymphoplasmacytic band cannot be judged in that single jar; the other
  74| seven jars do show the band.
  75| 
  76| These findings can be discussed with the patient at the address and
  77| phone already printed above. No amended diagnosis is anticipated unless
  78| new levels, which were not needed, are cut later.
  79| 
  80| Interpreted by Dr. Margaret Ashcombe, gastrointestinal pathology.
  81| End of report.
=== END DOCUMENT ===

Now output the label blocks, one per document, in the order shown.