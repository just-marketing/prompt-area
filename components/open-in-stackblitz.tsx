import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Single source of truth for the live example on StackBlitz. StackBlitz boots
// the `examples/basic` folder straight from GitHub — running `npm install` and
// the Vite dev server in the browser (WebContainers, no sign-in required).
const REPO_PATH = 'just-marketing/prompt-area/tree/main/examples/basic'

/** Launches the full StackBlitz editor in a new tab. */
export const STACKBLITZ_URL = `https://stackblitz.com/github/${REPO_PATH}?file=src%2FApp.tsx`

/** Embeds the running example inline (editor + preview). */
export const STACKBLITZ_EMBED_URL = `https://stackblitz.com/github/${REPO_PATH}?embed=1&file=src%2FApp.tsx&hideNavigation=1&theme=dark`

export function OpenInStackBlitz({ className }: { className?: string }) {
  return (
    <a
      href={STACKBLITZ_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
        className,
      )}>
      Open in StackBlitz
      <ArrowUpRight className="size-3.5" />
    </a>
  )
}
