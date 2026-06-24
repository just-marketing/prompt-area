import Script from 'next/script'
import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import { GaRouteTracker } from '@/components/ga-route-tracker'

const GA_MEASUREMENT_ID = 'G-NWT3L9S7B9'

export function Analytics() {
  return (
    <>
      <VercelAnalytics />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
      </Script>
      <GaRouteTracker />
    </>
  )
}
