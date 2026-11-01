import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'

// The gate must not be able to recognize test content by its values. Gate code, rules and
// word lists may not contain reserved test values, generator seeds or generator answer values.
const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const gateFiles = [
 ...readdirSync(new URL('src/', root)).filter(name => name.endsWith('.js')).map(name => `src/${name}`),
 ...readdirSync(new URL('docs/runtime/', root)).filter(name => name.endsWith('.js') && name !== 'score.js').map(name => `docs/runtime/${name}`),
]
// Comments cannot be read by the engine, so they are stripped before searching.
const stripComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1')
const gateCode = gateFiles.map(path => [path, stripComments(read(path))])

const forbiddenFixed = [/555[-. ]?01\d\d/, /example\.(com|org|net)/i, /192\.0\.2\./, /2001:db8/i]

function generatorValues() {
 const values = new Set()
 const names = []
 const add = (type, value) => { values.add(value); if (/NAME/.test(type)) names.push(value) }
 const heldout = JSON.parse(read('eval/heldout.json'))
 values.add(String(heldout.seed))
 for (const entry of heldout.entries) for (const [type, value] of entry.pii) add(type, value)
 if (existsSync(new URL('data/public/planted.json', root))) {
  const key = JSON.parse(read('data/public/planted.json'))
  values.add(String(key.seed))
  for (const doc of key.documents) for (const span of doc.spans) add(span.type, span.value)
 }
 // Name pools leak through single words too, so each word of a planted name is checked on its own.
 for (const name of names) for (const word of name.match(/\b[A-Z][a-z]{3,}\b/g) || []) values.add(word)
 // Very short values such as a bare age match ordinary code and say nothing about the generator.
 return [...values].filter(value => value.length >= 4)
}

test('gate code contains no reserved test values', () => {
 for (const [path, code] of gateCode) for (const pattern of forbiddenFixed) assert.doesNotMatch(code, pattern, `${path} contains reserved test value ${pattern}`)
})

test('gate code contains no generator seed or planted answer value', () => {
 const values = generatorValues()
 assert.ok(values.length > 0)
 for (const [path, code] of gateCode) for (const value of values) assert.ok(!code.includes(value), `${path} contains generator value ${value}`)
})

test('gate code contains no word from the Set B generator pools', async () => {
 const { GIVEN, SURNAMES, CITIES, STREETS, SEED } = await import('../eval/public-plant.js')
 const words = new Set([String(SEED)])
 for (const value of [...GIVEN, ...SURNAMES, ...CITIES, ...STREETS]) for (const word of value.split(/[\s'\-]+/)) if (word.length >= 4) words.add(word)
 const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
 for (const [path, code] of gateCode) for (const word of words) assert.doesNotMatch(code, new RegExp(`(?<![\\p{L}])${escape(word)}(?![\\p{L}])`, 'u'), `${path} contains generator pool word ${word}`)
})

test('the gate never imports evaluation code or answer keys', () => {
 for (const [path, code] of gateCode) assert.doesNotMatch(code, /eval\/|public-plant|planted\.json|labels\.json|heldout\.json/, path)
})
