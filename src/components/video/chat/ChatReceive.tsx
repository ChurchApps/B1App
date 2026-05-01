"use client";
import React, { useRef, useEffect } from "react";
import { ChatMessage } from ".";
import { ChatRoomInterface, ChatUserInterface } from "../../../helpers";

interface Props { room: ChatRoomInterface, user: ChatUserInterface }

export const ChatReceive: React.FC<Props> = (props) => {
  const chatReceiveRef = useRef<HTMLDivElement>(null);

  const getMessages = () => {
    const result = [];
    if (props.room?.messages !== undefined) {
      for (let i = 0; i < props.room.messages.length; i++) {
        result.push(<ChatMessage key={i} message={props.room.messages[i]} conversationId={props.room.conversation.id} user={props.user} />);
      }
    }
    return result;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatReceiveRef.current) {
      chatReceiveRef.current.scrollTo(0, chatReceiveRef.current.scrollHeight);
    }
  }, [props.room?.messages]);

  return (
    <div ref={chatReceiveRef} id="chatReceive">{getMessages()}</div>
  );
};

