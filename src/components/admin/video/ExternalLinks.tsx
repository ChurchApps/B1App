import React from "react";
import { Icon } from "@mui/material";
import { DisplayBox } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import { EnvironmentHelper } from "@/helpers";
import Link from "next/link";
import { TableList } from "@/components/admin/TableList";

interface Props { updatedFunction?: () => void, churchId:string }

export const ExternalLinks: React.FC<Props> = (props) => {

  const getChurchEditSettingRows = (): React.ReactElement[] => {
    if (!Permissions.membershipApi.settings.edit) return [];
    const jwt = ApiHelper.getConfig("MembershipApi").jwt;
    const url = `${EnvironmentHelper.Common.ChumsRoot}/login?jwt=${jwt}&returnUrl=/${props.churchId}/manage`;
    return [
      <tr key="appearance"><td><Link href="/admin/site/styles" style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>edit</Icon>Customize Appearance</Link></td></tr>,
      <tr key="users"><td><a href={url} style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>edit</Icon>Edit Users</a></td></tr>,
      <tr key="stream"><td><Link href="/stream" style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>live_tv</Icon>View Your Stream</Link></td></tr>,
    ];
  }

  return (
    <DisplayBox headerIcon="link" headerText="External Resources" editContent={false} help="b1/streaming/appearance">
      <TableList rows={getChurchEditSettingRows()} />
    </DisplayBox>
  );
}
