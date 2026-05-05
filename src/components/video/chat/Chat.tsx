"use client";
import React from "react";
import { Attendance, ChatSend } from ".";
import { ChatUserInterface } from "../../../helpers";
import { ChatReceive } from "./ChatReceive";
import { EmbeddedChatName } from "./EmbeddedChatName";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import type { ConversationInterface } from "@churchapps/helpers";

interface Props {
    conversation: ConversationInterface,
    user: ChatUserInterface,
    visible: boolean,
    enableAttendance?: boolean,
    embedded?: boolean,
}

export const Chat: React.FC<Props> = (props) => {
  const [chatEnabled, setChatEnabled] = React.useState(false);

  const updateChatEnabled = React.useCallback(() => {
    const cs = StreamingServiceHelper.currentService;
    let result = false;
    if (cs !== null) {
      const currentTime = new Date();
      result = currentTime >= (cs.localChatStart || new Date()) && currentTime <= (cs.localChatEnd || new Date());
    }
    setChatEnabled(prev => (result !== prev ? result : prev));
  }, []);

  React.useEffect(() => {
    const id = setInterval(updateChatEnabled, 1000);
    return () => clearInterval(id);
  }, [updateChatEnabled]);

  const className = chatEnabled ? "chatContainer" : "chatContainer chatDisabled";

  return (
    <div className={className} style={props.visible ? {} : { display: "none" }}>
      {props.enableAttendance ? <Attendance conversationId={props.conversation.id} /> : null}
      <ChatReceive conversationId={props.conversation.id} user={props.user} />
      {props.embedded ? <EmbeddedChatName user={props.user} /> : null}
      <ChatSend conversation={props.conversation} />
    </div>
  );
};
