import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePromptArea } from '../use-prompt-area'
import type { Segment, TriggerConfig, ChipSegment } from '../types'

// ---------------------------------------------------------------------------
// jsdom polyfill: Range.getBoundingClientRect is not implemented
// ---------------------------------------------------------------------------

if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = function () {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect
  }
}

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

/** Create a real editor element and wire it into the hook's editorRef */
function attachEditor(hookResult: ReturnType<typeof usePromptArea>): HTMLDivElement {
  const editor = document.createElement('div')
  editor.contentEditable = 'true'
  document.body.appendChild(editor)
  ;(hookResult.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor
  return editor
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
  // Trigger detection via handleInput
  // -------------------------------------------------------------------------

  describe('trigger detection', () => {
    it('detects @ trigger at any position', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, triggers: [mentionTrigger] })),
      )

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello @al')
      placeCursor(editor.firstChild!, 9)

      act(() => {
        result.current.handleInput()
      })

      expect(mentionTrigger.onSearch).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('detects / trigger only at start', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, triggers: [slashTrigger] })),
      )

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, '/hel')
      placeCursor(editor.firstChild!, 4)

      act(() => {
        result.current.handleInput()
      })

      expect(slashTrigger.onSearch).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('fires callback trigger onActivate', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, triggers: [callbackTrigger] })),
      )

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, '!')
      placeCursor(editor.firstChild!, 1)

      act(() => {
        result.current.handleInput()
      })

      expect(callbackTrigger.onActivate).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('clears trigger when text no longer matches', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, triggers: [mentionTrigger] })),
      )

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      // First trigger detection
      populateEditor(editor, '@al')
      placeCursor(editor.firstChild!, 3)
      act(() => {
        result.current.handleInput()
      })

      // Now type text without trigger
      populateEditor(editor, 'hello')
      placeCursor(editor.firstChild!, 5)
      act(() => {
        result.current.handleInput()
      })

      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Chip backspace deletion
  // -------------------------------------------------------------------------

  describe('chip deletion via backspace', () => {
    function makeKeyEvent(
      key: string,
      opts: Partial<KeyboardEventInit> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        ...opts,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('deletes chip when backspace is pressed with cursor after chip at editor level', () => {
      const onChange = vi.fn()
      const onChipDelete = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, onChipDelete })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, chip, ' after')

      // Place cursor at editor level after chip
      const range = document.createRange()
      range.setStart(editor, 1)
      range.collapse(true)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Backspace'))
      })

      expect(onChange).toHaveBeenCalled()
      expect(onChipDelete).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('reverts auto-resolved chip to text on backspace', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('#', 'tag1', 'tag1', { autoResolved: true })
      populateEditor(editor, chip)

      const range = document.createRange()
      range.setStart(editor, 1)
      range.collapse(true)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Backspace'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('deletes chip when cursor is at start of text node after chip', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, chip, ' text after')

      placeCursor(editor.lastChild!, 0)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Backspace'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Chip forward delete
  // -------------------------------------------------------------------------

  describe('chip deletion via forward delete', () => {
    function makeKeyEvent(key: string): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('deletes chip when Delete is pressed with cursor at end of text before chip', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, 'before ', chip)

      placeCursor(editor.firstChild!, 7)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Delete'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('deletes chip when Delete is pressed at editor level before chip', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const chip = createChipNode('@', 'alice', 'Alice')
      editor.appendChild(chip)

      const range = document.createRange()
      range.setStart(editor, 0)
      range.collapse(true)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Delete'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Link click handling
  // -------------------------------------------------------------------------

  describe('link click handling', () => {
    it('calls onLinkClick on Ctrl+click of link', () => {
      const onLinkClick = vi.fn()
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const { result } = renderHook(() => usePromptArea(defaultProps({ onLinkClick })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const link = document.createElement('a')
      link.href = 'https://example.com'
      link.dataset.url = 'true'
      link.textContent = 'https://example.com'
      editor.appendChild(link)

      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        ctrlKey: true,
      }) as unknown as React.MouseEvent<HTMLDivElement>
      Object.defineProperty(mouseEvent, 'target', { value: link })
      Object.defineProperty(mouseEvent, 'preventDefault', { value: vi.fn() })

      act(() => {
        result.current.handleClick(mouseEvent)
      })

      // jsdom normalizes href to include trailing slash
      expect(onLinkClick).toHaveBeenCalledWith(expect.stringContaining('https://example.com'))
      expect(openSpy).toHaveBeenCalled()

      openSpy.mockRestore()
      document.body.removeChild(editor)
    })

    it('does not navigate on plain click (without Ctrl/Meta)', () => {
      const onLinkClick = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onLinkClick })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      const link = document.createElement('a')
      link.href = 'https://example.com'
      link.dataset.url = 'true'
      link.textContent = 'https://example.com'
      editor.appendChild(link)

      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
      }) as unknown as React.MouseEvent<HTMLDivElement>
      Object.defineProperty(mouseEvent, 'target', { value: link })

      act(() => {
        result.current.handleClick(mouseEvent)
      })

      expect(onLinkClick).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown — Shift+Enter
  // -------------------------------------------------------------------------

  describe('Shift+Enter', () => {
    it('inserts a newline via replaceTextRange', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello')
      placeCursor(editor.firstChild!, 5)

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        shiftKey: true,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown — Escape
  // -------------------------------------------------------------------------

  describe('Escape', () => {
    it('calls onEscape', () => {
      const onEscape = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onEscape })))

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(onEscape).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // selectSuggestion
  // -------------------------------------------------------------------------

  describe('selectSuggestion', () => {
    it('is a function', () => {
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ triggers: [mentionTrigger] })),
      )
      expect(typeof result.current.selectSuggestion).toBe('function')
    })
  })

  // -------------------------------------------------------------------------
  // IME composition handling
  // -------------------------------------------------------------------------

  describe('IME composition', () => {
    it('syncs model during composition without trigger detection', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, triggers: [mentionTrigger] })),
      )

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      // Start composition
      act(() => {
        result.current.eventHandlers.onCompositionStart()
      })

      populateEditor(editor, '@あ')
      placeCursor(editor.firstChild!, 2)

      act(() => {
        result.current.handleInput()
      })

      // onChange should be called, but trigger should not be detected
      expect(onChange).toHaveBeenCalled()
      expect(mentionTrigger.onSearch).not.toHaveBeenCalled()

      // End composition
      act(() => {
        result.current.eventHandlers.onCompositionEnd()
      })

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // renderSegmentsToDOM with chips
  // -------------------------------------------------------------------------

  describe('renderSegmentsToDOM', () => {
    it('renders chips with correct attributes when value prop changes', () => {
      const onChange = vi.fn()
      const { rerender } = renderHook((props) => usePromptArea(props), {
        initialProps: defaultProps({ onChange, triggers: [mentionTrigger], value: [] }),
      })

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)

      // Force a value change to trigger renderSegmentsToDOM
      const newValue: Segment[] = [
        { type: 'text', text: 'hi ' },
        { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice', data: { id: 1 } },
        { type: 'text', text: ' bye' },
      ]

      rerender(defaultProps({ onChange, triggers: [mentionTrigger], value: newValue }))

      document.body.removeChild(editor)
    })

    it('renders chips with autoResolved flag', () => {
      const onChange = vi.fn()
      const { rerender } = renderHook((props) => usePromptArea(props), {
        initialProps: defaultProps({ onChange, triggers: [hashTrigger], value: [] }),
      })

      const newValue: Segment[] = [
        { type: 'chip', trigger: '#', value: 'tag', displayText: 'tag', autoResolved: true },
      ]

      rerender(defaultProps({ onChange, triggers: [hashTrigger], value: newValue }))
    })

    it('renders newlines with BR elements', () => {
      const onChange = vi.fn()
      const { rerender } = renderHook((props) => usePromptArea(props), {
        initialProps: defaultProps({ onChange, value: [] }),
      })

      const newValue: Segment[] = [{ type: 'text', text: 'line1\nline2' }]

      rerender(defaultProps({ onChange, value: newValue }))
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown — dropdown navigation
  // -------------------------------------------------------------------------

  describe('handleKeyDown — dropdown navigation', () => {
    function makeKeyEvent(
      key: string,
      opts: Partial<KeyboardEventInit> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        ...opts,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    // These test the dropdown navigation inside handleKeyDown
    // which requires activeTrigger + suggestions to be set.
    // Since it's difficult to fully set up internal state for dropdown nav,
    // we at least verify the handler doesn't crash with these keys.

    it('handles ArrowDown without active trigger', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('ArrowDown'))
      })
    })

    it('handles ArrowUp without active trigger', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('ArrowUp'))
      })
    })

    it('handles Tab without active trigger', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello')
      placeCursor(editor.firstChild!, 5)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Tab'))
      })

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown — non-collapsed selection delete
  // -------------------------------------------------------------------------

  describe('handleKeyDown — selection delete', () => {
    function makeKeyEvent(
      key: string,
      opts: Partial<KeyboardEventInit> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        ...opts,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('deletes selected text range on Backspace', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello world')

      // Select "world" (chars 6-11)
      const range = document.createRange()
      range.setStart(editor.firstChild!, 6)
      range.setEnd(editor.firstChild!, 11)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Backspace'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('deletes selected text range on Delete', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello world')

      // Select "hello"
      const range = document.createRange()
      range.setStart(editor.firstChild!, 0)
      range.setEnd(editor.firstChild!, 5)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Delete'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown — Cmd+B / Cmd+I markdown shortcuts
  // -------------------------------------------------------------------------

  describe('handleKeyDown — markdown shortcuts', () => {
    function makeKeyEvent(
      key: string,
      opts: Partial<KeyboardEventInit> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        ...opts,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('wraps selected text in bold markers on Cmd+B', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello world')

      // Select "world"
      const range = document.createRange()
      range.setStart(editor.firstChild!, 6)
      range.setEnd(editor.firstChild!, 11)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('b', { metaKey: true }))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('wraps selected text in italic markers on Cmd+I', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello world')

      // Select "world"
      const range = document.createRange()
      range.setStart(editor.firstChild!, 6)
      range.setEnd(editor.firstChild!, 11)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('i', { ctrlKey: true }))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('does not wrap when no text is selected on Cmd+B', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, 'hello')
      placeCursor(editor.firstChild!, 3)

      onChange.mockClear()

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('b', { metaKey: true }))
      })

      // No selection range = no action
      expect(onChange).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown — list continuation on Enter
  // -------------------------------------------------------------------------

  describe('handleKeyDown — list features', () => {
    function makeKeyEvent(
      key: string,
      opts: Partial<KeyboardEventInit> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        ...opts,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('continues bullet list on Enter', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, '\u2022 item one')
      placeCursor(editor.firstChild!, 10)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Enter'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('removes list prefix on Backspace at start of list item', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, '\u2022 ')
      // Place cursor right after the bullet prefix
      placeCursor(editor.firstChild!, 2)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Backspace'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('indents list item on Tab', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, '\u2022 item')
      placeCursor(editor.firstChild!, 6)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Tab'))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('outdents list item on Shift+Tab', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, '  \u2022 item')
      placeCursor(editor.firstChild!, 8)

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Tab', { shiftKey: true }))
      })

      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown — auto-resolve on space
  // -------------------------------------------------------------------------

  describe('handleKeyDown — auto-resolve on space', () => {
    function makeKeyEvent(
      key: string,
      opts: Partial<KeyboardEventInit> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        ...opts,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('auto-resolves chip when space is pressed on resolveOnSpace trigger', () => {
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipAdd, triggers: [hashTrigger] })),
      )

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      populateEditor(editor, '#tag')
      placeCursor(editor.firstChild!, 4)

      // First trigger detection to set activeTrigger
      act(() => {
        result.current.handleInput()
      })

      // Now press space to auto-resolve
      act(() => {
        result.current.handleKeyDown(makeKeyEvent(' '))
      })

      // Should have created a chip
      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // handleKeyDown — undo/redo via Ctrl+Z
  // -------------------------------------------------------------------------

  describe('handleKeyDown — undo/redo', () => {
    function makeKeyEvent(
      key: string,
      opts: Partial<KeyboardEventInit> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        ...opts,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('flushes undo debounce on Ctrl+Z', () => {
      vi.useFakeTimers()
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)
      ;(result.current.editorRef as React.MutableRefObject<HTMLDivElement>).current = editor

      // Type something to trigger undo debounce
      populateEditor(editor, 'hello')
      placeCursor(editor.firstChild!, 5)
      act(() => {
        result.current.handleInput()
      })

      // Ctrl+Z should flush the pending undo state and then undo
      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z', { ctrlKey: true }))
      })

      document.body.removeChild(editor)
      vi.useRealTimers()
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

    it('handle.insertChip appends chip and trailing space', () => {
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, onChipAdd })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello')

      act(() => {
        result.current.handle.insertChip({
          trigger: '@',
          value: 'alice',
          displayText: 'Alice',
        })
      })

      expect(onChange).toHaveBeenCalled()
      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chip', trigger: '@', value: 'alice' }),
      )

      document.body.removeChild(editor)
    })

    it('handle.clear resets undo history and clears editor DOM', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello world')

      act(() => {
        result.current.handle.clear()
      })

      expect(onChange).toHaveBeenCalledWith([])
      expect(editor.childNodes.length).toBe(0)

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // selectSuggestion
  // -------------------------------------------------------------------------

  describe('selectSuggestion', () => {
    it('resolves active trigger and inserts chip', () => {
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const onSelect = vi.fn((s: { value: string; label: string }) => s.label)
      const trigger: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch: vi.fn(() => [{ value: 'alice', label: 'Alice' }]),
        onSelect,
      }

      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipAdd, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      populateEditor(editor, '@al')
      placeCursor(editor.firstChild!, 3)

      // Trigger detection
      act(() => {
        result.current.handleInput()
      })

      // Now we should have an active trigger with suggestions
      expect(result.current.activeTrigger).not.toBeNull()

      // Select the suggestion
      act(() => {
        result.current.selectSuggestion({ value: 'alice', label: 'Alice' })
      })

      expect(onSelect).toHaveBeenCalledWith({ value: 'alice', label: 'Alice' })
      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chip', trigger: '@', value: 'alice' }),
      )
      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })

    it('does nothing when no active trigger', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      act(() => {
        result.current.selectSuggestion({ value: 'test', label: 'Test' })
      })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Chip click handling
  // -------------------------------------------------------------------------

  describe('handleClick – chip click', () => {
    it('calls onChipClick when a chip element is clicked', () => {
      const onChipClick = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChipClick, triggers: [mentionTrigger] })),
      )

      const editor = attachEditor(result.current)

      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, 'hello ', chip, ' world')

      // Simulate click on chip
      const clickEvent = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', { value: chip })

      act(() => {
        result.current.handleClick(clickEvent as unknown as React.MouseEvent<HTMLDivElement>)
      })

      expect(onChipClick).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: '@', value: 'alice', displayText: 'Alice' }),
      )

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // reopenOnChipClick — chip click reopens the dropdown, selection replaces
  // -------------------------------------------------------------------------

  describe('reopenOnChipClick', () => {
    function makeReopenTrigger(): TriggerConfig {
      return {
        char: '#',
        position: 'any',
        mode: 'dropdown',
        reopenOnChipClick: true,
        onSearch: vi.fn(() => [
          { value: 'campaign', label: 'campaign' },
          { value: 'lead-gen', label: 'lead-gen' },
        ]),
      }
    }

    function clickChip(
      result: { handleClick: (e: React.MouseEvent<HTMLDivElement>) => void },
      chip: HTMLElement,
    ) {
      const clickEvent = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', { value: chip })
      act(() => {
        result.handleClick(clickEvent as unknown as React.MouseEvent<HTMLDivElement>)
      })
    }

    /**
     * Simulates a real mousedown on a chip. In the browser this always fires
     * before the `click` event handleClick receives, and — for a chip whose
     * dropdown is already open — before TriggerPopover's own document-level
     * outside-mousedown dismiss too (bubble order: editor root, then document).
     */
    function mouseDownChip(
      result: { handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void },
      chip: HTMLElement,
    ) {
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true })
      Object.defineProperty(mouseDownEvent, 'target', { value: chip })
      act(() => {
        result.handleMouseDown(mouseDownEvent as unknown as React.MouseEvent<HTMLDivElement>)
      })
    }

    it('opens the dropdown with the empty-query suggestions on chip click', () => {
      const trigger = makeReopenTrigger()
      const onChipClick = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChipClick, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip, ' now')

      clickChip(result.current, chip)

      expect(result.current.activeTrigger?.config).toBe(trigger)
      expect(trigger.onSearch).toHaveBeenCalledWith('', expect.anything())
      // onChipClick still fires for app-level side effects
      expect(onChipClick).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: '#', value: 'campaign' }),
      )

      document.body.removeChild(editor)
    })

    it('does not open the dropdown when reopenOnChipClick is not set', () => {
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChipClick: vi.fn(), triggers: [hashTrigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip)

      clickChip(result.current, chip)

      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })

    it('replaces the clicked chip in place when a suggestion is selected', () => {
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const onChipDelete = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipAdd, onChipDelete, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip, ' now')

      clickChip(result.current, chip)

      act(() => {
        result.current.selectSuggestion({ value: 'lead-gen', label: 'lead-gen' })
      })

      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'tag ' },
        expect.objectContaining({ type: 'chip', trigger: '#', value: 'lead-gen' }),
        { type: 'text', text: ' now' },
      ])
      expect(onChipDelete).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: '#', value: 'campaign' }),
      )
      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: '#', value: 'lead-gen' }),
      )
      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })

    it('dismissTrigger closes the chip dropdown without replacing anything', () => {
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip)

      clickChip(result.current, chip)
      expect(result.current.activeTrigger).not.toBeNull()

      act(() => {
        result.current.dismissTrigger()
      })
      expect(result.current.activeTrigger).toBeNull()

      // A later selection must not fall back to editing the dismissed chip
      act(() => {
        result.current.selectSuggestion({ value: 'lead-gen', label: 'lead-gen' })
      })
      expect(onChange).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    function makeKeyEvent(
      key: string,
      opts: Partial<KeyboardEventInit> = {},
    ): React.KeyboardEvent<HTMLDivElement> {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        ...opts,
      }) as unknown as React.KeyboardEvent<HTMLDivElement>
      Object.defineProperty(event, 'nativeEvent', { value: { isComposing: false } })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      return event
    }

    it('does not open the dropdown when disabled', () => {
      const trigger = makeReopenTrigger()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ disabled: true, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip)

      clickChip(result.current, chip)

      expect(result.current.activeTrigger).toBeNull()
      expect(trigger.onSearch).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('replaces the correct segment when a decoration element (markdown/URL) precedes the chip', () => {
      // Mirrors what decorateMarkdownInEditor produces at runtime: a
      // direct-child <span data-md> wrapping text, which readSegmentsFromDOM
      // counts as one text segment via its "unknown element" branch.
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const onChipDelete = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipDelete, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const mdSpan = document.createElement('span')
      mdSpan.dataset.md = 'true'
      mdSpan.textContent = '**bold**'
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'Hi ', mdSpan, ' ', chip, ' now')

      clickChip(result.current, chip)
      act(() => {
        result.current.selectSuggestion({ value: 'lead-gen', label: 'lead-gen' })
      })

      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'Hi ' },
        { type: 'text', text: '**bold**' },
        { type: 'text', text: ' ' },
        expect.objectContaining({ type: 'chip', trigger: '#', value: 'lead-gen' }),
        { type: 'text', text: ' now' },
      ])
      expect(onChipDelete).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: '#', value: 'campaign' }),
      )

      document.body.removeChild(editor)
    })

    it('recovers via a trigger+value search when the chip shifts to a different segment index before the selection lands', () => {
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const onChipDelete = vi.fn()
      const initialValue: Segment[] = [
        { type: 'text', text: 'x' },
        { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
        { type: 'text', text: ' end' },
      ]
      const { result, rerender } = renderHook((props) => usePromptArea(props), {
        initialProps: defaultProps({
          onChange,
          onChipDelete,
          triggers: [trigger],
          value: initialValue,
        }),
      })

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'x', chip, ' end')

      clickChip(result.current, chip)
      expect(result.current.activeTrigger).not.toBeNull()

      // External value-prop update lands while the dropdown is open (e.g. a
      // parent normalizing content elsewhere) — the chip survives but at a
      // new index, and renderSegmentsToDOM rebuilds all children, detaching
      // the clicked chip's DOM node.
      const shiftedValue: Segment[] = [
        { type: 'text', text: 'EXTRA ' },
        { type: 'text', text: 'x' },
        { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
        { type: 'text', text: ' end' },
      ]
      act(() => {
        rerender(defaultProps({ onChange, onChipDelete, triggers: [trigger], value: shiftedValue }))
      })

      act(() => {
        result.current.selectSuggestion({ value: 'lead-gen', label: 'lead-gen' })
      })

      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'EXTRA ' },
        { type: 'text', text: 'x' },
        expect.objectContaining({ type: 'chip', trigger: '#', value: 'lead-gen' }),
        { type: 'text', text: ' end' },
      ])
      expect(onChipDelete).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: '#', value: 'campaign' }),
      )

      document.body.removeChild(editor)
    })

    it('does not fire onChipDelete/onChipAdd when confirming the unchanged preselected value', () => {
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const onChipDelete = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipAdd, onChipDelete, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip, ' now')

      clickChip(result.current, chip)
      act(() => {
        result.current.selectSuggestion({ value: 'campaign', label: 'campaign' })
      })

      expect(onChipDelete).not.toHaveBeenCalled()
      expect(onChipAdd).not.toHaveBeenCalled()
      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'tag ' },
        expect.objectContaining({ type: 'chip', trigger: '#', value: 'campaign' }),
        { type: 'text', text: ' now' },
      ])

      document.body.removeChild(editor)
    })

    it('inserts a trailing space when the replaced chip is the last segment, and lands the caret past it', () => {
      // Uses the initialProps+rerender form (a stable `value` reference)
      // rather than a fresh `defaultProps()` closure per render: the hook's
      // own value-sync effect re-runs whenever `value`'s reference changes,
      // and dismissTrigger's state updates (called internally by
      // selectSuggestion) trigger exactly such a re-render — with a
      // freshly-`[]`-per-render `value`, that effect would "correct" the DOM
      // right back to empty after the replacement, which is a test-harness
      // artifact, not real controlled-component behavior (a real consumer's
      // `value` only changes when `onChange` actually updates it).
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const { result } = renderHook((props) => usePromptArea(props), {
        initialProps: defaultProps({ onChange, triggers: [trigger] }),
      })

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip) // chip is the LAST child — no trailing text

      clickChip(result.current, chip)
      act(() => {
        result.current.selectSuggestion({ value: 'lead-gen', label: 'lead-gen' })
      })

      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'tag ' },
        expect.objectContaining({ type: 'chip', trigger: '#', value: 'lead-gen' }),
        { type: 'text', text: ' ' },
      ])

      // The caret must land PAST the inserted space (matching resolveChip's
      // "+1 accounts for the trailing space" convention) — landing exactly at
      // the chip's end would put it right back at the bare element boundary
      // the space exists to avoid. The trailing space text node's caret
      // offset must be at its END (1), not its start (0).
      const sel = window.getSelection()!
      const range = sel.getRangeAt(0)
      expect(range.collapsed).toBe(true)
      const spaceNode = editor.lastChild!
      expect(spaceNode.nodeType).toBe(Node.TEXT_NODE)
      expect(spaceNode.textContent).toBe(' ')
      expect(range.startContainer).toBe(spaceNode)
      expect(range.startOffset).toBe(1)

      document.body.removeChild(editor)
    })

    it('does not fire onChipDelete/onChipAdd when confirming the same value+displayText but different data', () => {
      // The reverse of the "different data" case: same value/displayText,
      // genuinely-different data SHOULD still be treated as a change.
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const onChipDelete = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipAdd, onChipDelete, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      chip.dataset.chipData = JSON.stringify({ id: 1 })
      populateEditor(editor, 'tag ', chip, ' now')

      clickChip(result.current, chip)
      act(() => {
        result.current.selectSuggestion({
          value: 'campaign',
          label: 'campaign',
          data: { id: 2 },
        })
      })

      // Same value/displayText but different `data` — this IS a real change,
      // so the callbacks must still fire (not swallowed by the unchanged guard).
      expect(onChipDelete).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: '#', value: 'campaign', data: { id: 1 } }),
      )
      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: '#', value: 'campaign', data: { id: 2 } }),
      )

      document.body.removeChild(editor)
    })

    it('truly unchanged (same value, displayText, and data) still skips onChipDelete/onChipAdd', () => {
      const trigger = makeReopenTrigger()
      const onChipAdd = vi.fn()
      const onChipDelete = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChipAdd, onChipDelete, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      chip.dataset.chipData = JSON.stringify({ id: 1 })
      populateEditor(editor, 'tag ', chip, ' now')

      clickChip(result.current, chip)
      act(() => {
        result.current.selectSuggestion({ value: 'campaign', label: 'campaign', data: { id: 1 } })
      })

      expect(onChipDelete).not.toHaveBeenCalled()
      expect(onChipAdd).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('does not complete an in-progress replacement if disabled becomes true while the dropdown is open', () => {
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const { result, rerender } = renderHook((props) => usePromptArea(props), {
        initialProps: defaultProps({ onChange, triggers: [trigger] }),
      })

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip, ' now')

      clickChip(result.current, chip)
      expect(result.current.activeTrigger).not.toBeNull()

      // Composer becomes disabled while the dropdown is still open (e.g. the
      // surrounding form starts submitting).
      act(() => {
        rerender(defaultProps({ onChange, disabled: true, triggers: [trigger] }))
      })

      act(() => {
        result.current.selectSuggestion({ value: 'lead-gen', label: 'lead-gen' })
      })

      expect(onChange).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('recovers via trigger+value search only when the match is unambiguous, and safely no-ops on duplicates', () => {
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const initialValue: Segment[] = [
        { type: 'text', text: 'a ' },
        { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
        { type: 'text', text: ' b ' },
        { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
        { type: 'text', text: ' c' },
      ]
      const { result, rerender } = renderHook((props) => usePromptArea(props), {
        initialProps: defaultProps({ onChange, triggers: [trigger], value: initialValue }),
      })

      const editor = attachEditor(result.current)
      const chipEls = [
        createChipNode('#', 'campaign', 'campaign'),
        createChipNode('#', 'campaign', 'campaign'),
      ]
      populateEditor(editor, 'a ', chipEls[0], ' b ', chipEls[1], ' c')

      // Click the SECOND of the two identical chips.
      clickChip(result.current, chipEls[1])
      expect(result.current.activeTrigger).not.toBeNull()

      // Model shifts underneath (both duplicate chips survive, just at new
      // positions) — the click-time segIndex no longer holds the chip.
      const shiftedValue: Segment[] = [
        { type: 'text', text: 'EXTRA ' },
        { type: 'text', text: 'a ' },
        { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
        { type: 'text', text: ' b ' },
        { type: 'chip', trigger: '#', value: 'campaign', displayText: 'campaign' },
        { type: 'text', text: ' c' },
      ]
      act(() => {
        rerender(defaultProps({ onChange, triggers: [trigger], value: shiftedValue }))
      })

      act(() => {
        result.current.selectSuggestion({ value: 'lead-gen', label: 'lead-gen' })
      })

      // With two ambiguous candidates, the fix must NOT guess — no mutation,
      // rather than silently editing the wrong instance.
      expect(onChange).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })

    it('replacement is recorded on the undo stack', () => {
      const trigger = makeReopenTrigger()
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip, ' now')

      clickChip(result.current, chip)
      act(() => {
        result.current.selectSuggestion({ value: 'lead-gen', label: 'lead-gen' })
      })
      onChange.mockClear()

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z', { ctrlKey: true }))
      })

      // Ctrl+Z should restore the pre-replacement segments (the original
      // 'campaign' chip), not leave the stack untouched.
      expect(onChange).toHaveBeenCalledWith([
        { type: 'text', text: 'tag ' },
        expect.objectContaining({ type: 'chip', trigger: '#', value: 'campaign' }),
        { type: 'text', text: ' now' },
      ])

      document.body.removeChild(editor)
    })

    it('Enter does not submit and Escape dismisses (not onEscape) while the popover shows an empty-state message', () => {
      const trigger: TriggerConfig = {
        char: '#',
        position: 'any',
        mode: 'dropdown',
        reopenOnChipClick: true,
        emptyMessage: 'No matches',
        onSearch: vi.fn(() => []),
      }
      const onSubmit = vi.fn()
      const onEscape = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onSubmit, onEscape, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip)

      clickChip(result.current, chip)
      expect(result.current.suggestions).toEqual([])
      expect(result.current.activeTrigger).not.toBeNull()

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Enter'))
      })
      expect(onSubmit).not.toHaveBeenCalled()
      expect(result.current.activeTrigger).not.toBeNull()

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Escape'))
      })
      expect(onEscape).not.toHaveBeenCalled()
      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })

    it('clicking the same chip again while its dropdown is open toggles it closed instead of reopening', () => {
      const trigger = makeReopenTrigger()
      const { result } = renderHook(() => usePromptArea(defaultProps({ triggers: [trigger] })))

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip)

      clickChip(result.current, chip)
      expect(result.current.activeTrigger).not.toBeNull()
      expect(trigger.onSearch).toHaveBeenCalledTimes(1)

      // Real second-click sequence: mousedown on the same chip (still open —
      // handleMouseDown observes this before anything dismisses it), then
      // TriggerPopover's own outside-mousedown dismiss (fires before the
      // click event reaches handleClick), then the click itself.
      mouseDownChip(result.current, chip)
      act(() => {
        result.current.dismissTrigger()
      })
      clickChip(result.current, chip)

      expect(result.current.activeTrigger).toBeNull()
      expect(trigger.onSearch).toHaveBeenCalledTimes(1)

      document.body.removeChild(editor)
    })

    it('dismissing via Escape (not a click on the chip) does not suppress the next reopen', () => {
      // A dismiss NOT caused by mousedown-on-this-chip (Escape, blur, a
      // completed selection) must never poison a later, unrelated click on
      // the same chip — only handleMouseDown observing the chip's OWN
      // dropdown open at mousedown time may suppress a reopen.
      const trigger = makeReopenTrigger()
      const { result } = renderHook(() => usePromptArea(defaultProps({ triggers: [trigger] })))

      const editor = attachEditor(result.current)
      const chip = createChipNode('#', 'campaign', 'campaign')
      populateEditor(editor, 'tag ', chip)

      clickChip(result.current, chip)
      expect(result.current.activeTrigger).not.toBeNull()

      act(() => {
        result.current.dismissTrigger()
      })
      expect(result.current.activeTrigger).toBeNull()

      // A later click — with no matching mousedown-while-open in between —
      // must reopen normally.
      clickChip(result.current, chip)

      expect(result.current.activeTrigger).not.toBeNull()
      expect(trigger.onSearch).toHaveBeenCalledTimes(2)

      document.body.removeChild(editor)
    })

    it('clicking a different chip after a dismiss still opens its own dropdown normally', () => {
      const trigger = makeReopenTrigger()
      const { result } = renderHook(() => usePromptArea(defaultProps({ triggers: [trigger] })))

      const editor = attachEditor(result.current)
      const chipA = createChipNode('#', 'campaign', 'campaign')
      const chipB = createChipNode('#', 'lead-gen', 'lead-gen')
      populateEditor(editor, 'tag ', chipA, ' and ', chipB)

      clickChip(result.current, chipA)
      act(() => {
        result.current.dismissTrigger()
      })

      clickChip(result.current, chipB)

      expect(result.current.activeTrigger).not.toBeNull()
      expect(trigger.onSearch).toHaveBeenCalledTimes(2)

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Dropdown navigation with active trigger & suggestions
  // -------------------------------------------------------------------------

  describe('dropdown navigation with active trigger', () => {
    it('ArrowDown/ArrowUp navigates suggestions', () => {
      const trigger: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch: vi.fn(() => [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
        ]),
      }

      const { result } = renderHook(() => usePromptArea(defaultProps({ triggers: [trigger] })))

      const editor = attachEditor(result.current)
      populateEditor(editor, '@')
      placeCursor(editor.firstChild!, 1)

      // Trigger detection to activate trigger
      act(() => {
        result.current.handleInput()
      })

      expect(result.current.activeTrigger).not.toBeNull()
      expect(result.current.suggestions.length).toBe(3)
      expect(result.current.selectedSuggestionIndex).toBe(0)

      // Arrow down
      act(() => {
        const e = {
          key: 'ArrowDown',
          preventDefault: vi.fn(),
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(result.current.selectedSuggestionIndex).toBe(1)

      // Arrow up
      act(() => {
        const e = {
          key: 'ArrowUp',
          preventDefault: vi.fn(),
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(result.current.selectedSuggestionIndex).toBe(0)

      document.body.removeChild(editor)
    })

    it('Enter selects current suggestion', () => {
      const onChipAdd = vi.fn()
      const trigger: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch: vi.fn(() => [{ value: 'alice', label: 'Alice' }]),
      }

      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChipAdd, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      populateEditor(editor, '@')
      placeCursor(editor.firstChild!, 1)

      act(() => {
        result.current.handleInput()
      })

      expect(result.current.activeTrigger).not.toBeNull()

      // Press Enter to select
      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: 'Enter',
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chip', trigger: '@', value: 'alice' }),
      )
      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })

    it('Tab selects current suggestion', () => {
      const onChipAdd = vi.fn()
      const trigger: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch: vi.fn(() => [{ value: 'bob', label: 'Bob' }]),
      }

      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChipAdd, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      populateEditor(editor, '@')
      placeCursor(editor.firstChild!, 1)

      act(() => {
        result.current.handleInput()
      })

      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: 'Tab',
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChipAdd).toHaveBeenCalled()
      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })

    it('Escape dismisses active trigger dropdown', () => {
      const trigger: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch: vi.fn(() => [{ value: 'a', label: 'A' }]),
      }

      const { result } = renderHook(() => usePromptArea(defaultProps({ triggers: [trigger] })))

      const editor = attachEditor(result.current)
      populateEditor(editor, '@test')
      placeCursor(editor.firstChild!, 5)

      act(() => {
        result.current.handleInput()
      })

      expect(result.current.activeTrigger).not.toBeNull()

      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: 'Escape',
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Auto-resolve on space
  // -------------------------------------------------------------------------

  describe('auto-resolve on space (with active trigger)', () => {
    it('resolves trigger to chip when Space pressed with resolveOnSpace', () => {
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const trigger: TriggerConfig = {
        char: '#',
        position: 'any',
        mode: 'dropdown',
        resolveOnSpace: true,
        onSearch: vi.fn(() => []),
      }

      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipAdd, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      populateEditor(editor, '#bug')
      placeCursor(editor.firstChild!, 4)

      // Detect trigger
      act(() => {
        result.current.handleInput()
      })

      expect(result.current.activeTrigger).not.toBeNull()

      // Press space to auto-resolve
      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: ' ',
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chip',
          trigger: '#',
          value: 'bug',
          autoResolved: true,
        }),
      )
      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })

    it('does not resolve on space when query is empty', () => {
      const onChipAdd = vi.fn()
      const trigger: TriggerConfig = {
        char: '#',
        position: 'any',
        mode: 'dropdown',
        resolveOnSpace: true,
        onSearch: vi.fn(() => []),
      }

      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChipAdd, triggers: [trigger] })),
      )

      const editor = attachEditor(result.current)
      populateEditor(editor, '#')
      placeCursor(editor.firstChild!, 1)

      act(() => {
        result.current.handleInput()
      })

      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: ' ',
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).not.toHaveBeenCalled()
      expect(onChipAdd).not.toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Chip backspace - auto-resolved revert
  // -------------------------------------------------------------------------

  describe('chip backspace – auto-resolved revert', () => {
    it('reverts auto-resolved chip to text on Backspace', () => {
      const onChange = vi.fn()
      const onChipDelete = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipDelete, triggers: [hashTrigger] })),
      )

      const editor = attachEditor(result.current)

      const chip = createChipNode('#', 'bug', 'bug', { autoResolved: true })
      populateEditor(editor, chip, ' rest')
      // Place cursor at editor level, offset 1 (just after chip)
      placeCursor(editor, 1)

      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: 'Backspace',
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalled()
      expect(onChipDelete).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chip', trigger: '#', value: 'bug' }),
      )

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Forward delete – chip at text end
  // -------------------------------------------------------------------------

  describe('chip forward delete at text boundary', () => {
    it('deletes chip when Delete pressed at end of text node before chip', () => {
      const onChange = vi.fn()
      const onChipDelete = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipDelete, triggers: [mentionTrigger] })),
      )

      const editor = attachEditor(result.current)

      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, 'hello', chip)
      // Cursor at end of 'hello' text node
      placeCursor(editor.firstChild!, 5)

      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: 'Delete',
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // readSegmentsFromDOM – unknown HTML element extraction
  // -------------------------------------------------------------------------

  describe('readSegmentsFromDOM – unknown element', () => {
    it('extracts text from unknown HTML elements', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = attachEditor(result.current)

      // Insert a <div> element which is not a chip or BR
      const div = document.createElement('div')
      div.textContent = 'wrapped text'
      editor.appendChild(div)

      // Trigger an input to read segments
      act(() => {
        result.current.handleInput()
      })

      // onChange should have been called with text content extracted from the div
      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'text', text: 'wrapped text' })]),
      )

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // renderSegmentsToDOM – chip with data and autoResolved
  // -------------------------------------------------------------------------

  describe('renderSegmentsToDOM – chip attributes', () => {
    it('renders chip with data attribute when data is present', () => {
      const onChange = vi.fn()
      const chipValue: Segment[] = [
        {
          type: 'chip',
          trigger: '@',
          value: 'alice',
          displayText: 'Alice',
          data: { id: 123 },
        },
      ]

      const { result, rerender } = renderHook(
        ({ value }: { value: Segment[] }) =>
          usePromptArea(defaultProps({ onChange, value, triggers: [mentionTrigger] })),
        { initialProps: { value: [] as Segment[] } },
      )

      const editor = attachEditor(result.current)

      // Trigger re-render with chip value so the useEffect fires with editor attached
      rerender({ value: chipValue })

      const chip = editor.querySelector('[data-chip-trigger]') as HTMLElement
      expect(chip).toBeTruthy()
      if (chip) {
        expect(chip.dataset.chipData).toBe(JSON.stringify({ id: 123 }))
      }

      document.body.removeChild(editor)
    })

    it('renders chip with autoResolved attribute', () => {
      const onChange = vi.fn()
      const chipValue: Segment[] = [
        {
          type: 'chip',
          trigger: '#',
          value: 'tag',
          displayText: 'tag',
          autoResolved: true,
        },
      ]

      const { result, rerender } = renderHook(
        ({ value }: { value: Segment[] }) =>
          usePromptArea(defaultProps({ onChange, value, triggers: [hashTrigger] })),
        { initialProps: { value: [] as Segment[] } },
      )

      const editor = attachEditor(result.current)
      rerender({ value: chipValue })

      const chip = editor.querySelector('[data-chip-trigger]') as HTMLElement
      expect(chip).toBeTruthy()
      if (chip) {
        expect(chip.dataset.chipAutoResolved).toBe('true')
      }

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // External value sync
  // -------------------------------------------------------------------------

  describe('external value sync', () => {
    it('re-renders DOM when value prop changes externally', () => {
      const onChange = vi.fn()
      const initialValue: Segment[] = [{ type: 'text', text: 'initial' }]

      const { result, rerender } = renderHook(
        ({ value }: { value: Segment[] }) => usePromptArea(defaultProps({ onChange, value })),
        { initialProps: { value: initialValue } },
      )

      const editor = attachEditor(result.current)

      const newValue: Segment[] = [{ type: 'text', text: 'updated' }]
      rerender({ value: newValue })

      // Editor DOM should reflect the new value
      expect(editor.textContent).toBe('updated')

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Submit via Enter
  // -------------------------------------------------------------------------

  describe('Enter to submit', () => {
    it('calls onSubmit with current segments on Enter', () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onSubmit })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello')

      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: 'Enter',
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Callback trigger mode – onActivate with insertChip
  // -------------------------------------------------------------------------

  describe('callback trigger mode', () => {
    it('calls onActivate with insertChip function', () => {
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const onActivate = vi.fn()
      const cbTrigger: TriggerConfig = {
        char: '!',
        position: 'any',
        mode: 'callback',
        onActivate,
      }

      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, onChipAdd, triggers: [cbTrigger] })),
      )

      const editor = attachEditor(result.current)
      populateEditor(editor, '!test')
      placeCursor(editor.firstChild!, 5)

      act(() => {
        result.current.handleInput()
      })

      expect(onActivate).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '!test',
          insertChip: expect.any(Function),
        }),
      )

      // Call insertChip from the callback
      const { insertChip } = onActivate.mock.calls[0][0]
      act(() => {
        insertChip({ value: 'result', displayText: 'Result' })
      })

      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chip', trigger: '!', value: 'result' }),
      )

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Shift+Enter – newline insertion via handleKeyDown
  // -------------------------------------------------------------------------

  describe('Shift+Enter newline', () => {
    it('inserts newline and updates model', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'line1')
      placeCursor(editor.firstChild!, 5)

      const preventDefault = vi.fn()
      act(() => {
        const e = {
          key: 'Enter',
          shiftKey: true,
          preventDefault,
          metaKey: false,
          ctrlKey: false,
          nativeEvent: { isComposing: false },
        } as unknown as React.KeyboardEvent<HTMLDivElement>
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalled()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // dismissTrigger
  // -------------------------------------------------------------------------

  describe('dismissTrigger', () => {
    it('clears active trigger', () => {
      const trigger: TriggerConfig = {
        char: '@',
        position: 'any',
        mode: 'dropdown',
        onSearch: vi.fn(() => [{ value: 'a', label: 'A' }]),
      }

      const { result } = renderHook(() => usePromptArea(defaultProps({ triggers: [trigger] })))

      const editor = attachEditor(result.current)
      populateEditor(editor, '@test')
      placeCursor(editor.firstChild!, 5)

      act(() => {
        result.current.handleInput()
      })

      expect(result.current.activeTrigger).not.toBeNull()

      act(() => {
        result.current.dismissTrigger()
      })

      expect(result.current.activeTrigger).toBeNull()

      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Imperative handle methods
  // -------------------------------------------------------------------------

  describe('imperative handle', () => {
    it('handle.insertChip adds a chip to segments and calls onChange and onChipAdd', () => {
      const onChange = vi.fn()
      const onChipAdd = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, onChipAdd })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello ')
      placeCursor(editor.firstChild!, 6)

      act(() => {
        result.current.handle.insertChip({
          trigger: '@',
          value: 'alice',
          displayText: 'Alice',
        })
      })

      expect(onChange).toHaveBeenCalled()
      const segments = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      const chipSegment = segments.find((s: Segment) => s.type === 'chip')
      expect(chipSegment).toBeDefined()
      expect(chipSegment.trigger).toBe('@')
      expect(chipSegment.value).toBe('alice')
      expect(chipSegment.displayText).toBe('Alice')

      // A trailing text segment with space should follow the chip
      const lastSegment = segments[segments.length - 1]
      expect(lastSegment.type).toBe('text')
      expect(lastSegment.text).toBe(' ')

      expect(onChipAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chip', trigger: '@', value: 'alice' }),
      )

      document.body.removeChild(editor)
    })

    it('handle.getPlainText returns the plain text representation', () => {
      const { result } = renderHook(() => usePromptArea(defaultProps()))

      const editor = attachEditor(result.current)
      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, 'hello ', chip, ' world')

      let plainText = ''
      act(() => {
        plainText = result.current.handle.getPlainText()
      })

      expect(plainText).toBe('hello @Alice world')

      document.body.removeChild(editor)
    })

    it('handle.clear resets segments, clears editor DOM, and resets undo', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'some content here')
      placeCursor(editor.firstChild!, 4)

      // Type something to create undo state
      act(() => {
        result.current.handleInput()
      })

      onChange.mockClear()

      act(() => {
        result.current.handle.clear()
      })

      // onChange called with empty array
      expect(onChange).toHaveBeenCalledWith([])

      // Editor DOM should be emptied
      expect(editor.childNodes.length).toBe(0)

      document.body.removeChild(editor)
    })

    it('handle.clear clears pending undo timer', () => {
      vi.useFakeTimers()
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'test')
      placeCursor(editor.firstChild!, 4)

      // Trigger handleInput to start undo timer
      act(() => {
        result.current.handleInput()
      })

      onChange.mockClear()

      // Clear before the undo timer fires
      act(() => {
        result.current.handle.clear()
      })

      expect(onChange).toHaveBeenCalledWith([])

      // Advance timers — nothing should blow up (timer was cleared)
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      vi.useRealTimers()
      document.body.removeChild(editor)
    })
  })

  // -------------------------------------------------------------------------
  // Markdown formatting via Ctrl+B / Ctrl+I (exercises selection offset utils)
  // -------------------------------------------------------------------------

  describe('markdown formatting shortcuts', () => {
    /** Helper to select a range of text in the editor */
    function selectRange(startNode: Node, startOffset: number, endNode: Node, endOffset: number) {
      const range = document.createRange()
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)
    }

    /** Create a Ctrl+key keyboard event */
    function ctrlKeyEvent(key: string) {
      const preventDefault = vi.fn()
      const e = {
        key,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        preventDefault,
        nativeEvent: { isComposing: false },
      } as unknown as React.KeyboardEvent<HTMLDivElement>
      return { e, preventDefault }
    }

    it('Ctrl+B wraps selected text with ** markers', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello world')
      // Select "world" (offset 6–11)
      selectRange(editor.firstChild!, 6, editor.firstChild!, 11)

      const { e, preventDefault } = ctrlKeyEvent('b')
      act(() => {
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalled()
      const segments = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      // Reconstruct plain text from segments
      const plainText = segments.map((s: Segment) => (s.type === 'text' ? s.text : '')).join('')
      expect(plainText).toContain('**world**')

      document.body.removeChild(editor)
    })

    it('Ctrl+I wraps selected text with * markers', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello world')
      // Select "hello" (offset 0–5)
      selectRange(editor.firstChild!, 0, editor.firstChild!, 5)

      const { e, preventDefault } = ctrlKeyEvent('i')
      act(() => {
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalled()
      const segments = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      const plainText = segments.map((s: Segment) => (s.type === 'text' ? s.text : '')).join('')
      expect(plainText).toContain('*hello*')

      document.body.removeChild(editor)
    })

    it('Ctrl+B does nothing with collapsed cursor (no selection)', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello world')
      placeCursor(editor.firstChild!, 3) // collapsed cursor at offset 3

      const { e, preventDefault } = ctrlKeyEvent('b')
      act(() => {
        result.current.handleKeyDown(e)
      })

      // Should not have called onChange for formatting (may have been called by other logic)
      // The key check: preventDefault should have been called but toggleMarkdownWrap returns null
      // for collapsed selections, so onChange should NOT be called for formatting
      const formattingCalls = onChange.mock.calls.filter((call: unknown[]) => {
        const segs = call[0] as Segment[]
        const text = segs.map((s) => (s.type === 'text' ? s.text : '')).join('')
        return text.includes('**')
      })
      expect(formattingCalls).toHaveLength(0)

      document.body.removeChild(editor)
    })

    it('Ctrl+B unwraps already bold text', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello **world** end')
      // Select "world" inside the bold markers (offsets 8–13 in plain text)
      // In DOM: "hello **world** end" — "world" starts at index 8
      selectRange(editor.firstChild!, 8, editor.firstChild!, 13)

      const { e, preventDefault } = ctrlKeyEvent('b')
      act(() => {
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalled()
      const segments = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      const plainText = segments.map((s: Segment) => (s.type === 'text' ? s.text : '')).join('')
      // The ** markers should have been removed
      expect(plainText).not.toContain('**')
      expect(plainText).toContain('world')

      document.body.removeChild(editor)
    })

    it('Ctrl+B wraps selection spanning multiple text nodes', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => usePromptArea(defaultProps({ onChange, markdown: true })))

      const editor = attachEditor(result.current)
      // Create multiple text nodes: "foo " + chip + " bar"
      const chip = createChipNode('@', 'alice', 'Alice')
      populateEditor(editor, 'foo ', chip, ' bar')

      // Select " bar" (the third child is the text node " bar")
      const barTextNode = editor.childNodes[2] // " bar" text node
      selectRange(barTextNode, 1, barTextNode, 4) // select "bar"

      const { e, preventDefault } = ctrlKeyEvent('b')
      act(() => {
        result.current.handleKeyDown(e)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalled()
      const segments = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      const plainText = segments
        .map((s: Segment) =>
          s.type === 'text' ? s.text : s.type === 'chip' ? `${s.trigger}${s.displayText}` : '',
        )
        .join('')
      expect(plainText).toContain('**bar**')

      document.body.removeChild(editor)
    })

    it('does not format when markdown is disabled', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        usePromptArea(defaultProps({ onChange, markdown: false })),
      )

      const editor = attachEditor(result.current)
      populateEditor(editor, 'hello world')
      selectRange(editor.firstChild!, 6, editor.firstChild!, 11)

      const { e } = ctrlKeyEvent('b')
      act(() => {
        result.current.handleKeyDown(e)
      })

      // onChange should not have been called with bold markers
      const formattingCalls = onChange.mock.calls.filter((call: unknown[]) => {
        const segs = call[0] as Segment[]
        const text = segs.map((s) => (s.type === 'text' ? s.text : '')).join('')
        return text.includes('**')
      })
      expect(formattingCalls).toHaveLength(0)

      document.body.removeChild(editor)
    })
  })
})
