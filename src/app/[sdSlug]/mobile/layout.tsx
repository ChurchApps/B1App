import type { Metadata } from "next";
import { PwaRegister } from "./PwaRegister";

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
  };
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaRegister />
      {children}
    </>
  );
}
