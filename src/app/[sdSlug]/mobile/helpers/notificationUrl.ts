export const deriveNotificationUrl = (n: { contentType?: string; contentId?: string; link?: string; triggeredByPersonId?: string }): string | undefined => {
  if (n.link?.startsWith("/mobile/")) return n.link; // server-provided deep link (e.g. event reminders); other relative links are staff paths
  if (n.link && /^https?:\/\//i.test(n.link)) return n.link; // B1 Admin pages for notes the app has no screen for (#1495)
  const type = String(n.contentType || "").toLowerCase();
  // contentId is the privateMessage id, but the conversation route keys on the other person.
  if (type === "privatemessage" || type === "message") {
    return n.triggeredByPersonId ? `/mobile/messages/${n.triggeredByPersonId}` : "/mobile/messages";
  }
  // Request decisions stored before the server attached a link (#1495); reminders for "event" carry their own link.
  if (type === "event" || type === "eventbooking") return "/mobile/myRequests";
  if (!n.contentId) return undefined;
  const id = n.contentId;
  switch (type) {
    case "plan":
    case "schedule": return `/mobile/plans/${id}`;
    case "groupannouncement": return `/mobile/groups/${id}?openChat=1&chatTab=announcements`;
    case "groupnote": return `/mobile/groups/${id}?openChat=1&chatTab=notes`;
    case "group": return `/mobile/groups/${id}`;
    case "assignment": return `/mobile/plans/${id}`;
    default: return undefined;
  }
};
