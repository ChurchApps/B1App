import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { VotdClient } from "./VotdClient";

type Params = Promise<{ sdSlug: string; }>;

export default async function VotdPage({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <VotdClient config={config} />;
}
