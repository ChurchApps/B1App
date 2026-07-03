// Avoid brittle "first row" lookups; seed data IDs in Api/tools/dbScripts/{module}/demo.sql.

export const DEMO_CHURCH = {
  ID: "CHU00000001",
  NAME: "Grace Community Church",
  SUBDOMAIN: "grace"
} as const;

export const SEED_PEOPLE = {
  DONALD: "Donald Clark",
  CAROL: "Carol Clark",
  DOROTHY: "Dorothy Jackson",
  JENNIFER: "Jennifer Williams",
  PATRICIA: "Patricia Moore",
  ROBERT: "Robert Moore",
  DEMO: "Demo User"
} as const;

export const SEED_PAGES = { HOME: { id: "PAG00000001", url: "/", title: "Home" } } as const;

export const SEED_PLAYLISTS = {
  SUNDAY_SERMONS: { id: "PLY00000001", title: "Sunday Sermons 2025-2026" },
  SPECIAL_SERVICES: { id: "PLY00000002", title: "Special Services" },
  BIBLE_STUDY: { id: "PLY00000003", title: "Bible Study Series" },
  CHRISTMAS: { id: "PLY00000004", title: "Christmas Services" },
  EASTER: { id: "PLY00000005", title: "Easter Services" }
} as const;

export const SEED_SERMONS = {
  YOUTUBE_RECENT: { id: "SER00000001", title: "The Power of Faith", provider: "youtube" },
  VIMEO_SPECIAL: { id: "SER00000004", title: "Christmas Eve Service 2025", provider: "vimeo" },
  YOUTUBE_BIBLE_STUDY: { id: "SER00000006", title: "Understanding the Book of Romans - Part 1", provider: "youtube" }
} as const;

export const SEED_NAV_LINKS = {
  HOME: { url: "/", text: "Home" },
  ABOUT: { url: "/about", text: "About" },
  MINISTRIES: { url: "/ministries", text: "Ministries" },
  SERMONS: { url: "/sermons", text: "Sermons" },
  EVENTS: { url: "/events", text: "Events" },
  GIVE: { url: "/give", text: "Give" }
} as const;

export type SeedPersonName = (typeof SEED_PEOPLE)[keyof typeof SEED_PEOPLE];
