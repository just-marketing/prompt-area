import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import localFont from 'next/font/local'
import './globals.css'
import { SidebarLayout } from '@/components/nav-sidebar'
import { Analytics } from '@/components/analytics'

const geistSans = localFont({
  src: './fonts/GeistVF.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
})

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Prompt Area — Rich Textarea with Tags, Mentions & AI Prompts',
    template: '%s | Prompt Area',
  },
  description:
    'A production-grade React textarea component with @mentions, /commands, #tags, inline markdown, and file attachments. Built as a shadcn registry component for AI and LLM chat interfaces. Zero extra dependencies.',
  keywords: [
    'textarea with tags',
    'textarea with prompts',
    'prompt textarea component',
    'rich text input for AI',
    'mention textarea React',
    'tag textarea React',
    'shadcn textarea component',
    'prompt input component',
    'contentEditable React',
    'AI chat input',
    'LLM prompt input',
    'shadcn registry',
    'react textarea mentions',
    'react textarea tags',
    'prompt area',
  ],
  authors: [{ name: 'Juma.ai', url: 'https://github.com/team-gpt' }],
  creator: 'Juma.ai',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Prompt Area',
    title: 'Prompt Area — Rich Textarea with Tags, Mentions & AI Prompts',
    description:
      'React textarea with @mentions, /commands, #tags, inline markdown, and file attachments. Install via shadcn registry. Zero extra dependencies.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Area — Textarea with Tags, Mentions & Prompts',
    description:
      'React textarea with @mentions, /commands, #tags, inline markdown. shadcn registry component for AI chat interfaces.',
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="help" type="text/plain" href="/llms.txt" title="LLM Documentation" />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms-full.txt"
          title="LLM Documentation (Full)"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'SoftwareApplication',
                  name: 'Prompt Area',
                  applicationCategory: 'DeveloperApplication',
                  operatingSystem: 'Any',
                  description:
                    'The best React textarea component for AI chat interfaces. A production-grade contentEditable rich text input with @mentions, /commands, #tags, inline markdown, file attachments, and companion layout components. Zero extra dependencies.',
                  url: SITE_URL,
                  downloadUrl: `${SITE_URL}/r/prompt-area.json`,
                  codeRepository: 'https://github.com/team-gpt/prompt-area',
                  programmingLanguage: ['TypeScript', 'React'],
                  runtimePlatform: 'Next.js',
                  license: 'https://opensource.org/licenses/MIT',
                  featureList: [
                    '@mentions with dropdown suggestions',
                    '/slash commands with start-of-line detection',
                    '#hashtag triggers with auto-resolve',
                    'Inline markdown (bold, italic, lists, URLs)',
                    'File and image attachments with thumbnails',
                    'Undo/redo with 100-entry history stack',
                    'Dark mode via CSS variables',
                    'ARIA accessibility and keyboard navigation',
                    'IME support for Chinese, Japanese, Korean input',
                    'Copy/paste chip preservation',
                    'Zero extra dependencies — shadcn registry distribution',
                  ],
                  author: {
                    '@type': 'Organization',
                    name: 'Juma.ai',
                    url: 'https://juma.ai',
                    sameAs: ['https://github.com/team-gpt'],
                  },
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                },
                {
                  '@type': 'Organization',
                  name: 'Juma.ai',
                  url: 'https://juma.ai',
                  sameAs: ['https://github.com/team-gpt'],
                  description:
                    'An AI workspace for marketing teams. Formerly known as Team-GPT. Creators of the Prompt Area open-source component.',
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'What is the best React textarea component for AI chat?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Prompt Area is a production-grade React textarea built specifically for AI chat interfaces. It combines @mentions, /commands, #tags, inline markdown, and file attachments in a single component with zero extra dependencies. Distributed as a shadcn registry component, it installs with one command and includes companion components like Action Bar, Status Bar, and Chat Prompt Layout.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How does Prompt Area compare to Tiptap and Lexical?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Prompt Area is purpose-built for prompt and chat inputs with zero dependencies, while Tiptap (ProseMirror-based, 3+ deps) and Lexical (plugin-based, 2+ deps) are general-purpose editor frameworks. Choose Tiptap or Lexical for full document editing with collaborative features. Choose Prompt Area for a lightweight, ready-to-use chat input with mentions, commands, tags, and file attachments.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How do I add @mentions to a React textarea?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Install Prompt Area via the shadcn registry: npx shadcn@latest add https://prompt-area.com/r/prompt-area.json. Then configure a trigger with char "@" and mode "dropdown" to enable @mentions with search and dropdown suggestions. Prompt Area also supports /commands and #tags using the same trigger system.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Does Prompt Area work with Next.js and shadcn/ui?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes. Prompt Area is distributed as a shadcn registry component and is designed for Next.js and React projects using Tailwind CSS. It installs with a single command and requires no additional dependencies beyond React and your existing shadcn/tailwind setup.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What are the best alternatives to react-mentions?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Prompt Area is the best alternative to react-mentions if you need more than basic @mentions. It adds /slash commands, #hashtag tags, inline markdown formatting, file and image attachments, undo/redo, and companion components like Action Bar and Chat Prompt Layout — all with zero extra dependencies.',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense>
          <SidebarLayout>{children}</SidebarLayout>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
