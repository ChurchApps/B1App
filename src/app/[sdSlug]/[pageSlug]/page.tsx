import React from "react";
import { PageLayout, Theme } from "@/components";
import { ApiHelper } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper, PageInterface } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import "@/styles/animations.css";
import { Animate } from "@/components/Animate";
import { VotdPage } from "./components/VotdPage";
import { BiblePage } from "./components/BiblePage";
import { StreamPage } from "./components/StreamPage";
import { DefaultPageWrapper } from "./components/DefaultPageWrapper";
import { notFound } from "next/navigation";
import { SermonsPage } from "./components/SermonsPage";
import { DonatePage } from "./components/DonatePage";



// interface Props {
//   params: {
//     sdSlug: string;
//     pageSlug: string;
//   };
// }

type PageParams = Promise<{ sdSlug: string;  pageSlug: string; }>

const loadSharedData = (sdSlug:string, pageSlug:string) => {
  EnvironmentHelper.init();
  //const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all", "sdSlug=" + sdSlug]});
  //return result(sdSlug, pageSlug);
  return loadData(sdSlug, pageSlug);
}

export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const { sdSlug, pageSlug } =  await params;
  const props = await loadSharedData(sdSlug, pageSlug);
  let title = props.pageData.title;
  if (!title) {
    switch (pageSlug)
    {
      case "votd": title = "Verse of the Day"; break;
      case "bible": title = "Bible"; break;
    }
  }
  return MetaHelper.getMetaData(title + " - " + props.config.church.name, props.pageData.title);
}

const loadData = async (sdSlug:string, pageSlug:string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + config.church.id + "/tree?url=" + pageSlug, "ContentApi");
  return { pageData, config }
}

export default async function Home({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug } = await params;
  const { pageData, config } = await loadSharedData(sdSlug, pageSlug);

  const getPageContent = () => {
    let result = <PageLayout config={config} pageData={pageData} />

    if (!pageData?.url) {
      switch (pageSlug)
      {
        case "votd": result = wrapDefaultPage(<VotdPage />); break;
        case "bible": result = wrapDefaultPage(<BiblePage />); break;
        case "donate": result = wrapDefaultPage(<DonatePage config={config} />); break;
        case "stream": result = wrapDefaultPage(<StreamPage config={config} />); break;
        case "sermons": result = wrapDefaultPage(<SermonsPage config={config} />); break;
        default: return notFound();
      }
    }
    return result;
  }

  const wrapDefaultPage = (content: React.ReactElement) => <DefaultPageWrapper config={config}>
    {content}
  </DefaultPageWrapper>

  return (
    <>
      <Theme config={config} />
      {getPageContent()}
      <Animate />
    </>
  );
}
