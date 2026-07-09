'use client'

import { useState } from 'react'
import { PromptArea, segmentsToPlainText, type Segment } from 'prompt-area'

export function RichPasteExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const markdown = segmentsToPlainText(segments)
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          markdown
          placeholder="Paste from Slack, Notion, Google Docs, GitHub, or any web page — rich text becomes clean markdown..."
          minHeight={110}
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-muted-foreground text-xs">Markdown output (value)</div>
        <pre className="bg-muted/50 max-h-56 overflow-auto rounded-lg border p-3 text-xs whitespace-pre-wrap">
          {markdown || 'Nothing pasted yet — copy a list or formatted text and paste it above.'}
        </pre>
      </div>
    </div>
  )
}

export const richPasteCode = `import { useState } from 'react'
import { PromptArea, segmentsToPlainText } from '@/components/prompt-area'
import type { Segment } from '@/components/types'

function RichPasteExample() {
  const [segments, setSegments] = useState<Segment[]>([])

  // With \`markdown\` on, paste reads the richest clipboard flavor available:
  //   1. text/markdown — e.g. Slack "Copy message" (keeps nested lists)
  //   2. text/html     — Notion, Google Docs, GitHub, web pages
  //   3. text/plain    — fallback
  // The result is stored as markdown source, so \`value\` is ready to send.
  const markdown = segmentsToPlainText(segments)

  return (
    <div className="flex flex-col gap-2">
      <PromptArea
        value={segments}
        onChange={setSegments}
        markdown
        placeholder="Paste from Slack, Notion, Google Docs, GitHub, or any web page..."
        minHeight={110}
      />
      <pre>{markdown}</pre>
    </div>
  )
}`
