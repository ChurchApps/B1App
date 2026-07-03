import type { Page } from "@playwright/test";

// Use network response waits instead of fixed sleeps to avoid race where sender posts before receiver joins.

interface ConnectionBody {
  conversationId: string;
  churchId: string;
  socketId: string;
  personId?: string | null;
  displayName?: string;
}

function isConnectionsPost(url: string): boolean {
  return /\/connections(\?|$)/.test(url);
}

async function waitForConnectionPost(page: Page, predicate: (body: ConnectionBody) => boolean, timeout: number): Promise<void> {
  await page.waitForResponse((response) => {
    if (response.request().method() !== "POST") return false;
    if (!isConnectionsPost(response.url())) return false;
    if (!response.ok()) return false;
    let body: unknown;
    try {
      body = response.request().postDataJSON();
    } catch {
      return false;
    }
    const item = Array.isArray(body) ? body[0] : body;
    return !!item && predicate(item as ConnectionBody);
  }, { timeout });
}

// Wait for room join (gates real-time delivery; exact conversationId match required).
export function waitForRoomJoin(page: Page, timeout = 30000): Promise<void> {
  return waitForConnectionPost(page, (body) => body.conversationId !== "alerts", timeout);
}

// Wait for "alerts" room join (required for initial private messages via ConnectionRepo.loadForNotification).
export function waitForAlertsJoin(page: Page, timeout = 30000): Promise<void> {
  return waitForConnectionPost(page, (body) => body.conversationId === "alerts", timeout);
}
