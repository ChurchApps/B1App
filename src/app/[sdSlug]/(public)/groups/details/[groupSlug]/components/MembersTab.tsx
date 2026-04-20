"use client";

import { ApiHelper } from "@churchapps/apphelper";
import { DisplayBox } from "@churchapps/apphelper";
import { Loading } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import { SmallButton } from "@churchapps/apphelper";
import type { GroupInterface, GroupMemberInterface, PersonInterface } from "@churchapps/helpers";
import { Grid, Link, Table, TableBody, TableCell, TableRow } from "@mui/material";
import React from "react";
import { useEffect, useState } from "react";
import { PersonAdd } from "./PersonAdd";

interface Props {
  isLeader: boolean
  canEditMembers?: boolean
  group: GroupInterface
}

export function MembersTab(props: Props) {
  const [groupMembers, setGroupMembers] = useState<GroupMemberInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [props.group]);

  const loadData = () => {
    setIsLoading(true);

    ApiHelper.get(`/groupmembers?groupId=${props.group.id}`, "MembershipApi")
      .then((data: GroupMemberInterface[]) => setGroupMembers(data))
      .finally(() => setIsLoading(false));
  };

  const getTable = () => {
    if (isLoading) return <Loading />;
    return (
      <Table id="groupMemberTable" size="small">
        <TableBody>{getRows()}</TableBody>
      </Table>
    );
  };

  const getRows = () => {
    const rows: React.ReactElement[] = [];

    if (groupMembers.length === 0) {
      rows.push(<TableRow key="0"><TableCell>No group members found.</TableCell></TableRow>);
      return rows;
    }

    for (let i = 0; i < groupMembers.length; i++) {
      const gm = groupMembers[i];
      rows.push(
        <TableRow key={i}>
          <TableCell>
            <img src={PersonHelper.getPhotoUrl(gm.person)} alt="avatar" style={{ width: "50px", height: "40px", borderRadius: 8 }} />
          </TableCell>
          <TableCell>
            <Link href={`/my/community/${gm.person?.id}`}>{gm.person?.name?.display}</Link>
          </TableCell>
          {(props.canEditMembers ?? props.isLeader)
            && <TableCell style={{ textAlign: "right" }}>
              <SmallButton icon="person_remove" toolTip="Remove" onClick={() => handleRemove(gm)} color="error" data-testid={`remove-member-${gm.personId}-button`} />
            </TableCell>}
        </TableRow>
      );
    }
    return rows;
  };

  const getMemberByPersonId = React.useCallback((personId: string) => {
    let result = null;
    for (let i = 0; i < groupMembers.length; i++) if (groupMembers[i].personId === personId) result = groupMembers[i];
    return result;
  }, [groupMembers]);

  const handleAdd = (addedPerson: PersonInterface) => {
    if (getMemberByPersonId(addedPerson.id) === null) {
      const gm = { groupId: props.group.id, personId: addedPerson.id, person: addedPerson } as GroupMemberInterface;
      ApiHelper.post("/groupmembers", [gm], "MembershipApi").then((data: GroupMemberInterface[]) => {
        gm.id = data[0].id;
      });
      const members = [...groupMembers];
      members.push(gm);
      setGroupMembers(members);
    }
  };

  const handleRemove = (member: GroupMemberInterface) => {
    const members = [...groupMembers];
    const idx = members.indexOf(member);
    members.splice(idx, 1);
    setGroupMembers(members);
    ApiHelper.delete("/groupmembers/" + member.id, "MembershipApi");
  };

  const canEdit = props.canEditMembers ?? props.isLeader;
  return <>{canEdit
    ? <>
      <h2>Members</h2>
      <Grid container spacing={3}>
        <Grid size={{ md: 7 }}>
          <DisplayBox id="groupMembersBox" headerText="Group Members" headerIcon="group">{getTable()}</DisplayBox>
        </Grid>
        <Grid size={{ md: 5 }}>
          <PersonAdd addFunction={handleAdd} getPhotoUrl={PersonHelper.getPhotoUrl} />
        </Grid>
      </Grid>
    </>
    : <>
      <h2>Members</h2>
      <DisplayBox id="groupMembersBox" headerText="Group Members" headerIcon="group">{getTable()}</DisplayBox>
    </>
  }</>;
}
