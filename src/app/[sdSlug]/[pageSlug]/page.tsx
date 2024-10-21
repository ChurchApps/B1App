import { Theme } from "@/components/Theme";
import { PageLayout } from "@/components/PageLayout";
import { ApiHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper/dist/helpers";
import { ConfigHelper } from "@/helpers/ConfigHelper";
import { GlobalStyleInterface, PageInterface } from "@/helpers/interfaces";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { unstable_cache } from "next/cache";
import { Metadata } from "next";
import { MetaHelper } from "@/helpers/MetaHelper";

type Props = {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[],
  globalStyles: GlobalStyleInterface,
  config: ConfigurationInterface
};

type PageParams = {sdSlug:string, pageSlug:string }


const loadSharedData = (sdSlug:string, pageSlug:string) => {
  const result = unstable_cache(loadData, ["/[sdSlug]/[pageSlug]", sdSlug, pageSlug], {tags:["all"]});
  return result(sdSlug, pageSlug);
}

export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const props = await loadSharedData(params.sdSlug, params.pageSlug);
  return MetaHelper.getMetaData(props.pageData.title + " - " + props.church.name, props.pageData.title, props.churchSettings.ogImage);
}

const loadData = async (sdSlug:string, pageSlug:string) => {
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=" + pageSlug, "ContentApi");
  const config = await ConfigHelper.load(church.subDomain);

  console.log("GLOBAL", globalStyles);

  return { pageData, church, churchSettings, navLinks, globalStyles, config }
}

export default async function Page({params}: {params:PageParams}) {
  const props = await loadData(params.sdSlug, params.pageSlug);

  return (<>
    <Theme appearance={props.churchSettings} globalStyles={props.globalStyles} config={props.config} />
    <PageLayout globalStyles={props.globalStyles} church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
  </>);
}
