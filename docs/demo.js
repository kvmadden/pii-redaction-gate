import { examples as clinicalExamples, metricRows, recordReview, reviewKey } from './workspace.js'
import { inspectNote } from './inspector.js'
import { PROFILES } from './runtime/profiles.js'
import { assertSendable } from './runtime/send-guard.js'
const $ = id => document.getElementById(id)
const examples = {
 visit: 'Patient Inez Q. Thorn-Smith, DOB 03/04/1961, MRN#: Z9900188.\nAdmitted 10/22/2025. Phone 202-555-0143.\n\nContinue Ozempic 0.5 mg weekly.\nA1c 7.4%, BP 138/84.\nContinue metformin 500 mg BID.',
 contact: 'Dr. Adira Linden. Age: 97. Phone 202-555-0143. Device serial: DEMO-90188. Portal https://example.org/chart/88. Continue metformin 500 mg BID.',
 limits: 'Spoke with grace about her refill. Admitted to Valley Hospital. Age: 72. Continue metformin 500 mg BID.',
 ...Object.fromEntries(Object.entries(clinicalExamples).map(([key, value]) => [key, value.text])),
 blank: ''
}
let current = null
let version = 0
let reviewedRevision = -1
function keptText(container, text, terms) {
 const positions = terms.flatMap(term => [...text.matchAll(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))].map(m => ({start:m.index,end:m.index+term.length}))).sort((a,b) => a.start-b.start)
 let cursor = 0
 for (const span of positions) {
  container.append(document.createTextNode(text.slice(cursor, span.start)))
  const mark = document.createElement('mark')
  mark.className = 'kept'
  mark.textContent = text.slice(span.start, span.end)
  container.append(mark)
  cursor = span.end
 }
 container.append(document.createTextNode(text.slice(cursor)))
}
function invalidate(message = 'Note changed. Inspect again before sending.') {
 version++
 current = null
 $('reviewed').disabled = true
 $('flagged').disabled = true
 $('review-status').textContent = 'Inspect the current note before recording a review.'
 $('status').textContent = message
 document.querySelector('.statusbar .small').textContent = PROFILES[$('profile').value].tiers.join(' → ').toUpperCase()
 $('result-badge').textContent = 'AWAITING INSPECTION'
 $('output').textContent = 'Your inspected result will appear here.'
 $('original').textContent = 'Inspect the note to reveal removed spans.'
 $('counts').replaceChildren()
 $('removed').replaceChildren()
 $('kept').textContent = ''
 $('scan-report').textContent = ''
 $('review-spans').replaceChildren()
 $('send-status').textContent = 'Send gate: blocked until the current note is inspected.'
 document.querySelector('.workspace').dataset.state = 'idle'
}
// What the engine read and what it could not decide, in plain words.
function showScan(result) {
 const spans = $('review-spans')
 spans.replaceChildren()
 if (!result || result.blocked || !result.scan) { $('scan-report').textContent = ''
  return }
 const s = result.scan
 const read = `Read ${s.read} of ${s.characters} characters with ${s.checks.length} checks.`
 const not = s.notChecked.length ? ` Not checked under this profile: ${s.notChecked.join(', ')}.` : ''
 const n = result.review.length
 const verdict = result.status === 'review' ? ` ${n} span${n === 1 ? ' needs' : 's need'} review before sending.` : ' Nothing left to decide. Not proof that no identifier remains.'
 $('scan-report').textContent = read + not + verdict
 for (const r of result.review) {
  const li = document.createElement('li')
  li.textContent = `“${result.text.slice(r.start, r.end)}”: ${r.reason}`
  spans.append(li)
 }
}
async function run() {
 invalidate('Inspecting with the local engine…')
 const ticket = version
 const input = $('note').value
 if (!input.trim()) { $('status').textContent = 'Empty note. Pick an example or paste synthetic text.'
 return }
 $('run').disabled = true
 document.querySelector('.workspace').setAttribute('aria-busy', 'true')
 try {
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  if (ticket !== version) return
  current = inspectNote(input, $('profile').value, $('failure').checked)
  const blocked = current.blocked
  $('reviewed').disabled = blocked
  $('flagged').disabled = blocked
  $('review-status').textContent = blocked ? 'Review unavailable because the engine failed.' : 'Compare source and output, then record your review or flag a missed identifier.'
  document.querySelector('.workspace').dataset.state = blocked ? 'blocked' : 'ready'
  const review = current.status === 'review'
  $('status').textContent = blocked ? 'BLOCKED / Engine failure. No payload can pass.' : review ? 'Inspection complete / Spans need review before sending' : 'Inspection complete / Nothing left to decide, compare before use'
  $('result-badge').textContent = blocked ? 'BLOCKED' : review ? 'NEEDS REVIEW' : 'CHECKS PASSED'
  $('output').replaceChildren()
  if (blocked) $('output').textContent = current.text
  else {
   const parts = current.text.split(/(\[[a-z-]+\])/g)
   for (const part of parts) {
    if (/^\[[a-z-]+\]$/.test(part)) {
     const mark = document.createElement('mark')
     mark.className = 'removed'
     mark.textContent = part
     $('output').append(mark)
    } else keptText($('output'), part, current.kept)
   }
  }
  $('original').replaceChildren()
  if (blocked) $('original').textContent = 'Span inspection withheld because the engine failed.'
  else if (current.spans === null) $('original').textContent = 'Span highlights unavailable for token-like or ambiguous input. Review the text output.'
  else {
   let cursor = 0
   for (const span of current.spans) {
    keptText($('original'), input.slice(cursor, span.start), current.kept)
    const mark = document.createElement('mark')
    mark.className = 'removed'
    mark.textContent = input.slice(span.start, span.end)
    const label = document.createElement('small')
    label.textContent = span.token
    mark.append(label)
    $('original').append(mark)
    const li = document.createElement('li')
    li.textContent = `${input.slice(span.start, span.end)} → [${span.token}]`
    $('removed').append(li)
    cursor = span.end
   }
   keptText($('original'), input.slice(cursor), current.kept)
  }
  for (const [type, count] of Object.entries(current.counts)) {
   const item = document.createElement('span')
   item.textContent = `${type} · ${count}`
   $('counts').append(item)
  }
  if (!$('counts').children.length) $('counts').textContent = blocked ? 'Withheld on failure' : 'No rules matched'
  $('kept').textContent = blocked ? 'No content is available for sending.' : `${current.kept.length} clinical word${current.kept.length === 1 ? '' : 's'} from the public drug and diagnosis lists kept. Green marks show words retained, not a completeness score.`
  showScan(current.result)
  $('send-status').textContent = blocked ? 'Send gate: BLOCKED. No payload available.' : review ? 'Send gate: refused until a reviewer marks the flagged spans reviewed.' : 'Send gate: ready for a local simulated attempt.'
 } catch {
  invalidate('BLOCKED / Inspector error. No payload can pass.')
  document.querySelector('.workspace').dataset.state = 'blocked'
  $('result-badge').textContent = 'BLOCKED'
  $('output').textContent = '[redaction-blocked]'
 } finally {
  $('run').disabled = false
  document.querySelector('.workspace').removeAttribute('aria-busy')
 }
}
$('example').addEventListener('change', () => { $('note').value = examples[$('example').value]
 run() })
$('profile').addEventListener('change', () => invalidate('Profile changed. Inspect again before sending.'))
$('failure').addEventListener('change', run)
$('note').addEventListener('input', () => invalidate())
$('run').addEventListener('click', run)
$('send').addEventListener('click', () => {
 // The guard accepts only the sealed engine result. A review result passes
 // only after "Mark as reviewed" for this exact revision.
 const acceptReview = reviewedRevision === version
 try { assertSendable(current?.result, {acceptReview})
 $('send-status').textContent = current.result.status === 'review' ? 'Simulated send allowed after a reviewer marked the flagged spans reviewed. No request was made.' : 'Simulated send allowed. The checks found nothing left to decide, which is not proof that no identifier remains. No request was made.' }
 catch (e) { $('send-status').textContent = e?.name === 'RedactionReviewRequiredError' ? 'Send refused: spans need review. Check them, then mark the note as reviewed.' : 'Send blocked. No payload passed to the simulated writer.' }
})
$('theme').addEventListener('click', () => {
 const dark = document.documentElement.dataset.theme !== 'dark'
 document.documentElement.dataset.theme = dark ? 'dark' : 'light'
 $('theme').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`)
 $('theme').querySelector('span').textContent = dark ? 'Light mode' : 'Dark mode'
})
function provenance() {
 const fixture = clinicalExamples[$('example').value]
 $('provenance').textContent = fixture ? `${fixture.source}. Curated demonstration, not an evaluation case. Editing makes this a custom synthetic draft.` : 'Curated synthetic demonstration. Editing makes this a custom synthetic draft.'
}
$('example').addEventListener('change', provenance)
$('note').addEventListener('input', () => { $('provenance').textContent = 'Custom synthetic draft. Source text and dates are not verified.' })
for (const action of ['reviewed','flagged']) $(action).addEventListener('click', () => {
 try {
  recordReview(localStorage, action, {ready:!!current, blocked:current?.blocked, document:$('note').value === examples[$('example').value] ? $('example').value : 'custom-synthetic-draft', profile:$('profile').value, revision:version})
  reviewedRevision = action === 'reviewed' ? version : -1
  $('review-status').textContent = action === 'flagged' ? 'Missed identifier flagged locally. Correct the draft and inspect again. No escalation was sent.' : 'Review recorded locally. This does not certify the output or release a payload.'
  showLog()
 } catch { $('review-status').textContent = 'Review was not saved. Inspect again or check browser storage availability.' }
})
function showLog() {
 try {
  const entries = JSON.parse(localStorage.getItem(reviewKey) || '[]')
  if (!Array.isArray(entries)) throw Error('Invalid log')
  $('review-log').textContent = entries.map(e => `${e.at} / ${e.action} / ${e.document} / ${e.profile} / revision ${e.revision}`).join('\n') || 'No local reviews yet.'
 } catch { $('review-log').textContent = 'Local log unavailable. Clear it to start again.' }
}
$('clear-reviews').addEventListener('click', () => {
 try { localStorage.removeItem(reviewKey)
 showLog()
 $('review-status').textContent = 'Local review log cleared.' } catch { $('review-status').textContent = 'Unable to clear browser storage.' }
})
let evaluation
function renderMetrics() {
 const percent = value => value === undefined ? 'Not measured' : `${(value * 100).toFixed(1)}%`
 $('metrics').replaceChildren()
 for (const row of metricRows(evaluation, $('corpus').value)) {
  const tr = document.createElement('tr')
  for (const value of [row.type, `${percent(row.recall)} (${row.full}/${row.n})`, row.family, row.precision === undefined ? 'Not measured' : `${percent(row.precision)} (${row.tp}/${row.tp + row.fp})`]) {
   const td = document.createElement('td')
   td.textContent = value
   tr.append(td)
  }
  $('metrics').append(tr)
 }
 $('metric-status').textContent = 'Development data, identifiers-profile evaluation of this engine. Rules were changed while looking at these sets. These are identifier types, not document-type scores. Other profiles and the curated examples are not scored here.'
}
fetch('./comparison.json').then(response => { if (!response.ok) throw Error('Unavailable')
 return response.json() }).then(data => { evaluation = data
 renderMetrics() }).catch(() => { $('metric-status').textContent = 'Evaluation unavailable. Open the source report for measured limits.' })
$('corpus').addEventListener('change', () => { if (evaluation) renderMetrics() })
$('note').value = examples.visit
provenance()
showLog()
run()
