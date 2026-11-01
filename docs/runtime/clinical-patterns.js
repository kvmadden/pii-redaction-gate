// Deterministic clinical identifier shapes. No I/O or model calls.
const months = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
const valueOnly = (m, value) => m.slice(0, m.length - value.length) + '[account]'
export const CLINICAL_RULES = [
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
