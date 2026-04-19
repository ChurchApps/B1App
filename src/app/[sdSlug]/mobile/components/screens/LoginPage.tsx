"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { LoginPage as SharedLoginPage } from "@churchapps/apphelper-login";
import UserContext from "@/context/UserContext";
import { PersonHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
  keyName?: string;
}

/**
 * Mobile-shell login screen. Wraps the shared `@churchapps/apphelper-login`
 * `LoginPage` inside the mobile theme so users stay within the mobile UI
 * instead of being bounced out to the public desktop login page.
 *
 * Default `returnUrl` lands mobile-initiated sign-ins on `/{sdSlug}/mobile/dashboard`.
 */
export const MobileLoginScreen = ({ config, keyName }: Props) => {
  const tc = mobileTheme.colors;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const context = useContext(UserContext);
  const [cookies, setCookies] = useState<Record<string, string>>({});

  useEffect(() => {
    // Read cookies client-side only (mirrors LoginClient) to avoid SSR churn.
    if (typeof document === "undefined") return;
    const cookieString = document.cookie;
    const cookieObj: Record<string, string> = {};
    cookieString.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) cookieObj[key] = value;
    });
    setCookies(cookieObj);
  }, []);

  // Derive the sdSlug from the current path (`/{sdSlug}/mobile/login`) so the
  // fallback redirect stays on the same church subdomain after login.
  const sdSlug = React.useMemo(() => {
    if (config?.church?.subDomain) return config.church.subDomain;
    if (!pathname) return "";
    const parts = pathname.split("/").filter(Boolean);
    return parts[0] || "";
  }, [pathname, config?.church?.subDomain]);

  const defaultReturnUrl = sdSlug ? `/${sdSlug}/mobile/dashboard` : "/mobile/dashboard";
  const returnUrl = searchParams?.get("returnUrl") || defaultReturnUrl;

  const handleRedirect = (url: string) => {
    PersonHelper.person = context.person;
    // Prefer client-side navigation; fall back to hard redirect for any absolute URLs.
    if (url.startsWith("http")) {
      window.location.href = url;
      return;
    }
    router.push(url);
  };

  const churchName = config?.church?.name || "";
  const logoLight = config?.appearance?.logoLight;
  const primaryColor = config?.appearance?.primaryColor || tc.primary;

  // Hero gradient: two shades of the configured primary color (matches B1Mobile's
  // adjustHexColor(-12)/(+18) with a simple alpha overlay so we don't need to
  // pull in a native color-math dependency on web).
  const heroGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`;

  const jwt = searchParams?.get("jwt") || cookies.jwt || "";
  const auth = searchParams?.get("auth") || "";

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pb: `${mobileTheme.spacing.xl}px` }}>
      {/* Church-branded hero */}
      <Box sx={{ px: `${mobileTheme.spacing.md}px`, pt: `${mobileTheme.spacing.lg}px` }}>
        <Box
          sx={{
            borderRadius: `${mobileTheme.radius.xl}px`,
            overflow: "hidden",
            background: heroGradient,
            boxShadow: mobileTheme.shadows.lg,
            px: `${mobileTheme.spacing.lg}px`,
            py: `${mobileTheme.spacing.xl}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: 180,
          }}
        >
          {logoLight ? (
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                p: `${mobileTheme.spacing.md}px`,
                mb: `${mobileTheme.spacing.md}px`,
                boxShadow: mobileTheme.shadows.sm,
              }}
            >
              <Box
                component="img"
                src={logoLight}
                alt={churchName || "Church logo"}
                sx={{ width: 160, height: 80, objectFit: "contain" }}
              />
            </Box>
          ) : (
            <Icon sx={{ color: "#FFFFFF", fontSize: 48, mb: 1.5 }}>church</Icon>
          )}
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", mb: 0.5 }}>
            {churchName ? "Welcome Back" : "Welcome to B1"}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#FFFFFF", opacity: 0.9, px: 1 }}>
            {churchName ? `Sign in to ${churchName}` : "Sign in to access"}
          </Typography>
        </Box>
      </Box>

      {/* Shared LoginPage */}
      <Box sx={{ px: `${mobileTheme.spacing.md}px`, mt: `${mobileTheme.spacing.md}px` }}>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.md,
            overflow: "hidden",
            "& .MuiPaper-root": { boxShadow: "none", borderRadius: 0 },
          }}
        >
          <SharedLoginPage
            auth={auth}
            context={context}
            jwt={jwt}
            appName="B1"
            keyName={keyName}
            returnUrl={returnUrl}
            handleRedirect={handleRedirect}
            defaultEmail={process.env.NEXT_PUBLIC_STAGE === "demo" ? "demo@b1.church" : undefined}
            defaultPassword={process.env.NEXT_PUBLIC_STAGE === "demo" ? "password" : undefined}
            showFooter={false}
          />
        </Box>
      </Box>
    </Box>
  );
};
