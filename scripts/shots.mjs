// usage: node shots.mjs <base> <outdir> [demo]
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
const [base, out, demo] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch()
for (const dev of ['desktop', 'mobile']) {
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext(dev === 'mobile' ? { ...devices['Pixel 7'] } : { viewport: { width: 1440, height: 900 } })
    await ctx.addInitScript((t) => localStorage.setItem('recall-lab:theme', t), theme)
    const p = await ctx.newPage()
    p.on('console', (m) => m.type() === 'error' && console.log('console error', dev, theme, m.text().slice(0, 200)))
    const shot = (n) => p.screenshot({ path: `${out}/${n}-${dev}-${theme}.png`, fullPage: n !== 'quiz' })
    await p.goto(base + '/')
    await p.waitForTimeout(600)
    await shot('landing')
    if (demo) {
      await p.goto(base + '/demo')
      await p.waitForURL(/dashboard/, { timeout: 30000 })
    }
    // a few answers so the dashboard has data
    await p.goto(base + '/quiz?t=mcq,output&n=4')
    for (let k = 0; k < 4; k++) {
      await p.getByRole('button', { name: 'Check answer' }).waitFor()
      const r = p.getByRole('radio')
      if (await r.count()) await r.nth(k % 2).check()
      else await p.getByRole('textbox', { name: 'Exact output' }).fill(k % 2 ? '3' : 'hello')
      await p.getByRole('button', { name: 'Check answer' }).click()
      await p.getByRole('region', { name: 'Feedback' }).waitFor()
      await p.getByRole('button', { name: /Next question|Finish/ }).click()
    }
    await p.goto(base + '/quiz?o=D335.04&t=code&n=1')
    await p.getByRole('textbox', { name: 'Your Python code' }).waitFor()
    await p.getByRole('textbox', { name: 'Your Python code' }).fill('n = int(input())\ntotal = 0\nwhile n > 0:\n    total += n % 10\n    n //= 10\nprint(total)')
    await p.waitForTimeout(500)
    await shot('quiz')
    await p.getByRole('button', { name: 'Check answer' }).click()
    await p.getByRole('region', { name: 'Feedback' }).waitFor({ timeout: 60000 })
    await p.getByRole('region', { name: 'Feedback' }).evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await p.waitForTimeout(700)
    await p.screenshot({ path: `${out}/feedback-${dev}-${theme}.png` })
    await p.goto(base + '/dashboard')
    await p.getByRole('heading', { name: /Mastery map/ }).waitFor()
    await p.waitForTimeout(600)
    await shot('dashboard')
    await ctx.close()
  }
}
await b.close()
