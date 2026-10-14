"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { RRuleEditor } from "@churchapps/apphelper/website";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { navigateBack } from "../util";
import { PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, StatusBadge } from "../kit";
import { BookingPicker, emptyBookingSelection, type BookingSelection } from "../group/BookingPicker";

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

const tc = mobileTheme.colors;

export const RequestEventPage = ({ config: _config }: Props) => {
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

  if (outcome) {
    return (
      <Box>
        <PageHead title={Locale.label("mobile.requests.outcomeTitle")} lede={Locale.label("mobile.requests.outcomeBody")} />
        <Plate data-testid="request-outcome">
          <PlateSection>
            {outcome.length === 0
              ? <QuietEmpty>{Locale.label("mobile.requests.noBookingItems")}</QuietEmpty>
              : (
                <RowList>
                  {outcome.map((b, i) => {
                    const approved = b.status === "approved";
                    return (
                      <Row
                        key={i}
                        title={nameFor(b)}
                        trailing={<StatusBadge tone={approved ? "ok" : "warn"} dot={approved}>{approved ? Locale.label("mobile.requests.approved") : Locale.label("mobile.requests.pending")}</StatusBadge>}
                      />
                    );
                  })}
                </RowList>
              )}
          </PlateSection>
        </Plate>
        <Box sx={{ px: { xs: "12px", md: 0 }, pt: "20px" }}>
          <Button fullWidth variant="contained" onClick={() => router.push("/mobile/myRequests")} data-testid="request-done">
            {Locale.label("mobile.requests.myRequests")}
          </Button>
        </Box>
      </Box>
    );
  }

  const switchRow = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
      label={label}
      labelPlacement="start"
      sx={{ mx: 0, minHeight: 44, justifyContent: "space-between", "& .MuiFormControlLabel-label": { color: tc.text } }}
    />
  );

  return (
    <Box>
      <PageHead title={Locale.label("mobile.requests.title")} lede={Locale.label("mobile.requests.formLede")} />
      <Plate>
        <PlateSection sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <TextField
            fullWidth
            label={Locale.label("mobile.requests.eventTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="request-title"
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={Locale.label("mobile.requests.description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: allDay ? "1fr 1fr" : "1fr", sm: "1fr 1fr" }, gap: "12px" }}>
            <TextField
              label={Locale.label("mobile.requests.start")}
              type={allDay ? "date" : "datetime-local"}
              slotProps={{ inputLabel: { shrink: true } }}
              value={allDay ? start.slice(0, 10) : start}
              onChange={(e) => setStart(allDay ? `${e.target.value}T00:00` : e.target.value)}
            />
            <TextField
              label={Locale.label("mobile.requests.end")}
              type={allDay ? "date" : "datetime-local"}
              slotProps={{ inputLabel: { shrink: true } }}
              value={allDay ? end.slice(0, 10) : end}
              onChange={(e) => setEnd(allDay ? `${e.target.value}T23:59` : e.target.value)}
            />
          </Box>
          {switchRow(Locale.label("mobile.requests.allDay"), allDay, setAllDay)}
          <BookingPicker
            value={booking}
            onChange={setBooking}
            start={start}
            end={end}
            recurring={recurring}
            rRule={rRule}
            onData={handleData}
          />
          {switchRow(Locale.label("mobile.requests.recurring"), recurring, toggleRecurring)}
          {recurring && (
            <Grid container spacing={1}>
              <RRuleEditor start={rruleStartDate} rRule={rRule || ""} onChange={(next: string) => setRRule(next)} />
            </Grid>
          )}
          {error && <Typography sx={{ color: tc.error, fontSize: 14 }}>{error}</Typography>}
        </PlateSection>
      </Plate>
      <Box sx={{ px: { xs: "12px", md: 0 }, pt: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <Button fullWidth variant="contained" onClick={submit} disabled={saving || !title.trim()} data-testid="request-submit">
          {saving ? Locale.label("mobile.requests.submitting") : Locale.label("mobile.requests.submit")}
        </Button>
        <Button fullWidth variant="outlined" onClick={() => navigateBack(router, "/mobile/myRequests")}>{Locale.label("common.cancel")}</Button>
      </Box>
    </Box>
  );
};

export default RequestEventPage;
