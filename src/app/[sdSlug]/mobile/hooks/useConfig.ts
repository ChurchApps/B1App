"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiHelper } from "@churchapps/apphelper";
import type { LinkInterface } from "@churchapps/helpers";

// Apply the visibility rules once, for both drawer tabs and dashboard tiles.
// Anonymous users: only links without visibility or visibility === "everyone".
// Authenticated users: hide "team" links unless one of the user's group tags
// contains "team". Other visibility values pass through unchanged.
export function filterVisibleLinks(
  links: LinkInterface[] | null | undefined,
  userGroups?: Array<{ tags?: string }> | null
): LinkInterface[] {
  if (!Array.isArray(links)) return [];
  if (!userGroups) {
    return links.filter((l: any) => !l.visibility || l.visibility === "everyone");
  }
  const tags = userGroups.flatMap((g) => g?.tags?.split(",") || []);
  return links.filter((l: any) => l.visibility !== "team" || tags.includes("team"));
}

export function useChurchLinks(churchId: string | undefined, jwt?: string) {
  return useQuery({
    queryKey: ["links", churchId, jwt ? "auth" : "anon"],
    queryFn: async () => {
      if (!churchId) return [] as LinkInterface[];
      if (jwt) {
        return (await ApiHelper.get(`/links/church/${churchId}/filtered?category=b1Tab`, "ContentApi")) as LinkInterface[];
      }
      return (await ApiHelper.getAnonymous(`/links/church/${churchId}?category=b1Tab`, "ContentApi")) as LinkInterface[];
    },
    enabled: !!churchId
  });
}
