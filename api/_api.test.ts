import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST as generate, SCHEMAS } from './generate'
import { POST as explain } from './explain'
import { aiFailure } from './_shared'

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://x/api/generate', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } })

afterEach(() => vi.unstubAllEnvs())

describe('AI routes fail closed (no model call happens)', () => {
  it('kill switch returns 503', async () => {
    vi.stubEnv('AI_DISABLED', '1')
    const r = await generate(req({ objective: 'D335.01', type: 'mcq' }))
    expect(r.status).toBe(503)
  })
  it('rejects unknown objectives and types', async () => {
    expect((await generate(req({ objective: 'nope', type: 'mcq' }))).status).toBe(400)
    expect((await generate(req({ objective: 'D335.01', type: 'essay' }))).status).toBe(400)
  })
  it('without backend config the AI is unavailable', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_URL', '')
    const r = await generate(req({ objective: 'D335.01', type: 'mcq' }, { authorization: 'Bearer x' }))
    expect(r.status).toBe(503)
  })
  it('requires a bearer token', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon')
    const r = await explain(req({ kind: 'hint', prompt: 'p' }))
    expect(r.status).toBe(401)
  })
  it('rejects oversized bodies', async () => {
    const r = await generate(req({ objective: 'D335.01', type: 'mcq', avoid: ['x'.repeat(20_000)] }))
    expect(r.status).toBe(413)
  })
})

describe('provider failures map to calm responses', () => {
  it('rate limit and credit exhaustion become quota 429s', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(aiFailure({ statusCode: 429 }).status).toBe(429)
    expect(aiFailure({ statusCode: 402 }).status).toBe(429)
    expect(aiFailure(new Error('boom')).status).toBe(503)
  })
})

describe('structured output schemas', () => {
  it('validate a well-formed MCQ and reject a malformed one', () => {
    const ok = SCHEMAS.mcq.safeParse({ prompt: 'What prints?', explanation: 'print writes the value 1 followed by a newline.', code: 'print(1)', choices: ['1', '2', '3', '4'], answerIndex: 0 })
    expect(ok.success).toBe(true)
    expect(SCHEMAS.mcq.safeParse({ prompt: 'x', explanation: 'y', code: '', choices: ['1'], answerIndex: 9 }).success).toBe(false)
  })
})
