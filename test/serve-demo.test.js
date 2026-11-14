import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('local inspector serves its page from a checkout path with spaces', { timeout: 15000 }, async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'redaction inspector '))
  await mkdir(path.join(dir, 'scripts'))
  await mkdir(path.join(dir, 'docs'))
  await copyFile(fileURLToPath(new URL('../scripts/serve-demo.js', import.meta.url)), path.join(dir, 'scripts/serve-demo.js'))
  await copyFile(fileURLToPath(new URL('../docs/index.html', import.meta.url)), path.join(dir, 'docs/index.html'))
  await writeFile(path.join(dir, 'package.json'), '{"type":"module"}\n')

  const child = spawn(process.execPath, [path.join(dir, 'scripts/serve-demo.js')], {
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(async () => {
    child.kill()
    await rm(dir, { recursive: true, force: true })
  })

  let output = ''
  let errors = ''
  child.stderr.on('data', (chunk) => { errors += chunk.toString() })
  const address = await new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => finish(new Error(`Server did not start: ${output} ${errors}`)), 8000)
    function finish(error, value) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(value)
    }
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
      const match = output.match(/Redaction inspector: (http:\/\/127\.0\.0\.1:\d+)/)
      if (match) finish(null, match[1])
    })
    child.once('error', (error) => finish(error))
    child.once('exit', (code) => finish(new Error(`Inspector exited before serving (code ${code}): ${errors}`)))
  })

  const response = await fetch(address)
  assert.equal(response.status, 200)
  assert.match(await response.text(), /<html[\s>]/i)
  assert.equal((await fetch(`${address}/does-not-exist`)).status, 404)
})
