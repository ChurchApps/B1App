"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Icon,
  IconButton,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { RRuleEditor } from "@churchapps/apphelper/website";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { BookingPicker, emptyBookingSelection, type BookingSelection } from "../group/BookingPicker";
import { navigateBack } from "../util";

interface Props {
  config: ConfigurationInterface;
}

const toLocalDefault = (offsetHours: number) => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + offsetHours);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:00`;
};

const localToIso = (v: string) => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

interface Outcome {
  roomId?: string;
  resourceId?: string;
  status?: string;
}

export const RequestEventPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [allDay, setAllDay] = React.useState(false);
  const [start, setStart] = React.useState(toLocalDefault(24));
  const [end, setEnd] = React.useState(toLocalDefault(25));
  const [recurring, setRecurring] = React.useState(false);
  const [rRule, setRRule] = React.useState("");
  const [booking, setBooking] = React.useState<BookingSelection>(emptyBookingSelection());
  const [rooms, setRooms] = React.useState<{ id?: string; name?: string }[]>([]);
  const [resources, setResources] = React.useState<{ id?: string; name?: string }[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<Outcome[] | null>(null);

  const handleData = React.useCallback((r: { id?: string; name?: string }[], res: { id?: string; name?: string }[]) => {
    setRooms(r);
    setResources(res);
  }, []);

  const rruleStartDate = React.useMemo(() => {
    const d = new Date(start);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [start]);

  const toggleRecurring = (checked: boolean) => {
    setRecurring(checked);
    if (checked && !rRule) setRRule("FREQ=WEEKLY;INTERVAL=1");
    if (!checked) setRRule("");
  };

  const submit = async () => {
    if (!title.trim()) { setError(Locale.label("mobile.requests.enterTitle")); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        allDay,
        start: localToIso(allDay ? `${start.slice(0, 10)}T00:00` : start),
        end: localToIso(allDay ? `${end.slice(0, 10)}T23:59` : end),
        recurrenceRule: recurring ? rRule : undefined,
        roomIds: booking.roomIds,
        resources: booking.resourceIds.map((resourceId) => ({ resourceId, quantity: 1 }))
      };
      const result: any = await ApiHelper.post("/events/request", body, "ContentApi");
      setOutcome(Array.isArray(result?.bookings) ? result.bookings : []);
    } catch {
      setError(Locale.label("mobile.requests.failedToSubmit"));
    } finally {
      setSaving(false);
    }
  };

  const nameFor = (b: Outcome) => {
    if (b.roomId) return rooms.find((r) => r.id === b.roomId)?.name || Locale.label("mobile.group.rooms");
    if (b.resourceId) return resources.find((r) => r.id === b.resourceId)?.name || Locale.label("mobile.group.resources");
    return "";
  };

  const renderBack = () => (
    <IconButton
      aria-label={Locale.label("mobile.components.back")}
      onClick={() => navigateBack(router, "/mobile/me")}
      sx={{ width: 40, height: 40, bgcolor: tc.surface, color: tc.text, boxShadow: mobileTheme.shadows.sm, mb: `${mobileTheme.spacing.md}px`, "&:hover": { bgcolor: tc.surface } }}
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  if (outcome) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        {renderBack()}
        <Box sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.md}px` }} data-testid="request-outcome">
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text, mb: 0.5 }}>{Locale.label("mobile.requests.outcomeTitle")}</Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>{Locale.label("mobile.requests.outcomeBody")}</Typography>
          {outcome.length === 0 && (
            <Typography sx={{ fontSize: 14, color: tc.textSecondary }}>{Locale.label("mobile.requests.noBookingItems")}</Typography>
          )}
          {outcome.map((b, i) => {
            const approved = b.status === "approved";
            return (
              <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: i < outcome.length - 1 ? `1px solid ${tc.border}` : "none" }}>
                <Typography sx={{ fontSize: 14, color: tc.text }}>{nameFor(b)}</Typography>
                <Box sx={{ px: 1, py: 0.25, borderRadius: "999px", bgcolor: `${approved ? tc.success : tc.warning}1A`, color: approved ? tc.success : tc.warning, fontSize: 12, fontWeight: 600 }}>
                  {approved ? Locale.label("mobile.requests.approved") : Locale.label("mobile.requests.pending")}
                </Box>
              </Box>
            );
          })}
          <Button
            fullWidth
            variant="contained"
            onClick={() => router.push("/mobile/myRequests")}
            data-testid="request-done"
            sx={{ mt: 2, bgcolor: tc.primary, color: tc.onPrimary, textTransform: "none", fontWeight: 600, borderRadius: `${mobileTheme.radius.md}px`, "&:hover": { bgcolor: tc.primary } }}
          >
            {Locale.label("mobile.requests.myRequests")}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {renderBack()}
      <Box sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.md}px`, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>{Locale.label("mobile.requests.title")}</Typography>
        <TextField
          fullWidth
          size="small"
          label={Locale.label("mobile.requests.eventTitle")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="request-title"
        />
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          label={Locale.label("mobile.requests.description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FormControlLabel
          control={<Switch checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />}
          label={Locale.label("mobile.requests.allDay")}
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label={Locale.label("mobile.requests.start")}
            type={allDay ? "date" : "datetime-local"}
            InputLabelProps={{ shrink: true }}
            value={allDay ? start.slice(0, 10) : start}
            onChange={(e) => setStart(allDay ? `${e.target.value}T00:00` : e.target.value)}
            sx={{ flex: 1, minWidth: 160 }}
          />
          <TextField
            size="small"
            label={Locale.label("mobile.requests.end")}
            type={allDay ? "date" : "datetime-local"}
            InputLabelProps={{ shrink: true }}
            value={allDay ? end.slice(0, 10) : end}
            onChange={(e) => setEnd(allDay ? `${e.target.value}T23:59` : e.target.value)}
            sx={{ flex: 1, minWidth: 160 }}
          />
        </Box>
        <BookingPicker
          value={booking}
          onChange={setBooking}
          start={start}
          end={end}
          recurring={recurring}
          rRule={rRule}
          onData={handleData}
        />
        <FormControlLabel
          control={<Switch checked={recurring} onChange={(e) => toggleRecurring(e.target.checked)} />}
          label={Locale.label("mobile.requests.recurring")}
        />
        {recurring && (
          <Grid container spacing={1} sx={{ pt: 1 }}>
            <RRuleEditor start={rruleStartDate} rRule={rRule || ""} onChange={(next: string) => setRRule(next)} />
          </Grid>
        )}
        {error && <Typography sx={{ color: tc.error, fontSize: 13 }}>{error}</Typography>}
        <Button
          fullWidth
          variant="contained"
          onClick={submit}
          disabled={saving || !title.trim()}
          data-testid="request-submit"
          sx={{ bgcolor: tc.primary, color: tc.onPrimary, textTransform: "none", fontWeight: 600, borderRadius: `${mobileTheme.radius.md}px`, "&:hover": { bgcolor: tc.primary } }}
        >
          {saving ? Locale.label("mobile.requests.submitting") : Locale.label("mobile.requests.submit")}
        </Button>
      </Box>
    </Box>
  );
};

export default RequestEventPage;
