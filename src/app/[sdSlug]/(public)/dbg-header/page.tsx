import { ConfigHelper } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Header } from "@/components/Header";
export default async function Page({ params }: { params: Promise<{ sdSlug: string }> }) {
  EnvironmentHelper.init();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return (<><Header config={config} overlayContent={false} sections={[]} /><p>header ok</p></>);
}
