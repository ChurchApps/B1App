import type { SermonInterface } from "@churchapps/helpers";

export const getSermonEmbed = (sermon: SermonInterface): { embedUrl?: string; contentUrl?: string } => {
  const { videoType, videoData, videoUrl } = sermon;
  if (videoType && videoData) {
    switch (videoType) {
      case "youtube": return { embedUrl: "https://www.youtube.com/embed/" + videoData + "?rel=0&modestbranding=1", contentUrl: "https://www.youtube.com/watch?v=" + videoData };
      case "youtube_channel": return { embedUrl: "https://www.youtube.com/embed/live_stream?channel=" + videoData, contentUrl: "https://www.youtube.com/channel/" + videoData + "/live" };
      case "vimeo": return { embedUrl: "https://player.vimeo.com/video/" + videoData, contentUrl: "https://vimeo.com/" + videoData };
      case "facebook": return { embedUrl: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D" + videoData, contentUrl: "https://www.facebook.com/video.php?v=" + videoData };
      default: return { embedUrl: videoData, contentUrl: videoData };
    }
  }
  if (videoUrl) return { embedUrl: videoUrl, contentUrl: videoUrl };
  return {};
};
