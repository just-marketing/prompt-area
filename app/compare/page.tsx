import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { COMPARISONS, SITE_URL } from '../vs/comparisons'
import { ComparisonSection } from '../sections/comparison-section'

export const metadata: Metadata = {
  title: 'Compare Prompt Area vs Tiptap, Lexical, Plate.js & react-mentions',
  description:
    'Honest side-by-side comparisons of Prompt Area against react-mentions, Tiptap, Plate.js, Lexical, and assistant-ui. Find the right React chat input or rich text editor for your project.',
  alternates: { canonical: `${SITE_URL}/compare` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare`,
    title: 'Compare Prompt Area vs Tiptap, Lexical, Plate.js & react-mentions',
    description:
      'Honest side-by-side comparisons of Prompt Area against the most popular React rich text and chat input libraries.',
  },
}

export default function ComparePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Compare Prompt Area</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Choosing a React chat input or rich text editor? These honest, side-by-side comparisons
          show where Prompt Area is the better fit — and where another library makes more sense.
        </p>
      </header>

      <div className="grid gap-3">
        {COMPARISONS.map((c) => (
          <Link
            key={c.slug}
            href={`/vs/${c.slug}`}
            className="group hover:bg-accent/40 flex items-start justify-between gap-4 rounded-lg border p-5 transition-colors">
            <div className="flex flex-col gap-1.5">
              <span className="text-base font-semibold">Prompt Area vs {c.name}</span>
              <span className="text-muted-foreground text-sm leading-relaxed">{c.tldr}</span>
            </div>
            <ArrowRight className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Feature matrix</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          How Prompt Area stacks up against every alternative across the features that matter for a
          chat or prompt input.
        </p>
        <ComparisonSection />
      </section>
    </div>
  )
}
