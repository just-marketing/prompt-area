'use client'

import { useCallback, useRef, useState } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type {
  Segment,
  TriggerConfig,
  PromptAreaHandle,
} from '@/registry/new-york/blocks/prompt-area/types'
import { USERS, COMMANDS, TAGS } from './mock-data'

export function InspectorSection() {
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
