import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { stopSpeech } from './lib/speech'
import { navigate, useLocation } from './router'
import { useApp } from './state'
import { AppShell } from './components/Shell'
import { Card, LinkBtn } from './components/ui'
import { Landing } from './pages/Landing'
import { Demo, Login } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { Practice } from './pages/Practice'
import { Quiz } from './pages/Quiz'
import { Mock } from './pages/Mock'
import { Guide } from './pages/Guide'
import { Lessons } from './pages/Lessons'
import { LessonPage } from './pages/Lesson'
import { matchLessonPath } from './content/lessons'
import { objectiveLabel } from './lib/bank'

const TITLES: Record<string, string> = {
  '/': 'Recall Lab · D335 Python practice',
  '/login': 'Sign in · Recall Lab',
  '/demo': 'Guest demo · Recall Lab',
  '/dashboard': 'Dashboard · Recall Lab',
  '/practice': 'Practice · Recall Lab',
  '/quiz': 'Quiz · Recall Lab',
  '/review': 'Review · Recall Lab',
  '/mock': 'Mock OA · Recall Lab',
  '/guide': 'How to use · Recall Lab',
}
const PRIVATE = new Set(['/dashboard', '/practice', '/quiz', '/review', '/mock'])

function NotFound() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="font-mono text-6xl font-bold text-pen">404</p>
      <h1 className="font-display text-2xl font-bold">That page is off the star chart</h1>
      <div className="mt-4"><LinkBtn to="/" tip="Back to the home page" variant="hl">Go home</LinkBtn></div>
    </Card>
  )
}

function Loading() {
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-20 text-muted">
      <Loader2 aria-hidden="true" className="animate-spin" /> Loading your star chart…
    </p>
  )
}

export function App() {
  const { path, search } = useLocation()
  const { ready, signedIn } = useApp()
  const lessonMatch = matchLessonPath(path)

  const gated = PRIVATE.has(path) && !signedIn

  useEffect(() => {
    if (lessonMatch === 'index') document.title = 'Lessons · Recall Lab'
    else if (lessonMatch != null && lessonMatch !== 'missing') document.title = `${objectiveLabel(lessonMatch.objectiveId)} · Lessons · Recall Lab`
    else document.title = TITLES[path] ?? 'Not found · Recall Lab'
    // Back/forward does not go through navigate(); stop any in-progress reading.
    stopSpeech()
  }, [path, lessonMatch])

  useEffect(() => {
    if (ready && gated) navigate(`/login?next=${encodeURIComponent(path + search)}`, true)
  }, [ready, gated, path, search])

  let page
  if (path === '/demo') page = <Demo />
  else if (!ready || gated) page = <Loading />
  else if (path === '/') page = <Landing />
  else if (path === '/login') page = <Login />
  else if (path === '/dashboard') page = <Dashboard />
  else if (path === '/practice') page = <Practice />
  else if (path === '/quiz' || path === '/review') page = <Quiz key={path + search} />
  else if (path === '/mock') page = <Mock />
  else if (path === '/guide') page = <Guide />
  else if (lessonMatch === 'index') page = <Lessons />
  else if (lessonMatch != null && lessonMatch !== 'missing') page = <LessonPage key={lessonMatch.slug} lesson={lessonMatch} />
  else page = <NotFound />
  return <AppShell>{page}</AppShell>
}
