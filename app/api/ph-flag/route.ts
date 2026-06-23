import { get } from '@vercel/edge-config'
import { PH_LIVE_EDGE_CONFIG_KEY, PRODUCT_HUNT } from '@/lib/product-hunt'

// Exposes the Product Hunt "live" flag to the client banner. Reads the value
// from Vercel Edge Config so it can be flipped without a redeploy; falls back to
// the build-time env value (NEXT_PUBLIC_PH_LIVE) when Edge Config isn't
// configured (local dev, or before the store is connected).
export const dynamic = 'force-dynamic'

export async function GET() {
  // Env override: NEXT_PUBLIC_PH_LIVE=true forces the banner on, regardless of
  // Edge Config - handy for local dev and preview deploys. Otherwise Edge Config
  // is the source of truth, so the launch can be flipped without a redeploy.
  if (PRODUCT_HUNT.live) {
    return Response.json({ live: true }, { headers: { 'cache-control': 'no-store' } })
  }
  let live = false
  try {
    const value = await get(PH_LIVE_EDGE_CONFIG_KEY)
    if (typeof value === 'boolean') live = value
  } catch {
    // No EDGE_CONFIG connection (or read failed) - stay off.
  }
  return Response.json({ live }, { headers: { 'cache-control': 'no-store' } })
}
