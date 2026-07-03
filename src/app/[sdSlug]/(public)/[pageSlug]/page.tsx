import React, { cache } from "react";
import { PageLayout, Theme } from "@/components";
import { ChurchJsonLd } from "@/components/seo/ChurchJsonLd";
import { EventJsonLd } from "@/components/seo/EventJsonLd";
import { SermonVideoJsonLd } from "@/components/seo/SermonVideoJsonLd";
import { Locale } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper, PageInterface } from "@/helpers";
import { ConfigurationInterface, fetchCached } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import "@/styles/vendor/animations.css";
import { Animate } from "@churchapps/apphelper/website";
import { VotdPage } from "./components/VotdPage";
import { BiblePage } from "./components/BiblePage";
import { StreamPage } from "./components/StreamPage";
import { DefaultPageWrapper } from "./components/DefaultPageWrapper";
import { notFound, permanentRedirect } from "next/navigation";
import { SermonsPage } from "./components/SermonsPage";
import { DonatePage } from "./components/DonatePage";
import { RestrictedPage } from "@/components/RestrictedPage";
import { resolveRedirect } from "@/helpers/RedirectHelper";

const VIRTUAL_PAGE_SLUGS = ["votd", "bible", "donate", "stream", "sermons"];

type PageParams = Promise<{ sdSlug: string; pageSlug: string; }>

// cache() shares one load between generateMetadata and the page render.
const loadSharedData = cache((sdSlug:string, pageSlug:string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug, pageSlug);
});

export async function generateMetadata({ params }: {params:PageParams}): Promise<Metadata> {
  const { sdSlug, pageSlug } = await params;
  const props = await loadSharedData(sdSlug, pageSlug);
  let title = props.pageData.title;
  if (!title) {
    switch (pageSlug) {
      case "votd": title = Locale.label("pageSlug.verseOfTheDay"); break;
      case "bible": title = Locale.label("pageSlug.bible"); break;
      case "sermons": title = Locale.label("pageSlug.sermons"); break;
      case "donate": title = Locale.label("pageSlug.donate"); break;
      case "stream": title = Locale.label("pageSlug.liveStream"); break;
    }
  }
  const pageTitle = title || props.config.church.name;
  const description = props.pageData?.metaDescription || pageTitle;
  return MetaHelper.getMetaData(pageTitle + " - " + props.config.church.name, description, undefined, props.config.appearance);
}

const loadData = async (sdSlug:string, pageSlug:string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  const pageData: PageInterface = await fetchCached<PageInterface>("/pages/" + config.church.id + "/tree?url=" + pageSlug + (config.siteId ? "&siteId=" + config.siteId : ""), "ContentApi", sdSlug);
  return { pageData, config };
};

export default async function Home({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug } = await params;
  const { pageData, config } = await loadSharedData(sdSlug, pageSlug);

  if (!pageData?.url && !VIRTUAL_PAGE_SLUGS.includes(pageSlug)) {
    const to = await resolveRedirect(config.church.id, sdSlug, "/" + pageSlug);
    if (to) permanentRedirect(to);
    return notFound();
  }

  if ((pageData as any)?.restricted) {
    return (
      <>
        <Theme config={config} />
        <DefaultPageWrapper config={config}>
          <RestrictedPage config={config} pageUrl={pageSlug} siteId={config.siteId} />
        </DefaultPageWrapper>
      </>
    );
  }

  const getPageContent = () => {
    let result = <PageLayout config={config} pageData={pageData} />;

    if (!pageData?.url) {
      switch (pageSlug) {
        case "votd": result = wrapDefaultPage(<VotdPage />); break;
        case "bible": result = wrapDefaultPage(<BiblePage />); break;
        case "donate": result = wrapDefaultPage(<DonatePage config={config} />); break;
        case "stream": result = wrapDefaultPage(<StreamPage config={config} />); break;
        case "sermons": result = wrapDefaultPage(<SermonsPage config={config} title={Locale.label("pageSlug.sermons")} />); break;
        default: return notFound();
      }
    }
    return result;
  };

  const wrapDefaultPage = (content: React.ReactElement) => <DefaultPageWrapper config={config}>
    {content}
  </DefaultPageWrapper>;

  return (
    <>
      <Theme config={config} />
      <ChurchJsonLd config={config} />
      <EventJsonLd config={config} pageData={pageData} sdSlug={sdSlug} />
      <SermonVideoJsonLd config={config} pageData={pageData} sdSlug={sdSlug} sermonsPage={!pageData?.url && pageSlug === "sermons"} />
      {getPageContent()}
      <Animate />
    </>
  );
}
