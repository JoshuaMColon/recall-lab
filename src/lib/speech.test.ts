import { describe, expect, it, vi } from 'vitest'
import {
  chunkSpeech,
  createSpeaker,
  englishVoiceOptions,
  memoryPrefs,
  pickVoice,
  RATE_PREF_KEY,
  SILENCE_GRACE_MS,
  speechRate,
  toSpokenText,
  VOICE_PREF_KEY,
  VOICE_SETTLE_MS,
  voiceLabel,
  type SpeechUtterance,
  type SpeechVoice,
} from './speech'

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
  pause?: () => void
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

  it('stop drops queued chunks, even when cancel() is ignored until the engine is paused', () => {
    const synth = new FakeSynth()
    const queued: SpeechUtterance[] = []
    synth.pause = () => {
      synth.calls.push('pause')
      synth.paused = true
    }
    synth.cancel = () => {
      synth.calls.push('cancel')
      // Chrome keeps the current utterance unless pause() ran first.
      if (!synth.paused) return
      queued.length = 0
      synth.speaking = false
      synth.pending = false
    }
    synth.speak = (u) => {
      synth.calls.push('speak')
      synth.spoken.push(u.text)
      synth.last = u
      queued.push(u)
      synth.speaking = true
    }
    const speaker = createSpeaker(synth, utterance)
    const long = Array.from({ length: 12 }, (_, i) => `Sentence number ${i + 1} explains the next small idea.`).join(' ')
    speaker.speak('long', long)
    const firstEnd = synth.last?.onend
    firstEnd?.()
    expect(synth.spoken.length).toBeGreaterThan(1)
    expect(queued.length).toBeGreaterThan(0)
    const continueChunk = synth.last?.onend
    const resumesBeforeStop = synth.calls.filter((call) => call === 'resume').length
    speaker.stop()
    expect(speaker.activeId).toBeNull()
    expect(speaker.error).toBeNull()
    expect(queued).toEqual([])
    const pauseAt = synth.calls.lastIndexOf('pause')
    const cancelAt = synth.calls.lastIndexOf('cancel')
    expect(pauseAt).toBeGreaterThan(-1)
    expect(cancelAt).toBeGreaterThan(pauseAt)
    expect(synth.calls.filter((call) => call === 'resume').length).toBe(resumesBeforeStop)
    const spoken = synth.spoken.length
    continueChunk?.()
    firstEnd?.()
    expect(synth.spoken).toHaveLength(spoken)
    expect(speaker.activeId).toBeNull()
  })

  it('speaks the next Listen after Stop left the engine paused', () => {
    const synth = new FakeSynth()
    synth.pause = () => {
      synth.calls.push('pause')
      synth.paused = true
    }
    synth.cancel = () => {
      synth.calls.push('cancel')
      synth.speaking = false
      synth.pending = false
      // Firefox does not clear paused inside cancel().
    }
    const speaker = createSpeaker(synth, utterance)
    speaker.speak('a', 'Hello there.')
    speaker.stop()
    expect(synth.paused).toBe(true)
    expect(speaker.activeId).toBeNull()
    speaker.speak('a', 'Hello again.')
    expect(speaker.activeId).toBe('a')
    expect(synth.spoken.at(-1)).toBe('Hello again.')
    const speakAt = synth.calls.lastIndexOf('speak')
    expect(synth.calls[speakAt - 1]).toBe('resume')
    expect(synth.calls.slice(synth.calls.lastIndexOf('cancel') + 1, speakAt)).not.toContain('cancel')
    speaker.stop()
  })
})

describe('pickVoice', () => {
  const robot = { lang: 'en-US', name: 'English United States', localService: true, voiceURI: 'robot' }
  const google = { lang: 'en-US', name: 'Google US English', localService: false, voiceURI: 'google' }
  const samantha = { lang: 'en_US', name: 'Samantha', localService: true, voiceURI: 'Samantha' }
  const aria = {
    lang: 'en-US',
    name: 'Microsoft Aria Online (Natural) - English (United States)',
    localService: false,
    voiceURI: 'Aria',
  }

  it('matches iOS en_US and falls back to any English voice', () => {
    expect(pickVoice([])).toBeNull()
    const remote = { lang: 'en-US', name: 'Google', localService: false }
    expect(pickVoice([remote, samantha])?.name).toBe('Samantha')
    expect(pickVoice([{ lang: 'en-GB', name: 'Daniel', localService: true }, { lang: 'fr-FR', name: 'Thomas', default: true }])?.name).toBe('Daniel')
    expect(pickVoice([{ lang: 'fr-FR', name: 'Thomas', default: true }])?.name).toBe('Thomas')
  })

  it('prefers a natural or named voice over a compact local one', () => {
    expect(pickVoice([robot, google])?.voiceURI).toBe('google')
    expect(pickVoice([robot, samantha])?.name).toBe('Samantha')
    expect(pickVoice([samantha, aria])?.voiceURI).toBe('Aria')
    expect(pickVoice([robot, { lang: 'en-US', name: 'Zoe', localService: true, voiceURI: 'Zoe' }])?.name).toBe('Zoe')
    expect(pickVoice([samantha, { lang: 'en-US', name: 'Samantha (Enhanced)', localService: true, voiceURI: 'SamE' }])?.voiceURI).toBe('SamE')
    expect(pickVoice([google, { lang: 'en-GB', name: 'Daniel (Premium)', localService: true, voiceURI: 'Dan' }])?.voiceURI).toBe('Dan')
    expect(pickVoice([robot, { lang: 'en-AU', name: 'Karen', localService: true, voiceURI: 'Karen' }])?.voiceURI).toBe('robot')
  })

  it('uses a friendly label and a stable id', () => {
    expect(voiceLabel(aria)).toBe('Aria (Natural) · English (US)')
    expect(voiceLabel(samantha)).toBe('Samantha · English (US)')
    expect(voiceLabel(google)).toBe('Google US English')
    expect(voiceLabel({ name: 'Samantha (Enhanced)', lang: 'en-US' })).toBe('Samantha (Enhanced) · English (US)')
    const options = englishVoiceOptions([robot, aria, { lang: 'fr-FR', name: 'Thomas', voiceURI: 'fr' }])
    expect(options.map((option) => option.name)).toEqual([aria.name, robot.name])
    expect(options[0].id).toBe('uri:Aria')
    expect(options[0].label).toBe('Aria (Natural) · English (US)')
  })
})

describe('voice preference', () => {
  function voicedSynth(voices: SpeechVoice[]) {
    const synth = new FakeSynth()
    synth.getVoices = () => voices
    return synth
  }

  const voices: SpeechVoice[] = [
    { lang: 'en-US', name: 'Fred', localService: true, voiceURI: 'Fred' },
    { lang: 'en-US', name: 'Microsoft Aria Online (Natural) - English (United States)', localService: false, voiceURI: 'Aria' },
  ]

  it('speaks the best voice until a choice is saved, and does not speak while choosing', () => {
    const prefs = memoryPrefs()
    const synth = voicedSynth(voices)
    const speaker = createSpeaker(synth, utterance, prefs)
    expect(speaker.voiceId).toBe('')
    expect(speaker.rateId).toBe('normal')
    expect(speaker.rate).toBe(speechRate('normal').rate)
    expect(speaker.englishVoices.map((option) => option.id)).toEqual(['uri:Aria', 'uri:Fred'])
    speaker.setVoice('uri:Fred')
    speaker.setRate('faster')
    expect(synth.calls.filter((call) => call === 'speak')).toEqual([])
    expect(prefs.get(VOICE_PREF_KEY)).toBe('uri:Fred')
    expect(prefs.get(RATE_PREF_KEY)).toBe('faster')
    speaker.speak('a', 'Hello there.')
    expect(synth.last?.voice?.voiceURI).toBe('Fred')
    expect(synth.last?.lang).toBe('en-US')
    expect(synth.last?.rate).toBe(speechRate('faster').rate)
    speaker.stop()

    const restored = createSpeaker(synth, utterance, prefs)
    expect(restored.voiceId).toBe('uri:Fred')
    expect(restored.rateId).toBe('faster')
    restored.speak('b', 'Hello again.')
    expect(synth.last?.voice?.voiceURI).toBe('Fred')
    expect(synth.last?.rate).toBe(speechRate('faster').rate)
    restored.setVoice('')
    expect(prefs.get(VOICE_PREF_KEY)).toBe('')
    restored.speak('c', 'Back to the best voice.')
    expect(synth.last?.voice?.voiceURI).toBe('Aria')
    restored.stop()
  })

  it('falls back to the best installed voice when the saved one is missing', () => {
    const prefs = memoryPrefs({ [VOICE_PREF_KEY]: 'uri:Gone', [RATE_PREF_KEY]: 'nope' })
    const synth = voicedSynth([
      { lang: 'en-US', name: 'English United States', localService: true, voiceURI: 'robot' },
      { lang: 'en-US', name: 'Google US English', localService: false, voiceURI: 'google' },
    ])
    const speaker = createSpeaker(synth, utterance, prefs)
    expect(speaker.voiceId).toBe('uri:Gone')
    expect(speaker.rateId).toBe('normal')
    speaker.speak('a', 'Hello there.')
    expect(synth.last?.voice?.voiceURI).toBe('google')
    expect(synth.last?.rate).toBe(speechRate('normal').rate)
    speaker.setRate('slower')
    speaker.speak('b', 'A bit slower now.')
    expect(synth.last?.rate).toBe(speechRate('slower').rate)
    speaker.stop()
  })

  it('applies a speed change to the chunk that is speaking and stays quiet when idle', () => {
    const prefs = memoryPrefs()
    const synth = voicedSynth([
      { lang: 'en-US', name: 'Fred', localService: true, voiceURI: 'Fred' },
      { lang: 'en-US', name: 'Microsoft Aria Online (Natural) - English (United States)', localService: false, voiceURI: 'Aria' },
    ])
    const speaker = createSpeaker(synth, utterance, prefs)
    speaker.setRate('faster')
    expect(synth.calls.filter((call) => call === 'speak')).toEqual([])
    expect(speaker.activeId).toBeNull()

    const long = Array.from({ length: 8 }, (_, i) => `Sentence number ${i + 1} explains the next small idea.`).join(' ')
    speaker.speak('lesson', long)
    expect(synth.last?.rate).toBe(speechRate('faster').rate)
    expect(synth.last?.voice?.voiceURI).toBe('Aria')
    const first = synth.spoken[0]
    synth.last?.onend?.()
    const second = synth.spoken[1]
    expect(second).not.toBe(first)

    const repeatsBefore = synth.spoken.filter((text) => text === first).length
    speaker.setRate('slower')
    expect(speaker.activeId).toBe('lesson')
    expect(speaker.rateId).toBe('slower')
    expect(prefs.get(RATE_PREF_KEY)).toBe('slower')
    expect(prefs.get(VOICE_PREF_KEY)).toBeNull()
    expect(synth.spoken.at(-1)).toBe(second)
    expect(synth.last?.rate).toBe(speechRate('slower').rate)
    expect(synth.last?.voice?.voiceURI).toBe('Aria')
    expect(synth.spoken.filter((text) => text === first)).toHaveLength(repeatsBefore)
    expect(synth.calls).toContain('cancel')

    speaker.setRate('slower')
    expect(synth.spoken.filter((text) => text === second)).toHaveLength(2)

    synth.last?.onend?.()
    expect(synth.last?.rate).toBe(speechRate('slower').rate)
    expect(synth.spoken.at(-1)).not.toBe(second)

    speaker.setVoice('uri:Fred')
    expect(speaker.activeId).toBe('lesson')
    expect(synth.last?.voice?.voiceURI).toBe('Fred')
    expect(synth.last?.rate).toBe(speechRate('slower').rate)

    speaker.stop()
    const spoken = synth.spoken.length
    const calls = synth.calls.length
    speaker.setRate('normal')
    speaker.setVoice('uri:Aria')
    expect(synth.spoken).toHaveLength(spoken)
    expect(synth.calls).toHaveLength(calls)
    expect(speaker.activeId).toBeNull()
    expect(prefs.get(RATE_PREF_KEY)).toBe('normal')
    expect(prefs.get(VOICE_PREF_KEY)).toBe('uri:Aria')
  })

  it('refreshes the English voice list when voiceschanged fires', () => {
    vi.useFakeTimers()
    try {
      let voices: SpeechVoice[] = []
      const listeners = new Set<() => void>()
      const synth = new FakeSynth()
      synth.getVoices = () => voices
      synth.addEventListener = (type, fn) => {
        if (type === 'voiceschanged') listeners.add(fn)
      }
      const speaker = createSpeaker(synth, utterance, memoryPrefs())
      expect(speaker.englishVoices).toEqual([])
      expect(speaker.hasVoices).toBe(false)
      voices = [
        { name: 'Thomas', lang: 'fr-FR', voiceURI: 'fr' },
        { name: 'Ava', lang: 'en-US', localService: true, voiceURI: 'Ava' },
      ]
      listeners.forEach((fn) => fn())
      expect(speaker.hasVoices).toBe(true)
      expect(speaker.voicesUnavailable).toBe(false)
      expect(speaker.englishVoices.map((option) => option.name)).toEqual(['Ava'])
      expect(speaker.englishVoices[0].label).toContain('Ava')
      speaker.speak('later', 'Hello again.')
      expect(synth.last?.voice?.voiceURI).toBe('Ava')
      voices = [
        { name: 'Thomas', lang: 'fr-FR', voiceURI: 'fr' },
        { name: 'Ava', lang: 'en-US', localService: true, voiceURI: 'Ava' },
        { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US', localService: false, voiceURI: 'Aria' },
      ]
      listeners.forEach((fn) => fn())
      expect(speaker.englishVoices.map((option) => option.id)).toEqual(['uri:Aria', 'uri:Ava'])
      speaker.stop()
    } finally {
      vi.useRealTimers()
    }
  })
})
