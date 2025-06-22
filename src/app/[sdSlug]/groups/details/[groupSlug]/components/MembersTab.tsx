"use client";

import { ApiHelper, DisplayBox, GroupInterface, GroupMemberInterface, Loading, PersonHelper, PersonInterface, SmallButton } from "@churchapps/apphelper";
import { Grid, Link, Table, TableBody, TableCell, TableRow } from "@mui/material";
import React from "react";
import { useEffect, useState } from "react";
import { PersonAdd } from "./PersonAdd";

interface Props {
  isLeader: boolean
  group: GroupInterface
}

export function MembersTab(props: Props) {
  const [groupMembers, setGroupMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [props.group]);

  const loadData = () => {
    setIsLoading(true);

    ApiHelper.get(`/groupmembers?groupId=${props.group.id}`, "MembershipApi")
      .then((data) => setGroupMembers(data))
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
    let rows: JSX.Element[] = [];

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
            <Link href={`/my/community/${gm.person.id}`}>{gm.person.name.display}</Link>
          </TableCell>
          {props.isLeader
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
      let gm = { groupId: props.group.id, personId: addedPerson.id, person: addedPerson } as GroupMemberInterface
      ApiHelper.post("/groupmembers", [gm], "MembershipApi").then((data) => {
        gm.id = data[0].id;
      });
      let members = [...groupMembers];
      members.push(gm);
      setGroupMembers(members);
    }
  }

  const handleRemove = (member: GroupMemberInterface) => {
    let members = [...groupMembers];
    let idx = members.indexOf(member);
    members.splice(idx, 1);
    setGroupMembers(members);
    ApiHelper.delete("/groupmembers/" + member.id, "MembershipApi");
  }

  return <>{props.isLeader
    ? <>
      <h2>Members</h2>
      <Grid container spacing={3}>
        <Grid item md={7}>
          <DisplayBox id="groupMembersBox" headerText="Group Members" headerIcon="group">{getTable()}</DisplayBox>
        </Grid>
        <Grid item md={5}>
          <PersonAdd addFunction={handleAdd} getPhotoUrl={PersonHelper.getPhotoUrl} />
        </Grid>
      </Grid>
    </>
    : <>
      <h2>Members</h2>
      <DisplayBox id="groupMembersBox" headerText="Group Members" headerIcon="group">{getTable()}</DisplayBox>
    </>
  }</>
}
