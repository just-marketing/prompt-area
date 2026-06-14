import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CircleCheck, CircleMinus, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COMPARISONS,
  getComparison,
  SITE_URL,
  INSTALL_CMD,
  type Comparison,
  type Support,
} from '../comparisons'

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const comparison = getComparison(slug)
  if (!comparison) return {}
  const url = `${SITE_URL}/vs/${comparison.slug}`
  return {
    title: comparison.metaTitle,
    description: comparison.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: comparison.metaTitle,
      description: comparison.metaDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: comparison.metaTitle,
      description: comparison.metaDescription,
    },
  }
}

function SupportCell({ value }: { value: Support | string }) {
  if (value === 'full') {
    return (
      <CircleCheck className="mx-auto size-4 text-green-600 dark:text-green-400" aria-label="Yes" />
    )
  }
  if (value === 'partial') {
    return (
      <CircleMinus
        className="mx-auto size-4 text-amber-500 dark:text-amber-400"
        aria-label="Partial"
      />
    )
  }
  if (value === 'none') {
    return <CircleX className="text-muted-foreground/40 mx-auto size-4" aria-label="No" />
  }
  return <span className="text-foreground/70 text-xs">{value}</span>
}

function ChooseList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="text-muted-foreground flex gap-2 text-sm leading-relaxed">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function structuredData(c: Comparison) {
  const url = `${SITE_URL}/vs/${c.slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: c.heading,
        description: c.metaDescription,
        url,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Juma.ai', url: 'https://juma.ai' },
        publisher: {
          '@type': 'Organization',
          name: 'Juma.ai',
          url: 'https://juma.ai',
          sameAs: ['https://github.com/just-marketing'],
        },
        about: ['Prompt Area', c.name],
      },
      {
        '@type': 'FAQPage',
        mainEntity: c.faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  }
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = getComparison(slug)
  if (!c) notFound()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(c)) }}
      />

      <Link
        href="/compare"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        All comparisons
      </Link>

      <header className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Comparison · {c.kind}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.heading}</h1>
        <p className="text-muted-foreground text-base leading-relaxed">{c.tldr}</p>
      </header>

      {/* Intro */}
      <section className="flex flex-col gap-3">
        {c.intro.map((p) => (
          <p key={p.slice(0, 32)} className="text-muted-foreground leading-relaxed">
            {p}
          </p>
        ))}
      </section>

      {/* What is X */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">
          What is{' '}
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 underline underline-offset-4">
            {c.name}
            <ArrowUpRight className="size-4" />
          </a>
          ?
        </h2>
        <p className="text-muted-foreground leading-relaxed">{c.competitorSummary}</p>
      </section>

      {/* Feature matrix */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Feature comparison</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th
                  scope="col"
                  className="bg-background min-w-[160px] border-r px-4 py-3 text-left text-xs font-medium">
                  Feature
                </th>
                <th
                  scope="col"
                  className="bg-primary/5 border-primary/20 min-w-[110px] border-r px-4 py-3 text-center text-xs font-semibold">
                  Prompt Area
                </th>
                <th
                  scope="col"
                  className="min-w-[110px] px-4 py-3 text-center text-xs font-semibold">
                  {c.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {c.features.map((row, i) => (
                <tr
                  key={row.feature}
                  className={cn('border-t', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                  <th
                    scope="row"
                    className="bg-background border-r px-4 py-3 text-left text-xs font-medium">
                    {row.feature}
                  </th>
                  <td className="bg-primary/5 border-primary/20 border-r px-4 py-3 text-center">
                    <SupportCell value={row.promptArea} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <SupportCell value={row.competitor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strengths */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border p-5">
          <h3 className="text-base font-semibold">Where Prompt Area wins</h3>
          <ul className="flex flex-col gap-2">
            {c.promptAreaStrengths.map((item) => (
              <li key={item} className="text-muted-foreground flex gap-2 text-sm leading-relaxed">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border p-5">
          <h3 className="text-base font-semibold">Where {c.name} wins</h3>
          <ul className="flex flex-col gap-2">
            {c.competitorStrengths.map((item) => (
              <li key={item} className="text-muted-foreground flex gap-2 text-sm leading-relaxed">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* When to choose */}
      <section className="grid gap-4 sm:grid-cols-2">
        <ChooseList title="Choose Prompt Area when…" items={c.choosePromptAreaWhen} />
        <ChooseList title={`Choose ${c.name} when…`} items={c.chooseCompetitorWhen} />
      </section>

      {/* Migration (optional) */}
      {c.migration && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Migrating from {c.name}</h2>
          <p className="text-muted-foreground leading-relaxed">{c.migration.intro}</p>
          <ol className="flex flex-col gap-2">
            {c.migration.steps.map((step, i) => (
              <li
                key={step.slice(0, 24)}
                className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
                <span className="bg-accent text-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <div className="flex flex-col gap-4">
          {c.faq.map((f) => (
            <div key={f.question} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold">{f.question}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/30 flex flex-col gap-4 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Try Prompt Area</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Install the shadcn registry component and drop a production-grade chat input into your
          app.
        </p>
        <code className="bg-background text-foreground overflow-x-auto rounded-md border px-3 py-2 font-mono text-xs">
          {INSTALL_CMD}
        </code>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90">
            View the demo
          </Link>
          <a
            href="https://github.com/just-marketing/prompt-area"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
            Star on GitHub
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </section>
    </div>
  )
}
