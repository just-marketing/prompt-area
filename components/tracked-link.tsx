'use client'

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { track, type AnalyticsEvent, type AnalyticsEventMap } from '@/lib/analytics'

type TrackedLinkProps<E extends AnalyticsEvent> = Omit<ComponentProps<typeof Link>, 'onClick'> & {
  /** Analytics event to fire on click. */
  event: E
  /** Typed properties for the event. */
  eventProps: AnalyticsEventMap[E]
  children: ReactNode
}

/**
 * A `next/link` that fires a typed analytics event on click. Lets server
 * components keep a single tracked CTA link client-side without turning the
 * whole component (and its server-rendered siblings) into client components.
 */
export function TrackedLink<E extends AnalyticsEvent>({
  event,
  eventProps,
  children,
  ...rest
}: TrackedLinkProps<E>) {
  return (
    <Link {...rest} onClick={() => track(event, eventProps)}>
      {children}
    </Link>
  )
}
