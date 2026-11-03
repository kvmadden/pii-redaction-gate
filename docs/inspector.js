import { redactText } from './runtime/engine.js'
import { lookup } from './runtime/lexicon.js'
import { align } from './runtime/score.js'

// Clinical words the output kept, found with the same public drug and diagnosis
// vocabulary the engine uses (not a fixed list of demo phrases). A word counts
// when it is a drug-list word of four or more letters that is not ordinary
// English, or a diagnosis word that is not ordinary English.
export function keptClinicalWords(text) {
 const words = new Set()
 for (const m of String(text).matchAll(/\p{L}[\p{L}\p{M}'-]{2,}/gu)) {
  const f = lookup(m[0])
  if ((f.drug && m[0].length >= 4 && !f.english) || (f.icd && !f.english)) words.add(m[0])
 }
 return [...words]
}

export function inspectNote(input, profile, failure = false) {
 // The failure toggle asks the engine to fail at the pattern stage. It can only
 // turn a result into a blocked one.
 const result = redactText(input, {profile, peopleMap: {people: [], safe: []}, ...(failure ? {injectFault: 'pattern'} : {})})
 const counts = {}
 if (result.blocked) return {...result, result, spans: [], kept: [], counts}
 for (const hit of result.hits) counts[hit.type] = (counts[hit.type] || 0) + hit.count
 let spans = null
 if (!/\[[a-z-]+\]/.test(input)) {
  try { spans = align(input, result.text) } catch { /* Text remains reviewable without span attribution. */ }
 }
 return {...result, result, spans, counts, kept: keptClinicalWords(result.text)}
}
