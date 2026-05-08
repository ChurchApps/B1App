"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Menu, MenuItem, Snackbar, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ApiHelper, Locale, PersonHelper, SocketHelper, SubscriptionManager, UserHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type MessageInterface, type PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { getInitials } from "../util";

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

export const MessageConversation = ({ id, config }: Props) => {
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

  const listRef = React.useRef<HTMLDivElement | null>(null);

  const myPersonId = userContext?.person?.id || UserHelper.currentUserChurch?.person?.id || "";
  const myDisplayName = userContext?.person?.name?.display || UserHelper.currentUserChurch?.person?.name?.display || "";

  const { data: personData } = useQuery<PersonInterface | null>({
    queryKey: ["community-person", id],
    queryFn: async () => {
      try {
        const p = await ApiHelper.get("/people/" + id, "MembershipApi");
        if (p) return p as PersonInterface;
      } catch {

      }
      try {
        const people = await ApiHelper.get("/people/basic?ids=" + id, "MembershipApi");
        if (Array.isArray(people) && people.length > 0) return people[0] as PersonInterface;
      } catch {

      }
      return null;
    },
    enabled: !!id
  });
  const person = personData ?? null;

  const { data: existingConvId } = useQuery<string | null>({
    queryKey: ["private-message-conv", myPersonId, id],
    queryFn: async () => {
      const pm: PrivateMessageRow[] = await ApiHelper.get("/privateMessages", "MessagingApi");
      const match = Array.isArray(pm)
        ? pm.find(
          (c) =>
            (c.fromPersonId === myPersonId && c.toPersonId === id) ||
              (c.toPersonId === myPersonId && c.fromPersonId === id)
        )
        : null;
      return match?.conversationId ?? null;
    },
    enabled: !!id && !!myPersonId && !conversationIdParam
  });

  const scrollToBottom = React.useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  const peopleCache = React.useRef<Map<string, PersonInterface>>(new Map());

  React.useEffect(() => {
    if (existingConvId && !conversationId) setConversationId(existingConvId);
  }, [existingConvId, conversationId]);

  // Realtime — split into two effects:
  //   1) ALWAYS subscribed to alerts-room events (privateMessage / privateRoomAdded) so a brand
  //      new conversation is discovered without reload. We re-fetch the existing-conversation
  //      lookup; once it resolves to an id, the messages query fires.
  //   2) Conditionally joins the conversation room once we know its id, then invalidates the
  //      messages query on inbound message/delete events for that room.
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
    const onEvent = () => queryClient.invalidateQueries({ queryKey: ["mobile-message-conversation", conversationId] });
    SocketHelper.addHandler("message", handlerId + "-msg", onEvent);
    SocketHelper.addHandler("deleteMessage", handlerId + "-del", onEvent);

    return () => {
      SocketHelper.removeHandler(handlerId + "-msg");
      SocketHelper.removeHandler(handlerId + "-del");
      if (churchId) SubscriptionManager.leaveRoom(conversationId, churchId).catch(() => { /* ignore */ });
    };
  }, [conversationId, myPersonId, queryClient]);

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

    await ApiHelper.post(
      "/privateMessages",
      [{ fromPersonId: myPersonId, toPersonId: id, conversationId: newConvId }],
      "MessagingApi"
    );

    setConversationId(newConvId);

    await ApiHelper.post(
      "/messages",
      [{ conversationId: newConvId, content, displayName: myDisplayName }],
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
    } catch {
      setError(Locale.label("mobile.details.messageFailed"));

      setPending((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
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

  const getPhoto = (): string | "" => {
    if (!person) return "";
    try {
      return PersonHelper.getPhotoUrl(person) || "";
    } catch {
      return "";
    }
  };

  const renderAvatar = () => {
    const photo = getPhoto();
    const common = {
      width: 36,
      height: 36,
      borderRadius: "18px",
      flexShrink: 0,
      overflow: "hidden"
    } as const;
    if (photo) {
      return <Box component="img" src={photo} alt={name} sx={{ ...common, objectFit: "cover" }} />;
    }
    return (
      <Box
        sx={{
          ...common,
          bgcolor: tc.primaryLight,
          color: tc.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13
        }}
      >
        {getInitials(name)}
      </Box>
    );
  };

  const renderBubble = (m: MessageInterface, index: number) => {
    const mine = m.personId === myPersonId;
    const bubbleName = m.displayName || m.person?.name?.display || "";
    const isPersisted = !!m.id && !m.id.startsWith("temp-");
    const showActions = mine && isPersisted;

    return (
      <Box
        key={m.id || index}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: mine ? "flex-end" : "flex-start",
          gap: "2px",
          mb: "6px"
        }}
      >
        {showActions && (
          <IconButton
            size="small"
            aria-label={Locale.label("mobile.details.messageActions")}
            onClick={(e) => setMenuAnchor({ el: e.currentTarget, message: m })}
            sx={{ color: tc.textMuted, p: "4px" }}
          >
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        <Box
          sx={{
            maxWidth: "75%",
            px: "12px",
            py: "8px",
            bgcolor: mine ? tc.primary : tc.surfaceVariant,
            color: mine ? tc.onPrimary : tc.text,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            wordBreak: "break-word",
            fontSize: 14,
            lineHeight: 1.35
          }}
        >
          {bubbleName && (
            <Typography
              component="div"
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: mine ? tc.onPrimary : tc.primary,
                opacity: mine ? 0.9 : 1,
                mb: "2px",
                lineHeight: 1.2
              }}
            >
              {bubbleName}
            </Typography>
          )}
          {m.content}
        </Box>
      </Box>
    );
  };

  const renderEmpty = () => (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: tc.textMuted,
        gap: "8px",
        p: `${mobileTheme.spacing.lg}px`
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "28px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <ChatBubbleOutlineIcon sx={{ fontSize: 28, color: tc.primary }} />
      </Box>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        {Locale.label("mobile.details.startConversationWith").replace("{}", name)}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "100%",
        bgcolor: tc.background
      }}
    >

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.sm}px`,
          px: `${mobileTheme.spacing.md}px`,
          py: "10px",
          bgcolor: tc.surface,
          borderBottom: `1px solid ${tc.border}`
        }}
      >
        {renderAvatar()}
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: 16,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {name}
        </Typography>
        <IconButton
          aria-label={Locale.label("mobile.details.newConversation")}
          onClick={() => router.push("/mobile/messages/new")}
          sx={{
            bgcolor: tc.iconBackground,
            color: tc.primary,
            "&:hover": { bgcolor: tc.iconBackground }
          }}
          size="small"
        >
          <PersonAddAlt1Icon />
        </IconButton>
      </Box>

      <Box
        ref={listRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: `${mobileTheme.spacing.md}px`,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {messages === null && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            <CircularProgress size={28} sx={{ color: tc.primary }} />
          </Box>
        )}
        {messages !== null && messages.length === 0 && renderEmpty()}
        {messages !== null && messages.length > 0 && messages.map(renderBubble)}
      </Box>

      {editingId && (
        <Box
          sx={{
            position: "sticky",
            bottom: 60,
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
            {Locale.label("mobile.details.editingMessage")}
          </Typography>
          <Button
            size="small"
            onClick={handleCancelEdit}
            sx={{ color: tc.primary, textTransform: "none", fontSize: 12, minWidth: 0 }}
          >
            {Locale.label("mobile.details.cancel")}
          </Button>
        </Box>
      )}

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          bgcolor: tc.surface,
          borderTop: `1px solid ${tc.border}`,
          p: "10px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        <TextField
          multiline
          maxRows={4}
          fullWidth
          placeholder={Locale.label("mobile.details.typeMessage")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "22px",
              bgcolor: tc.background,
              fontSize: 14,
              px: "12px",
              py: "8px"
            },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: tc.border }
          }}
        />
        <IconButton
          aria-label={Locale.label("mobile.details.send")}
          onClick={handleSend}
          disabled={sending || !text.trim()}
          sx={{
            bgcolor: tc.primary,
            color: tc.onPrimary,
            "&:hover": { bgcolor: tc.primary },
            "&.Mui-disabled": { bgcolor: tc.border, color: tc.textSecondary },
            width: 40,
            height: 40
          }}
        >
          {sending ? (
            <CircularProgress size={18} sx={{ color: tc.onPrimary }} />
          ) : (
            <SendIcon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Box>

      <Menu
        anchorEl={menuAnchor?.el || null}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => menuAnchor && handleStartEdit(menuAnchor.message)}>
          <EditIcon sx={{ fontSize: 18, mr: 1, color: tc.textMuted }} />
          {Locale.label("mobile.details.edit")}
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleRequestDelete(menuAnchor.message)}>
          <DeleteOutlineIcon sx={{ fontSize: 18, mr: 1, color: tc.textMuted }} />
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
