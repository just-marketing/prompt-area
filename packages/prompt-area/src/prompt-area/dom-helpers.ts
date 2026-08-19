/**
 * Type-safe DOM helper functions for PromptArea.
 *
 * These replace all `as` type assertions with proper type guards,
 * following the codebase rule: "Never use `any` or `as` assertions."
 */

import type { ChipSegment } from './types'

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

/**
 * Length of a chip's plain-text representation (`trigger + displayText`).
 *
 * This is the single definition used wherever DOM offsets are mapped to the
 * plain-text model (cursor mapping, selection sizing). The fallbacks mirror
 * how chips are rendered: `chipDisplay` is always set, but we degrade to
 * `textContent` for resilience against externally-mutated nodes.
 */
export function chipNodeTextLength(node: HTMLElement): number {
  const trigger = node.dataset.chipTrigger ?? ''
  const display = node.dataset.chipDisplay ?? node.textContent ?? ''
  return trigger.length + display.length
}

/**
 * Reads a chip element into a `ChipSegment`, mirroring how chips are written
 * in `renderSegmentsToDOM`. Returns null when the node is not a chip or is
 * missing a required attribute (trigger, value, or display text).
 *
 * This is the single chip reader shared by the DOM->model sync, chip-click
 * delegation, and clipboard serialization, so they cannot diverge on which
 * fields are required or how optional `data` / `autoResolved` are attached.
 */
export function chipNodeToSegment(node: Node): ChipSegment | null {
  if (!isChipElement(node)) return null

  const trigger = getChipTrigger(node)
  const value = getChipValue(node)
  const displayText = getChipDisplay(node)
  if (!trigger || value === undefined || !displayText) return null

  const data = getChipData(node)
  const autoResolved = getChipAutoResolved(node)

  return {
    type: 'chip',
    trigger,
    value,
    displayText,
    ...(data !== undefined ? { data } : {}),
    ...(autoResolved ? { autoResolved: true } : {}),
  }
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
 * Whether a direct editor child node produces a segment when read by
 * `readSegmentsFromDOM` in use-prompt-area.ts. This is the single predicate
 * shared with `domChildIndexToSegmentIndex` below, so a DOM child index can
 * never map to a different segment index than the one the reader actually
 * produces — decoration elements (the URL `<a>` from `decorateURLsInEditor`,
 * the markdown `<span data-md>` from `decorateMarkdownInEditor`) fall through
 * to the reader's "unknown element" branch and DO produce a text segment, so
 * they must count here too, not just chips/text/`<br>`. A chip element only
 * counts if `chipNodeToSegment` would actually accept it — the reader skips a
 * chip missing a required attribute (trigger/value/display), so this must too.
 */
export function childProducesSegment(child: Node): boolean {
  if (child.nodeType === Node.TEXT_NODE) return (child.textContent ?? '') !== ''
  if (isBRElement(child)) return !child.dataset.sentinel
  if (isChipElement(child)) return chipNodeToSegment(child) !== null
  if (isHTMLElement(child)) return (child.textContent ?? '') !== ''
  return false
}

/**
 * Maps the index of a direct child node within the editor to the index of the
 * corresponding segment in the model array, by counting `childProducesSegment`
 * matches up to (but not including) `childIndex`.
 *
 * Keeping this in one place ensures chip-removal, chip-revert, and chip
 * in-place replacement all agree on the exact same mapping rules as the reader.
 */
export function domChildIndexToSegmentIndex(editor: HTMLElement, childIndex: number): number {
  let segIdx = 0
  for (let i = 0; i < childIndex; i++) {
    if (childProducesSegment(editor.childNodes[i])) segIdx++
  }
  return segIdx
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
// Decoration bounds (line scoping)
// ---------------------------------------------------------------------------

/**
 * Exclusive boundaries limiting decoration work to one `<br>`-delimited line.
 * `after`/`before` are the `<br>` nodes on either side (null = document edge).
 * `<br>` is the one node kind no decoration pass ever replaces, so the
 * boundary nodes stay valid across every pass of a decorate cycle.
 */
export type DecorateBounds = {
  after: Node | null
  before: Node | null
}

/** Iterates the direct children strictly inside `bounds` (all children when undefined). */
function forEachChildInBounds(
  root: HTMLElement,
  bounds: DecorateBounds | undefined,
  callback: (node: Node) => void,
): void {
  let node = bounds?.after ? bounds.after.nextSibling : root.firstChild
  const stop = bounds?.before ?? null
  while (node && node !== stop) {
    callback(node)
    node = node.nextSibling
  }
}

/**
 * Scoped stand-in for {@link normalizeEditorDOM}'s decoration strip and
 * `editor.normalize()`: unwraps decoration elements (markdown `<span data-md>`,
 * URL `<a data-url>`) strictly inside the bounds back to plain text, drops the
 * empty ones, and merges the resulting adjacent text nodes — leaving every
 * node outside the bounds untouched. Only safe when the surrounding DOM holds
 * no foreign elements (the caller establishes that via scanEditorDOM).
 */
export function stripDecorationsInRange(editor: HTMLElement, bounds: DecorateBounds): void {
  const stop = bounds.before

  let node: Node | null = bounds.after ? bounds.after.nextSibling : editor.firstChild
  while (node && node !== stop) {
    const next: Node | null = node.nextSibling
    // Chips carry data-chip-trigger and are never decorations — leave them.
    if (isHTMLElement(node) && node.dataset.chipTrigger === undefined) {
      if ((node.tagName === 'SPAN' && node.dataset.md !== undefined) || isLinkElement(node)) {
        const text = node.textContent ?? ''
        if (text) {
          editor.replaceChild(document.createTextNode(text), node)
        } else {
          editor.removeChild(node)
        }
      }
    }
    node = next
  }

  // Bounded equivalent of editor.normalize(): drop empty text nodes, merge
  // adjacent ones.
  node = bounds.after ? bounds.after.nextSibling : editor.firstChild
  while (node && node !== stop) {
    if (isTextNode(node)) {
      if ((node.textContent ?? '') === '') {
        const next: Node | null = node.nextSibling
        editor.removeChild(node)
        node = next
        continue
      }
      let sibling: Node | null = node.nextSibling
      while (sibling && sibling !== stop && isTextNode(sibling)) {
        node.textContent = (node.textContent ?? '') + (sibling.textContent ?? '')
        const nextSibling: Node | null = sibling.nextSibling
        editor.removeChild(sibling)
        sibling = nextSibling
      }
    }
    node = node.nextSibling
  }
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
export function decorateURLsInEditor(editor: HTMLElement, bounds?: DecorateBounds): boolean {
  let decorated = false

  // Collect text nodes first (avoid modifying while iterating). The includes
  // check is a cheap pre-gate: URL_PATTERN can only match text containing
  // "http", so everything else skips the regex entirely.
  const textNodes: Text[] = []
  forEachChildInBounds(editor, bounds, (node) => {
    if (isTextNode(node) && node.textContent && node.textContent.includes('http')) {
      textNodes.push(node)
    }
  })

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

    const parent = textNode.parentNode
    if (!parent) continue

    // Validate URLs upfront – only keep those with safe protocols (CWE-79)
    const safeMatches: Array<{ url: string; href: string; index: number }> = []
    for (const { url, index } of matches) {
      try {
        const parsed = new URL(url)
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          safeMatches.push({ url, href: parsed.href, index })
        }
      } catch {
        // skip malformed URLs
      }
    }

    if (safeMatches.length === 0) continue

    decorated = true
    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    for (const { url, href, index } of safeMatches) {
      // Text before this URL
      if (index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)))
      }

      // Create the link element
      const anchor = document.createElement('a')
      anchor.href = href
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
export function decorateMarkdownInEditor(editor: HTMLElement, bounds?: DecorateBounds): boolean {
  let decorated = false

  // Collect text nodes first (avoid modifying while iterating). Emphasis
  // needs at least one asterisk, so plain text skips the regex.
  const textNodes: Text[] = []
  forEachChildInBounds(editor, bounds, (node) => {
    if (isTextNode(node) && node.textContent && node.textContent.includes('*')) {
      textNodes.push(node)
    }
  })

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

/** Matches a `•` bullet glyph at the start of a line (optionally indented). */
const LIST_BULLET_PATTERN = /(^|\n)([ \t]*)•/g

/**
 * Walks direct-child text nodes and wraps each line-leading `•` bullet glyph in
 * a `<span class="prompt-area-list-bullet">` so CSS can size it up (the raw
 * U+2022 glyph renders much smaller than the surrounding text).
 *
 * Like {@link decorateMarkdownInEditor}, this is a DOM-only decoration: the span
 * is stripped by {@link normalizeEditorDOM} on every input cycle, so the `•`
 * stays a plain character in the segment model and is re-decorated each render.
 *
 * @param editor - The contentEditable root element
 * @returns Whether any decorations were applied
 */
export function decorateBulletsInEditor(editor: HTMLElement, bounds?: DecorateBounds): boolean {
  let decorated = false

  const textNodes: Text[] = []
  forEachChildInBounds(editor, bounds, (node) => {
    if (isTextNode(node) && node.textContent?.includes('•')) {
      textNodes.push(node)
    }
  })

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    LIST_BULLET_PATTERN.lastIndex = 0
    const bulletIndices: number[] = []
    let match: RegExpExecArray | null
    while ((match = LIST_BULLET_PATTERN.exec(text)) !== null) {
      bulletIndices.push(match.index + match[1].length + match[2].length)
    }

    if (bulletIndices.length === 0) continue

    decorated = true
    const parent = textNode.parentNode
    if (!parent) continue

    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    for (const index of bulletIndices) {
      if (index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)))
      }
      const span = document.createElement('span')
      span.dataset.md = 'true'
      span.className = 'prompt-area-list-bullet'
      span.textContent = '•'
      fragment.appendChild(span)
      lastIndex = index + 1 // the bullet is a single character
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    parent.replaceChild(fragment, textNode)
  }

  return decorated
}

/** An ATX heading — `# ` through `###### ` — at the start of a line. */
const HEADING_PATTERN = /^(#{1,6}) (.*)$/

/**
 * Renders markdown headings at their real size: `## Risks` becomes a heading
 * line, with the hashes collapsed to nothing rather than left on screen.
 *
 * Like the other decorations this is display-only. The `#` characters stay in
 * the DOM inside a zero-size `.prompt-area-md-marker`, so `textContent` — and
 * therefore the segment model and every caret offset — is unchanged, and
 * {@link normalizeEditorDOM} unwraps the whole thing back to plain text on the
 * next input cycle.
 *
 * Must run BEFORE the node-splitting passes ({@link decorateURLsInEditor},
 * {@link decorateMarkdownInEditor}), which need whole-line text nodes. That
 * puts the heading's text out of their reach, so {@link decorateEditor} runs
 * the inline pass over each heading's content span afterwards — otherwise
 * `## Risks and *caveats*` would show its asterisks raw.
 *
 * A heading is only recognised at a true line start — the first text node, one
 * following a `<br>`, or just after a `\n`. A text node that merely continues a
 * line (after a chip, say) is left alone, so `see #4 and ## notes` stays prose.
 *
 * @param editor - The contentEditable root element
 * @returns Whether any decorations were applied
 */
export function decorateHeadingsInEditor(editor: HTMLElement, bounds?: DecorateBounds): boolean {
  let decorated = false

  const textNodes: Text[] = []
  forEachChildInBounds(editor, bounds, (node) => {
    if (isTextNode(node) && node.textContent?.includes('#')) {
      textNodes.push(node)
    }
  })

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    const previous = textNode.previousSibling
    const opensLine = previous === null || isBRElement(previous)

    const lines = text.split('\n')
    const fragment = document.createDocumentFragment()
    let touched = false

    lines.forEach((line, index) => {
      if (index > 0) fragment.appendChild(document.createTextNode('\n'))

      const atLineStart = index === 0 ? opensLine : true
      const match = atLineStart ? HEADING_PATTERN.exec(line) : null
      if (!match) {
        fragment.appendChild(document.createTextNode(line))
        return
      }

      const hashes = match[1] ?? ''
      const content = match[2] ?? ''
      touched = true

      const wrapper = document.createElement('span')
      wrapper.dataset.md = 'true'
      wrapper.dataset.mdHeading = String(hashes.length)
      wrapper.className = 'prompt-area-md-heading'

      const marker = document.createElement('span')
      marker.className = 'prompt-area-md-marker'
      // The trailing space belongs to the marker: it's syntax, and leaving it
      // visible would indent every heading by a space.
      marker.textContent = `${hashes} `

      const body = document.createElement('span')
      body.className = 'prompt-area-md-heading-text'
      body.textContent = content

      wrapper.appendChild(marker)
      wrapper.appendChild(body)
      fragment.appendChild(wrapper)
    })

    if (!touched) continue

    const parent = textNode.parentNode
    if (!parent) continue

    decorated = true
    parent.replaceChild(fragment, textNode)
  }

  return decorated
}

/**
 * Matches the line-leading whitespace run of an indented list line (bullet or
 * numbered). The lookahead keeps the list prefix itself out of the capture, so
 * only the indentation is wrapped.
 */
const LIST_INDENT_PATTERN = /(^|\n)([ \t]+)(?=(?:[•\-*] |\d+\. ))/g

/**
 * Wraps each list line's leading indentation in an inline-block
 * `<span class="prompt-area-list-indent">` sized per nesting level, so nested
 * items read with a wide, Notion-like indent instead of the raw 2-space gap.
 *
 * Like the other decorations this is display-only: the span keeps the original
 * whitespace as its textContent (so plain-text length and caret offsets are
 * unchanged) and is stripped by {@link normalizeEditorDOM} each input cycle.
 * Must run BEFORE the node-splitting passes ({@link decorateURLsInEditor},
 * {@link decorateMarkdownInEditor}, {@link decorateBulletsInEditor}) so every
 * direct-child text node is still a whole line — otherwise a mid-line split
 * fragment beginning with whitespace would let the `^` anchor false-match
 * non-line-leading whitespace.
 *
 * @returns Whether any decorations were applied
 */
export function decorateListIndentInEditor(editor: HTMLElement, bounds?: DecorateBounds): boolean {
  let decorated = false

  // Pre-gate: the indent pattern only matches leading whitespace at the node
  // start or after an embedded newline, so unindented single-line nodes (the
  // overwhelming majority) skip the regex.
  const textNodes: Text[] = []
  forEachChildInBounds(editor, bounds, (node) => {
    if (!isTextNode(node)) return
    const text = node.textContent
    if (text && (text[0] === ' ' || text[0] === '\t' || text.includes('\n'))) {
      textNodes.push(node)
    }
  })

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    LIST_INDENT_PATTERN.lastIndex = 0
    const runs: { start: number; end: number }[] = []
    let match: RegExpExecArray | null
    while ((match = LIST_INDENT_PATTERN.exec(text)) !== null) {
      const start = match.index + match[1].length
      runs.push({ start, end: start + match[2].length })
    }

    if (runs.length === 0) continue

    decorated = true
    const parent = textNode.parentNode
    if (!parent) continue

    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    for (const { start, end } of runs) {
      if (start > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)))
      }
      const whitespace = text.slice(start, end)
      const level = Math.floor(whitespace.length / 2)
      const span = document.createElement('span')
      span.dataset.md = 'true'
      span.className = 'prompt-area-list-indent'
      span.style.width = `calc(var(--prompt-area-indent-size, 1.5em) * ${level})`
      span.textContent = whitespace
      fragment.appendChild(span)
      lastIndex = end
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    parent.replaceChild(fragment, textNode)
  }

  return decorated
}

/**
 * Applies every display-only decoration to the editor in one pass: URL links
 * always, plus markdown emphasis, list indentation, and list bullets when
 * markdown mode is on. Each decoration is stripped by {@link normalizeEditorDOM}
 * on the next input cycle and re-applied here, so the segment model is never
 * mutated.
 *
 * List indentation runs FIRST, while each direct-child text node is still a
 * whole line: the URL and markdown passes split text nodes mid-line, and a tail
 * fragment starting with whitespace would let the indent regex's `^` anchor
 * false-match non-line-leading whitespace (e.g. `see http://x   1. y`).
 *
 * @param headingsEnabled - Also render `# ` … `###### ` as sized headings.
 *   Separate from `markdownEnabled` and off by default: a comment box is prose,
 *   and silently turning someone's `## ` into a display heading there would be
 *   a surprise rather than a feature.
 */
export function decorateEditor(
  editor: HTMLElement,
  markdownEnabled: boolean,
  headingsEnabled = false,
  bounds?: DecorateBounds,
): void {
  // Whole-line passes run FIRST, while each direct-child text node is still a
  // full line. The URL and markdown passes split text nodes mid-line, so a tail
  // fragment beginning with "•" would let the bullet regex's `^` anchor
  // false-match a mid-line separator (e.g. `**bold** • middle`).
  if (markdownEnabled) {
    if (headingsEnabled) decorateHeadingsInEditor(editor, bounds)
    decorateListIndentInEditor(editor, bounds)
    decorateBulletsInEditor(editor, bounds)
  }
  decorateURLsInEditor(editor, bounds)
  if (markdownEnabled) decorateMarkdownInEditor(editor, bounds)

  // Inline emphasis *inside* a heading. The heading pass consumed the line's
  // text node into its own span, so the editor-level pass above can't reach it
  // — without this, `## Risks and *caveats*` would show its asterisks raw.
  if (markdownEnabled && headingsEnabled) {
    if (bounds) {
      // Scoped cycle: the only heading wrappers needing the inline pass are
      // the ones the bounded heading pass just created inside this line.
      forEachChildInBounds(editor, bounds, (node) => {
        if (isHTMLElement(node) && node.dataset.mdHeading !== undefined) {
          const body = node.querySelector('.prompt-area-md-heading-text')
          if (body && isHTMLElement(body)) decorateMarkdownInEditor(body)
        }
      })
    } else {
      const headingTexts = editor.querySelectorAll('.prompt-area-md-heading-text')
      for (let i = 0; i < headingTexts.length; i++) {
        const body = headingTexts[i]
        if (isHTMLElement(body)) decorateMarkdownInEditor(body)
      }
    }
  }
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
