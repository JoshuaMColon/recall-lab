/// <reference lib="webworker" />
// Pyodide off the main thread. The page kills this worker when a run
// takes too long; an infinite loop never gets to unwind itself.
import { HARNESS, type RunRequest } from './pyharness'

interface PyLike {
  runPython: (code: string) => unknown
  globals: { get: (name: string) => (...args: unknown[]) => string }
}

let ready: Promise<PyLike> | null = null

function boot(): Promise<PyLike> {
  // One boot promise. A second warm shares it instead of loading the runtime twice.
  if (!ready) {
    ready = (async () => {
      // Same-origin copy under /pyodide. A CDN would break the page CSP, which only allows 'self'.
      const base = new URL('/pyodide/', self.location.origin).href
      const mod = (await import(/* @vite-ignore */ `${base}pyodide.mjs`)) as { loadPyodide: (o: object) => Promise<PyLike> }
      // stdout and stderr go nowhere. The harness swaps sys.stdout and returns that text itself.
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
    // __rl_run is the harness. It takes the files as a JSON string and parses them on the Python side.
    const run = py.globals.get('__rl_run')
    const results = msg.cases.map((c) => JSON.parse(run(msg.code, c.stdin, JSON.stringify(msg.files ?? {}))))
    self.postMessage({ id: msg.id, results })
  } catch (err) {
    self.postMessage({ id: msg.id, fatal: String(err) })
  }
}
