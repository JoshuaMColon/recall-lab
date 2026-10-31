import type { SupabaseClient } from '@supabase/supabase-js'
import type { Attempt, MockResult, Question, ReviewState } from './types'

export interface Snapshot {
  attempts: Attempt[]
  reviews: ReviewState[]
  mocks: MockResult[]
  aiQuestions: Question[]
}

export type NoteKind = 'explain' | 'hint'

export interface Store {
  kind: 'local' | 'cloud'
  load(): Promise<Snapshot>
  addAttempt(a: Attempt): Promise<void>
  saveReview(r: ReviewState): Promise<void>
  saveMock(m: MockResult): Promise<void>
  saveAiQuestion(q: Question, model: string): Promise<Question>
  getNote(questionId: string, kind: NoteKind, answerHash: string): Promise<string | null>
  saveNote(questionId: string, kind: NoteKind, answerHash: string, content: string): Promise<void>
  reset(): Promise<void>
}

export const empty = (): Snapshot => ({ attempts: [], reviews: [], mocks: [], aiQuestions: [] })

/* ---------- local (this browser only) ---------- */

interface LocalFile extends Snapshot {
  version: 1
  notes: Record<string, string>
}

export class LocalStore implements Store {
  kind = 'local' as const
  private key: string
  constructor(scope = 'local') {
    this.key = `recall-lab:v1:${scope}`
  }
  private read(): LocalFile {
    try {
      const raw = localStorage.getItem(this.key)
      if (raw) {
        const f = JSON.parse(raw) as LocalFile
        if (f.version === 1) return { ...empty(), ...f, notes: f.notes ?? {} }
      }
    } catch {
      /* corrupt file: start fresh */
    }
    return { version: 1, ...empty(), notes: {} }
  }
  private write(f: LocalFile) {
    // Keep the file bounded: the newest 3000 attempts are plenty for mastery.
    if (f.attempts.length > 3000) f.attempts = f.attempts.slice(-3000)
    localStorage.setItem(this.key, JSON.stringify(f))
  }
  private edit(fn: (f: LocalFile) => void) {
    const f = this.read()
    fn(f)
    this.write(f)
  }
  async load(): Promise<Snapshot> {
    const { attempts, reviews, mocks, aiQuestions } = this.read()
    return { attempts, reviews, mocks, aiQuestions }
  }
  async addAttempt(a: Attempt) {
    this.edit((f) => f.attempts.push(a))
  }
  async saveReview(r: ReviewState) {
    this.edit((f) => {
      f.reviews = f.reviews.filter((x) => x.questionId !== r.questionId)
      f.reviews.push(r)
    })
  }
  async saveMock(m: MockResult) {
    this.edit((f) => f.mocks.push(m))
  }
  async saveAiQuestion(q: Question) {
    const saved = { ...q, id: `ai-${crypto.randomUUID()}`, source: 'ai' as const }
    this.edit((f) => f.aiQuestions.push(saved))
    return saved
  }
  async getNote(id: string, kind: NoteKind, hash: string) {
    return this.read().notes[`${id}|${kind}|${hash}`] ?? null
  }
  async saveNote(id: string, kind: NoteKind, hash: string, content: string) {
    this.edit((f) => (f.notes[`${id}|${kind}|${hash}`] = content))
  }
  async reset() {
    localStorage.removeItem(this.key)
  }
}

/* ---------- cloud (Supabase, owner-only RLS through public.study_* views) ---------- */

interface AttemptRow {
  id: string
  objective_id: string
  question_id: string
  qtype: Attempt['qtype']
  correct: boolean
  score: number
  mode: Attempt['mode']
  session_id: string | null
  elapsed_ms: number
  created_at: string
}
interface ReviewRow {
  question_id: string
  objective_id: string
  ease: number
  interval_days: number
  reps: number
  lapses: number
  due: string
  last_correct: boolean
  updated_at: string
}
interface MockRow {
  id: string
  started_at: string
  finished_at: string
  time_limit_min: number
  total: number
  correct: number
  by_objective: MockResult['byObjective']
}
interface AiRow {
  id: string
  payload: Question
}

function check<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

export class CloudStore implements Store {
  kind = 'cloud' as const
  constructor(
    private db: SupabaseClient,
    private userId: string,
  ) {}

  async load(): Promise<Snapshot> {
    const [a, r, m, q] = await Promise.all([
      this.db.from('study_attempts').select('*').order('created_at', { ascending: false }).limit(3000),
      this.db.from('study_review_state').select('*').limit(5000),
      this.db.from('study_mock_sessions').select('*').order('finished_at', { ascending: true }).limit(200),
      this.db.from('study_ai_questions').select('id,payload').order('created_at', { ascending: true }).limit(500),
    ])
    const attempts = check<AttemptRow[]>(a)
      .map(
        (x): Attempt => ({
          id: x.id,
          questionId: x.question_id,
          objective: x.objective_id,
          qtype: x.qtype,
          correct: x.correct,
          score: x.score,
          mode: x.mode,
          sessionId: x.session_id ?? undefined,
          elapsedMs: x.elapsed_ms,
          createdAt: x.created_at,
        }),
      )
      .reverse()
    const reviews = check<ReviewRow[]>(r).map(
      (x): ReviewState => ({
        questionId: x.question_id,
        objective: x.objective_id,
        ease: x.ease,
        intervalDays: x.interval_days,
        reps: x.reps,
        lapses: x.lapses,
        due: x.due,
        lastCorrect: x.last_correct,
        updatedAt: x.updated_at,
      }),
    )
    const mocks = check<MockRow[]>(m).map(
      (x): MockResult => ({
        id: x.id,
        startedAt: x.started_at,
        finishedAt: x.finished_at,
        timeLimitMin: x.time_limit_min,
        total: x.total,
        correct: x.correct,
        byObjective: x.by_objective,
      }),
    )
    const aiQuestions = check<AiRow[]>(q).map((x) => ({ ...x.payload, id: `ai-${x.id}`, source: 'ai' as const }))
    return { attempts, reviews, mocks, aiQuestions }
  }

  async addAttempt(a: Attempt) {
    check(
      await this.db.from('study_attempts').insert({
        id: a.id,
        user_id: this.userId,
        objective_id: a.objective,
        question_id: a.questionId,
        qtype: a.qtype,
        correct: a.correct,
        score: a.score,
        mode: a.mode,
        session_id: a.sessionId ?? null,
        elapsed_ms: Math.min(86_400_000, Math.max(0, Math.round(a.elapsedMs))),
        created_at: a.createdAt,
      }),
    )
  }
  async saveReview(r: ReviewState) {
    check(
      await this.db.from('study_review_state').upsert(
        {
          user_id: this.userId,
          question_id: r.questionId,
          objective_id: r.objective,
          ease: r.ease,
          interval_days: r.intervalDays,
          reps: r.reps,
          lapses: r.lapses,
          due: r.due,
          last_correct: r.lastCorrect,
          updated_at: r.updatedAt,
        },
        { onConflict: 'user_id,question_id' },
      ),
    )
  }
  async saveMock(m: MockResult) {
    check(
      await this.db.from('study_mock_sessions').insert({
        id: m.id,
        user_id: this.userId,
        started_at: m.startedAt,
        finished_at: m.finishedAt,
        time_limit_min: m.timeLimitMin,
        total: m.total,
        correct: m.correct,
        by_objective: m.byObjective,
      }),
    )
  }
  async saveAiQuestion(q: Question, model: string) {
    const id = crypto.randomUUID()
    const payload = { ...q, id: `ai-${id}`, source: 'ai' as const }
    check(await this.db.from('study_ai_questions').insert({ id, user_id: this.userId, objective_id: q.objective, qtype: q.type, payload, model }))
    return payload
  }
  async getNote(id: string, kind: NoteKind, hash: string) {
    const rows = check<{ content: string }[]>(
      await this.db.from('study_ai_notes').select('content').eq('question_id', id).eq('kind', kind).eq('answer_hash', hash).limit(1),
    )
    return rows[0]?.content ?? null
  }
  async saveNote(id: string, kind: NoteKind, hash: string, content: string) {
    check(
      await this.db
        .from('study_ai_notes')
        .upsert({ user_id: this.userId, question_id: id, kind, answer_hash: hash, content: content.slice(0, 6000) }, { onConflict: 'user_id,question_id,kind,answer_hash' }),
    )
  }
  async reset() {
    for (const t of ['study_attempts', 'study_review_state', 'study_mock_sessions', 'study_ai_questions', 'study_ai_notes']) {
      check(await this.db.from(t).delete().eq('user_id', this.userId))
    }
  }
}

/** Short stable hash for cache keys (FNV-1a, hex). */
export function hashText(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
