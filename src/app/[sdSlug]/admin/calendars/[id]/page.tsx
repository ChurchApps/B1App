"use client";
import { ConfigHelper } from "@/helpers";
import { CalendarClientWrapper } from "./CalendarClientWrapper";


  type Params = Promise<{ sdSlug: string;  }>



export default async function CalendarPage({ params }: { params: Params }) {

    const {sdSlug} = await params

  const config = await ConfigHelper.load(sdSlug.toString());
  return <CalendarClientWrapper config={config} />;
}
