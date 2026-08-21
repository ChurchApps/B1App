import { ConfigHelper } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Footer } from "@/components/layouts/Footer";
import { ApiHelper } from "@churchapps/apphelper";
export default async function Page({ params }: { params: Promise<{ sdSlug: string }> }) {
  EnvironmentHelper.init();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  const footerSections = await ApiHelper.getAnonymous("/blocks/public/footer/" + config.church.id + (config.siteId ? "?siteId=" + config.siteId : ""), "ContentApi");
  return (<><Footer config={config} footerSections={footerSections} /><p>footer2 ok</p></>);
}
