// eval/public-score.js. Scoring for Set B (planted spans) and Set C (untouched real text).
// Pure functions. One frozen span rule: an identifier is FULLY removed only when every
// letter and digit inside its span is gone from the output. Some removed is PARTIAL, a leak.

const ALNUM = /[\p{L}\p{N}]/u
const TOKEN_RE = /\[([a-z-]+)\]/g
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Align output to input. The gate replaces substrings with [token] and may turn a line break
// next to a replacement into a space, so whitespace between literal pieces matches any whitespace.
function alignTokens(input, output) {
 if (output === input) return []
 const pieces = []
 const tokens = []
 let last = 0
 for (const m of output.matchAll(TOKEN_RE)) { pieces.push(output.slice(last, m.index)); tokens.push(m[1]); last = m.index + m[0].length }
 pieces.push(output.slice(last))
 const literal = p => p.split(/\s+/).map(escapeRe).join('\\s+')
 const re = new RegExp('^' + pieces.map(literal).join('([\\s\\S]+?)') + '$', 'du')
 const m = re.exec(input)
 if (!m) throw new Error(`could not align output to input:\n in: ${input}\n out: ${output}`)
 return tokens.map((token, i) => ({ start: m.indices[i + 1][0], end: m.indices[i + 1][1], token }))
}

/** Redacted input character mask. A bracketed word the source itself contains is not a redaction. */
export function redactedMask(input, output) {
 const mask = new Array(input.length).fill(false)
 for (const span of alignTokens(input, output)) {
  if (input.slice(span.start, span.end) === `[${span.token}]`) continue
  for (let i = span.start; i < span.end; i++) mask[i] = true
 }
 return mask
}

function status(text, mask, start, end) {
 let total = 0, gone = 0
 for (let i = start; i < end; i++) if (ALNUM.test(text[i])) { total++; if (mask[i]) gone++ }
 return gone === total ? 'full' : gone === 0 ? 'missed' : 'partial'
}

const bump = (table, key, s) => { const row = (table[key] ||= { n: 0, full: 0, partial: 0, missed: 0 }); row.n++; row[s]++ }

/**
 * Set B. Scores planted spans only, so other detections are not called false positives.
 * @returns {{n, full, partial, missed, byType, byFamily, byChallenge, spans}}
 */
export function scorePlanted(doc, output) {
 const mask = redactedMask(doc.text, output)
 const out = { id: doc.id, n: 0, full: 0, partial: 0, missed: 0, byType: {}, byFamily: {}, byChallenge: {}, spans: [] }
 for (const span of doc.spans) {
  const s = status(doc.text, mask, span.start, span.end)
  out.n++; out[s]++
  bump(out.byType, span.type, s)
  bump(out.byFamily, span.family, s)
  for (const c of span.challenge || []) bump(out.byChallenge, c, s)
  out.spans.push({ id: doc.id, type: span.type, family: span.family, challenge: span.challenge || [], value: span.value, status: s })
 }
 return out
}

// ---------- extraction (Set C utility) ----------
// The same extractor runs on the original and on the redacted text. Doses, routes and
// frequencies come from patterns. Medication and diagnosis surface forms come from the
// labeled lexicon, so the before score mostly checks the pattern rules and negation, and the
// drop after redaction is the measure that matters. Every extracted fact carries its span.
const DOSE = /(?<![\p{L}\p{N}.])\d+(?:\.\d+)?\s?(?:mg\/day|mg\/kg|mg|mcg|µg|g|mL|units|IU)(?![\p{L}/])/gu
const ROUTE = /\b(?:orally|oral|intravenously|intravenous|IV|injection|subcutaneous|subcutaneously|intramuscular|topical|inhaled|sublingual)\b/g
const FREQUENCY = /\b(?:once daily|twice daily|three times daily|four times daily|every \d+ hours|BID|TID|QID|daily|nightly|weekly)\b/g
const NEGATION_BEFORE = /\b(?:no|not|denied|denies|without|negative for|free of|absence of)\b/i
const NEGATION_AFTER = /^[^.;]{0,24}\b(?:was|were) negative\b/i
const TERMINATOR = /\b(?:but|although|however|except)\b|[.;:]/i

const norm = s => s.normalize('NFKC').toLowerCase().replace(/[‐-―-]/g, '-').replace(/\s+/g, ' ').trim()
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function negated(text, start, end) {
 // Look back to the start of the clause, at most 20 words, for a negation cue.
 const before = text.slice(Math.max(0, start - 200), start)
 const clause = before.split(TERMINATOR).pop()
 const words = clause.split(/\s+/).slice(-20).join(' ')
 return NEGATION_BEFORE.test(words) || NEGATION_AFTER.test(text.slice(end, end + 60))
}

/** @returns {Array<{type, value, start, end, negated}>} */
export function extract(text, lexicon = {}) {
 const out = []
 const push = (type, m) => out.push({ type, value: m[0], start: m.index, end: m.index + m[0].length, negated: false })
 for (const m of text.matchAll(DOSE)) push('dose', m)
 for (const m of text.matchAll(ROUTE)) push('route', m)
 for (const m of text.matchAll(FREQUENCY)) push('frequency', m)
 for (const type of ['medication', 'diagnosis']) {
  for (const term of new Set(lexicon[type] || [])) {
   const re = new RegExp(`(?<![\\p{L}\\p{N}])${escape(term)}(?![\\p{L}\\p{N}])`, 'giu')
   for (const m of text.matchAll(re)) out.push({ type, value: m[0], start: m.index, end: m.index + m[0].length, negated: type === 'diagnosis' && negated(text, m.index, m.index + m[0].length) })
  }
 }
 return out
}

function matchLabels(labels, found) {
 const pool = found.map(f => ({ ...f, used: false }))
 const byType = {}
 let matched = 0
 for (const label of labels) {
  const row = (byType[label.type] ||= { labeled: 0, found: 0 })
  row.labeled++
  const hit = pool.find(f => !f.used && f.type === label.type && norm(f.value) === norm(label.value) && (label.type !== 'diagnosis' || f.negated === Boolean(label.negated)))
  if (hit) { hit.used = true; row.found++; matched++ }
 }
 return { matched, byType, unmatchedExtractions: pool.filter(f => !f.used).length }
}

function lexiconFor(doc) {
 const lex = { medication: [], diagnosis: [] }
 for (const e of doc.extractions) if (lex[e.type]) lex[e.type].push(e.value)
 return lex
}

/**
 * Set C. Over-redaction on labeled keep tokens and extraction before and after redaction.
 * Removing a source-left-in identifier is required by policy and is reported apart.
 */
export function scoreUntouched(doc, output) {
 const mask = redactedMask(doc.text, output)
 const isKeep = new Array(doc.text.length).fill(false)
 for (const k of doc.keep) for (let i = k.start; i < k.end; i++) isKeep[i] = true
 const required = new Array(doc.text.length).fill(false)
 for (const r of doc.realIdentifiers || []) for (let i = r.start; i < r.end; i++) required[i] = true
 // Tokens are runs of letters and digits inside keep spans. A token counts as removed if any of its characters is.
 let keepTokens = 0, removed = 0
 const removedTokens = []
 for (const m of doc.text.matchAll(/[\p{L}\p{N}]+/gu)) {
  const idx = [...Array(m[0].length).keys()].map(i => m.index + i)
  if (!idx.some(i => isKeep[i]) || idx.some(i => required[i])) continue
  keepTokens++
  if (idx.some(i => mask[i])) { removed++; removedTokens.push(m[0]) }
 }
 const lex = lexiconFor(doc)
 const before = matchLabels(doc.extractions, extract(doc.text, lex))
 const redactedText = output
 const after = matchLabels(doc.extractions, extract(redactedText, lex))
 const realIds = (doc.realIdentifiers || []).map(r => ({ type: r.type, value: r.value, status: status(doc.text, mask, r.start, r.end) }))
 return {
  id: doc.id,
  keepTokens,
  clinicalTokensRemoved: removed,
  removedTokens,
  extractionsLabeled: doc.extractions.length,
  extractionsBefore: before.matched,
  extractionsAfter: after.matched,
  extractionByTypeBefore: before.byType,
  extractionByTypeAfter: after.byType,
  unlabeledExtractionsBefore: before.unmatchedExtractions,
  unlabeledExtractionsAfter: after.unmatchedExtractions,
  realIdentifiers: realIds,
 }
}
