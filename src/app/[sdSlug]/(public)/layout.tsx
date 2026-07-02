import "material-icons/iconfont/filled.css";
import "react-activity/dist/Dots.css";
import "@/styles/vendor/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@/styles/sidebar.css";
import "@/styles/master-detail.css";
import ClientLayout from "@/app/ClientLayout";
import { PwaRegister } from "../mobile/PwaRegister";
import { loadChurchAppearance } from "../mobile/loadChurchAppearance";
import { SiteWidgets } from "@/components/SiteWidgets";
import { ChurchAnalytics } from "@/components/ChurchAnalytics";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { fetchCached } from "@/helpers/ConfigHelper";

type LayoutParams = Promise<{ sdSlug: string }>;

export const viewport = { themeColor: "#ffffff" };

async function loadSiteSettings(sdSlug: string, churchId?: string): Promise<{ announcementRaw?: string; launcherRaw?: string; ga4MeasurementId?: string }> {
  if (!churchId) return {};
  EnvironmentHelper.init();
  try {
    const settings = await fetchCached<{ announcementBanner?: string; launcher?: string; ga4MeasurementId?: string }>("/settings/public/" + churchId, "ContentApi", sdSlug);
    return { announcementRaw: settings?.announcementBanner, launcherRaw: settings?.launcher, ga4MeasurementId: settings?.ga4MeasurementId };
  } catch {
    return {};
  }
}

export default async function PublicLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: LayoutParams;
}) {
  const { sdSlug } = await params;
  const { churchId, churchName } = await loadChurchAppearance(sdSlug);
  const { announcementRaw, launcherRaw, ga4MeasurementId } = await loadSiteSettings(sdSlug, churchId);

  const appTitle = (churchName && churchName.trim()) || sdSlug || "Church";
  const iconUrl = "/mobile/icon/192";
  const iconUrl512 = "/mobile/icon/512";

  return (
    <>
      <a href="#main-content" className="skipLink">Skip to content</a>
      <SiteWidgets announcementRaw={announcementRaw} launcherRaw={launcherRaw} />
      <ChurchAnalytics measurementId={ga4MeasurementId} />
      <link rel="manifest" href={`/manifest.webmanifest?church=${encodeURIComponent(sdSlug)}`} />
      <link rel="apple-touch-icon" href={iconUrl} />
      <link rel="apple-touch-icon" sizes="192x192" href={iconUrl} />
      <link rel="apple-touch-icon" sizes="512x512" href={iconUrl512} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={appTitle} />
      <link rel="preconnect" href="https://content.churchapps.org" />
      <link rel="preconnect" href="https://content.lessons.church" />
      <PwaRegister />
      <ClientLayout>{children}</ClientLayout>
    </>
  );
}
