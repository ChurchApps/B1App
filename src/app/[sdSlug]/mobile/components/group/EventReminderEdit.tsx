"use client";

import React from "react";
import { Box, Button, Checkbox, Chip, FormControlLabel, MenuItem, Switch, TextField, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";

interface ReminderDefinition {
  id?: string;
  offsets?: string;
  sendLocalTime?: string;
  message?: string;
  channels?: string;
  recipientMode?: string;
  enabled?: boolean;
}

interface Props {
  eventId: string;
  hasRegistration?: boolean;
}

const OFFSET_PRESETS = [
  { minutes: 10080, label: () => Locale.label("mobile.group.reminders.days7") },
  { minutes: 4320, label: () => Locale.label("mobile.group.reminders.days3") },
  { minutes: 1440, label: () => Locale.label("mobile.group.reminders.day1") },
  { minutes: 0, label: () => Locale.label("mobile.group.reminders.dayOf") }
];
const MAX_OFFSETS = 3;

const parseOffsets = (csv: string): number[] =>
  csv ? csv.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)) : [];

export const EventReminderEdit = ({ eventId, hasRegistration }: Props) => {
  const tc = mobileTheme.colors;
  const [enabled, setEnabled] = React.useState(false);
  const [defId, setDefId] = React.useState<string | undefined>();
  const [offsets, setOffsets] = React.useState<number[]>([1440]);
  const [sendLocalTime, setSendLocalTime] = React.useState("09:00");
  const [recipientMode, setRecipientMode] = React.useState(hasRegistration ? "registrants" : "group");
  const [message, setMessage] = React.useState("");
  const [channels, setChannels] = React.useState<string[]>(["push", "email"]);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saveFailed, setSaveFailed] = React.useState(false);

  React.useEffect(() => {
    if (!eventId) return;
    ApiHelper.get("/reminders/event/" + eventId, "MessagingApi")
      .then((defs: ReminderDefinition[]) => {
        const def = defs?.[0];
        if (!def) return;
        setDefId(def.id);
        setEnabled(def.enabled !== false);
        setOffsets(parseOffsets(def.offsets || ""));
        setSendLocalTime((def.sendLocalTime || "09:00").slice(0, 5));
        setRecipientMode(def.recipientMode || (hasRegistration ? "registrants" : "group"));
        setMessage(def.message || "");
        setChannels(def.channels ? def.channels.split(",").map((s) => s.trim()).filter(Boolean) : ["push", "email"]);
      })
      .catch(() => {});
  }, [eventId]);

  const toggleOffset = (m: number) =>
    setOffsets((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : prev.length >= MAX_OFFSETS ? prev : [...prev, m]));
  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveFailed(false);
    try {
      if (!enabled && defId) {
        await ApiHelper.delete("/reminders/" + defId, "MessagingApi");
        setDefId(undefined);
      } else if (enabled) {
        const body = { offsets: offsets.join(","), sendLocalTime, message: message || undefined, channels, recipientMode, enabled: true };
        const savedDef: ReminderDefinition = await ApiHelper.post("/reminders/event/" + eventId, body, "MessagingApi");
        if (savedDef?.id) setDefId(savedDef.id);
      }
      setSaved(true);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ borderTop: `1px solid ${tc.iconBackground}`, pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setSaved(false); }} />}
        label={<Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>{Locale.label("mobile.group.reminders.enable")}</Typography>}
      />

      {enabled && (
        <>
          <Box>
            <Typography sx={{ fontSize: 13, color: tc.textSecondary, mb: 1 }}>{Locale.label("mobile.group.reminders.when")}</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {OFFSET_PRESETS.map((p) => {
                const on = offsets.includes(p.minutes);
                return (
                  <Chip
                    key={p.minutes}
                    label={p.label()}
                    onClick={() => toggleOffset(p.minutes)}
                    disabled={!on && offsets.length >= MAX_OFFSETS}
                    sx={{
                      bgcolor: on ? tc.primary : tc.iconBackground,
                      color: on ? tc.onPrimary : tc.text,
                      fontSize: 10.5,
                      fontWeight: 700,
                      borderRadius: "999px",
                      "&:hover": { bgcolor: on ? tc.primary : tc.iconBackground }
                    }}
                    size="small"
                  />
                );
              })}
            </Box>
          </Box>

          <TextField
            size="small"
            type="time"
            label={Locale.label("mobile.group.reminders.timeOfDay")}
            value={sendLocalTime}
            onChange={(e) => setSendLocalTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: 200 }}
          />

          <TextField
            select
            size="small"
            label={Locale.label("mobile.group.reminders.who")}
            value={recipientMode}
            onChange={(e) => setRecipientMode(e.target.value)}
          >
            <MenuItem value="registrants">{Locale.label("mobile.group.reminders.modeRegistrants")}</MenuItem>
            <MenuItem value="registrantsHoh">{Locale.label("mobile.group.reminders.modeRegistrantsHoh")}</MenuItem>
            <MenuItem value="group">{Locale.label("mobile.group.reminders.modeGroup")}</MenuItem>
            <MenuItem value="auto">{Locale.label("mobile.group.reminders.modeAuto")}</MenuItem>
          </TextField>

          <TextField
            size="small"
            multiline
            minRows={2}
            label={Locale.label("mobile.group.reminders.message")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            helperText={Locale.label("mobile.group.reminders.messageHint")}
          />

          <Box>
            <Typography sx={{ fontSize: 13, color: tc.textSecondary, mb: 0.5 }}>{Locale.label("mobile.group.reminders.channels")}</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={channels.includes("push")} onChange={() => toggleChannel("push")} />}
                label="Push"
              />
              <FormControlLabel
                control={<Checkbox size="small" checked={channels.includes("email")} onChange={() => toggleChannel("email")} />}
                label="Email"
              />
            </Box>
          </Box>
        </>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleSave}
          disabled={saving || (enabled && (offsets.length === 0 || channels.length === 0))}
          sx={{ textTransform: "none", borderColor: tc.primary, color: tc.primary }}
        >
          {saving ? Locale.label("mobile.group.saving") : Locale.label("mobile.group.reminders.saveReminder")}
        </Button>
        {saved && <Typography sx={{ fontSize: 13, color: tc.success }}>{Locale.label("mobile.group.reminders.saved")}</Typography>}
        {saveFailed && <Typography sx={{ fontSize: 13, color: tc.error }}>{Locale.label("mobile.group.reminders.saveFailed")}</Typography>}
      </Box>
    </Box>
  );
};

export default EventReminderEdit;
