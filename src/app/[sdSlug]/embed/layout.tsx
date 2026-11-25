import "material-icons/iconfont/filled.css";
import "react-activity/dist/Dots.css";
import "@/styles/vendor/pages.css";
import "@/styles/member.css";
import "@/styles/buttons.css";
import "@/styles/embed.css";
import type { Metadata } from "next";
import { CssBaseline } from "@mui/material";
import { DateHelper } from "@churchapps/helpers";
import ClientLayout from "@/app/ClientLayout";
import { Theme } from "@/components/Theme";
import { ChurchDateLocale } from "@/components/ChurchDateLocale";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { EmbedHeightReporter } from "./components/EmbedHeightReporter";
import { EmbedLinkGuard } from "./components/EmbedLinkGuard";

type LayoutParams = Promise<{ sdSlug: string }>;

// Pages a church places on its own website in an iframe. Middleware (src/middleware.ts) lets the domains the
// church listed frame exactly these routes, so they carry the church's theme and the content, nothing else:
// no header, footer, banner, launcher, analytics or app-install prompts, and no member session.

// Rendered per request so every response gets its own script nonce.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EmbedLayout({ children, params }: { children: React.ReactNode; params: LayoutParams }) {
  const { sdSlug } = await params;
  await EnvironmentHelper.initServerSide();
  const config = await ConfigHelper.load(sdSlug, "website");
  const region = (config.appearance as { region?: string })?.region;
  DateHelper.setLocale(region);
  // Theme also runs the church's custom JavaScript (chat widgets, trackers); an embed takes the look only.
  const themeConfig = { ...config, globalStyles: { ...config.globalStyles, customJS: "" } };

  return (
    <ChurchDateLocale region={region}>
      <ClientLayout embed>
        <Theme config={themeConfig} />
        <CssBaseline />
        <EmbedHeightReporter />
        <EmbedLinkGuard />
        <main id="main-content" className="page" data-testid="embed-page" style={{ padding: "16px 0" }}>
          {children}
        </main>
      </ClientLayout>
    </ChurchDateLocale>
  );
}
