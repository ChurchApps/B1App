import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";

// The public sermon list, newest first. The member app's "Watch latest" and /sermons/latest both take the first one.
export const newestSermonsFirst = (result: unknown): SermonInterface[] => {
  const list: SermonInterface[] = Array.isArray(result)
    ? result.filter((s: SermonInterface) => s && s.id && s.title)
    : [];
  list.sort((a, b) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime());
  return list;
};

// A sermon without its own image uses its playlist (series) image.
export const sermonThumbnail = (sermon: SermonInterface, playlists?: PlaylistInterface[] | null): string | undefined =>
  sermon.thumbnail?.trim()
  || (sermon.playlistId ? playlists?.find((p) => p.id === sermon.playlistId)?.thumbnail?.trim() : undefined)
  || undefined;
