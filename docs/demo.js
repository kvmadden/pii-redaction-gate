import { inspectNote } from './inspector.js'
import { PROFILES } from './runtime/profiles.js'
import { assertSendable } from './runtime/send-guard.js'
const $ = id => document.getElementById(id)
const examples = {
 visit: 'Patient Inez Q. Thorn-Smith, DOB 03/04/1961, MRN#: Z9900188.\nAdmitted 10/22/2025. Phone 202-555-0143.\n\nContinue Ozempic 0.5 mg weekly.\nA1c 7.4%, BP 138/84.\nContinue metformin 500 mg BID.',
 contact: 'Dr. Adira Linden. Age: 97. Phone 202-555-0143. Device serial: DEMO-90188. Portal https://example.org/chart/88. Continue metformin 500 mg BID.',
 limits: 'tanya called. IP: 192.0.2.87. Continue metformin 500 mg BID. Year 2026.',
 blank: ''
}
let current = null
let version = 0
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
 $('status').textContent = message
 document.querySelector('.statusbar .small').textContent = PROFILES[$('profile').value].tiers.join(' → ').toUpperCase()
 $('result-badge').textContent = 'AWAITING INSPECTION'
 $('output').textContent = 'Your inspected result will appear here.'
 $('original').textContent = 'Inspect the note to reveal removed spans.'
 $('counts').replaceChildren()
 $('removed').replaceChildren()
 $('kept').textContent = ''
 $('send-status').textContent = 'Send gate: blocked until the current note is inspected.'
 document.querySelector('.workspace').dataset.state = 'idle'
}
async function run() {
 invalidate('Inspecting with the local engine…')
 const ticket = version
 const input = $('note').value
 if (!input.trim()) {
  document.querySelector('.workspace').dataset.state = 'empty'
  $('status').textContent = 'Nothing to inspect. Choose a synthetic example or enter fictional text.'
  return
 }
 $('run').disabled = true
 document.querySelector('.workspace').setAttribute('aria-busy', 'true')
 try {
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  if (ticket !== version) return
  current = inspectNote(input, $('profile').value, $('failure').checked)
  const blocked = current.blocked
  document.querySelector('.workspace').dataset.state = blocked ? 'blocked' : 'ready'
  $('status').textContent = blocked ? 'BLOCKED / Engine failure. No payload can pass.' : 'Inspection complete / Review required before use'
  $('result-badge').textContent = blocked ? 'BLOCKED' : 'REVIEW REQUIRED'
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
  $('kept').textContent = blocked ? 'No content is available for sending.' : `${current.kept.length} clinical phrases preserved. Green marks are examples, not a completeness check.`
  $('send-status').textContent = blocked ? 'Send gate: BLOCKED. No payload available.' : 'Send gate: ready for a local simulated attempt.'
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
 try { assertSendable(current)
 $('send-status').textContent = 'Simulated send allowed. Only redacted text passed the gate. No request was made.' }
 catch { $('send-status').textContent = 'Send blocked. No payload passed to the simulated writer.' }
})
$('theme').addEventListener('click', () => {
 const dark = document.documentElement.dataset.theme !== 'dark'
 document.documentElement.dataset.theme = dark ? 'dark' : 'light'
 $('theme').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`)
 $('theme').querySelector('span').textContent = dark ? 'Light mode' : 'Dark mode'
})
$('note').value = examples.visit
run()
