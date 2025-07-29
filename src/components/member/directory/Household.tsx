import React from "react";
import { Loading } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { DisplayBox } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { Grid } from "@mui/material";

interface Props { person: PersonInterface, selectedHandler: (personId: string) => void }

export const Household: React.FC<Props> = (props) => {
  const [members, setMembers] = React.useState<PersonInterface[]>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const getMember = (member: PersonInterface) => {
    const m = member;
    return (<a href="about:blank" className="householdMember" onClick={(e) => { e.preventDefault(); props.selectedHandler(m.id) }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 2 }}><img src={PersonHelper.getPhotoUrl(member)} alt="avatar" /></Grid>
        <Grid size={{ xs: 10 }}>
          {member?.name?.display}
          <div><span>{member?.householdRole}</span></div>
        </Grid>
      </Grid>
    </a>);
  }

  const getMembers = () => {
    if (isLoading) return (<Loading size="sm" />)
    else {
      let result: React.ReactElement[] = [];
      members?.forEach(m => {
        if (m.id !== props.person.id) result.push(getMember(m))
      });
      return (result);
    }
  }

  const loadMembers = () => {
    if (props.person?.householdId) {
      ApiHelper.get("/people/household/" + props.person?.householdId, "MembershipApi").then((data: any) => {
        setMembers(data);
        setIsLoading(false);
      });
    }
  }

  React.useEffect(loadMembers, [props.person]);

  return (
    <DisplayBox id="householdBox" headerIcon="people" headerText="Household" data-testid="household-display-box">
      {getMembers()}
    </DisplayBox>
  )
}
