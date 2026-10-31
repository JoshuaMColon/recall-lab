import { describe, expect, it } from 'vitest'
import { gradeCode, gradeStatic, normalizeOutput } from './grade'
import { isDue, quality, schedule } from './srs'
import { allMastery, levelFor, readiness, streakDays, weakAreas } from './mastery'
import { apportion, buildMock, buildPractice, MOCK_DEFAULT } from './select'
import { hashText } from './store'
import { BANK, OBJECTIVES } from './bank'
import { blankResponse, isAnswered } from './check'
import type { Attempt, McqQuestion, OutputQuestion } from './types'

const mcq: McqQuestion = { id: 'm', objective: OBJECTIVES[0].id, type: 'mcq', difficulty: 1, prompt: 'p', explanation: 'e', choices: ['a', 'b', 'c', 'd'], answer: 2 }
const out: OutputQuestion = { id: 'o', objective: OBJECTIVES[0].id, type: 'output', difficulty: 1, prompt: 'p', explanation: 'e', code: 'print(1, 2)', answer: '1 2\n3' }

function attempt(objective: string, correct: boolean, daysAgo = 0, i = 0): Attempt {
  const d = new Date(Date.now() - daysAgo * 86_400_000 - i * 1000)
  return { id: `${objective}-${daysAgo}-${i}`, questionId: `q${i}`, objective, qtype: 'mcq', correct, score: correct ? 1 : 0, mode: 'practice', elapsedMs: 5000, createdAt: d.toISOString() }
}

describe('grading', () => {
  it('normalises output whitespace at line ends and trailing blank lines', () => {
    expect(normalizeOutput('a  \r\nb\n\n')).toBe('a\nb')
  })
  it('grades MCQ and output deterministically', () => {
    expect(gradeStatic(mcq, { type: 'mcq', choice: 2 }).correct).toBe(true)
    expect(gradeStatic(mcq, { type: 'mcq', choice: 1 }).correct).toBe(false)
    expect(gradeStatic(out, { type: 'output', text: '1 2\n3\n' }).correct).toBe(true)
    const loose = gradeStatic(out, { type: 'output', text: '1 2 3' })
    expect(loose.correct).toBe(false)
    expect(loose.score).toBe(0.5)
    expect(gradeStatic(out, { type: 'output', text: '12' }).score).toBe(0)
  })
  it('gives partial credit for code tests and reports errors and timeouts', () => {
    const tests = [
      { stdin: '', expected: 'hi', hidden: false },
      { stdin: '', expected: 'yo', hidden: true },
      { stdin: '', expected: 'x', hidden: true },
    ]
    const g = gradeCode(tests, [
      { stdout: 'hi\n', error: null },
      { stdout: '', error: { type: 'NameError', message: "name 'y' is not defined", line: 2 } },
      { stdout: '', error: null, timedOut: true },
    ])
    expect(g.correct).toBe(false)
    expect(g.score).toBeCloseTo(1 / 3)
    expect(g.tests![1].error).toContain('NameError on line 2')
    expect(g.tests![2].error).toContain('Timed out')
  })
  it('knows when a response is still blank', () => {
    expect(isAnswered(blankResponse(mcq))).toBe(false)
    expect(isAnswered(blankResponse(out))).toBe(false)
    expect(isAnswered({ type: 'bug', line: 3 })).toBe(true)
  })
})

describe('spaced repetition (SM-2)', () => {
  const base = { questionId: 'q', objective: 'o' }
  const now = new Date('2026-10-01T12:00:00Z')
  it('maps scores to quality', () => {
    expect(quality(1, 5000)).toBe(5)
    expect(quality(1, 60_000)).toBe(4)
    expect(quality(0.5, 1)).toBe(3)
    expect(quality(0, 1)).toBe(1)
  })
  it('grows intervals 1 → 6 → ×ease on success and resets on a miss', () => {
    const a = schedule(undefined, base, 5, now)
    expect(a.intervalDays).toBe(1)
    const b = schedule(a, base, 5, now)
    expect(b.intervalDays).toBe(6)
    const c = schedule(b, base, 4, now)
    expect(c.intervalDays).toBe(Math.round(6 * b.ease))
    const miss = schedule(c, base, 1, now)
    expect(miss.intervalDays).toBe(0)
    expect(miss.lapses).toBe(1)
    expect(miss.ease).toBeGreaterThanOrEqual(1.3)
    expect(isDue(miss, new Date(now.getTime() + 11 * 60_000))).toBe(true)
    expect(isDue(c, now)).toBe(false)
  })
})

describe('mastery', () => {
  it('needs evidence before calling something mastered', () => {
    expect(levelFor(0, 0)).toBe('new')
    const one = allMastery(OBJECTIVES, [attempt(OBJECTIVES[0].id, true)], BANK, [])
    expect(one[0].level).not.toBe('mastered')
    const many = allMastery(OBJECTIVES, Array.from({ length: 12 }, (_, i) => attempt(OBJECTIVES[0].id, true, 0, i)), BANK, [])
    expect(many[0].level).toBe('mastered')
    expect(readiness(OBJECTIVES, many)).toBeCloseTo(OBJECTIVES[0].weight / 100, 2)
  })
  it('lists weak areas weakest first', () => {
    const a = [...Array.from({ length: 4 }, (_, i) => attempt(OBJECTIVES[1].id, false, 0, i)), ...Array.from({ length: 4 }, (_, i) => attempt(OBJECTIVES[2].id, i < 2, 0, i))]
    const w = weakAreas(allMastery(OBJECTIVES, a, BANK, []))
    expect(w.map((x) => x.objective)).toEqual([OBJECTIVES[1].id, OBJECTIVES[2].id])
  })
  it('counts streaks of consecutive days', () => {
    expect(streakDays([attempt('o', true, 0), attempt('o', true, 1), attempt('o', true, 2), attempt('o', true, 4)])).toBe(3)
    expect(streakDays([])).toBe(0)
  })
})

describe('question selection', () => {
  const mastery = allMastery(OBJECTIVES, [], BANK, [])
  it('respects objective and type filters without duplicates', () => {
    const set = buildPractice(BANK, new Map(), mastery, { objectives: [OBJECTIVES[3].id], types: ['output'], count: 10, seed: 1 })
    expect(set).toHaveLength(10)
    expect(new Set(set.map((q) => q.id)).size).toBe(10)
    expect(set.every((q) => q.objective === OBJECTIVES[3].id && q.type === 'output')).toBe(true)
  })
  it('apportions a mock OA by objective weight', () => {
    const a = apportion(OBJECTIVES, 25)
    expect([...a.values()].reduce((s, n) => s + n, 0)).toBe(25)
    const mock = buildMock(BANK, OBJECTIVES, 7)
    expect(mock).toHaveLength(MOCK_DEFAULT.count)
    expect(mock.filter((q) => q.type === 'code')).toHaveLength(MOCK_DEFAULT.codeSlots)
    expect(new Set(mock.map((q) => q.id)).size).toBe(mock.length)
  })
})

describe('hashText', () => {
  it('is stable and sensitive to changes', () => {
    expect(hashText('abc')).toBe(hashText('abc'))
    expect(hashText('abc')).not.toBe(hashText('abd'))
  })
})
