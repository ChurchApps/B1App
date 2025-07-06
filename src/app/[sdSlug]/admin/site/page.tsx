import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { SiteAdminClient } from "./SiteAdminClient";


type Params = Promise<{ sdSlug: string; }>

export default async function AdminPage({ params }: { params: Params }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <SiteAdminClient config={config} />;
}
