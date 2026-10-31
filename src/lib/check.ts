import { gradeCode, gradeStatic } from './grade'
import { python } from './python'
import type { Grade, Question, Response } from './types'

/** Grade any response. Code is run in the in-browser Python against every test (hidden ones too). */
export async function check(q: Question, r: Response): Promise<Grade> {
  if (q.type !== 'code') return gradeStatic(q, r)
  if (r.type !== 'code' || !r.source.trim()) return { correct: false, score: 0, note: 'No code submitted.' }
  const runs = await python.run(r.source, q.tests.map((t) => ({ stdin: t.stdin })), q.files)
  return gradeCode(q.tests, runs)
}

export function blankResponse(q: Question): Response {
  switch (q.type) {
    case 'mcq':
      return { type: 'mcq', choice: -1 }
    case 'output':
      return { type: 'output', text: '' }
    case 'bug':
      return { type: 'bug', line: 0 }
    case 'code':
      return { type: 'code', source: q.starter }
  }
}

export function isAnswered(r: Response): boolean {
  if (r.type === 'mcq') return r.choice >= 0
  if (r.type === 'output') return r.text.trim().length > 0
  if (r.type === 'bug') return r.line > 0
  return r.source.trim().length > 0
}

/** Human-readable correct answer, for feedback and AI explanations. */
export function correctAnswer(q: Question): string {
  switch (q.type) {
    case 'mcq':
      return q.choices[q.answer]
    case 'output':
      return q.answer
    case 'bug':
      return `Line ${q.answer} → ${q.fix.trim()}`
    case 'code':
      return q.solution
  }
}

export function describeResponse(q: Question, r: Response): string {
  if (r.type === 'mcq') return q.type === 'mcq' ? (q.choices[r.choice] ?? '(no answer)') : ''
  if (r.type === 'output') return r.text
  if (r.type === 'bug') return `Line ${r.line}`
  return r.source
}
