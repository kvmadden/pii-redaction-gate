// lexicon.test.js: the name tier's vocabulary comes from pinned public sources,
// and the gate source holds no word taken from an evaluation fixture
// (register 2, 7).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { lookup, wordClass } from "../src/lexicon.js";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url));

test("lexicon: the generated module matches the hash in its manifest", () => {
  const manifest = JSON.parse(read("data/lexicon/manifest.json"));
  assert.equal(crypto.createHash("sha256").update(read("src/lexicon-data.js")).digest("hex"), manifest.module.sha256);
  for (const src of Object.values(manifest.sources)) {
    assert.match(src.sha256, /^[0-9a-f]{64}$/);
    assert.match(src.license, /public domain/i);
  }
});

test("lexicon: words are classed by public lists, not by a hand list", () => {
  assert.equal(wordClass("Synthroid"), "clinical"); // Drugs@FDA
  assert.equal(wordClass("Sclerosis"), "clinical"); // ICD-10-CM
  assert.equal(wordClass("Okafor"), "nameStrong"); // Census surnames
  assert.equal(wordClass("Grace"), "nameWeak"); // first name and an English word
  assert.equal(wordClass("Parkinson"), "eponymous"); // a name and a diagnosis word
  assert.equal(wordClass("Assessment"), "english"); // web2
  assert.equal(wordClass("Hispanic"), "english"); // a capitalized web2 proper adjective
  assert.equal(lookup("Núñez").key, "nunez"); // folded: marks removed, lowercase
});

test("lexicon: the name-tier source holds no fixture-only vocabulary", () => {
  // dc528aa added these template-set words to a hand-picked protected list
  // (with Device, Vehicle, City and ZIP, which stay as identifier field labels
  // in the pattern rules). The name tier must decide them from the public lists.
  const fixtureWords = ["jardiance", "rheumatoid", "arthritis", "portal", "telephone", "fenwick", "calder", "emrys", "zora", "nola", "imaginary", "fictional"];
  for (const file of ["src/names.js", "src/grammar.js", "src/lexicon.js", "src/scan.js", "src/clinical-patterns.js", "src/patterns.js"]) {
    const words = new Set(read(file).toString("utf8").toLowerCase().match(/[a-z]+/g));
    for (const w of fixtureWords) assert.ok(!words.has(w), `${file} contains the fixture word "${w}"`);
  }
  // And the public lists still decide them.
  assert.equal(wordClass("Jardiance"), "clinical");
  assert.equal(wordClass("Rheumatoid"), "clinical");
});
