import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { POSTS, SITE_URL } from './posts'

export const metadata: Metadata = {
  title: 'Blog — Guides for React Chat Inputs & AI Prompt UIs',
  description:
    'Tutorials and guides on building AI chat inputs in React: @mentions, /commands, structured output, and migrating from react-mentions — from the team behind Prompt Area.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    title: 'Prompt Area Blog — React Chat Input & AI Prompt UI Guides',
    description:
      'Tutorials on building AI chat inputs in React: mentions, slash commands, structured output, and migrations.',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function BlogIndexPage() {
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Guides on building AI chat inputs and prompt UIs in React — mentions, slash commands,
          structured output, and practical migrations.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group hover:bg-accent/40 flex flex-col gap-2 rounded-lg border p-5 transition-colors">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{post.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>
            <span className="text-foreground mt-1 inline-flex items-center gap-1 text-sm font-medium">
              Read article
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
