import { ArrowRight, Bug, CheckCircle2, Code2, Gauge, ListChecks, Repeat, Sparkles, Terminal, Timer } from 'lucide-react'
import { COURSE, OBJECTIVES, BANK } from '../lib/bank'
import { useApp } from '../state'
import { LinkBtn, Card, CodeBlock } from '../components/ui'

const FEATURES = [
  { Icon: ListChecks, title: 'Mapped to objectives', body: 'Every question is tagged to one of 11 course objectives, written in our own words from the public course description.' },
  { Icon: Terminal, title: 'Real Python grading', body: 'Your code runs in a sandboxed Python inside your browser and is checked against hidden tests. No server, no waiting.' },
  { Icon: Repeat, title: 'Spaced repetition', body: 'Missed questions come back in minutes; ones you know drift out to days and weeks (SM-2).' },
  { Icon: Gauge, title: 'Mastery map', body: 'See which objectives are proficient and which need work, weighted the way a mock OA is.' },
  { Icon: Timer, title: 'Timed mock OA', body: '25 mixed questions in 60 minutes, no feedback until you submit, results broken down by objective.' },
  { Icon: Sparkles, title: 'Optional AI extras', body: 'Hints, mistake explanations and fresh questions on a free tier with strict daily caps. The app works fully without them.' },
]

const SAMPLE = `total = 0
for n in range(1, 6):
    if n % 2 == 0:
        continue
    total += n
print(total)`

export function Landing() {
  const { signedIn } = useApp()
  const counts = { mcq: 0, output: 0, bug: 0, code: 0 }
  for (const q of BANK) counts[q.type]++
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-3 font-mono text-sm font-semibold uppercase tracking-widest text-teal">{COURSE.code} · {COURSE.title}</p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Study Python like a <span className="hl">lab notebook</span>, not a cram sheet.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            {BANK.length} original practice questions across every objective — predict the output, find the bug, write the code — graded instantly by real Python, with spaced repetition that remembers what you miss.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {signedIn ? (
              <LinkBtn to="/dashboard" tip="Open your mastery dashboard" variant="hl" size="lg">
                Open my lab <ArrowRight aria-hidden="true" size={20} />
              </LinkBtn>
            ) : (
              <>
                <LinkBtn to="/demo" tip="Start right away as a guest; guest data is deleted after a day" variant="hl" size="lg">
                  Try the demo <ArrowRight aria-hidden="true" size={20} />
                </LinkBtn>
                <LinkBtn to="/login" tip="Create a free account to keep your progress" variant="ghost" size="lg">
                  Create an account
                </LinkBtn>
              </>
            )}
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {[
              ['Multiple choice', counts.mcq],
              ['Predict the output', counts.output],
              ['Find the bug', counts.bug],
              ['Write the code', counts.code],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="font-display text-2xl font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Card as="article" className="relative rotate-[0.6deg]" aria-labelledby="sample-q">
          <div className="absolute -top-3 right-6 rotate-3 rounded-md border-2 border-ink bg-coral px-2 py-0.5 font-mono text-xs font-bold text-on-hl">sample</div>
          <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-teal">04 · Loops · Predict the output</p>
          <h2 id="sample-q" className="mb-3 font-display text-xl font-semibold">What does this program print?</h2>
          <CodeBlock code={SAMPLE} label="Sample question code" />
          <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-good bg-good-bg p-3 text-good">
            <CheckCircle2 aria-hidden="true" className="shrink-0" />
            <p className="text-sm">
              <strong>9.</strong> <code>continue</code> skips the even numbers, so only 1 + 3 + 5 is added.
            </p>
          </div>
        </Card>
      </section>

      <section aria-labelledby="features">
        <h2 id="features" className="mb-5 font-display text-3xl font-bold">What’s on the bench</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <Card key={title} as="article">
              <Icon aria-hidden="true" className="mb-3 text-teal" />
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="objectives" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 id="objectives" className="font-display text-3xl font-bold">The objectives</h2>
          <p className="mt-3 text-muted">{COURSE.note}</p>
          <div className="mt-5 flex gap-3 text-sm">
            <span className="flex items-center gap-1.5"><Code2 aria-hidden="true" size={16} className="text-teal" /> {COURSE.competencies[0]?.title}</span>
            <span className="flex items-center gap-1.5"><Bug aria-hidden="true" size={16} className="text-pen" /> {COURSE.competencies[1]?.title}</span>
          </div>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2">
          {OBJECTIVES.map((o) => (
            <li key={o.id} className="flex items-baseline gap-3 rounded-xl border-2 border-line bg-card px-3 py-2">
              <span className="font-mono text-sm font-bold text-teal">{o.code}</span>
              <span className="font-medium">{o.title}</span>
              <span className="ml-auto font-mono text-xs text-muted">{o.weight}%</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
