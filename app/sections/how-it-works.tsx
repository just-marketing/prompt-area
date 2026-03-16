import { SectionHeading } from './section-heading'

export function HowItWorks() {
  return (
    <div id="how-it-works" className="flex scroll-mt-16 flex-col gap-6">
      <SectionHeading id="how-it-works" as="h2">
        How It Works
      </SectionHeading>

      <div className="flex flex-col gap-5">
        <div className="flex gap-4">
          <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            1
          </div>
          <div>
            <h3 className="text-sm font-semibold">Install via shadcn CLI</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              One command adds the component to your project. No config files, no provider wrappers,
              no extra dependencies.
            </p>
            <div className="bg-muted mt-2 rounded-md px-3 py-2 font-mono text-xs">
              npx shadcn@latest add https://prompt-area.com/r/prompt-area.json
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            2
          </div>
          <div>
            <h3 className="text-sm font-semibold">Define your triggers</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Pass an array of trigger configs &mdash;{' '}
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">@</code> for mentions,{' '}
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">/</code> for commands,{' '}
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">#</code> for tags. Each
              trigger specifies its search behavior, item list, and resolve logic.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            3
          </div>
          <div>
            <h3 className="text-sm font-semibold">Get structured output</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              On submit, Prompt Area returns typed segments &mdash; plain text, chips with metadata,
              markdown spans. Use helper functions like{' '}
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                getChipsByTrigger(&quot;@&quot;)
              </code>{' '}
              to extract exactly what you need.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
