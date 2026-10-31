import type { ReviewState } from './types'

const DAY = 86_400_000

/** Map a graded attempt to an SM-2 quality score (0-5). */
export function quality(score: number, elapsedMs: number): number {
  if (score >= 1) return elapsedMs > 0 && elapsedMs < 20_000 ? 5 : 4
  if (score >= 0.5) return 3
  if (score > 0) return 2
  return 1
}

/**
 * SM-2 spaced repetition (the SuperMemo-2 algorithm): a correct answer pushes the next
 * review further out (1 day, 6 days, then interval x ease), a miss resets it to today.
 */
export function schedule(prev: ReviewState | undefined, base: { questionId: string; objective: string }, q: number, now = new Date()): ReviewState {
  let ease = prev?.ease ?? 2.5
  let reps = prev?.reps ?? 0
  let interval = prev?.intervalDays ?? 0
  let lapses = prev?.lapses ?? 0
  if (q < 3) {
    reps = 0
    interval = 0 // due again right away (in a later session)
    lapses += 1
  } else {
    reps += 1
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * ease)
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  const due = new Date(now.getTime() + (interval === 0 ? 10 * 60_000 : interval * DAY))
  return {
    questionId: base.questionId,
    objective: base.objective,
    ease: Math.round(ease * 100) / 100,
    intervalDays: interval,
    reps,
    lapses,
    due: due.toISOString(),
    lastCorrect: q >= 3,
    updatedAt: now.toISOString(),
  }
}

export function isDue(r: ReviewState, now = new Date()): boolean {
  return new Date(r.due).getTime() <= now.getTime()
}
