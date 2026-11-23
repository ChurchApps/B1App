"use client";

import React from "react";
import { Box } from "@mui/material";
import { rotateWeekdays, weekdayColumn } from "@/helpers/firstDayOfWeek";
import { mobileTheme } from "./mobileTheme";

const tc = mobileTheme.colors;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

interface Props {
  month: Date;
  eventDays: Record<string, unknown[]>;
  selected: string;
  onSelect: (key: string) => void;
  firstDayOfWeek?: number;
}

// Seven-column month grid with a dot on days that have events; shared by the group Events tab and Me → Upcoming.
export const MonthGrid = ({ month, eventDays, selected, onSelect, firstDayOfWeek = 0 }: Props) => {
  const firstWeekday = weekdayColumn(startOfMonth(month).getDay(), firstDayOfWeek);
  const daysInMonth = endOfMonth(month).getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(month.getFullYear(), month.getMonth(), d));
  const weekdayLabels = rotateWeekdays(["S", "M", "T", "W", "T", "F", "S"], firstDayOfWeek);
  const todayKey = isoDate(new Date());

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "4px", mt: "6px", textAlign: "center" }}>
      {weekdayLabels.map((w, i) => (
        <Box key={`wd-${i}`} data-testid={`weekday-${i}`} sx={{ height: 24, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", color: tc.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {w}
        </Box>
      ))}
      {days.map((d, i) => {
        if (!d) return <Box key={`e-${i}`} />;
        const key = isoDate(d);
        const isSelected = key === selected;
        const hasEvents = !!eventDays[key]?.length;
        return (
          <Box
            key={key}
            component="button"
            type="button"
            aria-pressed={isSelected}
            data-testid={`day-${key}`}
            onClick={() => onSelect(key)}
            sx={{
              height: 42,
              border: 0,
              borderRadius: "8px",
              font: "inherit",
              fontSize: 14,
              fontWeight: isSelected ? 650 : 400,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              bgcolor: isSelected ? tc.selected : "transparent",
              color: isSelected ? tc.onSelected : tc.text,
              boxShadow: key === todayKey && !isSelected ? `inset 0 0 0 1px ${tc.control}` : "none"
            }}
          >
            {d.getDate()}
            {hasEvents && <Box component="i" sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: tc.primary }} />}
          </Box>
        );
      })}
    </Box>
  );
};
