import { Locale } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";

import { ScreenRouter } from "../components/ScreenRouter";
import { canonicalTab } from "../components/mobileTabs";

type PageParams = Promise<{ sdSlug: string; pageSlug: string }>;

const loadData = async (sdSlug: string) => {
  EnvironmentHelper.init();
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config };
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, pageSlug } = await params;
  const { config } = await loadData(sdSlug);
  const title = pageSlug ? pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1) : Locale.label("mobile.mobileApp");
  return MetaHelper.getMetaData(title + " - " + config.church.name, title, undefined, config.appearance);
}

export default async function MobilePage({ params }: { params: PageParams }) {
  const { sdSlug, pageSlug } = await params;
  // Kept-alive tabs are rendered by the layout's MobileKeepAlive; the route
  // itself renders nothing so tab switches skip this server work entirely.
  if (canonicalTab(pageSlug)) return null;
  await EnvironmentHelper.initServerSide();
  const { config } = await loadData(sdSlug);

  return <ScreenRouter pageSlug={pageSlug} config={config} />;
}
