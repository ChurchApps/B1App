"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import type { PostInterface } from "@/helpers/interfaces";
import { mobileTheme } from "./mobileTheme";
import { cssUrl, formatDate } from "./util";
import { Sheet, TextLink } from "./kit";

const tc = mobileTheme.colors;

export const postMeta = (post: PostInterface) => [post.authorName, formatDate(post.publishDate)].filter(Boolean).join(" · ");

// A Home "News" slide: the post photo with its title and date over a gradient, like the photo tiles.
export const NewsCard = ({ post, onOpen, "data-testid": testId }: { post: PostInterface; onOpen: (post: PostInterface) => void; "data-testid"?: string }) => (
  <Box
    component="button"
    type="button"
    data-testid={testId}
    onClick={() => onOpen(post)}
    sx={{
      position: "relative",
      width: "100%",
      aspectRatio: "16 / 9",
      borderRadius: "10px",
      overflow: "hidden",
      border: 0,
      p: 0,
      display: "block",
      textAlign: "left",
      cursor: "pointer",
      background: `${cssUrl(post.photoUrl)} center / cover no-repeat, ${mobileTheme.colorWash}`,
      "&:active": { transform: "scale(0.985)" },
      transition: "transform 120ms ease"
    }}
  >
    <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, pt: 4, pb: "10px", px: "12px", background: "linear-gradient(transparent, rgba(7,14,27,0.78))" }}>
      <Typography sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{post.title}</Typography>
      {post.publishDate && <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, mt: "2px" }}>{formatDate(post.publishDate, "short")}</Typography>}
    </Box>
  </Box>
);

// The full post: photo, byline, markdown body, and the same post on the church website.
export const PostBody = ({ post, byline = true }: { post: PostInterface; byline?: boolean }) => (
  <Box data-testid="news-post-body">
    {post.photoUrl && <Box component="img" src={post.photoUrl} alt="" sx={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: "8px", display: "block", mb: "12px" }} />}
    {byline && postMeta(post) && <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, mb: "12px" }}>{postMeta(post)}</Typography>}
    {post.content && <Box sx={{ color: tc.text, fontSize: 15, "& img": { maxWidth: "100%" } }}><MarkdownPreviewLight value={post.content} /></Box>}
    {post.slug && (
      <TextLink href={`/blog/${post.slug}`} target="_blank" rel="noopener" sx={{ display: "inline-flex", alignItems: "center", gap: "4px", mt: "12px" }}>
        {Locale.label("mobile.news.viewOnWebsite")}<OpenInNewIcon sx={{ fontSize: 16 }} />
      </TextLink>
    )}
  </Box>
);

export const PostSheet = ({ post, onClose }: { post: PostInterface | null; onClose: () => void }) => (
  <Sheet open={!!post} onClose={onClose} title={post?.title || ""}>
    {post && <PostBody post={post} />}
  </Sheet>
);
