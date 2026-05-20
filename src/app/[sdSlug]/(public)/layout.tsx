import type { Metadata } from "next";
import "react-activity/dist/Dots.css";
import "@/styles/vendor/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@/styles/sidebar.css";
import "@/styles/master-detail.css";
import ClientLayout from "@/app/ClientLayout";
import { PwaRegister } from "../mobile/PwaRegister";

type LayoutParams = Promise<{ sdSlug: string }>;

export async function generateMetadata({ params }: { params: LayoutParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  return {
    manifest: `/manifest.webmanifest?church=${encodeURIComponent(sdSlug)}`
  };
}

export default async function PublicLayout({ children, params }: { children: React.ReactNode; params: LayoutParams }) {
  await params;
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <link rel="stylesheet" href="/apphelper/css/markdown/editor.css" />
      <PwaRegister />
      <ClientLayout>{children}</ClientLayout>
    </>
  );
}
