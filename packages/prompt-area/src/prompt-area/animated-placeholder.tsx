'use client'

import { useEffect, useState } from 'react'

type AnimatedPlaceholderProps = {
  texts: string[]
  interval?: number
}

/**
 * Cross-fading placeholder that rotates through `texts`.
 *
 * Each text is keyed so React remounts it on change, replaying the
 * `tw-animate-css` enter animation (slide down + fade in). No animation
 * library is required.
 */
export function AnimatedPlaceholder({ texts, interval = 3000 }: AnimatedPlaceholderProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (texts.length <= 1) return

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length)
    }, interval)

    return () => clearInterval(id)
  }, [texts.length, interval])

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 overflow-hidden select-none"
      style={{ color: 'var(--prompt-area-placeholder, var(--muted-foreground))' }}
      aria-hidden="true">
      <div
        key={index}
        className="animate-in fade-in-0 slide-in-from-top-4 duration-300 ease-in-out">
        {texts[index]}
      </div>
    </div>
  )
}
