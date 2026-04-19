export const mobileTheme = {
  colors: {
    primary: "#0D47A1",
    primaryLight: "#E3F2FD",
    secondary: "#568BDA",
    background: "#F6F6F8",
    surface: "#FFFFFF",
    surfaceVariant: "#F6F6F8",
    text: "#3c3c3c",
    textSecondary: "#9E9E9E",
    textMuted: "#666666",
    textHint: "#999999",
    onPrimary: "#FFFFFF",
    success: "#70DC87",
    warning: "#FEAA24",
    error: "#B0120C",
    border: "#F0F0F0",
    borderLight: "#E5E7EB",
    divider: "#E0E0E0",
    iconBackground: "#F6F6F8",
    disabled: "#BDBDBD",
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

export const linkTypeToRoute = (linkType?: string, linkData?: string, text?: string): string | null => {
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
      // linkData is the page slug/url of a church-authored B1 page.
      // The embed shell (`/mobile/page`) resolves it against the current
      // origin and iframes it so the mobile chrome stays in place.
      const id = linkData || "";
      const params = new URLSearchParams();
      if (id) params.set("id", id);
      if (text) params.set("title", text);
      const qs = params.toString();
      return qs ? `/mobile/page?${qs}` : "/mobile/page";
    }
    case "url": {
      // External URL — embed it inside the mobile shell rather than
      // navigating the browser away from /mobile/*.
      const url = linkData || "";
      if (!url) return "/mobile/dashboard";
      const params = new URLSearchParams();
      params.set("url", url);
      if (text) params.set("title", text);
      return `/mobile/websiteUrl?${params.toString()}`;
    }
    default: return null;
  }
};

export const linkTypeToIcon = (linkType?: string, itemIcon?: string): string => {
  if (itemIcon) return itemIcon.split("_").join("-");
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
