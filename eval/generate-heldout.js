// 27-TEMPLATE DEVELOPMENT CHECK (historical file name: heldout.json).
//
// Synthetic grammar corpus, seed 20261031. No identifiers originate from a
// person or clinical record. It was committed in d05d144 before the rule
// changes in dc528aa, but those changes added this set's own vocabulary
// (Jardiance, Rheumatoid, Portal, Telephone and others) to a protected word
// list, so it was never a blind held-out set. The loop below writes each of
// the 27 identifier templates four times, so its 108 identifier rows are 27
// independent cases. Report it per template ("26 of 27"), never as a rate over
// 108. It is development data. The committed JSON is kept byte-identical (a
// test checks its hash), so the limitation text it carries is unchanged.
import fs from 'node:fs'
export const SEED = 20261031
let state = SEED
const next = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0)
const cases = [
  ['NAME', 'Patient Zora Fenwick', 'Zora Fenwick'],
  ['NAME', 'Dr. Emrys Calder', 'Dr. Emrys Calder'],
  ['NAME', 'daughter, Nola, called', 'Nola'],
  ['DATE', 'Admitted 2026-08-17', '2026-08-17'],
  ['DATE', 'Follow up September 19, 2026', 'September 19, 2026'],
  ['DATE', 'Procedure on 17 August 2026', '17 August 2026'],
  ['DATE', 'Review on 08/17', '08/17'],
  ['DOB', 'DOB: 07/21/1930', '07/21/1930'],
  ['AGE_OVER_89', 'Age: 96', '96'],
  ['AGE_OVER_89', '104-year-old patient', '104'],
  ['PHONE', 'Telephone +1 (202) 555-0186 ext 42', '+1 (202) 555-0186 ext 42'],
  ['FAX', 'Fax: 202-555-0196', '202-555-0196'],
  ['EMAIL', 'Email zora@example.org', 'zora@example.org'],
  ['MRN', 'MRN#: R8137042', 'R8137042'],
  ['ACCOUNT', 'Account: AX-402781', 'AX-402781'],
  ['PLAN', 'Health plan number HP908174', 'HP908174'],
  ['ADDRESS', 'Home: 812 Fictional Avenue, Imaginary, CA 90000', '812 Fictional Avenue, Imaginary, CA 90000'],
  ['ADDRESS', 'PO Box 871, Imaginary, CA 90000', 'PO Box 871, Imaginary, CA 90000'],
  ['ADDRESS', 'City: Imaginary, ZIP: 90000', 'Imaginary'],
  ['ADDRESS', 'ZIP: 90000', '90000'],
  ['SSN', 'SSN: 000-12-3456', '000-12-3456'],
  ['DEVICE', 'Device serial: SYN-810427', 'SYN-810427'],
  ['LICENSE', 'License number: SYN-610284', 'SYN-610284'],
  ['VEHICLE', 'VIN: 1SYNTHETIC00000001', '1SYNTHETIC00000001'],
  ['URL', 'Portal https://example.org/patient/871', 'https://example.org/patient/871'],
  ['IP', 'IP: 192.0.2.87', '192.0.2.87'],
  ['IP', 'IP: 2001:db8::87', '2001:db8::87'],
]
const clinical = [
  ['DRUG', 'Continue metformin 500 mg BID'],
  ['DRUG', 'Continue Jardiance 10 mg daily'],
  ['LAB', 'A1c 7.2%, sodium 138, creatinine 1.2'],
  ['VITAL', 'BP 124/78, HR 72'],
  ['CLINICAL', 'Rheumatoid arthritis is stable'],
  ['OTHER', 'Age: 89, year 2026, 3 days of symptoms'],
]
const entries = []
for (let round = 0; round < 4; round++) {
  for (const [type, fragment, value] of cases) {
    const [category, kept] = clinical[next() % clinical.length]
    entries.push({id: `h${entries.length + 1}`, kind: 'clinical', text: `${fragment}. ${kept}.`, pii: [[type, value]], keep: [[category, kept]]})
  }
}
for (const [category, kept] of clinical) entries.push({id: `h${entries.length + 1}`, kind: 'negative', text: `${kept}.`, pii: [], keep: [[category, kept]]})
fs.writeFileSync(new URL('./heldout.json', import.meta.url), JSON.stringify({seed: SEED, limitation: 'Single-author grammar corpus with repeated templates. Not independently authored or real-world validation.', entries}, null, 2) + '\n')
