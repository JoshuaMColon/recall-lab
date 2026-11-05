import { expect, test } from '@playwright/test'
import { expectAxeClean, installSpeechStub, setTheme, speechLog } from './helpers'

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

test('tapping Listen speaks with the loaded voice and never autoplays', async ({ page }) => {
  await installSpeechStub(page)
  await page.goto('/lessons')
  const before = await speechLog(page)
  expect(before.filter((entry) => entry.startsWith('speak:'))).toEqual([])
  const button = page.getByRole('button', { name: 'Listen to the lesson list' })
  await button.tap()
  await expect.poll(async () => (await speechLog(page)).some((entry) => entry.startsWith('speak:'))).toBe(true)
  const added = (await speechLog(page)).slice(before.length)
  expect(added[0]).toMatch(/^speak:/)
  expect(added[0]).toContain('lang:en_US')
  expect(added).toContain('resume')
  expect(added).not.toContain('cancel')
  await expect(page.getByRole('status').filter({ hasText: 'Speaking' })).toBeVisible()
  await page.getByRole('button', { name: 'Stop' }).tap()
  await expect(button).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Speaking' })).toHaveCount(0)

  await button.tap()
  await expect(page.getByRole('status').filter({ hasText: 'Speaking' })).toBeVisible()
  const whileSpeaking = (await speechLog(page)).length
  await page.getByRole('link', { name: 'Recall Lab' }).click()
  await expect(page).toHaveURL(/\/$/)
  expect((await speechLog(page)).slice(whileSpeaking)).toContain('cancel')
  await expect(page.getByRole('status').filter({ hasText: 'Speaking' })).toHaveCount(0)
})

test('uses a voice that arrives after load without speaking before the tap', async ({ page }) => {
  await installSpeechStub(page, 'loading')
  await page.goto('/guide')
  const button = page.getByRole('button', { name: 'Listen to the whole guide' })
  await expect(button).toBeEnabled()
  expect((await speechLog(page)).filter((entry) => entry.startsWith('speak:'))).toEqual([])
  await page.evaluate(() => (window as unknown as { __setSpeechVoices: (langs: string[]) => void }).__setSpeechVoices(['en_US']))
  const beforeTap = await speechLog(page)
  expect(beforeTap.filter((entry) => entry.startsWith('speak:'))).toEqual([])
  await button.tap()
  await expect.poll(async () => (await speechLog(page)).some((entry) => entry.startsWith('speak:'))).toBe(true)
  const added = (await speechLog(page)).slice(beforeTap.length)
  expect(added[0]).toMatch(/^speak:/)
  expect(added[0]).toContain('lang:en_US')
  expect(added).not.toContain('cancel')
})

test('disables Listen with a tip when the phone has no voices', async ({ page }) => {
  await installSpeechStub(page, 'no-voices')
  await page.goto('/guide')
  const button = page.getByRole('button', { name: 'Listen to the whole guide' })
  await expect(button).toBeDisabled()
  await button.locator('..').hover()
  await expect(page.getByRole('tooltip')).toContainText(/no text-to-speech voice/i)
  expect((await speechLog(page)).filter((entry) => entry.startsWith('speak:'))).toEqual([])
})
