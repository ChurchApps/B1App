import { ConfigHelper } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Theme } from "@/components/Theme";
export default async function Page({ params }: { params: Promise<{ sdSlug: string }> }) {
  EnvironmentHelper.init();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return (<><Theme config={config} /><p>theme ok</p></>);
}
