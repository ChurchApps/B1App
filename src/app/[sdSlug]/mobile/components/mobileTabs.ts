// Slug aliases whose canonical target is a kept-alive tab (mirrors the
// ScreenRouter switch). membersSearch is intentionally absent: it must reach
// ScreenRouter to run its redirect, so it stays a per-navigation render.
const TAB_ALIASES: Record<string, string> = {
  myGroups: "groups",
  donation: "donate",
  service: "checkin",
  plan: "plans",
  volunteerBrowse: "volunteer",
  searchMessageUser: "messages"
};

// Tabs whose transient UI state is worth keeping mounted across switches.
// Excluded on purpose: stream/lessons (background media), page/websiteUrl
// (query-string dependent), membersSearch (redirect), login, profileEdit,
// notifications/compose, details, and unknown slugs.
const KEEP_ALIVE_TABS = new Set([
  "dashboard",
  "more",
  "sermons",
  "groups",
  "community",
  "donate",
  "checkin",
  "plans",
  "votd",
  "bible",
  "registrations",
  "volunteer",
  "messages"
]);

export function canonicalTab(pageSlug: string): string | undefined {
  const canonical = TAB_ALIASES[pageSlug] ?? pageSlug;
  return KEEP_ALIVE_TABS.has(canonical) ? canonical : undefined;
}
