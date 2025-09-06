import { PageInterface } from "@/helpers/interfaces";
import { ConfigHelper } from "@/helpers/ConfigHelper";
import { Theme } from "@/components/Theme";
import { PageLayout } from "@/components/PageLayout";
import { Metadata } from "next";
import { MetaHelper } from "@/helpers/MetaHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import "@/styles/animations.css";
import { Animate } from "@/components/Animate";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";

type PageParams = { sdSlug: string; }


const loadSharedData = (sdSlug: string) => {
  const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all","sdSlug=" + sdSlug]});
  return result(sdSlug);
}


export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData(props.pageData.title + " - " + props.config.church.name, props.pageData.title);
}

const loadData = async (sdSlug: string) => {
  const config = await ConfigHelper.load(sdSlug, "website");
  // Use the homePage already loaded in ConfigHelper instead of fetching it again
  const pageData: PageInterface = config.homePage || { url: null } as PageInterface;
  return { pageData, config }
}

export default async function Home({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);

  if (!props.pageData?.url) {
    redirect("/my");
  } else {
    return (<>
      <Theme config={props.config} />
      <PageLayout config={props.config} pageData={props.pageData} />
      <Animate />
    </>);
  }
}
