import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PromptArea } from '../prompt-area'
import { segmentsToPlainText } from '../prompt-area-engine'
import type { Segment, TriggerConfig } from '../types'
import { placeCursorAtEnd, placeCursor } from './test-helpers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ClipboardPayload = {
  html?: string
  plain?: string
  segments?: string
}

/** Builds the plain-object clipboardData mock the paste handler reads. */
function makeClipboard(payload: ClipboardPayload, files: File[] = []) {
  return {
    files,
    items: [],
    getData: (type: string): string => {
      if (type === 'text/html') return payload.html ?? ''
      if (type === 'text/plain') return payload.plain ?? ''
      if (type === 'text/prompt-area-segments') return payload.segments ?? ''
      return ''
    },
  }
}

function renderEditor(
  props: {
    markdown?: boolean
    normalizeBullets?: boolean
    triggers?: TriggerConfig[]
    onImagePaste?: (file: File) => void
    onRawPaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void
  } = {},
) {
  const onChangeSpy = vi.fn()
  function Wrap() {
    const [value, setValue] = useState<Segment[]>([])
    return (
      <PromptArea
        value={value}
        markdown={props.markdown}
        normalizeBullets={props.normalizeBullets}
        triggers={props.triggers}
        onImagePaste={props.onImagePaste}
        onRawPaste={props.onRawPaste}
        onChange={(s) => {
          onChangeSpy(s)
          setValue(s)
        }}
      />
    )
  }
  render(<Wrap />)
  return { editor: screen.getByRole('textbox') as HTMLDivElement, onChangeSpy }
}

const lastOnChange = (spy: ReturnType<typeof vi.fn>) =>
  segmentsToPlainText(spy.mock.calls.at(-1)?.[0] as Segment[])

const lastSegments = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls.at(-1)?.[0] as Segment[]

function paste(editor: HTMLDivElement, payload: ClipboardPayload, files: File[] = []) {
  act(() => {
    placeCursorAtEnd(editor)
    fireEvent.paste(editor, { clipboardData: makeClipboard(payload, files) })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PromptArea rich HTML paste (markdown mode)', () => {
  it('converts text/html to markdown when markdown is on', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: true })
    paste(editor, { html: '<b>bold</b> and <i>it</i>', plain: 'bold and it' })
    expect(lastOnChange(onChangeSpy)).toBe('**bold** and *it*')
  })

  it('ignores text/html and uses text/plain when markdown is off', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: false })
    paste(editor, { html: '<b>bold</b> and <i>it</i>', plain: 'bold and it' })
    expect(lastOnChange(onChangeSpy)).toBe('bold and it')
  })

  it('falls through to text/plain when the clipboard has no html (markdown on)', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: true })
    paste(editor, { plain: '# raw *markdown* stays' })
    expect(lastOnChange(onChangeSpy)).toBe('# raw *markdown* stays')
  })

  it('converts an anchor to a markdown link without corrupting it', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: true })
    paste(editor, { html: '<a href="https://prompt-area.com">docs</a>' })
    expect(lastOnChange(onChangeSpy)).toContain('[docs](https://prompt-area.com)')
  })

  it('normalizes pasted "- " list bullets to "•" (normalizeBullets default)', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: true })
    paste(editor, { html: '<ul><li>one</li><li>two</li></ul>' })
    expect(lastOnChange(onChangeSpy)).toBe('• one\n• two')
  })

  it('normalizes pasted PLAIN-TEXT markdown bullets, including nested indents', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: true })
    paste(editor, { plain: '- alpha\n- beta\n    - nested gamma\n- delta' })
    expect(lastOnChange(onChangeSpy)).toBe('• alpha\n• beta\n    • nested gamma\n• delta')
  })

  it('keeps pasted plain-text "- " bullets when normalizeBullets is false', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: true, normalizeBullets: false })
    paste(editor, { plain: '- alpha\n- beta' })
    expect(lastOnChange(onChangeSpy)).toBe('- alpha\n- beta')
  })

  it('keeps pasted plain-text "- " bullets when markdown is off', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: false })
    paste(editor, { plain: '- alpha\n- beta' })
    expect(lastOnChange(onChangeSpy)).toBe('- alpha\n- beta')
  })

  it('auto-resolves trigger patterns in converted html text', () => {
    const triggers: TriggerConfig[] = [
      { char: '#', mode: 'dropdown', resolveOnSpace: true, onSearch: () => [] },
    ]
    const { editor, onChangeSpy } = renderEditor({ markdown: true, triggers })
    paste(editor, { html: '<p>ping #campaign now</p>' })
    const segments = lastSegments(onChangeSpy)
    expect(segments.some((s) => s.type === 'chip' && s.value === 'campaign')).toBe(true)
  })

  it('gives precedence to an image file over text/html', () => {
    const onImagePaste = vi.fn()
    const { editor, onChangeSpy } = renderEditor({ markdown: true, onImagePaste })
    const file = new File(['pixels'], 'x.png', { type: 'image/png' })
    paste(editor, { html: '<b>bold</b>' }, [file])
    expect(onImagePaste).toHaveBeenCalledWith(file)
    expect(onChangeSpy).not.toHaveBeenCalled()
  })

  it('gives precedence to internal chip segments over text/html', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: true })
    const segments = JSON.stringify([
      { type: 'chip', trigger: '@', value: 'alice', displayText: 'Alice' },
    ])
    paste(editor, { html: '<b>bold</b>', segments })
    expect(lastOnChange(onChangeSpy)).toContain('@Alice')
    expect(lastOnChange(onChangeSpy)).not.toContain('**bold**')
  })

  it('lets an onRawPaste consumer preventDefault short-circuit conversion', () => {
    const onRawPaste = (e: React.ClipboardEvent<HTMLDivElement>) => e.preventDefault()
    const { editor, onChangeSpy } = renderEditor({ markdown: true, onRawPaste })
    paste(editor, { html: '<b>bold</b>' })
    expect(onChangeSpy).not.toHaveBeenCalled()
  })

  it('inserts converted markdown at the caret position', () => {
    const { editor, onChangeSpy } = renderEditor({ markdown: true })
    act(() => {
      editor.textContent = 'start END'
      placeCursorAtEnd(editor)
      fireEvent.input(editor)
    })
    act(() => {
      placeCursor(editor, 'start '.length)
      fireEvent.paste(editor, { clipboardData: makeClipboard({ html: '<b>mid</b>' }) })
    })
    expect(lastOnChange(onChangeSpy)).toBe('start **mid**END')
  })
})
