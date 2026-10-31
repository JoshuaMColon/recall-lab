import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCheck, Loader2, Sparkles } from 'lucide-react'
import { buildPractice } from '../lib/select'
import { isDue } from '../lib/srs'
import { blankResponse, check, isAnswered } from '../lib/check'
import { AI_ENABLED, AiError, generateQuestion } from '../lib/ai'
import { objectiveById, objectiveLabel } from '../lib/bank'
import type { Grade, Mode, QType, Question, Response } from '../lib/types'
import { useLocation } from '../router'
import { useApp } from '../state'
import { Bar, Btn, Card, LinkBtn } from '../components/ui'
import { QuestionHeader, QuestionView } from '../components/QuestionView'
import { Feedback, HintButton } from '../components/Feedback'

interface Done {
  q: Question
  grade: Grade
}

export function Quiz() {
  const { search, path } = useLocation()
  const app = useApp()
  const mode: Mode = path === '/review' ? 'review' : 'practice'

  const [set, setSet] = useState<Question[]>(() => {
    const p = new URLSearchParams(search)
    const objectives = (p.get('o') ?? '').split(',').filter((o) => objectiveById.has(o))
    const types = (p.get('t') ?? '').split(',').filter((t): t is QType => ['mcq', 'output', 'bug', 'code'].includes(t))
    const count = Math.min(30, Math.max(1, Number(p.get('n')) || 10))
    if (mode === 'review') {
      const due = app.data.reviews.filter((r) => isDue(r)).sort((a, b) => Number(a.lastCorrect) - Number(b.lastCorrect) || a.due.localeCompare(b.due))
      return due.map((r) => app.questions.find((q) => q.id === r.questionId)).filter((q): q is Question => !!q).slice(0, 20)
    }
    return buildPractice(app.questions, app.reviews, app.mastery, { objectives, types, count })
  })
  const sessionId = useMemo(() => crypto.randomUUID(), [])
  const [i, setI] = useState(0)
  const q = set[i]
  const [response, setResponse] = useState<Response | null>(() => (q ? blankResponse(q) : null))
  const [grade, setGrade] = useState<Grade | null>(null)
  const [checking, setChecking] = useState(false)
  const [done, setDone] = useState<Done[]>([])
  const [aiBusy, setAiBusy] = useState(false)
  const [aiMsg, setAiMsg] = useState<string | null>(null)
  const started = useRef(0)
  const heading = useRef<HTMLDivElement>(null)

  useEffect(() => {
    started.current = performance.now()
    heading.current?.focus()
  }, [i])

  const submit = useCallback(async () => {
    if (!q || !response || !isAnswered(response)) return
    setChecking(true)
    try {
      const g = await check(q, response)
      setGrade(g)
      setDone((d) => [...d, { q, grade: g }])
      void app.record(q, g, mode, performance.now() - started.current, sessionId)
    } catch (e) {
      setGrade({ correct: false, score: 0, note: (e as Error).message })
    } finally {
      setChecking(false)
    }
  }, [q, response, app, mode, sessionId])

  function next() {
    const n = i + 1
    setI(n)
    setGrade(null)
    setAiMsg(null)
    setResponse(set[n] ? blankResponse(set[n]) : null)
  }

  async function aiQuestion() {
    if (!q) return
    setAiBusy(true)
    setAiMsg(null)
    try {
      // Cache first: reuse a saved AI question on this objective you have not answered yet.
      const answered = new Set(app.data.attempts.map((a) => a.questionId))
      const cached = app.data.aiQuestions.find((x) => x.objective === q.objective && x.type === q.type && !answered.has(x.id) && !set.includes(x))
      let fresh = cached
      if (!fresh) {
        const avoid = app.questions.filter((x) => x.objective === q.objective && x.type === q.type).map((x) => x.prompt).slice(-8)
        const { question, model } = await generateQuestion(q.objective, q.type, avoid)
        fresh = await app.addAiQuestion(question, model)
      }
      setSet((s) => [...s.slice(0, i + 1), fresh, ...s.slice(i + 1)])
      setAiMsg(cached ? 'Added a saved AI question you have not tried yet (no AI request used). It is next.' : 'Added a fresh AI question, checked by running its code. It is next.')
    } catch (e) {
      setAiMsg(e instanceof AiError ? e.message : 'AI is unavailable right now. The question bank still works.')
    } finally {
      setAiBusy(false)
    }
  }

  if (set.length === 0) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl font-bold">{mode === 'review' ? 'Nothing is due' : 'No questions match'}</h1>
        <p className="mt-2 text-muted">{mode === 'review' ? 'Spaced repetition has nothing for you right now. Practise something new instead.' : 'Try a different combination of objectives and types.'}</p>
        <div className="mt-4"><LinkBtn to="/practice" tip="Choose objectives and types" variant="hl">Set up practice</LinkBtn></div>
      </Card>
    )
  }

  if (!q) {
    const score = done.reduce((s, d) => s + d.grade.score, 0)
    const byObj = new Map<string, { n: number; s: number }>()
    for (const d of done) {
      const e = byObj.get(d.q.objective) ?? { n: 0, s: 0 }
      e.n++
      e.s += d.grade.score
      byObj.set(d.q.objective, e)
    }
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-teal">{mode === 'review' ? 'Review' : 'Practice'} complete</p>
          <h1 className="font-display text-4xl font-bold">
            {Math.round(score * 10) / 10} / {done.length}
          </h1>
          <p className="text-muted">Missed questions are scheduled to come back soon; correct ones are pushed further out.</p>
          <ul className="mt-4 space-y-3">
            {[...byObj].map(([o, e]) => (
              <li key={o}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{objectiveLabel(o)}</span><span className="font-mono">{Math.round((e.s / e.n) * 100)}%</span></div>
                <Bar value={e.s / e.n} label={`${objectiveLabel(o)} score`} />
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <LinkBtn to="/dashboard" tip="See your updated mastery map" variant="hl">Dashboard</LinkBtn>
            <LinkBtn to="/practice" tip="Start another practice run">Practise again</LinkBtn>
          </div>
        </Card>
      </div>
    )
  }

  const answered = response ? isAnswered(response) : false
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1"><Bar value={i / set.length} label="Progress through this set" tone="hl" /></div>
        <span className="font-mono text-sm">{done.filter((d) => d.grade.correct).length} ✓</span>
      </div>
      <Card as="article">
        <div ref={heading} tabIndex={-1} className="outline-none">
          <QuestionHeader q={q} index={i} total={set.length} />
        </div>
        {response && <QuestionView key={q.id} q={q} response={response} onChange={setResponse} locked={!!grade} grade={grade} />}

        {!grade && (
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
            <HintButton key={q.id} q={q} />
            <Btn tip={answered ? (q.type === 'code' ? 'Run every test, including hidden ones, and grade it' : 'Grade my answer') : 'Answer the question first'} variant="primary" disabled={!answered || checking} onClick={() => void submit()}>
              {checking ? <Loader2 aria-hidden="true" size={18} className="animate-spin" /> : <CheckCheck aria-hidden="true" size={18} />}
              {checking ? (q.type === 'code' ? 'Running tests…' : 'Checking…') : 'Check answer'}
            </Btn>
          </div>
        )}

        {grade && response && (
          <div className="mt-5 space-y-4">
            <Feedback q={q} grade={grade} response={response} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {AI_ENABLED ? (
                <Btn tip={`Add one more ${q.type === 'mcq' ? 'multiple-choice' : q.type} question on ${objectiveById.get(q.objective)?.title} (reuses a saved one if you have it, otherwise 1 free AI request)`} size="sm" variant="plain" disabled={aiBusy} onClick={() => void aiQuestion()}>
                  {aiBusy ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : <Sparkles aria-hidden="true" size={16} />} {aiBusy ? 'Writing and checking…' : 'One more like this (AI)'}
                </Btn>
              ) : (
                <span />
              )}
              <Btn tip={i + 1 < set.length ? 'Go to the next question' : 'See your results'} variant="hl" onClick={next} autoFocus>
                {i + 1 < set.length ? 'Next question' : 'Finish'} <ArrowRight aria-hidden="true" size={18} />
              </Btn>
            </div>
            {aiMsg && <p role="status" className="rounded-xl border-2 border-dashed border-ink p-2 text-sm">{aiMsg}</p>}
          </div>
        )}
      </Card>
    </div>
  )
}
