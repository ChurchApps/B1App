import React from "react";
import { TimelinePostInterface } from "../../../helpers";
import Image from "next/image";
import { Card, CardContent, Grid } from "@mui/material";
import { Conversation, AddNote, ArrayHelper, DateHelper, GroupInterface, PersonInterface, UserContextInterface, UserHelper, ConversationInterface, ApiHelper } from "@churchapps/apphelper";
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

  //const [photoUrl, setPhotoUrl] = useState((props.post.conversation?.messages?.length>0) ? EnvironmentHelper.Common.ContentRoot + "/" + UserHelper.currentUserChurch.church.id + "/membership/people/" + props.post.conversation.messages[0].personId + ".png" : "/images/sample-profile.png");

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
      if (person) result = <Link href={"/member/directory/" + entityId}>{person.name.display}</Link>
    }
    else if (entityType==="group") {
      const group = ArrayHelper.getOne(props.groups, "id", entityId);
      if (group) result = <Link href={"/member/groups/" + entityId}>{group.name}</Link>
    }
    return result;
  }

  const getTaskDetails = () => {
    const creator = getEntity(props.post.data.createdByType, props.post.data.createdById, props.post.data.createdByLabel);
    const assignedTo = getEntity(props.post.data.assignedToType, props.post.data.assignedToId, props.post.data.assignedToLabel);
    const associatedWith = getEntity(props.post.data.associatedWithType, props.post.data.associatedWithId, props.post.data.associatedWithLabel);

    const result=(<>
      {getIntroLine(<><b>Task: {props.post.data.title}</b></>)}
      <p>{creator} has requested this from {assignedTo} on behalf of {associatedWith}</p>
    </>);
    return result;
  }

  const getEventDetails = () => {
    if (!props.post.data) return (<></>);
    const group = ArrayHelper.getOne(props.groups, "id", props.post.data.groupId);
    let start = new Date(props.post.data.start);
    const displayStart = DateHelper.prettyDateTime(start);
    const result=(<>
      {!props.condensed && group?.photoUrl && (<Image src={group?.photoUrl} width="400" height="200" alt={group.name} style={{width:"100%" }} />)}
      {getIntroLine(<><b>Event: {props.post.data.title}</b> - {displayStart}</>)}
      <p>{props.post.data.description}</p>
    </>);
    return result;
  }

  const getVenueDetails = () => {
    const result=(<>
      <a href={"https://lessons.church" + props.post.data.slug} target="_blank"><Image src={props.post.data.image} width="600" height="300" alt={props.post.data.name} style={{aspectRatio:2, height:"auto" }} /></a>
      {getIntroLine(<><b>{props.post.data.studyName}: <a href={"https://lessons.church" + props.post.data.slug} target="_blank">{props.post.data.name}</a></b></>)}
      <p>{props.post.data.description}</p>
    </>);
    return result;
  }

  const getSermonDetails = () => {
    const result=(<>
      <a href={"/sermons"} target="_blank"><img src={props.post.data.thumbnail} width="600" height="338" alt={props.post.data.name} style={{aspectRatio:1.778, height:"auto" }} /></a>
      {getIntroLine(<><b><a href={"/sermons"} target="_blank">{props.post.data.title}</a></b></>)}
      <p>{props.post.data.description}</p>
    </>);
    return result;
  }

  const getGroupDetails = () => {
    if (props.condensed) return null;
    const group = ArrayHelper.getOne(props.groups, "id", props.post.conversation.contentId);
    const result=(<>
      <Image src={group?.photoUrl} width="400" height="200" alt={group.name} style={{width:"100%" }} />
      {getIntroLine(<>Conversation for the {getEntity("group", group.id, group.name)} group</>)}
    </>);
    return result;
  }

  const getIntroLine = (content:JSX.Element) => {
    const displayTime = DateHelper.getDisplayDuration(props.post.timeSent);
    return (<Grid container spacing={2}>
      <Grid item xs={8}>
        {content}
      </Grid>
      <Grid item xs={4} style={{textAlign:"right"}}>
        {displayTime}
      </Grid>
    </Grid>);
  }

  const createConversation = async () => {
    const conv:ConversationInterface = { churchId:UserHelper.currentUserChurch.church.id, contentType:props.post.postType, contentId:props.post.postId, title:props.post.postType + " #" + props.post.postId + " Conversation", messages:[], groupId:props.post.data.groupId };
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
    console.log("Get Group Header", props.condensed, group, props.post.conversation.groupId, props.groups, props.post)
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
