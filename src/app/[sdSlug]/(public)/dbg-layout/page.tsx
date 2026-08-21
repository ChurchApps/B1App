import { ConfigHelper } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { PageLayout } from "@/components/PageLayout";
import { PageInterface } from "@/helpers/interfaces";
export default async function Page({ params }: { params: Promise<{ sdSlug: string }> }) {
  EnvironmentHelper.init();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return (<><PageLayout config={config} pageData={config.homePage as PageInterface} /><p>layout ok</p></>);
}
