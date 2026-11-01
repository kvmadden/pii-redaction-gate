import { assertSendable } from './runtime/send-guard.js'
import { redactText } from './runtime/engine.js'
import { PATTERN_RULES } from './runtime/patterns.js'
const $ = id => document.getElementById(id)
const examples = {
 visit: 'Patient Inez Q. Thorn-Smith, DOB 03/04/1961, MRN#: Z9900188. Admitted 10/22/2025. Continue Ozempic 0.5 mg weekly. A1c 7.4%, BP 138/84.',
 contact: 'Dr. Adira Linden. Age: 97. Phone 202-555-0143. Device serial: DEMO-90188. Portal https://example.org/chart/88. Continue metformin 500 mg BID.',
 limits: 'tanya called. IP: 192.0.2.87. Continue metformin 500 mg BID. Year 2026.'
}
const reasons = {name:'Name-shaped phrase or contextual name',dob:'Date next to a birth marker',date:'Calendar date beyond year alone',age:'Age greater than 89',account:'Labeled record, account, plan or other identifier',phone:'Phone or fax number',email:'Email address',address:'Street, PO box or labeled locality',ssn:'Social Security number shape',url:'Web address',ip:'IP address shape',card:'Luhn-valid card number',coords:'Geographic coordinates'}
let current = null
let reviewedInput = ''
function spans(input, output) {
 const escaped = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
 const tokens = [...output.matchAll(/\[([a-z-]+)\]/g)]
 if (!tokens.length) return []
 let end = 0
 const pieces = tokens.map(t => {
   const p = escaped(output.slice(end,t.index))
   end = t.index + t[0].length
   return p
 })
 pieces.push(escaped(output.slice(end)))
 const match = new RegExp('^'+pieces.join('([\\s\\S]+?)')+'$').exec(input)
 if (!match) return null
 return tokens.map((t,i)=>({type:t[1],value:match[i+1]}))
}
function run() {
 const broken = {type:'demo-failure',re:/[\s\S]+/g,validate(){throw new Error('Synthetic failure')}}
 if ($('failure').checked) PATTERN_RULES.push(broken)
 try { current = redactText($('note').value,{profile:'identifiers',peopleMap:{people:[],safe:[]}}) }
 finally { if ($('failure').checked) PATTERN_RULES.splice(PATTERN_RULES.indexOf(broken),1) }
 reviewedInput = $('note').value
 $('output').textContent = current.text
 $('status').textContent = current.blocked ? 'Blocked. Engine failure. Nothing can be sent.' : 'Redaction completed. Review for identifiers the rules may have missed.'
 $('kept').textContent = current.blocked ? 'No note content is available for sending.' : 'Text outside the replacement tokens stayed intact. Check the output for preserved medications, doses, conditions and lab values, and for missed identifiers.'
 $('removed').replaceChildren()
 if (!current.blocked) {
 const removed = spans(reviewedInput,current.text)
 for (const item of removed || []) {
  const li = document.createElement('li')
  const code = document.createElement('code')
  code.textContent = item.value
  li.append(code,document.createTextNode(` → [${item.type}]: ${reasons[item.type] || 'Configured identifier rule'}`))
  $('removed').append(li)
 }
 if (!removed) $('removed').textContent = 'Span review unavailable. Input containing token-like text may be ambiguous. Review the redacted output.'
 if (removed?.length === 0) $('removed').textContent = 'No rules matched. This does not mean the note contains no identifiers.'
 }
 $('send-status').textContent = current.blocked ? 'Send gate: blocked.' : 'Send gate: ready for a simulated attempt after review.'
}
$('example').addEventListener('change',()=>{
 $('note').value=examples[$('example').value]
 run()
})
$('run').addEventListener('click',run)
$('failure').addEventListener('change',run)
$('note').addEventListener('input',()=>{
 current=null
 $('send-status').textContent='Note changed. Redact again before trying send.'
})
$('send').addEventListener('click',()=>{
 try {
  assertSendable(reviewedInput === $('note').value ? current : null)
  $('send-status').textContent = 'Simulated send allowed. Only the redacted result would pass to a writer. No network request was made.'
 } catch {
  $('send-status').textContent = 'Send blocked. No payload passed to the simulated writer.'
 }
})
$('note').value=examples.visit
run()
