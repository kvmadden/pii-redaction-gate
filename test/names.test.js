// names.test.js: the name tier, rule by rule. Cases are written from the rules
// and the defects in the issue register, not copied from an evaluation set.

import { test } from "node:test";
import assert from "node:assert/strict";
import { redactText } from "../src/engine.js";

const EMPTY = { people: [], safe: [] };
const run = (text, peopleMap = EMPTY) => redactText(text, { profile: "identifiers", peopleMap });

/** Every value is gone from the output. */
function gone(text, values, peopleMap) {
  const r = run(text, peopleMap);
  for (const v of values) assert.ok(!r.text.includes(v), `${JSON.stringify(v)} survived in ${JSON.stringify(r.text)}`);
  return r;
}
/** Every value is still in the output. */
function kept(text, values, peopleMap) {
  const r = run(text, peopleMap);
  for (const v of values) assert.ok(r.text.includes(v), `${JSON.stringify(v)} was removed from ${JSON.stringify(text)}: ${JSON.stringify(r.text)}`);
  return r;
}
/** The value is removed, or the result is marked for review. Never a silent pass. */
function notSilent(text, value) {
  const r = run(text);
  assert.ok(!r.text.includes(value) || r.status === "review", `${JSON.stringify(value)} passed silently in ${JSON.stringify(r.text)}`);
  return r;
}

test("names: LAST, FIRST and ALL CAPS forms (register 6)", () => {
  gone("Name: Thorn, Inez. Seen for cough.", ["Thorn", "Inez"]);
  gone("PATIENT: THORN, INEZ  MRN: 4471023", ["THORN", "INEZ", "4471023"]);
});

test("names: sentence start, possessive, camel case, Mc and apostrophe names (register 6, 49)", () => {
  gone("Inez called the pharmacy about her refill.", ["Inez"]);
  gone("Inez's daughter called back.", ["Inez"]);
  gone("Spoke with LaToya about her inhaler.", ["LaToya"]);
  gone("Mrs. McDonald reports dizziness.", ["McDonald"]);
  gone("Pt O'Brien seen today.", ["Brien"]);
});

test("names: accented and non-English names", () => {
  gone("Ángel Núñez was admitted overnight.", ["ngel", "Núñez"]);
});

test("names: initials, with or without a first name before them", () => {
  gone("Seen by Dr. J. Smith today.", ["Smith"]);
  gone("the patient (T.G.) was up to date", ["T.G."]);
  gone("A 61-year-old woman, Oyelaran T. Marsh, presented with cough.", ["Oyelaran", "Marsh"]);
});

test("names: a title outranks every word list (register 6, 18 in the evaluation)", () => {
  const r = gone("Mr. Bell has Bell's palsy.", ["Mr. Bell"]);
  assert.match(r.text, /Bell's palsy/);
  gone("Patient Don Graves reports chest pain.", ["Don", "Graves"]);
  gone("Follow Up: 1 Week Dr. Alvarez", ["Alvarez"]);
  assert.doesNotMatch(run("Follow Up: 1 Week Dr. Alvarez").text, /\[address\]/);
});

test("names: a title outranks the operator's safe list", () => {
  const map = { people: [], safe: ["Bell"] };
  gone("Dr. Bell called.", ["Bell"], map);
  kept("Bell palsy is improving.", ["Bell palsy"], map);
});

test("names: calendar words that are first names, inside a pair", () => {
  gone("Seen with April Lee and June Park.", ["April", "Lee", "June", "Park"]);
  kept("Follow up in June. Seen on Monday.", ["June", "Monday"]);
});

test("names: lowercase names after a lowercase title or relation word, or before a person verb", () => {
  gone("pt seen with dr smith and wife maria", ["smith", "maria"]);
  gone("tanya called about her refill", ["tanya"]);
  gone("hi its tanya, can u call me back", ["tanya"]);
  kept("spoke to dr king re: labs", ["re: labs"]);
});

test("names: cues (labels, relation words, sign-offs, greetings)", () => {
  gone("Attending: Chen reported pain.", ["Chen"]);
  gone("Spoke with patient's guardian, Thomas, regarding care.", ["Thomas"]);
  gone("Thanks, Omar", ["Omar"]);
  gone("Can you call me back?\n-- Inez", ["Inez"]);
});

test("names: a first name that is also a clinical or ordinary word still opens a pair", () => {
  gone("Escalated to Brian Oduya on the billing team.", ["Brian", "Oduya"]);
  gone("Grace Okonkwo called.", ["Grace", "Okonkwo"]);
  gone("Heather Smith is the RN.", ["Heather", "Smith"]);
});

test("names: a heading rule never swallows a verb and a name", () => {
  // Each of these used to be kept whole as a "heading".
  notSilent("Spoke with Jones today.", "Jones");
  notSilent("Called Price back.", "Price");
  notSilent("Escalated to Brian on the billing team.", "Brian");
  notSilent("Gave Grace the forms.", "Grace");
  gone("Discharge Summary for Okafor attached.", ["Okafor"]);
  gone("Prior Authorization Request for Okafor sent.", ["Okafor"]);
});

test("names: capitalized clinical vocabulary is kept (register 7)", () => {
  kept("Assessment: Multiple Sclerosis.", ["Multiple Sclerosis"]);
  kept("Continue Synthroid 75 mcg daily.", ["Synthroid"]);
  kept("Allergies:\nPenicillin\nSulfa\nCodeine", ["Penicillin", "Sulfa", "Codeine"]);
  kept("Glasgow Coma Scale 14; pupils equal.", ["Glasgow Coma Scale"]);
  kept("Wells score 4.5; CT angiogram ordered.", ["Wells score"]);
  kept("Tanner stage 3; growth along the 50th percentile.", ["Tanner stage"]);
  kept("Acute Kidney Injury resolved.", ["Acute Kidney Injury"]);
  kept("Hx Graves disease and Hashimoto thyroiditis.", ["Graves disease", "Hashimoto thyroiditis"]);
});

test("names: section headers and reference words are not facility names", () => {
  kept("Past Medical History: HTN, DM2.", ["Past Medical History"]);
  kept("PAST MEDICAL HISTORY: HTN", ["PAST MEDICAL HISTORY"]);
  kept("Records from Outside Hospital reviewed.", ["Outside Hospital"]);
  kept("Annual Primary Care visit due.", ["Annual Primary Care"]);
  kept("Referred to Diabetes Center.", ["Diabetes Center"]);
});

test("names: facility names", () => {
  gone("Transferred from Mercy Ridge Hospital.", ["Mercy Ridge"]);
  gone("Seen at St. Mary's Hospital.", ["Mary"]);
  gone("Seen at Mayo Clinic.", ["Mayo"]);
  // Ordinary words before a facility type could be a name or a service: review.
  const r = run("Seen at Riverside Clinic.");
  assert.equal(r.status, "review");
  assert.equal(run("Seen in Pain Clinic today.").status, "review");
});

test("names: vocabulary is scoped to the span, never the document (register 33, PR 4)", () => {
  gone("Continue morphine (Alice). Patient Alice called.", ["Alice"]);
  gone("Followed by internal medicine (Kaplan). Mr. Kaplan agrees.", ["Kaplan"]);
  gone("Patient Will-Smith called.", ["Will-Smith", "Smith"]);
  gone("Patient Inez Thorn admitted. Gave Inez potassium 20 mEq PO.", ["Inez", "Thorn"]);
});

test("names: an unrecognized capitalized word is decided by position, or sent to review", () => {
  gone("Hrytsenko presented with chest pain.", ["Hrytsenko"]);
  gone("Seen today with Okafor.", ["Okafor"]);
  notSilent("Okafor seen today.", "Okafor");
});

test("names: known names from the people map, longest first, never inside a token", () => {
  const map = { people: [{ name: "Avery Sample", role: "patient", aliases: ["Avery"] }, { name: "Sam", role: "clinician" }], safe: [] };
  const r = run("Avery Sample saw Sam. AVERY called [email] later.", map);
  assert.equal(r.text, "[patient] saw [clinician]. [patient] called [email] later.");
});

test("names: names with a review flag never leave the classifier silently", () => {
  for (const [text, value] of [
    ["Family at bedside: Maria, Diego and Ana.", "Ana"],
    ["Parkinson's is worse today.", "Parkinson"],
    ["Brian's wife called.", "Brian"],
    ["Grace's daughter called.", "Grace"],
  ]) notSilent(text, value);
});
