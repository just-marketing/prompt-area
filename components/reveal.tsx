'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Scroll-reveal primitives — the motion vocabulary for the marketing pages.
 *
 * Content fades and gently lifts into place the first time it enters the
 * viewport (or on mount, above the fold), all sharing one easing curve so the
 * page moves with a single, calm voice rather than a grab-bag of effects.
 *
 * Every export degrades to a plain `<div>` under `prefers-reduced-motion`, so
 * the reduced-motion render is byte-for-byte identical in layout — only the
 * entrance is dropped. Pass `lift={false}` (opacity only) around interactive
 * widgets whose floating menus shouldn't sit inside a transformed ancestor.
 */

// "ease-out-expo"-ish: decelerates as it settles, reading as premium not springy.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const DURATION = 0.6
const DISTANCE = 24

// Fire once, starting a little before the element is fully on-screen so the
// motion resolves around the time it reaches a comfortable reading position.
const VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const

const itemVariants: Variants = {
  hidden: { opacity: 0, y: DISTANCE },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
}

/**
 * Fades + lifts its children into place the first time they scroll into view.
 * Above-the-fold usage animates on mount (the element is already in view).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  lift = true,
}: {
  children: ReactNode
  delay?: number
  className?: string
  /** Disable the vertical translate (opacity-only) — avoids a lingering
   *  `transform` ancestor that would re-anchor a child's fixed-position menus. */
  lift?: boolean
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={lift ? { opacity: 0, y: DISTANCE } : { opacity: 0 }}
      whileInView={lift ? { opacity: 1, y: 0 } : { opacity: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION, ease: EASE, delay }}>
      {children}
    </motion.div>
  )
}

/**
 * Staggers its {@link RevealItem} children so they cascade in one after another.
 * `trigger="scroll"` (default) starts when the group scrolls into view;
 * `trigger="mount"` starts immediately — use it above the fold (e.g. the hero).
 */
export function RevealGroup({
  children,
  className,
  trigger = 'scroll',
  stagger = 0.08,
  delayChildren = 0.04,
}: {
  children: ReactNode
  className?: string
  trigger?: 'scroll' | 'mount'
  stagger?: number
  delayChildren?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  }
  const activate =
    trigger === 'mount'
      ? { animate: 'show' as const }
      : { whileInView: 'show' as const, viewport: VIEWPORT }

  return (
    <motion.div className={className} variants={variants} initial="hidden" {...activate}>
      {children}
    </motion.div>
  )
}

/** A single staggered child. Must be rendered inside a {@link RevealGroup}. */
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}
