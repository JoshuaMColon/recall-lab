import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { navigate } from '../router'
import { useApp } from '../state'
import { Btn, Card, LinkBtn } from '../components/ui'

export function Login() {
  const { session, isGuest, local } = useApp()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null)

  useEffect(() => {
    if (session && !isGuest) navigate('/dashboard', true)
  }, [session, isGuest])

  if (local || !supabase) {
    return (
      <Card className="mx-auto max-w-md">
        <h1 className="font-display text-2xl font-bold">Accounts are off in this build</h1>
        <p className="mt-2 text-muted">This copy runs without a backend, so your progress is saved in this browser only.</p>
        <div className="mt-4">
          <LinkBtn to="/dashboard" tip="Go to your dashboard" variant="hl">Start studying</LinkBtn>
        </div>
      </Card>
    )
  }
  const db = supabase

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'up') {
        const { data, error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/dashboard` } })
        if (error) throw error
        if (!data.session) setMsg({ tone: 'good', text: 'Check your inbox for a confirmation link, then sign in.' })
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setMsg({ tone: 'bad', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl items-start gap-8 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl font-bold">{mode === 'in' ? 'Welcome back, navigator.' : 'Chart a new course.'}</h1>
        <p className="mt-3 text-muted">An account keeps your attempts, review schedule and mock results across devices. Guests can try everything, but their data is deleted after a day.</p>
        {isGuest && <p className="mt-3 rounded-xl border-2 border-dashed border-edge p-3 text-sm">You are in a guest session. Signing in to an account starts a fresh star chart; guest progress is not moved over.</p>}
      </div>
      <Card>
        <div role="tablist" aria-label="Account" className="mb-5 grid grid-cols-2 gap-2">
          {(['in', 'up'] as const).map((m) => (
            <Btn key={m} tip={m === 'in' ? 'I already have an account' : 'Create a new account'} role="tab" aria-selected={mode === m} variant={mode === m ? 'hl' : 'plain'} size="sm" block onClick={() => setMode(m)}>
              {m === 'in' ? 'Sign in' : 'Sign up'}
            </Btn>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Email</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border-2 border-edge bg-paper px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-edge bg-paper px-3 py-2"
            />
            {mode === 'up' && <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>}
          </label>
          {msg && (
            <p role="alert" className={`rounded-xl border-2 p-3 text-sm ${msg.tone === 'good' ? 'border-good bg-good-bg text-good' : 'border-bad bg-bad-bg text-bad'}`}>
              {msg.text}
            </p>
          )}
          <Btn tip={mode === 'in' ? 'Sign in with this email and password' : 'Create the account'} type="submit" variant="primary" block disabled={busy}>
            {busy && <Loader2 aria-hidden="true" className="animate-spin" size={18} />}
            {mode === 'in' ? 'Sign in' : 'Create account'}
          </Btn>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Just looking? <a href="/demo" className="font-semibold text-teal underline" onClick={(e) => { e.preventDefault(); navigate('/demo') }}>Try the demo</a>
        </p>
      </Card>
    </div>
  )
}

// One guest sign-in at a time, even if React runs the effect twice. Cleared
// once it settles, so "Try the demo" after signing out starts a fresh guest
// instead of replaying the old (already signed-out) sign-in.
let demoStart: ReturnType<NonNullable<typeof supabase>['auth']['signInAnonymously']> | null = null

export function Demo() {
  const { session } = useApp()
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    if (!supabase || session) {
      navigate('/dashboard', true)
      return
    }
    let live = true
    const start = (demoStart ??= supabase.auth.signInAnonymously())
    void start.then(({ error }) => {
      if (demoStart === start) demoStart = null
      if (!live) return
      if (error) setErr(error.message)
      else navigate('/dashboard', true)
    })
    return () => {
      live = false
    }
  }, [session])
  return (
    <Card className="mx-auto max-w-md text-center">
      {err ? (
        <>
          <h1 className="font-display text-2xl font-bold">Couldn’t start the demo</h1>
          <p role="alert" className="mt-2 text-bad">{err}</p>
          <div className="mt-4"><LinkBtn to="/login" tip="Use an account instead" variant="hl">Sign in instead</LinkBtn></div>
        </>
      ) : (
        <p role="status" className="flex items-center justify-center gap-2 font-semibold">
          <Loader2 aria-hidden="true" className="animate-spin" /> Setting up a guest star chart…
        </p>
      )}
    </Card>
  )
}
