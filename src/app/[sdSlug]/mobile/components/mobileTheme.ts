// Color values resolve at runtime from CSS custom properties set on
// `.mobileAppRoot[data-mobile-theme="..."]` (see MobileThemeProvider). That
// lets the whole mobile shell swap between light and dark without rewriting
// the ~40 components that read `mobileTheme.colors.*` in MUI `sx` props.
export const mobileTheme = {
  colors: {
    primary: "var(--mb-primary)",
    primaryLight: "var(--mb-primary-light)",
    secondary: "var(--mb-secondary)",
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
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 12, xl: 16 },
  typography: {
    h1: { fontSize: 24, fontWeight: 700 },
    h2: { fontSize: 20, fontWeight: 600 },
    h3: { fontSize: 18, fontWeight: 600 },
    body: { fontSize: 16, fontWeight: 400 },
    bodySmall: { fontSize: 14, fontWeight: 400 },
    caption: { fontSize: 12, fontWeight: 400 },
    label: { fontSize: 14, fontWeight: 500 },
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 2px 4px rgba(0,0,0,0.1)",
    lg: "0 4px 8px rgba(0,0,0,0.15)",
  },
  drawerWidth: 280,
  headerHeight: 56,
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

// For `url` and `page` link types the actual destination lives in `link.url`
// (not `link.linkData`) — B1Mobile reads it as `item.url` in NavigationUtils.
// Earlier versions here read only `linkData`, which was usually empty, so the
// "Website" tab silently fell back to `/mobile/dashboard`.
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
      // Return the raw external URL. Browsers block most cross-origin iframes
      // via `X-Frame-Options` / CSP `frame-ancestors`, so embedding inside the
      // shell is unreliable. Callers detect `startsWith("http")` and open in a
      // new tab — the PWA stays put and the user can switch back.
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
