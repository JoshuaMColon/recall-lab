import d335 from '../data/d335.json'
import type { CourseBank, Objective, Question } from './types'

const bank = d335 as unknown as CourseBank

/** Courses available in this build. New courses add another JSON bank here. */
export const COURSES: CourseBank[] = [bank]
export const COURSE = bank.course
export const OBJECTIVES: Objective[] = bank.objectives
export const BANK: Question[] = bank.questions.map((q) => ({ ...q, source: 'bank' as const }))

const byId = new Map(BANK.map((q) => [q.id, q]))
export const objectiveById = new Map(OBJECTIVES.map((o) => [o.id, o]))

export function findQuestion(id: string, extra: Question[] = []): Question | undefined {
  return byId.get(id) ?? extra.find((q) => q.id === id)
}

export function objectiveLabel(id: string): string {
  const o = objectiveById.get(id)
  return o ? `${o.code} · ${o.title}` : id
}

export const TYPE_LABEL: Record<Question['type'], string> = {
  mcq: 'Multiple choice',
  output: 'Predict the output',
  bug: 'Find the bug',
  code: 'Write the code',
}
