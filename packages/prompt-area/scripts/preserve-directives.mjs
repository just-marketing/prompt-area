// Re-attaches the `'use client'` directive that esbuild strips while bundling.
//
// The library builds all entries together with code splitting (see
// tsup.config.ts), so the framework-agnostic engine is emitted once as a shared
// chunk imported by both the client components and the server-safe `./helpers`
// entry. esbuild drops module-level directives during bundling, so we re-attach
// `'use client'` here — but only to the client surface.
//
// The server-safe set is the import closure of `dist/helpers/index.js`: the
// helpers entry plus the React-free engine chunks it pulls in. Every other
// emitted `.js` is part of the interactive surface and gets the directive. This
// keeps `prompt-area/helpers` (and the shared engine it imports) callable from
// React Server Components while marking the client boundary everywhere else.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const dist = join(process.cwd(), 'dist')
const DIRECTIVE_RE = /^\s*['"`]use client['"`]/
// Relative specifiers in `from './x.js'`, `import './x.js'`, and `import('./x.js')`.
const IMPORT_RE = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g

function allJsFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...allJsFiles(path))
    else if (path.endsWith('.js')) out.push(path)
  }
  return out
}

// Build the server-safe closure: files reachable from the helpers entry.
const serverSafe = new Set()
const queue = [join(dist, 'helpers', 'index.js')]
while (queue.length) {
  const file = queue.pop()
  if (serverSafe.has(file)) continue
  serverSafe.add(file)
  const code = readFileSync(file, 'utf8')
  for (const [, spec] of code.matchAll(IMPORT_RE)) {
    queue.push(resolve(dirname(file), spec))
  }
}

let patched = 0
for (const path of allJsFiles(dist)) {
  if (serverSafe.has(path)) continue
  const code = readFileSync(path, 'utf8')
  if (DIRECTIVE_RE.test(code)) continue
  writeFileSync(path, `'use client';\n${code}`)
  patched++
}

console.log(
  `preserve-directives: prepended 'use client' to ${patched} file(s); ` +
    `left ${serverSafe.size} server-safe file(s) untouched`,
)
