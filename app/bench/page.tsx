'use client'

/**
 * Dev-only typing benchmark page for the PromptArea component.
 *
 * Driven by scripts/bench-typing.mjs (Playwright), but also usable by hand:
 *
 *   /bench?lines=600&mode=md&autogrow=1
 *
 * Seeds `lines` lines of content exercising every decoration pass (bullets,
 * indents, ordered lists, headings, bold/italic, URLs) and exposes:
 *   window.__benchReady            – content is mounted and decorated
 *   window.__placeCaretAtLine(n)   – put the caret at the end of line n
 */

import { notFound } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { PromptArea } from 'prompt-area'
import type { Segment } from 'prompt-area'

declare global {
  interface Window {
    __benchReady?: boolean
    __placeCaretAtLine?: (line: number) => boolean
  }
}

function buildBenchText(lineCount: number, mode: 'md' | 'plain'): string {
  const lines: string[] = []
  for (let i = 0; i < lineCount; i++) {
    if (mode === 'plain') {
      lines.push(`Line ${i}: The quick brown fox jumps over the lazy dog near the river bank.`)
      continue
    }
    switch (i % 10) {
      case 3:
        lines.push(`  • bullet ${i} with **bold** emphasis`)
        break
      case 4:
        lines.push(`## Heading ${i} with *italic* flair`)
        break
      case 5:
        lines.push(`1. first step of block ${i}`)
        break
      case 6:
        lines.push(`2. second step of block ${i}`)
        break
      case 7:
        lines.push(`see https://example.com/path/${i} for details`)
        break
      default:
        lines.push(`Line ${i}: The quick brown fox jumps over the lazy dog near the river bank.`)
    }
  }
  return lines.join('\n')
}

function placeCaretAtLine(line: number): boolean {
  const editor = document.querySelector<HTMLElement>('[data-test-id="bench-editor"]')
  if (!editor) return false
  editor.focus()

  let brCount = 0
  for (let i = 0; i < editor.childNodes.length; i++) {
    if (editor.childNodes[i].nodeName === 'BR') {
      brCount++
      if (brCount === line) {
        // The boundary just before the line's terminating <br> = end of line.
        const range = document.createRange()
        range.setStart(editor, i)
        range.collapse(true)
        const sel = window.getSelection()
        if (!sel) return false
        sel.removeAllRanges()
        sel.addRange(range)
        return true
      }
    }
  }
  return false
}

export default function BenchPage() {
  const [value, setValue] = useState<Segment[]>([])
  const [config, setConfig] = useState<{ autoGrow: boolean } | null>(null)
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current) return
    seeded.current = true

    const params = new URLSearchParams(window.location.search)
    const lines = Math.max(1, Number(params.get('lines') ?? 400))
    const mode = params.get('mode') === 'plain' ? 'plain' : 'md'
    const autoGrow = params.get('autogrow') !== '0'

    setConfig({ autoGrow })
    setValue([{ type: 'text', text: buildBenchText(lines, mode) }])
    window.__placeCaretAtLine = placeCaretAtLine

    // Two frames: one for React to commit the value, one for the decorated
    // paint to settle before the harness starts measuring.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.__benchReady = true
      })
    })
  }, [])

  // Dev tool only — a production build serves 404 here.
  if (process.env.NODE_ENV === 'production') notFound()

  if (!config) {
    return <main className="p-8 font-mono text-sm">bench: seeding…</main>
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 font-mono text-sm text-neutral-500">
        prompt-area typing benchmark — {value.length ? 'ready' : 'seeding'}
      </h1>
      <PromptArea
        value={value}
        onChange={setValue}
        markdown
        markdownHeadings
        autoGrow={config.autoGrow}
        maxHeight={480}
        minHeight={200}
        data-test-id="bench-editor"
        className="rounded-lg border border-neutral-300"
      />
    </main>
  )
}
