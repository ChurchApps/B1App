"use client";

import React from "react";
import { Box, Skeleton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import type { PostInterface } from "@/helpers/interfaces";
import { PageHead, Plate, PlateSection, QuietEmpty } from "../kit";
import { PostBody, postMeta } from "../NewsCard";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

// One blog post opened from Home or All news, by slug.
export const PostDetail = ({ id, config }: Props) => {
  const churchId = config?.church?.id;
  const { data: post = null, isLoading } = useQuery<PostInterface | null>({
    queryKey: ["news-post", churchId, id],
    queryFn: async () => {
      try {
        const data = await ApiHelper.getAnonymous(`/posts/public/${churchId}/slug/${encodeURIComponent(id)}`, "ContentApi");
        return data?.id ? data : null;
      } catch { return null; }
    },
    enabled: !!churchId && !!id,
    staleTime: 5 * 60 * 1000
  });

  return (
    <Box sx={{ pb: "24px" }}>
      <PageHead title={post?.title || (isLoading ? " " : Locale.label("mobile.news.notFound"))} lede={post ? postMeta(post) : undefined} />
      <Plate>
        <PlateSection>
          {isLoading && <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "16 / 9", height: "auto", borderRadius: "8px" }} />}
          {!isLoading && !post && <QuietEmpty>{Locale.label("mobile.news.notFound")}</QuietEmpty>}
          {post && <PostBody post={post} byline={false} />}
        </PlateSection>
      </Plate>
    </Box>
  );
};
