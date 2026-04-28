import { Locale } from "@churchapps/apphelper";

// Most existing consumers read `mobileTheme.radius.lg` and `mobileTheme.shadows.md`
// inside template literals (e.g. `borderRadius: \`${mobileTheme.radius.xl}px\``).
// `radius` keeps its numeric type for backwards-compat; `radiusVar` exposes the
// CSS-variable equivalent for new code that wants to inherit admin overrides.
export const mobileTheme = {
  colors: {
    primary: "var(--mb-primary)",
    primaryLight: "var(--mb-primary-light)",
    secondary: "var(--mb-secondary)",
    accent: "var(--mb-accent)",
    background: "var(--mb-background)",
    surface: "var(--mb-surface)",
    surfaceVariant: "var(--mb-surface-variant)",
    text: "var(--mb-text)",
    textSecondary: "var(--mb-text-secondary)",
    textMuted: "var(--mb-text-muted)",
    textHint: "var(--mb-text-hint)",
    onPrimary: "var(--mb-on-primary)",
    success: "var(--mb-success)",
    warning: "var(--mb-warning)",
    error: "var(--mb-error)",
    border: "var(--mb-border)",
    borderLight: "var(--mb-border-light)",
    divider: "var(--mb-divider)",
    iconBackground: "var(--mb-icon-background)",
    disabled: "var(--mb-disabled)"
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 12, xl: 16 },
  radiusVar: { sm: "var(--mb-radius-sm)", md: "var(--mb-radius-md)", lg: "var(--mb-radius-lg)", xl: "var(--mb-radius-xl)" },
  typography: {
    h1: { fontSize: 24, fontWeight: 700 },
    h2: { fontSize: 20, fontWeight: 600 },
    h3: { fontSize: 18, fontWeight: 600 },
    body: { fontSize: 16, fontWeight: 400 },
    bodySmall: { fontSize: 14, fontWeight: 400 },
    caption: { fontSize: 12, fontWeight: 400 },
    label: { fontSize: 14, fontWeight: 500 }
  },
  shadows: {
    sm: "var(--mb-shadow-sm)",
    md: "var(--mb-shadow-md)",
    lg: "var(--mb-shadow-lg)"
  },
  drawerWidth: 280,
  headerHeight: 56
};

export const SCREEN_TITLES: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    const map: Record<string, string> = {
      myGroups: Locale.label("mobile.screenTitles.myGroups"),
      groups: Locale.label("mobile.screenTitles.myGroups"),
      groupDetails: Locale.label("mobile.screenTitles.groupDetails"),
      notifications: Locale.label("mobile.screenTitles.notifications"),
      votd: Locale.label("mobile.screenTitles.votd"),
      service: Locale.label("mobile.screenTitles.checkin"),
      checkin: Locale.label("mobile.screenTitles.checkin"),
      donation: Locale.label("mobile.screenTitles.donation"),
      donate: Locale.label("mobile.screenTitles.donation"),
      membersSearch: Locale.label("mobile.screenTitles.directory"),
      community: Locale.label("mobile.screenTitles.directory"),
      memberDetail: Locale.label("mobile.screenTitles.memberDetail"),
      plan: Locale.label("mobile.screenTitles.plans"),
      plans: Locale.label("mobile.screenTitles.plans"),
      planDetails: Locale.label("mobile.screenTitles.planDetails"),
      sermons: Locale.label("mobile.screenTitles.sermons"),
      sermonDetails: Locale.label("mobile.screenTitles.sermonDetails"),
      playlist: Locale.label("mobile.screenTitles.playlist"),
      playlistDetails: Locale.label("mobile.screenTitles.playlist"),
      searchMessageUser: Locale.label("mobile.screenTitles.messages"),
      messages: Locale.label("mobile.screenTitles.messages"),
      messagesNew: Locale.label("mobile.screenTitles.newMessage"),
      composeMessage: Locale.label("mobile.screenTitles.newMessage"),
      registrations: Locale.label("mobile.screenTitles.registrations"),
      register: Locale.label("mobile.screenTitles.register"),
      volunteerBrowse: Locale.label("mobile.screenTitles.volunteerOpportunities"),
      volunteer: Locale.label("mobile.screenTitles.volunteer"),
      volunteerSignup: Locale.label("mobile.screenTitles.volunteer"),
      profileEdit: Locale.label("mobile.screenTitles.profileEdit"),
      stream: Locale.label("mobile.screenTitles.stream"),
      bible: Locale.label("mobile.screenTitles.bible"),
      lessons: Locale.label("mobile.screenTitles.lessons"),
      login: Locale.label("mobile.screenTitles.signIn"),
      install: Locale.label("mobile.screenTitles.installApp"),
      page: "",
      websiteUrl: ""
    };
    return map[prop];
  }
});

export const mobileSlugFromPath = (pathname: string | null | undefined): string => {
  if (!pathname) return "";
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("mobile");
  if (idx === -1) return "";
  return parts[idx + 1] || "dashboard";
};

export const linkTypeToImage = (linkType?: string, text?: string): string => {
  if (text && text.toLowerCase() === "chums") return "/mobile/images/dash_chums.png";
  switch ((linkType || "").toLowerCase()) {
    case "groups": return "/mobile/images/dash_worship.png";
    case "bible": return "/mobile/images/dash_bible.png";
    case "votd": return "/mobile/images/dash_votd.png";
    case "lessons": return "/mobile/images/dash_lessons.png";
    case "checkin": return "/mobile/images/dash_checkin.png";
    case "donation": return "/mobile/images/dash_donation.png";
    case "directory": return "/mobile/images/dash_directory.png";
    case "plans": return "/mobile/images/dash_votd.png";
    default: return "/mobile/images/dash_url.png";
  }
};

export const linkTypeToRoute = (
  linkType?: string,
  linkData?: string,
  text?: string,
  url?: string
): string | null => {
  switch (linkType) {
    case "groups": return "/mobile/groups";
    case "directory": return "/mobile/community";
    case "plans": return "/mobile/plans";
    case "checkin": return "/mobile/checkin";
    case "lessons": return "/mobile/lessons";
    case "donation": return "/mobile/donate";
    case "volunteer": return "/mobile/volunteer";
    case "bible": return "/mobile/bible";
    case "votd": return "/mobile/votd";
    case "sermons": return "/mobile/sermons";
    case "stream": return "/mobile/stream";
    case "registrations": return "/mobile/registrations";
    case "page": {
      const id = url || linkData || "";
      const params = new URLSearchParams();
      if (id) params.set("id", id);
      if (text) params.set("title", text);
      const qs = params.toString();
      return qs ? `/mobile/page?${qs}` : "/mobile/page";
    }
    case "url": {

      const target = url || linkData || "";
      return target || null;
    }
    default: return null;
  }
};

export const linkTypeToIcon = (linkType?: string, itemIcon?: string): string => {
  if (itemIcon) return itemIcon;
  switch ((linkType || "").toLowerCase()) {
    case "groups": return "groups";
    case "directory": return "people";
    case "plans": return "event_note";
    case "checkin": return "how_to_reg";
    case "lessons": return "menu_book";
    case "donation": return "volunteer_activism";
    case "volunteer": return "handshake";
    case "bible": return "menu_book";
    case "votd": return "auto_stories";
    case "sermons": return "play_circle";
    case "stream": return "live_tv";
    case "url": return "public";
    default: return "apps";
  }
};

// Short purpose-driven tagline per link type for hero cards. Returning null
// (default / generic types) lets callers omit the subtext line entirely
// instead of falling back to the generic "Tap to explore".
export const linkTypeToTagline = (linkType?: string): string | null => {
  switch ((linkType || "").toLowerCase()) {
    case "groups": return Locale.label("mobile.taglines.groups");
    case "directory": return Locale.label("mobile.taglines.directory");
    case "plans": return Locale.label("mobile.taglines.plans");
    case "checkin": return Locale.label("mobile.taglines.checkin");
    case "lessons": return Locale.label("mobile.taglines.lessons");
    case "donation": return Locale.label("mobile.taglines.donation");
    case "volunteer": return Locale.label("mobile.taglines.volunteer");
    case "bible": return Locale.label("mobile.taglines.bible");
    case "votd": return Locale.label("mobile.taglines.votd");
    case "sermons": return Locale.label("mobile.taglines.sermons");
    case "stream": return Locale.label("mobile.taglines.stream");
    case "registrations": return Locale.label("mobile.taglines.registrations");
    default: return null;
  }
};
