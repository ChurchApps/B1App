import React, { useState, useEffect, useRef } from "react";
import { ApiHelper, DateHelper, ImageEditor, UserHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, TaskInterface } from "@churchapps/helpers";
import { Button, Grid, TextField, Box, Typography, Alert } from "@mui/material";
import { PersonHelper } from "../../../helpers";

interface Props {
  personId: string;
  person: PersonInterface;
  onSave?: () => void;
  onCancel?: () => void;
  familyMembers?: string[];
  onFamilyMembersChange?: (members: string[]) => void;
}

interface ProfileChange {
  field: string;
  label: string;
  value: string;
}

const fieldDefinitions = [
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
  { key: "contactInfo.workPhone", label: "Work Phone" }
];

export const ProfileEdit: React.FC<Props> = (props) => {
  const [person, setPerson] = useState<PersonInterface | null>(null);
  const originalPersonRef = useRef<PersonInterface | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const familyMembers = props.familyMembers || [];

  useEffect(() => {
    if (props.person) {
      setPerson({ ...props.person });
      originalPersonRef.current = JSON.parse(JSON.stringify(props.person));
    }
  }, [props.person]);

  const getFieldValue = (obj: PersonInterface, key: string): string => {
    const parts = key.split(".");
    let value: any = obj;
    for (const part of parts) {
      value = value?.[part];
    }
    if (key === "birthDate" && value) {
      return DateHelper.formatHtml5Date(new Date(value));
    }
    return value || "";
  };

  const setFieldValue = (obj: PersonInterface, key: string, value: string): PersonInterface => {
    const newObj = JSON.parse(JSON.stringify(obj));
    const parts = key.split(".");
    let target: any = newObj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
    return newObj;
  };

  const handleChange = (key: string, value: string) => {
    if (!person || !originalPersonRef.current) return;

    const newPerson = setFieldValue(person, key, value);
    setPerson(newPerson);

    const originalValue = getFieldValue(originalPersonRef.current, key);
    const newModified = new Set(modifiedFields);

    if (value !== originalValue) {
      newModified.add(key);
    } else {
      newModified.delete(key);
    }
    setModifiedFields(newModified);
  };

  const handlePhotoUpdate = (dataUrl: string) => {
    if (!person) return;
    const newPerson = { ...person, photo: dataUrl };
    setPerson(newPerson);

    const newModified = new Set(modifiedFields);
    newModified.add("photo");
    setModifiedFields(newModified);
    setShowPhotoEditor(false);
  };

  const buildChanges = (): ProfileChange[] => {
    const changes: ProfileChange[] = [];

    modifiedFields.forEach((key) => {
      const fieldDef = fieldDefinitions.find((f) => f.key === key);
      if (fieldDef && person) {
        changes.push({
          field: key,
          label: fieldDef.label,
          value: key === "photo" ? person.photo || "" : getFieldValue(person, key)
        });
      }
    });

    familyMembers.forEach((name) => {
      changes.push({
        field: "familyMember",
        label: "Add Family Member",
        value: name
      });
    });

    return changes;
  };

  const handleSubmit = async () => {
    const changes = buildChanges();
    if (changes.length === 0) return;

    setSubmitting(true);

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
      data: JSON.stringify(changes)
    };

    try {
      const publicSettings = await ApiHelper.get(`/settings/public/${UserHelper.currentUserChurch.church.id}`, "MembershipApi");
      if (publicSettings?.directoryApprovalGroupId) {
        const group: GroupInterface = await ApiHelper.get(`/groups/${publicSettings?.directoryApprovalGroupId}`, "MembershipApi");
        task.assignedToType = "group";
        task.assignedToId = publicSettings.directoryApprovalGroupId;
        task.assignedToLabel = group?.name;
      }

      await ApiHelper.post("/tasks?type=directoryUpdate", [task], "DoingApi");
      setSubmitted(true);
      setModifiedFields(new Set());
      if (props.onFamilyMembersChange) props.onFamilyMembersChange([]);
      if (props.onSave) props.onSave();
    } catch (error) {
      console.error("Error submitting profile changes:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getModifiedFieldLabels = (): string[] => {
    const labels: string[] = [];
    modifiedFields.forEach((key) => {
      const fieldDef = fieldDefinitions.find((f) => f.key === key);
      if (fieldDef) labels.push(fieldDef.label);
    });
    familyMembers.forEach(() => labels.push("New Family Member"));
    return labels;
  };

  const hasChanges = modifiedFields.size > 0 || familyMembers.length > 0;

  if (!person) return null;

  return (
    <Box>
      {submitted && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubmitted(false)}>
          Your changes have been submitted for approval.
        </Alert>
      )}

      {/* Photo Editor - Full Width when active */}
      {showPhotoEditor && (
        <Box sx={{ mb: 3, "& .cropper-container": { overflow: "hidden !important" } }}>
          <ImageEditor
            aspectRatio={4 / 3}
            photoUrl={person.photo?.startsWith("data:") ? person.photo : PersonHelper.getPhotoUrl(props.person)}
            onCancel={() => setShowPhotoEditor(false)}
            onUpdate={handlePhotoUpdate}
          />
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Photo Section */}
        <Grid size={{ xs: 12, sm: 3 }}>
          <Box sx={{ textAlign: "center" }}>
            <Box
              onClick={() => setShowPhotoEditor(true)}
              sx={{ cursor: "pointer", "&:hover": { opacity: 0.8 } }}
            >
              <img
                src={person.photo?.startsWith("data:") ? person.photo : PersonHelper.getPhotoUrl(props.person)}
                alt="Profile"
                style={{ maxWidth: "100%", borderRadius: 8 }}
              />
              <Typography variant="caption" color="textSecondary">
                Click to change photo
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Name Fields */}
        <Grid size={{ xs: 12, sm: 9 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="First Name"
                value={getFieldValue(person, "name.first")}
                onChange={(e) => handleChange("name.first", e.target.value)}
                data-testid="profile-first-name-input"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Middle Name"
                value={getFieldValue(person, "name.middle")}
                onChange={(e) => handleChange("name.middle", e.target.value)}
                data-testid="profile-middle-name-input"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={getFieldValue(person, "name.last")}
                onChange={(e) => handleChange("name.last", e.target.value)}
                data-testid="profile-last-name-input"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Contact Section */}
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
        Contact
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={getFieldValue(person, "contactInfo.email")}
            onChange={(e) => handleChange("contactInfo.email", e.target.value)}
            data-testid="profile-email-input"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Birth Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={getFieldValue(person, "birthDate")}
            onChange={(e) => handleChange("birthDate", e.target.value)}
            data-testid="profile-birth-date-input"
          />
        </Grid>
      </Grid>

      {/* Address and Phone Section */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Address */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
            Address
          </Typography>
          <TextField
            fullWidth
            label="Address Line 1"
            value={getFieldValue(person, "contactInfo.address1")}
            onChange={(e) => handleChange("contactInfo.address1", e.target.value)}
            sx={{ mb: 2 }}
            data-testid="profile-address1-input"
          />
          <TextField
            fullWidth
            label="Address Line 2"
            value={getFieldValue(person, "contactInfo.address2")}
            onChange={(e) => handleChange("contactInfo.address2", e.target.value)}
            sx={{ mb: 2 }}
            data-testid="profile-address2-input"
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="City"
                value={getFieldValue(person, "contactInfo.city")}
                onChange={(e) => handleChange("contactInfo.city", e.target.value)}
                data-testid="profile-city-input"
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <TextField
                fullWidth
                label="State"
                value={getFieldValue(person, "contactInfo.state")}
                onChange={(e) => handleChange("contactInfo.state", e.target.value)}
                data-testid="profile-state-input"
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <TextField
                fullWidth
                label="Zip"
                value={getFieldValue(person, "contactInfo.zip")}
                onChange={(e) => handleChange("contactInfo.zip", e.target.value)}
                data-testid="profile-zip-input"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Phone */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
            Phone
          </Typography>
          <TextField
            fullWidth
            label="Mobile Phone"
            value={getFieldValue(person, "contactInfo.mobilePhone")}
            onChange={(e) => handleChange("contactInfo.mobilePhone", e.target.value)}
            sx={{ mb: 2 }}
            data-testid="profile-mobile-phone-input"
          />
          <TextField
            fullWidth
            label="Home Phone"
            value={getFieldValue(person, "contactInfo.homePhone")}
            onChange={(e) => handleChange("contactInfo.homePhone", e.target.value)}
            sx={{ mb: 2 }}
            data-testid="profile-home-phone-input"
          />
          <TextField
            fullWidth
            label="Work Phone"
            value={getFieldValue(person, "contactInfo.workPhone")}
            onChange={(e) => handleChange("contactInfo.workPhone", e.target.value)}
            data-testid="profile-work-phone-input"
          />
        </Grid>
      </Grid>

      {/* Modified Fields and Submit */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: hasChanges ? "#fff3cd" : "#f5f5f5", borderRadius: 1, border: hasChanges ? "1px solid #ffc107" : "1px solid #ddd" }}>
        {hasChanges && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Modified:</strong> {getModifiedFieldLabels().join(", ")}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1 }}>
          {props.onCancel && (
            <Button variant="outlined" onClick={props.onCancel} data-testid="profile-cancel-button">
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting || !hasChanges}
            data-testid="profile-submit-button"
          >
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
