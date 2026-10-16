import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import type { EventInterface } from "@churchapps/helpers";
import { Theme } from "@/components/Theme";
import { EventPageContent, type EventPageLabels } from "@/components/events/EventPageContent";
import { DefaultPageWrapper } from "@/app/[sdSlug]/(public)/[pageSlug]/components/DefaultPageWrapper";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { firstLine } from "@/helpers/EventOccurrences";
import { MetaHelper } from "@/helpers/MetaHelper";

type PageParams = Promise<{ sdSlug: string; eventId: string }>;
type PublicEvent = EventInterface & { roomNames?: string[]; photoUrl?: string };

export const dynamic = "force-dynamic";

const loadSharedData = cache(async (sdSlug: string, eventId: string) => {
  EnvironmentHelper.init();
  const config = await ConfigHelper.load(sdSlug, "website");
  let event: PublicEvent | null = null;
  try { event = await ApiHelper.getAnonymous("/events/public/" + config.church.id + "/" + eventId, "ContentApi"); } catch { event = null; }
  return { config, event };
});

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, eventId } = await params;
  const { config, event } = await loadSharedData(sdSlug, eventId);
  if (!event?.id) return MetaHelper.getMetaData(config.church.name, "", undefined, config.appearance);
  const appearance = event.photoUrl ? { ...config.appearance, ogImage: event.photoUrl } : config.appearance;
  return MetaHelper.getMetaData(event.title + " - " + config.church.name, firstLine(event.description) || event.title || "", undefined, appearance);
}

export default async function EventPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, eventId } = await params;
  const { config, event } = await loadSharedData(sdSlug, eventId);
  if (!event?.id) return notFound();
  const icsUrl = EnvironmentHelper.Common.ContentApi + "/events/public/" + config.church.id + "/" + event.id + "/ical";
  const labels: EventPageLabels = { allEvents: Locale.label("eventPage.allEvents"), when: Locale.label("eventPage.when"), where: Locale.label("eventPage.where"), register: Locale.label("eventPage.register"), addToCalendar: Locale.label("eventPage.addToCalendar") };

  return (
    <>
      <Theme config={config} />
      <DefaultPageWrapper config={config}>
        <EventPageContent event={event} icsUrl={icsUrl} labels={labels} />
      </DefaultPageWrapper>
    </>
  );
}
