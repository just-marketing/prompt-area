'use client'

import { useEffect, useState } from 'react'

/**
 * Hero headlines, rotated on a timer. Each leans on a different angle —
 * shadcn-native, the npm package, the built-in triggers, the zero-dep promise —
 * so the "npm + shadcn" positioning reads consistently no matter which one is
 * showing. Edit this list to tune the slogan.
 */
const TITLES = [
  'The shadcn chat input for React',
  'The npm package for AI chat input',
  '@mentions, /commands, and #tags — built in',
  'Production-grade chat input. Zero dependencies.',
] as const

const INTERVAL_MS = 3500

/**
 * Cycles through {@link TITLES} with a crossfade. All titles are grid-stacked
 * in one cell so the heading height stays fixed (no layout shift), and the full
 * list ships in the static HTML for SEO. The first title renders on the server
 * and during the reduced-motion / no-JS path, so there's a stable headline even
 * if the timer never runs.
 */
export function RotatingTitle({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex((i) => (i + 1) % TITLES.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <h1 className={className}>
      {/* Stable, single text for assistive tech and crawlers. */}
      <span className="sr-only">{TITLES[0]}</span>
      <span aria-hidden className="grid">
        {TITLES.map((title, i) => (
          <span
            key={title}
            className="col-start-1 row-start-1 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === index ? 1 : 0 }}>
            {title}
          </span>
        ))}
      </span>
    </h1>
  )
}
