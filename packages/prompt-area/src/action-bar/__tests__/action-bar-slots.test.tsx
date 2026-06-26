import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActionBar } from '../action-bar'

const leftWrapper = () => screen.getByText('Left').parentElement
const rightWrapper = () => screen.getByText('Right').parentElement

describe('ActionBar slot overrides', () => {
  it('applies leftClassName to the left slot wrapper', () => {
    render(<ActionBar left={<button>Left</button>} leftClassName="left-custom" />)
    expect(leftWrapper()?.className).toContain('left-custom')
  })

  it('applies rightClassName to the right slot wrapper', () => {
    render(<ActionBar right={<button>Right</button>} rightClassName="right-custom" />)
    expect(rightWrapper()?.className).toContain('right-custom')
  })

  it('keeps the base classes on the left wrapper alongside leftClassName', () => {
    render(<ActionBar left={<button>Left</button>} leftClassName="left-custom" />)
    const wrapper = leftWrapper()
    expect(wrapper?.className).toContain('flex')
    expect(wrapper?.className).toContain('items-center')
    expect(wrapper?.className).toContain('gap-1')
    expect(wrapper?.className).toContain('left-custom')
  })

  it('keeps the base classes on the right wrapper alongside rightClassName', () => {
    render(<ActionBar right={<button>Right</button>} rightClassName="right-custom" />)
    const wrapper = rightWrapper()
    expect(wrapper?.className).toContain('ml-auto')
    expect(wrapper?.className).toContain('flex')
    expect(wrapper?.className).toContain('items-center')
    expect(wrapper?.className).toContain('gap-1')
    expect(wrapper?.className).toContain('right-custom')
  })

  it('does not leak leftClassName onto the right slot wrapper', () => {
    render(
      <ActionBar
        left={<button>Left</button>}
        right={<button>Right</button>}
        leftClassName="left-custom"
      />,
    )
    expect(leftWrapper()?.className).toContain('left-custom')
    expect(rightWrapper()?.className).not.toContain('left-custom')
  })

  it('does not leak rightClassName onto the left slot wrapper', () => {
    render(
      <ActionBar
        left={<button>Left</button>}
        right={<button>Right</button>}
        rightClassName="right-custom"
      />,
    )
    expect(rightWrapper()?.className).toContain('right-custom')
    expect(leftWrapper()?.className).not.toContain('right-custom')
  })

  it('applies leftClassName and rightClassName independently when both slots are present', () => {
    render(
      <ActionBar
        left={<button>Left</button>}
        right={<button>Right</button>}
        leftClassName="left-custom"
        rightClassName="right-custom"
      />,
    )
    expect(leftWrapper()?.className).toContain('left-custom')
    expect(rightWrapper()?.className).toContain('right-custom')
  })

  it('does not render a left wrapper for leftClassName when the left slot is absent', () => {
    render(<ActionBar right={<button>Right</button>} leftClassName="left-custom" />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar.children).toHaveLength(1)
    expect(toolbar.innerHTML).not.toContain('left-custom')
  })

  it('does not render a right wrapper for rightClassName when the right slot is absent', () => {
    render(<ActionBar left={<button>Left</button>} rightClassName="right-custom" />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar.children).toHaveLength(1)
    expect(toolbar.innerHTML).not.toContain('right-custom')
  })

  it('preserves base slot classes when no slot classNames are provided', () => {
    render(<ActionBar left={<button>Left</button>} right={<button>Right</button>} />)
    expect(leftWrapper()?.className).toBe('flex items-center gap-1')
    expect(rightWrapper()?.className).toBe('ml-auto flex items-center gap-1')
  })
})
