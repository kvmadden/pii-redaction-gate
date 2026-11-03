#!/usr/bin/env node
// Builds the synthetic sample set in the blind set's exact format, so the
// scorer can be tested without ever seeing the blind set.
//
//   node test/fixtures/fresh-sample/build.mjs
//
// Every name, number and address is invented. Phones use 555-01xx, emails use
// example.org. Markup in the templates below: {TYPE|value} is an identifier
// span, {TYPE~|value} a not-identifier span (KEEP is always not-identifier).
// Offsets are written in Unicode code points, as the spec says.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildManifest } from "../../../eval/fresh/make-manifest.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const DOCS = [
  ["note-001", "progress-note", `PROGRESS NOTE
Patient: {NAME|Inez Q. Thorn}   MRN: {ID|4471023}   DOB: {DOB|03/14/1951}
Attending: {CLINICIAN|Marisol Vega-Henriquez}, MD

{NAME|Inez} returns for follow-up of {KEEP~|type 2 diabetes}. A1c 7.4%, BP 138/84.
She is {AGE~|74} and lives with her daughter {RELATIVE|Rosa}.
Continue {KEEP~|metformin 500 mg BID}. Seen on {DATE|10/22/2025}.
Call back at {PHONE|212-555-0147} with questions.
`],
  ["note-002", "discharge-summary", `DISCHARGE SUMMARY
Patient: {NAME|OKONKWO, Adaeze B.}        MRN: {ID|00-482-1173}
Admit Date: {DATE|10/14/2026}   Discharge Date: {DATE|10/19/2026}

A {AGE|96}-year-old woman with {KEEP~|heart failure} admitted to {FACILITY|Riverbend Medical Center}.
Diuresed with {KEEP~|furosemide 40 mg IV BID}. {KEEP~|Wells score} low.
Son {RELATIVE|Chidi Okonkwo} will stay with her at {ADDRESS|2215 Maple Hollow Rd, Dublin, OH 43017}.
`],
  ["msg-003", "portal-message", `hi this is {NAME|tanya ruiz}, my pharmacy said the {KEEP~|ozempic} refill needs a new PA.
can someone call me at {PHONE|312.555.0148}? my email is {EMAIL|t.ruiz@example.org}.
member id {ID|BCX 4471 2290}. thx
`],
  ["call-004", "call-transcript", `AGENT: Thank you for calling, this is {CLINICIAN|Devon}. Who am I speaking with?
CALLER: It's for my mom, {NAME|Rosa Delgado-Perez}. That's {NAME|D-E-L-G-A-D-O}.
AGENT: And the best callback number?
CALLER: {PHONE|773-555-0161}. She takes {KEEP~|lisinopril 10 mg} every morning.
`],
  ["rx-005", "pharmacy-note", `FAX / Prior authorization request
Prescriber: Dr. {CLINICIAN|Lena Moreau}   Fax: {FAX|202-555-0196}
Patient: {NAME|Ilse Varga}   Plan ID: {ID|PUN 4154 9263}
Request: {KEEP~|Jardiance 10 mg daily}. Prior therapy: {KEEP~|metformin}.
`],
  ["lab-006", "lab-report", `LAB REPORT
Name: {NAME|Bram Oyelaran}   DOB: {DOB|1938-07-02}   Accession #: {ID|A26-118842}
Collected: {DATE|2026-10-30}

{KEEP~|Hemoglobin 9.1 g/dL}. {KEEP~|eGFR 48}. {KEEP~|Ferritin 12 ng/mL}.
`],
  ["email-007", "email", `From: {NAME|Odile Fenner} <{EMAIL|odile.fenner@example.org}>
To: {CLINICIAN|Jonas Abernathy}

Please update my chart at {URL|https://portal.example.org/chart/88213}.
The login came from {IP|192.0.2.44}. My {KEEP~|levothyroxine 75 mcg} dose is unchanged.
`],
  ["note-008", "progress-note", `PROGRESS NOTE

No identifying details in this visit summary.
{KEEP~|Bell palsy} is improving. {KEEP~|Glasgow Coma Scale 15}.
Continue {KEEP~|prednisone taper 40/30/20/10 mg}. Follow up in 2 weeks.
`],
  ["msg-009", "portal-message", `Thanks so much 🙏 {NAME|Wren Halvorsen} here. My {KEEP~|insulin glargine 20 units} is working.
Born {DOB|May 2, 1931}, so I am {AGE|95} now.
`],
  ["dev-010", "progress-note", `Pump serial {DEVICE|SN-77A-310452} was replaced.
Patient drove a car with VIN {VEHICLE|1HGCM82633A004352} to the visit.
{KEEP~|Insulin pump} settings unchanged.
`],
  ["note-011", "progress-note", `Spoke with {NAME|Grace Whitlock} and her husband {RELATIVE|Will Price}.
{KEEP~|Bell's palsy} has resolved. {KEEP~|Brown discharge} noted.
Patient lives in {ADDRESS|Akron}.
`],
  ["call-012", "call-transcript", `NURSE: How is the {KEEP~|lisinopril} working?
PATIENT: Fine. My sister {RELATIVE|Philippa} reminds me every day.
NURSE: Good. Your next visit is {DATE|November 20, 2026}.
`],
  // Accents, curly quotes and a no-break space: offsets in code points differ
  // from UTF-8 bytes here, which the offset-unit check relies on.
  ["msg-013", "portal-message", `Hi, this is {NAME|José Pérez-Ibáñez}. My wife {RELATIVE|Mónica} says the “refill” for {KEEP~|atorvastatin 20 mg} didn’t arrive.
Please call me at {PHONE|(415) 555-0172}.\u00a0Gracias.
`],
];

function parse(template) {
  let text = "";
  const spans = [];
  let cp = 0;
  const re = /\{([A-Z]+)(~?)\|([^}]+)\}/g;
  let last = 0;
  for (const m of template.matchAll(re)) {
    const lit = template.slice(last, m.index);
    text += lit;
    cp += [...lit].length;
    const value = m[3];
    const start = cp;
    text += value;
    cp += [...value].length;
    spans.push({ start, end: cp, type: m[1], policy: m[2] || m[1] === "KEEP" ? "not-identifier" : "identifier" });
    last = m.index + m[0].length;
  }
  text += template.slice(last);
  return { text, spans };
}

export function build(dir = HERE) {
  fs.mkdirSync(path.join(dir, "documents"), { recursive: true });
  const lines = [];
  for (const [id, kind, template] of DOCS) {
    const { text, spans } = parse(template);
    fs.writeFileSync(path.join(dir, "documents", `${id}.txt`), text);
    lines.push(JSON.stringify({ id, kind, text_sha256: crypto.createHash("sha256").update(text).digest("hex"), spans }));
  }
  fs.writeFileSync(path.join(dir, "labels.jsonl"), lines.join("\n") + "\n");
  const manifest = buildManifest(dir, { fixture: true, authoring_families: ["synthetic test fixture (Claude)"], labeling_families: ["synthetic test fixture (Claude)"], note: "Scorer test fixture, not the blind set." });
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (isMain) process.stdout.write(`set_sha256 ${build().set_sha256}\n`);
