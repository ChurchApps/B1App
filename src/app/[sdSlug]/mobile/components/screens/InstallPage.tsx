"use client";

import React, { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { QRCodeSVG } from "qrcode.react";
import { Locale } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { InstallPromptHelper } from "@/helpers";
import { MobileThemeProvider } from "../MobileThemeProvider";
import { mobileTheme } from "../mobileTheme";
import { PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, TextLink } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

type Platform = "ios" | "android" | "desktop";

const tc = mobileTheme.colors;

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
};

const detectStandalone = (platform: Platform): boolean => {
  if (typeof window === "undefined") return false;
  if (platform === "ios") {
    // Navigator.standalone is the only trustworthy signal; display-mode:standalone has false positives in in-app browsers.
    return (window.navigator as any).standalone === true;
  }
  return !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
};

const withKbd = (text: string) =>
  text.split(/\[|\]/).map((part, i) => (i % 2 ? <Box key={i} component="kbd" sx={{ fontFamily: "inherit", fontWeight: 600 }}>{part}</Box> : part));

const Muted = ({ children, sx }: { children: React.ReactNode; sx?: object }) => (
  <Typography sx={{ fontSize: 14, lineHeight: "20px", color: tc.textSecondary, ...sx }}>{children}</Typography>
);

const Steps = ({ steps }: { steps: { title: React.ReactNode; body?: React.ReactNode }[] }) => (
  <RowList>
    {steps.map((s, i) => (
      <Row
        key={i}
        leading={(
          <Box sx={{ width: 32, height: 32, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: tc.chip, color: tc.onChip, fontSize: 14, fontWeight: 650 }}>
            {i + 1}
          </Box>
        )}
        title={s.title}
        subtitle={s.body}
      />
    ))}
  </RowList>
);

export const InstallPage = ({ config }: Props) => (
  <MobileThemeProvider config={config}>
    <InstallContent config={config} />
  </MobileThemeProvider>
);

const InstallContent = ({ config }: Props) => {
  const churchName = config?.church?.name || Locale.label("mobile.install.ourApp");

  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [installUrl, setInstallUrl] = useState<string>("");

  useEffect(() => {
    InstallPromptHelper.start();
    const p = detectPlatform();
    setPlatform(p);

    // iOS may launch to stale URLs; redirect installed PWA users to dashboard.
    if (detectStandalone(p)) {
      const dashboardUrl = window.location.pathname.replace(/\/mobile\/install\/?$/, "/mobile/dashboard");
      window.location.replace(dashboardUrl);
      return;
    }

    setInstallUrl(window.location.href);

    const unsubscribe = InstallPromptHelper.subscribe((state) => {
      setInstalled(state.installed);
      setCanInstall(!!state.deferred && !state.installed);
      if (state.installed) {
        setStatusMessage(Locale.label("mobile.install.statusInstalled"));
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const refresh = () => {
      const nextPlatform = detectPlatform();
      setPlatform(nextPlatform);
      setInstalled(detectStandalone(nextPlatform) || InstallPromptHelper.getState().installed);
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);

  const handleInstall = async () => {
    const { deferred } = InstallPromptHelper.getState();
    if (!deferred) {
      setStatusMessage(Locale.label("mobile.install.statusUnavailable"));
      return;
    }
    try {
      setInstalling(true);
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setStatusMessage(choice.outcome === "accepted" ? Locale.label("mobile.install.statusInstalling") : Locale.label("mobile.install.statusCanceled"));
      InstallPromptHelper.clearDeferredPrompt();
    } catch {
      setStatusMessage(Locale.label("mobile.install.statusError"));
    } finally {
      setInstalling(false);
    }
  };

  const installActions = (label: string, fallback?: React.ReactNode) => (
    <>
      {!(canInstall || installing) && fallback && <Muted sx={{ mt: "14px" }}>{fallback}</Muted>}
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", alignItems: "center", gap: "16px", mt: "14px" }}>
        {(canInstall || installing) && (
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleInstall} disabled={installing}>
            {installing ? Locale.label("mobile.install.statusInstalling") : label}
          </Button>
        )}
        <TextLink href="/mobile/dashboard">{Locale.label("mobile.install.continueInBrowser")}</TextLink>
      </Stack>
      {statusMessage && <Muted sx={{ mt: "10px" }}>{statusMessage}</Muted>}
    </>
  );

  const renderPlatform = () => {
    if (platform === null) return <PlateSection><QuietEmpty>{Locale.label("mobile.screens.detectingDevice")}</QuietEmpty></PlateSection>;

    if (platform === "ios") {
      return (
        <PlateSection title={Locale.label("mobile.install.iosTitle")}>
          <Muted>{Locale.label("mobile.install.iosSubtitle")}</Muted>
          <Steps steps={[
            { title: Locale.label("mobile.install.iosStep1Title"), body: withKbd(Locale.label("mobile.install.iosStep1Body")) },
            { title: withKbd(Locale.label("mobile.install.iosStep2Title")), body: Locale.label("mobile.install.iosStep2Body") },
            { title: Locale.label("mobile.install.iosStep3Title"), body: withKbd(Locale.label("mobile.install.iosStep3Body")) }
          ]} />
          <Muted sx={{ mt: "10px" }}>{Locale.label("mobile.install.iosNote")}</Muted>
        </PlateSection>
      );
    }

    if (platform === "android") {
      return (
        <PlateSection title={Locale.label("mobile.install.androidTitle")}>
          <Muted>{Locale.label("mobile.install.androidSubtitle")}</Muted>
          <Steps steps={[
            { title: Locale.label("mobile.install.androidStep1Title"), body: Locale.label("mobile.install.androidStep1Body") },
            { title: Locale.label("mobile.install.androidStep2Title"), body: Locale.label("mobile.install.androidStep2Body") },
            { title: Locale.label("mobile.install.androidStep3Title"), body: Locale.label("mobile.install.androidStep3Body") }
          ]} />
          {installActions(Locale.label("mobile.install.androidInstallCta"), withKbd(Locale.label("mobile.install.androidMenuFallback")))}
        </PlateSection>
      );
    }

    return (
      <>
        <PlateSection title={Locale.label("mobile.install.desktopTitle")}>
          <Muted>{Locale.label("mobile.install.desktopSubtitle")}</Muted>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" }, gap: { xs: "20px", sm: "32px" }, alignItems: "center", mt: "18px" }}>
            <Box sx={{ justifySelf: { xs: "center", sm: "start" }, textAlign: "center" }}>
              {/* QR codes need a light quiet zone to scan, even in dark mode. */}
              <Box sx={{ p: "12px", bgcolor: "#fff", border: `1px solid ${tc.border}`, borderRadius: "10px", lineHeight: 0, display: "inline-block" }}>
                {installUrl
                  ? <QRCodeSVG value={installUrl} size={220} title={Locale.label("mobile.install.qrAlt")} />
                  : <Box sx={{ width: 220, height: 220 }} />}
              </Box>
              <Typography sx={{ mt: "10px", fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>
                <Box component="span" sx={{ color: tc.text, fontWeight: 600 }}>{Locale.label("mobile.screens.scanWithPhone")}</Box>
                <br />{Locale.label("mobile.install.scanCaption")}
              </Typography>
            </Box>
            <Steps steps={[
              { title: Locale.label("mobile.install.desktopStep1") },
              { title: Locale.label("mobile.install.desktopStep2") },
              { title: Locale.label("mobile.install.desktopStep3") }
            ]} />
          </Box>
        </PlateSection>
        <PlateSection>{installActions(Locale.label("mobile.install.desktopInstallCta"))}</PlateSection>
      </>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: tc.background, color: tc.text, pb: `calc(48px + ${mobileTheme.safe.bottom})` }}>
      <Box component="header" sx={{ pt: mobileTheme.safe.top }}>
        <Box sx={{ height: mobileTheme.headerHeight, maxWidth: 880, mx: "auto", px: { xs: "16px", md: "32px" }, display: "flex", alignItems: "center", gap: "10px" }}>
          <Box component="img" src="/mobile/icon/192" alt="" sx={{ width: 30, height: 30, borderRadius: "8px", objectFit: "cover", flex: "none" }} />
          <Typography noWrap sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>{churchName}</Typography>
        </Box>
      </Box>
      <Box component="main" sx={{ maxWidth: 880, mx: "auto", px: { md: "32px" }, pt: { xs: "12px", md: "28px" } }}>
        {installed ? (
          <PageHead title={Locale.label("mobile.install.allSetTitle")} lede={Locale.label("mobile.install.allSetBody").replace("{}", churchName)} />
        ) : (
          <>
            <PageHead title={Locale.label("mobile.install.title").replace("{}", churchName)} lede={Locale.label("mobile.install.lede")} />
            <Plate>{renderPlatform()}</Plate>
          </>
        )}
      </Box>
    </Box>
  );
};
