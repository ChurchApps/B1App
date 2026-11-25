"use client";

import React, { useContext } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { ApiHelper, Locale, Notes } from "@churchapps/apphelper";
import type { ConversationInterface, UserContextInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { Sheet } from "../kit";

const tc = mobileTheme.colors;

interface Props {
  eventId: string;
  title: string;
  onClose: () => void;
}

// ChurchAppsSupport#1676: the requester and church staff talk about one event request. Staff reply
// from the approvals inbox in B1 Admin; the Api lets only those two sides into the thread.
export const RequestMessagesSheet = ({ eventId, title, onClose }: Props) => {
  const context = useContext(UserContext);
  const churchId = context?.userChurch?.church?.id;
  const { data: conversations, isLoading, refetch } = useQuery<ConversationInterface[]>({
    queryKey: ["event-request-thread", churchId, eventId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/conversations/${churchId}/eventRequest/${eventId}`, "MessagingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!churchId && !!eventId,
    staleTime: 0
  });
  const conversationId = conversations?.[0]?.id || "";

  // The thread is made by whoever writes first, so a request nobody has discussed has none yet.
  const createConversation = async () => {
    const conv: ConversationInterface = { allowAnonymousPosts: false, contentType: "eventRequest", contentId: eventId, title, visibility: "hidden" };
    const result: ConversationInterface[] = await ApiHelper.post("/conversations", [conv], "MessagingApi");
    await refetch();
    return result[0].id || "";
  };

  return (
    <Sheet open onClose={onClose} title={title}>
      <Typography sx={{ fontSize: 14, color: tc.textSecondary, mb: "12px" }}>{Locale.label("mobile.requests.messagesLede")}</Typography>
      {isLoading
        ? <Skeleton variant="rounded" height={96} />
        : (
          <Box data-testid="request-messages">
            <Notes key={conversationId || "new"} context={context as UserContextInterface} conversationId={conversationId} createConversation={createConversation} noDisplayBox maxHeight={320} />
          </Box>
        )}
    </Sheet>
  );
};
