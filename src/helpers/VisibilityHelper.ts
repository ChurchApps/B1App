import type { LinkInterface, LoginUserChurchInterface } from "@churchapps/helpers";

export function isLinkVisible(link: LinkInterface, userChurch: LoginUserChurchInterface | null): boolean {
  const visibility = (link as any).visibility || "everyone";

  switch (visibility) {
    case "everyone":
      return true;

    case "visitors":
      return !!userChurch?.person?.id;

    case "members": {
      const status = userChurch?.person?.membershipStatus?.toLowerCase();
      return status === "member" || status === "staff";
    }

    case "staff":
      return userChurch?.person?.membershipStatus?.toLowerCase() === "staff";

    case "team":
      return userChurch?.groups?.some(g => g.tags?.includes("team")) || false;

    case "groups": {
      const groupIds = (link as any).groupIds;
      if (!groupIds) return false;
      try {
        const parsedGroupIds: string[] = JSON.parse(groupIds);
        if (!parsedGroupIds.length) return false;
        const userGroupIds = userChurch?.groups?.map(g => g.id) || [];
        return parsedGroupIds.some(gid => userGroupIds.includes(gid));
      } catch {
        return false;
      }
    }

    default:
      return true;
  }
}

export function filterVisibleLinks(links: LinkInterface[], userChurch: LoginUserChurchInterface | null): LinkInterface[] {
  return links.filter(link => isLinkVisible(link, userChurch));
}
