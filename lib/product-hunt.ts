// Central configuration for the Product Hunt launch.
//
// Values are read from environment variables so you can activate the launch and
// set the post id / slugs from Vercel (Project → Settings → Environment
// Variables) WITHOUT a code change. The hardcoded fallbacks keep local dev and
// the pre-launch site working with no env set.
//
// The launch banner flips WITHOUT a redeploy via Vercel Edge Config: the
// `/api/ph-flag` route reads the `productHuntLive` key and the banner polls it,
// so flipping the value in the Edge Config dashboard propagates in seconds.
// `NEXT_PUBLIC_PH_LIVE=true` is a build-time OVERRIDE that forces the banner on
// regardless of Edge Config - set it in .env.local to preview the banner during
// local dev. Leave it false in production and use Edge Config as the switch.
//
// Identifiers that only change once (post id, slugs) stay as NEXT_PUBLIC_* env
// vars - set them in Vercel when the post exists; they apply on the next deploy.
//
// To activate on launch day (Thursday, July 9, 2026):
//   • set Edge Config `productHuntLive` = true   (instant, no redeploy)  ← the switch
//   • set NEXT_PUBLIC_PH_POST_ID + NEXT_PUBLIC_PH_LAUNCH_SLUG in Vercel (+ redeploy)

/** Edge Config key holding the live boolean (flip this on launch day). */
export const PH_LIVE_EDGE_CONFIG_KEY = 'productHuntLive'

export const PRODUCT_HUNT = {
  /** Build-time fallback for the banner when Edge Config is unavailable. */
  live: process.env.NEXT_PUBLIC_PH_LIVE === 'true',

  /** Numeric PH post id (from the launch's "Promote → Embed" snippet). 0 = unset. */
  postId: Number(process.env.NEXT_PUBLIC_PH_POST_ID) || 0,

  /** Slugs for producthunt.com/products/<productSlug>/<launchSlug>/launch-day. */
  productSlug: process.env.NEXT_PUBLIC_PH_PRODUCT_SLUG || 'prompt-area',
  launchSlug: process.env.NEXT_PUBLIC_PH_LAUNCH_SLUG || 'prompt-area',

  /** Human-readable launch date, used in copy. */
  launchDate: 'July 9, 2026',
} as const

/**
 * Canonical launch-day URL. The PH campaign links here on the day; our own CTAs
 * link back to it.
 */
export const productHuntUrl = `https://www.producthunt.com/products/${PRODUCT_HUNT.productSlug}/${PRODUCT_HUNT.launchSlug}/launch-day`

/** True once a real post id is configured, so the official badge can render. */
export const hasOfficialBadge = PRODUCT_HUNT.postId > 0

/**
 * Official Product Hunt embed badge ("Featured on Product Hunt"), served by PH.
 * 250×54. Pass the theme so it matches light/dark mode.
 */
export function featuredBadgeUrl(theme: 'light' | 'dark' = 'light') {
  return `https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=${PRODUCT_HUNT.postId}&theme=${theme}`
}

export const PRODUCT_HUNT_BADGE_SIZE = { width: 250, height: 54 } as const
