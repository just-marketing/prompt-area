import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    // Order matters: the more specific registry alias must resolve before
    // the catch-all '@'. The component source now lives in the workspace
    // package; this keeps existing '@/registry/new-york/blocks/*' imports
    // (app + tests) pointing at the package source.
    alias: [
      // Dogfood the package: the docs app imports 'prompt-area' (the public
      // barrel) and resolves to source, so no build step is needed in dev/CI.
      {
        find: /^prompt-area$/,
        replacement: path.resolve(__dirname, 'packages/prompt-area/src/index.ts'),
      },
      {
        find: /^@\/registry\/new-york\/blocks\/(.*)$/,
        replacement: path.resolve(__dirname, 'packages/prompt-area/src/$1'),
      },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
})
