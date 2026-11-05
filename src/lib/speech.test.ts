import { describe, expect, it } from 'vitest'
import { chunkSpeech, createSpeaker, toSpokenText, type SpeechUtterance } from './speech'

class FakeSynth {
  calls: string[] = []
  spoken: string[] = []
  cancel() {
    this.calls.push('cancel')
  }
  speak(u: SpeechUtterance) {
    this.calls.push('speak')
    this.spoken.push(u.text)
    this.last = u
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
    expect(speaker.activeId).toBeNull()
  })
})
