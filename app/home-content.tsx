'use client'

import { Github } from 'lucide-react'
import { ExampleShowcase } from '@/components/example-showcase'
import {
  BasicExample,
  basicCode,
  MentionsExample,
  mentionsCode,
  CommandsExample,
  commandsCode,
  TagsExample,
  tagsCode,
  CallbackExample,
  callbackCode,
  AsyncSearchExample,
  asyncSearchCode,
  MarkdownExample,
  markdownCode,
  CopyPasteExample,
  copyPasteCode,
  ImageAttachmentsExample,
  imageAttachmentsCode,
  FileAttachmentsExample,
  fileAttachmentsCode,
  ActionBarFullExample,
  actionBarFullCode,
  ActionBarMinimalExample,
  actionBarMinimalCode,
  ActionBarDisabledExample,
  actionBarDisabledCode,
  StatusBarAboveExample,
  statusBarAboveCode,
  StatusBarBelowExample,
  statusBarBelowCode,
  StatusBarBothExample,
  statusBarBothCode,
} from './examples'
import { SectionHeading } from './sections/section-heading'
import { DemoSection } from './sections/demo-section'
import { FeaturesGrid } from './sections/features-grid'
import { InspectorSection } from './sections/inspector-section'
import { DarkThemePreview } from './sections/dark-theme-preview'

export default function HomeContent() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      {/* Hero */}
      <div id="hero" className="flex scroll-mt-16 flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Prompt Area</h1>
          <a
            href="https://github.com/team-gpt/prompt-area"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors">
            <Github className="size-6" />
          </a>
        </div>
        <p className="text-muted-foreground">
          A contentEditable rich text input with trigger-based chips, inline markdown, undo/redo,
          and list auto-formatting. Built as a{' '}
          <a
            href="https://ui.shadcn.com/docs/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            shadcn registry
          </a>{' '}
          component.
        </p>
        <div className="bg-muted rounded-md px-3 py-2 font-mono text-sm">
          npx shadcn@latest add https://prompt-area.com/r/prompt-area.json
        </div>
      </div>

      {/* Demo */}
      <div id="demo" className="scroll-mt-16">
        <DemoSection />
      </div>

      {/* Features */}
      <div id="features" className="flex scroll-mt-16 flex-col gap-4">
        <SectionHeading id="features" as="h2">
          Features
        </SectionHeading>
        <p className="text-muted-foreground text-sm">
          Everything you need for a production-ready rich text input.
        </p>
        <FeaturesGrid />
      </div>

      {/* Inspector */}
      <div id="inspector" className="flex scroll-mt-16 flex-col gap-3">
        <SectionHeading id="inspector" as="h2">
          Inspector
        </SectionHeading>
        <p className="text-muted-foreground text-sm">
          Inspect every event, segment, and API method in real time. Toggle <code>disabled</code>,{' '}
          <code>markdown</code>, and <code>autoGrow</code>. All 4 trigger types (<code>/</code>,{' '}
          <code>@</code>, <code>#</code>, <code>!</code>) and every callback log to the event panel.
          Imperative handle methods are wired to buttons below.
        </p>
        <InspectorSection />
      </div>

      {/* Examples */}
      <div id="examples" className="flex scroll-mt-16 flex-col gap-6">
        <SectionHeading id="examples" as="h2">
          Examples
        </SectionHeading>

        <div id="example-basic" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-basic">Basic (no triggers)</SectionHeading>
          <p className="text-muted-foreground text-xs">Simple text input with Enter to submit.</p>
          <ExampleShowcase code={basicCode}>
            <BasicExample />
          </ExampleShowcase>
        </div>

        <div id="example-mentions" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-mentions">@Mentions</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Type <code>@</code> followed by a name to search users.
          </p>
          <ExampleShowcase code={mentionsCode}>
            <MentionsExample />
          </ExampleShowcase>
        </div>

        <div id="example-commands" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-commands">/Commands (start of line)</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Type <code>/</code> at the beginning of a line for commands.
          </p>
          <ExampleShowcase code={commandsCode}>
            <CommandsExample />
          </ExampleShowcase>
        </div>

        <div id="example-tags" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-tags">#Tags (auto-resolve on space)</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Type <code>#tag</code> and press space to auto-create a chip. Backspace reverts it.
          </p>
          <ExampleShowcase code={tagsCode}>
            <TagsExample />
          </ExampleShowcase>
        </div>

        <div id="example-callback" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-callback">Callback mode (!)</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Type <code>!</code> to fire a callback that programmatically inserts a chip.
          </p>
          <ExampleShowcase code={callbackCode}>
            <CallbackExample />
          </ExampleShowcase>
        </div>

        <div id="example-async" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-async">Async Search</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Type <code>@</code> to trigger an async search with 300ms debounce, AbortSignal
            cancellation, and an empty-state message. Results load after a simulated 500ms delay.
          </p>
          <ExampleShowcase code={asyncSearchCode}>
            <AsyncSearchExample />
          </ExampleShowcase>
        </div>

        <div id="example-markdown" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-markdown">Markdown Formatting</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Wrap text in <code>**bold**</code>, <code>*italic*</code>, or <code>***both***</code> to
            see inline styling. Use <strong>Cmd+B</strong> / <strong>Cmd+I</strong> shortcuts. Start
            a line with <code>- </code> or <code>* </code> for auto-formatted lists (Tab to indent).
          </p>
          <ExampleShowcase code={markdownCode}>
            <MarkdownExample />
          </ExampleShowcase>
        </div>

        <div id="example-copy-paste" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-copy-paste">Copy & Paste</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Select content with chips in the source editor and <strong>Cmd+C</strong> to copy, then{' '}
            <strong>Cmd+V</strong> in the target to paste — chips are preserved. Pasting plain text
            like <code>@Copywriter #campaign</code> from outside auto-resolves matching triggers.
          </p>
          <ExampleShowcase code={copyPasteCode}>
            <CopyPasteExample />
          </ExampleShowcase>
        </div>

        <div id="example-images" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-images">Image Attachments</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Paste an image (screenshot or file) to attach it. Images show a loading spinner during
            upload simulation. Click &times; to remove. Use <code>imagePosition</code> to control
            placement.
          </p>
          <ExampleShowcase code={imageAttachmentsCode}>
            <ImageAttachmentsExample />
          </ExampleShowcase>
        </div>

        <div id="example-files" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="example-files">File Attachments</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Attach files with icon, name, and metadata. Cards show a file-type icon, truncated
            filename, and extension/size. With 4+ files, only the first 3 are shown with a &ldquo;+N
            more&rdquo; button to expand. Click &times; to remove.
          </p>
          <ExampleShowcase code={fileAttachmentsCode}>
            <FileAttachmentsExample />
          </ExampleShowcase>
        </div>
      </div>

      {/* ActionBar */}
      <div className="flex flex-col gap-6">
        <div id="action-bar" className="flex scroll-mt-16 flex-col gap-3">
          <SectionHeading id="action-bar" as="h2">
            Action Bar
          </SectionHeading>
          <p className="text-muted-foreground">
            A horizontal toolbar with left and right slots. Pairs with PromptArea for a complete
            chat input experience. Independently installable.
          </p>
          <div className="bg-muted rounded-md px-3 py-2 font-mono text-sm">
            npx shadcn@latest add https://prompt-area.com/r/action-bar.json
          </div>
        </div>

        <div id="action-bar-full" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="action-bar-full">Full-Featured</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Left slot with attach menu (<code>+</code>), <code>@</code> mention, <code>/</code>{' '}
            command, and <code>#</code> tag buttons. Right slot with markdown toggle, microphone,
            and send button. The send button submits the message just like pressing Enter.
          </p>
          <ExampleShowcase code={actionBarFullCode}>
            <ActionBarFullExample />
          </ExampleShowcase>
        </div>

        <div id="action-bar-minimal" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="action-bar-minimal">Minimal</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Just a send button on the right. The simplest composition.
          </p>
          <ExampleShowcase code={actionBarMinimalCode}>
            <ActionBarMinimalExample />
          </ExampleShowcase>
        </div>

        <div id="action-bar-disabled" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="action-bar-disabled">Disabled</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Both PromptArea and ActionBar in disabled state.
          </p>
          <ExampleShowcase code={actionBarDisabledCode}>
            <ActionBarDisabledExample />
          </ExampleShowcase>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-col gap-6">
        <div id="status-bar" className="flex scroll-mt-16 flex-col gap-3">
          <SectionHeading id="status-bar" as="h2">
            Status Bar
          </SectionHeading>
          <p className="text-muted-foreground">
            A horizontal bar with left and right slots for displaying contextual information. Sits
            above or below the PromptArea to show things like branch name, model selector, or project
            context. Independently installable.
          </p>
          <div className="bg-muted rounded-md px-3 py-2 font-mono text-sm">
            npx shadcn@latest add https://prompt-area.com/r/status-bar.json
          </div>
        </div>

        <div id="status-bar-above" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="status-bar-above">Above Input</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Status bar above the prompt area showing project context and settings.
          </p>
          <ExampleShowcase code={statusBarAboveCode}>
            <StatusBarAboveExample />
          </ExampleShowcase>
        </div>

        <div id="status-bar-below" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="status-bar-below">Below Input</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Status bar below the prompt area with action shortcuts and model selector.
          </p>
          <ExampleShowcase code={statusBarBelowCode}>
            <StatusBarBelowExample />
          </ExampleShowcase>
        </div>

        <div id="status-bar-both" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="status-bar-both">Combined with Action Bar</SectionHeading>
          <p className="text-muted-foreground text-xs">
            Status bar on top with an action bar below the input for a full-featured layout.
          </p>
          <ExampleShowcase code={statusBarBothCode}>
            <StatusBarBothExample />
          </ExampleShowcase>
        </div>
      </div>

      {/* Dark Theme */}
      <div className="flex flex-col gap-6">
        <div id="dark-theme" className="flex scroll-mt-16 flex-col gap-3">
          <SectionHeading id="dark-theme" as="h2">
            Dark Theme
          </SectionHeading>
          <p className="text-muted-foreground">
            Toggle between light, dark, and system themes using the switch in the sidebar. All
            components adapt automatically via CSS variables.
          </p>
        </div>

        <div id="dark-theme-preview" className="flex scroll-mt-16 flex-col gap-2">
          <SectionHeading id="dark-theme-preview">Preview</SectionHeading>
          <p className="text-muted-foreground text-xs">
            A side-by-side comparison of the prompt area in light and dark themes.
          </p>
          <DarkThemePreview />
        </div>
      </div>
    </div>
  )
}
