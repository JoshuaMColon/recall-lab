import { expect, test } from '@playwright/test'
import { expectAxeClean, setTheme } from './helpers'

for (const theme of ['light', 'dark'] as const) {
  test(`mobile dashboard and quiz fit the screen (${theme})`, async ({ page }) => {
    await setTheme(page, theme)
    await page.goto('/dashboard')
    await expect(page.getByRole('navigation', { name: 'Main (mobile)' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await expectAxeClean(page)
    await page.goto('/quiz?t=bug&n=1')
    await page.getByRole('radio').nth(1).check()
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByRole('region', { name: 'Feedback' })).toBeVisible()
    await expectAxeClean(page)
  })
}
