#!/usr/bin/env node
// scripts/build-blind-check.js. Builds the human indistinguishability sheet for Set B.
// Twenty sentences, half from planted narrative edits and half untouched, in a seeded random
// order. The reviewer marks the ones they think were edited before opening the key.
import { readFileSync, writeFileSync } from 'node:fs'
const root = new URL('../', import.meta.url)
const json = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'))
const manifest = json('data/public/manifest.json')
const key = json('data/public/planted.json')
let a = 20261102
const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const shuffle = list => { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[out[i], out[j]] = [out[j], out[i]] } return out }
// A sentence ends at a period followed by a space and a capital, but not after Mr., Ms. or an initial.
function sentences(text) {
 const out = []
 for (const line of text.split('\n').reduce((acc, l) => { acc.push({ l, at: (acc.at(-1)?.at ?? -1) + (acc.at(-1)?.l.length ?? 0) + 1 }); return acc }, [])) {
  let start = 0
  const re = /(?<!\b(?:Mr|Ms|Dr|[A-Z]))\.(?=\s+[A-Z(]|$)/g
  for (const m of line.l.matchAll(re)) { out.push({ start: line.at + start, end: line.at + m.index + 1, text: line.l.slice(start, m.index + 1).trim() }); start = m.index + 1 }
 }
 return out.filter(s => s.text.length > 30)
}
const edited = [], untouched = []
for (const doc of key.documents) {
 const body = doc.edits.filter(e => !doc.text.slice(e.start, e.end).includes('\n'))
 for (const s of sentences(doc.text)) {
  if (body.some(e => e.start >= s.start && e.end <= s.end)) edited.push({ id: doc.id, text: s.text })
 }
}
for (const doc of manifest.documents) {
 const planted = key.documents.find(d => d.id === doc.id)
 const original = readFileSync(new URL(doc.file, root), 'utf8')
 // Only sentences that read the same in the planted version, so an original never sits beside its edit.
 for (const s of sentences(original)) if (planted.text.includes(s.text)) untouched.push({ id: doc.id, text: s.text })
}
const items = shuffle([...shuffle(edited).slice(0, 10).map(x => ({ ...x, edited: true })), ...shuffle(untouched).slice(0, 10).map(x => ({ ...x, edited: false }))])
const lines = ['# Blind check: which sentences were edited?', '', 'Status: not yet done. Twenty sentences from the Set B corpus, in a fixed random order. Ten had a fictional identifier planted in them and ten are exactly as published. Mark the ones you think were edited, then compare with `docs/blind-check-key.json`. Do not open the key first.', '', 'Known limit: published case reports almost never name a patient, so a sentence that contains a name is likely to be one of the edited ones. This sheet tests whether the edits read naturally. The automatic check in `eval/public-results.md` masks the identifier for that reason.', '']
items.forEach((x, i) => lines.push(`${i + 1}. ${x.text}`, ''))
lines.push('Your guesses (sentence numbers):', '', 'Hit rate:', '')
writeFileSync(new URL('docs/blind-check.md', root), lines.join('\n'))
writeFileSync(new URL('docs/blind-check-key.json', root), JSON.stringify({ seed: 20261102, items: items.map((x, i) => ({ n: i + 1, id: x.id, edited: x.edited })) }, null, 1) + '\n')
console.log(`${edited.length} edited and ${untouched.length} untouched candidate sentences, 20 written`)
