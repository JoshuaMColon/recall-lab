// Re-verifies the whole committed question bank under Pyodide, the same Python the browser
// uses for grading: every output answer, every bug fix and every reference solution.
import { beforeAll, describe, expect, it } from 'vitest'
import { loadPyodide } from 'pyodide'
import { BANK, OBJECTIVES } from './bank'
import { HARNESS } from './pyharness'
import { gradeCode, normalizeOutput, type RunOutcome } from './grade'

let run: (code: string, stdin?: string, files?: Record<string, string>) => RunOutcome

beforeAll(async () => {
  const py = await loadPyodide()
  py.runPython(HARNESS)
  const fn = py.globals.get('__rl_run')
  run = (code, stdin = '', files = {}) => JSON.parse(fn(code, stdin, JSON.stringify(files)))
}, 120_000)

describe('question bank', () => {
  it('has hundreds of questions covering every objective and type', () => {
    expect(BANK.length).toBeGreaterThanOrEqual(300)
    for (const o of OBJECTIVES) {
      for (const t of ['mcq', 'output', 'bug', 'code'] as const) {
        expect(BANK.filter((q) => q.objective === o.id && q.type === t).length, `${o.id} ${t}`).toBeGreaterThan(0)
      }
    }
    expect(new Set(BANK.map((q) => q.id)).size).toBe(BANK.length)
    expect(OBJECTIVES.reduce((s, o) => s + o.weight, 0)).toBe(100)
  })

  it('multiple-choice questions are well formed', () => {
    for (const q of BANK) {
      if (q.type !== 'mcq') continue
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(3)
      expect(new Set(q.choices).size, q.id).toBe(q.choices.length)
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0)
      expect(q.answer, q.id).toBeLessThan(q.choices.length)
      expect(q.explanation.length, q.id).toBeGreaterThan(20)
    }
  })

  it('every predict-the-output answer is what Python really prints', () => {
    for (const q of BANK) {
      if (q.type !== 'output') continue
      const r = run(q.code, q.stdin ?? '', q.files)
      expect(r.error, q.id).toBeNull()
      expect(normalizeOutput(r.stdout), q.id).toBe(q.answer)
    }
  })

  it('every find-the-bug fix changes the behaviour and produces the expected output', () => {
    for (const q of BANK) {
      if (q.type !== 'bug') continue
      const lines = q.code.split('\n')
      lines[q.answer - 1] = q.fix
      const fixed = run(lines.join('\n'), q.stdin ?? '', q.files)
      const buggy = run(q.code, q.stdin ?? '', q.files)
      expect(fixed.error, q.id).toBeNull()
      expect(normalizeOutput(fixed.stdout), q.id).toBe(q.expected)
      expect(buggy.error !== null || normalizeOutput(buggy.stdout) !== q.expected, q.id).toBe(true)
    }
  })

  it('every reference solution passes its own hidden tests, and the starter does not', () => {
    for (const q of BANK) {
      if (q.type !== 'code') continue
      const sol = gradeCode(q.tests, q.tests.map((t) => run(q.solution, t.stdin, q.files)))
      expect(sol.correct, q.id).toBe(true)
      const starter = gradeCode(q.tests, q.tests.map((t) => run(q.starter, t.stdin, q.files)))
      expect(starter.correct, q.id).toBe(false)
    }
  })
})
