"use client";
import React from "react";
import { Attendance, ChatSend } from ".";
import { ChatUserInterface } from "../../../helpers";
import { ChatReceive } from "./ChatReceive";
import { EmbeddedChatName } from "./EmbeddedChatName";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import { Locale } from "@churchapps/apphelper";
import type { ConversationInterface } from "@churchapps/helpers";

interface Props {
    conversation: ConversationInterface,
    user: ChatUserInterface,
    visible: boolean,
    enableAttendance?: boolean,
    embedded?: boolean,
}

export const Chat: React.FC<Props> = (props) => {
  const [chatWindow, setChatWindow] = React.useState<{ enabled: boolean, start: Date | null }>({ enabled: false, start: null });

  const updateChatEnabled = React.useCallback(() => {
    const cs = StreamingServiceHelper.currentService;
    let enabled = false;
    if (cs !== null) {
      const currentTime = new Date();
      enabled = currentTime >= (cs.localChatStart || new Date()) && currentTime <= (cs.localChatEnd || new Date());
    }
    const start = cs?.localChatStart || null;
    setChatWindow(prev => (prev.enabled !== enabled || prev.start?.getTime() !== start?.getTime() ? { enabled, start } : prev));
  }, []);

  React.useEffect(() => {
    const id = setInterval(updateChatEnabled, 1000);
    return () => clearInterval(id);
  }, [updateChatEnabled]);

  const className = chatWindow.enabled ? "chatContainer" : "chatContainer chatDisabled";

  return (
    <div className={className} style={props.visible ? {} : { display: "none" }}>
      {props.enableAttendance ? <Attendance conversationId={props.conversation.id || ""} /> : null}
      <ChatReceive conversationId={props.conversation.id || ""} user={props.user} />
      {props.embedded ? <EmbeddedChatName user={props.user} /> : null}
      {chatWindow.enabled
        ? <ChatSend conversation={props.conversation} />
        : <div id="chatClosed">{Locale.label("video.chat.chatOpensAt").replace("{}", chatWindow.start?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) || "")}</div>}
    </div>
  );
};
