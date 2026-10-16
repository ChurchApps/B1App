"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
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
import { PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, Sheet, TextLink } from "../kit";

interface CategoryChannels {
  push: boolean;
  email: boolean;
  in_app: boolean;
  sms: boolean;
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
  allowSms: boolean;
  emailFrequency: "never" | "individual" | "daily";
  masterMute: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timeZone: string | null;
  maxPushPerDay: number | null;
  categories: NotificationCategory[];
}

type ChannelKey = "push" | "email" | "in_app" | "sms";

interface Override {
  categoryKey: string;
  channel: ChannelKey;
  optedIn: boolean;
}

const PUSH_CAP_OPTIONS = [3, 5, 10, 20];

const tc = mobileTheme.colors;

// Channel toggle: filled chip = on, outlined = off.
const ChannelChip = ({ on, disabled, label, ariaLabel, onToggle }: { on: boolean; disabled?: boolean; label: string; ariaLabel: string; onToggle: () => void }) => (
  <Box
    component="button"
    type="button"
    role="checkbox"
    aria-checked={on}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={onToggle}
    sx={{
      height: 30,
      px: "12px",
      borderRadius: 999,
      border: `1px solid ${on ? "transparent" : tc.control}`,
      bgcolor: on ? tc.chip : "transparent",
      color: on ? tc.onChip : tc.textSecondary,
      fontSize: 13.5,
      fontWeight: on ? 600 : 500,
      fontFamily: "inherit",
      whiteSpace: "nowrap",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.6 : 1,
      "&:focus-visible": { outline: `2px solid ${tc.primary}`, outlineOffset: 2 }
    }}
  >
    {label}
  </Box>
);

export const NotificationPrefsPage = () => {
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
  const [allowSms, setAllowSms] = useState(false);
  const [maxPushPerDay, setMaxPushPerDay] = useState<number | null>(null);
  const [emailFrequency, setEmailFrequency] = useState<"never" | "individual" | "daily">("individual");
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });
  const [quietSheet, setQuietSheet] = useState<{ start: string; end: string; zone: string } | null>(null);

  const displayChannels: { key: ChannelKey; label: string }[] = [
    { key: "push", label: Locale.label("mobile.notificationPrefs.channelPush") },
    { key: "email", label: Locale.label("mobile.notificationPrefs.channelEmail") },
    { key: "in_app", label: Locale.label("mobile.notificationPrefs.channelInApp") }
  ];

  // Texts only exist when the church has a texting provider.
  const { data: textingStatus } = useQuery<{ enabled?: boolean }>({
    queryKey: ["textingStatus", context?.userChurch?.church?.id],
    queryFn: () => ApiHelper.get("/texting/status", "MessagingApi"),
    enabled: loggedIn
  });
  const textingEnabled = !!textingStatus?.enabled;
  if (textingEnabled) displayChannels.push({ key: "sms", label: Locale.label("mobile.notificationPrefs.channelSms") });

  const { data: prefs, isLoading, refetch } = useQuery<NotificationPrefs>({
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
    setAllowSms(!!p.allowSms);
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

  // Category names come from the API in English; translate by key and fall back to the server name for new categories.
  const categoryName = (cat: { categoryKey: string; displayName: string }) => Locale.label("mobile.notificationPrefs.categoryNames." + cat.categoryKey, cat.displayName);
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
      ...(textingEnabled ? { allowSms } : {}),
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
    || allowSms !== !!prefs.allowSms
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
      await refetch();
      setOverrides(new Map());
      setSnack({ open: true, msg: Locale.label("mobile.notificationPrefs.saved"), severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || Locale.label("mobile.notificationPrefs.saveFailed"), severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openQuietSheet = () => setQuietSheet({ start: quietStart, end: quietEnd, zone: timeZone });
  const cancelQuietSheet = () => {
    if (quietSheet) {
      setQuietStart(quietSheet.start);
      setQuietEnd(quietSheet.end);
      setTimeZone(quietSheet.zone);
    }
    setQuietSheet(null);
  };

  const churchName = context?.userChurch?.church?.name;

  if (!loggedIn) {
    return (
      <PageHead title={Locale.label("mobile.notificationPrefs.signedOutTitle")} lede={Locale.label("mobile.notificationPrefs.signedOutBody")}>
        <Button variant="contained" href="/mobile/login?returnUrl=/mobile/notificationPrefs">{Locale.label("mobile.screens.signIn")}</Button>
      </PageHead>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ py: "48px", display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: tc.primary }} />
      </Box>
    );
  }

  const categories = prefs?.categories || [];

  const toggleRow = (label: string, help: string, checked: boolean, onChange: (v: boolean) => void, testId?: string) => (
    <Row
      title={label}
      subtitle={help}
      trailing={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} slotProps={{ input: { "aria-label": label } }} data-testid={testId} />}
    />
  );

  return (
    <Box sx={{ pb: "24px" }}>
      <PageHead
        title={Locale.label("mobile.screenTitles.notificationPrefs")}
        lede={churchName ? Locale.label("mobile.notificationPrefs.lede").replace("{}", churchName) : undefined}
      />
      <Plate>
        <PlateSection title={Locale.label("mobile.notificationPrefs.delivery")}>
          <RowList>
            {toggleRow(Locale.label("mobile.notificationPrefs.pushNotifications"), Locale.label("mobile.notificationPrefs.pushHelp"), allowPush, setAllowPush)}
            {textingEnabled && toggleRow(Locale.label("mobile.notificationPrefs.textMessages"), Locale.label("mobile.notificationPrefs.textHelp"), allowSms, setAllowSms, "notification-prefs-allow-sms")}
            {toggleRow(Locale.label("mobile.notificationPrefs.muteAll"), Locale.label("mobile.notificationPrefs.muteAllHelp"), masterMute, setMasterMute)}
          </RowList>
          <FormControl fullWidth sx={{ mt: "16px" }}>
            <InputLabel id="max-push-label">{Locale.label("mobile.notificationPrefs.maxPushPerDay")}</InputLabel>
            <Select
              labelId="max-push-label"
              label={Locale.label("mobile.notificationPrefs.maxPushPerDay")}
              value={maxPushPerDay === null ? "none" : String(maxPushPerDay)}
              onChange={(e: SelectChangeEvent<string>) => setMaxPushPerDay(e.target.value === "none" ? null : Number(e.target.value))}
            >
              <MenuItem value="none">{Locale.label("mobile.notificationPrefs.unlimited")}</MenuItem>
              {PUSH_CAP_OPTIONS.map((n) => (
                <MenuItem key={n} value={String(n)}>{n}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </PlateSection>

        <PlateSection title={Locale.label("mobile.notificationPrefs.channelEmail")}>
          <FormControl fullWidth>
            <InputLabel id="email-freq-label">{Locale.label("mobile.notificationPrefs.emailFrequency")}</InputLabel>
            <Select
              labelId="email-freq-label"
              label={Locale.label("mobile.notificationPrefs.emailFrequency")}
              value={emailFrequency}
              onChange={(e: SelectChangeEvent<string>) => setEmailFrequency(e.target.value as typeof emailFrequency)}
            >
              <MenuItem value="never">{Locale.label("mobile.notificationPrefs.freqNever")}</MenuItem>
              <MenuItem value="individual">{Locale.label("mobile.notificationPrefs.freqIndividual")}</MenuItem>
              <MenuItem value="daily">{Locale.label("mobile.notificationPrefs.freqDaily")}</MenuItem>
            </Select>
          </FormControl>
        </PlateSection>

        <PlateSection title={Locale.label("mobile.notificationPrefs.quietHours")} action={<TextLink data-testid="notification-prefs-quiet-change" onClick={openQuietSheet}>{Locale.label("mobile.screens.change")}</TextLink>}>
          {quietStart && quietEnd
            ? (
              <Typography sx={{ fontSize: 15, color: tc.text }}>
                {quietStart} – {quietEnd}
                {timeZone && <Box component="span" sx={{ ml: "8px", fontSize: 13.5, color: tc.textSecondary }}>{timeZone}</Box>}
              </Typography>
            )
            : <QuietEmpty>{Locale.label("mobile.notificationPrefs.quietHoursOff")}</QuietEmpty>}
        </PlateSection>

        {categories.length > 0 && (
          <PlateSection title={Locale.label("mobile.notificationPrefs.categories")}>
            <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, mb: "4px" }}>{Locale.label("mobile.notificationPrefs.categoriesHelp")}</Typography>
            <RowList>
              {categories.map((cat) => (
                <Row
                  key={cat.categoryKey}
                  data-testid="notification-category"
                  sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
                  title={(
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {cat.locked && (
                        <Tooltip title={Locale.label("mobile.notificationPrefs.lockedTooltip")} arrow>
                          <LockIcon sx={{ fontSize: 14, color: tc.textSecondary }} />
                        </Tooltip>
                      )}
                      {categoryName(cat)}
                    </Box>
                  )}
                  trailing={(
                    <Box sx={{ display: "flex", gap: "6px", flexWrap: "wrap", flexBasis: { xs: "100%", sm: "auto" }, flexShrink: 0 }}>
                      {displayChannels.filter((ch) => cat.allowedChannels.includes(ch.key)).map((ch) => (
                        <ChannelChip
                          key={ch.key}
                          on={resolvedChannel(cat, ch.key)}
                          disabled={cat.locked}
                          label={ch.label}
                          ariaLabel={`${categoryName(cat)} ${ch.label}`}
                          onToggle={() => handleChannelToggle(cat, ch.key)}
                        />
                      ))}
                    </Box>
                  )}
                />
              ))}
            </RowList>
          </PlateSection>
        )}
      </Plate>

      <Stack direction="row" sx={{ gap: "8px", mt: "16px", px: { xs: "12px", md: 0 } }}>
        <Button variant="contained" onClick={handleSave} disabled={saving || !isDirty} sx={{ flex: { xs: 1, sm: "none" }, minWidth: 160 }}>
          {saving ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : Locale.label("mobile.notificationPrefs.savePreferences")}
        </Button>
        {isDirty && (
          <Button variant="outlined" onClick={() => prefs && applyPrefs(prefs)} disabled={saving}>
            {Locale.label("mobile.notificationPrefs.discard")}
          </Button>
        )}
      </Stack>

      <Sheet
        open={!!quietSheet}
        onClose={cancelQuietSheet}
        title={Locale.label("mobile.notificationPrefs.quietHours")}
        actions={(
          <>
            <Button variant="contained" onClick={() => setQuietSheet(null)}>{Locale.label("mobile.screens.done")}</Button>
            <Button variant="outlined" onClick={cancelQuietSheet}>{Locale.label("common.cancel")}</Button>
          </>
        )}
      >
        <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, mb: "16px" }}>{Locale.label("mobile.notificationPrefs.quietHoursHelp")}</Typography>
        <Box sx={{ display: "flex", gap: "12px", pt: "6px" }}>
          <TextField
            label={Locale.label("mobile.notificationPrefs.quietStart")}
            value={quietStart}
            onChange={(e) => setQuietStart(e.target.value)}
            placeholder="22:00"
            inputProps={{ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }}
            fullWidth
          />
          <TextField
            label={Locale.label("mobile.notificationPrefs.quietEnd")}
            value={quietEnd}
            onChange={(e) => setQuietEnd(e.target.value)}
            placeholder="07:00"
            inputProps={{ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }}
            fullWidth
          />
        </Box>
        <FormControl fullWidth sx={{ mt: "16px" }}>
          <InputLabel id="time-zone-label">{Locale.label("mobile.notificationPrefs.timeZone")}</InputLabel>
          <Select
            labelId="time-zone-label"
            label={Locale.label("mobile.notificationPrefs.timeZone")}
            value={timeZone}
            onChange={(e: SelectChangeEvent<string>) => setTimeZone(e.target.value)}
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
          >
            {timeZones.map((tz) => (
              <MenuItem key={tz} value={tz}>{tz}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Sheet>

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
