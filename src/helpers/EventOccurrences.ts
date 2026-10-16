import { EventHelper } from "@churchapps/helpers";
import type { EventInterface } from "@churchapps/helpers";

export interface Occurrence { event: EventInterface; start: Date; end: Date; }

// Expands recurring events into concrete dates within [now, windowEnd]; call EventHelper.ensureInitialized() first.
export const buildOccurrences = (events: EventInterface[], now: Date, windowEnd: Date, perEvent = 5): Occurrence[] => {
  const result: Occurrence[] = [];
  for (const event of events) {
    if (!event.start) continue;
    const baseStart = new Date(event.start);
    if (isNaN(baseStart.getTime())) continue;
    const baseEnd = event.end ? new Date(event.end) : new Date(baseStart.getTime() + 60 * 60 * 1000);
    const durationMs = Math.max(0, baseEnd.getTime() - baseStart.getTime());

    if (event.recurrenceRule) {
      let dates: Date[] = [];
      try { dates = EventHelper.getRange(event, new Date(now.getTime() - durationMs), windowEnd) || []; } catch { dates = []; }
      const excluded = new Set((event.exceptionDates || []).map((d) => EventHelper.calendarDateKey(d)));
      for (const d of dates.filter((d) => !excluded.has(EventHelper.calendarDateKey(d))).slice(0, perEvent)) {
        result.push({ event, start: d, end: new Date(d.getTime() + durationMs) });
      }
    } else if (baseEnd >= now) {
      result.push({ event, start: baseStart, end: baseEnd });
    }
  }
  return result;
};

export const eventPageId = (event: EventInterface) => (event as any).realEventId || event.id || "";

const sameMeridiem = (a: string, b: string) => a.slice(-2) === b.slice(-2);

export const timeRange = (start: Date, end: Date, locale?: string) => {
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const from = start.toLocaleTimeString(locale, opts);
  const to = end.toLocaleTimeString(locale, opts);
  return (sameMeridiem(from, to) ? from.replace(/\s?[AP]M$/i, "") : from) + " – " + to;
};

export const firstLine = (markdown?: string) => (markdown || "")
  .split(/\r?\n/).map((l) => l.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*_`~]/g, "").trim())
  .find((l) => l.length > 0) || "";
