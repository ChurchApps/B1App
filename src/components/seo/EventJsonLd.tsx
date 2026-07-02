import React from "react";
import { EventHelper } from "@churchapps/helpers";
import type { EventInterface, ChurchInterface } from "@churchapps/helpers";
import { fetchCached, type ConfigurationInterface } from "@/helpers/ConfigHelper";
import type { PageInterface } from "@/helpers/interfaces";
import { collectCuratedCalendarIds } from "./pageElements";

interface Props { config: ConfigurationInterface; pageData?: PageInterface; sdSlug: string; }

interface Occurrence { title?: string; description?: string; start: Date; end: Date; }

const WINDOW_DAYS = 180;
const MAX_EVENTS = 25;

const churchPlace = (church: ChurchInterface) => {
  const place: Record<string, unknown> = { "@type": "Place", name: church.name };
  if (church.address1) {
    place.address = {
      "@type": "PostalAddress",
      streetAddress: church.address2 ? church.address1 + ", " + church.address2 : church.address1,
      addressLocality: church.city,
      addressRegion: church.state,
      postalCode: church.zip,
      addressCountry: church.country
    };
  }
  return place;
};

const buildOccurrences = (events: EventInterface[], now: Date, windowEnd: Date): Occurrence[] => {
  const result: Occurrence[] = [];
  for (const event of events) {
    if (!event.start) continue;
    const baseStart = new Date(event.start);
    if (isNaN(baseStart.getTime())) continue;
    const baseEnd = event.end ? new Date(event.end) : new Date(baseStart.getTime() + 60 * 60 * 1000);
    const durationMs = Math.max(0, baseEnd.getTime() - baseStart.getTime());

    if (event.recurrenceRule) {
      let dates: Date[] = [];
      try { dates = EventHelper.getRange(event, now, windowEnd) || []; } catch { dates = []; }
      for (const d of dates.slice(0, 5)) {
        result.push({ title: event.title, description: event.description, start: d, end: new Date(d.getTime() + durationMs) });
      }
    } else if (baseEnd >= now) {
      result.push({ title: event.title, description: event.description, start: baseStart, end: baseEnd });
    }
  }
  return result;
};

export async function EventJsonLd({ config, pageData, sdSlug }: Props) {
  try {
    const church = config.church;
    if (!church?.id) return null;

    const calendarIds = collectCuratedCalendarIds(pageData?.sections);
    if (calendarIds.length === 0) return null;

    const eventMap = new Map<string, EventInterface>();
    for (const calendarId of calendarIds) {
      const events = await fetchCached<EventInterface[]>("/curatedEvents/public/calendar/" + church.id + "/" + calendarId, "ContentApi", sdSlug);
      if (Array.isArray(events)) {
        for (const event of events) if (event?.id && !eventMap.has(event.id)) eventMap.set(event.id, event);
      }
    }
    if (eventMap.size === 0) return null;

    await EventHelper.ensureInitialized();
    const now = new Date();
    const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const occurrences = buildOccurrences(Array.from(eventMap.values()), now, windowEnd);
    if (occurrences.length === 0) return null;

    occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());
    const place = churchPlace(church);

    const data = occurrences.slice(0, MAX_EVENTS).map((o) => {
      const event: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Event",
        name: o.title || church.name,
        startDate: o.start.toISOString(),
        endDate: o.end.toISOString(),
        eventStatus: "https://schema.org/EventScheduled",
        location: place,
        organizer: { "@type": "Organization", name: church.name }
      };
      if (o.description) event.description = o.description;
      return event;
    });

    const payload = data.length === 1 ? data[0] : data;
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />;
  } catch {
    return null;
  }
}
