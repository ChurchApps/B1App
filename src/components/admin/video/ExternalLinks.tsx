import React from "react";
import { Icon } from "@mui/material";
import { DisplayBox } from "@/appBase/components";
import { ApiHelper, EnvironmentHelper } from "@/helpers";
import { Permissions } from "../../../helpers/interfaces";
import Link from "next/link";

interface Props { updatedFunction?: () => void, churchId:string }

export const ExternalLinks: React.FC<Props> = (props) => {

  const getChurchEditSetting = () => {
    if (Permissions.membershipApi.settings.edit) {
      const jwt = ApiHelper.getConfig("MembershipApi").jwt;
      const url = `${EnvironmentHelper.Common.ChumsRoot}/login?jwt=${jwt}&returnUrl=/${props.churchId}/manage`;
      return (<>
        <tr><td><Link href="/admin/site" style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>edit</Icon>Customize Appearance</Link></td></tr>
        <tr><td><a href={url} style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>edit</Icon>Edit Users</a></td></tr>
      </>);
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
