"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Icon, Typography } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

type Platform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
};

const detectStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  if ((window.navigator as any).standalone === true) return true;
  return false;
};

export const InstallPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const churchName = config?.church?.name || "our app";
  const primary = config?.appearance?.primaryColor || tc.primary;
  const secondary = tc.secondary;
  const iconUrl = "/mobile/icon/192";

  const [platform, setPlatform] = useState<Platform>("desktop");
  const [activeTab, setActiveTab] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    setActiveTab(p === "desktop" ? "android" : p);
    setInstalled(detectStandalone());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setStatusMessage("Installed! Look for the icon on your home screen.");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      setInstalling(true);
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setStatusMessage("Installing...");
      } else {
        setStatusMessage("Install canceled. You can try again any time.");
      }
      setDeferred(null);
    } catch {
      setStatusMessage("Something went wrong. Please try again.");
    } finally {
      setInstalling(false);
    }
  };

  const benefits = useMemo(() => ([
    { icon: "bolt", label: "Instant access" },
    { icon: "wifi_off", label: "Works offline" },
    { icon: "notifications_active", label: "Stay in the loop" },
    { icon: "fullscreen", label: "Full-screen, app-like" },
  ]), []);

  if (installed) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, minHeight: "100%", bgcolor: tc.background }}>
        <Box sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.xl}px`,
          p: 4,
          textAlign: "center",
          boxShadow: mobileTheme.shadows.md,
        }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: "40px",
            bgcolor: "rgba(112, 220, 135, 0.15)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 2,
          }}>
            <Icon sx={{ fontSize: 44, color: tc.success }}>check_circle</Icon>
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text, mb: 1 }}>
            You&apos;re all set!
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
            The {churchName} app is installed on this device.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pb: 4 }}>
      {/* Hero */}
      <Box sx={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(140deg, ${primary} 0%, ${secondary} 100%)`,
        color: "#FFFFFF",
        pt: 4, pb: 6,
        px: `${mobileTheme.spacing.md}px`,
      }}>
        {/* Decorative blobs */}
        <Box sx={{
          position: "absolute", top: -60, right: -60,
          width: 220, height: 220, borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.08)",
        }} />
        <Box sx={{
          position: "absolute", bottom: -80, left: -40,
          width: 180, height: 180, borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.06)",
        }} />

        <Box sx={{ position: "relative", textAlign: "center", maxWidth: 460, mx: "auto" }}>
          {/* Phone mockup with app icon */}
          <Box sx={{
            position: "relative",
            display: "inline-block",
            mb: 3,
          }}>
            <Box sx={{
              width: 132, height: 132,
              borderRadius: "30px",
              bgcolor: "#FFFFFF",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25), 0 8px 16px rgba(0,0,0,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              p: "10px",
              transform: "rotate(-4deg)",
              transition: "transform 600ms ease",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconUrl}
                alt={`${churchName} icon`}
                width={112}
                height={112}
                style={{ width: 112, height: 112, borderRadius: 22, objectFit: "cover", display: "block" }}
              />
            </Box>
            {/* Floating sparkle */}
            <Box sx={{
              position: "absolute",
              top: -10, right: -14,
              width: 36, height: 36, borderRadius: "18px",
              bgcolor: "#FFFFFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
              transform: "rotate(8deg)",
            }}>
              <Icon sx={{ fontSize: 20, color: primary }}>auto_awesome</Icon>
            </Box>
          </Box>

          <Typography sx={{
            fontSize: { xs: 30, sm: 34 },
            fontWeight: 800,
            lineHeight: 1.1,
            mb: 1.5,
            letterSpacing: "-0.02em",
            textShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}>
            Get the {churchName} app!
          </Typography>
          <Typography sx={{
            fontSize: 16,
            opacity: 0.92,
            lineHeight: 1.45,
            maxWidth: 380, mx: "auto",
          }}>
            Add it to your home screen for fast, full-screen access &mdash; no app store required.
          </Typography>
        </Box>
      </Box>

      {/* Benefits strip */}
      <Box sx={{
        px: `${mobileTheme.spacing.md}px`,
        mt: -3,
        mb: 3,
        position: "relative",
        zIndex: 1,
      }}>
        <Box sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.xl}px`,
          boxShadow: mobileTheme.shadows.lg,
          p: 2,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
        }}>
          {benefits.map((b) => (
            <Box key={b.label} sx={{
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              p: "8px 4px",
            }}>
              <Box sx={{
                width: 38, height: 38, borderRadius: "19px",
                bgcolor: tc.iconBackground,
                display: "flex", alignItems: "center", justifyContent: "center",
                mb: 0.75,
              }}>
                <Icon sx={{ fontSize: 20, color: primary }}>{b.icon}</Icon>
              </Box>
              <Typography sx={{
                fontSize: 11, fontWeight: 600, color: tc.text, lineHeight: 1.2,
              }}>
                {b.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Platform tabs (when desktop or want to preview) */}
      {platform === "desktop" && (
        <Box sx={{ px: `${mobileTheme.spacing.md}px`, mb: 2 }}>
          <Box sx={{
            display: "inline-flex",
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            p: "4px",
            boxShadow: mobileTheme.shadows.sm,
          }}>
            {([
              { key: "android" as const, label: "Android", icon: "android" },
              { key: "ios" as const, label: "iPhone", icon: "phone_iphone" },
            ]).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Box
                  key={tab.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab(tab.key)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveTab(tab.key); }}
                  sx={{
                    display: "inline-flex", alignItems: "center", gap: 0.75,
                    px: 2, py: "8px",
                    borderRadius: `${mobileTheme.radius.md}px`,
                    cursor: "pointer",
                    bgcolor: active ? primary : "transparent",
                    color: active ? "#FFFFFF" : tc.textMuted,
                    transition: "all 150ms ease",
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  <Icon sx={{ fontSize: 18 }}>{tab.icon}</Icon>
                  {tab.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Instruction card */}
      <Box sx={{ px: `${mobileTheme.spacing.md}px` }}>
        {activeTab === "android" ? (
          <AndroidCard
            primary={primary}
            canInstall={!!deferred}
            installing={installing}
            statusMessage={statusMessage}
            onInstall={handleInstall}
            churchName={churchName}
            preview={platform === "desktop"}
          />
        ) : (
          <IOSCard primary={primary} preview={platform === "desktop"} />
        )}
      </Box>
    </Box>
  );
};

interface AndroidProps {
  primary: string;
  canInstall: boolean;
  installing: boolean;
  statusMessage: string | null;
  onInstall: () => void;
  churchName: string;
  preview: boolean;
}

const AndroidCard = ({ primary, canInstall, installing, statusMessage, onInstall, churchName, preview }: AndroidProps) => {
  const tc = mobileTheme.colors;
  return (
    <Box sx={{
      bgcolor: tc.surface,
      borderRadius: `${mobileTheme.radius.xl}px`,
      p: 3,
      boxShadow: mobileTheme.shadows.md,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: "18px",
          bgcolor: "rgba(13, 71, 161, 0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon sx={{ fontSize: 22, color: primary }}>android</Icon>
        </Box>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>
          Install on Android
        </Typography>
      </Box>

      {preview ? (
        <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2.5, lineHeight: 1.5 }}>
          On your Android device, open this page in Chrome and tap the install button below. Chrome will add the {churchName} app to your home screen in one tap.
        </Typography>
      ) : canInstall ? (
        <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2.5, lineHeight: 1.5 }}>
          Tap the button below and confirm to add {churchName} to your home screen.
        </Typography>
      ) : (
        <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2.5, lineHeight: 1.5 }}>
          To install, open this page in Chrome, then tap the menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>.
        </Typography>
      )}

      <Box
        role="button"
        tabIndex={canInstall && !installing ? 0 : -1}
        aria-disabled={!canInstall || installing}
        onClick={() => { if (canInstall && !installing) onInstall(); }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && canInstall && !installing) onInstall();
        }}
        sx={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
          width: "100%",
          py: "14px",
          borderRadius: `${mobileTheme.radius.lg}px`,
          background: canInstall && !installing
            ? `linear-gradient(135deg, ${primary} 0%, ${tc.secondary} 100%)`
            : tc.disabled,
          color: "#FFFFFF",
          cursor: canInstall && !installing ? "pointer" : "not-allowed",
          fontWeight: 700,
          fontSize: 16,
          boxShadow: canInstall && !installing ? "0 6px 16px rgba(13, 71, 161, 0.3)" : "none",
          transition: "transform 120ms ease, box-shadow 150ms ease",
          "&:hover": canInstall && !installing ? { transform: "translateY(-1px)", boxShadow: "0 8px 20px rgba(13, 71, 161, 0.35)" } : {},
          "&:active": canInstall && !installing ? { transform: "translateY(0)" } : {},
        }}
      >
        <Icon sx={{ fontSize: 22 }}>{installing ? "hourglass_top" : "download"}</Icon>
        {installing ? "Installing..." : canInstall ? "Install App" : "Install Not Available"}
      </Box>

      {statusMessage && (
        <Typography sx={{
          mt: 1.5, fontSize: 13, color: tc.textMuted, textAlign: "center",
        }}>
          {statusMessage}
        </Typography>
      )}
    </Box>
  );
};

interface IOSProps {
  primary: string;
  preview: boolean;
}

const IOSCard = ({ primary, preview }: IOSProps) => {
  const tc = mobileTheme.colors;
  const steps = [
    {
      title: "Open in Safari",
      body: "iPhone installs work in Apple's Safari browser only.",
      visual: <Icon sx={{ fontSize: 28, color: primary }}>open_in_browser</Icon>,
    },
    {
      title: "Tap the Share button",
      body: "It's the square with an up-arrow in Safari's toolbar.",
      visual: <ShareIconGlyph color={primary} />,
    },
    {
      title: "Choose \"Add to Home Screen\"",
      body: "Scroll down in the share sheet if you don't see it right away.",
      visual: <Icon sx={{ fontSize: 28, color: primary }}>add_box</Icon>,
    },
    {
      title: "Tap \"Add\"",
      body: "Confirm in the upper-right corner. The app icon lands on your home screen.",
      visual: <Icon sx={{ fontSize: 28, color: primary }}>check_circle</Icon>,
    },
  ];

  return (
    <Box sx={{
      bgcolor: tc.surface,
      borderRadius: `${mobileTheme.radius.xl}px`,
      p: 3,
      boxShadow: mobileTheme.shadows.md,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: "18px",
          bgcolor: "rgba(13, 71, 161, 0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon sx={{ fontSize: 22, color: primary }}>phone_iphone</Icon>
        </Box>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>
          Install on iPhone {preview && <span style={{ fontSize: 13, color: tc.textMuted, fontWeight: 500 }}>&nbsp;(preview)</span>}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {steps.map((step, idx) => (
          <Box key={step.title} sx={{
            display: "flex", alignItems: "flex-start", gap: 1.75,
            p: 1.5,
            borderRadius: `${mobileTheme.radius.lg}px`,
            bgcolor: tc.surfaceVariant,
          }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: "16px",
              bgcolor: primary, color: "#FFFFFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14,
              flexShrink: 0,
            }}>
              {idx + 1}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text, mb: 0.25 }}>
                {step.title}
              </Typography>
              <Typography sx={{ fontSize: 13, color: tc.textMuted, lineHeight: 1.45 }}>
                {step.body}
              </Typography>
            </Box>
            <Box sx={{
              width: 44, height: 44,
              borderRadius: `${mobileTheme.radius.md}px`,
              bgcolor: tc.surface,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: mobileTheme.shadows.sm,
            }}>
              {step.visual}
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{
        mt: 2, p: 1.5,
        borderRadius: `${mobileTheme.radius.md}px`,
        bgcolor: "rgba(254, 170, 36, 0.1)",
        display: "flex", alignItems: "center", gap: 1,
      }}>
        <Icon sx={{ fontSize: 18, color: tc.warning }}>info</Icon>
        <Typography sx={{ fontSize: 12, color: tc.text, lineHeight: 1.4 }}>
          Using Chrome or another browser on iPhone? Apple requires Safari to install web apps.
        </Typography>
      </Box>
    </Box>
  );
};

const ShareIconGlyph = ({ color }: { color: string }) => (
  <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M11 1.5L11 16.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M6 6.5L11 1.5L16 6.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 11.5V22.5C3 23.6046 3.89543 24.5 5 24.5H17C18.1046 24.5 19 23.6046 19 22.5V11.5"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
