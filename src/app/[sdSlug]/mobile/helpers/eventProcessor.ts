import { EventHelper, type EventInterface } from "@churchapps/helpers";
import { RRule } from "rrule";

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const toFloatingUtc = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));

export class EventProcessor {
  static updateTime(data: any): EventInterface[] {
    if (!data || !Array.isArray(data)) return [];
    return data.map((d: EventInterface) => {
      const ev = { ...d };
      ev.start = ev.start ? new Date(ev.start) : new Date();
      ev.end = ev.end ? new Date(ev.end) : new Date();
      return ev;
    });
  }

  private static getRange(event: EventInterface, startDate: Date, endDate: Date): Date[] {
    try {
      const start = new Date(event.start!);
      const options = RRule.parseString(event.recurrenceRule!);
      options.dtstart = toFloatingUtc(start);
      const rule = new RRule(options);
      const dates = rule.between(toFloatingUtc(startDate), toFloatingUtc(endDate), true);
      return dates.map((d: Date) => new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), start.getHours(), start.getMinutes(), start.getSeconds()));
    } catch (e) {
      console.error("Error in getRange:", e);
      return [];
    }
  }

  static expandEventsForMonth(allEvents: EventInterface[], month: Date): EventInterface[] {
    if (!allEvents || allEvents.length === 0) return [];

    const startRange = startOfMonth(month);
    const endRange = endOfMonth(month);

    const relevantEvents = allEvents.filter((event) => {
      if (!event.start) return false;
      const eventStart = new Date(event.start);

      if (event.recurrenceRule) {
        if (eventStart > endRange) return false;
        const rule = event.recurrenceRule.toUpperCase();
        if (rule.includes("UNTIL=")) {
          const untilMatch = rule.match(/UNTIL=(\d{8}T?\d{6}Z?)/);
          if (untilMatch) {
            const untilDate = new Date(
              untilMatch[1].replace(/(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?Z?/, "$1-$2-$3T$4:$5:$6Z")
            );
            if (untilDate < startRange) return false;
          }
        }
        return true;
      }
      return eventStart >= startRange && eventStart <= endRange;
    });

    const expandedEvents: EventInterface[] = [];

    for (const event of relevantEvents) {
      try {
        if (event.recurrenceRule) {
          const dates = this.getRange(event, startRange, endRange);

          const limitedDates = dates.slice(0, 31);
          const eventDuration = new Date(event.end!).getTime() - new Date(event.start!).getTime();
          limitedDates.forEach((date: Date) => {
            expandedEvents.push({
              ...event,
              start: date,
              end: new Date(date.getTime() + eventDuration)
            });
          });
        } else {
          expandedEvents.push({
            ...event,
            start: new Date(event.start!),
            end: new Date(event.end!)
          });
        }
      } catch {
        // skip malformed event
      }
    }

    if (expandedEvents.length > 0) {
      try {
        EventHelper.removeExcludeDates(expandedEvents);
      } catch {
        // continue without exclude-date pruning
      }
    }

    return expandedEvents;
  }
}
