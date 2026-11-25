import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { EmbedDonate } from "../components/EmbedDonate";

type PageParams = Promise<{ sdSlug: string }>;

export default async function EmbedDonatePage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return <EmbedDonate churchId={config.church.id || ""} />;
}
