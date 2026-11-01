// Run only after tuning is final. BASELINE_ENGINE points to untouched main.
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { DATASET } from './dataset.js'
import { aggregate, scoreSnippet, align, locate } from './score.js'
import { redactText } from '../src/engine.js'
if (!process.env.BASELINE_ENGINE) throw new Error('Set BASELINE_ENGINE to the untouched baseline src/engine.js path')
const before = (await import(pathToFileURL(process.env.BASELINE_ENGINE))).redactText
const heldout = JSON.parse(fs.readFileSync(new URL('./heldout.json', import.meta.url))).entries
const results = {}
// Gold-type precision uses overlapping gold labels. False positives are assigned
// by emitted token family. NAME includes relatives and facilities for this table.
const family = t => ({RELATIVE:'NAME',FACILITY:'NAME',DOB:'DATE',MRN:'ID',ACCOUNT:'ID',PLAN:'ID',LICENSE:'ID',DEVICE:'ID',VEHICLE:'ID',FAX:'PHONE',AGE_OVER_89:'AGE'}[t] || t)
const tokenFamily = t => ({name:'NAME',dob:'DATE',date:'DATE',age:'AGE',account:'ID',device:'ID',license:'ID',vehicle:'ID',phone:'PHONE',fax:'PHONE',email:'EMAIL',ssn:'ID',card:'ID',address:'ADDRESS',coords:'ADDRESS',url:'URL',ip:'IP'}[t] || t.toUpperCase())
function run(entries, engine) {
  const scores = entries.map(e => {
    const r = engine(e.text, {profile:'identifiers', peopleMap:{people:[],safe:[]}})
    if (r.blocked) throw Error(`Unexpected block: ${e.id}`)
    return scoreSnippet(e,r.text)
  })
  const result = aggregate(scores)
  result.precisionByFamily = {}
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const gold = locate(e.text,e.pii)
    const out = engine(e.text,{profile:'identifiers',peopleMap:{people:[],safe:[]}}).text
    for (const span of align(e.text,out)) {
      const overlaps = gold.filter(g => g.start < span.end && g.end > span.start)
      const families = new Set(overlaps.length ? overlaps.map(g => family(g.label)) : [tokenFamily(span.token)])
      for (const f of families) {
        const row = result.precisionByFamily[f] ||= {tp:0,fp:0}
        row[overlaps.length ? 'tp' : 'fp']++
      }
    }
  }
  for (const row of Object.values(result.precisionByFamily)) row.precision = row.tp / (row.tp + row.fp)
  return result
}
for (const [name,entries] of [['original',DATASET],['heldout',heldout]]) results[name] = {before:run(entries,before),after:run(entries,redactText)}
fs.writeFileSync(new URL('./comparison.json',import.meta.url),JSON.stringify(results,null,2)+'\n')
const pct = n => n == null ? 'n/a' : `${(n*100).toFixed(1)}%`
const lines = ['# Before and after evaluation','','Baseline: origin/main 91c4e16. Empty people map, identifiers profile. Original labels and published results unchanged. Held-out seed 20261031 was committed before tuning. Ages under 90 in the original set remain labeled identifiers, so original recall penalizes their intentional retention.','','Full removal requires every labeled letter and digit removed. Precision counts emitted spans overlapping gold. Family precision groups relatives and facilities with names, DOB with dates, all labeled ID kinds with IDs, and fax with phone. A span overlapping multiple families counts once per family. False positives are attributed by emitted token. This is not exact-boundary precision. Detailed typed recall, every miss, damaged negative and false positive are in comparison.json.']
for (const [set, runs] of Object.entries(results)) {
 lines.push('',`## ${set}`,'','| Measure | Before | After |','|---|---|---|')
 for (const key of ['entityRecall','spanPrecision','charPrecision','hardNegativesKept']) lines.push(`| ${key} | ${pct(runs.before.overall[key])} | ${pct(runs.after.overall[key])} |`)
 lines.push('','| Gold type | Count | Recall before | Recall after |','|---|---|---|---|')
 for (const [type,row] of Object.entries(runs.before.byType)) lines.push(`| ${type} | ${row.n} | ${pct(row.recall)} | ${pct(runs.after.byType[type].recall)} |`)
 lines.push('','| Precision family | Before | After |','|---|---|---|')
 for (const type of new Set([...Object.keys(runs.before.precisionByFamily),...Object.keys(runs.after.precisionByFamily)])) lines.push(`| ${type} | ${pct(runs.before.precisionByFamily[type]?.precision)} | ${pct(runs.after.precisionByFamily[type]?.precision)} |`)
 lines.push('','### After misses','','| Snippet | Type | Value | Status |','|---|---|---|---|')
 for (const m of runs.after.misses) lines.push(`| ${m.id} | ${m.type} | ${m.value} | ${m.status} |`)
 lines.push('','### After false positives','','| Snippet | Token | Removed |','|---|---|---|')
 for (const m of runs.after.falsePositives) lines.push(`| ${m.id} | ${m.token} | ${m.text} |`)
}
fs.writeFileSync(new URL('./comparison.md',import.meta.url),lines.join('\n')+'\n')
