import type { SermonInterface } from "@churchapps/helpers";

// Sermons can carry an audio file (the church podcast feed is built from it); helpers bundled
// with B1App may not declare the field yet.
export type SermonWithAudio = SermonInterface & { audioUrl?: string };

export const safeHttpUrl = (url?: string | null) => (url && /^https?:\/\//i.test(url) ? url : null);

export const buildEmbedUrl = (sermon: SermonInterface | null): string | null => {
  if (!sermon) return null;
  const { videoType, videoData, videoUrl } = sermon;

  if (videoType && videoData) {
    switch (videoType) {
      case "youtube": return `https://www.youtube.com/embed/${videoData}?autoplay=1&rel=0&modestbranding=1`;
      case "youtube_channel": return `https://www.youtube.com/embed/live_stream?channel=${videoData}&autoplay=1`;
      case "vimeo": return `https://player.vimeo.com/video/${videoData}?autoplay=1`;
      case "facebook": return `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D${videoData}&show_text=0&autoplay=1&allowFullScreen=1`;
      default: return safeHttpUrl(videoData);
    }
  }

  return safeHttpUrl(videoUrl);
};

export const buildExternalUrl = (sermon: SermonInterface | null): string | null => {
  if (!sermon) return null;
  const { videoType, videoData, videoUrl } = sermon;

  if (videoType && videoData) {
    switch (videoType) {
      case "youtube": return `https://www.youtube.com/watch?v=${videoData}`;
      case "youtube_channel": return `https://www.youtube.com/channel/${videoData}/live`;
      case "vimeo": return `https://vimeo.com/${videoData}`;
      case "facebook": return `https://www.facebook.com/video.php?v=${videoData}`;
      default: return safeHttpUrl(videoData);
    }
  }

  return safeHttpUrl(videoUrl);
};

export const sermonAudioUrl = (sermon: SermonInterface | null) => safeHttpUrl((sermon as SermonWithAudio | null)?.audioUrl);

export const sermonHasVideo = (sermon: SermonInterface | null) => !!buildEmbedUrl(sermon);

// The Api redirects to the stored file as an attachment named after the sermon, so no website request has to stay
// open for the whole transfer (the old /api/podcast/download relay was cut off on long sermons).
export const sermonDownloadHref = (contentApiBase: string, churchId: string, sermonId: string) =>
  `${contentApiBase}/sermons/public/download/${encodeURIComponent(churchId)}/${encodeURIComponent(sermonId)}`;
