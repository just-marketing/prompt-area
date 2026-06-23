import {
  featuredBadgeUrl,
  hasOfficialBadge,
  PRODUCT_HUNT_BADGE_SIZE,
  productHuntUrl,
} from '@/lib/product-hunt'

const ALT = 'Prompt Area - Featured on Product Hunt'

/**
 * The official "Featured on Product Hunt" embed badge, linking to the launch.
 * Renders both theme variants and toggles them with the `.dark` class so it
 * always matches the site theme. Returns null until a real `postId` is set
 * (the badge image needs it) - callers should provide their own fallback CTA.
 *
 * Plain <img> is intentional: these are PH-hosted dynamic SVG widgets, not
 * static assets next/image can optimize.
 */
export function ProductHuntBadge({ className }: { className?: string }) {
  if (!hasOfficialBadge) return null
  const { width, height } = PRODUCT_HUNT_BADGE_SIZE
  return (
    <a
      href={productHuntUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Find Prompt Area on Product Hunt"
      className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element -- PH-hosted dynamic widget */}
      <img
        src={featuredBadgeUrl('light')}
        alt={ALT}
        width={width}
        height={height}
        className="block dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- PH-hosted dynamic widget */}
      <img
        src={featuredBadgeUrl('dark')}
        alt={ALT}
        width={width}
        height={height}
        className="hidden dark:block"
      />
    </a>
  )
}
