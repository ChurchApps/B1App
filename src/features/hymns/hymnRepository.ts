import { apiHymnRepository } from "./apiHymnRepository";
import type { HymnRepository } from "./types";

// Public hymn browsing uses the church-scoped Content API. Keep the UI coupled
// to the repository contract so the demo repository can still be selected locally.
export const hymnRepository: HymnRepository = apiHymnRepository;
