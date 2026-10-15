"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Skeleton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ApiHelper, Locale, PersonHelper, SocketHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { formatRelative } from "../util";
import { LoadErrorAlert } from "../LoadErrorAlert";
import { PageHead, PersonAvatar, Plate, QuietEmpty, Row, SearchField, StatusBadge } from "../kit";

interface Props {
  config?: ConfigurationInterface;
}

interface Conversation {
  id: string;
  pmId: string;
  personId: string;
  conversationId?: string;
  personName: string;
  personPhoto?: string;
  preview: string;
  lastTime?: string;
  unread: boolean;
}

export const MessagesPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = React.useContext(UserContext);
  const loggedIn = !!userContext?.user?.firstName;
  const myPersonId = userContext?.person?.id;
  const queryClient = useQueryClient();

  // Real-time: when a privateMessage / privateRoomAdded socket event arrives, invalidate the list.
  React.useEffect(() => {
    if (!loggedIn) return;
    const id = "MessagesPage-list";
    const onEvent = () => queryClient.invalidateQueries({ queryKey: ["conversations", myPersonId] });
    SocketHelper.addHandler("privateMessage", id + "-pm", onEvent);
    SocketHelper.addHandler("privateRoomAdded", id + "-room", onEvent);
    return () => {
      SocketHelper.removeHandler(id + "-pm");
      SocketHelper.removeHandler(id + "-room");
    };
  }, [loggedIn, myPersonId, queryClient]);

  const { data: conversations = null, isError: conversationsError, refetch: refetchConversations } = useQuery<Conversation[]>({
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

      const seen = new Set<string>();
      const result: Conversation[] = [];
      rows.forEach(({ pm, otherId }) => {
        const pmId = pm.pmId || pm.privateMessageId || pm.privateMessage?.id || pm.id;
        const conversationId = pm.conversationId || pm.conversation?.id || (pm.pmId ? pm.id : undefined);
        const id = conversationId || pmId;
        if (!id || !otherId) return;
        if (seen.has(id)) return;
        seen.add(id);
        const person = peopleById[otherId];
        const displayName = person?.name?.display || Locale.label("mobile.components.unknown");
        let photo = "";
        if (person) {
          try {
            photo = PersonHelper.getPhotoUrl(person) || "";
          } catch {
            photo = (person as any).photo || "";
          }
        }
        result.push({
          id,
          pmId,
          personId: otherId,
          conversationId,
          personName: displayName,
          personPhoto: photo,
          preview: (pm.conversation?.messages?.[0]?.content || "").replace(/<[^>]+>/g, ""),
          lastTime: pm.lastMessageTime || pm.conversation?.dateCreated,
          unread: !!myPersonId && pm.notifyPersonId === myPersonId
        });
      });
      return result;
    },
    enabled: loggedIn,
    // Unread state changes as soon as a thread is opened, so never serve the persisted cache here.
    staleTime: 0
  });

  const [pendingDelete, setPendingDelete] = React.useState<Conversation | null>(null);

  const handleDelete = async () => {
    const c = pendingDelete;
    setPendingDelete(null);
    if (!c?.pmId) return;
    queryClient.setQueryData<Conversation[]>(["conversations", myPersonId], (prev) => (prev || []).filter((x) => x.pmId !== c.pmId));
    try {
      await ApiHelper.delete(`/privateMessages/${c.pmId}`, "MessagingApi");
    } catch (err) {
      console.error("Failed to delete conversation", err);
      queryClient.invalidateQueries({ queryKey: ["conversations", myPersonId] });
    }
  };

  const conversationHref = (c: Conversation) => {
    const path = `/mobile/messages/${c.personId}`;
    return c.conversationId ? `${path}?conversationId=${encodeURIComponent(c.conversationId)}` : path;
  };

  const [filter, setFilter] = React.useState("");
  const needle = filter.trim().toLowerCase();
  const shown = (conversations || []).filter((c) => !needle || c.personName.toLowerCase().includes(needle) || c.preview.toLowerCase().includes(needle));
  const unreadCount = (conversations || []).filter((c) => c.unread).length;

  const renderRow = (c: Conversation) => (
    <Box key={c.id} data-testid={`conversation-row-${c.pmId}`} sx={{ display: "flex", alignItems: "center", gap: "4px", "& + &": { borderTop: `1px solid ${tc.border}` } }}>
      <Row
        href={conversationHref(c)}
        leading={<PersonAvatar name={c.personName} src={c.personPhoto} />}
        title={<Box component="span" sx={{ fontWeight: c.unread ? 650 : 500 }}>{c.personName}</Box>}
        subtitle={<Box component="span" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: c.unread ? tc.text : undefined }}>{c.preview}</Box>}
        trailing={(
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flex: "none" }}>
            <Typography component="span" sx={{ fontSize: 13, color: tc.textSecondary, whiteSpace: "nowrap" }}>{formatRelative(c.lastTime)}</Typography>
            {c.unread && (
              <Box component="span" aria-label={Locale.label("mobile.screens.unread")} data-testid={`conversation-unread-${c.pmId}`}>
                <StatusBadge tone="pri" dot>{Locale.label("mobile.messages.new")}</StatusBadge>
              </Box>
            )}
          </Box>
        )}
        sx={{ flex: 1, minWidth: 0 }}
      />
      <IconButton
        aria-label={Locale.label("mobile.screens.deleteConversation")}
        data-testid={`conversation-delete-${c.pmId}`}
        size="small"
        onClick={() => setPendingDelete(c)}
        sx={{ color: tc.textSecondary, flex: "none", mr: "-6px" }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );

  return (
    <Box>
      <PageHead
        title={Locale.label("mobile.screenTitles.messages")}
        lede={unreadCount > 0 ? Locale.label("mobile.messages.unreadCount").replace("{}", String(unreadCount)) : undefined}
      >
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => router.push("/mobile/messages/new")}>
          {Locale.label("mobile.screens.newMessage")}
        </Button>
      </PageHead>
      <Plate>
        {conversations !== null && conversations.length > 0 && (
          <Box sx={{ px: { xs: "16px", md: "24px" }, pt: { xs: "16px", md: "22px" }, pb: "4px" }}>
            <SearchField value={filter} onChange={setFilter} label={Locale.label("mobile.messages.searchConversations")} placeholder={Locale.label("mobile.messages.searchConversations")} height={44} />
          </Box>
        )}
        <Box sx={{ px: { xs: "16px", md: "24px" }, py: "8px" }}>
          {conversations === null && conversationsError && <Box sx={{ py: "8px" }}><LoadErrorAlert onRetry={() => refetchConversations()} /></Box>}
          {conversations === null && !conversationsError && [0, 1, 2].map((i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "12px", minHeight: 56 }}>
              <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: "10px" }} />
              <Skeleton variant="text" width="50%" height={20} />
            </Box>
          ))}
          {conversations !== null && shown.length === 0 && (
            <QuietEmpty sx={{ py: "12px" }}>{Locale.label(conversations.length === 0 ? "mobile.components.noMessages" : "mobile.messages.noConversationMatches")}</QuietEmpty>
          )}
          {shown.map(renderRow)}
        </Box>
      </Plate>
      <Dialog open={!!pendingDelete} onClose={() => setPendingDelete(null)}>
        <DialogTitle>{Locale.label("mobile.screens.deleteConversationTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{Locale.label("mobile.screens.deleteConversationBody")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>{Locale.label("common.cancel")}</Button>
          <Button color="error" onClick={handleDelete} data-testid="confirm-delete-conversation">{Locale.label("mobile.details.delete")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
