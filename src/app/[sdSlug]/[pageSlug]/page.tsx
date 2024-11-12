import { PageLayout, Theme } from "@/components";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { unstable_cache } from "next/cache";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import "@/styles/animations.css";
import { Animate } from "@/components/Animate";

// interface Props {
//   params: {
//     sdSlug: string;
//     pageSlug: string;
//   };
// }

type PageParams = Promise<{ sdSlug: string;  pageSlug: string; }>

const loadSharedData = (sdSlug:string, pageSlug:string) => {
  EnvironmentHelper.init();
  const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all", "sdSlug=" + sdSlug]});
  return result(sdSlug, pageSlug);
}

export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const { sdSlug, pageSlug } =  await params;
  const props = await loadSharedData(sdSlug, pageSlug);
  return MetaHelper.getMetaData(props.pageData.title + " - " + props.church.name, props.pageData.title, props.churchSettings.ogImage);
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

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={globalStyles} config={config} />
      <PageLayout
        globalStyles={globalStyles}
        church={church}
        churchSettings={churchSettings}
        navLinks={navLinks}
        pageData={pageData}
      />
      <Animate />
    </>
  );
}
