"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Avatar, Box, Popover, Skeleton } from "@mui/material";
import { ApiHelper, Locale, PersonHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "./mobileTheme";
import { getInitials, formatRelative, deriveNotificationUrl } from "./util";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import { PlateSection, QuietEmpty, Row, RowList, StatusBadge, TextLink } from "./kit";

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export interface Conversation {
  id: string;
  pmId: string;
  personId: string;
  conversationId?: string;
  personName: string;
  personPhoto?: string;
  preview: string;
  lastTime?: string;
  unread: boolean;
}

export interface NotificationItem {
  id?: string;
  churchId?: string;
  title?: string;
  message?: string;
  timeSent?: string | Date;
  isNew?: boolean;
  linkUrl?: string;
  contentType?: string;
  contentId?: string;
  triggeredByPersonId?: string;
}

// Same shape as MessagesPage: all three share the ["conversations", personId] cache entry.
export const fetchConversations = async (myPersonId?: string): Promise<Conversation[]> => {
  const pmData: any[] = await ApiHelper.get("/privateMessages", "MessagingApi");
  if (!Array.isArray(pmData) || pmData.length === 0) return [];

  const rows = pmData.map((pm) => {
    const otherId = myPersonId && pm.fromPersonId === myPersonId ? pm.toPersonId : pm.fromPersonId;
    return { pm, otherId };
  });

  const otherIds = Array.from(new Set(rows.map((r) => r.otherId).filter(Boolean)));
  let peopleById: Record<string, PersonInterface> = {};
  if (otherIds.length > 0) {
    const people: PersonInterface[] = await ApiHelper.get(`/people/basic?ids=${otherIds.join(",")}`, "MembershipApi");
    if (Array.isArray(people)) {
      peopleById = people.reduce((acc, p) => {
        if (p.id) acc[p.id] = p;
        return acc;
      }, {} as Record<string, PersonInterface>);
    }
  }

  const seen = new Set<string>();
  const result: Conversation[] = [];
  rows.forEach(({ pm, otherId }) => {
    const pmId = pm.pmId || pm.privateMessageId || pm.privateMessage?.id || pm.id;
    const conversationId = pm.conversationId || pm.conversation?.id || (pm.pmId ? pm.id : undefined);
    const id = conversationId || pmId;
    if (!id || !otherId) return;
    if (seen.has(id)) return;
    seen.add(id);
    const person = peopleById[otherId];
    let photo = "";
    if (person) {
      try {
        photo = PersonHelper.getPhotoUrl(person) || "";
      } catch {
        photo = (person as any).photo || "";
      }
    }
    result.push({
      id,
      pmId,
      personId: otherId,
      conversationId,
      personName: person?.name?.display || Locale.label("mobile.components.unknown"),
      personPhoto: photo,
      preview: (pm.conversation?.messages?.[0]?.content || "").replace(/<[^>]+>/g, ""),
      lastTime: pm.lastMessageTime || pm.conversation?.dateCreated,
      unread: !!myPersonId && pm.notifyPersonId === myPersonId
    });
  });
  return result;
};

export const conversationHref = (c: Conversation) => {
  const path = `/mobile/messages/${c.personId}`;
  return c.conversationId ? `${path}?conversationId=${encodeURIComponent(c.conversationId)}` : path;
};

export const ConversationAvatar = ({ c }: { c: Conversation }) => (
  <Avatar src={c.personPhoto || undefined} alt={c.personName} sx={{ width: 36, height: 36, flex: "none", bgcolor: mobileTheme.colors.chip, color: mobileTheme.colors.onChip, fontSize: 13, fontWeight: 600 }}>
    {getInitials(c.personName)}
  </Avatar>
);

const PREVIEW_COUNT = 4;

export const NotificationBellMenu = ({ anchorEl, open, onClose }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = React.useContext(UserContext);
  const { counts, refresh } = useRealtimeNotifications(userContext ?? null);
  const loggedIn = !!userContext?.user?.firstName;
  const myPersonId = userContext?.person?.id;

  React.useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const { data: conversationsData, isError: conversationsFailed } = useQuery<Conversation[]>({
    queryKey: ["conversations", myPersonId],
    queryFn: () => fetchConversations(myPersonId),
    enabled: loggedIn && open
  });

  const { data: notificationsData, isError: notificationsFailed } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", userContext?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/notifications/my", "MessagingApi");
      return Array.isArray(data) ? (data as NotificationItem[]) : [];
    },
    enabled: loggedIn && open
  });

  const conversations = conversationsData ?? (conversationsFailed ? [] : null);
  const notifications = notificationsData ?? (notificationsFailed ? [] : null);

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    const href = deriveNotificationUrl(n);
    if (!href) return;
    go(href);
  };

  const skeletons = [0, 1].map((k) => <Skeleton key={k} variant="text" height={40} />);
  const unreadBadge = (n: number) => n > 0 ? <StatusBadge tone="pri">{Locale.label("mobile.inbox.newCount").replace("{}", String(n))}</StatusBadge> : null;
  const sectionTitle = (label: string, n: number) => <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>{label}{unreadBadge(n)}</Box>;
  const sectionSx = { px: "16px", py: "14px" };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            width: 360,
            maxWidth: "calc(100vw - 16px)",
            mt: 0.5,
            bgcolor: tc.surface,
            backgroundImage: "none",
            border: `1px solid ${tc.border}`,
            borderRadius: "10px",
            boxShadow: mobileTheme.shadows.md,
            overflow: "hidden"
          }
        }
      }}
    >
      <Box sx={{ maxHeight: 440, overflowY: "auto", "& > section + section": { borderTop: `1px solid ${tc.border}` } }}>
        <PlateSection sx={sectionSx} title={sectionTitle(Locale.label("mobile.components.messages"), counts.pmCount)} action={<TextLink onClick={() => go("/mobile/messages/new")}>{Locale.label("mobile.components.newMessage")}</TextLink>}>
          {conversations === null && skeletons}
          {conversations !== null && conversations.length === 0 && <QuietEmpty>{Locale.label("mobile.components.noMessages")}</QuietEmpty>}
          {conversations !== null && conversations.length > 0 && (
            <RowList>
              {conversations.slice(0, PREVIEW_COUNT).map((c) => (
                <Row key={c.id} onClick={() => go(conversationHref(c))} leading={<ConversationAvatar c={c} />} title={c.personName} subtitle={c.preview || undefined} sx={{ minHeight: 48 }} />
              ))}
            </RowList>
          )}
        </PlateSection>
        <PlateSection sx={sectionSx} title={sectionTitle(Locale.label("mobile.components.notifications"), counts.notificationCount)}>
          {notifications === null && skeletons}
          {notifications !== null && notifications.length === 0 && <QuietEmpty>{Locale.label("mobile.components.noNotifications")}</QuietEmpty>}
          {notifications !== null && notifications.length > 0 && (
            <RowList>
              {notifications.slice(0, PREVIEW_COUNT).map((n, idx) => {
                const href = deriveNotificationUrl(n);
                return (
                  <Row
                    key={n.id || `n-${idx}`}
                    onClick={href ? () => handleNotificationClick(n) : undefined}
                    title={n.message || ""}
                    subtitle={formatRelative(n.timeSent)}
                    trailing={n.isNew ? <StatusBadge tone="pri">{Locale.label("mobile.inbox.new")}</StatusBadge> : undefined}
                    sx={{ minHeight: 48 }}
                  />
                );
              })}
            </RowList>
          )}
        </PlateSection>
      </Box>
      <Box sx={{ px: "16px", py: "12px", borderTop: `1px solid ${tc.border}`, textAlign: "center" }}>
        <TextLink onClick={() => go("/mobile/notifications")}>{Locale.label("mobile.inbox.seeAll")}</TextLink>
      </Box>
    </Popover>
  );
};
