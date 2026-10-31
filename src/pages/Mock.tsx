import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlarmClock, ArrowLeft, ArrowRight, Flag, Loader2, Send, Timer } from 'lucide-react'
import { buildMock, MOCK_DEFAULT } from '../lib/select'
import { blankResponse, check, isAnswered } from '../lib/check'
import { python } from '../lib/python'
import { OBJECTIVES, objectiveLabel } from '../lib/bank'
import type { Grade, MockResult, Question, Response } from '../lib/types'
import { useApp } from '../state'
import { Bar, Btn, Card, LinkBtn } from '../components/ui'
import { QuestionHeader, QuestionView } from '../components/QuestionView'
import { Feedback } from '../components/Feedback'

type Phase = 'intro' | 'running' | 'grading' | 'results'

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function Mock() {
  const app = useApp()
  const [phase, setPhase] = useState<Phase>('intro')
  const [qs, setQs] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Response[]>([])
  const [flags, setFlags] = useState<boolean[]>([])
  const [i, setI] = useState(0)
  const [deadline, setDeadline] = useState(0)
  const [now, setNow] = useState(0)
  const [grades, setGrades] = useState<Grade[]>([])
  const [progress, setProgress] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const startedAt = useRef('')
  const sessionId = useMemo(() => crypto.randomUUID(), [])
  const submitted = useRef(false)

  function start() {
    const set = buildMock(app.questions.filter((q) => q.source !== 'ai'), OBJECTIVES)
    setQs(set)
    setAnswers(set.map(blankResponse))
    setFlags(set.map(() => false))
    setI(0)
    startedAt.current = new Date().toISOString()
    const t0 = Date.now()
    setNow(t0)
    setDeadline(t0 + MOCK_DEFAULT.minutes * 60_000)
    setPhase('running')
    void python.warm()
  }

  const finish = useCallback(async () => {
    if (submitted.current) return
    submitted.current = true
    setPhase('grading')
    const out: Grade[] = []
    for (let k = 0; k < qs.length; k++) {
      try {
        out.push(isAnswered(answers[k]) && !(qs[k].type === 'code' && answers[k].type === 'code' && (answers[k] as { source: string }).source === (qs[k] as { starter: string }).starter) ? await check(qs[k], answers[k]) : { correct: false, score: 0, note: 'Not answered.' })
      } catch (e) {
        out.push({ correct: false, score: 0, note: (e as Error).message })
      }
      setProgress((k + 1) / qs.length)
    }
    setGrades(out)
    const per = Math.round((Date.now() - new Date(startedAt.current).getTime()) / Math.max(1, qs.length))
    const byObjective: MockResult['byObjective'] = {}
    qs.forEach((q, k) => {
      const e = (byObjective[q.objective] ??= { total: 0, correct: 0 })
      e.total++
      if (out[k].correct) e.correct++
      void app.record(q, out[k], 'mock', per, sessionId)
    })
    await app.saveMock({
      id: sessionId,
      startedAt: startedAt.current,
      finishedAt: new Date().toISOString(),
      timeLimitMin: MOCK_DEFAULT.minutes,
      total: qs.length,
      correct: out.filter((g) => g.correct).length,
      byObjective,
    })
    setPhase('results')
    window.scrollTo({ top: 0 })
  }, [qs, answers, app, sessionId])

  useEffect(() => {
    if (phase !== 'running') return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'running' && now >= deadline) void finish()
  }, [now, deadline, phase, finish])

  useEffect(() => {
    if (phase !== 'running') return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-teal">Mock OA</p>
          <h1 className="font-display text-4xl font-bold">A timed dress rehearsal</h1>
          <ul className="mt-4 space-y-2">
            <li className="flex gap-2"><Timer aria-hidden="true" className="shrink-0 text-teal" /> {MOCK_DEFAULT.count} questions in {MOCK_DEFAULT.minutes} minutes, including {MOCK_DEFAULT.codeSlots} write-the-code tasks at the end.</li>
            <li className="flex gap-2"><Flag aria-hidden="true" className="shrink-0 text-teal" /> No feedback until you submit. Flag questions to come back to them.</li>
            <li className="flex gap-2"><AlarmClock aria-hidden="true" className="shrink-0 text-teal" /> Questions are spread across objectives by weight; when time runs out it submits itself.</li>
          </ul>
          <p className="mt-4 rounded-xl border-2 border-dashed border-ink p-3 text-sm text-muted">
            This is Recall Lab’s own practice format with a {Math.round(MOCK_DEFAULT.passTarget * 100)}% target. It is not the official OA and doesn’t predict its length, question style or cut score.
          </p>
          <div className="mt-6 flex gap-2">
            <Btn tip={`Start the ${MOCK_DEFAULT.minutes}-minute timer now`} variant="hl" size="lg" onClick={start}>Start mock OA</Btn>
            <LinkBtn to="/dashboard" tip="Back to the dashboard" size="lg">Not now</LinkBtn>
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'grading') {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p role="status" className="flex items-center justify-center gap-2 font-semibold"><Loader2 aria-hidden="true" className="animate-spin" /> Grading, running your code against hidden tests…</p>
        <div className="mt-4"><Bar value={progress} label="Grading progress" /></div>
      </Card>
    )
  }

  if (phase === 'results') {
    const correct = grades.filter((g) => g.correct).length
    const pct = correct / qs.length
    const byObj = OBJECTIVES.map((o) => {
      const ks = qs.map((q, k) => (q.objective === o.id ? k : -1)).filter((k) => k >= 0)
      return { o, n: ks.length, c: ks.filter((k) => grades[k].correct).length }
    }).filter((x) => x.n > 0)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card>
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-teal">Mock OA results</p>
          <h1 className="font-display text-5xl font-bold">{Math.round(pct * 100)}%</h1>
          <p className={`mt-1 font-semibold ${pct >= MOCK_DEFAULT.passTarget ? 'text-good' : 'text-bad'}`}>
            {correct} of {qs.length} correct · {pct >= MOCK_DEFAULT.passTarget ? 'above' : 'below'} the {Math.round(MOCK_DEFAULT.passTarget * 100)}% practice target
          </p>
          <ul className="mt-5 space-y-3">
            {byObj.map(({ o, n, c }) => (
              <li key={o.id}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{objectiveLabel(o.id)}</span><span className="font-mono">{c}/{n}</span></div>
                <Bar value={c / n} label={`${o.title}: ${c} of ${n}`} tone={c / n >= MOCK_DEFAULT.passTarget ? 'teal' : 'coral'} />
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <LinkBtn to="/dashboard" tip="See your updated mastery map" variant="hl">Dashboard</LinkBtn>
            <LinkBtn to="/review" tip="Practise what you missed (it is now due)">Review misses</LinkBtn>
          </div>
        </Card>
        <h2 className="font-display text-2xl font-bold">Question by question</h2>
        {qs.map((q, k) => (
          <details key={k} className="rounded-2xl border-2 border-ink bg-card p-4">
            <summary className="flex cursor-pointer items-center gap-3 font-semibold">
              <span className={grades[k].correct ? 'text-good' : 'text-bad'}>{grades[k].correct ? '✓' : '✗'}</span>
              <span className="font-mono">Q{k + 1}</span>
              <span className="truncate">{q.prompt.replace(/`/g, '')}</span>
            </summary>
            <div className="mt-3 space-y-3">
              <QuestionView q={q} response={answers[k]} onChange={() => undefined} locked grade={grades[k]} />
              <Feedback q={q} grade={grades[k]} response={answers[k]} ai={false} />
            </div>
          </details>
        ))}
      </div>
    )
  }

  const q = qs[i]
  const left = deadline - now
  const answeredCount = answers.filter((a, k) => isAnswered(a) && !(qs[k].type === 'code' && a.type === 'code' && a.source === (qs[k] as { starter: string }).starter)).length
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
      <Card as="article">
        <QuestionHeader q={q} index={i} total={qs.length} />
        <QuestionView key={i} q={q} response={answers[i]} onChange={(r) => setAnswers((a) => a.map((x, k) => (k === i ? r : x)))} locked={false} />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Btn tip="Previous question" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft aria-hidden="true" size={18} /> Back</Btn>
          <Btn tip={flags[i] ? 'Remove the flag' : 'Flag this question to revisit it'} variant={flags[i] ? 'hl' : 'plain'} aria-pressed={flags[i]} onClick={() => setFlags((f) => f.map((x, k) => (k === i ? !x : x)))}>
            <Flag aria-hidden="true" size={18} /> {flags[i] ? 'Flagged' : 'Flag'}
          </Btn>
          {i + 1 < qs.length ? (
            <Btn tip="Save and go to the next question" variant="primary" onClick={() => setI(i + 1)}>Next <ArrowRight aria-hidden="true" size={18} /></Btn>
          ) : (
            <Btn tip="Review and submit the exam" variant="hl" onClick={() => setConfirm(true)}><Send aria-hidden="true" size={18} /> Submit</Btn>
          )}
        </div>
      </Card>
      <aside aria-label="Exam navigator" className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <div role="timer" aria-label="Time left" className={`font-mono text-4xl font-bold ${left < 5 * 60_000 ? 'text-pen' : ''}`}>{fmt(left)}</div>
          <p className="text-sm text-muted">{answeredCount}/{qs.length} answered</p>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {qs.map((_, k) => {
              const a = isAnswered(answers[k]) && !(qs[k].type === 'code' && answers[k].type === 'code' && (answers[k] as { source: string }).source === (qs[k] as { starter: string }).starter)
              return (
                <Btn
                  key={k}
                  tip={`Question ${k + 1}${a ? ', answered' : ', not answered'}${flags[k] ? ', flagged' : ''}`}
                  size="sm"
                  iconOnly
                  variant={k === i ? 'primary' : a ? 'ghost' : 'plain'}
                  className={`!h-9 !w-full font-mono ${flags[k] ? '!border-pen' : ''} ${!a && k !== i ? '!border-line border-dashed' : ''}`}
                  aria-current={k === i ? 'step' : undefined}
                  onClick={() => setI(k)}
                >
                  {k + 1}
                </Btn>
              )
            })}
          </div>
          {confirm ? (
            <div className="mt-4 space-y-2 rounded-xl border-2 border-ink p-3" role="alertdialog" aria-label="Confirm submission">
              <p className="text-sm font-semibold">Submit now? {qs.length - answeredCount} unanswered.</p>
              <div className="flex gap-2">
                <Btn tip="Grade the exam now" variant="hl" size="sm" onClick={() => void finish()}>Submit</Btn>
                <Btn tip="Keep working" size="sm" onClick={() => setConfirm(false)}>Keep going</Btn>
              </div>
            </div>
          ) : (
            <div className="mt-4"><Btn tip="Finish early and grade the exam" block onClick={() => setConfirm(true)}><Send aria-hidden="true" size={16} /> Submit exam</Btn></div>
          )}
        </Card>
      </aside>
    </div>
  )
}
