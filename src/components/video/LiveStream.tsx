import { ChatStateInterface, EnvironmentHelper, StreamConfigInterface, StreamingServiceExtendedInterface } from "@/helpers";
import { ChatHelper } from "@/helpers/ChatHelper";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import React, { useEffect } from "react";
import { InteractionContainer } from "./InteractionContainer";
import { VideoContainer } from "./VideoContainer";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { AppearanceInterface } from "@/appBase/helpers";
import { StreamingHeader } from "./StreamingHeader";
import { StreamChatManager } from "@/helpers/StreamChatManager";

interface Props { 
  keyName:string, 
  appearance: AppearanceInterface,
  includeInteraction: boolean,
  includeHeader: boolean,
  offlineContent?: JSX.Element
}

export const LiveStream: React.FC<Props> = (props) => {
  
  const [config, setConfig] = React.useState<StreamConfigInterface>(null);
  const [chatState, setChatState] = React.useState<ChatStateInterface>(null);
  const [currentService, setCurrentService] = React.useState<StreamingServiceExtendedInterface | null>(null);

  const loadData = async (keyName: string) => {
    let result: StreamConfigInterface = await fetch(`${EnvironmentHelper.Common.ContentApi}/preview/data/${keyName}`).then(response => response.json());
    StreamingServiceHelper.updateServiceTimes(result);
    result.keyName = keyName;
    ChatConfigHelper.current = result;
    if (props.includeInteraction) ChatHelper.initChat();
    setConfig(result);
  }
   
  const checkJoinRooms = () => {
    if (props.includeInteraction && currentService && config) {
      StreamChatManager.joinMainRoom(ChatConfigHelper.current.churchId, currentService, setChatState);
      StreamChatManager.checkHost(config, currentService.id, chatState, setChatState);
    }
  }
  
  useEffect(() => {
    if (props.includeInteraction)
    {
      ChatHelper.onChange = () => {
        setChatState({ ...ChatHelper.current });
        setConfig({ ...ChatConfigHelper.current });
      }
      StreamChatManager.initUser();
    }
    StreamingServiceHelper.initTimer((cs) => { setCurrentService(cs) });
    loadData(props.keyName);
    setCurrentService(StreamingServiceHelper.currentService);
  }, []);

  React.useEffect(checkJoinRooms, [currentService]); //eslint-disable-line

  let result = (<div id="liveContainer">
    {(props.includeHeader) && <StreamingHeader user={chatState?.user} config={config} appearance={props.appearance} isHost={chatState?.user?.isHost} />}
    <div id="liveBody">
      <VideoContainer currentService={currentService} embedded={!props.includeHeader} />
      {(props.includeInteraction && config) && <InteractionContainer chatState={chatState} config={config} />}
    </div>
  </div>);

  if (props.offlineContent) {
    console.log("check offline")
    console.log(currentService);
    let showAlt = !currentService;
    if (!showAlt) {
      const seconds = (currentService.localCountdownTime.getTime() - new Date().getTime()) / 1000;
      console.log(seconds);
      if (seconds>3600) showAlt = true;
    }
    if (showAlt) result = props.offlineContent;
  } 
  
  return result;

}
