import type { Objective, QType, Question, ReviewState } from './types'
import type { ObjectiveMastery } from './mastery'

/** Seeded so a test can rebuild the same set. Date.now() is the seed in the app. */
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
 * Practice order is three bands: due cards, never seen, then the rest.
 * A due miss sorts ahead of a due correct. Seen cards add ease, so a
 * low-ease card comes first. I subtract a small random term so the order
 * is not frozen; in a mixed set that term is larger for a weak objective,
 * which is how those objectives pick up extra slots.
 */
export function buildPractice(pool: Question[], reviews: Map<string, ReviewState>, mastery: ObjectiveMastery[], opts: PracticeOptions): Question[] {
  const rand = rng(opts.seed ?? Date.now())
  const now = opts.now ?? new Date()
  const inScope = pool.filter((q) => (opts.objectives.length === 0 || opts.objectives.includes(q.objective)) && (opts.types.length === 0 || opts.types.includes(q.type)))
  // Lower is earlier. Due miss 0, due correct 0.5, unseen 1, seen 2 plus ease.
  const priority = (q: Question) => {
    const r = reviews.get(q.id)
    if (r && new Date(r.due) <= now) return 0 + (r.lastCorrect ? 0.5 : 0)
    if (!r) return 1
    return 2 + Math.min(1, (r.ease - 1.3) / 2)
  }
  // A single objective is already the whole set, so the weight stays flat.
  // Mixed practice gives a weak objective a larger downward nudge.
  const weight = (q: Question) => {
    if (opts.objectives.length === 1) return 1
    const m = mastery.find((x) => x.objective === q.objective)
    return 1.5 - (m?.mastery ?? 0)
  }
  const scored = shuffle(inScope, rand).map((q) => ({ q, key: priority(q) - rand() * 0.6 * weight(q) }))
  scored.sort((a, b) => a.key - b.key)
  // About a third of a mixed set from one objective. A focused set has no cap.
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
  // The cap can leave the set short. This pass fills from what it skipped.
  if (out.length < opts.count) for (const { q } of scored) if (out.length < opts.count && !out.includes(q)) out.push(q)
  return out
}

/**
 * Split n slots by weight. Floors first, then each leftover slot goes to
 * the biggest fractional part, so the counts still add up to n.
 */
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

/**
 * Timed set. Slots follow objective weight. I keep one code question for
 * each of the heaviest objectives that have one, then park every code
 * task at the end so the short questions come first.
 */
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
  return [...shuffle(picked.filter((q) => q.type !== 'code'), rand), ...picked.filter((q) => q.type === 'code')]
}
