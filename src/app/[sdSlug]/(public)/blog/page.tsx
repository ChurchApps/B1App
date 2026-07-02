import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { Box, Card, CardContent, CardMedia, Chip, Container, Typography } from "@mui/material";
import { Metadata } from "next";
import { ApiHelper } from "@churchapps/apphelper";
import { DefaultPageWrapper } from "@/app/[sdSlug]/(public)/[pageSlug]/components/DefaultPageWrapper";
import { Theme } from "@/components/Theme";
import { ChurchJsonLd } from "@/components/seo/ChurchJsonLd";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface, fetchCached } from "@/helpers/ConfigHelper";
import type { PostInterface } from "@/helpers/interfaces";
import { MetaHelper } from "@/helpers/MetaHelper";

type PageParams = Promise<{ sdSlug: string }>;
type SearchParams = Promise<{ page?: string; category?: string; tag?: string }>;

const PAGE_SIZE = 10;

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

const buildQuery = (params: { page?: number; category?: string; tag?: string }) => {
  const qs = new URLSearchParams();
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  if (params.category) qs.set("category", params.category);
  if (params.tag) qs.set("tag", params.tag);
  const s = qs.toString();
  return s ? "/blog?" + s : "/blog";
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  EnvironmentHelper.init();
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  const base = await getBaseUrl(sdSlug);
  const contentApi = ApiHelper.getConfig("ContentApi")?.url;
  const metadata = MetaHelper.getMetaData("Blog | " + config.church.name, "", undefined, config.appearance);
  if (contentApi) {
    const rssUrl = contentApi + "/posts/rss/" + config.church.id + "?siteUrl=" + encodeURIComponent(base);
    metadata.alternates = { types: { "application/rss+xml": rssUrl } };
  }
  return metadata;
}

const loadData = async (sdSlug: string, page: number, category?: string, tag?: string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (category) qs.set("category", category);
  if (tag) qs.set("tag", tag);
  let posts: PostInterface[] = [];
  try {
    posts = await fetchCached<PostInterface[]>("/posts/public/" + config.church.id + "?" + qs.toString(), "ContentApi", sdSlug);
  } catch { posts = []; }
  return { config, posts: Array.isArray(posts) ? posts : [] };
};

export default async function BlogListPage({ params, searchParams }: { params: PageParams; searchParams: SearchParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const { page: pageParam, category, tag } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const { config, posts } = await loadData(sdSlug, page, category, tag);

  const activeFilter = category || tag;

  return (
    <>
      <Theme config={config} />
      <ChurchJsonLd config={config} />
      <DefaultPageWrapper config={config}>
        <Container sx={{ py: 4 }}>
          <div id="mainContent">
            <Typography variant="h3" component="h1" sx={{ mb: 3 }}>Blog</Typography>

            {activeFilter && (
              <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2">Filtered by:</Typography>
                <Chip label={(category ? "Category: " : "Tag: ") + activeFilter} />
                <Link href="/blog">Clear filter</Link>
              </Box>
            )}

            {posts.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ py: 6, textAlign: "center" }}>No posts yet</Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" } }}>
                {posts.map((post) => (
                  <Card key={post.id} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    {post.photoUrl && (
                      <Link href={"/blog/" + post.slug}>
                        <CardMedia component="img" image={post.photoUrl} alt={post.title || ""} sx={{ aspectRatio: "16/9", objectFit: "cover" }} />
                      </Link>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      {post.category && <Chip size="small" label={post.category} sx={{ mb: 1 }} />}
                      <Typography variant="h6" component="h2">
                        <Link href={"/blog/" + post.slug}>{post.title}</Link>
                      </Typography>
                      {post.publishDate && <Typography variant="caption" color="text.secondary">{formatDate(post.publishDate)}</Typography>}
                      {post.excerpt && <Typography variant="body2" sx={{ mt: 1 }}>{post.excerpt}</Typography>}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
              {page > 1
                ? <Link href={buildQuery({ page: page - 1, category, tag })}>&larr; Newer</Link>
                : <span />}
              {posts.length === PAGE_SIZE
                ? <Link href={buildQuery({ page: page + 1, category, tag })}>Older &rarr;</Link>
                : <span />}
            </Box>
          </div>
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
