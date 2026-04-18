import type { Metadata } from "next";
import { PwaRegister } from "./PwaRegister";
import { isMobileShellEnabled } from "@/helpers/MobileShellHelper";

type Params = Promise<{ sdSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sdSlug } = await params;
  if (isMobileShellEnabled(sdSlug)) {
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
  return {};
}

export default async function MobileLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { sdSlug } = await params;
  return (
    <>
      {isMobileShellEnabled(sdSlug) && <PwaRegister />}
      {children}
    </>
  );
}
