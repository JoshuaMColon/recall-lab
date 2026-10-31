import { expect, test } from '@playwright/test'
import { setTheme } from './helpers'

const snap = (page: import('@playwright/test').Page) => page.locator('canvas[aria-hidden="true"]').evaluate((c: HTMLCanvasElement) => c.toDataURL())

test('starfield twinkles, and is a static frame under reduced motion', async ({ page }) => {
  await setTheme(page, 'dark')
  await page.goto('/')
  const canvas = page.locator('canvas[aria-hidden="true"]')
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toHaveCSS('pointer-events', 'none')
  const a = await snap(page)
  await page.waitForTimeout(400)
  expect(await snap(page)).not.toEqual(a)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(150)
  const b = await snap(page)
  await page.waitForTimeout(400)
  expect(await snap(page)).toEqual(b)
})
