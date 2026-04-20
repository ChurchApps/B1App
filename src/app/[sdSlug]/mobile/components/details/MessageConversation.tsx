"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, IconButton, Snackbar, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { ApiHelper, PersonHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import { type MessageInterface, type PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { getInitials } from "../util";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

// Shape we expect from /privateMessages (MessagingApi) - ConversationCheckInterface
interface PrivateMessageRow {
  id?: string;
  conversationId?: string;
  fromPersonId?: string;
  toPersonId?: string;
}

// To find an existing conversation with a person we scan `/privateMessages`
// rather than calling `/privateMessages/existing/{personId}` — the latter
// endpoint isn't wired up; if none matches, we create one on first send.

export const MessageConversation = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const searchParams = useSearchParams();
  const userContext = React.useContext(UserContext);

  // Callers (MessagesPage) may forward the conversationId via query string so
  // we can skip the /privateMessages round-trip when we already know it.
  const conversationIdParam = searchParams?.get("conversationId") || null;
  const [conversationId, setConversationId] = React.useState<string | null>(conversationIdParam);
  const [pending, setPending] = React.useState<MessageInterface[]>([]);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<string | null>(null);

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
        /* fall through */
      }
      try {
        const people = await ApiHelper.get("/people/basic?ids=" + id, "MembershipApi");
        if (Array.isArray(people) && people.length > 0) return people[0] as PersonInterface;
      } catch {
        /* ignore */
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

  // Keep a person map across polls so the 5s refetch only pulls ids it hasn't
  // seen — sending `/people/basic?ids=…` again for people already rendered.
  const peopleCache = React.useRef<Map<string, PersonInterface>>(new Map());

  // Seed the conversation id from the /privateMessages lookup.
  React.useEffect(() => {
    if (existingConvId && !conversationId) setConversationId(existingConvId);
  }, [existingConvId, conversationId]);

  // Poll the conversation every 5s while the tab is visible.
  // Hydrate each message's `person` via /people/basic so displayName falls back correctly.
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
        /* hydration is best-effort */
      }
      return data;
    },
    enabled: !!conversationId,
    // Gate polling on tab visibility so background tabs don't hammer the API.
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible" ? 5000 : false,
    refetchIntervalInBackground: false
  });

  React.useEffect(() => {
    if (messagesErrored) setError("Unable to load messages.");
  }, [messagesErrored]);

  // Drop optimistic entries whose content has shown up in the server list.
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

  // Auto-scroll on messages change
  React.useEffect(() => {
    if (messages && messages.length > 0) {
      // next tick so DOM is painted
      requestAnimationFrame(() => scrollToBottom());
    }
  }, [messages, scrollToBottom]);

  const createConversationAndSend = async (content: string) => {
    if (!myPersonId) return;
    // Step 1: create conversation
    const convParams = [
      {
        allowAnonymousPosts: false,
        contentType: "privateMessage",
        contentId: myPersonId,
        title: (myDisplayName || "Private") + " Private Message",
        visibility: "hidden"
      }
    ];
    const convData: any[] = await ApiHelper.post("/conversations", convParams, "MessagingApi");
    const newConvId: string | undefined = convData?.[0]?.id;
    if (!newConvId) throw new Error("Could not create conversation");

    // Step 2: link via /privateMessages
    await ApiHelper.post(
      "/privateMessages",
      [{ fromPersonId: myPersonId, toPersonId: id, conversationId: newConvId }],
      "MessagingApi"
    );

    setConversationId(newConvId);

    // Step 3: post the message
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
      setError("You must be signed in to send messages.");
      return;
    }
    setSending(true);
    setError(null);

    // Optimistic append
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
      setError("Message failed to send.");
      // Remove optimistic entry on failure
      setPending((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const name = person?.name?.display || "Conversation";

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

    return (
      <Box
        key={m.id || index}
        sx={{
          display: "flex",
          justifyContent: mine ? "flex-end" : "flex-start",
          mb: "6px"
        }}
      >
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
        Start the conversation with {name}
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
      {/* Contextual row: who the conversation is with + start-new icon.
          The AppBar already carries the "Messages" title (design std #3), so
          this row is body-level context, not a page header. */}
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
          aria-label="New conversation"
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

      {/* Messages list */}
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

      {/* Composer */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          bgcolor: tc.surface,
          borderTop: `1px solid ${tc.border}`,
          p: "10px",
          display: "flex",
          alignItems: "flex-end",
          gap: "8px"
        }}
      >
        <TextField
          multiline
          maxRows={4}
          fullWidth
          placeholder="Type a message…"
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
              py: "2px"
            },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: tc.border }
          }}
        />
        <IconButton
          aria-label="Send"
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
