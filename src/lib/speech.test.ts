import { describe, expect, it, vi } from 'vitest'
import { chunkSpeech, createSpeaker, pickVoice, SILENCE_GRACE_MS, toSpokenText, VOICE_SETTLE_MS, type SpeechUtterance, type SpeechVoice } from './speech'

class FakeSynth {
  calls: string[] = []
  spoken: string[] = []
  speaking = false
  pending = false
  paused = false
  getVoices?: () => SpeechVoice[]
  addEventListener?: (type: string, listener: () => void) => void
  cancel() {
    this.calls.push('cancel')
    this.speaking = false
    this.pending = false
  }
  speak(u: SpeechUtterance) {
    this.calls.push('speak')
    this.spoken.push(u.text)
    this.last = u
    this.speaking = true
    this.pending = false
    this.paused = false
  }
  resume() {
    this.calls.push('resume')
    this.paused = false
  }
  last: SpeechUtterance | null = null
}

function utterance(text: string): SpeechUtterance {
  return { text, lang: '', rate: 1, onend: null, onerror: null }
}

describe('toSpokenText', () => {
  it('strips markdown and code markup into plain speech', () => {
    const spoken = toSpokenText('**What this is**\n\nUse `print(1)` and ```python\nprint(2)\n``` then [the guide](/guide).')
    expect(spoken).not.toContain('*')
    expect(spoken).not.toContain('`')
    expect(spoken).not.toContain('#')
    expect(spoken).not.toContain('[')
    expect(spoken).toContain('What this is')
    expect(spoken).toContain('print(1)')
    expect(spoken).toContain('print(2)')
    expect(spoken).toContain('the guide')
    expect(spoken).not.toContain('/guide')
  })

  it('keeps Python operators and names so a lesson can be read aloud', () => {
    const spoken = toSpokenText('**Powers.** `2 ** 3` is eight, and `4 ** 2` is 16. The name is `total_cost`. `__name__` equals `"__main__"`.')
    expect(spoken).toContain('Powers.')
    expect(spoken).not.toContain('**Powers')
    expect(spoken).toContain('2 ** 3')
    expect(spoken).toContain('4 ** 2')
    expect(spoken).toContain('total_cost')
    expect(spoken).toContain('__name__')
    expect(spoken).toContain('__main__')
  })
})

describe('speaker', () => {
  it('does not speak until speak() is called', () => {
    const synth = new FakeSynth()
    const speaker = createSpeaker(synth, utterance)
    const stop = speaker.subscribe(() => undefined)
    expect(synth.calls).toEqual([])
    expect(speaker.activeId).toBeNull()
    stop()
    expect(synth.calls).toEqual([])
  })

  it('starts only the requested text, and a new target cancels the previous one', () => {
    const synth = new FakeSynth()
    const speaker = createSpeaker(synth, utterance)
    speaker.speak('guide', 'Hello there. This is the guide.')
    expect(speaker.activeId).toBe('guide')
    expect(synth.spoken[0]).toContain('Hello there')
    const cancelsBefore = synth.calls.filter((c) => c === 'cancel').length
    speaker.speak('explain', 'A different explanation.')
    expect(synth.calls.filter((c) => c === 'cancel').length).toBeGreaterThan(cancelsBefore)
    expect(speaker.activeId).toBe('explain')
    expect(synth.spoken.at(-1)).toContain('different explanation')
    // The first utterance finishing must not clear the new target.
    synth.spoken.length = 0
    speaker.stop()
    expect(speaker.activeId).toBeNull()
    expect(synth.calls.at(-1)).toBe('cancel')
  })

  it('queues the next chunk only after the current one ends', () => {
    const synth = new FakeSynth()
    const speaker = createSpeaker(synth, utterance)
    const long = Array.from({ length: 12 }, (_, i) => `Sentence number ${i + 1} explains the next small idea.`).join(' ')
    expect(chunkSpeech(long).length).toBeGreaterThan(1)
    speaker.speak('long', long)
    expect(synth.spoken).toHaveLength(1)
    synth.last?.onend?.()
    expect(synth.spoken.length).toBeGreaterThan(1)
    speaker.stop()
  })

  it('toggle stops the active target and will not speak an empty string', () => {
    const synth = new FakeSynth()
    const speaker = createSpeaker(synth, utterance)
    speaker.toggle('a', '**Listen** to `this`.')
    expect(speaker.activeId).toBe('a')
    expect(synth.spoken[0]).toBe('Listen to this.')
    speaker.toggle('a', '**Listen** to `this`.')
    expect(speaker.activeId).toBeNull()
    const calls = synth.calls.length
    speaker.speak('b', '   ')
    expect(speaker.activeId).toBeNull()
    expect(synth.calls.length).toBe(calls + 1) // cancel, then nothing spoken
    expect(synth.spoken).toHaveLength(1)
  })

  it('reports unsupported when there is no speechSynthesis', () => {
    const speaker = createSpeaker(null)
    speaker.speak('x', 'Hello')
    speaker.toggle('x', 'Hello')
    expect(speaker.supported).toBe(false)
    expect(speaker.voicesUnavailable).toBe(false)
    expect(speaker.activeId).toBeNull()
    expect(speaker.error).toBeNull()
  })

  it('splits long readings into chunks short enough for a phone', () => {
    const long = `${Array.from({ length: 40 }, (_, i) => `Sentence number ${i + 1} explains one small idea.`).join(' ')} ${'word '.repeat(80)}`
    const parts = chunkSpeech(long)
    expect(parts.length).toBeGreaterThan(2)
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(120)
  })

  it('speaks in the same turn as the tap and does not cancel an idle engine', () => {
    vi.useFakeTimers()
    try {
      const synth = new FakeSynth()
      synth.getVoices = () => []
      const speaker = createSpeaker(synth, utterance)
      speaker.speak('lesson', 'Hello there.')
      expect(synth.spoken).toEqual(['Hello there.'])
      expect(synth.calls[0]).toBe('speak')
      expect(synth.calls).toContain('resume')
      expect(synth.calls).not.toContain('cancel')
      // Voices are still loading. Forcing en-US here is silent on iOS.
      expect(synth.last?.lang).toBe('')
      expect(synth.last?.voice ?? null).toBeNull()
      expect(speaker.voicesUnavailable).toBe(false)
      expect(speaker.activeId).toBe('lesson')
    } finally {
      vi.useRealTimers()
    }
  })

  it('still speaks if the engine rejects the voice object', () => {
    const synth = new FakeSynth()
    synth.getVoices = () => [{ lang: 'en_US', name: 'Samantha', localService: true }]
    const speaker = createSpeaker(synth, (text) => {
      const u = utterance(text)
      Object.defineProperty(u, 'voice', {
        configurable: true,
        get: () => null,
        set() {
          throw new Error('not a SpeechSynthesisVoice')
        },
      })
      return u
    })
    speaker.speak('a', 'Hello there.')
    expect(synth.spoken[0]).toContain('Hello')
    expect(synth.last?.lang).toBe('en_US')
    expect(speaker.activeId).toBe('a')
    speaker.stop()
  })

  it('assigns text even when the utterance constructor drops it', () => {
    const synth = new FakeSynth()
    const speaker = createSpeaker(synth, () => ({ text: '', lang: '', rate: 1, onend: null, onerror: null }))
    speaker.speak('ios', 'Hello there.')
    expect(synth.last?.text).toBe('Hello there.')
    speaker.stop()
  })

  it('uses a voice from voiceschanged, including an en_US tag', () => {
    vi.useFakeTimers()
    try {
      let voices: SpeechVoice[] = []
      const listeners = new Set<() => void>()
      const synth = new FakeSynth()
      synth.getVoices = () => voices
      synth.addEventListener = (type, fn) => {
        if (type === 'voiceschanged') listeners.add(fn)
      }
      const speaker = createSpeaker(synth, utterance)
      voices = [{ name: 'Samantha', lang: 'en_US', localService: true, default: true }]
      listeners.forEach((fn) => fn())
      expect(speaker.voicesUnavailable).toBe(false)
      speaker.speak('later', 'Hello again.')
      expect(synth.last?.voice?.lang).toBe('en_US')
      expect(synth.last?.lang).toBe('en_US')
      expect(synth.calls.filter((call) => call === 'cancel')).toEqual([])
      vi.advanceTimersByTime(5000)
      expect(speaker.voicesUnavailable).toBe(false)
      speaker.stop()
    } finally {
      vi.useRealTimers()
    }
  })

  it('disables speech when no voice ever loads, and speaks if one appears later', () => {
    vi.useFakeTimers()
    try {
      let voices: SpeechVoice[] = []
      const synth = new FakeSynth()
      synth.getVoices = () => voices
      const speaker = createSpeaker(synth, utterance)
      expect(speaker.voicesUnavailable).toBe(false)
      vi.advanceTimersByTime(VOICE_SETTLE_MS)
      expect(speaker.voicesUnavailable).toBe(true)
      speaker.speak('x', 'Hello there.')
      expect(synth.spoken).toEqual([])
      expect(speaker.activeId).toBeNull()

      voices = [{ name: 'Samantha', lang: 'en_US', localService: true, default: true }]
      speaker.speak('x', 'Hello there.')
      expect(speaker.voicesUnavailable).toBe(false)
      expect(synth.last?.lang).toBe('en_US')
      expect(synth.spoken.at(-1)).toContain('Hello there')
      speaker.stop()
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports a failure instead of staying on Speaking when the engine drops the utterance', () => {
    vi.useFakeTimers()
    try {
      const synth = new FakeSynth()
      synth.speak = (u) => {
        synth.calls.push('speak')
        synth.spoken.push(u.text)
        synth.last = u
      }
      const speaker = createSpeaker(synth, utterance)
      speaker.speak('lesson', 'Hello from the lesson.')
      expect(speaker.activeId).toBe('lesson')
      vi.advanceTimersByTime(SILENCE_GRACE_MS)
      expect(speaker.activeId).toBeNull()
      expect(speaker.error).toEqual({ id: 'lesson', message: "Couldn't play voice. Check your volume, or try headphones." })
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports a failure when the engine stays paused after resume', () => {
    vi.useFakeTimers()
    try {
      const synth = new FakeSynth()
      synth.speak = (u) => {
        synth.calls.push('speak')
        synth.spoken.push(u.text)
        synth.last = u
        synth.pending = true
        synth.paused = true
      }
      synth.resume = () => {
        synth.calls.push('resume')
      }
      const speaker = createSpeaker(synth, utterance)
      speaker.speak('android', 'Hello from Android.')
      expect(synth.calls).toContain('resume')
      vi.advanceTimersByTime(SILENCE_GRACE_MS)
      expect(speaker.activeId).toBeNull()
      expect(speaker.error?.id).toBe('android')
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears Speaking and shows an error when the current utterance is canceled', () => {
    const synth = new FakeSynth()
    const speaker = createSpeaker(synth, utterance)
    speaker.speak('guide', 'Hello there.')
    synth.last?.onerror?.({ error: 'canceled' })
    expect(speaker.activeId).toBeNull()
    expect(speaker.error?.id).toBe('guide')
    expect(speaker.error?.message).toContain("Couldn't play voice")
  })

  it('does not let a replaced utterance mark the new one as failed', () => {
    const synth = new FakeSynth()
    const speaker = createSpeaker(synth, utterance)
    speaker.speak('a', 'Hello there.')
    const first = synth.last
    speaker.speak('b', 'Other words here.')
    first?.onerror?.({ error: 'interrupted' })
    expect(speaker.activeId).toBe('b')
    expect(speaker.error).toBeNull()
    speaker.stop()
    first?.onerror?.({ error: 'canceled' })
    expect(speaker.error).toBeNull()
  })

  it('cancels a queued engine before the new utterance, then resumes', () => {
    const synth = new FakeSynth()
    synth.pending = true
    const speaker = createSpeaker(synth, utterance)
    speaker.speak('a', 'Hello there.')
    expect(synth.calls[0]).toBe('cancel')
    expect(synth.calls).toContain('speak')
    expect(synth.calls).toContain('resume')
    const speakAt = synth.calls.indexOf('speak')
    const cancelAt = synth.calls.indexOf('cancel')
    expect(cancelAt).toBeLessThan(speakAt)
    speaker.stop()
  })
})

describe('pickVoice', () => {
  it('matches iOS en_US and falls back to any English voice', () => {
    expect(pickVoice([])).toBeNull()
    const remote = { lang: 'en-US', name: 'Google', localService: false }
    const ios = { lang: 'en_US', name: 'Samantha', localService: true }
    expect(pickVoice([remote, ios])?.name).toBe('Samantha')
    expect(pickVoice([{ lang: 'en-GB', name: 'Daniel', localService: true }, { lang: 'fr-FR', name: 'Thomas', default: true }])?.name).toBe('Daniel')
    expect(pickVoice([{ lang: 'fr-FR', name: 'Thomas', default: true }])?.name).toBe('Thomas')
  })
})
