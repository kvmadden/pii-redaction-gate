// realistic.test.js: whole documents written the way clinical text arrives,
// with headers, column gaps, lowercase messages and spoken transcripts. Every
// identifier must be removed or the result marked for review, and the
// clinical content must survive. Known gaps are pinned so a fix updates them.

import { test } from "node:test";
import assert from "node:assert/strict";
import { redactText, KNOWN_GAPS } from "../src/engine.js";

/** Every occurrence of v left in the output sits inside a review span. */
export function flaggedWhereLeft(r, v) {
  for (let at = r.text.indexOf(v); at >= 0; at = r.text.indexOf(v, at + 1)) {
    const end = at + v.length;
    if (!r.review.some((x) => x.start < end && x.end > at)) return false;
  }
  return true;
}

function check(text, source, { removed = [], kept = [], gap = [] }) {
  const r = redactText(text, { source, peopleMap: { people: [], safe: [] } });
  assert.notEqual(r.status, "blocked");
  // Removed, or flagged for review AT the identifier. A review span elsewhere
  // in the document does not excuse it.
  for (const v of removed) assert.ok(!r.text.includes(v) || flaggedWhereLeft(r, v), `${JSON.stringify(v)} left without a review span on it:\n${r.text}`);
  for (const v of kept) assert.ok(r.text.includes(v), `${JSON.stringify(v)} was removed:\n${r.text}`);
  for (const v of gap) assert.ok(r.text.includes(v), `${JSON.stringify(v)} is a documented gap that now passes: update this test and KNOWN_GAPS`);
  return r;
}

test("realistic: discharge summary with a record header, clinicians and family", () => {
  const note = `DISCHARGE SUMMARY
Patient: OKONKWO, Adaeze B.        MRN: 00-482-1173        DOB: 02/11/1948
Admit Date: 10/14/2026   Discharge Date: 10/19/2026
Attending: Marisol Vega-Henríquez, MD     PCP: Dr. Price (Northgate Family Medicine)

HOSPITAL COURSE: 78 y.o. woman with HFrEF (EF 30%), CKD stage 3b, and Parkinson's disease admitted with acute decompensated heart failure. Diuresed with IV furosemide 40 mg BID; net -4.2 L. Started sacubitril/valsartan 24/26 mg BID on 10/17. Carbidopa/levodopa 25/100 continued. Neurology (Dr. Bell) saw her for falls. Wells score low.

Daughter Grace (cell 614-555-0192) will stay with her; son Will lives in Columbus. Spoke with grace about the low-sodium diet. Home: 2215 Maple Hollow Rd, Apt 4B, Dublin, OH 43017.

Follow-up: Cardiology clinic in 1 week; labs (BMP) in 3 days. Signed: M. Vega-Henríquez, MD 10/19/2026 14:32`;
  const r = check(note, "discharge-summary", {
    removed: ["OKONKWO", "Adaeze", "00-482-1173", "02/11/1948", "10/14/2026", "Marisol", "Vega-Henríquez", "Price", "Northgate", "Bell", "Grace (", "614-555-0192", "son Will", "Columbus", "Maple Hollow", "43017", "10/17"],
    kept: ["78 y.o.", "HFrEF (EF 30%)", "CKD stage 3b", "Parkinson's disease", "furosemide 40 mg BID", "sacubitril/valsartan 24/26 mg BID", "Carbidopa/levodopa 25/100", "Wells score", "Cardiology clinic in 1 week", "BMP"],
    gap: ["Spoke with grace"],
  });
  assert.equal(r.status, "review");
  assert.ok(KNOWN_GAPS.some((g) => g.includes("lowercase name")));
});

test("realistic: lowercase patient portal message", () => {
  const msg = "hi this is tanya ruiz, dob 4/9/71. my pharmacy said the ozempic refill needs a new PA?? can someone call me at 312.555.0148 after 3. also my husband marcus has the same insurance (member id BCX 4471 2290) thx";
  check(msg, "patient-message", {
    removed: ["tanya", "ruiz", "4/9/71", "312.555.0148", "marcus", "BCX 4471 2290"],
    kept: ["ozempic refill needs a new PA", "after 3"],
  });
});

test("realistic: pharmacy call transcript with a spelled surname", () => {
  const call = `AGENT: Thank you for calling, this is Devon. Can I get the patient's name and date of birth?
CALLER: Yeah, it's for my mom, Rosa Delgado-Pérez, D-E-L-G-A-D-O. Birthday is March 3rd, 1932.
AGENT: And the best callback number?
CALLER: 773-555-0161. She's at 4410 N Kedzie Ave, Chicago.
AGENT: I see the lisinopril 10 mg was last filled on 10/02. I'll send the refill request to Dr. Nakamura.`;
  const r = check(call, "call-transcript", {
    removed: ["Devon", "Rosa", "Delgado-Pérez", "D-E-L-G-A-D-O", "March 3rd, 1932", "773-555-0161", "4410 N Kedzie", "Chicago", "10/02", "Nakamura"],
    kept: ["lisinopril 10 mg", "refill request"],
  });
  assert.equal(r.status, "review");
});
