"use client";

import React from "react";
import { Box, Button, CircularProgress, Dialog, IconButton, Menu, MenuItem, Snackbar, TextField, Typography } from "@mui/material";
import AddReactionOutlinedIcon from "@mui/icons-material/AddReactionOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SendIcon from "@mui/icons-material/Send";
import { ApiHelper, Locale, PersonHelper, SocketHelper, SubscriptionManager, UserHelper } from "@churchapps/apphelper";
import { SubscriptionToggle, SUBSCRIPTION_MESSAGE_TYPE } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";
import { Eyebrow, PersonAvatar, QuietEmpty, Sheet, TextLink } from "../kit";

export type ChatSubTab = "discussions" | "announcements";

type ContentType = "group" | "groupAnnouncement";

interface MessageReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

interface Message {
  id?: string;
  personId?: string;
  content?: string;
  messageType?: string;
  timeSent?: string | Date;
  timeUpdated?: string | Date;
  reactions?: MessageReaction[];
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "🙏", "😮"];

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
  // Per-group feed toggles set by staff in B1Admin; the Api enforces them on post.
  discussionsEnabled?: boolean;
  announcementsEnabled?: boolean;
  initialSubTab?: ChatSubTab;
  onClose: () => void;
}

export const GroupChatModal = ({
  open,
  groupId,
  groupName,
  isLeader = false,
  discussionsEnabled = true,
  announcementsEnabled = true,
  initialSubTab = "discussions",
  onClose
}: Props) => {
  const tc = mobileTheme.colors;
  const [requestedTab, setSubTab] = React.useState<ChatSubTab>(initialSubTab);
  // A disabled feed can never be the active one, whatever the caller or a stale deep link asked for.
  const subTab: ChatSubTab =
    requestedTab === "discussions" && !discussionsEnabled ? "announcements"
      : requestedTab === "announcements" && !announcementsEnabled ? "discussions"
        : requestedTab;
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [people, setPeople] = React.useState<Record<string, PersonInterface>>({});
  const [hasAnnouncements, setHasAnnouncements] = React.useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = React.useState<Message | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = React.useState<{ el: HTMLElement; message: Message } | null>(null);
  const [reactAnchor, setReactAnchor] = React.useState<{ el: HTMLElement; message: Message } | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Message | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [loadedType, setLoadedType] = React.useState<string | null>(null);
  const loadSeqRef = React.useRef(0);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // isMine flips only the caller's own highlight; inbound echoes don't change status.
  const applyReaction = React.useCallback((messageId: string, emoji: string, added: boolean, isMine: boolean) => {
    setConversations((prev) => prev.map((c) => ({
      ...c,
      messages: (c.messages || []).map((m) => {
        if (m.id !== messageId) return m;
        const reactions = [...(m.reactions || [])];
        const i = reactions.findIndex((r) => r.emoji === emoji);
        if (added) {
          if (i >= 0) reactions[i] = { ...reactions[i], count: reactions[i].count + 1, mine: isMine ? true : reactions[i].mine };
          else reactions.push({ emoji, count: 1, mine: isMine });
        } else if (i >= 0) {
          const nc = reactions[i].count - 1;
          if (nc <= 0) reactions.splice(i, 1);
          else reactions[i] = { ...reactions[i], count: nc, mine: isMine ? false : reactions[i].mine };
        }
        return { ...m, reactions };
      })
    })));
  }, []);

  const currentContentType: ContentType = subTab === "announcements" ? "groupAnnouncement" : "group";
  const canPost = subTab === "announcements" ? isLeader : true;

  React.useEffect(() => {
    if (open) setSubTab(initialSubTab);
  }, [open, initialSubTab]);

  const loadAnnouncementsPreflight = React.useCallback(async () => {
    if (!groupId || !open) return;
    try {
      const data: Conversation[] = await ApiHelper.get(
        `/conversations/messages/groupAnnouncement/${groupId}?page=1&limit=1`,
        "MessagingApi"
      );
      const latest = (Array.isArray(data) ? data : [])
        .flatMap((c) => c.messages || [])
        .filter((m) => m.messageType !== SUBSCRIPTION_MESSAGE_TYPE)[0] || null;
      setLatestAnnouncement(latest);
      setHasAnnouncements(isLeader || !!latest);
      if (latest?.personId) {
        try {
          const p: PersonInterface[] = await ApiHelper.get(`/people/basic?ids=${latest.personId}`, "MembershipApi");
          if (Array.isArray(p) && p[0]?.id) setPeople((prev) => ({ ...prev, [p[0].id!]: p[0] }));
        } catch { /* name falls back to blank */ }
      }
    } catch {
      setLatestAnnouncement(null);
      setHasAnnouncements(isLeader);
    }
  }, [groupId, isLeader, open]);

  const loadConversations = React.useCallback(async () => {
    if (!groupId) return;
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const data: Conversation[] = await ApiHelper.get(
        `/conversations/messages/${currentContentType}/${groupId}?page=1&limit=50`,
        "MessagingApi"
      );
      if (seq !== loadSeqRef.current) return;
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      setLoadedType(currentContentType);

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
      if (seq !== loadSeqRef.current) return;
      setConversations([]);
      setLoadedType(null);
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
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
    // Own reactions are applied optimistically from the POST response; ignore the self-echo.
    SocketHelper.addHandler("reaction", "GroupChatModal-Reaction", (data: any) => {
      if (!data?.messageId || data.personId === UserHelper.person?.id) return;
      applyReaction(data.messageId, data.emoji, !!data.added, false);
    });

    return () => {
      SocketHelper.removeHandler(handlerId + "-msg");
      SocketHelper.removeHandler(handlerId + "-del");
      SocketHelper.removeHandler("GroupChatModal-Reaction");
      SubscriptionManager.leaveRoom(conversationId, churchId).catch(() => { /* ignore */ });
    };
  }, [open, conversations[0]?.id, loadConversations, applyReaction]);

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

  // Subscription marker rows are internal signals for NotificationHelper, not user-facing.
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
    if (!canPost || loadedType !== currentContentType) return;
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
      setActionError(Locale.label("mobile.details.messageFailed"));
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
      setActionError(Locale.label("mobile.details.deleteFailed"));
    }
  };

  const handleToggleReaction = async (m: Message, emoji: string) => {
    setReactAnchor(null);
    if (!m.id) return;
    try {
      const res: any = await ApiHelper.post(`/messages/${m.id}/reactions`, { emoji }, "MessagingApi");
      applyReaction(m.id, emoji, !!res?.added, true);
    } catch {
      /* ignore */
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
        {textWithoutUrls && <Typography sx={{ fontSize: 15, lineHeight: "21px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{textWithoutUrls}</Typography>}
        {imageMatches?.map((url, i) => (
          <Box key={i} component="img" src={url} alt="" sx={{ maxWidth: "100%", borderRadius: "8px", mt: 0.5, display: "block" }} />
        ))}
        {urlMatches
          ?.filter((url) => !new RegExp(imageRegex.source, "i").test(url))
          .map((url, i) => (
            <Box
              key={i}
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "inline-flex", alignItems: "center", gap: "6px", mt: 0.5, fontSize: 14, fontWeight: 600, color: "inherit", textDecoration: "underline" }}
            >
              <AttachFileIcon sx={{ fontSize: 18 }} />
              {Locale.label("mobile.group.openFile")}
            </Box>
          ))}
      </>
    );
  };

  const nameOf = (personId?: string) => (personId && people[personId]?.name?.display) || "";

  const renderMessages = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "10px", py: "16px" }}>
      {messages.map((m, i) => {
        const isMine = m.personId === myPersonId;
        const p = m.personId ? people[m.personId] : undefined;
        const name = nameOf(m.personId);
        const prev = messages[i - 1];
        const showName = !isMine && (!prev || prev.personId !== m.personId);
        const photo = p ? (() => { try { return PersonHelper.getPhotoUrl(p); } catch { return ""; } })() : "";
        const showActions = (isMine || isLeader) && !!m.id;
        const reactions = (m.reactions || []).filter((r) => r.count > 0);
        return (
          <Box key={m.id || `m-${i}`} sx={{ display: "flex", gap: "8px", alignItems: "flex-start", flexDirection: isMine ? "row-reverse" : "row" }}>
            {!isMine && <Box sx={{ width: 32, flex: "none", pt: showName ? "22px" : 0 }}>{showName && <PersonAvatar name={name} src={photo || undefined} size={32} />}</Box>}
            <Box sx={{ maxWidth: "78%", minWidth: 0, display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
              {showName && (
                <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, mb: "4px" }}>
                  {[name, formatRelative(m.timeSent)].filter(Boolean).join(" · ")}
                </Typography>
              )}
              <Box sx={{
                px: "12px",
                py: "8px",
                borderRadius: "14px",
                bgcolor: isMine ? tc.primary : tc.surface,
                color: isMine ? tc.onPrimary : tc.text,
                border: isMine ? 0 : `1px solid ${tc.border}`
              }}>
                {renderMessageContent(m.content || "")}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", mt: "4px", flexDirection: isMine ? "row-reverse" : "row" }}>
                {reactions.map((r) => (
                  <Box
                    key={r.emoji}
                    component="button"
                    type="button"
                    aria-pressed={r.mine}
                    onClick={() => handleToggleReaction(m, r.emoji)}
                    data-testid={`reaction-chip-${r.emoji}`}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      height: 24,
                      px: "8px",
                      borderRadius: 999,
                      cursor: "pointer",
                      font: "inherit",
                      fontSize: 12.5,
                      fontWeight: 600,
                      border: `1px solid ${r.mine ? tc.onChip : "transparent"}`,
                      bgcolor: tc.chip,
                      color: tc.onChip
                    }}
                  >
                    <span>{r.emoji}</span>
                    <span>{r.count}</span>
                  </Box>
                ))}
                {m.id && (
                  <IconButton size="small" aria-label={Locale.label("mobile.group.addReaction")} onClick={(e) => setReactAnchor({ el: e.currentTarget, message: m })} data-testid={`react-add-${m.id}`} sx={{ p: "2px", color: tc.textSecondary }}>
                    <AddReactionOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
                {showActions && (
                  <IconButton size="small" aria-label={Locale.label("mobile.group.messageActions")} onClick={(e) => setMenuAnchor({ el: e.currentTarget, message: m })} data-testid={`message-actions-${m.id}`} sx={{ p: "2px", color: tc.textSecondary }}>
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
                {(isMine || !showName) && <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>{formatRelative(m.timeSent)}</Typography>}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  const showAnnouncementsFeed = announcementsEnabled && (isLeader || hasAnnouncements);
  const feedLabel = subTab === "announcements" ? Locale.label("mobile.group.announcements") : Locale.label("mobile.group.chat");
  const column = { width: "100%", maxWidth: 760, mx: "auto", px: "16px", boxSizing: "border-box" } as const;

  const renderStrip = () => {
    if (subTab === "discussions" && showAnnouncementsFeed) {
      return (
        <Box sx={{ ...column, py: "12px" }} data-testid="group-chat-announcement">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", mb: "2px" }}>
            <Eyebrow component="p">{Locale.label("mobile.group.announcement")}</Eyebrow>
            <TextLink onClick={() => setSubTab("announcements")}>{Locale.label("mobile.group.allAnnouncements")}</TextLink>
          </Box>
          {latestAnnouncement ? (
            <>
              <Typography sx={{ fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{latestAnnouncement.content}</Typography>
              <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{[nameOf(latestAnnouncement.personId), formatRelative(latestAnnouncement.timeSent)].filter(Boolean).join(" · ")}</Typography>
            </>
          ) : <QuietEmpty>{Locale.label("mobile.group.noAnnouncementsYet")}</QuietEmpty>}
        </Box>
      );
    }
    if (subTab === "announcements" && discussionsEnabled) {
      return (
        <Box sx={{ ...column, py: "10px" }}>
          <TextLink onClick={() => setSubTab("discussions")}><ArrowBackIcon sx={{ fontSize: 18 }} />{Locale.label("mobile.group.backToChat")}</TextLink>
        </Box>
      );
    }
    return null;
  };

  const strip = renderStrip();
  const titleId = React.useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      aria-labelledby={titleId}
      PaperProps={{ sx: { bgcolor: tc.background, backgroundImage: "none", display: "flex", flexDirection: "column", overflow: "hidden" } }}
    >
      <Box sx={{ bgcolor: tc.surface, borderBottom: `1px solid ${tc.border}`, pt: mobileTheme.safe.top }}>
        <Box sx={{ ...column, px: "4px", display: "flex", alignItems: "center", gap: "4px", minHeight: 56 }}>
          <IconButton onClick={onClose} aria-label={Locale.label("mobile.group.backTo").replace("{}", groupName || Locale.label("mobile.components.group"))} sx={{ color: tc.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0, pl: "4px" }}>
            <Typography data-testid="group-chat-feed-label" sx={{ fontSize: 11, lineHeight: "14px", fontWeight: 650, letterSpacing: "0.07em", textTransform: "uppercase", color: tc.eyebrow }}>
              {feedLabel}
            </Typography>
            <Typography id={titleId} component="h1" sx={{ fontSize: 17, lineHeight: "22px", fontWeight: 600, color: tc.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {groupName || Locale.label("mobile.group.groupChat")}
            </Typography>
          </Box>
          <SubscriptionToggle conversationId={conversationId} messages={allMessages as any} personId={myPersonId} />
        </Box>
      </Box>
      {strip && <Box sx={{ bgcolor: tc.surface, borderBottom: `1px solid ${tc.border}` }}>{strip}</Box>}
      <Box ref={scrollRef} sx={{ flex: 1, overflow: "auto" }}>
        <Box sx={column}>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress size={28} sx={{ color: tc.primary }} />
            </Box>
          )}
          {!loading && messages.length === 0 && (
            <Box sx={{ py: "32px", textAlign: "center" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
                {subTab === "announcements" ? Locale.label("mobile.group.noAnnouncementsYet") : Locale.label("mobile.group.startTheConversation")}
              </Typography>
              <QuietEmpty>
                {subTab === "announcements"
                  ? isLeader ? Locale.label("mobile.group.postAnnouncementBelow") : Locale.label("mobile.group.leadersCanPost")
                  : Locale.label("mobile.group.beFirstToShare")}
              </QuietEmpty>
            </Box>
          )}
          {!loading && messages.length > 0 && renderMessages()}
        </Box>
      </Box>
      <Box sx={{ bgcolor: tc.surface, borderTop: `1px solid ${tc.border}`, pb: mobileTheme.safe.bottom }}>
        {editingId && (
          <Box sx={{ ...column, pt: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, fontWeight: 600 }}>{Locale.label("mobile.group.editingMessage")}</Typography>
            <TextLink onClick={handleCancelEdit}>{Locale.label("mobile.group.cancel")}</TextLink>
          </Box>
        )}
        {canPost ? (
          <Box sx={{ ...column, py: "8px", display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <TextField
              fullWidth
              size="small"
              placeholder={subTab === "announcements" ? Locale.label("mobile.group.postAnnouncement") : Locale.label("mobile.group.sendAMessage")}
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
              slotProps={{ input: { sx: { borderRadius: "8px", minHeight: 44 } } }}
            />
            <Button variant="contained" onClick={handleSend} disabled={sending || !draft.trim()} aria-label={Locale.label("mobile.details.send")} sx={{ minWidth: 44, width: 44, height: 44, px: 0, flex: "none" }}>
              <SendIcon sx={{ fontSize: 20 }} />
            </Button>
          </Box>
        ) : (
          <Box sx={{ ...column, py: "14px" }}>
            <QuietEmpty sx={{ textAlign: "center", fontSize: 14 }}>{Locale.label("mobile.group.onlyLeadersPost", "Only group leaders can post announcements.")}</QuietEmpty>
          </Box>
        )}
      </Box>
      <Menu
        anchorEl={menuAnchor?.el || null}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {menuAnchor?.message.personId === myPersonId && (
          <MenuItem onClick={() => menuAnchor && handleStartEdit(menuAnchor.message)}>
            <EditOutlinedIcon sx={{ fontSize: 18, mr: 1, color: tc.textSecondary }} />
            {Locale.label("mobile.group.edit")}
          </MenuItem>
        )}
        <MenuItem onClick={() => menuAnchor && handleRequestDelete(menuAnchor.message)}>
          <DeleteOutlineIcon sx={{ fontSize: 18, mr: 1, color: tc.textSecondary }} />
          {Locale.label("mobile.group.delete")}
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={reactAnchor?.el || null}
        open={!!reactAnchor}
        onClose={() => setReactAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        MenuListProps={{ sx: { display: "flex", flexDirection: "row", py: 0.5, px: 0.5 } }}
      >
        {REACTION_EMOJIS.map((emoji) => (
          <MenuItem
            key={emoji}
            onClick={() => reactAnchor && handleToggleReaction(reactAnchor.message, emoji)}
            data-testid={`react-emoji-${emoji}`}
            sx={{ minWidth: 0, px: 1, fontSize: 22, borderRadius: "8px" }}
          >
            {emoji}
          </MenuItem>
        ))}
      </Menu>
      <Sheet
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={Locale.label("mobile.group.confirmDeleteTitle")}
        maxWidth="xs"
        actions={(
          <>
            <Button variant="outlined" onClick={() => setConfirmDelete(null)}>{Locale.label("mobile.group.cancel")}</Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete} autoFocus>{Locale.label("mobile.group.delete")}</Button>
          </>
        )}
      >
        <Typography sx={{ color: tc.textSecondary }}>{Locale.label("mobile.group.confirmDeleteMessage")}</Typography>
      </Sheet>
      <Snackbar open={!!actionError} autoHideDuration={4000} onClose={() => setActionError(null)} message={actionError} />
    </Dialog>
  );
};

export default GroupChatModal;
