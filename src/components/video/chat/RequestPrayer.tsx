import { ChatStateInterface, ConversationInterface, ApiHelper } from "@/helpers";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { ChatHelper } from "@/helpers/ChatHelper";
import React from "react";
import { Chat } from "./Chat";

interface Props { chatState: ChatStateInterface | undefined, visible: boolean }

export const RequestPrayer: React.FC<Props> = (props) => {

  const requestPrayer = async (e: React.MouseEvent) => {
    e.preventDefault();
    const conversation: ConversationInterface = await ApiHelper.getAnonymous("/conversations/requestPrayer/" + ChatConfigHelper.current.churchId + "/" + ChatHelper.current.mainRoom.conversation.id, "MessagingApi");
    const prayerRoom = ChatHelper.createRoom(conversation);
    prayerRoom.conversation.title = "Private Chat";
    prayerRoom.joined = true;
    ChatHelper.current.privateRooms.push(prayerRoom);
    ChatHelper.onChange();
    ChatHelper.joinRoom(conversation.id, conversation.churchId);

  }

  if (props.chatState.privateRooms.length !== 0) return (<Chat room={props.chatState.privateRooms[0]} user={props.chatState.user} visible={props.visible} enableAttendance={true} />)
  else return (<div id="prayerContainer" style={(props.visible) ? {} : { display: "none" }}>
        Need prayer?  Start a private chat session with one of our hosts.
    <button id="requestPrayerButton" className="btn btn-primary btn-block" onClick={requestPrayer}>Request Prayer</button>
  </div>);
}

