import React from "react";
import { DateHelper, EnvironmentHelper, TimelinePostInterface, UserHelper } from "../../../helpers";
import Image from "next/image";
import { Card, CardContent } from "@mui/material";

interface Props { post:TimelinePostInterface }

export const TimelinePost: React.FC<Props> = (props) => {

  const getPosterBar = () => {
    const displayTime = DateHelper.getDisplayDuration(props.post.timeSent);
    const photoUrl = EnvironmentHelper.Common.ContentRoot + "/" + UserHelper.currentUserChurch.church.id + "/membership/people/" + props.post.conversation?.firstPost?.personId + ".png";
    return (
      <>
        <Image src={photoUrl} width="60" height="45" alt="avatar" style={{width:60, height:45, float:"left", clear:"both", marginRight:20}} />
        <div style={{color:"#999"}}>
          {props.post.conversation?.firstPost?.displayName || props.post.posterName} - {displayTime}
        </div>
      </>);
  }

  let content = <></>;
  switch (props.post.postType)
  {
    case "task":
      content=<><b>Task: </b> {props.post.message}</>
      break;
    case "event":
      content=<><b>Event: </b> {props.post.message}</>
      break;
    case "message":
      content=<><b>Message: </b> {props.post.message}</>
      break;
  }



  return (
    <Card key={props.post.postId} className="socialPost">
      <CardContent>
        {getPosterBar()}
        {content}
      </CardContent>
    </Card>
  )
}
