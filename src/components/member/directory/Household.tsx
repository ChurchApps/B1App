import React from "react";
import { Loading } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { DisplayBox } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { PersonHelper as LocalPersonHelper } from "../../../helpers";

interface Props {
  person: PersonInterface;
  selectedHandler: (personId: string) => void;
  showAddMember?: boolean;
  familyMembers?: string[];
  onFamilyMembersChange?: (members: string[]) => void;
}

export const Household: React.FC<Props> = (props) => {
  const [members, setMembers] = React.useState<PersonInterface[]>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [newFamilyMember, setNewFamilyMember] = React.useState("");

  const isOwnProfile = LocalPersonHelper.person && props.person?.id === LocalPersonHelper.person.id;
  const showAddMemberSection = props.showAddMember && isOwnProfile;

  const handleAddFamilyMember = () => {
    if (newFamilyMember.trim() && props.onFamilyMembersChange) {
      props.onFamilyMembersChange([...(props.familyMembers || []), newFamilyMember.trim()]);
      setNewFamilyMember("");
    }
  };

  const handleRemoveFamilyMember = (index: number) => {
    if (props.onFamilyMembersChange && props.familyMembers) {
      const newMembers = [...props.familyMembers];
      newMembers.splice(index, 1);
      props.onFamilyMembersChange(newMembers);
    }
  };

  const getMember = (member: PersonInterface) => {
    const m = member;
    return (<a href="about:blank" className="householdMember" onClick={(e) => { e.preventDefault(); props.selectedHandler(m.id); }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 2 }}><img src={PersonHelper.getPhotoUrl(member)} alt="avatar" /></Grid>
        <Grid size={{ xs: 10 }}>
          {member?.name?.display}
          <div><span>{member?.householdRole}</span></div>
        </Grid>
      </Grid>
    </a>);
  };

  const getMembers = () => {
    if (isLoading) return (<Loading size="sm" />);
    else {
      const result: React.ReactElement[] = [];
      members?.forEach(m => {
        if (m.id !== props.person.id) result.push(getMember(m));
      });
      return (result);
    }
  };

  const loadMembers = () => {
    if (props.person?.householdId) {
      ApiHelper.get("/people/household/" + props.person?.householdId, "MembershipApi").then((data: PersonInterface[]) => {
        setMembers(data);
        setIsLoading(false);
      });
    }
  };

  React.useEffect(loadMembers, [props.person]);

  const getAddMemberSection = () => {
    if (!showAddMemberSection) return null;

    return (
      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #ddd" }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Add Family Member
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              size="small"
              label="First Name"
              value={newFamilyMember}
              onChange={(e) => setNewFamilyMember(e.target.value)}
              helperText="Enter the first name of a new family member"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button variant="outlined" size="small" onClick={handleAddFamilyMember} disabled={!newFamilyMember.trim()}>
              + Add
            </Button>
          </Grid>
        </Grid>
        {props.familyMembers && props.familyMembers.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {props.familyMembers.map((name, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography variant="body2">• {name}</Typography>
                <Button size="small" color="error" onClick={() => handleRemoveFamilyMember(index)}>
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <DisplayBox id="householdBox" headerIcon="people" headerText="Household" data-testid="household-display-box">
      {getMembers()}
      {getAddMemberSection()}
    </DisplayBox>
  );
};
