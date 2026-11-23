"use client";

import React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  ListItemText,
  ListSubheader,
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
  // How many of each ticked resource are requested; a missing key means 1.
  resourceQuantities: Record<string, number>;
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
  resourceQuantities: {},
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

type Categorized = { name?: string; categoryName?: string | null };

// Rooms and resources grouped by category (#1650): a heading per category A-Z, items sorted by name,
// uncategorized items last with no heading. With no categories at all the list renders unchanged.
// MUI Select needs flat children, so headings and items go into one array.
const categorizedOptions = <T extends Categorized>(items: T[], renderItem: (item: T) => React.ReactNode): React.ReactNode[] => {
  const category = (i: T) => i.categoryName?.trim() || "";
  if (!items.some((i) => category(i))) return items.map(renderItem);
  const result: React.ReactNode[] = [];
  const names = Array.from(new Set(items.map(category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  names.forEach((c) => {
    result.push(<ListSubheader key={"cat-" + c}>{c}</ListSubheader>);
    items.filter((i) => category(i) === c).sort((a, b) => (a.name || "").localeCompare(b.name || "")).forEach((i) => result.push(renderItem(i)));
  });
  items.filter((i) => !category(i)).forEach((i) => result.push(renderItem(i)));
  return result;
};

export const BookingPicker = ({ value, onChange, start, end, recurring, rRule, eventId, onLoaded, onData }: Props) => {
  const tc = mobileTheme.colors;
  const [rooms, setRooms] = React.useState<{ id?: string; name?: string; capacity?: number; description?: string; active?: boolean; categoryName?: string | null }[]>([]);
  const [resources, setResources] = React.useState<{ id?: string; name?: string; quantity?: number; description?: string; active?: boolean; categoryName?: string | null }[]>([]);
  // A quantity box the requester has cleared shows empty until they type a number or leave it.
  const [clearedQuantity, setClearedQuantity] = React.useState<string | null>(null);
  const [conflicts, setConflicts] = React.useState<{ message?: string }[]>([]);

  const { roomIds, resourceIds, setupMinutes, teardownMinutes, customWindow, windowStart, windowEnd } = value;
  const hasBookings = roomIds.length > 0 || resourceIds.length > 0;
  // Inactive rooms and resources leave the pickers, but stay listed while this event still books them.
  const pickableRooms = rooms.filter((r) => r.active !== false || roomIds.includes(r.id!));
  const pickableResources = resources.filter((r) => r.active !== false || resourceIds.includes(r.id!));

  const resourceQuantities = value.resourceQuantities || {};
  // Ticked resources with more than one unit get a quantity box below the picker.
  const pooledResources = resources.filter((r) => resourceIds.includes(r.id!) && (r.quantity || 0) > 1);

  const patch = (p: Partial<BookingSelection>) => onChange({ ...value, ...p });

  React.useEffect(() => {
    let active = true;
    Promise.all([
      ApiHelper.get("/rooms", "ContentApi").catch((): unknown[] => []),
      ApiHelper.get("/resources", "ContentApi").catch((): unknown[] => [])
    ]).then(([r, res]) => {
      if (!active) return;
      const roomList: { id?: string; name?: string; capacity?: number; description?: string; active?: boolean; categoryName?: string | null }[] = Array.isArray(r) ? r : [];
      const resList: { id?: string; name?: string; quantity?: number; description?: string; active?: boolean; categoryName?: string | null }[] = Array.isArray(res) ? res : [];
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
        resources: resourceIds.map((id) => ({ resourceId: id, quantity: resourceQuantities[id] ?? 1 }))
      }, "ContentApi").then((c) => setConflicts(Array.isArray(c) ? c : [])).catch(() => setConflicts([]));
    }, 400);
    return () => clearTimeout(t);
  }, [
    start, end, recurring, rRule, roomIds, resourceIds, resourceQuantities, eventId, setupMinutes, teardownMinutes, customWindow, windowStart, windowEnd
  ]);

  const changeResources = (ids: string[]) => {
    const quantities = Object.fromEntries(Object.entries(resourceQuantities).filter(([id]) => ids.includes(id)));
    patch({ resourceIds: ids, resourceQuantities: quantities });
  };

  const changeQuantity = (id: string, raw: string, max: number) => {
    setClearedQuantity(raw.trim() ? null : id);
    if (!raw.trim()) return;
    const n = parseInt(raw, 10);
    const qty = Math.min(Math.max(Number.isNaN(n) ? 1 : n, 1), max);
    patch({ resourceQuantities: { ...resourceQuantities, [id]: qty } });
  };

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
          {categorizedOptions(pickableRooms, (r) => (
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
          onChange={(e) => changeResources(e.target.value as unknown as string[])}
          SelectProps={{ multiple: true, renderValue: (selected: unknown) => resources.filter((r) => (selected as string[]).includes(r.id as string)).map((r) => r.name).join(", ") }}
          data-testid="booking-resources"
        >
          {categorizedOptions(pickableResources, (r) => (
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
      {pooledResources.map((r) => (
        <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography sx={{ flex: 1, fontSize: 14, color: tc.text }}>{r.name}</Typography>
          <TextField
            size="small"
            type="number"
            label={Locale.label("mobile.group.quantity")}
            value={clearedQuantity === r.id ? "" : resourceQuantities[r.id!] ?? 1}
            onChange={(e) => changeQuantity(r.id!, e.target.value, r.quantity!)}
            onBlur={() => setClearedQuantity(null)}
            inputProps={{ min: 1, max: r.quantity, "data-testid": "booking-resource-quantity-" + r.id }}
            helperText={Locale.label("mobile.group.available").replace("{}", String(r.quantity))}
            sx={{ width: 140 }}
          />
        </Box>
      ))}
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
  const quantityFor = (resourceId: string) => selection.resourceQuantities?.[resourceId] ?? 1;
  // A resource whose requested quantity changed is rebooked, so the new amount goes through approval again.
  const keptResourceIds = existing.filter((b) => b.resourceId && selection.resourceIds.includes(b.resourceId) && (b.quantity ?? 1) === quantityFor(b.resourceId)).map((b) => b.resourceId);
  const win = selection.customWindow && selection.windowStart && selection.windowEnd
    ? { startTime: new Date(selection.windowStart), endTime: new Date(selection.windowEnd) }
    : { setupMinutes: toInt(selection.setupMinutes) || undefined, teardownMinutes: toInt(selection.teardownMinutes) || undefined };
  const toAdd = [
    ...selection.roomIds.filter((id) => !existingRoomIds.includes(id)).map((roomId) => ({ eventId, roomId, ...win })),
    ...selection.resourceIds.filter((id) => !keptResourceIds.includes(id)).map((resourceId) => ({ eventId, resourceId, quantity: quantityFor(resourceId), ...win }))
  ];
  const toRemove = existing.filter((b) => (b.roomId && !selection.roomIds.includes(b.roomId)) || (b.resourceId && !keptResourceIds.includes(b.resourceId)));
  return { toAdd, toRemove };
};

export default BookingPicker;
