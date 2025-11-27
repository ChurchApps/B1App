import React, { useContext } from "react";
import { Grid, Icon, Typography, Table, TableHead, TableBody, TableRow, TableCell, Button } from "@mui/material";
import { DisplayBox } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { PersonInterface, TaskInterface } from "@churchapps/helpers";
import { PersonHelper } from "../../../helpers";
import { Household } from "./Household";
import { ModifyProfile } from "./ModifyProfile";
import { DirectMessageModal } from "./DirectMessageModal";
import { VisibilityPreferences } from "./VisibilityPreferences";
import UserContext from "@/context/UserContext";

interface Props { backHandler: () => void, personId: string, selectedHandler: (personId: string) => void }

export const Person: React.FC<Props> = (props) => {
  const [person, setPerson] = React.useState<PersonInterface>(null);
  const [requestedChanges, setRequestedChanges] = React.useState<TaskInterface[]>([]);
  const [showPM, setShowPM] = React.useState(false);
  const context = useContext(UserContext);

  const getContactMethods = () => {
    let contactMethods = [];
    if (person) {
      const ci = person.contactInfo;
      if (ci.mobilePhone) contactMethods.push(<div className="contactMethod"><Icon sx={{ marginRight: "5px" }}>phone</Icon> {ci.mobilePhone} <label>Mobile</label></div>);
      if (ci.homePhone) contactMethods.push(<div className="contactMethod"><Icon sx={{ marginRight: "5px" }}>phone</Icon> {ci.homePhone} <label>Home</label></div>);
      if (ci.workPhone) contactMethods.push(<div className="contactMethod"><Icon sx={{ marginRight: "5px" }}>phone</Icon> {ci.workPhone} <label>Work</label></div>);
      if (ci.email) contactMethods.push(<div className="contactMethod"><Icon sx={{ marginRight: "5px" }}>mail_outline</Icon> {ci.email}</div>);
      if (ci.address1) {
        let lines = []
        lines.push(<div><Icon sx={{ marginRight: "5px" }}>room</Icon> {ci.address1}</div>);
        if (ci.address2) lines.push(<div>{ci.address2}</div>);
        if (ci.city) lines.push(<div>{ci.city}, {ci.state} {ci.zip}</div>);
        contactMethods.push(<div className="contactMethod">{lines}</div>);
      }
    }
    return contactMethods;
  }

  interface ProfileChange {
    field: string;
    label: string;
    value: string;
  }

  const showChanges = () => {
    let result: React.ReactElement[] = [];
    requestedChanges.map((t) => {
      const changes: ProfileChange[] = JSON.parse(t.data);
      result.push (
        <DisplayBox key={t.id} id="changesBox" headerIcon="assignment_return" headerText="Profile Changes" data-testid={`profile-changes-${t.id}`}>
          <Typography fontSize="13px" fontStyle="italic" sx={{ textIndent: "10px" }}>Requested by {t.createdByLabel}</Typography>
          <Table size="small" sx={{ width: "80%", textIndent: "20px", marginTop: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "1000 !important" }}>Field</TableCell>
                <TableCell sx={{ fontWeight: "1000 !important" }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {changes.map((c: ProfileChange) => {
                let val: React.ReactNode = c.value;
                if (c.field === "photo") val = <img src={c.value} style={{ maxWidth: "70px", maxHeight: "70px" }} alt="" />
                return (
                  <TableRow key={c.field}>
                    <TableCell>{c.label}</TableCell>
                    <TableCell>{val}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </DisplayBox>
      )
    });
    return result;
  }

  const loadData = () => {
    if (!props.personId || props.personId === 'undefined' || props.personId.trim() === '') {
      console.error('Invalid personId:', props.personId);
      return;
    }

    ApiHelper.get("/people/directory/" + props.personId, "MembershipApi").then((data: PersonInterface) => setPerson(data));
    ApiHelper.get("/tasks/directoryUpdate/" + props.personId, "DoingApi").then((data: TaskInterface[]) => setRequestedChanges(data));
  }

  const getEditContent = () => {
    if (PersonHelper.person && props.personId === PersonHelper.person.id) return <ModifyProfile personId={props.personId} person={person} onSave={() => { loadData(); }} />;
    else return <Button variant="contained" color="primary" disabled={!person} onClick={() => {if (person) setShowPM(true)}}>Message</Button>
  }

  const getPM = () => {
    if (showPM && person) return (<DirectMessageModal onBack={() => {setShowPM(false)}} context={context} person={person} />)
  }

  React.useEffect(loadData, [props.personId]);

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DisplayBox id="peopleBox" headerIcon="person" headerText="Contact Information" editContent={getEditContent()} data-testid="contact-information-display-box">
            <Grid container spacing={3}>
              <Grid size={{ xs: 4 }}>
                <img src={PersonHelper.getPhotoUrl(person)} alt="avatar" />
              </Grid>
              <Grid size={{ xs: 8 }}>
                <h2>{person?.name.display}</h2>
                {getContactMethods()}
              </Grid>
            </Grid>
          </DisplayBox>
          {requestedChanges.length > 0 && showChanges()}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>

          <Household person={person} selectedHandler={props.selectedHandler} />
        </Grid>
        {getPM()}
      </Grid>
      {PersonHelper.person && props.personId === PersonHelper.person.id && <VisibilityPreferences />}
    </>

  )
}
