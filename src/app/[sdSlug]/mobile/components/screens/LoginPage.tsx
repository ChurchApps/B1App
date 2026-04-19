"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Icon,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { LoginResponseInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { PersonHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

// Matches B1Mobile's `auth/login.tsx` lightly tighter email regex (web form uses
// browser-level validation anyway, but we mirror the native check so failures
// have parity).
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,6})+$/;

interface CheckEmailResponseInterface {
  exists: boolean;
  peopleMatches: Array<{
    firstName?: string;
    lastName?: string;
    churchId?: string;
    churchName?: string;
  }>;
}

interface Props {
  config?: ConfigurationInterface;
  /** Legacy keyName prop (kept for parity with the previous wrapper); unused
   *  now that we hand-roll the form, but accepted so existing callers compile. */
  keyName?: string;
}

/**
 * Mobile-shell login screen.
 *
 * Hand-rolled to mirror `B1Mobile/app/auth/login.tsx` — hero banner + email /
 * password / forgot / sign-in / register card — so users stay inside the
 * mobile UI instead of being bounced to the public desktop login page.
 *
 * Authenticates via `POST /users/login` (same endpoint as the shared
 * `LoginPage`), then hydrates `UserHelper` + `UserContext` and picks the
 * userChurch matching the current subdomain (sdSlug) before redirecting to
 * the mobile dashboard.
 */
export const MobileLoginScreen = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const { spacing, radius, shadows } = mobileTheme;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const context = useContext(UserContext);

  // --- sdSlug / redirect target -----------------------------------------
  const sdSlug = React.useMemo(() => {
    if (config?.church?.subDomain) return config.church.subDomain;
    if (!pathname) return "";
    const parts = pathname.split("/").filter(Boolean);
    return parts[0] || "";
  }, [pathname, config?.church?.subDomain]);

  const defaultReturnUrl = sdSlug ? `/${sdSlug}/mobile/dashboard` : "/mobile/dashboard";
  const returnUrl = searchParams?.get("returnUrl") || defaultReturnUrl;

  // --- Form state --------------------------------------------------------
  const [email, setEmail] = useState<string>(
    process.env.NEXT_PUBLIC_STAGE === "demo" ? "demo@b1.church" : ""
  );
  const [password, setPassword] = useState<string>(
    process.env.NEXT_PUBLIC_STAGE === "demo" ? "password" : ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "info" }>({
    open: false,
    msg: "",
    severity: "error",
  });
  const [noAccountPrompt, setNoAccountPrompt] = useState<null | {
    email: string;
    firstName?: string;
    lastName?: string;
    churchId?: string;
    churchName?: string;
  }>(null);
  const attemptedAutoLoginRef = useRef(false);

  const showError = (msg: string) =>
    setSnack({ open: true, msg, severity: "error" });

  // --- Church branding ---------------------------------------------------
  const churchName = config?.church?.name || "";
  const logoLight = config?.appearance?.logoLight;
  const primaryColor = config?.appearance?.primaryColor || tc.primary;
  // Two shades of the configured primary color (B1Mobile uses adjustHexColor
  // -12 / +18; we approximate with a simple alpha overlay — good enough for a
  // 135deg linear gradient without pulling in a color-math dep on web).
  const heroGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`;

  // --- Post-login hydration (mirrors useHydrateSession) -----------------
  const hydrateFromLoginResponse = async (resp: LoginResponseInterface) => {
    ApiHelper.setDefaultPermissions(resp.user.jwt);
    (resp.userChurches || []).forEach((uc: any) => { if (!uc.apis) uc.apis = []; });
    UserHelper.user = resp.user;
    UserHelper.userChurches = resp.userChurches || [];

    // Match by subdomain; fall back to the first userChurch (mirrors the
    // shared LoginPage's selectChurch(keyName) behavior for a single-church
    // sign-in).
    let matched: any = null;
    if (sdSlug) {
      matched = UserHelper.userChurches?.find(
        (uc) => uc.church?.subDomain?.toLowerCase() === sdSlug.toLowerCase()
      );
    }
    const target = matched || UserHelper.userChurches?.[0];
    if (target) {
      UserHelper.currentUserChurch = target;
      UserHelper.setupApiHelper(target);
    }

    // Best-effort person hydration (mirrors LoginPage.continueLoginProcess).
    let person: any = null;
    const personId = UserHelper.currentUserChurch?.person?.id;
    const churchId = UserHelper.currentUserChurch?.church?.id;
    if (personId) {
      try {
        person = await ApiHelper.get(`/people/${personId}`, "MembershipApi");
      } catch {
        if (churchId) {
          try { person = await ApiHelper.get(`/people/claim/${churchId}`, "MembershipApi"); } catch { /* ignore */ }
        }
      }
    } else if (churchId) {
      try { person = await ApiHelper.get(`/people/claim/${churchId}`, "MembershipApi"); } catch { /* ignore */ }
    }
    if (person) {
      UserHelper.person = person;
      PersonHelper.person = person;
    }

    context.setUser(UserHelper.user);
    context.setUserChurches(UserHelper.userChurches);
    if (UserHelper.currentUserChurch) context.setUserChurch(UserHelper.currentUserChurch);
    if (person) context.setPerson(person);

    // Persist jwt cookie so useHydrateSession picks us up after reload.
    if (typeof document !== "undefined") {
      const maxAge = 180 * 24 * 60 * 60; // 180 days, matches SharedLoginPage
      document.cookie = `jwt=${resp.user.jwt}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `name=${encodeURIComponent(`${resp.user.firstName || ""} ${resp.user.lastName || ""}`.trim())}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `email=${encodeURIComponent(resp.user.email || "")}; path=/; max-age=${maxAge}; SameSite=Lax`;
      const lastChurchId = UserHelper.currentUserChurch?.church?.id;
      if (lastChurchId) {
        document.cookie = `lastChurchId=${lastChurchId}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
    }
  };

  // --- Error recovery: /users/checkEmail (mirrors B1Mobile handleLoginFailure)
  const handleLoginFailure = async () => {
    try {
      const resp: CheckEmailResponseInterface = await ApiHelper.postAnonymous(
        "/users/checkEmail",
        { email },
        "MembershipApi"
      );
      if (resp.exists) {
        showError("Invalid login. Please check your email or password.");
      } else {
        const match = resp.peopleMatches?.[0];
        setNoAccountPrompt({
          email,
          firstName: resp.peopleMatches?.length === 1 ? match?.firstName : resp.peopleMatches?.length > 1 ? match?.firstName : undefined,
          lastName: resp.peopleMatches?.length === 1 ? match?.lastName : resp.peopleMatches?.length > 1 ? match?.lastName : undefined,
          churchId: resp.peopleMatches?.length === 1 ? match?.churchId : undefined,
          churchName: resp.peopleMatches?.length === 1 ? match?.churchName : undefined,
        });
      }
    } catch {
      showError("Invalid login. Please check your email or password.");
    }
  };

  const validate = (): boolean => {
    if (!email) {
      showError("Please enter your email.");
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      showError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      showError("Please enter your password.");
      return false;
    }
    return true;
  };

  const loginApiCall = async (payload: { email: string; password: string } | { jwt: string }) => {
    setLoading(true);
    try {
      const data: LoginResponseInterface = await ApiHelper.postAnonymous(
        "/users/login",
        payload,
        "MembershipApi"
      );
      if (data?.user != null) {
        await hydrateFromLoginResponse(data);
        // Same-origin path → use client nav; absolute URL → hard redirect.
        if (returnUrl.startsWith("http")) window.location.href = returnUrl;
        else router.push(returnUrl);
        return;
      }
      // Password path: surface the "no account / register" prompt.
      if ("password" in payload) await handleLoginFailure();
    } catch {
      if ("password" in payload) await handleLoginFailure();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    loginApiCall({ email, password });
  };

  // Auto-login via ?jwt= in URL (or jwt cookie), matching SharedLoginPage's
  // init() — lets deep links from email / native wrappers sign in silently.
  useEffect(() => {
    if (attemptedAutoLoginRef.current) return;
    attemptedAutoLoginRef.current = true;
    const urlJwt = searchParams?.get("jwt");
    const cookieJwt = (() => {
      if (typeof document === "undefined") return "";
      const m = document.cookie.split(";").map((c) => c.trim().split("="));
      const j = m.find(([k]) => k === "jwt");
      return j?.[1] ? decodeURIComponent(j[1]) : "";
    })();
    const jwt = urlJwt || cookieJwt;
    if (!jwt || UserHelper.user?.id) return;
    loginApiCall({ jwt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- External auth link helpers ---------------------------------------
  // /login?action=... is the public SharedLoginPage route; it handles forgot /
  // register flows end-to-end. We bounce out of the mobile shell because
  // there's no mobile-native forgot/register screen yet.
  const forgotHref = sdSlug ? `/${sdSlug}/login?action=forgot` : "/login?action=forgot";
  const registerHref = sdSlug ? `/${sdSlug}/login?action=register` : "/login?action=register";
  const registerWithEmail = (prefill: { email?: string; firstName?: string; lastName?: string; churchId?: string }) => {
    const qs = new URLSearchParams({ action: "register" });
    if (prefill.email) qs.set("email", prefill.email);
    if (prefill.firstName) qs.set("firstName", prefill.firstName);
    if (prefill.lastName) qs.set("lastName", prefill.lastName);
    if (prefill.churchId) qs.set("churchId", prefill.churchId);
    return sdSlug ? `/${sdSlug}/login?${qs.toString()}` : `/login?${qs.toString()}`;
  };

  // --- Render ------------------------------------------------------------
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: `${radius.md}px`,
      bgcolor: tc.surface,
    },
  };

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pb: `${spacing.xl}px` }}>
      {/* Hero */}
      <Box sx={{ px: `${spacing.md}px`, pt: `${spacing.lg}px`, pb: `${spacing.md}px` }}>
        <Box
          sx={{
            borderRadius: `${radius.xl}px`,
            overflow: "hidden",
            background: heroGradient,
            boxShadow: shadows.lg,
            px: `${spacing.lg}px`,
            py: `${spacing.xl}px`,
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
                borderRadius: `${radius.lg}px`,
                p: `${spacing.md}px`,
                mb: `${spacing.md}px`,
                boxShadow: shadows.sm,
              }}
            >
              <Box
                component="img"
                src={logoLight}
                alt={churchName || "Church logo"}
                sx={{ width: 160, height: 80, objectFit: "contain", display: "block" }}
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

      {/* Form card */}
      <Box sx={{ px: `${spacing.md}px` }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${radius.lg}px`,
            boxShadow: shadows.md,
            p: `${spacing.lg}px`,
          }}
        >
          {process.env.NEXT_PUBLIC_STAGE === "demo" && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <b>Demo:</b> Login with <code>demo@b1.church</code> / <code>password</code>.
            </Alert>
          )}

          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputProps={{ inputMode: "email", autoComplete: "email", autoCapitalize: "none", autoCorrect: "off" }}
            variant="outlined"
            fullWidth
            sx={{ ...inputSx, mb: `${spacing.md}px` }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon sx={{ color: tc.textMuted }}>email</Icon>
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />

          <TextField
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            inputProps={{ autoComplete: "current-password" }}
            variant="outlined"
            fullWidth
            sx={inputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon sx={{ color: tc.textMuted }}>lock</Icon>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    size="small"
                  >
                    <Icon sx={{ color: tc.textMuted }}>{showPassword ? "visibility_off" : "visibility"}</Icon>
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />

          {/* Forgot password — right-aligned, matches B1Mobile alignSelf: flex-end */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: `${spacing.sm}px`, mb: `${spacing.lg}px` }}>
            <Box
              component="a"
              href={forgotHref}
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: tc.primary,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Forgot password?
            </Box>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              bgcolor: tc.primary,
              borderRadius: `${radius.md}px`,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 16,
              py: 1.4,
              boxShadow: shadows.md,
              "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
              "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Sign In"}
          </Button>

          {/* Privacy */}
          <Box sx={{ mt: `${spacing.lg}px`, textAlign: "center" }}>
            <Typography sx={{ fontSize: 12, color: tc.textMuted, lineHeight: 1.5 }}>
              By signing in, you agree to our{" "}
              <Box
                component="a"
                href="https://churchapps.org/privacy"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: tc.primary, fontWeight: 500, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Privacy Policy
              </Box>
              .
            </Typography>
          </Box>

          {/* Register */}
          <Box sx={{ mt: `${spacing.md}px`, textAlign: "center" }}>
            <Typography sx={{ fontSize: 14, color: tc.text }}>
              Don&apos;t have an account?{" "}
              <Box
                component="a"
                href={registerHref}
                sx={{
                  color: tc.primary,
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Register
              </Box>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* "No account found" inline prompt (mirrors B1Mobile Alert with Register
           action from handleLoginFailure). Rendered as an MUI Snackbar with an
           Alert action so it doesn't block the whole screen. */}
      <Snackbar
        open={!!noAccountPrompt}
        autoHideDuration={8000}
        onClose={() => setNoAccountPrompt(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          onClose={() => setNoAccountPrompt(null)}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (!noAccountPrompt) return;
                window.location.href = registerWithEmail(noAccountPrompt);
              }}
            >
              Register
            </Button>
          }
          sx={{ width: "100%" }}
        >
          We couldn&apos;t find an account with that email. Want to create one?
        </Alert>
      </Snackbar>

      {/* Error snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack({ ...snack, open: false })}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
