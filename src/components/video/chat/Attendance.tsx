"use client";
import React from "react";
import { ChatRoomInterface, ChatAttendanceInterface, ChatUserInterface } from "../../../helpers";
import { Menu, Item, useContextMenu } from "react-contexify";
import { Icon } from "@mui/material";
import "react-contexify/dist/ReactContexify.css";
import { ChatHelper } from "@/helpers/ChatHelper";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { UniqueIdHelper } from "@churchapps/apphelper";
import type { ConversationInterface } from "@churchapps/helpers";
import { StreamChatManager } from "@/helpers/StreamChatManager";

interface Props {
  attendance: ChatAttendanceInterface;
  user: ChatUserInterface;
}

export const Attendance: React.FC<Props> = (props) => {
  const [showList, setShowList] = React.useState(false);
  const [showName, setShowName] = React.useState("");
  const [selectedConnectionId, setSelectedConnectionId] = React.useState("");

  const toggleAttendance = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowList(!showList);
  };

  const getViewerCount = () => {
    let totalViewers = 0;
    if (props.attendance.viewers !== undefined) totalViewers = props.attendance.viewers.length;
    if (totalViewers === 1) return "1 attendee";
    else return totalViewers.toString() + " attendees";
  };

  const getChevron = () => {
    if (showList) return <i className="expand_less"></i>;
    else return <i className="expand_more"></i>;
  };

  const getNameChevron = (name: string) => {
    if (name === showName) return <a href="about:blank" onClick={(e) => { e.preventDefault(); setShowName(""); }}><i className="expand_less"></i></a>;
    else return <a href="about:blank" onClick={(e) => { e.preventDefault(); setShowName(name); }}><i className="expand_more"></i></a>;
  };

  const getPeople = () => {
    let result = null;
    if (showList && props.attendance.viewers !== undefined) {
      const people = getPeopleCondensed();
      result = <div id="attendance">{people}</div>;
    }
    return result;
  };

  const getIndividuals = (name: string) => {
    const people = [];
    for (let i = 0; i < props.attendance.viewers.length; i++) {
      const v = props.attendance.viewers[i];
      if (v.displayName === name) people.push(<div key={i} onContextMenu={(e) => handleAttendeeContext(e, v.id)} className="attendanceExpanded"><i className="person"></i>{v.displayName} <span className="id">{v.id}</span>{getPMIcon(v.id)}</div>);
    }
    return people;
  };

  const getRoomForConnection = (connectionId: string) => {
    let privateRoom: ChatRoomInterface | null = null;
    ChatHelper.current.privateRooms.forEach(pr => {
      if (pr.conversation.contentType === "privateMessage" && pr.conversation.contentId === connectionId) privateRoom = pr;
    });
    return privateRoom;
  };

  const getPMIcon = (connectionId: string) => {
    let result: React.ReactElement = null;
    if (props.user.isHost) {
      const privateRoom: ChatRoomInterface = getRoomForConnection(connectionId);
      if (privateRoom !== null) {
        if (privateRoom.joined) result = <i className="comment" style={{ marginLeft: 10 }}></i>;
        else result = <i className="comment outline" style={{ marginLeft: 10, opacity: 0.5 }}></i>;

      }
    }
    return result;
  };

  const getBlockIcon = (ipAddress: string) => {
    let result: React.ReactElement = null;

    const handleClick = (e: React.MouseEvent, type: "block" | "unblock") => {
      e.preventDefault();
      if (ipAddress && ipAddress !== "") {
        StreamChatManager.handleBlockAction(ipAddress, props.attendance.conversationId, ChatHelper.current.mainRoom.conversation.contentId);
        if (type === "block") alert("User has been blocked.");
        else alert("User has been unblocked.");
      } else {
        alert("Couldn't block the sender.");
      }
    };

    if (props.user.isHost) {
      if (StreamChatManager.isIpBlocked(ipAddress)) result = <a about="href:blank" title="unblock" style={{ cursor: "pointer" }} onClick={(e) => { handleClick(e, "unblock"); }}><Icon sx={{ color: "#999" }}><img src="/images/icons/unblock.svg" alt="unblock" /></Icon></a>;
      else result = <a about="href:blank" title="block" style={{ cursor: "pointer" }} onClick={(e) => { handleClick(e, "block"); }}><Icon>block</Icon></a>;
    }
    return result;
  };

  const getPeopleCondensed = () => {
    const people: React.ReactNode[] = [];
    const combinedPeople = getCombinedPeople();

    for (let i = 0; i < combinedPeople.length; i++) {
      let children: React.ReactNode[] = [];
      const v = combinedPeople[i];
      let countSpan = null;
      if (v.count > 1) {
        if (!props.user.isHost) countSpan = <span>({v.count})</span>;
        else {
          countSpan = <span>({v.count}) {getNameChevron(v.displayName)} </span>;
          if (v.displayName === showName) children = getIndividuals(v.displayName);
        }
      }

      if (!props.user.isHost || v.count > 1) people.push(<div key={i}><i className="person"></i>{v.displayName} {countSpan}</div>);
      else {
        for (let j = 0; j < props.attendance.viewers.length; j++) {
          const c = props.attendance.viewers[j];
          if (c.displayName === v.displayName) {
            people.push(<div key={j} onContextMenu={(e) => handleAttendeeContext(e, c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0 }}>{v.displayName}</p>
              <div>{getPMIcon(c.id)}{getBlockIcon(c.ipAddress)}</div>
            </div>);
          }
        }
      }

      if (children?.length > 0) people.push(children);
    }
    return people;
  };

interface CombinedPerson {
  displayName: string;
  count: number;
}

const getCombinedPeople = (): CombinedPerson[] => {
  let lastName: string | null = null;
  const result: CombinedPerson[] = [];
  for (let i = 0; i < props.attendance.viewers.length; i++) {
    const v = props.attendance.viewers[i];
    if (v.displayName === lastName) result[result.length - 1].count++;
    else result.push({ displayName: v.displayName, count: 1 });
    lastName = v.displayName;
  }
  return result;
};

const handlePMClick = async (privateRoom: ChatRoomInterface) => {

  if (privateRoom === null) {
    let title = "Private chat";
    props.attendance.viewers.forEach(v => {
      if (v.id === selectedConnectionId) title = "Private chat with " + v.displayName;
    });
    const conversation: ConversationInterface = await ApiHelper.get("/conversations/privateMessage/" + selectedConnectionId, "MessagingApi");
    const pr = ChatHelper.getOrCreatePrivateRoom(conversation);

    pr.conversation.title = title;
    pr.conversation.contentId = selectedConnectionId; //may not be needed
    pr.joined = true;
    ChatConfigHelper.current.switchToConversationId = pr.conversation.id;
    ChatHelper.onChange();
    ChatHelper.joinRoom(conversation.id, conversation.churchId);
  } else {
    privateRoom.joined = true;
    ChatConfigHelper.current.switchToConversationId = privateRoom.conversation.id;
    ChatHelper.onChange();
    ChatHelper.joinRoom(privateRoom.conversation.id, privateRoom.conversation.churchId);
  }
};

const handleVideoChat = async () => {
  if (window.confirm("Would you like to start a video chat?")) {
    const room = (ChatConfigHelper.current.jitsiRoom) ? ChatConfigHelper.current.jitsiRoom : UniqueIdHelper.generateAlphanumeric();
    await ApiHelper.get("/conversations/videoChat/" + selectedConnectionId + "/" + room, "MessagingApi");
    ChatConfigHelper.current.jitsiRoom = room;
    ChatHelper.onChange();
  }
};

const contextMenu = useContextMenu({ id: "attendeeMenu" });

function handleAttendeeContext(e: React.MouseEvent, connectionId: string) {
  e.preventDefault();
  setSelectedConnectionId(connectionId);

  //contextMenu.show(e); //TODO:enable
  // Mitigate library bug by stopping the next keydown once, with auto-cleanup.
  window.addEventListener(
    "keydown",
    (event) => { event.stopPropagation(); },
    { capture: true, once: true }
  );
}

const getContextMenuItems = () => {
  const privateRoom: ChatRoomInterface = getRoomForConnection(selectedConnectionId);
  const result: React.ReactElement[] = [];

  if (privateRoom === null) result.push(<Item onClick={() => handlePMClick(null)}>Private Message</Item>);
  else result.push(<Item onClick={() => handlePMClick(privateRoom)}>Join Private Conversation</Item>);

  result.push(<Item onClick={() => handleVideoChat()}>Invite to Video Chat</Item>);

  return result;
};

return (
  <>
    {getPeople()}
    <a id="attendanceCount" href="about:blank" onClick={toggleAttendance}>{getViewerCount()} {getChevron()}</a>
    <Menu id={"attendeeMenu"}>
      {getContextMenuItems()}

    </Menu>
  </>
);
};

