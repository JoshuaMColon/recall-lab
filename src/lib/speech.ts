/**
 * Optional read-aloud via the browser's built-in speechSynthesis.
 * Nothing here speaks until `speak` or `toggle` is called from a user action.
 * No paid TTS, no network, no API key.
 */

export interface SpeechUtterance {
  text: string
  lang: string
  rate: number
  onend: (() => void) | null
  onerror: ((ev: { error?: string }) => void) | null
}

export interface SpeechSynth {
  cancel: () => void
  speak: (utterance: SpeechUtterance) => void
}

export function toSpokenText(raw: string): string {
  const noFence = raw.replace(/```[a-z]*\n?([\s\S]*?)```/gi, ' $1 ')
  const plain = noFence
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[*_]/g, '')
  return plain
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.!?])\s*\./g, '$1')
    .trim()
}

/** Keep each utterance short so browsers do not cut long readings off. */
export function chunkSpeech(text: string, max = 220): string[] {
  const clean = text.trim()
  if (!clean) return []
  const parts = clean.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [clean]
  const grouped: string[] = []
  let buf = ''
  for (const part of parts) {
    const bit = part.trim()
    if (!bit) continue
    const next = buf ? `${buf} ${bit}` : bit
    if (buf && next.length > max) {
      grouped.push(buf)
      buf = bit
    } else {
      buf = next
    }
  }
  if (buf) grouped.push(buf)
  return grouped.flatMap((s) => (s.length <= max * 1.6 ? [s] : hardSplit(s, max)))
}

function hardSplit(s: string, max: number): string[] {
  const words = s.split(/\s+/)
  const out: string[] = []
  let buf = ''
  for (const w of words) {
    const next = buf ? `${buf} ${w}` : w
    if (buf && next.length > max) {
      out.push(buf)
      buf = w
    } else {
      buf = next
    }
  }
  if (buf) out.push(buf)
  return out
}

export interface Speaker {
  readonly activeId: string | null
  readonly supported: boolean
  speak: (id: string, text: string) => void
  stop: () => void
  toggle: (id: string, text: string) => void
  subscribe: (listener: () => void) => () => void
}

export function createSpeaker(synth: SpeechSynth | null, makeUtterance?: (text: string) => SpeechUtterance): Speaker {
  const make = makeUtterance ?? ((text: string) => new SpeechSynthesisUtterance(text))
  const listeners = new Set<() => void>()
  let activeId: string | null = null
  let token = 0

  function emit() {
    listeners.forEach((fn) => fn())
  }

  function setActive(id: string | null) {
    if (activeId === id) return
    activeId = id
    emit()
  }

  const speaker: Speaker = {
    get activeId() {
      return activeId
    },
    supported: synth !== null,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    speak(id, text) {
      if (!synth) return
      const spoken = toSpokenText(text)
      const parts = chunkSpeech(spoken)
      token += 1
      const mine = token
      synth.cancel()
      if (parts.length === 0) {
        setActive(null)
        return
      }
      setActive(id)
      const run = (i: number) => {
        if (token !== mine) return
        if (i >= parts.length) {
          setActive(null)
          return
        }
        const u = make(parts[i])
        u.lang = 'en-US'
        u.rate = 0.96
        u.onend = () => run(i + 1)
        u.onerror = (ev) => {
          if (token !== mine) return
          if (ev.error === 'interrupted' || ev.error === 'canceled' || ev.error === 'cancelled') return
          setActive(null)
        }
        synth.speak(u)
      }
      run(0)
    },
    stop() {
      token += 1
      synth?.cancel()
      setActive(null)
    },
    toggle(id, text) {
      if (activeId === id) speaker.stop()
      else speaker.speak(id, text)
    },
  }
  return speaker
}

function browserSynth(): SpeechSynth | null {
  if (typeof window === 'undefined') return null
  const synth = window.speechSynthesis
  if (!synth || typeof synth.speak !== 'function' || typeof synth.cancel !== 'function') return null
  return synth
}

/** Shared speaker so starting one Listen target cancels any other. */
export const speaker = createSpeaker(browserSynth())

export function stopSpeech() {
  speaker.stop()
}
