/**
 * Hand-rolled, dependency-free HTML -> Markdown converter.
 *
 * Used by the paste handler: when the editor is in markdown mode and the
 * clipboard carries rich `text/html` (web pages, Notion, Google Docs, GitHub,
 * Slack, etc.), we convert it to markdown SOURCE text so the paste keeps its
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
 * own inline content becomes the marker line; a nested `<ul>`/`<ol>` child is
 * serialized at `depth + 1` and appended indented below its parent item.
 */
function serializeList(list: HTMLElement, depth: number): string {
  const ordered = list.tagName === 'OL'
  const start = Number.parseInt(list.getAttribute('start') ?? '', 10)
  let index = Number.isNaN(start) ? 1 : start
  const indent = '  '.repeat(depth)
  const lines: string[] = []

  for (const child of Array.from(list.childNodes)) {
    if (!isHTMLElement(child) || child.tagName !== 'LI') continue

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
  node.childNodes.forEach((child) => {
    out += serializeNode(child, depth)
  })
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
