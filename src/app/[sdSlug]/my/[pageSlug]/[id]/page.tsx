import { Theme } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import "@/styles/animations.css";
import { Animate } from "@/components/Animate";

import { TimelinePage } from "../components/TimelinePage";
import { MyWrapper } from "../components/MyWrapper";

import { PersonPage } from "../components/PersonPage";
import { PlanClient } from "../components/PlanClient";

type PageParams = Promise<{ sdSlug: string;  pageSlug: string; id:string; }>

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
  const { sdSlug, pageSlug, id } = await params;
  const { config } = await loadSharedData(sdSlug, pageSlug);

  let label = "Plan Details";
  switch (pageSlug)
  {
    case "plans": label = "Plan Details"; break;
    case "community": label = "Community Details"; break;
    case "forms": label = "Form"; break;
  }

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
      <Theme config={config} />
      <MyWrapper pageSlug={pageSlug} idLabel={label} config={config}>
        {getPageContent()}
      </MyWrapper>

      <Animate />
    </>
  );
}
