import React from "react";
import { ApiHelper } from "../../helpers/ApiHelper";
import { UserHelper } from "../../helpers/UserHelper";
import { NavItem } from "./NavItem";
import { CommonEnvironmentHelper } from "../../helpers/CommonEnvironmentHelper";
import { ChurchInterface } from "../../interfaces";

export interface Props { appName: string; currentChurch: ChurchInterface; router?: any; }

export const AppList: React.FC<Props> = props => {
  const jwt = ApiHelper.getConfig("AccessApi").jwt;
  const churchId = UserHelper.currentChurch.id;
  return (
    <>
      <NavItem url={`${CommonEnvironmentHelper.ChumsRoot}/login?jwt=${jwt}&churchId=${churchId}`} selected={props.appName === "Chums"} external={true} label="Chums" icon="logout" router={props.router} />
      <NavItem url={`${CommonEnvironmentHelper.StreamingLiveRoot.replace("{key}", props.currentChurch.subDomain)}/login?jwt=${jwt}&churchId=${churchId}`} selected={props.appName === "StreamingLive"} external={true} label="StreamingLive" icon="logout" router={props.router} />
      <NavItem url={`${CommonEnvironmentHelper.B1Root.replace("{key}", props.currentChurch.subDomain)}/login?jwt=${jwt}&churchId=${churchId}`} selected={props.appName === "B1.church"} external={true} label="B1.Church" icon="logout" router={props.router} />
      <NavItem url={`${CommonEnvironmentHelper.LessonsRoot}/login?jwt=${jwt}&churchId=${churchId}`} selected={props.appName === "Lessons.church"} external={true} label="Lessons.church" icon="logout" router={props.router} />
    </>
  );
}
