import { Theme } from "@/components";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import "@/styles/animations.css";
import { Animate } from "@/components/Animate";

import { TimelinePage } from "../components/TimelinePage";
import { MyWrapper } from "../components/MyWrapper";
import { PlanClient } from "@/app/[sdSlug]/member/plans/[id]/PlanClient";
import { PersonPage } from "../components/PersonPage";

type PageParams = Promise<{ sdSlug: string;  pageSlug: string; id:string; }>

const loadSharedData = (sdSlug:string, pageSlug:string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug, pageSlug);
}

export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const { sdSlug, pageSlug } =  await params;
  const props = await loadSharedData(sdSlug, pageSlug);

  const title = "My....";
  return MetaHelper.getMetaData(title + " - " + props.church.name, "My", props.churchSettings.ogImage);
}

const loadData = async (sdSlug:string, pageSlug:string) => {

  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  const config: ConfigurationInterface = await ConfigHelper.load(church.subDomain);

  return { church, churchSettings, navLinks, globalStyles, config }
}

export default async function Home({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug, id } = await params;
  const { church, churchSettings, globalStyles, navLinks, config } = await loadSharedData(sdSlug, pageSlug);

  const getPageContent = () => {
    switch (pageSlug)
    {
      case "plans": return <PlanClient planId={id} />;
      case "community": return <PersonPage personId={id}  />;
      default: return <TimelinePage />;
      //default: return notFound();
    }
  }

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={globalStyles} config={config} />
      <MyWrapper churchSettings={churchSettings} church={church} navLinks={navLinks} globalStyles={globalStyles}>
        {getPageContent()}
      </MyWrapper>

      <Animate />
    </>
  );
}
