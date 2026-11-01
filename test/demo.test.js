import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { assertSendable } from '../src/send-guard.js'
for (const name of ['engine','patterns','clinical-patterns','names','topics','profiles','send-guard']) test(`demo runtime is identical: ${name}`,()=>{
 assert.equal(fs.readFileSync(new URL(`../docs/runtime/${name}.js`,import.meta.url),'utf8'),fs.readFileSync(new URL(`../src/${name}.js`,import.meta.url),'utf8'))
})
test('shared browser send guard rejects missing and blocked results',()=>{
 assert.throws(()=>assertSendable(null),{name:'RedactionBlockedError'})
 assert.throws(()=>assertSendable({blocked:true}),{name:'RedactionBlockedError'})
 const result = {blocked:false}
 assert.equal(assertSendable(result),result)
})
test('held-out corpus stays frozen at pre-tuning commit',()=>{
 const hash = crypto.createHash('sha256').update(fs.readFileSync(new URL('../eval/heldout.json',import.meta.url))).digest('hex')
 assert.equal(hash,'74bb137789e647d9a37e928b09817ca55c826a9eb3fcd9036fa0d9776b28116a')
})

test('inspector alignment is identical to the evaluation scorer', () => {
 assert.equal(fs.readFileSync(new URL('../docs/runtime/score.js', import.meta.url), 'utf8'), fs.readFileSync(new URL('../eval/score.js', import.meta.url), 'utf8'))
})
