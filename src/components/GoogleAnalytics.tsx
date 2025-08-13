"use client"
import Script from 'next/script'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { EnvironmentHelper } from '@/helpers/EnvironmentHelper'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

function GoogleAnalyticsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const gaId = EnvironmentHelper.Common.GoogleAnalyticsTag

  useEffect(() => {
    if (!gaId || !pathname) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', gaId, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, gaId])

  if (!gaId) return null

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  )
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  )
}