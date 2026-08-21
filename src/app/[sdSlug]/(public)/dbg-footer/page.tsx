import { ConfigHelper } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Footer } from "@/components/layouts/Footer";
export default async function Page({ params }: { params: Promise<{ sdSlug: string }> }) {
  EnvironmentHelper.init();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return (<><Footer config={config} footerSections={[]} /><p>footer ok</p></>);
}
