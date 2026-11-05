import { useState } from 'react'
import { ArrowRight, Shuffle } from 'lucide-react'
import { COURSE, OBJECTIVES, TYPE_LABEL } from '../lib/bank'
import { LEVEL_LABEL } from '../lib/mastery'
import type { QType } from '../lib/types'
import { navigate } from '../router'
import { useApp } from '../state'
import { ListenButton } from '../components/ListenButton'
import { Btn, Card } from '../components/ui'
import { Prose } from '../components/Prose'

const TYPES: QType[] = ['mcq', 'output', 'bug', 'code']
const COUNTS = [5, 10, 20]

const PRACTICE_HELP = `Practice is a short quiz you build yourself. Nothing is timed. After every question you see if you were right, plus an explanation.

1. Topics are the numbered rows below, such as variables or loops. Press one or more to practice only those. Press Mixed if you are not sure. Mixed leans toward topics you have been missing.

2. Question types are the four kinds of questions: multiple choice, predict the output, find the bug, and write the code. If none are selected, you get a mix of all four. Press a type to keep only that kind.

3. Length is how many questions you want. Five is a good first session. Ten and twenty are there when you want more.

4. Press Start. Questions that are "due" come first. Due means the app thinks it is time to see that question again so you do not forget it. It does not mean you failed.

5. Read each question slowly, then press Check answer. Read the explanation before you move on. Its Listen button reads it aloud only if you press it.`

export function Practice() {
  const { mastery, questions } = useApp()
  const [objs, setObjs] = useState<string[]>([])
  const [types, setTypes] = useState<QType[]>([])
  const [count, setCount] = useState(10)
  const pool = questions.filter((q) => (objs.length === 0 || objs.includes(q.objective)) && (types.length === 0 || types.includes(q.type))).length
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  function start() {
    const p = new URLSearchParams()
    if (objs.length) p.set('o', objs.join(','))
    if (types.length) p.set('t', types.join(','))
    p.set('n', String(count))
    navigate(`/quiz?${p}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Set up a practice run</h1>
        <p className="mt-1 text-muted">Choose what to practice, then start. If you are brand new, leave the choices as they are and do 5 questions.</p>
      </div>

      <Card aria-labelledby="how-h">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h2 id="how-h" className="font-display text-xl font-semibold">What to do on this page</h2>
          <ListenButton text={PRACTICE_HELP} tip="Read these practice instructions aloud. Sound starts only when you press Listen." />
        </div>
        <div className="text-[0.98rem] leading-relaxed">
          <Prose text={PRACTICE_HELP} />
        </div>
      </Card>

      <Card aria-labelledby="obj-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="obj-h" className="font-display text-xl font-semibold">Objectives</h2>
          <Btn tip="Clear the selection: a mixed set from every objective" size="sm" variant={objs.length === 0 ? 'hl' : 'ghost'} onClick={() => setObjs([])} aria-pressed={objs.length === 0}>
            <Shuffle aria-hidden="true" size={16} /> Mixed (all)
          </Btn>
        </div>
        {COURSE.competencies.map((c) => (
          <div key={c.id} className="mb-3">
            <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-muted">Competency {c.id} · {c.title}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {OBJECTIVES.filter((o) => o.competency === c.id).map((o) => {
                const on = objs.includes(o.id)
                const m = mastery.find((x) => x.objective === o.id)!
                return (
                  <Btn key={o.id} tip={`Practice this topic: ${o.summary}`} aria-pressed={on} variant={on ? 'hl' : 'ghost'} block className="!justify-start text-left" onClick={() => setObjs(toggle(objs, o.id))}>
                    <span className="font-mono text-teal">{o.code}</span>
                    <span className="flex-1">{o.title}</span>
                    <span className="text-xs font-normal opacity-80">{LEVEL_LABEL[m.level]}</span>
                  </Btn>
                )
              })}
            </div>
          </div>
        ))}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card aria-labelledby="type-h">
          <h2 id="type-h" className="mb-3 font-display text-xl font-semibold">Question types</h2>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const on = types.includes(t)
              return (
                <Btn key={t} tip={on ? `Stop limiting the quiz to ${TYPE_LABEL[t]}` : `Include ${TYPE_LABEL[t]}. If no type is selected, all four kinds are included.`} aria-pressed={on} variant={on ? 'hl' : 'ghost'} size="sm" onClick={() => setTypes(toggle(types, t))}>
                  {TYPE_LABEL[t]}
                </Btn>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted">{types.length === 0 ? 'All types included.' : `${types.length} type${types.length > 1 ? 's' : ''} selected.`}</p>
        </Card>
        <Card aria-labelledby="len-h">
          <h2 id="len-h" className="mb-3 font-display text-xl font-semibold">Length</h2>
          <div className="flex gap-2">
            {COUNTS.map((n) => (
              <Btn key={n} tip={`${n} questions`} aria-pressed={count === n} variant={count === n ? 'hl' : 'ghost'} size="sm" onClick={() => setCount(n)}>
                {n}
              </Btn>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{pool} matching questions available.</p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Btn tip="Start this practice run" variant="primary" size="lg" disabled={pool === 0} onClick={start}>
          Start {Math.min(count, pool)} questions <ArrowRight aria-hidden="true" size={20} />
        </Btn>
      </div>
    </div>
  )
}
