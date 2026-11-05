import { useEffect, useId, useSyncExternalStore } from 'react'
import { Square, Volume2 } from 'lucide-react'
import { NO_VOICE_TIP, SILENT_SWITCH_HINT, speaker } from '../lib/speech'
import { Btn } from './ui'

function subscribe(fn: () => void) {
  return speaker.subscribe(fn)
}

/**
 * Opt-in read-aloud. Speech starts only when this button is pressed.
 * Unmount, route changes, and any other Listen button cancel it.
 */
export function ListenButton({
  text,
  label = 'Listen',
  tip = 'Read this aloud. Sound starts only when you press Listen.',
  size = 'sm',
}: {
  text: string
  label?: string
  tip?: string
  size?: 'sm' | 'md'
}) {
  const id = useId()
  const activeId = useSyncExternalStore(subscribe, () => speaker.activeId, () => null)
  const error = useSyncExternalStore(subscribe, () => speaker.error, () => null)
  const voicesUnavailable = useSyncExternalStore(subscribe, () => speaker.voicesUnavailable, () => false)
  const speaking = activeId === id
  const supported = speaker.supported
  const problem = error?.id === id ? error.message : null

  useEffect(() => {
    return () => {
      if (speaker.activeId === id) speaker.stop()
    }
  }, [id])

  if (!text.trim()) return null

  if (!supported) {
    return (
      <Btn tip="Read aloud is not available in this browser. You can still read the text on screen." size={size} variant="plain" disabled>
        <Volume2 aria-hidden="true" size={16} /> {label}
      </Btn>
    )
  }

  if (voicesUnavailable && !speaking) {
    return (
      <Btn tip={NO_VOICE_TIP} size={size} variant="plain" disabled>
        <Volume2 aria-hidden="true" size={16} /> {label}
      </Btn>
    )
  }

  const idleTip = tip.includes('silent switch') ? tip : `${tip} ${SILENT_SWITCH_HINT}`

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-2">
      <Btn
        tip={speaking ? 'Stop the voice' : idleTip}
        size={size}
        variant={speaking ? 'hl' : 'ghost'}
        aria-pressed={speaking}
        aria-errormessage={problem ? `${id}-speech-error` : undefined}
        className={speaking ? 'listen-live' : ''}
        onClick={() => speaker.toggle(id, text)}
      >
        {speaking ? <Square aria-hidden="true" size={14} /> : <Volume2 aria-hidden="true" size={16} />}
        {speaking ? 'Stop' : label}
      </Btn>
      {speaking && (
        <span role="status" className="text-xs font-semibold uppercase tracking-wide text-teal">
          Speaking
        </span>
      )}
      {problem && !speaking && (
        <span id={`${id}-speech-error`} role="alert" className="max-w-64 text-xs font-semibold leading-snug text-bad">
          {problem}
        </span>
      )}
    </span>
  )
}
