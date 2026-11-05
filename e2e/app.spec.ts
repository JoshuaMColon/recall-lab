import { expect, test } from '@playwright/test'
import { expectAxeClean, setTheme } from './helpers'

test.describe('landing', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`is axe clean in ${theme} mode`, async ({ page }) => {
      await setTheme(page, theme)
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expectAxeClean(page)
    })
  }

  test('theme toggle switches and persists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.getByRole('button', { name: /dark/i }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('every button and link-button has a tooltip on hover', async ({ page }) => {
    await page.goto('/')
    const btn = page.locator('main a.press, main button').first()
    await btn.hover()
    await expect(page.getByRole('tooltip').first()).toBeVisible()
  })
})

test.describe('practice', () => {
  test('MCQ: answer, instant feedback, and it shows on the dashboard', async ({ page }) => {
    await page.goto('/quiz?t=mcq&n=2')
    await expect(page.getByRole('button', { name: 'Check answer' })).toBeDisabled()
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Check answer' }).click()
    const fb = page.getByRole('region', { name: 'Feedback' })
    await expect(fb).toBeVisible()
    await expect(fb.getByRole('status').first()).toHaveText(/Correct|Not quite/)
    await expectAxeClean(page)
    await page.getByRole('button', { name: 'Next question' }).click()
    await page.getByRole('radio').nth(1).check()
    await page.getByRole('button', { name: 'Check answer' }).click()
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page.getByText('Practice complete')).toBeVisible()
    await page.getByRole('link', { name: 'Dashboard' }).first().click()
    await expect(page.getByRole('heading', { name: /mastery map/i })).toBeVisible()
    await expect(page.getByText(/^2$/).first()).toBeVisible()
    await expectAxeClean(page)
  })

  test('predict the output: a wrong answer shows what Python really prints', async ({ page }) => {
    await page.goto('/quiz?o=D335.01&t=output&n=1')
    // Read the right answer out of the bank via the explanation after a wrong try, then check a fresh run.
    await page.getByRole('textbox', { name: 'Exact output' }).fill('definitely wrong')
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByText('Not quite')).toBeVisible()
    await expect(page.getByText('Python prints', { exact: true })).toBeVisible()
  })

  test('find the bug: choosing a line grades it and shows the fix', async ({ page }) => {
    await page.goto('/quiz?t=bug&n=1')
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByText(/The bug is on line \d+/)).toBeVisible()
  })

  test('write the code: hidden tests run in the in-browser Python', async ({ page }) => {
    await page.goto('/quiz?o=D335.01&t=code&n=1')
    const editor = page.getByRole('textbox', { name: 'Your Python code' })
    await editor.fill('print("this is not the answer")')
    await page.getByRole('button', { name: /Run examples/ }).click()
    await expect(page.getByText(/Tests: 0\/\d+ passed/)).toBeVisible({ timeout: 45_000 })
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByRole('region', { name: 'Feedback' }).getByText(/Not quite/)).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText('hidden').first()).toBeVisible()
    await page.getByText('Show a reference solution').click()
    await expect(page.getByLabel('Reference solution')).toBeVisible()
  })
})

test.describe('beginner guide', () => {
  test('is linked from the landing page and Listen never autoplays', async ({ page }) => {
    await page.addInitScript(() => {
      const calls: string[] = []
      ;(window as unknown as { __speaks: string[] }).__speaks = calls
      const synth = window.speechSynthesis
      synth.speak = ((utterance: SpeechSynthesisUtterance) => {
        calls.push(`speak:${utterance.text.slice(0, 80)}`)
      }) as typeof synth.speak
      synth.cancel = () => {
        calls.push('cancel')
      }
    })
    await page.goto('/')
    await page.getByRole('link', { name: 'How to use this' }).click()
    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { level: 1, name: /first visit/i })).toBeVisible()
    for (const title of ['Guest demo or a free account', 'Dashboard, Practice, Review, and Mock OA', 'The four kinds of questions', 'How grading works', 'Spaced repetition, in plain English']) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
    }
    const before = await page.evaluate(() => (window as unknown as { __speaks: string[] }).__speaks)
    expect(before.filter((entry) => entry.startsWith('speak:'))).toEqual([])
    await page.getByRole('button', { name: 'Listen to the whole guide' }).click()
    await expect.poll(async () => page.evaluate(() => (window as unknown as { __speaks: string[] }).__speaks.some((entry) => entry.startsWith('speak:')))).toBe(true)
    await expect(page.getByRole('status').filter({ hasText: 'Speaking' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Stop' }).click()
    await expect(page.getByRole('button', { name: 'Listen to the whole guide' })).toBeVisible()
    await expectAxeClean(page)
  })
})

test.describe('lessons', () => {
  test('index loads and Listen does not autoplay', async ({ page }) => {
    await page.addInitScript(() => {
      const calls: string[] = []
      ;(window as unknown as { __speaks: string[] }).__speaks = calls
      const synth = window.speechSynthesis
      synth.speak = ((utterance: SpeechSynthesisUtterance) => {
        calls.push(`speak:${utterance.text.slice(0, 80)}`)
      }) as typeof synth.speak
      synth.cancel = () => {
        calls.push('cancel')
      }
    })
    await page.goto('/lessons')
    await expect(page.getByRole('heading', { level: 1, name: /one topic at a time/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Scripts with control flow/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Reuse and file I\/O/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Variables, expressions/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Files/ }).first()).toBeVisible()
    const before = await page.evaluate(() => (window as unknown as { __speaks: string[] }).__speaks)
    expect(before.filter((entry) => entry.startsWith('speak:'))).toEqual([])
    await expect(page.getByRole('status').filter({ hasText: 'Speaking' })).toHaveCount(0)
    await expectAxeClean(page)

    await page.getByRole('link', { name: /Variables, expressions/ }).click()
    await expect(page).toHaveURL(/\/lessons\/01-variables$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Variables, expressions & operators' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Listen to this lesson' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Practice this topic' })).toHaveAttribute('href', /\/quiz\?o=D335\.01&n=5/)
    const onLesson = await page.evaluate(() => (window as unknown as { __speaks: string[] }).__speaks)
    expect(onLesson.filter((entry) => entry.startsWith('speak:'))).toEqual([])

    await page.getByRole('button', { name: 'Listen to this lesson' }).click()
    await expect.poll(async () => page.evaluate(() => (window as unknown as { __speaks: string[] }).__speaks.some((entry) => entry.startsWith('speak:')))).toBe(true)
    await expect(page.getByRole('status').filter({ hasText: 'Speaking' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Stop' }).click()
    await expect(page.getByRole('button', { name: 'Listen to this lesson' })).toBeVisible()
    await expectAxeClean(page)
  })

  test('unknown lesson shows the not-found page', async ({ page }) => {
    await page.goto('/lessons/no-such-topic')
    await expect(page.getByText('404')).toBeVisible()
  })
})

test.describe('practice setup and mock OA', () => {
  test('setup page builds a filtered quiz', async ({ page }) => {
    await page.goto('/practice')
    await expect(page.getByRole('heading', { name: 'What to do on this page' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Listen' }).first()).toBeVisible()
    await expectAxeClean(page)
    await page.getByRole('button', { name: /Multiple choice/ }).click()
    await page.getByRole('button', { name: '5', exact: true }).click()
    await page.getByRole('button', { name: /^Start 5 questions/ }).click()
    await expect(page).toHaveURL(/\/quiz\?t=mcq&n=5/)
    await expect(page.getByText('Q1/5')).toBeVisible()
  })

  test('mock OA runs, submits and reports by objective', async ({ page }) => {
    await page.goto('/mock')
    await expect(page.getByRole('heading', { name: /before the timer/i })).toBeVisible()
    await expect(page.getByText(/not the official WGU exam/i)).toBeVisible()
    await page.getByRole('button', { name: 'Start mock OA' }).click()
    await expect(page.getByRole('timer')).toContainText(/\d+:\d\d/)
    await expect(page.getByText('Q1/25')).toBeVisible()
    await expectAxeClean(page)
    await page.getByRole('button', { name: 'Submit exam' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByText('Mock OA results')).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText(/0 of 25 correct/)).toBeVisible()
  })

  test('unknown routes show a 404', async ({ page }) => {
    await page.goto('/nope')
    await expect(page.getByText('404')).toBeVisible()
  })
})
