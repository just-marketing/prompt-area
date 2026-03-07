import { describe, it, expect } from 'vitest'
import {
  isHTMLElement,
  isChipElement,
  isBRElement,
  isLinkElement,
  isTextNode,
  getSelectionRange,
  safeJsonParse,
  safeJsonStringify,
  getChipTrigger,
  getChipValue,
  getChipDisplay,
  getChipData,
  getChipAutoResolved,
  indexOfChildNode,
  getDirectChildContaining,
  normalizeEditorDOM,
  decorateURLsInEditor,
  decorateMarkdownInEditor,
} from '../dom-helpers'

// ===========================================================================
// Type Guards
// ===========================================================================

describe('isHTMLElement', () => {
  it('returns true for an HTMLElement', () => {
    const el = document.createElement('div')
    expect(isHTMLElement(el)).toBe(true)
  })

  it('returns true for a span', () => {
    const el = document.createElement('span')
    expect(isHTMLElement(el)).toBe(true)
  })

  it('returns false for a text node', () => {
    const text = document.createTextNode('hello')
    expect(isHTMLElement(text)).toBe(false)
  })

  it('returns false for a comment node', () => {
    const comment = document.createComment('comment')
    expect(isHTMLElement(comment)).toBe(false)
  })
})

describe('isChipElement', () => {
  it('returns true for an element with data-chip-trigger', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '@'
    expect(isChipElement(el)).toBe(true)
  })

  it('returns false for a plain element', () => {
    const el = document.createElement('span')
    expect(isChipElement(el)).toBe(false)
  })

  it('returns false for a text node', () => {
    const text = document.createTextNode('hello')
    expect(isChipElement(text)).toBe(false)
  })

  it('returns false for an element with other data attributes', () => {
    const el = document.createElement('span')
    el.dataset.other = 'value'
    expect(isChipElement(el)).toBe(false)
  })
})

describe('isTextNode', () => {
  it('returns true for a text node', () => {
    const text = document.createTextNode('hello')
    expect(isTextNode(text)).toBe(true)
  })

  it('returns false for an element', () => {
    const el = document.createElement('div')
    expect(isTextNode(el)).toBe(false)
  })

  it('returns false for a comment node', () => {
    const comment = document.createComment('comment')
    expect(isTextNode(comment)).toBe(false)
  })
})

describe('isBRElement', () => {
  it('returns true for a BR element', () => {
    const br = document.createElement('br')
    expect(isBRElement(br)).toBe(true)
  })

  it('returns false for a div element', () => {
    const div = document.createElement('div')
    expect(isBRElement(div)).toBe(false)
  })

  it('returns false for a text node', () => {
    const text = document.createTextNode('hello')
    expect(isBRElement(text)).toBe(false)
  })
})

// ===========================================================================
// Selection helpers
// ===========================================================================

describe('getSelectionRange', () => {
  it('returns null when there is no selection', () => {
    const sel = window.getSelection()
    sel?.removeAllRanges()
    expect(getSelectionRange()).toBeNull()
  })

  it('returns the first range when a selection exists', () => {
    const div = document.createElement('div')
    div.textContent = 'hello'
    document.body.appendChild(div)
    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    const result = getSelectionRange()
    expect(result).toBeInstanceOf(Range)
    document.body.removeChild(div)
    sel.removeAllRanges()
  })
})

// ===========================================================================
// Safe JSON
// ===========================================================================

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"key":"value"}')).toEqual({ key: 'value' })
  })

  it('parses JSON arrays', () => {
    expect(safeJsonParse('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('parses JSON primitives', () => {
    expect(safeJsonParse('"hello"')).toBe('hello')
    expect(safeJsonParse('42')).toBe(42)
    expect(safeJsonParse('true')).toBe(true)
    expect(safeJsonParse('null')).toBe(null)
  })

  it('returns undefined for invalid JSON', () => {
    expect(safeJsonParse('{')).toBeUndefined()
    expect(safeJsonParse('not json')).toBeUndefined()
    expect(safeJsonParse('')).toBeUndefined()
  })
})

describe('safeJsonStringify', () => {
  it('stringifies objects', () => {
    expect(safeJsonStringify({ key: 'value' })).toBe('{"key":"value"}')
  })

  it('stringifies primitives', () => {
    expect(safeJsonStringify('hello')).toBe('"hello"')
    expect(safeJsonStringify(42)).toBe('42')
  })

  it('returns undefined for circular references', () => {
    const obj: Record<string, unknown> = {}
    obj.self = obj
    expect(safeJsonStringify(obj)).toBeUndefined()
  })
})

// ===========================================================================
// Chip reading helpers
// ===========================================================================

describe('getChipTrigger', () => {
  it('returns trigger for chip element', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '@'
    expect(getChipTrigger(el)).toBe('@')
  })

  it('returns undefined for non-chip element', () => {
    const el = document.createElement('span')
    expect(getChipTrigger(el)).toBeUndefined()
  })

  it('returns undefined for text node', () => {
    const text = document.createTextNode('hello')
    expect(getChipTrigger(text)).toBeUndefined()
  })
})

describe('getChipValue', () => {
  it('returns value for chip element', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '@'
    el.dataset.chipValue = 'user-123'
    expect(getChipValue(el)).toBe('user-123')
  })

  it('returns undefined for non-chip', () => {
    expect(getChipValue(document.createElement('div'))).toBeUndefined()
  })
})

describe('getChipDisplay', () => {
  it('returns display text from dataset', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '@'
    el.dataset.chipDisplay = 'Alice'
    expect(getChipDisplay(el)).toBe('Alice')
  })

  it('falls back to textContent', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '@'
    el.textContent = '@Alice'
    expect(getChipDisplay(el)).toBe('@Alice')
  })

  it('returns undefined for non-chip', () => {
    expect(getChipDisplay(document.createTextNode('hi'))).toBeUndefined()
  })
})

describe('getChipData', () => {
  it('returns parsed data from dataset', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '@'
    el.dataset.chipData = '{"role":"admin"}'
    expect(getChipData(el)).toEqual({ role: 'admin' })
  })

  it('returns undefined when no data', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '@'
    expect(getChipData(el)).toBeUndefined()
  })

  it('returns undefined for invalid JSON data', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '@'
    el.dataset.chipData = 'not json'
    expect(getChipData(el)).toBeUndefined()
  })

  it('returns undefined for non-chip', () => {
    expect(getChipData(document.createElement('div'))).toBeUndefined()
  })
})

// ===========================================================================
// DOM manipulation helpers
// ===========================================================================

describe('indexOfChildNode', () => {
  it('finds a child at the correct index', () => {
    const parent = document.createElement('div')
    const child0 = document.createTextNode('a')
    const child1 = document.createElement('span')
    const child2 = document.createTextNode('b')
    parent.appendChild(child0)
    parent.appendChild(child1)
    parent.appendChild(child2)

    expect(indexOfChildNode(parent, child0)).toBe(0)
    expect(indexOfChildNode(parent, child1)).toBe(1)
    expect(indexOfChildNode(parent, child2)).toBe(2)
  })

  it('returns -1 for a node not in parent', () => {
    const parent = document.createElement('div')
    const orphan = document.createTextNode('orphan')
    expect(indexOfChildNode(parent, orphan)).toBe(-1)
  })
})

describe('getDirectChildContaining', () => {
  it('returns the direct child containing a deeply nested node', () => {
    const ancestor = document.createElement('div')
    const child = document.createElement('span')
    const grandchild = document.createTextNode('deep')
    child.appendChild(grandchild)
    ancestor.appendChild(child)

    expect(getDirectChildContaining(ancestor, grandchild)).toBe(child)
  })

  it('returns the node itself if it is a direct child', () => {
    const ancestor = document.createElement('div')
    const child = document.createTextNode('direct')
    ancestor.appendChild(child)

    expect(getDirectChildContaining(ancestor, child)).toBe(child)
  })

  it('returns null if node is not inside ancestor', () => {
    const ancestor = document.createElement('div')
    const unrelated = document.createTextNode('other')

    expect(getDirectChildContaining(ancestor, unrelated)).toBeNull()
  })
})

// ===========================================================================
// normalizeEditorDOM
// ===========================================================================

describe('normalizeEditorDOM', () => {
  it('unwraps div wrappers (Chrome-style newlines)', () => {
    const editor = document.createElement('div')
    editor.innerHTML = 'line1<div>line2</div>'

    const changed = normalizeEditorDOM(editor)

    expect(changed).toBe(true)
    // Should have text node "line1", then "line2", then BR
    const texts = Array.from(editor.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent)
    expect(texts.join('')).toContain('line1')
    expect(texts.join('')).toContain('line2')
  })

  it('unwraps p tags', () => {
    const editor = document.createElement('div')
    editor.innerHTML = '<p>paragraph text</p>'

    normalizeEditorDOM(editor)

    // Should have unwrapped the p
    expect(editor.querySelector('p')).toBeNull()
    expect(editor.textContent).toContain('paragraph text')
  })

  it('removes inline formatting elements (font, b, i)', () => {
    const editor = document.createElement('div')
    editor.innerHTML = 'hello <b>bold</b> world'

    normalizeEditorDOM(editor)

    expect(editor.querySelector('b')).toBeNull()
    expect(editor.textContent).toBe('hello bold world')
  })

  it('preserves chip elements', () => {
    const editor = document.createElement('div')
    const chip = document.createElement('span')
    chip.dataset.chipTrigger = '@'
    chip.dataset.chipValue = 'user-1'
    chip.dataset.chipDisplay = 'Alice'
    chip.textContent = '@Alice'
    editor.appendChild(document.createTextNode('hello '))
    editor.appendChild(chip)

    normalizeEditorDOM(editor)

    // Chip should still be there
    const chipEl = editor.querySelector('[data-chip-trigger]')
    expect(chipEl).not.toBeNull()
    expect(chipEl?.textContent).toBe('@Alice')
  })

  it('preserves BR elements', () => {
    const editor = document.createElement('div')
    editor.innerHTML = 'line1<br>line2'

    const changed = normalizeEditorDOM(editor)

    expect(changed).toBe(false) // nothing to normalize
    expect(editor.querySelector('br')).not.toBeNull()
  })

  it('returns false when nothing changes', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('plain text'))

    expect(normalizeEditorDOM(editor)).toBe(false)
  })

  it('handles empty editor', () => {
    const editor = document.createElement('div')
    expect(normalizeEditorDOM(editor)).toBe(false)
  })
})

// ===========================================================================
// getChipAutoResolved
// ===========================================================================

describe('getChipAutoResolved', () => {
  it('returns true when data-chip-auto-resolved is "true"', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '#'
    el.dataset.chipAutoResolved = 'true'
    expect(getChipAutoResolved(el)).toBe(true)
  })

  it('returns false when attribute is not set', () => {
    const el = document.createElement('span')
    el.dataset.chipTrigger = '#'
    expect(getChipAutoResolved(el)).toBe(false)
  })

  it('returns false for non-chip elements', () => {
    const el = document.createElement('span')
    expect(getChipAutoResolved(el)).toBe(false)
  })

  it('returns false for text nodes', () => {
    const text = document.createTextNode('hello')
    expect(getChipAutoResolved(text)).toBe(false)
  })
})

// ===========================================================================
// isLinkElement
// ===========================================================================

describe('isLinkElement', () => {
  it('returns true for an anchor with data-url="true"', () => {
    const el = document.createElement('a')
    el.dataset.url = 'true'
    expect(isLinkElement(el)).toBe(true)
  })

  it('returns false for an anchor without data-url', () => {
    const el = document.createElement('a')
    expect(isLinkElement(el)).toBe(false)
  })

  it('returns false for non-anchor elements', () => {
    const el = document.createElement('span')
    expect(isLinkElement(el)).toBe(false)
  })

  it('returns false for text nodes', () => {
    const text = document.createTextNode('hello')
    expect(isLinkElement(text)).toBe(false)
  })
})

// ===========================================================================
// normalizeEditorDOM strips <a> tags
// ===========================================================================

describe('normalizeEditorDOM with <a> tags', () => {
  it('strips anchor elements and preserves text content', () => {
    const editor = document.createElement('div')
    editor.innerHTML = 'hello <a href="https://example.com">https://example.com</a> world'

    normalizeEditorDOM(editor)

    expect(editor.querySelector('a')).toBeNull()
    expect(editor.textContent).toBe('hello https://example.com world')
  })
})

// ===========================================================================
// decorateURLsInEditor
// ===========================================================================

describe('decorateURLsInEditor', () => {
  it('wraps a URL in an anchor element', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('visit https://example.com today'))

    const decorated = decorateURLsInEditor(editor)

    expect(decorated).toBe(true)
    const anchor = editor.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.href).toBe('https://example.com/')
    expect(anchor?.textContent).toBe('https://example.com')
    expect(anchor?.dataset.url).toBe('true')
    expect(anchor?.className).toBe(
      'text-primary hover:text-primary/80 underline cursor-pointer',
    )
  })

  it('wraps multiple URLs', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('see https://a.com and https://b.com'))

    decorateURLsInEditor(editor)

    const anchors = editor.querySelectorAll('a')
    expect(anchors.length).toBe(2)
  })

  it('returns false when no URLs found', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('no urls here'))

    expect(decorateURLsInEditor(editor)).toBe(false)
  })

  it('preserves chip elements', () => {
    const editor = document.createElement('div')
    const chip = document.createElement('span')
    chip.dataset.chipTrigger = '@'
    chip.textContent = '@Alice'
    editor.appendChild(chip)
    editor.appendChild(document.createTextNode(' https://example.com'))

    decorateURLsInEditor(editor)

    expect(editor.querySelector('[data-chip-trigger]')).not.toBeNull()
    expect(editor.querySelector('a')).not.toBeNull()
  })

  it('trims trailing punctuation from URLs', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('see https://example.com.'))

    decorateURLsInEditor(editor)

    const anchor = editor.querySelector('a')
    expect(anchor?.textContent).toBe('https://example.com')
  })
})

// ===========================================================================
// normalizeEditorDOM strips non-chip SPANs
// ===========================================================================

describe('normalizeEditorDOM with non-chip spans', () => {
  it('strips markdown decoration spans and preserves text', () => {
    const editor = document.createElement('div')
    const span = document.createElement('span')
    span.dataset.md = 'true'
    span.className = 'font-bold'
    span.textContent = '**hello**'
    editor.appendChild(document.createTextNode('say '))
    editor.appendChild(span)
    editor.appendChild(document.createTextNode(' world'))

    const changed = normalizeEditorDOM(editor)

    expect(changed).toBe(true)
    expect(editor.querySelector('span')).toBeNull()
    expect(editor.textContent).toBe('say **hello** world')
  })

  it('strips browser-inserted spans without chip data', () => {
    const editor = document.createElement('div')
    const span = document.createElement('span')
    span.style.fontWeight = 'bold'
    span.textContent = 'styled'
    editor.appendChild(span)

    const changed = normalizeEditorDOM(editor)

    expect(changed).toBe(true)
    expect(editor.querySelector('span')).toBeNull()
    expect(editor.textContent).toBe('styled')
  })

  it('removes empty non-chip spans', () => {
    const editor = document.createElement('div')
    const span = document.createElement('span')
    span.textContent = ''
    editor.appendChild(span)

    normalizeEditorDOM(editor)

    expect(editor.childNodes.length).toBe(0)
  })

  it('preserves chip spans during normalization', () => {
    const editor = document.createElement('div')
    const chip = document.createElement('span')
    chip.dataset.chipTrigger = '@'
    chip.dataset.chipValue = 'user-1'
    chip.textContent = '@Alice'
    const mdSpan = document.createElement('span')
    mdSpan.dataset.md = 'true'
    mdSpan.textContent = '**bold**'
    editor.appendChild(chip)
    editor.appendChild(mdSpan)

    normalizeEditorDOM(editor)

    expect(editor.querySelector('[data-chip-trigger]')).not.toBeNull()
    expect(editor.querySelector('[data-md]')).toBeNull()
    expect(editor.textContent).toBe('@Alice**bold**')
  })
})

// ===========================================================================
// decorateMarkdownInEditor
// ===========================================================================

describe('decorateMarkdownInEditor', () => {
  it('wraps **bold** text in a bold span with hidden markers', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('hello **world** end'))

    const decorated = decorateMarkdownInEditor(editor)

    expect(decorated).toBe(true)
    const span = editor.querySelector('span[data-md]')
    expect(span).not.toBeNull()
    // textContent still includes markers (child text nodes concatenate)
    expect(span?.textContent).toBe('**world**')
    // Inner structure: hidden marker + styled content + hidden marker
    const markers = span?.querySelectorAll('.prompt-area-md-marker')
    expect(markers?.length).toBe(2)
    expect(markers?.[0]?.textContent).toBe('**')
    expect(markers?.[1]?.textContent).toBe('**')
    const styledContent = span?.querySelector('.font-bold')
    expect(styledContent).not.toBeNull()
    expect(styledContent?.textContent).toBe('world')
  })

  it('wraps *italic* text in an italic span with hidden markers', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('hello *world* end'))

    const decorated = decorateMarkdownInEditor(editor)

    expect(decorated).toBe(true)
    const span = editor.querySelector('span[data-md]')
    expect(span).not.toBeNull()
    expect(span?.textContent).toBe('*world*')
    const markers = span?.querySelectorAll('.prompt-area-md-marker')
    expect(markers?.length).toBe(2)
    expect(markers?.[0]?.textContent).toBe('*')
    expect(markers?.[1]?.textContent).toBe('*')
    const styledContent = span?.querySelector('.italic')
    expect(styledContent).not.toBeNull()
    expect(styledContent?.textContent).toBe('world')
  })

  it('wraps ***bold-italic*** text in a bold+italic span with hidden markers', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('hello ***world*** end'))

    const decorated = decorateMarkdownInEditor(editor)

    expect(decorated).toBe(true)
    const span = editor.querySelector('span[data-md]')
    expect(span).not.toBeNull()
    expect(span?.textContent).toBe('***world***')
    const markers = span?.querySelectorAll('.prompt-area-md-marker')
    expect(markers?.length).toBe(2)
    expect(markers?.[0]?.textContent).toBe('***')
    expect(markers?.[1]?.textContent).toBe('***')
    const styledContent = span?.querySelector('.font-bold.italic')
    expect(styledContent).not.toBeNull()
    expect(styledContent?.textContent).toBe('world')
  })

  it('handles multiple markdown spans in one text node', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('**bold** and *italic* text'))

    decorateMarkdownInEditor(editor)

    const spans = editor.querySelectorAll('span[data-md]')
    expect(spans.length).toBe(2)
    expect(spans[0]?.textContent).toBe('**bold**')
    expect(spans[0]?.querySelector('.font-bold')?.textContent).toBe('bold')
    expect(spans[1]?.textContent).toBe('*italic*')
    expect(spans[1]?.querySelector('.italic')?.textContent).toBe('italic')
  })

  it('preserves surrounding plain text', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('before **bold** after'))

    decorateMarkdownInEditor(editor)

    expect(editor.textContent).toBe('before **bold** after')
  })

  it('returns false when no markdown found', () => {
    const editor = document.createElement('div')
    editor.appendChild(document.createTextNode('no markdown here'))

    expect(decorateMarkdownInEditor(editor)).toBe(false)
  })

  it('preserves chip elements', () => {
    const editor = document.createElement('div')
    const chip = document.createElement('span')
    chip.dataset.chipTrigger = '@'
    chip.textContent = '@Alice'
    editor.appendChild(chip)
    editor.appendChild(document.createTextNode(' **bold**'))

    decorateMarkdownInEditor(editor)

    expect(editor.querySelector('[data-chip-trigger]')).not.toBeNull()
    expect(editor.querySelector('[data-md]')).not.toBeNull()
  })

  it('handles empty editor', () => {
    const editor = document.createElement('div')
    expect(decorateMarkdownInEditor(editor)).toBe(false)
  })
})
