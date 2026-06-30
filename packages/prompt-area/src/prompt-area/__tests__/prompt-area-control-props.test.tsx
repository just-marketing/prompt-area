import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PromptArea } from '../prompt-area'
import type { Segment } from '../types'
import { placeCursorAtEnd } from './test-helpers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  value: [] as Segment[],
  onChange: vi.fn(),
}

// ---------------------------------------------------------------------------
// onKeyDown (consumer-first)
// ---------------------------------------------------------------------------

describe('onKeyDown control prop', () => {
  it('calls onKeyDown for every keydown', () => {
    const onKeyDown = vi.fn()
    render(<PromptArea {...defaultProps} onKeyDown={onKeyDown} />)
    const editor = screen.getByRole('textbox')

    fireEvent.keyDown(editor, { key: 'a' })

    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onKeyDown.mock.calls[0][0]).toMatchObject({ key: 'a' })
  })

  it('runs before built-in handling and preventDefault suppresses submit', () => {
    const onSubmit = vi.fn()
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => {
      e.preventDefault()
    })
    render(
      <PromptArea
        value={[{ type: 'text', text: 'hello' }]}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onKeyDown={onKeyDown}
      />,
    )
    const editor = screen.getByRole('textbox')
    placeCursorAtEnd(editor)

    fireEvent.keyDown(editor, { key: 'Enter' })

    expect(onKeyDown).toHaveBeenCalled()
    // Built-in Enter->submit must be skipped because the consumer prevented default.
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not suppress built-in handling when onKeyDown does not preventDefault', () => {
    const onSubmit = vi.fn()
    const onKeyDown = vi.fn()
    render(
      <PromptArea
        value={[{ type: 'text', text: 'hello' }]}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onKeyDown={onKeyDown}
      />,
    )
    const editor = screen.getByRole('textbox')
    placeCursorAtEnd(editor)

    fireEvent.keyDown(editor, { key: 'Enter' })

    expect(onKeyDown).toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// onRawPaste
// ---------------------------------------------------------------------------

describe('onRawPaste control prop', () => {
  it('calls onRawPaste before the library paste handling', () => {
    const onRawPaste = vi.fn()
    const onChange = vi.fn()
    render(<PromptArea value={[]} onChange={onChange} onRawPaste={onRawPaste} />)
    const editor = screen.getByRole('textbox')

    const clipboardData = {
      getData: (type: string) => (type === 'text/plain' ? 'pasted' : ''),
      files: [] as File[],
      items: [] as DataTransferItem[],
    }

    fireEvent.paste(editor, { clipboardData })

    expect(onRawPaste).toHaveBeenCalledTimes(1)
    // Library still processed the paste since default was not prevented.
    expect(onChange).toHaveBeenCalled()
  })

  it('short-circuits the library paste when onRawPaste calls preventDefault', () => {
    const onChange = vi.fn()
    const onPaste = vi.fn()
    const onRawPaste = vi.fn((e: React.ClipboardEvent) => {
      e.preventDefault()
    })
    render(<PromptArea value={[]} onChange={onChange} onPaste={onPaste} onRawPaste={onRawPaste} />)
    const editor = screen.getByRole('textbox')

    const clipboardData = {
      getData: (type: string) => (type === 'text/plain' ? 'pasted' : ''),
      files: [] as File[],
      items: [] as DataTransferItem[],
    }

    fireEvent.paste(editor, { clipboardData })

    expect(onRawPaste).toHaveBeenCalledTimes(1)
    // Built-in paste handling is skipped: neither onChange nor onPaste fires.
    expect(onChange).not.toHaveBeenCalled()
    expect(onPaste).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// submitOnEnter
// ---------------------------------------------------------------------------

describe('submitOnEnter control prop', () => {
  it('Enter submits by default (submitOnEnter defaults to true)', () => {
    const onSubmit = vi.fn()
    const onChange = vi.fn()
    render(
      <PromptArea
        value={[{ type: 'text', text: 'hello' }]}
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    )
    const editor = screen.getByRole('textbox')
    placeCursorAtEnd(editor)

    onChange.mockClear()
    fireEvent.keyDown(editor, { key: 'Enter' })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual([{ type: 'text', text: 'hello' }])
  })

  it('Enter submits when submitOnEnter is explicitly true', () => {
    const onSubmit = vi.fn()
    render(
      <PromptArea
        value={[{ type: 'text', text: 'hello' }]}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        submitOnEnter={true}
      />,
    )
    const editor = screen.getByRole('textbox')
    placeCursorAtEnd(editor)

    fireEvent.keyDown(editor, { key: 'Enter' })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('Enter inserts a newline instead of submitting when submitOnEnter is false', () => {
    const onSubmit = vi.fn()
    const onChange = vi.fn()
    render(
      <PromptArea
        value={[{ type: 'text', text: 'hello' }]}
        onChange={onChange}
        onSubmit={onSubmit}
        submitOnEnter={false}
      />,
    )
    const editor = screen.getByRole('textbox')
    placeCursorAtEnd(editor)

    onChange.mockClear()
    fireEvent.keyDown(editor, { key: 'Enter' })

    expect(onSubmit).not.toHaveBeenCalled()
    // Newline inserted: onChange receives the text with a trailing '\n'.
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls.at(-1)![0] as Segment[]
    const plain = lastCall
      .filter((s): s is Extract<Segment, { type: 'text' }> => s.type === 'text')
      .map((s) => s.text)
      .join('')
    expect(plain).toContain('\n')
  })
})

// ---------------------------------------------------------------------------
// spellCheck & aria-describedby (forwarded to the editable element)
// ---------------------------------------------------------------------------

describe('forwarded editor attributes', () => {
  it('forwards spellCheck to the editor element', () => {
    render(<PromptArea {...defaultProps} spellCheck={false} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'false')
  })

  it('forwards spellCheck=true to the editor element', () => {
    render(<PromptArea {...defaultProps} spellCheck={true} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'true')
  })

  it('forwards aria-describedby to the editor element', () => {
    render(<PromptArea {...defaultProps} aria-describedby="hint-id" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'hint-id')
  })

  it('does not set aria-describedby when the prop is omitted', () => {
    render(<PromptArea {...defaultProps} />)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby')
  })
})

// ---------------------------------------------------------------------------
// onBlur (native FocusEvent with relatedTarget)
// ---------------------------------------------------------------------------

describe('onBlur control prop', () => {
  it('fires onBlur with the focus event', () => {
    const onBlur = vi.fn()
    render(<PromptArea {...defaultProps} onBlur={onBlur} />)
    const editor = screen.getByRole('textbox')

    fireEvent.blur(editor)

    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('exposes relatedTarget on the blur event', () => {
    const onBlur = vi.fn()
    render(<PromptArea {...defaultProps} onBlur={onBlur} />)
    const editor = screen.getByRole('textbox')

    const toolbarButton = document.createElement('button')
    document.body.appendChild(toolbarButton)

    fireEvent.blur(editor, { relatedTarget: toolbarButton })

    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onBlur.mock.calls[0][0].relatedTarget).toBe(toolbarButton)

    toolbarButton.remove()
  })
})
