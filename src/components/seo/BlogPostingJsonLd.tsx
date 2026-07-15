import React from "react";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import type { PostInterface } from "@/helpers/interfaces";

interface Props { config: ConfigurationInterface; post: PostInterface; url: string; }

export function BlogPostingJsonLd({ config, post, url }: Props) {
  const church = config.church;
  if (!church?.name || !post?.title) return null;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: { "@type": "Organization", name: church.name }
  };

  if (post.authorName) data.author = { "@type": "Person", name: post.authorName };
  if (post.excerpt) data.description = post.excerpt;
  if (post.photoUrl) data.image = post.photoUrl;
  if (post.category) data.articleSection = post.category;
  if (post.tags) data.keywords = post.tags;
  if (post.publishDate) {
    const d = new Date(post.publishDate);
    if (!isNaN(d.getTime())) data.datePublished = d.toISOString();
  }

  const logo = config.appearance?.logoLight || config.appearance?.logoDark;
  if (logo) (data.publisher as Record<string, unknown>).logo = { "@type": "ImageObject", url: logo };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
