import React, { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { Theme } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface, fetchCached } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { getSermonEmbed } from "@/helpers/sermonEmbed";
import { SermonJsonLd } from "@/components/seo/SermonJsonLd";
import { DefaultPageWrapper } from "../../[pageSlug]/components/DefaultPageWrapper";
import { Animate } from "@churchapps/apphelper/website";
import "@/styles/vendor/animations.css";

type PageParams = Promise<{ sdSlug: string; sermonId: string; }>;

const loadSharedData = cache((sdSlug: string, sermonId: string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug, sermonId);
});

const loadData = async (sdSlug: string, sermonId: string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  const sermons = await fetchCached<SermonInterface[]>("/sermons/public/" + config.church.id, "ContentApi", sdSlug);
  const sermon = Array.isArray(sermons) ? sermons.find((s) => s.id === sermonId) || null : null;

  let playlistTitle: string | undefined;
  if (sermon?.playlistId) {
    try {
      const playlists = await fetchCached<PlaylistInterface[]>("/playlists/public/" + config.church.id, "ContentApi", sdSlug);
      playlistTitle = Array.isArray(playlists) ? playlists.find((p) => p.id === sermon.playlistId)?.title : undefined;
    } catch { /* playlist name is optional */ }
  }
  return { config, sermon, playlistTitle };
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, sermonId } = await params;
  const { config, sermon } = await loadSharedData(sdSlug, sermonId);
  if (!sermon) return MetaHelper.getMetaData(config.church.name, undefined, undefined, config.appearance);

  const title = (sermon.title || config.church.name) + " - " + config.church.name;
  const metadata = MetaHelper.getMetaData(title, sermon.description, undefined, config.appearance);
  if (sermon.thumbnail && metadata.openGraph) {
    metadata.openGraph.images = [{ url: sermon.thumbnail }];
  }
  return metadata;
}

export default async function SermonPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, sermonId } = await params;
  const { config, sermon, playlistTitle } = await loadSharedData(sdSlug, sermonId);
  if (!sermon) return notFound();

  const { embedUrl } = getSermonEmbed(sermon);
  const publishDate = sermon.publishDate ? new Date(sermon.publishDate) : null;
  const dateLabel = publishDate && !isNaN(publishDate.getTime())
    ? publishDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <>
      <Theme config={config} />
      <SermonJsonLd church={config.church} sermon={sermon} />
      <DefaultPageWrapper config={config}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {embedUrl
            ? <div className="videoWrapper"><iframe src={embedUrl} title={sermon.title} allowFullScreen style={{ border: 0 }} allow="autoplay; fullscreen; picture-in-picture" /></div>
            : (sermon.thumbnail && <img src={sermon.thumbnail} alt={sermon.title} style={{ width: "100%", height: "auto" }} />)}
          {playlistTitle && <div style={{ marginTop: 16, textTransform: "uppercase", letterSpacing: 1, fontSize: 13, fontWeight: 600, color: "#666" }}>{playlistTitle}</div>}
          <h1 style={{ marginTop: 8 }}>{sermon.title}</h1>
          {dateLabel && <p style={{ color: "#666", marginTop: 0 }}>{dateLabel}</p>}
          {sermon.description && <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{sermon.description}</p>}
        </div>
      </DefaultPageWrapper>
      <Animate />
    </>
  );
}
