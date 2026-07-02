import React from "react";
import type { ChurchInterface, SermonInterface } from "@churchapps/helpers";
import { getSermonEmbed } from "@/helpers/sermonEmbed";

interface Props { church: ChurchInterface; sermon: SermonInterface; }

export function SermonJsonLd({ church, sermon }: Props) {
  if (!sermon?.title) return null;
  const { embedUrl, contentUrl } = getSermonEmbed(sermon);

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

  if (!video.embedUrl && !video.contentUrl && !video.thumbnailUrl) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(video) }} />;
}
