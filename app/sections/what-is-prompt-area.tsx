import { SectionHeading } from './section-heading'

export function WhatIsPromptArea() {
  return (
    <div id="what-is-prompt-area" className="flex scroll-mt-16 flex-col gap-4">
      <SectionHeading id="what-is-prompt-area" as="h2">
        What is Prompt Area?
      </SectionHeading>
      <div className="text-muted-foreground flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          Most textarea components handle plain text. When you need structured input &mdash;
          mentions, slash commands, tags &mdash; you end up stitching together multiple libraries or
          building from scratch on top of a heavy editor framework like ProseMirror or Slate.
        </p>
        <p>
          Prompt Area is a single{' '}
          <code className="bg-muted rounded px-1.5 py-0.5 text-xs">contentEditable</code>-based
          React component that gives you trigger-based chips, inline markdown formatting, file
          attachments, and structured data extraction &mdash; all in one package with no external
          editor dependencies.
        </p>
        <p>
          Built specifically for AI and LLM chat interfaces, where inputs need to be richer than a
          plain textarea but lighter than a full document editor. Install it with one command from
          the{' '}
          <a
            href="https://ui.shadcn.com/docs/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4">
            shadcn registry
          </a>{' '}
          and start using it immediately.
        </p>
      </div>
    </div>
  )
}
