import type { Attempt, Objective, Question, ReviewState } from './types'

export type Level = 'new' | 'learning' | 'developing' | 'proficient' | 'mastered'

export interface ObjectiveMastery {
  objective: string
  attempts: number
  correct: number
  /** 0..1 recency-weighted accuracy, shrunk toward 0 until there is enough evidence. */
  mastery: number
  level: Level
  seen: number // distinct questions answered
  total: number // questions available
  due: number
}

export const LEVEL_LABEL: Record<Level, string> = {
  new: 'Not started',
  learning: 'Learning',
  developing: 'Developing',
  proficient: 'Proficient',
  mastered: 'Mastered',
}

/** Full confidence. Fewer attempts pull the score down so a short streak cannot read as mastered. */
const CONFIDENCE_AT = 6
/** Recent attempts that count toward accuracy. Older than this fade out of the window. */
const WINDOW = 12

export function levelFor(m: number, attempts: number): Level {
  if (attempts === 0) return 'new'
  if (m >= 0.85) return 'mastered'
  if (m >= 0.7) return 'proficient'
  if (m >= 0.45) return 'developing'
  return 'learning'
}

/**
 * Recent accuracy times confidence. I score the last 12 attempts, each
 * weighted 0.85 of the newer one, so a bad week fades. Confidence uses
 * the full count and reaches 1 at six attempts.
 */
export function objectiveMastery(objective: string, attempts: Attempt[], questions: Question[], reviews: ReviewState[], now = new Date()): ObjectiveMastery {
  const mine = attempts.filter((a) => a.objective === objective).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const recent = mine.slice(0, WINDOW)
  let wsum = 0
  let acc = 0
  recent.forEach((a, i) => {
    const w = Math.pow(0.85, i)
    wsum += w
    acc += w * a.score
  })
  const accuracy = wsum ? acc / wsum : 0
  const confidence = Math.min(1, mine.length / CONFIDENCE_AT)
  const mastery = accuracy * confidence
  return {
    objective,
    attempts: mine.length,
    correct: mine.filter((a) => a.correct).length,
    mastery,
    level: levelFor(mastery, mine.length),
    seen: new Set(mine.map((a) => a.questionId)).size,
    total: questions.filter((q) => q.objective === objective).length,
    due: reviews.filter((r) => r.objective === objective && new Date(r.due) <= now).length,
  }
}

export function allMastery(objectives: Objective[], attempts: Attempt[], questions: Question[], reviews: ReviewState[], now = new Date()) {
  return objectives.map((o) => objectiveMastery(o.id, attempts, questions, reviews, now))
}

/** 0..1, weighted by the same objective weights the timed set uses to split slots. */
export function readiness(objectives: Objective[], m: ObjectiveMastery[]): number {
  const total = objectives.reduce((s, o) => s + o.weight, 0)
  return objectives.reduce((s, o) => s + o.weight * (m.find((x) => x.objective === o.id)?.mastery ?? 0), 0) / total
}

/** Weakest first, and only after three attempts. One miss on a new objective is not a weak area. */
export function weakAreas(m: ObjectiveMastery[], limit = 3): ObjectiveMastery[] {
  return m
    .filter((x) => x.attempts >= 3 && x.mastery < 0.7)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, limit)
}

/** Consecutive days (ending today or yesterday) with at least one attempt, in the browser's time zone. */
export function streakDays(attempts: Attempt[], now = new Date()): number {
  const days = new Set(attempts.map((a) => new Date(a.createdAt).toLocaleDateString('en-CA')))
  let streak = 0
  const d = new Date(now)
  if (!days.has(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate() - 1)
  while (days.has(d.toLocaleDateString('en-CA'))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
