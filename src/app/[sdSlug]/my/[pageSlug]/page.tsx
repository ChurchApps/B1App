import { Theme } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import "@/styles/animations.css";
import { Animate } from "@/components/Animate";

import { TimelinePage } from "./components/TimelinePage";
import { GroupsPage } from "./components/GroupsPage";
import { PlansPage } from "./components/PlansPage";
import { MyWrapper } from "./components/MyWrapper";
import { CheckinPage } from "./components/CheckinPage";
import { LessonsPage } from "./components/LessonsPage";
import { DirectoryPage } from "./components/DirectoryPage";
import { DonationsPage } from "./components/DonationPage";

type PageParams = Promise<{ sdSlug: string;  pageSlug: string; }>

const loadSharedData = (sdSlug:string, pageSlug:string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug, pageSlug);
}

export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const { sdSlug, pageSlug } =  await params;
  const props = await loadSharedData(sdSlug, pageSlug);

  const title = "My....";
  return MetaHelper.getMetaData(title + " - " + props.config.church.name, "My", props.config.appearance.ogImage);
}

const loadData = async (sdSlug:string, pageSlug:string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config }
}

export default async function Home({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug } = await params;
  const { config } = await loadSharedData(sdSlug, pageSlug);

  const getPageContent = () => {
    switch (pageSlug)
    {
      case "checkin": return <CheckinPage />;
      case "plans": return <PlansPage />;
      case "groups": return <GroupsPage />;
      case "lessons": return <LessonsPage />;
      case "community": return <DirectoryPage />
      case "donate": return <DonationsPage config={config} />
      default: return <TimelinePage />;
      //default: return notFound();
    }
  }

  return (
    <>
      <Theme config={config} />
      <MyWrapper pageSlug={pageSlug} root={pageSlug==="timeline"} config={config}>
        {getPageContent()}
      </MyWrapper>
      <Animate />
    </>
  );
}
