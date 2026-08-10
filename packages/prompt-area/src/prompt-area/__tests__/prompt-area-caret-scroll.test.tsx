import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PromptArea } from '../prompt-area'
import type { Segment } from '../types'
import { placeCursorAtEnd } from './test-helpers'

// Regression: paste content taller than maxHeight, then press Shift+Enter —
// the newline (and caret) landed below the editor's visible box because
// programmatic selection placement never auto-scrolls, and the model→DOM
// re-render resets scrollTop to 0. jsdom has no layout, so these tests fake
// the scroll geometry and assert the editor is scrolled down to the caret.

const LONG_TEXT = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n')

describe('caret stays visible in an overflowing editor', () => {
  const originalRangeRect = Range.prototype.getBoundingClientRect

  afterEach(() => {
    Range.prototype.getBoundingClientRect = originalRangeRect
  })

  /**
   * A 200px-tall scroll box holding 600px of content whose caret line sits on
   * the content's last line (560..580). Text-node-anchored ranges report that
   * line translated by the live scrollTop; element-boundary ranges report the
   * zero rect, like real engines do.
   */
  function mockOverflowingBox(editor: HTMLElement) {
    let scrollTop = 0
    Object.defineProperty(editor, 'scrollHeight', { value: 600, configurable: true })
    Object.defineProperty(editor, 'clientHeight', { value: 200, configurable: true })
    Object.defineProperty(editor, 'scrollTop', {
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v
      },
      configurable: true,
    })
    editor.getBoundingClientRect = () => new DOMRect(0, 0, 300, 200)
    Range.prototype.getBoundingClientRect = function (this: Range) {
      return this.startContainer.nodeType === Node.TEXT_NODE
        ? new DOMRect(0, 560 - scrollTop, 0, 20)
        : new DOMRect(0, 0, 0, 0)
    }
    return {
      get scrollTop() {
        return scrollTop
      },
    }
  }

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
    const box = mockOverflowingBox(editor)

    act(() => {
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
    expect(box.scrollTop).toBe(380)
  })

  it('keeps a Shift+Enter newline in view', () => {
    const editor = renderEditor([{ type: 'text', text: LONG_TEXT }])
    const box = mockOverflowingBox(editor)

    act(() => {
      placeCursorAtEnd(editor)
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true })
    })

    expect(box.scrollTop).toBe(380)
  })
})
