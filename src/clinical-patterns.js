// Deterministic clinical identifier shapes. No I/O or model calls.
const months = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
const streets = 'Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Way|Place|Pl|Terrace|Ter|Parkway|Pkwy|Highway|Hwy|Trail|Trl|Loop|Plaza|Square|Sq'
// A labeled identifier value may be split into groups ("ABC 1234 5678", "AB-123456").
// The label is matched without case, the value with case: groups are upper-case letters,
// digits and dashes, every group after the first holds a digit, and the value has at least
// three digits. Whatever follows the value is kept.
function labeledId(m, value) {
  const groups = value.split(/(?<= )/)
  let taken = 0, digits = 0
  for (const [i, g] of groups.entries()) {
    const word = g.trim()
    if (!/^[A-Z0-9][A-Z0-9-]*$/.test(word)) break
    if (i > 0 && !/\d/.test(word)) break
    if (i === 0 && !/\d/.test(word) && word.length > 4) break
    taken = i + 1
    digits += (word.match(/\d/g) || []).length
  }
  if (!taken || digits < 3) return m
  const kept = groups.slice(0, taken).join('')
  const tail = kept.endsWith(' ') ? ' ' : ''
  return m.slice(0, m.length - value.length) + '[account]' + tail + groups.slice(taken).join('')
}
const valueOnly = (m, value) => m.slice(0, m.length - value.length) + '[account]'
export const CLINICAL_RULES = [
  {type:'account', re:/\b(?:(?:hospital|record|chart|case|patient|unit|member|subscriber|insurance|insurer|plan|policy|group|account|acct)\s*(?:number|no\.?|num\.?|id|#)|mrn(?:\s*(?:no\.?|#))?)\s*[#:]?\s*((?:[A-Za-z0-9][A-Za-z0-9-]* ?){1,4})/gi, replace:labeledId},
  {type:'address', re:/\b(?:mailing\s+|home\s+|street\s+|residential\s+|postal\s+)?address\s*:[ \t]*([^\n]{3,100})/gi, validate:m=>/\d|\p{Lu}/u.test(m.slice(m.indexOf(':')+1)), replace:(m,v)=>m.slice(0,m.length-v.length)+'[address]'},
  {type:'address', re:new RegExp(`(?<![\\p{L}\\p{N}])\\d{1,6}\\s+(?:\\p{Lu}[\\p{L}'.-]*\\s+){1,3}(?:${streets})\\.?,\\s*\\p{Lu}[\\p{L}'.-]+(?:\\s+\\p{Lu}[\\p{L}'.-]+){0,2}(?:,\\s*\\p{Lu}{2}(?:\\s*\\d{5}(?:-\\d{4})?)?)?(?=\\s*(?:\\n|$|[.;)]))`,'gu')},
  {type:'url', re:/\b(?:https?:\/\/|www\.)[^\s<>\[\]]*[A-Za-z0-9/#=_~-]/gi},
  {type:'ip', re:/(?<![\w.:])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])/g},
  {type:'ip', re:/(?<![\w:])(?:[a-f0-9]{1,4}:){1,7}(?::[a-f0-9]{0,4}){1,7}(?![\w:])/gi},
  {type:'account', re:/\b(?:mrn|medical\s+record|patient\s+id|account|acct|member|policy|group|health\s+plan|plan|insurance|device\s+(?:serial|id)|serial|license|licence|driver'?s?\s+license|vin|vehicle\s+(?:id|registration)|plate)\b(?:\s*(?:number|no\.?|id))?\s*[#:]?\s*:?\s*([A-Z0-9][A-Z0-9-]{3,30})\b/gi, validate:m=>/\d/.test(m), replace:valueOnly},
  {type:'date', re:/(?<![\d.])(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})(?!\d)/g},
  {type:'date', re:new RegExp(`\\b(?:${months}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?|\\d{1,2}\\s+${months}\\.?(?:\\s+\\d{4})?)\\b`,'gi')},
  {type:'date', re:/\b(?:on|dated|visit|admitted|discharged|appointment|procedure|follow[- ]up)\s*:?\s*(\d{1,2}\/\d{1,2})(?![\d/])/gi, replace:(m,v)=>m.slice(0,m.length-v.length)+'[date]'},
  {type:'age', re:/\b(?:age(?:d)?\s*:?\s*)((?:9\d|1\d{2}))(?!\d)/gi, replace:(m,v)=>m.slice(0,m.length-v.length)+'[age]'},
  {type:'age', re:/\b(?:9\d|1\d{2})(?:\s*-?\s*years?\s*-?\s*old|\s*y\/?o\b|\s*yo\b)/gi},
  {type:'address', re:/\bP\.?\s*O\.?\s+Box\s+\d+(?:,\s*[A-Za-z ]+,?\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)?/gi},
  {type:'address', re:/\b(?:city|town|county|zip(?:\s+code)?)\s*:\s*([A-Za-z][A-Za-z '-]*|\d{5}(?:-\d{4})?)/gi, replace:(m,v)=>m.slice(0,m.length-v.length)+'[address]'},
]
