/**
 * Pure logic engine for the PromptArea component.
 * No DOM dependencies - fully testable in Node.
 */
import type { Segment, ChipSegment, TriggerConfig, TriggerPosition, ActiveTrigger } from './types'

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Converts an array of segments to a plain text string.
 * Chips are represented as `{trigger}{displayText}` (e.g., "@Alice").
 */
export function segmentsToPlainText(segments: Segment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === 'text') return seg.text
      return `${seg.trigger}${seg.displayText}`
    })
    .join('')
}

/**
 * Converts plain text into a single text segment.
 * Used for initial value conversion from plain strings.
 */
export function plainTextToSegments(text: string): Segment[] {
  if (!text) return []
  return [{ type: 'text', text }]
}

// ---------------------------------------------------------------------------
// Trigger position validation
// ---------------------------------------------------------------------------

/**
 * Checks whether a trigger character at the given position in text
 * is valid according to the position rule.
 *
 * @param text - The full text content
 * @param charIndex - The index of the trigger character in the text
 * @param position - The position rule to validate against
 */
export function isValidTriggerPosition(
  text: string,
  charIndex: number,
  position: TriggerPosition,
): boolean {
  if (charIndex === 0) return true

  const prevChar = text[charIndex - 1]

  if (position === 'start') {
    return prevChar === '\n'
  }

  // position === 'any': valid after any whitespace
  return prevChar === ' ' || prevChar === '\n' || prevChar === '\t'
}

// ---------------------------------------------------------------------------
// Trigger detection
// ---------------------------------------------------------------------------

/**
 * Scans backwards from the cursor position to detect if the user is
 * currently typing a trigger word.
 *
 * Returns the active trigger info, or null if no trigger is active.
 *
 * @param text - The full plain text content
 * @param cursorPos - The cursor position (character offset from start)
 * @param triggers - Available trigger configurations
 */
export function detectActiveTrigger(
  text: string,
  cursorPos: number,
  triggers: TriggerConfig[],
): ActiveTrigger | null {
  if (!text || cursorPos === 0 || triggers.length === 0) return null

  // Scan backwards from cursor to find the nearest trigger character.
  // Stop at whitespace (trigger word has ended) or start of text.
  for (let i = cursorPos - 1; i >= 0; i--) {
    const char = text[i]

    // If we hit whitespace before finding a trigger, check if this whitespace
    // is immediately followed by a trigger character
    if (char === ' ' || char === '\n' || char === '\t') {
      // The character after this whitespace could be a trigger
      if (i + 1 < cursorPos) {
        const nextChar = text[i + 1]
        const matchingTrigger = triggers.find((t) => t.char === nextChar)
        if (matchingTrigger && isValidTriggerPosition(text, i + 1, matchingTrigger.position)) {
          return {
            config: matchingTrigger,
            startOffset: i + 1,
            query: text.slice(i + 2, cursorPos),
          }
        }
      }
      // No trigger found after this whitespace, stop searching
      return null
    }

    // Check if this character is a trigger character
    const matchingTrigger = triggers.find((t) => t.char === char)
    if (matchingTrigger && isValidTriggerPosition(text, i, matchingTrigger.position)) {
      return {
        config: matchingTrigger,
        startOffset: i,
        query: text.slice(i + 1, cursorPos),
      }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Chip resolution
// ---------------------------------------------------------------------------

/**
 * Resolves an active trigger into a chip within the segments array.
 * Replaces the trigger text (trigger char + query) with a chip segment.
 *
 * @param segments - Current document segments
 * @param activeTrigger - The active trigger to resolve
 * @param chip - The chip data (value, displayText, optional data)
 * @returns New segments array with the chip inserted, and the new cursor position
 */
export function resolveChip(
  segments: Segment[],
  activeTrigger: ActiveTrigger,
  chip: { value: string; displayText: string; data?: unknown; autoResolved?: boolean },
): { segments: Segment[]; cursorOffset: number } {
  const triggerStart = activeTrigger.startOffset
  const triggerEnd = triggerStart + 1 + activeTrigger.query.length // +1 for trigger char

  // Build the new segments by mapping plain text positions back to segment boundaries
  const newSegments: Segment[] = []
  let offset = 0

  for (const seg of segments) {
    if (seg.type === 'chip') {
      const chipText = `${seg.trigger}${seg.displayText}`
      const chipStart = offset
      const chipEnd = offset + chipText.length

      // If the trigger range overlaps with this chip, something is wrong.
      // Chips should not be partially replaced.
      if (chipEnd <= triggerStart || chipStart >= triggerEnd) {
        newSegments.push(seg)
      }
      offset = chipEnd
    } else {
      const textStart = offset
      const textEnd = offset + seg.text.length

      if (textEnd <= triggerStart) {
        // Entirely before the trigger - keep as-is
        newSegments.push(seg)
      } else if (textStart >= triggerEnd) {
        // Entirely after the trigger - keep as-is
        newSegments.push(seg)
      } else {
        // This text segment contains (part of) the trigger range
        const beforeText = seg.text.slice(0, Math.max(0, triggerStart - textStart))
        const afterText = seg.text.slice(Math.min(seg.text.length, triggerEnd - textStart))

        if (beforeText) {
          newSegments.push({ type: 'text', text: beforeText })
        }

        const newChip: ChipSegment = {
          type: 'chip',
          trigger: activeTrigger.config.char,
          value: chip.value,
          displayText: chip.displayText,
          ...(chip.data !== undefined ? { data: chip.data } : {}),
          ...(chip.autoResolved ? { autoResolved: true } : {}),
        }
        newSegments.push(newChip)

        // Add trailing space after chip, then any remaining text
        if (afterText) {
          newSegments.push({ type: 'text', text: ' ' + afterText.replace(/^\s/, '') })
        } else {
          newSegments.push({ type: 'text', text: ' ' })
        }
      }

      offset = textEnd
    }
  }

  // Merge adjacent text segments
  const merged = mergeAdjacentTextSegments(newSegments)

  // Cursor should be placed after the chip + trailing space.
  // Find the *last* matching chip so duplicates resolve correctly.
  let lastChipEndOffset = -1
  let runningOffset = 0
  for (const seg of merged) {
    if (seg.type === 'text') {
      runningOffset += seg.text.length
    } else {
      runningOffset += seg.trigger.length + seg.displayText.length
      if (
        seg.value === chip.value &&
        seg.displayText === chip.displayText &&
        seg.trigger === activeTrigger.config.char
      ) {
        lastChipEndOffset = runningOffset
      }
    }
  }
  // +1 accounts for the trailing space after the chip
  const cursorOffset = lastChipEndOffset === -1 ? runningOffset : lastChipEndOffset + 1

  return { segments: merged, cursorOffset }
}

// ---------------------------------------------------------------------------
// Chip removal
// ---------------------------------------------------------------------------

/**
 * Removes a chip at the given segment index and merges adjacent text segments.
 *
 * @param segments - Current document segments
 * @param index - The segment index to remove
 * @returns New segments array with the chip removed
 */
export function removeChipAtIndex(segments: Segment[], index: number): Segment[] {
  if (index < 0 || index >= segments.length) return segments
  if (segments[index].type !== 'chip') return segments

  const result = [...segments.slice(0, index), ...segments.slice(index + 1)]
  return mergeAdjacentTextSegments(result)
}

/**
 * Reverts an auto-resolved chip at the given segment index back to plain text.
 * The text includes the trigger character + display text (e.g., "#readme").
 *
 * @param segments - Current document segments
 * @param index - The segment index to revert
 * @returns New segments with the chip replaced by text, or null if not applicable
 */
export function revertChipAtIndex(
  segments: Segment[],
  index: number,
): { segments: Segment[]; revertedText: string } | null {
  if (index < 0 || index >= segments.length) return null
  const seg = segments[index]
  if (seg.type !== 'chip' || !seg.autoResolved) return null

  const revertedText = `${seg.trigger}${seg.displayText}`
  const result = [
    ...segments.slice(0, index),
    { type: 'text' as const, text: revertedText },
    ...segments.slice(index + 1),
  ]
  return { segments: mergeAdjacentTextSegments(result), revertedText }
}

// ---------------------------------------------------------------------------
// Paste: resolve trigger patterns in segments
// ---------------------------------------------------------------------------

/**
 * Scans text segments for trigger patterns and auto-resolves them into chips.
 * Only resolves triggers that have `resolveOnSpace: true`.
 *
 * Trigger patterns must appear at word boundaries: start of text, after
 * whitespace, or after a newline. This avoids false positives like email
 * addresses (user@example.com).
 *
 * @param segments - The segments to scan
 * @param triggers - Available trigger configurations
 * @returns New segments with matched trigger patterns resolved to chips
 */
export function resolveTriggersInSegments(
  segments: Segment[],
  triggers: TriggerConfig[],
): Segment[] {
  const autoResolveTriggers = triggers.filter((t) => t.resolveOnSpace)
  if (autoResolveTriggers.length === 0) return segments

  // Build a set of trigger chars for fast lookup
  const triggerChars = new Set(autoResolveTriggers.map((t) => t.char))

  const result: Segment[] = []

  for (const seg of segments) {
    if (seg.type === 'chip') {
      result.push(seg)
      continue
    }

    const parts = splitTextByTriggerPatterns(seg.text, autoResolveTriggers, triggerChars)
    result.push(...parts)
  }

  return mergeAdjacentTextSegments(result)
}

/**
 * Splits a text string into text and chip segments based on trigger patterns.
 * A trigger pattern is: (start-of-string | whitespace) + trigger_char + word_chars
 * followed by whitespace or end-of-string.
 */
function splitTextByTriggerPatterns(
  text: string,
  triggers: TriggerConfig[],
  triggerChars: Set<string>,
): Segment[] {
  if (!text) return []

  const segments: Segment[] = []
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (triggerChars.has(char)) {
      // Check if this trigger char is at a valid position
      const isAtBoundary =
        i === 0 || text[i - 1] === ' ' || text[i - 1] === '\n' || text[i - 1] === '\t'

      if (isAtBoundary) {
        const trigger = triggers.find((t) => t.char === char)
        if (trigger && isValidTriggerPosition(text, i, trigger.position)) {
          // Scan forward for the word (non-whitespace characters)
          let end = i + 1
          while (
            end < text.length &&
            text[end] !== ' ' &&
            text[end] !== '\n' &&
            text[end] !== '\t'
          ) {
            end++
          }

          const query = text.slice(i + 1, end)
          if (query.length > 0) {
            // Create a chip segment
            const displayText = trigger.onSelect?.({ value: query, label: query }) ?? query
            segments.push({
              type: 'chip',
              trigger: char,
              value: query,
              displayText: displayText || query,
              autoResolved: true,
            })
            i = end
            continue
          }
        }
      }
    }

    // Not a trigger pattern — accumulate as text
    const start = i
    i++
    while (
      i < text.length &&
      !(
        triggerChars.has(text[i]) &&
        (i === 0 || text[i - 1] === ' ' || text[i - 1] === '\n' || text[i - 1] === '\t')
      )
    ) {
      i++
    }
    segments.push({ type: 'text', text: text.slice(start, i) })
  }

  return segments
}

// ---------------------------------------------------------------------------
// Text range replacement (used by list functions)
// ---------------------------------------------------------------------------

/**
 * Replaces a range of plain text within the segments array.
 * Handles segment boundaries correctly, preserving chip segments.
 *
 * @param segments - Current document segments
 * @param start - Start offset in plain text
 * @param end - End offset in plain text
 * @param replacement - The replacement text
 * @returns New segments array with the replacement applied
 */
export function replaceTextRange(
  segments: Segment[],
  start: number,
  end: number,
  replacement: string,
): Segment[] {
  const newSegments: Segment[] = []
  let offset = 0
  let inserted = false

  for (const seg of segments) {
    if (seg.type === 'chip') {
      const chipText = `${seg.trigger}${seg.displayText}`
      const chipStart = offset
      const chipEnd = offset + chipText.length

      // For insertion (start === end), insert before this chip if position matches
      if (!inserted && start === end && chipStart === start) {
        newSegments.push({ type: 'text', text: replacement })
        inserted = true
      }

      if (chipEnd <= start || chipStart >= end) {
        newSegments.push(seg)
      }
      // Chips within the range are removed
      offset = chipEnd
    } else {
      const textStart = offset
      const textEnd = offset + seg.text.length

      // Check if this segment contains the insertion/replacement point
      const isBefore = start === end ? textEnd < start : textEnd <= start
      const isAfter = start === end ? textStart > end : textStart >= end

      if (isBefore) {
        // Entirely before the range
        newSegments.push(seg)
      } else if (isAfter) {
        // Entirely after the range
        newSegments.push(seg)
      } else {
        // Overlaps with the range (or contains the insertion point)
        const beforeText = seg.text.slice(0, Math.max(0, start - textStart))
        const afterText = seg.text.slice(Math.min(seg.text.length, end - textStart))

        if (beforeText) {
          newSegments.push({ type: 'text', text: beforeText })
        }
        // Insert replacement only once (when we first enter the range)
        if (!inserted && textStart <= start) {
          newSegments.push({ type: 'text', text: replacement })
          inserted = true
        }
        if (afterText) {
          newSegments.push({ type: 'text', text: afterText })
        }
      }

      offset = textEnd
    }
  }

  // Fallback: if replacement wasn't inserted (e.g., insertion at very end)
  if (!inserted && replacement) {
    newSegments.push({ type: 'text', text: replacement })
  }

  return mergeAdjacentTextSegments(newSegments)
}

// ---------------------------------------------------------------------------
// Markdown formatting shortcuts
// ---------------------------------------------------------------------------

/**
 * Toggles markdown wrap markers around a selected text range.
 * If the selection is already wrapped with the marker, unwraps it.
 * If not wrapped, wraps it.
 *
 * @param segments - Current document segments
 * @param selectionStart - Start offset in plain text
 * @param selectionEnd - End offset in plain text
 * @param marker - The markdown marker (e.g., '**' for bold, '*' for italic)
 * @returns New segments and selection offsets, or null if selection is collapsed
 */
export function toggleMarkdownWrap(
  segments: Segment[],
  selectionStart: number,
  selectionEnd: number,
  marker: string,
): { segments: Segment[]; selectionStart: number; selectionEnd: number } | null {
  if (selectionStart === selectionEnd) return null

  const plainText = segmentsToPlainText(segments)
  const markerLen = marker.length

  // Check if already wrapped
  const hasOpeningMarker =
    selectionStart >= markerLen &&
    plainText.slice(selectionStart - markerLen, selectionStart) === marker
  const hasClosingMarker =
    selectionEnd + markerLen <= plainText.length &&
    plainText.slice(selectionEnd, selectionEnd + markerLen) === marker

  let isWrapped = hasOpeningMarker && hasClosingMarker

  // For single-char markers (e.g., '*'), ensure we're not matching
  // inside a multi-char marker (e.g., '**')
  if (isWrapped && markerLen === 1) {
    const charBeforeOpening =
      selectionStart > markerLen ? plainText[selectionStart - markerLen - 1] : ''
    const charAfterClosing =
      selectionEnd + markerLen < plainText.length ? plainText[selectionEnd + markerLen] : ''
    if (charBeforeOpening === marker || charAfterClosing === marker) {
      isWrapped = false
    }
  }

  if (isWrapped) {
    // Unwrap: remove closing marker first (preserves start offsets), then opening
    const afterClosing = replaceTextRange(segments, selectionEnd, selectionEnd + markerLen, '')
    const afterOpening = replaceTextRange(
      afterClosing,
      selectionStart - markerLen,
      selectionStart,
      '',
    )
    return {
      segments: afterOpening,
      selectionStart: selectionStart - markerLen,
      selectionEnd: selectionEnd - markerLen,
    }
  }

  // Wrap: insert closing marker first (preserves start offsets), then opening
  const afterClosing = replaceTextRange(segments, selectionEnd, selectionEnd, marker)
  const afterOpening = replaceTextRange(afterClosing, selectionStart, selectionStart, marker)
  return {
    segments: afterOpening,
    selectionStart: selectionStart + markerLen,
    selectionEnd: selectionEnd + markerLen,
  }
}

// ---------------------------------------------------------------------------
// List auto-formatting
// ---------------------------------------------------------------------------

/**
 * Information about a list line at a given cursor position.
 */
export type ListContext = {
  /** Offset in plain text where the line begins */
  lineStart: number
  /** The full prefix including indentation (e.g., "  \u2022 ") */
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
  // Find the start of the current line
  const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1
  const lineEnd = text.indexOf('\n', cursorPos)
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd)

  // Match bullet: (spaces)(bullet_char) (space)
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

  // Match numbered: (spaces)(digits). (space)
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
 *
 * @param segments - Current segments
 * @param cursorPos - The cursor position after typing
 * @returns New segments with auto-formatted prefix and new cursor offset, or null
 */
export function autoFormatListPrefix(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const lineStart = plainText.lastIndexOf('\n', cursorPos - 1) + 1
  const lineText = plainText.slice(lineStart, cursorPos)

  // Match "- " or "* " (with optional leading spaces) at the end of typed text
  const match = lineText.match(/^(\s*)[-*] $/)
  if (!match) return null

  const indent = match[1]
  const replacement = `${indent}\u2022 `
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
 *
 * @param segments - Current segments
 * @param cursorPos - The cursor position
 * @returns New segments and cursor offset, or null if not in a list
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

  // If the line content (after prefix) is empty, exit list mode
  if (lineContent.trim() === '') {
    // Remove the entire prefix (convert list line to empty line)
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

  // Build the next line prefix
  const indent = '  '.repeat(ctx.indent)
  let nextPrefix: string
  if (ctx.listType === 'bullet') {
    nextPrefix = `${indent}\u2022 `
  } else {
    const nextNum = (ctx.number ?? 1) + 1
    nextPrefix = `${indent}${nextNum}. `
  }

  // Insert newline + next prefix at cursor position
  const insertion = `\n${nextPrefix}`
  const newSegments = replaceTextRange(segments, cursorPos, cursorPos, insertion)
  return {
    segments: newSegments,
    cursorOffset: cursorPos + insertion.length,
  }
}

/**
 * Indents a list item by one level (adds 2 spaces before the prefix).
 *
 * @param segments - Current segments
 * @param cursorPos - The cursor position
 * @returns New segments and cursor offset, or null if not in a list
 */
export function indentListItem(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const ctx = getListContext(plainText, cursorPos)
  if (!ctx) return null

  // Insert 2 spaces at the line start
  const newSegments = replaceTextRange(segments, ctx.lineStart, ctx.lineStart, '  ')
  return {
    segments: newSegments,
    cursorOffset: cursorPos + 2,
  }
}

/**
 * Outdents a list item by one level (removes 2 spaces from before the prefix).
 *
 * @param segments - Current segments
 * @param cursorPos - The cursor position
 * @returns New segments and cursor offset, or null if not indented
 */
export function outdentListItem(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const ctx = getListContext(plainText, cursorPos)
  if (!ctx || ctx.indent === 0) return null

  // Remove 2 spaces from the line start
  const newSegments = replaceTextRange(segments, ctx.lineStart, ctx.lineStart + 2, '')
  return {
    segments: newSegments,
    cursorOffset: Math.max(ctx.lineStart, cursorPos - 2),
  }
}

/**
 * Removes the list prefix from the current line (e.g., on Backspace).
 *
 * @param segments - Current segments
 * @param cursorPos - The cursor position
 * @returns New segments and cursor offset, or null if not at prefix boundary
 */
export function removeListPrefix(
  segments: Segment[],
  cursorPos: number,
): { segments: Segment[]; cursorOffset: number } | null {
  const plainText = segmentsToPlainText(segments)
  const ctx = getListContext(plainText, cursorPos)
  if (!ctx) return null

  // Only act if cursor is at or before the content start
  if (cursorPos > ctx.contentStart) return null

  // Remove the prefix (keep indentation + content after prefix)
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

// ---------------------------------------------------------------------------
// Inline markdown parsing
// ---------------------------------------------------------------------------

export type MarkdownToken =
  | { type: 'plain'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'bold-italic'; text: string }
  | { type: 'url'; text: string }

/**
 * Parses text for simple inline markdown: bold, italic, bold-italic, and URLs.
 * Does NOT handle block-level markdown (lists, headings, etc.).
 */
export function parseInlineMarkdown(text: string): MarkdownToken[] {
  if (!text) return []

  const tokens: MarkdownToken[] = []
  // Regex patterns for inline markdown elements:
  // 1. ***text*** or ___text___ -> bold-italic
  // 2. **text** or __text__   -> bold
  // 3. *text* or _text_       -> italic
  // 4. https://... or http://... -> URL
  const pattern = /(\*{3}(.+?)\*{3})|(\*{2}(.+?)\*{2})|(\*(.+?)\*)|(https?:\/\/[^\s),]+)/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    // Add any plain text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: 'plain', text: text.slice(lastIndex, match.index) })
    }

    if (match[1] && match[2]) {
      // ***bold-italic***
      tokens.push({ type: 'bold-italic', text: match[2] })
    } else if (match[3] && match[4]) {
      // **bold**
      tokens.push({ type: 'bold', text: match[4] })
    } else if (match[5] && match[6]) {
      // *italic*
      tokens.push({ type: 'italic', text: match[6] })
    } else if (match[7]) {
      // URL
      tokens.push({ type: 'url', text: match[7] })
    }

    lastIndex = match.index + match[0].length
  }

  // Add any remaining plain text
  if (lastIndex < text.length) {
    tokens.push({ type: 'plain', text: text.slice(lastIndex) })
  }

  return tokens
}

// ---------------------------------------------------------------------------
// Segment comparison
// ---------------------------------------------------------------------------

/**
 * Shallow equality check for two segment arrays.
 * Compares type, text, trigger, value, displayText, and autoResolved fields.
 * Avoids JSON.stringify overhead for the common case.
 */
export function segmentsEqual(a: Segment[], b: Segment[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    const sa = a[i]
    const sb = b[i]
    if (sa.type !== sb.type) return false
    if (sa.type === 'text') {
      if (sb.type !== 'text' || sa.text !== sb.text) return false
    } else {
      if (
        sb.type !== 'chip' ||
        sa.trigger !== sb.trigger ||
        sa.value !== sb.value ||
        sa.displayText !== sb.displayText ||
        sa.autoResolved !== sb.autoResolved
      )
        return false
    }
  }
  return true
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Merges adjacent text segments into single text segments.
 * Also removes empty text segments.
 */
function mergeAdjacentTextSegments(segments: Segment[]): Segment[] {
  const result: Segment[] = []

  for (const seg of segments) {
    if (seg.type === 'text' && seg.text === '') continue

    const last = result[result.length - 1]
    if (seg.type === 'text' && last?.type === 'text') {
      // Merge with previous text segment
      result[result.length - 1] = { type: 'text', text: last.text + seg.text }
    } else {
      result.push(seg)
    }
  }

  return result
}
