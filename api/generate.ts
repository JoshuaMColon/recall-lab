import { generateText, Output } from 'ai'
import { z } from 'zod'
import { aiFailure, authorize, clip, FALLBACK_MODEL, json, PRIMARY_MODEL, readBody } from './_shared.js'
import { COURSE_TITLE, OBJECTIVES } from './_objectives.js'

const TYPES = ['mcq', 'output', 'bug', 'code'] as const
type QType = (typeof TYPES)[number]

const base = { prompt: z.string().min(10).max(600), explanation: z.string().min(20).max(1200) }
const code = z.string().max(1500)

export const SCHEMAS = {
  mcq: z.object({
    ...base,
    code: code.describe('Optional Python snippet the question refers to, or an empty string'),
    choices: z.array(z.string().min(1).max(200)).length(4),
    answerIndex: z.number().int().min(0).max(3),
  }),
  output: z.object({
    ...base,
    code: code.describe('A short, deterministic Python 3 program (no input(), no randomness, no files) whose printed output the learner must predict'),
  }),
  bug: z.object({
    ...base,
    code: code.describe('A short Python 3 program, 4 to 12 lines, with exactly one buggy line. Deterministic, no input(), no files'),
    bugLine: z.number().int().min(1).max(15).describe('1-based line number of the bug'),
    fixedLine: z.string().max(200).describe('The corrected version of that line, with the same indentation'),
  }),
  code: z.object({
    ...base,
    starter: code.describe('Starter code with a TODO comment; it must NOT already solve the task'),
    solution: code.describe('A correct reference solution that reads all input with input() and prints the answer'),
    testInputs: z.array(z.string().max(200)).min(3).max(5).describe('stdin for each test, lines separated by \\n'),
  }),
} satisfies Record<QType, z.ZodType>

const GUIDE: Record<QType, string> = {
  mcq: 'a multiple-choice concept question with 4 plausible choices and exactly one correct answer',
  output: 'a "predict the output" question: a short program whose exact printed output is the answer',
  bug: 'a "find the bug" question: a short program with one line that makes it print the wrong thing or crash',
  code: 'a short "write the code" task (5-15 lines) that reads from input() and prints a result, checked by tests',
}

interface Body {
  objective?: string
  type?: string
  avoid?: string[]
}

export async function POST(req: Request): Promise<Response> {
  const body = await readBody<Body>(req.clone())
  if (body instanceof Response) return body
  const objective = OBJECTIVES[body.objective ?? '']
  const type = TYPES.find((t) => t === body.type)
  if (!objective || !type) return json(400, { error: 'bad_request' })

  const who = await authorize(req, 'generate')
  if (who instanceof Response) return who

  const avoid = (Array.isArray(body.avoid) ? body.avoid : []).slice(0, 8).map((p) => `- ${clip(p, 140)}`)
  try {
    const { output } = await generateText({
      model: PRIMARY_MODEL,
      providerOptions: { gateway: { models: [FALLBACK_MODEL] } },
      output: Output.object({ schema: SCHEMAS[type] as z.ZodType<Record<string, unknown>> }),
      maxOutputTokens: 900,
      temperature: 0.8,
      maxRetries: 1,
      abortSignal: AbortSignal.any([req.signal, AbortSignal.timeout(25_000)]),
      system:
        `You write original practice questions for the course ${COURSE_TITLE}, for beginners. ` +
        'Use plain Python 3 and only the standard library. Keep code short and deterministic. ' +
        'Never copy text from textbooks or official exams; write everything yourself. ' +
        'The explanation must teach why the answer is right in 2-4 sentences.',
      prompt:
        `Objective: ${objective.title}. ${objective.summary}\n` +
        `Write ${GUIDE[type]}.` +
        (avoid.length ? `\nDo not repeat these existing questions:\n${avoid.join('\n')}` : ''),
    })
    return json(200, { type, objective: body.objective, question: output, model: PRIMARY_MODEL, remaining: who.remaining })
  } catch (err) {
    return aiFailure(err)
  }
}
