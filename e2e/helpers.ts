import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export type SpeechStubMode = 'ready' | 'error' | 'no-voices' | 'loading'

/**
 * Replace speechSynthesis before the app boots.
 * `ready` has an en_US voice and fires onstart (so Listen stays on Speaking).
 * `error` fails the utterance in the tap.
 * `no-voices` / `loading` start with an empty voice list. `loading` can call `__setSpeechVoices`.
 */
export async function installSpeechStub(page: Page, mode: SpeechStubMode = 'ready') {
  await page.addInitScript((mode: SpeechStubMode) => {
    const calls: string[] = []
    const host = window as unknown as { __speaks: string[]; __setSpeechVoices?: (langs: string[]) => void }
    host.__speaks = calls
    const synth = window.speechSynthesis
    const listeners = new Set<() => void>()
    const samantha = { name: 'Samantha', lang: 'en_US', default: true, localService: true, voiceURI: 'Samantha' } as SpeechSynthesisVoice
    let voices: SpeechSynthesisVoice[] = mode === 'no-voices' || mode === 'loading' ? [] : [samantha]

    const override = (key: string, value: unknown) => {
      try {
        Object.defineProperty(synth, key, { configurable: true, value })
      } catch {
        ;(synth as unknown as Record<string, unknown>)[key] = value
      }
    }

    override('getVoices', () => voices.slice())
    override('speak', (utterance: SpeechSynthesisUtterance) => {
      calls.push(`speak:${utterance.text.slice(0, 80)}|lang:${utterance.lang}|voice:${utterance.voice?.lang ?? ''}`)
      if (mode === 'error') {
        utterance.onerror?.({ error: 'synthesis-failed' } as SpeechSynthesisErrorEvent)
        return
      }
      utterance.onstart?.(new Event('start') as SpeechSynthesisEvent)
    })
    override('cancel', () => {
      calls.push('cancel')
    })
    override('resume', () => {
      calls.push('resume')
    })
    override('addEventListener', (type: string, listener: () => void) => {
      if (type === 'voiceschanged') listeners.add(listener)
    })
    host.__setSpeechVoices = (langs: string[]) => {
      voices = langs.map((lang) => ({ name: lang, lang, default: true, localService: true, voiceURI: lang }) as SpeechSynthesisVoice)
      listeners.forEach((fn) => fn())
    }
  }, mode)
}

export function speechLog(page: Page) {
  return page.evaluate(() => (window as unknown as { __speaks: string[] }).__speaks)
}

export async function expectAxeClean(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => localStorage.setItem('recall-lab:theme', t), theme)
}
