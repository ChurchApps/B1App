import { PageInterface } from "@/helpers/interfaces";
import { ConfigHelper } from "@/helpers/ConfigHelper";
import { Theme } from "@/components/Theme";
import { PageLayout } from "@/components/PageLayout";
import { ChurchJsonLd } from "@/components/seo/ChurchJsonLd";
import { EventJsonLd } from "@/components/seo/EventJsonLd";
import { SermonVideoJsonLd } from "@/components/seo/SermonVideoJsonLd";
import { Metadata } from "next";
import { MetaHelper } from "@/helpers/MetaHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import "@/styles/vendor/animations.css";
import { Animate } from "@churchapps/apphelper/website";
import { redirect } from "next/navigation";
import { RestrictedPage } from "@/components/RestrictedPage";
import { DefaultPageWrapper } from "./[pageSlug]/components/DefaultPageWrapper";

type PageParams = { sdSlug: string; }


const loadSharedData = (sdSlug: string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug);
};


export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);
  const description = props.pageData?.metaDescription || props.pageData.title;
  return MetaHelper.getMetaData(props.pageData.title + " - " + props.config.church.name, description, undefined, props.config.appearance);
}

const loadData = async (sdSlug: string) => {
  const config = await ConfigHelper.load(sdSlug, "website");
  // Use the homePage already loaded in ConfigHelper instead of fetching it again
  const pageData: PageInterface = config.homePage || { url: null } as PageInterface;
  return { pageData, config };
};

export default async function Home({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);

  if ((props.pageData as any)?.restricted) {
    return (<>
      <Theme config={props.config} />
      <DefaultPageWrapper config={props.config}>
        <RestrictedPage config={props.config} pageUrl="/" />
      </DefaultPageWrapper>
    </>);
  }

  if (!props.pageData?.url) {
    redirect("/mobile");
  } else {
    return (<>
      <Theme config={props.config} />
      <ChurchJsonLd config={props.config} />
      <EventJsonLd config={props.config} pageData={props.pageData} sdSlug={sdSlug} />
      <SermonVideoJsonLd config={props.config} pageData={props.pageData} sdSlug={sdSlug} />
      <PageLayout config={props.config} pageData={props.pageData} />
      <Animate />
    </>);
  }
}
