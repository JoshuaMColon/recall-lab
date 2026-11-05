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
export const VOICE_QUALITY_NOTE =
  'Voice quality depends on this device and browser. Some phones only include a robotic voice, and this list cannot add a voice that is not installed.'

export const VOICE_PREF_KEY = 'recall-lab:voice'
export const RATE_PREF_KEY = 'recall-lab:speech-rate'

/** Normal sits just under 1 so a long lesson is easier to follow. */
export const SPEECH_RATES = [
  { id: 'slower', label: 'Slower', rate: 0.85, tip: 'Read a little slower' },
  { id: 'normal', label: 'Normal', rate: 0.98, tip: 'Read at a normal speed' },
  { id: 'faster', label: 'Faster', rate: 1.12, tip: 'Read a little faster' },
] as const

export type SpeechRateId = (typeof SPEECH_RATES)[number]['id']

export interface VoiceOption {
  id: string
  label: string
  name: string
  lang: string
}

export interface PrefStore {
  get(key: string): string | null
  set(key: string, value: string): void
}

export function memoryPrefs(initial: Record<string, string> = {}): PrefStore {
  const data = { ...initial }
  return {
    get: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    set: (key, value) => {
      data[key] = value
    },
  }
}

function browserPrefs(): PrefStore {
  return {
    get(key) {
      try {
        if (typeof localStorage === 'undefined') return null
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    set(key, value) {
      try {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(key, value)
      } catch {
        // Private browsing can reject the write. The choice still applies until reload.
      }
    },
  }
}

export function speechRate(id: string | null | undefined): { id: SpeechRateId; rate: number } {
  const found = SPEECH_RATES.find((item) => item.id === id)
  return found ?? SPEECH_RATES[1]
}

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

function normLang(lang: string | undefined): string {
  return (lang || '').trim().toLowerCase().replace(/_/g, '-')
}

export function isEnglishVoice(voice: SpeechVoice, preferred = 'en-US'): boolean {
  const lang = normLang(voice.lang)
  const prefix = normLang(preferred).split('-')[0] || 'en'
  return lang === prefix || lang.startsWith(`${prefix}-`)
}

/**
 * Higher is a more natural voice. Name and URI are the only signals the browser gives us.
 * A local compact voice scores 0. Natural, neural, premium, and a few well-known names score higher.
 */
function voiceQuality(voice: SpeechVoice): number {
  if (!isEnglishVoice(voice)) return -1
  const blob = `${voice.name ?? ''} ${voice.voiceURI ?? ''}`.toLowerCase()
  let score = 0
  if (/\b(natural|neural)\b/.test(blob) || /neural\d/.test(blob)) score += 500
  if (/\b(wavenet|studio)\b/.test(blob)) score += 450
  if (/\b(premium|enhanced)\b/.test(blob)) score += 300
  if (/\bsamantha\b/.test(blob)) score += 220
  if (/\b(ava|zoe)\b/.test(blob)) score += 210
  if (/google\s+us\s+english/.test(blob)) score += 180
  else if (/\bgoogle\b/.test(blob)) score += 90
  if (/\bmicrosoft\b/.test(blob) && /\bonline\b/.test(blob)) score += 40
  return score
}

/** Lower is a closer locale match. Used only to break a quality tie. */
function localeRank(voice: SpeechVoice, preferred: string): number {
  const lang = normLang(voice.lang)
  const want = normLang(preferred)
  const prefix = want.split('-')[0] || 'en'
  const english = lang === prefix || lang.startsWith(`${prefix}-`)
  if (lang === want) return 0
  if (english && voice.default) return 1
  if (english) return 2
  if (voice.default) return 3
  return 4
}

/** Positive when `a` should be spoken instead of `b`. */
export function compareVoices(a: SpeechVoice, b: SpeechVoice, preferred = 'en-US'): number {
  const quality = voiceQuality(a) - voiceQuality(b)
  if (quality !== 0) return quality
  const locale = localeRank(b, preferred) - localeRank(a, preferred)
  if (locale !== 0) return locale
  const local = Number(Boolean(a.localService)) - Number(Boolean(b.localService))
  if (local !== 0) return local
  return Number(Boolean(a.default)) - Number(Boolean(b.default))
}

/**
 * Best English voice on this device.
 * Natural / neural / premium voices win over a compact local voice with the same language.
 * Falls back to any English voice, then to any voice at all.
 */
export function pickVoice(voices: readonly SpeechVoice[], preferred = 'en-US'): SpeechVoice | null {
  if (!voices.length) return null
  let best = voices[0]
  for (let i = 1; i < voices.length; i++) {
    if (compareVoices(voices[i], best, preferred) > 0) best = voices[i]
  }
  return best
}

function regionFromLang(lang: string | undefined): string {
  const norm = normLang(lang)
  if (!norm) return ''
  if (norm === 'en' || norm === 'en-us') return 'English (US)'
  if (norm === 'en-gb') return 'English (UK)'
  if (norm === 'en-au') return 'English (Australia)'
  if (norm === 'en-in') return 'English (India)'
  if (norm === 'en-ie') return 'English (Ireland)'
  if (norm === 'en-za') return 'English (South Africa)'
  if (norm === 'en-nz') return 'English (New Zealand)'
  if (norm.startsWith('en-')) return `English (${norm.slice(3).toUpperCase()})`
  return ''
}

function shortRegion(text: string): string {
  const trimmed = text.trim()
  if (/united states/i.test(trimmed)) return 'English (US)'
  if (/united kingdom|britain/i.test(trimmed)) return 'English (UK)'
  if (/australia/i.test(trimmed)) return 'English (Australia)'
  if (/india/i.test(trimmed)) return 'English (India)'
  return trimmed
}

/** A short name for the picker. The raw voice name is often a long system string. */
export function voiceLabel(voice: SpeechVoice): string {
  const raw = (voice.name || 'English voice').replace(/\s+/g, ' ').trim()
  const microsoft = raw.match(/^Microsoft\s+(.+?)\s+Online\s+\(([^)]+)\)(?:\s*[-–—]\s*(.+))?$/i)
  if (microsoft) {
    const region = microsoft[3] ? shortRegion(microsoft[3]) : regionFromLang(voice.lang)
    return region ? `${microsoft[1].trim()} (${microsoft[2].trim()}) · ${region}` : `${microsoft[1].trim()} (${microsoft[2].trim()})`
  }
  const marked = raw.match(/^(.*?)\s+\((Enhanced|Premium|Natural)\)$/i)
  if (marked) {
    const region = regionFromLang(voice.lang)
    return region ? `${marked[1].trim()} (${marked[2]}) · ${region}` : `${marked[1].trim()} (${marked[2]})`
  }
  if (/google\s+.+\s+english/i.test(raw)) return raw
  const region = regionFromLang(voice.lang)
  if (region && !/english/i.test(raw)) return `${raw} · ${region}`
  return raw
}

export function voiceIdentity(voice: SpeechVoice): string {
  const uri = (voice.voiceURI || '').trim()
  if (uri) return `uri:${uri}`
  return `name:${(voice.name || '').trim()}|${normLang(voice.lang)}`
}

function withIds(voices: readonly SpeechVoice[]): { voice: SpeechVoice; id: string }[] {
  const seen = new Map<string, number>()
  return voices.map((voice) => {
    const base = voiceIdentity(voice)
    const dup = seen.get(base) ?? 0
    seen.set(base, dup + 1)
    return { voice, id: dup === 0 ? base : `${base}#${dup + 1}` }
  })
}

/** English voices only, best first, with stable ids and friendly labels. */
export function englishVoiceOptions(voices: readonly SpeechVoice[]): VoiceOption[] {
  const ranked = withIds(voices)
    .filter((item) => isEnglishVoice(item.voice))
    .sort((a, b) => compareVoices(b.voice, a.voice))
  const labels = ranked.map((item) => voiceLabel(item.voice))
  const labelCount = new Map<string, number>()
  for (const label of labels) labelCount.set(label, (labelCount.get(label) ?? 0) + 1)
  const seenLabels = new Map<string, number>()
  return ranked.map((item, index) => {
    let label = labels[index]
    if ((labelCount.get(label) ?? 0) > 1) {
      const n = (seenLabels.get(label) ?? 0) + 1
      seenLabels.set(label, n)
      label = `${label} (${n})`
    }
    return { id: item.id, label, name: item.voice.name ?? '', lang: item.voice.lang }
  })
}

function voiceById(voices: readonly SpeechVoice[], id: string): SpeechVoice | null {
  if (!id) return null
  return withIds(voices).find((item) => item.id === id)?.voice ?? null
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
  /** True once getVoices() has returned at least one voice. */
  readonly hasVoices: boolean
  /** English voices installed on this device, best first. Empty until they load. */
  readonly englishVoices: readonly VoiceOption[]
  /** Saved voice id, or '' to keep using the best available voice. */
  readonly voiceId: string
  readonly rateId: SpeechRateId
  readonly rate: number
  readonly error: SpeechError | null
  speak: (id: string, text: string) => void
  stop: () => void
  toggle: (id: string, text: string) => void
  /** Remember a voice. Pass '' to return to the best available voice. Does not start speech. */
  setVoice: (id: string) => void
  /** Remember a speed. Does not start speech. */
  setRate: (id: SpeechRateId | string) => void
  subscribe: (listener: () => void) => () => void
}

export function createSpeaker(synth: SpeechSynth | null, makeUtterance?: (text: string) => SpeechUtterance, prefs?: PrefStore | null): Speaker {
  const make = makeUtterance ?? browserUtterance
  const store = prefs === undefined ? browserPrefs() : prefs
  const listeners = new Set<() => void>()
  let activeId: string | null = null
  let error: SpeechError | null = null
  let token = 0
  let voiceList: SpeechVoice[] | null = synth?.getVoices ? [] : null
  let voicesUnavailable = false
  let hasVoices = false
  let englishVoices: readonly VoiceOption[] = []
  let voiceId = store?.get(VOICE_PREF_KEY) ?? ''
  let rateId: SpeechRateId = speechRate(store?.get(RATE_PREF_KEY)).id
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

  function sameVoiceList(a: SpeechVoice[] | null, b: readonly SpeechVoice[]): boolean {
    if (!a || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (voiceIdentity(a[i]) !== voiceIdentity(b[i])) return false
    }
    return true
  }

  function pullVoices() {
    const list = readVoices()
    if (!list.length) return false
    const changed = voicesUnavailable || !hasVoices || !sameVoiceList(voiceList, list)
    voiceList = list
    voicesUnavailable = false
    hasVoices = true
    if (changed) {
      englishVoices = englishVoiceOptions(list)
      emit()
    }
    return true
  }

  function watchVoices() {
    if (!synth?.getVoices) return
    pullVoices()
    const onChange = () => {
      pullVoices()
    }
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', onChange)
    else synth.onvoiceschanged = onChange
    // Voices can show up in two waves (a compact voice, then a natural one). Keep listening.
    if (voiceList?.length) return
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

  function resolveVoice(voices: readonly SpeechVoice[]): SpeechVoice | null {
    if (!voices.length) return null
    return voiceById(voices, voiceId) ?? pickVoice(voices)
  }

  function applyVoice(u: SpeechUtterance) {
    pullVoices()
    const voices = voiceList ?? []
    const voice = resolveVoice(voices)
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
    get hasVoices() {
      return hasVoices
    },
    get englishVoices() {
      return englishVoices
    },
    get voiceId() {
      return voiceId
    },
    get rateId() {
      return rateId
    },
    get rate() {
      return speechRate(rateId).rate
    },
    get error() {
      return error
    },
    setVoice(id) {
      if (voiceId === id) return
      voiceId = id
      store?.set(VOICE_PREF_KEY, id)
      emit()
    },
    setRate(id) {
      const next = SPEECH_RATES.find((item) => item.id === id)
      if (!next || next.id === rateId) return
      rateId = next.id
      store?.set(RATE_PREF_KEY, rateId)
      emit()
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
        u.rate = speechRate(rateId).rate
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
export const speaker = createSpeaker(browserSynth(), undefined, browserPrefs())

export function stopSpeech() {
  speaker.stop()
}
