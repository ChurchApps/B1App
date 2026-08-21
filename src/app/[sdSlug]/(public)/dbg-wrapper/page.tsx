import { ConfigHelper } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { DefaultPageWrapper } from "../[pageSlug]/components/DefaultPageWrapper";
export default async function Page({ params }: { params: Promise<{ sdSlug: string }> }) {
  EnvironmentHelper.init();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return (<DefaultPageWrapper config={config}><p>wrapper ok</p></DefaultPageWrapper>);
}
