import { ChatStateInterface } from "@/helpers";
import { ChatHelper } from "@/helpers/ChatHelper";
import React from "react";
import { Chat } from "../"

interface Props { chatState: ChatStateInterface | undefined, visible: boolean, switchToConversationId: string }

export const ReceivePrayer: React.FC<Props> = (props) => {

  const [selectedConversation, setSelectedConversation] = React.useState("");

  const viewPrayer = (e: React.MouseEvent) => {
    e.preventDefault();
    const idx = parseInt(e.currentTarget.getAttribute("data-idx"), 0);
    const conv = props.chatState.hostRoom.prayerRequests[idx];
    const prayerRoom = ChatHelper.createRoom(conv);
    prayerRoom.joined = true;
    ChatHelper.current.privateRooms.push(prayerRoom);
    selectConversation(conv.id);
    props.chatState.hostRoom.prayerRequests.splice(idx, 1);
    ChatHelper.onChange();
    ChatHelper.joinRoom(conv.id, conv.churchId);
  }

  const getRequests = () => {
    let links = [];
    const requests = props.chatState?.hostRoom?.prayerRequests;
    if (requests !== undefined) {
      for (let i = 0; i < requests.length; i++) {
        let pr = requests[i];
        links.push(<div style={{ flex: "1 0 0" }}><a href="about:blank" data-idx={i} onClick={viewPrayer}>{pr.title}</a></div>)
      }
    }
    if (links.length > 0) return (<div style={{ padding: 10 }}>{links}</div>);
    else return (<div style={{ padding: 10 }}><i>There are no pending prayer requests at this time.</i></div>);
  }

  const selectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
  }

  const getRooms = () => {
    let result: React.ReactElement[] = [];
    props.chatState.privateRooms.forEach(r => {
      if (r.joined) {
        let className = "streamingTab streamingChildTab";
        let visible = selectedConversation === r.conversation.id;
        result.push(<a key={"anchor_" + r.conversation.id.toString()} href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); selectConversation(r.conversation.id); }} className={className}>
          <i className="chat"></i>{r.conversation.title}
        </a>);
        result.push(<Chat key={r.conversation.id} room={r} user={props.chatState.user} visible={visible} enableAttendance={true} enableCallout={false} />);
      }

    });
    return result;
  }

  React.useEffect(() => {
    if (props.switchToConversationId !== "" && props.switchToConversationId !== undefined) {
      const convId = props.switchToConversationId;
      if (selectedConversation !== props.switchToConversationId) {
        setTimeout(() => selectConversation(convId), 300);
      }
    }
  }, [props.switchToConversationId, selectedConversation]);

  return <div id="receivePrayerContainer" style={(props.visible) ? {} : { display: "none" }}>
    {getRequests()}
    {getRooms()}
  </div>

}

