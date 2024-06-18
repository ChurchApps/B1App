import React, { useEffect, useState } from "react";
import { ApiHelper, ArrayHelper, DateHelper, ImageEditor, PersonInterface, RoleMemberInterface, TaskInterface, UserHelper } from "@churchapps/apphelper";
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
    createdById: PersonHelper.person.id,
    createdByLabel: PersonHelper.person.name.display,
    // assignedTo
    title: `Profile changes for ${props.person?.name?.display}`,
    status: "Open",
    data: "",
  };

  const categories = [
    { key: "name.first", label: "First Name" },
    { key: "name.middle", label: "Middle Name" },
    { key: "name.last", label: "Last Name" },
    { key: "photo", label: "Photo" },
    // { key: "photoUpdated", label: "Photo Updated" },
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
    let options: JSX.Element[] = [];
    categories.forEach((c) => {
      options.push(<MenuItem value={c.key} disabled={changes?.some((ch) => ch.field === c.key)}>{c.label}</MenuItem>);
    });
    return options;
  };

  const valueOption = () => {
    let option: JSX.Element = <></>;
    switch (currentField.field) {
      case "photo":
        option = (
          <div style={{ marginTop: "10px" }}>
            {showPhotoEditor === true ? (
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
              />
            ) : (
              <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setShowPhotoEditor(true); }}>
                <img src={currentField.value || PersonHelper.getPhotoUrl(props.person)} />
              </a>
            )}
          </div>
        );
        break;
      case "birthDate":
        option = (
          <TextField fullWidth label="Birthdate" name="value" type="date" InputLabelProps={{ shrink: true }} value={DateHelper.formatHtml5Date(new Date(currentField.value))} onChange={handleChange} />
        );
        break;
      default: option = (<TextField fullWidth label="Value" name="value" value={currentField.value || ""} onChange={handleChange} />); break;
    }
    return option;
  };

  const getChangesRows = () => {
    let rows: JSX.Element[] = [];
    changes?.forEach((ch) => {
      let val: any = ch.value;
      if (ch.field === "birthDate") val = DateHelper.formatHtml5Date(new Date(ch.value));
      if (ch.field === "photo") val =  <img src={ch.value} style={{ maxWidth: "70px", maxHeight: "70px" }} />
      rows.push(
        <TableRow>
          <TableCell>{ch.label}</TableCell>
          <TableCell>{val}</TableCell>
          <TableCell>
            <IconButton size="small" color="error" onClick={() => handleDelete(ch.field)}><DeleteIcon fontSize="inherit" /></IconButton>
          </TableCell>
        </TableRow>
      );
    });
    return rows;
  };

  const handleDelete = (field: string) => {
    let newChanges = [...changes];
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
    //get domain Admin, so task can be assigned
    const roles = await ApiHelper.get("/roles/church/" + UserHelper.currentUserChurch.church.id, "MembershipApi");
    const domainRole = ArrayHelper.getOne(roles, "name", "Domain Admins");
    const domainAdmins: RoleMemberInterface[] = await ApiHelper.get(`/rolemembers/roles/${domainRole.id}?include=users`, "MembershipApi");
    if (domainAdmins.length > 0) {
      //currently assignning the task to just one domain admin (which has been added first)
      task.assignedToType = "person";
      task.assignedToId = domainAdmins[0].personId;
      task.assignedToLabel = domainAdmins[0].user.firstName + domainAdmins[0].user?.lastName;
    }

    task.data = JSON.stringify(changes);
    await ApiHelper.post("/tasks?type=directoryUpdate", [task], "DoingApi");
    handleClose();
    props.onSave();
  };

  const loadData = () => {
    ApiHelper.get("/people/household/" + PersonHelper.person.householdId, "MembershipApi").then((data) => setHouseholdMembers(data));
  };

  useEffect(loadData, [props.personId]);

  return (
    <>
      {(PersonHelper.person.id === props.personId ||
        householdMembers?.some((m) => m.id === props.personId)) && (
        <Tooltip title="Modify Profile" arrow>
          <IconButton color="primary" size="medium" onClick={() => setOpen(true)}>
            <AssignmentReturnIcon fontSize="medium" sx={{ transform: "scaleX(-1)" }} />
          </IconButton>
        </Tooltip>
      )}
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
            <Select fullWidth label="Field" name="field" value={currentField.field} onChange={handleChange}>
              {fieldOptions()}
            </Select>
          </FormControl>
          {valueOption()}
          <Button fullWidth variant="outlined" sx={{ paddingTop: 0, paddingBottom: 0 }} onClick={handleAdd}>+ Add</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button variant="contained" onClick={handleRequest} disabled={changes.length === 0}>Request</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
