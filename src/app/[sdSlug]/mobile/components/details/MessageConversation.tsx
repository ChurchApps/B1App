"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Menu, MenuItem, Popover, Snackbar, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import { Emojis } from "@/components/video/chat";
import { ApiHelper, Locale, SocketHelper, SubscriptionManager, UserHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type MessageInterface, type PersonInterface } from "@churchapps/helpers";
import { ChatHelper } from "@/helpers/ChatHelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { PersonAvatar, QuietEmpty, TextLink } from "../kit";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface PrivateMessageRow {
  id?: string;
  conversationId?: string;
  fromPersonId?: string;
  toPersonId?: string;
}

interface PersonWithDM extends PersonInterface {
  allowDirectMessages?: boolean;
}

export const MessageConversation = ({ id, config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const searchParams = useSearchParams();
  const userContext = React.useContext(UserContext);

  const conversationIdParam = searchParams?.get("conversationId") || null;
  const [conversationId, setConversationId] = React.useState<string | null>(conversationIdParam);
  const [pending, setPending] = React.useState<MessageInterface[]>([]);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = React.useState<{ el: HTMLElement; message: MessageInterface } | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<MessageInterface | null>(null);
  const [emojiAnchor, setEmojiAnchor] = React.useState<HTMLElement | null>(null);
  const [viewportHeight, setViewportHeight] = React.useState<number | null>(null);

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const myPersonId = userContext?.person?.id || UserHelper.currentUserChurch?.person?.id || "";
  const myDisplayName = userContext?.person?.name?.display || UserHelper.currentUserChurch?.person?.name?.display || "";

  const { data: personData } = useQuery<PersonWithDM | null>({
    queryKey: ["community-person", id],
    queryFn: async () => {
      try {
        const p = await ApiHelper.get("/people/" + id, "MembershipApi");
        if (p) return p as PersonWithDM;
      } catch {

      }
      try {
        const people = await ApiHelper.get("/people/basic?ids=" + id, "MembershipApi");
        if (Array.isArray(people) && people.length > 0) return people[0] as PersonWithDM;
      } catch {

      }
      return null;
    },
    enabled: !!id
  });
  const person = personData ?? null;
  // Existing threads stay writable; the age gate only blocks opening a new conversation.
  const messagingBlocked = person?.allowDirectMessages === false && !conversationId;

  // Also the read receipt: the route clears notifyPersonId for this thread only.
  const { data: existingConvId } = useQuery<string | null>({
    queryKey: ["private-message-conv", myPersonId, id],
    queryFn: async () => {
      const match: PrivateMessageRow = await ApiHelper.get(`/privateMessages/existing/${id}`, "MessagingApi");
      return match?.conversationId ?? null;
    },
    enabled: !!id && !!myPersonId,
    // The mobile provider caches for 60s and persists to IndexedDB; a stale hit would skip the receipt.
    staleTime: 0
  });

  const scrollToBottom = React.useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = 0;
    const updateViewportHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextHeight = window.visualViewport?.height || window.innerHeight || 0;
        setViewportHeight((prev) => (prev !== nextHeight ? nextHeight : prev));
      });
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
    };
  }, []);

  const peopleCache = React.useRef<Map<string, PersonInterface>>(new Map());

  React.useEffect(() => {
    if (existingConvId && !conversationId) setConversationId(existingConvId);
  }, [existingConvId, conversationId]);

  // Realtime split: always listen for alerts-room events; conditionally join conversation room once known.
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const handlerId = "MessageConversation-alerts";
    const refreshExisting = () => {
      queryClient.invalidateQueries({ queryKey: ["private-message-conv", myPersonId, id] });
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ["mobile-message-conversation", conversationId] });
      }
    };
    SocketHelper.addHandler("privateMessage", handlerId + "-pm", refreshExisting);
    SocketHelper.addHandler("privateRoomAdded", handlerId + "-room", refreshExisting);
    return () => {
      SocketHelper.removeHandler(handlerId + "-pm");
      SocketHelper.removeHandler(handlerId + "-room");
    };
  }, [queryClient, myPersonId, id, conversationId]);

  React.useEffect(() => {
    if (!conversationId) return;
    const churchId = UserHelper.currentUserChurch?.church?.id;
    if (churchId) SubscriptionManager.joinRoom(conversationId, churchId, myPersonId).catch(() => { /* ignore */ });

    const handlerId = `MessageConversation-${conversationId}`;
    const onEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-message-conversation", conversationId] });
      // Re-hit existing/:personId so a message arriving while the thread is open is marked read.
      queryClient.invalidateQueries({ queryKey: ["private-message-conv", myPersonId, id] });
    };
    SocketHelper.addHandler("message", handlerId + "-msg", onEvent);
    SocketHelper.addHandler("deleteMessage", handlerId + "-del", onEvent);

    return () => {
      SocketHelper.removeHandler(handlerId + "-msg");
      SocketHelper.removeHandler(handlerId + "-del");
      if (churchId) SubscriptionManager.leaveRoom(conversationId, churchId).catch(() => { /* ignore */ });
    };
  }, [conversationId, myPersonId, id, queryClient]);

  const {
    data: serverMessages,
    isError: messagesErrored,
    refetch: refetchMessages
  } = useQuery<MessageInterface[]>({
    queryKey: ["mobile-message-conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const data: MessageInterface[] = await ApiHelper.get(
        "/messages/conversation/" + conversationId,
        "MessagingApi"
      );
      if (!Array.isArray(data) || data.length === 0) return [];
      try {
        const personIds = Array.from(
          new Set(
            data
              .map((m) => m.personId)
              .filter((pid): pid is string => !!pid)
          )
        );
        const missing = personIds.filter((pid) => !peopleCache.current.has(pid));
        if (missing.length > 0) {
          const people: PersonInterface[] = await ApiHelper.get(
            "/people/basic?ids=" + missing.join(","),
            "MembershipApi"
          );
          if (Array.isArray(people)) {
            people.forEach((p) => { if (p.id) peopleCache.current.set(p.id, p); });
          }
        }
        data.forEach((m) => {
          if (m.personId) m.person = peopleCache.current.get(m.personId);
        });
      } catch {

      }
      return data;
    },
    enabled: !!conversationId,

    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible" ? 5000 : false,
    refetchIntervalInBackground: false
  });

  React.useEffect(() => {
    if (messagesErrored) setError(Locale.label("mobile.details.unableToLoadMessages"));
  }, [messagesErrored]);

  React.useEffect(() => {
    if (!serverMessages || pending.length === 0) return;
    setPending((prev) =>
      prev.filter((p) => !serverMessages.some((s) => s.content === p.content && s.personId === p.personId)));
  }, [serverMessages, pending.length]);

  const messages: MessageInterface[] | null = React.useMemo(() => {
    if (!conversationId) return myPersonId ? [] : null;
    if (serverMessages === undefined) return null;
    return [...serverMessages, ...pending];
  }, [conversationId, myPersonId, serverMessages, pending]);

  const loadMessages = React.useCallback(async () => {
    await refetchMessages();
  }, [refetchMessages]);

  React.useEffect(() => {
    if (messages && messages.length > 0) {

      requestAnimationFrame(() => scrollToBottom());
    }
  }, [messages, scrollToBottom]);

  const createConversationAndSend = async (content: string) => {
    if (!myPersonId) return;

    const convParams = [
      {
        allowAnonymousPosts: false,
        contentType: "privateMessage",
        contentId: myPersonId,
        title: Locale.label("mobile.details.privateMessageTitle").replace("{}", myDisplayName || Locale.label("mobile.details.private")),
        visibility: "hidden"
      }
    ];
    const convData: any[] = await ApiHelper.post("/conversations", convParams, "MessagingApi");
    const newConvId: string | undefined = convData?.[0]?.id;
    if (!newConvId) throw new Error(Locale.label("mobile.details.couldNotCreateConversation"));

    const pmData: any[] = await ApiHelper.post(
      "/privateMessages",
      [{ fromPersonId: myPersonId, toPersonId: id, conversationId: newConvId }],
      "MessagingApi"
    );
    // The server returns the pair's existing row when there is one, so post into that thread instead.
    const convId: string = pmData?.[0]?.conversationId || newConvId;

    setConversationId(convId);

    await ApiHelper.post(
      "/messages",
      [{ conversationId: convId, content, displayName: myDisplayName }],
      "MessagingApi"
    );
    await loadMessages();
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    if (!myPersonId) {
      setError(Locale.label("mobile.details.mustBeSignedIn"));
      return;
    }
    setSending(true);
    setError(null);

    if (editingId) {
      const idToEdit = editingId;
      setText("");
      setEditingId(null);
      try {
        await ApiHelper.post(
          "/messages",
          [{ id: idToEdit, conversationId, content, displayName: myDisplayName }],
          "MessagingApi"
        );
        await loadMessages();
      } catch {
        setError(Locale.label("mobile.details.messageFailed"));
        setEditingId(idToEdit);
        setText(content);
      } finally {
        setSending(false);
      }
      return;
    }

    const optimistic: MessageInterface = {
      id: "temp-" + Date.now(),
      conversationId: conversationId || "",
      content,
      displayName: myDisplayName,
      personId: myPersonId,
      timeSent: new Date()
    } as MessageInterface;
    setPending((prev) => [...prev, optimistic]);
    setText("");

    try {
      if (conversationId) {
        await ApiHelper.post(
          "/messages",
          [{ conversationId, content, displayName: myDisplayName }],
          "MessagingApi"
        );
        await loadMessages();
      } else {
        await createConversationAndSend(content);
      }
    } catch (e) {
      if ((e as Error)?.message === "ageRestricted") setError(Locale.label("mobile.details.messageBlockedAge"));
      else setError(Locale.label("mobile.details.messageFailed"));

      setPending((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setEmojiAnchor(null);
    // Return focus to the composer so the user can keep typing.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleStartEdit = (m: MessageInterface) => {
    setEditingId(m.id || null);
    setText(m.content || "");
    setMenuAnchor(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setText("");
  };

  const handleRequestDelete = (m: MessageInterface) => {
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
        setText("");
      }
      await loadMessages();
    } catch {
      setError(Locale.label("mobile.details.deleteFailed"));
    }
  };

  const name = person?.name?.display || Locale.label("mobile.details.conversation");

  const renderBubble = (m: MessageInterface, index: number) => {
    const mine = m.personId === myPersonId;
    const isPersisted = !!m.id && !m.id.startsWith("temp-");
    const showActions = mine && isPersisted;

    return (
      <Box
        key={m.id || index}
        sx={{ display: "flex", width: "100%", minWidth: 0, alignItems: "center", justifyContent: mine ? "flex-end" : "flex-start", gap: "2px", mb: "8px" }}
      >
        {showActions && (
          <IconButton
            size="small"
            aria-label={Locale.label("mobile.details.messageActions")}
            onClick={(e) => setMenuAnchor({ el: e.currentTarget, message: m })}
            sx={{ color: tc.textSecondary, p: "4px" }}
          >
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        <Box
          sx={{
            maxWidth: "80%",
            minWidth: 0,
            px: "14px",
            py: "10px",
            bgcolor: mine ? tc.chip : tc.surface,
            color: mine ? tc.onChip : tc.text,
            border: `1px solid ${mine ? "transparent" : tc.border}`,
            borderRadius: "14px",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            fontSize: 15,
            lineHeight: "21px",
            "& a": { color: "inherit", textDecoration: "underline", wordBreak: "break-all", overflowWrap: "anywhere" }
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: ChatHelper.insertLinks(m.content || "") }} />
        </Box>
      </Box>
    );
  };

  // Fills the gap between the shell's app bar and tab bar on phone (cancelling main's extra 20px), and between its header and bottom padding on desktop.
  const vh = viewportHeight ? `${viewportHeight}px` : "100dvh";
  const phoneHeight = `calc(${vh} - ${mobileTheme.headerHeight + mobileTheme.tabBarHeight}px - ${mobileTheme.safe.top} - ${mobileTheme.safe.bottom})`;
  const desktopHeight = `calc(${vh} - 136px)`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        height: { xs: phoneHeight, md: desktopHeight },
        mb: { xs: "-20px", md: 0 },
        overflow: "hidden",
        bgcolor: tc.background,
        border: { md: `1px solid ${tc.border}` },
        borderRadius: { md: "10px" }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "10px", px: "16px", py: "8px", bgcolor: tc.surface, borderBottom: `1px solid ${tc.border}` }}>
        <Box component={Link} href={`/mobile/community/${id}`} sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>
          <PersonAvatar person={person} name={name} size={32} />
          <Typography component="h1" noWrap sx={{ minWidth: 0, fontSize: 17, fontWeight: 650, color: tc.text }}>{name}</Typography>
        </Box>
        <IconButton
          aria-label={Locale.label("mobile.details.newConversation")}
          onClick={() => router.push("/mobile/messages/new")}
          sx={{ color: tc.textSecondary }}
        >
          <PersonAddAlt1Icon />
        </IconButton>
      </Box>

      <Box
        ref={listRef}
        sx={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: "auto", overflowX: "hidden", p: "16px", display: "flex", flexDirection: "column" }}
      >
        {messages === null && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            <CircularProgress size={28} sx={{ color: tc.primary }} />
          </Box>
        )}
        {messages !== null && messages.length === 0 && (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <QuietEmpty>{Locale.label("mobile.details.startConversationWith").replace("{}", name)}</QuietEmpty>
          </Box>
        )}
        {messages !== null && messages.length > 0 && <Box sx={{ mt: "auto" }}>{messages.map(renderBubble)}</Box>}
      </Box>

      {editingId && (
        <Box sx={{ flexShrink: 0, bgcolor: tc.surface, borderTop: `1px solid ${tc.border}`, px: "16px", py: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, fontWeight: 600 }}>{Locale.label("mobile.details.editingMessage")}</Typography>
          <TextLink onClick={handleCancelEdit}>{Locale.label("mobile.details.cancel")}</TextLink>
        </Box>
      )}

      {messagingBlocked && (
        <Box sx={{ flexShrink: 0, width: "100%", bgcolor: tc.surface, borderTop: `1px solid ${tc.border}`, px: "16px", py: "14px", textAlign: "center" }}>
          <QuietEmpty sx={{ fontSize: 14 }}>{Locale.label("mobile.details.messagingNotAvailable")}</QuietEmpty>
        </Box>
      )}
      {!messagingBlocked && (
        <Box sx={{ flexShrink: 0, width: "100%", minWidth: 0, bgcolor: tc.surface, borderTop: `1px solid ${tc.border}`, pl: "6px", pr: "8px", py: "8px", display: "flex", alignItems: "flex-end", gap: "6px" }}>
          <IconButton
            aria-label={Locale.label("mobile.details.openEmojiPicker")}
            onClick={(e) => setEmojiAnchor(e.currentTarget)}
            sx={{ flexShrink: 0, color: tc.textSecondary, width: 44, height: 44 }}
          >
            <EmojiEmotionsOutlinedIcon sx={{ fontSize: 22 }} />
          </IconButton>
          <TextField
            inputRef={inputRef}
            multiline
            maxRows={4}
            placeholder={Locale.label("mobile.details.typeMessage")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              "& .MuiOutlinedInput-root": { borderRadius: "6px", bgcolor: tc.surface, fontSize: 16, minHeight: 44, px: "12px", py: "10px" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: tc.control }
            }}
          />
          <IconButton
            aria-label={Locale.label("mobile.details.send")}
            onClick={handleSend}
            disabled={sending || !text.trim()}
            sx={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: "6px",
              bgcolor: tc.primary,
              color: tc.onPrimary,
              "&:hover": { bgcolor: tc.primary },
              "&.Mui-disabled": { bgcolor: tc.border, color: tc.textSecondary }
            }}
          >
            {sending ? <CircularProgress size={18} sx={{ color: tc.onPrimary }} /> : <SendIcon sx={{ fontSize: 20 }} />}
          </IconButton>
        </Box>
      )}

      <Popover
        anchorEl={emojiAnchor}
        open={!!emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              maxWidth: "90vw",
              maxHeight: 240,
              p: `${mobileTheme.spacing.sm}px`,
              "& a": {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                lineHeight: 1,
                textDecoration: "none",
                cursor: "pointer"
              }
            }
          }
        }}
      >
        <Emojis selectedFunction={handleInsertEmoji} />
      </Popover>

      <Menu
        anchorEl={menuAnchor?.el || null}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => menuAnchor && handleStartEdit(menuAnchor.message)}>
          <EditIcon sx={{ fontSize: 18, mr: 1, color: tc.textSecondary }} />
          {Locale.label("mobile.details.edit")}
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleRequestDelete(menuAnchor.message)}>
          <DeleteOutlineIcon sx={{ fontSize: 18, mr: 1, color: tc.textSecondary }} />
          {Locale.label("mobile.details.delete")}
        </MenuItem>
      </Menu>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>{Locale.label("mobile.details.confirmDeleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {Locale.label("mobile.details.confirmDeleteMessage")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>
            {Locale.label("mobile.details.cancel")}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            {Locale.label("mobile.details.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        message={error || ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack(null)}
        message={snack || ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
