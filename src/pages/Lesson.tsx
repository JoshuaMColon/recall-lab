import { Library } from 'lucide-react'
import { COURSE, objectiveById } from '../lib/bank'
import { examplesSpeech, lessonNeighbors, lessonPath, lessonSpeech, practicePath, sectionSpeech, type Lesson } from '../content/lessons'
import { useApp } from '../state'
import { ListenButton } from '../components/ListenButton'
import { Card, CodeBlock, LinkBtn } from '../components/ui'
import { Prose } from '../components/Prose'

export function LessonPage({ lesson }: { lesson: Lesson }) {
  const { signedIn } = useApp()
  const objective = objectiveById.get(lesson.objectiveId)!
  const competency = COURSE.competencies.find((item) => item.id === objective.competency)!
  const { prev, next } = lessonNeighbors(lesson)
  const prevObjective = prev ? objectiveById.get(prev.objectiveId) : undefined
  const nextObjective = next ? objectiveById.get(next.objectiveId) : undefined

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="mb-2 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-widest text-teal">
          <Library aria-hidden="true" size={16} /> {objective.code} · Competency {competency.id} · {competency.title}
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{objective.title}</h1>
        <p className="mt-3 text-lg text-muted">{lesson.blurb}</p>
        <p className="mt-2 text-sm text-muted">
          Recall Lab&apos;s own explanation for beginners. The label {objective.code} is the same topic you can practice. It is not a textbook page.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ListenButton
            text={lessonSpeech(lesson)}
            label="Listen to this lesson"
            tip="Read this whole lesson aloud. Nothing plays until you press this."
            size="md"
          />
          <LinkBtn to="/lessons" tip="Back to the list of topics" size="sm">
            All lessons
          </LinkBtn>
        </div>
      </header>

      {lesson.sections.map((section) => (
        <Card key={section.id} as="section" aria-labelledby={`lesson-${section.id}`}>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <h2 id={`lesson-${section.id}`} className="font-display text-2xl font-semibold">
              {section.title}
            </h2>
            <ListenButton
              text={sectionSpeech(section)}
              tip={`Read “${section.title}” aloud. Sound starts only when you press Listen.`}
            />
          </div>
          <div className="text-[1.02rem] leading-relaxed">
            <Prose text={section.body} />
          </div>
        </Card>
      ))}

      <Card as="section" aria-labelledby="lesson-examples">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h2 id="lesson-examples" className="font-display text-2xl font-semibold">
            Tiny examples
          </h2>
          <ListenButton
            text={examplesSpeech(lesson)}
            tip="Read the examples aloud, including the small programs. Sound starts only when you press Listen."
          />
        </div>
        <div className="space-y-6">
          {lesson.examples.map((example) => (
            <div key={example.title}>
              <h3 className="mb-2 font-display text-lg font-semibold">{example.title}</h3>
              <CodeBlock code={example.code} label={example.title} />
              <div className="mt-2 rounded-xl border border-line bg-sunk px-3 py-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">What this prints</p>
                <pre className="whitespace-pre-wrap font-mono text-sm">{example.prints.replace(/\n$/, '')}</pre>
              </div>
              <div className="mt-2 text-[1.02rem] leading-relaxed">
                <Prose text={example.note} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Practice this topic</h2>
        <p className="text-muted">
          Five questions, only this topic. After each one you see whether you were right, and a short explanation. The quiz is not timed.
          {!signedIn && ' Practice needs the guest demo or an account. You can read every lesson before that.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkBtn
            to={practicePath(objective.id)}
            tip={`Start 5 practice questions on ${objective.title}. You see the answer after each one.`}
            variant="hl"
          >
            Practice this topic
          </LinkBtn>
          {!signedIn && (
            <LinkBtn to="/demo" tip="Try the app as a guest. Guest data is deleted after a day.">
              Try the guest demo
            </LinkBtn>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          {prev && prevObjective ? (
            <LinkBtn to={lessonPath(prev)} tip={`Previous topic: ${prevObjective.title}`} size="sm">
              Previous · {prevObjective.code}
            </LinkBtn>
          ) : (
            <LinkBtn to="/lessons" tip="Back to the list of topics" size="sm">
              All lessons
            </LinkBtn>
          )}
          {next && nextObjective && (
            <LinkBtn to={lessonPath(next)} tip={`Next topic: ${nextObjective.title}`} size="sm" variant="primary" className="max-w-full whitespace-normal text-left">
              Next · {nextObjective.code} {nextObjective.title}
            </LinkBtn>
          )}
        </div>
      </Card>
    </div>
  )
}
