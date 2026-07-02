import type { Page } from "@playwright/test";

// Real readiness signals for SubscriptionManager's POST /connections calls, replacing
// blind waitForTimeout sleeps. SocketHelper.init() (apphelper) has a ~3s floor before a
// room join fires, so a fixed short sleep intermittently lets the sender post before the
// receiving tab's connection row exists server-side — DeliveryHelper.sendConversationMessages
// (Api) then finds no connection for that conversationId and the message is permanently
// missed (no replay). Waiting on the actual network response removes the race.

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

// GroupChatModal / StreamChatManager join the specific conversation's own room once they
// resolve its id — that join is what gates real-time delivery for pre-existing rooms
// (group discussions, the always-on stream) since direct delivery requires an exact
// conversationId match (Api ConnectionRepo.loadForConversation).
export function waitForRoomJoin(page: Page, timeout = 30000): Promise<void> {
  return waitForConnectionPost(page, (body) => body.conversationId !== "alerts", timeout);
}

// Every logged-in tab registers an "alerts" room connection as soon as SocketHelper knows
// the person/church. Private-message delivery to a conversation neither side has joined
// yet (e.g. the very first message in a brand-new thread) relies entirely on this channel —
// Api NotificationHelper.attemptDeliveryWithEscalation reads recipients via
// ConnectionRepo.loadForNotification, which hardcodes conversationId="alerts".
export function waitForAlertsJoin(page: Page, timeout = 30000): Promise<void> {
  return waitForConnectionPost(page, (body) => body.conversationId === "alerts", timeout);
}
