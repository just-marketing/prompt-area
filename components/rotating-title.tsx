'use client'

import { useEffect, useState } from 'react'

/**
 * Hero headlines, rotated on a timer. Each leans on a different angle —
 * shadcn-native, the npm package, the built-in triggers, the production bar —
 * so the "npm + shadcn" positioning reads consistently no matter which is
 * showing. Kept to a similar length so they wrap alike. Edit to tune the slogan.
 */
const TITLES = [
  'The shadcn chat input for React',
  'The npm package for AI chat',
  '@mentions, /commands, #tags',
  'A production-grade textarea',
] as const

const HOLD_MS = 2800 // time a title stays fully visible
const FADE_MS = 450 // fade-out / fade-in duration

/**
 * Cycles through {@link TITLES} with a *sequential* fade: the current title
 * fades fully out, the text swaps, then the next fades in — so two titles are
 * never painted at once. All titles are grid-stacked in one cell, so the
 * heading reserves the tallest height and never shifts the layout. The first
 * title renders on the server and under prefers-reduced-motion / no-JS, so
 * there's always a stable headline.
 */
export function RotatingTitle({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let timer: ReturnType<typeof setTimeout>
    let cancelled = false

    function schedule() {
      timer = setTimeout(() => {
        if (cancelled) return
        setShown(false) // fade current out
        timer = setTimeout(() => {
          if (cancelled) return
          setIndex((i) => (i + 1) % TITLES.length) // swap while invisible
          setShown(true) // fade next in
          schedule()
        }, FADE_MS)
      }, HOLD_MS)
    }

    // Rotation starts on the visitor's first interaction, not on load. Every
    // swap repaints the headline — the page's LCP element — and each repaint
    // that lands a slightly larger text box registers a NEW, later LCP
    // candidate, dragging the measured LCP out to whenever the last swap
    // happened. LCP is finalized at the first input, so gating on interaction
    // means rotation can never affect it: engaged visitors still get the full
    // cycle, idle ones keep the strongest headline.
    const startEvents = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const
    const start = () => {
      stopListening()
      schedule()
    }
    const stopListening = () => {
      for (const ev of startEvents) window.removeEventListener(ev, start)
      window.removeEventListener('scroll', start)
    }
    for (const ev of startEvents) window.addEventListener(ev, start, { passive: true })
    window.addEventListener('scroll', start, { passive: true })

    return () => {
      cancelled = true
      stopListening()
      clearTimeout(timer)
    }
  }, [])

  return (
    <h1 className={className}>
      {/* Stable, single text for assistive tech and crawlers. */}
      <span className="sr-only">{TITLES[0]}</span>
      <span aria-hidden className="grid grid-cols-1">
        {TITLES.map((title, i) => (
          <span
            key={title}
            className="col-start-1 row-start-1"
            style={{
              transition: `opacity ${FADE_MS}ms ease-in-out`,
              opacity: i === index && shown ? 1 : 0,
            }}>
            {title}
          </span>
        ))}
      </span>
    </h1>
  )
}
