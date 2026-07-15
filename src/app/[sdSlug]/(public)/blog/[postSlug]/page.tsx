import React, { cache } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Box, Chip, Container, Typography } from "@mui/material";
import { Metadata } from "next";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { DefaultPageWrapper } from "@/app/[sdSlug]/(public)/[pageSlug]/components/DefaultPageWrapper";
import { Theme } from "@/components/Theme";
import { BlogPostingJsonLd } from "@/components/seo/BlogPostingJsonLd";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
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
  let related: PostInterface[] = [];
  if (post?.id && post.category) {
    try {
      const sameCategory = await fetchCached<PostInterface[]>("/posts/public/" + config.church.id + "?category=" + encodeURIComponent(post.category) + "&pageSize=4", "ContentApi", sdSlug);
      related = (Array.isArray(sameCategory) ? sameCategory : []).filter((p) => p.id !== post.id).slice(0, 3);
    } catch { related = []; }
  }
  return { config, post, related };
};

const excerptOf = (post: PostInterface) => post.excerpt || (post.content || "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*_`~]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);

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
  return MetaHelper.getMetaData(post.title + " - " + config.church.name, excerptOf(post), undefined, appearance);
}

export default async function BlogPostPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, postSlug } = await params;
  const { config, post, related } = await loadSharedData(sdSlug, postSlug);
  if (!post?.id) return notFound();

  const base = await getBaseUrl(sdSlug);
  const url = base + "/blog/" + postSlug;

  return (
    <>
      <Theme config={config} />
      <BlogPostingJsonLd config={config} post={post} url={url} />
      <DefaultPageWrapper config={config}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <div id="mainContent">
            <Typography variant="h3" component="h1">{post.title}</Typography>
            {(post.authorName || post.publishDate) && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                {[post.authorName ? "By " + post.authorName : "", formatDate(post.publishDate)].filter(Boolean).join(" · ")}
              </Typography>
            )}
            {(post.category || post.tags) && (
              <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {post.category && (
                  <Link href={"/blog?category=" + encodeURIComponent(post.category)} style={{ textDecoration: "none" }}>
                    <Chip size="small" label={post.category} clickable />
                  </Link>
                )}
                {post.tags?.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <Link key={t} href={"/blog?tag=" + encodeURIComponent(t)} style={{ textDecoration: "none" }}>
                    <Chip size="small" variant="outlined" label={t} clickable />
                  </Link>
                ))}
              </Box>
            )}
            {post.photoUrl && (
              <Box component="img" src={post.photoUrl} alt={post.title || ""} sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 2, mt: 3, display: "block" }} />
            )}
            {post.content && <Box sx={{ mt: 3 }}><MarkdownPreviewLight value={post.content} /></Box>}
            {related.length > 0 && (
              <Box sx={{ mt: 6, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="h5" component="h2" sx={{ mb: 2 }}>More in {post.category}</Typography>
                <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" } }}>
                  {related.map((r) => (
                    <Box key={r.id}>
                      {r.photoUrl && (
                        <Link href={"/blog/" + r.slug}>
                          <Box component="img" src={r.photoUrl} alt={r.title || ""} sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 1, display: "block" }} />
                        </Link>
                      )}
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>
                        <Link href={"/blog/" + r.slug}>{r.title}</Link>
                      </Typography>
                      {r.publishDate && <Typography variant="caption" color="text.secondary">{formatDate(r.publishDate)}</Typography>}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </div>
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
