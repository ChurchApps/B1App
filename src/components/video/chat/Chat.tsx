import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import React from "react";
import { ChatSend, Callout, Attendance } from ".";
import { ChatRoomInterface, ChatUserInterface } from "../../../helpers"
import { ChatReceive } from "./ChatReceive";
import { EmbeddedChatName } from "./EmbeddedChatName";

interface Props {
    room: ChatRoomInterface,
    user: ChatUserInterface,
    visible: boolean,
    enableCallout?: boolean,
    enableAttendance?: boolean,
    embedded?: boolean,
}

export const Chat: React.FC<Props> = (props) => {

  const [chatEnabled, setChatEnabled] = React.useState(false);

  const updateChatEnabled = React.useCallback(() => {
    let cs = StreamingServiceHelper.currentService;
    let result = false;
    if (cs !== null) {
      let currentTime = new Date();
      result = currentTime >= (cs.localChatStart || new Date()) && currentTime <= (cs.localChatEnd || new Date());
    }
    if (result !== chatEnabled) setChatEnabled(result);
  }, [chatEnabled]);

  React.useEffect(() => { setInterval(updateChatEnabled, 1000); }, [updateChatEnabled]);

  let className = (chatEnabled) ? "chatContainer" : "chatContainer chatDisabled";

  return (
    <div className={className} style={(props.visible) ? {} : { display: "none" }}>
      {(props.enableAttendance) ? <Attendance user={props.user} attendance={props.room.attendance} /> : null}
      {(props.enableCallout) ? <Callout room={props.room} user={props.user} /> : null}
      <ChatReceive room={props.room} user={props.user} />
      {props.embedded ? <EmbeddedChatName user={props.user} /> : null}
      {props.user.isBlocked ? "Your access to the chat has been restricted" : <ChatSend room={props.room} />}
    </div>
  );
}

