"use client";
import { ConfigHelper } from "@/helpers";
import { CalendarsClientWrapper } from "./CalendarsClientWrapper";

type Params = Promise<{ sdSlug: string }>;


export default async function CalendarPage({ params }: { params: Params }) {

  const { sdSlug } = await params;

  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <CalendarsClientWrapper config={config} />
  );
}