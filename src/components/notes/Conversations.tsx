"use client";

// Relocated from @churchapps/apphelper (removed in 0.8.0, where B1App is its only
// consumer). The note/store primitives it builds on (Note, AddNote,
// SubscriptionToggle, ConversationStore, SubscriptionManager, Loading) remain in
// apphelper and are imported from its barrel.

import React from "react";
import { Box, Paper } from "@mui/material";
import { ConversationInterface, MessageInterface, UserContextInterface } from "@churchapps/helpers";
import {
  ApiHelper,
  Locale,
  Loading,
  ConversationStore,
  SubscriptionManager,
  Note,
  AddNote,
  SubscriptionToggle,
  filterVisibleMessages
} from "@churchapps/apphelper";

interface Props {
  contentType: string;
  contentId: string;
  groupId?: string;
  context: UserContextInterface;
  canPost?: boolean;
  visibility?: string;
  noWrapper?: boolean;
  showCommentCount?: boolean;
}

/**
 * Realtime conversation surface keyed by (contentType, contentId). Hydrates via
 * GET /conversations/messages/{contentType}/{contentId}, joins the matching room
 * via SubscriptionManager, and re-renders on inbound message/deleteMessage events.
 */
export function Conversations(props: Props) {
  const canPost = props.canPost !== false;
  const churchId = props.context?.userChurch?.church?.id;
  const personId = props.context?.person?.id;
  const [conversation, setConversation] = React.useState<ConversationInterface | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const [editMessageId, setEditMessageId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let joinedConversationId: string | null = null;

    const run = async () => {
      setHydrated(false);
      setConversation(null);
      if (!props.contentId || !props.contentType) {
        setHydrated(true);
        return;
      }
      const initial = await ConversationStore.loadByContent(props.contentType, props.contentId);
      if (cancelled) return;
      if (initial?.id) {
        unsubscribe = ConversationStore.subscribe(initial.id, (conv) => {
          if (!cancelled) setConversation(conv);
        });
        if (churchId) {
          joinedConversationId = initial.id;
          SubscriptionManager.joinRoom(initial.id, churchId, personId).catch(() => { /* ignore */ });
        }
      }
      setHydrated(true);
    };
    run();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      if (joinedConversationId && churchId) SubscriptionManager.leaveRoom(joinedConversationId, churchId).catch(() => { /* ignore */ });
    };
  }, [props.contentType, props.contentId, churchId, personId]);

  const createConversation = async (): Promise<string> => {
    const newConv: Partial<ConversationInterface> = {
      contentType: props.contentType,
      contentId: props.contentId,
      groupId: props.groupId,
      visibility: props.visibility ?? "public",
      title: `${props.contentType}-${props.contentId} Conversation`,
      allowAnonymousPosts: false
    };
    const result = await ApiHelper.post("/conversations", [newConv], "MessagingApi");
    const created: ConversationInterface = Array.isArray(result) ? result[0] : result;
    if (created?.id) {
      ConversationStore.setConversation({ ...created, messages: [] });
      if (churchId) await SubscriptionManager.joinRoom(created.id, churchId, personId);
      setConversation({ ...created, messages: [] });
    }
    return created?.id;
  };

  if (!hydrated) return <Loading />;

  const allMessages: MessageInterface[] = conversation?.messages ?? [];
  const messages = filterVisibleMessages(allMessages);

  const getNotes = () => messages.map((m) => (
    <Note key={m.id} message={m} context={props.context} showEditNote={(id: string) => setEditMessageId(id)} />
  ));

  const result = (
    <>
      {(props.showCommentCount || conversation?.id) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 32 }}>
          {props.showCommentCount && conversation ? (
            <div className="commentCount">
              <div>
                {messages.length === 1
                  ? "1 " + Locale.label("notes.comment", "comment")
                  : messages.length + " " + Locale.label("notes.comments", "comments")}
              </div>
            </div>
          ) : <span />}
          <SubscriptionToggle
            conversationId={conversation?.id}
            messages={allMessages}
            personId={personId}
          />
        </Box>
      )}
      <div className="messages">
        {canPost && (
          <AddNote
            context={props.context}
            conversationId={conversation?.id}
            createConversation={createConversation}
            onUpdate={() => setEditMessageId(null)}
            onCancel={() => setEditMessageId(null)}
            messageId={editMessageId ?? undefined}
          />
        )}
        <div className="messages-wrapper">
          {getNotes()}
        </div>
      </div>
    </>
  );

  if (props.noWrapper) return result;
  return <Paper sx={{ padding: 1, marginBottom: 2 }}>{result}</Paper>;
}
