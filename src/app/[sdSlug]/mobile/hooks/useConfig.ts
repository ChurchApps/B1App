"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiHelper } from "@churchapps/apphelper";
import { ConfigHelper, type ConfigurationInterface } from "@/helpers/ConfigHelper";
import type { LinkInterface } from "@churchapps/helpers";

export function useConfig(sdSlug: string, initialData?: ConfigurationInterface) {
  return useQuery({
    queryKey: ["config", sdSlug],
    queryFn: () => ConfigHelper.load(sdSlug, "website"),
    initialData,
    enabled: !!sdSlug,
  });
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
    enabled: !!churchId,
  });
}
