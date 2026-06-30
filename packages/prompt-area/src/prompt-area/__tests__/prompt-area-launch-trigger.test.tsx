import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PromptArea } from '../prompt-area'
import type { Segment, TriggerConfig } from '../types'

// ---------------------------------------------------------------------------
// jsdom polyfill: keydown handling reads selection geometry.
// ---------------------------------------------------------------------------
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = function () {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect
  }
}

function placeCursor(editor: HTMLElement, offset: number) {
  const range = document.createRange()
  const node = editor.firstChild ?? editor
  range.setStart(node, offset)
  range.collapse(true)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

function renderWithLaunch(onActivate: () => void) {
  function Wrap() {
    const [value, setValue] = useState<Segment[]>([])
    const triggers: TriggerConfig[] = [{ char: '/', position: 'start', mode: 'launch', onActivate }]
    return <PromptArea value={value} triggers={triggers} onChange={setValue} />
  }
  render(<Wrap />)
  return screen.getByRole('textbox') as HTMLDivElement
}

describe('PromptArea launch triggers', () => {
  it('fires onActivate and suppresses the char at a valid position', () => {
    const onActivate = vi.fn()
    const editor = renderWithLaunch(onActivate)
    editor.focus()
    placeCursor(editor, 0)

    // fireEvent returns false when a handler called preventDefault.
    const notPrevented = fireEvent.keyDown(editor, { key: '/' })

    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(onActivate.mock.calls[0][0]).toMatchObject({ cursorPosition: 0 })
    expect(notPrevented).toBe(false)
  })

  it('does not fire (and does not suppress) at an invalid position', () => {
    const onActivate = vi.fn()
    const editor = renderWithLaunch(onActivate)
    editor.textContent = 'hi'
    fireEvent.input(editor)
    placeCursor(editor, 2) // after "hi" — not a line start, so '/' is not a launch

    const notPrevented = fireEvent.keyDown(editor, { key: '/' })

    expect(onActivate).not.toHaveBeenCalled()
    expect(notPrevented).toBe(true)
  })

  it('ignores the launch char when a modifier is held', () => {
    const onActivate = vi.fn()
    const editor = renderWithLaunch(onActivate)
    editor.focus()
    placeCursor(editor, 0)

    fireEvent.keyDown(editor, { key: '/', metaKey: true })

    expect(onActivate).not.toHaveBeenCalled()
  })
})
