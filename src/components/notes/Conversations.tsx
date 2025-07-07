"use client";

import React from "react";
import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { ArrayHelper } from "@churchapps/helpers";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { ConversationInterface, UserContextInterface } from "@churchapps/helpers";
import { Conversation } from "./Conversation";
import { NewConversation } from "./NewConversation";

interface Props {
  contentType: string;
  contentId: string;
  groupId: string;
  context: UserContextInterface;
}

export function Conversations(props: Props) {

  const [conversations, setConversations] = React.useState<ConversationInterface[]>(null)
  //const [editMessageId, setEditMessageId] = React.useState(null)

  const loadConversations = async () => {
    const conversations: ConversationInterface[] = (props.contentId) ? await ApiHelper.get("/conversations/" + props.contentType + "/" + props.contentId, "MessagingApi") : [];
    if (conversations.length > 0) {
      const peopleIds: string[] = [];
      conversations.forEach(c => {
        c.messages.forEach(m => {
          if (peopleIds.indexOf(m.personId) === -1) peopleIds.push(m.personId);
        });
      })
      const people = await ApiHelper.get("/people/ids?ids=" + peopleIds.join(","), "MembershipApi");
      conversations.forEach(c => {
        c.messages.forEach(m => {
          m.person = ArrayHelper.getOne(people, "id", m.personId);
        });
      })
    }
    setConversations(conversations);
    //setEditMessageId(null);
  };

  const getConversations = () => {
    if (conversations.length === 0) return <></>
    else {
      let noteArray: React.ReactNode[] = [];
      for (let i = 0; i < conversations.length; i++) noteArray.push(<Conversation context={props.context} conversation={conversations[i]} key={conversations[i].id} />);
      return noteArray;
    }
  }

  React.useEffect(() => { loadConversations() }, [props.contentId]); //eslint-disable-line

  if (!conversations) return <Loading />
  else return (
    <>
      <NewConversation context={props.context} contentType={props.contentType} contentId={props.contentId} onUpdate={loadConversations} groupId={props.groupId} visibility="public" />
      {getConversations()}
    </>
  );
};
