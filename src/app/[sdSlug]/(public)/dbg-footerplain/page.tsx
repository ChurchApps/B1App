import { ConfigHelper } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
export default async function Page({ params }: { params: Promise<{ sdSlug: string }> }) {
  EnvironmentHelper.init();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  return (<footer><div className="section headingsLight linksLightAccent" style={{ backgroundColor: "var(--dark)", color: "var(--light)", paddingTop: 40, paddingBottom: 40 }}><h2>{config.church.name}</h2><p>{config.church.address1}<br />{config.church.city && <>{config.church.city}, {config.church.state} {config.church.zip}</>}</p></div><p>footerplain ok</p></footer>);
}
