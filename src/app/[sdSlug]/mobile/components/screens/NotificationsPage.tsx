"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Skeleton, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { WebPushHelper } from "@/helpers";
import { mobileTheme } from "../mobileTheme";
import { formatRelative, deriveNotificationUrl } from "../util";
import { useNotificationDiagnostics } from "../../hooks/useNotificationDiagnostics";
import { BackVerb, FilterPills, PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, StatusBadge, TextLink, useSliceView } from "../kit";
import { ConversationAvatar, conversationHref, fetchConversations, type Conversation, type NotificationItem } from "../NotificationBellMenu";

interface Props {
  config?: ConfigurationInterface;
}

const TEASER_COUNT = 3;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const NotificationsPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const context = useContext(UserContext);
  const queryClient = useQueryClient();
  const loggedIn = !!context?.user?.firstName;
  const myPersonId = context?.person?.id;
  const [view, setView] = useSliceView();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [pushBusy, setPushBusy] = React.useState(false);
  const [clearAllOpen, setClearAllOpen] = React.useState(false);
  const { diagnostics, refresh: refreshPushStatus } = useNotificationDiagnostics(loggedIn);

  const handleTogglePush = async () => {
    if (WebPushHelper.requiresInstallForPush()) {
      router.push("/mobile/install");
      return;
    }

    setPushBusy(true);
    try {
      if (diagnostics.hasSubscription) await WebPushHelper.unsubscribe();
      else {
        const subscription = await WebPushHelper.subscribe();
        if (!subscription && WebPushHelper.getPermissionState() === "granted") {
          throw new Error("Permission granted, but device registration did not complete.");
        }
      }
      await refreshPushStatus();
    } catch (error) {
      console.error("[webpush] notifications toggle failed:", error);
    } finally {
      setPushBusy(false);
    }
  };

  const { data: serverNotifications = null } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", context?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/notifications/my", "MessagingApi");
      return Array.isArray(data) ? (data as NotificationItem[]) : [];
    },
    enabled: loggedIn
  });

  const { data: conversationsData, isError: conversationsFailed } = useQuery<Conversation[]>({
    queryKey: ["conversations", myPersonId],
    queryFn: () => fetchConversations(myPersonId),
    enabled: loggedIn,
    staleTime: 0
  });
  const conversations = !loggedIn ? [] : conversationsData ?? (conversationsFailed ? [] : null);

  const notifications = React.useMemo<NotificationItem[] | null>(() => {
    if (!loggedIn) return [];
    if (serverNotifications == null) return null;
    return serverNotifications;
  }, [loggedIn, serverNotifications]);

  const handleClick = (n: NotificationItem) => {
    const href = deriveNotificationUrl(n);
    if (!href) return;
    if (href.startsWith("http")) {
      window.location.href = href;
    } else {
      router.push(href);
    }
  };

  const queryKey = React.useMemo(() => ["notifications", context?.user?.id], [context?.user?.id]);

  const handleDelete = async (n: NotificationItem, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!n.id) return;
    const churchId = n.churchId || context?.userChurch?.church?.id;
    queryClient.setQueryData<NotificationItem[]>(queryKey, (prev) => (prev || []).filter((x) => x.id !== n.id));
    try {
      await ApiHelper.delete(`/notifications/${churchId}/${n.id}`, "MessagingApi");
    } catch (err) {
      console.error("Failed to delete notification", err);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const handleClearAll = async () => {
    setClearAllOpen(false);
    if (!notifications || notifications.length === 0) return;
    queryClient.setQueryData<NotificationItem[]>(queryKey, []);
    try {
      await ApiHelper.delete("/notifications/my", "MessagingApi");
    } catch (err) {
      console.error("Failed to clear notifications", err);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const unreadNotifications = (notifications || []).filter((n) => n.isNew).length;
  const unreadMessages = (conversations || []).filter((c) => c.unread).length;

  const skeletons = [0, 1, 2].map((k) => <Skeleton key={k} variant="text" height={44} />);

  const newBadge = (n: NotificationItem) => n.isNew ? <StatusBadge tone="pri">{Locale.label("mobile.inbox.new")}</StatusBadge> : undefined;

  const notificationRow = (n: NotificationItem, idx: number) => {
    const href = deriveNotificationUrl(n);
    return <Row key={n.id || `n-${idx}`} onClick={href ? () => handleClick(n) : undefined} title={n.message || ""} subtitle={formatRelative(n.timeSent)} trailing={newBadge(n)} />;
  };

  const deletableRow = (n: NotificationItem, idx: number) => (
    <Box key={n.id || `n-${idx}`} className="kit-row" sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {notificationRow(n, idx)}
      <IconButton
        aria-label={Locale.label("mobile.screens.deleteNotification")}
        data-testid={`notification-delete-${n.id || idx}`}
        size="small"
        onClick={(e) => handleDelete(n, e)}
        sx={{ color: tc.textSecondary, flex: "none", mr: "-6px" }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );

  const clearAllLink = notifications && notifications.length > 0
    ? <TextLink danger data-testid="notifications-clear-all" onClick={() => setClearAllOpen(true)}>{Locale.label("mobile.screens.clearAll")}</TextLink>
    : null;

  const renderPushSection = () => {
    if (!loggedIn || diagnostics.permission === "unsupported") return null;
    const on = diagnostics.hasSubscription && (!diagnostics.serverRegistrationEnabled || diagnostics.hasConfirmedServerEnrollment);
    const blocked = diagnostics.permission === "denied";
    const pendingRegistration = diagnostics.permission === "granted" && (!diagnostics.hasSubscription || (diagnostics.serverRegistrationEnabled && !diagnostics.hasConfirmedServerEnrollment));
    const installRequired = WebPushHelper.requiresInstallForPush();
    const status = blocked
      ? Locale.label("mobile.screens.pushBlocked").replace("{}", WebPushHelper.getUnblockInstructions())
      : installRequired
        ? (diagnostics.statusReason || Locale.label("mobile.screens.pushInstallRequired"))
        : pendingRegistration
          ? (diagnostics.statusReason || Locale.label("mobile.screens.pushPendingRegistration"))
          : on
            ? Locale.label("mobile.screens.pushOn")
            : Locale.label("mobile.screens.pushOff");
    return (
      <PlateSection title={Locale.label("mobile.screens.pushNotifications")}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px 16px" }}>
          <Typography sx={{ flex: 1, minWidth: 0, fontSize: 15, color: tc.text }}>{status}</Typography>
          {!blocked && (
            <TextLink disabled={pushBusy} onClick={handleTogglePush}>
              {on ? Locale.label("mobile.screens.turnOff") : installRequired ? Locale.label("mobile.screenTitles.installApp") : pendingRegistration ? Locale.label("mobile.details.retry") : Locale.label("mobile.screens.turnOn")}
            </TextLink>
          )}
        </Box>
      </PlateSection>
    );
  };

  const renderInbox = () => (
    <Plate>
      <PlateSection title={Locale.label("mobile.components.messages")} action={<TextLink href="/mobile/messages">{Locale.label("mobile.components.viewAllMessages")}</TextLink>}>
        {conversations === null && skeletons}
        {conversations !== null && conversations.length === 0 && <QuietEmpty>{Locale.label("mobile.components.noMessages")}</QuietEmpty>}
        {conversations !== null && conversations.length > 0 && (
          <RowList>
            {conversations.slice(0, TEASER_COUNT).map((c) => (
              <Row
                key={c.id}
                href={conversationHref(c)}
                leading={<ConversationAvatar c={c} />}
                title={<Box component="span" sx={{ fontWeight: c.unread ? 650 : 500 }}>{c.personName}</Box>}
                subtitle={c.preview || undefined}
                trailing={c.lastTime ? <Typography component="span" sx={{ fontSize: 13, color: tc.textSecondary, flex: "none" }}>{formatRelative(c.lastTime)}</Typography> : undefined}
              />
            ))}
          </RowList>
        )}
      </PlateSection>
      <PlateSection
        title={Locale.label("mobile.components.notifications")}
        action={(
          <Box sx={{ display: "flex", gap: "16px" }}>
            {clearAllLink}
            {notifications && notifications.length > 0 && <TextLink onClick={() => setView("notifications")}>{Locale.label("mobile.components.viewAllNotifications")}</TextLink>}
          </Box>
        )}
      >
        {notifications === null && skeletons}
        {notifications !== null && notifications.length === 0 && <QuietEmpty>{Locale.label("mobile.components.noNotifications")}</QuietEmpty>}
        {notifications !== null && notifications.length > 0 && <RowList>{notifications.slice(0, TEASER_COUNT).map(notificationRow)}</RowList>}
      </PlateSection>
      {renderPushSection()}
    </Plate>
  );

  const renderAllNotifications = () => {
    const list = (notifications || []).filter((n) => filter === "all" || n.isNew);
    const today = startOfDay(new Date()).getTime();
    const weekAgo = today - 6 * 86400000;
    const groups: { key: string; label: string; items: NotificationItem[] }[] = [
      { key: "today", label: Locale.label("mobile.inbox.today"), items: [] },
      { key: "week", label: Locale.label("mobile.inbox.thisWeek"), items: [] },
      { key: "earlier", label: Locale.label("mobile.inbox.earlier"), items: [] }
    ];
    list.forEach((n) => {
      const t = n.timeSent ? new Date(n.timeSent).getTime() : NaN;
      const g = isNaN(t) ? groups[2] : t >= today ? groups[0] : t >= weekAgo ? groups[1] : groups[2];
      g.items.push(n);
    });
    return (
      <>
        <BackVerb label={Locale.label("mobile.inbox.backToInbox")} onClick={() => setView("")} />
        <Plate>
          <PlateSection title={Locale.label("mobile.components.notifications")} action={clearAllLink}>
            {notifications === null && skeletons}
            {notifications !== null && notifications.length === 0 && <QuietEmpty>{Locale.label("mobile.components.noNotifications")}</QuietEmpty>}
            {notifications !== null && notifications.length > 0 && (
              <>
                <FilterPills
                  label={Locale.label("mobile.components.notifications")}
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: Locale.label("mobile.group.selectAll") },
                    { value: "unread", label: `${Locale.label("mobile.screens.unread")} · ${unreadNotifications}` }
                  ]}
                />
                {list.length === 0 && <QuietEmpty sx={{ mt: "16px" }}>{Locale.label("mobile.inbox.noUnread")}</QuietEmpty>}
                {groups.filter((g) => g.items.length > 0).map((g) => (
                  <Box key={g.key} sx={{ mt: "20px" }}>
                    <Typography component="h3" sx={{ fontSize: 12, lineHeight: "18px", fontWeight: 650, letterSpacing: "0.07em", textTransform: "uppercase", color: tc.textSecondary, m: 0 }}>{g.label}</Typography>
                    <RowList>{g.items.map(deletableRow)}</RowList>
                  </Box>
                ))}
              </>
            )}
          </PlateSection>
        </Plate>
      </>
    );
  };

  const summary = [
    unreadMessages > 0 ? Locale.label("mobile.inbox.unreadMessages").replace("{}", String(unreadMessages)) : "",
    unreadNotifications > 0 ? Locale.label("mobile.inbox.newNotifications").replace("{}", String(unreadNotifications)) : ""
  ].filter(Boolean).join(" · ");

  return (
    <Box sx={{ pb: "24px" }}>
      {view === "notifications"
        ? renderAllNotifications()
        : (
          <>
            <PageHead title={Locale.label("mobile.inbox.title")} lede={summary || undefined}>
              {loggedIn && (
                <Button variant="outlined" component={Link} href="/mobile/notificationPrefs" startIcon={<SettingsOutlinedIcon />}>
                  {Locale.label("mobile.screenTitles.notificationPrefs")}
                </Button>
              )}
            </PageHead>
            {renderInbox()}
          </>
        )}
      <Dialog open={clearAllOpen} onClose={() => setClearAllOpen(false)}>
        <DialogTitle>{Locale.label("mobile.screens.clearAllTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{Locale.label("mobile.screens.clearAllBody")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllOpen(false)}>{Locale.label("common.cancel")}</Button>
          <Button color="error" onClick={handleClearAll} data-testid="confirm-clear-notifications">{Locale.label("mobile.screens.clearAll")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
