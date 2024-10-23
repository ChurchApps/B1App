import { ConfigHelper } from "@/helpers";
import { StreamSettingsClient } from "./StreamSettingsClient";

export default async function StreamSettingsPage({ params }: { params: { sdSlug: string } }) {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return <StreamSettingsClient config={config} />;
}