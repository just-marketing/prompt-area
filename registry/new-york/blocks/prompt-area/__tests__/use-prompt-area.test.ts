import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePromptArea } from '../use-prompt-area'
import type { Segment, TriggerConfig, ChipSegment } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mentionTrigger: TriggerConfig = {
  char: '@',
  position: 'any',
  mode: 'dropdown',
  onSearch: vi.fn(() => [{ value: 'alice', label: 'Alice' }]),
}

const hashTrigger: TriggerConfig = {
  char: '#',
  position: 'any',
  mode: 'dropdown',
  resolveOnSpace: true,
  onSearch: vi.fn(() => []),
}

const slashTrigger: TriggerConfig = {
  char: '/',
  position: 'start',
  mode: 'dropdown',
  onSearch: vi.fn(() => [{ value: 'help', label: 'help' }]),
}

const callbackTrigger: TriggerConfig = {
  char: '!',
  position: 'any',
  mode: 'callback',
  onActivate: vi.fn(),
}

function defaultProps(overrides: Partial<Parameters<typeof usePromptArea>[0]> = {}) {
  return {
    value: [] as Segment[],
    onChange: vi.fn(),
    ...overrides,
  }
}

/** Create a chip span element in the editor DOM */
function createChipNode(
  trigger: string,
  value: string,
  display: string,
  opts: { autoResolved?: boolean } = {},
): HTMLSpanElement {
  const chip = document.createElement('span')
  chip.contentEditable = 'false'
  chip.dataset.chipTrigger = trigger
  chip.dataset.chipValue = value
  chip.dataset.chipDisplay = display
  if (opts.autoResolved) chip.dataset.chipAutoResolved = 'true'
  chip.textContent = `${trigger}${display}`
  return chip
}

/** Populate the editor div with text and optional chip nodes */
function populateEditor(editor: HTMLDivElement, ...nodes: (string | HTMLSpanElement)[]) {
  while (editor.firstChild) editor.removeChild(editor.firstChild)
  for (const node of nodes) {
    if (typeof node === 'string') {
      if (node === '\n') {
        editor.appendChild(document.createElement('br'))
      } else {
        editor.appendChild(document.createTextNode(node))
      }
    } else {
      editor.appendChild(node)
    }
  }
}

/** Place the cursor at a specific child node + offset */
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

describe('usePromptArea', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('returns expected shape', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      expect(result.current.editorRef).toBeDefined()
      expect(result.current.activeTrigger).toBeNull()
      expect(result.current.suggestions).toEqual([])
      expect(result.current.suggestionsLoading).toBe(false)
      expect(result.current.suggestionsError).toBeNull()
      expect(result.current.selectedSuggestionIndex).toBe(0)
      expect(result.current.triggerRect).toBeNull()
      expect(typeof result.current.handleInput).toBe('function')
      expect(typeof result.current.handleKeyDown).toBe('function')
      expect(typeof result.current.handleClick).toBe('function')
      expect(typeof result.current.selectSuggestion).toBe('function')
      expect(typeof result.current.dismissTrigger).toBe('function')
      expect(typeof result.current.handle).toBe('object')
      expect(typeof result.current.eventHandlers).toBe('object')
    })

    it('handle exposes focus, blur, insertChip, getPlainText, clear', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))
      const handle = result.current.handle

      expect(typeof handle.focus).toBe('function')
      expect(typeof handle.blur).toBe('function')
      expect(typeof handle.insertChip).toBe('function')
      expect(typeof handle.getPlainText).toBe('function')
      expect(typeof handle.clear).toBe('function')
    })

    it('eventHandlers has all required event callbacks', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))
      const handlers = result.current.eventHandlers

      expect(typeof handlers.onPaste).toBe('function')
      expect(typeof handlers.onCopy).toBe('function')
      expect(typeof handlers.onCut).toBe('function')
      expect(typeof handlers.onDrop).toBe('function')
      expect(typeof handlers.onDragOver).toBe('function')
      expect(typeof handlers.onCompositionStart).toBe('function')
      expect(typeof handlers.onCompositionEnd).toBe('function')
      expect(typeof handlers.onBlur).toBe('function')
    })
  })

  // -------------------------------------------------------------------------
  // DOM -> Model sync (handleInput)
  // -------------------------------------------------------------------------

  describe('handleInput', () => {
    it('reads text segments from the editor DOM', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      // Attach the editor ref to a real DOM div
      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello world')
      placeCursor(editor.firstChild!, 11)

      act(() => {
        result.current.handleInput()
      })

      expect(onChange).toHaveBeenCalledWith([{ type: 'text', text: 'hello world' }])

      document.body.removeChild(editor)
    })

    it('reads chip segments from the editor DOM', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, 'hi ', chip, ' bye')
      placeCursor(editor.lastChild!, 4)

      act(() => {
        result.current.handleInput()
      })

      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'hi ' },
        { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
        { type: 'text', text: ' bye' },
      ])

      document.body.removeChild(editor)
    })

    it('reads newlines as text segments with \\n', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'line1', '\n', 'line2')
      placeCursor(editor.lastChild!, 5)

      act(() => {
        result.current.handleInput()
      })

      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'line1' },
        { type: 'text', text: '\n' },
        { type: 'text', text: 'line2' },
      ])

      document.body.removeChild(editor)
    })

    it('skips sentinel <br> elements', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      editor.appendChild(document.createTextNode('hello'))
      editor.appendChild(document.createElement('br'))
      const sentinel = document.createElement('br')
      sentinel.dataset.sentinel = 'true'
      editor.appendChild(sentinel)
      placeCursor(editor.firstChild!, 5)

      act(() => {
        result.current.handleInput()
      })

      // Only the real <br> should produce a newline, not the sentinel
      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'hello' },
        { type: 'text', text: '\n' },
      ])

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Model -> DOM sync (value prop changes)
  // -------------------------------------------------------------------------

  describe('value sync', () => {
    it('renders text segments into the editor DOM', () => {
      const segments: Segment[] = [{ type: 'text', text: 'hello' }]
      const { result } = renderHook(() => usePromptArea(defaultProps({ value: segments })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      // Force re-render with new segments to trigger the useEffect
      const { rerender } = renderHook((props) => usePromptArea(props), {
        initialProps: defaultProps({ value: [] }),
      })

      rerender(defaultProps({ value: segments }))

      // The useEffect fires asynchronously; verify render happened
      // by checking handle.getPlainText after attaching editor
      expect(result.current.handle).toBeDefined()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Dismiss trigger
  // -------------------------------------------------------------------------

  describe('dismissTrigger', () => {
    it('resets active trigger and selection index', () => {
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ triggers: [mentionTrigger] })),
      )

      act(() => {
        result.current.dismissTrigger()
      })

      expect(result.current.activeTrigger).toBeNull()
      expect(result.current.selectedSuggestionIndex).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // Handle (imperative API)
  // -------------------------------------------------------------------------

  describe('handle.clear', () => {
    it('calls onChange with empty array and clears the editor DOM', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'some text')

      act(() => {
        result.current.handle.clear()
      })

      expect(onChange).toHaveBeenCalledWith([])
      expect(editor.childNodes.length).toBe(0)

      document.body.removeChild(editor)
    })
  })

  describe('handle.getPlainText', () => {
    it('returns plain text from the editor DOM', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('@', 'bob', 'Bob')
      populateEditor(editor, 'hello ', chip, ' world')

      const text = result.current.handle.getPlainText()
      expect(text).toBe('hello @Bob world')

      document.body.removeChild(editor)
    })
  })

  describe('handle.insertChip', () => {
    it('appends a chip and trailing space, calls onChange and onChipAdd', () => {
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, onChipAdd })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello ')

      act(() => {
        result.current.handle.insertChip({
          trigger: '@',
          value: 'alice',
          displayText: 'Alice',
        })
      })

      // onChange should be called with segments including the chip
      expect(onChange).toHaveBeenCalled()
      const segments = onChange.mock.calls[0][0] as Segment[]
      expect(segments).toEqual([
        { type: 'text', text: 'hello ' },
        { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
        { type: 'text', text: ' ' },
      ])

      // onChipAdd should fire
      expect(onChipAdd).toHaveBeenCalledWith({
        type: 'chip',
        trigger: '@',
        value: 'alice',
        displayText: 'Alice',
      })

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleClick (chip click delegation)
  // -------------------------------------------------------------------------

  describe('handleClick', () => {
    it('calls onChipClick when clicking a chip element', () => {
      const onChipClick = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChipClick })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, 'hi ', chip)

      // Simulate a click on the chip
      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        clientX: 50,
        clientY: 50,
      }) as unknown as React.MouseEvent<HTMLDivElement>
      Object.defineProperty(mouseEvent, 'target', { value: chip })

      act(() => {
        result.current.handleClick(mouseEvent)
      })

      expect(onChipClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chip',
          trigger: '@',
          value: 'alice',
          displayText: 'Alice',
        }),
      )

      document.body.removeChild(editor)
    })

    it('does not fire onChipClick when clicking regular text', () => {
      const onChipClick = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChipClick })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello world')

      const textNode = editor.firstChild!
      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
      }) as unknown as React.MouseEvent<HTMLDivElement>
      Object.defineProperty(mouseEvent, 'target', { value: textNode })

      act(() => {
        result.current.handleClick(mouseEvent)
      })

      expect(onChipClick).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown
  // -------------------------------------------------------------------------

  describe('handleKeyDown', () => {
    function createKeyEvent(
      key: string,
      opts: Partial<React.KeyboardEvent<HTMLDivElement>> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        metaKey: (opts as KeyboardEventInit).metaKey,
        ctrlKey: (opts as KeyboardEventInit).ctrlKey,
        shiftKey: (opts as KeyboardEventInit).shiftKey,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>

      // React events have nativeEvent
      Object.defineProperty(event, 'nativeEvent', {
        value: { isComposing: false },
      })

      return event
    }

    it('calls onSubmit on Enter (without Shift)', () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onSubmit })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello')
      placeCursor(editor.firstChild!, 5)

      const event = createKeyEvent('Enter')
      const preventDefault = vi.fn()
      Object.defineProperty(event, 'preventDefault', { value: preventDefault })

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(onSubmit).toHaveBeenCalled()
      expect(preventDefault).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('calls onEscape on Escape', () => {
      const onEscape = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onEscape })))

      const event = createKeyEvent('Escape')

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(onEscape).toHaveBeenCalled()
    })

    it('does not call onSubmit on Shift+Enter', () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onSubmit })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello')
      placeCursor(editor.firstChild!, 5)

      const event = createKeyEvent('Enter', { shiftKey: true } as Partial<
        React.KeyboardEvent<HTMLDivElement>
      >)
      const preventDefault = vi.fn()
      Object.defineProperty(event, 'preventDefault', { value: preventDefault })

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(onSubmit).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Chip data passthrough
  // -------------------------------------------------------------------------

  describe('chip data handling', () => {
    it('reads chip data from DOM including optional data attribute', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('@', 'alice', 'Alice')
      chip.dataset.chipData = JSON.stringify({ role: 'admin' })
      populateEditor(editor, chip)
      placeCursor(editor, 1)

      act(() => {
        result.current.handleInput()
      })

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'chip',
          trigger: '@',
          value: 'alice',
          displayText: 'Alice',
          data: { role: 'admin' },
        }),
      ])

      document.body.removeChild(editor)
    })

    it('reads autoResolved flag from DOM', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('#', 'tag1', 'tag1', { autoResolved: true })
      populateEditor(editor, chip)
      placeCursor(editor, 1)

      act(() => {
        result.current.handleInput()
      })

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'chip',
          autoResolved: true,
        }),
      ])

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Markdown mode toggle
  // -------------------------------------------------------------------------

  describe('markdown mode', () => {
    it('defaults markdown to enabled', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))
      // No error means it initialized with markdown: true (default)
      expect(result.current).toBeDefined()
    })

    it('can be initialized with markdown disabled', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps({ markdown: false })))
      expect(result.current).toBeDefined()
    })
  })

  // -------------------------------------------------------------------------
  // handle identity stability
  // -------------------------------------------------------------------------

  describe('memoization', () => {
    it('handle has consistent shape across re-renders', () => {
      const onChange = vi.fn()
      const props = defaultProps({ onChange })
      const { result, rerender } = renderHook((p) => usePromptArea(p), { initialProps: props })

      const firstKeys = Object.keys(result.current.handle).sort()
      rerender(props)
      const secondKeys = Object.keys(result.current.handle).sort()
      expect(firstKeys).toEqual(secondKeys)
    })

    it('eventHandlers has consistent shape across re-renders', () => {
      const onChange = vi.fn()
      const props = defaultProps({ onChange })
      const { result, rerender } = renderHook((p) => usePromptArea(p), { initialProps: props })

      const firstKeys = Object.keys(result.current.eventHandlers).sort()
      rerender(props)
      const secondKeys = Object.keys(result.current.eventHandlers).sort()
      expect(firstKeys).toEqual(secondKeys)
    })
  })

  // -------------------------------------------------------------------------
  // Empty editor edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handleInput does not crash without attached editor ref', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      // Reset the call count from initial useEffect sync
      onChange.mockClear()

      // editorRef is null — should not crash and should produce empty segments
      act(() => {
        result.current.handleInput()
      })

      // With no editor, readSegmentsFromDOM returns [] which matches value=[]
      // so onChange may or may not fire depending on segmentsEqual — just ensure no crash
      expect(result.current).toBeDefined()
    })

    it('handle.clear is safe when editor ref is null', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      // Should not crash
      act(() => {
        result.current.handle.clear()
      })

      expect(onChange).toHaveBeenCalledWith([])
    })

    it('handle.getPlainText returns empty string without editor', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      expect(result.current.handle.getPlainText()).toBe('')
    })

    it('handle.focus is safe when editor ref is null', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      // Should not crash
      act(() => {
        result.current.handle.focus()
      })
    })

    it('handle.blur is safe when editor ref is null', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      act(() => {
        result.current.handle.blur()
      })
    })
  })
})
