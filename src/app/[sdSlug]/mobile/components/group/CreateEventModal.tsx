"use client";

import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Icon,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  open: boolean;
  groupId: string;
  initialDateIso?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const toLocal = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
};

export const CreateEventModal = ({ open, groupId, initialDateIso, onClose, onSaved }: Props) => {
  const tc = mobileTheme.colors;
  const base = initialDateIso || new Date().toISOString();
  const startDefault = toLocal(base);
  const endBase = new Date(base);
  endBase.setHours(endBase.getHours() + 1);
  const endDefault = toLocal(endBase.toISOString());

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [start, setStart] = React.useState(startDefault);
  const [end, setEnd] = React.useState(endDefault);
  const [allDay, setAllDay] = React.useState(false);
  const [visibility, setVisibility] = React.useState("public");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setStart(startDefault);
      setEnd(endDefault);
      setAllDay(false);
      setVisibility("public");
      setError(null);
    }
  }, [open, startDefault, endDefault]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        groupId,
        title: title.trim(),
        description: description.trim() || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay,
        visibility,
      };
      await ApiHelper.post("/events", [payload], "ContentApi");
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: `${mobileTheme.radius.xl}px` } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>New Event</Typography>
        <IconButton onClick={onClose} aria-label="Close" sx={{ color: tc.text }}>
          <Icon>close</Icon>
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          fullWidth
          size="small"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <TextField
          fullWidth
          size="small"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={2}
        />
        <FormControlLabel
          control={<Switch checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />}
          label="All day"
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label="Start"
            type={allDay ? "date" : "datetime-local"}
            InputLabelProps={{ shrink: true }}
            value={allDay ? start.slice(0, 10) : start}
            onChange={(e) => setStart(allDay ? `${e.target.value}T00:00` : e.target.value)}
            sx={{ flex: 1, minWidth: 160 }}
          />
          <TextField
            size="small"
            label="End"
            type={allDay ? "date" : "datetime-local"}
            InputLabelProps={{ shrink: true }}
            value={allDay ? end.slice(0, 10) : end}
            onChange={(e) => setEnd(allDay ? `${e.target.value}T23:59` : e.target.value)}
            sx={{ flex: 1, minWidth: 160 }}
          />
        </Box>
        <TextField
          select
          size="small"
          label="Visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <MenuItem value="public">Public</MenuItem>
          <MenuItem value="private">Members only</MenuItem>
        </TextField>
        {error && <Typography sx={{ color: tc.error, fontSize: 13 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: tc.text }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          sx={{
            bgcolor: tc.primary,
            color: tc.onPrimary,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: tc.primary },
          }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEventModal;
