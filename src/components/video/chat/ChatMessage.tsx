import { ChatHelper } from "@/helpers/ChatHelper";
import React from "react";
import { ChatRoomInterface, ChatUserInterface } from "../../../helpers";
import { Permissions, ApiHelper, UserHelper } from "@churchapps/apphelper";
import { Icon, Stack } from "@mui/material";
import { StreamChatManager } from "@/helpers/StreamChatManager";
import { MessageInterface } from "@/helpers/Messaging";

interface Props { message: MessageInterface, conversationId: string, user: ChatUserInterface, room: ChatRoomInterface }

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
        ? <a href="about:blank" onClick={(e) => { handleBlock(e, "unblock") }}><Icon><img src="/images/icons/unblock.svg" /></Icon></a>
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

