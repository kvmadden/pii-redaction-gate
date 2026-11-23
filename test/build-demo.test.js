import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RUNTIME_MODULES } from '../scripts/build-demo.js'

const BUILDER = fileURLToPath(new URL('../scripts/build-demo.js', import.meta.url))
const EXTRA_COPIES = [
  ['eval/comparison.md', 'docs/comparison.md'],
  ['eval/score.js', 'docs/runtime/score.js'],
  ['eval/comparison.json', 'docs/comparison.json'],
]

function sandbox(t) {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'redaction demo builder ')))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(path.join(root, 'scripts'))
  copyFileSync(BUILDER, path.join(root, 'scripts/build-demo.js'))
  writeFileSync(path.join(root, 'package.json'), '{"type":"module"}\n')
  return root
}

function invoke(root, args = [path.join(root, 'scripts/build-demo.js')]) {
  return spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' })
}

test('demo builder exports the expected unique runtime modules', () => {
  assert.deepEqual(RUNTIME_MODULES, [
    'engine', 'patterns', 'clinical-patterns', 'names', 'topics', 'profiles',
    'send-guard', 'scan', 'shapes', 'grammar', 'lexicon', 'lexicon-data', 'text-fold',
  ])
  assert.equal(new Set(RUNTIME_MODULES).size, RUNTIME_MODULES.length)
})

test('importing the builder does not generate files', (t) => {
  const root = sandbox(t)
  const result = invoke(root, [
    '--input-type=module', '--eval',
    "import('./scripts/build-demo.js').then(({ RUNTIME_MODULES }) => console.log(RUNTIME_MODULES.length))",
  ])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), String(RUNTIME_MODULES.length))
  assert.equal(existsSync(path.join(root, 'docs')), false)
})

test('standalone build copies only its declared runtime and comparison files byte-for-byte', (t) => {
  const root = sandbox(t)
  mkdirSync(path.join(root, 'src'))
  mkdirSync(path.join(root, 'eval'))
  const copies = [
    ...RUNTIME_MODULES.map((name) => ['src/' + name + '.js', 'docs/runtime/' + name + '.js']),
    ...EXTRA_COPIES,
  ]
  for (const [source] of copies) {
    const payload = Buffer.from('synthetic fixture for ' + source + '\r\n', 'utf8')
    writeFileSync(path.join(root, source), payload)
  }

  const result = invoke(root)
  assert.equal(result.status, 0, result.stderr)
  for (const [source, destination] of copies) {
    assert.deepEqual(readFileSync(path.join(root, destination)), readFileSync(path.join(root, source)), destination)
  }
  assert.deepEqual(readdirSync(path.join(root, 'docs/runtime')).sort(), [
    ...RUNTIME_MODULES.map((name) => name + '.js'), 'score.js',
  ].sort())
  assert.deepEqual(readdirSync(path.join(root, 'docs')).sort(), ['comparison.json', 'comparison.md', 'runtime'])
})

test('standalone build fails rather than silently skipping a missing runtime source', (t) => {
  const root = sandbox(t)
  mkdirSync(path.join(root, 'src'))
  for (const name of RUNTIME_MODULES.slice(0, -1)) {
    writeFileSync(path.join(root, 'src', name + '.js'), '// synthetic fixture\n')
  }
  const result = invoke(root)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /ENOENT/)
  assert.equal(existsSync(path.join(root, 'docs/comparison.md')), false)
})
