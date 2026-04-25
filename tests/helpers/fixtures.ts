// Named seed entities known to exist in the reset demo database. Tests should
// reference these constants instead of brittle "first row" lookups, which are
// order-dependent and break when seed data changes.
//
// All IDs come from Api/tools/dbScripts/{module}/demo.sql. Adding a new state
// to test usually means inserting a new fixture row in demo.sql AND adding
// the matching constant here.

export const DEMO_CHURCH = {
  ID: "CHU00000001",
  NAME: "Grace Community Church",
  SUBDOMAIN: "grace",
} as const;

// People — shared with B1Admin (Api/tools/dbScripts/membership/demo.sql).
export const SEED_PEOPLE = {
  DONALD: "Donald Clark",
  CAROL: "Carol Clark",
  DOROTHY: "Dorothy Jackson",
  JENNIFER: "Jennifer Williams",
  PATRICIA: "Patricia Moore",
  ROBERT: "Robert Moore",
  DEMO: "Demo User",
} as const;

// Pages — Api/tools/dbScripts/content/demo.sql:303.
// Currently only one page is seeded (the home page). Phase 2 may extend this
// with PAG_DRAFT / PAG_HIDDEN to test multi-state rendering.
export const SEED_PAGES = {
  HOME: { id: "PAG00000001", url: "/", title: "Home" },
} as const;

// Playlists — Api/tools/dbScripts/content/demo.sql:508.
export const SEED_PLAYLISTS = {
  SUNDAY_SERMONS: { id: "PLY00000001", title: "Sunday Sermons 2025-2026" },
  SPECIAL_SERVICES: { id: "PLY00000002", title: "Special Services" },
  BIBLE_STUDY: { id: "PLY00000003", title: "Bible Study Series" },
  CHRISTMAS: { id: "PLY00000004", title: "Christmas Services" },
  EASTER: { id: "PLY00000005", title: "Easter Services" },
} as const;

// Sermons — Api/tools/dbScripts/content/demo.sql:516. Each fixture covers a
// distinct video provider / state combination so tests can assert per-state.
export const SEED_SERMONS = {
  YOUTUBE_RECENT: { id: "SER00000001", title: "The Power of Faith", provider: "youtube" },
  VIMEO_SPECIAL: { id: "SER00000004", title: "Christmas Eve Service 2025", provider: "vimeo" },
  YOUTUBE_BIBLE_STUDY: { id: "SER00000006", title: "Understanding the Book of Romans - Part 1", provider: "youtube" },
} as const;

// Public navigation links — Api/tools/dbScripts/content/demo.sql:589.
export const SEED_NAV_LINKS = {
  HOME: { url: "/", text: "Home", visibility: "everyone" },
  ABOUT: { url: "/about", text: "About", visibility: "everyone" },
  MINISTRIES: { url: "/ministries", text: "Ministries", visibility: "everyone" },
  SERMONS: { url: "/sermons", text: "Sermons", visibility: "everyone" },
  EVENTS: { url: "/events", text: "Events", visibility: "everyone" },
  GIVE: { url: "/give", text: "Give", visibility: "everyone" },
  MEMBERS_AREA: { url: "/members", text: "Members Area", visibility: "members" },
  YOUTH: { url: "/youth", text: "Youth", visibility: "groups" },
} as const;

export type SeedPersonName = (typeof SEED_PEOPLE)[keyof typeof SEED_PEOPLE];
