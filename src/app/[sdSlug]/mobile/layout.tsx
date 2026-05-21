import type { Metadata, Viewport } from "next";
import { PwaRegister } from "./PwaRegister";
import { MobileClientLayout } from "./MobileClientLayout";
import { loadChurchAppearance } from "./loadChurchAppearance";

type LayoutParams = Promise<{ sdSlug: string }>;

export const metadata: Metadata = { robots: { index: false, follow: false } };

export async function generateViewport({ params }: { params: LayoutParams }): Promise<Viewport> {
  const { sdSlug } = await params;
  const { primaryColor } = await loadChurchAppearance(sdSlug);
  return {
    themeColor: primaryColor || "#0D47A1",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover"
  };
}

export default async function MobileLayout({ children, params }: { children: React.ReactNode; params: LayoutParams }) {
  const { sdSlug } = await params;
  const { churchName } = await loadChurchAppearance(sdSlug);
  const appTitle = (churchName && churchName.trim()) || sdSlug || "Church";
  const iconUrl = `/${sdSlug}/mobile/icon/192`;
  const iconUrl512 = `/${sdSlug}/mobile/icon/512`;

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
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){if(typeof window==="undefined")return;var state=window.__b1InstallPromptState=window.__b1InstallPromptState||{deferredPrompt:null,installed:false};var detect=function(){try{return !!((window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||(window.navigator&&window.navigator.standalone===true));}catch(_e){return false;}};state.installed=detect();window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();state.deferredPrompt=e;state.installed=false;});window.addEventListener("appinstalled",function(){state.installed=true;state.deferredPrompt=null;});window.addEventListener("pageshow",function(){state.installed=detect();if(state.installed)state.deferredPrompt=null;});})();`
        }}
      />
      <MobileClientLayout>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <PwaRegister />
        {children}
      </MobileClientLayout>
    </>
  );
}
