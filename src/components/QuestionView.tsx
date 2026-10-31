import { useEffect, useId, useState, useSyncExternalStore } from 'react'
import { Loader2, Play } from 'lucide-react'
import type { Grade, Question, Response } from '../lib/types'
import { objectiveLabel, TYPE_LABEL } from '../lib/bank'
import { python } from '../lib/python'
import { gradeCode } from '../lib/grade'
import { Btn, CodeBlock, CodeEditor, Pill } from './ui'
import { Inline } from './Prose'

function usePythonStatus() {
  return useSyncExternalStore(
    (fn) => python.subscribe(fn),
    () => python.status,
  )
}

function Files({ files }: { files?: Record<string, string> }) {
  if (!files) return null
  return (
    <div className="space-y-2">
      {Object.entries(files).map(([name, body]) => (
        <div key={name}>
          <p className="mb-1 font-mono text-xs font-semibold text-muted">📄 {name}</p>
          <pre className="overflow-x-auto rounded-lg border-2 border-dashed border-line bg-sunk p-2 text-sm">{body}</pre>
        </div>
      ))}
    </div>
  )
}

function Stdin({ stdin }: { stdin?: string }) {
  if (!stdin) return null
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted">The user types (one line per input()):</p>
      <pre className="overflow-x-auto rounded-lg border-2 border-dashed border-line bg-sunk p-2 font-mono text-sm">{stdin.replace(/\n$/, '')}</pre>
    </div>
  )
}

export function QuestionHeader({ q, index, total }: { q: Question; index?: number; total?: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {index !== undefined && total !== undefined && <span className="font-mono text-sm font-bold">Q{index + 1}/{total}</span>}
      <Pill tone="teal">{objectiveLabel(q.objective)}</Pill>
      <Pill>{TYPE_LABEL[q.type]}</Pill>
      <Pill>{'●'.repeat(q.difficulty)}{'○'.repeat(3 - q.difficulty)}<span className="sr-only"> difficulty {q.difficulty} of 3</span></Pill>
      {q.source === 'ai' && <Pill tone="hl">AI-generated{q.type === 'mcq' ? ' · key not machine-checked' : ' · verified by running it'}</Pill>}
    </div>
  )
}

interface Props {
  q: Question
  response: Response
  onChange: (r: Response) => void
  locked: boolean
  grade?: Grade | null
}

export function QuestionView({ q, response, onChange, locked, grade }: Props) {
  const name = useId()
  const status = usePythonStatus()
  const [trial, setTrial] = useState<Grade | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (q.type === 'code') void python.warm()
  }, [q])

  const reveal = locked && grade
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold leading-snug sm:text-2xl"><Inline text={q.prompt} /></h2>

      {q.type === 'mcq' && (
        <>
          {q.code && <CodeBlock code={q.code} />}
          <fieldset>
            <legend className="sr-only">Choose one answer</legend>
            <div className="grid gap-2">
              {q.choices.map((c, i) => {
                const chosen = response.type === 'mcq' && response.choice === i
                const tone = reveal ? (i === q.answer ? 'border-good bg-good-bg' : chosen ? 'border-bad bg-bad-bg' : 'border-line') : chosen ? 'border-ink bg-hl text-on-hl' : 'border-line hover:border-ink'
                return (
                  <label key={i} className={`press flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-card px-3 py-2.5 !shadow-none ${tone} ${locked ? 'cursor-default' : ''}`}>
                    <input type="radio" name={name} className="mt-1 h-4 w-4 accent-[var(--teal)]" checked={chosen} disabled={locked} onChange={() => onChange({ type: 'mcq', choice: i })} />
                    <span className="font-mono text-sm font-bold">{String.fromCharCode(65 + i)}</span>
                    <span className={/[()[\]=_'"]/.test(c) ? 'font-mono text-[0.92rem]' : ''}>{c}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </>
      )}

      {q.type === 'output' && (
        <>
          <Files files={q.files} />
          <CodeBlock code={q.code} />
          <Stdin stdin={q.stdin} />
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Exact output</span>
            <textarea
              className="code w-full rounded-xl border-2 border-ink bg-card p-3 text-[0.92rem]"
              rows={Math.min(6, Math.max(2, q.answer.split('\n').length))}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              disabled={locked}
              value={response.type === 'output' ? response.text : ''}
              onChange={(e) => onChange({ type: 'output', text: e.target.value })}
              placeholder="Type exactly what is printed, one line per print()"
            />
          </label>
        </>
      )}

      {q.type === 'bug' && (
        <>
          <Files files={q.files} />
          <Stdin stdin={q.stdin} />
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Pick the line that contains the bug</legend>
            <div className="overflow-x-auto rounded-xl border-2 border-ink bg-code-bg py-2 text-code-ink">
              {q.code.split('\n').map((line, i) => {
                const n = i + 1
                const chosen = response.type === 'bug' && response.line === n
                const tone = reveal ? (n === q.answer ? 'bg-good-bg/40 outline outline-2 outline-good' : chosen ? 'bg-bad-bg/40' : '') : chosen ? 'bg-hl/25 outline outline-2 outline-hl' : 'hover:bg-white/10'
                return (
                  <label key={i} className={`flex cursor-pointer items-center gap-2 px-2 font-mono text-[0.9rem] leading-relaxed ${tone} ${locked ? 'cursor-default' : ''}`}>
                    <input type="radio" name={name} className="h-3.5 w-3.5 accent-[var(--hl)]" checked={chosen} disabled={locked} onChange={() => onChange({ type: 'bug', line: n })} aria-label={`Line ${n}: ${line.trim() || 'blank'}`} />
                    <span aria-hidden="true" className="w-6 select-none text-right opacity-60">{n}</span>
                    <span aria-hidden="true" className="whitespace-pre">{line || ' '}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </>
      )}

      {q.type === 'code' && (
        <>
          <Files files={q.files} />
          <div>
            <p className="mb-1 text-sm font-semibold">Examples (more hidden tests are checked when you submit)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.tests.filter((t) => !t.hidden).map((t, i) => (
                <div key={i} className="rounded-xl border-2 border-dashed border-line bg-sunk p-2 font-mono text-xs">
                  <p className="text-muted">input</p>
                  <pre className="whitespace-pre-wrap">{t.stdin.replace(/\n$/, '') || '(none)'}</pre>
                  <p className="mt-1 text-muted">prints</p>
                  <pre className="whitespace-pre-wrap">{t.expected}</pre>
                </div>
              ))}
            </div>
          </div>
          <CodeEditor label="Your Python code" value={response.type === 'code' ? response.source : ''} onChange={(v) => onChange({ type: 'code', source: v })} disabled={locked} />
          {!locked && (
            <div className="flex flex-wrap items-center gap-3">
              <Btn
                tip="Run the visible examples only; this does not submit"
                size="sm"
                disabled={running || status === 'error'}
                onClick={async () => {
                  if (response.type !== 'code') return
                  setRunning(true)
                  try {
                    const vis = q.tests.filter((t) => !t.hidden)
                    setTrial(gradeCode(vis, await python.run(response.source, vis.map((t) => ({ stdin: t.stdin })), q.files)))
                  } finally {
                    setRunning(false)
                  }
                }}
              >
                {running ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : <Play aria-hidden="true" size={16} />} Run examples
              </Btn>
              <span role="status" className="text-xs text-muted">
                {status === 'loading' ? 'Starting Python in your browser (first time takes a few seconds)…' : status === 'ready' ? 'Python ready' : status === 'error' ? 'Python could not start in this browser.' : ''}
              </span>
            </div>
          )}
          {trial && !locked && <TestTable grade={trial} />}
        </>
      )}
    </div>
  )
}

export function TestTable({ grade }: { grade: Grade }) {
  if (!grade.tests) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="mb-1 text-left text-sm font-semibold">
          Tests: {grade.tests.filter((t) => t.passed).length}/{grade.tests.length} passed
        </caption>
        <thead>
          <tr className="border-b-2 border-ink text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="py-1 pr-3">Result</th>
            <th scope="col" className="py-1 pr-3">Input</th>
            <th scope="col" className="py-1 pr-3">Expected</th>
            <th scope="col" className="py-1">Your program</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {grade.tests.map((t, i) => (
            <tr key={i} className="border-b border-line align-top">
              <td className={`py-1.5 pr-3 font-sans font-bold ${t.passed ? 'text-good' : 'text-bad'}`}>{t.passed ? '✓ pass' : '✗ fail'}{t.hidden ? <span className="block font-normal text-muted">hidden</span> : null}</td>
              <td className="whitespace-pre-wrap py-1.5 pr-3">{t.stdin.replace(/\n$/, '') || '—'}</td>
              <td className="whitespace-pre-wrap py-1.5 pr-3">{t.expected}</td>
              <td className="whitespace-pre-wrap py-1.5">{t.error ? <span className="text-bad">{t.error}</span> : t.got || <span className="text-muted">(nothing printed)</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
