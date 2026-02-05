"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiHelper, DateHelper, ImageEditor, UserHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, TaskInterface } from "@churchapps/helpers";
import { Button, Grid, TextField, Box, Typography, Alert, TextFieldProps } from "@mui/material";
import { PersonHelper } from "../../../helpers";

// Reusable form field - gets control from FormProvider context
function FormTextField({ name, ...props }: { name: string } & Omit<TextFieldProps, "name">) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          fullWidth
          label={fieldLabels[name]}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}

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

// Single source of truth for field labels - used by FormTextField and dirty field display
const fieldLabels: Record<string, string> = {
  "name.first": "First Name",
  "name.middle": "Middle Name",
  "name.last": "Last Name",
  "photo": "Photo",
  "birthDate": "Birth Date",
  "contactInfo.email": "Email",
  "contactInfo.address1": "Address Line 1",
  "contactInfo.address2": "Address Line 2",
  "contactInfo.city": "City",
  "contactInfo.state": "State",
  "contactInfo.zip": "Zip",
  "contactInfo.homePhone": "Home Phone",
  "contactInfo.mobilePhone": "Mobile Phone",
  "contactInfo.workPhone": "Work Phone",
};

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
  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: PROFILE_DEFAULTS,
    mode: "onBlur",
  });
  const { handleSubmit, formState: { isDirty, dirtyFields, isSubmitting }, reset, setValue } = methods;

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

  // Build ProfileChange array from dirty fields
  const buildChangesFromDirtyFields = (data: ProfileFormData): ProfileChange[] => {
    return flattenDirtyFields(dirtyFields)
      .filter((path) => fieldLabels[path])
      .map((path) => ({
        field: path,
        label: fieldLabels[path],
        value: String(getValueByPath(data as unknown as Record<string, unknown>, path) ?? ""),
      }));
  };

  const getModifiedFieldLabels = (): string[] => {
    const labels = flattenDirtyFields(dirtyFields)
      .map((path) => fieldLabels[path])
      .filter(Boolean);
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

      <FormProvider {...methods}>
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
                <FormTextField name="name.first" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormTextField name="name.middle" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormTextField name="name.last" />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
          Contact
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField name="contactInfo.email" type="email" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField name="birthDate" type="date" InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
              Address
            </Typography>
            <FormTextField name="contactInfo.address1" sx={{ mb: 2 }} />
            <FormTextField name="contactInfo.address2" sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormTextField name="contactInfo.city" />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <FormTextField name="contactInfo.state" />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <FormTextField name="contactInfo.zip" />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
              Phone
            </Typography>
            <FormTextField name="contactInfo.mobilePhone" sx={{ mb: 2 }} />
            <FormTextField name="contactInfo.homePhone" sx={{ mb: 2 }} />
            <FormTextField name="contactInfo.workPhone" />
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
      </FormProvider>
    </Box>
  );
};
