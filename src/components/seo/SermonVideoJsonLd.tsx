import React from "react";
import type { SermonInterface } from "@churchapps/helpers";
import { fetchCached, type ConfigurationInterface } from "@/helpers/ConfigHelper";
import type { PageInterface } from "@/helpers/interfaces";
import { containsElementType } from "./pageElements";

interface Props { config: ConfigurationInterface; pageData?: PageInterface; sdSlug: string; sermonsPage?: boolean; }

const MAX_SERMONS = 25;

const sermonUrls = (sermon: SermonInterface): { embedUrl?: string; contentUrl?: string } => {
  const { videoType, videoData, videoUrl } = sermon;
  if (videoType && videoData) {
    switch (videoType) {
      case "youtube": return { embedUrl: "https://www.youtube.com/embed/" + videoData, contentUrl: "https://www.youtube.com/watch?v=" + videoData };
      case "youtube_channel": return { embedUrl: "https://www.youtube.com/embed/live_stream?channel=" + videoData, contentUrl: "https://www.youtube.com/channel/" + videoData + "/live" };
      case "vimeo": return { embedUrl: "https://player.vimeo.com/video/" + videoData, contentUrl: "https://vimeo.com/" + videoData };
      case "facebook": return { embedUrl: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D" + videoData, contentUrl: "https://www.facebook.com/video.php?v=" + videoData };
      default: return { embedUrl: videoData, contentUrl: videoData };
    }
  }
  if (videoUrl) return { embedUrl: videoUrl, contentUrl: videoUrl };
  return {};
};

export async function SermonVideoJsonLd({ config, pageData, sdSlug, sermonsPage }: Props) {
  try {
    const church = config.church;
    if (!church?.id) return null;
    if (!sermonsPage && !containsElementType(pageData?.sections, "sermons")) return null;

    const sermons = await fetchCached<SermonInterface[]>("/sermons/public/" + church.id, "ContentApi", sdSlug);
    if (!Array.isArray(sermons) || sermons.length === 0) return null;

    const data = sermons
      .filter((s) => s?.title)
      .slice(0, MAX_SERMONS)
      .map((sermon) => {
        const { embedUrl, contentUrl } = sermonUrls(sermon);
        const video: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: sermon.title,
          publisher: { "@type": "Organization", name: church.name }
        };
        if (sermon.description) video.description = sermon.description;
        if (sermon.thumbnail) video.thumbnailUrl = sermon.thumbnail;
        if (sermon.publishDate) {
          const d = new Date(sermon.publishDate);
          if (!isNaN(d.getTime())) video.uploadDate = d.toISOString();
        }
        if (embedUrl) video.embedUrl = embedUrl;
        if (contentUrl) video.contentUrl = contentUrl;
        if (typeof sermon.duration === "number" && sermon.duration > 0) video.duration = "PT" + Math.round(sermon.duration) + "S";
        return video;
      })
      .filter((v) => v.embedUrl || v.contentUrl || v.thumbnailUrl);

    if (data.length === 0) return null;
    const payload = data.length === 1 ? data[0] : data;
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />;
  } catch {
    return null;
  }
}
