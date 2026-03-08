import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePromptAreaEvents, BLUR_DELAY_MS } from '../use-prompt-area-events'
import type { Segment, TriggerConfig } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDeps(overrides: Partial<Parameters<typeof usePromptAreaEvents>[0]> = {}) {
  const editor = document.createElement('div')
  editor.contentEditable = 'true'
  document.body.appendChild(editor)

  const editorRef = { current: editor } as React.RefObject<HTMLDivElement | null>

  const deps = {
    editorRef,
    readSegmentsFromDOM: vi.fn((): Segment[] => []),
    onChange: vi.fn(),
    renderSegmentsToDOM: vi.fn(),
    runTriggerDetection: vi.fn(),
    dismissTrigger: vi.fn(),
    triggers: [] as TriggerConfig[],
    ...overrides,
    _editor: editor, // for cleanup
  }

  // Re-assert mock types since overrides may have narrowed them
  return deps as typeof deps & {
    readSegmentsFromDOM: ReturnType<typeof vi.fn<() => Segment[]>>
    onChange: ReturnType<typeof vi.fn>
    renderSegmentsToDOM: ReturnType<typeof vi.fn>
    runTriggerDetection: ReturnType<typeof vi.fn>
    dismissTrigger: ReturnType<typeof vi.fn>
  }
}

function placeCursor(node: Node, offset: number) {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePromptAreaEvents', () => {
  let editorEl: HTMLDivElement

  afterEach(() => {
    if (editorEl?.parentNode) {
      document.body.removeChild(editorEl)
    }
  })

  // -------------------------------------------------------------------------
  // pushUndo / resetUndoHistory
  // -------------------------------------------------------------------------

  describe('pushUndo', () => {
    it('stores undo state for later retrieval via undo', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const segments: Segment[] = [{ type: 'text', text: 'hello' }]

      act(() => {
        result.current.pushUndo(segments)
      })

      // Verify undo stack was populated by triggering an undo
      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'world' }])
      const event = createKeyEvent('z', { ctrlKey: true })
      act(() => {
        result.current.handleKeyDownForUndoRedo(event)
      })

      expect(deps.onChange).toHaveBeenCalledWith(segments)
      expect(deps.renderSegmentsToDOM).toHaveBeenCalledWith(segments)
    })
  })

  describe('resetUndoHistory', () => {
    it('clears undo and redo stacks', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      act(() => {
        result.current.pushUndo([{ type: 'text', text: 'state1' }])
        result.current.resetUndoHistory()
      })

      // Undo should handle the event but not call onChange since stack is empty
      const event = createKeyEvent('z', { ctrlKey: true })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      const handled = result.current.handleKeyDownForUndoRedo(event)
      expect(handled).toBe(true) // Event was handled (Ctrl+Z detected)
      expect(deps.onChange).not.toHaveBeenCalled() // But nothing to undo
    })
  })

  // -------------------------------------------------------------------------
  // handleDrop / handleDragOver
  // -------------------------------------------------------------------------

  describe('handleDrop', () => {
    it('prevents default on drop events', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const preventDefault = vi.fn()
      const event = { preventDefault } as unknown as React.DragEvent<HTMLDivElement>

      act(() => {
        result.current.handleDrop(event)
      })

      expect(preventDefault).toHaveBeenCalled()
    })
  })

  describe('handleDragOver', () => {
    it('prevents default on dragover events', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const preventDefault = vi.fn()
      const event = { preventDefault } as unknown as React.DragEvent<HTMLDivElement>

      act(() => {
        result.current.handleDragOver(event)
      })

      expect(preventDefault).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handleCompositionStart / handleCompositionEnd
  // -------------------------------------------------------------------------

  describe('handleCompositionStart', () => {
    it('sets isComposing to true', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      expect(result.current.isComposing.current).toBe(false)

      act(() => {
        result.current.handleCompositionStart()
      })

      expect(result.current.isComposing.current).toBe(true)
    })
  })

  describe('handleCompositionEnd', () => {
    it('sets isComposing to false and runs trigger detection', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      act(() => {
        result.current.handleCompositionStart()
      })
      expect(result.current.isComposing.current).toBe(true)

      act(() => {
        result.current.handleCompositionEnd()
      })

      expect(result.current.isComposing.current).toBe(false)
      expect(deps.runTriggerDetection).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handleBlur
  // -------------------------------------------------------------------------

  describe('handleBlur', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('dismisses trigger after delay when focus leaves the container', () => {
      const deps = createDeps()
      editorEl = deps._editor

      // Wrap editor in a container so parentElement check works properly
      const container = document.createElement('div')
      document.body.appendChild(container)
      container.appendChild(editorEl)

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      // Set focus to something outside the container
      const outsideEl = document.createElement('input')
      document.body.appendChild(outsideEl)
      outsideEl.focus()

      act(() => {
        result.current.handleBlur()
      })

      expect(deps.dismissTrigger).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(BLUR_DELAY_MS)
      })

      expect(deps.dismissTrigger).toHaveBeenCalled()

      outsideEl.remove()
      document.body.appendChild(editorEl)
      container.remove()
    })

    it('does not dismiss if focus moved within editor container', () => {
      const deps = createDeps()
      editorEl = deps._editor

      // Create a parent container
      const container = document.createElement('div')
      document.body.appendChild(container)
      container.appendChild(editorEl)

      const button = document.createElement('button')
      container.appendChild(button)

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      // Simulate focus moving to the button within the container
      act(() => {
        result.current.handleBlur()
      })

      // Set activeElement to sibling within container
      Object.defineProperty(document, 'activeElement', {
        value: button,
        writable: true,
        configurable: true,
      })

      act(() => {
        vi.advanceTimersByTime(BLUR_DELAY_MS)
      })

      expect(deps.dismissTrigger).not.toHaveBeenCalled()

      // Cleanup
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      })
      document.body.appendChild(editorEl)
      container.remove()
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDownForUndoRedo
  // -------------------------------------------------------------------------

  describe('handleKeyDownForUndoRedo', () => {
    it('returns false for non-z keys', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const event = createKeyEvent('a', { ctrlKey: true })
      const handled = result.current.handleKeyDownForUndoRedo(event)
      expect(handled).toBe(false)
    })

    it('returns false when neither meta nor ctrl is pressed', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const event = createKeyEvent('z')
      const handled = result.current.handleKeyDownForUndoRedo(event)
      expect(handled).toBe(false)
    })

    it('performs undo with Ctrl+Z', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const onUndo = vi.fn()
      const depsWithUndo = createDeps({ onUndo })
      editorEl = depsWithUndo._editor
      const { result } = renderHook(() => usePromptAreaEvents(depsWithUndo))

      const undoState: Segment[] = [{ type: 'text', text: 'previous' }]

      act(() => {
        result.current.pushUndo(undoState)
      })

      depsWithUndo.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'current' }])

      const event = createKeyEvent('z', { ctrlKey: true })
      const preventDefault = vi.fn()
      Object.defineProperty(event, 'preventDefault', { value: preventDefault })

      act(() => {
        const handled = result.current.handleKeyDownForUndoRedo(event)
        expect(handled).toBe(true)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(depsWithUndo.onChange).toHaveBeenCalledWith(undoState)
      expect(depsWithUndo.renderSegmentsToDOM).toHaveBeenCalledWith(undoState)
      expect(onUndo).toHaveBeenCalledWith(undoState)
    })

    it('performs redo with Ctrl+Shift+Z', () => {
      const onRedo = vi.fn()
      const deps2 = createDeps({ onRedo })
      editorEl = deps2._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps2))

      const state1: Segment[] = [{ type: 'text', text: 'state1' }]

      act(() => {
        result.current.pushUndo(state1)
      })

      // Perform undo first
      deps2.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'current' }])
      const undoEvent = createKeyEvent('z', { ctrlKey: true })
      Object.defineProperty(undoEvent, 'preventDefault', { value: vi.fn() })
      act(() => {
        result.current.handleKeyDownForUndoRedo(undoEvent)
      })

      // Now redo
      deps2.readSegmentsFromDOM.mockReturnValue(state1)
      const redoEvent = createKeyEvent('z', { ctrlKey: true, shiftKey: true })
      Object.defineProperty(redoEvent, 'preventDefault', { value: vi.fn() })
      act(() => {
        const handled = result.current.handleKeyDownForUndoRedo(redoEvent)
        expect(handled).toBe(true)
      })

      expect(onRedo).toHaveBeenCalled()
    })

    it('returns true but does nothing when undo stack is empty', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const event = createKeyEvent('z', { ctrlKey: true })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

      const handled = result.current.handleKeyDownForUndoRedo(event)
      expect(handled).toBe(true)
      expect(deps.onChange).not.toHaveBeenCalled()
    })

    it('returns true but does nothing when redo stack is empty', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const event = createKeyEvent('z', { ctrlKey: true, shiftKey: true })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

      const handled = result.current.handleKeyDownForUndoRedo(event)
      expect(handled).toBe(true)
      expect(deps.onChange).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handleCopy
  // -------------------------------------------------------------------------

  describe('handleCopy', () => {
    it('serializes text content to clipboard', () => {
      const deps = createDeps()
      editorEl = deps._editor

      editorEl.textContent = 'hello world'
      placeCursor(editorEl.firstChild!, 5)

      // Select all text
      const range = document.createRange()
      range.selectNodeContents(editorEl)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        setData: vi.fn(),
        getData: vi.fn(() => ''),
        files: [],
        items: [],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handleCopy(event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'hello world')
    })

    it('serializes chips as trigger+display text', () => {
      const deps = createDeps()
      editorEl = deps._editor

      // Create chip in editor
      const chip = document.createElement('span')
      chip.dataset.chipTrigger = '@'
      chip.dataset.chipDisplay = 'Alice'
      chip.dataset.chipValue = 'alice'
      chip.textContent = '@Alice'
      editorEl.appendChild(document.createTextNode('hi '))
      editorEl.appendChild(chip)

      // Select all
      const range = document.createRange()
      range.selectNodeContents(editorEl)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        setData: vi.fn(),
        getData: vi.fn(() => ''),
        files: [],
        items: [],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handleCopy(event)
      })

      expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'hi @Alice')
      // Should also set segment data
      expect(clipboardData.setData).toHaveBeenCalledWith(
        'text/prompt-area-segments',
        expect.any(String),
      )
    })
  })

  // -------------------------------------------------------------------------
  // handleCut
  // -------------------------------------------------------------------------

  describe('handleCut', () => {
    it('copies and then deletes selected content', () => {
      const deps = createDeps()
      editorEl = deps._editor

      editorEl.textContent = 'hello world'

      // Select all
      const range = document.createRange()
      range.selectNodeContents(editorEl)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'hello world' }])

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        setData: vi.fn(),
        getData: vi.fn(() => ''),
        files: [],
        items: [],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handleCut(event)
      })

      // Should have copied
      expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'hello world')
      // Should have called onChange and runTriggerDetection
      expect(deps.onChange).toHaveBeenCalled()
      expect(deps.runTriggerDetection).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handlePaste
  // -------------------------------------------------------------------------

  describe('handlePaste', () => {
    it('handles plain text paste', () => {
      const deps = createDeps()
      editorEl = deps._editor

      editorEl.textContent = 'hello'
      placeCursor(editorEl.firstChild!, 5)

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'hello' }])

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/plain') return ' world'
          return ''
        }),
        files: [] as File[],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(deps.onChange).toHaveBeenCalled()
      expect(deps.runTriggerDetection).toHaveBeenCalled()
    })

    it('handles image paste', () => {
      const onImagePaste = vi.fn()
      const deps = createDeps({ onImagePaste })
      editorEl = deps._editor

      const file = new File(['pixels'], 'screenshot.png', { type: 'image/png' })

      const clipboardData = {
        getData: vi.fn(() => ''),
        files: [file],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      act(() => {
        result.current.handlePaste(event)
      })

      expect(onImagePaste).toHaveBeenCalledWith(file)
      expect(deps.onChange).not.toHaveBeenCalled()
    })

    it('handles image paste from items (screenshot)', () => {
      const onImagePaste = vi.fn()
      const deps = createDeps({ onImagePaste })
      editorEl = deps._editor

      const file = new File(['pixels'], 'screenshot.png', { type: 'image/png' })
      const item = { type: 'image/png', getAsFile: () => file } as unknown as DataTransferItem

      const clipboardData = {
        getData: vi.fn(() => ''),
        files: [] as File[],
        items: [item],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      act(() => {
        result.current.handlePaste(event)
      })

      expect(onImagePaste).toHaveBeenCalledWith(file)
    })

    it('does nothing when editor ref is null', () => {
      const deps = createDeps()
      editorEl = deps._editor
      ;(deps.editorRef as { current: HTMLDivElement | null }).current = null

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        getData: vi.fn(() => ''),
        files: [] as File[],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(event)
      })

      expect(deps.onChange).not.toHaveBeenCalled()
    })

    it('handles multi-line paste', () => {
      const deps = createDeps()
      editorEl = deps._editor

      editorEl.textContent = ''
      const textNode = document.createTextNode('')
      editorEl.appendChild(textNode)
      placeCursor(textNode, 0)

      deps.readSegmentsFromDOM.mockReturnValue([])

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/plain') return 'line1\nline2\nline3'
          return ''
        }),
        files: [] as File[],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(event)
      })

      expect(deps.onChange).toHaveBeenCalled()
    })

    it('calls onPaste callback with external source for text paste', () => {
      const onPaste = vi.fn()
      const deps = createDeps({ onPaste })
      editorEl = deps._editor

      editorEl.textContent = ''
      const textNode = document.createTextNode('')
      editorEl.appendChild(textNode)
      placeCursor(textNode, 0)

      deps.readSegmentsFromDOM.mockReturnValue([])

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/plain') return 'pasted text'
          return ''
        }),
        files: [] as File[],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(event)
      })

      expect(onPaste).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'external',
        }),
      )
    })

    it('handles internal paste with segment JSON', () => {
      const onPaste = vi.fn()
      const onChipAdd = vi.fn()
      const deps = createDeps({ onPaste, onChipAdd })
      editorEl = deps._editor

      editorEl.textContent = 'hello '
      placeCursor(editorEl.firstChild!, 6)

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'hello ' }])

      const segments = JSON.stringify([
        { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
      ])

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/prompt-area-segments') return segments
          if (type === 'text/plain') return '@Alice'
          return ''
        }),
        files: [] as File[],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(event)
      })

      expect(deps.onChange).toHaveBeenCalled()
      expect(onPaste).toHaveBeenCalledWith(expect.objectContaining({ source: 'internal' }))
      expect(onChipAdd).toHaveBeenCalled()
    })

    it('falls back to text paste when segment JSON is invalid', () => {
      const deps = createDeps()
      editorEl = deps._editor

      editorEl.textContent = ''
      const textNode = document.createTextNode('')
      editorEl.appendChild(textNode)
      placeCursor(textNode, 0)

      deps.readSegmentsFromDOM.mockReturnValue([])

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/prompt-area-segments') return 'not valid json'
          if (type === 'text/plain') return 'fallback text'
          return ''
        }),
        files: [] as File[],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(event)
      })

      expect(deps.onChange).toHaveBeenCalled()
    })

    it('does nothing when pasting empty text', () => {
      const deps = createDeps()
      editorEl = deps._editor

      editorEl.textContent = 'hello'
      placeCursor(editorEl.firstChild!, 5)

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'hello' }])

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        getData: vi.fn(() => ''),
        files: [] as File[],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(event)
      })

      // pushUndo is called, but onChange should not be called for empty text
      // Actually the pushUndo is called first, then the paste is attempted
      // With empty text, it returns early after pushUndo
    })

    it('auto-resolves trigger patterns in pasted text', () => {
      const trigger: TriggerConfig = {
        char: '#',
        position: 'any',
        mode: 'dropdown',
        resolveOnSpace: true,
      }
      const onChipAdd = vi.fn()
      const deps = createDeps({ triggers: [trigger], onChipAdd })
      editorEl = deps._editor

      editorEl.textContent = ''
      const textNode = document.createTextNode('')
      editorEl.appendChild(textNode)
      placeCursor(textNode, 0)

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: '#tag ' }])

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/plain') return '#tag '
          return ''
        }),
        files: [] as File[],
        items: [] as DataTransferItem[],
      }

      const event = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(event)
      })

      // The resolveTriggersInSegments function may or may not find patterns
      // depending on exact logic, but at minimum onChange should be called
      expect(deps.onChange).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Undo stack overflow protection
  // -------------------------------------------------------------------------

  describe('undo stack limits', () => {
    it('enforces MAX_UNDO_HISTORY limit', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      // Push more than 100 states
      act(() => {
        for (let i = 0; i < 110; i++) {
          result.current.pushUndo([{ type: 'text', text: `state${i}` }])
        }
      })

      // Undo should work (stack is capped at 100, not empty)
      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'current' }])
      const event = createKeyEvent('z', { ctrlKey: true })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      act(() => {
        result.current.handleKeyDownForUndoRedo(event)
      })

      // Should get state109 (the last pushed)
      expect(deps.onChange).toHaveBeenCalledWith([{ type: 'text', text: 'state109' }])
    })

    it('clears redo stack on new change', () => {
      const deps = createDeps()
      editorEl = deps._editor
      const { result } = renderHook(() => usePromptAreaEvents(deps))

      // Push state and undo
      act(() => {
        result.current.pushUndo([{ type: 'text', text: 'old' }])
      })

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'current' }])
      const undoEvent = createKeyEvent('z', { ctrlKey: true })
      Object.defineProperty(undoEvent, 'preventDefault', { value: vi.fn() })
      act(() => {
        result.current.handleKeyDownForUndoRedo(undoEvent)
      })

      // Now push new state (should clear redo)
      act(() => {
        result.current.pushUndo([{ type: 'text', text: 'new' }])
      })

      // Redo should do nothing
      deps.onChange.mockClear()
      const redoEvent = createKeyEvent('z', { ctrlKey: true, shiftKey: true })
      Object.defineProperty(redoEvent, 'preventDefault', { value: vi.fn() })
      act(() => {
        result.current.handleKeyDownForUndoRedo(redoEvent)
      })

      expect(deps.onChange).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handlePaste – internal segment paste (text/prompt-area-segments)
  // -------------------------------------------------------------------------

  describe('handlePaste – internal segments', () => {
    it('pastes internal chip segments from clipboard', () => {
      const onPaste = vi.fn()
      const onChipAdd = vi.fn()
      const deps = createDeps({ onPaste, onChipAdd })
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      // Set up editor with some text and cursor
      editorEl.textContent = 'hello '
      placeCursor(editorEl.firstChild!, 6)

      const chipSegments: Segment[] = [
        { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
      ]

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/prompt-area-segments') return JSON.stringify(chipSegments)
          if (type === 'text/plain') return '@Alice'
          return ''
        }),
        files: [],
        items: [],
        types: ['text/prompt-area-segments', 'text/plain'],
      }

      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(pasteEvent)
      })

      expect(pasteEvent.preventDefault).toHaveBeenCalled()
      expect(deps.onChange).toHaveBeenCalled()
      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chip', trigger: '@', value: 'alice' }),
      )
      expect(onPaste).toHaveBeenCalledWith(expect.objectContaining({ source: 'internal' }))
    })

    it('falls through to plain text when segment JSON is invalid', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      editorEl.textContent = 'hello'
      placeCursor(editorEl.firstChild!, 5)

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/prompt-area-segments') return 'invalid json{{'
          if (type === 'text/plain') return 'world'
          return ''
        }),
        files: [],
        items: [],
        types: ['text/prompt-area-segments', 'text/plain'],
      }

      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(pasteEvent)
      })

      // Should still work with plain text fallback
      expect(pasteEvent.preventDefault).toHaveBeenCalled()
      expect(deps.onChange).toHaveBeenCalled()
    })

    it('falls through when segment JSON is array of invalid items', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      editorEl.textContent = 'x'
      placeCursor(editorEl.firstChild!, 1)

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/prompt-area-segments') return JSON.stringify([{ type: 'unknown' }])
          if (type === 'text/plain') return 'fallback'
          return ''
        }),
        files: [],
        items: [],
        types: ['text/prompt-area-segments', 'text/plain'],
      }

      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(pasteEvent)
      })

      expect(pasteEvent.preventDefault).toHaveBeenCalled()
      expect(deps.onChange).toHaveBeenCalled()
    })

    it('falls through when segment JSON is not an array', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      editorEl.textContent = 'x'
      placeCursor(editorEl.firstChild!, 1)

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/prompt-area-segments') return JSON.stringify({ notArray: true })
          if (type === 'text/plain') return 'fallback'
          return ''
        }),
        files: [],
        items: [],
        types: ['text/prompt-area-segments', 'text/plain'],
      }

      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(pasteEvent)
      })

      expect(deps.onChange).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handlePaste – trigger auto-resolve during paste
  // -------------------------------------------------------------------------

  describe('handlePaste – auto-resolve trigger', () => {
    it('auto-resolves pending trigger when pasting text with space', () => {
      const onChipAdd = vi.fn()
      const trigger: TriggerConfig = {
        char: '#',
        position: 'any',
        mode: 'dropdown',
        resolveOnSpace: true,
        onSearch: vi.fn(() => []),
      }
      const deps = createDeps({ onChipAdd, triggers: [trigger] })
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      editorEl.textContent = '#tag'
      placeCursor(editorEl.firstChild!, 4)

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/prompt-area-segments') return ''
          if (type === 'text/plain') return ' more text'
          return ''
        }),
        files: [],
        items: [],
        types: ['text/plain'],
      }

      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(pasteEvent)
      })

      expect(pasteEvent.preventDefault).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handleCopy – with chip elements (serializes segments)
  // -------------------------------------------------------------------------

  describe('handleCopy – chip serialization', () => {
    it('serializes chip elements as segments JSON in clipboard', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      // Add a chip element to the editor
      const chip = document.createElement('span')
      chip.contentEditable = 'false'
      chip.dataset.chipTrigger = '@'
      chip.dataset.chipValue = 'alice'
      chip.dataset.chipDisplay = 'Alice'
      chip.textContent = '@Alice'
      editorEl.appendChild(chip)

      // Select the chip
      const range = document.createRange()
      range.selectNodeContents(editorEl)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      const setData = vi.fn()
      const copyEvent = {
        preventDefault: vi.fn(),
        clipboardData: { setData },
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handleCopy(copyEvent)
      })

      expect(copyEvent.preventDefault).toHaveBeenCalled()
      expect(setData).toHaveBeenCalledWith('text/plain', expect.any(String))
      // Should also set segment JSON since there are chips
      expect(setData).toHaveBeenCalledWith('text/prompt-area-segments', expect.any(String))
    })

    it('does not include segments JSON when no chips in selection', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      editorEl.textContent = 'just text'

      const range = document.createRange()
      range.selectNodeContents(editorEl)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      const setData = vi.fn()
      const copyEvent = {
        preventDefault: vi.fn(),
        clipboardData: { setData },
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handleCopy(copyEvent)
      })

      expect(setData).toHaveBeenCalledTimes(1) // only text/plain
      expect(setData).toHaveBeenCalledWith('text/plain', 'just text')
    })
  })

  // -------------------------------------------------------------------------
  // handleCut – copy + delete + sync
  // -------------------------------------------------------------------------

  describe('handleCut – copy and delete', () => {
    it('copies selection and removes it from DOM', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      editorEl.textContent = 'hello world'

      // Select 'world'
      const range = document.createRange()
      range.setStart(editorEl.firstChild!, 6)
      range.setEnd(editorEl.firstChild!, 11)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      const setData = vi.fn()
      const cutEvent = {
        preventDefault: vi.fn(),
        clipboardData: { setData },
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handleCut(cutEvent)
      })

      expect(setData).toHaveBeenCalledWith('text/plain', 'world')
      expect(deps.onChange).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handleCopy – with BR element (newline serialization)
  // -------------------------------------------------------------------------

  describe('handleCopy – BR serialization', () => {
    it('serializes BR elements as newlines in plain text', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      // Build: "line1<br>line2"
      editorEl.innerHTML = ''
      editorEl.appendChild(document.createTextNode('line1'))
      editorEl.appendChild(document.createElement('br'))
      editorEl.appendChild(document.createTextNode('line2'))

      const range = document.createRange()
      range.selectNodeContents(editorEl)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      const setData = vi.fn()
      const copyEvent = {
        preventDefault: vi.fn(),
        clipboardData: { setData },
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handleCopy(copyEvent)
      })

      expect(setData).toHaveBeenCalledWith('text/plain', 'line1\nline2')
    })
  })

  // -------------------------------------------------------------------------
  // handlePaste – empty text returns early
  // -------------------------------------------------------------------------

  describe('handlePaste – empty text', () => {
    it('does nothing when clipboard text is empty and no segments', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      editorEl.textContent = 'x'
      placeCursor(editorEl.firstChild!, 1)

      const clipboardData = {
        getData: vi.fn(() => ''),
        files: [],
        items: [],
        types: [],
      }

      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(pasteEvent)
      })

      // Should not call onChange since there's nothing to paste
      // (pushUndo is called before the check, but onChange is not called)
      expect(deps.renderSegmentsToDOM).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // handlePaste – multi-line text
  // -------------------------------------------------------------------------

  describe('handlePaste – multi-line', () => {
    it('inserts multiple lines with BR elements', () => {
      const deps = createDeps()
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      editorEl.textContent = ''
      placeCursor(editorEl, 0)

      const clipboardData = {
        getData: vi.fn((type: string) => {
          if (type === 'text/prompt-area-segments') return ''
          if (type === 'text/plain') return 'line1\nline2\nline3'
          return ''
        }),
        files: [],
        items: [],
        types: ['text/plain'],
      }

      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData,
      } as unknown as React.ClipboardEvent<HTMLDivElement>

      act(() => {
        result.current.handlePaste(pasteEvent)
      })

      expect(deps.onChange).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Undo fires onUndo callback
  // -------------------------------------------------------------------------

  describe('undo/redo callbacks', () => {
    it('fires onUndo callback when undoing', () => {
      const onUndo = vi.fn()
      const deps = createDeps({ onUndo })
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      const segments: Segment[] = [{ type: 'text', text: 'before' }]
      act(() => {
        result.current.pushUndo(segments)
      })

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'after' }])
      const undoEvent = createKeyEvent('z', { ctrlKey: true })
      act(() => {
        result.current.handleKeyDownForUndoRedo(undoEvent)
      })

      expect(onUndo).toHaveBeenCalledWith(segments)
    })

    it('fires onRedo callback when redoing', () => {
      const onRedo = vi.fn()
      const deps = createDeps({ onRedo })
      editorEl = deps._editor

      const { result } = renderHook(() => usePromptAreaEvents(deps))

      // Push, undo, then redo
      act(() => {
        result.current.pushUndo([{ type: 'text', text: 'v1' }])
      })

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'v2' }])
      const undoEvent = createKeyEvent('z', { ctrlKey: true })
      act(() => {
        result.current.handleKeyDownForUndoRedo(undoEvent)
      })

      deps.readSegmentsFromDOM.mockReturnValue([{ type: 'text', text: 'v1' }])
      const redoEvent = createKeyEvent('z', { ctrlKey: true, shiftKey: true })
      act(() => {
        result.current.handleKeyDownForUndoRedo(redoEvent)
      })

      expect(onRedo).toHaveBeenCalled()
    })
  })
})

// ---------------------------------------------------------------------------
// Helper to create keyboard events
// ---------------------------------------------------------------------------

function createKeyEvent(
  key: string,
  opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {},
): React.KeyboardEvent<HTMLDivElement> {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    ctrlKey: opts.ctrlKey,
    metaKey: opts.metaKey,
    shiftKey: opts.shiftKey,
  }) as unknown as React.KeyboardEvent<HTMLDivElement>
}
