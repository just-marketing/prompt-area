import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

// The prebuilt, self-contained stylesheet — works with any stack (no Tailwind
// required). This is the only CSS the components need.
import 'prompt-area/styles.css'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
