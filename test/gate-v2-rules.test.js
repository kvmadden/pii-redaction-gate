import test from 'node:test'
import assert from 'node:assert/strict'
import { redactText } from '../src/engine.js'

// Version 2 rules, written from dev-split misses only. Examples here are invented for the test.
const gate = text => redactText(text, { profile: 'identifiers', peopleMap: { people: [], safe: [] } }).text

test('labeled identifiers split into groups or led by letters are removed', () => {
 assert.equal(gate('Hospital no. QX-123987\nSeen today.'), 'Hospital no. [account]\nSeen today.')
 assert.equal(gate('Member ID ZZQ 1029 3847 on file'), 'Member ID [account] on file')
 assert.equal(gate('Plan ID: ABC 9081 7263 · next'), 'Plan ID: [account] · next')
 assert.equal(gate('MRN 902817364'), 'MRN [account]')
})

test('label words in ordinary clinical prose are left alone', () => {
 for (const t of ['The plan is to start metformin 500 mg twice daily.', 'Case 2 described a similar course.', 'Patient number 3 had HbA1c 7.2%.', 'Insurance number pending.', 'Address: not recorded.'])
  assert.equal(gate(t), t)
})

test('a street address keeps no city behind', () => {
 assert.equal(gate('Lives at 12 Quarry Road, Millbrook\nNext line'), 'Lives at [address]\nNext line')
 assert.equal(gate('Mailing address: 77 Tern Court, Eastvale'), 'Mailing address: [address]')
})

test('names with accents, O prefixes, hyphens, particles and line breaks are removed whole', () => {
 assert.doesNotMatch(gate('Then Zoë Ćirić was seen.'), /Zo|ë|irić|Ć/)
 assert.equal(gate('On arrival, Ms. O\'Rourke was alert.'), 'On arrival, [name] was alert.')
 assert.equal(gate('Accompanied by Min-jun\nPark (son)'), 'Accompanied by [name] (son)')
 assert.equal(gate('Later Mr. Van den Heuvel improved.'), 'Later [name] improved.')
})

test('the text marks genus names and parenthetical brands as vocabulary', () => {
 // Epithets ending in -us are not used as a cue, because English words such as "thus" end that way.
 for (const t of ['Cultures grew Klebsiella pneumoniae and Escherichia coli.', 'She took atorvastatin (Lipitor) 40 mg nightly.'])
  assert.equal(gate(t), t)
})
