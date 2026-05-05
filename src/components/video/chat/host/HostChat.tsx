import React from "react";
import { ChatUserInterface } from "@/helpers";
import { Attendance } from "../Attendance";
import { ChatReceive } from "../ChatReceive";
import { ChatSend } from "../ChatSend";
import type { ConversationInterface } from "@churchapps/helpers";

interface Props { conversation: ConversationInterface, user: ChatUserInterface, visible: boolean }

export const HostChat: React.FC<Props> = (props) => (
  <div className="chatContainer" style={props.visible ? {} : { display: "none" }}>
    <Attendance conversationId={props.conversation.id} />
    <ChatReceive conversationId={props.conversation.id} user={props.user} />
    <ChatSend conversation={props.conversation} />
  </div>
);
