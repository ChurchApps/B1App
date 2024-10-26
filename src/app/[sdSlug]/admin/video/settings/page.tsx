import { ConfigHelper } from "@/helpers";
import { StreamSettingsClient } from "./StreamSettingsClient";

type Params = Promise<{ sdSlug: string }>;


export default async function StreamSettingsPage({ params }: { params: Params }) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());
  return <StreamSettingsClient config={config} />;
}