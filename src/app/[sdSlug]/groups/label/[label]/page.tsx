import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";
import { GroupList } from "@/components/groups/GroupList";
import { Theme } from "@/components/Theme";
import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface } from "@/helpers";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ChurchInterface, ApiHelper } from "@churchapps/apphelper";
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
  return MetaHelper.getMetaData(props.church.name, "", props.churchSettings.ogImage);
}

const loadData = async (sdSlug:string) => {

  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  const config: ConfigurationInterface = await ConfigHelper.load(church.subDomain);

  return { church, churchSettings, navLinks, globalStyles, config }
}


export default async function GroupPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, label } = await params
  const { church, churchSettings, globalStyles, navLinks, config } = await loadSharedData(sdSlug);

  const getTitleCase = (words: string) => words
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const searchLabel = label.replace(/-/g, " ");
  const displayLabel = getTitleCase(searchLabel);


  return (
    <>
      <Theme appearance={churchSettings} globalStyles={globalStyles} config={config} />
      <DefaultPageWrapper churchSettings={churchSettings} church={church} navLinks={navLinks} globalStyles={globalStyles}>

        <Container>
          <div id="mainContent">
            <h1>{displayLabel} Groups</h1>
            <GroupList churchId={church.id} label={searchLabel} />
          </div>
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
