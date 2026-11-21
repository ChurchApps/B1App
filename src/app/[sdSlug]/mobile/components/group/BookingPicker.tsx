"use client";

import React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  ListItemText,
  MenuItem,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";

export interface BookingSelection {
  roomIds: string[];
  resourceIds: string[];
  setupMinutes: string;
  teardownMinutes: string;
  customWindow: boolean;
  windowStart: string;
  windowEnd: string;
}

// A row from /eventBookings: one room or resource reserved for an event.
export interface EventBookingInterface {
  id?: string;
  eventId?: string;
  roomId?: string;
  resourceId?: string;
  quantity?: number;
  setupMinutes?: number;
  teardownMinutes?: number;
  startTime?: Date;
  endTime?: Date;
  status?: string;
}

export const emptyBookingSelection = (): BookingSelection => ({
  roomIds: [],
  resourceIds: [],
  setupMinutes: "",
  teardownMinutes: "",
  customWindow: false,
  windowStart: "",
  windowEnd: ""
});

interface Props {
  value: BookingSelection;
  onChange: (next: BookingSelection) => void;
  start: string;
  end: string;
  recurring?: boolean;
  rRule?: string;
  eventId?: string;
  // Reports whether any rooms or resources exist for this church.
  onLoaded?: (hasAny: boolean) => void;
  // Hands the loaded lists up so a parent can resolve names without a second fetch.
  onData?: (rooms: { id?: string; name?: string }[], resources: { id?: string; name?: string }[]) => void;
}

const toInt = (v: string) => (v.trim() ? parseInt(v, 10) || 0 : 0);

// Joins the non-empty parts of a picker item's second line (seats or quantity, description).
const secondaryLine = (parts: (string | undefined)[]) => parts.filter(Boolean).join(" · ") || undefined;

export const BookingPicker = ({ value, onChange, start, end, recurring, rRule, eventId, onLoaded, onData }: Props) => {
  const tc = mobileTheme.colors;
  const [rooms, setRooms] = React.useState<{ id?: string; name?: string; capacity?: number; description?: string; active?: boolean }[]>([]);
  const [resources, setResources] = React.useState<{ id?: string; name?: string; quantity?: number; description?: string; active?: boolean }[]>([]);
  const [conflicts, setConflicts] = React.useState<{ message?: string }[]>([]);

  const { roomIds, resourceIds, setupMinutes, teardownMinutes, customWindow, windowStart, windowEnd } = value;
  const hasBookings = roomIds.length > 0 || resourceIds.length > 0;
  // Inactive rooms and resources leave the pickers, but stay listed while this event still books them.
  const pickableRooms = rooms.filter((r) => r.active !== false || roomIds.includes(r.id!));
  const pickableResources = resources.filter((r) => r.active !== false || resourceIds.includes(r.id!));

  const patch = (p: Partial<BookingSelection>) => onChange({ ...value, ...p });

  React.useEffect(() => {
    let active = true;
    Promise.all([
      ApiHelper.get("/rooms", "ContentApi").catch((): unknown[] => []),
      ApiHelper.get("/resources", "ContentApi").catch((): unknown[] => [])
    ]).then(([r, res]) => {
      if (!active) return;
      const roomList: { id?: string; name?: string; capacity?: number; description?: string; active?: boolean }[] = Array.isArray(r) ? r : [];
      const resList: { id?: string; name?: string; quantity?: number; description?: string; active?: boolean }[] = Array.isArray(res) ? res : [];
      setRooms(roomList);
      setResources(resList);
      onLoaded?.(roomList.some((x) => x.active !== false) || resList.some((x) => x.active !== false));
      onData?.(roomList, resList);
    });
    return () => { active = false; };
    // onLoaded intentionally excluded — parent callbacks are stable enough and re-running would refetch.

  }, []);

  React.useEffect(() => {
    if (!start || !end || (roomIds.length === 0 && resourceIds.length === 0)) {
      setConflicts([]);
      return;
    }
    const t = setTimeout(() => {
      ApiHelper.post("/events/conflicts", {
        eventId,
        start: new Date(start),
        end: new Date(end),
        recurrenceRule: recurring ? rRule : undefined,
        setupMinutes: toInt(setupMinutes),
        teardownMinutes: toInt(teardownMinutes),
        startTime: customWindow && windowStart ? new Date(windowStart) : undefined,
        endTime: customWindow && windowEnd ? new Date(windowEnd) : undefined,
        roomIds,
        resources: resourceIds.map((id) => ({ resourceId: id, quantity: 1 }))
      }, "ContentApi").then((c) => setConflicts(Array.isArray(c) ? c : [])).catch(() => setConflicts([]));
    }, 400);
    return () => clearTimeout(t);
  }, [
    start, end, recurring, rRule, roomIds, resourceIds, eventId, setupMinutes, teardownMinutes, customWindow, windowStart, windowEnd
  ]);

  const toggleCustomWindow = (on: boolean) => {
    patch({ customWindow: on, windowStart: on ? (windowStart || start) : windowStart, windowEnd: on ? (windowEnd || end) : windowEnd });
  };

  if (pickableRooms.length === 0 && pickableResources.length === 0) return null;

  return (
    <>
      {pickableRooms.length > 0 && (
        <TextField
          select
          size="small"
          label={Locale.label("mobile.group.rooms")}
          value={roomIds}
          onChange={(e) => patch({ roomIds: e.target.value as unknown as string[] })}
          SelectProps={{ multiple: true, renderValue: (selected: unknown) => rooms.filter((r) => (selected as string[]).includes(r.id as string)).map((r) => r.name).join(", ") }}
          data-testid="booking-rooms"
        >
          {pickableRooms.map((r) => (
            <MenuItem key={r.id} value={r.id} sx={{ whiteSpace: "normal" }}>
              <Checkbox checked={roomIds.includes(r.id!)} size="small" />
              <ListItemText
                primary={r.name}
                secondary={secondaryLine([r.capacity ? Locale.label("mobile.group.seats").replace("{}", String(r.capacity)) : undefined, r.description])}
              />
            </MenuItem>
          ))}
        </TextField>
      )}
      {pickableResources.length > 0 && (
        <TextField
          select
          size="small"
          label={Locale.label("mobile.group.resources")}
          value={resourceIds}
          onChange={(e) => patch({ resourceIds: e.target.value as unknown as string[] })}
          SelectProps={{ multiple: true, renderValue: (selected: unknown) => resources.filter((r) => (selected as string[]).includes(r.id as string)).map((r) => r.name).join(", ") }}
          data-testid="booking-resources"
        >
          {pickableResources.map((r) => (
            <MenuItem key={r.id} value={r.id} sx={{ whiteSpace: "normal" }}>
              <Checkbox checked={resourceIds.includes(r.id!)} size="small" />
              <ListItemText
                primary={r.name}
                secondary={secondaryLine([r.quantity && r.quantity > 1 ? Locale.label("mobile.group.available").replace("{}", String(r.quantity)) : undefined, r.description])}
              />
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
                onChange={(e) => patch({ setupMinutes: e.target.value })}
                inputProps={{ min: 0 }}
                sx={{ flex: 1, minWidth: 160 }}
              />
              <TextField
                size="small"
                type="number"
                label={Locale.label("mobile.group.teardownMinutes")}
                value={teardownMinutes}
                onChange={(e) => patch({ teardownMinutes: e.target.value })}
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
                onChange={(e) => patch({ windowStart: e.target.value })}
                sx={{ flex: 1, minWidth: 160 }}
              />
              <TextField
                size="small"
                type="datetime-local"
                label={Locale.label("mobile.group.reserveUntil")}
                InputLabelProps={{ shrink: true }}
                value={windowEnd}
                onChange={(e) => patch({ windowEnd: e.target.value })}
                sx={{ flex: 1, minWidth: 160 }}
              />
            </Box>
          )}
        </>
      )}
      {conflicts.length > 0 && (
        <Typography sx={{ color: tc.error, fontSize: 13 }} data-testid="booking-conflict">{Locale.label("mobile.group.bookingConflictWarning")}</Typography>
      )}
    </>
  );
};

// Diff a booking selection against existing event bookings: returns the payloads to POST and the rows to DELETE.
export const diffBookings = (
  eventId: string,
  selection: BookingSelection,
  existing: EventBookingInterface[]
): { toAdd: EventBookingInterface[]; toRemove: EventBookingInterface[] } => {
  const existingRoomIds = existing.filter((b) => b.roomId).map((b) => b.roomId);
  const existingResourceIds = existing.filter((b) => b.resourceId).map((b) => b.resourceId);
  const win = selection.customWindow && selection.windowStart && selection.windowEnd
    ? { startTime: new Date(selection.windowStart), endTime: new Date(selection.windowEnd) }
    : { setupMinutes: toInt(selection.setupMinutes) || undefined, teardownMinutes: toInt(selection.teardownMinutes) || undefined };
  const toAdd = [
    ...selection.roomIds.filter((id) => !existingRoomIds.includes(id)).map((roomId) => ({ eventId, roomId, ...win })),
    ...selection.resourceIds.filter((id) => !existingResourceIds.includes(id)).map((resourceId) => ({ eventId, resourceId, quantity: 1, ...win }))
  ];
  const toRemove = existing.filter((b) => (b.roomId && !selection.roomIds.includes(b.roomId)) || (b.resourceId && !selection.resourceIds.includes(b.resourceId)));
  return { toAdd, toRemove };
};

export default BookingPicker;
