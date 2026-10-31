import { useState } from 'react'
import { CheckCircle2, Lightbulb, Loader2, MessageCircleQuestion, XCircle } from 'lucide-react'
import type { Grade, Question, Response } from '../lib/types'
import { correctAnswer, describeResponse } from '../lib/check'
import { AI_ENABLED, AiError, streamNote } from '../lib/ai'
import { hashText } from '../lib/store'
import { useApp } from '../state'
import { Btn, CodeBlock } from './ui'
import { TestTable } from './QuestionView'
import { Prose } from './Prose'

function useAiNote() {
  const { store } = useApp()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [cached, setCached] = useState(false)
  async function run(kind: 'hint' | 'explain', questionId: string, hashSource: string, body: Parameters<typeof streamNote>[0]) {
    setBusy(true)
    setErr(null)
    setText('')
    try {
      const hash = hashText(hashSource)
      const hit = await store.getNote(questionId, kind, hash).catch(() => null)
      if (hit) {
        setCached(true)
        setText(hit)
        return
      }
      setCached(false)
      const full = await streamNote(body, setText)
      await store.saveNote(questionId, kind, hash, full).catch(() => undefined)
    } catch (e) {
      setText('')
      setErr(e instanceof AiError ? e.message : 'AI is unavailable right now. The question bank still works.')
    } finally {
      setBusy(false)
    }
  }
  return { text, busy, err, cached, run }
}

function AiBox({ title, note }: { title: string; note: ReturnType<typeof useAiNote> }) {
  if (!note.text && !note.err && !note.busy) return null
  return (
    <div className="rounded-xl border-2 border-dashed border-teal bg-card p-3 text-sm" aria-live="polite">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal">
        {note.busy && <Loader2 aria-hidden="true" size={14} className="animate-spin" />} {title}
        {note.cached && <span className="font-normal normal-case text-muted">· saved earlier, no AI used</span>}
      </p>
      {note.err ? <p className="text-bad">{note.err}</p> : <Prose text={note.text || 'Thinking…'} />}
    </div>
  )
}

export function HintButton({ q }: { q: Question }) {
  const note = useAiNote()
  if (!AI_ENABLED) return null
  return (
    <div className="space-y-2">
      <Btn
        tip="Ask the AI tutor for a nudge without giving away the answer (uses 1 free AI request)"
        size="sm"
        variant="plain"
        disabled={note.busy}
        onClick={() => void note.run('hint', q.id, '', { kind: 'hint', prompt: q.prompt, code: 'code' in q ? q.code : q.type === 'code' ? q.starter : undefined })}
      >
        <Lightbulb aria-hidden="true" size={16} /> AI hint
      </Btn>
      <AiBox title="Hint" note={note} />
    </div>
  )
}

export function Feedback({ q, grade, response, ai = true }: { q: Question; grade: Grade; response: Response; ai?: boolean }) {
  const note = useAiNote()
  const ok = grade.correct
  const partial = !ok && grade.score > 0
  const mine = describeResponse(q, response)
  return (
    <section aria-label="Feedback" className={`space-y-3 rounded-2xl border-2 p-4 ${ok ? 'border-good bg-good-bg' : 'border-bad bg-bad-bg'}`}>
      <div className="flex items-center gap-3" role="status">
        <span className={`stamp-in inline-flex items-center gap-2 rounded-lg border-[3px] px-3 py-1 font-display text-xl font-bold uppercase ${ok ? 'border-good text-good' : 'border-bad text-bad'}`}>
          {ok ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}
          {ok ? 'Correct' : partial ? `Partly right · ${Math.round(grade.score * 100)}%` : 'Not quite'}
        </span>
      </div>
      {grade.note && <p className="text-sm font-semibold">{grade.note}</p>}

      <div className="rounded-xl bg-card p-3 text-ink">
        {q.type === 'output' && (
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-muted">Python prints</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-sunk p-2 font-mono text-sm">{q.answer}</pre>
            </div>
            {!ok && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase text-muted">You wrote</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-sunk p-2 font-mono text-sm">{mine || '(blank)'}</pre>
              </div>
            )}
          </div>
        )}
        {q.type === 'bug' && (
          <div className="mb-3 space-y-2 text-sm">
            <p>
              The bug is on <strong>line {q.answer}</strong>
              {!ok && response.type === 'bug' && response.line > 0 ? ` (you picked line ${response.line})` : ''}. Fix:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-sunk p-2 font-mono">{q.fix}</pre>
            <p className="text-muted">
              Buggy version prints <code className="rounded bg-sunk px-1">{q.actual}</code>; fixed version prints <code className="rounded bg-sunk px-1">{q.expected}</code>.
            </p>
          </div>
        )}
        {q.type === 'mcq' && !ok && (
          <p className="mb-2 text-sm">
            Answer: <strong>{q.choices[q.answer]}</strong>
          </p>
        )}
        {q.type === 'code' && (
          <div className="mb-3 space-y-3">
            <TestTable grade={grade} />
            {!ok && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold">Show a reference solution</summary>
                <div className="mt-2">
                  <CodeBlock code={q.solution} label="Reference solution" />
                </div>
              </details>
            )}
          </div>
        )}
        <div className="text-[0.95rem] leading-relaxed">
          <Prose text={q.explanation} />
        </div>
      </div>

      {ai && AI_ENABLED && !ok && (
        <div className="space-y-2">
          <Btn
            tip="Have the AI tutor explain what went wrong in your answer (uses 1 free AI request)"
            size="sm"
            variant="ghost"
            disabled={note.busy}
            onClick={() =>
              void note.run('explain', q.id, mine, {
                kind: 'explain',
                prompt: q.prompt,
                code: q.type === 'code' ? undefined : 'code' in q ? q.code : undefined,
                answer: mine,
                correct: correctAnswer(q),
                details: grade.tests?.filter((t) => !t.passed).slice(0, 2).map((t) => `input ${JSON.stringify(t.stdin)} expected ${JSON.stringify(t.expected)} got ${JSON.stringify(t.error ?? t.got)}`).join('\n'),
              })
            }
          >
            <MessageCircleQuestion aria-hidden="true" size={16} /> Explain my mistake
          </Btn>
          <AiBox title="Why that was wrong" note={note} />
        </div>
      )}
    </section>
  )
}
