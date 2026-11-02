import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { plant, plantCorpus, serialize, untouchedIds, FAMILIES, SEED } from '../eval/public-plant.js'

// Set B planting rules from docs/REAL-TEXT-EVAL.md. Offline, committed files only.
const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const manifest = JSON.parse(read('data/public/manifest.json'))
const key = JSON.parse(read('data/public/planted.json'))
const original = doc => read(doc.file)

test('every original excerpt is already in final serialized form', () => {
 for (const doc of manifest.documents) assert.equal(serialize(original(doc)), original(doc), doc.id)
 assert.equal(serialize('a  b\t c \r\nd\n\n\n'), 'a b c\nd\n')
 assert.equal(serialize('e\u0301'), '\u00e9\n')
})

test('the committed answer key is exactly what the generator produces from its seed', () => {
 assert.equal(key.seed, SEED)
 assert.match(key.status, /not a blind test/)
 assert.deepEqual(key.documents, plantCorpus(key.seed))
})

test('every document, planted or not, leaves through the same serializer', () => {
 for (const doc of key.documents) assert.equal(serialize(doc.text), doc.text, doc.id)
})

test('a planted document differs from its original only inside recorded edits, and each edit holds a planted span', () => {
 for (const doc of manifest.documents) {
  const planted = key.documents.find(d => d.id === doc.id)
  const source = original(doc)
  if (!planted.planted) { assert.equal(planted.text, source, `${doc.id} must be byte identical`); continue }
  // Rebuild the original by undoing each edit. Anything outside an edit must match byte for byte.
  let rebuilt = ''
  let cursor = 0
  for (const edit of planted.edits) {
   rebuilt += planted.text.slice(cursor, edit.start) + edit.replaced
   cursor = edit.end
   assert.equal(source.slice(edit.originalStart, edit.originalEnd), edit.replaced)
   const inside = planted.spans.filter(s => s.start >= edit.start && s.end <= edit.end)
   assert.ok(inside.length > 0, `${doc.id} edit at ${edit.start} carries no planted identifier`)
   // Glue is a title, a field label, punctuation or a line break, never new clinical content.
   const glue = edit.end - edit.start - inside.reduce((n, s) => n + s.end - s.start, 0)
   assert.ok(glue <= 32 * inside.length, `${doc.id} edit at ${edit.start} adds ${glue} characters of glue`)
  }
  rebuilt += planted.text.slice(cursor)
  assert.equal(rebuilt, source, doc.id)
  for (const span of planted.spans) assert.ok(planted.edits.some(e => span.start >= e.start && span.end <= e.end))
  assert.doesNotMatch(planted.text, / {2}|\( | \)| ,|,,|\.\./, `${doc.id} has a spacing or punctuation trace`)
 }
})

test('untouched documents are mixed in and planted documents vary in identifier count', () => {
 const counts = key.documents.map(d => d.spans.length)
 const untouched = key.documents.filter(d => !d.planted)
 assert.deepEqual(new Set(untouched.map(d => d.id)), untouchedIds(SEED))
 assert.ok(untouched.some(d => d.split === 'dev') && untouched.some(d => d.split === 'heldout'))
 assert.ok(untouched.some(d => d.id.startsWith('pmc-')), 'untouched case reports, not only coverage policies')
 assert.ok(new Set(counts.filter(n => n > 0)).size >= 3)
})

test('format families and values are split by partition and no value repeats', () => {
 const dev = new Set(Object.values(FAMILIES.dev).flat())
 for (const family of Object.values(FAMILIES.heldout).flat()) assert.ok(!dev.has(family), family)
 for (const doc of key.documents) for (const span of doc.spans) {
  assert.equal(span.split, doc.split)
  assert.ok(Object.values(FAMILIES[doc.split]).flat().includes(span.family), `${doc.id} ${span.family}`)
 }
 const values = key.documents.flatMap(d => d.spans.filter(s => s.type !== 'NAME').map(s => s.value))
 assert.equal(new Set(values).size, values.length)
 const nameWordDocs = new Map()
 for (const doc of key.documents) for (const s of doc.spans.filter(s => s.type === 'NAME')) for (const w of s.value.split(/[\s,.]+/).filter(w => w.length > 1)) {
  const k = w.toLowerCase()
  assert.ok(!nameWordDocs.has(k) || nameWordDocs.get(k) === doc.id, `name word ${w} appears in two documents`)
  nameWordDocs.set(k, doc.id)
 }
})

test('identifiers land in hard places, not only easy inline positions', () => {
 const challenges = new Set(key.documents.flatMap(d => d.spans.flatMap(s => s.challenge)))
 for (const c of ['header', 'footer', 'narrative', 'possessive', 'initials', 'surname-only', 'relative', 'line-break', 'common-word', 'birth-date']) assert.ok(challenges.has(c), `no planted span in challenge group ${c}`)
 const wrapped = key.documents.flatMap(d => d.spans).filter(s => s.challenge.includes('line-break'))
 assert.ok(wrapped.every(s => s.value.includes('\n')))
})

test('edits follow each document\'s own conventions', () => {
 for (const doc of manifest.documents) {
  const planted = key.documents.find(d => d.id === doc.id)
  const source = original(doc)
  for (const span of planted.spans) {
   // A document written with U+2010 hyphens and curly apostrophes gets names written the same way.
   if (span.type === 'NAME' && /[-‐]/.test(span.value)) assert.ok(source.includes(span.value.match(/[-‐]/)[0]), `${doc.id} hyphen style`)
   if (span.type === 'NAME' && /['’]/.test(span.value)) assert.ok(source.includes(span.value.match(/['’]/)[0]), `${doc.id} apostrophe style`)
   // Day-first documents get day-first numeric dates.
   if (span.family === 'date:numeric-slash' && /\b\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(source)) assert.ok(Number(span.value.slice(0, 2)) <= 31)
  }
 }
})

test('the swap run keeps structure and redraws every value', () => {
 const avoid = new Set(key.documents.flatMap(d => d.spans.flatMap(s => s.value.split(/[\s,\n]+/))))
 const swapped = plantCorpus(SEED, { valueSeed: SEED + 1, avoid })
 for (const doc of key.documents) {
  const other = swapped.find(d => d.id === doc.id)
  assert.equal(other.spans.length, doc.spans.length, doc.id)
  for (let i = 0; i < doc.spans.length; i++) {
   assert.equal(other.spans[i].type, doc.spans[i].type)
   assert.equal(other.spans[i].family, doc.spans[i].family)
   assert.deepEqual(other.spans[i].challenge.filter(c => c !== 'common-word'), doc.spans[i].challenge.filter(c => c !== 'common-word'))
  }
 }
 const before = new Set(key.documents.flatMap(d => d.spans.map(s => s.value)))
 const reused = swapped.flatMap(d => d.spans.map(s => s.value)).filter(v => before.has(v))
 assert.deepEqual(reused, [])
})

test('planting is a pure function of the document and seed', () => {
 const doc = manifest.documents.find(d => d.id === key.documents.find(k => k.planted).id)
 assert.deepEqual(plant(doc, SEED), plant({ ...doc }, SEED))
 assert.notDeepEqual(plant(doc, SEED + 7).text, undefined)
})
