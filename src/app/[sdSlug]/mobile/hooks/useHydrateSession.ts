"use client";

import { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { LoginResponseInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";

type HydrationStatus = "idle" | "hydrating" | "ready" | "anonymous" | "error";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([k]) => k === name);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/**
 * One-shot session rehydration for /mobile.
 *
 * Mirrors the auth slice of B1Mobile's splash (`app/index.tsx`): if a `jwt`
 * cookie is present we POST `/users/login` to re-authenticate, hydrate
 * `UserHelper` + `UserContext` (user, userChurches, currentUserChurch, person),
 * and pick the userChurch that matches the current subdomain (sdSlug).
 *
 * Returns a status the layout can gate rendering on so returning users are
 * treated as logged-in before individual screens probe `UserHelper.user`.
 */
export function useHydrateSession(): HydrationStatus {
  const params = useParams<{ sdSlug?: string }>();
  const sdSlug = params?.sdSlug;
  const context = useContext(UserContext);
  const [status, setStatus] = useState<HydrationStatus>("idle");

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      // Already hydrated in this session (e.g. user just logged in via LoginPage).
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

        // Populate UserHelper statics (used by `UserHelper.user?.firstName`
        // inline gates in screens, MobileAppBar, MobileDrawer, etc.).
        ApiHelper.setDefaultPermissions(resp.user.jwt);
        (resp.userChurches || []).forEach((uc: any) => { if (!uc.apis) uc.apis = []; });
        UserHelper.user = resp.user;
        UserHelper.userChurches = resp.userChurches || [];

        // Pick the userChurch that matches this subdomain; fall back to the
        // first userChurch (matches LoginPage's `selectChurch` default).
        let matched = null as any;
        if (sdSlug) {
          matched = UserHelper.userChurches?.find(
            (uc) => uc.church?.subDomain?.toLowerCase() === sdSlug.toLowerCase()
          );
        }
        const target = matched || UserHelper.userChurches?.[0];

        if (target) {
          UserHelper.currentUserChurch = target;
          UserHelper.setupApiHelper(target);
        }

        // Best-effort person hydration — mirrors LoginPage.continueLoginProcess.
        let person: any = null;
        const personId = UserHelper.currentUserChurch?.person?.id;
        const churchId = UserHelper.currentUserChurch?.church?.id;
        if (personId) {
          try {
            person = await ApiHelper.get(`/people/${personId}`, "MembershipApi");
          } catch {
            if (churchId) {
              try { person = await ApiHelper.get(`/people/claim/${churchId}`, "MembershipApi"); } catch { /* ignore */ }
            }
          }
        } else if (churchId) {
          try { person = await ApiHelper.get(`/people/claim/${churchId}`, "MembershipApi"); } catch { /* ignore */ }
        }
        if (person) UserHelper.person = person;

        if (cancelled) return;

        // Push into React context so components subscribed to it re-render.
        context.setUser(UserHelper.user);
        context.setUserChurches(UserHelper.userChurches);
        if (UserHelper.currentUserChurch) context.setUserChurch(UserHelper.currentUserChurch);
        if (person) context.setPerson(person);

        setStatus("ready");
      } catch (err) {
        console.warn("Mobile session rehydration failed:", err);
        if (!cancelled) setStatus("anonymous");
      }
    };

    hydrate();
    return () => { cancelled = true; };
    // Run once per mount; sdSlug is derived from the URL and stable across the layout's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}
