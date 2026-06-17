import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Single source of truth for the live example on CodeSandbox. CodeSandbox boots
// the `examples/basic` folder straight from GitHub — running `npm install` and
// the Vite dev server in the browser.
const REPO_PATH = 'just-marketing/prompt-area/tree/main/examples/basic'

/** Launches the full CodeSandbox editor in a new tab. */
export const CODESANDBOX_URL = `https://codesandbox.io/s/github/${REPO_PATH}`

/** Embeds the running example inline (preview + editor). */
export const CODESANDBOX_EMBED_URL = `https://codesandbox.io/embed/github/${REPO_PATH}?module=/src/App.tsx&view=split&hidenavigation=1&theme=dark`

export function OpenInCodeSandbox({ className }: { className?: string }) {
  return (
    <a
      href={CODESANDBOX_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
        className,
      )}>
      Open in CodeSandbox
      <ArrowUpRight className="size-3.5" />
    </a>
  )
}
