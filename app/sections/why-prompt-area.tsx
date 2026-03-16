import { SectionHeading } from './section-heading'

export function WhyPromptArea() {
  return (
    <div id="why-prompt-area" className="flex scroll-mt-16 flex-col gap-6">
      <SectionHeading id="why-prompt-area" as="h2">
        Why Prompt Area?
      </SectionHeading>

      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-sm font-semibold">One component, not five</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Instead of combining a mention library, command palette, tag input, markdown editor, and
            file upload widget, Prompt Area handles all of these in a single component with a
            unified API.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Zero extra dependencies</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Ships as a shadcn registry component. Your bundle only grows by the component code
            itself &mdash; no ProseMirror, no TipTap, no Slate. Just React and the DOM.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Structured data out of the box</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Every chip, mention, and tag is a typed segment. Call{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              getChipsByTrigger(&quot;@&quot;)
            </code>{' '}
            to extract structured data without parsing HTML. The submit callback gives you clean,
            typed output ready for your API.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Built for AI chat</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Designed from the ground up for LLM prompt interfaces. Action Bar, Status Bar, Compact
            Prompt Area, and Chat Prompt Layout are all first-class companion components that
            install independently.
          </p>
        </div>
      </div>
    </div>
  )
}
