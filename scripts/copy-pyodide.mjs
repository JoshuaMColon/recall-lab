// Copies the Pyodide runtime (CPython compiled to WebAssembly) from node_modules into
// public/pyodide so it is self-hosted: no CDN, works with a strict CSP. Runs before dev/build.
import { cpSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'pyodide')
const dest = join(root, 'public', 'pyodide')
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']

mkdirSync(dest, { recursive: true })
for (const f of files) {
  const from = join(src, f)
  if (!existsSync(from)) throw new Error(`pyodide file missing: ${from}`)
  const to = join(dest, f)
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue
  cpSync(from, to)
}
console.log(`pyodide runtime ready in public/pyodide (${files.length} files)`)
