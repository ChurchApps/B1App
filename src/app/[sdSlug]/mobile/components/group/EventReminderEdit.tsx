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
  { key: "days7", minutes: 10080 },
  { key: "days3", minutes: 4320 },
  { key: "day1", minutes: 1440 },
  { key: "dayOf", minutes: 0 }
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
    } finally {
      setSaving(false);
    }
  };

  const l = (key: string) => Locale.label("mobile.group.reminders." + key);

  return (
    <Box sx={{ borderTop: `1px solid ${tc.iconBackground}`, pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setSaved(false); }} />}
        label={<Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>{l("enable")}</Typography>}
      />

      {enabled && (
        <>
          <Box>
            <Typography sx={{ fontSize: 13, color: tc.textSecondary, mb: 1 }}>{l("when")}</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {OFFSET_PRESETS.map((p) => {
                const on = offsets.includes(p.minutes);
                return (
                  <Chip
                    key={p.minutes}
                    label={l(p.key)}
                    onClick={() => toggleOffset(p.minutes)}
                    disabled={!on && offsets.length >= MAX_OFFSETS}
                    sx={{
                      bgcolor: on ? tc.primary : tc.iconBackground,
                      color: on ? tc.onPrimary : tc.text,
                      fontWeight: 500,
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
            label={l("timeOfDay")}
            value={sendLocalTime}
            onChange={(e) => setSendLocalTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: 200 }}
          />

          <TextField
            select
            size="small"
            label={l("who")}
            value={recipientMode}
            onChange={(e) => setRecipientMode(e.target.value)}
          >
            <MenuItem value="registrants">{l("modeRegistrants")}</MenuItem>
            <MenuItem value="registrantsHoh">{l("modeRegistrantsHoh")}</MenuItem>
            <MenuItem value="group">{l("modeGroup")}</MenuItem>
            <MenuItem value="auto">{l("modeAuto")}</MenuItem>
          </TextField>

          <TextField
            size="small"
            multiline
            minRows={2}
            label={l("message")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            helperText={l("messageHint")}
          />

          <Box>
            <Typography sx={{ fontSize: 13, color: tc.textSecondary, mb: 0.5 }}>{l("channels")}</Typography>
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
          disabled={saving || (enabled && offsets.length === 0)}
          sx={{ textTransform: "none", borderColor: tc.primary, color: tc.primary }}
        >
          {saving ? Locale.label("mobile.group.saving") : l("saveReminder")}
        </Button>
        {saved && <Typography sx={{ fontSize: 13, color: tc.success }}>{l("saved")}</Typography>}
      </Box>
    </Box>
  );
};

export default EventReminderEdit;
