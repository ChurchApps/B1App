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

function readQueryParam(name: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get(name) || undefined;
}

function clearAuthParamsFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const hadJwt = url.searchParams.has("jwt");
  const hadAuth = url.searchParams.has("auth");
  if (!hadJwt && !hadAuth) return;
  url.searchParams.delete("jwt");
  url.searchParams.delete("auth");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function getLoginPayload(): { jwt: string } | { authGuid: string } | null {
  const authGuid = readQueryParam("auth");
  if (authGuid) return { authGuid };

  const jwt = readQueryParam("jwt") || readCookie("jwt");
  if (jwt) return { jwt };

  return null;
}

function getChurchId(): string | undefined {
  return readQueryParam("churchId");
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
      const loginPayload = getLoginPayload();
      const churchId = getChurchId();

      // An explicit auth handoff in the URL should win over any existing
      // in-memory session so account switching works reliably.
      if (!loginPayload && UserHelper.user?.id && UserHelper.currentUserChurch) {
        if (!cancelled) setStatus("ready");
        return;
      }

      if (!loginPayload) {
        if (!cancelled) setStatus("anonymous");
        return;
      }

      if (!cancelled) setStatus("hydrating");

      try {
        const resp: LoginResponseInterface = await ApiHelper.postAnonymous(
          "/users/login",
          loginPayload,
          "MembershipApi"
        );

        if (!resp?.user) {
          if (!cancelled) setStatus("anonymous");
          return;
        }

        await hydrateUserSession(resp, contextRef.current, { sdSlug, churchId, writeCookies: true });

        if (cancelled) return;
        clearAuthParamsFromUrl();
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [sdSlug]);

  return status;
}
