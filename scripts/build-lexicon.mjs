#!/usr/bin/env node
// build-lexicon.mjs: builds src/lexicon-data.js from public vocabularies.
//
// The name tier decides "clinical word, ordinary English word, or possible
// name" from these lists, not from a hand-picked word list. Nothing here is
// read from the evaluation fixtures. Every source is public domain, and every
// source file is checked against a pinned SHA-256 before it is used.
//
// Usage (paths to the extracted files):
//   node scripts/build-lexicon.mjs \
//     --census2010 Names_2010Census.csv \
//     --female dist.female.first --male dist.male.first \
//     --fda Products.txt --icd icd10cm_codes_2025.txt \
//     --english /usr/share/dict/web2
//   node scripts/build-lexicon.mjs --check   (verifies the committed module hash only)

import fs from "node:fs";
import crypto from "node:crypto";
import { foldKey, frontCode } from "../src/text-fold.js";

const root = new URL("../", import.meta.url);
const OUT_MODULE = new URL("src/lexicon-data.js", root);
const OUT_MANIFEST = new URL("data/lexicon/manifest.json", root);

export const SOURCES = {
  census2010: {
    title: "US Census Bureau, Frequently Occurring Surnames from the 2010 Census (Names_2010Census.csv)",
    url: "https://www2.census.gov/topics/genealogy/2010surnames/names.zip",
    license: "Public domain (US government work)",
    sha256: "6b4933178060b4e5ac8dd9a611ec15472d35eab98fe9027474bc5ccc5b7a8708",
    use: "Surnames that occur 100 or more times, and separately those that occur 1,000 or more times",
  },
  female: {
    title: "US Census Bureau, 1990 Census female first names (dist.female.first)",
    url: "https://www2.census.gov/topics/genealogy/1990surnames/dist.female.first",
    license: "Public domain (US government work)",
    sha256: "bd2f310fc4e5d5e5ea122c9d4342c9821145823118eb20db1647f305ec77b358",
    use: "First names",
  },
  male: {
    title: "US Census Bureau, 1990 Census male first names (dist.male.first)",
    url: "https://www2.census.gov/topics/genealogy/1990surnames/dist.male.first",
    license: "Public domain (US government work)",
    sha256: "0a5078ef6effe3b483d15b0f7f95047662126c9bfb624ecd5e5b978fc0f2470b",
    use: "First names",
  },
  fda: {
    title: "US FDA, Drugs@FDA data files, Products.txt (DrugName and ActiveIngredient columns)",
    url: "https://www.fda.gov/media/89850/download",
    license: "Public domain (US government work)",
    sha256: "ca06aa71a38bfd70c62df724d3c6144897ba8a96b8e2b7b57255a84396c897f2",
    use: "Drug brand names and active ingredients",
  },
  icd: {
    title: "CMS, ICD-10-CM 2025 code descriptions in tabular order (icd10cm_codes_2025.txt)",
    url: "https://www.cms.gov/files/zip/2025-code-descriptions-tabular-order.zip",
    license: "Public domain (US government work)",
    sha256: "d4dcdbc05997e2c3f9728a0d44ae8fa9101cc37648769d95747a153a3f56e9be",
    use: "Words used in diagnosis descriptions",
  },
  english: {
    title: "Webster's Second International word list (web2, as distributed in BSD and macOS /usr/share/dict)",
    url: "https://cgit.freebsd.org/src/tree/share/dict/web2",
    license: "Public domain (the 1934 copyright has lapsed, per the distribution README)",
    sha256: "be41ad97963bf8dabedd5871d5d691596175269d540956b0f9965a885c2bbab9",
    use: "Lowercase entries as ordinary English words. Capitalized entries ending in -an, -ese, -ish, -ic or -i as proper adjectives (nationalities, languages, peoples)",
  },
};

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readVerified(key, path) {
  const buf = fs.readFileSync(path);
  const got = sha256(buf);
  if (got !== SOURCES[key].sha256) throw new Error(`${key}: sha256 ${got} does not match pinned ${SOURCES[key].sha256}`);
  return buf.toString("latin1");
}

function lines(text) {
  return text.split(/\r?\n/);
}

export function buildSets(texts) {
  const surnames = new Set();
  const commonSurnames = new Set();
  const [header, ...rows] = lines(texts.census2010);
  const cols = header.split(",");
  const iName = cols.indexOf("name");
  const iCount = cols.indexOf("count");
  for (const row of rows) {
    const p = row.split(",");
    if (!p[iName] || p[iName] === "ALL OTHER NAMES") continue;
    if (Number(p[iCount]) >= 100) surnames.add(foldKey(p[iName]));
    if (Number(p[iCount]) >= 1000) commonSurnames.add(foldKey(p[iName]));
  }
  const first = new Set();
  for (const t of [texts.female, texts.male]) {
    for (const row of lines(t)) {
      const name = row.trim().split(/\s+/)[0];
      if (name) first.add(foldKey(name));
    }
  }
  const drugs = new Set();
  const [fdaHeader, ...fdaRows] = lines(texts.fda);
  const fcols = fdaHeader.split("\t");
  const iDrug = fcols.indexOf("DrugName");
  const iIngr = fcols.indexOf("ActiveIngredient");
  for (const row of fdaRows) {
    const p = row.split("\t");
    for (const field of [p[iDrug], p[iIngr]]) {
      for (const t of String(field || "").match(/[A-Za-z]+/g) || []) if (t.length >= 3) drugs.add(foldKey(t));
    }
  }
  const icd = new Set();
  for (const row of lines(texts.icd)) {
    const desc = row.slice(8);
    for (const t of desc.match(/[A-Za-z]+/g) || []) if (t.length >= 3) icd.add(foldKey(t));
  }
  const english = new Set();
  // Capitalized dictionary entries with a nationality, language or people
  // ending (Chinese, Moroccan, Hispanic, Israeli): proper adjectives, not names.
  const demonyms = new Set();
  for (const row of lines(texts.english)) {
    const w = row.trim();
    if (/^[a-z]{2,}$/.test(w)) english.add(w);
    else if (/^[A-Z][a-z]+$/.test(w) && /(?:an|ese|ish|ic|i)$/.test(w)) demonyms.add(foldKey(w));
  }
  for (const s of [surnames, commonSurnames, first, drugs, icd, english, demonyms]) s.delete("");
  return { surnames, commonSurnames, first, drugs, icd, english, demonyms };
}

function moduleText(sets) {
  const enc = Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, frontCode([...v])]));
  const counts = Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.size]));
  return (
    "// GENERATED by scripts/build-lexicon.mjs. Do not edit by hand.\n" +
    "// Public-domain vocabularies, front-coded. Sources and hashes: data/lexicon/manifest.json.\n" +
    `export const LEXICON_COUNTS = ${JSON.stringify(counts)};\n` +
    Object.entries(enc)
      .map(([k, v]) => `export const ${k.toUpperCase()} = ${JSON.stringify(v)};\n`)
      .join("")
  );
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (process.argv.includes("--check")) {
    const manifest = JSON.parse(fs.readFileSync(OUT_MANIFEST, "utf8"));
    const got = sha256(fs.readFileSync(OUT_MODULE));
    if (got !== manifest.module.sha256) {
      console.error(`src/lexicon-data.js sha256 ${got} does not match manifest ${manifest.module.sha256}`);
      process.exit(1);
    }
    console.log("lexicon module matches manifest");
  } else {
    const paths = { census2010: arg("census2010"), female: arg("female"), male: arg("male"), fda: arg("fda"), icd: arg("icd"), english: arg("english") };
    for (const [k, v] of Object.entries(paths)) if (!v) throw new Error(`missing --${k}`);
    const texts = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readVerified(k, p)]));
    const sets = buildSets(texts);
    const text = moduleText(sets);
    fs.mkdirSync(new URL("data/lexicon/", root), { recursive: true });
    fs.writeFileSync(OUT_MODULE, text);
    const manifest = {
      note: "Public vocabularies behind the name tier. No word is added by hand and nothing is read from the evaluation fixtures.",
      fold: "NFKD, remove combining marks, lowercase, keep a to z only (src/text-fold.js)",
      sources: SOURCES,
      counts: Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.size])),
      module: { path: "src/lexicon-data.js", bytes: Buffer.byteLength(text), sha256: sha256(Buffer.from(text)) },
    };
    fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    console.log(JSON.stringify(manifest.counts), `${manifest.module.bytes} bytes`);
  }
}
