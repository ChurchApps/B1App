import { ConfigHelper } from "@/helpers";
import { CalendarClientWrapper } from "./CalendarClientWrapper";

export default async function CalendarPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());
  return <CalendarClientWrapper config={config} />;
}
