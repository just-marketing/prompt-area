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
  maximumScale: 1,
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
              '@type': 'SoftwareSourceCode',
              name: 'Prompt Area',
              description:
                'A production-grade React textarea component with trigger-based chips (@mentions, /commands, #tags), inline markdown, undo/redo, file attachments, and dark mode. Built as a shadcn registry component.',
              url: SITE_URL,
              codeRepository: 'https://github.com/team-gpt/prompt-area',
              programmingLanguage: ['TypeScript', 'React'],
              runtimePlatform: 'Next.js',
              author: {
                '@type': 'Organization',
                name: 'Juma.ai',
                url: 'https://github.com/team-gpt',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
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
