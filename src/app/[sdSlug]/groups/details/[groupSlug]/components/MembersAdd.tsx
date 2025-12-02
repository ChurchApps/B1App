import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { DisplayBox } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import { Loading } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import type { GroupInterface, GroupMemberInterface, PersonInterface } from "@churchapps/helpers";
import { Table, TableBody, TableRow, TableCell, TableHead } from "@mui/material";
import { SmallButton } from "@churchapps/apphelper";
import Link from "next/link";

interface Props { group: GroupInterface, addFunction: (person: PersonInterface) => void }

export const MembersAdd: React.FC<Props> = (props) => {
  const [groupMembers, setGroupMembers] = React.useState<GroupMemberInterface[]>([]);

  const loadData = React.useCallback(() => {
    ApiHelper.get("/groupmembers?groupId=" + props.group.id, "MembershipApi").then((data: GroupMemberInterface[]) => {
      setGroupMembers(data);
    });
  }, [props.group]);
  const addMember = (gm: GroupMemberInterface) => {
    const idx = groupMembers.indexOf(gm);
    const person = groupMembers[idx].person;
    const updatedMembers = [...groupMembers.slice(0, idx), ...groupMembers.slice(idx + 1)];
    setGroupMembers(updatedMembers);
    props.addFunction(person);
  }

  const getRows = () => {
    const rows: React.ReactElement[] = [];
    if (groupMembers.length === 0) {
      rows.push(<TableRow key="0"><TableCell>{Locale.label("No group members available.")}</TableCell></TableRow>);
      return rows;
    }
    for (let i = 0; i < groupMembers.length; i++) {
      const gm = groupMembers[i];
      rows.push(
        <TableRow key={i} className="personSideTable">
          <TableCell><img src={PersonHelper.getPhotoUrl(gm.person)} alt="avatar" /></TableCell>
          <TableCell><Link href={"/people/" + gm.personId}>{gm.person.name.display}</Link></TableCell>
          <TableCell><SmallButton icon="person_add" text={Locale.label("Add")} onClick={() => addMember(gm)} color="success" data-testid={`add-member-${gm.personId}-button`} /></TableCell>
        </TableRow>
      );
    }
    return rows;
  }

  const getTableHeader = () => {
    const rows: React.ReactElement[] = [];
    if (groupMembers.length === 0) return rows;
    rows.push(<TableRow key="0"><th></th><th>{Locale.label("Name")}</th><th></th></TableRow>);
    return rows;
  }

  React.useEffect(() => { if (props.group !== null) loadData(); }, [props.group, loadData]);

  let content = <Loading />
  if (groupMembers) {
    content = (<Table className="personSideTable">
      <TableHead>{getTableHeader()}</TableHead>
      <TableBody>{getRows()}</TableBody>
    </Table>);
  }

  return (
    <div className="sideTableHeader">
      <DisplayBox headerIcon="person" headerText={Locale.label("Available Group Members")} data-cy="available-group-members">
        {content}
      </DisplayBox>
    </div>
  );
}
