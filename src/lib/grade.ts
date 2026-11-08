import type { Grade, Question, Response, TestResult } from './types'

/** Compare output, not keystrokes. CRLF becomes LF, trailing spaces go, and blank lines at the ends do not count. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}

/**
 * Every type except code, which has to be run. Output is exact after
 * normalizeOutput. A gap that is only spacing or line breaks scores half
 * and I say so: the values were right, and the format was not. I do not
 * call that correct.
 */
export function gradeStatic(q: Question, r: Response): Grade {
  switch (q.type) {
    case 'mcq': {
      const ok = r.type === 'mcq' && r.choice === q.answer
      return { correct: ok, score: ok ? 1 : 0 }
    }
    case 'output': {
      if (r.type !== 'output') return { correct: false, score: 0 }
      const got = normalizeOutput(r.text)
      const want = normalizeOutput(q.answer)
      if (got === want) return { correct: true, score: 1 }
      // Collapse runs of whitespace. That is the only slip I score as half.
      const loose = (s: string) => s.replace(/\s+/g, ' ').trim()
      if (loose(got) === loose(want))
        return { correct: false, score: 0.5, note: 'Right values, but the spacing or line breaks differ. Exact output matters on the OA.' }
      return { correct: false, score: 0 }
    }
    case 'bug': {
      const ok = r.type === 'bug' && r.line === q.answer
      return { correct: ok, score: ok ? 1 : 0 }
    }
    case 'code':
      throw new Error('code questions are graded with gradeCode')
  }
}

export interface RunOutcome {
  stdout: string
  error: { type: string; message: string; line: number | null } | null
  timedOut?: boolean
}

export function gradeCode(tests: { stdin: string; expected: string; hidden: boolean }[], runs: RunOutcome[]): Grade {
  const results: TestResult[] = tests.map((t, i) => {
    const run = runs[i]
    const got = run ? normalizeOutput(run.stdout) : ''
    const error = !run
      ? 'not run'
      : run.timedOut
        ? 'Timed out: check for an infinite loop or a missing input().'
        : run.error
          ? `${run.error.type}${run.error.line ? ` on line ${run.error.line}` : ''}: ${run.error.message}`
          : undefined
    return { stdin: t.stdin, expected: normalizeOutput(t.expected), got, passed: !error && got === normalizeOutput(t.expected), hidden: t.hidden, error }
  })
  // Each test is pass or fail. The score is the fraction that passed.
  // A timeout or an exception fails that test even if some stdout came out first.
  const passed = results.filter((r) => r.passed).length
  return { correct: passed === results.length && results.length > 0, score: results.length ? passed / results.length : 0, tests: results }
}
