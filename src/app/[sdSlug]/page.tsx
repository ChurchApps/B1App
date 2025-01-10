import { PageInterface } from "@/helpers/interfaces";
import { ConfigHelper } from "@/helpers/ConfigHelper";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers";
import { Theme } from "@/components/Theme";
import { PageLayout } from "@/components/PageLayout";
import { Metadata } from "next";
import { MetaHelper } from "@/helpers/MetaHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import "@/styles/animations.css";
import { Animate } from "@/components/Animate";
import { redirect } from "next/navigation";

type PageParams = Promise<{ sdSlug: string;  }>


const loadSharedData = (sdSlug:string) =>
  //const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all","sdSlug=" + sdSlug]});
  //return result(sdSlug);
  loadData(sdSlug)


export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const { sdSlug } =  await params;
  const props = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData(props.pageData.title + " - " + props.config.church.name, props.pageData.title, props.config.appearance.ogImage);
}

const loadData = async (sdSlug:string) => {
  const config = await ConfigHelper.load(sdSlug, "website");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + config.church.id + "/tree?url=/", "ContentApi");


  return { pageData, config }
}

export default async function Home({params}: {params:Promise<PageParams>}) {
  await EnvironmentHelper.initServerSide();

  const { sdSlug } =  await params;
  const props = await loadData(sdSlug);
  /*
  useEffect(() => {
    if (!props.pageData?.url && typeof window !== undefined) window.location.href = window.location.origin + "/member";
  }, []); //eslint-disable-line
  */

  if (!props.pageData?.url) redirect("/member"); //return <Loading />
  else return (<>
    <Theme appearance={props.config.appearance} globalStyles={props.config.globalStyles} config={props.config} />
    <PageLayout globalStyles={props.config.globalStyles} church={props.config.church} churchSettings={props.config.appearance} navLinks={props.config.navLinks} pageData={props.pageData} />
    <Animate />
  </>);
}
