import { describe, it, expect, beforeEach } from 'vitest'
import { scanEditorDOM } from '../use-prompt-area'
import {
  normalizeEditorDOM,
  isChipElement,
  isBRElement,
  isHTMLElement,
  chipNodeToSegment,
} from '../dom-helpers'
import { segmentsToPlainText } from '../prompt-area-engine'
import type { Segment } from '../types'

// ---------------------------------------------------------------------------
// scanEditorDOM must produce exactly what the legacy typing path produced:
// normalizeEditorDOM(editor) followed by readSegmentsFromDOM(). The oracle
// below is a verbatim copy of readSegmentsFromDOM's logic (the real one is a
// hook-internal closure), run against a normalized clone so the scan's
// non-mutating read can be compared on the same input DOM.
// ---------------------------------------------------------------------------

function oracleReadSegments(editor: HTMLElement): Segment[] {
  const segments: Segment[] = []
  let hasRealContent = false
  let hasSentinel = false

  for (let i = 0; i < editor.childNodes.length; i++) {
    const node = editor.childNodes[i]

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) {
        segments.push({ type: 'text', text })
        hasRealContent = true
      }
    } else if (isChipElement(node)) {
      const chip = chipNodeToSegment(node)
      if (chip) {
        segments.push(chip)
        hasRealContent = true
      }
    } else if (isBRElement(node)) {
      if (node.dataset.sentinel) {
        hasSentinel = true
        continue
      }
      segments.push({ type: 'text', text: '\n' })
    } else if (isHTMLElement(node)) {
      const text = node.textContent ?? ''
      if (text) {
        segments.push({ type: 'text', text })
        hasRealContent = true
      }
    }
  }

  if (!hasRealContent && !hasSentinel) return []
  return segments
}

function oracle(editor: HTMLElement): Segment[] {
  const clone = editor.cloneNode(true) as HTMLElement
  document.body.appendChild(clone)
  normalizeEditorDOM(clone)
  const segments = oracleReadSegments(clone)
  clone.remove()
  return segments
}

function makeEditor(): HTMLDivElement {
  const editor = document.createElement('div')
  editor.setAttribute('contenteditable', 'true')
  document.body.appendChild(editor)
  return editor
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

function urlAnchor(url: string): HTMLAnchorElement {
  const el = document.createElement('a')
  el.dataset.url = 'true'
  el.href = url
  el.textContent = url
  return el
}

function headingSpan(level: number, text: string): HTMLSpanElement {
  const wrapper = document.createElement('span')
  wrapper.dataset.md = 'true'
  wrapper.dataset.mdHeading = String(level)
  const marker = document.createElement('span')
  marker.textContent = `${'#'.repeat(level)} `
  const body = document.createElement('span')
  body.textContent = text
  wrapper.appendChild(marker)
  wrapper.appendChild(body)
  return wrapper
}

function br(sentinel = false): HTMLBRElement {
  const el = document.createElement('br')
  if (sentinel) el.dataset.sentinel = 'true'
  return el
}

function expectScanMatchesOracle(editor: HTMLElement): void {
  const scan = scanEditorDOM(editor)
  const expected = oracle(editor)
  expect(scan.segments).toEqual(expected)
  expect(scan.plainText).toBe(segmentsToPlainText(expected))
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('scanEditorDOM equivalence with normalizeEditorDOM + readSegmentsFromDOM', () => {
  it('reads plain multi-line content', () => {
    const editor = makeEditor()
    editor.append('first line', br(), 'second line', br(), br(), 'fourth')
    expectScanMatchesOracle(editor)
  })

  it('merges decoration elements into the surrounding text run', () => {
    const editor = makeEditor()
    editor.append('see ', urlAnchor('https://example.com/a'), ' and ', mdSpan('**bold**'), ' end')
    expectScanMatchesOracle(editor)
    expect(scanEditorDOM(editor).segments).toEqual([
      { type: 'text', text: 'see https://example.com/a and **bold** end' },
    ])
  })

  it('reads bullet, indent, and heading decorations back as one line run', () => {
    const editor = makeEditor()
    editor.append(mdSpan('  '), mdSpan('•'), ' item', br(), headingSpan(2, 'Title'), br(), 'tail')
    expectScanMatchesOracle(editor)
  })

  it('keeps chips as separate segments and breaks text runs around them', () => {
    const editor = makeEditor()
    editor.append('hi ', chip('@', 'u1', 'alice'), chip('@', 'u2', 'bob'), ' bye', br())
    editor.append(chip('#', 't', 'tag'))
    expectScanMatchesOracle(editor)
  })

  it('skips malformed chips but still breaks the text run at them', () => {
    const editor = makeEditor()
    const broken = document.createElement('span')
    broken.dataset.chipTrigger = '@'
    // no chipValue/chipDisplay — chipNodeToSegment returns null
    broken.textContent = '@broken'
    editor.append('before', broken, 'after')
    expectScanMatchesOracle(editor)
    expect(scanEditorDOM(editor).segments).toEqual([
      { type: 'text', text: 'before' },
      { type: 'text', text: 'after' },
    ])
  })

  it('merges text through an empty decoration element', () => {
    const editor = makeEditor()
    editor.append('ab', mdSpan(''), 'cd')
    expectScanMatchesOracle(editor)
    expect(scanEditorDOM(editor).segments).toEqual([{ type: 'text', text: 'abcd' }])
  })

  it('handles the sentinel <br> and trailing newlines', () => {
    const editor = makeEditor()
    editor.append('line', br(), br(true))
    expectScanMatchesOracle(editor)
  })

  it('reads a filler-<br>-only editor as empty', () => {
    const editor = makeEditor()
    editor.append(br())
    expectScanMatchesOracle(editor)
    expect(scanEditorDOM(editor).segments).toEqual([])
    expect(scanEditorDOM(editor).plainText).toBe('')
  })

  it('reads an empty editor as empty', () => {
    const editor = makeEditor()
    expectScanMatchesOracle(editor)
  })
})

describe('scanEditorDOM fallback flags', () => {
  it.each(['div', 'p', 'b', 'i', 'font', 'strong', 'em', 'u'])(
    'flags a <%s> child as foreign',
    (tag) => {
      const editor = makeEditor()
      const el = document.createElement(tag)
      el.textContent = 'x'
      editor.append('a', el, 'b')
      expect(scanEditorDOM(editor).sawForeignElement).toBe(true)
    },
  )

  it('flags a plain <span> without data-md as foreign', () => {
    const editor = makeEditor()
    const span = document.createElement('span')
    span.textContent = 'styled'
    editor.append(span)
    expect(scanEditorDOM(editor).sawForeignElement).toBe(true)
  })

  it('flags an <a> without data-url as foreign', () => {
    const editor = makeEditor()
    const a = document.createElement('a')
    a.href = 'https://example.com'
    a.textContent = 'link'
    editor.append(a)
    expect(scanEditorDOM(editor).sawForeignElement).toBe(true)
  })

  it('does not flag chips, brs, decorations, or text', () => {
    const editor = makeEditor()
    editor.append(
      'a',
      mdSpan('*i*'),
      urlAnchor('https://x.co'),
      chip('@', 'v', 'd'),
      br(),
      br(true),
    )
    const scan = scanEditorDOM(editor)
    expect(scan.sawForeignElement).toBe(false)
    expect(scan.sawNewlineInText).toBe(false)
  })

  it('flags literal newlines inside text nodes and still reads them like the oracle', () => {
    const editor = makeEditor()
    editor.append('one\ntwo', br(), 'three')
    const scan = scanEditorDOM(editor)
    expect(scan.sawNewlineInText).toBe(true)
    expectScanMatchesOracle(editor)
  })

  it('flags literal newlines inside decoration elements', () => {
    const editor = makeEditor()
    editor.append(mdSpan('a\nb'))
    expect(scanEditorDOM(editor).sawNewlineInText).toBe(true)
  })
})
