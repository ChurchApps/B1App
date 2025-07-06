import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";
import { GroupList } from "@/components/groups/GroupList";
import { Theme } from "@/components/Theme";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Container } from "@mui/material";
import { Metadata } from "next";

type PageParams = Promise<{ sdSlug: string; label: string; }>

const loadSharedData = (sdSlug: string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug);
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData(props.config.church.name, "", props.config.appearance.ogImage);
}

const loadData = async (sdSlug:string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config }
}


export default async function GroupPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, label } = await params
  const { config } = await loadSharedData(sdSlug);

  const getTitleCase = (words: string) => words
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const searchLabel = label.replace(/-/g, " ");
  const displayLabel = getTitleCase(searchLabel);


  return (
    <>
      <Theme config={config} />
      <DefaultPageWrapper config={config}>

        <Container>
          <div id="mainContent">
            <h1>{displayLabel} Groups</h1>
            <GroupList churchId={config.church.id} label={searchLabel} />
          </div>
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
