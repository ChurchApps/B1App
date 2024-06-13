import React from "react";
import { Grid, Icon } from "@mui/material";
import { PersonInterface, DisplayBox, ApiHelper } from "@churchapps/apphelper"
import { PersonHelper } from "../../../helpers";
import { Household } from "./Household";
import { ModifyProfile } from "./ModifyProfile";

interface Props { backHandler: () => void, personId: string, selectedHandler: (personId: string) => void }

export const Person: React.FC<Props> = (props) => {
  const [person, setPerson] = React.useState<PersonInterface>(null);

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

  const loadData = () => { ApiHelper.get("/people/" + props.personId, "MembershipApi").then(data => setPerson(data)); }

  React.useEffect(loadData, [props.personId]);

  return (
    <>
      <DisplayBox id="peopleBox" headerIcon="person" headerText="Contact Information" editContent={<ModifyProfile personId={props.personId} person={person} />}>
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <img src={PersonHelper.getPhotoUrl(person)} alt="avatar" />
          </Grid>
          <Grid item xs={8}>
            <h2>{person?.name.display}</h2>
            {getContactMethods()}
          </Grid>
        </Grid>
      </DisplayBox>
      <Household person={person} selectedHandler={props.selectedHandler} />
    </>
  )
}
