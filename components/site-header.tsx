'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, TextCursorInput, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { GithubIcon } from '@/components/github-icon'
import { ThemeToggle } from '@/components/theme-toggle'

// Sticky global header: brand on the left, site nav, and the GitHub repo link
// + theme toggle on the right. Below `md`, the nav collapses into a toggle menu.

const NAV_LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/styles', label: 'Styles' },
  { href: '/compare', label: 'Compare' },
  { href: '/blog', label: 'Blog' },
  { href: '/for-ai-apps', label: 'For AI Apps' },
] as const

const REPO_URL = 'https://github.com/just-marketing/prompt-area'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the mobile menu on navigation.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close menu when route changes
    setOpen(false)
  }, [pathname])

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-foreground flex items-center gap-2 transition-opacity hover:opacity-70">
            <TextCursorInput className="size-5 shrink-0" />
            <span className="text-sm font-semibold tracking-tight">Prompt Area</span>
          </Link>
          <nav aria-label="Site" className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() =>
                  track('nav_link_clicked', {
                    label: link.label,
                    href: link.href,
                    location: 'header',
                  })
                }
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors duration-150',
                  'hover:text-foreground',
                  isActive(pathname, link.href)
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground',
                )}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            title="GitHub repository"
            onClick={() => track('github_clicked', { location: 'header' })}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-2 transition-colors">
            <GithubIcon className="size-4" />
          </a>
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-2 transition-colors md:hidden">
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          aria-label="Site"
          className="bg-background flex flex-col gap-0.5 border-t px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() =>
                track('nav_link_clicked', {
                  label: link.label,
                  href: link.href,
                  location: 'header',
                })
              }
              className={cn(
                'rounded-md px-2 py-2 text-sm transition-colors',
                'hover:bg-accent',
                isActive(pathname, link.href)
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground',
              )}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
