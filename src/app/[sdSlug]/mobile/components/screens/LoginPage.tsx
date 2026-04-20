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
  Typography
} from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { LoginResponseInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { hydrateUserSession } from "../../hooks/hydrateUserSession";

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
}

export const MobileLoginScreen = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const { spacing, radius, shadows } = mobileTheme;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const context = useContext(UserContext);

  const sdSlug = React.useMemo(() => {
    if (config?.church?.subDomain) return config.church.subDomain;
    if (!pathname) return "";
    const parts = pathname.split("/").filter(Boolean);
    return parts[0] || "";
  }, [pathname, config?.church?.subDomain]);

  const defaultReturnUrl = sdSlug ? `/${sdSlug}/mobile/dashboard` : "/mobile/dashboard";
  const returnUrl = searchParams?.get("returnUrl") || defaultReturnUrl;

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
    severity: "error"
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

  const churchName = config?.church?.name || "";
  const logoLight = config?.appearance?.logoLight;
  const primaryColor = config?.appearance?.primaryColor || tc.primary;

  const heroGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`;

  const hydrateFromLoginResponse = (resp: LoginResponseInterface) =>
    hydrateUserSession(resp, context, { sdSlug, writeCookies: true });

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
          churchName: resp.peopleMatches?.length === 1 ? match?.churchName : undefined
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

        if (returnUrl.startsWith("http")) window.location.href = returnUrl;
        else router.push(returnUrl);
        return;
      }

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

  }, []);

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

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: `${radius.md}px`,
      bgcolor: tc.surface
    }
  };

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pb: `${spacing.xl}px` }}>

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
            minHeight: 180
          }}
        >
          {logoLight ? (
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${radius.lg}px`,
                p: `${spacing.md}px`,
                mb: `${spacing.md}px`,
                boxShadow: shadows.sm
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

      <Box sx={{ px: `${spacing.md}px` }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${radius.lg}px`,
            boxShadow: shadows.md,
            p: `${spacing.lg}px`
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
              )
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
              )
            }}
            disabled={loading}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: `${spacing.sm}px`, mb: `${spacing.lg}px` }}>
            <Box
              component="a"
              href={forgotHref}
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: tc.primary,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" }
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
              "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint }
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Sign In"}
          </Button>

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
                  "&:hover": { textDecoration: "underline" }
                }}
              >
                Register
              </Box>
            </Typography>
          </Box>
        </Box>
      </Box>

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
