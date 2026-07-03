// membersSearch absent: must reach ScreenRouter to run its redirect per-navigation.
const TAB_ALIASES: Record<string, string> = {
  myGroups: "groups",
  donation: "donate",
  service: "checkin",
  plan: "plans",
  volunteerBrowse: "volunteer",
  searchMessageUser: "messages"
};

// Tabs keeping transient state. Excluded: media (stream/lessons), query-dependent (page/websiteUrl), auth/edit, redirects (membersSearch), details, unknowns.
const KEEP_ALIVE_TABS = new Set([
  "dashboard",
  "more",
  "me",
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
