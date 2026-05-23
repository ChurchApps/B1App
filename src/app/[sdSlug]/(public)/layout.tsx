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

type LayoutParams = Promise<{ sdSlug: string }>;

export const metadata = { robots: { index: false, follow: false } };

export async function generateViewport({ params }: { params: LayoutParams }) {
  const { sdSlug } = await params;

  return { themeColor: "#ffffff" };
}

export default async function MobileLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: LayoutParams;
}) {
  const { sdSlug } = await params;
  const { churchName } = await loadChurchAppearance(sdSlug);

  const appTitle = (churchName && churchName.trim()) || sdSlug || "Church";
  const iconUrl = "/mobile/icon/192";
  const iconUrl512 = "/mobile/icon/512";

  return (
    <>
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
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <PwaRegister />
      <ClientLayout>{children}</ClientLayout>
    </>
  );
}
