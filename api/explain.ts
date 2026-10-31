import { streamText } from 'ai'
import { aiFailure, authorize, clip, FALLBACK_MODEL, json, PRIMARY_MODEL, readBody } from './_shared.js'
import { COURSE_TITLE } from './_objectives.js'

interface Body {
  kind?: 'explain' | 'hint'
  prompt?: string
  code?: string
  answer?: string
  correct?: string
  details?: string
}

/** Streams a short hint (before answering) or an explanation of the learner's mistake. */
export async function POST(req: Request): Promise<Response> {
  const body = await readBody<Body>(req.clone())
  if (body instanceof Response) return body
  const kind = body.kind === 'hint' ? 'hint' : body.kind === 'explain' ? 'explain' : null
  if (!kind || !body.prompt) return json(400, { error: 'bad_request' })

  const who = await authorize(req, kind)
  if (who instanceof Response) return who

  const context =
    `Question: ${clip(body.prompt, 800)}\n` +
    (body.code ? `Code:\n${clip(body.code, 1600)}\n` : '') +
    (kind === 'explain'
      ? `Learner's answer:\n${clip(body.answer, 800)}\nCorrect answer:\n${clip(body.correct, 600)}\n` + (body.details ? `Test details:\n${clip(body.details, 600)}\n` : '')
      : '')
  const task =
    kind === 'hint'
      ? 'Give ONE short hint (max 2 sentences) that points the learner in the right direction without revealing the answer.'
      : "Explain, in at most 5 short sentences, why the learner's answer is wrong and what idea they should review. Be kind and concrete. Use `code` formatting for Python."

  const result = streamText({
    model: PRIMARY_MODEL,
    providerOptions: { gateway: { models: [FALLBACK_MODEL] } },
    maxOutputTokens: kind === 'hint' ? 150 : 400,
    temperature: 0.3,
    maxRetries: 1,
    abortSignal: AbortSignal.any([req.signal, AbortSignal.timeout(25_000)]),
    system: `You are a patient Python tutor for the course ${COURSE_TITLE}. Answer in plain text with light Markdown.`,
    prompt: `${context}\n${task}`,
  })

  // Wait for the first chunk so quota or provider errors become a proper status code.
  const it = result.textStream[Symbol.asyncIterator]()
  let first: IteratorResult<string>
  try {
    first = await it.next()
  } catch (err) {
    return aiFailure(err)
  }
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      if (!first.done) c.enqueue(enc.encode(first.value))
      if (first.done) c.close()
    },
    async pull(c) {
      try {
        const n = await it.next()
        if (n.done) c.close()
        else c.enqueue(enc.encode(n.value))
      } catch {
        c.close()
      }
    },
    cancel() {
      void it.return?.()
    },
  })
  return new Response(stream, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-ai-remaining': String(who.remaining) },
  })
}
