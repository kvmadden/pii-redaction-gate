import { test } from 'node:test'
import assert from 'node:assert/strict'
import { redactText } from '../src/engine.js'
const redact = text => redactText(text,{profile:'identifiers'}).text
for (const [type, text, value] of [
 ['date','Admitted 10/22/2025','10/22/2025'],
 ['date','Discharged 22 October 2025','22 October 2025'],
 ['age','Age: 97','97'],
 ['id','MRN#: Z9900188','Z9900188'],
 ['plan','Health plan number SYN77881','SYN77881'],
 ['device','Device serial: DEMO-90188','DEMO-90188'],
 ['license','License number: DEMO9981','DEMO9981'],
 ['vehicle','VIN: 1FICTIONAL0000001','1FICTIONAL0000001'],
 ['url','See https://example.com/chart/88','https://example.com/chart/88'],
 ['ip','IP: 198.51.100.42','198.51.100.42'],
 ['name','Patient Inez Q. Thorn-Smith','Inez Q. Thorn-Smith'],
 ['relative','husband, Ravi, called','Ravi'],
]) test(`clinical ${type}: ${text}`,()=>assert.ok(!redact(text).includes(value)))
for (const text of ['Continue Ozempic 0.5 mg weekly.','Chief Complaint: Crohn disease.','BP 138/84, A1c 7.4%, sodium 140.','Age: 89. Born in 1937.','Continue Eliquis 5 mg BID.']) test(`preserve ${text}`,()=>assert.equal(redact(text),text))
