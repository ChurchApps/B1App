import { ApiHelper, ChatStateInterface, ConfigHelper, ConversationInterface, EnvironmentHelper, StreamConfigInterface, StreamingServiceExtendedInterface, StreamingServiceInterface, UserHelper, UserInterface } from "@/helpers";
import { ChatHelper } from "@/helpers/ChatHelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { SocketHelper } from "@/helpers/SocketHelper";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import { Grid, TextField } from "@mui/material";
import React, { useEffect } from "react";
import { InteractionContainer } from "./InteractionContainer";
import { VideoContainer } from "./VideoContainer";
import Cookies from "js-cookie";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";

interface Props { keyName:string }

export const LiveStream: React.FC<Props> = (props) => {
  
  const [config, setConfig] = React.useState<StreamConfigInterface>(null);
  const [chatState, setChatState] = React.useState<ChatStateInterface>(null);
  const [currentService, setCurrentService] = React.useState<StreamingServiceExtendedInterface | null>(null);
  
  const loadData = async (keyName: string) => {
    let result: StreamConfigInterface = await fetch(`${EnvironmentHelper.Common.ContentApi}/preview/data/${keyName}`).then(response => response.json());
    StreamingServiceHelper.updateServiceTimes(result);
    result.keyName = keyName;
    ChatHelper.initChat();
    setConfig(result);
  }

  
  const joinMainRoom = async (churchId: string) => {
    if (currentService) {
      const conversation: ConversationInterface = await ApiHelper.getAnonymous("/conversations/current/" + churchId + "/streamingLive/" + currentService.id, "MessagingApi");
      ChatHelper.current.mainRoom = ChatHelper.createRoom(conversation);
      ChatHelper.current.mainRoom.conversation.title = "Chat";
      setChatState(ChatHelper.current);
      ChatHelper.joinRoom(conversation.id, conversation.churchId);
      ChatHelper.current.mainRoom.joined = true;
    }
  }

  const checkHost = async (d: StreamConfigInterface) => {
    if (chatState.user.isHost) {
      const hostChatDetails = await ApiHelper.get("/streamingServices/" + currentService.id + "/hostChat", "ContentApi");
      if (hostChatDetails.room) {
        d.tabs.push({ type: "hostchat", text: "Host Chat", icon: "group", data: "", url: "" });
        const hostConversation: ConversationInterface = await ApiHelper.get("/conversations/current/" + d.churchId + "/streamingLiveHost/" + hostChatDetails.room, "MessagingApi");
        ChatHelper.current.hostRoom = ChatHelper.createRoom(hostConversation);
        ChatHelper.current.hostRoom.conversation.title = "Host Chat";
        setChatState(ChatHelper.current);
        setTimeout(() => {
          ChatHelper.joinRoom(hostConversation.id, hostConversation.churchId);
          ChatHelper.current.hostRoom.joined = true;
        }, 500);
      }
    }
  }

  const handleNameUpdate = (displayName: string) => {
    //const displayName = `${firstName} ${lastName}`
    const data = { socketId: SocketHelper.socketId, name: displayName };
    ApiHelper.postAnonymous("/connections/setName", data, "MessagingApi");
    ChatHelper.current.user.firstName = displayName;
    ChatHelper.current.user.lastName = "";
    Cookies.set("displayName", displayName);
    ChatHelper.onChange();
  }

  const initUser = () => {
    const chatUser = ChatHelper.getUser();
    if (ApiHelper.isAuthenticated) {
      const { firstName, lastName } = UserHelper.user;
      chatUser.firstName = firstName || "Anonymous";
      chatUser.lastName = lastName || "";
      //chatUser.isHost = true;
      ChatHelper.current.user = chatUser;
      ChatHelper.onChange();
    }
  }

  const checkJoinRooms = () => {
    if (currentService && config) {
      joinMainRoom(ChatConfigHelper.current.churchId);
      checkHost(config);
    }
  }


  //useEffect(() => { loadData(props.keyName); }, []);
  //useEffect(() => { loadData(props.keyName); }, []);
  useEffect(() => {
    ChatHelper.onChange = () => {
      console.log("IT CHANGED")
      setChatState({ ...ChatHelper.current });
      setConfig({ ...ChatConfigHelper.current });
    }
    StreamingServiceHelper.initTimer((cs) => { setCurrentService(cs) });
    loadData(props.keyName);
    setCurrentService(StreamingServiceHelper.currentService);
    initUser();
  }, []);

  /*
  useEffect(() => {
    ChatHelper.onChange = () => {
      setChatState({ ...ChatHelper.current });
      setConfig({ ...ChatConfigHelper.current });
    }
    StreamingServiceHelper.initTimer((cs) => { setCurrentService(cs) });
    loadData(props.keyName);
    setCurrentService(StreamingServiceHelper.currentService);
    initUser();
  }, [loadData]);
*/
  console.log("chatstate", chatState);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        {JSON.stringify(config)}
        <div id="liveContainer">
          <div id="liveBody">
            <VideoContainer currentService={currentService} />
            {(config) && <InteractionContainer chatState={chatState} config={config} />}
          </div>
        </div>

        <h2>Bottom of page</h2>
      </Grid>
    </Grid>
  );
}
