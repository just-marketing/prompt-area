import { defineConfig, type Options } from 'tsup'

/**
 * Builds the library to ESM with per-entry `.d.ts` files.
 *
 * All entries build together with code splitting on, so the framework-agnostic
 * engine (segment + trigger utilities, markdown parsing, types) is emitted once
 * as a shared chunk instead of being re-bundled into both the components and the
 * `./helpers` entry. This keeps the JS and the `.d.ts` output free of
 * duplication.
 *
 * React Server Component boundaries are restored afterwards by
 * scripts/preserve-directives.mjs. esbuild strips module-level directives while
 * bundling, so the script re-attaches `'use client'` to exactly the files that
 * need it: the client entry barrels and any chunk that imports React. The shared
 * engine chunk imports no React and is left untouched, which is what keeps
 * `prompt-area/helpers` importable and callable from Server Components.
 *
 * `react`, `react-dom`, and the runtime dependencies are externalized
 * automatically by tsup. The `@/lib/utils` and `@/registry/new-york/blocks/*`
 * aliases (kept in source for shadcn-registry consumers) are resolved via the
 * package tsconfig `paths`, which esbuild honors during bundling.
 */
export default defineConfig({
  format: ['esm'],
  dts: true,
  treeshake: true,
  minify: true,
  // No source maps in the published package — they more than doubled the
  // tarball (~273kB of .map files) and aren't needed by consumers.
  sourcemap: false,
  clean: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  splitting: true,
  entry: {
    index: 'src/index.ts',
    'prompt-area/index': 'src/prompt-area/index.ts',
    'action-bar/index': 'src/action-bar/index.ts',
    'status-bar/index': 'src/status-bar/index.ts',
    'compact-prompt-area/index': 'src/compact-prompt-area/index.ts',
    'chat-prompt-layout/index': 'src/chat-prompt-layout/index.ts',
    'helpers/index': 'src/helpers/index.ts',
  },
} satisfies Options)
