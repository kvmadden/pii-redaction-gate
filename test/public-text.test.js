import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const json = path => JSON.parse(read(path))
const required = path => assert.ok(existsSync(new URL(path, root)), `Missing required public evaluation artifact: ${path}`)

// These tests deliberately require committed artifacts and use no remote service.
test('public manifest permits only approved sources and verifies committed text hashes', () => {
 required('data/public/manifest.json')
 const manifest = json('data/public/manifest.json')
 const sources = new Set()
 assert.ok(manifest.documents.length >= 20 && manifest.documents.length <= 30)
 for (const doc of manifest.documents) {
  assert.ok(['PMC', 'CMS', 'DailyMed'].includes(doc.source))
  sources.add(doc.source)
  const url = new URL(doc.url)
  const hosts = {PMC: ['pmc.ncbi.nlm.nih.gov'], CMS: ['www.cms.gov', 'api.coverage.cms.gov'], DailyMed: ['dailymed.nlm.nih.gov']}
  assert.equal(url.protocol, 'https:')
  assert.ok(hosts[doc.source].includes(url.hostname))
  if (doc.source === 'PMC') assert.ok(['CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-2.0', 'CC0-1.0'].includes(doc.license))
  assert.ok(doc.license && doc.licenseUrl && doc.attribution)
  assert.match(doc.retrieved, /^\d{4}-\d{2}-\d{2}$/)
  assert.match(doc.file, /^data\/public\/text\/[a-z0-9-]+\.txt$/)
  assert.equal(createHash('sha256').update(read(doc.file)).digest('hex'), doc.sha256)
  assert.ok(read('data/public/SOURCES.md').includes(doc.url))
  assert.ok(read('data/public/SOURCES.md').includes(doc.sha256))
 }
 // DailyMed is allowed but not required. The spec leaves out sources with unresolved rights,
 // and the manifest records the selected DailyMed label as excluded for that reason.
 assert.ok(sources.has('PMC') && sources.has('CMS'))
 if (!sources.has('DailyMed')) assert.ok(manifest.exclusions.some(doc => doc.source === 'DailyMed'))
})

test('every planted span has exact offsets, a format split and frozen generator provenance', {todo: 'Sets B and C are not built yet. Contract kept until the eval lands.'}, async () => {
 required('eval/public-plant.js')
 required('data/public/planted.json')
 const { plant } = await import('../eval/public-plant.js')
 const key = json('data/public/planted.json')
 const results = json('eval/public-results.json')
 assert.match(results.generatorCommit, /^[a-f0-9]{40}$/)
 const frozen = execFileSync('git', ['show', `${results.generatorCommit}:eval/public-plant.js`], {cwd: root, encoding: 'utf8'})
 assert.equal(frozen, read('eval/public-plant.js'))
 const families = {dev: new Set(), heldout: new Set()}
 const manifest = json('data/public/manifest.json')
 const spanCounts = []
 for (const doc of manifest.documents) {
  const generated = plant({...doc, text: read(doc.file)}, key.seed)
  const saved = key.documents.find(entry => entry.id === doc.id)
  assert.deepEqual(generated, saved)
  spanCounts.push(saved.spans.length)
  let end = 0
  for (const span of saved.spans) {
   assert.equal(saved.text.slice(span.start, span.end), span.value)
   assert.ok(span.start >= end && span.end > span.start)
   assert.ok(['dev', 'heldout'].includes(span.split))
   assert.ok(span.type && span.family && span.replaced)
   assert.ok(read(doc.file).includes(span.replaced))
   families[span.split].add(span.family)
   end = span.end
  }
 }
 // Untouched documents must be mixed in, and planted documents must vary in how many identifiers they carry.
 assert.ok(spanCounts.some(count => count === 0), 'some documents must stay unplanted')
 assert.ok(new Set(spanCounts.filter(count => count > 0)).size > 1, 'identifier counts per planted document must vary')
 assert.ok(families.dev.size > 0 && families.heldout.size > 0)
 assert.ok([...families.dev].every(family => !families.heldout.has(family)))
})

test('planted scoring uses exact answer key spans and counts partial removal as a miss', {todo: 'Sets B and C are not built yet. Contract kept until the eval lands.'}, async () => {
 required('eval/public-score.js')
 const { scorePlanted } = await import('../eval/public-score.js')
 const doc = {id: 'fixture', text: 'Rose Bell called', spans: [{start: 0, end: 9, value: 'Rose Bell', type: 'NAME', family: 'common-word', split: 'heldout'}]}
 assert.equal(scorePlanted(doc, '[name] called').full, 1)
 assert.equal(scorePlanted(doc, '[name] Bell called').full, 0)
 assert.equal(scorePlanted(doc, doc.text).full, 0)
 assert.equal(scorePlanted(doc, '[name] called').byFamily['common-word'].full, 1)
})

test('untouched scoring measures labeled clinical token loss and extraction before and after', {todo: 'Sets B and C are not built yet. Contract kept until the eval lands.'}, async () => {
 required('eval/public-score.js')
 required('data/public/labels.json')
 const { scoreUntouched } = await import('../eval/public-score.js')
 const labels = json('data/public/labels.json')
 assert.equal(labels.status, 'draft, pending pharmacist review')
 assert.equal(labels.documents.length, json('data/public/manifest.json').documents.length)
 for (const doc of labels.documents) {
  assert.ok(doc.keep.length > 0)
  assert.ok(Array.isArray(doc.realIdentifiers))
  assert.ok(Array.isArray(doc.extractions))
 }
 const doc = {id: 'fixture', text: "Bell's palsy treated with metformin 500 mg.", keep: [{start: 0, end: 12}], realIdentifiers: [], extractions: [{type: 'diagnosis', value: "Bell's palsy"}, {type: 'medication', value: 'metformin'}, {type: 'dose', value: '500 mg'}]}
 const intact = scoreUntouched(doc, doc.text)
 const damaged = scoreUntouched(doc, '[name] palsy treated with metformin 500 mg.')
 assert.equal(intact.clinicalTokensRemoved, 0)
 assert.equal(intact.extractionsAfter, 3)
 assert.ok(damaged.clinicalTokensRemoved > 0)
 assert.equal(damaged.extractionsBefore, 3)
 assert.equal(damaged.extractionsAfter, 2)
})

test('inspector exposes source attribution, original link and visible planted markers', {todo: 'Sets B and C are not built yet. Contract kept until the eval lands.'}, () => {
 const html = read('docs/index.html')
 assert.match(html, /Real public text/)
 assert.match(html, /Real text with planted identifiers/)
 assert.match(html, /id="data-source"/)
 assert.match(html, /id="source-attribution"/)
 assert.match(html, /id="planted-spans"/)
 const code = read('docs/demo.js')
 assert.match(code, /license/)
 assert.match(code, /\.url/)
 assert.match(code, /planted/)
})

test('offline public evaluation reproduces committed results without modifying frozen synthetic files', {todo: 'Sets B and C are not built yet. Contract kept until the eval lands.'}, () => {
 required('eval/public-run.js')
 const paths = ['eval/heldout.json', 'eval/results.json', 'eval/results.md', 'eval/comparison.json', 'eval/comparison.md']
 const before = paths.map(read)
 const result = spawnSync(process.execPath, ['eval/public-run.js', '--check'], {cwd: root, encoding: 'utf8', env: {...process.env, HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1', ALL_PROXY: 'http://127.0.0.1:1'}})
 assert.equal(result.status, 0, result.stderr || result.stdout)
 assert.deepEqual(paths.map(read), before)
 const results = json('eval/public-results.json')
 assert.ok(results.planted.heldout.byType)
 assert.ok(results.planted.heldout.byFamily)
 assert.ok(results.untouched)
 assert.ok(results.failures.missedPlanted)
 assert.ok(results.failures.overRedaction)
 assert.equal(results.overall, undefined)
})
