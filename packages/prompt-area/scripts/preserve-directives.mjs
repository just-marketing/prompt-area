// Re-attaches the `'use client'` directive that esbuild strips while bundling.
//
// The library is built in two passes (see tsup.config.ts): the interactive
// components/hooks (everything under dist/, including shared chunks) and the
// framework-agnostic helpers (dist/helpers/, no directive). esbuild drops
// module-level directives during bundling, so we prepend `'use client'` to
// every emitted .js file except the server-safe helpers entry. This keeps the
// client boundary intact for React Server Component consumers while leaving
// `prompt-area/helpers` usable on the server.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'

const dist = join(process.cwd(), 'dist')
const serverDir = join(dist, 'helpers') + sep
const DIRECTIVE_RE = /^\s*['"`]use client['"`]/

let patched = 0
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      walk(path)
      continue
    }
    if (!path.endsWith('.js')) continue
    if (path.startsWith(serverDir)) continue
    const code = readFileSync(path, 'utf8')
    if (DIRECTIVE_RE.test(code)) continue
    writeFileSync(path, `'use client';\n${code}`)
    patched++
  }
}

walk(dist)
console.log(`preserve-directives: prepended 'use client' to ${patched} file(s)`)
