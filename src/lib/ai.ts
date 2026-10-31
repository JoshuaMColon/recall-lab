import { normalizeOutput, gradeCode } from './grade'
import { python } from './python'
import { supabase } from './supabase'
import type { Question, QType } from './types'

/** AI is an optional extra. Everything else works without it. */
export const AI_ENABLED = supabase !== null && import.meta.env.VITE_AI_OFF !== '1'

export class AiError extends Error {
  constructor(
    public code: 'quota' | 'unavailable' | 'auth' | 'invalid',
    message: string,
  ) {
    super(message)
  }
}

const QUOTA_MSG: Record<string, string> = {
  user: 'You have used today’s free AI allowance. The question bank and grading still work; AI comes back tomorrow (UTC).',
  global: 'The app’s shared free AI allowance is used up for today. The question bank and grading still work.',
  provider: 'The free AI tier is out of quota right now. The question bank and grading still work.',
  burst: 'Easy there: one AI request every few seconds.',
}

async function token(): Promise<string> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
  if (!data.session) throw new AiError('auth', 'Sign in (or start the demo) to use AI extras.')
  return data.session.access_token
}

async function post(path: string, body: unknown): Promise<Response> {
  if (!AI_ENABLED) throw new AiError('unavailable', 'AI extras are off in this build. Everything else works.')
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${await token()}` },
      body: JSON.stringify(body),
    })
  } catch (e) {
    if (e instanceof AiError) throw e
    throw new AiError('unavailable', 'Could not reach the AI service. The question bank still works.')
  }
  if (res.ok) return res
  const err = (await res.json().catch(() => ({}))) as { error?: string; scope?: string }
  if (res.status === 429 || err.error === 'quota') throw new AiError('quota', QUOTA_MSG[err.scope ?? 'user'] ?? QUOTA_MSG.user)
  if (res.status === 401) throw new AiError('auth', 'Your session expired. Sign in again to use AI extras.')
  throw new AiError('unavailable', 'AI is unavailable right now. The question bank and grading still work.')
}

export async function aiQuota(): Promise<{ remaining: number; cap: number } | null> {
  if (!AI_ENABLED || !supabase) return null
  const { data, error } = await supabase.rpc('study_ai_quota')
  if (error || !data) return null
  const d = data as { remaining: number; user_cap: number }
  return { remaining: d.remaining, cap: d.user_cap }
}

/* ---------- question generation, then verification with real Python ---------- */

interface RawMcq { prompt: string; explanation: string; code: string; choices: string[]; answerIndex: number }
interface RawOutput { prompt: string; explanation: string; code: string }
interface RawBug { prompt: string; explanation: string; code: string; bugLine: number; fixedLine: string }
interface RawCode { prompt: string; explanation: string; starter: string; solution: string; testInputs: string[] }

const invalid = () => new AiError('invalid', 'The AI wrote a question that failed its own check, so it was thrown away. Try again.')

/**
 * Never trust a model's answer key: outputs are computed by running the code in Pyodide,
 * bug fixes must change the behaviour, and code tasks get their expected outputs from the
 * reference solution. Only multiple-choice keys can't be machine-checked; they are labelled.
 */
/** Models sometimes paste the program into the prompt as a fenced block as well; the code is shown separately. */
export function cleanPrompt(prompt: string, hasCode: boolean): string {
  const p = hasCode ? prompt.replace(/```[a-z]*\n[\s\S]*?```/gi, ' ') : prompt
  return p.replace(/\s+/g, ' ').trim() || 'What does this program do?'
}

export async function verify(type: QType, objective: string, raw: unknown): Promise<Question> {
  const base = { id: 'ai-pending', objective, difficulty: 2 as const, source: 'ai' as const }
  switch (type) {
    case 'mcq': {
      const r = raw as RawMcq
      if (new Set(r.choices).size !== r.choices.length || r.answerIndex < 0 || r.answerIndex >= r.choices.length) throw invalid()
      return { ...base, type, prompt: cleanPrompt(r.prompt, !!r.code?.trim()), explanation: r.explanation, code: r.code?.trim() || undefined, choices: r.choices, answer: r.answerIndex }
    }
    case 'output': {
      const r = raw as RawOutput
      const [run] = await python.run(r.code, [{ stdin: '' }])
      const out = normalizeOutput(run.stdout)
      if (run.error || run.timedOut || !out || out.split('\n').length > 8) throw invalid()
      return { ...base, type, prompt: cleanPrompt(r.prompt || 'What does this program print?', true), explanation: r.explanation, code: r.code, answer: out }
    }
    case 'bug': {
      const r = raw as RawBug
      const lines = r.code.split('\n')
      if (r.bugLine < 1 || r.bugLine > lines.length) throw invalid()
      const fixedLines = [...lines]
      fixedLines[r.bugLine - 1] = r.fixedLine
      const buggy = await python.run(r.code, [{ stdin: '' }])
      const fixed = await python.run(fixedLines.join('\n'), [{ stdin: '' }])
      const fo = normalizeOutput(fixed[0].stdout)
      const bo = normalizeOutput(buggy[0].stdout)
      if (fixed[0].error || fixed[0].timedOut || !fo || (!buggy[0].error && bo === fo)) throw invalid()
      return {
        ...base,
        type,
        prompt: cleanPrompt(r.prompt, true),
        explanation: r.explanation,
        code: r.code,
        answer: r.bugLine,
        fix: r.fixedLine,
        expected: fo,
        actual: buggy[0].error ? buggy[0].error.type : bo,
      }
    }
    case 'code': {
      const r = raw as RawCode
      const cases = r.testInputs.map((s) => ({ stdin: s.endsWith('\n') || !s ? s : `${s}\n` }))
      const runs = await python.run(r.solution, cases)
      if (runs.some((x) => x.error || x.timedOut || !normalizeOutput(x.stdout))) throw invalid()
      const tests = cases.map((c, i) => ({ stdin: c.stdin, expected: normalizeOutput(runs[i].stdout), hidden: i >= 2 }))
      const starterRuns = await python.run(r.starter, cases)
      if (gradeCode(tests, starterRuns).correct) throw invalid()
      return { ...base, type, prompt: r.prompt, explanation: r.explanation, starter: r.starter, solution: r.solution, tests }
    }
  }
}

export async function generateQuestion(objective: string, type: QType, avoid: string[]): Promise<{ question: Question; model: string }> {
  const res = await post('/api/generate', { objective, type, avoid: avoid.slice(0, 8) })
  const data = (await res.json()) as { question: unknown; model: string }
  return { question: await verify(type, objective, data.question), model: data.model }
}

/** Stream a hint or a mistake explanation. Calls onText with the growing text. */
export async function streamNote(
  body: { kind: 'hint' | 'explain'; prompt: string; code?: string; answer?: string; correct?: string; details?: string },
  onText: (full: string) => void,
): Promise<string> {
  const res = await post('/api/explain', body)
  if (!res.body) throw new AiError('unavailable', 'AI is unavailable right now.')
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let full = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    full += value
    onText(full)
  }
  if (!full.trim()) throw new AiError('unavailable', 'The AI returned nothing. The question bank still works.')
  return full
}
