import React from "react";
import { Link } from "react-router-dom"
import { Icon } from "@mui/material";
import { DisplayBox } from "@/appBase/components";
import { ApiHelper, EnvironmentHelper, ConfigHelper } from "@/helpers";
import { Permissions } from "../../../helpers/interfaces";

interface Props { updatedFunction?: () => void, churchId:string }

export const ExternalLinks: React.FC<Props> = (props) => {

  const getChurchEditSetting = () => {
    if (Permissions.membershipApi.settings.edit) {
      const jwt = ApiHelper.getConfig("MembershipApi").jwt;
      const url = `${EnvironmentHelper.Common.ChumsRoot}/login?jwt=${jwt}&returnUrl=/${props.churchId}/manage`;
      return (<tr><td><a href={url} style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>edit</Icon>Customize Appearance / Edit Users</a></td></tr>);
    }
    else return null;
  }

  return (
    <DisplayBox headerIcon="link" headerText="External Resources" editContent={false} help="accounts/appearance">
      <table className="table">
        <tbody>
          {getChurchEditSetting()}
        </tbody>
      </table>
    </DisplayBox>
  );
}
