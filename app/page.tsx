import type { Metadata } from 'next'
import HomeContent from './home-content'

export const metadata: Metadata = {
  title: 'Prompt Area — shadcn Chat Input for React with @Mentions & /Commands',
  description:
    'The shadcn AI chat input for React: a zero-dependency textarea with @mentions, /commands, #tags, inline markdown, and file attachments. Install from the shadcn registry — a modern react-mentions alternative for LLM chat interfaces.',
  alternates: {
    canonical: 'https://prompt-area.com',
  },
}

export default function Page() {
  return <HomeContent />
}
