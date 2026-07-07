import Script from 'next/script'
import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import { GaRouteTracker } from '@/components/ga-route-tracker'

const GA_MEASUREMENT_ID = 'G-NWT3L9S7B9'

export function Analytics() {
  return (
    <>
      <VercelAnalytics />
      {/* lazyOnload (not afterInteractive): keep gtag.js from competing with
          hydration and LCP-critical requests on slow mobile connections. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
      </Script>
      <GaRouteTracker />
    </>
  )
}
