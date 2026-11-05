import { BookOpen } from 'lucide-react'
import { GUIDE_SECTIONS, guidePlainText } from '../content/guide'
import { useApp } from '../state'
import { ListenButton } from '../components/ListenButton'
import { Card, LinkBtn } from '../components/ui'
import { Prose } from '../components/Prose'

export function Guide() {
  const { signedIn } = useApp()
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="mb-2 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-widest text-teal">
          <BookOpen aria-hidden="true" size={16} /> How to use Recall Lab
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">A guide for your first visit</h1>
        <p className="mt-3 text-lg text-muted">
          This page is for someone who has never programmed, and never used this app. Short sentences. No surprise sound. Press Listen only if you want a section read aloud.
        </p>
        <div className="mt-4">
          <ListenButton text={guidePlainText()} label="Listen to the whole guide" tip="Read the entire guide aloud. Nothing plays until you press this." size="md" />
        </div>
      </header>

      {GUIDE_SECTIONS.map((section, index) => (
        <Card key={section.id} as="section" aria-labelledby={`guide-${section.id}`}>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <h2 id={`guide-${section.id}`} className="font-display text-2xl font-semibold">
              <span className="mr-2 font-mono text-base text-teal">{index + 1}</span>
              {section.title}
            </h2>
            <ListenButton text={`${section.title}. ${section.body}`} tip={`Read the “${section.title}” section aloud. Sound starts only when you press Listen.`} />
          </div>
          <div className="text-[1.02rem] leading-relaxed">
            <Prose text={section.body} />
          </div>
          {section.id === 'lessons' && (
            <div className="mt-4">
              <LinkBtn to="/lessons" tip="Open the lesson list, grouped by topic" variant="hl" size="sm">
                Open lessons
              </LinkBtn>
            </div>
          )}
        </Card>
      ))}

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-muted">When you are ready, start with five mixed questions. You can come back to this guide any time.</p>
        <div className="flex flex-wrap gap-2">
          {signedIn ? (
            <LinkBtn to="/practice" tip="Set up a short practice run" variant="hl">
              Start practice
            </LinkBtn>
          ) : (
            <LinkBtn to="/demo" tip="Try the app as a guest. Guest data is deleted after a day." variant="hl">
              Try the demo
            </LinkBtn>
          )}
          <LinkBtn to="/lessons" tip="Read a plain-language lesson for one topic">Lessons</LinkBtn>
          <LinkBtn to="/" tip="Back to the home page">Home</LinkBtn>
        </div>
      </Card>
    </div>
  )
}
