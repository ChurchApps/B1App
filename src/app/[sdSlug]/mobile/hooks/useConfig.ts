"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiHelper } from "@churchapps/apphelper";
import type { LinkInterface, LoginUserChurchInterface } from "@churchapps/helpers";

export function filterVisibleLinks(
  links: LinkInterface[] | null | undefined,
  userChurch: LoginUserChurchInterface | null | undefined
): LinkInterface[] {
  if (!Array.isArray(links)) return [];
  if (!userChurch?.jwt) {
    return links.filter((l: any) => !l.visibility || l.visibility === "everyone");
  }
  const tags = (userChurch.groups ?? []).flatMap((g) => g?.tags?.split(",") || []);
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
