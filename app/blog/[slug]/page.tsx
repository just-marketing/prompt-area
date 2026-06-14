import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { POSTS, getPost, SITE_URL, type Post } from '../posts'
import { PostContent } from '../post-content'

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const url = `${SITE_URL}/blog/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

function structuredData(post: Post) {
  const url = `${SITE_URL}/blog/${post.slug}`
  const graph: object[] = [
    {
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      url,
      mainEntityOfPage: url,
      keywords: post.keywords.join(', '),
      author: { '@type': 'Organization', name: 'Juma.ai', url: 'https://juma.ai' },
      publisher: {
        '@type': 'Organization',
        name: 'Juma.ai',
        url: 'https://juma.ai',
        sameAs: ['https://github.com/just-marketing'],
      },
    },
  ]
  if (post.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: post.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(post)) }}
      />

      <Link
        href="/blog"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        All articles
      </Link>

      <header className="flex flex-col gap-4">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="text-muted-foreground text-base leading-relaxed">{post.excerpt}</p>
      </header>

      <PostContent blocks={post.blocks} />

      {post.faq?.length ? (
        <section className="flex flex-col gap-4 border-t pt-8">
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          <div className="flex flex-col gap-4">
            {post.faq.map((f) => (
              <div key={f.question} className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold">{f.question}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {post.related?.length ? (
        <section className="flex flex-col gap-3 border-t pt-8">
          <h2 className="text-sm font-semibold">Keep reading</h2>
          <div className="flex flex-col gap-2">
            {post.related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
                <ArrowUpRight className="size-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-muted/30 flex flex-col gap-3 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Build it with Prompt Area</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          A zero-dependency React chat input with @mentions, /commands, #tags, and file attachments
          — installed from the shadcn registry.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90">
            View the demo
          </Link>
          <Link
            href="/compare"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
            Compare alternatives
          </Link>
        </div>
      </section>
    </article>
  )
}
