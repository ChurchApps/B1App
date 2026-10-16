"use client";

import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { PageHead, Plate, PlateSection, TextLink } from "../kit";
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

const isSameOriginPath = (url: string) => {
  if (!url.startsWith("/")) return false;
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
};

export const MobileLoginScreen = ({ config }: Props) => {
  const tc = mobileTheme.colors;
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
  const honeypotRef = useRef<HTMLInputElement>(null);
  const registerShownAtRef = useRef(0);
  useEffect(() => { if (mode === "register") registerShownAtRef.current = Date.now(); }, [mode]);

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
        showError(Locale.label("mobile.login.errAccountExists"));
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
        showError(Locale.label("mobile.login.errInvalidLogin"));
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
      showError(Locale.label("mobile.login.errInvalidLogin"));
    }
  };

  const validateLogin = (): boolean => {
    if (!email) { showError(Locale.label("mobile.login.errEnterEmail")); return false; }
    if (!EMAIL_REGEX.test(email)) { showError(Locale.label("mobile.login.errValidEmail")); return false; }
    if (!password) { showError(Locale.label("mobile.login.errEnterPassword")); return false; }
    return true;
  };

  const loginApiCall = async (payload: { email: string; password: string } | { jwt: string } | { authGuid: string }) => {
    setLoading(true);
    try {
      const data: LoginResponseInterface = await ApiHelper.postAnonymous("/users/login", payload, "MembershipApi");
      if (data?.user != null) {
        await hydrateFromLoginResponse(data);
        const safeUrl = isSameOriginPath(returnUrl) ? returnUrl : "/mobile/dashboard";
        router.push(safeUrl);
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
    if (!email || !EMAIL_REGEX.test(email)) { showError(Locale.label("mobile.login.errValidEmail")); return; }
    if (!regFirstName.trim()) { showError(Locale.label("mobile.login.errFirstName")); return; }
    if (!regLastName.trim()) { showError(Locale.label("mobile.login.errLastName")); return; }
    setLoading(true);
    try {
      const body: any = { email, firstName: regFirstName, lastName: regLastName, appName: "B1", appUrl: typeof window !== "undefined" ? window.location.origin : undefined, website: honeypotRef.current?.value || "", fillMs: Date.now() - registerShownAtRef.current };
      if (matchedChurchId) body.churchId = matchedChurchId;
      const resp: any = await ApiHelper.postAnonymous("/users/register", body, "MembershipApi");
      if (resp?.errors?.length) {
        const msg = String(resp.errors[0]);
        if (msg.toLowerCase().includes("user already exists")) showError(Locale.label("mobile.login.errAccountExists"));
        else showError(msg);
        return;
      }
      goToVerify();
    } catch (e: any) {
      const msg = e?.toString?.() || Locale.label("mobile.login.errRegistrationFailed");
      if (msg.toLowerCase().includes("user already exists")) showError(Locale.label("mobile.login.errAccountExists"));
      else showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !EMAIL_REGEX.test(email)) { showError(Locale.label("mobile.login.errValidEmail")); return; }
    setLoading(true);
    try {
      const resp: any = await ApiHelper.postAnonymous("/users/forgot", { userEmail: email }, "MembershipApi");
      if (resp?.emailed) goToVerify();
      else showError(Locale.label("mobile.login.errNoAccount"));
    } catch (e: any) {
      showError(e?.toString?.() || Locale.label("mobile.login.errGeneric"));
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
    if (code.length !== CODE_LENGTH) { showError(Locale.label("mobile.login.errEnterCode")); return; }
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
        const msg = Array.isArray(resp?.errors) && resp.errors.length ? String(resp.errors[0]) : Locale.label("mobile.login.errInvalidCode");
        showError(msg);
        setCodeDigits(Array(CODE_LENGTH).fill(""));
        codeRefs.current[0]?.focus();
      }
    } catch (e: any) {
      showError(e?.toString?.() || Locale.label("mobile.login.errInvalidCode"));
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
      showInfo(Locale.label("mobile.login.infoCodeResent"));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      showError(e?.toString?.() || Locale.label("mobile.login.errResendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newPassword.length < 8) { showError(Locale.label("mobile.login.errPasswordLength")); return; }
    if (newPassword !== confirmPassword) { showError(Locale.label("mobile.login.errPasswordsMismatch")); return; }
    setLoading(true);
    try {
      const resp: any = await ApiHelper.postAnonymous("/users/setPasswordGuid", { authGuid, newPassword }, "MembershipApi");
      if (!resp?.success) { showError(Locale.label("mobile.login.errSetPasswordRetry")); setMode("forgot"); return; }
      await loginApiCall({ email, password: newPassword });
    } catch (e: any) {
      showError(e?.toString?.() || Locale.label("mobile.login.errSetPassword"));
    } finally {
      setLoading(false);
    }
  };

  const urlJwtRef = useRef("");
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("jwt")) return;
    urlJwtRef.current = params.get("jwt") || "";
    params.delete("jwt");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
  }, []);

  useEffect(() => {
    if (attemptedAutoLoginRef.current) return;
    attemptedAutoLoginRef.current = true;
    const urlJwt = urlJwtRef.current || searchParams?.get("jwt");
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

  const heroTitle = () => {
    if (mode === "register") return churchName ? Locale.label("mobile.login.titleJoin").replace("{}", churchName) : Locale.label("mobile.login.titleCreateAccount");
    if (mode === "forgot") return Locale.label("mobile.login.titleResetPassword");
    if (mode === "verify") return Locale.label("mobile.login.titleVerify");
    if (mode === "setPassword") return setPasswordFirstName ? Locale.label("mobile.login.titleWelcome").replace("{}", setPasswordFirstName) : Locale.label("mobile.login.titleSetPassword");
    return churchName ? Locale.label("mobile.login.signInTo").replace("{}", churchName) : Locale.label("mobile.screenTitles.signIn");
  };

  const heroSubtitle = () => {
    if (mode === "register") return churchName ? Locale.label("mobile.login.ledeRegisterFor").replace("{}", churchName) : Locale.label("mobile.login.ledeRegister");
    if (mode === "forgot") return Locale.label("mobile.login.ledeForgot");
    if (mode === "verify") return Locale.label("mobile.login.ledeVerify").replace("{}", email);
    if (mode === "setPassword") return Locale.label("mobile.login.ledeSetPassword");
    return Locale.label("mobile.login.lede");
  };

  const formSx = { display: "flex", flexDirection: "column", gap: "16px" } as const;
  const spinner = <CircularProgress size={22} color="inherit" />;
  const centered = { fontSize: 14, color: tc.textSecondary, textAlign: "center" } as const;

  const passwordToggle = (
    <InputAdornment position="end">
      <IconButton onClick={() => setShowPassword(v => !v)} edge="end" aria-label={showPassword ? Locale.label("mobile.login.hidePassword") : Locale.label("mobile.login.showPassword")} size="small">
        <Icon sx={{ color: tc.textSecondary }}>{showPassword ? "visibility_off" : "visibility"}</Icon>
      </IconButton>
    </InputAdornment>
  );

  const emailField = (onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void) => (
    <TextField
      label={Locale.label("mobile.screens.emailLabel")}
      placeholder={Locale.label("mobile.screens.emailPlaceholder")}
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onBlur={onBlur}
      type="email"
      inputProps={{ inputMode: "email", autoComplete: "email", autoCapitalize: "none", autoCorrect: "off" }}
      fullWidth
      disabled={loading}
    />
  );

  const renderLogin = () => (
    <Box component="form" onSubmit={handleLoginSubmit} sx={formSx}>
      {process.env.NEXT_PUBLIC_STAGE === "demo" && (
        <Alert severity="info">
          <b>Demo:</b> Login with <code>demo@b1.church</code> / <code>password</code>.
        </Alert>
      )}
      {emailField()}
      <TextField
        label={Locale.label("mobile.screens.passwordLabel")}
        placeholder={Locale.label("mobile.screens.passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type={showPassword ? "text" : "password"}
        inputProps={{ autoComplete: "current-password" }}
        fullWidth
        InputProps={{ endAdornment: passwordToggle }}
        disabled={loading}
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
        {loading ? spinner : Locale.label("mobile.login.signIn")}
      </Button>
      <TextLink onClick={() => setMode("forgot")} sx={{ alignSelf: "center" }}>{Locale.label("mobile.login.forgotPassword")}</TextLink>
      <Typography sx={{ ...centered, fontSize: 12.5 }}>
        {Locale.label("mobile.login.agreeBefore")}{" "}
        <TextLink href="https://churchapps.org/privacy" sx={{ fontSize: 12.5 }}>{Locale.label("mobile.components.privacyPolicy")}</TextLink>{Locale.label("mobile.login.agreeAfter")}
      </Typography>
    </Box>
  );

  const renderRegister = () => (
    <Box component="form" onSubmit={handleRegisterSubmit} sx={formSx}>
      {matchedChurchName && (
        <Alert severity="info">
          {Locale.label("mobile.login.foundRecordBefore")}{" "}<b>{matchedChurchName}</b>{Locale.label("mobile.login.foundRecordAfter")}
        </Alert>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <TextField label={Locale.label("mobile.screens.firstNameRegister")} value={regFirstName} onChange={e => setRegFirstName(e.target.value)} fullWidth disabled={loading} inputProps={{ autoComplete: "given-name" }} />
        <TextField label={Locale.label("mobile.screens.lastNameRegister")} value={regLastName} onChange={e => setRegLastName(e.target.value)} fullWidth disabled={loading} inputProps={{ autoComplete: "family-name" }} />
      </Box>
      {emailField(e => prefillRegisterFromMatch(e.target.value))}
      <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }} />
      <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
        {loading ? spinner : Locale.label("mobile.login.createAccountSubmit")}
      </Button>
      <Typography sx={centered}>
        {Locale.label("mobile.login.alreadyHaveAccount")} <TextLink onClick={() => setMode("login")}>{Locale.label("mobile.login.signInLink")}</TextLink>
      </Typography>
    </Box>
  );

  const renderForgot = () => (
    <Box component="form" onSubmit={handleForgotSubmit} sx={formSx}>
      {emailField()}
      <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
        {loading ? spinner : Locale.label("mobile.login.sendCode")}
      </Button>
      <TextLink onClick={() => setMode("login")} sx={{ alignSelf: "center" }}>{Locale.label("mobile.login.backToSignIn")}</TextLink>
    </Box>
  );

  const renderVerify = () => (
    <Box component="form" onSubmit={e => { e.preventDefault(); submitCode(); }} sx={formSx}>
      <Box sx={{ display: "flex", gap: "8px", justifyContent: "center" }}>
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
              border: `1px solid ${tc.control}`,
              borderRadius: "6px",
              outline: "none",
              "&:focus": { borderColor: tc.primary, boxShadow: `0 0 0 1px ${tc.primary}` }
            }}
          />
        ))}
      </Box>
      <Button type="submit" variant="contained" fullWidth disabled={loading || codeDigits.some(d => d === "")} size="large">
        {loading ? spinner : Locale.label("mobile.login.verifyCode")}
      </Button>
      <Box sx={{ display: "flex", justifyContent: "center", gap: "16px" }}>
        <TextLink onClick={resendCode} disabled={resendCooldown > 0 || loading}>
          {resendCooldown > 0 ? Locale.label("mobile.login.resendIn").replace("{}", String(resendCooldown)) : Locale.label("mobile.login.resendCode")}
        </TextLink>
        <TextLink onClick={() => setMode("login")}>{Locale.label("mobile.login.backToSignIn")}</TextLink>
      </Box>
    </Box>
  );

  const renderSetPassword = () => (
    <Box component="form" onSubmit={handleSetPasswordSubmit} sx={formSx}>
      <TextField
        label={Locale.label("mobile.screens.newPassword")}
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        type={showPassword ? "text" : "password"}
        fullWidth
        inputProps={{ autoComplete: "new-password" }}
        InputProps={{ endAdornment: passwordToggle }}
        disabled={loading}
      />
      <TextField
        label={Locale.label("mobile.screens.confirmPassword")}
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        type={showPassword ? "text" : "password"}
        fullWidth
        inputProps={{ autoComplete: "new-password" }}
        disabled={loading}
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading || !newPassword || !confirmPassword} size="large">
        {loading ? spinner : Locale.label("mobile.login.saveAndSignIn")}
      </Button>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: { md: 480 }, mx: "auto" }}>
      <Box sx={{ px: { xs: "16px", md: 0 }, pt: "20px", pb: "16px" }}>
        <Box component="img" src="/mobile/icon/192" alt="" sx={{ width: 44, height: 44, borderRadius: "10px", objectFit: "cover", display: "block" }} />
      </Box>
      <PageHead title={heroTitle()} lede={heroSubtitle()} />
      <Plate>
        <PlateSection>
          {mode === "login" && renderLogin()}
          {mode === "register" && renderRegister()}
          {mode === "forgot" && renderForgot()}
          {mode === "verify" && renderVerify()}
          {mode === "setPassword" && renderSetPassword()}
        </PlateSection>
        {mode === "login" && (
          <PlateSection>
            <Typography sx={{ ...centered, fontSize: 13.5, mb: "10px" }}>
              {churchName ? Locale.label("mobile.login.newTo").replace("{}", churchName) : Locale.label("mobile.login.noAccount")}
            </Typography>
            <Button variant="outlined" size="large" fullWidth onClick={() => setMode("register")}>
              {Locale.label("mobile.login.createAccount")}
            </Button>
          </PlateSection>
        )}
      </Plate>

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
              {Locale.label("mobile.login.register")}
            </Button>
          }
          sx={{ width: "100%" }}
        >
          {Locale.label("mobile.login.noAccountForEmail")}
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
