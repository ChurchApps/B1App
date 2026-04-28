import { Locale } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";

import { MobilePageWrapper } from "../../components/MobilePageWrapper";
import { PlaceholderPage } from "../../components/PlaceholderPage";
import { DetailRouter } from "../../components/DetailRouter";

type PageParams = Promise<{ sdSlug: string; pageSlug: string; id: string }>;

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

export default async function MobileDetailPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug, id } = await params;
  const { config } = await loadData(sdSlug);

  if (!id || id === "undefined" || id.trim() === "") {
    return (
      <MobilePageWrapper sdSlug={sdSlug} config={config}>
        <PlaceholderPage title={Locale.label("mobile.invalidLink")} icon="error_outline" description={Locale.label("mobile.invalidLinkDescription")} />
      </MobilePageWrapper>
    );
  }

  return (
    <MobilePageWrapper sdSlug={sdSlug} config={config}>
      <DetailRouter pageSlug={pageSlug} id={id} config={config} />
    </MobilePageWrapper>
  );
}
