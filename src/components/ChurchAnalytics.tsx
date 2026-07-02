import Script from "next/script";

export function ChurchAnalytics({ measurementId }: { measurementId?: string | null }) {
  if (!measurementId) return null;
  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <Script id="church-ga4" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');` }} />
    </>
  );
}
