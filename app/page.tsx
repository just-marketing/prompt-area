'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Github,
  PlusCircle,
  AtSign,
  SquareSlash,
  Hash,
  Mic,
  ArrowUp,
  Code,
  Type,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { segmentsToPlainText } from '@/registry/new-york/blocks/prompt-area/prompt-area-engine'
import type {
  Segment,
  TriggerConfig,
  PromptAreaHandle,
  PromptAreaImage,
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

function isSegmentsEmpty(segments: Segment[]): boolean {
  return (
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')
  )
}

const ICON_BUTTON_CLASS =
  'rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground'

const SEND_BUTTON_CLASS =
  'rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50'

const MENU_ITEM_CLASS = 'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent'

// ActionBar trigger configs (no component-scoped deps, safe to hoist)
const ACTION_BAR_TRIGGERS: TriggerConfig[] = [
  {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    chipClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    onSearch: (q) => USERS.filter((u) => u.label.toLowerCase().includes(q.toLowerCase())),
  },
  {
    char: '/',
    position: 'start',
    mode: 'dropdown',
    chipStyle: 'inline',
    chipClassName: 'text-violet-700 dark:text-violet-400',
    onSearch: (q) => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
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
      onSearch: (query) => TAGS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())),
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
          placeholder={[
            'Type / for commands...',
            'Mention someone with @...',
            'Add a tag with #...',
            'Try **bold** or *italic*...',
          ]}
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
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() => promptRef.current?.focus()}>
          Focus
        </button>
        <button
          type="button"
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() => promptRef.current?.blur()}>
          Blur
        </button>
        <button
          type="button"
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() => {
            promptRef.current?.clear()
            setSegments([])
          }}>
          Clear
        </button>
        <button
          type="button"
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
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
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
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
          className="hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
          onClick={() => {
            const text = promptRef.current?.getPlainText() ?? ''
            log(`Plain text (${text.length} chars): ${text || '(empty)'}`)
          }}>
          Get Plain Text
        </button>
      </div>

      {submitted && (
        <div className="bg-muted/50 rounded-lg border p-3">
          <div className="text-muted-foreground mb-1 text-xs font-medium">Submitted:</div>
          <div className="text-sm">{submitted}</div>
        </div>
      )}

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
              <span className="text-muted-foreground">No events yet — try interacting above</span>
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
      {lastCallback && <div className="text-muted-foreground text-xs">{lastCallback}</div>}
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
        <div className="text-muted-foreground text-xs">Source (select & copy)</div>
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
        <div className="text-muted-foreground text-xs">Target (paste here)</div>
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
      onSearch: (query) => TAGS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())),
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
// Image Attachments example
// ---------------------------------------------------------------------------

const SAMPLE_IMAGES: PromptAreaImage[] = [
  {
    id: 'sample-1',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='4' fill='%234f46e5'/%3E%3Ctext x='32' y='36' text-anchor='middle' fill='white' font-size='20'%3E%F0%9F%8C%84%3C/text%3E%3C/svg%3E",
    alt: 'Landscape',
  },
  {
    id: 'sample-2',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='4' fill='%230d9488'/%3E%3Ctext x='32' y='36' text-anchor='middle' fill='white' font-size='20'%3E%F0%9F%93%8A%3C/text%3E%3C/svg%3E",
    alt: 'Chart',
  },
]

function ImageAttachmentsExample() {
  const [aboveSegments, setAboveSegments] = useState<Segment[]>([])
  const [belowSegments, setBelowSegments] = useState<Segment[]>([])
  const [aboveImages, setAboveImages] = useState<PromptAreaImage[]>(SAMPLE_IMAGES)
  const [belowImages, setBelowImages] = useState<PromptAreaImage[]>([])

  const [clickedImage, setClickedImage] = useState<string | null>(null)

  const handleImagePaste = useCallback(
    (setFn: React.Dispatch<React.SetStateAction<PromptAreaImage[]>>) => (file: File) => {
      const id = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)
      setFn((prev) => [...prev, { id, url: previewUrl, alt: file.name, loading: true }])
      setTimeout(() => {
        setFn((prev) => prev.map((img) => (img.id === id ? { ...img, loading: false } : img)))
      }, 1500)
    },
    [],
  )

  const handleImageClick = useCallback((image: PromptAreaImage) => {
    setClickedImage(image.alt ?? image.id)
  }, [])

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <div className="text-muted-foreground text-xs">Images Above (default)</div>
        <div className="rounded-lg border p-4">
          <PromptArea
            value={aboveSegments}
            onChange={setAboveSegments}
            images={aboveImages}
            imagePosition="above"
            onImagePaste={handleImagePaste(setAboveImages)}
            onImageRemove={(img) => setAboveImages((prev) => prev.filter((i) => i.id !== img.id))}
            onImageClick={handleImageClick}
            onSubmit={() => setAboveSegments([])}
            placeholder="Paste an image here..."
            minHeight={48}
            maxHeight={200}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-muted-foreground text-xs">Images Below</div>
        <div className="rounded-lg border p-4">
          <PromptArea
            value={belowSegments}
            onChange={setBelowSegments}
            images={belowImages}
            imagePosition="below"
            onImagePaste={handleImagePaste(setBelowImages)}
            onImageRemove={(img) => setBelowImages((prev) => prev.filter((i) => i.id !== img.id))}
            onImageClick={handleImageClick}
            onSubmit={() => setBelowSegments([])}
            placeholder="Paste an image here..."
            minHeight={48}
            maxHeight={200}
          />
        </div>
      </div>
      {clickedImage && <div className="text-muted-foreground text-xs">Clicked: {clickedImage}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ActionBar examples
// ---------------------------------------------------------------------------

function ActionBarFullExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [markdownEnabled, setMarkdownEnabled] = useState(false)
  const [submitted, setSubmitted] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const promptRef = useRef<PromptAreaHandle>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isEmpty = isSegmentsEmpty(segments)

  // Close menu on click outside
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
    if (isSegmentsEmpty(segments)) return
    setSubmitted(segmentsToPlainText(segments))
    promptRef.current?.clear()
    setSegments([])
  }, [segments])

  const insertTrigger = useCallback((char: string) => {
    promptRef.current?.focus()
    // Uses deprecated execCommand as PromptAreaHandle does not yet expose insertText
    requestAnimationFrame(() => {
      document.execCommand('insertText', false, char)
    })
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border p-4">
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={setSegments}
          triggers={ACTION_BAR_TRIGGERS}
          placeholder="Type a message..."
          onSubmit={handleSubmit}
          markdown={markdownEnabled}
          autoGrow
          minHeight={48}
          maxHeight={320}
        />
        <ActionBar
          left={
            <>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  aria-label="Attach"
                  onClick={() => setMenuOpen((v) => !v)}>
                  <PlusCircle className="size-4" />
                </button>
                {menuOpen && (
                  <div className="bg-popover absolute top-full left-0 z-10 mt-1 flex w-max flex-col rounded-md border p-1 shadow-md">
                    <button
                      type="button"
                      className={MENU_ITEM_CLASS}
                      onClick={() => setMenuOpen(false)}>
                      <Upload className="size-4" />
                      Upload file
                    </button>
                    <button
                      type="button"
                      className={MENU_ITEM_CLASS}
                      onClick={() => setMenuOpen(false)}>
                      <ImageIcon className="size-4" />
                      Upload image
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={ICON_BUTTON_CLASS}
                aria-label="Mention"
                onClick={() => insertTrigger('@')}>
                <AtSign className="size-4" />
              </button>
              <button
                type="button"
                className={ICON_BUTTON_CLASS}
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
                className={ICON_BUTTON_CLASS}
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
              <button type="button" className={ICON_BUTTON_CLASS} aria-label="Voice input">
                <Mic className="size-4" />
              </button>
              <button
                type="button"
                className={SEND_BUTTON_CLASS}
                aria-label="Send message"
                disabled={isEmpty}
                onClick={handleSubmit}>
                <ArrowUp className="size-4" />
              </button>
            </>
          }
        />
      </div>
      {submitted && (
        <div className="bg-muted/50 rounded-lg border p-3">
          <div className="text-muted-foreground mb-1 text-xs font-medium">Submitted:</div>
          <div className="text-sm">{submitted}</div>
        </div>
      )}
    </div>
  )
}

function ActionBarMinimalExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = isSegmentsEmpty(segments)

  const handleSubmit = useCallback(() => {
    if (isSegmentsEmpty(segments)) return
    promptRef.current?.clear()
    setSegments([])
  }, [segments])

  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        ref={promptRef}
        value={segments}
        onChange={setSegments}
        placeholder="Type a message..."
        onSubmit={handleSubmit}
        minHeight={48}
      />
      <ActionBar
        right={
          <button
            type="button"
            className={SEND_BUTTON_CLASS}
            aria-label="Send message"
            disabled={isEmpty}
            onClick={handleSubmit}>
            <ArrowUp className="size-4" />
          </button>
        }
      />
    </div>
  )
}

function ActionBarDisabledExample() {
  const [segments] = useState<Segment[]>([{ type: 'text', text: 'This input is disabled...' }])

  return (
    <div className="rounded-lg border p-4">
      <PromptArea
        value={segments}
        onChange={() => {}}
        placeholder="Disabled..."
        disabled
        minHeight={48}
      />
      <ActionBar
        disabled
        left={
          <>
            <button type="button" className="text-muted-foreground rounded-md p-1.5">
              <PlusCircle className="size-4" />
            </button>
            <button type="button" className="text-muted-foreground rounded-md p-1.5">
              <AtSign className="size-4" />
            </button>
          </>
        }
        right={
          <button
            type="button"
            className="bg-primary text-primary-foreground rounded-lg p-1.5"
            disabled>
            <ArrowUp className="size-4" />
          </button>
        }
      />
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
          npx shadcn@latest add https://prompt-area.vercel.app/r/prompt-area.json
        </div>
      </div>

      {/* Comprehensive example – all capabilities */}
      <div id="try-it" className="flex scroll-mt-16 flex-col gap-3">
        <h2 className="text-xl font-semibold">Try It</h2>
        <p className="text-muted-foreground text-sm">
          All capabilities in one editor. <code>/</code> commands (start of line, inline style),{' '}
          <code>@</code> mentions (pill style), <code>#</code> tags (auto-resolve on space),{' '}
          <code>!</code> callback mode. <strong>Cmd+B</strong> bold, <strong>Cmd+I</strong> italic,{' '}
          <strong>Ctrl+Z</strong>/<strong>Ctrl+Shift+Z</strong> undo/redo. Type <code>- </code> for
          lists, paste a URL for auto-linking, or use the buttons below to call the imperative API.{' '}
          <strong>Enter</strong> to submit, <strong>Escape</strong> to dismiss.
        </p>
        <ComprehensiveExample />
      </div>

      {/* All Options */}
      <div id="all-options" className="flex scroll-mt-16 flex-col gap-3">
        <h2 className="text-xl font-semibold">All Options</h2>
        <p className="text-muted-foreground text-sm">
          Every prop and option in a single example. Toggles for <code>disabled</code>,{' '}
          <code>markdown</code>, and <code>autoGrow</code>. All 4 trigger types (<code>/</code>{' '}
          start-of-line dropdown, <code>@</code> pill dropdown, <code>#</code> auto-resolve on
          space, <code>!</code> callback mode). Every callback (<code>onSubmit</code>,{' '}
          <code>onEscape</code>, <code>onChipClick</code>, <code>onChipAdd</code>,{' '}
          <code>onChipDelete</code>, <code>onLinkClick</code>, <code>onPaste</code>,{' '}
          <code>onUndo</code>, <code>onRedo</code>) logs to the event panel. Imperative handle
          methods (<code>focus</code>, <code>blur</code>, <code>insertChip</code>,{' '}
          <code>getPlainText</code>, <code>clear</code>) are wired to buttons. Also sets{' '}
          <code>minHeight</code>, <code>maxHeight</code>, <code>className</code>,{' '}
          <code>aria-label</code>, and <code>data-test-id</code>.
        </p>
        <AllOptionsExample />
      </div>

      {/* Examples */}
      <div id="examples" className="flex scroll-mt-16 flex-col gap-6">
        <h2 className="text-xl font-semibold">Examples</h2>

        <div id="example-basic" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">Basic (no triggers)</h3>
          <p className="text-muted-foreground text-xs">Simple text input with Enter to submit.</p>
          <BasicExample />
        </div>

        <div id="example-mentions" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">@Mentions</h3>
          <p className="text-muted-foreground text-xs">
            Type <code>@</code> followed by a name to search users.
          </p>
          <MentionsExample />
        </div>

        <div id="example-commands" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">/Commands (start of line)</h3>
          <p className="text-muted-foreground text-xs">
            Type <code>/</code> at the beginning of a line for commands.
          </p>
          <CommandsExample />
        </div>

        <div id="example-tags" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">#Tags (auto-resolve on space)</h3>
          <p className="text-muted-foreground text-xs">
            Type <code>#tag</code> and press space to auto-create a chip. Backspace reverts it.
          </p>
          <TagsExample />
        </div>

        <div id="example-callback" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">Callback mode (!)</h3>
          <p className="text-muted-foreground text-xs">
            Type <code>!</code> to fire a callback that programmatically inserts a chip.
          </p>
          <CallbackExample />
        </div>

        <div id="example-markdown" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">Markdown Formatting</h3>
          <p className="text-muted-foreground text-xs">
            Wrap text in <code>**bold**</code>, <code>*italic*</code>, or <code>***both***</code> to
            see inline styling. Use <strong>Cmd+B</strong> / <strong>Cmd+I</strong> shortcuts. Start
            a line with <code>- </code> or <code>* </code> for auto-formatted lists (Tab to indent).
          </p>
          <MarkdownExample />
        </div>

        <div id="example-copy-paste" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">Copy & Paste</h3>
          <p className="text-muted-foreground text-xs">
            Select content with chips in the source editor and <strong>Cmd+C</strong> to copy, then{' '}
            <strong>Cmd+V</strong> in the target to paste — chips are preserved. Pasting plain text
            like <code>@alice #bug</code> from outside auto-resolves matching triggers.
          </p>
          <CopyPasteExample />
        </div>

        <div id="example-images" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">Image Attachments</h3>
          <p className="text-muted-foreground text-xs">
            Paste an image (screenshot or file) to attach it. Images show a loading spinner during
            upload simulation. Click &times; to remove. Use <code>imagePosition</code> to control
            placement.
          </p>
          <ImageAttachmentsExample />
        </div>
      </div>

      {/* ActionBar */}
      <div className="flex flex-col gap-6">
        <div id="action-bar" className="flex scroll-mt-16 flex-col gap-3">
          <h2 className="text-xl font-semibold">Action Bar</h2>
          <p className="text-muted-foreground">
            A horizontal toolbar with left and right slots. Pairs with PromptArea for a complete
            chat input experience. Independently installable.
          </p>
          <div className="bg-muted rounded-md px-3 py-2 font-mono text-sm">
            npx shadcn@latest add https://prompt-area.vercel.app/r/action-bar.json
          </div>
        </div>

        <div id="action-bar-full" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">Full-Featured</h3>
          <p className="text-muted-foreground text-xs">
            Left slot with attach menu (<code>+</code>), <code>@</code> mention, <code>/</code>{' '}
            command, and <code>#</code> tag buttons. Right slot with markdown toggle, microphone,
            and send button. The send button submits the message just like pressing Enter.
          </p>
          <ActionBarFullExample />
        </div>

        <div id="action-bar-minimal" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">Minimal</h3>
          <p className="text-muted-foreground text-xs">
            Just a send button on the right. The simplest composition.
          </p>
          <ActionBarMinimalExample />
        </div>

        <div id="action-bar-disabled" className="flex scroll-mt-16 flex-col gap-2">
          <h3 className="text-sm font-medium">Disabled</h3>
          <p className="text-muted-foreground text-xs">
            Both PromptArea and ActionBar in disabled state.
          </p>
          <ActionBarDisabledExample />
        </div>
      </div>
    </div>
  )
}
