"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { LoginResponseInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { hydrateUserSession } from "./hydrateUserSession";

type HydrationStatus = "idle" | "hydrating" | "ready" | "anonymous" | "error";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([k]) => k === name);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function useHydrateSession(): HydrationStatus {
  const params = useParams<{ sdSlug?: string }>();
  const sdSlug = params?.sdSlug;
  const context = useContext(UserContext);
  const [status, setStatus] = useState<HydrationStatus>("idle");

  const contextRef = useRef(context);
  useEffect(() => { contextRef.current = context; });

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {

      if (UserHelper.user?.id && UserHelper.currentUserChurch) {
        if (!cancelled) setStatus("ready");
        return;
      }

      const jwt = readCookie("jwt");
      if (!jwt) {
        if (!cancelled) setStatus("anonymous");
        return;
      }

      if (!cancelled) setStatus("hydrating");

      try {
        const resp: LoginResponseInterface = await ApiHelper.postAnonymous(
          "/users/login",
          { jwt },
          "MembershipApi"
        );

        if (!resp?.user) {
          if (!cancelled) setStatus("anonymous");
          return;
        }

        await hydrateUserSession(resp, contextRef.current, { sdSlug });

        if (cancelled) return;
        setStatus("ready");
      } catch (err) {
        console.warn("Mobile session rehydration failed:", err);
        if (!cancelled) setStatus("anonymous");
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [sdSlug]);

  return status;
}
