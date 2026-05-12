"use client";

import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, Locale, PersonHelper, SocketHelper, SubscriptionManager, UserHelper } from "@churchapps/apphelper";
import { SubscriptionToggle, SUBSCRIPTION_MESSAGE_TYPE } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";

export type ChatSubTab = "discussions" | "announcements";

type ContentType = "group" | "groupAnnouncement";

interface Message {
  id?: string;
  personId?: string;
  content?: string;
  messageType?: string;
  timeSent?: string | Date;
  timeUpdated?: string | Date;
}

interface Conversation {
  id?: string;
  contentType?: string;
  contentId?: string;
  title?: string;
  messages?: Message[];
}

interface Props {
  open: boolean;
  groupId: string;
  groupName?: string;
  isLeader?: boolean;
  initialSubTab?: ChatSubTab;
  onClose: () => void;
}

export const GroupChatModal = ({
  open,
  groupId,
  groupName,
  isLeader = false,
  initialSubTab = "discussions",
  onClose
}: Props) => {
  const tc = mobileTheme.colors;
  const [subTab, setSubTab] = React.useState<ChatSubTab>(initialSubTab);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [people, setPeople] = React.useState<Record<string, PersonInterface>>({});
  const [hasAnnouncements, setHasAnnouncements] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = React.useState<{ el: HTMLElement; message: Message } | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Message | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const currentContentType: ContentType = subTab === "announcements" ? "groupAnnouncement" : "group";
  const canPost = subTab === "announcements" ? isLeader : true;

  React.useEffect(() => {
    if (open) setSubTab(initialSubTab);
  }, [open, initialSubTab]);

  const loadAnnouncementsPreflight = React.useCallback(async () => {
    if (!groupId || !open) return;
    if (isLeader) {
      setHasAnnouncements(true);
      return;
    }
    try {
      const data: Conversation[] = await ApiHelper.get(
        `/conversations/messages/groupAnnouncement/${groupId}?page=1&limit=1`,
        "MessagingApi"
      );
      const any =
        Array.isArray(data) &&
        data.some((c) => Array.isArray(c.messages) && c.messages.length > 0);
      setHasAnnouncements(any);
    } catch {
      setHasAnnouncements(false);
    }
  }, [groupId, isLeader, open]);

  const loadConversations = React.useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data: Conversation[] = await ApiHelper.get(
        `/conversations/messages/${currentContentType}/${groupId}?page=1&limit=50`,
        "MessagingApi"
      );
      const list = Array.isArray(data) ? data : [];
      setConversations(list);

      const ids = new Set<string>();
      list.forEach((c) =>
        (c.messages || []).forEach((m) => m.personId && ids.add(m.personId)));
      const arr = Array.from(ids);
      if (arr.length > 0) {
        try {
          const p: PersonInterface[] = await ApiHelper.get(
            `/people/basic?ids=${arr.join(",")}`,
            "MembershipApi"
          );
          if (Array.isArray(p)) {
            const map: Record<string, PersonInterface> = {};
            p.forEach((x) => {
              if (x.id) map[x.id] = x;
            });
            setPeople((prev) => ({ ...prev, ...map }));
          }
        } catch {

        }
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, currentContentType]);

  React.useEffect(() => {
    if (open) loadConversations();
  }, [open, subTab, loadConversations]);

  React.useEffect(() => {
    if (open) loadAnnouncementsPreflight();
  }, [open, loadAnnouncementsPreflight]);

  // Real-time: join the conversation room (after first load) and refresh on inbound events.
  React.useEffect(() => {
    if (!open) return;
    const churchId = UserHelper.currentUserChurch?.church?.id;
    const personId = UserHelper.person?.id;
    const conversationId = conversations[0]?.id;
    if (!conversationId || !churchId) return;

    SubscriptionManager.joinRoom(conversationId, churchId, personId).catch(() => { /* ignore */ });

    const handlerId = `GroupChatModal-${conversationId}`;
    SocketHelper.addHandler("message", handlerId + "-msg", () => { loadConversations(); });
    SocketHelper.addHandler("deleteMessage", handlerId + "-del", () => { loadConversations(); });

    return () => {
      SocketHelper.removeHandler(handlerId + "-msg");
      SocketHelper.removeHandler(handlerId + "-del");
      SubscriptionManager.leaveRoom(conversationId, churchId).catch(() => { /* ignore */ });
    };
  }, [open, conversations[0]?.id, loadConversations]);

  const allMessages = React.useMemo(() => {
    const flat: Message[] = [];
    conversations.forEach((c) =>
      (c.messages || []).forEach((m) => flat.push(m)));
    flat.sort((a, b) => {
      const ta = a.timeSent ? new Date(a.timeSent).getTime() : 0;
      const tb = b.timeSent ? new Date(b.timeSent).getTime() : 0;
      return ta - tb;
    });
    return flat;
  }, [conversations]);

  // Hide subscription marker rows from the rendered thread — they're an internal
  // signal for NotificationHelper, not user-facing chat.
  const messages = React.useMemo(
    () => allMessages.filter((m) => m.messageType !== SUBSCRIPTION_MESSAGE_TYPE),
    [allMessages]
  );

  const conversationId = conversations[0]?.id;

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, loading]);

  const myPersonId = UserHelper.person?.id;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    if (!canPost) return;
    setSending(true);
    try {

      if (editingId) {
        await ApiHelper.post(
          `/messages`,
          [
            {
              id: editingId,
              conversationId: conversations[0]?.id,
              content: text,
              personId: myPersonId
            }
          ],
          "MessagingApi"
        );
        setDraft("");
        setEditingId(null);
        await loadConversations();
        return;
      }

      let conversationId = conversations[0]?.id;
      if (!conversationId) {
        const convPayload = {
          groupId,
          allowAnonymousPosts: false,
          contentType: currentContentType,
          contentId: groupId,
          title: Locale.label("mobile.group.groupChatTitle")
            .replace("{}", groupName || Locale.label("mobile.components.group"))
            .replace("{}", currentContentType === "groupAnnouncement" ? Locale.label("mobile.group.announcements") : Locale.label("mobile.group.chat")),
          visibility: "hidden"
        };
        const result: Conversation[] = await ApiHelper.post(
          "/conversations",
          [convPayload],
          "MessagingApi"
        );
        conversationId = result?.[0]?.id;
      }
      if (!conversationId) return;
      await ApiHelper.post(
        `/messages`,
        [
          {
            conversationId,
            content: text,
            personId: myPersonId
          }
        ],
        "MessagingApi"
      );
      setDraft("");
      await loadConversations();
    } catch {

    } finally {
      setSending(false);
    }
  };

  const handleStartEdit = (m: Message) => {
    setEditingId(m.id || null);
    setDraft(m.content || "");
    setMenuAnchor(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const handleRequestDelete = (m: Message) => {
    setConfirmDelete(m);
    setMenuAnchor(null);
  };

  const handleConfirmDelete = async () => {
    const m = confirmDelete;
    setConfirmDelete(null);
    if (!m?.id) return;
    try {
      await ApiHelper.delete("/messages/" + m.id, "MessagingApi");
      if (editingId === m.id) {
        setEditingId(null);
        setDraft("");
      }
      await loadConversations();
    } catch {

    }
  };

  const formatRelative = (t?: string | Date) => {
    if (!t) return "";
    const d = typeof t === "string" ? new Date(t) : t;
    if (isNaN(d.getTime())) return "";
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return Locale.label("mobile.now");
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  const renderMessageContent = (content: string) => {
    const imageRegex = /https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|svg)(\?\S*)?/gi;
    const urlRegex = /https?:\/\/\S+/gi;

    const imageMatches = content.match(imageRegex);
    const urlMatches = content.match(urlRegex);

    const textWithoutUrls = content.replace(urlRegex, "").trim();

    return (
      <>
        {textWithoutUrls && (
          <Typography sx={{ fontSize: 15, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
            {textWithoutUrls}
          </Typography>
        )}
        {imageMatches?.map((url, i) => (
          <Box
            key={i}
            component="img"
            src={url}
            alt="image"
            sx={{ maxWidth: "100%", borderRadius: 2, mt: 0.5 }}
          />
        ))}
        {urlMatches
          ?.filter((url) => !imageRegex.test(url))
          .map((url, i) => (
            <Box
              key={i}
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
                px: 1.5,
                py: 1,
                bgcolor: "rgba(255,255,255,0.15)",
                borderRadius: "10px",
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <Icon sx={{ fontSize: 18 }}>attach_file</Icon>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                Open file
              </Typography>
            </Box>
          ))}
      </>
    );
  };

  const renderEmpty = () => (
    <Box sx={{ textAlign: "center", p: `${mobileTheme.spacing.lg}px`, mt: 2 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "32px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>
          {subTab === "announcements" ? "campaign" : "chat"}
        </Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        {subTab === "announcements" ? Locale.label("mobile.group.noAnnouncementsYet") : Locale.label("mobile.group.startTheConversation")}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        {subTab === "announcements"
          ? isLeader
            ? Locale.label("mobile.group.postAnnouncementBelow")
            : Locale.label("mobile.group.leadersCanPost")
          : Locale.label("mobile.group.beFirstToShare")}
      </Typography>
    </Box>
  );

  const renderMessages = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "2px", py: `${mobileTheme.spacing.sm}px` }}>
      {messages.map((m, i) => {
        const isMine = m.personId === myPersonId;
        const p = m.personId ? people[m.personId] : undefined;
        const name = p?.name?.display || "";
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const showName = !isMine && (!prev || prev.personId !== m.personId);
        const showAvatar = !isMine && (!next || next.personId !== m.personId);
        const photo = p ? (() => { try { return PersonHelper.getPhotoUrl(p); } catch { return ""; } })() : "";
        const showActions = isMine && !!m.id;
        return (
          <Box
            key={m.id || `m-${i}`}
            sx={{
              display: "flex",
              flexDirection: isMine ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 1
            }}
          >
            {showActions && (
              <IconButton
                size="small"
                aria-label={Locale.label("mobile.group.messageActions")}
                onClick={(e) => setMenuAnchor({ el: e.currentTarget, message: m })}
                sx={{ color: tc.textMuted, p: "4px" }}
              >
                <Icon sx={{ fontSize: 18 }}>more_vert</Icon>
              </IconButton>
            )}
            {!isMine && (
              <Box sx={{ width: 32, flexShrink: 0 }}>
                {showAvatar ? (
                  photo ? (
                    <Box
                      component="img"
                      src={photo}
                      alt={name}
                      sx={{ width: 32, height: 32, borderRadius: "16px", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "16px",
                        bgcolor: tc.primaryLight,
                        color: tc.primary,
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {(name[0] || "?").toUpperCase()}
                    </Box>
                  )
                ) : null}
              </Box>
            )}
            <Box
              sx={{
                maxWidth: "75%",
                bgcolor: isMine ? tc.primary : tc.surface,
                color: isMine ? tc.onPrimary : tc.text,
                px: 1.5,
                py: 1,
                borderRadius: "18px",
                borderBottomLeftRadius: !isMine ? "4px" : "18px",
                borderBottomRightRadius: isMine ? "4px" : "18px",
                boxShadow: mobileTheme.shadows.sm
              }}
            >
              {showName && name && (
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: tc.primary, mb: "2px" }}>
                  {name}
                </Typography>
              )}
              {/* <Typography sx={{ fontSize: 15, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                {m.content}
              </Typography> */}
              {renderMessageContent(m.content || "")}
              <Typography
                sx={{
                  fontSize: 11,
                  mt: "2px",
                  opacity: 0.8,
                  color: isMine ? "rgba(255,255,255,0.85)" : tc.textSecondary,
                  textAlign: "right"
                }}
              >
                {formatRelative(m.timeSent)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  const showAnnouncementsTab = isLeader || hasAnnouncements;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: `${mobileTheme.radius.xl}px`,
          height: "85dvh",
          maxHeight: "85dvh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: `${mobileTheme.spacing.md}px`,
          py: `${mobileTheme.spacing.sm}px`,
          borderBottom: `1px solid ${tc.border}`
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>
          {groupName || Locale.label("mobile.group.groupChat")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <SubscriptionToggle
            conversationId={conversationId}
            messages={allMessages as any}
            personId={myPersonId}
          />
          <IconButton onClick={onClose} sx={{ color: tc.text }} aria-label={Locale.label("mobile.components.close")}>
            <Icon>close</Icon>
          </IconButton>
        </Box>
      </Box>
      {showAnnouncementsTab && (
        <Box sx={{ borderBottom: `1px solid ${tc.border}` }}>
          <Tabs
            value={subTab}
            onChange={(_, v) => setSubTab(v)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 52,
              "& .MuiTabs-indicator": { backgroundColor: tc.primary, height: 2 },
              "& .MuiTab-root": {
                minHeight: 52,
                textTransform: "none",
                fontWeight: 500,
                fontSize: 14,
                color: tc.textSecondary
              },
              "& .Mui-selected": { color: `${tc.primary} !important`, fontWeight: 700 }
            }}
          >
            <Tab value="discussions" label={Locale.label("mobile.group.discussions")} />
            <Tab value="announcements" label={Locale.label("mobile.group.announcements")} />
          </Tabs>
        </Box>
      )}
      <DialogContent
        ref={scrollRef}
        sx={{ px: `${mobileTheme.spacing.md}px`, py: 0, flex: 1, overflow: "auto", bgcolor: tc.background }}
      >
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress sx={{ color: tc.primary }} />
          </Box>
        )}
        {!loading && messages.length === 0 && renderEmpty()}
        {!loading && messages.length > 0 && renderMessages()}
      </DialogContent>
      {editingId && (
        <Box
          sx={{
            bgcolor: tc.iconBackground,
            borderTop: `1px solid ${tc.border}`,
            px: `${mobileTheme.spacing.md}px`,
            py: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px"
          }}
        >
          <Typography sx={{ fontSize: 12, color: tc.primary, fontWeight: 600 }}>
            {Locale.label("mobile.group.editingMessage")}
          </Typography>
          <Button
            size="small"
            onClick={handleCancelEdit}
            sx={{ color: tc.primary, textTransform: "none", fontSize: 12, minWidth: 0 }}
          >
            {Locale.label("mobile.group.cancel")}
          </Button>
        </Box>
      )}
      {canPost ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: `${mobileTheme.spacing.md}px`,
            py: `${mobileTheme.spacing.sm}px`,
            borderTop: `1px solid ${tc.border}`,
            bgcolor: tc.surface
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={
              subTab === "announcements" ? Locale.label("mobile.group.postAnnouncement") : Locale.label("mobile.group.sendAMessage")
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            multiline
            maxRows={4}
            InputProps={{
              sx: { borderRadius: "20px" },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    sx={{
                      color: draft.trim() ? "#fff" : tc.disabled,
                      bgcolor: draft.trim() ? tc.primary : tc.iconBackground,
                      "&:hover": { bgcolor: draft.trim() ? tc.primary : tc.iconBackground },
                      width: 36,
                      height: 36
                    }}
                  >
                    <Icon sx={{ fontSize: 20 }}>send</Icon>
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      ) : (
        <Box sx={{ py: 1.5, borderTop: `1px solid ${tc.border}`, bgcolor: tc.surface }}>
          <Typography sx={{ fontSize: 12, color: tc.textMuted, textAlign: "center" }}>
            Only group leaders can post announcements.
          </Typography>
        </Box>
      )}
      <Menu
        anchorEl={menuAnchor?.el || null}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => menuAnchor && handleStartEdit(menuAnchor.message)}>
          <Icon sx={{ fontSize: 18, mr: 1, color: tc.textMuted }}>edit</Icon>
          {Locale.label("mobile.group.edit")}
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleRequestDelete(menuAnchor.message)}>
          <Icon sx={{ fontSize: 18, mr: 1, color: tc.textMuted }}>delete_outline</Icon>
          {Locale.label("mobile.group.delete")}
        </MenuItem>
      </Menu>
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>{Locale.label("mobile.group.confirmDeleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {Locale.label("mobile.group.confirmDeleteMessage")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>
            {Locale.label("mobile.group.cancel")}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            {Locale.label("mobile.group.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default GroupChatModal;
