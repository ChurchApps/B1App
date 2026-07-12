import { Locale } from "@churchapps/apphelper";

// `radius` is numeric for backwards-compat; `radiusVar` is CSS-variable for new code inheriting admin overrides.
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
    disabled: "var(--mb-disabled)",
    wash1: "var(--mb-wash-1)",
    wash2: "var(--mb-wash-2)",
    wash3: "var(--mb-wash-3)",
    verse1: "var(--mb-verse-1)",
    verse2: "var(--mb-verse-2)"
  },
  // serif resolves --font-mobile-serif (set by next/font on the mobile layout wrapper) at the consuming
  // element — routing it through a :root token breaks because :root sits outside that wrapper.
  fonts: {
    serif: 'var(--font-mobile-serif, "Iowan Old Style"), "Iowan Old Style", "Palatino Linotype", Georgia, serif',
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  // Standard media-card fallback when no photo exists: brand hue drifting warm, never a ghosted icon.
  colorWash: "linear-gradient(115deg, var(--mb-wash-1) 0%, var(--mb-wash-2) 55%, var(--mb-wash-3) 100%)",
  verseGradient: "linear-gradient(150deg, var(--mb-verse-1) 0%, var(--mb-verse-2) 100%)",
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 10, lg: 16, xl: 22 },
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
  headerHeight: 56,
  tabBarHeight: 64
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
      more: Locale.label("mobile.components.more"),
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
      notificationPrefs: "Notification Preferences",
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

// Returning null lets callers omit the subtext line instead of using generic fallback.
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
