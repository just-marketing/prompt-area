import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePromptArea } from '../use-prompt-area'
import { decorateEditor } from '../dom-helpers'
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
// The typing hot path's two structural guarantees:
// 1. No Range.cloneContents anywhere in a plain keystroke (offset math walks
//    the live tree).
// 2. The decoration cycle touches only the caret's <br>-delimited line —
//    other lines keep their exact DOM nodes — with full-pass fallbacks when
//    the DOM state makes scoping unsafe.
// ---------------------------------------------------------------------------

const mentionTrigger: TriggerConfig = {
  char: '@',
  position: 'any',
  mode: 'dropdown',
  onSearch: vi.fn(() => []),
}

function setup(options: { markdownHeadings?: boolean } = {}) {
  const onChange = vi.fn()
  const { result } = renderHook(() =>
    usePromptArea({
      value: [] as Segment[],
      onChange,
      triggers: [mentionTrigger],
      markdownHeadings: options.markdownHeadings ?? true,
    }),
  )
  const editor = document.createElement('div')
  editor.contentEditable = 'true'
  document.body.appendChild(editor)
  ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor
  return { result, editor, onChange }
}

function placeCursor(node: Node, offset: number) {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

function makeKeyEvent(key: string): React.KeyboardEvent<HTMLDivElement> {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    defaultPrevented: false,
    nativeEvent: { isComposing: false },
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLDivElement>
}

/**
 * Seeds three decorated lines and returns the pieces. Line 2 is the line the
 * tests edit; lines 1 and 3 carry decorations whose node identity is asserted.
 */
function seedThreeLines(editor: HTMLDivElement) {
  editor.append(
    document.createTextNode('first **bold** line'),
    document.createElement('br'),
    document.createTextNode('edit me'),
    document.createElement('br'),
    document.createTextNode('third https://example.com/x line'),
  )
  // Establish the steady state a real render produces: everything decorated.
  decorateEditor(editor, true, true)

  const line1Span = editor.querySelector('span[data-md]')
  const line3Anchor = editor.querySelector('a[data-url]')
  const brs = editor.querySelectorAll('br')
  expect(line1Span).not.toBeNull()
  expect(line3Anchor).not.toBeNull()
  expect(brs).toHaveLength(2)

  // The middle line stayed a bare text node ("edit me" has nothing to
  // decorate); find it between the two <br>s.
  const line2Text = brs[0].nextSibling as Text
  expect(line2Text.textContent).toBe('edit me')
  return { line1Span: line1Span!, line3Anchor: line3Anchor!, line2Text, brs }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('typing hot path', () => {
  it('performs zero Range.cloneContents on a plain keystroke', () => {
    const { result, editor } = setup()
    const { line2Text } = seedThreeLines(editor)

    // Simulate the browser having inserted a character at the caret.
    line2Text.textContent = 'edit mex'
    placeCursor(line2Text, 'edit mex'.length)

    const cloneSpy = vi.spyOn(Range.prototype, 'cloneContents')
    act(() => {
      result.current.handleKeyDown(makeKeyEvent('x'))
      result.current.handleInput()
    })
    expect(cloneSpy).not.toHaveBeenCalled()
  })

  it('re-decorates only the caret line; other lines keep their exact nodes', () => {
    const { result, editor, onChange } = setup()
    const { line1Span, line3Anchor, line2Text } = seedThreeLines(editor)

    line2Text.textContent = 'edit me **now**'
    placeCursor(line2Text, 'edit me **now**'.length)
    act(() => {
      result.current.handleInput()
    })

    // Model updated with the typed text.
    const lastChange = onChange.mock.calls.at(-1)?.[0] as Segment[]
    expect(lastChange.map((s) => (s.type === 'text' ? s.text : '')).join('')).toBe(
      'first **bold** line\nedit me **now**\nthird https://example.com/x line',
    )

    // The caret line got its fresh decoration…
    const brs = editor.querySelectorAll('br')
    let decoratedInLine2 = false
    for (let n = brs[0].nextSibling; n && n !== brs[1]; n = n.nextSibling) {
      if (n instanceof HTMLElement && n.dataset.md !== undefined) decoratedInLine2 = true
    }
    expect(decoratedInLine2).toBe(true)

    // …while the other lines' decoration elements are the same objects.
    expect(editor.contains(line1Span)).toBe(true)
    expect(editor.contains(line3Anchor)).toBe(true)
  })

  it('re-decorates a line edited inside an existing decoration span', () => {
    const { result, editor } = setup()
    seedThreeLines(editor)

    // Type inside line 1's bold span content: "**bold**" -> "**bolder**".
    const styled = editor.querySelector('span[data-md] span.font-bold') as HTMLElement
    const inner = styled.firstChild as Text
    inner.textContent = 'bolder'
    placeCursor(inner, 'bolder'.length)
    act(() => {
      result.current.handleInput()
    })

    // The line was stripped and re-decorated into a consistent fresh state.
    const span = editor.querySelector('span[data-md]')
    expect(span?.textContent).toBe('**bolder**')
    expect(span?.querySelector('span.font-bold')?.textContent).toBe('bolder')
  })

  it('falls back to a full normalize when a foreign element exists anywhere', () => {
    const { result, editor } = setup()
    const { line2Text, line3Anchor } = seedThreeLines(editor)

    // Browser-style junk on line 3, far from the caret.
    const bold = document.createElement('b')
    bold.textContent = 'junk'
    editor.insertBefore(bold, line3Anchor)

    line2Text.textContent = 'edit mex'
    placeCursor(line2Text, 3)
    act(() => {
      result.current.handleInput()
    })

    // The full path unwrapped the <b> everywhere, not just on the caret line.
    expect(editor.querySelector('b')).toBeNull()
    expect(editor.textContent).toContain('junk')
  })

  it('falls back to a full decorate when a text node contains a literal newline', () => {
    const { result, editor } = setup()

    // Artificial state: line 1 raw and undecorated, and a text node carrying
    // a literal newline — scoping must not run, so the full pass reaches and
    // decorates line 1 too.
    const line1 = document.createTextNode('raw **bold** here')
    const multi = document.createTextNode('two\nlines')
    editor.append(line1, document.createElement('br'), multi)
    placeCursor(multi, 2)

    act(() => {
      result.current.handleInput()
    })

    expect(editor.querySelector('span[data-md]')).not.toBeNull()
  })
})
