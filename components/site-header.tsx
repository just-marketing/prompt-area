'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

// Sticky top bar for the main content column. Holds site-level navigation and
// ends with the GitHub repo link + theme toggle. The left-side padding clears
// the fixed mobile sidebar toggle (which is only shown below `lg`).

const NAV_LINKS = [
  { href: '/compare', label: 'Compare' },
  { href: '/blog', label: 'Blog' },
  { href: '/for-ai-apps', label: 'For AI Apps' },
] as const

const REPO_URL = 'https://github.com/just-marketing/prompt-area'

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-4 pl-16 lg:px-6">
        <nav aria-label="Site" className="flex items-center gap-0.5 overflow-x-auto">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150',
                  'hover:text-foreground',
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            title="GitHub repository"
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-2 transition-colors">
            <Github className="size-4" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
