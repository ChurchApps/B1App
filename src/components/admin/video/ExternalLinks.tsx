import React from "react";
import { Icon } from "@mui/material";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { Permissions } from "@churchapps/helpers";
import { EnvironmentHelper } from "@/helpers";
import Link from "next/link";

interface Props { updatedFunction?: () => void, churchId:string }

export const ExternalLinks: React.FC<Props> = (props) => {

  const getChurchEditSetting = () => {
    if (Permissions.membershipApi.settings.edit) {
      const jwt = ApiHelper.getConfig("MembershipApi").jwt;
      const url = `${EnvironmentHelper.Common.ChumsRoot}/login?jwt=${jwt}&returnUrl=/${props.churchId}/manage`;
      return (<>
        <tr><td><Link href="/admin/site/styles" style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>edit</Icon>Customize Appearance</Link></td></tr>
        <tr><td><a href={url} style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>edit</Icon>Edit Users</a></td></tr>
        <tr><td><Link href="/stream" style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>live_tv</Icon>View Your Stream</Link></td></tr>
      </>);
    }
    else return null;
  }

  return (
    <DisplayBox headerIcon="link" headerText="External Resources" editContent={false} help="b1/streaming/appearance">
      <table className="table">
        <tbody>
          {getChurchEditSetting()}
        </tbody>
      </table>
    </DisplayBox>
  );
}
