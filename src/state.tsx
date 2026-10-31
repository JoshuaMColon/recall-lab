import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, CLOUD } from './lib/supabase'
import { CloudStore, empty, LocalStore, type Snapshot, type Store } from './lib/store'
import { BANK, OBJECTIVES } from './lib/bank'
import { allMastery, readiness, streakDays, weakAreas, type ObjectiveMastery } from './lib/mastery'
import { quality, schedule } from './lib/srs'
import type { Attempt, Grade, MockResult, Mode, Question, ReviewState } from './lib/types'

export type Theme = 'light' | 'dark'

interface AppState {
  ready: boolean
  session: Session | null
  isGuest: boolean
  /** Local mode: no backend configured; progress stays in this browser. */
  local: boolean
  signedIn: boolean
  data: Snapshot
  questions: Question[]
  reviews: Map<string, ReviewState>
  mastery: ObjectiveMastery[]
  readiness: number
  weak: ObjectiveMastery[]
  streak: number
  syncError: string | null
  record(q: Question, grade: Grade, mode: Mode, elapsedMs: number, sessionId?: string): Promise<void>
  saveMock(m: MockResult): Promise<void>
  addAiQuestion(q: Question, model: string): Promise<Question>
  store: Store
  resetProgress(): Promise<void>
  signOut(): Promise<void>
  theme: Theme
  setTheme(t: Theme): void
}

const Ctx = createContext<AppState | null>(null)

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside provider')
  return v
}

function initialTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!CLOUD)
  const [data, setData] = useState<Snapshot>(empty)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id ?? null
  const store: Store = useMemo(() => (supabase && userId ? new CloudStore(supabase, userId) : new LocalStore('local')), [userId])

  const storeKey = CLOUD ? userId : 'local'
  useEffect(() => {
    if (!authReady || !storeKey) return
    let live = true
    store
      .load()
      .then((d) => {
        if (live) setData(d)
      })
      .catch((e: Error) => {
        if (live) setSyncError(`Could not load your progress: ${e.message}`)
      })
      .finally(() => {
        if (live) setLoadedKey(storeKey)
      })
    return () => {
      live = false
    }
  }, [store, authReady, storeKey])

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem('recall-lab:theme', t)
    } catch {
      /* private mode */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#070917' : '#f3f1fa')
    setThemeState(t)
  }, [])

  const reviews = useMemo(() => new Map(data.reviews.map((r) => [r.questionId, r])), [data.reviews])
  const questions = useMemo(() => [...BANK, ...data.aiQuestions], [data.aiQuestions])
  const mastery = useMemo(() => allMastery(OBJECTIVES, data.attempts, questions, data.reviews), [data.attempts, data.reviews, questions])

  const persist = useCallback(async (p: Promise<void>) => {
    try {
      await p
      setSyncError(null)
    } catch (e) {
      setSyncError(`Not saved to the cloud: ${(e as Error).message}`)
    }
  }, [])

  const record = useCallback(
    async (q: Question, grade: Grade, mode: Mode, elapsedMs: number, sessionId?: string) => {
      const now = new Date()
      const attempt: Attempt = {
        id: crypto.randomUUID(),
        questionId: q.id,
        objective: q.objective,
        qtype: q.type,
        correct: grade.correct,
        score: grade.score,
        mode,
        sessionId,
        elapsedMs,
        createdAt: now.toISOString(),
      }
      const prev = dataRef.current.reviews.find((r) => r.questionId === q.id)
      const review = schedule(prev, { questionId: q.id, objective: q.objective }, quality(grade.score, elapsedMs), now)
      setData((d) => ({ ...d, attempts: [...d.attempts, attempt], reviews: [...d.reviews.filter((r) => r.questionId !== q.id), review] }))
      await persist(store.addAttempt(attempt).then(() => store.saveReview(review)))
    },
    [store, persist],
  )

  const saveMock = useCallback(
    async (m: MockResult) => {
      setData((d) => ({ ...d, mocks: [...d.mocks, m] }))
      await persist(store.saveMock(m))
    },
    [store, persist],
  )

  const addAiQuestion = useCallback(
    async (q: Question, model: string) => {
      const saved = await store.saveAiQuestion(q, model)
      setData((d) => ({ ...d, aiQuestions: [...d.aiQuestions, saved] }))
      return saved
    },
    [store],
  )

  const resetProgress = useCallback(async () => {
    await store.reset()
    setData(empty())
  }, [store])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
    setData(empty())
  }, [])

  const value: AppState = {
    ready: authReady && (!storeKey || loadedKey === storeKey),
    session,
    isGuest: !!session?.user.is_anonymous,
    local: !CLOUD,
    signedIn: !CLOUD || !!session,
    data,
    questions,
    reviews,
    mastery,
    readiness: readiness(OBJECTIVES, mastery),
    weak: weakAreas(mastery),
    streak: streakDays(data.attempts),
    syncError,
    record,
    saveMock,
    addAiQuestion,
    store,
    resetProgress,
    signOut,
    theme,
    setTheme,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
