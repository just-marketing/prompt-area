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
  /** For numbered lists, the number */
  number?: number
  /** Offset in plain text where content after the prefix starts */
  contentStart: number
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

  const bulletMatch = line.match(/^(\s*)([•\-*]) /)
  if (bulletMatch) {
    const indentStr = bulletMatch[1]
    return {
      lineStart,
      prefix: bulletMatch[0],
      indent: Math.floor(indentStr.length / 2),
      listType: 'bullet',
      contentStart: lineStart + bulletMatch[0].length,
    }
  }

  const numberMatch = line.match(/^(\s*)(\d+)\. /)
  if (numberMatch) {
    const indentStr = numberMatch[1]
    return {
      lineStart,
      prefix: numberMatch[0],
      indent: Math.floor(indentStr.length / 2),
      listType: 'numbered',
      number: parseInt(numberMatch[2], 10),
      contentStart: lineStart + numberMatch[0].length,
    }
  }

  return null
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
    nextPrefix = `${indent}• `
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

/**
 * Indents a list item by one level (adds 2 spaces before the prefix).
 */
export function indentListItem(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const ctx = getListContext(plainText, cursorPos)
  if (!ctx) return null

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
 * Normalizes markdown list prefixes in segments:
 * - When markdown is enabled, converts "- " at line starts to "• "
 * - When markdown is disabled, converts "• " at line starts to "- "
 */
export function normalizeListPrefixes(segments: Segment[], markdownEnabled: boolean): Segment[] {
  let changed = false
  const result = segments.map((seg) => {
    if (seg.type !== 'text') return seg
    const newText = markdownEnabled
      ? seg.text.replace(/(^|\n)(\s*)- /g, '$1$2• ')
      : seg.text.replace(/(^|\n)(\s*)• /g, '$1$2- ')
    if (newText === seg.text) return seg
    changed = true
    return { ...seg, text: newText }
  })
  return changed ? result : segments
}
