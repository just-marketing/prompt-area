import Link from 'next/link'
import { ArrowUpRight, Github, Star, TextCursorInput } from 'lucide-react'

// Sitewide footer. Renders at the end of every page's content (below the
// sidebar's main column). This is the home for discovery/navigation links so
// the persistent sidebar can stay focused on section nav + core controls.

type FooterLink = { href: string; label: string; external?: boolean }

const LINK_GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/docs', label: 'Docs' },
      { href: '/styles', label: 'Styles' },
      { href: '/compare', label: 'Comparison' },
      { href: '/for-ai-apps', label: 'For AI Apps' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/docs/installation', label: 'Installation' },
      { href: '/docs/examples', label: 'Examples' },
      { href: '/blog', label: 'Blog' },
      { href: '/llms.txt', label: 'llms.txt' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/press', label: 'Press' },
      { href: '/partners', label: 'Partners' },
    ],
  },
]

const REPO_URL = 'https://github.com/just-marketing/prompt-area'

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors'
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
        <ArrowUpRight className="size-3" />
      </a>
    )
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  )
}

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-border mt-16 border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
              <TextCursorInput className="text-foreground size-5 shrink-0" />
              <span className="text-foreground text-sm font-semibold tracking-tight">
                Prompt Area
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              The shadcn chat input for React — @mentions, /commands, #tags, and file attachments
              with zero extra dependencies.
            </p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent/50 text-foreground hover:bg-accent group inline-flex w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors">
              <Github className="size-4 shrink-0" />
              Star on GitHub
              <Star className="text-muted-foreground size-3.5 transition-colors group-hover:text-yellow-500" />
            </a>
          </div>

          {/* Link groups */}
          {LINK_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3">
              <h2 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                {group.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-border text-muted-foreground flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Prompt Area · MIT License · Built by{' '}
            <a
              href="https://juma.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-4 transition-colors">
              Juma
            </a>
          </p>
          <a
            href="https://github.com/just-marketing/agency-skills"
            target="_blank"
            rel="noopener noreferrer"
            title="Claude Code skills for marketing agencies — a sibling open-source project by Juma"
            className="hover:text-foreground inline-flex items-center gap-1 underline underline-offset-4 transition-colors">
            Agency Skills
            <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  )
}
