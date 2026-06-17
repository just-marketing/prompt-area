import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite + React setup so the example boots both locally (`npm run dev`)
// and in the docs site's in-browser live editor.
export default defineConfig({
  plugins: [react()],
  // The example ships plain CSS and needs no PostCSS plugins. Pin an empty
  // config so Vite doesn't walk up and pick one up from a parent directory.
  css: { postcss: {} },
})
