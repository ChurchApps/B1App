import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import type { AppearanceInterface } from "@churchapps/helpers/dist/AppearanceHelper";
import { EnvironmentHelper, StreamConfigInterface } from "@/helpers";
import { ChatHelper } from "@/helpers/ChatHelper";
import { StreamChatManager } from "@/helpers/StreamChatManager";
import { Icon } from "@mui/material";
import Link from "next/link";
import React from "react";
import { ChatName } from "./chat";
import { StreamingNavItems } from "./StreamingNavItems";
import { Permissions } from "@churchapps/helpers";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { AppearanceHelper } from "@churchapps/apphelper/dist/helpers/AppearanceHelper";
import type { UserInterface } from "@churchapps/helpers";

interface Props {
  user: UserInterface,
  config?: StreamConfigInterface,
  appearance?: AppearanceInterface,
  isHost: boolean
}

export const StreamingHeader: React.FC<Props> = (props) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [promptName, setPromptName] = React.useState(false);

  const toggleUserMenu = (e: React.MouseEvent) => { e.preventDefault(); setShowUserMenu(!showUserMenu); }

  const updateName = (displayName: string) => {
    setShowUserMenu(false);
    StreamChatManager.handleNameUpdate(displayName);
  }

  const getLoginLink = () => {
    if (!ApiHelper.isAuthenticated) return (<Link href="/login?returnUrl=/stream" className="nav-link">Login</Link>);
    else return (<Link href="/logout" className="nav-link">Logout</Link>);
  }

  const getProfileLink = () => {
    if (!ApiHelper.isAuthenticated) return (<li className="nav-item"><ChatName user={props.user} updateFunction={updateName} promptName={promptName} /></li>);
    else {
      const jwt = ApiHelper.getConfig("MembershipApi").jwt;
      const profileUrl = `${EnvironmentHelper.Common.ChumsRoot}/login?jwt=${jwt}&returnUrl=/profile`;
      return (<li className="nav-item"><a href={profileUrl} target="_blank" rel="noopener noreferrer" className="nav-link">Profile</a></li>);
    }
  }
  const getSettingLink = () => {
    if (UserHelper.checkAccess(Permissions.contentApi.content.edit) || UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit)) return (
      <li className="nav-item"><Link href="/admin" className="nav-link">Admin Dashboard</Link></li>
    );
  }

  const getUserMenu = () => {
    if (showUserMenu) return (
      <div id="userMenu">
        <div>
          <ul className="nav flex-column d-xl-none">
            <StreamingNavItems config={props.config} />
          </ul>
          <ul className="nav flex-column">
            {getSettingLink()}
            {getProfileLink()}
            <li className="nav-item">{getLoginLink()}</li>
          </ul>
        </div>
      </div>)
    else return null;
  }

  let imgSrc = (props.appearance)
    ? AppearanceHelper.getLogo(props.appearance, "images/logo-header.png", "/images/logo.png", "#FFF")
    : "";

  if (!props.appearance) {
    setTimeout(() => {
      try {
        const { firstName, lastName } = ChatHelper.current.user;
        const displayName = `${firstName} ${lastName}`;
        if (displayName.trim() === "" || displayName === "Anonymous") {
          if (!promptName) {
            setShowUserMenu(true);
            setPromptName(true);
          }
        }
      } catch { }
    }, 30000);
  }

  //const { firstName, lastName } = props.user || {};
  const { firstName, lastName } = ChatHelper.current.user;

  return (
    <>
      <div id="streamingHeader">
        <div id="logo"><img src={imgSrc} alt="logo" /></div>
        <div id="liveButtons" className="d-none d-xl-flex">
          <div>
            <ul className="nav">
              <StreamingNavItems config={props.config} />
            </ul>
          </div>
        </div>
        <div id="userLink"><div><a href="about:blank" onClick={toggleUserMenu}>{firstName ? `${firstName} ${lastName}` : "Anonymous"} <Icon>expand_more</Icon></a></div></div>
      </div>
      {getUserMenu()}
    </>
  );
}

