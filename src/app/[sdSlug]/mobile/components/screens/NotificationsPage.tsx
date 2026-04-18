"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Chip, Icon, Skeleton, Typography } from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

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

interface Props {
  config?: ConfigurationInterface;
}

const formatRelative = (value?: string | Date): string => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const deriveLinkUrl = (n: NotificationItem): string | undefined => {
  if (n.linkUrl) return n.linkUrl;
  const type = String(n.contentType || "").toLowerCase();
  const id = n.contentId;
  if (!id) return undefined;
  switch (type) {
    case "plan":
    case "schedule": return "/mobile/plans";
    case "group":
    case "groupannouncement": return `/mobile/groups/${id}`;
    case "assignment": return "/mobile/plans";
    default: return undefined;
  }
};

export const NotificationsPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = React.useCallback(() => {
    if (!UserHelper.user?.firstName) {
      setNotifications([]);
      return;
    }
    ApiHelper.get("/notifications/my", "MessagingApi")
      .then((data: any) => {
        const list = Array.isArray(data) ? (data as NotificationItem[]) : [];
        setNotifications(list);
      })
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = () => {
    if (!notifications) return;
    setNotifications(notifications.map((n) => ({ ...n, isNew: false })));
    // Note: B1Mobile relies on the server auto-clearing `isNew` when `/notifications/my`
    // is polled. No client-side markRead endpoint exists, so this is client-only.
  };

  const markReadLocal = (n: NotificationItem) => {
    if (!n.id || !n.isNew) return;
    setNotifications((prev) =>
      prev ? prev.map((x) => (x.id === n.id ? { ...x, isNew: false } : x)) : prev
    );
  };

  const handleClick = (n: NotificationItem) => {
    markReadLocal(n);
    const href = deriveLinkUrl(n);
    if (!href) return;
    if (href.startsWith("http")) {
      window.location.href = href;
    } else {
      router.push(href);
    }
  };

  const renderRow = (n: NotificationItem, idx: number) => {
    const href = deriveLinkUrl(n);
    const isUnread = !!n.isNew;
    const title = n.title || (n.contentType ? n.contentType.charAt(0).toUpperCase() + n.contentType.slice(1) : "Notification");
    const body = n.message || "";
    return (
      <Box
        key={n.id || `n-${idx}`}
        role={href ? "button" : undefined}
        tabIndex={href ? 0 : undefined}
        onClick={() => handleClick(n)}
        onKeyDown={(e) => {
          if (href && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick(n);
          }
        }}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          gap: `${mobileTheme.spacing.md}px`,
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          px: `${mobileTheme.spacing.md}px`,
          py: "14px",
          cursor: href ? "pointer" : "default",
          overflow: "hidden",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": href ? { boxShadow: mobileTheme.shadows.md } : undefined,
          "&:active": href ? { transform: "scale(0.995)" } : undefined,
        }}
      >
        {/* Accent bar for unread */}
        {isUnread && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "4px",
              bgcolor: tc.primary,
            }}
          />
        )}
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "20px",
            bgcolor: tc.iconBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ color: tc.primary, fontSize: 22 }}>notifications</Icon>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: tc.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
          {body && (
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 400,
                color: tc.textMuted,
                mt: "2px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {body}
            </Typography>
          )}
        </Box>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 400,
            color: tc.textSecondary,
            whiteSpace: "nowrap",
            flexShrink: 0,
            ml: 1,
            mt: "2px",
          }}
        >
          {formatRelative(n.timeSent)}
        </Typography>
      </Box>
    );
  };

  const renderSkeleton = (key: number) => (
    <Box
      key={`sk-${key}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        px: `${mobileTheme.spacing.md}px`,
        py: "14px",
      }}
    >
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="55%" height={18} />
        <Skeleton variant="text" width="85%" height={14} />
      </Box>
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
        mt: `${mobileTheme.spacing.sm}px`,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: "36px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Icon sx={{ fontSize: 36, color: tc.primary }}>notifications_none</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        You&apos;re all caught up
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        We&apos;ll let you know when something new arrives.
      </Typography>
    </Box>
  );

  const filtered = React.useMemo(() => {
    if (!notifications) return null;
    if (filter === "unread") return notifications.filter((n) => n.isNew);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = (notifications || []).filter((n) => n.isNew).length;

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: `${mobileTheme.spacing.md}px`,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text }}>Notifications</Typography>
        {unreadCount > 0 && (
          <Button
            size="small"
            onClick={markAllRead}
            startIcon={<Icon>done_all</Icon>}
            sx={{ textTransform: "none", color: tc.primary, fontWeight: 600 }}
          >
            Mark all read
          </Button>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, mb: `${mobileTheme.spacing.sm}px` }}>
        <Chip
          label="All"
          onClick={() => setFilter("all")}
          variant={filter === "all" ? "filled" : "outlined"}
          sx={{
            bgcolor: filter === "all" ? tc.primaryLight : undefined,
            color: filter === "all" ? tc.primary : tc.text,
            borderColor: tc.primary,
            fontWeight: 600,
          }}
          size="small"
        />
        <Chip
          label={`Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          onClick={() => setFilter("unread")}
          variant={filter === "unread" ? "filled" : "outlined"}
          sx={{
            bgcolor: filter === "unread" ? tc.primaryLight : undefined,
            color: filter === "unread" ? tc.primary : tc.text,
            borderColor: tc.primary,
            fontWeight: 600,
          }}
          size="small"
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {filtered === null && [0, 1, 2].map(renderSkeleton)}
        {filtered !== null && filtered.length === 0 && renderEmpty()}
        {filtered !== null && filtered.length > 0 && filtered.map(renderRow)}
      </Box>
    </Box>
  );
};
