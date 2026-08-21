import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap"
});

export const metadata = {
  title: "ChurchApps",
  description: "Open Source Software for Churches"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await EnvironmentHelper.initServerSide();
  try { // debug-1001
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("host") || "";
    if (host.endsWith(".vercel.app")) await fetch("https://" + host + "/api/debug-1001", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "hit", site: h.get("x-site"), path: h.get("x-nextjs-rewritten-path") }) }).catch(() => {});
  } catch { /* ignore */ }

  return (
    <html className={roboto.className}>
      <body>{children}</body>
    </html>
  );
}
