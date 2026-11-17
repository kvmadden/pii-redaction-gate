// Synthetic-only Chromium smoke test. This is a browser interaction check, not a de-identification evaluation.
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { chromium } = require('playwright')

async function startLocalServer() {
  const child = spawn(process.execPath, ['scripts/serve-demo.js'], {
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  let errors = ''
  child.stderr.on('data', chunk => { errors += chunk.toString() })
  const url = await new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => finish(new Error('Local inspector did not start: ' + output + errors)), 10000)
    function finish(err, value) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (err) reject(err)
      else resolve(value)
    }
    child.stdout.on('data', chunk => {
      output += chunk.toString()
      const match = output.match(/Redaction inspector: (http:\/\/127\.0\.0\.1:\d+)/)
      if (match) finish(null, match[1])
    })
    child.once('error', err => finish(err))
    child.once('exit', code => finish(new Error('Local inspector exited (' + code + '): ' + errors)))
  })
  return { child, url }
}

async function inspected(page) {
  await page.waitForFunction(() => {
    const workspace = document.querySelector('.workspace')
    return workspace?.dataset.state === 'ready' &&
      document.querySelector('#status')?.textContent.includes('Inspection complete')
  })
}

async function main() {
  let server
  let browser
  try {
    server = await startLocalServer()
    browser = await chromium.launch({ headless: true })
    const pageErrors = []
    const page = await browser.newPage()
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.goto(server.url)
    await inspected(page)

    // A keyboard-reported miss refuses the original note, even after edit and revert.
    await page.locator('#example').selectOption('refill')
    await inspected(page)
    const flaggedNote = await page.locator('#note').inputValue()
    await page.locator('#flagged').focus()
    await page.keyboard.press('Enter')
    assert.match(await page.locator('#review-status').textContent(), /flagged locally/)
    await page.locator('#send').click()
    assert.match(await page.locator('#send-status').textContent(), /refused/)
    await page.locator('#note').fill('Temporary synthetic edit.')
    await page.locator('#note').fill(flaggedNote)
    await page.locator('#run').click()
    assert.match(await page.locator('#status').textContent(), /Edit the note before inspecting again/)
    await page.locator('#send').click()
    assert.match(await page.locator('#send-status').textContent(), /refused/)

    // A different, clean fictional note still needs reinspection and human acknowledgment.
    await page.locator('#note').fill('Continue metformin 500 mg BID.')
    await page.locator('#send').click()
    assert.match(await page.locator('#send-status').textContent(), /refused/)
    await page.locator('#run').click()
    await inspected(page)
    assert.equal(await page.locator('#result-badge').textContent(), 'CHECKS PASSED')
    await page.locator('#send').click()
    assert.match(await page.locator('#send-status').textContent(), /fresh review is required/)
    await page.locator('#reviewed').focus()
    await page.keyboard.press('Enter')
    assert.match(await page.locator('#review-status').textContent(), /recorded locally/)
    await page.locator('#send').click()
    assert.match(await page.locator('#send-status').textContent(), /allowed/)

    // Erasing the record also revokes the current acknowledgment, not the flagged-note block.
    await page.getByText('Local review log', { exact: true }).click()
    await page.locator('#clear-reviews').click()
    await page.locator('#send').click()
    assert.match(await page.locator('#send-status').textContent(), /refused/)
    await page.locator('#reviewed').click()
    await page.locator('#send').click()
    assert.match(await page.locator('#send-status').textContent(), /allowed/)
    const log = await page.evaluate(() => localStorage.getItem('redaction-inspector-reviews-v1'))
    assert.ok(log && !log.includes('Inez') && !log.includes('metformin'))
    assert.deepEqual(Object.keys(JSON.parse(log)[0]).sort(), ['action', 'at', 'document', 'profile', 'revision'])

    // Browser storage failure never grants a review acknowledgment.
    const storagePage = await browser.newPage()
    storagePage.on('pageerror', error => pageErrors.push(error.message))
    await storagePage.goto(server.url)
    await inspected(storagePage)
    await storagePage.locator('#example').selectOption('limits')
    await inspected(storagePage)
    assert.equal(await storagePage.locator('#result-badge').textContent(), 'NEEDS REVIEW')
    await storagePage.evaluate(() => { Storage.prototype.setItem = () => { throw Error('Synthetic storage denial') } })
    await storagePage.locator('#reviewed').click()
    assert.match(await storagePage.locator('#review-status').textContent(), /not saved/)
    await storagePage.locator('#send').click()
    assert.match(await storagePage.locator('#send-status').textContent(), /refused/)
    await storagePage.locator('#flagged').click()
    await storagePage.locator('#send').click()
    assert.match(await storagePage.locator('#send-status').textContent(), /refused/)

    // Actual touch events exercise the same refusal-and-review sequence on a narrow viewport.
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const phone = await touch.newPage()
    phone.on('pageerror', error => pageErrors.push(error.message))
    await phone.goto(server.url)
    await inspected(phone)
    await phone.locator('#flagged').tap()
    await phone.locator('#send').tap()
    assert.match(await phone.locator('#send-status').textContent(), /refused/)
    await phone.locator('#note').fill('Continue metformin 500 mg BID.')
    await phone.locator('#run').tap()
    await inspected(phone)
    await phone.locator('#send').tap()
    assert.match(await phone.locator('#send-status').textContent(), /fresh review is required/)
    await phone.locator('#reviewed').tap()
    await phone.locator('#send').tap()
    assert.match(await phone.locator('#send-status').textContent(), /allowed/)

    assert.deepEqual(pageErrors, [])
    await touch.close()
    await storagePage.close()
    await page.close()
    console.log('Synthetic keyboard, touch, edit/revert, local storage denial and acknowledgment-reset flows passed.')
  } finally {
    if (browser) await browser.close()
    if (server) server.child.kill()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
