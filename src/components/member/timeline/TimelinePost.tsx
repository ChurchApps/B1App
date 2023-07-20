import React, { useState } from "react";
import { ArrayHelper, DateHelper, EnvironmentHelper, GroupInterface, PersonInterface, TimelinePostInterface, UserContextInterface, UserHelper } from "../../../helpers";
import Image from "next/image";
import { Card, CardContent, Grid } from "@mui/material";
import { Conversation } from "@/appBase/components/notes/Conversation";
import { AddNote } from "@/appBase/components/notes/AddNote";
import Link from "next/link";

interface Props {
  post:TimelinePostInterface,
  context: UserContextInterface,
  people: PersonInterface[],
  groups: GroupInterface[],
 }

export const TimelinePost: React.FC<Props> = (props) => {

  const [photoUrl, setPhotoUrl] = useState((props.post.conversation?.messages?.length>0) ? EnvironmentHelper.Common.ContentRoot + "/" + UserHelper.currentUserChurch.church.id + "/membership/people/" + props.post.conversation.messages[0].personId + ".png" : "/images/sample-profile.png");

  const getPostDetails = () => {
    const displayTime = DateHelper.getDisplayDuration(props.post.timeSent);

    let result = <></>
    switch (props.post.postType)
    {
      case "task":
        result=<>{displayTime} - <b>Task: </b> </>
        break;
      case "event":
        result = getEventDetails();
        break;
      case "group":
        result = getGroupDetails();
        break;
      default:
        result=<>{displayTime} - <b>Message: </b> </>
        break;
    }
    return result;
  }

  const getEventDetails = () => {
    console.log("EVENT", props.post)
    const group = ArrayHelper.getOne(props.groups, "id", props.post.data.groupId);
    let start = new Date(props.post.data.start);
    const displayStart = DateHelper.prettyDateTime(start);
    const result=(<>
      {group?.photoUrl && (<Image src={group?.photoUrl} width="400" height="200" alt={group.name} style={{width:"100%" }} />)}
      {getIntroLine(<><b>Event: {props.post.data.title}</b> - {displayStart}</>)}
      <p>{props.post.data.description}</p>
    </>);
    return result;
  }

  const getGroupDetails = () => {
    console.log("GROUP", props.post)

    const group = ArrayHelper.getOne(props.groups, "id", props.post.conversation.contentId);
    const result=(<>
      <Image src={group?.photoUrl} width="400" height="200" alt={group.name} style={{width:"100%" }} />
      {getIntroLine(<>Conversation for the <Link href={"/member/groups/" + group.id}>{group?.name}</Link> Group</>)}
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


  const getConverstation = () => {
    if (props.post.conversation?.messages) return (<Conversation context={props.context} conversation={props.post.conversation} key={props.post.conversation.id} noWrapper />)
    else return <AddNote context={props.context} conversationId={props.post.conversationId} key={props.post.conversationId} onUpdate={() => { } } createConversation={async () => ""} />
  }

  return (
    <Card key={props.post.postId} className="socialPost">
      <CardContent>
        {getPostDetails()}
        <div>
          {getConverstation()}
        </div>
      </CardContent>
    </Card>
  )
}
