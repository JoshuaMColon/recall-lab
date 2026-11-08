import { createClient } from '@supabase/supabase-js'

/**
 * Every model route calls authorize() before I spend a token.
 * AI_DISABLED=1 is the kill switch: the question bank keeps working.
 * I verify the caller with getUser() so Supabase checks the JWT,
 * instead of decoding it myself. study_ai_consume() then takes the
 * quota in Postgres, row locks and all, before any model call. Two
 * overlapping requests cannot both pass the cap. Inputs are clipped
 * and the token limits stay small.
 * The gateway is called with OIDC. There is no API key in this repo.
 * On the free tier a spent credit comes back as 429 and cannot bill.
 */

export const PRIMARY_MODEL = process.env.AI_MODEL || 'google/gemini-2.5-flash-lite'
export const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'openai/gpt-4.1-nano'
export const MAX_BODY = 12_000

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

export type Kind = 'generate' | 'explain' | 'hint'

export interface Authorized {
  userId: string
  remaining: number
}

/** The caller when this request may spend a call, otherwise a response I can return as-is. */
export async function authorize(req: Request, kind: Kind): Promise<Authorized | Response> {
  if (process.env.AI_DISABLED === '1') return json(503, { error: 'ai_unavailable', reason: 'disabled' })
  if (req.method !== 'POST') return json(405, { error: 'method' }, { allow: 'POST' })
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return json(503, { error: 'ai_unavailable', reason: 'not_configured' })
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'auth' })

  // Anon key plus the caller's bearer token. persistSession is off: this
  // client lives for one request and must not write a cookie. The header
  // is what makes the quota RPC run as this user. Without it, auth.uid()
  // inside the function is null and the call is refused.
  const db = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  // getUser(token) asks Supabase Auth to check the JWT. A forged or
  // expired token fails here. I do not decode the payload myself.
  const { data: user, error: userError } = await db.auth.getUser(token)
  if (userError || !user.user) return json(401, { error: 'auth' })

  // Spend the credit before the model call. A rejected quota check
  // returns 429 and I never reach the gateway.
  const { data, error } = await db.rpc('study_ai_consume', { kind })
  if (error) return json(503, { error: 'ai_unavailable', reason: 'quota_check_failed' })
  const q = data as { allowed: boolean; reason?: string; remaining?: number }
  if (!q.allowed) return json(429, { error: 'quota', scope: q.reason ?? 'user' })
  return { userId: user.user.id, remaining: q.remaining ?? 0 }
}

export async function readBody<T>(req: Request): Promise<T | Response> {
  // Length before JSON.parse, so a huge body is rejected still as text.
  const text = await req.text()
  if (text.length > MAX_BODY) return json(413, { error: 'too_large' })
  try {
    return JSON.parse(text) as T
  } catch {
    return json(400, { error: 'bad_json' })
  }
}

/** Map a gateway failure to a response the page can explain without asking anyone to pay. */
export function aiFailure(err: unknown): Response {
  const status = (err as { statusCode?: number })?.statusCode
  const name = (err as { name?: string })?.name ?? ''
  // Name, status, and a short message. The prompt is not in this log.
  console.error('AI call failed', name, status, (err as Error)?.message?.slice(0, 300))
  // 429 and 402 both mean the free credit is gone. I report them as
  // quota so the UI stays on the question bank.
  if (status === 429 || /RateLimit/i.test(name)) return json(429, { error: 'quota', scope: 'provider' })
  if (status === 402 || /Credit|Payment/i.test(name)) return json(429, { error: 'quota', scope: 'provider' })
  return json(503, { error: 'ai_unavailable', reason: 'provider' })
}

export const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : '')
