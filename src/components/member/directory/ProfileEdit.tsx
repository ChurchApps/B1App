"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiHelper, DateHelper, ImageEditor, UserHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, TaskInterface } from "@churchapps/helpers";
import { Button, Grid, TextField, Box, Typography, Alert } from "@mui/material";
import { PersonHelper } from "../../../helpers";

// Zod schema - email must be valid format or empty string
const nameSchema = z.object({
  first: z.string(),
  middle: z.string(),
  last: z.string(),
});

const contactInfoSchema = z.object({
  email: z.email("Invalid email format").or(z.literal("")),
  address1: z.string(),
  address2: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  homePhone: z.string(),
  mobilePhone: z.string(),
  workPhone: z.string(),
});

const profileSchema = z.object({
  name: nameSchema,
  contactInfo: contactInfoSchema,
  birthDate: z.string(),
  photo: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Single source of truth for empty form state
// Note: Can't use Zod .default() because zodResolver types on INPUT not OUTPUT
const PROFILE_DEFAULTS: ProfileFormData = {
  name: { first: "", middle: "", last: "" },
  contactInfo: {
    email: "", address1: "", address2: "", city: "", state: "", zip: "",
    homePhone: "", mobilePhone: "", workPhone: "",
  },
  birthDate: "",
  photo: "",
};

// Maps field paths to labels for displaying modified fields
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
  { key: "contactInfo.workPhone", label: "Work Phone" },
];

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

export const ProfileEdit: React.FC<Props> = (props) => {
  // RHF tracks dirty by comparing to defaultValues - changing back = not dirty
  const {
    control,
    handleSubmit,
    formState: { isDirty, dirtyFields, isSubmitting },
    reset,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: PROFILE_DEFAULTS,
    mode: "onBlur",
  });

  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const originalPersonRef = useRef<PersonInterface | null>(null);
  const familyMembers = props.familyMembers || [];

  // Sync props to form - reset() updates values and clears dirty state
  useEffect(() => {
    if (props.person) {
      originalPersonRef.current = JSON.parse(JSON.stringify(props.person));
      const { name, contactInfo, birthDate, photo } = props.person;
      reset({
        name: { ...PROFILE_DEFAULTS.name, ...name },
        contactInfo: { ...PROFILE_DEFAULTS.contactInfo, ...contactInfo },
        birthDate: birthDate ? DateHelper.formatHtml5Date(new Date(birthDate)) : "",
        photo: photo ?? "",
      });
    }
  }, [props.person, reset]);

  const handlePhotoUpdate = (dataUrl: string) => {
    setValue("photo", dataUrl, { shouldDirty: true });
    setShowPhotoEditor(false);
  };

  // Flatten nested dirtyFields object to dot-notation paths
  const flattenDirtyFields = (
    obj: Record<string, unknown>,
    prefix = ""
  ): string[] => {
    const paths: string[] = [];

    for (const key in obj) {
      const value = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (value === true) {
        // Leaf node - this field is dirty
        paths.push(path);
      } else if (typeof value === "object" && value !== null) {
        // Nested object - recurse
        paths.push(...flattenDirtyFields(value as Record<string, unknown>, path));
      }
    }

    return paths;
  };

  // Get value by dot-notation path (e.g., "contactInfo.email")
  const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
    }, obj as unknown);
  };

  // Build ProfileChange array from dirty fields - adding new fields just works
  const buildChangesFromDirtyFields = (data: ProfileFormData): ProfileChange[] => {
    const dirtyPaths = flattenDirtyFields(dirtyFields);
    return dirtyPaths
      .map((path) => {
        const fieldDef = fieldDefinitions.find((f) => f.key === path);
        if (!fieldDef) return null;
        const value = getValueByPath(data as unknown as Record<string, unknown>, path);
        return { field: path, label: fieldDef.label, value: String(value ?? "") };
      })
      .filter((change): change is ProfileChange => change !== null);
  };

  const getModifiedFieldLabels = (): string[] => {
    const dirtyPaths = flattenDirtyFields(dirtyFields);
    const labels = dirtyPaths
      .map((path) => fieldDefinitions.find((f) => f.key === path)?.label)
      .filter((label): label is string => !!label);
    familyMembers.forEach(() => labels.push("New Family Member"));
    return labels;
  };

  const onSubmit = async (data: ProfileFormData) => {
    const changes = buildChangesFromDirtyFields(data);
    familyMembers.forEach((name) => {
      changes.push({
        field: "familyMember",
        label: "Add Family Member",
        value: name,
      });
    });

    if (changes.length === 0) return;

    // Build and submit the task
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
      data: JSON.stringify(changes),
    };

    try {
      const publicSettings = await ApiHelper.get(
        `/settings/public/${UserHelper.currentUserChurch.church.id}`,
        "MembershipApi"
      );
      if (publicSettings?.directoryApprovalGroupId) {
        const group: GroupInterface = await ApiHelper.get(
          `/groups/${publicSettings?.directoryApprovalGroupId}`,
          "MembershipApi"
        );
        task.assignedToType = "group";
        task.assignedToId = publicSettings.directoryApprovalGroupId;
        task.assignedToLabel = group?.name;
      }

      await ApiHelper.post("/tasks?type=directoryUpdate", [task], "DoingApi");
      setSubmitted(true);

      // Reset form to current values (clears dirty state)
      reset(data);

      if (props.onFamilyMembersChange) props.onFamilyMembersChange([]);
      if (props.onSave) props.onSave();
    } catch (error) {
      console.error("Error submitting profile changes:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES
  // ---------------------------------------------------------------------------
  const hasChanges = isDirty || familyMembers.length > 0;

  // Get current photo value for display
  // Note: We can't use watch("photo") easily here since we need original too
  const currentPhoto = props.person?.photo;

  if (!props.person) return null;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  /**
   * CONTROLLER COMPONENT PATTERN
   *
   * MUI TextField is a "controlled component" that needs value/onChange props.
   * RHF's register() works with native inputs via refs (uncontrolled).
   *
   * Controller bridges this gap:
   * - name: Field path in the form (supports dot notation!)
   * - control: The control object from useForm
   * - render: Function that receives field props and fieldState
   *
   * The render function receives:
   * - field: { onChange, onBlur, value, name, ref }
   * - fieldState: { invalid, isTouched, isDirty, error }
   *
   * Spread {...field} onto your input to connect it to RHF.
   */
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
            photoUrl={currentPhoto?.startsWith("data:") ? currentPhoto : PersonHelper.getPhotoUrl(props.person)}
            onCancel={() => setShowPhotoEditor(false)}
            onUpdate={handlePhotoUpdate}
          />
        </Box>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                onClick={() => setShowPhotoEditor(true)}
                sx={{ cursor: "pointer", "&:hover": { opacity: 0.8 } }}
              >
                <img
                  src={currentPhoto?.startsWith("data:") ? currentPhoto : PersonHelper.getPhotoUrl(props.person)}
                  alt="Profile"
                  style={{ maxWidth: "100%", borderRadius: 8 }}
                />
                <Typography variant="caption" color="textSecondary">
                  Click to change photo
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="name.first"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="name.middle"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Middle Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="name.last"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Last Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
          Contact
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="contactInfo.email"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  type="email"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="birthDate"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Birth Date"
                  type="date"
                  InputLabelProps={{ shrink: true }} // TODO: deprecated, use slotProps
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
              Address
            </Typography>
            <Controller
              name="contactInfo.address1"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Address Line 1" sx={{ mb: 2 }} />
              )}
            />
            <Controller
              name="contactInfo.address2"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Address Line 2" sx={{ mb: 2 }} />
              )}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="contactInfo.city"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="City" />}
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <Controller
                  name="contactInfo.state"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="State" />}
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <Controller
                  name="contactInfo.zip"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Zip" />}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Phone */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
              Phone
            </Typography>
            <Controller
              name="contactInfo.mobilePhone"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Mobile Phone" sx={{ mb: 2 }} />
              )}
            />
            <Controller
              name="contactInfo.homePhone"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Home Phone" sx={{ mb: 2 }} />
              )}
            />
            <Controller
              name="contactInfo.workPhone"
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label="Work Phone" />}
            />
          </Grid>
        </Grid>

        <Box sx={{
          mt: 3,
          p: 2,
          backgroundColor: hasChanges ? "#fff3cd" : "#f5f5f5",
          borderRadius: 1,
          border: hasChanges ? "1px solid #ffc107" : "1px solid #ddd"
        }}>
          {hasChanges && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Modified:</strong> {getModifiedFieldLabels().join(", ")}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            {props.onCancel && (
              <Button variant="outlined" onClick={props.onCancel} type="button">
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};
