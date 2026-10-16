import React from "react";
import { EventHelper } from "@churchapps/helpers";
import type { EventInterface, ChurchInterface } from "@churchapps/helpers";
import { buildOccurrences } from "@/helpers/EventOccurrences";
import { fetchCached, type ConfigurationInterface } from "@/helpers/ConfigHelper";
import type { PageInterface } from "@/helpers/interfaces";
import { collectCuratedCalendarIds } from "./pageElements";

interface Props { config: ConfigurationInterface; pageData?: PageInterface; sdSlug: string; }

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
        name: o.event.title || church.name,
        startDate: o.start.toISOString(),
        endDate: o.end.toISOString(),
        eventStatus: "https://schema.org/EventScheduled",
        location: place,
        organizer: { "@type": "Organization", name: church.name }
      };
      if (o.event.description) event.description = o.event.description;
      return event;
    });

    const payload = data.length === 1 ? data[0] : data;
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\\u003c") }} />;
  } catch {
    return null;
  }
}
