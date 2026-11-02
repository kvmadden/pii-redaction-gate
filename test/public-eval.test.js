import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { predictBatch, GATES, bootstrap } from '../eval/public-run.js'
import { scorePlanted, redactedMask } from '../eval/public-score.js'

const root = new URL('../', import.meta.url)
const json = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'))
const key = json('data/public/planted.json')
const versions = [json('eval/public-results.json'), json('eval/public-results-v2.json')]
const results = versions[1]

test('changing planted markers, gold spans, source labels or partition IDs does not change predictions', () => {
 const texts = key.documents.map(d => d.text)
 const baseline = predictBatch(GATES.gate, texts)
 // Strip, scramble and swap every piece of metadata. Only text reaches the gate.
 const scrambled = key.documents.map((d, i) => ({ ...d, id: `x${i}`, split: d.split === 'dev' ? 'heldout' : 'dev', planted: !d.planted, spans: [], edits: [], source: 'unknown' }))
 assert.deepEqual(predictBatch(GATES.gate, scrambled.map(d => d.text)), baseline)
 assert.deepEqual(predictBatch(GATES.gate, [...texts].reverse()).reverse(), baseline)
 assert.equal(GATES.gate.length, 1, 'the gate function takes text only')
})

test('controls move the metrics in opposite directions on identical inputs', () => {
 for (const results of versions) for (const split of ['dev', 'heldout']) {
  assert.equal(results.planted.doNothing[split].fullyRemoved, 0)
  assert.equal(results.planted.redactEverything[split].fullyRemoved, results.planted.redactEverything[split].spans)
  assert.equal(results.untouched.doNothing[split].keepTokensRemoved, 0)
  assert.equal(results.untouched.redactEverything[split].keepTokensRemoved, results.untouched.redactEverything[split].keepTokens)
  assert.equal(results.untouched.redactEverything[split].extractedAfter, 0)
 }
 assert.equal(results.setA.doNothing.fullyRemoved, 0)
 assert.equal(results.setA.redactEverything.clinicalNegativesKept, 0)
})

test('swap reruns with fresh values score within noise of the key run', () => {
 assert.equal(results.swap.runs.length, 5)
 assert.equal(results.swap.withinNoise, true)
 for (const run of results.swap.runs) assert.equal(run.heldoutSpans, results.planted.gate.heldout.spans)
})

test('results keep the three sets apart and mark draft labels', () => {
 assert.equal(results.overall, undefined)
 for (const g of Object.keys(GATES)) assert.ok(results.setA[g] && results.planted[g] && results.untouched[g])
 assert.equal(results.untouched.gate.heldout.status, 'draft, pending pharmacist review')
 assert.match(results.benchmark, /not a blind test/)
 assert.ok(results.indistinguishability.body.meanAccuracy != null)
 assert.equal(results.indistinguishability.human.status, 'not yet done')
})

test('a bracketed word the source itself contains is not counted as a redaction', () => {
 const text = 'organ systems of the [human] body'
 assert.deepEqual(redactedMask(text, text).filter(Boolean), [])
 const doc = { id: 'f', text: 'Pt: Ines Ruiz\nseen', spans: [{ start: 4, end: 13, value: 'Ines Ruiz', type: 'NAME', family: 'f', challenge: ['header'] }] }
 assert.equal(scorePlanted(doc, 'Pt: [name] seen').full, 1, 'a line break the gate turned into a space still aligns')
})

test('document bootstrap interval brackets the point estimate', () => {
 const rows = [{ a: 1, b: 2 }, { a: 2, b: 2 }, { a: 0, b: 1 }]
 const [lo, hi] = bootstrap(rows, r => r.a, r => r.b)
 assert.ok(lo <= 0.6 && hi >= 0.6)
})
