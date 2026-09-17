import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { scanEditorDOM, usePromptArea } from '../use-prompt-area'
import { getCursorOffset } from '../cursor-helpers'
import { decorateEditor, stripDecorationsInRange } from '../dom-helpers'
import type { Segment, TriggerConfig } from '../types'

// ---------------------------------------------------------------------------
// The typing hot path reads the editor once per keystroke. Two properties keep
// that safe:
//
// 1. The caret offset the scan folds into that pass is the same number the
//    standalone getCursorOffset walk returns, for every DOM shape and every
//    boundary point the editor can hold.
// 2. The caret is only re-placed when the decoration cycle actually moved the
//    nodes it was anchored in — so strip/decorate have to report that
//    faithfully.
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

function makeEditor(): HTMLDivElement {
  const editor = document.createElement('div')
  editor.contentEditable = 'true'
  document.body.appendChild(editor)
  return editor
}

function br(sentinel = false): HTMLBRElement {
  const el = document.createElement('br')
  if (sentinel) el.dataset.sentinel = 'true'
  return el
}

function chip(trigger: string, value: string, display: string): HTMLSpanElement {
  const el = document.createElement('span')
  el.contentEditable = 'false'
  el.dataset.chipTrigger = trigger
  el.dataset.chipValue = value
  el.dataset.chipDisplay = display
  el.textContent = `${trigger}${display}`
  return el
}

function mdSpan(text: string): HTMLSpanElement {
  const el = document.createElement('span')
  el.dataset.md = 'true'
  el.textContent = text
  return el
}

function link(url: string): HTMLAnchorElement {
  const el = document.createElement('a')
  el.dataset.url = 'true'
  el.href = url
  el.textContent = url
  return el
}

/** A chip missing its value/display attributes: still atomic, still a chip. */
function malformedChip(trigger: string, text: string): HTMLSpanElement {
  const el = document.createElement('span')
  el.contentEditable = 'false'
  el.dataset.chipTrigger = trigger
  el.textContent = text
  return el
}

/** An inline element the scan does not model (browser-inserted formatting). */
function foreignInline(text: string): HTMLElement {
  const el = document.createElement('b')
  el.textContent = text
  return el
}

/** A non-HTML subtree, which the root caret walk never descends into. */
function mathml(text: string): Element {
  const el = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mi')
  el.textContent = text
  return el
}

function place(node: Node, offset: number) {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

/** Every boundary point the caret can occupy in `editor`, deep. */
function allBoundaryPoints(
  editor: HTMLElement,
): Array<{ node: Node; offset: number; label: string }> {
  const points: Array<{ node: Node; offset: number; label: string }> = []
  const visit = (node: Node, path: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text
      for (let o = 0; o <= text.length; o++)
        points.push({ node, offset: o, label: `${path} text@${o}` })
      return
    }
    for (let o = 0; o <= node.childNodes.length; o++)
      points.push({ node, offset: o, label: `${path} el@${o}` })
    for (let i = 0; i < node.childNodes.length; i++) visit(node.childNodes[i], `${path}/${i}`)
  }
  visit(editor, 'editor')
  return points
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('scanEditorDOM cursorOffset', () => {
  const shapes: Array<[string, () => HTMLDivElement]> = [
    [
      'plain multi-line text',
      () => {
        const e = makeEditor()
        e.append('first line', br(), 'second line', br(), 'third')
        return e
      },
    ],
    [
      'chips between text runs',
      () => {
        const e = makeEditor()
        e.append('hi ', chip('@', 'u1', 'Ada'), ' and ', chip('#', 't1', 'tag'), br(), 'next')
        return e
      },
    ],
    [
      'decoration spans and links',
      () => {
        const e = makeEditor()
        e.append('say ', mdSpan('**bold**'), ' see ', link('https://example.com/x'), br(), 'tail')
        return e
      },
    ],
    [
      'trailing newline with sentinel',
      () => {
        const e = makeEditor()
        e.append('line', br(), br(true))
        return e
      },
    ],
    [
      'leading and consecutive newlines',
      () => {
        const e = makeEditor()
        e.append(br(), br(), 'body', br(), br(true))
        return e
      },
    ],
    [
      'empty editor with filler br',
      () => {
        const e = makeEditor()
        e.append(br())
        return e
      },
    ],
    [
      'malformed chip between text runs',
      () => {
        const e = makeEditor()
        e.append(
          'hi ',
          malformedChip('@', '@broken'),
          ' and ',
          chip('#', 't1', 'tag'),
          br(),
          'next',
        )
        return e
      },
    ],
    [
      'foreign inline element between text runs',
      () => {
        const e = makeEditor()
        e.append('bold ', foreignInline('inside'), ' after', br(), 'tail')
        return e
      },
    ],
    [
      'non-HTML subtree between text runs',
      () => {
        const e = makeEditor()
        e.append('xy', mathml('abc'), 'tail', br(), chip('@', 'u1', 'Ada'))
        return e
      },
    ],
  ]

  for (const [name, build] of shapes) {
    it(`matches getCursorOffset at every boundary point — ${name}`, () => {
      const editor = build()
      const points = allBoundaryPoints(editor)
      expect(points.length).toBeGreaterThan(0)

      for (const { node, offset, label } of points) {
        place(node, offset)
        const fused = scanEditorDOM(editor, { node, offset }).cursorOffset
        const standalone = getCursorOffset(editor)
        expect(`${label} -> ${fused}`).toBe(`${label} -> ${standalone}`)
      }
    })
  }

  it('is null when no selection is handed in', () => {
    const editor = makeEditor()
    editor.append('abc')
    expect(scanEditorDOM(editor).cursorOffset).toBeNull()
    expect(scanEditorDOM(editor, null).cursorOffset).toBeNull()
  })

  it('is null when the boundary point is outside the editor', () => {
    const editor = makeEditor()
    editor.append('abc')
    const outside = document.createElement('div')
    outside.textContent = 'elsewhere'
    document.body.appendChild(outside)
    expect(scanEditorDOM(editor, { node: outside.firstChild!, offset: 2 }).cursorOffset).toBeNull()
  })

  it('leaves segments and plainText untouched by the caret argument', () => {
    const editor = makeEditor()
    editor.append('one', br(), 'two')
    const without = scanEditorDOM(editor)
    const with_ = scanEditorDOM(editor, { node: editor.firstChild!, offset: 1 })
    expect(with_.segments).toEqual(without.segments)
    expect(with_.plainText).toBe(without.plainText)
  })
})

describe('decoration passes report whether they mutated the DOM', () => {
  it('decorateEditor returns false when there is nothing to decorate', () => {
    const editor = makeEditor()
    editor.append('nothing to see here')
    expect(decorateEditor(editor, true, true)).toBe(false)
  })

  it('decorateEditor returns true when it applies a decoration', () => {
    const editor = makeEditor()
    editor.append('say **bold** now')
    expect(decorateEditor(editor, true, true)).toBe(true)
    // Already decorated: a second pass finds nothing left to do.
    expect(decorateEditor(editor, true, true)).toBe(false)
  })

  it('stripDecorationsInRange returns false on an already-flat line', () => {
    const editor = makeEditor()
    editor.append('flat text')
    expect(stripDecorationsInRange(editor, { after: null, before: null })).toBe(false)
  })

  it('stripDecorationsInRange returns true when it unwraps a decoration', () => {
    const editor = makeEditor()
    editor.append('say ', mdSpan('**bold**'))
    expect(stripDecorationsInRange(editor, { after: null, before: null })).toBe(true)
    expect(editor.querySelector('span[data-md]')).toBeNull()
    expect(editor.textContent).toBe('say **bold**')
  })

  it('stripDecorationsInRange returns true when it merges adjacent text nodes', () => {
    const editor = makeEditor()
    editor.append(document.createTextNode('ab'), document.createTextNode('cd'))
    expect(stripDecorationsInRange(editor, { after: null, before: null })).toBe(true)
    expect(editor.childNodes).toHaveLength(1)
    expect(editor.textContent).toBe('abcd')
  })

  it('stripDecorationsInRange leaves nodes outside the bounds alone', () => {
    const editor = makeEditor()
    const outsideSpan = mdSpan('**keep**')
    const boundary = br()
    editor.append(outsideSpan, boundary, 'inside ', mdSpan('**strip**'))
    expect(stripDecorationsInRange(editor, { after: boundary, before: null })).toBe(true)
    expect(outsideSpan.isConnected).toBe(true)
  })
})

describe('caret restore on the typing hot path', () => {
  const trigger: TriggerConfig = {
    char: '@',
    position: 'any',
    mode: 'dropdown',
    onSearch: vi.fn(() => []),
  }

  function setup() {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      usePromptArea({
        value: [] as Segment[],
        onChange,
        triggers: [trigger],
        markdownHeadings: true,
      }),
    )
    const editor = makeEditor()
    ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor
    return { result, editor, onChange }
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not re-place the caret when the decoration cycle changed nothing', () => {
    const { result, editor } = setup()
    editor.append('first', br(), 'edit me', br(), 'third')
    decorateEditor(editor, true, true)
    const line2 = editor.childNodes[2] as Text

    // The browser has already inserted the character and left the caret after it.
    line2.data = 'edit mex'
    place(line2, 'edit mex'.length)

    const addRange = vi.spyOn(Selection.prototype, 'addRange')
    act(() => {
      result.current.handleInput()
    })
    expect(addRange).not.toHaveBeenCalled()

    // The caret the browser left is still exactly where it was.
    const sel = window.getSelection()!
    expect(sel.anchorNode).toBe(line2)
    expect(sel.anchorOffset).toBe('edit mex'.length)
  })

  it('re-places the caret when it sits at an element boundary, even with no mutation', () => {
    const { result, editor } = setup()
    // No decorations anywhere, so strip/decorate both report no change: the
    // only thing forcing the restore is the caret not being in a text node.
    editor.append('first ', chip('#', 't1', 'tag'), ' second')
    place(editor, 2)

    const addRange = vi.spyOn(Selection.prototype, 'addRange')
    act(() => {
      result.current.handleInput()
    })
    expect(addRange).toHaveBeenCalled()
    expect(getCursorOffset(editor)).toBe('first #tag'.length)
  })

  it('re-places the caret when the keystroke completed a decoration', () => {
    const { result, editor } = setup()
    editor.append('first', br(), 'edit me', br(), 'third')
    decorateEditor(editor, true, true)
    const line2 = editor.childNodes[2] as Text

    // Typing the closing marker turns the line into a decorated run, which
    // replaces the text node the caret was anchored in.
    line2.data = 'edit **me**'
    place(line2, 'edit **me**'.length)

    const addRange = vi.spyOn(Selection.prototype, 'addRange')
    act(() => {
      result.current.handleInput()
    })
    expect(addRange).toHaveBeenCalled()
    expect(editor.querySelector('span[data-md]')).not.toBeNull()
    expect(line2.isConnected).toBe(false)
  })

  it('re-places the caret when the strip merged the caret line', () => {
    const { result, editor } = setup()
    editor.append('first', br(), 'edit me', br(), 'third')
    decorateEditor(editor, true, true)

    // A native edit that left two adjacent text nodes on the caret's line:
    // the bounded normalize merges them, invalidating the caret's anchor.
    const line2 = editor.childNodes[2] as Text
    const extra = document.createTextNode('!')
    editor.insertBefore(extra, line2.nextSibling)
    place(extra, 1)

    const addRange = vi.spyOn(Selection.prototype, 'addRange')
    act(() => {
      result.current.handleInput()
    })
    expect(addRange).toHaveBeenCalled()
    expect(extra.isConnected).toBe(false)
  })

  it('keeps the model correct across a keystroke that skips the restore', () => {
    const { result, editor, onChange } = setup()
    editor.append('alpha', br(), 'bravo')
    decorateEditor(editor, true, true)
    const line2 = editor.childNodes[2] as Text
    line2.data = 'bravos'
    place(line2, 'bravos'.length)

    act(() => {
      result.current.handleInput()
    })
    expect(onChange).toHaveBeenCalledWith([
      { type: 'text', text: 'alpha' },
      { type: 'text', text: '\n' },
      { type: 'text', text: 'bravos' },
    ])
  })
})
