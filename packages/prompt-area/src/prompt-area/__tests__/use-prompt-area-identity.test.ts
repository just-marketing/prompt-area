import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePromptArea } from '../use-prompt-area'
import type { Segment, TriggerConfig } from '../types'

// ---------------------------------------------------------------------------
// jsdom polyfill: Range.getBoundingClientRect is not implemented
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

// ---------------------------------------------------------------------------
// Referential stability of the hook's outputs. The typing hot path re-renders
// the whole PromptArea when any of these lose identity: `events` (feeds
// handleInput, the imperative handle, eventHandlers) and `suggestions` (reset
// on every trigger-less keystroke). These tests pin the invariants the
// per-keystroke React work relies on.
// ---------------------------------------------------------------------------

const mentionTrigger: TriggerConfig = {
  char: '@',
  position: 'any',
  mode: 'dropdown',
  onSearch: vi.fn(() => [{ value: 'alice', label: 'Alice' }]),
}

function attachEditor(hookResult: ReturnType<typeof usePromptArea>): HTMLDivElement {
  const editor = document.createElement('div')
  editor.contentEditable = 'true'
  document.body.appendChild(editor)
  ;(hookResult.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor
  return editor
}

function placeCursor(node: Node, offset: number) {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

describe('usePromptArea referential stability', () => {
  it('keeps handle, eventHandlers, and handleInput identity across rerenders with stable props', () => {
    const props = {
      value: [] as Segment[],
      onChange: vi.fn(),
      triggers: [mentionTrigger],
    }
    const { result, rerender } = renderHook(() => usePromptArea(props))

    const firstHandle = result.current.handle
    const firstEventHandlers = result.current.eventHandlers
    const firstHandleInput = result.current.handleInput
    const firstHandleKeyDown = result.current.handleKeyDown

    rerender()

    expect(result.current.handle).toBe(firstHandle)
    expect(result.current.eventHandlers).toBe(firstEventHandlers)
    expect(result.current.handleInput).toBe(firstHandleInput)
    expect(result.current.handleKeyDown).toBe(firstHandleKeyDown)
  })

  it('does not re-render on a trigger-less keystroke (suggestions reset bails out)', () => {
    let renders = 0
    const props = {
      value: [] as Segment[],
      onChange: vi.fn(),
      triggers: [mentionTrigger],
    }
    const { result } = renderHook(() => {
      renders++
      return usePromptArea(props)
    })

    const editor = attachEditor(result.current)
    editor.appendChild(document.createTextNode('hello world'))
    placeCursor(editor.firstChild!, 5)

    const rendersBefore = renders
    const suggestionsBefore = result.current.suggestions

    act(() => {
      result.current.handleInput()
    })
    act(() => {
      result.current.handleInput()
    })

    expect(renders).toBe(rendersBefore)
    expect(result.current.suggestions).toBe(suggestionsBefore)
    expect(props.onChange).toHaveBeenCalledTimes(2)
  })
})
