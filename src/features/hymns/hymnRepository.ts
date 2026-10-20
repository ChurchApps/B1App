import { apiHymnRepository } from "./apiHymnRepository";
import type { HymnRepository } from "./types";

// The UI depends on this contract, not on a transport. Replace this binding with
// a real ChurchApps API adapter only after the backend publishes its endpoints.
export const hymnRepository: HymnRepository = apiHymnRepository;
