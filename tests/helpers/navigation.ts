import type { Page } from "@playwright/test";

// Public site routes (rendered under [sdSlug]/(public)/* — resolved from subdomain).
export type PublicRoute =
  | "home"
  | "login"
  | "sermons"
  | "stream"
  | "donate"
  | "bible"
  | "votd";

// Mobile screens — slug must match ScreenRouter switch-case keys at
// src/app/[sdSlug]/mobile/components/ScreenRouter.tsx:49.
export type MobileScreen =
  | "dashboard"
  | "checkin"
  | "donate"
  | "groups"
  | "messages"
  | "messagesNew"
  | "plans"
  | "community"
  | "notifications"
  | "lessons"
  | "bible"
  | "stream"
  | "sermons"
  | "votd"
  | "volunteer"
  | "registrations"
  | "profileEdit";

const PUBLIC_ROUTES: Record<PublicRoute, string> = {
  home: "/",
  login: "/login",
  sermons: "/sermons",
  stream: "/stream",
  donate: "/donate",
  bible: "/bible",
  votd: "/votd",
};

export async function gotoPublic(page: Page, route: PublicRoute) {
  await page.goto(PUBLIC_ROUTES[route]);
  await page.waitForLoadState("domcontentloaded");
}

export async function gotoMobile(page: Page, screen: MobileScreen) {
  await page.goto(`/mobile/${screen}`);
  await page.waitForLoadState("domcontentloaded");
}
