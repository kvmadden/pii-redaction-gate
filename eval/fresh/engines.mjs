// eval/fresh/engines.mjs: the engines the blind set is scored with.
//
// Two gate configurations, declared before the set exists (docs/fresh-test-spec.md, section 4):
//   gate-empty    identifiers profile, empty people map
//   gate-header   identifiers profile, people map from the document's own header
//                 block (eval/fresh/header-map.mjs, frozen)
// Baselines on the same scorer:
//   do-nothing         sends the text unchanged (the floor for removal)
//   remove-every-word  replaces every run of letters and digits (the floor for
//                      clinical preservation)
//   presidio           Microsoft Presidio, default English recognizers, run offline
//                      by eval/fresh/presidio_run.py, read from its output file

import fs from "node:fs";
import { redactText, REDACTION_VERSION } from "../../src/engine.js";
import { tokenNamesFor } from "../../src/names.js";
import { headerPeopleMap, HEADER_RULE_VERSION } from "./header-map.mjs";
import { sha256 } from "./set.mjs";

const EMPTY = Object.freeze({ people: [], safe: [] });
const PROFILE = "identifiers";

function gateRun(text, peopleMap) {
  const r = redactText(text, { profile: PROFILE, peopleMap });
  return {
    text: r.text,
    status: r.status,
    review: r.review.map((x) => ({ start: x.start, end: x.end, check: x.check })),
  };
}

export function gateEngine(withHeaderMap) {
  return {
    id: withHeaderMap ? "gate-header" : "gate-empty",
    label: withHeaderMap ? `Gate, identifiers profile, people map from the header block (rule v${HEADER_RULE_VERSION})` : "Gate, identifiers profile, empty people map",
    family: "gate",
    version: `REDACTION_VERSION ${REDACTION_VERSION}`,
    run(doc) {
      const map = withHeaderMap ? headerPeopleMap(doc.text) : EMPTY;
      const tokens = tokenNamesFor(map);
      const out = gateRun(doc.text, map);
      return { ...out, isToken: (inner) => tokens.has(inner) };
    },
  };
}

export const doNothing = {
  id: "do-nothing",
  label: "Do nothing (sends the text unchanged)",
  family: "bound",
  version: "1",
  run: (doc) => ({ text: doc.text, status: "clean", review: [], isToken: () => false }),
};

export const removeEveryWord = {
  id: "remove-every-word",
  label: "Remove every word (replaces every run of letters and digits)",
  family: "bound",
  version: "1",
  run: (doc) => ({ text: doc.text.replace(/[\p{L}\p{N}]+/gu, "[removed]"), status: "clean", review: [], isToken: (inner) => inner === "removed" }),
};

/**
 * Presidio, from the output file eval/fresh/presidio_run.py wrote. Each output
 * names the SHA-256 of the input it was made from, so an output for another
 * text, or a missing output, refuses to score.
 */
export function presidioEngine(outputsPath) {
  const data = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  if (!data || typeof data.outputs !== "object" || !data.engine) throw new Error("presidio outputs: not a presidio_run.py output file");
  const v = data.engine.versions || {};
  return {
    id: "presidio",
    label: "Microsoft Presidio, default English recognizers (offline)",
    family: "baseline",
    version: `presidio-analyzer ${v["presidio-analyzer"]}, presidio-anonymizer ${v["presidio-anonymizer"]}, spacy ${v.spacy}, en_core_web_lg ${v["en-core-web-lg"]}, Python ${v.python}`,
    meta: data.engine,
    run(doc) {
      const o = data.outputs[doc.id];
      if (!o || typeof o.text !== "string") throw new Error(`presidio outputs: no output for ${doc.id}`);
      if (o.input_sha256 !== doc.sha256) throw new Error(`presidio outputs: ${doc.id} was made from a different text (input_sha256 ${o.input_sha256})`);
      return { text: o.text, status: "clean", review: [], isToken: (inner) => inner.startsWith("presidio-") };
    },
  };
}

export const ENGINE_ORDER = ["gate-empty", "gate-header", "do-nothing", "remove-every-word", "presidio"];

export default { gateEngine, doNothing, removeEveryWord, presidioEngine, ENGINE_ORDER, sha256 };
