"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  Icon,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";

interface CategoryChannels {
  push: boolean;
  email: boolean;
  in_app: boolean;
}

interface NotificationCategory {
  categoryKey: string;
  displayName: string;
  tier: 0 | 1 | 2;
  locked: boolean;
  allowedChannels: string[];
  channels: CategoryChannels;
}

interface NotificationPrefs {
  allowPush: boolean;
  emailFrequency: "never" | "individual" | "daily";
  masterMute: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timeZone: string | null;
  maxPushPerDay: number | null;
  categories: NotificationCategory[];
}

type ChannelKey = "push" | "email" | "in_app";

interface Override {
  categoryKey: string;
  channel: ChannelKey;
  optedIn: boolean;
}

const PUSH_CAP_OPTIONS = [3, 5, 10, 20];

export const NotificationPrefsPage = () => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;

  const deviceZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  }, []);

  const [masterMute, setMasterMute] = useState(false);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [allowPush, setAllowPush] = useState(true);
  const [maxPushPerDay, setMaxPushPerDay] = useState<number | null>(null);
  const [emailFrequency, setEmailFrequency] = useState<"never" | "individual" | "daily">("individual");
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  const displayChannels: { key: ChannelKey; label: string }[] = [
    { key: "push", label: Locale.label("mobile.notificationPrefs.channelPush") },
    { key: "email", label: Locale.label("mobile.notificationPrefs.channelEmail") },
    { key: "in_app", label: Locale.label("mobile.notificationPrefs.channelInApp") }
  ];

  const { data: prefs, isLoading } = useQuery<NotificationPrefs>({
    queryKey: ["notificationPrefs", context?.user?.id],
    queryFn: () => ApiHelper.get("/notificationpreferences/my", "MessagingApi"),
    enabled: loggedIn
  });

  const applyPrefs = React.useCallback((p: NotificationPrefs) => {
    setMasterMute(!!p.masterMute);
    setQuietStart(p.quietHoursStart || "");
    setQuietEnd(p.quietHoursEnd || "");
    setTimeZone(p.timeZone || deviceZone);
    setAllowPush(!!p.allowPush);
    setMaxPushPerDay(p.maxPushPerDay ?? null);
    setEmailFrequency(p.emailFrequency || "individual");
    setOverrides(new Map());
  }, [deviceZone]);

  useEffect(() => {
    if (prefs) applyPrefs(prefs);
  }, [prefs, applyPrefs]);

  const timeZones = useMemo(() => {
    const supported: string[] = typeof (Intl as any).supportedValuesOf === "function"
      ? (Intl as any).supportedValuesOf("timeZone")
      : [];
    const all = supported.length ? [...supported] : [deviceZone].filter(Boolean);
    if (timeZone && !all.includes(timeZone)) all.unshift(timeZone);
    return all;
  }, [deviceZone, timeZone]);

  const overrideKey = (categoryKey: string, channel: ChannelKey) => `${categoryKey}::${channel}`;

  const resolvedChannel = (cat: NotificationCategory, channel: ChannelKey): boolean => {
    const k = overrideKey(cat.categoryKey, channel);
    if (overrides.has(k)) return overrides.get(k)!;
    return cat.channels[channel];
  };

  const handleChannelToggle = (cat: NotificationCategory, channel: ChannelKey) => {
    if (cat.locked) return;
    const current = resolvedChannel(cat, channel);
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(overrideKey(cat.categoryKey, channel), !current);
      return next;
    });
  };

  const buildSavePayload = () => {
    const overrideList: Override[] = [];
    overrides.forEach((optedIn, key) => {
      const [categoryKey, channel] = key.split("::");
      overrideList.push({ categoryKey, channel: channel as ChannelKey, optedIn });
    });
    return {
      allowPush,
      emailFrequency,
      masterMute,
      quietHoursStart: quietStart || null,
      quietHoursEnd: quietEnd || null,
      timeZone: timeZone || null,
      maxPushPerDay,
      overrides: overrideList
    };
  };

  const isDirty = !!prefs && (
    masterMute !== !!prefs.masterMute
    || allowPush !== !!prefs.allowPush
    || maxPushPerDay !== (prefs.maxPushPerDay ?? null)
    || emailFrequency !== (prefs.emailFrequency || "individual")
    || quietStart !== (prefs.quietHoursStart || "")
    || quietEnd !== (prefs.quietHoursEnd || "")
    || timeZone !== (prefs.timeZone || deviceZone)
    || overrides.size > 0
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await ApiHelper.post("/notificationpreferences/", buildSavePayload(), "MessagingApi");
      setOverrides(new Map());
      setSnack({ open: true, msg: Locale.label("mobile.notificationPrefs.saved"), severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || Locale.label("mobile.notificationPrefs.saveFailed"), severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const cardSx = {
    bgcolor: tc.surface,
    border: `1px solid ${tc.border}`,
    borderRadius: `${mobileTheme.radius.lg}px`,
    p: `${mobileTheme.spacing.md}px`,
    mb: `${mobileTheme.spacing.md}px`
  };

  const sectionHeader = (label: string, icon: string) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: `1px solid ${tc.border}`, pb: 1, mb: 2 }}>
      <Icon sx={{ color: tc.primary, fontSize: 22 }}>{icon}</Icon>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>{label}</Typography>
    </Box>
  );

  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: `${mobileTheme.radius.md}px` } };

  if (!loggedIn) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box sx={{ ...cardSx, textAlign: "center", p: `${mobileTheme.spacing.lg}px` }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "11px",
              bgcolor: tc.iconBackground,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: `${mobileTheme.spacing.md}px`
            }}
          >
            <Icon sx={{ fontSize: 32, color: tc.primary }}>notifications</Icon>
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>
            {Locale.label("mobile.notificationPrefs.signedOutTitle")}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
            {Locale.label("mobile.notificationPrefs.signedOutBody")}
          </Typography>
          <Button
            variant="contained"
            href="/mobile/login?returnUrl=/mobile/notificationPrefs"
            sx={{ bgcolor: tc.primary, color: tc.onPrimary, borderRadius: `${mobileTheme.radius.md}px`, textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: tc.primary } }}
          >
            {Locale.label("mobile.screens.signIn")}
          </Button>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: tc.primary }} />
      </Box>
    );
  }

  const categories = prefs?.categories || [];

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>

      <Box sx={cardSx}>
        {sectionHeader(Locale.label("mobile.notificationPrefs.globalControls"), "tune")}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: `1px solid ${tc.border}` }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>{Locale.label("mobile.notificationPrefs.muteAll")}</Typography>
            <Typography sx={{ fontSize: 12, color: tc.textMuted }}>{Locale.label("mobile.notificationPrefs.muteAllHelp")}</Typography>
          </Box>
          <Switch checked={masterMute} onChange={(e) => setMasterMute(e.target.checked)} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: `1px solid ${tc.border}` }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>{Locale.label("mobile.notificationPrefs.pushNotifications")}</Typography>
            <Typography sx={{ fontSize: 12, color: tc.textMuted }}>{Locale.label("mobile.notificationPrefs.pushHelp")}</Typography>
          </Box>
          <Switch checked={allowPush} onChange={(e) => setAllowPush(e.target.checked)} />
        </Box>

        <FormControl fullWidth sx={{ mt: 2, mb: 2, ...inputSx }}>
          <InputLabel id="email-freq-label">{Locale.label("mobile.notificationPrefs.emailFrequency")}</InputLabel>
          <Select
            labelId="email-freq-label"
            label={Locale.label("mobile.notificationPrefs.emailFrequency")}
            value={emailFrequency}
            onChange={(e: SelectChangeEvent<string>) => setEmailFrequency(e.target.value as typeof emailFrequency)}
            sx={{ borderRadius: `${mobileTheme.radius.md}px` }}
          >
            <MenuItem value="never">{Locale.label("mobile.notificationPrefs.freqNever")}</MenuItem>
            <MenuItem value="individual">{Locale.label("mobile.notificationPrefs.freqIndividual")}</MenuItem>
            <MenuItem value="daily">{Locale.label("mobile.notificationPrefs.freqDaily")}</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 1, ...inputSx }}>
          <InputLabel id="max-push-label">{Locale.label("mobile.notificationPrefs.maxPushPerDay")}</InputLabel>
          <Select
            labelId="max-push-label"
            label={Locale.label("mobile.notificationPrefs.maxPushPerDay")}
            value={maxPushPerDay === null ? "none" : String(maxPushPerDay)}
            onChange={(e: SelectChangeEvent<string>) => setMaxPushPerDay(e.target.value === "none" ? null : Number(e.target.value))}
            sx={{ borderRadius: `${mobileTheme.radius.md}px` }}
          >
            <MenuItem value="none">{Locale.label("mobile.notificationPrefs.unlimited")}</MenuItem>
            {PUSH_CAP_OPTIONS.map((n) => (
              <MenuItem key={n} value={String(n)}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={cardSx}>
        {sectionHeader(Locale.label("mobile.notificationPrefs.quietHours"), "bedtime")}
        <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 2 }}>
          {Locale.label("mobile.notificationPrefs.quietHoursHelp")}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label={Locale.label("mobile.notificationPrefs.quietStart")}
            value={quietStart}
            onChange={(e) => setQuietStart(e.target.value)}
            placeholder="22:00"
            inputProps={{ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <TextField
            label={Locale.label("mobile.notificationPrefs.quietEnd")}
            value={quietEnd}
            onChange={(e) => setQuietEnd(e.target.value)}
            placeholder="07:00"
            inputProps={{ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
        </Box>
        <FormControl fullWidth sx={{ mt: 2, ...inputSx }}>
          <InputLabel id="time-zone-label">{Locale.label("mobile.notificationPrefs.timeZone")}</InputLabel>
          <Select
            labelId="time-zone-label"
            label={Locale.label("mobile.notificationPrefs.timeZone")}
            value={timeZone}
            onChange={(e: SelectChangeEvent<string>) => setTimeZone(e.target.value)}
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
            sx={{ borderRadius: `${mobileTheme.radius.md}px` }}
          >
            {timeZones.map((tz) => (
              <MenuItem key={tz} value={tz}>{tz}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {categories.length > 0 && (
        <Box sx={cardSx}>
          {sectionHeader(Locale.label("mobile.notificationPrefs.categories"), "category")}
          <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 2 }}>
            {Locale.label("mobile.notificationPrefs.categoriesHelp")}
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{
                minWidth: { sm: 320 },
                "& thead": { display: { xs: "none", sm: "table-header-group" } },
                "& tbody tr": { display: { xs: "block", sm: "table-row" }, py: { xs: 1, sm: 0 }, borderBottom: { xs: `1px solid ${tc.border}`, sm: 0 } },
                "& tbody td": { display: { xs: "flex", sm: "table-cell" }, alignItems: "center", justifyContent: "space-between", borderBottom: { xs: 0, sm: `1px solid ${tc.border}` } },
                "& tbody td[data-label]::before": { content: "attr(data-label)", display: { xs: "block", sm: "none" }, fontSize: 13, color: tc.textMuted }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: tc.text, pl: 0, fontSize: 13 }}>{Locale.label("mobile.notificationPrefs.category")}</TableCell>
                  {displayChannels.map((ch) => (
                    <TableCell key={ch.key} align="center" sx={{ fontWeight: 600, color: tc.text, fontSize: 13, whiteSpace: "nowrap" }}>
                      {ch.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.categoryKey} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ pl: 0, py: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {cat.locked && (
                          <Tooltip title={Locale.label("mobile.notificationPrefs.lockedTooltip")} arrow>
                            <LockIcon sx={{ fontSize: 14, color: tc.disabled }} />
                          </Tooltip>
                        )}
                        <Typography sx={{ fontSize: 13, color: tc.text }}>{cat.displayName}</Typography>
                      </Box>
                    </TableCell>
                    {displayChannels.map((ch) => {
                      const allowed = cat.allowedChannels.includes(ch.key);
                      const checked = resolvedChannel(cat, ch.key);
                      return (
                        <TableCell key={ch.key} align="center" data-label={ch.label} sx={{ py: 1 }}>
                          {allowed ? (
                            <Checkbox
                              checked={checked}
                              disabled={cat.locked}
                              onChange={() => handleChannelToggle(cat, ch.key)}
                              size="small"
                              inputProps={{ "aria-label": `${cat.displayName} ${ch.label}` }}
                              sx={{ p: "2px", color: tc.primary, "&.Mui-checked": { color: tc.primary } }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: 12, color: tc.disabled }}>—</Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1, mb: `${mobileTheme.spacing.md}px` }}>
        {isDirty && (
          <Button
            variant="outlined"
            onClick={() => prefs && applyPrefs(prefs)}
            disabled={saving}
            sx={{ borderColor: tc.border, color: tc.textSecondary, borderRadius: `${mobileTheme.radius.md}px`, textTransform: "none", fontWeight: 600, py: 1.4 }}
          >
            {Locale.label("mobile.notificationPrefs.discard")}
          </Button>
        )}
        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          disabled={saving || !isDirty}
          sx={{
            bgcolor: tc.primary,
            borderRadius: `${mobileTheme.radius.md}px`,
            textTransform: "none",
            fontWeight: 600,
            py: 1.4,
            fontSize: 15,
            "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
            "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint }
          }}
        >
          {saving ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : Locale.label("mobile.notificationPrefs.savePreferences")}
        </Button>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
