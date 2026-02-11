import { ChatStateInterface } from "@/helpers";
import React from "react";
import { Attendance } from "../Attendance";
import { ChatReceive } from "../ChatReceive";
import { ChatSend } from "../ChatSend";

interface Props { chatState: ChatStateInterface, visible: boolean }
export const HostChat: React.FC<Props> = (props) => (
  <div className="chatContainer" style={(props.visible) ? {} : { display: "none" }}>
    <Attendance attendance={props.chatState.hostRoom.attendance} user={props.chatState.user} />
    <ChatReceive room={props.chatState.hostRoom} user={props.chatState.user} />
    <ChatSend room={props.chatState.hostRoom} />
  </div>
);

