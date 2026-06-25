import type { StyleLogoId } from '@/components/style-logo'

// Single source of truth for the /styles sidebar. Each entry pairs a style's
// section id (the anchor used by both the <section id> and the sidebar link)
// with its display label. Ordered to match the sections on the page.

export type StyleNavItem = { id: StyleLogoId; label: string }

export const stylesNavigation: StyleNavItem[] = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'codex', label: 'Codex' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'juma', label: 'Juma' },
]
