import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePromptArea } from '../use-prompt-area'
import { decorateEditor } from '../dom-helpers'
import { getCursorOffset } from '../cursor-helpers'
import { segmentsToPlainText } from '../prompt-area-engine'
import type { Segment } from '../types'

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
// Shift+Enter on large documents takes the surgical path: split the caret's
// text node, insert one <br>, re-decorate only that line — instead of a full
// renderSegmentsToDOM teardown. These tests pin the fast path's DOM shape,
// model output, caret, and every fallback to the legacy full render.
// ---------------------------------------------------------------------------

function setup() {
  const onChange = vi.fn()
  const { result } = renderHook(() =>
    usePromptArea({
      value: [] as Segment[],
      onChange,
      markdownHeadings: true,
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

function shiftEnter(): React.KeyboardEvent<HTMLDivElement> {
  return {
    key: 'Enter',
    shiftKey: true,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    defaultPrevented: false,
    nativeEvent: { isComposing: false },
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLDivElement>
}

function lastChangeText(onChange: ReturnType<typeof vi.fn>): string {
  const segments = onChange.mock.calls.at(-1)?.[0] as Segment[]
  return segmentsToPlainText(segments)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Shift+Enter surgical newline', () => {
  it('splits the caret line with one <br> and keeps other lines by node identity', () => {
    const { result, editor, onChange } = setup()
    editor.append(
      document.createTextNode('first **bold** line'),
      document.createElement('br'),
      document.createTextNode('split here please'),
      document.createElement('br'),
      document.createTextNode('third https://example.com line'),
    )
    decorateEditor(editor, true, true)
    const line1Span = editor.querySelector('span[data-md]')!
    const line3Anchor = editor.querySelector('a[data-url]')!

    // Caret after "split" (offset inside line 2's text node).
    const brs = editor.querySelectorAll('br')
    const line2 = brs[0].nextSibling as Text
    placeCursor(line2, 'split'.length)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    // Model: newline at the caret's plain-text offset.
    expect(lastChangeText(onChange)).toBe(
      'first **bold** line\nsplit\n here please\nthird https://example.com line',
    )
    // DOM: the line was split by a real <br>; siblings kept their nodes.
    expect(editor.querySelectorAll('br')).toHaveLength(3)
    expect(editor.contains(line1Span)).toBe(true)
    expect(editor.contains(line3Anchor)).toBe(true)
    // Caret: right after the inserted newline.
    expect(getCursorOffset(editor)).toBe('first **bold** line\nsplit'.length + 1)
  })

  it('re-decorates both halves of the split line', () => {
    const { result, editor } = setup()
    editor.append(document.createTextNode('**left** and https://right.example'))
    decorateEditor(editor, true, true)

    // Caret between "**left** and" and " https://…".
    // After the split, the emphasis stays on line 1 and the URL is line 2.
    const offset = '**left** and'.length
    // The decorated line's first text node is inside/around spans; place via
    // the hook's own mapping by using the editor boundary walk instead:
    const sel = window.getSelection()!
    const range = document.createRange()
    // Find the text node containing " and " to anchor precisely.
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
    let target: Text | null = null
    let node: Node | null
    while ((node = walker.nextNode())) {
      if ((node.textContent ?? '').includes(' and')) {
        target = node as Text
        break
      }
    }
    expect(target).not.toBeNull()
    const local = (target!.textContent ?? '').indexOf(' and') + ' and'.length
    range.setStart(target!, local)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    expect(getCursorOffset(editor)).toBe(offset)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    const spans = editor.querySelectorAll('span[data-md]')
    const anchors = editor.querySelectorAll('a[data-url]')
    expect(spans.length).toBeGreaterThan(0)
    expect(anchors).toHaveLength(1)
    expect(spans[0].textContent).toBe('**left**')
    expect(anchors[0].textContent).toBe('https://right.example')
  })

  it('appends the sentinel <br> when splitting at the document end', () => {
    const { result, editor, onChange } = setup()
    const text = document.createTextNode('tail line')
    editor.append(text)
    placeCursor(text, 'tail line'.length)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    expect(lastChangeText(onChange)).toBe('tail line\n')
    const brs = editor.querySelectorAll('br')
    expect(brs).toHaveLength(2)
    expect((brs[1] as HTMLElement).dataset.sentinel).toBe('true')
    expect((brs[0] as HTMLElement).dataset.sentinel).toBeUndefined()
  })

  it('keeps ordered-list numbering intact when splitting a prose line below a list', () => {
    const { result, editor, onChange } = setup()
    editor.append(
      document.createTextNode('1. alpha'),
      document.createElement('br'),
      document.createTextNode('2. beta'),
      document.createElement('br'),
      document.createTextNode('prose line to split'),
    )
    const prose = editor.childNodes[4] as Text
    placeCursor(prose, 'prose'.length)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    expect(lastChangeText(onChange)).toBe('1. alpha\n2. beta\nprose\n line to split')
  })

  it('falls back to the full path for a non-collapsed selection', () => {
    const { result, editor, onChange } = setup()
    const text = document.createTextNode('delete THIS part')
    editor.append(text)
    const start = 'delete '.length
    const end = 'delete THIS'.length
    const range = document.createRange()
    range.setStart(text, start)
    range.setEnd(text, end)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    expect(lastChangeText(onChange)).toBe('delete \n part')
  })

  it('falls back to the full path when the editor holds a foreign element', () => {
    const { result, editor, onChange } = setup()
    const bold = document.createElement('b')
    bold.textContent = 'junk'
    const text = document.createTextNode('clean text')
    editor.append(bold, document.createElement('br'), text)
    placeCursor(text, 5)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    // Legacy path read the DOM (b unwrapped by the full render afterwards)
    // and produced the model edit at the caret.
    expect(lastChangeText(onChange)).toBe('junk\nclean\n text')
    expect(editor.querySelector('b')).toBeNull()
  })

  it('inserts before a document-leading chip, keeping DOM and model in agreement', () => {
    const { result, editor, onChange } = setup()
    const chip = document.createElement('span')
    chip.contentEditable = 'false'
    chip.dataset.chipTrigger = '@'
    chip.dataset.chipValue = 'u1'
    chip.dataset.chipDisplay = 'alice'
    chip.textContent = '@alice'
    editor.append(chip, document.createTextNode(' tail'))
    placeCursor(editor, 0)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    // findDOMPosition maps offset 0 to AFTER a leading chip (caret bias); the
    // surgical path must detect that and fall back so the <br> lands where
    // the model put the newline — before the chip.
    expect(lastChangeText(onChange)).toBe('\n@alice tail')
    expect(editor.firstChild?.nodeName).toBe('BR')
    const domText = Array.from(editor.childNodes)
      .map((n) =>
        n.nodeName === 'BR'
          ? (n as HTMLElement).dataset.sentinel
            ? ''
            : '\n'
          : (n.textContent ?? ''),
      )
      .join('')
    expect(domText).toBe('\n@alice tail')
    expect(getCursorOffset(editor)).toBe(1)
  })

  it('falls back and renumbers when the document holds a single misnumbered list line', () => {
    const { result, editor, onChange } = setup()
    editor.append(
      document.createTextNode('5. solo item'),
      document.createElement('br'),
      document.createTextNode('prose line'),
    )
    const prose = editor.childNodes[2] as Text
    placeCursor(prose, 'prose'.length)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    // applyEditResult renumbers unconditionally; the fast path must not skip
    // that just because the single line is not a "run".
    expect(lastChangeText(onChange)).toBe('1. solo item\nprose\n line')
  })

  it('repairs a missing sentinel when the document ends with a bare <br>', () => {
    const { result, editor, onChange } = setup()
    // A user can delete the sentinel with Backspace, leaving a bare trailing
    // <br> that reads as a final "\n" with nothing keeping it visible.
    editor.append(document.createTextNode('ab'), document.createElement('br'))
    placeCursor(editor.firstChild!, 1)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    expect(lastChangeText(onChange)).toBe('a\nb\n')
    const brs = editor.querySelectorAll('br')
    expect(brs).toHaveLength(3)
    expect((brs[2] as HTMLElement).dataset.sentinel).toBe('true')
  })

  it('inserts on an empty line correctly via the round-trip fallback', () => {
    const { result, editor, onChange } = setup()
    editor.append(
      document.createTextNode('a'),
      document.createElement('br'),
      document.createElement('br'),
      document.createTextNode('b'),
    )
    // Caret on the empty line: between the two <br>s.
    placeCursor(editor, 2)
    expect(getCursorOffset(editor)).toBe(2)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    expect(lastChangeText(onChange)).toBe('a\n\n\nb')
    expect(getCursorOffset(editor)).toBe(3)
  })

  it('handles an empty editor through the full path', () => {
    const { result, editor, onChange } = setup()
    placeCursor(editor, 0)

    act(() => {
      result.current.handleKeyDown(shiftEnter())
    })

    expect(lastChangeText(onChange)).toBe('\n')
    const brs = editor.querySelectorAll('br')
    expect(brs).toHaveLength(2)
    expect((brs[1] as HTMLElement).dataset.sentinel).toBe('true')
  })
})
