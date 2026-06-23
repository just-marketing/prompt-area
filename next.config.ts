import type { NextConfig } from 'next'

// PostHog (EU) ingestion is proxied through our own origin at `/ingest` so the
// analytics requests come from prompt-area.com and survive ad/tracker blockers.
// The client points `api_host` at `/ingest` (see components/posthog-provider).
// Strip any trailing slash so the rewrite destinations below don't end up with
// a double slash (the env value may be entered as `https://eu.i.posthog.com/`).
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com').replace(
  /\/+$/,
  '',
)
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace('.i.posthog.com', '-assets.i.posthog.com')

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'shiki'],
  },
  // Required for the PostHog proxy: don't let Next strip/append a trailing
  // slash on the rewritten /ingest paths.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${POSTHOG_ASSETS_HOST}/static/:path*` },
      { source: '/ingest/:path*', destination: `${POSTHOG_HOST}/:path*` },
      { source: '/ingest/flags', destination: `${POSTHOG_HOST}/flags` },
    ]
  },
  async redirects() {
    return [
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/team', destination: '/about', permanent: true },
      { source: '/our-team', destination: '/about', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/contactus', destination: '/contact', permanent: true },
      { source: '/media', destination: '/press', permanent: true },
      { source: '/.well-known/llms.txt', destination: '/llms.txt', permanent: true },
      { source: '/.well-known/llms-full.txt', destination: '/llms-full.txt', permanent: true },
    ]
  },
}

export default nextConfig
