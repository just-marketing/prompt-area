import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { PromptArea } from '../prompt-area'
import { CompactPromptArea } from '../../compact-prompt-area'
import { buildSubmitEvent, promptAreaEventName } from '../analytics'
import type { PromptAreaAnalyticsEvent } from '../analytics'
import type { PromptAreaHandle, Segment, TriggerConfig } from '../types'
import { placeCursor, placeCursorAtEnd } from './test-helpers'

// jsdom doesn't implement scrollIntoView (used by the trigger popover)
Element.prototype.scrollIntoView = vi.fn()

function typeText(editor: HTMLElement, text: string) {
  fireEvent.input(editor, { target: { textContent: text } })
}

function pasteText(editor: HTMLElement, text: string) {
  placeCursor(editor, 0)
  fireEvent.paste(editor, {
    clipboardData: {
      files: [],
      items: [],
      getData: (type: string) => (type === 'text/plain' ? text : ''),
    },
  })
}

function eventsOf(handler: ReturnType<typeof vi.fn>, type: string) {
  return handler.mock.calls
    .map(([e]) => e as PromptAreaAnalyticsEvent)
    .filter((e) => e.type === type)
}

describe('PromptArea analytics', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultProps = {
    value: [] as Segment[],
    onChange: vi.fn(),
  }

  describe('input_start', () => {
    it('fires once per compose session, not per keystroke', () => {
      const onAnalyticsEvent = vi.fn()
      render(<PromptArea {...defaultProps} onAnalyticsEvent={onAnalyticsEvent} />)
      const editor = screen.getByRole('textbox')

      typeText(editor, 'h')
      typeText(editor, 'he')
      typeText(editor, 'hel')

      expect(eventsOf(onAnalyticsEvent, 'input_start')).toHaveLength(1)
    })

    it('re-arms after a submit', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea {...defaultProps} onSubmit={vi.fn()} onAnalyticsEvent={onAnalyticsEvent} />,
      )
      const editor = screen.getByRole('textbox')

      typeText(editor, 'hello')
      fireEvent.keyDown(editor, { key: 'Enter' })
      typeText(editor, 'next message')

      expect(eventsOf(onAnalyticsEvent, 'input_start')).toHaveLength(2)
    })

    it('re-arms when the host resets value to empty', () => {
      const onAnalyticsEvent = vi.fn()
      const { rerender } = render(
        <PromptArea {...defaultProps} onAnalyticsEvent={onAnalyticsEvent} />,
      )
      const editor = screen.getByRole('textbox')

      typeText(editor, 'draft')
      expect(eventsOf(onAnalyticsEvent, 'input_start')).toHaveLength(1)

      rerender(<PromptArea {...defaultProps} value={[]} onAnalyticsEvent={onAnalyticsEvent} />)
      typeText(editor, 'fresh')

      expect(eventsOf(onAnalyticsEvent, 'input_start')).toHaveLength(2)
    })

    it('fires for a paste-first compose session', () => {
      const onAnalyticsEvent = vi.fn()
      render(<PromptArea {...defaultProps} onAnalyticsEvent={onAnalyticsEvent} />)
      const editor = screen.getByRole('textbox')

      pasteText(editor, 'pasted draft')

      expect(eventsOf(onAnalyticsEvent, 'input_start')).toHaveLength(1)
    })
  })

  describe('submit', () => {
    it('emits a metadata-only payload on Enter', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea {...defaultProps} onSubmit={vi.fn()} onAnalyticsEvent={onAnalyticsEvent} />,
      )
      const editor = screen.getByRole('textbox')

      typeText(editor, 'hello')
      fireEvent.keyDown(editor, { key: 'Enter' })

      const submits = eventsOf(onAnalyticsEvent, 'submit')
      expect(submits).toHaveLength(1)
      expect(submits[0]).toMatchObject({
        type: 'submit',
        method: 'enter',
        textLength: 5,
        chipCount: 0,
        chipCountByTrigger: {},
        imageCount: 0,
        fileCount: 0,
      })
      expect((submits[0] as { msSinceInputStart: number | null }).msSinceInputStart).toBeTypeOf(
        'number',
      )
    })

    it('reports null msSinceInputStart for a prefilled draft', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea
          {...defaultProps}
          value={[{ type: 'text', text: 'prefilled' }]}
          onSubmit={vi.fn()}
          onAnalyticsEvent={onAnalyticsEvent}
        />,
      )
      const editor = screen.getByRole('textbox')

      fireEvent.keyDown(editor, { key: 'Enter' })

      const submits = eventsOf(onAnalyticsEvent, 'submit')
      expect(submits).toHaveLength(1)
      expect(submits[0]).toMatchObject({ msSinceInputStart: null })
    })

    it('is not emitted when no onSubmit handler is wired', () => {
      const onAnalyticsEvent = vi.fn()
      render(<PromptArea {...defaultProps} onAnalyticsEvent={onAnalyticsEvent} />)
      const editor = screen.getByRole('textbox')

      typeText(editor, 'hello')
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(eventsOf(onAnalyticsEvent, 'submit')).toHaveLength(0)
    })

    it('includes attachment counts from the images/files props', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea
          {...defaultProps}
          value={[{ type: 'text', text: 'with attachments' }]}
          images={[{ id: '1', url: 'https://example.com/a.png' }]}
          files={[
            { id: 'f1', name: 'a.pdf' },
            { id: 'f2', name: 'b.pdf' },
          ]}
          onSubmit={vi.fn()}
          onAnalyticsEvent={onAnalyticsEvent}
        />,
      )

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })

      expect(eventsOf(onAnalyticsEvent, 'submit')[0]).toMatchObject({
        imageCount: 1,
        fileCount: 2,
      })
    })
  })

  describe('trigger and chip events', () => {
    const suggestions = [
      { value: 'u-alice', label: 'Alice' },
      { value: 'u-bob', label: 'Bob' },
    ]
    const mentionTrigger: TriggerConfig = {
      char: '@',
      position: 'any',
      mode: 'dropdown',
      onSearch: () => suggestions,
    }

    function renderWithTrigger(
      onAnalyticsEvent: (event: PromptAreaAnalyticsEvent) => void,
      trigger: TriggerConfig = mentionTrigger,
    ) {
      render(
        <PromptArea {...defaultProps} triggers={[trigger]} onAnalyticsEvent={onAnalyticsEvent} />,
      )
      return screen.getByRole('textbox') as HTMLDivElement
    }

    function typeWithCursor(editor: HTMLDivElement, text: string) {
      editor.textContent = text
      placeCursorAtEnd(editor)
      fireEvent.input(editor)
    }

    it('emits one trigger_activate per activation, not per keystroke', () => {
      const onAnalyticsEvent = vi.fn()
      const editor = renderWithTrigger(onAnalyticsEvent)

      typeWithCursor(editor, '@')
      typeWithCursor(editor, '@a')
      typeWithCursor(editor, '@al')

      const activations = eventsOf(onAnalyticsEvent, 'trigger_activate')
      expect(activations).toHaveLength(1)
      expect(activations[0]).toMatchObject({ trigger: '@', mode: 'dropdown' })
    })

    it('emits chip_add with value, index, and queryLength on dropdown selection', () => {
      const onAnalyticsEvent = vi.fn()
      const editor = renderWithTrigger(onAnalyticsEvent)

      typeWithCursor(editor, '@al')
      fireEvent.keyDown(editor, { key: 'Enter' })

      const adds = eventsOf(onAnalyticsEvent, 'chip_add')
      expect(adds).toHaveLength(1)
      expect(adds[0]).toMatchObject({
        trigger: '@',
        method: 'select',
        value: 'u-alice',
        index: 0,
        queryLength: 2,
      })
    })

    it('omits value for auto-resolved chips (user-typed text)', () => {
      const onAnalyticsEvent = vi.fn()
      const editor = renderWithTrigger(onAnalyticsEvent, {
        char: '#',
        position: 'any',
        mode: 'dropdown',
        onSearch: () => [],
        resolveOnSpace: true,
      })

      typeWithCursor(editor, '#secret-tag')
      fireEvent.keyDown(editor, { key: ' ' })

      const adds = eventsOf(onAnalyticsEvent, 'chip_add')
      expect(adds).toHaveLength(1)
      expect(adds[0]).toMatchObject({ trigger: '#', method: 'auto_resolve' })
      expect(adds[0]).not.toHaveProperty('value')
    })

    it('emits one search_empty per activation when a search returns no results', () => {
      const onAnalyticsEvent = vi.fn()
      const editor = renderWithTrigger(onAnalyticsEvent, {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch: () => [],
      })

      typeWithCursor(editor, '@zz')
      typeWithCursor(editor, '@zzz')

      const empties = eventsOf(onAnalyticsEvent, 'search_empty')
      expect(empties).toHaveLength(1)
      expect(empties[0]).toMatchObject({ trigger: '@' })
    })

    it('emits chip_delete with value when a selected chip is backspaced', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea
          {...defaultProps}
          value={[{ type: 'chip', trigger: '@', value: 'u-alice', displayText: 'Alice' }]}
          onAnalyticsEvent={onAnalyticsEvent}
        />,
      )
      const editor = screen.getByRole('textbox') as HTMLDivElement

      placeCursorAtEnd(editor)
      fireEvent.keyDown(editor, { key: 'Backspace' })

      const deletes = eventsOf(onAnalyticsEvent, 'chip_delete')
      expect(deletes).toHaveLength(1)
      expect(deletes[0]).toMatchObject({ trigger: '@', method: 'delete', value: 'u-alice' })
    })

    it('emits chip_delete method revert without value for auto-resolved chips', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea
          {...defaultProps}
          value={[
            {
              type: 'chip',
              trigger: '#',
              value: 'typed-tag',
              displayText: 'typed-tag',
              autoResolved: true,
            },
          ]}
          onAnalyticsEvent={onAnalyticsEvent}
        />,
      )
      const editor = screen.getByRole('textbox') as HTMLDivElement

      placeCursorAtEnd(editor)
      fireEvent.keyDown(editor, { key: 'Backspace' })

      const deletes = eventsOf(onAnalyticsEvent, 'chip_delete')
      expect(deletes).toHaveLength(1)
      expect(deletes[0]).toMatchObject({ trigger: '#', method: 'revert' })
      expect(deletes[0]).not.toHaveProperty('value')
    })

    it('emits chip_add method programmatic for imperative insertChip', () => {
      const onAnalyticsEvent = vi.fn()
      const ref = createRef<PromptAreaHandle>()
      render(<PromptArea {...defaultProps} ref={ref} onAnalyticsEvent={onAnalyticsEvent} />)

      act(() => {
        ref.current!.insertChip({ trigger: '@', value: 'u-carol', displayText: 'Carol' })
      })

      const adds = eventsOf(onAnalyticsEvent, 'chip_add')
      expect(adds).toHaveLength(1)
      expect(adds[0]).toMatchObject({ trigger: '@', method: 'programmatic', value: 'u-carol' })
    })

    it('emits trigger_activate for launch triggers on each press', () => {
      const onAnalyticsEvent = vi.fn()
      const editor = renderWithTrigger(onAnalyticsEvent, {
        char: '/',
        position: 'start',
        mode: 'launch',
        onActivate: vi.fn(),
      })

      editor.focus()
      placeCursor(editor, 0)
      fireEvent.keyDown(editor, { key: '/' })

      const activations = eventsOf(onAnalyticsEvent, 'trigger_activate')
      expect(activations).toHaveLength(1)
      expect(activations[0]).toMatchObject({ trigger: '/', mode: 'launch' })
    })
  })

  describe('paste, undo/redo, and max length', () => {
    it('emits paste with the pasted length, not the document length', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea
          {...defaultProps}
          value={[{ type: 'text', text: 'existing content ' }]}
          onAnalyticsEvent={onAnalyticsEvent}
        />,
      )
      const editor = screen.getByRole('textbox')

      pasteText(editor, 'hello world')

      const pastes = eventsOf(onAnalyticsEvent, 'paste')
      expect(pastes).toHaveLength(1)
      expect(pastes[0]).toMatchObject({ source: 'external', textLength: 11 })
    })

    it('emits undo only when a snapshot is applied, and redo on reapply', () => {
      const onAnalyticsEvent = vi.fn()
      render(<PromptArea {...defaultProps} onAnalyticsEvent={onAnalyticsEvent} />)
      const editor = screen.getByRole('textbox')

      // No-op undo: empty history
      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true })
      expect(eventsOf(onAnalyticsEvent, 'undo')).toHaveLength(0)

      // Paste pushes an undo snapshot
      pasteText(editor, 'something')
      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true })
      expect(eventsOf(onAnalyticsEvent, 'undo')).toHaveLength(1)

      // Stack now empty again — no further undo events
      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true })
      expect(eventsOf(onAnalyticsEvent, 'undo')).toHaveLength(1)

      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true, shiftKey: true })
      expect(eventsOf(onAnalyticsEvent, 'redo')).toHaveLength(1)
    })

    it('emits max_length_reached once per at-cap episode', () => {
      const onAnalyticsEvent = vi.fn()
      render(<PromptArea {...defaultProps} maxLength={5} onAnalyticsEvent={onAnalyticsEvent} />)
      const editor = screen.getByRole('textbox') as HTMLDivElement

      const typeOverCap = (text: string) => {
        editor.textContent = text
        placeCursorAtEnd(editor)
        fireEvent.input(editor)
      }

      typeOverCap('abcdef')
      typeOverCap('abcdeg')
      expect(eventsOf(onAnalyticsEvent, 'max_length_reached')).toHaveLength(1)

      // Dropping below the cap re-arms the episode
      typeOverCap('abc')
      typeOverCap('abcdef')
      expect(eventsOf(onAnalyticsEvent, 'max_length_reached')).toHaveLength(2)
      expect(eventsOf(onAnalyticsEvent, 'max_length_reached')[0]).toMatchObject({ maxLength: 5 })
    })
  })

  describe('attachment events', () => {
    it('emits image_paste when an image file is pasted', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea {...defaultProps} onImagePaste={vi.fn()} onAnalyticsEvent={onAnalyticsEvent} />,
      )
      const editor = screen.getByRole('textbox')

      const file = new File(['pixels'], 'screenshot.png', { type: 'image/png' })
      fireEvent.paste(editor, {
        clipboardData: { files: [file], items: [], getData: () => '' },
      })

      expect(eventsOf(onAnalyticsEvent, 'image_paste')).toHaveLength(1)
    })

    it('emits image_remove and file_remove from the strips', async () => {
      const user = userEvent.setup()
      const onAnalyticsEvent = vi.fn()
      render(
        <PromptArea
          {...defaultProps}
          images={[{ id: '1', url: 'https://example.com/a.png', alt: 'A' }]}
          files={[{ id: 'f1', name: 'doc.pdf' }]}
          onImageRemove={vi.fn()}
          onFileRemove={vi.fn()}
          onAnalyticsEvent={onAnalyticsEvent}
        />,
      )

      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      for (const button of removeButtons) {
        await user.click(button)
      }

      expect(eventsOf(onAnalyticsEvent, 'image_remove')).toHaveLength(1)
      expect(eventsOf(onAnalyticsEvent, 'file_remove')).toHaveLength(1)
    })
  })

  describe('failure isolation', () => {
    it('a throwing handler never breaks the editor and is logged', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onChange = vi.fn()
      const onSubmit = vi.fn()
      render(
        <PromptArea
          value={[]}
          onChange={onChange}
          onSubmit={onSubmit}
          onAnalyticsEvent={() => {
            throw new Error('integrator bug')
          }}
        />,
      )
      const editor = screen.getByRole('textbox')

      typeText(editor, 'hello')
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(onChange).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('onAnalyticsEvent'),
        expect.any(Error),
      )
    })

    it('emits nothing and stays functional without a handler', () => {
      const onSubmit = vi.fn()
      render(<PromptArea {...defaultProps} onSubmit={onSubmit} />)
      const editor = screen.getByRole('textbox')

      typeText(editor, 'hello')
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })

  describe('CompactPromptArea', () => {
    it('emits exactly one submit with method button on send-button click', async () => {
      const user = userEvent.setup()
      const onAnalyticsEvent = vi.fn()
      render(
        <CompactPromptArea
          value={[{ type: 'text', text: 'hello' }]}
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          onAnalyticsEvent={onAnalyticsEvent}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Send message' }))

      const submits = eventsOf(onAnalyticsEvent, 'submit')
      expect(submits).toHaveLength(1)
      expect(submits[0]).toMatchObject({ method: 'button', textLength: 5 })
    })

    it('emits exactly one submit with method enter on keyboard submit', () => {
      const onAnalyticsEvent = vi.fn()
      render(
        <CompactPromptArea
          value={[{ type: 'text', text: 'hello' }]}
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          onAnalyticsEvent={onAnalyticsEvent}
        />,
      )

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })

      const submits = eventsOf(onAnalyticsEvent, 'submit')
      expect(submits).toHaveLength(1)
      expect(submits[0]).toMatchObject({ method: 'enter' })
    })
  })

  describe('helpers', () => {
    it('promptAreaEventName prefixes the event type', () => {
      expect(promptAreaEventName({ type: 'input_start' })).toBe('prompt_area_input_start')
      expect(promptAreaEventName(buildSubmitEvent([]))).toBe('prompt_area_submit')
    })

    it('buildSubmitEvent counts chips by trigger', () => {
      const segments: Segment[] = [
        { type: 'text', text: 'hi ' },
        { type: 'chip', trigger: '@', value: 'u1', displayText: 'Alice' },
        { type: 'chip', trigger: '@', value: 'u2', displayText: 'Bob' },
        { type: 'chip', trigger: '#', value: 't1', displayText: 'tag' },
      ]
      expect(buildSubmitEvent(segments, { method: 'button', imageCount: 3 })).toEqual({
        type: 'submit',
        method: 'button',
        // 'hi ' (3) + '@Alice' (6) + '@Bob' (4) + '#tag' (4)
        textLength: 17,
        chipCount: 3,
        chipCountByTrigger: { '@': 2, '#': 1 },
        imageCount: 3,
        fileCount: 0,
        msSinceInputStart: null,
      })
    })
  })
})
