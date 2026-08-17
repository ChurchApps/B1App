import Script from "next/script";
import { isAllowedMeasurementId } from "@/helpers/customContentSecurity";

export function ChurchAnalytics({ measurementId }: { measurementId?: string | null }) {
  // ga4MeasurementId is church-editable content, and it lands inside an inline
  // script that carries the CSP nonce, so anything but a real GA/GTM id is a
  // script-injection sink.
  if (!measurementId || !isAllowedMeasurementId(measurementId)) return null;
  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <Script id="church-ga4" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');` }} />
    </>
  );
}
