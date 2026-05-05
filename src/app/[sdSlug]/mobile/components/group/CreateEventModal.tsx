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
  Grid,
  Icon,
  IconButton,
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
      await ApiHelper.post("/events", [buildPayload()], "ContentApi");
      onSaved?.();
      onClose();
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
      onSaved?.();
      onClose();
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
    if (checked && !rRule) setRRule("FREQ=DAILY;INTERVAL=1");
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
