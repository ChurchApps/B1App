import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";

import { MobilePageWrapper } from "../components/MobilePageWrapper";
import { ScreenRouter } from "../components/ScreenRouter";

type PageParams = Promise<{ sdSlug: string; pageSlug: string }>;

const loadData = async (sdSlug: string) => {
  EnvironmentHelper.init();
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config };
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, pageSlug } = await params;
  const { config } = await loadData(sdSlug);
  const title = pageSlug ? pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1) : "Mobile";
  return MetaHelper.getMetaData(title + " - " + config.church.name, title, undefined, config.appearance);
}

export default async function MobilePage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug } = await params;
  const { config } = await loadData(sdSlug);

  return (
    <MobilePageWrapper sdSlug={sdSlug} config={config}>
      <ScreenRouter pageSlug={pageSlug} config={config} />
    </MobilePageWrapper>
  );
}
