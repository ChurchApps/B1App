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
import { ApiHelper, Locale, UserHelper } from "@churchapps/apphelper";
import type { LoginResponseInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { hydrateUserSession } from "../../hooks/hydrateUserSession";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

type Mode = "login" | "register" | "forgot" | "verify" | "setPassword";

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

  const returnUrl = searchParams?.get("returnUrl") || "/mobile/dashboard";
  const churchId = searchParams?.get("churchId") || undefined;

  const initialMode: Mode = (() => {
    const action = searchParams?.get("action");
    if (action === "register") return "register";
    if (action === "forgot") return "forgot";
    return "login";
  })();

  const [mode, setMode] = useState<Mode>(initialMode);

  const [email, setEmail] = useState<string>(
    process.env.NEXT_PUBLIC_STAGE === "demo" ? "demo@b1.church" : ""
  );
  const [password, setPassword] = useState<string>(
    process.env.NEXT_PUBLIC_STAGE === "demo" ? "password" : ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [matchedChurchName, setMatchedChurchName] = useState("");
  const [matchedChurchId, setMatchedChurchId] = useState<string | undefined>(undefined);

  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [authGuid, setAuthGuid] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordFirstName, setSetPasswordFirstName] = useState("");

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

  const showError = (msg: string) => setSnack({ open: true, msg, severity: "error" });
  const showInfo = (msg: string) => setSnack({ open: true, msg, severity: "info" });

  const churchName = config?.church?.name || "";
  const logoLight = config?.appearance?.logoLight;
  const primaryColor = config?.appearance?.primaryColor || tc.primary;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const hydrateFromLoginResponse = (resp: LoginResponseInterface) =>
    hydrateUserSession(resp, context, { sdSlug, churchId, writeCookies: true });

  const prefillRegisterFromMatch = async (emailToCheck: string) => {
    if (!emailToCheck || !EMAIL_REGEX.test(emailToCheck)) return;
    try {
      const resp: CheckEmailResponseInterface = await ApiHelper.postAnonymous(
        "/users/checkEmail",
        { email: emailToCheck },
        "MembershipApi"
      );
      if (resp.exists) {
        showError("An account already exists for this email. Please sign in instead.");
      } else if (resp.peopleMatches?.length > 0) {
        const match = resp.peopleMatches[0];
        if (!regFirstName && match.firstName) setRegFirstName(match.firstName);
        if (!regLastName && match.lastName) setRegLastName(match.lastName);
        if (resp.peopleMatches.length === 1) {
          setMatchedChurchId(match.churchId);
          setMatchedChurchName(match.churchName || "");
        }
      }
    } catch {
      /* ignore */
    }
  };

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
          firstName: match?.firstName,
          lastName: match?.lastName,
          churchId: resp.peopleMatches?.length === 1 ? match?.churchId : undefined,
          churchName: resp.peopleMatches?.length === 1 ? match?.churchName : undefined
        });
      }
    } catch {
      showError("Invalid login. Please check your email or password.");
    }
  };

  const validateLogin = (): boolean => {
    if (!email) { showError("Please enter your email."); return false; }
    if (!EMAIL_REGEX.test(email)) { showError("Please enter a valid email address."); return false; }
    if (!password) { showError("Please enter your password."); return false; }
    return true;
  };

  const loginApiCall = async (payload: { email: string; password: string } | { jwt: string } | { authGuid: string }) => {
    setLoading(true);
    try {
      const data: LoginResponseInterface = await ApiHelper.postAnonymous("/users/login", payload, "MembershipApi");
      if (data?.user != null) {
        await hydrateFromLoginResponse(data);
        if (returnUrl.startsWith("http")) window.location.href = returnUrl;
        else router.push(returnUrl);
        return true;
      }
      if ("password" in payload) await handleLoginFailure();
      return false;
    } catch {
      if ("password" in payload) await handleLoginFailure();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateLogin()) return;
    loginApiCall({ email, password });
  };

  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !EMAIL_REGEX.test(email)) { showError("Please enter a valid email address."); return; }
    if (!regFirstName.trim()) { showError("Please enter your first name."); return; }
    if (!regLastName.trim()) { showError("Please enter your last name."); return; }
    setLoading(true);
    try {
      const body: any = { email, firstName: regFirstName, lastName: regLastName, appName: "B1", appUrl: typeof window !== "undefined" ? window.location.origin : undefined };
      if (matchedChurchId) body.churchId = matchedChurchId;
      const resp: any = await ApiHelper.postAnonymous("/users/register", body, "MembershipApi");
      if (resp?.errors?.length) {
        const msg = String(resp.errors[0]);
        if (msg.toLowerCase().includes("user already exists")) showError("An account already exists for this email. Please sign in instead.");
        else showError(msg);
        return;
      }
      goToVerify();
    } catch (e: any) {
      const msg = e?.toString?.() || "Registration failed.";
      if (msg.toLowerCase().includes("user already exists")) showError("An account already exists for this email. Please sign in instead.");
      else showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !EMAIL_REGEX.test(email)) { showError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const resp: any = await ApiHelper.postAnonymous("/users/forgot", { userEmail: email }, "MembershipApi");
      if (resp?.emailed) goToVerify();
      else showError("We could not find an account with this email address.");
    } catch (e: any) {
      showError(e?.toString?.() || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const goToVerify = () => {
    setCodeDigits(Array(CODE_LENGTH).fill(""));
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setMode("verify");
    setTimeout(() => codeRefs.current[0]?.focus(), 50);
  };

  const handleCodeChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    const next = [...codeDigits];
    if (cleaned.length === 0) { next[index] = ""; setCodeDigits(next); return; }
    if (cleaned.length === 1) {
      next[index] = cleaned;
      setCodeDigits(next);
      if (index < CODE_LENGTH - 1) codeRefs.current[index + 1]?.focus();
      if (next.every(d => d !== "")) submitCode(next.join(""));
    } else {
      for (let i = 0; i < cleaned.length && index + i < CODE_LENGTH; i++) {
        next[index + i] = cleaned[i];
      }
      setCodeDigits(next);
      const focusAt = Math.min(index + cleaned.length, CODE_LENGTH - 1);
      codeRefs.current[focusAt]?.focus();
      if (next.every(d => d !== "")) submitCode(next.join(""));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      e.preventDefault();
      const next = [...codeDigits];
      next[index - 1] = "";
      setCodeDigits(next);
      codeRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      codeRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length: CODE_LENGTH }, (_, i) => text[i] ?? "");
    setCodeDigits(next);
    const focusAt = Math.min(text.length, CODE_LENGTH - 1);
    codeRefs.current[focusAt]?.focus();
    if (next.every(d => d !== "")) submitCode(next.join(""));
  };

  const submitCode = async (codeOverride?: string) => {
    const code = codeOverride ?? codeDigits.join("");
    if (code.length !== CODE_LENGTH) { showError("Please enter the 6-digit code."); return; }
    setLoading(true);
    try {
      const resp: any = await ApiHelper.postAnonymous("/users/verifyCode", { email, code }, "MembershipApi");
      if (resp?.authGuid) {
        setAuthGuid(resp.authGuid);
        try {
          const loginResp: LoginResponseInterface = await ApiHelper.postAnonymous("/users/login", { authGuid: resp.authGuid }, "MembershipApi");
          if (loginResp?.user?.firstName) setSetPasswordFirstName(loginResp.user.firstName);
        } catch { /* ignore; proceed to set password regardless */ }
        setMode("setPassword");
      } else {
        const msg = Array.isArray(resp?.errors) && resp.errors.length ? String(resp.errors[0]) : "Invalid or expired code.";
        showError(msg);
        setCodeDigits(Array(CODE_LENGTH).fill(""));
        codeRefs.current[0]?.focus();
      }
    } catch (e: any) {
      showError(e?.toString?.() || "Invalid or expired code.");
      setCodeDigits(Array(CODE_LENGTH).fill(""));
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setCodeDigits(Array(CODE_LENGTH).fill(""));
    try {
      await ApiHelper.postAnonymous("/users/forgot", { userEmail: email }, "MembershipApi");
      showInfo("A new code has been sent.");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      showError(e?.toString?.() || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newPassword.length < 8) { showError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { showError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const resp: any = await ApiHelper.postAnonymous("/users/setPasswordGuid", { authGuid, newPassword }, "MembershipApi");
      if (!resp?.success) { showError("Could not set password. Please request a new code."); setMode("forgot"); return; }
      await loginApiCall({ email, password: newPassword });
    } catch (e: any) {
      showError(e?.toString?.() || "Could not set password.");
    } finally {
      setLoading(false);
    }
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

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: `${radius.md}px`,
      bgcolor: tc.surface
    }
  };

  const heroTitle = () => {
    if (mode === "register") return churchName ? `Join ${churchName}` : "Create your account";
    if (mode === "forgot") return "Reset your password";
    if (mode === "verify") return "Enter verification code";
    if (mode === "setPassword") return setPasswordFirstName ? `Welcome, ${setPasswordFirstName}` : "Set your password";
    return churchName ? "Welcome Back" : "Welcome to B1";
  };

  const heroSubtitle = () => {
    if (mode === "register") return churchName ? `Create an account for ${churchName}` : "Create a new account";
    if (mode === "forgot") return "We'll email you a 6-digit code to reset it.";
    if (mode === "verify") return `We emailed a 6-digit code to ${email}.`;
    if (mode === "setPassword") return "Choose a password to finish signing in.";
    return churchName ? `Sign in to ${churchName}` : "Sign in to access";
  };

  const primaryBtnSx = {
    bgcolor: tc.primary,
    borderRadius: `${radius.md}px`,
    textTransform: "none",
    fontWeight: 700,
    fontSize: 16,
    py: 1.4,
    boxShadow: shadows.md,
    "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
    "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint }
  } as const;

  const renderLogin = () => (
    <Box component="form" onSubmit={handleLoginSubmit}>
      {process.env.NEXT_PUBLIC_STAGE === "demo" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <b>Demo:</b> Login with <code>demo@b1.church</code> / <code>password</code>.
        </Alert>
      )}
      <TextField
        label={Locale.label("mobile.screens.emailLabel")}
        placeholder={Locale.label("mobile.screens.emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        inputProps={{ inputMode: "email", autoComplete: "email", autoCapitalize: "none", autoCorrect: "off" }}
        variant="outlined"
        fullWidth
        sx={{ ...inputSx, mb: `${spacing.md}px` }}
        InputProps={{ startAdornment: (<InputAdornment position="start"><Icon sx={{ color: tc.textMuted }}>email</Icon></InputAdornment>) }}
        disabled={loading}
      />
      <TextField
        label={Locale.label("mobile.screens.passwordLabel")}
        placeholder={Locale.label("mobile.screens.passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type={showPassword ? "text" : "password"}
        inputProps={{ autoComplete: "current-password" }}
        variant="outlined"
        fullWidth
        sx={inputSx}
        InputProps={{
          startAdornment: (<InputAdornment position="start"><Icon sx={{ color: tc.textMuted }}>lock</Icon></InputAdornment>),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(v => !v)} edge="end" aria-label={showPassword ? "Hide password" : "Show password"} size="small">
                <Icon sx={{ color: tc.textMuted }}>{showPassword ? "visibility_off" : "visibility"}</Icon>
              </IconButton>
            </InputAdornment>
          )
        }}
        disabled={loading}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: `${spacing.sm}px`, mb: `${spacing.lg}px` }}>
        <Box component="button" type="button" onClick={() => setMode("forgot")} sx={{ fontSize: 14, fontWeight: 500, color: tc.primary, background: "none", border: "none", p: 0, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
          Forgot password?
        </Box>
      </Box>
      <Button type="submit" variant="contained" fullWidth disabled={loading} sx={primaryBtnSx}>
        {loading ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Sign In"}
      </Button>
      <Box sx={{ mt: `${spacing.lg}px`, textAlign: "center" }}>
        <Typography sx={{ fontSize: 12, color: tc.textMuted, lineHeight: 1.5 }}>
          By signing in, you agree to our{" "}
          <Box component="a" href="https://churchapps.org/privacy" target="_blank" rel="noopener noreferrer" sx={{ color: tc.primary, fontWeight: 500, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Privacy Policy
          </Box>
          .
        </Typography>
      </Box>
      <Box sx={{ mt: `${spacing.md}px`, textAlign: "center" }}>
        <Typography sx={{ fontSize: 14, color: tc.text }}>
          Don&apos;t have an account?{" "}
          <Box component="button" type="button" onClick={() => setMode("register")} sx={{ color: tc.primary, fontWeight: 600, background: "none", border: "none", p: 0, cursor: "pointer", fontSize: 14, "&:hover": { textDecoration: "underline" } }}>
            Register
          </Box>
        </Typography>
      </Box>
    </Box>
  );

  const renderRegister = () => (
    <Box component="form" onSubmit={handleRegisterSubmit}>
      {matchedChurchName && (
        <Alert severity="info" sx={{ mb: 2 }}>
          We found your record at <b>{matchedChurchName}</b>. Complete registration to link your account.
        </Alert>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${spacing.sm}px`, mb: `${spacing.md}px` }}>
        <TextField label={Locale.label("mobile.screens.firstNameRegister")} value={regFirstName} onChange={e => setRegFirstName(e.target.value)} variant="outlined" fullWidth sx={inputSx} disabled={loading} inputProps={{ autoComplete: "given-name" }} />
        <TextField label={Locale.label("mobile.screens.lastNameRegister")} value={regLastName} onChange={e => setRegLastName(e.target.value)} variant="outlined" fullWidth sx={inputSx} disabled={loading} inputProps={{ autoComplete: "family-name" }} />
      </Box>
      <TextField
        label={Locale.label("mobile.screens.emailLabel")}
        placeholder={Locale.label("mobile.screens.emailPlaceholder")}
        value={email}
        onChange={e => setEmail(e.target.value)}
        onBlur={e => prefillRegisterFromMatch(e.target.value)}
        type="email"
        variant="outlined"
        fullWidth
        sx={{ ...inputSx, mb: `${spacing.lg}px` }}
        inputProps={{ inputMode: "email", autoComplete: "email", autoCapitalize: "none", autoCorrect: "off" }}
        InputProps={{ startAdornment: (<InputAdornment position="start"><Icon sx={{ color: tc.textMuted }}>email</Icon></InputAdornment>) }}
        disabled={loading}
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading} sx={primaryBtnSx}>
        {loading ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Create account"}
      </Button>
      <Box sx={{ mt: `${spacing.md}px`, textAlign: "center" }}>
        <Typography sx={{ fontSize: 14, color: tc.text }}>
          Already have an account?{" "}
          <Box component="button" type="button" onClick={() => setMode("login")} sx={{ color: tc.primary, fontWeight: 600, background: "none", border: "none", p: 0, cursor: "pointer", fontSize: 14, "&:hover": { textDecoration: "underline" } }}>
            Sign in
          </Box>
        </Typography>
      </Box>
    </Box>
  );

  const renderForgot = () => (
    <Box component="form" onSubmit={handleForgotSubmit}>
      <TextField
        label={Locale.label("mobile.screens.emailLabel")}
        placeholder={Locale.label("mobile.screens.emailPlaceholder")}
        value={email}
        onChange={e => setEmail(e.target.value)}
        type="email"
        variant="outlined"
        fullWidth
        sx={{ ...inputSx, mb: `${spacing.lg}px` }}
        inputProps={{ inputMode: "email", autoComplete: "email", autoCapitalize: "none", autoCorrect: "off" }}
        InputProps={{ startAdornment: (<InputAdornment position="start"><Icon sx={{ color: tc.textMuted }}>email</Icon></InputAdornment>) }}
        disabled={loading}
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading} sx={primaryBtnSx}>
        {loading ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Send code"}
      </Button>
      <Box sx={{ mt: `${spacing.md}px`, textAlign: "center" }}>
        <Box component="button" type="button" onClick={() => setMode("login")} sx={{ color: tc.primary, fontWeight: 600, background: "none", border: "none", p: 0, cursor: "pointer", fontSize: 14, "&:hover": { textDecoration: "underline" } }}>
          Back to sign in
        </Box>
      </Box>
    </Box>
  );

  const renderVerify = () => (
    <Box component="form" onSubmit={e => { e.preventDefault(); submitCode(); }}>
      <Box sx={{ display: "flex", gap: "8px", justifyContent: "center", mb: `${spacing.lg}px` }}>
        {codeDigits.map((digit, index) => (
          <Box
            key={index}
            component="input"
            ref={(el: HTMLInputElement | null) => { codeRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={CODE_LENGTH}
            value={digit}
            disabled={loading}
            onChange={e => handleCodeChange(index, e.target.value)}
            onKeyDown={e => handleCodeKeyDown(index, e)}
            onPaste={handleCodePaste}
            onFocus={e => (e.currentTarget as HTMLInputElement).select()}
            sx={{
              width: "44px",
              height: "52px",
              fontSize: "24px",
              fontFamily: "monospace",
              fontWeight: 600,
              textAlign: "center",
              color: tc.text,
              bgcolor: tc.surface,
              border: `1px solid ${tc.border}`,
              borderRadius: `${radius.md}px`,
              outline: "none",
              "&:focus": { borderColor: tc.primary }
            }}
          />
        ))}
      </Box>
      <Button type="submit" variant="contained" fullWidth disabled={loading || codeDigits.some(d => d === "")} sx={primaryBtnSx}>
        {loading ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Verify code"}
      </Button>
      <Box sx={{ mt: `${spacing.md}px`, textAlign: "center", display: "flex", justifyContent: "center", gap: 2 }}>
        <Box component="button" type="button" disabled={resendCooldown > 0 || loading} onClick={resendCode} sx={{ color: resendCooldown > 0 ? tc.textMuted : tc.primary, background: "none", border: "none", p: 0, cursor: resendCooldown > 0 ? "default" : "pointer", fontSize: 14, fontWeight: 500 }}>
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </Box>
        <Box sx={{ color: tc.textMuted, fontSize: 14 }}>|</Box>
        <Box component="button" type="button" onClick={() => setMode("login")} sx={{ color: tc.primary, background: "none", border: "none", p: 0, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
          Back to sign in
        </Box>
      </Box>
    </Box>
  );

  const renderSetPassword = () => (
    <Box component="form" onSubmit={handleSetPasswordSubmit}>
      <TextField
        label={Locale.label("mobile.screens.newPassword")}
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        type={showPassword ? "text" : "password"}
        variant="outlined"
        fullWidth
        sx={{ ...inputSx, mb: `${spacing.md}px` }}
        inputProps={{ autoComplete: "new-password" }}
        InputProps={{
          startAdornment: (<InputAdornment position="start"><Icon sx={{ color: tc.textMuted }}>lock</Icon></InputAdornment>),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(v => !v)} edge="end" size="small">
                <Icon sx={{ color: tc.textMuted }}>{showPassword ? "visibility_off" : "visibility"}</Icon>
              </IconButton>
            </InputAdornment>
          )
        }}
        disabled={loading}
      />
      <TextField
        label={Locale.label("mobile.screens.confirmPassword")}
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        type={showPassword ? "text" : "password"}
        variant="outlined"
        fullWidth
        sx={{ ...inputSx, mb: `${spacing.lg}px` }}
        inputProps={{ autoComplete: "new-password" }}
        InputProps={{ startAdornment: (<InputAdornment position="start"><Icon sx={{ color: tc.textMuted }}>lock</Icon></InputAdornment>) }}
        disabled={loading}
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading || !newPassword || !confirmPassword} sx={primaryBtnSx}>
        {loading ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Save & sign in"}
      </Button>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pb: `${spacing.xl}px` }}>
      <Box sx={{ px: `${spacing.md}px`, pt: `${spacing.lg}px`, pb: `${spacing.md}px` }}>
        <Box
          sx={{
            borderRadius: `${radius.xl}px`,
            overflow: "hidden",
            backgroundColor: primaryColor,
            backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.18) 100%)",
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
            <Box sx={{ bgcolor: tc.surface, borderRadius: `${radius.lg}px`, p: `${spacing.md}px`, mb: `${spacing.md}px`, boxShadow: shadows.sm }}>
              <Box component="img" src={logoLight} alt={churchName || "Church logo"} sx={{ width: 160, height: 80, objectFit: "contain", display: "block" }} />
            </Box>
          ) : (
            <Icon sx={{ color: tc.surface, fontSize: 48, mb: 1.5 }}>church</Icon>
          )}
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.surface, mb: 0.5 }}>
            {heroTitle()}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.surface, opacity: 0.9, px: 1 }}>
            {heroSubtitle()}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: `${spacing.md}px` }}>
        <Box sx={{ bgcolor: tc.surface, borderRadius: `${radius.lg}px`, boxShadow: shadows.md, p: `${spacing.lg}px` }}>
          {mode === "login" && renderLogin()}
          {mode === "register" && renderRegister()}
          {mode === "forgot" && renderForgot()}
          {mode === "verify" && renderVerify()}
          {mode === "setPassword" && renderSetPassword()}
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
                if (noAccountPrompt.firstName) setRegFirstName(noAccountPrompt.firstName);
                if (noAccountPrompt.lastName) setRegLastName(noAccountPrompt.lastName);
                if (noAccountPrompt.churchId) setMatchedChurchId(noAccountPrompt.churchId);
                if (noAccountPrompt.churchName) setMatchedChurchName(noAccountPrompt.churchName);
                setNoAccountPrompt(null);
                setMode("register");
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
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
