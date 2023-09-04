import React from "react";
import { EnvironmentHelper } from "../../../helpers"
import { PersonInterface, Loading, ApiHelper } from "@churchapps/apphelper"
import { Grid } from "@mui/material";

interface Props { person: PersonInterface, selectedHandler: (personId: string) => void }

export const Household: React.FC<Props> = (props) => {
  const [members, setMembers] = React.useState<PersonInterface[]>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const getMember = (member: PersonInterface) => {
    const m = member;
    return (<a href="about:blank" className="bigLinkButton householdMember" onClick={(e) => { e.preventDefault(); props.selectedHandler(m.id) }}>
      <Grid container spacing={3}>
        <Grid item xs={2}><img src={EnvironmentHelper.Common.ContentRoot + member?.photo} alt="avatar" /></Grid>
        <Grid item xs={10}>
          {member?.name?.display}
          <div><span>{member?.householdRole}</span></div>
        </Grid>
      </Grid>
    </a>);
  }

  const getMembers = () => {
    if (isLoading) return (<Loading size="sm" />)
    else {
      let result: JSX.Element[] = [];
      members?.forEach(m => {
        if (m.id !== props.person.id) result.push(getMember(m))
      });
      return (result);
    }
  }

  const loadMembers = () => {
    if (props.person?.householdId) {
      ApiHelper.get("/people/household/" + props.person?.householdId, "MembershipApi").then(data => {
        setMembers(data);
        setIsLoading(false);
      });
    }
  }

  React.useEffect(loadMembers, [props.person]);

  return (<><h4>Household</h4>{getMembers()}</>)
}
