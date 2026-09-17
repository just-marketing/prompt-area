import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePromptArea } from '../use-prompt-area'
import { hasOrderedListRun } from '../prompt-area-list-ops'
import type { Segment } from '../types'

// The ordered-list renumber check walks every line of the document. On the
// typing hot path it must only run when the keystroke could have changed the
// list structure; a settled document typed into on a prose line skips it.

vi.mock('../prompt-area-list-ops', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../prompt-area-list-ops')>()
  return { ...actual, hasOrderedListRun: vi.fn(actual.hasOrderedListRun) }
})

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

function br(): HTMLBRElement {
  return document.createElement('br')
}

function place(node: Node, offset: number) {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

function setup() {
  const onChange = vi.fn()
  const { result, rerender } = renderHook(
    ({ value }: { value: Segment[] }) => usePromptArea({ value, onChange }),
    { initialProps: { value: [] as Segment[] } },
  )
  const editor = document.createElement('div')
  editor.contentEditable = 'true'
  document.body.appendChild(editor)
  ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor
  return { result, rerender, editor, onChange }
}

function plainTextOf(calls: unknown[][]): string {
  const segments = calls[calls.length - 1][0] as Segment[]
  return segments.map((s) => (s.type === 'text' ? s.text : '')).join('')
}

beforeEach(() => {
  document.body.innerHTML = ''
  vi.mocked(hasOrderedListRun).mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ordered-list check on the typing hot path', () => {
  it('runs the full check on the first keystroke and renumbers a stale list', () => {
    const { result, editor, onChange } = setup()
    editor.append('1. a', br(), '1. b', br(), 'prose')
    const prose = editor.childNodes[4] as Text
    prose.data = 'prosex'
    place(prose, 'prosex'.length)

    act(() => {
      result.current.handleInput()
    })
    expect(hasOrderedListRun).toHaveBeenCalledTimes(1)
    expect(plainTextOf(onChange.mock.calls)).toBe('1. a\n2. b\nprosex')
  })

  it('skips the check for a later keystroke on a prose line', () => {
    const { result, editor, onChange } = setup()
    editor.append('1. a', br(), '2. b', br(), 'prose')
    const prose = editor.childNodes[4] as Text
    prose.data = 'prosex'
    place(prose, 'prosex'.length)
    act(() => {
      result.current.handleInput()
    })
    expect(hasOrderedListRun).toHaveBeenCalledTimes(1)

    prose.data = 'prosexy'
    place(prose, 'prosexy'.length)
    act(() => {
      result.current.handleInput()
    })
    expect(hasOrderedListRun).toHaveBeenCalledTimes(1)
    expect(plainTextOf(onChange.mock.calls)).toBe('1. a\n2. b\nprosexy')
  })

  it('still renumbers when a later keystroke removes a list marker', () => {
    const { result, editor, onChange } = setup()
    editor.append('1. a', br(), '2. b', br(), '3. c', br(), '4. d', br(), 'prose')
    const prose = editor.childNodes[8] as Text
    prose.data = 'prosex'
    place(prose, 'prosex'.length)
    act(() => {
      result.current.handleInput()
    })

    // Delete "2. " from the second item: the run splits and the tail restarts.
    const item2 = editor.childNodes[2] as Text
    item2.data = 'b'
    place(item2, 0)
    act(() => {
      result.current.handleInput()
    })
    expect(hasOrderedListRun).toHaveBeenCalledTimes(2)
    expect(plainTextOf(onChange.mock.calls)).toBe('1. a\nb\n1. c\n2. d\nprosex')
  })

  it('runs the full check again after the model was replaced from outside', () => {
    const { result, rerender, editor, onChange } = setup()
    editor.append('1. a', br(), '2. b', br(), 'prose')
    const prose = editor.childNodes[4] as Text
    prose.data = 'prosex'
    place(prose, 'prosex'.length)
    act(() => {
      result.current.handleInput()
    })
    expect(hasOrderedListRun).toHaveBeenCalledTimes(1)

    // An external value renders through the sync effect, which leaves a fresh
    // segments array behind: that is what invalidates the settled state, so a
    // stale list arriving from outside is still renumbered on the next key.
    act(() => {
      rerender({ value: [{ type: 'text', text: '1. x\n1. y\nprose' }] })
    })
    const prose2 = editor.lastChild as Text
    expect(prose2.data).toBe('prose')
    prose2.data = 'prosez'
    place(prose2, 'prosez'.length)
    act(() => {
      result.current.handleInput()
    })
    expect(hasOrderedListRun).toHaveBeenCalledTimes(2)
    expect(plainTextOf(onChange.mock.calls)).toBe('1. x\n2. y\nprosez')
  })
})
