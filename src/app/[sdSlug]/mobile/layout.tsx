import type { Metadata } from "next";
import { PwaRegister } from "./PwaRegister";
import { MobileClientLayout } from "./MobileClientLayout";
import { loadChurchAppearance } from "./loadChurchAppearance";

type LayoutParams = Promise<{ sdSlug: string }>;

export async function generateMetadata({ params }: { params: LayoutParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  const { primaryColor } = await loadChurchAppearance(sdSlug);
  return {
    manifest: "/mobile/manifest.webmanifest",

    themeColor: primaryColor || "#0D47A1",
    viewport: {

      width: "device-width",
      initialScale: 1,
      viewportFit: "cover"
    },
    robots: { index: false, follow: false }
  };
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileClientLayout>
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <link rel="preconnect" href="https://content.churchapps.org" />
      <link rel="preconnect" href="https://content.lessons.church" />
      <PwaRegister />
      {children}
    </MobileClientLayout>
  );
}
