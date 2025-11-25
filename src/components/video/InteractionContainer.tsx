"use client";
import React from "react";

import { Icon, Box } from "@mui/material";
import { useMountedState } from "@churchapps/apphelper";
import { StreamingTabInterface, EnvironmentHelper, StreamConfigInterface, ChatStateInterface } from "@/helpers";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { HostChat, ReceivePrayer } from "./chat/host";
import { RequestPrayer } from "./chat/RequestPrayer";
import { Chat } from "./chat/Chat";

interface Props {
  config: StreamConfigInterface,
  chatState: ChatStateInterface,
  embedded: boolean,
}

export const InteractionContainer: React.FC<Props> = (props) => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const isMounted = useMountedState();

  const selectTab = (index: number) => { setSelectedTab(index); }

  const getAltTabs = () => {
    let result = [];
    if (props.config.tabs != null) {
      for (let i = 0; i < props.config.tabs.length; i++) {
        let t = props.config.tabs[i];
        result.push(<td key={i}><a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); selectTab(i); }} className="streamingAltTab"><Icon sx={{ marginRight: "5px" }}>{t.icon}</Icon></a></td>);
      }
    }
    return result;
  }

  const getFlashing = (visible: boolean, t: StreamingTabInterface) => {
    let result = false;
    if (!visible) result = t.updated === true;
    else t.updated = false;
    return result;
  }

  const getIframe = (tab: StreamingTabInterface, i: number, visible: boolean) => (
    <div key={i} id={"frame" + i.toString()} className="frame" style={(!visible) ? { display: "none" } : {}}>
      <iframe src={tab.url} frameBorder="0" title={"frame" + i.toString()} sandbox="" /> :
    </div>)

  const getPage = (tab: StreamingTabInterface, i: number, visible: boolean) => {

    let url = tab.url;
    if (!url.startsWith("http") && !url.startsWith("/stream")) url = EnvironmentHelper.Common.ContentRoot + "/" + url;

    if (url.startsWith("/stream"))
    {
      return (<div key={i} id={"frame" + i.toString()} className="frame" style={(!visible) ? { display: "none" } : {}}>
        <iframe src={url} frameBorder="0" title={"frame" + i.toString()} /> :
      </div>);
    } else {
      return (<div key={i} id={"frame" + i.toString()} className="frame" style={(!visible) ? { display: "none" } : {}}>
        <iframe src={"/oldPageWrapper.html?url=" + encodeURIComponent(url)} frameBorder="0" title={"frame" + i.toString()} /> :
      </div>);
    }
  }

  const getItems = () => {
    let result = [];
    if (props.config.tabs != null) {
      for (let i = 0; i < props.config.tabs.length; i++) {
        let t = props.config.tabs[i];
        let visible = i === selectedTab;
        let className = getFlashing(visible, t) ? "streamingTab flashing" : "streamingTab";

        result.push(<a key={"anchor" + i.toString()} href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); selectTab(i); }} className={className}>
          <Box sx={{ display: "flex", alignItems: "center" }}><Icon sx={{ marginRight: "5px", marginLeft: "5px" }}>{t.icon}</Icon>{t.text}</Box>
        </a>);

        switch (t.type) {
          case "chat":
            if (props.chatState !== null && props.chatState?.mainRoom !== null) result.push(<Chat key={i} room={props.chatState.mainRoom} user={props.chatState.user} visible={visible} enableAttendance={true} enableCallout={true} embedded={props.embedded} />);
            break;
          case "hostchat":
            if (props.chatState !== null && props.chatState?.hostRoom !== null) result.push(<HostChat key={i} chatState={props.chatState} visible={visible} />);
            break;
          case "prayer":
            if (props.chatState !== null) {
              if (props.chatState?.user.isHost) result.push(<ReceivePrayer key={i} chatState={props.chatState} visible={visible} switchToConversationId={props.config.switchToConversationId} />);
              else result.push(<RequestPrayer key={i} chatState={props.chatState} visible={visible} />);
            }
            break;
          case "page":
            result.push(getPage(t, i, visible));
            break;
          default:
            result.push(getIframe(t, i, visible));
            break;
        }
      }
    }
    return result;
  }

  React.useEffect(() => {
    if (props.config.switchToConversationId !== "" && props.config.switchToConversationId !== undefined) {
      if (props.config.tabs != null) {
        ChatConfigHelper.addMissingPrivateTab();
        let prayerTabIndex = -1;
        for (let i = 0; i < props.config.tabs.length; i++) {
          const t = props.config.tabs[i];
          if (t.type === "prayer" && selectedTab !== i) prayerTabIndex = i;
        }

        if (isMounted()) {
          setSelectedTab(prayerTabIndex);
        }
        props.config.switchToConversationId = "";

      }

    }
  }, [props.config.switchToConversationId, props.config.tabs, selectedTab, isMounted]);

  return (
    <div id="interactionContainer">
      <table id="streamingAltTabs">
        <tbody>
          <tr>{getAltTabs()}</tr>
        </tbody>
      </table>
      {getItems()}
    </div>
  );
}

