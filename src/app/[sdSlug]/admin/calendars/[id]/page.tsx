
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { CalendarClientWrapper } from "./CalendarClientWrapper";


  type Params = Promise<{ sdSlug: string; id:string  }>

export default async function CalendarPage({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug, id} = await params

  const config = await ConfigHelper.load(sdSlug.toString());
  return <CalendarClientWrapper config={config} curatedCalendarId={id} />;
}
