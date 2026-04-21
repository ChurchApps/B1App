"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Chip, Icon, Skeleton, Typography } from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { WebPushHelper } from "@/helpers";
import { mobileTheme } from "../mobileTheme";
import { formatRelative } from "../util";

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

const deriveLinkUrl = (n: NotificationItem): string | undefined => {
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

const getIconName = (contentType?: string): string => {
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

export const NotificationsPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const loggedIn = !!UserHelper.user?.firstName;

  type PushStatus = "unsupported" | "blocked" | "off" | "on";
  const [pushStatus, setPushStatus] = React.useState<PushStatus | null>(null);
  const [pushBusy, setPushBusy] = React.useState(false);

  const refreshPushStatus = React.useCallback(async () => {
    if (!WebPushHelper.isSupported()) { setPushStatus("unsupported"); return; }
    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      setPushStatus("blocked"); return;
    }
    const sub = await WebPushHelper.getExistingSubscription();
    setPushStatus(sub ? "on" : "off");
  }, []);

  React.useEffect(() => {
    if (loggedIn) refreshPushStatus();
  }, [loggedIn, refreshPushStatus]);

  const handleTogglePush = async () => {
    setPushBusy(true);
    try {
      if (pushStatus === "on") await WebPushHelper.unsubscribe();
      else await WebPushHelper.subscribe();
      await refreshPushStatus();
    } finally {
      setPushBusy(false);
    }
  };

  const { data: serverNotifications = null } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", UserHelper.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/notifications/my", "MessagingApi");
      return Array.isArray(data) ? (data as NotificationItem[]) : [];
    },
    enabled: loggedIn
  });

  const notifications = React.useMemo<NotificationItem[] | null>(() => {
    if (!loggedIn) return [];
    if (serverNotifications == null) return null;
    return serverNotifications;
  }, [loggedIn, serverNotifications]);

  const handleClick = (n: NotificationItem) => {
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
    const body = n.message || "";
    const iconName = getIconName(n.contentType);
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
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          bgcolor: tc.surface,
          borderRadius: "12px",
          boxShadow: mobileTheme.shadows.sm,
          p: "16px",
          cursor: href ? "pointer" : "default",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": href ? { boxShadow: mobileTheme.shadows.md } : undefined,
          "&:active": href ? { transform: "scale(0.995)" } : undefined
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "20px",
            bgcolor: tc.iconBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon sx={{ color: tc.primary, fontSize: 24 }}>{iconName}</Icon>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {body && (
            <Typography
              sx={{
                fontSize: 14,
                lineHeight: "20px",
                color: tc.text,
                mb: "8px",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              {body}
            </Typography>
          )}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Chip
              size="small"
              variant="outlined"
              label={formatRelative(n.timeSent)}
              sx={{
                bgcolor: tc.iconBackground,
                borderColor: tc.divider,
                color: tc.disabled,
                height: 24,
                "& .MuiChip-label": { fontSize: 12, px: "8px", color: tc.disabled }
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderSkeleton = (key: number) => (
    <Box
      key={`sk-${key}`}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        bgcolor: tc.surface,
        borderRadius: "12px",
        boxShadow: mobileTheme.shadows.sm,
        p: "16px"
      }}
    >
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="90%" height={16} />
        <Skeleton variant="text" width="70%" height={16} />
        <Skeleton variant="rounded" width={56} height={24} sx={{ mt: "8px" }} />
      </Box>
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        px: "24px",
        pt: `${mobileTheme.spacing.xl}px`,
        maxWidth: 300,
        mx: "auto"
      }}
    >
      <Icon sx={{ fontSize: 64, color: tc.divider }}>notifications</Icon>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          color: tc.text,
          mt: "16px",
          mb: "8px"
        }}
      >
        No notifications yet
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          color: tc.textMuted,
          lineHeight: "20px"
        }}
      >
        We&apos;ll notify you when something new arrives.
      </Typography>
    </Box>
  );

  const renderPushCard = () => {
    if (!loggedIn || pushStatus === null || pushStatus === "unsupported") return null;
    const on = pushStatus === "on";
    const blocked = pushStatus === "blocked";
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          bgcolor: tc.surface,
          borderRadius: "12px",
          boxShadow: mobileTheme.shadows.sm,
          p: "12px 16px"
        }}
      >
        <Icon sx={{ color: on ? tc.primary : tc.disabled }}>
          {on ? "notifications_active" : "notifications_off"}
        </Icon>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>
            Push notifications
          </Typography>
          <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
            {blocked
              ? "Blocked in browser settings"
              : on
                ? "You'll get alerts on this device"
                : "Turn on to get alerts on this device"}
          </Typography>
        </Box>
        {!blocked && (
          <Button size="small" variant={on ? "outlined" : "contained"} disabled={pushBusy} onClick={handleTogglePush}>
            {on ? "Turn off" : "Turn on"}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {renderPushCard()}
        {notifications === null && [0, 1, 2, 3, 4].map(renderSkeleton)}
        {notifications !== null && notifications.length === 0 && renderEmpty()}
        {notifications !== null && notifications.length > 0 && notifications.map(renderRow)}
      </Box>
    </Box>
  );
};
