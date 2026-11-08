import type { RunOutcome } from './grade'
import type { RunCase } from './pyharness'

type Status = 'idle' | 'loading' | 'ready' | 'error'
type Listener = (s: Status) => void

const BOOT_TIMEOUT = 60_000
const PER_CASE_MS = 4_000

/**
 * One worker grades every code question, in the browser. I boot the
 * runtime lazily, the first time a code question needs it, because it
 * is large and most sittings never run code. A run that blows its
 * budget kills the worker. That is how an infinite loop dies. The next
 * call spawns a fresh one.
 */
class PythonRunner {
  private worker: Worker | null = null
  private booted = false
  private seq = 0
  private listeners = new Set<Listener>()
  status: Status = 'idle'

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private set(s: Status) {
    this.status = s
    this.listeners.forEach((l) => l(s))
  }

  private spawn(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./py.worker.ts', import.meta.url), { type: 'module' })
      this.booted = false
    }
    return this.worker
  }

  private kill() {
    this.worker?.terminate()
    this.worker = null
    this.booted = false
  }

  private call<T>(payload: object, timeoutMs: number): Promise<T> {
    const w = this.spawn()
    const id = ++this.seq
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        w.removeEventListener('message', onMsg)
        // terminate() is the timeout. Learner code is inside exec() and
        // will not return on its own. The next call spawns again.
        this.kill()
        this.set('idle')
        reject(new Error('timeout'))
      }, timeoutMs)
      const onMsg = (e: MessageEvent) => {
        // Two calls can be in flight. The id keeps a reply from resolving the wrong one.
        if (e.data?.id !== id) return
        clearTimeout(timer)
        w.removeEventListener('message', onMsg)
        if (e.data.fatal) {
          this.kill()
          this.set('error')
          reject(new Error(e.data.fatal))
        } else resolve(e.data as T)
      }
      w.addEventListener('message', onMsg)
      w.postMessage({ id, ...payload })
    })
  }

  /** Download the runtime in the background. I call this when a code question shows up, not at startup. */
  async warm(): Promise<boolean> {
    if (this.booted) return true
    this.set('loading')
    try {
      await this.call({ warm: true }, BOOT_TIMEOUT)
      this.booted = true
      this.set('ready')
      return true
    } catch {
      if (this.status !== 'idle') this.set('error')
      return false
    }
  }

  /**
   * One program, once per case. The budget covers the whole batch. If it
   * fires, the worker is already dead, so every case in this call is a
   * timeout, and I boot again in the background for the next question.
   */
  async run(code: string, cases: RunCase[], files?: Record<string, string>): Promise<RunOutcome[]> {
    if (!(await this.warm())) throw new Error('Python could not be loaded in this browser.')
    try {
      const r = await this.call<{ results: RunOutcome[] }>({ code, cases, files }, PER_CASE_MS * Math.max(1, cases.length) + 1000)
      return r.results
    } catch (e) {
      if ((e as Error).message === 'timeout') {
        void this.warm()
        return cases.map(() => ({ stdout: '', error: null, timedOut: true }))
      }
      throw e
    }
  }
}

export const python = new PythonRunner()
