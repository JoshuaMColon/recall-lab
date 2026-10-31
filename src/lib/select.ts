import type { Objective, QType, Question, ReviewState } from './types'
import type { ObjectiveMastery } from './mastery'

/** Small seeded PRNG so quiz building is testable. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface PracticeOptions {
  objectives: string[] // empty = all (mixed)
  types: QType[] // empty = all
  count: number
  seed?: number
  now?: Date
}

/**
 * Build a practice set: questions due for spaced review come first, then ones never seen,
 * then the rest (missed and low-ease questions ahead of easy ones). In mixed mode the
 * objectives you are weakest in get more of the slots.
 */
export function buildPractice(pool: Question[], reviews: Map<string, ReviewState>, mastery: ObjectiveMastery[], opts: PracticeOptions): Question[] {
  const rand = rng(opts.seed ?? Date.now())
  const now = opts.now ?? new Date()
  const inScope = pool.filter((q) => (opts.objectives.length === 0 || opts.objectives.includes(q.objective)) && (opts.types.length === 0 || opts.types.includes(q.type)))
  const priority = (q: Question) => {
    const r = reviews.get(q.id)
    if (r && new Date(r.due) <= now) return 0 + (r.lastCorrect ? 0.5 : 0) // due: misses first
    if (!r) return 1
    return 2 + Math.min(1, (r.ease - 1.3) / 2) // seen: harder (low ease) first
  }
  const weight = (q: Question) => {
    if (opts.objectives.length === 1) return 1
    const m = mastery.find((x) => x.objective === q.objective)
    return 1.5 - (m?.mastery ?? 0) // weaker objectives favoured, 0.5..1.5
  }
  const scored = shuffle(inScope, rand).map((q) => ({ q, key: priority(q) - rand() * 0.6 * weight(q) }))
  scored.sort((a, b) => a.key - b.key)
  // Keep the set varied: at most ceil(count / 3) + 1 questions from one objective in mixed mode.
  const cap = opts.objectives.length === 1 ? Infinity : Math.ceil(opts.count / 3) + 1
  const per = new Map<string, number>()
  const out: Question[] = []
  for (const { q } of scored) {
    if (out.length >= opts.count) break
    const n = per.get(q.objective) ?? 0
    if (n >= cap) continue
    per.set(q.objective, n + 1)
    out.push(q)
  }
  if (out.length < opts.count) for (const { q } of scored) if (out.length < opts.count && !out.includes(q)) out.push(q)
  return out
}

/** Largest-remainder split of n slots across objectives by OA weight. */
export function apportion(objectives: Objective[], n: number): Map<string, number> {
  const total = objectives.reduce((s, o) => s + o.weight, 0)
  const raw = objectives.map((o) => ({ id: o.id, exact: (o.weight / total) * n }))
  const res = new Map(raw.map((r) => [r.id, Math.floor(r.exact)]))
  let left = n - [...res.values()].reduce((a, b) => a + b, 0)
  for (const r of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left <= 0) break
    res.set(r.id, (res.get(r.id) ?? 0) + 1)
    left--
  }
  return res
}

export const MOCK_DEFAULT = { count: 25, minutes: 60, codeSlots: 4, passTarget: 0.7 }

/** A timed mock: questions spread across objectives by weight, a few code-writing tasks included. */
export function buildMock(pool: Question[], objectives: Objective[], seed = Date.now(), count = MOCK_DEFAULT.count, codeSlots = MOCK_DEFAULT.codeSlots): Question[] {
  const rand = rng(seed)
  const slots = apportion(objectives, count)
  const picked: Question[] = []
  const codeObjectives = shuffle(objectives.filter((o) => pool.some((q) => q.objective === o.id && q.type === 'code')), rand)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, codeSlots)
    .map((o) => o.id)
  for (const o of objectives) {
    const n = slots.get(o.id) ?? 0
    const mine = shuffle(pool.filter((q) => q.objective === o.id), rand)
    const wantCode = codeObjectives.includes(o.id) ? 1 : 0
    const code = mine.filter((q) => q.type === 'code').slice(0, Math.min(wantCode, n))
    const rest = mine.filter((q) => q.type !== 'code').slice(0, n - code.length)
    picked.push(...rest, ...code)
  }
  // Short questions first, code tasks at the end, like working through an exam.
  return [...shuffle(picked.filter((q) => q.type !== 'code'), rand), ...picked.filter((q) => q.type === 'code')]
}
