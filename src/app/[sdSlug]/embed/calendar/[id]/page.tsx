import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { getFirstDayOfWeek } from "@/helpers/firstDayOfWeek";
import { EmbedCalendar } from "../../components/EmbedCalendar";

type PageParams = Promise<{ sdSlug: string; id: string }>;

export default async function EmbedCalendarPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, id } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return <EmbedCalendar churchId={config.church.id || ""} calendarId={id} firstDayOfWeek={getFirstDayOfWeek(config.church)} />;
}
