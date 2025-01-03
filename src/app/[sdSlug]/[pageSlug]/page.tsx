import { PageLayout, Theme } from "@/components";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
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
  return MetaHelper.getMetaData(title + " - " + props.church.name, props.pageData.title, props.churchSettings.ogImage);
}

const loadData = async (sdSlug:string, pageSlug:string) => {

  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=" + pageSlug, "ContentApi");
  const config: ConfigurationInterface = await ConfigHelper.load(church.subDomain);

  return { pageData, church, churchSettings, navLinks, globalStyles, config }
}

export default async function Home({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug } = await params;
  const { church, churchSettings, globalStyles, navLinks, pageData, config } = await loadSharedData(sdSlug, pageSlug);

  const getPageContent = () => {
    let result = <PageLayout globalStyles={globalStyles} church={church} churchSettings={churchSettings} navLinks={navLinks} pageData={pageData} />
    console.log("Page Data", pageData);
    console.log("Page Slug", pageSlug);
    if (!pageData?.url) {
      switch (pageSlug)
      {
        case "votd": result = wrapDefaultPage(<VotdPage />); break;
        case "bible": result = wrapDefaultPage(<BiblePage />); break;
        case "stream": result = wrapDefaultPage(<StreamPage churchSettings={churchSettings} church={church} />); break;
        case "sermons": result = wrapDefaultPage(<SermonsPage churchSettings={churchSettings} church={church} />); break;
        default: return notFound();
      }
    }
    return result;
  }

  const wrapDefaultPage = (content:JSX.Element) => <DefaultPageWrapper churchSettings={churchSettings} church={church} navLinks={navLinks} globalStyles={globalStyles}>
    {content}
  </DefaultPageWrapper>

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={globalStyles} config={config} />
      {getPageContent()}
      <Animate />
    </>
  );
}
