import { PageInterface } from "@/helpers/interfaces";
import { ConfigHelper } from "@/helpers/ConfigHelper";
import { Theme } from "@/components/Theme";
import { PageLayout } from "@/components/PageLayout";
import { Metadata } from "next";
import { MetaHelper } from "@/helpers/MetaHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import "@churchapps/apphelper-website/dist/styles/animations.css";
import { Animate } from "@churchapps/apphelper-website";
import { redirect } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper";

type PageParams = { sdSlug: string; }


const loadSharedData = (sdSlug: string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug);
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
  console.log("🔍 [sdSlug]:", sdSlug);
  console.log("🏠 homePage:", config.homePage);
  console.log("📄 pageData:", pageData);
  console.log("🌐 hasWebsite:", config.hasWebsite);
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
