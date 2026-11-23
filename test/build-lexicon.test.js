import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSets } from "../scripts/build-lexicon.mjs";

// Synthetic text only: never read clinical notes or frozen evaluation fixtures.
function inputs(overrides = {}) {
  return {
    census2010: "name,count\n",
    female: "",
    male: "",
    fda: "DrugName\tActiveIngredient\n",
    icd: "",
    english: "",
    ...overrides,
  };
}

const sorted = (values) => [...values].sort();

test("lexicon builder: census thresholds, normalization, and excluded aggregate", () => {
  const sets = buildSets(inputs({
    census2010: "name,count\nNÚÑEZ,99\nO'BRIEN,100\nDEMO-NAME,999\nCANYON,1000\nALL OTHER NAMES,5000\n",
  }));

  assert.deepEqual(sorted(sets.surnames), ["canyon", "demoname", "obrien"]);
  assert.deepEqual(sorted(sets.commonSurnames), ["canyon"]);
});

test("lexicon builder: combines, folds, and deduplicates first-name lists", () => {
  const sets = buildSets(inputs({
    female: " Áda 10\nNORA 3\n\n",
    male: "BÊRT 5\nÁDA 1\n",
  }));

  assert.deepEqual(sorted(sets.first), ["ada", "bert", "nora"]);
});

test("lexicon builder: reads FDA columns by header and ICD descriptions", () => {
  const sets = buildSets(inputs({
    fda: "ActiveIngredient\tDrugName\nCompound-X\tRX-ALPHA 20mg\n",
    icd: "A01.001 Fever, low BP\n",
  }));

  assert.deepEqual(sorted(sets.drugs), ["alpha", "compound"]);
  assert.deepEqual(sorted(sets.icd), ["fever", "low"]);
});

test("lexicon builder: separates ordinary English from capitalized demonyms", () => {
  const sets = buildSets(inputs({
    english: "tablet\noptic\nChinese\nMoroccan\nHispanic\nIsraeli\nAlice\nUSA\ntwo words\n",
  }));

  assert.deepEqual(sorted(sets.english), ["optic", "tablet"]);
  assert.deepEqual(sorted(sets.demonyms), ["chinese", "hispanic", "israeli", "moroccan"]);
});
