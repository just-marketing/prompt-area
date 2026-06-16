import { defineConfig, type Options } from 'tsup'

/**
 * Builds the library to ESM with per-entry `.d.ts` files.
 *
 * Two builds run so React Server Component boundaries are correct:
 *
 * 1. The interactive surface (components, hooks, and the convenience
 *    barrels that re-export them) is emitted with a `'use client'` banner.
 *    The whole prompt-input experience is client-side, so this is the right
 *    boundary and means consumers can render the components directly from a
 *    Server Component.
 * 2. The framework-agnostic helpers (segment + engine utilities, trigger
 *    presets, and types) are emitted from `./helpers` with no directive, so
 *    they stay importable and callable from Server Components.
 *
 * esbuild strips module-level directives while bundling, so the `'use client'`
 * markers are re-attached after the build by scripts/preserve-directives.mjs
 * (every output except the `helpers/` entry).
 *
 * `react`, `react-dom`, and the runtime dependencies are externalized
 * automatically by tsup. The `@/lib/utils` and `@/registry/new-york/blocks/*`
 * aliases (kept in source for shadcn-registry consumers) are resolved via the
 * package tsconfig `paths`, which esbuild honors during bundling.
 */
const shared = {
  format: ['esm'],
  dts: true,
  treeshake: true,
  minify: true,
  // No source maps in the published package — they more than doubled the
  // tarball (~273kB of .map files) and aren't needed by consumers.
  sourcemap: false,
  clean: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
} satisfies Options

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      'prompt-area/index': 'src/prompt-area/index.ts',
      'action-bar/index': 'src/action-bar/index.ts',
      'status-bar/index': 'src/status-bar/index.ts',
      'compact-prompt-area/index': 'src/compact-prompt-area/index.ts',
      'chat-prompt-layout/index': 'src/chat-prompt-layout/index.ts',
    },
    splitting: true,
  },
  {
    ...shared,
    entry: { 'helpers/index': 'src/helpers/index.ts' },
    splitting: false,
  },
])
