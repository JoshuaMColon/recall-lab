import { expect, test } from '@playwright/test'
import { expectAxeClean, setTheme } from './helpers'

test('lessons stay off the mobile tab bar', async ({ page }) => {
  await page.goto('/dashboard')
  const mobile = page.getByRole('navigation', { name: 'Main (mobile)' })
  await expect(mobile.getByRole('link')).toHaveCount(4)
  await expect(mobile.getByRole('link', { name: 'Lessons' })).toHaveCount(0)
  await page.locator('header').getByRole('link', { name: 'Lessons' }).click()
  await expect(page).toHaveURL(/\/lessons$/)
  await expect(page.getByRole('heading', { level: 1, name: /one topic at a time/i })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

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
