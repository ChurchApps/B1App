"use client";

import { Paper, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { ArrayHelper, MessageInterface } from "@churchapps/helpers";
import { ApiHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { ConversationInterface, UserContextInterface } from "@churchapps/helpers";
import { AddNote } from "@churchapps/apphelper";
import { Note } from "@churchapps/apphelper";
import moment from "moment";

interface Props {
  conversation: ConversationInterface;
  context: UserContextInterface;
  showCommentCount?: boolean;
  noWrapper?: boolean;
  pageSize?: number;
}

export function Conversation(props: Props) {
  const [conversations, setConversations] = React.useState<ConversationInterface>(null);
  const [editMessageId, setEditMessageId] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotes(1)
  }, [props])

interface ConversationResponse {
  messages: MessageInterface[];
}

  const loadNotes = async (nextPage: number = 1) => {
    try {
      if (!props?.conversation?.groupId) return;

      setLoading(true);
      const limit = props.pageSize || 10;

      const response: ConversationResponse[] = await ApiHelper.get(
        `/conversations/messages/group/${props.conversation.groupId}?page=${nextPage}&limit=${limit}`,
        "MessagingApi"
      );

      const messages = response[0]?.messages;

      if (messages.length > 0) {
        const peopleIds = ArrayHelper.getIds(messages, "personId");
        const people = await ApiHelper.get(
          "/people/ids?ids=" + peopleIds.join(","),
          "MembershipApi"
        );

        messages.forEach((m: MessageInterface) => {
          m.person = ArrayHelper.getOne(people, "id", m.personId);
        });

        setConversations(prev => {
          const newMessages = nextPage === 1
            ? messages
            : [...(prev?.messages || []), ...messages];
          return { ...prev, messages: newMessages };
        });
        setPage(nextPage);
        setHasMore(messages.length === limit);
      } else {
        setHasMore(false);
      }

      setEditMessageId(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };


  if (conversations === null) return null;

  const getNotes = () => {
    if (!conversations?.messages || conversations.messages.length === 0) return null;

    const notesToShow = showAll || !props.noWrapper
      ? conversations.messages
      : conversations.messages.slice(0, 2);

    return notesToShow.map((message, index) => {
      if (!message.content) return null;

      const isEditing = message.id === editMessageId;

      const diffMinutes = moment().diff(moment(message.timeSent), "minutes");
      const canEdit = diffMinutes <= 45 && message.personId === props.context.person.id;

      return (
        <Note
          key={message.id || index}
          context={props.context}
          message={message}
          isEditing={isEditing}
          hideEdit={!canEdit}
          showEditNote={(id: string) => {
            setEditMessageId(id);
            if (!props.noWrapper) {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        />
      );
    });
  };

  const result = (
    <>
      {props.showCommentCount && (
        <div className="commentCount">
          <div>
            {conversations.postCount === 1
              ? "1 " + Locale.label("notes.comment")
              : conversations.postCount + " " + Locale.label("notes.comments")}
          </div>
          {conversations.postCount > conversations.messages.length && (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                loadNotes(page + 1);
              }}
            >
              {Locale.label("notes.viewAll")} {conversations.postCount}{" "}
              {Locale.label("notes.comments")}
            </a>
          )}
        </div>
      )}
      <div className="messages">
        <AddNote
          context={props.context}
          conversationId={props?.conversation?.id}
          onUpdate={() => loadNotes(1)}
          onCancel={() => setEditMessageId(null)}
          createConversation={async () => props?.conversation?.id}
          messageId={editMessageId}
        />
        <div className="messages-wrapper">
          {getNotes()}
        </div>

        {hasMore && !loading && (showAll || !props.noWrapper) && (
          <Button onClick={() => loadNotes(page + 1)}>Load More</Button>
        )}

        {!showAll && props.noWrapper && (
          <Button onClick={() => setShowAll(true)}>Show All</Button>
        )}

        {loading && <Button disabled>Loading...</Button>}
      </div>
    </>
  );

  if (props.noWrapper) return result;
  return <Paper sx={{ padding: 1, marginBottom: 2 }}>{result}</Paper>;
}
