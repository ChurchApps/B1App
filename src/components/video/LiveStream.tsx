"use client";
import { ChatStateInterface, EnvironmentHelper, StreamConfigInterface, StreamingServiceExtendedInterface } from "@/helpers";
import { ChatHelper } from "@/helpers/ChatHelper";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import React, { useEffect } from "react";
import { InteractionContainer } from "./InteractionContainer";
import { VideoContainer } from "./VideoContainer";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import type { AppearanceInterface } from "@churchapps/helpers/dist/AppearanceHelper";
import { StreamingHeader } from "./StreamingHeader";
import { StreamChatManager } from "@/helpers/StreamChatManager";

interface Props {
  keyName: string,
  appearance: AppearanceInterface,
  includeInteraction: boolean,
  includeHeader: boolean,
  offlineContent?: React.ReactElement,
}

export const LiveStream: React.FC<Props> = (props) => {

  const [config, setConfig] = React.useState<StreamConfigInterface>(null);
  const [chatState, setChatState] = React.useState<ChatStateInterface>(null);
  const [currentService, setCurrentService] = React.useState<StreamingServiceExtendedInterface | null>(null);
  const [overlayContent, setOverlayContent] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [chatReady, setChatReady] = React.useState(false);
  const joinedServiceIdRef = React.useRef<string | null>(null);

  const loadData = async (keyName: string) => {
    let result: StreamConfigInterface = await fetch(`${EnvironmentHelper.Common.ContentApi}/preview/data/${keyName}`).then((response: Response) => response.json());
    StreamingServiceHelper.updateServiceTimes(result);
    result.keyName = keyName;
    ChatConfigHelper.current = result;
    if (props.includeInteraction) {
      await ChatHelper.initChat();
      setChatReady(true);
    }
    setConfig(result);
  }

  const checkJoinRooms = () => {
    // Only join rooms after chat is fully initialized
    if (props.includeInteraction && currentService && config && chatReady) {
      // Prevent duplicate joins for the same service
      if (joinedServiceIdRef.current === currentService.id) return;
      joinedServiceIdRef.current = currentService.id;

      StreamChatManager.joinMainRoom(ChatConfigHelper.current.churchId, currentService, setChatState);
      StreamChatManager.checkHost(config, currentService.id, chatState, setChatState);
    }
  }

  useEffect(() => {
    setIsClient(true);
    if (props.includeInteraction) {
      // Initialize chatState with current value so UI has something to render
      setChatState({ ...ChatHelper.current });
      ChatHelper.onChange = () => {
        setChatState({ ...ChatHelper.current });
        setConfig({ ...ChatConfigHelper.current });
      }
      StreamChatManager.initUser();
    }
    StreamingServiceHelper.initTimer((cs) => { setCurrentService(cs) });
    loadData(props.keyName);
  }, []);

  React.useEffect(checkJoinRooms, [currentService, chatReady, config]); //eslint-disable-line

  let result = (<div id="liveContainer">
    {(props.includeHeader) && <StreamingHeader user={chatState?.user} config={config} appearance={props.appearance} isHost={UserHelper.checkAccess(Permissions.contentApi.chat.host)} />}
    <div id="liveBody">
      <VideoContainer overlayContent={overlayContent} currentService={currentService} embedded={!props.includeHeader} />
      {(props.includeInteraction && config) && <InteractionContainer chatState={chatState} config={config} embedded={!props.includeHeader} />}
    </div>
  </div>);

  if (props.offlineContent && isClient) {
    let showAlt = !currentService;
    if (!showAlt && currentService.localCountdownTime) {
      const seconds = (currentService.localCountdownTime.getTime() - new Date().getTime()) / 1000;
      if (seconds > 3600) showAlt = true;
    }
    if (showAlt) result = props.offlineContent;
  }

  return result;

}
