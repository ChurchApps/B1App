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
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
          <div id="mainContent">
            <Box component="header" sx={{ textAlign: "center", maxWidth: 720, mx: "auto" }}>
              <Link href={post.category ? "/blog?category=" + encodeURIComponent(post.category) : "/blog"} style={{ textDecoration: "none" }}>
                <Typography component="span" sx={{ textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.75rem", fontWeight: 700, color: "primary.main" }}>
                  {post.category || "Blog"}
                </Typography>
              </Link>
              <Typography variant="h3" component="h1" sx={{ mt: 1.5, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.01em", textWrap: "balance", fontSize: { xs: "2rem", md: "2.75rem" } }}>
                {post.title}
              </Typography>
              {(post.authorName || post.publishDate) && (
                <Typography sx={{ mt: 2, color: "text.secondary", fontSize: "0.95rem" }}>
                  {[post.authorName ? "By " + post.authorName : "", formatDate(post.publishDate)].filter(Boolean).join(" · ")}
                </Typography>
              )}
              <Box sx={{ width: 40, height: 3, borderRadius: 2, backgroundColor: "primary.main", mx: "auto", mt: 3 }} />
            </Box>

            {post.photoUrl && (
              <Box component="img" src={post.photoUrl} alt={post.title || ""} sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 3, mt: 5, display: "block" }} />
            )}

            {post.content && (
              <Box sx={{
                maxWidth: 720,
                mx: "auto",
                mt: 5,
                fontSize: "1.0625rem",
                lineHeight: 1.75,
                "& p": { mt: 0, mb: 2.5 },
                "& h1, & h2, & h3, & h4": { mt: 4.5, mb: 1.5, lineHeight: 1.25 },
                "& img": { maxWidth: "100%", height: "auto", borderRadius: 2 },
                "& blockquote": { borderLeft: "3px solid", borderColor: "primary.main", pl: 2.5, mx: 0, my: 3, color: "text.secondary" },
                "& ul, & ol": { pl: 3, mb: 2.5 },
                "& li": { mb: 0.75 },
                "& hr": { border: 0, borderTop: "1px solid", borderColor: "divider", my: 4 }
              }}>
                <MarkdownPreviewLight value={post.content} />
              </Box>
            )}

            {post.tags && (
              <Box sx={{ maxWidth: 720, mx: "auto", mt: 5, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1 }}>
                {post.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <Link key={t} href={"/blog?tag=" + encodeURIComponent(t)} style={{ textDecoration: "none" }}>
                    <Chip size="small" variant="outlined" label={t} clickable />
                  </Link>
                ))}
              </Box>
            )}

            {related.length > 0 && (
              <Box component="aside" sx={{ mt: 8, pt: 5, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography component="h2" sx={{ textAlign: "center", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.75rem", fontWeight: 700, color: "text.secondary" }}>
                  More in {post.category}
                </Typography>
                <Box sx={{ mt: 3, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "repeat(" + Math.min(related.length, 3) + ", 1fr)" } }}>
                  {related.map((r) => (
                    <Box key={r.id} sx={{ "&:hover img": { opacity: 0.9 }, "&:hover a": { textDecoration: "underline" } }}>
                      {r.photoUrl && (
                        <Link href={"/blog/" + r.slug}>
                          <Box component="img" src={r.photoUrl} alt={r.title || ""} sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 2, display: "block", transition: "opacity .15s" }} />
                        </Link>
                      )}
                      <Typography variant="subtitle1" sx={{ mt: 1.5, fontWeight: 600, lineHeight: 1.3 }}>
                        <Link href={"/blog/" + r.slug} style={{ textDecoration: "none", color: "inherit" }}>{r.title}</Link>
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
