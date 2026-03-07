'use client'

import { useCallback, useRef, useState } from 'react'
import { Github } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type {
  Segment,
  TriggerConfig,
  PromptAreaHandle,
} from '@/registry/new-york/blocks/prompt-area/types'

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
  { value: 'summarize', label: 'summarize', description: 'Summarize the conversation' },
  { value: 'translate', label: 'translate', description: 'Translate to another language' },
  { value: 'improve', label: 'improve', description: 'Improve writing quality' },
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
// Comprehensive demo – showcases every capability in a single interaction
// ---------------------------------------------------------------------------

function ComprehensiveExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [eventLog, setEventLog] = useState<string[]>([])
  const [submitted, setSubmitted] = useState<string>('')
  const promptRef = useRef<PromptAreaHandle>(null)

  const log = useCallback((msg: string) => {
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 80))
  }, [])

  const triggers: TriggerConfig[] = [
    // Dropdown trigger – start of line, inline chip style
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
        log(`Command selected: /${s.label}`)
        return s.label
      },
    },
    // Dropdown trigger – anywhere, pill chip style
    {
      char: '@',
      position: 'any',
      mode: 'dropdown',
      chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      accessibilityLabel: 'mention',
      onSearch: (query) =>
        USERS.filter(
          (u) =>
            u.label.toLowerCase().includes(query.toLowerCase()) ||
            u.description.toLowerCase().includes(query.toLowerCase()),
        ),
      onSelect: (s) => {
        log(`Mention selected: @${s.label}`)
        return s.label
      },
    },
    // Dropdown trigger – anywhere, auto-resolve on space
    {
      char: '#',
      position: 'any',
      mode: 'dropdown',
      resolveOnSpace: true,
      chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      accessibilityLabel: 'tag',
      onSearch: (query) =>
        TAGS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())),
      onSelect: (s) => {
        log(`Tag selected: #${s.label}`)
        return s.label
      },
    },
    // Callback trigger – fires handler directly, no dropdown
    {
      char: '!',
      position: 'any',
      mode: 'callback',
      onActivate: (ctx) => {
        log(`Callback triggered at position ${ctx.cursorPosition}`)
        ctx.insertChip({
          trigger: '!',
          value: 'alert',
          displayText: 'alert',
        })
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4">
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={setSegments}
          triggers={triggers}
          placeholder="Type / for commands, @ for mentions, # for tags, ! for callback… Try **bold**, *italic*, lists with - , or paste a URL"
          onSubmit={(segs) => {
            const text = segs
              .map((s) => (s.type === 'text' ? s.text : `${s.trigger}${s.displayText}`))
              .join('')
            setSubmitted(text)
            log(`Submitted: ${text}`)
            promptRef.current?.clear()
            setSegments([])
          }}
          onChipAdd={(chip) => log(`Chip added: ${chip.trigger}${chip.displayText}`)}
          onChipDelete={(chip) => log(`Chip deleted: ${chip.trigger}${chip.displayText}`)}
          onChipClick={(chip) => log(`Chip clicked: ${chip.trigger}${chip.displayText}`)}
          onLinkClick={(url) => log(`Link clicked: ${url}`)}
          onPaste={(data) => log(`Pasted (${data.source}): ${data.segments.length} segments`)}
          onUndo={(segs) => log(`Undo → ${segs.length} segments`)}
          onRedo={(segs) => log(`Redo → ${segs.length} segments`)}
          onEscape={() => log('Escape pressed')}
          autoGrow
          autoFocus
          minHeight={64}
          maxHeight={320}
        />
      </div>

      {/* Imperative API buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => promptRef.current?.focus()}>
          Focus
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => promptRef.current?.blur()}>
          Blur
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => {
            promptRef.current?.clear()
            setSegments([])
          }}>
          Clear
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => {
            promptRef.current?.insertChip({
              trigger: '@',
              value: 'system',
              displayText: 'System',
            })
            log('Inserted @System chip via imperative API')
          }}>
          Insert @System
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => {
            promptRef.current?.insertChip({
              trigger: '#',
              value: 'urgent',
              displayText: 'urgent',
            })
            log('Inserted #urgent chip via imperative API')
          }}>
          Insert #urgent
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => {
            const text = promptRef.current?.getPlainText() ?? ''
            log(`Plain text (${text.length} chars): ${text || '(empty)'}`)
          }}>
          Get Plain Text
        </button>
      </div>

      {submitted && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Submitted:</div>
          <div className="text-sm">{submitted}</div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Segments ({segments.length})
          </div>
          <pre className="max-h-[200px] overflow-auto text-xs">
            {JSON.stringify(segments, null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Event Log</div>
          <div className="max-h-[200px] overflow-auto text-xs">
            {eventLog.length === 0 ? (
              <span className="text-muted-foreground">No events yet — try interacting above</span>
            ) : (
              eventLog.map((entry, i) => (
                <div key={i} className="border-b border-border/50 py-0.5">
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
// Example cards
// ---------------------------------------------------------------------------

function BasicExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        placeholder="Just a text input with Enter to submit..."
        onSubmit={() => {
          setSegments([])
        }}
        minHeight={48}
      />
    </div>
  )
}

function MentionsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        triggers={[
          {
            char: '@',
            position: 'any',
            mode: 'dropdown',
            chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
          },
        ]}
        placeholder="Type @ to mention someone..."
        minHeight={48}
      />
    </div>
  )
}

function CommandsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        triggers={[
          {
            char: '/',
            position: 'start',
            mode: 'dropdown',
            chipStyle: 'inline',
            chipClassName: 'text-violet-700 dark:text-violet-400',
            onSearch: (q) =>
              COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
          },
        ]}
        placeholder="Type / at the start for commands..."
        minHeight={48}
      />
    </div>
  )
}

function TagsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        triggers={[
          {
            char: '#',
            position: 'any',
            mode: 'dropdown',
            resolveOnSpace: true,
            chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            onSearch: (q) => TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
          },
        ]}
        placeholder="Type # for tags (press space to auto-resolve)..."
        minHeight={48}
      />
    </div>
  )
}

function CallbackExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [lastCallback, setLastCallback] = useState('')
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border p-4">
        <PromptArea
          value={segments}
          onChange={setSegments}
          triggers={[
            {
              char: '!',
              position: 'any',
              mode: 'callback',
              onActivate: (ctx) => {
                setLastCallback(`Activated at position ${ctx.cursorPosition}`)
                ctx.insertChip({
                  trigger: '!',
                  value: 'alert',
                  displayText: 'alert',
                })
              },
            },
          ]}
          placeholder="Type ! to trigger a callback..."
          minHeight={48}
        />
      </div>
      {lastCallback && (
        <div className="text-xs text-muted-foreground">{lastCallback}</div>
      )}
    </div>
  )
}

function MarkdownExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={setSegments}
        placeholder="Try **bold**, *italic*, ***both***, or start a line with - for lists..."
        minHeight={80}
      />
    </div>
  )
}

const COPY_PASTE_TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '#',
    position: 'any',
    mode: 'dropdown',
    resolveOnSpace: true,
    chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    onSearch: (q) => TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())),
  },
]

const INITIAL_SEGMENTS: Segment[] = [
  { type: 'text', text: 'Hello ' },
  { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
  { type: 'text', text: ' please review ' },
  { type: 'chip', trigger: '#', value: 'feature', displayText: 'feature' },
  { type: 'text', text: ' when you can' },
]

function CopyPasteExample() {
  const [sourceSegments, setSourceSegments] = useState<Segment[]>(INITIAL_SEGMENTS)
  const [targetSegments, setTargetSegments] = useState<Segment[]>([])
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-muted-foreground">Source (select & copy)</div>
        <div className="rounded-lg border p-4">
          <PromptArea
            value={sourceSegments}
            onChange={setSourceSegments}
            triggers={COPY_PASTE_TRIGGERS}
            placeholder="Type here..."
            minHeight={60}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-xs text-muted-foreground">Target (paste here)</div>
        <div className="rounded-lg border p-4">
          <PromptArea
            value={targetSegments}
            onChange={setTargetSegments}
            triggers={COPY_PASTE_TRIGGERS}
            placeholder="Paste content here..."
            minHeight={60}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// All Options – a single example exercising every prop / option
// ---------------------------------------------------------------------------

function AllOptionsExample() {
  const [segments, setSegments] = useState<Segment[]>([
    { type: 'text', text: 'Hello ' },
    { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
    { type: 'text', text: ' — click a chip, paste text, or try every feature!' },
  ])
  const [eventLog, setEventLog] = useState<string[]>([])
  const promptRef = useRef<PromptAreaHandle>(null)

  const log = useCallback((msg: string) => {
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 80))
  }, [])

  // Every trigger variation in one config ----------------------------------

  const triggers: TriggerConfig[] = [
    // 1. Dropdown at start-of-line, inline chip style
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
    // 2. Dropdown anywhere, pill chip style (default), with icons
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
    // 3. Dropdown anywhere + resolveOnSpace (free-form tags)
    {
      char: '#',
      position: 'any',
      mode: 'dropdown',
      resolveOnSpace: true,
      chipClassName: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      accessibilityLabel: 'tag',
      onSearch: (query) =>
        TAGS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())),
      onSelect: (s) => {
        log(`# onSelect → ${s.label}`)
        return s.label
      },
    },
    // 4. Callback mode (no dropdown)
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

  // Disabled state toggle ---------------------------------------------------

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
          // ── controlled value ───────────────────────────────────
          value={segments}
          onChange={(segs) => {
            setSegments(segs)
            log(`onChange → ${segs.length} segment(s)`)
          }}
          // ── trigger configs ───────────────────────────────────
          triggers={triggers}
          // ── appearance ────────────────────────────────────────
          placeholder="All options active — try /, @, #, !, **bold**, *italic*, - lists, URLs…"
          className="my-custom-class"
          disabled={disabled}
          markdown={markdownEnabled}
          // ── dimensions ────────────────────────────────────────
          minHeight={60}
          maxHeight={300}
          autoGrow={autoGrow}
          autoFocus={false}
          // ── callbacks ─────────────────────────────────────────
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
          // ── accessibility / testing ───────────────────────────
          aria-label="All-options demo input"
          data-test-id="all-options-prompt"
        />
      </div>

      {/* Imperative handle buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => promptRef.current?.focus()}>
          focus()
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => promptRef.current?.blur()}>
          blur()
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
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
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => log(`getPlainText() → "${promptRef.current?.getPlainText()}"`)}>
          getPlainText()
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
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
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Segments ({segments.length})
          </div>
          <pre className="max-h-[200px] overflow-auto text-xs">
            {JSON.stringify(segments, null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Event Log</div>
          <div className="max-h-[200px] overflow-auto text-xs">
            {eventLog.length === 0 ? (
              <span className="text-muted-foreground">Interact to see events…</span>
            ) : (
              eventLog.map((entry, i) => (
                <div key={i} className="border-b border-border/50 py-0.5">
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
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
      {/* Hero */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Prompt Area</h1>
          <a
            href="https://github.com/team-gpt/prompt-area"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground">
            <Github className="size-6" />
          </a>
        </div>
        <p className="text-muted-foreground">
          A contentEditable rich text input with trigger-based chips, inline markdown,
          undo/redo, and list auto-formatting. Built as a{' '}
          <a
            href="https://ui.shadcn.com/docs/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4">
            shadcn registry
          </a>{' '}
          component.
        </p>
        <div className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
          npx shadcn@latest add https://prompt-area.vercel.app/r/prompt-area.json
        </div>
      </div>

      {/* Comprehensive example – all capabilities */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Try It</h2>
        <p className="text-sm text-muted-foreground">
          All capabilities in one editor. <code>/</code> commands (start of line, inline style),{' '}
          <code>@</code> mentions (pill style), <code>#</code> tags (auto-resolve on space),{' '}
          <code>!</code> callback mode. <strong>Cmd+B</strong> bold, <strong>Cmd+I</strong>{' '}
          italic, <strong>Ctrl+Z</strong>/<strong>Ctrl+Shift+Z</strong> undo/redo. Type{' '}
          <code>- </code> for lists, paste a URL for auto-linking, or use the buttons below to
          call the imperative API. <strong>Enter</strong> to submit, <strong>Escape</strong> to
          dismiss.
        </p>
        <ComprehensiveExample />
      </div>

      {/* All Options */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">All Options</h2>
        <p className="text-sm text-muted-foreground">
          Every prop and option in a single example. Toggles for{' '}
          <code>disabled</code>, <code>markdown</code>, and <code>autoGrow</code>. All 4 trigger
          types (<code>/</code> start-of-line dropdown, <code>@</code> pill dropdown,{' '}
          <code>#</code> auto-resolve on space, <code>!</code> callback mode). Every callback
          (<code>onSubmit</code>, <code>onEscape</code>, <code>onChipClick</code>,{' '}
          <code>onChipAdd</code>, <code>onChipDelete</code>, <code>onLinkClick</code>,{' '}
          <code>onPaste</code>, <code>onUndo</code>, <code>onRedo</code>) logs to the event panel.
          Imperative handle methods (<code>focus</code>, <code>blur</code>,{' '}
          <code>insertChip</code>, <code>getPlainText</code>, <code>clear</code>) are wired to
          buttons. Also sets <code>minHeight</code>, <code>maxHeight</code>,{' '}
          <code>className</code>, <code>aria-label</code>, and <code>data-test-id</code>.
        </p>
        <AllOptionsExample />
      </div>

      {/* Examples */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Examples</h2>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Basic (no triggers)</h3>
          <p className="text-xs text-muted-foreground">
            Simple text input with Enter to submit.
          </p>
          <BasicExample />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">@Mentions</h3>
          <p className="text-xs text-muted-foreground">
            Type <code>@</code> followed by a name to search users.
          </p>
          <MentionsExample />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">/Commands (start of line)</h3>
          <p className="text-xs text-muted-foreground">
            Type <code>/</code> at the beginning of a line for commands.
          </p>
          <CommandsExample />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">#Tags (auto-resolve on space)</h3>
          <p className="text-xs text-muted-foreground">
            Type <code>#tag</code> and press space to auto-create a chip. Backspace reverts it.
          </p>
          <TagsExample />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Callback mode (!)</h3>
          <p className="text-xs text-muted-foreground">
            Type <code>!</code> to fire a callback that programmatically inserts a chip.
          </p>
          <CallbackExample />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Markdown Formatting</h3>
          <p className="text-xs text-muted-foreground">
            Wrap text in <code>**bold**</code>, <code>*italic*</code>, or{' '}
            <code>***both***</code> to see inline styling. Use{' '}
            <strong>Cmd+B</strong> / <strong>Cmd+I</strong> shortcuts. Start a line with{' '}
            <code>- </code> or <code>* </code> for auto-formatted lists (Tab to indent).
          </p>
          <MarkdownExample />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Copy & Paste</h3>
          <p className="text-xs text-muted-foreground">
            Select content with chips in the source editor and <strong>Cmd+C</strong> to copy,
            then <strong>Cmd+V</strong> in the target to paste — chips are preserved. Pasting
            plain text like <code>@alice #bug</code> from outside auto-resolves matching triggers.
          </p>
          <CopyPasteExample />
        </div>
      </div>
    </div>
  )
}
