import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { examples, metricRows, recordReview } from '../docs/workspace.js'
const comparison = JSON.parse(fs.readFileSync(new URL('../eval/comparison.json', import.meta.url)))
test('three clinical document fixtures preserve provenance and clinical context', () => {
 for (const type of ['fax','discharge','refill']) {
  assert.ok(examples[type].text.includes('metformin 500 mg BID'))
  assert.ok(examples[type].source.includes('Synthetic'))
 }
})
test('metrics retain gold type recall and explicit grouped precision from canonical evaluation', () => {
 const rows = metricRows(comparison, 'original')
 const age = rows.find(r => r.type === 'AGE')
 assert.equal(age.recall, comparison.original.after.byType.AGE.recall)
 assert.equal(rows.find(r => r.type === 'DOB').precision, comparison.original.after.precisionByFamily.DATE.precision)
 assert.equal(rows.find(r => r.type === 'DOB').family, 'DATE')
 assert.equal(metricRows(comparison, 'heldout').length, Object.keys(comparison.heldout.after.byType).length)
})
test('review log persists only metadata and rejects failed or stale inspection', () => {
 let value = null
 const storage = {getItem: () => value, setItem: (_, next) => { value = next }}
 const context = {ready:true, blocked:false, document:'fax', profile:'identifiers', revision:3}
 const entry = recordReview(storage, 'flagged', context, '2026-11-01T12:00:00Z')
 assert.equal(entry.action, 'flagged')
 assert.equal(JSON.parse(value).length, 1)
 assert.deepEqual(Object.keys(entry).sort(), ['action','at','document','profile','revision'])
 recordReview(storage, 'reviewed', context)
 assert.equal(JSON.parse(value).length, 2)
 assert.throws(() => recordReview(storage, 'reviewed', {...context, blocked:true}))
 assert.throws(() => recordReview(storage, 'reviewed', {...context, ready:false}))
 assert.throws(() => recordReview({getItem: () => 'invalid'}, 'reviewed', context))
 assert.throws(() => recordReview({getItem: () => null, setItem: () => {throw Error('full')}}, 'reviewed', context))
})

test('browser evaluation artifact is byte-identical to its canonical source', () => {
 assert.equal(fs.readFileSync(new URL('../docs/comparison.json', import.meta.url), 'utf8'), fs.readFileSync(new URL('../eval/comparison.json', import.meta.url), 'utf8'))
})
