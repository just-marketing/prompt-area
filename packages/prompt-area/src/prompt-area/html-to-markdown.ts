/**
 * Hand-rolled, dependency-free HTML -> Markdown converter.
 *
 * Used by the paste handler: when the editor is in markdown mode and the
 * clipboard carries rich `text/html` (web pages, Notion, Google Docs, GitHub,
 * Slack, Word, etc.), we convert it to markdown SOURCE text so the paste keeps its
 * formatting. The resulting string flows through the same insertion path as a
 * plain-text paste, and the editor's inline decorators render `*`/`**`/`***`
 * and bare URLs automatically.
 *
 * Design constraints (see .size-limit.json): no runtime deps. Parsing uses the
 * ambient `DOMParser`, walking is a small recursive switch. Type-safe: no
 * `any`, DOM narrowed via the guards in `dom-helpers.ts`.
 */
import { isHTMLElement, isTextNode } from './dom-helpers'

// ---------------------------------------------------------------------------
// Inline style / emphasis detection
// ---------------------------------------------------------------------------

/** Reads a single declaration value from an inline `style` attribute string. */
function getStyleValue(style: string, prop: string): string {
  const match = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i').exec(style)
  return match ? match[1].trim().toLowerCase() : ''
}

/** Whether a CSS font-weight value is bold (`bold`, `bolder`, or >= 600). */
function isBoldWeight(value: string): boolean {
  if (value === 'bold' || value === 'bolder') return true
  const numeric = Number.parseInt(value, 10)
  return !Number.isNaN(numeric) && numeric >= 600
}

/**
 * Computes the markdown emphasis markers for an element from BOTH its tag and
 * its inline style. Google Docs emits `<span style="font-weight:700">` rather
 * than `<b>`, and wraps everything in `<b style="font-weight:normal">`, so an
 * explicit `font-weight`/`font-style` always wins over the tag name.
 */
function inlineEmphasis(node: HTMLElement): { prefix: string; suffix: string } {
  const tag = node.tagName
  const style = node.getAttribute('style') ?? ''

  const weight = getStyleValue(style, 'font-weight')
  const bold = weight ? isBoldWeight(weight) : tag === 'B' || tag === 'STRONG'

  const fontStyle = getStyleValue(style, 'font-style')
  const italic = fontStyle
    ? fontStyle === 'italic' || fontStyle === 'oblique'
    : tag === 'I' || tag === 'EM'

  const decoration = getStyleValue(style, 'text-decoration')
  const strike =
    tag === 'S' || tag === 'DEL' || tag === 'STRIKE' || decoration.includes('line-through')

  const prefix = (strike ? '~~' : '') + (bold ? '**' : '') + (italic ? '*' : '')
  const suffix = (italic ? '*' : '') + (bold ? '**' : '') + (strike ? '~~' : '')
  return { prefix, suffix }
}

// ---------------------------------------------------------------------------
// Text handling
// ---------------------------------------------------------------------------

/** Collapses HTML whitespace runs (incl. `&nbsp;` -> U+00A0) to single spaces. */
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ')
}

/** Escapes literal `*` from HTML text so prose isn't re-read as emphasis. */
function escapeText(text: string): string {
  return text.replace(/\*/g, '\\*')
}

// ---------------------------------------------------------------------------
// Microsoft Office clipboard HTML (Word / Outlook / Excel)
// ---------------------------------------------------------------------------

/**
 * Office fingerprints: `urn:schemas-microsoft-com:office` xmlns declarations,
 * `<meta name=ProgId content=Word.Document>`, `Mso*` class names (quoted or
 * Word's unquoted `class=MsoNormal`), and `mso-*` style declarations.
 */
const OFFICE_HTML_MARKER =
  /urn:schemas-microsoft-com:office|name=["']?ProgId|class=["']?Mso|\bmso-[\w-]+\s*:/i

/**
 * Whether clipboard HTML came from a Microsoft Office app. Office apps put a
 * bitmap RENDERING of the copied selection on the clipboard alongside the
 * HTML (macOS Word especially), so the paste handler uses this to keep a
 * text copy from being mistaken for an image paste.
 */
export function isOfficeHtml(html: string): boolean {
  return OFFICE_HTML_MARKER.test(html)
}

/** Word's inline list metadata: `mso-list:l0 level2 lfo1` → nesting level 2. */
const MSO_LIST_LEVEL = /mso-list:\s*l\d+\s+level(\d+)/i
/** `1.` / `12)` — numeric ordered marker; captures the digits. */
const NUMERIC_MARKER = /^(\d+)[.)]/
/** `a.` / `B)` / `iv.` — alphabetic/roman ordered marker. */
const ALPHA_MARKER = /^[a-z]{1,5}[.)]/i

type WordListItem = { p: HTMLElement; level: number }

/**
 * Classifies a `<p>` as a Word list paragraph. Word clipboard HTML has no
 * `<ul>/<ol>`: each item is a paragraph whose inline style carries
 * `mso-list:l<id> level<n> lfo<id>`, with the visible marker glyph in a
 * `<span style='mso-list:Ignore'>` behind conditional comments. The class
 * (`MsoListParagraph*`) is deliberately NOT a signal — Word puts it on
 * marker-less continuation paragraphs too.
 */
function wordListLevel(p: HTMLElement): number | null {
  const match = MSO_LIST_LEVEL.exec(p.getAttribute('style') ?? '')
  return match ? Number(match[1]) : null
}

/**
 * Detaches the `mso-list:Ignore` marker span and returns its text (`·`, `o`,
 * `§`, `1.`, `a.` …) for classification, keeping the glyph out of the item's
 * serialized content. Returns '' when no marker span is revealed (the
 * downlevel-hidden conditional-comment variant).
 */
function takeWordListMarker(p: HTMLElement): string {
  for (const span of Array.from(p.querySelectorAll('span'))) {
    if (getStyleValue(span.getAttribute('style') ?? '', 'mso-list') === 'ignore') {
      span.remove()
      return (span.textContent ?? '').trim()
    }
  }
  return ''
}

/**
 * Serializes a run of consecutive Word list paragraphs as markdown list lines —
 * single-newline separated, 2-space indent per level, the exact shape
 * `serializeList` emits for real `<ul>/<ol>`. Numeric markers seed the
 * per-level counter from their own digits (so a list continued after an
 * interrupting paragraph keeps Word's numbering); alpha/roman markers count
 * from 1; anything else (`·`, `o`, `§`, Wingdings, or a hidden marker) is a
 * bullet.
 */
function serializeWordListRun(items: WordListItem[], depth: number): string {
  const counters = new Map<number, number>()
  const lines: string[] = []
  for (const { p, level } of items) {
    // Returning to a shallower level ends its deeper sublists.
    for (const key of Array.from(counters.keys())) {
      if (key > level) counters.delete(key)
    }
    const markerText = takeWordListMarker(p)
    const numeric = NUMERIC_MARKER.exec(markerText)
    let marker = '- '
    if (numeric || ALPHA_MARKER.test(markerText)) {
      const n = (counters.get(level) ?? (numeric ? Number(numeric[1]) - 1 : 0)) + 1
      counters.set(level, n)
      marker = `${n}. `
    } else {
      counters.delete(level)
    }
    lines.push(`${'  '.repeat(depth + level - 1)}${marker}${serializeChildren(p, depth).trim()}`)
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Block serializers
// ---------------------------------------------------------------------------

/** Derives a fenced-block language from `class="language-ts"` or `lang="ts"`. */
function detectCodeLang(pre: HTMLElement): string {
  const code = pre.querySelector('code')
  const classNames = `${pre.className} ${code?.className ?? ''}`
  const fromClass = /(?:language|lang)-([\w-]+)/.exec(classNames)
  if (fromClass) return fromClass[1]
  return pre.getAttribute('lang') ?? code?.getAttribute('lang') ?? ''
}

function serializePre(pre: HTMLElement): string {
  const lang = detectCodeLang(pre)
  const raw = (pre.textContent ?? '').replace(/\n$/, '')
  return `\n\n\`\`\`${lang}\n${raw}\n\`\`\`\n\n`
}

function serializeInlineCode(node: HTMLElement): string {
  const content = node.textContent ?? ''
  if (content.includes('`')) return `\`\` ${content} \`\``
  return `\`${content}\``
}

/** http(s)/mailto only; drops `#`, empty, and `javascript:` hrefs. */
function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:)/i.test(href)
}

function serializeAnchor(node: HTMLElement, depth: number): string {
  const href = node.getAttribute('href') ?? ''
  const label = serializeChildren(node, depth).trim()
  if (!isSafeHref(href)) return label
  if (!label || label === href) return href
  return `[${label}](${href})`
}

function serializeImage(node: HTMLElement): string {
  const src = node.getAttribute('src') ?? ''
  // Gate the src through the same allow-list as anchors: only http(s)/mailto
  // survive, so a `javascript:`/`vbscript:`/`data:` src never reaches the
  // emitted markdown (defense-in-depth for consumers that render it as HTML).
  if (!src || !isSafeHref(src)) return ''
  return `![${node.getAttribute('alt') ?? ''}](${src})`
}

function serializeBlockquote(node: HTMLElement, depth: number): string {
  const inner = serializeChildren(node, depth).trim()
  const quoted = inner
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n')
  return `\n\n${quoted}\n\n`
}

/**
 * Serializes a `<ul>`/`<ol>` at nesting `depth` (0 = top level). Each `<li>`'s
 * own inline content becomes the marker line; a nested `<ul>`/`<ol>` is
 * serialized at `depth + 1` and appended indented below its parent item.
 *
 * A sublist reaches us in one of two shapes. The spec-correct one nests it
 * INSIDE its parent `<li>`; Word, Outlook and Apple Notes instead emit it as a
 * SIBLING of the `<li>` it belongs to. Both are handled — skipping the sibling
 * form (anything that is not an `<li>`) silently dropped every nested item
 * from such a paste.
 */
function serializeList(list: HTMLElement, depth: number): string {
  const ordered = list.tagName === 'OL'
  const start = Number.parseInt(list.getAttribute('start') ?? '', 10)
  let index = Number.isNaN(start) ? 1 : start
  const indent = '  '.repeat(depth)
  const lines: string[] = []

  for (const child of Array.from(list.childNodes)) {
    if (!isHTMLElement(child)) continue

    // Sublist emitted as a sibling of its parent item — indent it one level
    // deeper and keep it in document order. It is not an item of THIS list,
    // so it must not advance the ordered counter.
    if (child.tagName === 'UL' || child.tagName === 'OL') {
      const nestedSibling = serializeList(child, depth + 1)
      if (nestedSibling) lines.push(nestedSibling)
      continue
    }

    if (child.tagName !== 'LI') continue

    const marker = ordered ? `${index}. ` : '- '
    index++

    let label = ''
    let nested = ''
    for (const liChild of Array.from(child.childNodes)) {
      if (isHTMLElement(liChild) && (liChild.tagName === 'UL' || liChild.tagName === 'OL')) {
        nested += `\n${serializeList(liChild, depth + 1)}`
      } else {
        label += serializeNode(liChild, depth)
      }
    }
    lines.push(`${indent}${marker}${label.trim()}${nested}`)
  }

  return lines.join('\n')
}

function serializeTable(table: HTMLElement, depth: number): string {
  const rows = Array.from(table.querySelectorAll('tr'))
  if (rows.length === 0) return ''

  const cells = rows.map((row) =>
    Array.from(row.children)
      .filter((cell) => cell.tagName === 'TD' || cell.tagName === 'TH')
      .map((cell) =>
        serializeChildren(cell, depth).replace(/\n+/g, ' ').replace(/\|/g, '\\|').trim(),
      ),
  )

  const header = cells[0]
  const separator = header.map(() => '---')
  const toRow = (row: string[]): string => `| ${row.join(' | ')} |`

  return [toRow(header), toRow(separator), ...cells.slice(1).map(toRow)].join('\n')
}

// ---------------------------------------------------------------------------
// Recursive walker
// ---------------------------------------------------------------------------

function serializeChildren(node: Node, depth: number): string {
  let out = ''
  const children = Array.from(node.childNodes)
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isHTMLElement(child) && child.tagName === 'P') {
      const level = wordListLevel(child)
      if (level !== null) {
        // Consume the whole run of consecutive Word list items, skipping the
        // whitespace text nodes and comments Word puts between them, and
        // serialize it as one list block (same `\n\n…\n\n` contract as UL/OL).
        const run: WordListItem[] = [{ p: child, level }]
        let j = i + 1
        for (; j < children.length; j++) {
          const next = children[j]
          if (isHTMLElement(next)) {
            const nextLevel = next.tagName === 'P' ? wordListLevel(next) : null
            if (nextLevel === null) break
            run.push({ p: next, level: nextLevel })
          } else if (isTextNode(next) && (next.textContent ?? '').trim() !== '') {
            break
          }
        }
        out += `\n\n${serializeWordListRun(run, depth)}\n\n`
        i = j - 1
        continue
      }
    }
    out += serializeNode(child, depth)
  }
  return out
}

function serializeNode(node: Node, depth: number): string {
  if (isTextNode(node)) return escapeText(collapseWhitespace(node.textContent ?? ''))
  if (!isHTMLElement(node)) return ''

  const tag = node.tagName
  switch (tag) {
    case 'SCRIPT':
    case 'STYLE':
    case 'NOSCRIPT':
    case 'HEAD':
    case 'TITLE':
    case 'XML': // Word <xml> data island — the parser reparents it out of <head>
    case 'O:P': // Word paragraph-mark placeholder (often wraps a lone &nbsp;)
      return ''
    case 'BR':
      return '\n'
    case 'HR':
      return '\n\n---\n\n'
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
      return `\n\n${'#'.repeat(Number(tag[1]))} ${serializeChildren(node, depth).trim()}\n\n`
    case 'P':
      return `\n\n${serializeChildren(node, depth).trim()}\n\n`
    case 'DIV':
      return `\n${serializeChildren(node, depth).trim()}\n`
    case 'BLOCKQUOTE':
      return serializeBlockquote(node, depth)
    case 'UL':
    case 'OL':
      return `\n\n${serializeList(node, depth)}\n\n`
    case 'LI':
      // A stray <li> outside a list wrapper — emit its content as a line.
      return `${serializeChildren(node, depth).trim()}\n`
    case 'PRE':
      return serializePre(node)
    case 'CODE':
      // Inline code only: <pre> handles its own <code> via textContent.
      return serializeInlineCode(node)
    case 'A':
      return serializeAnchor(node, depth)
    case 'IMG':
      return serializeImage(node)
    case 'TABLE':
      return `\n\n${serializeTable(node, depth)}\n\n`
    default: {
      // Inline emphasis (B/STRONG/I/EM/S/DEL + styled SPAN/FONT) and the
      // "span soup" unwrap case both resolve here: emphasis markers when the
      // tag or inline style is meaningful, otherwise a bare unwrap.
      const { prefix, suffix } = inlineEmphasis(node)
      return prefix + serializeChildren(node, depth) + suffix
    }
  }
}

// ---------------------------------------------------------------------------
// Output normalization
// ---------------------------------------------------------------------------

/** Trims trailing spaces and caps consecutive blank lines at one. */
function normalizeOutput(markdown: string): string {
  return markdown
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]*\n[ \t\n]*/g, '\n\n')
    .trim()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts an HTML string to markdown source text. Returns '' for empty or
 * body-less input. Block markdown (headings, lists, quotes, fences, tables,
 * links) is emitted as literal markdown text — that is the editor's intended
 * display; only `*`/`**`/`***` and bare URLs get visually decorated inline.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (!doc.body) return ''
  return normalizeOutput(serializeChildren(doc.body, 0))
}
