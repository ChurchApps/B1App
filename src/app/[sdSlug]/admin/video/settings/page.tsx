import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { StreamSettingsClient } from "./StreamSettingsClient";

type Params = Promise<{ sdSlug: string }>;


export default async function StreamSettingsPage({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());
  return <StreamSettingsClient config={config} />;
}
