import { DefaultPageWrapper } from "@/app/[sdSlug]/(public)/[pageSlug]/components/DefaultPageWrapper";
import { Theme } from "@/components/Theme";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { GroupsBrowser } from "@/components/groups/GroupsBrowser";
import { Container } from "@mui/material";
import { Metadata } from "next";

type PageParams = Promise<{ sdSlug: string }>;

const loadSharedData = (sdSlug: string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug);
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData(`Groups | ${props.config.church.name}`, "", undefined, props.config.appearance);
}

const loadData = async (sdSlug: string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config };
};

export default async function GroupsBrowsePage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const { config } = await loadSharedData(sdSlug);

  return (
    <>
      <Theme config={config} />
      <DefaultPageWrapper config={config}>
        <Container sx={{ py: 4 }}>
          <div id="mainContent">
            <GroupsBrowser churchId={config.church.id} title="Find a Group" />
          </div>
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
