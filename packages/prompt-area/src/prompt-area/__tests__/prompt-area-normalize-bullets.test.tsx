import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PromptArea } from '../prompt-area'
import { segmentsToPlainText } from '../prompt-area-engine'
import type { Segment } from '../types'
import { placeCursorAtEnd } from './test-helpers'

function renderEditor(props: { normalizeBullets?: boolean }) {
  const onChangeSpy = vi.fn()
  function Wrap() {
    const [value, setValue] = useState<Segment[]>([])
    return (
      <PromptArea
        value={value}
        markdown
        normalizeBullets={props.normalizeBullets}
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

function typeListPrefix(editor: HTMLDivElement, text: string) {
  act(() => {
    editor.textContent = text
    placeCursorAtEnd(editor)
    fireEvent.input(editor)
  })
}

const lastOnChange = (spy: ReturnType<typeof vi.fn>) =>
  segmentsToPlainText(spy.mock.calls.at(-1)?.[0] as Segment[])

describe('PromptArea normalizeBullets prop', () => {
  it('rewrites a typed "- " to a "•" bullet by default (markdown on)', () => {
    const { editor, onChangeSpy } = renderEditor({})
    typeListPrefix(editor, '- ')
    expect(lastOnChange(onChangeSpy)).toBe('• ')
  })

  it('keeps the typed "- " in the model when normalizeBullets is false', () => {
    const { editor, onChangeSpy } = renderEditor({ normalizeBullets: false })
    typeListPrefix(editor, '- ')
    expect(lastOnChange(onChangeSpy)).toBe('- ')
  })

  it('keeps a typed "* " in the model when normalizeBullets is false', () => {
    const { editor, onChangeSpy } = renderEditor({ normalizeBullets: false })
    typeListPrefix(editor, '* ')
    expect(lastOnChange(onChangeSpy)).toBe('* ')
  })
})
