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


BATCH: 7 slot(s). Write one document per slot.

SLOT s-087
Kind: Pharmacy note. A refill call note, a prior authorization request transcribed from fax (with fax header noise), or a medication reconciliation note.
Length: about 200 words (acceptable range 160 to 240)
Layout: flowing lines with no hard wrapping
Typos: no deliberate typos needed
Identifiers: NONE. This slot must contain NO identifier of any kind. That means no personal names (patient, relative, clinician or staff), no facility or pharmacy names, no dates in any form (not even month and year, but a bare year such as 2019 is allowed), no ages of 90 or over, no phone, fax, email, street address, city or ZIP, no record or plan or account numbers, and no URL or IP address. Write it so it still reads like a real document of this kind, for example with "the patient", "her daughter", "the clinic", "the covering pharmacist". It must still be full of clinical content (drug names, doses, labs, diagnoses, section headers, procedures). Ages under 90 are fine.
Required items:
- [f_service] Mention a clinic or center as a SERVICE and not as a named practice (a referral to Pain Clinic, Diabetes Center, Cardiology, Wound Care). Also use the phrase "Outside Hospital" once as the source of outside records or imaging.
- [a_under] Give at least one age under 90 (patient or relative) in any common form. Ages under 90 are not identifiers.
- [k_brand] Mention a brand-name drug whose name looks like a given name or a word (for example Allegra, Lyrica or similar), alongside generic names.
- [k_eponym] Use an eponymous disease, sign or score with its full term (Bell palsy, Wells score, Glasgow Coma Scale, Apgar score, Gleason score, Tanner stage, Graves disease, Parkinson disease, Wilson disease and similar).
- [k_sig] Include medication lines with dose, route and frequency (for example 40 mg PO BID, 5 mL IV q8h PRN).
- [k_labs] Include lab values and vital signs with units.

SLOT s-088
Kind: Pharmacy note. A refill call note, a prior authorization request transcribed from fax (with fax header noise), or a medication reconciliation note.
Length: about 450 words (acceptable range 360 to 540)
Layout: flowing lines with no hard wrapping
Typos: include two to four realistic typos or slips, but not inside identifiers
Identifiers: yes
People: patient naming tradition: Irish-Gaelic with O' or Mc prefix and hyphenated double surname. Clinician and staff naming tradition: Anglo-American (English, Scottish or German-American descent). Relative or caregiver naming tradition: Anglo-American (English, Scottish or German-American descent). Invent fresh names, with the patient's surname starting with the letter S unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_allcaps] Write at least one person's name in ALL CAPS (a header, label or fax cover).
- [n_lastfirst] Write at least one person's name in LAST, FIRST order (a header, label, sign-in line or list entry).
- [n_relative] Name at least one relative or caregiver of the patient (spouse, parent, adult child, sibling) and say how they are related.
- [d_slash] Write a numeric date with slashes (3/4/2026 or 03/04/26).
- [d_monthyear] Write a date as month and year only ("March 2026").
- [i_mrn_labeled] Give a medical record number with a label (MRN:, Record #, Chart no.).
- [i_license] Give a license number (driver license, professional license, NPI or DEA number).
- [e_plain] Give an email address.
- [a_under] Give at least one age under 90 (patient or relative) in any common form. Ages under 90 are not identifiers.
- [n_collision] Use these ordinary or clinical words as people's names, each as a person (patient, relative, clinician or staff): Sweet as a staff member. Write them as plain names and never as a different word.

SLOT s-091
Kind: Pharmacy note. A refill call note, a prior authorization request transcribed from fax (with fax header noise), or a medication reconciliation note.
Length: about 700 words (acceptable range 560 to 840)
Layout: flowing lines with no hard wrapping
Typos: no deliberate typos needed
Identifiers: yes
People: patient naming tradition: Dutch or Afrikaans with van or de particles. Clinician and staff naming tradition: Anglo-American (English, Scottish or German-American descent). Relative or caregiver naming tradition: Greek. Invent fresh names, with the patient's surname starting with the letter O unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_allcaps] Write at least one person's name in ALL CAPS (a header, label or fax cover).
- [u_url] Give a URL on one of the example domains (a patient portal link, a results page).
- [n_middle] Give at least one person a middle initial ("Maria L. Hernandez").
- [n_relative] Name at least one relative or caregiver of the patient (spouse, parent, adult child, sibling) and say how they are related.
- [f_proper] Name one facility with an invented proper name (like "St. Brendan Medical Center" or "Calloway Regional Hospital").
- [d_dash] Write a numeric date with dashes (03-04-2026).
- [d_dayfirst] Write a date with the day first ("4 March 2026").
- [d_twodigit] Write a numeric date with a two-digit year (3/4/26).
- [i_mrn_labeled] Give a medical record number with a label (MRN:, Record #, Chart no.).
- [i_account] Give an account number or claim number.
- [p_ext] Give a phone number with an extension ("x214" or "ext. 3307").
- [e_plain] Give an email address.
- [ad_split] Give an address that breaks across lines (street on one line, city state ZIP on the next).
- [k_labs] Include lab values and vital signs with units.

SLOT s-093
Kind: Pharmacy note. A refill call note, a prior authorization request transcribed from fax (with fax header noise), or a medication reconciliation note.
Length: about 650 words (acceptable range 520 to 780)
Layout: flowing lines with no hard wrapping
Typos: no deliberate typos needed
Identifiers: yes
People: patient naming tradition: French or Haitian with de la or Le particles. Clinician and staff naming tradition: Hispanic or Latino with two surnames and accents. Relative or caregiver naming tradition: Anglo-American (English, Scottish or German-American descent). Invent fresh names, with the patient's surname starting with the letter T unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_allcaps] Write at least one person's name in ALL CAPS (a header, label or fax cover).
- [u_url_end] Give a URL at the very end of a sentence, followed by a period.
- [n_middle] Give at least one person a middle initial ("Maria L. Hernandez").
- [n_relative] Name at least one relative or caregiver of the patient (spouse, parent, adult child, sibling) and say how they are related.
- [f_ordinary] Name one facility whose name is made of ordinary words (like "Riverside Clinic", "Lakeside Pediatrics", "Maple Street Pharmacy").
- [d_monthname] Write a date with the full month name ("March 4, 2026").
- [d_dob] Give a date of birth, either labeled ("DOB:") or in prose ("born on ...").
- [a_over_hyph] Give an age of 90 or over in hyphenated form ("104-year-old").
- [i_dashes] Give an ID with dashes between groups (4821-9932-07).
- [p_plain] Give a phone number in common US format with an area code.
- [e_plain] Give an email address.
- [ad_split] Give an address that breaks across lines (street on one line, city state ZIP on the next).
- [k_labs] Include lab values and vital signs with units.
- [n_collision] Use these ordinary or clinical words as people's names, each as a person (patient, relative, clinician or staff): Case as a staff member; Dawn as a relative. Write them as plain names and never as a different word.

SLOT s-094
Kind: Pharmacy note. A refill call note, a prior authorization request transcribed from fax (with fax header noise), or a medication reconciliation note.
Length: about 550 words (acceptable range 440 to 660)
Layout: hard-wrap the lines at about 76 characters, as in a text export or fax
Typos: include two to four realistic typos or slips, but not inside identifiers
Identifiers: yes
People: patient naming tradition: Hispanic or Latino with two surnames and accents. Clinician and staff naming tradition: Arabic with bin, ibn or al- particles. Relative or caregiver naming tradition: Anglo-American (English, Scottish or German-American descent). Invent fresh names, with the patient's surname starting with the letter G unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_split] Let at least one person's full name break across a line, with the first name ending one line and the surname starting the next (in a hard-wrapped passage or a header).
- [i_device] Give a device identifier such as the serial number of an implanted or home device (pacemaker, insulin pump, CPAP).
- [n_possessive] Use at least one name in the possessive ("Mr. Okafor's blood pressure", "Hernandez's chart").
- [n_nonanglo_part] Include a person whose surname has a particle or several parts (de la Cruz, van der Merwe, bin Hamad, al-Rashid, O'Connor-Silva, Garcia Lopez) or whose name carries accents, hyphens or apostrophes.
- [d_dash] Write a numeric date with dashes (03-04-2026).
- [d_dob] Give a date of birth, either labeled ("DOB:") or in prose ("born on ...").
- [a_over_spelled] Give an age of 90 or over spelled out ("ninety-six years old").
- [i_account] Give an account number or claim number.
- [p_intl] Give a phone number in international form (+1 ... or +44 ...).
- [ad_title] Give a street address in Title Case with city, state and ZIP.
- [k_sig] Include medication lines with dose, route and frequency (for example 40 mg PO BID, 5 mL IV q8h PRN).
- [n_collision] Use these ordinary or clinical words as people's names, each as a person (patient, relative, clinician or staff): Fair as a clinician. Write them as plain names and never as a different word.

SLOT s-096
Kind: Pharmacy note. A refill call note, a prior authorization request transcribed from fax (with fax header noise), or a medication reconciliation note.
Length: about 550 words (acceptable range 440 to 660)
Layout: hard-wrap the lines at about 76 characters, as in a text export or fax
Typos: include two to four realistic typos or slips, but not inside identifiers
Identifiers: yes
People: patient naming tradition: Arabic with bin, ibn or al- particles. Clinician and staff naming tradition: Samoan, Tongan or Native Hawaiian. Relative or caregiver naming tradition: Greek. Invent fresh names, with the patient's surname starting with the letter Y unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_split] Let at least one person's full name break across a line, with the first name ending one line and the surname starting the next (in a hard-wrapped passage or a header).
- [i_rx] Give a prescription (Rx) number.
- [n_possessive] Use at least one name in the possessive ("Mr. Okafor's blood pressure", "Hernandez's chart").
- [n_nonanglo_part] Include a person whose surname has a particle or several parts (de la Cruz, van der Merwe, bin Hamad, al-Rashid, O'Connor-Silva, Garcia Lopez) or whose name carries accents, hyphens or apostrophes.
- [d_dash] Write a numeric date with dashes (03-04-2026).
- [d_dob] Give a date of birth, either labeled ("DOB:") or in prose ("born on ...").
- [a_over_short] Give an age of 90 or over in shorthand ("92F", "91M").
- [i_account] Give an account number or claim number.
- [p_ext] Give a phone number with an extension ("x214" or "ext. 3307").
- [ad_unit] Give an address with an apartment, suite or unit number.
- [k_sig] Include medication lines with dose, route and frequency (for example 40 mg PO BID, 5 mL IV q8h PRN).
- [n_collision] Use these ordinary or clinical words as people's names, each as a person (patient, relative, clinician or staff): Cook as a staff member. Write them as plain names and never as a different word.
- [n_adj] Include a clinician whose surname is Reed, and elsewhere in the same document the clinical term "Reed-Sternberg cells" (the person is unrelated to the disease).

SLOT s-101
Kind: Pharmacy note. A refill call note, a prior authorization request transcribed from fax (with fax header noise), or a medication reconciliation note.
Length: about 550 words (acceptable range 440 to 660)
Layout: hard-wrap the lines at about 72 characters, as in a text export or fax
Typos: no deliberate typos needed
Identifiers: yes
People: patient naming tradition: Japanese. Clinician and staff naming tradition: Anglo-American (English, Scottish or German-American descent). Relative or caregiver naming tradition: Anglo-American (English, Scottish or German-American descent). Invent fresh names, with the patient's surname starting with the letter F unless a required name below says otherwise.
Required items (include every one, written naturally into the document):
- [n_split] Let at least one person's full name break across a line, with the first name ending one line and the surname starting the next (in a hard-wrapped passage or a header).
- [i_rx] Give a prescription (Rx) number.
- [n_title] Put a title in front of at least two names (Dr., Mrs., Mr., Ms., Prof., Rev.). The title is not part of the name.
- [n_nonanglo_part] Include a person whose surname has a particle or several parts (de la Cruz, van der Merwe, bin Hamad, al-Rashid, O'Connor-Silva, Garcia Lopez) or whose name carries accents, hyphens or apostrophes.
- [d_dot] Write a numeric date with dots (04.03.2026, day first).
- [d_dob] Give a date of birth, either labeled ("DOB:") or in prose ("born on ...").
- [a_over_spelled] Give an age of 90 or over spelled out ("ninety-six years old").
- [i_plan] Give a health plan member number or group number.
- [p_intl] Give a phone number in international form (+1 ... or +44 ...).
- [ad_title] Give a street address in Title Case with city, state and ZIP.
- [k_sig] Include medication lines with dose, route and frequency (for example 40 mg PO BID, 5 mL IV q8h PRN).

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
