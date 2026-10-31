import { createClient } from '@supabase/supabase-js'

/**
 * Cost safety for every AI route:
 *  1. AI_DISABLED=1 turns all AI off instantly (the app keeps working on the question bank).
 *  2. The caller must be a signed-in Supabase user (accounts or /demo guests); the JWT is
 *     verified with Supabase, never trusted blindly.
 *  3. study_ai_consume() enforces per-user and global daily caps plus a burst gap in Postgres,
 *     atomically, before any model call is made.
 *  4. Token limits are small and inputs are truncated.
 * The models are called through Vercel AI Gateway with OIDC (no API key in the code). On the
 * free tier the Gateway returns 429 when the monthly credit is used up; it cannot bill.
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

/** Returns the caller if allowed, otherwise a ready-to-send error Response. */
export async function authorize(req: Request, kind: Kind): Promise<Authorized | Response> {
  if (process.env.AI_DISABLED === '1') return json(503, { error: 'ai_unavailable', reason: 'disabled' })
  if (req.method !== 'POST') return json(405, { error: 'method' }, { allow: 'POST' })
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return json(503, { error: 'ai_unavailable', reason: 'not_configured' })
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'auth' })

  const db = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: user, error: userError } = await db.auth.getUser(token)
  if (userError || !user.user) return json(401, { error: 'auth' })

  const { data, error } = await db.rpc('study_ai_consume', { kind })
  if (error) return json(503, { error: 'ai_unavailable', reason: 'quota_check_failed' })
  const q = data as { allowed: boolean; reason?: string; remaining?: number }
  if (!q.allowed) return json(429, { error: 'quota', scope: q.reason ?? 'user' })
  return { userId: user.user.id, remaining: q.remaining ?? 0 }
}

export async function readBody<T>(req: Request): Promise<T | Response> {
  const text = await req.text()
  if (text.length > MAX_BODY) return json(413, { error: 'too_large' })
  try {
    return JSON.parse(text) as T
  } catch {
    return json(400, { error: 'bad_json' })
  }
}

/** Map a model / gateway failure to a calm response the UI can explain. */
export function aiFailure(err: unknown): Response {
  const status = (err as { statusCode?: number })?.statusCode
  const name = (err as { name?: string })?.name ?? ''
  console.error('AI call failed', name, status, (err as Error)?.message?.slice(0, 300))
  if (status === 429 || /RateLimit/i.test(name)) return json(429, { error: 'quota', scope: 'provider' })
  if (status === 402 || /Credit|Payment/i.test(name)) return json(429, { error: 'quota', scope: 'provider' })
  return json(503, { error: 'ai_unavailable', reason: 'provider' })
}

export const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : '')
