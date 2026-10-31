import { Fragment } from 'react'

/** Inline `code` and **bold** only. Text is rendered as text, never as HTML. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, j) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code key={j} className="rounded bg-sunk px-1 py-0.5 font-mono text-[0.88em] font-normal">{part.slice(1, -1)}</code>
        ) : part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={j}>{part}</Fragment>
        ),
      )}
    </>
  )
}

export function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="mb-2 whitespace-pre-line last:mb-0">
          <Inline text={para} />
        </p>
      ))}
    </>
  )
}
