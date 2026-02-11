import React, { useEffect, useState } from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { ArrayHelper } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/apphelper";
import { ImageEditor } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, TaskInterface } from "@churchapps/helpers";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Table, TableBody, TableCell, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import { PersonHelper } from "../../../helpers";

interface Props { personId: string; person: PersonInterface; onSave?: () => void }

export const ModifyProfile: React.FC<Props> = (props) => {
  const [householdMembers, setHouseholdMembers] = useState<PersonInterface[]>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [currentField, setCurrentField] = useState<{ field: string; label: string; value: string; }>({ field: "name.first", label: "First Name", value: props.person?.name?.first || "" });
  const [showPhotoEditor, setShowPhotoEditor] = useState<boolean>(false);
  const [changes, setChanges] = useState<{ field: string; label: string; value: string }[]>([]);

  const task: TaskInterface = {
    dateCreated: new Date(),
    associatedWithType: "person",
    associatedWithId: props.personId,
    associatedWithLabel: props.person?.name?.display,
    createdByType: "person",
    createdById: PersonHelper.person?.id || "",
    createdByLabel: PersonHelper.person?.name?.display || "",
    title: `Profile changes for ${props.person?.name?.display}`,
    status: "Open",
    data: ""
  };

  const categories = [
    { key: "name.first", label: "First Name" },
    { key: "name.middle", label: "Middle Name" },
    { key: "name.last", label: "Last Name" },
    { key: "photo", label: "Photo" },
    { key: "birthDate", label: "Birth Date" },
    { key: "contactInfo.email", label: "Email" },
    { key: "contactInfo.address1", label: "Address Line 1" },
    { key: "contactInfo.address2", label: "Address Line 2" },
    { key: "contactInfo.city", label: "City" },
    { key: "contactInfo.state", label: "State" },
    { key: "contactInfo.zip", label: "Zip" },
    { key: "contactInfo.homePhone", label: "Home Phone" },
    { key: "contactInfo.mobilePhone", label: "Mobile Phone" },
    { key: "contactInfo.workPhone", label: "Work Phone" },
    { key: "familyMember", label: "Add a Family Member" }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    const cf = { ...currentField };
    const val = e.target.value;
    switch (e.target.name) {
      case "field":
        cf.field = val;
        cf.label = categories.find((c) => c.key === cf.field).label;
        cf.value = ArrayHelper.getUniqueValues([props.person], cf.field)[0] ?? "";
        break;
      case "value": cf.value = val; break;
      default: cf.field = "name.first"; cf.value = props.person?.name?.first || ""; break;
    }
    setCurrentField(cf);
  };

  const fieldOptions = () => {
    const options: React.ReactElement[] = [];
    categories.forEach((c) => {
      options.push(<MenuItem value={c.key} disabled={changes?.some((ch) => c.key !== "familyMember" && ch.field === c.key)}>{c.label}</MenuItem>);
    });
    return options;
  };

  const valueOption = () => {
    let option: React.ReactElement = <></>;
    switch (currentField.field) {
      case "photo":
        option = (
          <div style={{ marginTop: "10px" }}>
            {showPhotoEditor === true
              ? (
                <ImageEditor
                  aspectRatio={4 / 3}
                  photoUrl={currentField.value || PersonHelper.getPhotoUrl(props.person)}
                  onCancel={() => setShowPhotoEditor(false)}
                  onUpdate={(dataUrl: string) => {
                    const cf = { ...currentField };
                    cf.value = dataUrl;
                    setCurrentField(cf);
                    setShowPhotoEditor(false);
                  }}
                  data-testid="profile-photo-editor"
                />
              )
              : (
                <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setShowPhotoEditor(true); }} data-testid="edit-photo-link" aria-label="Edit profile photo">
                  <img src={currentField.value || PersonHelper.getPhotoUrl(props.person)} alt="Profile photo" data-testid="profile-photo" />
                </a>
              )
            }
          </div>
        );
        break;
      case "birthDate":
        option = (
          <TextField fullWidth label="Birthdate" name="value" type="date" InputLabelProps={{ shrink: true }} value={DateHelper.formatHtml5Date(new Date(currentField.value))} onChange={handleChange} data-testid="birthdate-input" aria-label="Birth date" />
        );
        break;
      default: option = (<TextField fullWidth label="Value" name="value" value={currentField.value || ""} onChange={handleChange} helperText={currentField.field === "familyMember" ? "*Enter First Name only" : null} data-testid="field-value-input" aria-label={`${currentField.label} value`} />); break;
    }
    return option;
  };

  const getChangesRows = () => {
    const rows: React.ReactElement[] = [];
    changes?.forEach((ch) => {
      let val: string | React.ReactElement = ch.value;
      if (ch.field === "birthDate") val = DateHelper.formatHtml5Date(new Date(ch.value));
      if (ch.field === "photo") val = <img src={ch.value} style={{ maxWidth: "70px", maxHeight: "70px" }} alt="" />;
      rows.push(
        <TableRow>
          <TableCell>{ch.label}</TableCell>
          <TableCell>{val}</TableCell>
          <TableCell>
            <IconButton size="small" color="error" onClick={() => handleDelete(ch.field)} data-testid={`delete-change-${ch.field}-button`} aria-label={`Delete ${ch.label} change`}><DeleteIcon fontSize="inherit" /></IconButton>
          </TableCell>
        </TableRow>
      );
    });
    return rows;
  };

  const handleDelete = (field: string) => {
    const newChanges = [...changes];
    const array = newChanges.filter((ch) => ch.field !== field);
    setChanges(array);
  };

  const handleClose = () => {
    setCurrentField({ field: "name.first", label: "First Name", value: props.person?.name?.first || "" });
    setShowPhotoEditor(false);
    setChanges([]);
    setOpen(false);
  };

  const handleAdd = () => {
    const newChanges = [...changes];
    newChanges.push(currentField);
    setChanges(newChanges);
    setCurrentField({ field: "name.first", label: "First Name", value: props.person?.name?.first || "" });
  };

  const handleRequest = async () => {
    //get directory approval group Id from settings, so task can be assigned
    const publicSettings = await ApiHelper.get(`/settings/public/${UserHelper.currentUserChurch.church.id}`, "MembershipApi");
    if (publicSettings?.directoryApprovalGroupId) {
      const group: GroupInterface = await ApiHelper.get(`/groups/${publicSettings?.directoryApprovalGroupId}`, "MembershipApi");
      task.assignedToType = "group";
      task.assignedToId = publicSettings.directoryApprovalGroupId;
      task.assignedToLabel = group?.name;
    }

    task.data = JSON.stringify(changes);
    await ApiHelper.post("/tasks?type=directoryUpdate", [task], "DoingApi");
    handleClose();
    props.onSave();
  };

  const loadData = () => {
    ApiHelper.get("/people/household/" + PersonHelper.person.householdId, "MembershipApi").then((data: PersonInterface[]) => setHouseholdMembers(data));
  };

  useEffect(loadData, [props.personId]);

  return (
    <>
      {(PersonHelper.person.id === props.personId || householdMembers?.some((m) => m.id === props.personId))
        && (
          <Tooltip title="Modify Profile" arrow>
            <IconButton color="primary" size="medium" onClick={() => setOpen(true)} data-testid="modify-profile-button" aria-label="Modify profile">
              <AssignmentReturnIcon fontSize="medium" sx={{ transform: "scaleX(-1)" }} />
            </IconButton>
          </Tooltip>
        )
      }
      <Dialog open={open} onClose={handleClose} fullWidth>
        <DialogTitle>Modify Profile</DialogTitle>
        <DialogContent>
          <Typography fontSize="13px" fontStyle="italic">You can request changes to modify{" "}<b>{props.person?.name?.first}'s profile</b>. They'll be applied once approved by the admin.</Typography>
          <hr />
          <Table>
            <TableBody>{getChangesRows()}</TableBody>
          </Table>
          <FormControl fullWidth>
            <InputLabel>Field</InputLabel>
            <Select fullWidth label="Field" name="field" value={currentField.field} onChange={handleChange} data-testid="field-select" aria-label="Select field to modify">
              {fieldOptions()}
            </Select>
          </FormControl>
          {valueOption()}
          <Button fullWidth variant="outlined" sx={{ paddingTop: 0, paddingBottom: 0 }} onClick={handleAdd} data-testid="add-change-button" aria-label="Add field change">+ Add</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} data-testid="close-modify-profile-button" aria-label="Close modify profile dialog">Close</Button>
          <Button variant="contained" onClick={handleRequest} disabled={changes.length === 0} data-testid="request-changes-button" aria-label="Request profile changes">Request</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
