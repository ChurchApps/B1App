import React, { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";
import { Metadata } from "next";
import { StyleHelper } from "@churchapps/apphelper/website";
import Zone from "@/components/layouts/Zone";
import { DefaultPageWrapper } from "@/app/[sdSlug]/(public)/[pageSlug]/components/DefaultPageWrapper";
import { Theme } from "@/components/Theme";
import { BlogPostingJsonLd } from "@/components/seo/BlogPostingJsonLd";
import { ConfigHelper, EnvironmentHelper, PageInterface } from "@/helpers";
import { ConfigurationInterface, fetchCached } from "@/helpers/ConfigHelper";
import type { PostInterface } from "@/helpers/interfaces";
import { MetaHelper } from "@/helpers/MetaHelper";

type PageParams = Promise<{ sdSlug: string; postSlug: string }>;

const loadSharedData = cache((sdSlug: string, postSlug: string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug, postSlug);
});

const loadData = async (sdSlug: string, postSlug: string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  let post: PostInterface = {};
  try {
    post = await fetchCached<PostInterface>("/posts/public/" + config.church.id + "/slug/" + postSlug, "ContentApi", sdSlug);
  } catch { post = {}; }
  let pageData: PageInterface = { sections: [] };
  if (post?.id) {
    try {
      pageData = await fetchCached<PageInterface>("/pages/" + config.church.id + "/tree?url=/blog/" + postSlug + (config.siteId ? "&siteId=" + config.siteId : ""), "ContentApi", sdSlug);
    } catch { pageData = { sections: [] }; }
  }
  return { config, post, pageData };
};

const getBaseUrl = async (sdSlug: string) => {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || sdSlug + ".b1.church";
  const proto = h.get("x-forwarded-proto") || "https";
  return proto + "://" + host;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, postSlug } = await params;
  const { config, post } = await loadSharedData(sdSlug, postSlug);
  if (!post?.id) return MetaHelper.getMetaData(config.church.name, "", undefined, config.appearance);
  const appearance = post.photoUrl ? { ...config.appearance, ogImage: post.photoUrl } : config.appearance;
  return MetaHelper.getMetaData(post.title + " - " + config.church.name, post.excerpt || "", undefined, appearance);
}

export default async function BlogPostPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, postSlug } = await params;
  const { config, post, pageData } = await loadSharedData(sdSlug, postSlug);
  if (!post?.id) return notFound();

  const base = await getBaseUrl(sdSlug);
  const url = base + "/blog/" + postSlug;

  StyleHelper.getAllStyles(pageData.sections);
  const css = StyleHelper.getCss(pageData.sections);

  return (
    <>
      <Theme config={config} />
      <BlogPostingJsonLd config={config} post={post} url={url} />
      <DefaultPageWrapper config={config}>
        {post.photoUrl && (
          <Box component="img" src={post.photoUrl} alt={post.title || ""} sx={{ width: "100%", maxHeight: 480, objectFit: "cover", display: "block" }} />
        )}
        <Container sx={{ py: 4 }}>
          <div id="mainContent">
            <Typography variant="h3" component="h1">{post.title}</Typography>
            {post.publishDate && <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>{formatDate(post.publishDate)}</Typography>}
          </div>
        </Container>
        <style>{css}</style>
        <Zone church={config.church} churchSettings={config.appearance} sections={pageData.sections || []} zone="main" />
      </DefaultPageWrapper>
    </>
  );
}
