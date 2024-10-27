import { GlobalStyleInterface, PageInterface } from "@/helpers/interfaces";
import { ConfigHelper } from "@/helpers/ConfigHelper";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper/dist/helpers";
import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { Theme } from "@/components/Theme";
import { PageLayout } from "@/components/PageLayout";
import { unstable_cache } from "next/cache";
import { Metadata } from "next";
import { MetaHelper } from "@/helpers/MetaHelper";

type PageParams = Promise<{ sdSlug: string;  }>


const loadSharedData = (sdSlug:string) => {
  const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all"]});
  return result(sdSlug);
}

export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const { sdSlug } =  await params;
  const props = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData(props.pageData.title + " - " + props.church.name, props.pageData.title, props.churchSettings.ogImage);
}

const loadData = async (sdSlug:string) => {
  const church: ChurchInterface | null = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");

  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=/", "ContentApi");
  const config = await ConfigHelper.load(church.subDomain);

  return { pageData, church, churchSettings, navLinks, globalStyles, config }
}

export default async function Home({params}: {params:Promise<PageParams>}) {

  const { sdSlug } =  await params;
  const props = await loadData(sdSlug);
  /*
  useEffect(() => {
    if (!props.pageData?.url && typeof window !== undefined) window.location.href = window.location.origin + "/member";
  }, []); //eslint-disable-line
  */

  if (!props.pageData?.url) return <Loading />
  else return (<>
    <Theme appearance={props.churchSettings} globalStyles={props.globalStyles} config={props.config} />
    <PageLayout globalStyles={props.globalStyles} church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
  </>);
}
