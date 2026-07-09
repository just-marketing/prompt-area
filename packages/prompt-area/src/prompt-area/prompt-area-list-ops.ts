/**
 * List auto-formatting logic for the PromptArea component.
 * Pure — no DOM dependencies, fully testable in Node.
 */
import type { Segment } from './types'
import { replaceTextRange, segmentsToPlainText } from './prompt-area-engine'

/**
 * Information about a list line at a given cursor position.
 */
export type ListContext = {
  /** Offset in plain text where the line begins */
  lineStart: number
  /** The full prefix including indentation (e.g., "  • ") */
  prefix: string
  /** Number of indentation levels (each = 2 spaces) */
  indent: number
  /** Type of list */
  listType: 'bullet' | 'numbered'
  /** For bullet lists, the marker char actually used (`•`, `-`, or `*`) */
  marker?: string
  /** For numbered lists, the number */
  number?: number
  /** Offset in plain text where content after the prefix starts */
  contentStart: number
}

/**
 * Parsed shape of a single list line — the SINGLE source of truth for what
 * counts as a list line (both `getListContext` and the renumber engine derive
 * from this, so the bullet/number regexes live in exactly one place).
 *
 * Offsets (`numberStart`/`numberEnd`) are relative to the START of the line.
 */
type ParsedListLine =
  | { kind: 'bullet'; indent: number; marker: string; prefixLen: number }
  | {
      kind: 'numbered'
      indent: number
      number: number
      /** Offset of the first digit within the line. */
      numberStart: number
      /** Offset just past the last digit within the line (exclusive). */
      numberEnd: number
      prefixLen: number
    }

/** Classifies a single line as a bullet/numbered list item, or null. */
function parseListLine(line: string): ParsedListLine | null {
  const bulletMatch = line.match(/^(\s*)([•\-*]) /)
  if (bulletMatch) {
    return {
      kind: 'bullet',
      indent: Math.floor(bulletMatch[1].length / 2),
      marker: bulletMatch[2],
      prefixLen: bulletMatch[0].length,
    }
  }

  const numberMatch = line.match(/^(\s*)(\d+)\. /)
  if (numberMatch) {
    const numberStart = numberMatch[1].length
    return {
      kind: 'numbered',
      indent: Math.floor(numberMatch[1].length / 2),
      number: parseInt(numberMatch[2], 10),
      numberStart,
      numberEnd: numberStart + numberMatch[2].length,
      prefixLen: numberMatch[0].length,
    }
  }

  return null
}

/**
 * Detects if the cursor is in a list line and returns context about it.
 *
 * @param text - The full plain text content
 * @param cursorPos - The cursor position (character offset from start)
 * @returns List context if the cursor is in a list line, null otherwise
 */
export function getListContext(text: string, cursorPos: number): ListContext | null {
  const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1
  const lineEnd = text.indexOf('\n', cursorPos)
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd)

  const parsed = parseListLine(line)
  if (!parsed) return null

  return {
    lineStart,
    prefix: line.slice(0, parsed.prefixLen),
    indent: parsed.indent,
    listType: parsed.kind,
    ...(parsed.kind === 'bullet' ? { marker: parsed.marker } : { number: parsed.number }),
    contentStart: lineStart + parsed.prefixLen,
  }
}

/**
 * Detects if the user just typed a list trigger pattern (e.g., "- " or "* ")
 * and returns the segments with the replacement applied.
 */
export function autoFormatListPrefix(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const lineStart = plainText.lastIndexOf('\n', cursorPos - 1) + 1
  const lineText = plainText.slice(lineStart, cursorPos)

  const match = lineText.match(/^(\s*)[-*] $/)
  if (!match) return null

  const indent = match[1]
  const replacement = `${indent}• `
  const rangeStart = lineStart
  const rangeEnd = lineStart + lineText.length

  const newSegments = replaceTextRange(segments, rangeStart, rangeEnd, replacement)
  return {
    segments: newSegments,
    cursorOffset: lineStart + replacement.length,
  }
}

/**
 * Handles Enter key in a list line — continues the list or exits.
 */
export function insertListContinuation(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const ctx = getListContext(plainText, cursorPos)
  if (!ctx) return null

  const lineEnd = plainText.indexOf('\n', cursorPos)
  const lineContent = plainText.slice(ctx.contentStart, lineEnd === -1 ? plainText.length : lineEnd)

  if (lineContent.trim() === '') {
    // Enter on an empty item: outdent one level if nested (Notion/Docs style),
    // otherwise remove the prefix and exit the list to plain text.
    if (ctx.indent > 0) {
      const newSegments = replaceTextRange(segments, ctx.lineStart, ctx.lineStart + 2, '')
      return {
        segments: newSegments,
        cursorOffset: Math.max(ctx.lineStart, cursorPos - 2),
      }
    }
    const newSegments = replaceTextRange(
      segments,
      ctx.lineStart,
      ctx.lineStart + ctx.prefix.length,
      '',
    )
    return {
      segments: newSegments,
      cursorOffset: ctx.lineStart,
    }
  }

  const indent = '  '.repeat(ctx.indent)
  let nextPrefix: string
  if (ctx.listType === 'bullet') {
    nextPrefix = `${indent}${ctx.marker ?? '•'} `
  } else {
    const nextNum = (ctx.number ?? 1) + 1
    nextPrefix = `${indent}${nextNum}. `
  }

  const insertion = `\n${nextPrefix}`
  const newSegments = replaceTextRange(segments, cursorPos, cursorPos, insertion)
  return {
    segments: newSegments,
    cursorOffset: cursorPos + insertion.length,
  }
}

/** Returns the indent level of the list line directly above `lineStart`, or null. */
function getPrevListLineLevel(text: string, lineStart: number): number | null {
  if (lineStart === 0) return null
  const prevLineStart = text.lastIndexOf('\n', lineStart - 2) + 1
  const parsed = parseListLine(text.slice(prevLineStart, lineStart - 1))
  return parsed ? parsed.indent : null
}

/**
 * Indents a list item by one level (adds 2 spaces before the prefix), capped at
 * one level deeper than the line above. An item can only nest under a preceding
 * sibling, so the first item of a list — or an item already one level below its
 * parent — cannot indent further (returns null). This keeps sub-items visually
 * connected to a parent instead of drifting arbitrarily deep.
 */
export function indentListItem(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const ctx = getListContext(plainText, cursorPos)
  if (!ctx) return null

  const prevLevel = getPrevListLineLevel(plainText, ctx.lineStart)
  const maxLevel = prevLevel === null ? 0 : prevLevel + 1
  if (ctx.indent >= maxLevel) return null

  const newSegments = replaceTextRange(segments, ctx.lineStart, ctx.lineStart, '  ')
  return {
    segments: newSegments,
    cursorOffset: cursorPos + 2,
  }
}

/**
 * Outdents a list item by one level (removes 2 spaces from before the prefix).
 */
export function outdentListItem(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const ctx = getListContext(plainText, cursorPos)
  if (!ctx || ctx.indent === 0) return null

  const newSegments = replaceTextRange(segments, ctx.lineStart, ctx.lineStart + 2, '')
  return {
    segments: newSegments,
    cursorOffset: Math.max(ctx.lineStart, cursorPos - 2),
  }
}

/**
 * Removes the list prefix from the current line (e.g., on Backspace).
 */
export function removeListPrefix(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const ctx = getListContext(plainText, cursorPos)
  if (!ctx) return null

  if (cursorPos > ctx.contentStart) return null

  const newSegments = replaceTextRange(
    segments,
    ctx.lineStart,
    ctx.contentStart,
    '  '.repeat(ctx.indent),
  )
  return {
    segments: newSegments,
    cursorOffset: ctx.lineStart + ctx.indent * 2,
  }
}

/**
 * Normalizes markdown list prefixes in a raw text string (single source of
 * truth for the bullet-glyph swap, shared by segment normalization and paste):
 * - When markdown is enabled, converts "- " at line starts to "• "
 * - When markdown is disabled, converts "• " at line starts to "- "
 */
export function normalizeListPrefixText(text: string, markdownEnabled: boolean): string {
  return markdownEnabled
    ? text.replace(/(^|\n)(\s*)- /g, '$1$2• ')
    : text.replace(/(^|\n)(\s*)• /g, '$1$2- ')
}

/**
 * Normalizes markdown list prefixes across text segments. See
 * {@link normalizeListPrefixText} for the per-line rule.
 */
export function normalizeListPrefixes(segments: Segment[], markdownEnabled: boolean): Segment[] {
  let changed = false
  const result = segments.map((seg) => {
    if (seg.type !== 'text') return seg
    const newText = normalizeListPrefixText(seg.text, markdownEnabled)
    if (newText === seg.text) return seg
    changed = true
    return { ...seg, text: newText }
  })
  return changed ? result : segments
}

// ---------------------------------------------------------------------------
// Ordered-list renumbering
//
// The visible number is a projection of position (like BlockNote/ProseMirror/
// Notion), recomputed on every structural edit rather than trusted as stored
// text. A per-indent-level counter STACK models nested lists: descending starts
// a fresh counter at 1, ascending continues the shallower level and clears
// deeper ones. Every run restarts at 1, so `1. 1. 1.` rebuilds to `1. 2. 3.`
// and Tab-indenting an item restarts its sublist at 1.
// ---------------------------------------------------------------------------

/**
 * A single rewritten number's digit run, in the INPUT text's coordinates.
 * `[oldStart, oldEnd)` spans only the digits (never the indentation or `. `).
 */
export type NumberEdit = { oldStart: number; oldEnd: number; newText: string }

/**
 * Whether the text holds a genuine ordered-list run worth renumbering — a run
 * of 2+ consecutive same-level numbered lines that either starts at 1 or is
 * already a contiguous `n, n+1, …` sequence. Used to gate the paste path so a
 * copied list fragment (`3. 4. 5.` → renumber, or a broken `1. 1. 1.`) is
 * rebuilt, while incidental numeric-leading prose that `parseListLine` would
 * otherwise treat as a list — `1985. Born / 2020. Died`, `5. / 10. / 15.` — is
 * left untouched.
 */
export function hasOrderedListRun(text: string): boolean {
  let runLevel: number | null = null
  let runStart = 0
  let prevNumber = 0
  let runLength = 0
  let sequential = true

  for (const line of text.split('\n')) {
    const parsed = parseListLine(line)
    if (parsed?.kind === 'numbered' && parsed.indent === runLevel) {
      sequential = sequential && parsed.number === prevNumber + 1
      prevNumber = parsed.number
      runLength++
      if (runLength >= 2 && (runStart === 1 || sequential)) return true
    } else if (parsed?.kind === 'numbered') {
      // Start a fresh run at this line's level.
      runLevel = parsed.indent
      runStart = parsed.number
      prevNumber = parsed.number
      runLength = 1
      sequential = true
    } else {
      runLevel = null
      runLength = 0
    }
  }

  return false
}

/**
 * Recomputes ordered-list numbering across the whole text. Returns the new text
 * plus the list of changed digit runs (ascending by `oldStart`) for cursor
 * remapping. When nothing changes, returns the SAME text reference and an empty
 * `edits` array — the no-op guard that keeps this off the typing hot path.
 */
export function renumberOrderedListLines(text: string): { text: string; edits: NumberEdit[] } {
  // Cheap pre-gate: with no ordered-list line there is nothing to renumber, so
  // skip the per-line scan and throwaway rebuild. This runs on every structural
  // edit (Enter, Tab, bold/italic wrap) and each paste, most of which never
  // touch a numbered list.
  if (!/^[ \t]*\d+\. /m.test(text)) return { text, edits: [] }

  const counters = new Map<number, number>()
  const edits: NumberEdit[] = []
  const lines = text.split('\n')
  let out = ''
  let lineStart = 0

  const clearDeeperThan = (level: number, inclusive: boolean) => {
    for (const key of counters.keys()) {
      if (inclusive ? key >= level : key > level) counters.delete(key)
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const parsed = parseListLine(line)

    if (!parsed) {
      // A blank or plain (non-list) line breaks every open list run.
      counters.clear()
      out += line
    } else if (parsed.kind === 'bullet') {
      // A bullet interrupts numbered runs at its level and deeper; a shallower
      // numbered list continues across it.
      clearDeeperThan(parsed.indent, true)
      out += line
    } else {
      const level = parsed.indent
      clearDeeperThan(level, false)
      const current = counters.get(level)
      const n = current === undefined ? 1 : current + 1
      counters.set(level, n)

      const newDigits = String(n)
      if (newDigits === String(parsed.number)) {
        out += line
      } else {
        edits.push({
          oldStart: lineStart + parsed.numberStart,
          oldEnd: lineStart + parsed.numberEnd,
          newText: newDigits,
        })
        out += line.slice(0, parsed.numberStart) + newDigits + line.slice(parsed.numberEnd)
      }
    }

    if (i < lines.length - 1) out += '\n'
    lineStart += line.length + 1 // + 1 for the consumed '\n'
  }

  return edits.length === 0 ? { text, edits } : { text: out, edits }
}

/**
 * Remaps a caret/selection offset (in the renumber INPUT's coordinates) across
 * the digit-run edits. A single scalar delta is wrong: many spans each change
 * width, so the shift depends on how many changed spans lie strictly before the
 * offset, with a clamp when the offset sits inside a resized number.
 */
export function remapOffset(old: number, edits: NumberEdit[]): number {
  let shift = 0
  for (const e of edits) {
    if (e.oldEnd <= old) {
      shift += e.newText.length - (e.oldEnd - e.oldStart) // fully before
    } else if (e.oldStart >= old) {
      break // this and every later span is after the offset
    } else {
      return e.oldStart + shift + Math.min(old - e.oldStart, e.newText.length) // inside → clamp
    }
  }
  return old + shift
}

/**
 * Segment-level renumber used by the edit-commit path. Applies the digit-run
 * edits to the segments (right-to-left so earlier offsets stay valid) and
 * returns the changed spans for {@link remapOffset}. Digit runs are pure text at
 * line starts, so chips are never touched.
 */
export function renumberOrderedListSegments(segments: Segment[]): {
  segments: Segment[]
  edits: NumberEdit[]
} {
  const { edits } = renumberOrderedListLines(segmentsToPlainText(segments))
  if (edits.length === 0) return { segments, edits }

  let result = segments
  for (let i = edits.length - 1; i >= 0; i--) {
    const e = edits[i]
    result = replaceTextRange(result, e.oldStart, e.oldEnd, e.newText)
  }
  return { segments: result, edits }
}
