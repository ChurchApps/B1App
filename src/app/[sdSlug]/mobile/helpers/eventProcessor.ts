import { EventHelper, type EventInterface } from "@churchapps/helpers";

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

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

  static expandEventsForMonth(allEvents: EventInterface[], month: Date): EventInterface[] {
    if (!allEvents || allEvents.length === 0) return [];

    const startRange = startOfMonth(month);
    const endRange = endOfMonth(month);
    const targetMonth = month.getMonth();
    const targetYear = month.getFullYear();

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
        if (rule.includes("FREQ=WEEKLY")) {
          const monthsBack = (targetYear - eventStart.getFullYear()) * 12 + (targetMonth - eventStart.getMonth());
          if (monthsBack > 12) return false;
        }
        if (rule.includes("FREQ=DAILY")) {
          const daysBack = Math.floor((startRange.getTime() - eventStart.getTime()) / (24 * 60 * 60 * 1000));
          if (daysBack > 365) return false;
        }
        return true;
      }
      return eventStart >= startRange && eventStart <= endRange;
    });

    const expandedEvents: EventInterface[] = [];

    for (const event of relevantEvents) {
      try {
        if (event.recurrenceRule) {
          const rule = event.recurrenceRule.toUpperCase();
          let dates: Date[] = [];

          if (rule.includes("BYSETPOS=") && rule.includes("BYDAY=")) {
            const eventDate = new Date(event.start);
            if (eventDate.getMonth() === targetMonth && eventDate.getFullYear() === targetYear) {
              dates = [eventDate];
            } else if (eventDate < startRange) {
              const dayOfWeek = eventDate.getDay();
              const weekNumber = parseInt(rule.match(/BYSETPOS=(\d+)/)?.[1] || "1", 10);
              const targetDay = new Date(targetYear, targetMonth, 1);
              while (targetDay.getDay() !== dayOfWeek) targetDay.setDate(targetDay.getDate() + 1);
              targetDay.setDate(targetDay.getDate() + (weekNumber - 1) * 7);
              if (targetDay.getMonth() === targetMonth) dates = [targetDay];
            }
          } else {
            try {
              dates = EventHelper.getRange(event, startRange, endRange) || [];
            } catch {
              dates = [];
            }
          }

          const limitedDates = dates.slice(0, 31);
          const eventDuration = new Date(event.end).getTime() - new Date(event.start).getTime();
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
            start: new Date(event.start),
            end: new Date(event.end)
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
