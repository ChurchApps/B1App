import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";

import { InstallPage } from "../components/screens/InstallPage";

type PageParams = Promise<{ sdSlug: string }>;

const loadData = async (sdSlug: string) => {
  EnvironmentHelper.init();
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config };
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  const { config } = await loadData(sdSlug);
  return MetaHelper.getMetaData("Install App - " + config.church.name, "Install App", undefined, config.appearance);
}

export default async function InstallSplashPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const { config } = await loadData(sdSlug);

  return <InstallPage config={config} />;
}
