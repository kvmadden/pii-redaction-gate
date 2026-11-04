const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const fs = require('node:fs')
const assert = require('node:assert/strict')
// The redaction desk: every visible text at 12px or more and 4.5:1 against what
// is behind it, no green, teal or sage anywhere, chips with real inner padding.
// Disabled controls are exempt from contrast, as in WCAG.
function audit() {
 const parse = c => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return {r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1} }
 const over = (top, bottom) => ({r:top.r * top.a + bottom.r * (1 - top.a), g:top.g * top.a + bottom.g * (1 - top.a), b:top.b * top.a + bottom.b * (1 - top.a), a:1})
 const lum = ({r, g, b}) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
 const behind = el => { const layers = []
  for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break } }
  return layers.reverse().reduce((bg, c) => over(c, bg), {r:255, g:255, b:255, a:1}) }
 const hsl = ({r, g, b}) => { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min
  if (!d) return {h:0, s:0, l}; const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4); return {h:(h + 360) % 360, s, l} }
 const name = el => el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`
 const small = [], faint = [], green = []
 for (const el of document.querySelectorAll('body *')) {
  const cs = getComputedStyle(el)
  for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor', 'textDecorationColor', 'accentColor', 'caretColor']) {
   const c = parse(cs[prop]); if (!c || c.a === 0) continue
   const {h, s} = hsl(c); if (s > 0.15 && h >= 60 && h <= 200) green.push(`${name(el)} ${prop} ${cs[prop]}`)
  }
  for (const c of (cs.boxShadow.match(/rgba?\([^)]+\)/g) || [])) { const {h, s} = hsl(parse(c)); if (s > 0.15 && h >= 60 && h <= 200) green.push(`${name(el)} boxShadow ${c}`) }
  if (el.tagName === 'OPTION' || !el.getClientRects().length || cs.visibility === 'hidden') continue
  const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || (['SELECT', 'TEXTAREA'].includes(el.tagName) && el.value)
  if (!ownText) continue
  if (parseFloat(cs.fontSize) < 12) small.push(`${name(el)} ${cs.fontSize}`)
  if (el.closest(':disabled')) continue
  const bg = behind(el), fg = over(parse(cs.color), bg), ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05)
  if (ratio < 4.5) faint.push(`${name(el)} ${ratio.toFixed(2)}:1`)
 }
 // Chips: the text sits inside its box with room on every side.
 const tight = []
 for (const el of document.querySelectorAll('.brand .mark, h1 .bar, #output mark.removed, [data-status=review] #result-badge, [data-status=blocked] #result-badge')) {
  const range = document.createRange(); range.selectNodeContents(el)
  const text = [...range.getClientRects()], boxes = [...el.getClientRects()]
  for (const t of text) { const box = boxes.find(b => t.top >= b.top - 1 && t.bottom <= b.bottom + 1 && t.left >= b.left - 1 && t.right <= b.right + 1)
   if (!box || t.left - box.left < 4 || box.right - t.right < 4 || t.top - box.top < 1 || box.bottom - t.bottom < 1) tight.push(`${name(el)} "${el.textContent}"`) }
 }
 // A step flow stays on one line.
 const flow = document.querySelector('.statusbar .small')
 const flowWraps = !!flow.getClientRects().length && flow.getBoundingClientRect().height > parseFloat(getComputedStyle(flow).lineHeight) * 1.5
 const bar = document.querySelector('#output mark.removed'), page = document.querySelector('#output')
 const faces = [...document.fonts].map(f => ({family:f.family.replace(/["']/g, ''), weight:f.weight, status:f.status}))
 return {small, faint, green, tight, flowWraps,
  bar: bar && {bg:getComputedStyle(bar).backgroundColor, fg:getComputedStyle(bar).color, font:getComputedStyle(bar).fontFamily},
  page: {bg:getComputedStyle(page).backgroundColor, font:getComputedStyle(page).fontFamily, size:parseFloat(getComputedStyle(page).fontSize)},
  sansLoaded:faces.some(f => f.family === 'IBM Plex Sans' && f.status === 'loaded'),
  monoLoaded:faces.some(f => f.family === 'IBM Plex Mono' && f.weight === '500' && f.status === 'loaded')}
}
async function main() {
 const browser = await chromium.launch({headless:true,channel:'chrome'})
 const results = []
 try {
 for (const [width,height] of [[1440,900],[1024,768],[430,932],[390,844]]) {
  const page = await browser.newPage({viewport:{width,height}})
  const errors = []
  page.on('pageerror',e => errors.push(e.message))
  await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:8769')
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  assert.ok(await page.locator('#original mark.removed').count())
  assert.ok(await page.locator('#output mark.kept').count())
  assert.ok(await page.locator('#counts').textContent())
  await page.waitForFunction(() => document.querySelectorAll('#metrics tr').length > 0)
  assert.match(await page.locator('#metric-status').textContent(), /identifiers-profile/)
  await page.locator('#corpus').selectOption('templates')
  assert.ok(await page.locator('#metrics tr').count())
  for (const type of ['fax','discharge','refill']) {
   await page.locator('#example').selectOption(type)
   await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
   assert.match(await page.locator('#provenance').textContent(), /Synthetic/)
   assert.match(await page.locator('#output').textContent(), /metformin 500 mg BID/)
  }
  await page.locator('#reviewed').focus()
  await page.keyboard.press('Enter')
  assert.match(await page.locator('#review-status').textContent(), /recorded locally/)
  await page.locator('#flagged').click()
  assert.match(await page.locator('#review-status').textContent(), /flagged locally/)
  const stored = await page.evaluate(() => localStorage.getItem('redaction-inspector-reviews-v1'))
  assert.equal(JSON.parse(stored).length, 2)
  assert.ok(!stored.includes('Inez'))
  await page.reload()
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  assert.match(await page.locator('#review-log').textContent(), /flagged/)
  await page.getByText('Local review log', {exact:true}).click()
  await page.locator('#clear-reviews').click()
  assert.match(await page.locator('#review-log').textContent(), /No local reviews/)
  await page.locator('#example').selectOption('fax')
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  await page.locator('#note').fill('Changed draft')
  assert.equal(await page.locator('#reviewed').isDisabled(), true)
  await page.locator('#example').selectOption('visit')
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  await page.getByText('Local review log', {exact:true}).click()
  await page.evaluate(() => scrollTo(0,0))
  await page.screenshot({path:`docs/media/demo-${width}.png`})
  await page.screenshot({path:`docs/media/inspector-full-${width}.png`,fullPage:true})
  await page.locator('#send').click()
  assert.match(await page.locator('#send-status').textContent(), /allowed/)
  await page.locator('#failure').check()
  await page.waitForFunction(() => document.querySelector('#output').textContent === '[redaction-blocked]')
  await page.locator('#send').click()
  assert.match(await page.locator('#send-status').textContent(), /blocked/)
  assert.equal(await page.locator('#original mark').count(), 0)
  assert.equal(await page.locator('#reviewed').isDisabled(), true)
  // Blocked: the whole page is withheld as one carbon sheet, and the label is a bar.
  assert.equal(await page.locator('.workspace').getAttribute('data-status'), 'blocked')
  const withheld = await page.evaluate(audit)
  assert.equal(withheld.page.bg, 'rgb(28, 29, 33)')
  assert.deepEqual([withheld.small, withheld.faint, withheld.green, withheld.tight], [[], [], [], []])
  await page.screenshot({path:`docs/media/blocked-${width}.png`})
  await page.locator('#failure').uncheck()
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  await page.locator('#profile').selectOption('light')
  await page.locator('#send').click()
  assert.match(await page.locator('#send-status').textContent(), /blocked/)
  await page.locator('#run').click()
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  assert.match(await page.locator('#output').textContent(), /Inez/)
  await page.locator('#note').fill('<img src=x onerror=alert(1)> Phone 202-555-0143. Continue metformin 500 mg BID.')
  await page.locator('#run').click()
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  assert.equal(await page.locator('#output img').count(), 0)
  await page.locator('#note').fill('changed')
  await page.locator('#send').click()
  assert.match(await page.locator('#send-status').textContent(), /blocked/)
  await page.locator('#example').selectOption('blank')
  assert.match(await page.locator('#status').textContent(), /Empty/)
  await page.locator('#example').focus()
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement.id), 'profile')
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement.id), 'run')
  await page.locator('#profile').selectOption('identifiers')
  // Review: the "Known gaps" note leaves one span to decide, and the label is an outlined box.
  await page.locator('#example').selectOption('limits')
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  assert.equal(await page.locator('#result-badge').textContent(), 'NEEDS REVIEW')
  assert.equal(await page.locator('.workspace').getAttribute('data-status'), 'review')
  assert.ok(await page.locator('#review-spans li').count())
  const pending = await page.evaluate(audit)
  assert.deepEqual([pending.small, pending.faint, pending.green, pending.tight], [[], [], [], []])
  await page.locator('#example').selectOption('visit')
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  for (const theme of ['light','dark']) {
   if (theme === 'dark') await page.locator('#theme').click()
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
   const smallTargets = await page.locator('a,button,select,summary,.toggle').evaluateAll(els => els.filter(e => { const r = e.getBoundingClientRect(); return e.getClientRects().length && (r.width < 44 || r.height < 44) }).map(e => e.id || e.textContent.trim()))
   assert.deepEqual(smallTargets, [])
   if (theme === 'light') {
    const control = await page.evaluate(() => {
     const el = document.querySelector('#theme'), before = el.getAttribute('style')
     el.style.setProperty('width', '40px', 'important')
     el.style.setProperty('min-width', '0', 'important')
     el.style.setProperty('padding', '0', 'important')
     const rect = el.getBoundingClientRect(), caught = rect.width < 44 || rect.height < 44
     if (before === null) el.removeAttribute('style'); else el.setAttribute('style', before)
     return {width: rect.width, height: rect.height, caught}
    })
    assert.ok(control.caught, '44x44 target guard catches the undersized control mutation')
   }
   await page.evaluate(() => document.fonts.ready)
   const look = await page.evaluate(audit)
   assert.ok(look.sansLoaded && look.monoLoaded, 'IBM Plex Sans and Plex Mono load from the page')
   assert.deepEqual(look.small, [], 'no text under 12px')
   assert.deepEqual(look.faint, [], `text contrast at least 4.5:1 in the ${theme} theme`)
   assert.deepEqual(look.green, [], 'no green, teal or sage anywhere')
   assert.deepEqual(look.tight, [], 'chips keep real inner padding')
   assert.equal(look.flowWraps, false, 'the tier flow stays on one line')
   // The page carries the reading text in Plex Sans, the bars carry their token in Plex Mono.
   assert.match(look.page.font, /^"?IBM Plex Sans/)
   assert.ok(look.page.size >= (width > 760 ? 21 : 19), `reading text ${look.page.size}px`)
   assert.match(look.bar.font, /^"?IBM Plex Mono/)
   assert.deepEqual([look.page.bg, look.bar.bg, look.bar.fg], theme === 'light' ? ['rgb(255, 255, 255)', 'rgb(28, 29, 33)', 'rgb(255, 255, 255)'] : ['rgb(28, 29, 33)', 'rgb(233, 233, 236)', 'rgb(28, 29, 33)'])
   await page.evaluate(() => scrollTo(0,0))
   if (theme === 'dark') await page.screenshot({path:`docs/media/dark-${width}.png`})
  }
  assert.deepEqual(errors, [])
  results.push({width,height,reviewPersistence:true,reviewKeyboard:true,staleReviewDisabled:true,documentFixtures:true,metricSlices:true,normalSend:true,blockedSend:true,profileChangeBlocks:true,staleInputBlocks:true,empty:true,htmlSafe:true,keyboard:true,bothThemes:true,noOverflow:true,targets44:true,fontsLoaded:true,text12:true,contrast45:true,noGreen:true,chipPadding:true,flowOneLine:true,errors})
  await page.close()
 }
 const failurePage = await browser.newPage()
 await failurePage.route('**/comparison.json', route => route.abort())
 await failurePage.goto(process.env.DEMO_URL || 'http://127.0.0.1:8769')
 await failurePage.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
 await failurePage.waitForFunction(() => document.querySelector('#metric-status').textContent.includes('unavailable'))
 await failurePage.evaluate(() => { Storage.prototype.setItem = () => { throw Error('Synthetic storage failure') } })
 await failurePage.locator('#reviewed').click()
 assert.match(await failurePage.locator('#review-status').textContent(), /not saved/)
 await failurePage.close()
 // Ordered real UI states for a short flow animation, no fabricated results.
 const page = await browser.newPage({viewport:{width:1440,height:900}})
 await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:8769')
 await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
 const frameRoot = process.env.FRAME_DIR
 if (frameRoot) {
  await page.locator('#example').selectOption('blank')
  await page.screenshot({path:`${frameRoot}/0.png`})
  await page.locator('#example').selectOption('visit')
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Inspection complete'))
  const geometry = await page.locator('#output').evaluate(el => {
   el.scrollIntoView({block:'center'})
   const r = el.getBoundingClientRect()
   return {scrollY, viewport:{width:innerWidth,height:innerHeight}, output:{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}}
  })
  fs.writeFileSync(`${frameRoot}/result-view.json`, JSON.stringify(geometry,null,2)+'\\n')
  await page.screenshot({path:`${frameRoot}/1.png`})
  await page.locator('#flagged').click()
  await page.locator('.review-panel').scrollIntoViewIfNeeded()
  await page.screenshot({path:`${frameRoot}/2.png`})
  await page.locator('#failure').check()
  await page.waitForFunction(() => document.querySelector('#output').textContent === '[redaction-blocked]')
  await page.locator('#send').click()
  await page.screenshot({path:`${frameRoot}/3.png`})
 }
 await page.close()
 fs.writeFileSync('docs/evidence/polish/ui.json',JSON.stringify(results,null,2)+'\n')
 } finally { await browser.close() }
}
main().catch(e => { console.error(e)
 process.exit(1) })
