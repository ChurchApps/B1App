"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, Icon, IconButton, Popover, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { ApiHelper, PersonHelper, useNotifications } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "./mobileTheme";
import { getInitials, formatRelative } from "./util";

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

interface Conversation {
  id: string;
  personId: string;
  conversationId?: string;
  personName: string;
  personPhoto?: string;
}

interface NotificationItem {
  id?: string;
  title?: string;
  message?: string;
  timeSent?: string | Date;
  isNew?: boolean;
  linkUrl?: string;
  contentType?: string;
  contentId?: string;
}

const deriveNotificationHref = (n: NotificationItem): string | undefined => {
  if (!n.contentId) return undefined;
  const type = String(n.contentType || "").toLowerCase();
  const id = n.contentId;
  switch (type) {
    case "plan":
    case "schedule": return `/mobile/plans/${id}`;
    case "groupannouncement": return `/mobile/groups/${id}?openChat=1&chatTab=announcements`;
    case "group": return `/mobile/groups/${id}`;
    case "assignment": return "/mobile/plans";
    default: return undefined;
  }
};

const getNotificationIcon = (contentType?: string): string => {
  switch (String(contentType || "").toLowerCase()) {
    case "plan":
    case "schedule": return "calendar_today";
    case "message":
    case "privatemessage":
    case "senttext": return "message";
    case "group":
    case "groupannouncement": return "group";
    case "assignment": return "assignment";
    case "donation": return "payment";
    default: return "notifications";
  }
};

export const NotificationBellMenu = ({ anchorEl, open, onClose }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = React.useContext(UserContext);
  const { counts, refresh } = useNotifications(userContext ?? null);
  const [tab, setTab] = React.useState<"messages" | "notifications">("messages");
  const loggedIn = !!userContext?.user?.firstName;
  const myPersonId = userContext?.person?.id;

  React.useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const { data: conversations = null } = useQuery<Conversation[]>({
    queryKey: ["conversations", myPersonId],
    queryFn: async () => {
      const pmData: any[] = await ApiHelper.get("/privateMessages", "MessagingApi");
      if (!Array.isArray(pmData) || pmData.length === 0) return [];

      const rows = pmData.map((pm) => {
        const otherId = myPersonId && pm.fromPersonId === myPersonId ? pm.toPersonId : pm.fromPersonId;
        return { pm, otherId };
      });

      const otherIds = Array.from(new Set(rows.map((r) => r.otherId).filter(Boolean)));
      let peopleById: Record<string, PersonInterface> = {};
      if (otherIds.length > 0) {
        const people: PersonInterface[] = await ApiHelper.get(
          `/people/basic?ids=${otherIds.join(",")}`,
          "MembershipApi"
        );
        if (Array.isArray(people)) {
          peopleById = people.reduce((acc, p) => {
            if (p.id) acc[p.id] = p;
            return acc;
          }, {} as Record<string, PersonInterface>);
        }
      }

      return rows.map(({ pm, otherId }) => {
        const person = peopleById[otherId];
        const displayName = person?.name?.display || "Unknown";
        let photo = "";
        if (person) {
          try {
            photo = PersonHelper.getPhotoUrl(person) || "";
          } catch {
            photo = (person as any).photo || "";
          }
        }
        return {
          id: pm.conversationId || pm.id,
          personId: otherId,
          conversationId: pm.conversationId,
          personName: displayName,
          personPhoto: photo
        };
      });
    },
    enabled: loggedIn && open
  });

  const { data: notifications = null } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", userContext?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/notifications/my", "MessagingApi");
      return Array.isArray(data) ? (data as NotificationItem[]) : [];
    },
    enabled: loggedIn && open
  });

  const handleConversationClick = (c: Conversation) => {
    onClose();
    const path = `/mobile/messages/${c.personId}`;
    router.push(c.conversationId ? `${path}?conversationId=${encodeURIComponent(c.conversationId)}` : path);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    const href = deriveNotificationHref(n);
    if (!href) return;
    onClose();
    router.push(href);
  };

  const handleViewAll = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleNewMessage = () => {
    onClose();
    router.push("/mobile/messages/new");
  };

  const renderConversationRow = (c: Conversation) => (
    <Box
      key={c.id}
      onClick={() => handleConversationClick(c)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleConversationClick(c);
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.25,
        cursor: "pointer",
        "&:hover": { bgcolor: tc.iconBackground }
      }}
    >
      {c.personPhoto ? (
        <Box
          component="img"
          src={c.personPhoto}
          alt={c.personName}
          sx={{ width: 36, height: 36, borderRadius: "18px", objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "18px",
            bgcolor: tc.primaryLight,
            color: tc.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0
          }}
        >
          {getInitials(c.personName)}
        </Box>
      )}
      <Typography
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          fontWeight: 600,
          color: tc.text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {c.personName}
      </Typography>
      <Icon sx={{ color: tc.textSecondary, fontSize: 20 }}>chevron_right</Icon>
    </Box>
  );

  const renderNotificationRow = (n: NotificationItem, idx: number) => {
    const href = deriveNotificationHref(n);
    const iconName = getNotificationIcon(n.contentType);
    return (
      <Box
        key={n.id || `n-${idx}`}
        role={href ? "button" : undefined}
        tabIndex={href ? 0 : undefined}
        onClick={() => handleNotificationClick(n)}
        onKeyDown={(e) => {
          if (href && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleNotificationClick(n);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          px: 2,
          py: 1.25,
          cursor: href ? "pointer" : "default",
          "&:hover": href ? { bgcolor: tc.iconBackground } : undefined
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: "16px",
            bgcolor: tc.iconBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon sx={{ color: tc.primary, fontSize: 18 }}>{iconName}</Icon>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {n.message && (
            <Typography
              sx={{
                fontSize: 13,
                lineHeight: "18px",
                color: tc.text,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              {n.message}
            </Typography>
          )}
          <Typography sx={{ fontSize: 11, color: tc.disabled, mt: 0.25 }}>
            {formatRelative(n.timeSent)}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderSkeletonRow = (key: number) => (
    <Box key={`sk-${key}`} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25 }}>
      <Skeleton variant="circular" width={36} height={36} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="70%" height={16} />
        <Skeleton variant="text" width="40%" height={12} />
      </Box>
    </Box>
  );

  const renderEmpty = (icon: string, text: string, action?: { label: string; onClick: () => void }) => (
    <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
      <Icon sx={{ fontSize: 40, color: tc.divider, mb: 1 }}>{icon}</Icon>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: action ? 2 : 0 }}>{text}</Typography>
      {action && (
        <Button
          variant="contained"
          size="small"
          startIcon={<Icon>edit</Icon>}
          onClick={action.onClick}
          disableElevation
          sx={{
            bgcolor: tc.primary,
            color: tc.onPrimary,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: tc.primary }
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );

  const renderFooter = (path: string, label: string) => (
    <Box
      onClick={() => handleViewAll(path)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleViewAll(path);
        }
      }}
      sx={{
        px: 2,
        py: 1.25,
        borderTop: `1px solid ${tc.border}`,
        textAlign: "center",
        cursor: "pointer",
        color: tc.primary,
        fontSize: 13,
        fontWeight: 600,
        "&:hover": { bgcolor: tc.iconBackground }
      }}
    >
      {label}
    </Box>
  );

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
            borderRadius: `${mobileTheme.radius.md}px`,
            boxShadow: mobileTheme.shadows.lg,
            overflow: "hidden"
          }
        }
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          borderBottom: `1px solid ${tc.border}`,
          minHeight: 44,
          "& .MuiTab-root": { minHeight: 44, textTransform: "none", fontWeight: 600, fontSize: 14 }
        }}
      >
        <Tab
          value="messages"
          label={(
            <Badge badgeContent={counts.pmCount} color="error" sx={{ "& .MuiBadge-badge": { right: -10, top: 2 } }}>
              Messages
            </Badge>
          )}
        />
        <Tab
          value="notifications"
          label={(
            <Badge badgeContent={counts.notificationCount} color="error" sx={{ "& .MuiBadge-badge": { right: -10, top: 2 } }}>
              Notifications
            </Badge>
          )}
        />
      </Tabs>
      {tab === "messages" && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            px: 1,
            py: 0.5,
            borderBottom: `1px solid ${tc.border}`
          }}
        >
          <IconButton
            aria-label="New message"
            size="small"
            onClick={handleNewMessage}
            sx={{
              bgcolor: tc.iconBackground,
              color: tc.primary,
              "&:hover": { bgcolor: tc.iconBackground }
            }}
          >
            <Icon sx={{ fontSize: 18 }}>edit</Icon>
          </IconButton>
        </Box>
      )}
      <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
        {tab === "messages" && (
          <>
            {conversations === null && [0, 1, 2].map(renderSkeletonRow)}
            {conversations !== null && conversations.length === 0 && renderEmpty("chat_bubble_outline", "No messages yet", { label: "New message", onClick: handleNewMessage })}
            {conversations !== null && conversations.length > 0 && conversations.map(renderConversationRow)}
          </>
        )}
        {tab === "notifications" && (
          <>
            {notifications === null && [0, 1, 2].map(renderSkeletonRow)}
            {notifications !== null && notifications.length === 0 && renderEmpty("notifications", "No notifications yet")}
            {notifications !== null && notifications.length > 0 && notifications.map(renderNotificationRow)}
          </>
        )}
      </Box>
      {tab === "messages" && renderFooter("/mobile/messages", "View all messages")}
      {tab === "notifications" && renderFooter("/mobile/notifications", "View all notifications")}
    </Popover>
  );
};
