import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectNote } from '../docs/inspector.js'

test('inspector runs real profiles and derives spans and counts', () => {
 const input = 'Patient Inez Thorn. Phone 202-555-0143. Continue metformin 500 mg BID. A1c 7.4%.'
 const result = inspectNote(input, 'identifiers')
 assert.equal(result.blocked, false)
 assert.ok(result.spans.some(s => input.slice(s.start, s.end) === '202-555-0143' && s.token === 'phone'))
 assert.equal(result.counts.phone, 1)
 assert.ok(result.kept.includes('metformin 500 mg BID'))
 assert.notEqual(result.text, inspectNote(input, 'light').text)
})

test('failure blocks with no review spans or preserved clinical claims', () => {
 const result = inspectNote('Phone 202-555-0143. metformin 500 mg BID.', 'identifiers', true)
 assert.equal(result.blocked, true)
 assert.equal(result.text, '[redaction-blocked]')
 assert.deepEqual(result.spans, [])
 assert.deepEqual(result.kept, [])
 assert.deepEqual(result.counts, {})
 assert.equal(inspectNote('hello', 'invalid').blocked, true)
})

test('empty and token-like input do not invent removed identifiers', () => {
 assert.equal(inspectNote('', 'identifiers').text, '')
 const result = inspectNote('[phone] 202-555-0143', 'light')
 assert.equal(result.spans, null)
 assert.equal(result.counts.phone, 1)
 assert.deepEqual(inspectNote('Clinical follow up', 'light').spans, [])
})
