"use client";

/**
 * ProfileEdit Component - React Hook Form + Zod Example
 *
 * This file demonstrates migrating a complex form from manual useState
 * handling to React Hook Form (RHF) with Zod validation.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * 1. Zod schema definition with nested objects
 * 2. useForm hook with zodResolver for validation
 * 3. Controller component for MUI TextField integration
 * 4. Dirty field tracking (replaces manual change detection)
 * 5. Form reset with new default values
 * 6. Async form submission with isSubmitting state
 * 7. Custom handling for non-standard inputs (photo editor)
 */

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiHelper, DateHelper, ImageEditor, UserHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, TaskInterface } from "@churchapps/helpers";
import { Button, Grid, TextField, Box, Typography, Alert } from "@mui/material";
import { PersonHelper } from "../../../helpers";

// =============================================================================
// ZOD SCHEMA DEFINITION
// =============================================================================
/**
 * Zod schemas define the shape and validation rules for form data.
 *
 * Benefits over manual validation:
 * - Type inference: TypeScript types are derived automatically
 * - Composable: Schemas can be nested and reused
 * - Declarative: Validation rules are defined once, not scattered in handlers
 * - Rich error messages: Built-in and customizable error messages
 */

/**
 * Schema for the nested 'name' object.
 * z.string() creates a string validator.
 *
 * Note: We use plain z.string() without .optional() here because:
 * - Our defaultValues always provide strings
 * - RHF expects the inferred type to match defaultValues exactly
 * - Empty string "" is still valid (no .min(1) requirement)
 */
const nameSchema = z.object({
  first: z.string(),
  middle: z.string(),
  last: z.string(),
});

/**
 * Schema for the nested 'contactInfo' object.
 *
 * EMAIL VALIDATION PATTERN:
 * - z.string().email() requires valid email format
 * - .or(z.literal("")) creates a union type allowing empty string
 * - This means: "must be valid email OR empty string" (optional but validated if provided)
 */
const contactInfoSchema = z.object({
  email: z.string().email("Invalid email format").or(z.literal("")),
  address1: z.string(),
  address2: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  homePhone: z.string(),
  mobilePhone: z.string(),
  workPhone: z.string(),
});

/**
 * Main form schema combining all nested schemas.
 * This creates a complete type-safe form structure.
 *
 * The inferred type will have all fields as required strings,
 * matching our defaultValues structure exactly.
 */
const profileSchema = z.object({
  name: nameSchema,
  contactInfo: contactInfoSchema,
  birthDate: z.string(),
  // Photo is handled separately via ImageEditor, but tracked here for dirty state
  photo: z.string(),
});

/**
 * TypeScript type inferred from the Zod schema.
 * z.infer<typeof schema> extracts the type, ensuring form data
 * always matches the schema definition.
 */
type ProfileFormData = z.infer<typeof profileSchema>;

// =============================================================================
// FIELD DEFINITIONS (for change tracking display)
// =============================================================================
/**
 * Maps form field paths to human-readable labels.
 * Used to show users which fields they've modified.
 */
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

// =============================================================================
// COMPONENT PROPS
// =============================================================================
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

// =============================================================================
// COMPONENT
// =============================================================================
export const ProfileEdit: React.FC<Props> = (props) => {
  // ---------------------------------------------------------------------------
  // REACT HOOK FORM SETUP
  // ---------------------------------------------------------------------------
  /**
   * useForm is the main hook that manages all form state.
   *
   * Configuration options:
   * - resolver: zodResolver(schema) connects Zod validation to RHF
   * - defaultValues: Initial form values (important for dirty tracking)
   * - mode: When validation runs ("onBlur", "onChange", "onSubmit", "all")
   *
   * Returns:
   * - control: Object passed to Controller components
   * - handleSubmit: Wrapper that validates before calling your submit function
   * - formState: Contains errors, isDirty, dirtyFields, isSubmitting, etc.
   * - reset: Function to reset form to new default values
   * - setValue: Programmatically set a field value
   * - watch: Subscribe to field value changes
   */
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields, isSubmitting },
    reset,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: { first: "", middle: "", last: "" },
      contactInfo: {
        email: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zip: "",
        homePhone: "",
        mobilePhone: "",
        workPhone: "",
      },
      birthDate: "",
      photo: "",
    },
    // "onBlur" validates when field loses focus - good balance of UX and feedback
    mode: "onBlur",
  });

  // ---------------------------------------------------------------------------
  // LOCAL STATE (non-form state)
  // ---------------------------------------------------------------------------
  /**
   * Some state still lives outside RHF:
   * - UI state (showPhotoEditor, submitted) - not form data
   * - Original person ref - for building change list
   *
   * RHF handles: form values, validation errors, dirty tracking, submit state
   */
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const originalPersonRef = useRef<PersonInterface | null>(null);

  const familyMembers = props.familyMembers || [];

  // ---------------------------------------------------------------------------
  // SYNC PROPS TO FORM
  // ---------------------------------------------------------------------------
  /**
   * When props.person changes, reset the form with new values.
   *
   * reset() does two important things:
   * 1. Updates all form field values
   * 2. Resets dirty state (isDirty becomes false, dirtyFields is cleared)
   *
   * This replaces the manual useState + useEffect pattern.
   */
  useEffect(() => {
    if (props.person) {
      // Store original for change comparison
      originalPersonRef.current = JSON.parse(JSON.stringify(props.person));

      // Reset form with person data, converting to our flat structure
      reset({
        name: {
          first: props.person.name?.first || "",
          middle: props.person.name?.middle || "",
          last: props.person.name?.last || "",
        },
        contactInfo: {
          email: props.person.contactInfo?.email || "",
          address1: props.person.contactInfo?.address1 || "",
          address2: props.person.contactInfo?.address2 || "",
          city: props.person.contactInfo?.city || "",
          state: props.person.contactInfo?.state || "",
          zip: props.person.contactInfo?.zip || "",
          homePhone: props.person.contactInfo?.homePhone || "",
          mobilePhone: props.person.contactInfo?.mobilePhone || "",
          workPhone: props.person.contactInfo?.workPhone || "",
        },
        birthDate: props.person.birthDate
          ? DateHelper.formatHtml5Date(new Date(props.person.birthDate))
          : "",
        photo: props.person.photo || "",
      });
    }
  }, [props.person, reset]);

  // ---------------------------------------------------------------------------
  // PHOTO HANDLING
  // ---------------------------------------------------------------------------
  /**
   * Photo editor is a special case - it's not a standard input.
   * We use setValue() to programmatically update the form value.
   *
   * setValue(name, value, options):
   * - name: Field path (supports dot notation for nested fields)
   * - value: New value
   * - options.shouldDirty: Mark field as dirty (default: false)
   * - options.shouldValidate: Run validation (default: false)
   */
  const handlePhotoUpdate = (dataUrl: string) => {
    setValue("photo", dataUrl, {
      shouldDirty: true, // Important: marks the field as modified
    });
    setShowPhotoEditor(false);
  };

  // ---------------------------------------------------------------------------
  // DIRTY FIELDS HELPER
  // ---------------------------------------------------------------------------
  /**
   * dirtyFields is a nested object matching form structure.
   * Example: { name: { first: true }, contactInfo: { email: true } }
   *
   * This helper flattens it to an array of dot-notation paths
   * that match our fieldDefinitions keys.
   */
  const getDirtyFieldPaths = (): string[] => {
    const paths: string[] = [];

    // Check top-level fields
    if (dirtyFields.birthDate) paths.push("birthDate");
    if (dirtyFields.photo) paths.push("photo");

    // Check nested name fields
    if (dirtyFields.name) {
      if (dirtyFields.name.first) paths.push("name.first");
      if (dirtyFields.name.middle) paths.push("name.middle");
      if (dirtyFields.name.last) paths.push("name.last");
    }

    // Check nested contactInfo fields
    if (dirtyFields.contactInfo) {
      const ci = dirtyFields.contactInfo;
      if (ci.email) paths.push("contactInfo.email");
      if (ci.address1) paths.push("contactInfo.address1");
      if (ci.address2) paths.push("contactInfo.address2");
      if (ci.city) paths.push("contactInfo.city");
      if (ci.state) paths.push("contactInfo.state");
      if (ci.zip) paths.push("contactInfo.zip");
      if (ci.homePhone) paths.push("contactInfo.homePhone");
      if (ci.mobilePhone) paths.push("contactInfo.mobilePhone");
      if (ci.workPhone) paths.push("contactInfo.workPhone");
    }

    return paths;
  };

  /**
   * Convert dirty field paths to human-readable labels for display.
   */
  const getModifiedFieldLabels = (): string[] => {
    const labels: string[] = [];
    const dirtyPaths = getDirtyFieldPaths();

    dirtyPaths.forEach((path) => {
      const fieldDef = fieldDefinitions.find((f) => f.key === path);
      if (fieldDef) labels.push(fieldDef.label);
    });

    // Include family members (managed outside the form)
    familyMembers.forEach(() => labels.push("New Family Member"));

    return labels;
  };

  // ---------------------------------------------------------------------------
  // FORM SUBMISSION
  // ---------------------------------------------------------------------------
  /**
   * handleSubmit is an RHF wrapper that:
   * 1. Prevents default form submission
   * 2. Runs all validation
   * 3. Only calls your function if validation passes
   * 4. Passes validated, typed form data to your function
   *
   * The function receives FormData, not an event!
   *
   * isSubmitting is automatically true while this async function runs.
   */
  const onSubmit = async (data: ProfileFormData) => {
    // Build changes array from dirty fields
    const changes: ProfileChange[] = [];
    const dirtyPaths = getDirtyFieldPaths();

    dirtyPaths.forEach((path) => {
      const fieldDef = fieldDefinitions.find((f) => f.key === path);
      if (fieldDef) {
        // Navigate the data object to get the value
        let value: string;
        if (path === "photo") {
          value = data.photo;
        } else if (path === "birthDate") {
          value = data.birthDate;
        } else if (path.startsWith("name.")) {
          const key = path.split(".")[1] as keyof typeof data.name;
          value = data.name[key];
        } else if (path.startsWith("contactInfo.")) {
          const key = path.split(".")[1] as keyof typeof data.contactInfo;
          value = data.contactInfo[key];
        } else {
          value = "";
        }

        changes.push({
          field: path,
          label: fieldDef.label,
          value,
        });
      }
    });

    // Add family members
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

      {/*
        handleSubmit wraps our onSubmit function.
        It validates the form first and only calls onSubmit if valid.
        TypeScript knows onSubmit receives ProfileFormData, not an event.
      */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Photo Section */}
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

          {/* Name Fields */}
          <Grid size={{ xs: 12, sm: 9 }}>
            <Grid container spacing={2}>
              {/*
                CONTROLLER EXAMPLE - Nested field with dot notation
                name="name.first" maps to form.name.first in the schema
              */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="name.first"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name"
                      // fieldState.error comes from Zod validation
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

        {/* Contact Section */}
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600, borderBottom: "1px solid #ddd", pb: 1 }}>
          Contact
        </Typography>
        <Grid container spacing={2}>
          {/*
            EMAIL FIELD - Shows Zod validation in action
            The .email() validator in our schema provides automatic
            error messages when the format is invalid.
          */}
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
                  // Error message comes from Zod: "Invalid email format"
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
                  InputLabelProps={{ shrink: true }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
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

        {/* Modified Fields and Submit */}
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
            {/*
              SUBMIT BUTTON
              - type="submit" triggers form submission
              - isSubmitting is automatically managed by RHF during async onSubmit
              - No need for manual setSubmitting(true/false)!
            */}
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
