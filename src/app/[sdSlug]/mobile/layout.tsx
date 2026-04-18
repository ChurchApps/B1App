import type { Metadata } from "next";
import { PwaRegister } from "./PwaRegister";
import { MobileClientLayout } from "./MobileClientLayout";

export async function generateMetadata(): Promise<Metadata> {
  return {
    manifest: "/mobile/manifest.webmanifest",
    themeColor: "#0D47A1",
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      viewportFit: "cover",
    },
    robots: { index: false, follow: false },
  };
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileClientLayout>
      <link rel="preconnect" href="https://content.churchapps.org" />
      <link rel="preconnect" href="https://content.lessons.church" />
      <PwaRegister />
      {children}
    </MobileClientLayout>
  );
}
