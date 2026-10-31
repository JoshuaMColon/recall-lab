import { useState } from 'react'
import { ArrowRight, Shuffle } from 'lucide-react'
import { COURSE, OBJECTIVES, TYPE_LABEL } from '../lib/bank'
import { LEVEL_LABEL } from '../lib/mastery'
import type { QType } from '../lib/types'
import { navigate } from '../router'
import { useApp } from '../state'
import { Btn, Card } from '../components/ui'

const TYPES: QType[] = ['mcq', 'output', 'bug', 'code']
const COUNTS = [5, 10, 20]

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
        <p className="mt-1 text-muted">Pick one objective to drill it, several to mix them, or none for a mixed set that leans on your weak spots. Due reviews always come first.</p>
      </div>

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
                  <Btn key={o.id} tip={`${o.summary}`} aria-pressed={on} variant={on ? 'hl' : 'ghost'} block className="!justify-start text-left" onClick={() => setObjs(toggle(objs, o.id))}>
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
                <Btn key={t} tip={on ? `Remove ${TYPE_LABEL[t]}` : `Only include the types you select; none selected means all`} aria-pressed={on} variant={on ? 'hl' : 'ghost'} size="sm" onClick={() => setTypes(toggle(types, t))}>
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
