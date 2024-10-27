"use client";
import React from "react";
import { ChatMessage } from ".";
import { ChatRoomInterface, ChatUserInterface } from "../../../helpers";

interface Props { room: ChatRoomInterface, user: ChatUserInterface }

export const ChatReceive: React.FC<Props> = (props) => {
  const getMessages = () => {
    let result = [];
    if (props.room?.messages !== undefined) {
      for (let i = 0; i < props.room.messages.length; i++) {
        result.push(<ChatMessage key={i} message={props.room.messages[i]} conversationId={props.room.conversation.id} user={props.user} />);
      }
    }
    setTimeout(() => {
      let cr = document.getElementById("chatReceive");
      if (cr !== null) cr.scrollTo(0, cr.scrollHeight);
    }, 50);
    return result;
  }

  return (
    <div id="chatReceive">{getMessages()}</div>
  );
}

