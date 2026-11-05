/**
 * Optional read-aloud via the browser's built-in speechSynthesis.
 * Nothing here speaks until `speak` or `toggle` is called from a user action.
 * No paid TTS, no network, no API key.
 *
 * Phones are fussy about this API:
 * - The first `speak()` has to happen in the tap, with no timer or voiceschanged wait in front of it.
 * - iOS drops audio when `lang` is forced (for example `en-US`) before a real voice exists, and it
 *   often ignores text passed only to the SpeechSynthesisUtterance constructor.
 * - Chrome on Android accepts `speak()` while the engine is paused and then stays silent unless
 *   `resume()` runs in that same tap. `cancel()` on an idle engine is enough to pause it, so a
 *   fresh Listen must not cancel first.
 * - A dropped utterance often fires no `end`, or fires `canceled`, and the button used to sit on
 *   "Speaking". Failures clear that state and surface `SPEECH_FAILED`.
 */

export interface SpeechVoice {
  lang: string
  name?: string
  default?: boolean
  localService?: boolean
  voiceURI?: string
}

export interface SpeechUtterance {
  text: string
  lang: string
  rate: number
  voice?: SpeechVoice | null
  onend: (() => void) | null
  onerror: ((ev: { error?: string }) => void) | null
  onstart?: (() => void) | null
}

export interface SpeechSynth {
  cancel: () => void
  speak: (utterance: SpeechUtterance) => void
  getVoices?: () => SpeechVoice[]
  resume?: () => void
  speaking?: boolean
  pending?: boolean
  paused?: boolean
  addEventListener?: (type: string, listener: () => void) => void
  onvoiceschanged?: (() => void) | null
}

/** How long to wait before treating a speak() that never starts as silence. */
export const SILENCE_GRACE_MS = 1500
/** How long to wait for getVoices()/voiceschanged before disabling Listen. */
export const VOICE_SETTLE_MS = 2000

export const SPEECH_FAILED = "Couldn't play voice. Check your volume, or try headphones."
export const NO_VOICE_TIP = 'No text-to-speech voice is available on this device. You can still read the text on screen.'
export const SILENT_SWITCH_HINT = "If nothing plays, check volume and the phone's silent switch."

export function toSpokenText(raw: string): string {
  const noFence = raw.replace(/```[a-z]*\n?([\s\S]*?)```/gi, ' $1 ')
  const plain = noFence
    .replace(/`([^`]+)`/g, '$1')
    // Bold is **like this**, with no space against the markers. Python's ** operator
    // has spaces around it (2 ** 3), so it is left alone for read-aloud.
    .replace(/\*\*([^\s*](?:[^*]*[^\s*])?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
  // Keep * and _. Lessons speak Python (** for powers, total_cost, __name__).
  // Bold and list markers are already removed above.
  return plain
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.!?])\s*\./g, '$1')
    .trim()
}

/**
 * Keep each utterance short. Chrome (including Android) silently stops an utterance
 * after about 15 seconds and sometimes never fires `end`, which used to freeze Listen.
 * 120 characters is roughly eight seconds at the rate we use.
 */
export function chunkSpeech(text: string, max = 120): string[] {
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
  return grouped.flatMap((s) => (s.length <= max ? [s] : hardSplit(s, max)))
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

/** Prefer a local voice whose lang matches, including iOS tags like `en_US`. */
export function pickVoice(voices: readonly SpeechVoice[], preferred = 'en-US'): SpeechVoice | null {
  if (!voices.length) return null
  const norm = (lang: string) => lang.trim().toLowerCase().replace(/_/g, '-')
  const want = norm(preferred)
  const prefix = want.split('-')[0] || 'en'
  let best: SpeechVoice | null = null
  let bestRank = Infinity
  for (const voice of voices) {
    const lang = norm(voice.lang || '')
    const english = lang === prefix || lang.startsWith(`${prefix}-`)
    let rank = 5
    if (lang === want && voice.localService) rank = 0
    else if (lang === want) rank = 1
    else if (english && voice.default) rank = 2
    else if (english) rank = 3
    else if (voice.default) rank = 4
    if (rank < bestRank) {
      best = voice
      bestRank = rank
    }
  }
  return best
}

export interface SpeechError {
  id: string
  message: string
}

export interface Speaker {
  readonly activeId: string | null
  readonly supported: boolean
  /** True once we know this engine will not produce a voice. */
  readonly voicesUnavailable: boolean
  readonly error: SpeechError | null
  speak: (id: string, text: string) => void
  stop: () => void
  toggle: (id: string, text: string) => void
  subscribe: (listener: () => void) => () => void
}

export function createSpeaker(synth: SpeechSynth | null, makeUtterance?: (text: string) => SpeechUtterance): Speaker {
  const make = makeUtterance ?? browserUtterance
  const listeners = new Set<() => void>()
  let activeId: string | null = null
  let error: SpeechError | null = null
  let token = 0
  let voiceList: SpeechVoice[] | null = synth?.getVoices ? [] : null
  let voicesUnavailable = false
  let inflight: SpeechUtterance[] = []
  const speechTimers = new Set<ReturnType<typeof setTimeout>>()
  const voiceTimers = new Set<ReturnType<typeof setTimeout>>()
  let chunkTimer: ReturnType<typeof setTimeout> | undefined

  function emit() {
    listeners.forEach((fn) => fn())
  }

  function setActive(id: string | null) {
    if (activeId === id) return
    activeId = id
    emit()
  }

  function clearChunkTimer() {
    if (chunkTimer === undefined) return
    clearTimeout(chunkTimer)
    speechTimers.delete(chunkTimer)
    chunkTimer = undefined
  }

  function clearSpeechTimers() {
    clearChunkTimer()
    for (const id of speechTimers) clearTimeout(id)
    speechTimers.clear()
  }

  function after(bucket: Set<ReturnType<typeof setTimeout>>, ms: number, fn: () => void) {
    const id = setTimeout(() => {
      bucket.delete(id)
      fn()
    }, ms)
    bucket.add(id)
  }

  function resume() {
    try {
      synth?.resume?.()
    } catch {
      // Some engines throw if resume() runs while idle. Speaking still proceeds.
    }
  }

  function readVoices(): SpeechVoice[] {
    if (!synth?.getVoices) return []
    try {
      return synth.getVoices()
    } catch {
      return []
    }
  }

  function pullVoices() {
    const list = readVoices()
    if (!list.length) return false
    const becameAvailable = voicesUnavailable || !voiceList?.length
    voiceList = list
    voicesUnavailable = false
    if (becameAvailable) emit()
    return true
  }

  function watchVoices() {
    if (!synth?.getVoices) return
    pullVoices()
    if (voiceList?.length) return
    const onChange = () => {
      pullVoices()
    }
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', onChange)
    else synth.onvoiceschanged = onChange
    // Safari often fills getVoices() a moment later and never fires voiceschanged.
    // These timers stay up across stop() — route changes must not forget to load voices.
    for (const ms of [100, 400, 1000]) after(voiceTimers, ms, () => pullVoices())
    after(voiceTimers, VOICE_SETTLE_MS, () => {
      if (pullVoices() || voiceList?.length) return
      if (voicesUnavailable) return
      voicesUnavailable = true
      emit()
    })
    // A late list (no event) should re-enable the button rather than leave it off.
    after(voiceTimers, 5000, () => pullVoices())
  }

  function fail(mine: number, id: string) {
    if (!synth || token !== mine) return
    token += 1
    clearSpeechTimers()
    inflight = []
    error = { id, message: SPEECH_FAILED }
    activeId = null
    emit()
    try {
      synth.cancel()
    } catch {
      // The engine already failed; the button still has to leave "Speaking".
    }
  }

  function applyVoice(u: SpeechUtterance) {
    pullVoices()
    const voices = voiceList ?? []
    const voice = voices.length ? pickVoice(voices) : null
    if (voice) {
      // Use the voice's own tag (`en_US` on iOS). Forcing `en-US` when it does not
      // match a loaded voice is a known cause of silent speech.
      u.lang = voice.lang || 'en-US'
      try {
        u.voice = voice
      } catch {
        // Chrome throws if this is not a real SpeechSynthesisVoice. Keep the lang and speak anyway.
        try {
          u.voice = null
        } catch {
          // The setter rejects every value; lang is already set.
        }
      }
      return
    }
    u.voice = null
    if (synth?.getVoices) u.lang = ''
    else u.lang = 'en-US'
  }

  const speaker: Speaker = {
    get activeId() {
      return activeId
    },
    supported: synth !== null,
    get voicesUnavailable() {
      return voicesUnavailable
    },
    get error() {
      return error
    },
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
      clearSpeechTimers()
      error = null
      inflight = []

      if (parts.length === 0) {
        try {
          synth.cancel()
        } catch {
          // Nothing to read; cancelling is only to drop a previous target.
        }
        setActive(null)
        return
      }

      pullVoices()
      if (voicesUnavailable) {
        setActive(null)
        return
      }

      // Cancel only when the engine is already busy. cancel() then speak() in the
      // same turn is silent on iOS, and on Android it leaves the synth paused.
      const busy = Boolean(synth.speaking || synth.pending)
      if (busy) {
        try {
          synth.cancel()
        } catch {
          // Keep going; the new utterance is the one the tap asked for.
        }
        resume()
      }

      setActive(id)
      let started = false

      const run = (i: number) => {
        if (token !== mine) return
        if (i >= parts.length) {
          clearSpeechTimers()
          inflight = []
          setActive(null)
          return
        }
        const u = make(parts[i])
        // iOS ignores text passed only through the constructor.
        u.text = parts[i]
        applyVoice(u)
        u.rate = 0.96
        u.onstart = () => {
          if (token !== mine) return
          started = true
        }
        u.onend = () => {
          if (token !== mine) return
          clearChunkTimer()
          run(i + 1)
        }
        u.onerror = () => {
          if (token !== mine) return
          fail(mine, id)
        }
        // Keep the utterance alive until it ends. iOS will drop speech whose utterance was collected.
        inflight.push(u)
        try {
          synth.speak(u)
        } catch {
          fail(mine, id)
          return
        }
        // Android Chrome queues speak() into a paused synth and plays nothing until resume().
        resume()
        clearChunkTimer()
        const budget = 5000 + parts[i].length * 120
        const budgetId = setTimeout(() => {
          speechTimers.delete(budgetId)
          if (chunkTimer === budgetId) chunkTimer = undefined
          if (token !== mine) return
          fail(mine, id)
        }, budget)
        chunkTimer = budgetId
        speechTimers.add(budgetId)
      }

      try {
        run(0)
      } catch {
        fail(mine, id)
        return
      }
      if (token !== mine) return
      after(speechTimers, SILENCE_GRACE_MS, () => {
        if (token !== mine || started) return
        resume()
        if (token !== mine || started) return
        const live = Boolean(synth.speaking || synth.pending)
        if (!live || synth.paused) fail(mine, id)
      })
    },
    stop() {
      token += 1
      clearSpeechTimers()
      inflight = []
      const hadError = error !== null
      error = null
      try {
        synth?.cancel()
      } catch {
        // Stopping is local state first; a throwing engine should still reset the button.
      }
      if (activeId !== null) setActive(null)
      else if (hadError) emit()
    },
    toggle(id, text) {
      if (activeId === id) speaker.stop()
      else speaker.speak(id, text)
    },
  }

  watchVoices()
  return speaker
}

function browserUtterance(text: string): SpeechUtterance {
  const utterance = new SpeechSynthesisUtterance()
  utterance.text = text
  return utterance as unknown as SpeechUtterance
}

function browserSynth(): SpeechSynth | null {
  if (typeof window === 'undefined') return null
  const synth = window.speechSynthesis
  if (!synth || typeof synth.speak !== 'function' || typeof synth.cancel !== 'function') return null
  return synth as unknown as SpeechSynth
}

/** Shared speaker so starting one Listen target cancels any other. */
export const speaker = createSpeaker(browserSynth())

export function stopSpeech() {
  speaker.stop()
}
