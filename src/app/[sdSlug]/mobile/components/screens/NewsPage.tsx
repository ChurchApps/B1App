"use client";

import React from "react";
import { Box, Skeleton } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, Thumb } from "../kit";
import { formatDate } from "../util";
import { useLatestPosts } from "../HomeTeasers";

interface Props {
  config: ConfigurationInterface;
}

// "All news": the church's published blog posts, limited to the category picked for Home (B1Admin > Member portal).
export const NewsPage = ({ config }: Props) => {
  const appearance = config?.appearance as Record<string, string> | undefined;
  const category = (appearance?.mobileHomeNewsCategory || "").trim() || undefined;
  const { posts, isLoading } = useLatestPosts(config?.church?.id, 20, category, true);

  return (
    <Box sx={{ pb: "24px" }}>
      <PageHead title={Locale.label("mobile.dashboard.news")} />
      <Plate>
        <PlateSection>
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} variant="text" height={56} />)}
          {!isLoading && posts.length === 0 && <QuietEmpty>{Locale.label("mobile.news.empty")}</QuietEmpty>}
          {posts.length > 0 && (
            <RowList>
              {posts.map((p) => (
                <Row
                  key={p.id}
                  data-testid="news-row"
                  href={`/mobile/news/${encodeURIComponent(p.slug || "")}`}
                  leading={<Thumb src={p.photoUrl} width={96} height={54} />}
                  title={p.title}
                  subtitle={formatDate(p.publishDate, "short")}
                  chevron
                />
              ))}
            </RowList>
          )}
        </PlateSection>
      </Plate>
    </Box>
  );
};
