/// <reference lib="webworker" />
// Runs learner code with Pyodide (CPython in WebAssembly) off the main thread.
// The main thread kills this worker if a run takes too long (e.g. an infinite loop).
import { HARNESS, type RunRequest } from './pyharness'

interface PyLike {
  runPython: (code: string) => unknown
  globals: { get: (name: string) => (...args: unknown[]) => string }
}

let ready: Promise<PyLike> | null = null

function boot(): Promise<PyLike> {
  if (!ready) {
    ready = (async () => {
      const base = new URL('/pyodide/', self.location.origin).href
      const mod = (await import(/* @vite-ignore */ `${base}pyodide.mjs`)) as { loadPyodide: (o: object) => Promise<PyLike> }
      const py = await mod.loadPyodide({ indexURL: base, stdout: () => {}, stderr: () => {} })
      py.runPython(HARNESS)
      return py
    })()
  }
  return ready
}

self.onmessage = async (e: MessageEvent<RunRequest | { id: number; warm: true }>) => {
  const msg = e.data
  try {
    const py = await boot()
    if ('warm' in msg) {
      self.postMessage({ id: msg.id, ready: true })
      return
    }
    const run = py.globals.get('__rl_run')
    const results = msg.cases.map((c) => JSON.parse(run(msg.code, c.stdin, JSON.stringify(msg.files ?? {}))))
    self.postMessage({ id: msg.id, results })
  } catch (err) {
    self.postMessage({ id: msg.id, fatal: String(err) })
  }
}
