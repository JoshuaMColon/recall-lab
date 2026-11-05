import { Library } from 'lucide-react'
import { COURSE, objectiveById } from '../lib/bank'
import { COMPETENCY_BLURB, LESSONS, LESSONS_INTRO, lessonPath, lessonsIndexSpeech } from '../content/lessons'
import { useApp } from '../state'
import { ListenButton } from '../components/ListenButton'
import { Card, LinkBtn } from '../components/ui'
import { Prose } from '../components/Prose'

export function Lessons() {
  const { signedIn } = useApp()
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="mb-2 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-widest text-teal">
          <Library aria-hidden="true" size={16} /> Lessons
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">The ideas, one topic at a time</h1>
        <div className="mt-3 text-lg leading-relaxed text-muted">
          <Prose text={LESSONS_INTRO} />
        </div>
        <div className="mt-4">
          <ListenButton
            text={lessonsIndexSpeech()}
            label="Listen to the lesson list"
            tip="Read the lesson list aloud. Nothing plays until you press this."
            size="md"
          />
        </div>
      </header>

      {COURSE.competencies.map((competency) => {
        const topics = LESSONS.filter((lesson) => objectiveById.get(lesson.objectiveId)?.competency === competency.id)
        return (
          <section key={competency.id} aria-labelledby={`competency-${competency.id}`} className="space-y-3">
            <div>
              <h2 id={`competency-${competency.id}`} className="font-display text-2xl font-semibold">
                Competency {competency.id} · {competency.title}
              </h2>
              <p className="mt-2 text-muted">{COMPETENCY_BLURB[competency.id] ?? competency.summary}</p>
            </div>
            <ul className="space-y-2">
              {topics.map((lesson) => {
                const objective = objectiveById.get(lesson.objectiveId)!
                return (
                  <li key={lesson.objectiveId}>
                    <LinkBtn
                      to={lessonPath(lesson)}
                      tip={`Open the beginner lesson: ${objective.title}`}
                      side="bottom"
                      block
                      className="!h-auto !items-start !justify-start whitespace-normal py-3 text-left"
                    >
                      <span className="font-mono text-teal">{objective.code}</span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span>{objective.title}</span>
                        <span className="text-sm font-normal text-muted">{lesson.blurb}</span>
                      </span>
                    </LinkBtn>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <Card className="space-y-4">
        <p className="text-sm text-muted">{COURSE.note}</p>
        <p className="text-sm text-muted">These pages explain the ideas. Practice is where you answer questions. The how-to guide explains the rooms of the app.</p>
        <div className="flex flex-wrap gap-2">
          {signedIn ? (
            <LinkBtn to="/practice" tip="Set up a practice quiz across any topics" variant="hl">
              Go to practice
            </LinkBtn>
          ) : (
            <LinkBtn to="/demo" tip="Try the app as a guest. Guest data is deleted after a day." variant="hl">
              Try the demo
            </LinkBtn>
          )}
          <LinkBtn to="/guide" tip="A plain-language tour of the app">
            How to use
          </LinkBtn>
        </div>
      </Card>
    </div>
  )
}
