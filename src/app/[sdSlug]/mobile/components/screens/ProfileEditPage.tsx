"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Icon,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

type FieldKey = "first" | "last" | "email" | "mobilePhone" | "address1" | "city" | "state" | "zip" | "photo";

const fieldLabels: Record<FieldKey, string> = {
  first: "First Name",
  last: "Last Name",
  email: "Email",
  mobilePhone: "Phone",
  address1: "Street",
  city: "City",
  state: "State",
  zip: "Zip",
  photo: "Photo",
};

const getFieldValue = (p: PersonInterface | null, key: FieldKey): string => {
  if (!p) return "";
  if (key === "first" || key === "last") return (p.name as any)?.[key] || "";
  if (key === "photo") return p.photo || "";
  return (p.contactInfo as any)?.[key] || "";
};

const emptyPerson: PersonInterface = {
  name: { first: "", middle: "", last: "", display: "" },
  contactInfo: {
    email: "",
    mobilePhone: "",
    homePhone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  },
} as PersonInterface;

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export const ProfileEditPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const [person, setPerson] = useState<PersonInterface | null>(null);
  const [initial, setInitial] = useState<PersonInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "info" }>({
    open: false,
    msg: "",
    severity: "success",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const personId = UserHelper.currentUserChurch?.person?.id;
    if (!personId) {
      setLoading(false);
      setPerson({ ...emptyPerson });
      setInitial({ ...emptyPerson });
      return;
    }
    ApiHelper.get("/people/" + personId, "MembershipApi")
      .then((data: PersonInterface) => {
        if (cancelled) return;
        const merged: PersonInterface = {
          ...emptyPerson,
          ...data,
          name: { ...emptyPerson.name, ...(data?.name || {}) },
          contactInfo: { ...emptyPerson.contactInfo, ...(data?.contactInfo || {}) },
        };
        setPerson(merged);
        setInitial(JSON.parse(JSON.stringify(merged)));
      })
      .catch(() => {
        if (cancelled) return;
        setPerson({ ...emptyPerson });
        setInitial({ ...emptyPerson });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNameChange = (key: "first" | "last") => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!person) return;
    setPerson({ ...person, name: { ...person.name, [key]: e.target.value } });
  };

  const handleContactChange = (key: keyof NonNullable<PersonInterface["contactInfo"]>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!person) return;
      setPerson({
        ...person,
        contactInfo: { ...person.contactInfo, [key]: e.target.value },
      });
    };

  const handlePhotoClick = () => {
    setPhotoError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !person) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPerson((p) => (p ? { ...p, photo: typeof reader.result === "string" ? reader.result : p.photo } : p));
    };
    reader.readAsDataURL(file);
  };

  const changes = useMemo(() => {
    if (!person || !initial) return [];
    const keys: FieldKey[] = ["first", "last", "email", "mobilePhone", "address1", "city", "state", "zip", "photo"];
    return keys
      .filter((k) => getFieldValue(person, k) !== getFieldValue(initial, k))
      .map((k) => ({ field: k, label: fieldLabels[k], value: getFieldValue(person, k) }));
  }, [person, initial]);

  const handleSave = async () => {
    if (!person || !initial) return;
    if (changes.length === 0) {
      setSnack({ open: true, msg: "No changes to submit.", severity: "info" });
      return;
    }
    setSaving(true);
    try {
      const churchId = UserHelper.currentUserChurch?.church?.id || config?.church?.id;
      const personId = person.id || UserHelper.currentUserChurch?.person?.id;
      const displayName = [person.name?.first, person.name?.last].filter(Boolean).join(" ");

      const task: any = {
        dateCreated: new Date(),
        associatedWithType: "person",
        associatedWithId: personId,
        associatedWithLabel: displayName,
        createdByType: "person",
        createdById: personId,
        createdByLabel: displayName,
        title: `Profile changes for ${displayName || "member"}`,
        status: "Open",
        data: JSON.stringify(changes),
      };

      if (churchId) {
        try {
          const publicSettings = await ApiHelper.get(`/settings/public/${churchId}`, "MembershipApi");
          if (publicSettings?.directoryApprovalGroupId) {
            const group = await ApiHelper.get(`/groups/${publicSettings.directoryApprovalGroupId}`, "MembershipApi");
            task.assignedToType = "group";
            task.assignedToId = publicSettings.directoryApprovalGroupId;
            task.assignedToLabel = group?.name;
          }
        } catch {
          /* no approval group configured — task goes unassigned */
        }
      }

      await ApiHelper.post("/tasks?type=directoryUpdate", [task], "DoingApi");

      setInitial(JSON.parse(JSON.stringify(person)));
      setSnack({
        open: true,
        msg: "Your changes have been submitted for approval.",
        severity: "success",
      });
    } catch (err: any) {
      console.error("Profile save error", err);
      setSnack({ open: true, msg: err?.message || "Unable to submit changes.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": { borderRadius: `${mobileTheme.radius.md}px` },
  };

  const sectionHeader = (label: string) => (
    <Typography
      sx={{
        fontSize: 14,
        fontWeight: 600,
        color: tc.text,
        mb: `${mobileTheme.spacing.sm}px`,
        mt: `${mobileTheme.spacing.md}px`,
        textTransform: "uppercase",
        letterSpacing: "0.4px",
      }}
    >
      {label}
    </Typography>
  );

  if (loading) {
    return (
      <Box
        sx={{
          p: `${mobileTheme.spacing.md}px`,
          bgcolor: tc.background,
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: tc.primary }} />
      </Box>
    );
  }

  if (!person) return null;

  const displayInitial = (person.name?.first?.charAt(0) || "?").toUpperCase();
  const hasChanges = changes.length > 0;

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        Edit Profile
      </Typography>

      {/* Photo card */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Avatar
          src={person.photo || undefined}
          sx={{ width: 72, height: 72, bgcolor: tc.primaryLight, color: tc.primary, fontSize: 28, fontWeight: 700 }}
        >
          {displayInitial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
            {[person.name?.first, person.name?.last].filter(Boolean).join(" ") || "Your Photo"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: tc.textMuted, mt: "2px" }}>
            PNG or JPG, under 2 MB. Square images look best.
          </Typography>
          <Button
            variant="outlined"
            onClick={handlePhotoClick}
            startIcon={<Icon>photo_camera</Icon>}
            sx={{
              mt: `${mobileTheme.spacing.sm}px`,
              borderColor: tc.primary,
              color: tc.primary,
              textTransform: "none",
              borderRadius: `${mobileTheme.radius.md}px`,
            }}
          >
            Change Photo
          </Button>
          {photoError && (
            <Typography sx={{ fontSize: 12, color: tc.error, mt: "6px" }}>{photoError}</Typography>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
        </Box>
      </Box>

      {/* Contact section */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mt: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Contact")}
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm + 4}px` }}>
          <TextField label="First Name" value={person.name?.first || ""} onChange={handleNameChange("first")} variant="outlined" size="medium" fullWidth sx={inputSx} />
          <TextField label="Last Name" value={person.name?.last || ""} onChange={handleNameChange("last")} variant="outlined" size="medium" fullWidth sx={inputSx} />
          <TextField label="Email" type="email" value={person.contactInfo?.email || ""} onChange={handleContactChange("email")} variant="outlined" size="medium" fullWidth sx={inputSx} />
          <TextField label="Phone" type="tel" value={person.contactInfo?.mobilePhone || ""} onChange={handleContactChange("mobilePhone")} variant="outlined" size="medium" fullWidth sx={inputSx} />
        </Box>
      </Box>

      {/* Address section */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mt: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Address")}
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm + 4}px` }}>
          <TextField label="Street" value={person.contactInfo?.address1 || ""} onChange={handleContactChange("address1")} variant="outlined" size="medium" fullWidth sx={inputSx} />
          <TextField label="City" value={person.contactInfo?.city || ""} onChange={handleContactChange("city")} variant="outlined" size="medium" fullWidth sx={inputSx} />
          <Box sx={{ display: "flex", gap: `${mobileTheme.spacing.sm}px` }}>
            <TextField label="State" value={person.contactInfo?.state || ""} onChange={handleContactChange("state")} variant="outlined" size="medium" fullWidth sx={inputSx} />
            <TextField label="Zip" value={person.contactInfo?.zip || ""} onChange={handleContactChange("zip")} variant="outlined" size="medium" fullWidth sx={inputSx} />
          </Box>
        </Box>
      </Box>

      {hasChanges && (
        <Typography sx={{ fontSize: 13, color: tc.textMuted, mt: `${mobileTheme.spacing.md}px`, textAlign: "center" }}>
          {changes.length} change{changes.length === 1 ? "" : "s"} pending — submission requires approval.
        </Typography>
      )}

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving || !hasChanges}
        fullWidth
        sx={{
          mt: `${mobileTheme.spacing.sm}px`,
          mb: `${mobileTheme.spacing.md}px`,
          bgcolor: tc.primary,
          py: 1.25,
          borderRadius: `${mobileTheme.radius.md}px`,
          textTransform: "none",
          fontSize: 16,
          fontWeight: 600,
          boxShadow: mobileTheme.shadows.md,
          "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
          "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
        }}
      >
        {saving ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Submit Changes"}
      </Button>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
