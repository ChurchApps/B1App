"use client";

import React, { useContext, useEffect, useState } from "react";
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
import { ApiHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";

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
  emailFrequency: "never" | "individual" | "daily";
  masterMute: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timeZone: string | null;
  allowSms: boolean;
  maxPushPerDay: number | null;
  categories: NotificationCategory[];
}

type ChannelKey = "push" | "email" | "in_app";

interface Override {
  categoryKey: string;
  channel: ChannelKey;
  optedIn: boolean;
}

const DISPLAY_CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: "push", label: "Push" },
  { key: "email", label: "Email" },
  { key: "in_app", label: "In-App" }
];

export const NotificationPrefsPage = () => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;

  const [masterMute, setMasterMute] = useState(false);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [allowPush, setAllowPush] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState<"never" | "individual" | "daily">("individual");
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  const { data: prefs, isLoading } = useQuery<NotificationPrefs>({
    queryKey: ["notificationPrefs", context?.user?.id],
    queryFn: () => ApiHelper.get("/notificationpreferences/my", "MessagingApi"),
    enabled: loggedIn
  });

  useEffect(() => {
    if (!prefs) return;
    setMasterMute(!!prefs.masterMute);
    setQuietStart(prefs.quietHoursStart || "");
    setQuietEnd(prefs.quietHoursEnd || "");
    setTimeZone(prefs.timeZone || "");
    setAllowPush(!!prefs.allowPush);
    setEmailFrequency(prefs.emailFrequency || "individual");
    setOverrides(new Map());
  }, [prefs]);

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
      overrides: overrideList
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await ApiHelper.post("/notificationpreferences/", buildSavePayload(), "MessagingApi");
      setOverrides(new Map());
      setSnack({ open: true, msg: "Preferences saved.", severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || "Could not save preferences.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const cardSx = {
    bgcolor: tc.surface,
    borderRadius: `${mobileTheme.radius.lg}px`,
    boxShadow: mobileTheme.shadows.sm,
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
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ color: tc.textMuted }}>Sign in to manage notification preferences.</Typography>
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
        {sectionHeader("Global Controls", "tune")}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: `1px solid ${tc.border}` }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>Mute all notifications</Typography>
            <Typography sx={{ fontSize: 12, color: tc.textMuted }}>Silences every channel temporarily</Typography>
          </Box>
          <Switch checked={masterMute} onChange={(e) => setMasterMute(e.target.checked)} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: `1px solid ${tc.border}` }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>Push notifications</Typography>
            <Typography sx={{ fontSize: 12, color: tc.textMuted }}>Allow push alerts on this account</Typography>
          </Box>
          <Switch checked={allowPush} onChange={(e) => setAllowPush(e.target.checked)} />
        </Box>

        <FormControl fullWidth sx={{ mt: 2, mb: 2, ...inputSx }}>
          <InputLabel id="email-freq-label">Email frequency</InputLabel>
          <Select
            labelId="email-freq-label"
            label="Email frequency"
            value={emailFrequency}
            onChange={(e: SelectChangeEvent<string>) => setEmailFrequency(e.target.value as typeof emailFrequency)}
            sx={{ borderRadius: `${mobileTheme.radius.md}px` }}
          >
            <MenuItem value="never">Never</MenuItem>
            <MenuItem value="individual">Per notification</MenuItem>
            <MenuItem value="daily">Daily digest</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={cardSx}>
        {sectionHeader("Quiet Hours", "bedtime")}
        <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 2 }}>
          Leave blank to disable quiet hours. Times use 24-hour format (HH:MM).
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Start (HH:MM)"
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
            label="End (HH:MM)"
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
        <TextField
          label="Time zone"
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
          placeholder="America/Chicago"
          variant="outlined"
          size="medium"
          fullWidth
          sx={{ mt: 2, ...inputSx }}
        />
      </Box>

      {categories.length > 0 && (
        <Box sx={cardSx}>
          {sectionHeader("Notification Categories", "category")}
          <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 2 }}>
            Choose which channels to use per category.
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 320 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: tc.text, pl: 0, fontSize: 13 }}>Category</TableCell>
                  {DISPLAY_CHANNELS.map((ch) => (
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
                          <Tooltip title="Required for safety/legal reasons." arrow>
                            <LockIcon sx={{ fontSize: 14, color: tc.disabled }} />
                          </Tooltip>
                        )}
                        <Typography sx={{ fontSize: 13, color: tc.text }}>{cat.displayName}</Typography>
                      </Box>
                    </TableCell>
                    {DISPLAY_CHANNELS.map((ch) => {
                      const allowed = cat.allowedChannels.includes(ch.key);
                      const checked = resolvedChannel(cat, ch.key);
                      return (
                        <TableCell key={ch.key} align="center" sx={{ py: 1 }}>
                          {allowed ? (
                            <Checkbox
                              checked={checked}
                              disabled={cat.locked}
                              onChange={() => handleChannelToggle(cat, ch.key)}
                              size="small"
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

      <Button
        variant="contained"
        fullWidth
        onClick={handleSave}
        disabled={saving}
        sx={{
          bgcolor: tc.primary,
          borderRadius: `${mobileTheme.radius.md}px`,
          textTransform: "none",
          fontWeight: 600,
          py: 1.4,
          fontSize: 15,
          "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
          "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        {saving ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Save Preferences"}
      </Button>

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
