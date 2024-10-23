import { ConfigHelper } from "@/helpers";
import { CalendarClientWrapper } from "./CalendarClientWrapper";

export default async function CalendarPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return <CalendarClientWrapper config={config} />;
}
