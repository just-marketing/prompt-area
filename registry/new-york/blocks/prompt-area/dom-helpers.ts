/**
 * Type-safe DOM helper functions for PromptArea.
 *
 * These replace all `as` type assertions with proper type guards,
 * following the codebase rule: "Never use `any` or `as` assertions."
 */

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

/**
 * Type guard: checks if a DOM node is an HTMLElement.
 */
export function isHTMLElement(node: Node): node is HTMLElement {
  return node instanceof HTMLElement
}

/**
 * Type guard: checks if a DOM node is a chip element
 * (an HTMLElement with data-chip-trigger attribute).
 */
export function isChipElement(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && node.dataset.chipTrigger !== undefined
}

/**
 * Type guard: checks if a DOM node is a BR element.
 */
export function isBRElement(node: Node): node is HTMLBRElement {
  return node instanceof HTMLBRElement
}

/**
 * Type guard: checks if a DOM node is a Text node.
 */
export function isTextNode(node: Node): node is Text {
  return node instanceof Text
}

/**
 * Checks whether a chip element was auto-resolved (created by pressing space
 * on resolveOnSpace triggers, rather than explicit dropdown selection).
 */
export function getChipAutoResolved(node: Node): boolean {
  return isChipElement(node) && node.dataset.chipAutoResolved === 'true'
}

/**
 * Type guard: checks if a DOM node is a URL link element
 * (an HTMLAnchorElement with data-url attribute).
 */
export function isLinkElement(node: Node): node is HTMLAnchorElement {
  return node instanceof HTMLAnchorElement && node.dataset.url === 'true'
}

// ---------------------------------------------------------------------------
// Safe JSON
// ---------------------------------------------------------------------------

/**
 * Safely parses a JSON string, returning `unknown` instead of `any`.
 * Returns `undefined` if parsing fails.
 */
export function safeJsonParse(json: string): unknown {
  try {
    // JSON.parse returns `any` by default. We narrow it to `unknown`
    // which is the safest pattern — callers must validate before use.
    const parsed: unknown = JSON.parse(json)
    return parsed
  } catch {
    return undefined
  }
}

/**
 * Safely serializes a value to JSON, returning undefined on failure.
 */
export function safeJsonStringify(value: unknown): string | undefined {
  try {
    return JSON.stringify(value)
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// DOM reading helpers
// ---------------------------------------------------------------------------

/**
 * Reads the chip trigger character from a chip element's dataset.
 * Returns undefined if the node is not a chip element.
 */
export function getChipTrigger(node: Node): string | undefined {
  if (!isChipElement(node)) return undefined
  return node.dataset.chipTrigger
}

/**
 * Reads the chip value from a chip element's dataset.
 */
export function getChipValue(node: Node): string | undefined {
  if (!isChipElement(node)) return undefined
  return node.dataset.chipValue
}

/**
 * Reads the chip display text from a chip element's dataset.
 */
export function getChipDisplay(node: Node): string | undefined {
  if (!isChipElement(node)) return undefined
  return node.dataset.chipDisplay ?? node.textContent ?? undefined
}

/**
 * Reads and safely parses the chip data from a chip element's dataset.
 */
export function getChipData(node: Node): unknown {
  if (!isChipElement(node)) return undefined
  const raw = node.dataset.chipData
  if (!raw) return undefined
  return safeJsonParse(raw)
}

// ---------------------------------------------------------------------------
// DOM manipulation helpers
// ---------------------------------------------------------------------------

/**
 * Finds the index of a direct child node within a parent element.
 * Returns -1 if not found.
 */
export function indexOfChildNode(parent: HTMLElement, child: Node): number {
  const children = parent.childNodes
  for (let i = 0; i < children.length; i++) {
    if (children[i] === child) return i
  }
  return -1
}

/**
 * Gets the direct child of `ancestor` that contains `descendant`.
 * Walks up from descendant until we find a node whose parent is ancestor.
 * Returns null if descendant is not inside ancestor.
 */
export function getDirectChildContaining(ancestor: HTMLElement, descendant: Node): Node | null {
  let node: Node | null = descendant
  while (node !== null) {
    if (node.parentNode === ancestor) return node
    node = node.parentNode
  }
  return null
}

/**
 * Unwraps a block element (div, p) by replacing it with its child nodes
 * plus a trailing BR. Used for browser DOM normalization.
 */
export function unwrapBlockElement(parent: HTMLElement, block: HTMLElement): void {
  const fragment = document.createDocumentFragment()

  // Move all children to fragment
  while (block.firstChild) {
    fragment.appendChild(block.firstChild)
  }

  // Add a BR after the unwrapped content
  fragment.appendChild(document.createElement('br'))

  parent.replaceChild(fragment, block)
}

/**
 * Normalizes the editor DOM after browser mutations.
 *
 * Browsers insert various wrapper elements on Enter/paste:
 * - Chrome wraps new lines in <div>
 * - Safari may use <div><br></div>
 * - Some use <p> tags
 *
 * This function unwraps all non-chip block elements, leaving only:
 * - Text nodes
 * - <br> elements
 * - Chip <span> elements (with data-chip-trigger)
 */
export function normalizeEditorDOM(editor: HTMLElement): boolean {
  let changed = false
  const blockTags = new Set(['DIV', 'P', 'SECTION', 'ARTICLE', 'BLOCKQUOTE'])

  // Iterate backwards since we're modifying the DOM
  for (let i = editor.childNodes.length - 1; i >= 0; i--) {
    const child = editor.childNodes[i]

    // Skip non-element nodes, chip elements, and BR elements
    if (!(child instanceof HTMLElement)) continue
    if (child.dataset.chipTrigger !== undefined) continue
    if (child instanceof HTMLBRElement) continue

    const tag = child.tagName
    if (blockTags.has(tag)) {
      unwrapBlockElement(editor, child)
      changed = true
    } else if (
      tag === 'FONT' ||
      tag === 'B' ||
      tag === 'I' ||
      tag === 'U' ||
      tag === 'STRONG' ||
      tag === 'EM' ||
      tag === 'A' ||
      tag === 'SPAN'
    ) {
      // Unwrap inline formatting/decoration elements (browser-inserted or markdown decorations)
      const text = child.textContent ?? ''
      if (text) {
        editor.replaceChild(document.createTextNode(text), child)
      } else {
        editor.removeChild(child)
      }
      changed = true
    }
  }

  // Merge adjacent text nodes
  editor.normalize()

  return changed
}

// ---------------------------------------------------------------------------
// URL decoration
// ---------------------------------------------------------------------------

/** URL pattern for detecting URLs in text content */
const URL_PATTERN = /https?:\/\/[^\s),]+/g

/**
 * Walks direct-child text nodes in the editor and wraps URL text in
 * `<a>` elements for visual styling and clickability.
 *
 * This is a DOM-only decoration — it does NOT modify the segment model.
 * The `<a>` elements are stripped by `normalizeEditorDOM` on every input cycle,
 * so they are re-applied fresh each time.
 *
 * @param editor - The contentEditable root element
 * @returns Whether any decorations were applied
 */
export function decorateURLsInEditor(editor: HTMLElement): boolean {
  let decorated = false

  // Collect text nodes first (avoid modifying while iterating)
  const textNodes: Text[] = []
  for (let i = 0; i < editor.childNodes.length; i++) {
    const node = editor.childNodes[i]
    if (isTextNode(node) && node.textContent) {
      textNodes.push(node)
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    URL_PATTERN.lastIndex = 0
    const matches: Array<{ url: string; index: number }> = []
    let match: RegExpExecArray | null

    while ((match = URL_PATTERN.exec(text)) !== null) {
      // Trim trailing punctuation that's likely not part of the URL
      let url = match[0]
      while (url.length > 0 && /[.;:!?]$/.test(url)) {
        url = url.slice(0, -1)
      }
      if (url.length > 0) {
        matches.push({ url, index: match.index })
      }
    }

    if (matches.length === 0) continue

    decorated = true
    const parent = textNode.parentNode
    if (!parent) continue

    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    for (const { url, index } of matches) {
      // Text before this URL
      if (index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)))
      }

      // Create the link element
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.dataset.url = 'true'
      anchor.className = 'text-primary hover:text-primary/80 underline cursor-pointer'
      anchor.textContent = url
      fragment.appendChild(anchor)

      lastIndex = index + url.length
    }

    // Text after the last URL
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    parent.replaceChild(fragment, textNode)
  }

  return decorated
}

// ---------------------------------------------------------------------------
// Markdown inline decoration
// ---------------------------------------------------------------------------

/** Pattern to find ***bold-italic***, **bold**, and *italic* markdown spans */
const MARKDOWN_INLINE_PATTERN = /(\*{3})(.+?)\*{3}|(\*{2})(.+?)\*{2}|(\*)(.+?)\*/g

/**
 * Walks direct-child text nodes in the editor and wraps markdown-formatted
 * text (`**bold**`, `*italic*`, `***bold-italic***`) in styled `<span>` elements.
 *
 * This is a DOM-only decoration — it does NOT modify the segment model.
 * The `<span>` elements are stripped by `normalizeEditorDOM` on every input cycle,
 * so they are re-applied fresh each time.
 *
 * The `*` markers stay visible in the text; only the CSS styling changes.
 *
 * @param editor - The contentEditable root element
 * @returns Whether any decorations were applied
 */
export function decorateMarkdownInEditor(editor: HTMLElement): boolean {
  let decorated = false

  // Collect text nodes first (avoid modifying while iterating)
  const textNodes: Text[] = []
  for (let i = 0; i < editor.childNodes.length; i++) {
    const node = editor.childNodes[i]
    if (isTextNode(node) && node.textContent) {
      textNodes.push(node)
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    MARKDOWN_INLINE_PATTERN.lastIndex = 0
    const matches: Array<{
      fullMatch: string
      marker: string
      content: string
      index: number
      className: string
    }> = []
    let match: RegExpExecArray | null

    while ((match = MARKDOWN_INLINE_PATTERN.exec(text)) !== null) {
      if (match[1] && match[2]) {
        // ***bold-italic***
        matches.push({
          fullMatch: match[0],
          marker: match[1],
          content: match[2],
          index: match.index,
          className: 'font-bold italic',
        })
      } else if (match[3] && match[4]) {
        // **bold**
        matches.push({
          fullMatch: match[0],
          marker: match[3],
          content: match[4],
          index: match.index,
          className: 'font-bold',
        })
      } else if (match[5] && match[6]) {
        // *italic*
        matches.push({
          fullMatch: match[0],
          marker: match[5],
          content: match[6],
          index: match.index,
          className: 'italic',
        })
      }
    }

    if (matches.length === 0) continue

    decorated = true
    const parent = textNode.parentNode
    if (!parent) continue

    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    for (const { fullMatch, marker, content, index, className } of matches) {
      // Text before this match
      if (index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)))
      }

      // Parent span — textContent still returns full match (e.g. "**world**")
      const span = document.createElement('span')
      span.dataset.md = 'true'

      // Opening marker (visually hidden)
      const openMarker = document.createElement('span')
      openMarker.className = 'prompt-area-md-marker'
      openMarker.textContent = marker

      // Styled content
      const styledContent = document.createElement('span')
      styledContent.className = className
      styledContent.textContent = content

      // Closing marker (visually hidden)
      const closeMarker = document.createElement('span')
      closeMarker.className = 'prompt-area-md-marker'
      closeMarker.textContent = marker

      span.appendChild(openMarker)
      span.appendChild(styledContent)
      span.appendChild(closeMarker)
      fragment.appendChild(span)

      lastIndex = index + fullMatch.length
    }

    // Text after the last match
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    parent.replaceChild(fragment, textNode)
  }

  return decorated
}

// ---------------------------------------------------------------------------
// Bullet decoration
// ---------------------------------------------------------------------------

/**
 * Walks **all** text nodes in the editor (including nested ones) and wraps
 * bullet characters (`•`) in styled `<span>` elements for better visibility.
 *
 * This is a DOM-only decoration — it does NOT modify the segment model.
 * The `<span>` elements are stripped by `normalizeEditorDOM` on every input
 * cycle, so they are re-applied fresh each time.
 *
 * Should be called **after** other decorators so it can find `•` inside
 * already-wrapped nodes.
 *
 * @param editor - The contentEditable root element
 * @returns Whether any decorations were applied
 */
export function decorateBulletsInEditor(editor: HTMLElement): boolean {
  let decorated = false

  // Collect all text nodes in the tree (not just direct children)
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (node.textContent && node.textContent.includes('•')) {
      textNodes.push(node)
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    const parent = textNode.parentNode
    if (!parent) continue

    // Skip if already inside a bullet span
    if (parent instanceof HTMLElement && parent.classList.contains('prompt-area-bullet')) {
      continue
    }

    const fragment = document.createDocumentFragment()
    let lastIndex = 0
    let found = false

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '•') {
        found = true
        if (i > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, i)))
        }
        const span = document.createElement('span')
        span.className = 'prompt-area-bullet'
        span.textContent = '•'
        fragment.appendChild(span)
        lastIndex = i + 1
      }
    }

    if (!found) continue

    decorated = true

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    parent.replaceChild(fragment, textNode)
  }

  return decorated
}

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

/**
 * Returns the first Range from the current window selection, or null if
 * there is no selection or it has no ranges.
 */
export function getSelectionRange(): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  return sel.getRangeAt(0)
}
