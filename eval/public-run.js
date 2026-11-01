#!/usr/bin/env node
// eval/public-run.js. Offline real-text evaluation. Three sets, three panels, no pooled number.
//
//   A  frozen synthetic held-out notes (eval/heldout.json)
//   B  real public text with fictional identifiers planted in (data/public/planted.json)
//   C  the same real public text, untouched, with draft keep and extraction labels
//
// Every set is also run through two controls on identical inputs: a do-nothing gate and a
// redact-everything gate. Results are written to eval/public-results.json and .md.
//
//   node eval/public-run.js           run and write results
//   node eval/public-run.js --check   run and fail if results differ from the committed files

import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { redactText } from '../src/engine.js'
import { scoreSnippet, aggregate } from './score.js'
import { scorePlanted, scoreUntouched } from './public-score.js'
import { plantCorpus, SEED } from './public-plant.js'
import { indistinguishability, wilson } from './public-indist.js'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const json = path => JSON.parse(read(path))
const manifest = json('data/public/manifest.json')
const key = json('data/public/planted.json')
const labels = json('data/public/labels.json')
const heldout = json('eval/heldout.json')
const EMPTY_MAP = { people: [], safe: [] }
const DRAFT = 'draft, pending pharmacist review'

// ---------- gates ----------
export const GATES = {
 gate: text => redactText(text, { profile: 'identifiers', peopleMap: EMPTY_MAP }).text,
 doNothing: text => text,
 redactEverything: text => text.replace(/[\p{L}\p{N}]+/gu, '[redacted]'),
}

/**
 * The only path from documents to the gate. It takes text alone, assigns fresh random IDs and
 * shuffles, so neither order nor any metadata can reach the gate.
 */
export function predictBatch(gate, texts) {
 const items = texts.map((text, index) => ({ runId: randomUUID(), text, index }))
 for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[items[i], items[j]] = [items[j], items[i]] }
 const outputs = new Array(texts.length)
 for (const item of items) outputs[item.index] = gate(item.text)
 return outputs
}

// ---------- helpers ----------
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
/** Document-level percentile bootstrap of sum(num) / sum(den). */
export function bootstrap(rows, num, den, { reps = 2000, seed = 4242 } = {}) {
 if (!rows.length) return null
 const r = seeded(seed)
 const stats = []
 for (let i = 0; i < reps; i++) {
  let a = 0, b = 0
  for (let j = 0; j < rows.length; j++) { const row = rows[Math.floor(r() * rows.length)]; a += num(row); b += den(row) }
  if (b) stats.push(a / b)
 }
 stats.sort((x, y) => x - y)
 return [stats[Math.floor(0.025 * stats.length)], stats[Math.ceil(0.975 * stats.length) - 1]]
}
const ratio = (a, b) => (b ? a / b : null)
function merge(into, table) { for (const [k, row] of Object.entries(table)) { const t = (into[k] ||= { n: 0, full: 0, partial: 0, missed: 0 }); for (const f of ['n', 'full', 'partial', 'missed']) t[f] += row[f] } return into }
function withRecall(table) { for (const row of Object.values(table)) row.recall = ratio(row.full, row.n); return table }
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()

// ---------- Set A ----------
function setA(gateName) {
 const outs = predictBatch(GATES[gateName], heldout.entries.map(e => e.text))
 const agg = aggregate(heldout.entries.map((e, i) => scoreSnippet(e, outs[i])))
 const o = agg.overall
 return {
  identifiers: o.entities, fullyRemoved: Math.round(o.entityRecall * o.entities), partial: o.entityPartial,
  recall: o.entityRecall, spansEmitted: o.spansEmitted, spanPrecision: o.spanPrecision,
  clinicalNegatives: o.hardNegatives, clinicalNegativesKept: Math.round(o.hardNegativesKept * o.hardNegatives), clinicalNegativesKeptRate: o.hardNegativesKept,
  byType: Object.fromEntries(Object.entries(agg.byType).map(([t, r]) => [t, { n: r.n, full: r.full, partial: r.partial, missed: r.missed, recall: r.recall }])),
 }
}

// ---------- Set B ----------
function scoreSetB(docs, outputs) {
 const out = {}
 for (const split of ['dev', 'heldout']) {
  const rows = docs.map((d, i) => ({ d, i })).filter(({ d }) => d.split === split && d.planted).map(({ d, i }) => scorePlanted(d, outputs[i]))
  const sum = f => rows.reduce((s, r) => s + r[f], 0)
  out[split] = {
   plantedDocuments: rows.length,
   untouchedDocumentsInRun: docs.filter(d => d.split === split && !d.planted).length,
   spans: sum('n'), fullyRemoved: sum('full'), partial: sum('partial'), missed: sum('missed'),
   recall: ratio(sum('full'), sum('n')),
   recallInterval95: bootstrap(rows, r => r.full, r => r.n),
   documentsWithAnyIdentifierLeft: rows.filter(r => r.full < r.n).length,
   byType: withRecall(rows.reduce((t, r) => merge(t, r.byType), {})),
   byFamily: withRecall(rows.reduce((t, r) => merge(t, r.byFamily), {})),
   byChallenge: withRecall(rows.reduce((t, r) => merge(t, r.byChallenge), {})),
   spanResults: rows.flatMap(r => r.spans),
  }
 }
 return out
}

// ---------- Set C ----------
function scoreSetC(outputs) {
 const out = {}
 for (const split of ['dev', 'heldout']) {
  const rows = labels.documents.map((d, i) => ({ d, i })).filter(({ d }) => d.split === split).map(({ d, i }) => ({ ...scoreUntouched({ ...d, text: originals[i] }, outputs[i]), doc: d }))
  const sum = f => rows.reduce((s, r) => s + r[f], 0)
  const byType = {}
  for (const r of rows) for (const [when, table] of [['before', r.extractionByTypeBefore], ['after', r.extractionByTypeAfter]]) for (const [t, v] of Object.entries(table)) { const row = (byType[t] ||= { labeled: 0, before: 0, after: 0 }); if (when === 'before') row.labeled += v.labeled; row[when] += v.found }
  const real = rows.flatMap(r => r.realIdentifiers.map(x => ({ ...x, id: r.id })))
  out[split] = {
   status: DRAFT,
   documents: rows.length,
   keepTokens: sum('keepTokens'), keepTokensRemoved: sum('clinicalTokensRemoved'),
   overRedactionRate: ratio(sum('clinicalTokensRemoved'), sum('keepTokens')),
   overRedactionInterval95: bootstrap(rows, r => r.clinicalTokensRemoved, r => r.keepTokens),
   extractionLabels: sum('extractionsLabeled'), extractedBefore: sum('extractionsBefore'), extractedAfter: sum('extractionsAfter'),
   extractionByType: byType,
   unlabeledExtractionsBefore: sum('unlabeledExtractionsBefore'), unlabeledExtractionsAfter: sum('unlabeledExtractionsAfter'),
   sourceLeftInIdentifiers: { n: real.length, fullyRemoved: real.filter(x => x.status === 'full').length, partial: real.filter(x => x.status === 'partial').length, missed: real.filter(x => x.status === 'missed').length },
   removedKeepTokens: rows.flatMap(r => r.removedTokens.map(t => ({ id: r.id, token: t }))),
   sourceLeftIn: real,
  }
 }
 return out
}

// ---------- run ----------
const originals = manifest.documents.map(d => read(d.file))
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
const keyDocs = manifest.documents.map(d => key.documents.find(k => k.id === d.id))
const results = {
 benchmark: 'Fixed public benchmark. The generator, seed and answer key are public, so this is not a blind test.',
 provenance: {
  gateCommit: git(['log', '-1', '--format=%H', '--', 'src']),
  generatorCommit: git(['log', '-1', '--format=%H', '--', 'eval/public-plant.js']),
  answerKeyCommit: git(['log', '-1', '--format=%H', '--', 'data/public/planted.json']),
  labelsCommit: git(['log', '-1', '--format=%H', '--', 'data/public/labels.json']),
  seed: SEED,
  frozenNote: 'The gate in src/ was not changed after the generator and key were committed. Any later gate change is a regression check, not a new result.',
 },
 setA: {}, planted: {}, untouched: {},
}
results.generatorCommit = results.provenance.generatorCommit
for (const g of Object.keys(GATES)) {
 results.setA[g] = setA(g)
 // Set B: every document, planted and untouched, in one shuffled call.
 results.planted[g] = scoreSetB(keyDocs, predictBatch(GATES[g], keyDocs.map(d => d.text)))
 results.untouched[g] = scoreSetC(predictBatch(GATES[g], originals))
}
// Contract shape: the real gate's Set B and C results sit at the top level.
Object.assign(results.planted, { heldout: results.planted.gate.heldout, dev: results.planted.gate.dev })

// Swap test: same structure, every value redrawn, five times.
const avoid = new Set(key.documents.flatMap(d => d.spans.flatMap(s => s.value.split(/[\s,\n]+/))))
const swaps = []
for (let k = 1; k <= 5; k++) {
 const docs = plantCorpus(SEED, { valueSeed: SEED + 1000 * k, avoid })
 const scored = scoreSetB(docs, predictBatch(GATES.gate, docs.map(d => d.text)))
 swaps.push({ valueSeed: SEED + 1000 * k, heldoutRecall: scored.heldout.recall, heldoutFull: scored.heldout.fullyRemoved, heldoutSpans: scored.heldout.spans, devRecall: scored.dev.recall, byType: Object.fromEntries(Object.entries(scored.heldout.byType).map(([t, r]) => [t, `${r.full}/${r.n}`])) })
}
const ci = results.planted.gate.heldout.recallInterval95
results.swap = {
 runs: swaps,
 keyHeldoutRecall: results.planted.gate.heldout.recall,
 rule: 'Every swap run must fall inside the 95 percent document bootstrap interval of the key run.',
 withinNoise: swaps.every(s => s.heldoutRecall >= ci[0] && s.heldoutRecall <= ci[1]),
}

// Metadata invariance: predictions depend on text alone.
const again = predictBatch(GATES.gate, [...keyDocs].reverse().map(d => d.text)).reverse()
const first = predictBatch(GATES.gate, keyDocs.map(d => d.text))
results.metadataInvariance = { rule: 'Same outputs after reversing order, fresh random IDs and a second call.', identical: again.every((o, i) => o === first[i]) }

// Indistinguishability, automatic. The human check is generated separately and not yet done.
const indist = indistinguishability(keyDocs, manifest.documents.map((d, i) => ({ id: d.id, text: originals[i] })))
for (const row of Object.values(indist)) row.interval95 = wilson(row.pooledCorrect / row.draws, row.pooledN / row.draws)
results.indistinguishability = {
 method: 'Mask each planted edit as <ID>, take up to 60 characters each side on the same line, match with windows around random one or two word runs in untouched text, character 2 to 4 gram logistic regression, 5 folds grouped by document, 20 negative draws.',
 ...indist,
 human: { status: 'not yet done', sheet: 'docs/blind-check.md' },
}

// Failure lists, ordered by a fixed severity rule: missed, then partial, then over-redaction.
const sev = { missed: 0, partial: 1 }
results.failures = {
 rule: 'Severity order: missed planted identifier, partial leak, removed clinical keep token, source-left-in identifier not removed. Within a class, document id then position.',
 missedPlanted: ['heldout', 'dev'].flatMap(split => results.planted.gate[split].spanResults.filter(s => s.status !== 'full').map(s => ({ split, ...s }))).sort((a, b) => sev[a.status] - sev[b.status] || a.id.localeCompare(b.id)),
 overRedaction: ['heldout', 'dev'].flatMap(split => results.untouched.gate[split].removedKeepTokens.map(t => ({ split, ...t, status: DRAFT }))),
 sourceLeftInKept: ['heldout', 'dev'].flatMap(split => results.untouched.gate[split].sourceLeftIn.filter(s => s.status !== 'full').map(s => ({ split, ...s }))),
}
results.untouched.status = DRAFT

// ---------- markdown ----------
const pct = x => (x == null ? 'N/A' : `${(x * 100).toFixed(1)}%`)
const frac = (a, b) => `${a}/${b}`
const iv = v => (v ? `${pct(v[0])} to ${pct(v[1])}` : 'N/A')
const cell = row => (row.n < 10 ? frac(row.full, row.n) : `${frac(row.full, row.n)} (${pct(row.recall)})`)
const md = []
const A = results.setA, B = results.planted, C = results.untouched
md.push('# Real-text evaluation results', '')
md.push(`${results.benchmark} Gate commit \`${results.provenance.gateCommit.slice(0, 7)}\`, generator \`${results.provenance.generatorCommit.slice(0, 7)}\`, answer key \`${results.provenance.answerKeyCommit.slice(0, 7)}\`, labels \`${results.provenance.labelsCommit.slice(0, 7)}\`. Seed ${SEED}. Produced by \`node eval/public-run.js\`, offline. Three separate panels. There is no pooled score.`, '')
md.push('## Panel A. Synthetic held-out notes', '', 'Question: does it catch identifiers? Limit: synthetic text is cleaner than real notes.', '')
md.push('| Gate | Identifiers fully removed | Partial | Span precision | Clinical negatives kept |', '|---|---|---|---|---|')
for (const g of Object.keys(GATES)) md.push(`| ${g} | ${frac(A[g].fullyRemoved, A[g].identifiers)} (${pct(A[g].recall)}) | ${A[g].partial} | ${pct(A[g].spanPrecision)} | ${frac(A[g].clinicalNegativesKept, A[g].clinicalNegatives)} (${pct(A[g].clinicalNegativesKeptRate)}) |`)
md.push('', '## Panel B. Real public text with planted fictional identifiers', '', 'Question: does it catch identifiers inside real clinical language? Limit: planted by a program, not written by a clinician. Planted-span recall only, so other detections are not called false positives.', '')
md.push('| Gate | Split | Planted docs | Untouched docs in run | Spans fully removed | Partial | Missed | 95% interval | Docs with any identifier left |', '|---|---|---|---|---|---|---|---|---|')
for (const g of Object.keys(GATES)) for (const s of ['heldout', 'dev']) { const r = B[g][s]; md.push(`| ${g} | ${s} | ${r.plantedDocuments} | ${r.untouchedDocumentsInRun} | ${frac(r.fullyRemoved, r.spans)} (${pct(r.recall)}) | ${r.partial} | ${r.missed} | ${g === 'gate' ? iv(r.recallInterval95) : ''} | ${frac(r.documentsWithAnyIdentifierLeft, r.plantedDocuments)} |`) }
for (const s of ['heldout', 'dev']) {
 md.push('', `### Gate, ${s}, by type, format family and challenge group`, '', 'Counts under 10 are shown as counts only.', '', '| Group | Fully removed |', '|---|---|')
 for (const [label, table] of [['type', B.gate[s].byType], ['family', B.gate[s].byFamily], ['challenge', B.gate[s].byChallenge]]) for (const [k, row] of Object.entries(table).sort()) md.push(`| ${label}: ${k} | ${cell(row)} |`)
}
md.push('', `Swap test: five reruns with every planted value redrawn. Held-out recall ${results.swap.runs.map(s => frac(s.heldoutFull, s.heldoutSpans)).join(', ')} against ${frac(B.gate.heldout.fullyRemoved, B.gate.heldout.spans)} for the key. ${results.swap.withinNoise ? 'All inside' : 'Not all inside'} the key run's 95% interval.`)
md.push('', `Metadata invariance: ${results.metadataInvariance.identical ? 'identical outputs' : 'OUTPUTS DIFFER'} after reversing order with fresh random IDs.`)
const bi = results.indistinguishability
md.push('', '### Can the edits be told apart from untouched text?', '', '| Windows | Planted windows | Held-out accuracy, mean of 20 draws | Range | 95% interval |', '|---|---|---|---|---|')
for (const k of ['body', 'header-footer']) md.push(`| ${k} | ${bi[k].plantedWindows} | ${pct(bi[k].meanAccuracy)} | ${pct(bi[k].minAccuracy)} to ${pct(bi[k].maxAccuracy)} | ${iv(bi[k].interval95)} |`)
md.push('', 'Near 50% means the masked context gives the edit away no better than chance. Header and footer lines only exist in planted documents, so they are a structural trace by construction. The human blind check is not yet done.')
md.push('', '## Panel C. Untouched real public text', '', `Question: does it leave the clinical meaning alone? Limit: small hand-labeled pilot set. Labels are ${DRAFT}.`, '')
md.push('| Gate | Split | Docs | Keep tokens removed | 95% interval | Labeled facts extracted before | After | Source-left-in dates removed |', '|---|---|---|---|---|---|---|---|')
for (const g of Object.keys(GATES)) for (const s of ['heldout', 'dev']) { const r = C[g][s]; md.push(`| ${g} | ${s} | ${r.documents} | ${frac(r.keepTokensRemoved, r.keepTokens)} (${pct(r.overRedactionRate)}) | ${g === 'gate' ? iv(r.overRedactionInterval95) : ''} | ${frac(r.extractedBefore, r.extractionLabels)} | ${frac(r.extractedAfter, r.extractionLabels)} | ${frac(r.sourceLeftInIdentifiers.fullyRemoved, r.sourceLeftInIdentifiers.n)} |`) }
for (const s of ['heldout', 'dev']) {
 md.push('', `### Gate, ${s}, extraction by type (${DRAFT})`, '', '| Type | Labeled | Before | After |', '|---|---|---|---|')
 for (const [t, row] of Object.entries(C.gate[s].extractionByType).sort()) md.push(`| ${t} | ${row.labeled} | ${row.before} | ${row.after} |`)
}
md.push('', 'Extraction before and after are each scored against the labels. Agreement between the two runs is not a quality score.')
md.push('', '## Failure gallery', '', `${results.failures.rule} The first 10 of each list are shown. Full lists are in \`eval/public-results.json\` under \`failures\`.`, '')
md.push(`### Missed or partly removed planted identifiers (${results.failures.missedPlanted.length})`, '', '| Split | Document | Type | Family | Challenge | Value | Result |', '|---|---|---|---|---|---|---|')
for (const f of results.failures.missedPlanted.slice(0, 10)) md.push(`| ${f.split} | ${f.id} | ${f.type} | ${f.family} | ${f.challenge.join(', ')} | ${f.value.replace(/\n/g, '↵')} | ${f.status} |`)
md.push('', `### Clinical keep tokens removed (${results.failures.overRedaction.length})`, '', '| Split | Document | Token |', '|---|---|---|')
for (const f of results.failures.overRedaction.slice(0, 10)) md.push(`| ${f.split} | ${f.id} | ${f.token} |`)
md.push('', `### Source-left-in dates not fully removed (${results.failures.sourceLeftInKept.length})`, '', '| Split | Document | Value | Result |', '|---|---|---|---|')
for (const f of results.failures.sourceLeftInKept.slice(0, 10)) md.push(`| ${f.split} | ${f.id} | ${f.value} | ${f.status} |`)
md.push('')

const jsonText = JSON.stringify(results, null, 1) + '\n'
const mdText = md.join('\n')
if (process.argv.includes('--check')) {
 if (read('eval/public-results.json') !== jsonText || read('eval/public-results.md') !== mdText) { console.error('Public results differ from the committed files. Run node eval/public-run.js and review the diff.'); process.exit(1) }
 console.log('Public results reproduce the committed files.')
} else {
 writeFileSync(new URL('eval/public-results.json', root), jsonText)
 writeFileSync(new URL('eval/public-results.md', root), mdText)
 process.stdout.write(mdText)
}
}
