import { ApiHelper } from "@churchapps/apphelper";
import type { Hymn, HymnQuery, HymnRepository } from "./types";

const publicPath = (churchId: string, id?: string) => `/hymns/public/${encodeURIComponent(churchId)}${id ? `/${encodeURIComponent(id)}` : ""}`;

const mapHymn = (hymn: Hymn & { number?: number; published?: boolean; archived?: boolean; copyright?: string }): Hymn => ({
  ...hymn,
  hymnNumber: hymn.number ?? hymn.hymnNumber,
  publicationState: hymn.archived ? "archived" : hymn.published ? "published" : "draft",
  active: !hymn.archived,
  copyrightStatus: hymn.copyright ? "licensed" : "unknown",
  category: hymn.category || "General"
});

export class ApiHymnRepository implements HymnRepository {
  async list(query: HymnQuery = {}): Promise<Hymn[]> {
    if (!query.churchId) return [];
    const hymns = await ApiHelper.getAnonymous(publicPath(query.churchId), "ContentApi");
    return (hymns || []).map(mapHymn);
  }

  async getById(id: string, query: HymnQuery = {}): Promise<Hymn | null> {
    if (!query.churchId) return null;
    const hymn = await ApiHelper.getAnonymous(publicPath(query.churchId, id), "ContentApi");
    return hymn ? mapHymn(hymn) : null;
  }
}

export const apiHymnRepository = new ApiHymnRepository();
