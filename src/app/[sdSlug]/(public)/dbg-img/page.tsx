import { ConfigHelper } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { AppearanceHelper } from "@churchapps/apphelper";
export default async function Page({ params }: { params: Promise<{ sdSlug: string }> }) {
  EnvironmentHelper.init();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  const logoUrl = AppearanceHelper.getLogoDark(config.appearance, "/images/logo.png");
  return (<><img src={logoUrl} className="img-fluid" id="el-footer-logo" alt={config.church.name} style={{ maxWidth: "200px" }} /><p>img ok {logoUrl}</p></>);
}
