import { ConfigHelper } from "@/helpers";
import { CalendarsClientWrapper } from "./CalendarsClientWrapper";

export default async function CalendarsPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <CalendarsClientWrapper config={config} />
  );
}
