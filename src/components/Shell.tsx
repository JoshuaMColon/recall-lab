import type { ReactNode } from 'react'
import { FlaskConical, LayoutDashboard, LogOut, Moon, NotebookPen, RotateCcw, Sun, Timer } from 'lucide-react'
import { Link, useLocation } from '../router'
import { useApp } from '../state'
import { Btn, Tip } from './ui'
import { isDue } from '../lib/srs'

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg aria-hidden="true" viewBox="0 0 64 64" className="h-8 w-8">
        <rect width="64" height="64" rx="14" fill="var(--ink)" />
        <path d="M14 44 L26 20 L38 36 L50 16" fill="none" stroke="var(--hl)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="16" r="5" fill="var(--coral)" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">Recall Lab</span>
    </span>
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useApp()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <Btn tip={`Switch to ${next} mode`} iconOnly variant="ghost" size="sm" side="bottom" onClick={() => setTheme(next)} aria-pressed={theme === 'dark'}>
      {theme === 'dark' ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
    </Btn>
  )
}

const NAV = [
  { to: '/dashboard', label: 'Dashboard', tip: 'Your mastery map and readiness', Icon: LayoutDashboard },
  { to: '/practice', label: 'Practice', tip: 'Pick objectives and question types', Icon: NotebookPen },
  { to: '/review', label: 'Review', tip: 'Questions due for spaced repetition', Icon: RotateCcw },
  { to: '/mock', label: 'Mock OA', tip: 'A timed practice exam, graded at the end', Icon: Timer },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { path } = useLocation()
  const { signedIn, isGuest, local, signOut, session, data, syncError } = useApp()
  const due = data.reviews.filter((r) => isDue(r)).length
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-hl focus:px-3 focus:py-2 focus:text-on-hl">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Tip tip="Recall Lab home" side="bottom">
            {(d) => (
              <Link to="/" {...d} className="rounded-lg">
                <Logo />
              </Link>
            )}
          </Tip>
          {signedIn && (
            <nav aria-label="Main" className="ml-4 hidden gap-1 md:flex">
              {NAV.map(({ to, label, tip, Icon }) => (
                <Tip key={to} tip={tip} side="bottom">
                  {(d) => (
                    <Link
                      to={to}
                      {...d}
                      aria-current={path.startsWith(to) ? 'page' : undefined}
                      className={`press flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold !shadow-none ${
                        path.startsWith(to) ? 'border-ink bg-hl text-on-hl' : 'border-transparent hover:border-ink'
                      }`}
                    >
                      <Icon aria-hidden="true" size={16} />
                      {label}
                      {to === '/review' && due > 0 && <span className="rounded-full bg-coral px-1.5 text-xs text-on-hl">{due}</span>}
                    </Link>
                  )}
                </Tip>
              ))}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isGuest && <span className="hidden rounded-full border-2 border-dashed border-ink px-2 py-0.5 text-xs font-semibold sm:inline">Guest · resets in 24 h</span>}
            {local && signedIn && <span className="hidden rounded-full border-2 border-dashed border-ink px-2 py-0.5 text-xs font-semibold sm:inline">Saved in this browser</span>}
            <ThemeToggle />
            {session && (
              <Btn tip={isGuest ? 'End the guest session (its progress is deleted within a day)' : `Sign out ${session.user.email ?? ''}`} iconOnly size="sm" side="bottom" onClick={() => void signOut()}>
                <LogOut aria-hidden="true" size={18} />
              </Btn>
            )}
            {!signedIn && path !== '/login' && (
              <Tip tip="Sign in or create a free account to keep your progress" side="bottom">
                {(d) => (
                  <Link to="/login" {...d} className="press rounded-lg border-2 border-ink bg-card px-3 py-1.5 text-sm font-semibold">
                    Sign in
                  </Link>
                )}
              </Tip>
            )}
          </div>
        </div>
        {signedIn && (
          <nav aria-label="Main (mobile)" className="grid grid-cols-4 gap-1 border-t-2 border-ink px-2 py-1.5 md:hidden">
            {NAV.map(({ to, label, tip, Icon }) => (
              <Tip key={to} tip={tip} side="bottom" block>
                {(d) => (
                  <Link
                    to={to}
                    {...d}
                    aria-current={path.startsWith(to) ? 'page' : undefined}
                    className={`press flex flex-1 flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-1 text-xs font-semibold !shadow-none ${
                      path.startsWith(to) ? 'border-ink bg-hl text-on-hl' : 'border-transparent'
                    }`}
                  >
                    <Icon aria-hidden="true" size={18} />
                    {label}
                    {to === '/review' && due > 0 && <span className="sr-only">, {due} due</span>}
                  </Link>
                )}
              </Tip>
            ))}
          </nav>
        )}
      </header>
      {syncError && (
        <div role="status" className="border-b-2 border-bad bg-bad-bg px-4 py-2 text-center text-sm text-bad">
          {syncError}
        </div>
      )}
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t-2 border-ink/20 px-4 py-5 text-center text-xs text-muted">
        <FlaskConical aria-hidden="true" size={14} className="mr-1 inline" />
        Recall Lab is an independent study tool. It is not affiliated with or endorsed by WGU or zyBooks; all questions are original.
      </footer>
    </div>
  )
}
