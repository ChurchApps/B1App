import { ConfigHelper } from "@/helpers";
import { StreamSettingsClient } from "./StreamSettingsClient";

export default async function StreamSettingsPage({ params }: { params: { sdSlug: string } }) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());
  return <StreamSettingsClient config={config} />;
}