// eval/public-indist.js. Automatic indistinguishability check for Set B planting.
//
// Mask each planted edit (identifier plus its title or label), take the sentence window
// around it, and do the same around random words in untouched text. Train a character
// n-gram logistic regression to tell the two apart, with whole documents held out per fold.
// Held-out accuracy near 50 percent means the edits leave no trace in the surrounding words.
//
// Header and footer lines are scored apart. Untouched case reports have no chart header
// at all, so those lines are a structural trace by construction and are reported as one.

const MASK = '<ID>'
const RADIUS = 60
const BUCKETS = 1 << 13

function rng(seed) {
 let a = seed >>> 0
 return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function windowAround(text, start, end) {
 // Stay on the edit's own line so header and narrative text never mix.
 const lineStart = text.lastIndexOf('\n', start - 1) + 1
 const lineEnd = text.indexOf('\n', end) === -1 ? text.length : text.indexOf('\n', end)
 const left = text.slice(Math.max(lineStart, start - RADIUS), start)
 const right = text.slice(end, Math.min(lineEnd, end + RADIUS))
 return `${left}${MASK}${right}`.toLowerCase()
}

function features(s) {
 const f = new Set()
 for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= s.length; i++) {
  let h = 2166136261
  for (let j = i; j < i + n; j++) { h ^= s.charCodeAt(j); h = Math.imul(h, 16777619) }
  f.add((h >>> 0) % BUCKETS)
 }
 return [...f]
}

function train(rows, { iters = 300, rate = 0.5, l2 = 0.01 } = {}) {
 const w = new Float64Array(BUCKETS)
 let b = 0
 for (let it = 0; it < iters; it++) {
  const g = new Float64Array(BUCKETS)
  let gb = 0
  for (const { x, y } of rows) {
   let z = b
   for (const i of x) z += w[i]
   const err = 1 / (1 + Math.exp(-z)) - y
   for (const i of x) g[i] += err
   gb += err
  }
  for (let i = 0; i < BUCKETS; i++) w[i] -= rate * (g[i] / rows.length + l2 * w[i])
  b -= rate * gb / rows.length
 }
 return x => { let z = b; for (const i of x) z += w[i]; return z > 0 ? 1 : 0 }
}

/** Planted windows. `body` edits sit inside the narrative, the rest are header or footer lines. */
export function plantedWindows(keyDocs) {
 const out = []
 for (const doc of keyDocs) for (const e of doc.edits) {
  const added = doc.text.slice(e.start, e.end)
  out.push({ doc: doc.id, kind: added.includes('\n') ? 'header-footer' : 'body', text: windowAround(doc.text, e.start, e.end) })
 }
 return out
}

/** Matched windows from untouched text: mask a random one or two word run, as long as a short identifier. */
export function untouchedWindows(docs, count, seed) {
 const r = rng(seed)
 const words = []
 for (const doc of docs) for (const m of doc.text.matchAll(/[\p{L}\p{N}][\p{L}\p{N}'’.‐-]*(?: [\p{L}\p{N}][\p{L}\p{N}'’.‐-]*)?/gu)) words.push({ doc: doc.id, text: doc.text, start: m.index, end: m.index + m[0].length })
 const out = []
 for (let i = 0; i < count; i++) {
  const w = words[Math.floor(r() * words.length)]
  out.push({ doc: w.doc, kind: 'untouched', text: windowAround(w.text, w.start, w.end) })
 }
 return out
}

/**
 * Grouped cross-validation accuracy. Folds split by document so no document is in both train and test.
 * @returns {{accuracy, correct, n, folds}}
 */
export function heldOutAccuracy(pos, neg, { folds = 5, seed = 1 } = {}) {
 const rows = [...pos.map(p => ({ ...p, y: 1 })), ...neg.map(n => ({ ...n, y: 0 }))].map(row => ({ ...row, x: features(row.text) }))
 const docs = [...new Set(rows.map(r => r.doc))].sort()
 const r = rng(seed)
 const order = docs.map(d => [r(), d]).sort((a, b) => a[0] - b[0]).map(([, d]) => d)
 const foldOf = new Map(order.map((d, i) => [d, i % folds]))
 let correct = 0, n = 0
 for (let f = 0; f < folds; f++) {
  const trainRows = rows.filter(row => foldOf.get(row.doc) !== f)
  const testRows = rows.filter(row => foldOf.get(row.doc) === f)
  if (!testRows.length || new Set(trainRows.map(t => t.y)).size < 2) continue
  const predict = train(trainRows)
  for (const row of testRows) { n++; if (predict(row.x) === row.y) correct++ }
 }
 return { accuracy: n ? correct / n : null, correct, n, folds }
}

/** Wilson 95 percent interval for a proportion. */
export function wilson(k, n) {
 if (!n) return null
 const z = 1.96, p = k / n
 const d = 1 + z * z / n
 const c = (p + z * z / (2 * n)) / d
 const h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d
 return [Math.max(0, c - h), Math.min(1, c + h)]
}

/** Full check: body edits against matched untouched windows, repeated over several negative draws. */
export function indistinguishability(keyDocs, untouchedDocs, { draws = 20, seed = 20261101 } = {}) {
 const planted = plantedWindows(keyDocs.filter(d => d.planted))
 const report = {}
 for (const kind of ['body', 'header-footer']) {
  const pos = planted.filter(p => p.kind === kind)
  const runs = []
  for (let i = 0; i < draws; i++) runs.push(heldOutAccuracy(pos, untouchedWindows(untouchedDocs, pos.length, seed + i), { seed: seed + i }))
  const correct = runs.reduce((s, x) => s + x.correct, 0)
  const n = runs.reduce((s, x) => s + x.n, 0)
  const accs = runs.map(x => x.accuracy).sort((a, b) => a - b)
  report[kind] = { plantedWindows: pos.length, untouchedWindowsPerDraw: pos.length, draws, meanAccuracy: correct / n, minAccuracy: accs[0], maxAccuracy: accs[accs.length - 1], pooledCorrect: correct, pooledN: n }
 }
 return report
}
