import type { Metadata } from 'next'
import { CodeBlock } from '@/components/code-block'
import { DocsLead, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import { ChatPromptLayoutExample, chatPromptLayoutCode } from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Chat Prompt Layout',
  description:
    'The Chat Prompt Layout — a full-height layout with a scrollable messages area, a bottom-anchored prompt slot, and contextual scroll-to-top/bottom navigation.',
  alternates: { canonical: `${SITE_URL}/docs/components/chat-prompt-layout` },
}

export default function ChatPromptLayoutPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Chat Prompt Layout</h1>
      <DocsLead>
        A full-height chat layout with scrollable messages and a bottom-anchored prompt slot,
        including contextual scroll navigation buttons. Independently installable.
      </DocsLead>

      <DocsH2 id="install">Install</DocsH2>
      <CodeBlock
        lang="bash"
        code="npx shadcn@latest add https://prompt-area.com/r/chat-prompt-layout.json"
      />

      <DocsH2 id="example">Example</DocsH2>
      <DocsExample
        id="demo"
        title="Chat layout"
        description="Messages scroll independently while the prompt area stays anchored at the bottom. Scroll navigation buttons appear contextually."
        code={chatPromptLayoutCode}>
        <ChatPromptLayoutExample />
      </DocsExample>
    </>
  )
}
