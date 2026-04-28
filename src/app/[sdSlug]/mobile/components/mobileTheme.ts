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

export const SCREEN_TITLES: Record<string, string> = {
  myGroups: "My Groups",
  groups: "My Groups",
  groupDetails: "Group",
  notifications: "Notifications",
  votd: "Verse of the Day",
  service: "Check-in",
  checkin: "Check-in",
  donation: "Giving",
  donate: "Giving",
  membersSearch: "Directory",
  community: "Directory",
  memberDetail: "Member Details",
  plan: "Plans",
  plans: "Plans",
  planDetails: "Plan",
  sermons: "Sermons",
  sermonDetails: "Sermon",
  playlist: "Playlist",
  playlistDetails: "Playlist",
  searchMessageUser: "Messages",
  messages: "Messages",
  messagesNew: "New Message",
  composeMessage: "New Message",
  registrations: "Registrations",
  register: "Register",
  volunteerBrowse: "Volunteer Opportunities",
  volunteer: "Volunteer",
  volunteerSignup: "Volunteer",
  profileEdit: "Edit Profile",
  stream: "Stream",
  bible: "Bible",
  lessons: "Lessons",
  login: "Sign In",
  install: "Install App",
  page: "",
  websiteUrl: ""
};

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
    case "groups": return "Find your people";
    case "directory": return "Browse the directory";
    case "plans": return "View your serving plans";
    case "checkin": return "Check in for service";
    case "lessons": return "This week's lessons";
    case "donation": return "Support the ministry";
    case "volunteer": return "Sign up to serve";
    case "bible": return "Read scripture";
    case "votd": return "Today's verse";
    case "sermons": return "Watch & listen";
    case "stream": return "Live service";
    case "registrations": return "Upcoming events";
    default: return null;
  }
};
