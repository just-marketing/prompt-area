// Central docs navigation config — single source of truth for the docs
// sidebar, the mobile nav, and prev/next pagination. Mirrors the pattern used
// by vercel-labs/json-render's docs site.

export type NavItem = {
  title: string
  href: string
  external?: boolean
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export const docsNavigation: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Quick Start', href: '/docs/quick-start' },
    ],
  },
  {
    title: 'Components',
    items: [{ title: 'Prompt Area', href: '/docs/components/prompt-area' }],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'PromptArea Props', href: '/docs/api/prompt-area' },
      { title: 'Hooks & Helpers', href: '/docs/api/hooks' },
    ],
  },
  {
    title: 'Examples',
    items: [{ title: 'Browse Examples', href: '/#examples' }],
  },
  {
    title: 'More',
    items: [
      { title: 'Compare', href: '/compare' },
      { title: 'Blog', href: '/blog' },
      { title: 'For AI Apps', href: '/for-ai-apps' },
      {
        title: 'GitHub',
        href: 'https://github.com/just-marketing/prompt-area',
        external: true,
      },
    ],
  },
]

/** Flattened, ordered list of real /docs pages — drives prev/next pagination. */
export const docsPageOrder: NavItem[] = docsNavigation
  .flatMap((section) => section.items)
  .filter((item) => !item.external && item.href.startsWith('/docs'))
