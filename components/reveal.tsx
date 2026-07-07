'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

/**
 * Scroll-reveal primitives — the motion vocabulary for the marketing pages.
 *
 * Content fades and gently lifts into place the first time it enters the
 * viewport (or on mount, above the fold), all sharing one easing curve so the
 * page moves with a single, calm voice rather than a grab-bag of effects.
 *
 * The animation itself is pure CSS (see the reveal block in `globals.css`):
 * `trigger="mount"` runs a transform-only keyframe animation at first paint
 * with **no JavaScript in the critical path** — and no fade, so the hero (the
 * LCP element) is painted visible from the very first frame — while
 * `trigger="scroll"` starts hidden and fades/lifts in when the shared
 * IntersectionObserver below stamps `data-revealed`. `prefers-reduced-motion`
 * is handled entirely in CSS, where the reduced render keeps the exact same
 * layout with the entrance dropped.
 */

// Fire once, starting a little before the element is fully on-screen so the
// motion resolves around the time it reaches a comfortable reading position.
const VIEWPORT_MARGIN = '0px 0px -15% 0px'

// One shared observer for every scroll-revealed element on the page.
let observer: IntersectionObserver | null = null
function observe(el: Element) {
  if (typeof IntersectionObserver === 'undefined') {
    el.setAttribute('data-revealed', '')
    return () => {}
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute('data-revealed', '')
        observer?.unobserve(entry.target)
      }
    },
    { rootMargin: VIEWPORT_MARGIN },
  )
  observer.observe(el)
  return () => observer?.unobserve(el)
}

/** Attach the shared reveal observer to a `data-reveal="scroll"` element. */
function useScrollReveal(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!enabled || !ref.current) return
    return observe(ref.current)
  }, [enabled])
  return ref
}

function revealVars(delay: number, x: number, y: number): CSSProperties {
  const vars: Record<string, string> = {}
  if (delay) vars['--reveal-delay'] = `${delay}s`
  if (x) vars['--reveal-x'] = `${x}px`
  if (y !== 24) vars['--reveal-y'] = `${y}px`
  return vars as CSSProperties
}

/**
 * Fades + lifts its children into place. `trigger="scroll"` (default) fires
 * the first time the element scrolls into view; `trigger="mount"` animates at
 * first paint without waiting for JS — use it above the fold (e.g. the hero).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
  lift = true,
  x = 0,
  trigger = 'scroll',
}: {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
  /** Disable the vertical translate (opacity-only) — avoids a lingering
   *  `transform` ancestor that would re-anchor a child's fixed-position menus. */
  lift?: boolean
  /** Horizontal offset (px) to slide in from, e.g. ±220 for the features grid. */
  x?: number
  trigger?: 'scroll' | 'mount'
}) {
  const ref = useScrollReveal(trigger === 'scroll')
  return (
    <div
      ref={ref}
      className={className}
      data-reveal={trigger}
      style={{ ...style, ...revealVars(delay, x, lift ? 24 : 0) }}>
      {children}
    </div>
  )
}

/**
 * Staggers its {@link RevealItem} children so they cascade in one after another.
 * `trigger="scroll"` (default) starts when each item scrolls into view;
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
  let index = 0
  return (
    <div className={className}>
      {Children.map(children, (child) => {
        if (isValidElement<RevealItemProps>(child) && child.type === RevealItem) {
          return cloneElement(child, { trigger, delay: delayChildren + index++ * stagger })
        }
        return child
      })}
    </div>
  )
}

type RevealItemProps = {
  children: ReactNode
  className?: string
  /** Injected by {@link RevealGroup}. */
  trigger?: 'scroll' | 'mount'
  /** Injected by {@link RevealGroup}. */
  delay?: number
}

/** A single staggered child. Must be rendered inside a {@link RevealGroup}. */
export function RevealItem({
  children,
  className,
  trigger = 'scroll',
  delay = 0,
}: RevealItemProps) {
  return (
    <Reveal className={className} trigger={trigger} delay={delay}>
      {children}
    </Reveal>
  )
}
