import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PromptArea } from '../prompt-area'
import type { Segment } from '../types'
import { placeCursorAtEnd, mockEditorGeometry, restoreRangeRect } from './test-helpers'

// Regression: paste content taller than maxHeight, then press Shift+Enter —
// the newline (and caret) landed below the editor's visible box because
// programmatic selection placement never auto-scrolls, and the model→DOM
// re-render reset scrollTop to 0. The shared geometry mock fakes the scroll
// box (jsdom has no layout) and simulates the real-browser clamp-to-0 when
// the editor is emptied, so these tests prove the post-render scroll
// machinery runs — not just the pre-render call.

const LONG_TEXT = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n')

// A 200px-tall scroll box holding 600px of content whose caret line sits on
// the content's last line (560..580 in content coordinates).
const OVERFLOWING_BOX = { caretTop: 560, scrollHeight: 600, clientHeight: 200 }

describe('caret stays visible in an overflowing editor', () => {
  afterEach(restoreRangeRect)

  function renderEditor(initial: Segment[] = []) {
    function Wrap() {
      const [value, setValue] = useState<Segment[]>(initial)
      return <PromptArea value={value} onChange={setValue} maxHeight={200} />
    }
    render(<Wrap />)
    return screen.getByRole('textbox') as HTMLDivElement
  }

  it('scrolls to the caret after pasting long text', () => {
    const editor = renderEditor()
    mockEditorGeometry(editor, OVERFLOWING_BOX)

    act(() => {
      editor.focus()
      placeCursorAtEnd(editor)
      fireEvent.paste(editor, {
        clipboardData: {
          files: [],
          items: [],
          getData: (type: string) => (type === 'text/plain' ? LONG_TEXT : ''),
        },
      })
    })

    // Caret line bottom (580) minus visible box bottom (200).
    expect(editor.scrollTop).toBe(380)
  })

  it('keeps a Shift+Enter newline in view', () => {
    const editor = renderEditor([{ type: 'text', text: LONG_TEXT }])
    mockEditorGeometry(editor, OVERFLOWING_BOX)

    act(() => {
      editor.focus()
      placeCursorAtEnd(editor)
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true })
    })

    expect(editor.scrollTop).toBe(380)
  })

  it('preserves scrollTop across a re-render of a blurred editor', () => {
    // An external value update re-renders the DOM; the clear clamps scrollTop
    // to 0 and, with no selection in the editor to follow, no caret nudge can
    // recover it — renderSegmentsToDOM must put the saved viewport back.
    const onChange = vi.fn()
    const { rerender } = render(
      <PromptArea
        value={[{ type: 'text', text: LONG_TEXT }]}
        onChange={onChange}
        maxHeight={200}
      />,
    )
    const editor = screen.getByRole('textbox') as HTMLDivElement
    mockEditorGeometry(editor, { ...OVERFLOWING_BOX, scrollTop: 250 })

    act(() => {
      rerender(
        <PromptArea
          value={[{ type: 'text', text: `${LONG_TEXT}\nappended externally` }]}
          onChange={onChange}
          maxHeight={200}
        />,
      )
    })

    expect(editor.scrollTop).toBe(250)
  })
})
