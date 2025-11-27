"use client";

import React from "react";
import { TimelinePostInterface } from "../../../helpers";
import Image from "next/image";
import { Card, CardContent, Grid } from "@mui/material";
import { Conversation } from "@/components/notes/Conversation";
import { AddNote } from "@churchapps/apphelper";
import { ArrayHelper } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, UserContextInterface, ConversationInterface } from "@churchapps/helpers";
import Link from "next/link";

interface Props {
  post:TimelinePostInterface,
  context: UserContextInterface,
  people: PersonInterface[],
  groups: GroupInterface[],
  condensed?:boolean,
  onUpdate:()=>void
 }

export const TimelinePost: React.FC<Props> = (props) => {

  const getPostDetails = () => {
    const displayTime = DateHelper.getDisplayDuration(props.post.timeSent);

    let result = <></>
    switch (props.post.postType)
    {
      case "task":
        result = getTaskDetails();
        break;
      case "event":
        result = getEventDetails();
        break;
      case "group":
        result = getGroupDetails();
        break;
      case "venue":
        result = getVenueDetails();
        break;
      case "sermon":
        result = getSermonDetails();
        break;
      default:
        result=<>{displayTime} - <b>Message: </b> </>
        break;
    }
    return result;
  }

  const getEntity = (entityType:string, entityId:string, fallback:string) => {
    let result = <>{fallback}</>
    if (entityType==="person") {
      const person = ArrayHelper.getOne(props.people, "id", entityId);
      if (person) result = <Link href={"/my/community/" + entityId}>{person.name.display}</Link>
    }
    else if (entityType==="group") {
      const group = ArrayHelper.getOne(props.groups, "id", entityId);
      if (group) result = <Link href={"/my/groups/" + entityId}>{group.name}</Link>
    }
    return result;
  }

  const getTaskDetails = () => {
    const data = props.post.data as Record<string, string> | undefined;
    const creator = getEntity(data?.createdByType, data?.createdById, data?.createdByLabel);
    const assignedTo = getEntity(data?.assignedToType, data?.assignedToId, data?.assignedToLabel);
    const associatedWith = getEntity(data?.associatedWithType, data?.associatedWithId, data?.associatedWithLabel);

    const result=(<>
      {getIntroLine(<><b>Task: {data?.title}</b></>)}
      <p>{creator} has requested this from {assignedTo} on behalf of {associatedWith}</p>
    </>);
    return result;
  }

  const getEventDetails = () => {
    if (!props.post.data) return (<></>);
    const data = props.post.data as Record<string, string>;
    const group = ArrayHelper.getOne(props.groups, "id", data?.groupId);
    let start = new Date(data?.start);
    const displayStart = DateHelper.prettyDateTime(start);
    const result=(<>
      {!props.condensed && group?.photoUrl && (<Image src={group?.photoUrl} width="400" height="200" alt={group.name} style={{width:"100%" }} />)}
      {getIntroLine(<><b>Event: {data?.title}</b> - {displayStart}</>)}
      <p>{data?.description}</p>
    </>);
    return result;
  }

  const getVenueDetails = () => {
    const data = props.post.data as Record<string, string> | undefined;
    const result=(<>
      <a href={"https://lessons.church" + data?.slug} target="_blank"><Image src={data?.image || ""} width="600" height="300" alt={data?.name || ""} style={{aspectRatio:2, height:"auto" }} /></a>
      {getIntroLine(<><b>{data?.studyName}: <a href={"https://lessons.church" + data?.slug} target="_blank">{data?.name}</a></b></>)}
      <p className="understated">{data?.description}</p>
    </>);
    return result;
  }

  const getSermonDetails = () => {
    const data = props.post.data as Record<string, string> | undefined;
    const result=(<>
      <a href={"/sermons"} target="_blank"><img src={data?.thumbnail} width="600" height="338" alt={data?.name} style={{aspectRatio:1.778, height:"auto" }} /></a>
      {getIntroLine(<><b><a href={"/sermons"} target="_blank">{data?.title}</a></b></>)}
      <p className="understated">{data?.description}</p>
    </>);
    return result;
  }

  const getGroupDetails = () => {
    if (props.condensed) return null;
    const group = ArrayHelper.getOne(props.groups, "id", props.post.conversation.contentId);
    const lines = [];
    const result=(<>
      {group?.photoUrl && (<Image src={group?.photoUrl} width="400" height="200" alt={group.name} style={{width:"100%" }} />)}
      {getIntroLine(<>Conversation for the {getEntity("group", group.id, group.name)} group</>)}
    </>);
    return result;
  }

  const getIntroLine = (content:React.ReactElement) => {
    const displayTime = DateHelper.getDisplayDuration(props.post.timeSent);
    return (<Grid container spacing={2}>
      <Grid size={{ xs: 8 }}>
        {content}
      </Grid>
      <Grid size={{ xs: 4 }} style={{textAlign:"right"}}>
        {displayTime}
      </Grid>
    </Grid>);
  }

  const createConversation = async () => {
    const data = props.post.data as Record<string, string> | undefined;
    const conv:ConversationInterface = { churchId:UserHelper.currentUserChurch.church.id, contentType:props.post.postType, contentId:props.post.postId, title:props.post.postType + " #" + props.post.postId + " Conversation", messages:[], groupId:data?.groupId };
    const result = await ApiHelper.post("/conversations", [conv], "MessagingApi");
    props.post.conversation
    return result[0].id;
  }

  const getConverstation = () => {
    if (props.post.conversation?.messages) return (<Conversation context={props.context} conversation={props.post.conversation} key={props.post.conversation.id} noWrapper />)
    else return <AddNote context={props.context} conversationId={props.post.conversationId} key={props.post.conversationId} onUpdate={props.onUpdate} createConversation={createConversation} />
  }

  const getGroupHeader = () => {
    if (props.condensed) return null;
    const group = ArrayHelper.getOne(props.groups, "id", props.post.groupId);
    if (group) return (<div style={{backgroundColor:"#1976d2", color: "#FFFFFF", textAlign:"center"}}>{group.name}</div>);
  }

  return (
    <Card key={props.post.postId} className="socialPost">
      {getGroupHeader()}
      <CardContent>
        {getPostDetails()}
        <div>
          {getConverstation()}
        </div>
      </CardContent>
    </Card>
  )
}
