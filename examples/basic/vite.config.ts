import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite + React setup so CodeSandbox (and a local `npm run dev`) can boot
// the example straight from this folder.
export default defineConfig({
  plugins: [react()],
  // The example ships plain CSS and needs no PostCSS plugins. Pin an empty
  // config so Vite doesn't walk up and pick one up from a parent directory.
  css: { postcss: {} },
})
