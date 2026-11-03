// rules.test.js: the pattern and clinical rules, written from each rule's
// grammar (register 11 to 16, 24, 26). Every case is fictional.

import { test } from "node:test";
import assert from "node:assert/strict";
import { redactText } from "../src/engine.js";

const run = (text, extra = {}) => redactText(text, { profile: "identifiers", peopleMap: { people: [], safe: [] }, ...extra });
const out = (text, extra) => run(text, extra).text;

test("dates: ISO, dotted, numeric, month names, ordinals and month-year (register 12)", () => {
  assert.equal(out("Seen 2026-08-17 and 17 August 2026 and September 19, 2026."), "Seen [date] and [date] and [date].");
  assert.equal(out("Visit 2024.03.05 noted."), "Visit [date] noted.");
  assert.equal(out("Symptoms began in March 2024."), "Symptoms began in [date].");
  assert.equal(out("Born on the 4th of July."), "Born on [date].");
  assert.equal(out("Seen Sept. 19, 2026."), "Seen [date].");
  assert.equal(out("Admitted 10/22/2025, seen 10-22-25."), "Admitted [date], seen [date].");
});

test("dates: clinical fractions, ratios and tapers are not dates (register 13)", () => {
  for (const t of ["Follow-up 3/4 strength, 2/3 weeks, 1/2 tablet.", "Prednisone taper 40/30/20/10 mg.", "ABG 7.32/48/62.", "BP 138/84 HR 72.", "Version 2.14.3 released."]) {
    assert.equal(out(t), t);
  }
  assert.equal(out("Seen 13/45/2025."), "Seen 13/45/2025.", "an impossible month and day is not a date");
  assert.equal(out("We may see her in May 2025."), "We may see her in [date].");
});

test("dates: a separator must be consistent", () => {
  assert.equal(out("Ratio 1/2-3 noted."), "Ratio 1/2-3 noted.");
});

test("ages: over 89 in labeled, hyphenated, y.o., spelled-out and shorthand forms (register 24)", () => {
  assert.equal(out("Age: 96. A 104-year-old man. She is 101. 92 y.o. female. ninety-three years old."), "Age: [age]. A [age] man. She is [age]. [age] female. [age].");
  assert.equal(out("92F presents with cough."), "[age] presents with cough.");
  assert.equal(out("Age: 89. 45 years old."), "Age: 89. 45 years old.", "ages under 90 are kept on purpose");
});

test("IP addresses: validated IPv4 and IPv6, sentence-final period, label colon (register 11)", () => {
  assert.equal(out("IP: 192.0.2.87. Also 192.0.2.88. And ::1 and 2001:db8::87."), "IP: [ip]. Also [ip]. And [ip] and [ip].");
  assert.equal(out("IP:10.1.2.3 logged."), "IP:[ip] logged.");
  assert.equal(out("Values 999.1.2.3 and 1.2.3 stay."), "Values 999.1.2.3 and 1.2.3 stay.");
  assert.equal(out("MAC 00:1A:2B:3C:4D:5E logged."), "MAC [device] logged.");
});

test("labeled IDs: strong labels, 'is' after the label, grouped values (register 15)", () => {
  assert.equal(out("MRN: R8137042. MR#: 4471023. Rx#: 7712093."), "MRN: [account]. MR#: [account]. Rx#: [account].");
  assert.equal(out("Member ID is ZZQ 1029 3847."), "Member ID is [account].");
  assert.equal(out("Plan ID: PUN 4154 9263 on file."), "Plan ID: [account] on file.");
  assert.equal(out("Device serial: SYN-810427. VIN: 1SYNTHETIC00000001."), "Device serial: [account]. VIN: [account].");
});

test("labeled IDs: weak words and values that are not IDs stay (register 15)", () => {
  for (const t of ["Serial 12-lead ECG done.", "Plan: HbA1c in 3 months.", "Member ID: pending", "Policy number: on file", "Policy 2025-11 applies."]) assert.equal(out(t), t);
});

test("phones: parentheses without a space, international, Unicode dashes and fullwidth digits (register 16, 26)", () => {
  assert.equal(out("Call (212)555-0123 or +44 20 7946 0958 or 212–555–0147."), "Call [phone] or [phone] or [phone].");
  assert.equal(out("Call ２１２-５５５-０１４７."), "Call [phone].");
  assert.equal(out("SSN １２３-４５-６７８９"), "SSN [ssn]");
});

test("addresses: Title Case, lowercase, 221B, PO box, city and ZIP (register 14)", () => {
  assert.equal(out("Lives at 812 Fictional Avenue, Imaginary, CA 90000."), "Lives at [address].");
  assert.equal(out("lives at 16 rosewood terrace"), "lives at [address]");
  assert.equal(out("221B Baker Street"), "[address]");
  assert.equal(out("PO Box 871, Imaginary, CA 90000."), "[address].");
});

test("addresses: the city label capture is bounded, and quantities are not house numbers (register 14)", () => {
  assert.equal(out("City: Boston taking metformin daily."), "City: [address] taking metformin daily.");
  assert.equal(out("Walked 2 blocks down the road."), "Walked 2 blocks down the road.");
});

test("coordinates, SSN, cards, email and URLs", () => {
  assert.equal(out("Coordinates 41.8781, -87.6298."), "Coordinates [coords].");
  assert.equal(out("SSN 123-45-6789. Social is 123 45 6789."), "SSN [ssn]. Social is [ssn].");
  assert.equal(out("Card 4111 1111 1111 1111."), "Card [card].");
  assert.equal(out("Card 4111 1111 1111 1112."), "Card 4111 1111 1111 1112.", "a number that fails the Luhn check is not a card");
  assert.equal(out("Email ana.ruiz@example.org today."), "Email [email] today.");
  assert.equal(out("www.example.org/patient/88 and https://example.org/x"), "[url] and [url]");
});

test("the clinical content around identifiers is kept", () => {
  const t = "Patient Inez Thorn, DOB 03/04/1961, MRN 4471023. Continue metformin 500 mg BID. A1c 7.4%, BP 138/84.";
  assert.equal(out(t), "Patient [name], DOB [dob], MRN [account]. Continue metformin 500 mg BID. A1c 7.4%, BP 138/84.");
});
