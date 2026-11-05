import { useId, useSyncExternalStore } from 'react'
import { SPEECH_RATES, VOICE_QUALITY_NOTE, speaker, type SpeechRateId, type VoiceOption } from '../lib/speech'
import { Btn, Tip } from './ui'

const NO_VOICES: readonly VoiceOption[] = []

function subscribe(fn: () => void) {
  return speaker.subscribe(fn)
}

/**
 * Shared Listen voice and speed. Choosing a voice does not start playback.
 * The list is whatever English voices this browser actually has.
 */
export function ListenSettings() {
  const voices = useSyncExternalStore(subscribe, () => speaker.englishVoices, () => NO_VOICES)
  const voiceId = useSyncExternalStore(subscribe, () => speaker.voiceId, () => '')
  const rateId = useSyncExternalStore(subscribe, () => speaker.rateId, () => 'normal' as SpeechRateId)
  const unavailable = useSyncExternalStore(subscribe, () => speaker.voicesUnavailable, () => false)
  const hasVoices = useSyncExternalStore(subscribe, () => speaker.hasVoices, () => false)
  const selectId = useId()
  if (!speaker.supported || unavailable) return null

  const known = voices.some((voice) => voice.id === voiceId)
  const selected = known ? voiceId : ''
  const using = voices.find((voice) => voice.id === selected) ?? voices[0]
  const loading = !hasVoices

  return (
    <div className="mt-3 max-w-full space-y-2">
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <Tip tip="Pick an English voice installed on this device. Best available is used until you choose one. Changing this does not start sound.">
          {(described) => (
            <label htmlFor={selectId} className="flex min-w-0 max-w-full items-center gap-2 text-sm font-semibold">
              <span className="shrink-0 text-muted">Voice</span>
              <select
                {...described}
                id={selectId}
                className="listen-voice min-w-0 rounded-lg border-2 border-edge bg-card px-2 py-1 text-sm font-semibold text-ink disabled:opacity-60"
                value={selected}
                disabled={loading || voices.length === 0}
                onChange={(event) => speaker.setVoice(event.target.value)}
              >
                {loading ? (
                  <option value="">Looking for voices…</option>
                ) : voices.length === 0 ? (
                  <option value="">No English voice installed</option>
                ) : (
                  <>
                    <option value="">Best available</option>
                    {voices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.label}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </label>
          )}
        </Tip>
        <div role="group" aria-label="Speaking speed" className="inline-flex flex-wrap gap-1">
          {SPEECH_RATES.map((rate) => (
            <Btn key={rate.id} tip={rate.tip} size="sm" variant={rateId === rate.id ? 'hl' : 'ghost'} aria-pressed={rateId === rate.id} onClick={() => speaker.setRate(rate.id)}>
              {rate.label}
            </Btn>
          ))}
        </div>
      </div>
      <p className="max-w-xl text-xs leading-snug text-muted">
        {voices.length > 0 && using ? `Using ${using.label}. ` : null}
        {VOICE_QUALITY_NOTE}
      </p>
    </div>
  )
}
