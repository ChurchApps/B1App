// church.firstDayOfWeek is the single church-level setting (0=Sunday .. 6=Saturday)
// applied to every calendar/week grid. See ChurchAppsSupport #985.

/** Coerces any raw value (number, numeric string, undefined) to a valid 0-6 day index, defaulting to Sunday. */
export const normalizeFirstDayOfWeek = (value: unknown): number => {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 6) return 0;
  return n;
};

/** Reads firstDayOfWeek off a church record; the field is not yet declared on ChurchInterface, so any object is accepted. */
export const getFirstDayOfWeek = (church?: object | null): number => normalizeFirstDayOfWeek((church as { firstDayOfWeek?: number | string } | undefined | null)?.firstDayOfWeek);

/** Grid column (0-6) a JS Date.getDay() value lands in when the week starts on firstDayOfWeek. */
export const weekdayColumn = (jsDay: number, firstDayOfWeek: number): number => (((jsDay % 7) + 7) % 7 - normalizeFirstDayOfWeek(firstDayOfWeek) + 7) % 7;

/** Rotates a Sunday-first list of weekday labels so it starts on firstDayOfWeek. */
export const rotateWeekdays = <T>(sundayFirstLabels: T[], firstDayOfWeek: number): T[] => {
  const start = normalizeFirstDayOfWeek(firstDayOfWeek);
  return [...sundayFirstLabels.slice(start), ...sundayFirstLabels.slice(0, start)];
};
