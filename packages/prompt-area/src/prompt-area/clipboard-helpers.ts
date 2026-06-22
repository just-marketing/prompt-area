/**
 * Clipboard-related DOM utilities for the PromptArea component.
 * Handles serializing selections and inserting pasted segments at the cursor.
 *
 * Not merged into dom-helpers.ts to avoid overcrowding that file with
 * clipboard I/O concerns alongside its DOM traversal and chip-accessor helpers.
 */
import type { Segment, ChipSegment } from './types'
import {
  chipNodeToSegment,
  getChipDisplay,
  getChipTrigger,
  getSelectionRange,
  isChipElement,
  isHTMLElement,
} from './dom-helpers'
import { mergeAdjacentTextSegments } from './prompt-area-engine'
import { getTextLengthInRange } from './cursor-helpers'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Visitor callbacks for {@link walkFragmentNodes}. Each fires for the
 * corresponding node kind encountered during a depth-first walk.
 */
type FragmentVisitor = {
  /** A text node — receives its text content (may be empty). */
  onText: (text: string) => void
  /** A chip element (has `data-chip-trigger`). */
  onChip: (node: HTMLElement) => void
  /** A `<br>` line break. */
  onBreak: () => void
}

/**
 * Depth-first walk of a selection fragment, classifying each node as text,
 * chip, or line break and recursing into any other element (decoration spans,
 * anchors, browser-inserted wrappers).
 *
 * Both fragment serializers share this single traversal so they cannot drift
 * on which nodes count as chips/breaks or how nested decorations are unwrapped.
 */
function walkFragmentNodes(fragment: DocumentFragment, visitor: FragmentVisitor): void {
  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      visitor.onText(node.textContent ?? '')
    } else if (isChipElement(node)) {
      visitor.onChip(node)
    } else if (isHTMLElement(node) && node.tagName === 'BR') {
      visitor.onBreak()
    } else {
      node.childNodes.forEach(walk)
    }
  }

  fragment.childNodes.forEach(walk)
}

/**
 * Serializes a DocumentFragment (from selection) to plain text,
 * converting chip elements to their `trigger + displayText` form.
 */
export function serializeFragmentToPlainText(fragment: DocumentFragment): string {
  let text = ''

  walkFragmentNodes(fragment, {
    onText: (value) => {
      text += value
    },
    onChip: (node) => {
      text += (getChipTrigger(node) ?? '') + (getChipDisplay(node) ?? '')
    },
    onBreak: () => {
      text += '\n'
    },
  })

  return text
}

/**
 * Serializes a DocumentFragment to an array of Segment objects,
 * preserving chip data for internal copy/paste.
 */
export function serializeFragmentToSegments(fragment: DocumentFragment): Segment[] {
  const segments: Segment[] = []

  walkFragmentNodes(fragment, {
    onText: (value) => {
      if (value) segments.push({ type: 'text', text: value })
    },
    onChip: (node) => {
      const chip = chipNodeToSegment(node)
      if (chip) segments.push(chip)
    },
    onBreak: () => {
      segments.push({ type: 'text', text: '\n' })
    },
  })

  return segments
}

/**
 * Parses segment JSON from the clipboard. Returns null if invalid.
 */
export function parseSegmentsFromClipboard(json: string): Segment[] | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) return null

    const segments: Segment[] = []
    for (const item of parsed) {
      if (!isRecord(item)) return null

      if (item.type === 'text' && typeof item.text === 'string') {
        segments.push({ type: 'text', text: item.text })
      } else if (
        item.type === 'chip' &&
        typeof item.trigger === 'string' &&
        typeof item.value === 'string' &&
        typeof item.displayText === 'string'
      ) {
        const chip: ChipSegment = {
          type: 'chip',
          trigger: item.trigger,
          value: item.value,
          displayText: item.displayText,
          ...(item.data !== undefined ? { data: item.data } : {}),
          ...(item.autoResolved ? { autoResolved: true } : {}),
        }
        segments.push(chip)
      } else {
        return null
      }
    }

    return segments
  } catch {
    return null
  }
}

/**
 * Inserts pasted segments at the current cursor position within existing segments.
 * Splits any text segment that straddles the cursor so the pasted content lands
 * exactly at the cursor and nothing before or after is lost.
 */
export function insertSegmentsAtCursor(
  currentSegments: Segment[],
  pastedSegments: Segment[],
  editor: HTMLElement,
): Segment[] {
  const range = getSelectionRange()
  if (!range) return [...currentSegments, ...pastedSegments]

  const preRange = document.createRange()
  preRange.selectNodeContents(editor)
  preRange.setEnd(range.startContainer, range.startOffset)
  const cursorOffset = getTextLengthInRange(preRange)

  const result: Segment[] = []
  let offset = 0
  let inserted = false

  const insertOnce = (): void => {
    if (!inserted) {
      result.push(...pastedSegments)
      inserted = true
    }
  }

  for (const seg of currentSegments) {
    if (seg.type === 'chip') {
      const chipLen = seg.trigger.length + seg.displayText.length
      if (offset >= cursorOffset) insertOnce()
      result.push(seg)
      offset += chipLen
      continue
    }

    const segEnd = offset + seg.text.length
    if (segEnd <= cursorOffset) {
      // Entirely before the cursor
      result.push(seg)
    } else if (offset >= cursorOffset) {
      // Entirely after the cursor
      insertOnce()
      result.push(seg)
    } else {
      // Cursor falls inside this text segment — split it.
      const splitAt = cursorOffset - offset
      const before = seg.text.slice(0, splitAt)
      const after = seg.text.slice(splitAt)
      if (before) result.push({ type: 'text', text: before })
      insertOnce()
      if (after) result.push({ type: 'text', text: after })
    }
    offset = segEnd
  }

  insertOnce()
  return mergeAdjacentTextSegments(result)
}
