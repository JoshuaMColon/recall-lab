import { describe, expect, it } from 'vitest'
import { GUIDE_SECTIONS, guidePlainText } from './guide'

describe('beginner guide', () => {
  it('explains the app in plain language for a first visit', () => {
    const text = guidePlainText()
    for (const phrase of [
      'Guest demo',
      'Free account',
      'Dashboard',
      'Practice',
      'Review',
      'Mock OA',
      'Multiple choice',
      'Predict the output',
      'Find the bug',
      'Write the code',
      'Spaced repetition',
      'does not mean you failed',
      'never have to use AI',
      'never starts by itself',
    ]) {
      expect(text, phrase).toContain(phrase)
    }
    expect(GUIDE_SECTIONS.length).toBeGreaterThanOrEqual(8)
    for (const section of GUIDE_SECTIONS) {
      expect(section.body.length).toBeGreaterThan(80)
    }
  })
})
