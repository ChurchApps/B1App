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
   *
   * DIRTY FIELD BEHAVIOR:
   * RHF tracks dirty state by comparing current values to defaultValues.
   * This means if a user:
   *   1. Changes "John" → "Jane" (field becomes dirty)
   *   2. Changes "Jane" → "John" (field is NO LONGER dirty)
   *
   * The field is only dirty if its current value differs from defaultValues.
   * This is the default behavior - no extra configuration needed.
   *
   * When we call reset() with new values (e.g., when props.person changes),
   * those become the new defaultValues for comparison.
   */
  const {
    control,
    handleSubmit,
    formState: { isDirty, dirtyFields, isSubmitting },
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
  // GENERIC DIRTY FIELD UTILITIES
  // ---------------------------------------------------------------------------
  /**
   * FLATTEN DIRTY FIELDS - Generic recursive utility
   *
   * RHF's dirtyFields is a nested object mirroring the form structure:
   *   { name: { first: true, last: true }, contactInfo: { email: true } }
   *
   * This flattens it to dot-notation paths:
   *   ["name.first", "name.last", "contactInfo.email"]
   *
   * Benefits:
   * - Automatically handles any nesting depth
   * - No manual field-by-field checks needed
   * - Adding new fields to schema "just works"
   */
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

  /**
   * GET VALUE BY PATH - Generic dot-notation accessor
   *
   * Given an object and a path like "contactInfo.email",
   * returns the value at that path.
   *
   * This replaces the manual if/else chain for extracting values.
   */
  const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
    }, obj as unknown);
  };

  /**
   * BUILD CHANGES FROM DIRTY FIELDS
   *
   * Combines the utilities above to create the ProfileChange array.
   * Now adding a new field only requires:
   * 1. Add to Zod schema
   * 2. Add to fieldDefinitions (for label)
   * 3. Add Controller in JSX
   *
   * No changes needed to submission logic!
   */
  const buildChangesFromDirtyFields = (data: ProfileFormData): ProfileChange[] => {
    const dirtyPaths = flattenDirtyFields(dirtyFields);

    return dirtyPaths
      .map((path) => {
        const fieldDef = fieldDefinitions.find((f) => f.key === path);
        if (!fieldDef) return null;

        const value = getValueByPath(data as unknown as Record<string, unknown>, path);
        return {
          field: path,
          label: fieldDef.label,
          value: String(value ?? ""),
        };
      })
      .filter((change): change is ProfileChange => change !== null);
  };

  /**
   * Convert dirty field paths to human-readable labels for display.
   * Uses the generic flattener instead of manual checks.
   */
  const getModifiedFieldLabels = (): string[] => {
    const dirtyPaths = flattenDirtyFields(dirtyFields);

    const labels = dirtyPaths
      .map((path) => fieldDefinitions.find((f) => f.key === path)?.label)
      .filter((label): label is string => !!label);

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
    // Build changes using the generic utility - no manual field mapping!
    const changes = buildChangesFromDirtyFields(data);

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
                  // TODO: InputLabelProps is deprecated in MUI v7
                  // Replace with: slotProps={{ inputLabel: { shrink: true } }}
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
