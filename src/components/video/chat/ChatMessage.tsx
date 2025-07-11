import { ChatHelper } from "@/helpers/ChatHelper";
import React from "react";
import { ChatUserInterface } from "../../../helpers";
import { Permissions } from "@churchapps/helpers";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import type { MessageInterface } from "@churchapps/helpers";
import { Icon } from "@mui/material";

interface Props { message: MessageInterface, conversationId: string, user: ChatUserInterface }

export const ChatMessage: React.FC<Props> = (props) => {

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    ApiHelper.delete("/messages/" + props.message.id, "MessagingApi");
    //ChatHelper.sendDelete(props.roomName, props.message.timestamp)
  }

  const getDeleteLink = () => {
    if (!UserHelper.checkAccess(Permissions.contentApi.chat.host)) return null;
    else {
      return <span className="delete"><a href="about:blank" onClick={handleDelete}><Icon>delete</Icon></a></span>
    }

  }

  const className = (props.message.displayName.indexOf("Facebook") > -1) ? "message understate" : "message"
  return (
    <div className={className}>
      {getDeleteLink()}
      <b>{props.message.displayName}:</b> <span dangerouslySetInnerHTML={{ __html: ChatHelper.insertLinks(props.message.content) }}></span>
    </div>
  );
}

