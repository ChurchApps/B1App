"use client";

import React from "react";
import { Locale } from "@churchapps/apphelper";
import { CalendarElement, Element as AppHelperElement, ElementBlock, registerElementRenderer, setImageOptimizer } from "@churchapps/apphelper/website";
import type { ChurchInterface, EventInterface } from "@churchapps/helpers";
import { ElementInterface, SectionInterface } from "@/helpers";
import { LiveStream } from "./video/LiveStream";
import { FormElement } from "./elements/FormElement";
import { UpcomingEventsElement } from "./elements/UpcomingEventsElement";
import { eventPageId } from "@/helpers/EventOccurrences";
import { b1ImageOptimizer } from "@/helpers/imageOptimizer";

interface Props {
  element: ElementInterface;
  church?: ChurchInterface;
  churchSettings: any;
  textColor: string;
  onEdit?: (section: SectionInterface | null, element: ElementInterface) => void;
  onMove?: () => void;
  parentId?: string;
}

const StreamElement: React.FC<{ element: ElementInterface; churchSettings: any; church: ChurchInterface; editMode: boolean }> = (props) => {
  const mode = props.element.answers?.mode;
  const includeInteraction = mode !== "video";

  let offlineContent: React.ReactElement | undefined = undefined;
  if (props.element.answers?.offlineContent === "hide") offlineContent = (props.editMode) ? (<>{Locale.label("element.offlinePlaceholder")}</>) : (<></>);
  else if (props.element.answers?.offlineContent === "block") offlineContent = <ElementBlock key={props.element.id} element={props.element as ElementInterface} churchSettings={props.churchSettings} textColor={"#333333"} />;

  return <LiveStream includeHeader={false} includeInteraction={includeInteraction} keyName={props.church.subDomain || ""} appearance={props.churchSettings} offlineContent={offlineContent} />;
};

// B1App-specific renderers registered as registry overrides; they win over the
// apphelper defaults regardless of module load order.
registerElementRenderer("stream", (p) => p.church
  ? <StreamElement element={p.element as ElementInterface} churchSettings={p.churchSettings} church={p.church} editMode={!!p.onEdit} />
  : null);
registerElementRenderer("form", (p) => p.church
  ? <FormElement element={p.element as ElementInterface} church={p.church} />
  : null);
// Calendar: "upcoming" renders photo tiles; the month grid links each event to its page.
registerElementRenderer("calendar", (p) => {
  const churchId = p.church?.id || p.element.churchId || "";
  if (p.element.answers?.display === "upcoming") return <UpcomingEventsElement key={p.element.id} element={p.element as ElementInterface} churchId={churchId} />;
  // ponytail: eventUrl is spread untyped until @churchapps/apphelper publishes the prop
  const eventUrl: any = { eventUrl: (e: EventInterface) => "/events/" + eventPageId(e) };
  return <CalendarElement key={p.element.id} element={p.element} churchId={churchId} firstDayOfWeek={(p.church as any)?.firstDayOfWeek ?? 0} {...eventUrl} />;
});

// Route apphelper content images through the Next.js image optimizer (srcset/WebP/AVIF).
setImageOptimizer(b1ImageOptimizer);

export const Element: React.FC<Props> = (props) => <AppHelperElement {...props} />;
