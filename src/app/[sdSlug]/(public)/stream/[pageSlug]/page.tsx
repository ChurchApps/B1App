import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLayout, Theme } from "@/components";
import { ConfigHelper, EnvironmentHelper, PageInterface } from "@/helpers";
import { fetchCachedOrNull } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";

type Params = Promise<{ sdSlug: string; pageSlug: string }>;

export const dynamic = "force-dynamic";

// cache() shares one load between generateMetadata and the page render.
const loadSharedData = cache(async (sdSlug: string, pageSlug: string) => {
  await EnvironmentHelper.initServerSide();
  const config = await ConfigHelper.load(sdSlug, "website");
  const pageData = await fetchCachedOrNull<PageInterface>(`/pages/${config.church.id}/tree?url=${encodeURIComponent("/stream/" + pageSlug)}${config.siteId ? "&siteId=" + config.siteId : ""}`, "ContentApi", sdSlug);
  return { config, pageData };
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sdSlug, pageSlug } = await params;
  const { config, pageData } = await loadSharedData(sdSlug, pageSlug);
  const pageTitle = pageData?.title || config.church.name;
  return MetaHelper.getMetaData(pageTitle + " - " + config.church.name, pageData?.metaDescription || pageTitle, undefined, config.appearance);
}

export default async function Home({ params }: { params: Params }) {
  const { sdSlug, pageSlug } = await params;
  const { config, pageData } = await loadSharedData(sdSlug, pageSlug);
  if (!pageData?.url) return notFound();

  return (
    <>
      <Theme config={config} />
      <PageLayout config={config} pageData={pageData} />
    </>
  );
}
