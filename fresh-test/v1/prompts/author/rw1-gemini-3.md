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

BATCH: 2 slot(s). Write one document per slot.

SLOT s-071
Kind: Call or voice transcript with disfluencies (uh, um, false starts, repeated words) and speaker labels. A pharmacy, nurse line, scheduling or clinic call.
Length: about 750 words (acceptable range 600 to 900)
Layout: flowing lines with no hard wrapping
Typos: no deliberate typos needed
Identifiers: yes
People: patient naming tradition: Filipino with a Spanish-influenced surname. Clinician and staff naming tradition: Filipino with a Spanish-influenced surname. Relative or caregiver naming tradition: Nigerian: Yoruba or Igbo. Invent fresh names, with the patient's surname starting with the letter C unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_lower] Write at least one person's name entirely in lowercase, the way a hurried typist or someone texting would.
- [ad_lower] Give a street address in lowercase (texting style).
- [n_initials] Refer to at least one person by initials with periods, such as "T.G." or "M.R.K.".
- [n_list] Include a list that holds several names together (care team, attendees, cc line, covering physicians, family members present).
- [n_nonanglo_part] Include a person whose surname has a particle or several parts (de la Cruz, van der Merwe, bin Hamad, al-Rashid, O'Connor-Silva, Garcia Lopez) or whose name carries accents, hyphens or apostrophes.
- [f_clinical] Name one facility whose name is made of clinical words or a specialty (like "Valley Hospital", "Pain Clinic" used as the name of one specific practice, "Heart and Vascular Center of Pine Ridge").
- [d_abbr] Write a date with an abbreviated month and no period ("Mar 4 2026", "4 Sep 2026").
- [d_dob] Give a date of birth, either labeled ("DOB:") or in prose ("born on ...").
- [a_over_hyph] Give an age of 90 or over in hyphenated form ("104-year-old").
- [i_spaces] Give an ID with spaces between groups (4821 9932 07).
- [i_license] Give a license number (driver license, professional license, NPI or DEA number).
- [p_unicode] Give a phone number that uses a Unicode dash (en dash, non-breaking hyphen or minus sign) between groups.
- [ad_title] Give a street address in Title Case with city, state and ZIP.
- [ad_city] Name a city or town on its own as where someone lives or works ("she lives in Fairview").
- [k_proc] Mention procedure names and diagnoses by their ordinary clinical names.

REJECTED VERSION OF s-071:
=== BEGIN REJECTED TEXT ===
CLINICAL INTAKE CALL TRANSCRIPT
Facility: Valley Nephrology and Hypertension Center
Call Session ID: 5820 1938 44
Date of Intake: 14 Nov 2026
Care Team: Dr. Renato Bautista, Maria de la Cruz, RN, Dr. Jocelyn Morales
Patient: Catalino Concepcion
DOB: 28 Aug 1935
Age: 91-year-old male
Caregiver / Caller: Babatunde Adeyemi (son-in-law)

[Call Audio Recorded]

Maria de la Cruz, RN: Valley Nephrology and Hypertension Center, my name is Maria de la Cruz, registered nurse. How, uh, how may I help you this afternoon?

Babatunde Adeyemi: Hello, good afternoon nurse. My name is Babatunde Adeyemi. I'm, uh, I am calling regarding my father-in-law, Catalino Concepcion. He is, uh, he's currently on peritoneal dialysis—well, actually, he transitioned to in-center hemodialysis last month via his left arm arteriovenous fistula, and he's having some severe cramping and nausea after his session yesterday.

Maria de la Cruz, RN: Okay, Mr. Adeyemi, let me pull up his electronic chart. Give me just one moment... alright, I see Mr. Concepcion's record. For verification, could you confirm his date of birth and residential address?

Babatunde Adeyemi: Yes, of course. His DOB is 28 Aug 1935. He is a 91-year-old gentleman, and he lives in Chicago with my wife and me. His address is 1042 Skyline Boulevard, Apt 12, Chicago, IL 60616.

Maria de la Cruz, RN: Thank you very much. I see in our intake notes that the secure portal registration had the address typed in lowercase as 1042 skyline boulevard, apt 12. And your phone number on file ends in 0173?

Babatunde Adeyemi: Yes, that is correct, my mobile number is 312–555–0173.

Maria de la Cruz, RN: Perfect. Now tell me about the symptoms Mr. Concepcion is experiencing. When did the cramping start, and how is his fistula site looking?

Babatunde Adeyemi: Well, um, the muscle cramps in his calves started about, uh, two hours after he got home from dialysis yesterday afternoon. He also felt very nauseated and vomited once. His left arm arteriovenous fistula looks okay—there's no redness, no swelling, and I can feel the thrill, that buzzing vibration, which the clinic taught us to check. But he, he barely ate dinner, and this morning he could only take a few sips of water. We are worried about his potassium and fluid balance because of his end-stage renal disease.

Maria de la Cruz, RN: Checking the thrill was exactly the right thing to do, Babatunde. I'm looking at his treatment run sheet from yesterday's hemodialysis session. They removed 3.2 liters of fluid, and his post-dialysis weight was 64.5 kg, which was actually 0.8 kg below his prescribed dry weight of 65.3 kg. That over-ultrafiltration frequently causes aggressive muscle cramping, dizziness, and nausea. Did you check his blood pressure at home today?

Babatunde Adeyemi: Yes, we did. His sitting blood pressure was 102/62 mmHg, pulse 74 bpm, and no fever, temperature was 98.2 F. Usually his blood pressure sits around 135/80 mmHg.

Maria de la Cruz, RN: Yes, that confirms he is slightly intravascularly depleted from pulling too much fluid yesterday. Regarding his medications, did he take his sevelamer carbonate 800 mg PO TID with meals today?

Babatunde Adeyemi: He didn't eat breakfast, so he didn't take the sevelamer. He only took his renal multivitamin. We held his carvedilol because his systolic was close to 100.

Maria de la Cruz, RN: Holding carvedilol was very smart with a systolic of 102. Let me review his lab results from Thursday: his serum potassium was 4.8 mEq/L, which is in a safe range, blood urea nitrogen was 54 mg/dL, and serum creatinine was 6.8 mg/dL with an estimated GFR under 10 mL/min/1.73m2. His parathyroid hormone level was elevated at 420 pg/mL. I'm going to consult our attending nephrologist, Dr. Renato Bautista. The internal paging log shows the covering clinician typed as bautista under license NPI: 1831092847. I will also log this communication under patient initials C.C. so the dialysis unit nurse sees it prior to his scheduled run on Monday.

Babatunde Adeyemi: Okay, thank you. Should we give him any broth or electrolyte fluids, or would that overload his kidneys?

Maria de la Cruz, RN: Avoid high-sodium broth and avoid sports drinks with potassium. Give him small sips of regular water or apple juice, no more than 4 ounces at a time, keeping his total fluid intake under his 1000 mL daily limit. If the cramps persist, gentle calf massage and a warm compress can help. However, if he develops chest pain, shortness of breath, profound weakness, or if his fistula stops buzzing, call 911 or take him to the emergency room immediately.

Babatunde Adeyemi: Understood. Small sips of water, warm compress, watch the fluid limit, and watch the fistula thrill.

Maria de la Cruz, RN: Exactly. Dr. Bautista and I will update his hemodialysis prescription for Monday to increase his dry weight target to 65.5 kg so they do not take off as much fluid. Thank you for calling, Babatunde.

Babatunde Adeyemi: Thank you so much, Nurse Maria. Have a blessed day.

Maria de la Cruz, RN: You too. Goodbye.

[End of Audio]

=== END REJECTED TEXT ===

Rules broken by that version:

- phone-range: A phone or fax number is outside the allowed range. The last seven digits must be 555-0100 to 555-0199 (international forms: +1 with such a number, +44 20 7946 0xxx, +44 7700 900xxx or +61 491 570 xxx). If the number is really a record number that only looks like a phone number, change its format, for example by adding a letter prefix. Offending text or numbers in your version: 1831092847

SLOT s-073
Kind: Call or voice transcript with disfluencies (uh, um, false starts, repeated words) and speaker labels. A pharmacy, nurse line, scheduling or clinic call.
Length: about 750 words (acceptable range 600 to 900)
Layout: flowing lines with no hard wrapping
Typos: no deliberate typos needed
Identifiers: yes
People: patient naming tradition: Arabic with bin, ibn or al- particles. Clinician and staff naming tradition: Anglo-American (English, Scottish or German-American descent). Relative or caregiver naming tradition: Turkish. Invent fresh names, with the patient's surname starting with the letter Z unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [d_spoken] Have a speaker say a date aloud in words ("March fourth, twenty twenty-six").
- [ad_lower] Give a street address in lowercase (texting style).
- [n_initials] Refer to at least one person by initials with periods, such as "T.G." or "M.R.K.".
- [n_list] Include a list that holds several names together (care team, attendees, cc line, covering physicians, family members present).
- [n_nonanglo_part] Include a person whose surname has a particle or several parts (de la Cruz, van der Merwe, bin Hamad, al-Rashid, O'Connor-Silva, Garcia Lopez) or whose name carries accents, hyphens or apostrophes.
- [f_clinical] Name one facility whose name is made of clinical words or a specialty (like "Valley Hospital", "Pain Clinic" used as the name of one specific practice, "Heart and Vascular Center of Pine Ridge").
- [d_abbr] Write a date with an abbreviated month and no period ("Mar 4 2026", "4 Sep 2026").
- [d_dob] Give a date of birth, either labeled ("DOB:") or in prose ("born on ...").
- [a_over_hyph] Give an age of 90 or over in hyphenated form ("104-year-old").
- [i_dashes] Give an ID with dashes between groups (4821-9932-07).
- [i_license] Give a license number (driver license, professional license, NPI or DEA number).
- [p_fax] Give a fax number, labeled Fax.
- [ad_title] Give a street address in Title Case with city, state and ZIP.
- [ad_city] Name a city or town on its own as where someone lives or works ("she lives in Fairview").
- [k_proc] Mention procedure names and diagnoses by their ordinary clinical names.
- [n_collision] Use these ordinary or clinical words as people's names, each as a person (patient, relative, clinician or staff): Pearl as a patient. Write them as plain names and never as a different word.
- [n_adj] Include a relative whose surname is Turner, and elsewhere in the same document the clinical term "Turner syndrome" (the person is unrelated to the disease).

REJECTED VERSION OF s-073:
=== BEGIN REJECTED TEXT ===
TRANSCRIPT OF CLINICAL TELEPHONE CALL
Facility: Pulmonary and Allergy Center of Green Valley
Reference Encounter: 4821-9932-07
Date: 8 Sep 2026
Care Team: Dr. Douglas McAllister, Hannah Weaver, RN, Dr. Craig Stewart
Patient: Pearl al-Zahrani
DOB: 15 Feb 1934
Age: 92-year-old female
Caller: Emre Demir (son-in-law)
Additional Contact: Clara Turner (daughter)

[Recording Commenced]

Hannah Weaver, RN: Pulmonary and Allergy Center of Green Valley, triage line, this is Hannah Weaver, registered nurse. How can I, uh, help you today?

Emre Demir: Hello, yes, uh, Nurse Hannah. My name is Emre Demir. I'm calling, um, on behalf of my mother-in-law, Pearl al-Zahrani. She had, uh, she had a bronchoscopy with transbronchial biopsy last week, and she is having some increased shortness of breath and coughing up some thick mucus today.

Hannah Weaver, RN: Alright, let me pull up Pearl's chart here. Could you please confirm her date of birth and home address for me?

Emre Demir: Yes, her date of birth is February fifteenth, nineteen thirty-four—born on 15 Feb 1934. She is a 92-year-old woman, and she currently lives in Phoenix with my wife and me. Her address is 519 Crescent Summit Way, Suite 200, Phoenix, AZ 85032.

Hannah Weaver, RN: Thank you, Mr. Demir. I see that her daughter, Clara Turner, also updated her profile on the online portal yesterday, and she entered the address in lowercase as 519 crescent summit way, suite 200. Does Mrs. al-Zahrani have any fever, chest pain, or frank blood in her sputum?

Emre Demir: No fever. Her temperature this morning was 98.4 F. Her oxygen saturation on room air dropped to 89%, so we put her on 2 liters per minute of nasal cannula oxygen, which brought her pulse oximetry up to 93%. Pulse was 82 beats per minute, blood pressure 126/74 mmHg. There is no bright red blood, just, you know, yellowish thick phlegm. But she feels very tired and her wheezing sounds louder.

Hannah Weaver, RN: Okay. The hypoxemia is concerning given her chronic obstructive pulmonary disease exacerbation risk after the procedure. Let me review her medication list. Is she using her budesonide-formoterol 160/4.5 mcg 2 puffs BID regularly?

Emre Demir: Yes, she took that this morning at 8:00 AM. And she did a nebulizer treatment of albuterol-ipratropium 0.5 mg/3 mg about two hours ago. It helped a little bit, but her breathing still feels tight.

Hannah Weaver, RN: Understood. Let me check the post-procedure notes from Dr. Douglas McAllister. He performed the bronchoscopy on 8 Sep 2026—wait, the procedure was last week, today is September eighth, twenty twenty-six. Dr. McAllister noted that her baseline forced expiratory volume in 1 second was 1.1 liters, and she had mild tracheal secretions. Also, in her family history notes, her daughter Clara Turner had asked previously about genetic screenings because a cousin had Turner syndrome, but the note confirms Mrs. al-Zahrani has no genetic anomalies or Turner syndrome. Dr. McAllister's provider credentials are on file under NPI: 1049281750.

Emre Demir: Right, exactly. We just wanted to make sure she doesn't need oral steroids or an antibiotic like azithromycin. Clara Turner, her daughter, is an occupational therapist and she thought Pearl might need a short burst of prednisone.

Hannah Weaver, RN: Dr. McAllister is in clinic right now, and I just sent an urgent flag to his desktop with the initials P.Z. to review her oxygen levels. He wants us to start a 5-day course of prednisone 40 mg PO daily and send a prescription for azithromycin 250 mg PO daily for 5 days. Which pharmacy should we send those to?

Emre Demir: The local pharmacy on Bell Road has them on file, but if you need to fax the orders, their direct clinical line is Fax: 602-555-0164.

Hannah Weaver, RN: Perfect, I will transmit the electronic script and also send a confirmation to Fax: 602-555-0164 immediately. While waiting for the medication, please keep her on the 2 liters of supplemental oxygen. Continue the albuterol-ipratropium nebulizer every 4 to 6 hours as needed. If her oxygen saturation drops below 90% on oxygen, or if she develops blue lips, confusion, chest pressure, or hemoptysis, call 911 immediately.

Emre Demir: Okay, we will do that. We will pick up the prednisone and azithromycin as soon as the pharmacy alerts us. Thank you very much, Hannah.

Hannah Weaver, RN: You're very welcome, Emre. We will follow up by phone tomorrow afternoon. Take care.

Emre Demir: Thank you, goodbye.

[Call Terminated]

=== END REJECTED TEXT ===

Rules broken by that version:

- phone-range: A phone or fax number is outside the allowed range. The last seven digits must be 555-0100 to 555-0199 (international forms: +1 with such a number, +44 20 7946 0xxx, +44 7700 900xxx or +61 491 570 xxx). If the number is really a record number that only looks like a phone number, change its format, for example by adding a letter prefix. Offending text or numbers in your version: 1049281750

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
