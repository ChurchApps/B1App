import type { Metadata } from "next";
import { PwaRegister } from "./PwaRegister";

type Params = Promise<{ sdSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sdSlug } = await params;
  if (sdSlug === "ironwood") {
    return { manifest: "/my/manifest.webmanifest" };
  }
  return {};
}

export default async function MyLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { sdSlug } = await params;
  return (
    <>
      {sdSlug === "ironwood" && <PwaRegister />}
      {children}
    </>
  );
}
