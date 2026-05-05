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

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/mobile/manifest.webmanifest" />
      <link rel="preconnect" href="https://content.churchapps.org" />
      <link rel="preconnect" href="https://content.lessons.church" />
      <MobileClientLayout>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <PwaRegister />
        {children}
      </MobileClientLayout>
    </>
  );
}
