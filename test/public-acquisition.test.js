import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const manifest = JSON.parse(read('data/public/manifest.json'))

test('staged public acquisition has pinned rights, source downloads, partitions and exact excerpt hashes', () => {
 assert.equal(manifest.documents.length, 20)
 assert.equal(new Set(manifest.documents.map(doc => doc.sourceId)).size, 20)
 assert.deepEqual(readdirSync(new URL('data/public/text/', root)).sort(), manifest.documents.map(doc => doc.file.split('/').at(-1)).sort())
 for (const doc of manifest.documents) {
  assert.ok(['dev', 'heldout'].includes(doc.split))
  assert.ok(doc.attribution && doc.authors.length && doc.publisher && doc.title && doc.notice)
  assert.equal(doc.retrieved, '2026-11-01')
  assert.match(doc.retrievedSha256, /^[a-f0-9]{64}$/)
  assert.equal(createHash('sha256').update(read(doc.file)).digest('hex'), doc.sha256)
  assert.ok(read('data/public/SOURCES.md').includes(doc.url))
  assert.ok(read('data/public/SOURCES.md').includes(doc.sha256))
  if (doc.source === 'PMC') {
   assert.match(doc.license, /^CC-BY-(2\.0|3\.0|4\.0)$/)
   assert.equal(new URL(doc.fetchUrl).hostname, 'pmc-oa-opendata.s3.amazonaws.com')
   assert.equal(doc.genre, 'case report')
  } else {
   assert.equal(doc.source, 'CMS')
   assert.equal(new URL(doc.fetchUrl).pathname, '/v1/data/ncd/')
   assert.equal(doc.selector.jsonField, 'item_service_description')
   assert.equal(doc.license, 'US-government-work')
  }
 }
 assert.ok(manifest.exclusions.some(doc => doc.source === 'DailyMed' && /rights/.test(doc.reason)))
 assert.ok(manifest.exclusions.some(doc => doc.source === 'VAERS' && /CAPTCHA/.test(doc.reason)))
})

test('staged acquisition verifies offline without creating scratch files or changing synthetic fixtures', () => {
 const paths = ['eval/heldout.json', 'eval/results.json', 'eval/results.md', 'eval/comparison.json', 'eval/comparison.md']
 const before = paths.map(read)
 const result = spawnSync('python3', ['data/public/fetch.py'], {
  cwd: root, encoding: 'utf8',
  env: {...process.env, HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1', ALL_PROXY: 'http://127.0.0.1:1'}
 })
 assert.equal(result.status, 0, result.stderr)
 assert.equal(result.stdout.trim().split('\n').length, 20)
 assert.deepEqual(paths.map(read), before)
})
