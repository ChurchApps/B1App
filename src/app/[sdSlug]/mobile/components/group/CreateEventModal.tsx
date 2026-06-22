"use client";

import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Icon,
  IconButton,
  ListItemText,
  MenuItem,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, EventHelper, Locale } from "@churchapps/apphelper";
import type { EventExceptionInterface, EventInterface } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";
import { RRuleEditor } from "../../../../../components/eventCalendar/RRuleEditor";
import { EditRecurringModal } from "../../../../../components/eventCalendar/EditRecurringModal";
import { MarkdownEditor } from "@churchapps/apphelper/markdown";

interface Props {
  open: boolean;
  groupId: string;
  initialDateIso?: string;

  event?: EventInterface | null;
  onClose: () => void;
  onSaved?: () => void;
}

const toLocal = (iso: string | Date) => {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
};

const localToIsoString = (localValue: string) => {

  if (!localValue) return "";
  const d = new Date(localValue);
  return isNaN(d.getTime()) ? "" : d.toISOString();
};

export const CreateEventModal = ({ open, groupId, initialDateIso, event: eventProp, onClose, onSaved }: Props) => {
  const tc = mobileTheme.colors;
  const isEdit = !!eventProp?.id;

  const computeDefaults = React.useCallback(() => {
    if (eventProp?.id) {
      return {
        title: eventProp.title || "",
        description: eventProp.description || "",
        start: toLocal(eventProp.start || new Date()),
        end: toLocal(eventProp.end || new Date()),
        allDay: eventProp.allDay ?? false,
        visibility: eventProp.visibility || "public",
        recurrenceRule: eventProp.recurrenceRule || "",
        registrationEnabled: eventProp.registrationEnabled ?? false,
        capacity: eventProp.capacity != null ? String(eventProp.capacity) : "",
        registrationOpenDate: eventProp.registrationOpenDate ? toLocal(eventProp.registrationOpenDate) : "",
        registrationCloseDate: eventProp.registrationCloseDate ? toLocal(eventProp.registrationCloseDate) : "",
        tags: eventProp.tags || ""
      };
    }
    const base = initialDateIso ? new Date(initialDateIso) : new Date();
    const endBase = new Date(base);
    endBase.setHours(endBase.getHours() + 1);
    return {
      title: "",
      description: "",
      start: toLocal(base),
      end: toLocal(endBase),
      allDay: false,
      visibility: "public",
      recurrenceRule: "",
      registrationEnabled: false,
      capacity: "",
      registrationOpenDate: "",
      registrationCloseDate: "",
      tags: ""
    };
  }, [eventProp, initialDateIso]);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [allDay, setAllDay] = React.useState(false);
  const [visibility, setVisibility] = React.useState("public");
  const [recurring, setRecurring] = React.useState(false);
  const [rRule, setRRule] = React.useState("");
  const [registrationEnabled, setRegistrationEnabled] = React.useState(false);
  const [capacity, setCapacity] = React.useState("");
  const [registrationOpenDate, setRegistrationOpenDate] = React.useState("");
  const [registrationCloseDate, setRegistrationCloseDate] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recurrenceModalType, setRecurrenceModalType] = React.useState<"save" | "delete" | "">("");
  const [rooms, setRooms] = React.useState<{ id?: string; name?: string; capacity?: number }[]>([]);
  const [resources, setResources] = React.useState<{ id?: string; name?: string }[]>([]);
  const [roomIds, setRoomIds] = React.useState<string[]>([]);
  const [resourceIds, setResourceIds] = React.useState<string[]>([]);
  const [conflicts, setConflicts] = React.useState<{ message?: string }[]>([]);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [setupMinutes, setSetupMinutes] = React.useState("");
  const [teardownMinutes, setTeardownMinutes] = React.useState("");
  const [customWindow, setCustomWindow] = React.useState(false);
  const [windowStart, setWindowStart] = React.useState("");
  const [windowEnd, setWindowEnd] = React.useState("");

  const hasBookings = roomIds.length > 0 || resourceIds.length > 0;
  const toInt = (v: string) => (v.trim() ? parseInt(v, 10) || 0 : 0);

  const toggleCustomWindow = (on: boolean) => {
    setCustomWindow(on);
    if (on) {
      setWindowStart((w) => w || start);
      setWindowEnd((w) => w || end);
    }
  };

  React.useEffect(() => {
    if (open) {
      const d = computeDefaults();
      setTitle(d.title);
      setDescription(d.description);
      setStart(d.start);
      setEnd(d.end);
      setAllDay(d.allDay);
      setVisibility(d.visibility);
      setRecurrenceModalType("");
      setError(null);
      const hasRule = (d.recurrenceRule?.length ?? 0) > 0;
      setRecurring(hasRule);
      setRRule(d.recurrenceRule || "");
      setRegistrationEnabled(d.registrationEnabled);
      setCapacity(d.capacity);
      setRegistrationOpenDate(d.registrationOpenDate);
      setRegistrationCloseDate(d.registrationCloseDate);
      setTags(d.tags);
    }
  }, [open, computeDefaults]);

  React.useEffect(() => {
    if (!open) return;
    setNotice(null);
    setSetupMinutes("");
    setTeardownMinutes("");
    setCustomWindow(false);
    setWindowStart("");
    setWindowEnd("");
    ApiHelper.get("/rooms", "ContentApi").then((r) => setRooms(r || [])).catch(() => setRooms([]));
    ApiHelper.get("/resources", "ContentApi").then((r) => setResources(r || [])).catch(() => setResources([]));
    if (eventProp?.id) {
      ApiHelper.get("/eventBookings/event/" + eventProp.id, "ContentApi").then((bk: any[]) => {
        setRoomIds((bk || []).filter((b) => b.roomId).map((b) => b.roomId));
        setResourceIds((bk || []).filter((b) => b.resourceId).map((b) => b.resourceId));
      }).catch(() => {});
    } else {
      setRoomIds([]);
      setResourceIds([]);
    }
  }, [open, eventProp]);

  React.useEffect(() => {
    if (!open || !start || !end || (roomIds.length === 0 && resourceIds.length === 0)) {
      setConflicts([]);
      return;
    }
    const t = setTimeout(() => {
      ApiHelper.post("/events/conflicts", {
        eventId: eventProp?.id,
        start: new Date(start),
        end: new Date(end),
        recurrenceRule: recurring ? rRule : undefined,
        setupMinutes: toInt(setupMinutes),
        teardownMinutes: toInt(teardownMinutes),
        startTime: customWindow && windowStart ? new Date(windowStart) : undefined,
        endTime: customWindow && windowEnd ? new Date(windowEnd) : undefined,
        roomIds,
        resources: resourceIds.map((id) => ({ resourceId: id, quantity: 1 }))
      }, "ContentApi").then((c) => setConflicts(c || [])).catch(() => setConflicts([]));
    }, 400);
    return () => clearTimeout(t);
  }, [
    open, start, end, recurring, rRule, roomIds, resourceIds, eventProp, setupMinutes, teardownMinutes, customWindow, windowStart, windowEnd
  ]);

  // Diff selected rooms/resources against existing bookings: POST new, DELETE removed.
  const syncBookings = async (eventId: string): Promise<any[]> => {
    if (!eventId) return [];
    const existing: any[] = eventProp?.id ? await ApiHelper.get("/eventBookings/event/" + eventId, "ContentApi").catch((): any[] => []) : [];
    const existingRoomIds = existing.filter((b) => b.roomId).map((b) => b.roomId);
    const existingResourceIds = existing.filter((b) => b.resourceId).map((b) => b.resourceId);
    // ponytail: window applies to newly added bookings; changing only the window of an already-booked room won't re-save.
    const win = customWindow && windowStart && windowEnd
      ? { startTime: new Date(windowStart), endTime: new Date(windowEnd) }
      : { setupMinutes: toInt(setupMinutes) || undefined, teardownMinutes: toInt(teardownMinutes) || undefined };
    const toAdd = [
      ...roomIds.filter((id) => !existingRoomIds.includes(id)).map((roomId) => ({ eventId, roomId, ...win })),
      ...resourceIds.filter((id) => !existingResourceIds.includes(id)).map((resourceId) => ({ eventId, resourceId, quantity: 1, ...win }))
    ];
    const toRemove = existing.filter((b) => (b.roomId && !roomIds.includes(b.roomId)) || (b.resourceId && !resourceIds.includes(b.resourceId)));
    let saved: any[] = [];
    if (toAdd.length) saved = await ApiHelper.post("/eventBookings", toAdd, "ContentApi");
    for (const b of toRemove) await ApiHelper.delete("/eventBookings/" + b.id, "ContentApi");
    return saved;
  };

  // Tells the member the outcome and only closes if nothing is left pending.
  const finishBookings = (saved: any[]) => {
    onSaved?.();
    if ((saved || []).some((b) => b.status === "pending")) setNotice(Locale.label("mobile.group.bookingPending"));
    else onClose();
  };

  const buildPayload = (): EventInterface => {
    const parsedCapacity = capacity.trim() ? parseInt(capacity, 10) : undefined;
    const payload: EventInterface = {
      ...(eventProp || {}),
      groupId: eventProp?.groupId || groupId,
      title: title.trim(),
      description: description.trim() || undefined,
      start: localToIsoString(allDay ? `${start.slice(0, 10)}T00:00` : start) as unknown as Date,
      end: localToIsoString(allDay ? `${end.slice(0, 10)}T23:59` : end) as unknown as Date,
      allDay,
      visibility,
      recurrenceRule: recurring ? rRule : "",
      registrationEnabled,
      capacity: registrationEnabled ? (Number.isNaN(parsedCapacity as number) ? undefined : parsedCapacity) : undefined,
      registrationOpenDate: registrationEnabled && registrationOpenDate ? (localToIsoString(registrationOpenDate) as unknown as Date) : undefined,
      registrationCloseDate: registrationEnabled && registrationCloseDate ? (localToIsoString(registrationCloseDate) as unknown as Date) : undefined,
      tags: registrationEnabled ? (tags.trim() || undefined) : undefined
    };
    return payload;
  };

  const validate = () => {
    if (!title.trim()) {
      setError(Locale.label("mobile.group.enterTitle"));
      return false;
    }
    return true;
  };

  const doCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await ApiHelper.post("/events", [buildPayload()], "ContentApi");
      const bookings = await syncBookings(saved?.[0]?.id);
      finishBookings(bookings);
    } catch (e: any) {
      setError(e?.message || Locale.label("mobile.group.failedToSaveEvent"));
    } finally {
      setSaving(false);
    }
  };

  const doEditNonRecurring = async () => {
    setSaving(true);
    setError(null);
    try {
      await ApiHelper.post("/events", [buildPayload()], "ContentApi");
      const bookings = await syncBookings(eventProp!.id);
      finishBookings(bookings);
    } catch (e: any) {
      setError(e?.message || Locale.label("mobile.group.failedToSaveEvent"));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!validate()) return;
    if (isEdit && eventProp?.recurrenceRule) {

      setRecurrenceModalType("save");
      return;
    }
    if (isEdit) {
      doEditNonRecurring();
    } else {
      doCreate();
    }
  };

  const handleDelete = async () => {
    if (!eventProp?.id) return;
    if (eventProp.recurrenceRule) {
      setRecurrenceModalType("delete");
      return;
    }
    if (!confirm(Locale.label("mobile.group.confirmDeleteEvent"))) return;
    setSaving(true);
    try {
      await ApiHelper.delete("/events/" + eventProp.id, "ContentApi");
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || Locale.label("mobile.group.failedToDeleteEvent"));
    } finally {
      setSaving(false);
    }
  };

  const handleRecurringSave = async (editType: string) => {
    if (!eventProp?.id) { setRecurrenceModalType(""); return; }
    setSaving(true);
    try {
      const ev = buildPayload();
      switch (editType) {
        case "this": {
          const exception: EventExceptionInterface = { eventId: eventProp.id, exceptionDate: eventProp.start };
          await ApiHelper.post("/eventExceptions", [exception], "ContentApi");
          const oneEv: EventInterface = { ...ev, id: undefined as any, recurrenceRule: "" };
          await ApiHelper.post("/events", [oneEv], "ContentApi");
          break;
        }
        case "future": {
          const newEvent: EventInterface = { ...ev, id: undefined as any, recurrenceRule: recurring ? rRule : "" };
          const originalEv: EventInterface = await ApiHelper.get("/events/" + eventProp.id, "ContentApi");
          const rrule = EventHelper.getFullRRule(originalEv);
          rrule.options.until = newEvent.start ? new Date(newEvent.start as any) : new Date();
          EventHelper.cleanRule(rrule.options);
          originalEv.recurrenceRule = EventHelper.getPartialRRuleString(rrule.options);
          await ApiHelper.post("/events", [originalEv, newEvent], "ContentApi");
          break;
        }
        case "all": {
          const allEv: EventInterface = { ...ev, recurrenceRule: recurring ? rRule : "" };
          await ApiHelper.post("/events", [allEv], "ContentApi");
          await syncBookings(eventProp.id);
          break;
        }
        // ponytail: "this"/"future" spawn new event rows; bookings stay on the original series only.
        default:
          setRecurrenceModalType("");
          setSaving(false);
          return;
      }
      setRecurrenceModalType("");
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || Locale.label("mobile.group.failedToSaveEvent"));
    } finally {
      setSaving(false);
    }
  };

  const handleRecurringDelete = async (editType: string) => {
    if (!eventProp?.id) { setRecurrenceModalType(""); return; }
    setSaving(true);
    try {
      switch (editType) {
        case "this": {
          const exception: EventExceptionInterface = { eventId: eventProp.id, exceptionDate: eventProp.start };
          await ApiHelper.post("/eventExceptions", [exception], "ContentApi");
          break;
        }
        case "future": {
          const ev: EventInterface = { ...eventProp };
          const rrule = EventHelper.getFullRRule(ev);
          rrule.options.until = ev.start ? new Date(ev.start as any) : new Date();
          ev.start = eventProp.start;
          ev.recurrenceRule = EventHelper.getPartialRRuleString(rrule.options);
          await ApiHelper.post("/events", [ev], "ContentApi");
          break;
        }
        case "all": {
          await ApiHelper.delete("/events/" + eventProp.id, "ContentApi");
          break;
        }
        default:
          setRecurrenceModalType("");
          setSaving(false);
          return;
      }
      setRecurrenceModalType("");
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || Locale.label("mobile.group.failedToDeleteEvent"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRecurring = (checked: boolean) => {
    setRecurring(checked);
    if (checked && !rRule) setRRule("FREQ=WEEKLY;INTERVAL=1");
    if (!checked) setRRule("");
  };

  const rruleStartDate = React.useMemo(() => {
    const d = new Date(start);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [start]);

  return (
    <>
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
            pb: 1
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>
            {isEdit ? Locale.label("mobile.group.editEvent") : Locale.label("mobile.group.newEvent")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isEdit && (
              <IconButton
                onClick={handleDelete}
                aria-label={Locale.label("mobile.group.deleteEvent")}
                disabled={saving}
                sx={{ color: tc.error }}
              >
                <Icon>delete</Icon>
              </IconButton>
            )}
            <IconButton onClick={onClose} aria-label={Locale.label("mobile.components.close")} sx={{ color: tc.text }}>
              <Icon>close</Icon>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            label={Locale.label("mobile.group.title")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <MarkdownEditor
            value={description}
            onChange={(val) => setDescription(val)}
            style={{ maxHeight: 200, overflowY: "scroll" }}
          />
          <FormControlLabel
            control={<Switch checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />}
            label={Locale.label("mobile.group.allDay")}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <TextField
              size="small"
              label={Locale.label("mobile.group.start")}
              type={allDay ? "date" : "datetime-local"}
              InputLabelProps={{ shrink: true }}
              value={allDay ? start.slice(0, 10) : start}
              onChange={(e) => setStart(allDay ? `${e.target.value}T00:00` : e.target.value)}
              sx={{ flex: 1, minWidth: 160 }}
            />
            <TextField
              size="small"
              label={Locale.label("mobile.group.end")}
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
            label={Locale.label("mobile.group.visibility")}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <MenuItem value="public">{Locale.label("mobile.group.public")}</MenuItem>
            <MenuItem value="private">{Locale.label("mobile.group.membersOnly")}</MenuItem>
          </TextField>
          {rooms.length > 0 && (
            <TextField
              select
              size="small"
              label={Locale.label("mobile.group.rooms")}
              value={roomIds}
              onChange={(e) => setRoomIds(e.target.value as unknown as string[])}
              SelectProps={{ multiple: true, renderValue: (selected: any) => rooms.filter((r) => selected.includes(r.id)).map((r) => r.name).join(", ") }}
            >
              {rooms.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  <Checkbox checked={roomIds.includes(r.id!)} size="small" />
                  <ListItemText primary={r.name} secondary={r.capacity ? `${r.capacity}` : undefined} />
                </MenuItem>
              ))}
            </TextField>
          )}
          {resources.length > 0 && (
            <TextField
              select
              size="small"
              label={Locale.label("mobile.group.resources")}
              value={resourceIds}
              onChange={(e) => setResourceIds(e.target.value as unknown as string[])}
              SelectProps={{ multiple: true, renderValue: (selected: any) => resources.filter((r) => selected.includes(r.id)).map((r) => r.name).join(", ") }}
            >
              {resources.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  <Checkbox checked={resourceIds.includes(r.id!)} size="small" />
                  <ListItemText primary={r.name} />
                </MenuItem>
              ))}
            </TextField>
          )}
          {hasBookings && (
            <>
              {!customWindow && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <TextField
                    size="small"
                    type="number"
                    label={Locale.label("mobile.group.setupMinutes")}
                    value={setupMinutes}
                    onChange={(e) => setSetupMinutes(e.target.value)}
                    inputProps={{ min: 0 }}
                    sx={{ flex: 1, minWidth: 160 }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label={Locale.label("mobile.group.teardownMinutes")}
                    value={teardownMinutes}
                    onChange={(e) => setTeardownMinutes(e.target.value)}
                    inputProps={{ min: 0 }}
                    sx={{ flex: 1, minWidth: 160 }}
                  />
                </Box>
              )}
              <FormControlLabel
                control={<Switch checked={customWindow} onChange={(e) => toggleCustomWindow(e.target.checked)} />}
                label={Locale.label("mobile.group.customWindow")}
              />
              {customWindow && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <TextField
                    size="small"
                    type="datetime-local"
                    label={Locale.label("mobile.group.reserveFrom")}
                    InputLabelProps={{ shrink: true }}
                    value={windowStart}
                    onChange={(e) => setWindowStart(e.target.value)}
                    sx={{ flex: 1, minWidth: 160 }}
                  />
                  <TextField
                    size="small"
                    type="datetime-local"
                    label={Locale.label("mobile.group.reserveUntil")}
                    InputLabelProps={{ shrink: true }}
                    value={windowEnd}
                    onChange={(e) => setWindowEnd(e.target.value)}
                    sx={{ flex: 1, minWidth: 160 }}
                  />
                </Box>
              )}
            </>
          )}
          {conflicts.length > 0 && (
            <Typography sx={{ color: tc.error, fontSize: 13 }}>{Locale.label("mobile.group.bookingConflictWarning")}</Typography>
          )}
          {notice && <Typography sx={{ color: tc.primary, fontSize: 13 }}>{notice}</Typography>}
          <FormControlLabel
            control={<Switch checked={recurring} onChange={(e) => handleToggleRecurring(e.target.checked)} />}
            label={Locale.label("mobile.group.recurring")}
          />
          {recurring && (
            <Grid container spacing={1} sx={{ pt: 1 }}>
              <RRuleEditor
                start={rruleStartDate}
                rRule={rRule || ""}
                onChange={(next: string) => setRRule(next)}
              />
            </Grid>
          )}
          <FormControlLabel
            control={<Switch checked={registrationEnabled} onChange={(e) => setRegistrationEnabled(e.target.checked)} />}
            label={Locale.label("mobile.group.registration")}
          />
          {registrationEnabled && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  type="number"
                  label={Locale.label("mobile.group.capacity")}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  sx={{ flex: 1, minWidth: 160 }}
                />
                <TextField
                  size="small"
                  label={Locale.label("mobile.group.tags")}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  sx={{ flex: 1, minWidth: 160 }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  type="datetime-local"
                  label={Locale.label("mobile.group.registrationOpens")}
                  InputLabelProps={{ shrink: true }}
                  value={registrationOpenDate}
                  onChange={(e) => setRegistrationOpenDate(e.target.value)}
                  sx={{ flex: 1, minWidth: 160 }}
                />
                <TextField
                  size="small"
                  type="datetime-local"
                  label={Locale.label("mobile.group.registrationCloses")}
                  InputLabelProps={{ shrink: true }}
                  value={registrationCloseDate}
                  onChange={(e) => setRegistrationCloseDate(e.target.value)}
                  sx={{ flex: 1, minWidth: 160 }}
                />
              </Box>
            </Box>
          )}
          {error && <Typography sx={{ color: tc.error, fontSize: 13 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: "none", color: tc.text }}>
            {Locale.label("mobile.group.cancel")}
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
              "&:hover": { bgcolor: tc.primary }
            }}
          >
            {saving ? Locale.label("mobile.group.saving") : isEdit ? Locale.label("mobile.group.saveChanges") : Locale.label("mobile.group.save")}
          </Button>
        </DialogActions>
      </Dialog>
      {recurrenceModalType && (
        <EditRecurringModal
          action={recurrenceModalType}
          onDone={(editType) => {
            if (editType === "none") {
              setRecurrenceModalType("");
              return;
            }
            if (recurrenceModalType === "delete") handleRecurringDelete(editType);
            else handleRecurringSave(editType);
          }}
        />
      )}
    </>
  );
};

export default CreateEventModal;
