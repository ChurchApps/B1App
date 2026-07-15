import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { Box, Chip, Container, Divider, Stack, Typography } from "@mui/material";
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

const excerptOf = (post: PostInterface) => post.excerpt || (post.content || "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*_`~]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);

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
  let categories: string[] = [];
  try {
    categories = await fetchCached<string[]>("/posts/public/" + config.church.id + "/categories", "ContentApi", sdSlug);
  } catch { categories = []; }
  return { config, posts: Array.isArray(posts) ? posts : [], categories: Array.isArray(categories) ? categories : [] };
};

export default async function BlogListPage({ params, searchParams }: { params: PageParams; searchParams: SearchParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const { page: pageParam, category, tag } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const { config, posts, categories } = await loadData(sdSlug, page, category, tag);

  const activeFilter = category || tag;

  return (
    <>
      <Theme config={config} />
      <ChurchJsonLd config={config} />
      <DefaultPageWrapper config={config}>
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
          <div id="mainContent">
            <Box component="header" sx={{ textAlign: "center" }}>
              {activeFilter && (
                <Typography component="span" sx={{ textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.75rem", fontWeight: 700, color: "primary.main" }}>
                  {category ? "Category" : "Tag"}
                </Typography>
              )}
              <Typography variant="h3" component="h1" sx={{ mt: activeFilter ? 1.5 : 0, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.01em", fontSize: { xs: "2rem", md: "2.75rem" } }}>
                {activeFilter || "Blog"}
              </Typography>
              {activeFilter && (
                <Typography sx={{ mt: 1.5, fontSize: "0.95rem" }}>
                  <Link href="/blog">&larr; All posts</Link>
                </Typography>
              )}
              <Box sx={{ width: 40, height: 3, borderRadius: 2, backgroundColor: "primary.main", mx: "auto", mt: 3 }} />
            </Box>

            {categories.length > 0 && (
              <Box sx={{ mt: 4, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1 }}>
                {categories.map((c) => (
                  <Link key={c} href={c === category ? "/blog" : buildQuery({ category: c })} style={{ textDecoration: "none" }}>
                    <Chip size="small" label={c} clickable color={c === category ? "primary" : "default"} />
                  </Link>
                ))}
              </Box>
            )}

            {posts.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ py: 8, textAlign: "center" }}>No posts yet</Typography>
            ) : (
              <Stack divider={<Divider />} spacing={4} sx={{ mt: 5 }}>
                {posts.map((post) => (
                  <Box key={post.id} component="article" sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", sm: "row" }, "&:hover img": { opacity: 0.9 } }}>
                    {post.photoUrl && (
                      <Link href={"/blog/" + post.slug} style={{ flexShrink: 0 }}>
                        <Box component="img" src={post.photoUrl} alt={post.title || ""} sx={{ width: { xs: "100%", sm: 260 }, aspectRatio: "16/9", objectFit: "cover", borderRadius: 2, display: "block", transition: "opacity .15s" }} />
                      </Link>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      {post.category && (
                        <Link href={buildQuery({ category: post.category })} style={{ textDecoration: "none" }}>
                          <Typography component="span" sx={{ textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.7rem", fontWeight: 700, color: "primary.main" }}>
                            {post.category}
                          </Typography>
                        </Link>
                      )}
                      <Typography variant="h5" component="h2" sx={{ mt: 0.5, fontWeight: 600, lineHeight: 1.25, "& a": { textDecoration: "none", color: "inherit" }, "& a:hover": { textDecoration: "underline" } }}>
                        <Link href={"/blog/" + post.slug}>{post.title}</Link>
                      </Typography>
                      {(post.authorName || post.publishDate) && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          {[post.authorName ? "By " + post.authorName : "", formatDate(post.publishDate)].filter(Boolean).join(" · ")}
                        </Typography>
                      )}
                      {excerptOf(post) && <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>{excerptOf(post)}</Typography>}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}

            <Box sx={{ mt: 6, display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              {page > 1
                ? <Link href={buildQuery({ page: page - 1, category, tag })}>&larr; Newer posts</Link>
                : <span />}
              {posts.length === PAGE_SIZE
                ? <Link href={buildQuery({ page: page + 1, category, tag })}>Older posts &rarr;</Link>
                : <span />}
            </Box>
          </div>
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
