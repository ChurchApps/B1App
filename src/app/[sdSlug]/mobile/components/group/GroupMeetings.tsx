"use client";

import React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { MarkdownEditor, MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { mobileTheme } from "../mobileTheme";
import { QuietEmpty, Sheet, StatusBadge } from "../kit";

export interface MeetingSession {
  id?: string;
  groupId?: string;
  serviceTimeId?: string;
  sessionDate?: string;
  notes?: string;
  visitCount?: number;
}

const tc = mobileTheme.colors;

export const toHtmlDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const sessionDay = (s: MeetingSession) => (s.sessionDate || "").slice(0, 10);

const prettyDay = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

export const listedMeetings = (sessions: MeetingSession[]) =>
  sessions.filter((s) => sessionDay(s) && (s.notes?.trim() || (s.visitCount || 0) > 0)).sort((a, b) => sessionDay(b).localeCompare(sessionDay(a)));

interface ListProps {
  sessions: MeetingSession[];
  memberCount: number;
  limit?: number;
  onOpen?: (day: string) => void;
}

export const GroupMeetingsList = ({ sessions, memberCount, limit, onOpen }: ListProps) => {
  const today = toHtmlDate(new Date());
  const rows = listedMeetings(sessions).slice(0, limit);
  if (rows.length === 0) return <QuietEmpty>{Locale.label("mobile.group.noMeetingsYet")}</QuietEmpty>;
  return (
    <Box>
      {rows.map((s) => {
        const day = sessionDay(s);
        const status = (s.visitCount || 0) > 0
          ? Locale.label("mobile.group.nOfMThere").replace("{}", String(s.visitCount)).replace("{}", String(memberCount))
          : day >= today ? Locale.label("mobile.group.upcoming") : "";
        const title = [prettyDay(day), status].filter(Boolean).join(" · ");
        return (
          <Box key={s.id || day} data-testid="group-meeting-row" sx={{ py: "12px", "& + &": { borderTop: `1px solid ${tc.border}` } }}>
            {onOpen
              ? <Box component="button" type="button" onClick={() => onOpen(day)} sx={{ display: "block", p: 0, border: 0, background: "none", font: "inherit", textAlign: "left", cursor: "pointer", fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text, "&:focus-visible": { outline: `2px solid ${tc.primary}` } }}>{title}</Box>
              : <Typography sx={{ fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text }}>{title}</Typography>}
            {s.notes && (
              <Box sx={{ mt: "2px", fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, overflowWrap: "anywhere", "& p": { m: 0 }, "& p + p, & ul, & ol": { mt: "6px" }, "& ul, & ol": { pl: 3, mb: 0 }, "& a": { color: tc.link } }}>
                <MarkdownPreviewLight value={s.notes} />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

interface SheetProps {
  open: boolean;
  groupId: string;
  sessions: MeetingSession[];
  initialDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const MeetingNoteSheet = ({ open, groupId, sessions, initialDate, onClose, onSaved }: SheetProps) => {
  const [date, setDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [ready, setReady] = React.useState(false);
  // An unmounting MarkdownEditor fires onChange with its old text; only the current date's editor may write.
  const dateRef = React.useRef("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);

  const defaultDate = () => {
    const now = new Date();
    const today = toHtmlDate(now);
    const weekAgo = toHtmlDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
    // ponytail: "latest meeting" = latest session this past week, so an old note is never the default to overwrite.
    const latest = sessions.map(sessionDay).filter((d) => d && d <= today && d >= weekAgo).sort().pop();
    return latest || today;
  };

  const pick = (day: string) => {
    dateRef.current = day;
    setDate(day);
    setNotes(sessions.find((s) => sessionDay(s) === day)?.notes || "");
  };

  React.useEffect(() => {
    setReady(open);
    if (!open) return;
    setError(false);
    pick(initialDate || defaultDate());
  }, [open]);

  const save = async () => {
    if (!date) return;
    setSaving(true);
    setError(false);
    try {
      const existing = sessions.find((s) => sessionDay(s) === date);
      const payload = existing?.id
        ? { id: existing.id, groupId, serviceTimeId: existing.serviceTimeId, sessionDate: date, notes }
        : { groupId, sessionDate: date, notes };
      await ApiHelper.post("/sessions", [payload], "AttendanceApi");
      onSaved();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={Locale.label("mobile.group.addNote")}
      actions={(
        <>
          {error && <StatusBadge tone="bad">{Locale.label("mobile.group.failedNoteSave")}</StatusBadge>}
          <Button variant="outlined" onClick={onClose}>{Locale.label("common.cancel")}</Button>
          <Button variant="contained" onClick={save} disabled={saving || !date} data-testid="meeting-note-save">{Locale.label("mobile.group.save")}</Button>
        </>
      )}
    >
      <TextField
        type="date"
        fullWidth
        label={Locale.label("common.date")}
        value={date}
        onChange={(e) => pick(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ mt: "8px" }}
      />
      <Box sx={{ mt: "16px" }} data-testid="meeting-note-text">
        {ready && <MarkdownEditor key={date} value={notes} onChange={(v) => { if (dateRef.current === date) setNotes(v); }} placeholder={Locale.label("mobile.group.notes")} style={{ maxHeight: 280, overflowY: "auto" }} />}
      </Box>
    </Sheet>
  );
};
