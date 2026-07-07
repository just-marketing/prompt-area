import posthog from 'posthog-js'

declare global {
  interface Window {
    // Defined by the gtag snippet in components/analytics.tsx.
    gtag?: (command: 'event' | 'config' | 'js', ...args: unknown[]) => void
  }
}

/**
 * The PostHog project (write-only, public) key. Safe to ship in client code.
 * Overridable per-environment via `NEXT_PUBLIC_POSTHOG_KEY`; the committed
 * fallback means analytics work out of the box even before the env var is set
 * in the deployment. Set the env var to `''` to disable PostHog entirely.
 */
export const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? 'phc_q94hqKoqFz9A4yKKBZ8wFpUSf7HRWABAN9Hp5YbXkDtc'

/**
 * Same-origin proxy path. All ingestion is routed through `/ingest` (rewritten
 * to PostHog EU in `next.config.ts`) so requests come from our own domain and
 * survive ad/tracker blockers — important for a developer audience.
 */
export const POSTHOG_API_HOST = '/ingest'

/** PostHog app host used for links from the SDK (e.g. toolbar, session links). */
export const POSTHOG_UI_HOST = 'https://eu.posthog.com'

/**
 * Marketing-site analytics — a thin, typed wrapper over PostHog.
 *
 * PostHog autocapture records generic clicks/pageviews on its own (set up in
 * `components/posthog-provider.tsx`). The named events below are the
 * high-intent conversions we want to slice, funnel, and chart deliberately —
 * "how do people install Prompt Area, and what do they click on the way
 * there." Keep this list small and meaningful; let autocapture handle the
 * long tail.
 *
 * Every event name and its property shape lives here so call sites stay
 * declarative and we never typo an event name in the wild.
 */
export type AnalyticsEventMap = {
  /** A shell install command (npm / pnpm / yarn / shadcn) was copied. */
  install_command_copied: {
    /** Which install command: 'npm' | 'pnpm' | 'yarn' | 'shadcn'. */
    method: string
    /** The exact command string copied. */
    command: string
    /** Where on the site the box was rendered, e.g. 'hero', 'docs'. */
    location?: string
  }
  /** The copy-paste "install with an AI agent" prompt was copied. */
  install_prompt_copied: {
    /** Which surface the prompt was copied from. */
    location: 'compact' | 'preview' | 'dialog'
  }
  /** The AI-agent install prompt was expanded into the full-screen dialog. */
  install_prompt_expanded: {
    location: 'compact' | 'preview'
  }
  /** An install-method tab (AI agent / npm / shadcn, or a package manager) was selected. */
  install_method_selected: {
    method: string
    location?: string
  }
  /** A primary marketing call-to-action button was clicked. */
  cta_clicked: {
    /** Stable id for the CTA, e.g. 'get_started', 'read_docs', 'quick_start'. */
    cta: string
    /** Where the CTA lives, e.g. 'hero', 'home_cta', 'compare'. */
    location?: string
  }
  /** A link out to the GitHub repository was clicked. */
  github_clicked: {
    location: 'header' | 'footer' | 'hero'
  }
  /** A site navigation link (header or footer) was clicked. */
  nav_link_clicked: {
    label: string
    href: string
    location: 'header' | 'footer'
  }
  /** The visitor engaged with a live, interactive demo (focused it or typed). */
  demo_interacted: {
    /** Which demo, e.g. 'hero'. */
    location: string
  }
  /** A chip (@mention, /command, #tag) in a live demo was clicked. */
  demo_chip_clicked: {
    /** Which demo, e.g. 'hero'. */
    location: string
    /** The chip's trigger character: '@' | '/' | '#'. */
    trigger: string
    /** The chip's resolved value, e.g. 'strategist', 'summarize', 'campaign'. */
    value: string
  }
  /** A #tag chip was swapped for another tag via the demo's tag picker. */
  demo_tag_swapped: {
    /** Which demo, e.g. 'hero'. */
    location: string
    /** The tag value that was picked. */
    tag: string
  }
  /** A built-in agent style was selected to preview in the styles carousel. */
  style_selected: {
    /** Style id, e.g. 'chatgpt', 'claude-code'. */
    style: string
    /** Vendor group, e.g. 'OpenAI', 'Anthropic'. */
    vendor: string
    /** Whether it was picked via a provider logo tile or the prev/next arrows. */
    method: 'logo' | 'arrow'
    /** Where the carousel lives, e.g. 'home_carousel'. */
    location: string
  }
}

export type AnalyticsEvent = keyof AnalyticsEventMap

/**
 * Capture a typed analytics event. No-ops on the server, so it's always safe to
 * call from client components. The same named event is mirrored into both
 * PostHog (primary product analytics) and Google Analytics 4, so it shows up in
 * GA's "Event count by Event name" / realtime as well.
 */
export function track<E extends AnalyticsEvent>(event: E, properties: AnalyticsEventMap[E]): void {
  if (typeof window === 'undefined') return
  if (POSTHOG_KEY) posthog.capture(event, properties)
  window.gtag?.('event', event, properties)
}
