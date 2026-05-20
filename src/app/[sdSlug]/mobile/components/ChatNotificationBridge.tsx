"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ConversationStore, PresenceStore, SocketHelper, SubscriptionManager } from "@churchapps/apphelper";
import { formatNotificationError, getSocketDiagnostics, WebPushHelper } from "@/helpers";

interface Props {
  personId?: string;
  churchId?: string;
}

type PrivateMessageEvent = {
  notifyPersonId?: string;
  fromPersonId?: string;
  toPersonId?: string;
  conversationId?: string;
  message?: {
    id?: string;
    personId?: string;
    conversationId?: string;
    content?: string;
    displayName?: string;
  };
};

export const ChatNotificationBridge = ({ personId, churchId }: Props): null => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bootstrapKeyRef = useRef("");
  const socketInfo = getSocketDiagnostics();

  useEffect(() => {
    if (!personId || !churchId) return;
    if (!socketInfo.valid || !socketInfo.compatible) return;

    const bootstrapKey = `${personId}:${churchId}:${socketInfo.normalizedUrl}`;
    let cancelled = false;

    const bootstrap = async () => {
      try {
        await SocketHelper.init();
        if (cancelled) return;
        ConversationStore.ensureHandlers();
        PresenceStore.ensureHandlers();
        SubscriptionManager.setupRejoin();
        SocketHelper.setPersonChurch({ personId, churchId });
        bootstrapKeyRef.current = bootstrapKey;
      } catch (error) {
        if (cancelled) return;
        console.error("[chat] socket bootstrap failed:", formatNotificationError(error));
      }
    };

    const needsBootstrap = bootstrapKeyRef.current !== bootstrapKey || SocketHelper.getConnectionState() === "UNINITIALIZED";
    if (needsBootstrap) bootstrap();
    else SocketHelper.setPersonChurch({ personId, churchId });

    return () => {
      cancelled = true;
    };
  }, [churchId, personId, socketInfo.compatible, socketInfo.normalizedUrl, socketInfo.valid]);

  useEffect(() => {
    if (!personId) return;

    const handlerId = `ChatNotificationBridge-${personId}`;
    const handlePrivateMessage = async (payload: PrivateMessageEvent) => {
      try {
        if (typeof document === "undefined") return;
        if (document.visibilityState === "visible") return;
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

        const notifyPersonId = payload.notifyPersonId;
        if (notifyPersonId && notifyPersonId !== personId) return;

        const message = payload.message;
        const fromPersonId = payload.fromPersonId || message?.personId;
        const toPersonId = payload.toPersonId;
        const conversationId = payload.conversationId || message?.conversationId;
        if (!conversationId) return;
        if (fromPersonId === personId) return;

        const activeConversationId = searchParams?.get("conversationId") || "";
        const activePathMatch = pathname?.match(/^\/mobile\/messages\/([^/?#]+)/);
        const activeOtherPersonId = activePathMatch?.[1] ? decodeURIComponent(activePathMatch[1]) : "";
        const otherPersonId = fromPersonId && fromPersonId !== personId
          ? fromPersonId
          : toPersonId && toPersonId !== personId
            ? toPersonId
            : activeOtherPersonId;

        if ((activeConversationId && activeConversationId === conversationId) || (activeOtherPersonId && activeOtherPersonId === otherPersonId)) {
          return;
        }

        // When the device is enrolled for server-side web push, let the push path
        // be the single source of OS notifications to avoid duplicate alerts from
        // both the socket bridge and the service worker.
        if (WebPushHelper.isServerRegistrationEnabled()) {
          const existingSubscription = await WebPushHelper.getExistingSubscription();
          if (existingSubscription) return;
        }

        const registration = await WebPushHelper.getRegistration();
        if (!registration) return;

        await registration.showNotification(message?.displayName || "New message", {
          body: message?.content || "You received a new private message.",
          icon: "/images/logo.png",
          badge: "/images/logo.png",
          tag: `privatemessage:${conversationId}`,
          data: {
            type: "privatemessage",
            personId: otherPersonId,
            conversationId,
            contentId: conversationId
          }
        });
      } catch (error) {
        console.error("[chat] failed to surface private message notification:", formatNotificationError(error));
      }
    };

    SocketHelper.addHandler("privateMessage", handlerId, handlePrivateMessage);
    return () => {
      SocketHelper.removeHandler(handlerId);
    };
  }, [pathname, personId, searchParams]);

  return null;
};
