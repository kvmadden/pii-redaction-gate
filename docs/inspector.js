import { redactText } from './runtime/engine.js'
import { PATTERN_RULES } from './runtime/patterns.js'
import { align } from './runtime/score.js'

const clinicalTerms = ['metformin 500 mg BID', 'Ozempic 0.5 mg weekly', 'A1c 7.4%', 'BP 138/84']

export function inspectNote(input, profile, failure = false) {
 const broken = {type: 'demo-failure', re: /[\s\S]+/g, validate() { throw new Error('Synthetic failure') }}
 let result
 if (failure) PATTERN_RULES.push(broken)
 try { result = redactText(input, {profile, peopleMap: {people: [], safe: []}}) }
 finally { if (failure) PATTERN_RULES.splice(PATTERN_RULES.indexOf(broken), 1) }
 const counts = {}
 if (result.blocked) return {...result, spans: [], kept: [], counts}
 for (const hit of result.hits) counts[hit.type] = (counts[hit.type] || 0) + hit.count
 let spans = null
 if (!/\[[a-z-]+\]/.test(input)) {
  try { spans = align(input, result.text) } catch { /* Text remains reviewable without span attribution. */ }
 }
 return {...result, spans, counts, kept: clinicalTerms.filter(term => input.includes(term) && result.text.includes(term))}
}
