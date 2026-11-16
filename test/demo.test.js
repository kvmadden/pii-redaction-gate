import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { assertSendable } from '../src/send-guard.js'
import { redactText } from '../src/engine.js'
import { createMissedIdentifierGuard } from '../docs/workspace.js'
for (const name of ['engine','patterns','clinical-patterns','names','topics','profiles','send-guard','scan','shapes','grammar','lexicon','lexicon-data','text-fold']) test(`demo runtime is identical: ${name}`,()=>{
 assert.equal(fs.readFileSync(new URL(`../docs/runtime/${name}.js`,import.meta.url),'utf8'),fs.readFileSync(new URL(`../src/${name}.js`,import.meta.url),'utf8'))
})
test('shared browser send guard rejects missing, blocked, hand-built and unreviewed results',()=>{
 assert.throws(()=>assertSendable(null),{name:'RedactionBlockedError'})
 assert.throws(()=>assertSendable({blocked:true}),{name:'RedactionBlockedError'})
 // A hand-built object never passes, even when it claims to be clean.
 assert.throws(()=>assertSendable({blocked:false, status:'clean'}),{name:'RedactionBlockedError'})
 const clean = redactText('Continue metformin 500 mg BID.', {profile:'identifiers'})
 assert.equal(clean.status,'clean')
 assert.equal(assertSendable(clean),clean)
 const review = redactText('Seen at Riverside Clinic today.', {profile:'identifiers'})
 assert.equal(review.status,'review')
 assert.throws(()=>assertSendable(review),{name:'RedactionReviewRequiredError'})
 assert.equal(assertSendable(review,{acceptReview:true}),review)
})
// The 27-template development check (eval/heldout.json, a historical file name)
// stays byte-identical, so its per-template counts can be compared across engines.
test('27-template development check stays byte-identical to its committed file',()=>{
 const hash = crypto.createHash('sha256').update(fs.readFileSync(new URL('../eval/heldout.json',import.meta.url))).digest('hex')
 assert.equal(hash,'74bb137789e647d9a37e928b09817ca55c826a9eb3fcd9036fa0d9776b28116a')
})

test('inspector alignment is identical to the evaluation scorer', () => {
 assert.equal(fs.readFileSync(new URL('../docs/runtime/score.js', import.meta.url), 'utf8'), fs.readFileSync(new URL('../eval/score.js', import.meta.url), 'utf8'))
})

test('a flagged note stays refused after edit-revert or reselecting its synthetic example', () => {
 const guard = createMissedIdentifierGuard()
 const flagged = 'Patient Inez Thorn. Continue metformin 500 mg BID.'
 assert.equal(guard.refuses(flagged), false)
 assert.equal(guard.requiresFreshReview(), false)
 guard.flag(flagged)
 assert.equal(guard.refuses(flagged), true)
 assert.equal(guard.refuses('Corrected synthetic note.'), false)
 // Changing only unrelated text must still require a person to re-review.
 assert.equal(guard.requiresFreshReview(), true)
 // Switching examples or temporarily editing cannot clear the reported miss.
 assert.equal(guard.refuses(flagged), true)
 guard.flag('Corrected synthetic note.')
 assert.equal(guard.refuses('Corrected synthetic note.'), true)
})
