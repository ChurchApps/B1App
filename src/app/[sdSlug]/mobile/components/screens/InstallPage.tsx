"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, GlobalStyles, Icon, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { Locale } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

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

const darken = (hex: string, amount: number): string => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.max(0, Math.round(parseInt(m[1], 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(m[2], 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(m[3], 16) * (1 - amount)));
  return `#${[r, g, b].map(n => n.toString(16).padStart(2, "0")).join("")}`;
};

const float = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.05); }
  66% { transform: translate(-30px, 40px) scale(0.95); }
`;

const phonefloat = keyframes`
  0%, 100% { transform: rotate(-4deg) translateY(0); }
  50% { transform: rotate(-4deg) translateY(-12px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const InstallPage = ({ config }: Props) => {
  const churchName = config?.church?.name || "our app";
  const primary = config?.appTheme?.light?.primary || config?.appearance?.primaryColor || "#0D47A1";
  const primaryDark = darken(primary, 0.35);
  const accent = "#f97316";
  const accentDeep = "#ea580c";
  const accentLight = "#fdba74";
  const iconUrl = "/mobile/icon/192";

  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(detectStandalone());

    const target = window.location.href;
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(target)}`);

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
      setStatusMessage(choice.outcome === "accepted" ? "Installing..." : "Install canceled. You can try again any time.");
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
    { icon: "fullscreen", label: "Full-screen, app-like" }
  ]), []);

  const globalStyles = (
    <GlobalStyles styles={{
      "html, body": { margin: 0, padding: 0, scrollBehavior: "smooth" },
      body: { backgroundColor: primaryDark }
    }} />
  );

  if (installed) {
    return (
      <>
        {globalStyles}
        <Box sx={{
          minHeight: "100vh",
          background: `linear-gradient(140deg, ${primary} 0%, ${primaryDark} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3
        }}>
          <Box sx={{
            bgcolor: "#ffffff",
            borderRadius: "24px",
            p: 5,
            textAlign: "center",
            maxWidth: 420,
            width: "100%",
            boxShadow: "0 30px 60px rgba(0,0,0,0.25)"
          }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: "40px",
              bgcolor: "rgba(34, 197, 94, 0.15)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2
            }}>
              <Icon sx={{ fontSize: 44, color: "#22c55e" }}>check_circle</Icon>
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, mb: 1, color: "#0f172a" }}>
              You&apos;re all set!
            </Typography>
            <Typography sx={{ fontSize: 15, color: "#64748b" }}>
              The {churchName} app is installed on this device.
            </Typography>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      {globalStyles}
      <Box sx={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: `radial-gradient(ellipse 900px 700px at 15% 10%, ${accent}4d 0%, transparent 50%),
                     radial-gradient(ellipse 800px 600px at 95% 90%, ${primary}8c 0%, transparent 55%),
                     linear-gradient(135deg, ${primaryDark} 0%, ${primary} 45%, ${primary} 100%)`
      }}>

        <Box aria-hidden sx={{
          position: "absolute",
          width: 400,
          height: 400,
          top: -80,
          right: -80,
          borderRadius: "50%",
          filter: "blur(60px)",
          opacity: 0.6,
          pointerEvents: "none",
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          animation: `${float} 18s ease-in-out infinite`
        }} />
        <Box aria-hidden sx={{
          position: "absolute",
          width: 500,
          height: 500,
          bottom: -150,
          left: -100,
          borderRadius: "50%",
          filter: "blur(60px)",
          opacity: 0.6,
          pointerEvents: "none",
          background: `radial-gradient(circle, ${primary} 0%, transparent 70%)`,
          animation: `${float} 18s ease-in-out infinite`,
          animationDelay: "-6s"
        }} />
        <Box aria-hidden sx={{
          position: "absolute",
          width: 300,
          height: 300,
          top: "40%",
          left: "50%",
          borderRadius: "50%",
          filter: "blur(60px)",
          opacity: 0.35,
          pointerEvents: "none",
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          animation: `${float} 18s ease-in-out infinite`,
          animationDelay: "-12s"
        }} />

        <Box aria-hidden sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 70%)",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 70%)"
        }} />

        <Box sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1240,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          pt: { xs: 3, sm: 4 },
          pb: { xs: 6, sm: 10 },
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>

          <Box sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "#f8fafc",
            mb: { xs: 4, sm: 7 }
          }}>
            <Box sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: "#ffffff",
              p: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              flexShrink: 0
            }}>
              { }
              <img
                src={iconUrl}
                alt={`${churchName} icon`}
                width={32} height={32}
                style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", display: "block" }}
              />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "0.01em" }}>
              {churchName}
            </Typography>
          </Box>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
            gap: { xs: 6, md: 10 },
            alignItems: "center",
            mb: { xs: 5, md: 7 }
          }}>

            <Box sx={{ color: "#f8fafc" }}>
              <Box sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.25,
                px: 1.75,
                py: 1,
                mb: 3.5,
                borderRadius: "999px",
                bgcolor: `${accent}2e`,
                color: accentLight,
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: `1px solid ${accent}59`
              }}>
                <Icon sx={{ fontSize: 14 }}>auto_awesome</Icon>
                One-tap install · No app store
              </Box>

              <Typography component="h1" sx={{
                fontSize: { xs: "2.5rem", sm: "3.5rem", md: "5rem" },
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                mb: 3
              }}>
                Worship, connect,
                <br />
                <Box component="span" sx={{
                  background: `linear-gradient(120deg, ${accentLight} 0%, ${accent} 50%, #fbbf24 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent"
                }}>
                  anywhere you are.
                </Box>
              </Typography>

              <Typography sx={{
                fontSize: { xs: "1.05rem", md: "1.2rem" },
                color: "rgba(248, 250, 252, 0.78)",
                maxWidth: 520,
                lineHeight: 1.65,
                mb: 4.5
              }}>
                Add the {churchName} app to your home screen for fast, full-screen access to sermons, events, giving, and community &mdash; wherever the week takes you.
              </Typography>

              <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 1.75,
                maxWidth: 540
              }}>
                {benefits.map((b) => (
                  <Box key={b.label} sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: "14px 16px",
                    borderRadius: "14px",
                    bgcolor: "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                      transform: "translateY(-2px)",
                      borderColor: `${accent}66`
                    }
                  }}>
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${accent}66`
                    }}>
                      <Icon sx={{ fontSize: 18, color: "#fff" }}>{b.icon}</Icon>
                    </Box>
                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(248, 250, 252, 0.92)" }}>
                      {b.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <PhoneMockup
              churchName={churchName}
              iconUrl={iconUrl}
              primary={primary}
              primaryDark={primaryDark}
              accent={accent}
              accentDeep={accentDeep}
            />
          </Box>

          <Box sx={{
            bgcolor: "#ffffff",
            borderRadius: { xs: "22px", sm: "28px" },
            p: { xs: 3, sm: 5, md: 5.5 },
            boxShadow: "0 40px 100px rgba(0,0,0,0.3)",
            position: "relative",
            zIndex: 3
          }}>

            {platform === null ? (
              <Box sx={{ minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ color: "#64748b", fontSize: 14 }}>{Locale.label("mobile.screens.detectingDevice")}</Typography>
              </Box>
            ) : platform === "ios" ? (
              <IOSInstructions accent={accent} accentDeep={accentDeep} />
            ) : platform === "android" ? (
              <AndroidInstructions
                primary={primary}
                accent={accent}
                accentDeep={accentDeep}
                canInstall={!!deferred}
                installing={installing}
                onInstall={handleInstall}
                statusMessage={statusMessage}
              />
            ) : (
              <DesktopInstructions
                primary={primary}
                accent={accent}
                accentDeep={accentDeep}
                qrUrl={qrUrl}
              />
            )}
          </Box>

          <Typography sx={{
            textAlign: "center",
            mt: 4.5,
            color: "rgba(248, 250, 252, 0.55)",
            fontSize: "0.78rem",
            position: "relative",
            zIndex: 2
          }}>
          </Typography>
        </Box>
      </Box>
    </>
  );
};

interface PhoneMockupProps {
  churchName: string;
  iconUrl: string;
  primary: string;
  primaryDark: string;
  accent: string;
  accentDeep: string;
}

const PhoneMockup = ({ churchName, iconUrl, primary, primaryDark, accent, accentDeep }: PhoneMockupProps) => (
  <Box sx={{
    position: "relative",
    display: { xs: "none", md: "flex" },
    justifyContent: "center",
    alignItems: "center",
    minHeight: 560
  }}>
    <Box aria-hidden sx={{
      position: "relative",
      width: 280,
      height: 570,
      bgcolor: primaryDark,
      borderRadius: "40px",
      border: "10px solid #111827",
      boxShadow: `0 0 0 1.5px #1f2937, 0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${accent}59`,
      overflow: "hidden",
      transform: "rotate(-4deg)",
      animation: `${phonefloat} 6s ease-in-out infinite`
    }}>

      <Box sx={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 90,
        height: 20,
        bgcolor: "#000",
        borderRadius: "0 0 14px 14px",
        zIndex: 10
      }} />

      <Box sx={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, ${primary} 0%, ${primaryDark} 100%)`,
        pt: "50px",
        px: "18px",
        pb: "18px",
        display: "flex",
        flexDirection: "column"
      }}>
        <Box sx={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.8)",
          mb: 2.25,
          fontWeight: 600
        }}>
          <span>9:41</span>
          <span>●●●●● 5G</span>
        </Box>

        <Box sx={{ color: "white", textAlign: "center", pt: 2, pb: 2.5 }}>
          <Box sx={{
            width: 58,
            height: 58,
            bgcolor: "#fff",
            borderRadius: "14px",
            mx: "auto",
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
            p: "6px"
          }}>
            { }
            <img
              src={iconUrl} alt=""
              width={46} height={46}
              style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover" }}
            />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 0.5 }}>
            {churchName}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)" }}>
            This Sunday · 10:30 AM
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 1 }}>
          {[
            { icon: "play_arrow", title: "Sunday Sermon", meta: "Watch now · 42 min" },
            { icon: "event", title: "Youth Night", meta: "Wed · 6:30 PM" },
            { icon: "volunteer_activism", title: "Give securely", meta: "One-tap donation" }
          ].map(card => (
            <Box key={card.title} sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              p: 1.5,
              display: "flex",
              gap: 1.25,
              alignItems: "center",
              backdropFilter: "blur(10px)"
            }}>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Icon sx={{ fontSize: 16, color: "white" }}>{card.icon}</Icon>
              </Box>
              <Box sx={{ color: "white" }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, mb: "2px" }}>{card.title}</Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)" }}>{card.meta}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{
          mt: "auto",
          display: "flex",
          justifyContent: "space-around",
          pt: 1.5,
          pb: "4px",
          borderTop: "1px solid rgba(255,255,255,0.08)"
        }}>
          {[true, false, false, false].map((active, i) => (
            <Box key={i} sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: active ? accent : "rgba(255,255,255,0.08)",
              boxShadow: active ? `0 0 10px ${accent}99` : "none"
            }} />
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
);

const panelHeader = (title: string, subtitle: string) => (
  <Box sx={{ mb: 3.5 }}>
    <Typography component="h2" sx={{
      fontSize: { xs: "1.4rem", sm: "1.6rem" },
      fontWeight: 700,
      color: "#0f172a",
      mb: 0.75
    }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: "0.95rem", color: "#475569", lineHeight: 1.6 }}>
      {subtitle}
    </Typography>
  </Box>
);

interface StepProps { num: number; title: React.ReactNode; body: React.ReactNode; accent: string; accentDeep: string; }
const Step = ({ num, title, body, accent, accentDeep }: StepProps) => (
  <Box sx={{
    position: "relative",
    p: "20px",
    borderRadius: "16px",
    bgcolor: "#f8fafc",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    transition: "all 0.3s ease",
    "&:hover": {
      borderColor: accent,
      transform: "translateY(-3px)",
      boxShadow: "0 8px 32px rgba(15, 37, 99, 0.12)"
    }
  }}>
    <Box sx={{
      position: "absolute",
      top: -14,
      left: 20,
      width: 32,
      height: 32,
      borderRadius: "10px",
      background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
      color: "white",
      fontWeight: 800,
      fontSize: "0.95rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 4px 12px ${accent}66`
    }}>
      {num}
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mt: 1.25, mb: 0.75, color: "#0f172a" }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.55 }}>
      {body}
    </Typography>
  </Box>
);

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <Box component="kbd" sx={{
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    px: "8px",
    py: "2px",
    mx: "2px",
    bgcolor: "#ffffff",
    border: "1px solid rgba(148, 163, 184, 0.3)",
    borderRadius: "6px",
    fontFamily: "inherit",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#1e3a8a"
  }}>
    {children}
  </Box>
);

interface AndroidProps {
  primary: string;
  accent: string;
  accentDeep: string;
  canInstall: boolean;
  installing: boolean;
  onInstall: () => void;
  statusMessage: string | null;
}

const AndroidInstructions = ({ accent, accentDeep, canInstall, installing, onInstall, statusMessage }: AndroidProps) => (
  <Box sx={{ animation: `${fadeIn} 0.4s ease-out` }}>
    {panelHeader("Install on Android", "Chrome will add the app to your home screen in one tap.")}

    <Box sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(240px, 1fr))" },
      gap: 2,
      mb: 3.5,
      mt: 2
    }}>
      <Step num={1} title="Open in Chrome" body="If you're not already, open this page in Chrome on your Android device." accent={accent} accentDeep={accentDeep} />
      <Step num={2} title="Tap the install button" body="Chrome will add the app to your home screen in one tap." accent={accent} accentDeep={accentDeep} />
      <Step num={3} title="You're in!" body="Launch the app from your home screen any time — just like any other app." accent={accent} accentDeep={accentDeep} />
    </Box>

    <Box
      role="button"
      tabIndex={canInstall && !installing ? 0 : -1}
      aria-disabled={!canInstall || installing}
      onClick={() => { if (canInstall && !installing) onInstall(); }}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && canInstall && !installing) onInstall(); }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.25,
        width: "100%",
        py: "18px",
        borderRadius: "14px",
        background: canInstall && !installing
          ? `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`
          : "#cbd5e1",
        color: canInstall && !installing ? "#ffffff" : "#64748b",
        fontWeight: 700,
        fontSize: "1rem",
        letterSpacing: "0.02em",
        cursor: canInstall && !installing ? "pointer" : "not-allowed",
        boxShadow: canInstall && !installing ? `0 10px 30px ${accent}66` : "none",
        transition: "all 0.3s ease",
        "&:hover": canInstall && !installing ? {
          transform: "translateY(-2px)",
          boxShadow: `0 16px 36px ${accent}80`
        } : {}
      }}
    >
      <Icon sx={{ fontSize: 22 }}>{installing ? "hourglass_top" : "download"}</Icon>
      {installing ? "Installing..." : canInstall ? "Install on Home Screen" : "Install Not Available"}
    </Box>

    {!canInstall && !installing && (
      <Typography sx={{ mt: 1.75, fontSize: 13, color: "#64748b", textAlign: "center" }}>
        If the button is greyed out, open this page in Chrome, then tap the menu (⋮) and choose <strong>Install app</strong>.
      </Typography>
    )}

    {statusMessage && (
      <Typography sx={{ mt: 1.5, fontSize: 13, color: "#64748b", textAlign: "center" }}>
        {statusMessage}
      </Typography>
    )}
  </Box>
);

const IOSInstructions = ({ accent, accentDeep }: { accent: string; accentDeep: string }) => (
  <Box sx={{ animation: `${fadeIn} 0.4s ease-out` }}>
    {panelHeader("Install on iPhone", "Safari is required — just three taps and you're in.")}

    <Box sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(240px, 1fr))" },
      gap: 2,
      mb: 3,
      mt: 2
    }}>
      <Step num={1} title="Open in Safari" body={<>iPhone installs only work in Safari. If you&apos;re in Chrome, tap the share icon and choose <Kbd>Open in Safari</Kbd>.</>} accent={accent} accentDeep={accentDeep} />
      <Step num={2} title={<>Tap the <Kbd>Share</Kbd> button</>} body="Find the share icon at the bottom of Safari — the square with the upward arrow." accent={accent} accentDeep={accentDeep} />
      <Step num={3} title="Add to Home Screen" body={<>Scroll down, tap <Kbd>Add to Home Screen</Kbd>, then <Kbd>Add</Kbd>. Done!</>} accent={accent} accentDeep={accentDeep} />
    </Box>

    <Box sx={{
      mt: 2,
      p: 2,
      borderRadius: "12px",
      bgcolor: "rgba(254, 170, 36, 0.1)",
      display: "flex",
      alignItems: "flex-start",
      gap: 1.25
    }}>
      <Icon sx={{ fontSize: 20, color: "#d97706", mt: "1px" }}>info</Icon>
      <Typography sx={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>
        Using Chrome or another browser on iPhone? Apple requires Safari to install web apps. There is no one-tap install button — the steps above are the Apple way.
      </Typography>
    </Box>
  </Box>
);

interface DesktopProps { primary: string; accent: string; accentDeep: string; qrUrl: string; }

const DesktopInstructions = ({ primary, accent, accentDeep, qrUrl }: DesktopProps) => (
  <Box sx={{ animation: `${fadeIn} 0.4s ease-out` }}>
    {panelHeader("Install on your phone", "Scan the QR code with your phone camera — you'll land right back on this page to install.")}

    <Box sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "260px 1fr" },
      gap: { xs: 3, sm: 4.5 },
      alignItems: "center",
      py: 0.5
    }}>
      <Box sx={{
        position: "relative",
        p: 2.5,
        bgcolor: "#ffffff",
        borderRadius: "20px",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        boxShadow: "0 8px 32px rgba(15, 37, 99, 0.12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mx: { xs: "auto", sm: 0 },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "-2px",
          borderRadius: "22px",
          padding: "2px",
          background: `linear-gradient(135deg, ${accent}, ${primary})`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none"
        }
      }}>
        {qrUrl ? (

          <img
            src={qrUrl}
            alt="QR code linking to this install page"
            width={220} height={220}
            style={{ width: 220, height: 220, display: "block", background: "#fff", borderRadius: 8 }}
          />
        ) : (
          <Box sx={{ width: 220, height: 220, bgcolor: "#f8fafc", borderRadius: "8px" }} />
        )}
        <Typography sx={{
          mt: 1.75,
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "#475569",
          textAlign: "center",
          lineHeight: 1.4
        }}>
          <Box component="span" sx={{ color: "#0f172a" }}>{Locale.label("mobile.screens.scanWithPhone")}</Box>
          <br />to open this page and install
        </Typography>
      </Box>

      <Box>
        <Typography sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: accentDeep,
          mb: 1.5
        }}>
          You&apos;re on desktop
        </Typography>
        <Typography sx={{
          fontSize: "1.3rem",
          fontWeight: 700,
          lineHeight: 1.2,
          color: "#0f172a",
          mb: 1.75
        }}>
          Install on your phone in three steps
        </Typography>
        <Typography sx={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.65, mb: 2.25 }}>
          The app is designed for your phone. Point your phone&apos;s camera at the QR code and follow the link to install.
        </Typography>
        <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexDirection: "column", gap: 1.25 }}>
          {[
            "Open your phone's camera app",
            "Point it at the QR code — tap the notification",
            "Follow the install instructions on your phone"
          ].map((text, i) => (
            <Box component="li" key={i} sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              fontSize: "0.9rem",
              color: "#0f172a"
            }}>
              <Box sx={{
                width: 26,
                height: 26,
                borderRadius: "8px",
                background: `linear-gradient(135deg, ${primary}, ${accent})`,
                color: "white",
                fontWeight: 700,
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                {i + 1}
              </Box>
              {text}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
);
