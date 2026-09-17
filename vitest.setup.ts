import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// @types/jest-axe only augments the `jest` namespace; vitest 5 no longer maps
// that onto its own Assertion type, so declare the matcher here.
declare module 'vitest' {
  interface Matchers<R> {
    toHaveNoViolations(): R
  }
}

// jsdom doesn't implement Range.getBoundingClientRect, but the editor reads
// selection geometry during trigger detection on input/keydown — without this,
// any test that types into the editor throws.
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

afterEach(() => {
  cleanup()
})
