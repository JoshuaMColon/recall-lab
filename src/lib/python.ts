import type { RunOutcome } from './grade'
import type { RunCase } from './pyharness'

type Status = 'idle' | 'loading' | 'ready' | 'error'
type Listener = (s: Status) => void

const BOOT_TIMEOUT = 60_000
const PER_CASE_MS = 4_000

/** Lazily-started Pyodide worker. All grading of code questions happens here, in the browser. */
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
        this.kill()
        this.set('idle')
        reject(new Error('timeout'))
      }, timeoutMs)
      const onMsg = (e: MessageEvent) => {
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

  /** Start downloading Python in the background (call when a code question appears). */
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

  /** Run code once per case. A run that exceeds its time budget is reported as timedOut. */
  async run(code: string, cases: RunCase[], files?: Record<string, string>): Promise<RunOutcome[]> {
    if (!(await this.warm())) throw new Error('Python could not be loaded in this browser.')
    try {
      const r = await this.call<{ results: RunOutcome[] }>({ code, cases, files }, PER_CASE_MS * Math.max(1, cases.length) + 1000)
      return r.results
    } catch (e) {
      if ((e as Error).message === 'timeout') {
        void this.warm() // restart in the background
        return cases.map(() => ({ stdout: '', error: null, timedOut: true }))
      }
      throw e
    }
  }
}

export const python = new PythonRunner()
