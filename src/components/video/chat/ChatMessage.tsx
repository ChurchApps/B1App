import { ChatHelper } from "@/helpers/ChatHelper";
import React from "react";
import { ChatRoomInterface, ChatUserInterface } from "../../../helpers";
import { Permissions, ApiHelper, UserHelper } from "@churchapps/apphelper";
import { Icon, Stack } from "@mui/material";
import { StreamChatManager } from "@/helpers/StreamChatManager";
import { MessageInterface } from "@/helpers/Messaging";

interface Props { message: MessageInterface, conversationId: string, user: ChatUserInterface, room: ChatRoomInterface }

const UnBlockSVG = <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M5.63604 18.364C9.15076 21.8787 14.8492 21.8787 18.364 18.364C21.8787 14.8492 21.8787 9.15076 18.364 5.63604C14.8492 2.12132 9.15076 2.12132 5.63604 5.63604C2.12132 9.15076 2.12132 14.8492 5.63604 18.364ZM7.80749 17.6067C10.5493 19.6623 14.4562 19.4433 16.9497 16.9497C19.4433 14.4562 19.6623 10.5493 17.6067 7.80749L14.8284 10.5858C14.4379 10.9763 13.8047 10.9763 13.4142 10.5858C13.0237 10.1953 13.0237 9.5621 13.4142 9.17157L16.1925 6.39327C13.4507 4.33767 9.54384 4.55666 7.05025 7.05025C4.55666 9.54384 4.33767 13.4507 6.39327 16.1925L9.17157 13.4142C9.5621 13.0237 10.1953 13.0237 10.5858 13.4142C10.9763 13.8047 10.9763 14.4379 10.5858 14.8284L7.80749 17.6067Z" fill="#0b4a7f"></path> </g></svg>;

export const ChatMessage: React.FC<Props> = (props) => {

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    ApiHelper.delete("/messages/" + props.message.id, "MessagingApi");
    //ChatHelper.sendDelete(props.roomName, props.message.timestamp)
  }

  const handleBlock = (e: React.MouseEvent, type: "block" | "unblock") => {
    e.preventDefault();
    const ipAddress = props.message.ipAddress;
    if (ipAddress) {
      if (type === "block") {
        StreamChatManager.blockIp(props.room.conversation.contentId, ipAddress);
        alert("User has been blocked.");
      } else {
        StreamChatManager.unBlockIp(props.room.conversation.contentId, ipAddress);
        alert("User has been unblocked.")
      }
    } else {
      alert("Couldn't block the sender.")
    }
  }

  const getDeleteLink = () => {
    if (!UserHelper.checkAccess(Permissions.contentApi.chat.host)) return null;
    else {
      return <span className="delete"><a href="about:blank" onClick={handleDelete}><Icon>delete</Icon></a></span>
    }
  }

  const getBlockLink = () => {
    if (!UserHelper.checkAccess(Permissions.contentApi.chat.host)) return null;
    else {
      const isBlocked = StreamChatManager.isIpBlocked(props.room.conversation.contentId, props.message.ipAddress);
      return <span>
        {isBlocked
        ? <a href="about:blank" onClick={(e) => { handleBlock(e, "unblock") }}><Icon>{UnBlockSVG}</Icon></a>
        : <a href="about:blank" onClick={(e) => { handleBlock(e, "block") }}><Icon>block</Icon></a>
        }
      </span>
    }
  }

  const className = (props.message.displayName.indexOf("Facebook") > -1) ? "message understate" : "message"
  return (
    <div className={className}>
      <Stack direction="row" alignItems="center" spacing={0.8}>
        <div>
          {getDeleteLink()}
          {getBlockLink()}
        </div>
        <div>
          <b>{props.message.displayName}:</b> <span dangerouslySetInnerHTML={{ __html: ChatHelper.insertLinks(props.message.content) }}></span>
        </div>
      </Stack>
    </div>
  );
}

