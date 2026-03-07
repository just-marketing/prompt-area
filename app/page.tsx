'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Github,
  Link as LinkIcon,
  AtSign,
  Type,
  RotateCcw,
  Paperclip,
  PanelBottom,
  Moon,
  Keyboard,
  Puzzle,
  ArrowUp,
  PlusCircle,
  SquareSlash,
  Hash,
  Mic,
  Code,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type {
  Segment,
  TriggerConfig,
  PromptAreaHandle,
} from '@/registry/new-york/blocks/prompt-area/types'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
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
} from './examples'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const USERS = [
  { value: 'alice', label: 'Alice', description: 'Engineering' },
  { value: 'bob', label: 'Bob', description: 'Design' },
  { value: 'charlie', label: 'Charlie', description: 'Product' },
  { value: 'diana', label: 'Diana', description: 'Marketing' },
  { value: 'eve', label: 'Eve', description: 'Sales' },
]

const COMMANDS = [
  {
    value: 'summarize',
    label: 'summarize',
    description: 'Summarize the conversation',
  },
  {
    value: 'translate',
    label: 'translate',
    description: 'Translate to another language',
  },
  {
    value: 'improve',
    label: 'improve',
    description: 'Improve writing quality',
  },
  { value: 'explain', label: 'explain', description: 'Explain a concept' },
  { value: 'code', label: 'code', description: 'Generate code snippet' },
]

const TAGS = [
  { value: 'bug', label: 'bug' },
  { value: 'feature', label: 'feature' },
  { value: 'docs', label: 'docs' },
  { value: 'urgent', label: 'urgent' },
  { value: 'question', label: 'question' },
]

// ---------------------------------------------------------------------------
// Shared helpers & style constants
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SectionHeading — clickable anchor heading with hash link
// ---------------------------------------------------------------------------

function SectionHeading({
  id,
  as: Tag = 'h3',
  children,
}: {
  id: string
  as?: 'h2' | 'h3'
  children: React.ReactNode
}) {
  const isH2 = Tag === 'h2'

  return (
    <Tag className="group/anchor relative flex items-center gap-2">
      <a
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault()
          const el = document.getElementById(id)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            history.replaceState(null, '', `#${id}`)
          }
        }}
        className={
          isH2
            ? 'decoration-muted-foreground/40 text-2xl font-semibold underline-offset-4 hover:underline'
            : 'decoration-muted-foreground/40 text-base font-medium underline-offset-4 hover:underline'
        }>
        {children}
      </a>
      <a
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault()
          const el = document.getElementById(id)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            history.replaceState(null, '', `#${id}`)
          }
          navigator.clipboard?.writeText(
            `${window.location.origin}${window.location.pathname}#${id}`,
          )
        }}
        aria-label={`Copy link to ${typeof children === 'string' ? children : 'section'}`}
        className="text-muted-foreground/0 group-hover/anchor:text-muted-foreground/60 hover:!text-foreground transition-colors duration-150">
        <LinkIcon className={isH2 ? 'size-4' : 'size-3.5'} />
      </a>
    </Tag>
  )
}

// ---------------------------------------------------------------------------
// Demo section – polished chatbot input for the landing page
// ---------------------------------------------------------------------------

const DEMO_INITIAL_SEGMENTS: Segment[] = [
  { type: 'chip', trigger: '/', value: 'summarize', displayText: 'summarize' },
  { type: 'text', text: ' the meeting notes from ' },
  { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
  { type: 'text', text: ' and ' },
  { type: 'chip', trigger: '@', value: 'bob', displayText: 'Bob' },
  { type: 'text', text: '. Tag anything marked ' },
  { type: 'chip', trigger: '#', value: 'urgent', displayText: 'urgent' },
  {
    type: 'text',
    text: ' and format the output as:\n- **Key decisions** made during the meeting\n- *Action items* assigned to each team member\n- Open questions for follow-up',
  },
]

const DEMO_TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    accessibilityLabel: 'mention',
    onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/',
    position: 'start',
    mode: 'dropdown',
    chipStyle: 'inline',
    chipClassName: 'text-violet-700 dark:text-violet-400',
    accessibilityLabel: 'command',
    onSearch: (q) => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '#',
    position: 'any',
    mode: 'dropdown',
    resolveOnSpace: true,
    chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    accessibilityLabel: 'tag',
    onSearch: (q) => TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
  },
]

const DEMO_ICON_BTN = 'rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground'
const DEMO_MENU_ITEM = 'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent'

function DemoSection() {
  const [segments, setSegments] = useState<Segment[]>(DEMO_INITIAL_SEGMENTS)
  const [markdownEnabled, setMarkdownEnabled] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const promptRef = useRef<PromptAreaHandle>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isEmpty =
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleSubmit = useCallback(() => {
    if (isEmpty) return
    promptRef.current?.clear()
    setSegments([])
  }, [isEmpty])

  const insertTrigger = useCallback((char: string) => {
    promptRef.current?.focus()
    requestAnimationFrame(() => {
      document.execCommand('insertText', false, char)
    })
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border p-4 shadow-sm">
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={setSegments}
          triggers={DEMO_TRIGGERS}
          placeholder="Ask anything..."
          onSubmit={handleSubmit}
          markdown={markdownEnabled}
          autoGrow
          minHeight={72}
          maxHeight={280}
        />
        <ActionBar
          left={
            <>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className={DEMO_ICON_BTN}
                  aria-label="Attach"
                  onClick={() => setMenuOpen((v) => !v)}>
                  <PlusCircle className="size-4" />
                </button>
                {menuOpen && (
                  <div className="bg-popover absolute top-full left-0 z-10 mt-1 flex w-max flex-col rounded-md border p-1 shadow-md">
                    <button
                      type="button"
                      className={DEMO_MENU_ITEM}
                      onClick={() => setMenuOpen(false)}>
                      <Upload className="size-4" />
                      Upload file
                    </button>
                    <button
                      type="button"
                      className={DEMO_MENU_ITEM}
                      onClick={() => setMenuOpen(false)}>
                      <ImageIcon className="size-4" />
                      Upload image
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={DEMO_ICON_BTN}
                aria-label="Mention"
                onClick={() => insertTrigger('@')}>
                <AtSign className="size-4" />
              </button>
              <button
                type="button"
                className={DEMO_ICON_BTN}
                aria-label="Commands"
                onClick={() => {
                  promptRef.current?.focus()
                  requestAnimationFrame(() => {
                    const sel = window.getSelection()
                    const el = document.activeElement
                    if (sel && el) {
                      sel.collapse(el, 0)
                    }
                    document.execCommand('insertText', false, '/')
                  })
                }}>
                <SquareSlash className="size-4" />
              </button>
              <button
                type="button"
                className={DEMO_ICON_BTN}
                aria-label="Tags"
                onClick={() => insertTrigger('#')}>
                <Hash className="size-4" />
              </button>
            </>
          }
          right={
            <>
              <button
                type="button"
                className={`rounded-md p-1.5 ${
                  markdownEnabled
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                aria-label="Toggle markdown"
                onClick={() => setMarkdownEnabled((v) => !v)}>
                {markdownEnabled ? <Code className="size-4" /> : <Type className="size-4" />}
              </button>
              <button type="button" className={DEMO_ICON_BTN} aria-label="Voice input">
                <Mic className="size-4" />
              </button>
              <button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-1.5 disabled:opacity-50"
                aria-label="Send message"
                disabled={isEmpty}
                onClick={handleSubmit}>
                <ArrowUp className="size-4" />
              </button>
            </>
          }
        />
      </div>
      <p className="text-muted-foreground text-center text-xs">
        Try editing, type <code>@</code> to mention, <code>/</code> for commands, or just hit Enter
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Features grid – scannable feature cards
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: AtSign,
    title: 'Trigger-Based Chips',
    description:
      'Type @, /, or # to invoke mentions, commands, and tags that resolve into structured chips.',
  },
  {
    icon: Type,
    title: 'Inline Markdown',
    description:
      'Bold, italic, lists, and auto-linked URLs render live as you type. Keyboard shortcuts included.',
  },
  {
    icon: RotateCcw,
    title: 'Undo & Redo',
    description:
      'Full history stack with Ctrl+Z / Ctrl+Shift+Z. Every action is tracked and reversible.',
  },
  {
    icon: Paperclip,
    title: 'File & Image Attachments',
    description:
      'Paste screenshots or attach files with thumbnails, loading states, and remove buttons built in.',
  },
  {
    icon: PanelBottom,
    title: 'Action Bar',
    description:
      'A toolbar component with left and right slots that pairs with PromptArea for a complete chat input.',
  },
  {
    icon: Moon,
    title: 'Dark Mode Ready',
    description:
      'Full light and dark theme support via CSS variables. Adapts automatically to your app\u2019s theme.',
  },
  {
    icon: Keyboard,
    title: 'Accessible by Default',
    description:
      'ARIA labels, keyboard navigation, screen reader announcements, and focus management built in.',
  },
  {
    icon: Puzzle,
    title: 'shadcn Registry',
    description:
      'Install with one command. No extra dependencies. Copy-paste friendly and fully customizable.',
  },
]

function FeaturesGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="flex items-start gap-3 rounded-lg border p-4">
          <div className="bg-muted shrink-0 rounded-md p-2">
            <feature.icon className="size-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{feature.title}</div>
            <div className="text-muted-foreground text-xs">{feature.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inspector – consolidated playground with toggles, event log & segment viewer
// ---------------------------------------------------------------------------

function InspectorExample() {
  const [segments, setSegments] = useState<Segment[]>([
    { type: 'text', text: 'Hello ' },
    { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
    {
      type: 'text',
      text: ' — click a chip, paste text, or try every feature!',
    },
  ])
  const [eventLog, setEventLog] = useState<string[]>([])
  const promptRef = useRef<PromptAreaHandle>(null)

  const log = useCallback((msg: string) => {
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 80))
  }, [])

  const triggers: TriggerConfig[] = [
    {
      char: '/',
      position: 'start',
      mode: 'dropdown',
      chipStyle: 'inline',
      chipClassName: 'text-violet-700 dark:text-violet-400',
      accessibilityLabel: 'command',
      onSearch: (query) =>
        COMMANDS.filter(
          (c) =>
            c.label.toLowerCase().includes(query.toLowerCase()) ||
            c.description.toLowerCase().includes(query.toLowerCase()),
        ),
      onSelect: (s) => {
        log(`/ onSelect → ${s.label}`)
        return s.label
      },
    },
    {
      char: '@',
      position: 'any',
      mode: 'dropdown',
      chipStyle: 'pill',
      chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      accessibilityLabel: 'mention',
      onSearch: (query) =>
        USERS.filter(
          (u) =>
            u.label.toLowerCase().includes(query.toLowerCase()) ||
            u.description.toLowerCase().includes(query.toLowerCase()),
        ),
      onSelect: (s) => {
        log(`@ onSelect → ${s.label}`)
        return s.label
      },
    },
    {
      char: '#',
      position: 'any',
      mode: 'dropdown',
      resolveOnSpace: true,
      chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      accessibilityLabel: 'tag',
      onSearch: (query) => TAGS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())),
      onSelect: (s) => {
        log(`# onSelect → ${s.label}`)
        return s.label
      },
    },
    {
      char: '!',
      position: 'any',
      mode: 'callback',
      onActivate: (ctx) => {
        log(`! onActivate → cursor at ${ctx.cursorPosition}`)
        ctx.insertChip({ trigger: '!', value: 'alert', displayText: 'alert' })
      },
    },
  ]

  const [disabled, setDisabled] = useState(false)
  const [markdownEnabled, setMarkdownEnabled] = useState(true)
  const [autoGrow, setAutoGrow] = useState(true)

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle controls */}
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          disabled
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={markdownEnabled}
            onChange={(e) => setMarkdownEnabled(e.target.checked)}
          />
          markdown
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={autoGrow}
            onChange={(e) => setAutoGrow(e.target.checked)}
          />
          autoGrow
        </label>
      </div>

      {/* The PromptArea with every prop */}
      <div className="rounded-lg border p-4">
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={(segs) => {
            setSegments(segs)
            log(`onChange → ${segs.length} segment(s)`)
          }}
          triggers={triggers}
          placeholder="All options active — try /, @, #, !, **bold**, *italic*, - lists, URLs…"
          className="my-custom-class"
          disabled={disabled}
          markdown={markdownEnabled}
          minHeight={60}
          maxHeight={300}
          autoGrow={autoGrow}
          autoFocus={false}
          onSubmit={(segs) => {
            const text = segs
              .map((s) => (s.type === 'text' ? s.text : `${s.trigger}${s.displayText}`))
              .join('')
            log(`onSubmit → "${text}"`)
            promptRef.current?.clear()
            setSegments([])
          }}
          onEscape={() => log('onEscape')}
          onChipClick={(chip) => log(`onChipClick → ${chip.trigger}${chip.displayText}`)}
          onChipAdd={(chip) => log(`onChipAdd → ${chip.trigger}${chip.displayText}`)}
          onChipDelete={(chip) => log(`onChipDelete → ${chip.trigger}${chip.displayText}`)}
          onLinkClick={(url) => log(`onLinkClick → ${url}`)}
          onPaste={(data) => log(`onPaste → ${data.source}, ${data.segments.length} segment(s)`)}
          onUndo={(segs) => log(`onUndo → ${segs.length} segment(s)`)}
          onRedo={(segs) => log(`onRedo → ${segs.length} segment(s)`)}
          aria-label="Inspector demo input"
          data-test-id="inspector-prompt"
        />
      </div>

      {/* Imperative handle buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() => promptRef.current?.focus()}>
          focus()
        </button>
        <button
          type="button"
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() => promptRef.current?.blur()}>
          blur()
        </button>
        <button
          type="button"
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() =>
            promptRef.current?.insertChip({
              trigger: '@',
              value: 'system',
              displayText: 'System',
            })
          }>
          insertChip()
        </button>
        <button
          type="button"
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() => log(`getPlainText() → "${promptRef.current?.getPlainText()}"`)}>
          getPlainText()
        </button>
        <button
          type="button"
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() => {
            promptRef.current?.clear()
            setSegments([])
            log('clear()')
          }}>
          clear()
        </button>
      </div>

      {/* Live state & event log */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground mb-2 text-xs font-medium">
            Segments ({segments.length})
          </div>
          <pre className="max-h-[200px] overflow-auto text-xs">
            {JSON.stringify(segments, null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground mb-2 text-xs font-medium">Event Log</div>
          <div className="max-h-[200px] overflow-auto text-xs">
            {eventLog.length === 0 ? (
              <span className="text-muted-foreground">Interact to see events…</span>
            ) : (
              eventLog.map((entry, i) => (
                <div key={i} className="border-border/50 border-b py-0.5">
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dark theme preview
// ---------------------------------------------------------------------------

function DarkThemePreview() {
  const [lightSegments, setLightSegments] = useState<Segment[]>([])
  const [darkSegments, setDarkSegments] = useState<Segment[]>([])

  const triggers: TriggerConfig[] = [
    {
      char: '@',
      position: 'any',
      mode: 'dropdown',
      chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground mb-2 text-xs font-medium">Light</p>
        <div className="rounded-lg border bg-white p-3 text-[oklch(0.145_0_0)]">
          <PromptArea
            value={lightSegments}
            onChange={setLightSegments}
            triggers={triggers}
            placeholder="Type @ to mention..."
            minHeight={48}
          />
        </div>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground mb-2 text-xs font-medium">Dark</p>
        <div className="dark rounded-lg border border-[oklch(1_0_0/10%)] bg-[oklch(0.145_0_0)] p-3 text-[oklch(0.985_0_0)]">
          <PromptArea
            value={darkSegments}
            onChange={setDarkSegments}
            triggers={triggers}
            placeholder="Type @ to mention..."
            minHeight={48}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
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
        <InspectorExample />
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
            like <code>@alice #bug</code> from outside auto-resolves matching triggers.
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
