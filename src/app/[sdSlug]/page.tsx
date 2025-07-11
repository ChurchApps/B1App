import { PageInterface } from "@/helpers/interfaces";
import { ConfigHelper } from "@/helpers/ConfigHelper";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
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
  return MetaHelper.getMetaData(props.pageData.title + " - " + props.config.church.name, props.pageData.title);
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

  if (!props.pageData?.url) redirect("/my"); //return <Loading />
  else return (<>
    <Theme config={props.config} />
    <PageLayout config={props.config} pageData={props.pageData} />
    <Animate />
  </>);
}
