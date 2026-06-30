import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createRef, useState } from 'react'
import { PromptArea } from '../prompt-area'
import type { PromptAreaHandle, Segment } from '../types'

// ---------------------------------------------------------------------------
// Controlled harness: PromptArea is a controlled component (the `value` prop
// drives the DOM). A wrapper that mirrors onChange back into `value` keeps the
// rendered DOM in sync, so the imperative handle operates on realistic content.
// ---------------------------------------------------------------------------

function Harness({
  handleRef,
  initialValue = [],
  onChangeSpy,
}: {
  handleRef: React.Ref<PromptAreaHandle>
  initialValue?: Segment[]
  onChangeSpy?: (segments: Segment[]) => void
}) {
  const [value, setValue] = useState<Segment[]>(initialValue)
  return (
    <PromptArea
      ref={handleRef}
      value={value}
      onChange={(segments) => {
        onChangeSpy?.(segments)
        setValue(segments)
      }}
    />
  )
}

function renderHarness(initialValue?: Segment[]) {
  const ref = createRef<PromptAreaHandle>()
  const onChangeSpy = vi.fn()
  render(<Harness handleRef={ref} initialValue={initialValue} onChangeSpy={onChangeSpy} />)
  const editor = screen.getByRole('textbox') as HTMLDivElement
  // The non-null handle is the SUT; every test exercises it.
  const handle = ref.current!
  return { handle, editor, onChangeSpy }
}

const chip = (trigger: string, value: string, displayText: string): Segment => ({
  type: 'chip',
  trigger,
  value,
  displayText,
})

describe('PromptArea imperative handle', () => {
  describe('setText', () => {
    it('replaces existing content with plain text', () => {
      const { handle, onChangeSpy } = renderHarness([{ type: 'text', text: 'old content' }])

      act(() => {
        handle.setText('brand new')
      })

      expect(handle.getPlainText()).toBe('brand new')
      expect(onChangeSpy).toHaveBeenLastCalledWith([{ type: 'text', text: 'brand new' }])
    })

    it('drops existing chips when replacing content', () => {
      const { handle } = renderHarness([
        { type: 'text', text: 'hi ' },
        chip('@', 'alice', 'Alice'),
        { type: 'text', text: ' bye' },
      ])

      act(() => {
        handle.setText('replaced')
      })

      expect(handle.getPlainText()).toBe('replaced')
    })

    it('moves the caret to the end of the new text', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'old' }])

      act(() => {
        handle.setText('a longer string')
      })

      expect(handle.getCursorPosition()).toBe('a longer string'.length)
    })

    it('clears content to an empty model when given an empty string', () => {
      const { handle, onChangeSpy } = renderHarness([{ type: 'text', text: 'something' }])

      act(() => {
        handle.setText('')
      })

      expect(handle.getPlainText()).toBe('')
      expect(onChangeSpy).toHaveBeenLastCalledWith([])
    })
  })

  describe('appendText', () => {
    it('appends to existing text content', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'hello' }])

      act(() => {
        handle.appendText(' world')
      })

      expect(handle.getPlainText()).toBe('hello world')
    })

    it('preserves existing chips and appends after them', () => {
      const { handle, onChangeSpy } = renderHarness([
        { type: 'text', text: 'hi ' },
        chip('@', 'alice', 'Alice'),
      ])

      act(() => {
        handle.appendText(' done')
      })

      // Chip survives; appended text lands at the end of the plain text.
      expect(handle.getPlainText()).toBe('hi @Alice done')
      const lastSegments = onChangeSpy.mock.calls.at(-1)![0] as Segment[]
      expect(lastSegments).toContainEqual(chip('@', 'alice', 'Alice'))
      expect(lastSegments.at(-1)).toEqual({ type: 'text', text: ' done' })
    })

    it('appends onto an initially empty editor', () => {
      const { handle } = renderHarness()

      act(() => {
        handle.appendText('first')
      })

      expect(handle.getPlainText()).toBe('first')
    })

    it('moves the caret to the end after appending', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'abc' }])

      act(() => {
        handle.appendText('def')
      })

      expect(handle.getCursorPosition()).toBe('abcdef'.length)
    })
  })

  describe('setCursorToEnd', () => {
    it('places the caret at the plain-text length', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'hello world' }])

      act(() => {
        handle.setCursorPosition(0)
      })
      expect(handle.getCursorPosition()).toBe(0)

      act(() => {
        handle.setCursorToEnd()
      })
      expect(handle.getCursorPosition()).toBe('hello world'.length)
    })

    it('counts chip display text in the end offset', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'hi ' }, chip('@', 'alice', 'Alice')])

      act(() => {
        handle.setCursorToEnd()
      })

      // Plain text is "hi @Alice" → 9 chars.
      expect(handle.getCursorPosition()).toBe('hi @Alice'.length)
    })
  })

  describe('get/setCursorPosition', () => {
    it('round-trips a caret offset inside the text', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'hello world' }])

      act(() => {
        handle.setCursorPosition(3)
      })

      expect(handle.getCursorPosition()).toBe(3)
    })

    it('returns null when there is no selection in the editor', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'hello' }])

      // Move the active selection outside the editor entirely.
      act(() => {
        window.getSelection()?.removeAllRanges()
      })

      expect(handle.getCursorPosition()).toBeNull()
    })
  })

  describe('get/setSelection', () => {
    it('round-trips a non-collapsed selection range', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'hello world' }])

      act(() => {
        handle.setSelection(6, 11)
      })

      expect(handle.getSelection()).toEqual({ start: 6, end: 11 })
    })

    it('reports a collapsed selection as equal start/end', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'hello world' }])

      act(() => {
        handle.setCursorPosition(4)
      })

      expect(handle.getSelection()).toEqual({ start: 4, end: 4 })
    })

    it('returns null when the selection leaves the editor', () => {
      const { handle } = renderHarness([{ type: 'text', text: 'hello' }])

      act(() => {
        window.getSelection()?.removeAllRanges()
      })

      expect(handle.getSelection()).toBeNull()
    })

    it('maps a selection that spans a chip to plain-text offsets', () => {
      const { handle } = renderHarness([
        { type: 'text', text: 'hi ' },
        chip('@', 'alice', 'Alice'),
        { type: 'text', text: ' bye' },
      ])

      // Select from start through the end of the chip ("hi @Alice" → 9 chars).
      act(() => {
        handle.setSelection(0, 9)
      })

      expect(handle.getSelection()).toEqual({ start: 0, end: 9 })
    })
  })
})
