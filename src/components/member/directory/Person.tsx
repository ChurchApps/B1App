import React, { useContext } from "react";
import { Icon, IconButton, Typography, Table, TableHead, TableBody, TableRow, TableCell, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { DisplayBox } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { PersonHelper as AppPersonHelper } from "@churchapps/apphelper";
import type { PersonInterface, TaskInterface } from "@churchapps/helpers";
import { PersonHelper } from "../../../helpers";
import { Household } from "./Household";
import { ProfileEdit } from "./ProfileEdit";
import { DirectMessageModal } from "./DirectMessageModal";
import { VisibilityPreferences } from "./VisibilityPreferences";
import UserContext from "@/context/UserContext";

interface Props { backHandler: () => void, personId: string, selectedHandler: (personId: string) => void }

export const Person: React.FC<Props> = (props) => {
  const [person, setPerson] = React.useState<PersonInterface>(null);
  const [requestedChanges, setRequestedChanges] = React.useState<TaskInterface[]>([]);
  const [showPM, setShowPM] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [familyMembers, setFamilyMembers] = React.useState<string[]>([]);
  const [householdMembers, setHouseholdMembers] = React.useState<PersonInterface[]>([]);
  const context = useContext(UserContext);

  const isOwnProfile = context.person && props.personId === context.person.id;

  interface ProfileChange {
    field: string;
    label: string;
    value: string;
  }

  const showChanges = () => {
    const result: React.ReactElement[] = [];
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
                if (c.field === "photo") val = <img src={c.value} style={{ maxWidth: "70px", maxHeight: "70px" }} alt="" />;
                return (
                  <TableRow key={c.field}>
                    <TableCell>{c.label}</TableCell>
                    <TableCell>{val}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DisplayBox>
      );
    });
    return result;
  };

  const loadData = () => {
    if (!props.personId || props.personId === "undefined" || props.personId.trim() === "") {
      console.error("Invalid personId:", props.personId);
      return;
    }

    ApiHelper.get("/people/directory/" + props.personId, "MembershipApi").then((data: PersonInterface) => {
      setPerson(data);
      if (data?.householdId) {
        ApiHelper.get("/people/household/" + data.householdId, "MembershipApi").then((members: PersonInterface[]) => {
          setHouseholdMembers(members.filter(m => m.id !== props.personId));
        });
      }
    });
    ApiHelper.get("/tasks/directoryUpdate/" + props.personId, "DoingApi").then((data: TaskInterface[]) => setRequestedChanges(data));
  };

  const getPM = () => {
    if (showPM && person) return (<DirectMessageModal onBack={() => { setShowPM(false); }} context={context} person={person} />);
  };

  React.useEffect(loadData, [props.personId]);

  const handleSaveProfile = () => {
    loadData();
    setEditMode(false);
    setFamilyMembers([]);
  };

  const getContactSection = () => {
    const items: React.ReactElement[] = [];
    if (!person) return null;
    const ci = person.contactInfo;
    if (ci?.email) items.push(
      <div className="contactItem" key="email">
        <Icon>mail_outline</Icon>
        <span className="contactValue">{ci.email}</span>
        <span className="contactLabel">Email</span>
      </div>
    );
    if (ci?.mobilePhone) items.push(
      <div className="contactItem" key="mobile">
        <Icon>phone</Icon>
        <span className="contactValue">{ci.mobilePhone}</span>
        <span className="contactLabel">Mobile</span>
      </div>
    );
    if (ci?.homePhone) items.push(
      <div className="contactItem" key="home">
        <Icon>phone</Icon>
        <span className="contactValue">{ci.homePhone}</span>
        <span className="contactLabel">Home</span>
      </div>
    );
    if (ci?.workPhone) items.push(
      <div className="contactItem" key="work">
        <Icon>phone</Icon>
        <span className="contactValue">{ci.workPhone}</span>
        <span className="contactLabel">Work</span>
      </div>
    );
    if (ci?.address1) {
      const addr = [ci.address1, ci.address2, ci.city ? `${ci.city}, ${ci.state} ${ci.zip}` : null].filter(Boolean).join(", ");
      items.push(
        <div className="contactItem" key="address">
          <Icon>room</Icon>
          <span className="contactValue">{addr}</span>
          <span className="contactLabel">Address</span>
        </div>
      );
    }
    if (items.length === 0) return null;
    return (
      <div className="detailSection">
        <h4>Contact Information</h4>
        {items}
      </div>
    );
  };

  const getHouseholdSection = () => {
    if (householdMembers.length === 0) return null;
    return (
      <div className="detailSection">
        <h4>Household Members</h4>
        {householdMembers.map(m => (
          <a key={m.id} href="about:blank" className="hhMember" onClick={(e) => { e.preventDefault(); props.selectedHandler(m.id); }} data-testid={`household-member-${m.id}-link`}>
            <img className="hhAvatar" src={AppPersonHelper.getPhotoUrl(m)} alt="" />
            <div>
              <div className="hhName">{m.name?.display}</div>
              <div className="hhRole">{m.householdRole}</div>
            </div>
          </a>
        ))}
      </div>
    );
  };

  const getCardView = () => (
    <>
      <div className="detailCard">
        <div className="detailHero">
          <img className="heroAvatar" src={PersonHelper.getPhotoUrl(person)} alt="" />
          <div>
            <h3>{person?.name?.display}</h3>
            {person?.name?.last && <div className="heroSubtitle">{person.name.last} household</div>}
          </div>
        </div>
        <div className="detailBody">
          {getContactSection()}
          {getHouseholdSection()}
        </div>
        <div className="detailActions">
          {isOwnProfile
            ? <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => setEditMode(true)} data-testid="edit-profile-button">Edit Profile</Button>
            : <Button variant="contained" size="small" disabled={!person} startIcon={<Icon>mail_outline</Icon>} onClick={() => { if (person) setShowPM(true); }} data-testid="person-message-button">Message</Button>
          }
        </div>
      </div>
      {requestedChanges.length > 0 && showChanges()}
      {getPM()}
    </>
  );

  const getEditView = () => (
    <>
      <DisplayBox id="peopleBox" headerIcon="person" headerText="Edit Profile" data-testid="edit-profile-display-box">
        <ProfileEdit personId={props.personId} person={person} onSave={handleSaveProfile} onCancel={() => setEditMode(false)} familyMembers={familyMembers} onFamilyMembersChange={setFamilyMembers} />
      </DisplayBox>
      {requestedChanges.length > 0 && showChanges()}
      <Household person={person} selectedHandler={props.selectedHandler} showAddMember={editMode} familyMembers={familyMembers} onFamilyMembersChange={setFamilyMembers} />
      {getPM()}
      {isOwnProfile && <VisibilityPreferences />}
    </>
  );

  return editMode ? getEditView() : getCardView();
};
