"use client";

import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { LoginResponseInterface } from "@churchapps/helpers";
import { PersonHelper } from "@/helpers";

export interface SessionContext {
  setUser: (user: any) => void;
  setUserChurches: (churches: any) => void;
  setUserChurch: (church: any) => void;
  setPerson: (person: any) => void;
}

export interface HydrateOptions {

  sdSlug?: string;

  writeCookies?: boolean;
}

export async function hydrateUserSession(
  resp: LoginResponseInterface,
  context: SessionContext,
  options: HydrateOptions = {}
): Promise<any | null> {
  const { sdSlug, writeCookies = false } = options;

  ApiHelper.setDefaultPermissions(resp.user.jwt);
  (resp.userChurches || []).forEach((uc: any) => { if (!uc.apis) uc.apis = []; });
  UserHelper.user = resp.user;
  UserHelper.userChurches = resp.userChurches || [];

  let matched: any = null;
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

  let person: any = null;
  const personId = UserHelper.currentUserChurch?.person?.id;
  const churchId = UserHelper.currentUserChurch?.church?.id;
  if (personId) {
    try {
      person = await ApiHelper.get(`/people/${personId}`, "MembershipApi");
    } catch {
      if (churchId) {
        try { person = await ApiHelper.get(`/people/claim/${churchId}`, "MembershipApi"); } catch { }
      }
    }
  } else if (churchId) {
    try { person = await ApiHelper.get(`/people/claim/${churchId}`, "MembershipApi"); } catch { }
  }
  if (person) {
    UserHelper.person = person;
    if (writeCookies) PersonHelper.person = person;
  }

  context.setUser(UserHelper.user);
  context.setUserChurches(UserHelper.userChurches);
  if (UserHelper.currentUserChurch) context.setUserChurch(UserHelper.currentUserChurch);
  if (person) context.setPerson(person);

  if (writeCookies && typeof document !== "undefined") {
    const maxAge = 180 * 24 * 60 * 60;
    document.cookie = `jwt=${resp.user.jwt}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `name=${encodeURIComponent(`${resp.user.firstName || ""} ${resp.user.lastName || ""}`.trim())}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `email=${encodeURIComponent(resp.user.email || "")}; path=/; max-age=${maxAge}; SameSite=Lax`;
    const lastChurchId = UserHelper.currentUserChurch?.church?.id;
    if (lastChurchId) {
      document.cookie = `lastChurchId=${lastChurchId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  }

  return person;
}
