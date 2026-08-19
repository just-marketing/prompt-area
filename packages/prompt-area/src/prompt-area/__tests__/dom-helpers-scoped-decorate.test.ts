import { describe, it, expect, beforeEach } from 'vitest'
import {
  decorateEditor,
  decorateBulletsInEditor,
  decorateURLsInEditor,
  stripDecorationsInRange,
  type DecorateBounds,
} from '../dom-helpers'

// ---------------------------------------------------------------------------
// Bounded decoration must equal the full pass restricted to the line, and
// must not touch a single node outside the bounds. stripDecorationsInRange
// must mirror normalizeEditorDOM's strip + editor.normalize() within bounds.
// ---------------------------------------------------------------------------

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

/** Serializes the nodes strictly inside bounds for comparisons. */
function rangeHTML(editor: HTMLElement, bounds: DecorateBounds): string {
  const container = document.createElement('div')
  let node = bounds.after ? bounds.after.nextSibling : editor.firstChild
  while (node && node !== bounds.before) {
    container.appendChild(node.cloneNode(true))
    node = node.nextSibling
  }
  return container.innerHTML
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('bounded decoration passes', () => {
  it('decorates only the line inside the bounds, leaving other lines untouched by identity', () => {
    const editor = makeEditor()
    const line1 = document.createTextNode('**first** https://one.example')
    const br1 = document.createElement('br')
    const line2 = document.createTextNode('  • **mid** and https://two.example ok')
    const br2 = document.createElement('br')
    const line3 = document.createTextNode('# head **third**')
    editor.append(line1, br1, line2, br2, line3)

    const bounds: DecorateBounds = { after: br1, before: br2 }
    decorateEditor(editor, true, true, bounds)

    // Out-of-range lines: same node objects, still raw text.
    expect(editor.childNodes[0]).toBe(line1)
    expect(editor.lastChild).toBe(line3)
    expect(line1.textContent).toBe('**first** https://one.example')
    expect(line3.textContent).toBe('# head **third**')

    // In-range line matches what a full pass produces for the same line.
    const reference = makeEditor()
    const refBr1 = document.createElement('br')
    const refBr2 = document.createElement('br')
    reference.append(
      document.createTextNode('**first** https://one.example'),
      refBr1,
      document.createTextNode('  • **mid** and https://two.example ok'),
      refBr2,
      document.createTextNode('# head **third**'),
    )
    decorateEditor(reference, true, true)
    expect(rangeHTML(editor, bounds)).toBe(rangeHTML(reference, { after: refBr1, before: refBr2 }))
  })

  it('handles null bounds edges for the first and last lines', () => {
    const editor = makeEditor()
    const line1 = document.createTextNode('• first https://a.example')
    const br1 = document.createElement('br')
    const line2 = document.createTextNode('untouched **mid**')
    const br2 = document.createElement('br')
    const line3 = document.createTextNode('• last')
    editor.append(line1, br1, line2, br2, line3)

    decorateEditor(editor, true, false, { after: null, before: br1 })
    decorateEditor(editor, true, false, { after: br2, before: null })

    expect(editor.querySelectorAll('.prompt-area-list-bullet').length).toBe(2)
    // Middle line untouched by identity and content (line 1's decoration
    // split it into several children, so locate line 2 relative to its <br>).
    expect(br1.nextSibling).toBe(line2)
    expect(line2.textContent).toBe('untouched **mid**')
  })

  it('bounded single passes decorate within range only', () => {
    const editor = makeEditor()
    const line1 = document.createTextNode('• one')
    const br1 = document.createElement('br')
    const line2 = document.createTextNode('• two https://x.example')
    editor.append(line1, br1, line2)

    decorateBulletsInEditor(editor, { after: br1, before: null })
    decorateURLsInEditor(editor, { after: br1, before: null })

    expect(editor.childNodes[0]).toBe(line1)
    expect(line1.textContent).toBe('• one')
    expect(editor.querySelectorAll('.prompt-area-list-bullet').length).toBe(1)
    expect(editor.querySelectorAll('a[data-url]').length).toBe(1)
  })

  it('applies inline emphasis inside headings created by a bounded pass', () => {
    const editor = makeEditor()
    const br1 = document.createElement('br')
    editor.append(document.createTextNode('plain'), br1, document.createTextNode('## Risky *bit*'))

    decorateEditor(editor, true, true, { after: br1, before: null })

    const heading = editor.querySelector('.prompt-area-md-heading-text')
    expect(heading).not.toBeNull()
    expect(heading?.querySelector('span.italic')).not.toBeNull()
  })
})

describe('stripDecorationsInRange', () => {
  it('unwraps decorations and merges adjacent text within bounds only', () => {
    const editor = makeEditor()
    const line1Span = mdSpan('**keep**')
    const br1 = document.createElement('br')
    const a = document.createTextNode('a')
    const bold = mdSpan('**b**')
    const url = urlAnchor('https://x.example')
    const empty = mdSpan('')
    const c = document.createTextNode('c')
    const br2 = document.createElement('br')
    const line3Anchor = urlAnchor('https://keep.example')
    editor.append(line1Span, br1, a, bold, url, empty, c, br2, line3Anchor)

    stripDecorationsInRange(editor, { after: br1, before: br2 })

    // Out-of-range decorations untouched, by identity.
    expect(editor.firstChild).toBe(line1Span)
    expect(editor.lastChild).toBe(line3Anchor)

    // In-range: one merged text node, no elements left.
    const inRange: Node[] = []
    let node = br1.nextSibling
    while (node && node !== br2) {
      inRange.push(node)
      node = node.nextSibling
    }
    expect(inRange).toHaveLength(1)
    expect(inRange[0].nodeType).toBe(Node.TEXT_NODE)
    expect(inRange[0].textContent).toBe('a**b**https://x.examplec')
  })

  it('keeps chips intact and merges around them separately', () => {
    const editor = makeEditor()
    const theChip = chip('@', 'u', 'ada')
    editor.append(document.createTextNode('x'), mdSpan('*i*'), theChip, mdSpan('*j*'))

    stripDecorationsInRange(editor, { after: null, before: null })

    expect(editor.childNodes).toHaveLength(3)
    expect(editor.childNodes[0].textContent).toBe('x*i*')
    expect(editor.childNodes[1]).toBe(theChip)
    expect(editor.childNodes[2].textContent).toBe('*j*')
  })

  it('drops empty text nodes within bounds', () => {
    const editor = makeEditor()
    editor.append(document.createTextNode(''), document.createTextNode('a'), mdSpan(''))
    stripDecorationsInRange(editor, { after: null, before: null })
    expect(editor.childNodes).toHaveLength(1)
    expect(editor.firstChild?.textContent).toBe('a')
  })
})
