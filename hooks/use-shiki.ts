import { useEffect, useState } from 'react'
import { createHighlighter, type Highlighter } from 'shiki'
import { tomorrowNightBright } from '@/lib/tomorrow-night-bright'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', tomorrowNightBright],
      langs: ['tsx'],
    })
  }
  return highlighterPromise
}

export function useShikiHighlight(code: string, lang: string = 'tsx') {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((hl) => {
      if (cancelled) return
      const result = hl.codeToHtml(code, {
        lang,
        themes: {
          light: 'github-light',
          dark: 'tomorrow-night-bright',
        },
        defaultColor: false,
      })
      setHtml(result)
    })
    return () => {
      cancelled = true
    }
  }, [code, lang])

  return html
}
