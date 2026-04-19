"use client";

import React from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  Icon,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { ApiHelper, PersonHelper, UserHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";

export type ChatSubTab = "discussions" | "announcements";

type ContentType = "group" | "groupAnnouncement";

interface Message {
  id?: string;
  personId?: string;
  content?: string;
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
  onClose,
}: Props) => {
  const tc = mobileTheme.colors;
  const [subTab, setSubTab] = React.useState<ChatSubTab>(initialSubTab);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [active, setActive] = React.useState<Conversation | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [people, setPeople] = React.useState<Record<string, PersonInterface>>({});
  const [hasAnnouncements, setHasAnnouncements] = React.useState(false);

  const currentContentType: ContentType = subTab === "announcements" ? "groupAnnouncement" : "group";
  const canPost = subTab === "announcements" ? isLeader : true;

  // Sync initialSubTab when modal opens (used by deep-link params)
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
      let list: Conversation[] = [];
      if (currentContentType === "group") {
        const data: Conversation[] = await ApiHelper.get(
          `/conversations/group/${groupId}`,
          "MessagingApi"
        );
        list = Array.isArray(data) ? data : [];
      } else {
        const data: Conversation[] = await ApiHelper.get(
          `/conversations/messages/groupAnnouncement/${groupId}?page=1&limit=50`,
          "MessagingApi"
        );
        list = Array.isArray(data) ? data : [];
      }
      setConversations(list);

      const ids = new Set<string>();
      list.forEach((c) =>
        (c.messages || []).forEach((m) => m.personId && ids.add(m.personId))
      );
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
          /* ignore */
        }
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, currentContentType]);

  React.useEffect(() => {
    if (open) {
      setActive(null);
      loadConversations();
      loadAnnouncementsPreflight();
    }
  }, [open, subTab, loadConversations, loadAnnouncementsPreflight]);

  const myPersonId = UserHelper.person?.id;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    if (!canPost) return;
    setSending(true);
    try {
      // Ensure we have a conversation
      let conversationId = active?.id;
      if (!conversationId) {
        // Create conversation for this content type
        const convPayload = {
          groupId,
          allowAnonymousPosts: false,
          contentType: currentContentType,
          contentId: groupId,
          title: `${groupName || "Group"} ${
            currentContentType === "groupAnnouncement" ? "Announcements" : "Chat"
          }`,
          visibility: "hidden",
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
            personId: myPersonId,
          },
        ],
        "MessagingApi"
      );
      setDraft("");
      await loadConversations();
      // Keep focus on the same conversation if possible
      if (active?.id) {
        const fresh = conversations.find((c) => c.id === active.id);
        if (fresh) setActive(fresh);
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const formatTime = (t?: string | Date) => {
    if (!t) return "";
    const d = typeof t === "string" ? new Date(t) : t;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };

  const renderList = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {conversations.length === 0 && (
        <Box sx={{ textAlign: "center", p: `${mobileTheme.spacing.lg}px` }}>
          <Icon sx={{ fontSize: 40, color: tc.textSecondary, mb: 1 }}>
            {subTab === "announcements" ? "campaign" : "forum"}
          </Icon>
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
            {subTab === "announcements"
              ? "No announcements yet."
              : "No conversations yet."}
          </Typography>
          {subTab === "announcements" && !isLeader && (
            <Typography sx={{ fontSize: 12, color: tc.textSecondary, mt: 0.5 }}>
              Leaders can post announcements here.
            </Typography>
          )}
        </Box>
      )}
      {conversations.map((c) => {
        const last = c.messages?.[c.messages.length - 1];
        return (
          <Box
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => setActive(c)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive(c);
              }
            }}
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "center",
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              px: `${mobileTheme.spacing.md}px`,
              py: "10px",
              cursor: "pointer",
              "&:hover": { boxShadow: mobileTheme.shadows.md },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "20px",
                bgcolor: tc.primaryLight,
                color: tc.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon>{subTab === "announcements" ? "campaign" : "forum"}</Icon>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>
                {c.title || (subTab === "announcements" ? "Announcements" : "Conversation")}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: tc.textSecondary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {last?.content || "No messages yet"}
              </Typography>
            </Box>
            {last?.timeSent && (
              <Typography sx={{ fontSize: 11, color: tc.textSecondary }}>
                {formatTime(last.timeSent)}
              </Typography>
            )}
          </Box>
        );
      })}
      {canPost && conversations.length === 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: 12, color: tc.textMuted, textAlign: "center" }}>
            Send a message below to start a new{" "}
            {subTab === "announcements" ? "announcement" : "conversation"}.
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderConversation = () => {
    if (!active) return null;
    const msgs = active.messages || [];
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            pb: 1,
            borderBottom: `1px solid ${tc.border}`,
          }}
        >
          <IconButton aria-label="Back" onClick={() => setActive(null)} sx={{ color: tc.text }}>
            <Icon>arrow_back</Icon>
          </IconButton>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
            {active.title || (subTab === "announcements" ? "Announcement" : "Conversation")}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", py: `${mobileTheme.spacing.sm}px` }}>
          {msgs.length === 0 && (
            <Typography sx={{ textAlign: "center", color: tc.textMuted, mt: 4 }}>
              No messages yet.
            </Typography>
          )}
          {msgs.map((m, i) => {
            const isMine = m.personId === myPersonId;
            const p = m.personId ? people[m.personId] : undefined;
            const name = p?.name?.display || "";
            const photo = p ? (() => { try { return PersonHelper.getPhotoUrl(p); } catch { return ""; } })() : "";
            return (
              <Box
                key={m.id || `m-${i}`}
                sx={{
                  display: "flex",
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 1,
                  mb: 1,
                }}
              >
                {!isMine && (
                  photo ? (
                    <Box
                      component="img"
                      src={photo}
                      alt={name}
                      sx={{ width: 28, height: 28, borderRadius: "14px", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "14px",
                        bgcolor: tc.primaryLight,
                        color: tc.primary,
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {(name[0] || "?").toUpperCase()}
                    </Box>
                  )
                )}
                <Box
                  sx={{
                    maxWidth: "78%",
                    bgcolor: isMine ? tc.primary : tc.surface,
                    color: isMine ? tc.onPrimary : tc.text,
                    px: 1.5,
                    py: 1,
                    borderRadius: `${mobileTheme.radius.lg}px`,
                    boxShadow: mobileTheme.shadows.sm,
                  }}
                >
                  {!isMine && name && (
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: tc.primary, mb: "2px" }}>
                      {name}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.content}</Typography>
                  <Typography
                    sx={{
                      fontSize: 10,
                      mt: "2px",
                      opacity: 0.8,
                      color: isMine ? "rgba(255,255,255,0.9)" : tc.textSecondary,
                      textAlign: "right",
                    }}
                  >
                    {formatTime(m.timeSent)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {canPost && (
          <Box sx={{ display: "flex", gap: 1, pt: 1, borderTop: `1px solid ${tc.border}` }}>
            <TextField
              fullWidth
              size="small"
              placeholder={
                subTab === "announcements" ? "Post an announcement…" : "Type a message…"
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      sx={{ color: tc.primary }}
                    >
                      <Icon>send</Icon>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
        {!canPost && (
          <Box sx={{ pt: 1, borderTop: `1px solid ${tc.border}` }}>
            <Typography sx={{ fontSize: 12, color: tc.textMuted, textAlign: "center", py: 1 }}>
              Only group leaders can post announcements.
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

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
          height: "80dvh",
          maxHeight: "80dvh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: `${mobileTheme.spacing.md}px`,
          py: `${mobileTheme.spacing.sm}px`,
          borderBottom: `1px solid ${tc.border}`,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>
          {groupName ? `${groupName} Chat` : "Group Chat"}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: tc.text }} aria-label="Close">
          <Icon>close</Icon>
        </IconButton>
      </Box>
      {showAnnouncementsTab && (
        <Box sx={{ borderBottom: `1px solid ${tc.border}` }}>
          <Tabs
            value={subTab}
            onChange={(_, v) => {
              setSubTab(v);
              setActive(null);
            }}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              "& .MuiTabs-indicator": { backgroundColor: tc.primary, height: 3 },
              "& .MuiTab-root": {
                minHeight: 40,
                textTransform: "none",
                fontWeight: 600,
                color: tc.textSecondary,
              },
              "& .Mui-selected": { color: `${tc.primary} !important` },
            }}
          >
            <Tab value="discussions" label="Discussions" />
            <Tab value="announcements" label="Announcements" />
          </Tabs>
        </Box>
      )}
      <DialogContent sx={{ p: `${mobileTheme.spacing.md}px`, flex: 1, overflow: "auto" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress sx={{ color: tc.primary }} />
          </Box>
        )}
        {!loading && !active && renderList()}
        {!loading && active && renderConversation()}
      </DialogContent>
    </Dialog>
  );
};

export default GroupChatModal;
