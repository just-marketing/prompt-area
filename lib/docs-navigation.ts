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
      { title: 'Try it Live', href: '/docs/try-it-live' },
    ],
  },
  {
    title: 'Components',
    items: [
      { title: 'Prompt Area', href: '/docs/components/prompt-area' },
      { title: 'Action Bar', href: '/docs/components/action-bar' },
      { title: 'Status Bar', href: '/docs/components/status-bar' },
      { title: 'Compact Prompt Area', href: '/docs/components/compact-prompt-area' },
      { title: 'Chat Prompt Layout', href: '/docs/components/chat-prompt-layout' },
    ],
  },
  {
    title: 'Examples',
    items: [
      { title: 'Overview', href: '/docs/examples' },
      { title: 'Triggers', href: '/docs/examples/triggers' },
      { title: 'Formatting', href: '/docs/examples/formatting' },
      { title: 'Attachments', href: '/docs/examples/attachments' },
      { title: 'DX Helpers', href: '/docs/examples/dx-helpers' },
      { title: 'Vercel AI SDK', href: '/docs/examples/vercel-ai-sdk' },
      { title: 'Collaborative', href: '/docs/examples/collaborative' },
    ],
  },
  {
    title: 'Tools',
    items: [{ title: 'Inspector', href: '/docs/inspector' }],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'PromptArea Props', href: '/docs/api/prompt-area' },
      { title: 'Hooks & Helpers', href: '/docs/api/hooks' },
    ],
  },
  {
    title: 'More',
    items: [
      { title: 'Styles', href: '/styles' },
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
