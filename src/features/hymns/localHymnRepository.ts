import type { Hymn, HymnQuery, HymnRepository } from "./types";

// Development-only content. Replace this provider with an authenticated API-backed
// implementation when the ChurchApps Hymns API and permissions are available.
const demoHymns: Hymn[] = [
  {
    id: "demo-light-of-grace",
    hymnNumber: 1,
    title: "Light of Grace",
    language: "English",
    lyrics: "Verse 1\nThis is fictional demo text for local development.\nIt is not copied from a hymnbook.\n\nChorus\nLet every heart lift a song of grace,\nwith hope and peace in this gathering place.",
    englishLyrics: "Verse 1\nThis is fictional demo text for local development.\nIt is not copied from a hymnbook.\n\nChorus\nLet every heart lift a song of grace,\nwith hope and peace in this gathering place.",
    author: "ChurchApps demo collection",
    source: "Local development sample",
    copyrightStatus: "church-original",
    attribution: "Fictional development hymn — not for publication or worship use.",
    category: "Worship",
    publicationState: "published",
    active: true,
    collection: "B1App Demo Hymnal",
    tags: ["praise", "opening"]
  },
  {
    id: "demo-ife-ati-ireti",
    hymnNumber: 2,
    title: "Ìfẹ́ àti Ìrètí",
    language: "Yoruba",
    lyrics: "Ẹsẹ̀ 1\nÈyí jẹ́ ọ̀rọ̀ àpẹẹrẹ fún ìdàgbàsókè lórí ẹ̀rọ yìí.\nKò sí láti inú ìwé orin kankan.\n\nÌdáhùn\nKí ìfẹ́, ìrètí, àti àlàáfíà máa gbé wa ga.",
    yorubaLyrics: "Ẹsẹ̀ 1\nÈyí jẹ́ ọ̀rọ̀ àpẹẹrẹ fún ìdàgbàsókè lórí ẹ̀rọ yìí.\nKò sí láti inú ìwé orin kankan.\n\nÌdáhùn\nKí ìfẹ́, ìrètí, àti àlàáfíà máa gbé wa ga.",
    translator: "ChurchApps demo collection",
    source: "Local development sample",
    copyrightStatus: "church-original",
    attribution: "Àpẹẹrẹ ìdàgbàsókè péré — kì í ṣe orin ìjọ gidi.",
    category: "Thanksgiving",
    publicationState: "published",
    active: true,
    collection: "B1App Demo Hymnal",
    tags: ["yoruba", "gratitude"]
  },
  {
    id: "demo-one-church",
    hymnNumber: 3,
    title: "One Church, One Hope",
    language: "Bilingual",
    lyrics: "English\nWe gather as one church with one hope.\n\nYorùbá\nA péjọ gẹ́gẹ́ bí ìjọ kan pẹ̀lú ìrètí kan.\n\nThis fictional text demonstrates a bilingual hymn layout.",
    englishLyrics: "We gather as one church with one hope.",
    yorubaLyrics: "A péjọ gẹ́gẹ́ bí ìjọ kan pẹ̀lú ìrètí kan.",
    author: "ChurchApps demo collection",
    translator: "ChurchApps demo collection",
    source: "Local development sample",
    copyrightStatus: "church-original",
    attribution: "Fictional development hymn — not for publication or worship use.",
    category: "Fellowship",
    publicationState: "published",
    active: true,
    collection: "B1App Demo Hymnal",
    tags: ["bilingual", "unity"]
  }
];

export class LocalHymnRepository implements HymnRepository {
  async list(query: HymnQuery = {}): Promise<Hymn[]> {
    return demoHymns.filter((hymn) => (
      (query.includeInactive || hymn.active)
      && (!query.publicationState || hymn.publicationState === query.publicationState)
    ));
  }

  async getById(id: string, query: HymnQuery = {}): Promise<Hymn | null> {
    const hymns = await this.list(query);
    return hymns.find((hymn) => hymn.id === id) ?? null;
  }
}

export const localHymnRepository = new LocalHymnRepository();
