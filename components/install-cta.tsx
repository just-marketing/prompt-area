import { ArrowRight } from 'lucide-react'
import { InstallMethodTabs } from '@/components/install-method-tabs'
import { TrackedLink } from '@/components/tracked-link'
import { cn } from '@/lib/utils'

/**
 * Reusable "Drop it into your app" install call-to-action: a heading, blurb,
 * the AI agent / npm / shadcn install tabs, and links into the docs. Shared by
 * the homepage CTA and the marketing pages so every page offers the same
 * one-stop install — including the copy-paste AI agent prompt.
 */
export function InstallCta({
  className,
  heading = 'Drop it into your app',
  description = 'Install with an AI agent, from npm, or copy the source via the shadcn registry. Zero extra dependencies.',
  location = 'install_cta',
}: {
  className?: string
  heading?: string
  description?: string
  /** Analytics label for where this CTA block lives, e.g. 'home', 'compare'. */
  location?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-6 text-center', className)}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <p className="text-muted-foreground max-w-xl">{description}</p>
      <div className="w-full max-w-xl">
        <InstallMethodTabs location={location} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <TrackedLink
          href="/docs"
          event="cta_clicked"
          eventProps={{ cta: 'read_docs', location }}
          className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90">
          Read the docs
          <ArrowRight className="size-4" />
        </TrackedLink>
        <TrackedLink
          href="/docs/quick-start"
          event="cta_clicked"
          eventProps={{ cta: 'quick_start', location }}
          className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors">
          Quick start
        </TrackedLink>
      </div>
    </div>
  )
}
