import { ConfigHelper } from "@/helpers";
import { CalendarsClientWrapper } from "./CalendarsClientWrapper";

export default async function CalendarsPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <CalendarsClientWrapper config={config} />
  );
}
