import { createHighlighter, type Highlighter } from 'shiki'
import { tomorrowNightBright } from '@/lib/tomorrow-night-bright'
import { cn } from '@/lib/utils'

// Server-side syntax highlighting. Pages that use this are statically
// generated, so Shiki runs at build time and the highlighted HTML ships in
// the static output — no client JS, fully crawlable. Dual-theme colors are
// switched by the .shiki / .dark .shiki rules in globals.css.

export type CodeLang = 'tsx' | 'bash'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', tomorrowNightBright],
      langs: ['tsx', 'bash'],
    })
  }
  return highlighterPromise
}

export async function CodeBlock({
  code,
  lang = 'tsx',
  className,
}: {
  code: string
  lang?: CodeLang
  className?: string
}) {
  const highlighter = await getHighlighter()
  const html = highlighter.codeToHtml(code, {
    lang,
    themes: { light: 'github-light', dark: 'tomorrow-night-bright' },
    defaultColor: false,
  })

  return (
    <div
      className={cn(
        'bg-muted/50 overflow-x-auto rounded-lg border p-4 text-xs leading-relaxed',
        '[&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
