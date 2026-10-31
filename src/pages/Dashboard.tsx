import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Flame, RotateCcw, Sparkles, Target, Timer, Trash2 } from 'lucide-react'
import { COURSE, OBJECTIVES, objectiveById } from '../lib/bank'
import { LEVEL_LABEL, type Level } from '../lib/mastery'
import { isDue } from '../lib/srs'
import { MOCK_DEFAULT } from '../lib/select'
import { AI_ENABLED, aiQuota } from '../lib/ai'
import { useApp } from '../state'
import { Bar, Btn, Card, LinkBtn, Pill } from '../components/ui'

const LEVEL_TONE: Record<Level, 'plain' | 'bad' | 'hl' | 'teal' | 'good'> = { new: 'plain', learning: 'bad', developing: 'hl', proficient: 'teal', mastered: 'good' }

function Gauge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const r = 50
  const c = 2 * Math.PI * r
  const at = (f: number) => [60 + r * Math.cos(2 * Math.PI * f), 60 + r * Math.sin(2 * Math.PI * f)] as const
  const [px, py] = at(value)
  const [tx, ty] = at(MOCK_DEFAULT.passTarget)
  return (
    <div className="relative h-36 w-36 shrink-0">
      {/* An orbit: the planet travels round as readiness grows; the amber star marks the practice target. */}
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90 overflow-visible" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="2 4" />
        <circle cx="60" cy="60" r="30" fill="rgb(var(--glow) / 0.08)" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--teal)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} className="transition-[stroke-dashoffset] duration-700" />
        <circle cx={tx} cy={ty} r="3.5" fill="var(--coral)" />
        <circle cx={tx} cy={ty} r="7" fill="none" stroke="var(--coral)" strokeWidth="1" opacity="0.6" />
        <circle cx={px} cy={py} r="9" fill="var(--hl)" opacity="0.25" />
        <circle cx={px} cy={py} r="5.5" fill="var(--hl)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold">{pct}%</span>
        <span className="text-xs font-semibold text-muted">OA readiness</span>
      </div>
    </div>
  )
}

/** The mastery map as two constellations: one star per objective, brighter as mastery grows. */
function SkyChart({ mastery }: { mastery: { objective: string; mastery: number; level: Level; seen: number }[] }) {
  const W = 640
  const H = 150
  const groups = COURSE.competencies.map((c) => OBJECTIVES.filter((o) => o.competency === c.id))
  const total = groups.reduce((n, g) => n + g.length, 0)
  let k = 0
  const pts = groups.map((g, gi) =>
    g.map((o, i) => {
      const slot = k++
      const x = 30 + ((slot + gi * 0.9) / (total - 1 + (groups.length - 1) * 0.9)) * (W - 60)
      const y = [46, 98, 64, 112, 38, 84][(i + gi * 2) % 6]
      const m = mastery.find((x) => x.objective === o.id)!
      return { o, m, x, y }
    }),
  )
  const strong = mastery.filter((m) => m.level === 'proficient' || m.level === 'mastered').length
  const col = (l: Level) => (l === 'mastered' ? 'var(--hl)' : l === 'proficient' ? 'var(--teal)' : 'var(--ink)')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 hidden w-full rounded-xl border border-line bg-sunk sm:block" role="img" aria-label={`Star chart: ${strong} of ${mastery.length} objectives proficient or better`}>
      {/* star-chart graticule and a sprinkle of background stars */}
      <g stroke="var(--line)" fill="none" strokeWidth="1">
        <ellipse cx={W / 2} cy={H + 60} rx={W * 0.62} ry={150} />
        <ellipse cx={W / 2} cy={H + 60} rx={W * 0.42} ry={105} />
        <line x1={W / 2} y1="0" x2={W / 2} y2={H} strokeDasharray="2 5" />
      </g>
      {Array.from({ length: 36 }, (_, i) => (
        <circle key={i} cx={(i * 97.3) % W} cy={(i * 53.7 + 11) % H} r={i % 5 ? 0.7 : 1.1} fill="var(--muted)" opacity="0.35" />
      ))}
      {pts.map((g, gi) => (
        <g key={gi}>
          <polyline points={g.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--teal)" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="3 4" />
          {g.map(({ o, m, x, y }) => {
            const lit = m.seen > 0
            const rad = 2.5 + m.mastery * 4.5
            return (
              <g key={o.id}>
                {lit && <circle cx={x} cy={y} r={rad * 2.6} fill={col(m.level)} opacity={0.08 + m.mastery * 0.14} />}
                <circle cx={x} cy={y} r={rad} fill={lit ? col(m.level) : 'none'} stroke={col(m.level)} strokeWidth={lit ? 0 : 1.2} opacity={lit ? 0.55 + m.mastery * 0.45 : 0.5} />
                <text x={x} y={y + (y > 80 ? 26 : -16)} textAnchor="middle" className="font-mono" fontSize="11" fill="var(--muted)">{o.code}</text>
              </g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}

export function Dashboard() {
  const { mastery, readiness, weak, streak, data, questions, isGuest, local, resetProgress } = useApp()
  const due = data.reviews.filter((r) => isDue(r)).length
  const answered = data.attempts.length
  const recent = data.attempts.slice(-50)
  const recentAcc = recent.length ? recent.filter((a) => a.correct).length / recent.length : 0
  const [quota, setQuota] = useState<{ remaining: number; cap: number } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    void aiQuota().then(setQuota)
  }, [data.attempts.length])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-teal">{COURSE.code} · {COURSE.title}</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Your star chart</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkBtn to="/practice" tip="Pick objectives and question types to practise" variant="hl">
            Practice <ArrowRight aria-hidden="true" size={18} />
          </LinkBtn>
          <LinkBtn to="/mock" tip={`${MOCK_DEFAULT.count} questions in ${MOCK_DEFAULT.minutes} minutes, graded at the end`}>
            <Timer aria-hidden="true" size={18} /> Mock OA
          </LinkBtn>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-5 lg:col-span-2" aria-labelledby="ready-h">
          <Gauge value={readiness} />
          <div className="min-w-0">
            <h2 id="ready-h" className="font-display text-xl font-semibold">Readiness</h2>
            <p className="mt-1 text-sm text-muted">
              Mastery across all objectives, weighted like the mock OA. The amber star on the orbit marks the {Math.round(MOCK_DEFAULT.passTarget * 100)}% practice target. This is a study signal, not a prediction of your real score.
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs sm:gap-3 sm:text-sm">
              <div>
                <dt className="text-muted">Answered</dt>
                <dd className="font-display text-lg font-bold sm:text-2xl">{answered}</dd>
              </div>
              <div>
                <dt className="text-muted">Last 50</dt>
                <dd className="font-display text-lg font-bold sm:text-2xl">{recent.length ? `${Math.round(recentAcc * 100)}%` : '—'}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-muted"><Flame aria-hidden="true" size={14} /> Streak</dt>
                <dd className="font-display text-lg font-bold sm:text-2xl">{streak}d</dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card aria-labelledby="due-h" className="flex flex-col">
          <h2 id="due-h" className="flex items-center gap-2 font-display text-xl font-semibold"><RotateCcw aria-hidden="true" size={20} /> Due for review</h2>
          <p className="mt-2 font-display text-5xl font-bold">{due}</p>
          <p className="text-sm text-muted">{due ? 'Spaced repetition picked these for today.' : answered ? 'Nothing due. Nice: come back later.' : 'Answer a few questions to start your schedule.'}</p>
          <div className="mt-auto pt-4">
            {due > 0 ? (
              <LinkBtn to="/review" tip="Practise the questions that are due now" variant="primary" block>Start review</LinkBtn>
            ) : (
              <LinkBtn to="/practice" tip="Start a practice set" block>Practise something new</LinkBtn>
            )}
          </div>
        </Card>
      </div>

      {weak.length > 0 && (
        <Card aria-labelledby="weak-h">
          <h2 id="weak-h" className="flex items-center gap-2 font-display text-xl font-semibold"><AlertTriangle aria-hidden="true" size={20} className="text-pen" /> Weak areas</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {weak.map((w) => {
              const o = objectiveById.get(w.objective)!
              return (
                <li key={w.objective} className="flex flex-col gap-2 rounded-xl border-2 border-dashed border-pen p-3">
                  <span className="font-semibold"><span className="font-mono text-teal">{o.code}</span> {o.title}</span>
                  <span className="text-sm text-muted">{Math.round(w.mastery * 100)}% mastery · {w.correct}/{w.attempts} right</span>
                  <LinkBtn to={`/quiz?o=${w.objective}&n=8`} tip={`Practise 8 questions on ${o.title}`} size="sm">Drill this</LinkBtn>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card aria-labelledby="map-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="map-h" className="flex items-center gap-2 font-display text-xl font-semibold"><Target aria-hidden="true" size={20} /> Mastery map</h2>
          <p className="text-xs text-muted">Weight = share of the mock OA</p>
        </div>
        <SkyChart mastery={mastery} />
        {COURSE.competencies.map((c) => (
          <div key={c.id} className="mt-4">
            <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-muted">Competency {c.id} · {c.title}</h3>
            <ul className="divide-y-2 divide-line">
              {OBJECTIVES.filter((o) => o.competency === c.id).map((o) => {
                const m = mastery.find((x) => x.objective === o.id)!
                return (
                  <li key={o.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-2.5 sm:grid-cols-[minmax(0,15rem)_1fr_auto_auto]">
                    <span className="font-semibold"><span className="font-mono text-teal">{o.code}</span> {o.title}</span>
                    <span className="order-last col-span-2 sm:order-none sm:col-span-1"><Bar value={m.mastery} label={`${o.title} mastery`} /></span>
                    <Pill tone={LEVEL_TONE[m.level]}>{LEVEL_LABEL[m.level]}</Pill>
                    <span className="hidden w-40 text-right font-mono text-xs text-muted sm:inline">
                      {m.seen}/{m.total} seen · {o.weight}%{m.due ? ` · ${m.due} due` : ''}
                    </span>
                    <span className="sr-only sm:hidden">{m.seen} of {m.total} seen</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card aria-labelledby="mock-h">
          <h2 id="mock-h" className="flex items-center gap-2 font-display text-xl font-semibold"><Timer aria-hidden="true" size={20} /> Mock OA history</h2>
          {data.mocks.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No mock exams yet. Try one when most objectives are “Developing” or better.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {data.mocks.slice(-6).reverse().map((m) => {
                const pct = m.correct / m.total
                return (
                  <li key={m.id} className="flex items-center gap-3 text-sm">
                    <span className="w-28 text-muted">{new Date(m.finishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span className="flex-1"><Bar value={pct} label={`Mock score ${Math.round(pct * 100)}%`} tone={pct >= MOCK_DEFAULT.passTarget ? 'teal' : 'coral'} /></span>
                    <span className="w-24 text-right font-mono">{m.correct}/{m.total} · {Math.round(pct * 100)}%</span>
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
        <Card aria-labelledby="ai-h">
          <h2 id="ai-h" className="flex items-center gap-2 font-display text-xl font-semibold"><Sparkles aria-hidden="true" size={20} /> AI extras</h2>
          <p className="mt-2 text-sm text-muted">
            {AI_ENABLED
              ? quota
                ? `${quota.remaining} of ${quota.cap} free AI requests left today${isGuest ? ' (guests get fewer; create an account for more)' : ''}. Hints, explanations and fresh questions use them; the ${questions.length - data.aiQuestions.length}-question bank never does.`
                : 'Free-tier AI with strict daily caps. When it runs out, everything else keeps working.'
              : 'AI is off in this build. The question bank, grading, reviews and mock OA all work without it.'}
          </p>
          {data.aiQuestions.length > 0 && <p className="mt-2 text-sm">{data.aiQuestions.length} AI question{data.aiQuestions.length === 1 ? '' : 's'} saved to your star chart (checked by running the code).</p>}
          <div className="mt-4 border-t-2 border-line pt-3">
            {confirmReset ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-bad">Erase all your progress?</span>
                <Btn tip="Yes, delete every attempt, review and mock result" variant="danger" size="sm" onClick={() => void resetProgress().then(() => setConfirmReset(false))}>Erase</Btn>
                <Btn tip="Keep my progress" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Btn>
              </div>
            ) : (
              <Btn tip={local ? 'Clear the progress saved in this browser' : 'Delete your saved progress from the cloud'} variant="plain" size="sm" onClick={() => setConfirmReset(true)}>
                <Trash2 aria-hidden="true" size={16} /> Reset progress
              </Btn>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
