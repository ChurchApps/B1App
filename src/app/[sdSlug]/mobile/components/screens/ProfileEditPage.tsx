"use client";

import React, { useEffect, useRef, useState } from "react";
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

export const ProfileEditPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const [person, setPerson] = useState<PersonInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({
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
      return;
    }
    ApiHelper.get("/people/" + personId, "MembershipApi")
      .then((data: PersonInterface) => {
        if (cancelled) return;
        setPerson({
          ...emptyPerson,
          ...data,
          name: { ...emptyPerson.name, ...(data?.name || {}) },
          contactInfo: { ...emptyPerson.contactInfo, ...(data?.contactInfo || {}) },
        });
      })
      .catch(() => {
        if (!cancelled) setPerson({ ...emptyPerson });
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
    // TODO: upload wiring incomplete — this stub opens a file picker but does not yet upload to server.
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !person) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPerson({ ...person, photo: typeof reader.result === "string" ? reader.result : person.photo });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!person) return;
    setSaving(true);
    try {
      // Canonical person save — same as B1Admin / B1App admin pages.
      await ApiHelper.post("/people", [person], "MembershipApi");
      setSnack({ open: true, msg: "Profile saved.", severity: "success" });
    } catch (err: any) {
      console.error("Profile save error", err);
      setSnack({ open: true, msg: err?.message || "Unable to save profile.", severity: "error" });
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
            PNG or JPG, square images look best.
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
          <TextField
            label="First Name"
            value={person.name?.first || ""}
            onChange={handleNameChange("first")}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <TextField
            label="Last Name"
            value={person.name?.last || ""}
            onChange={handleNameChange("last")}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <TextField
            label="Email"
            type="email"
            value={person.contactInfo?.email || ""}
            onChange={handleContactChange("email")}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <TextField
            label="Phone"
            type="tel"
            value={person.contactInfo?.mobilePhone || ""}
            onChange={handleContactChange("mobilePhone")}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
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
          <TextField
            label="Street"
            value={person.contactInfo?.address1 || ""}
            onChange={handleContactChange("address1")}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <TextField
            label="City"
            value={person.contactInfo?.city || ""}
            onChange={handleContactChange("city")}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <Box sx={{ display: "flex", gap: `${mobileTheme.spacing.sm}px` }}>
            <TextField
              label="State"
              value={person.contactInfo?.state || ""}
              onChange={handleContactChange("state")}
              variant="outlined"
              size="medium"
              fullWidth
              sx={inputSx}
            />
            <TextField
              label="Zip"
              value={person.contactInfo?.zip || ""}
              onChange={handleContactChange("zip")}
              variant="outlined"
              size="medium"
              fullWidth
              sx={inputSx}
            />
          </Box>
        </Box>
      </Box>

      {/* Save button */}
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving}
        fullWidth
        sx={{
          mt: `${mobileTheme.spacing.lg}px`,
          mb: `${mobileTheme.spacing.md}px`,
          bgcolor: tc.primary,
          py: 1.25,
          borderRadius: `${mobileTheme.radius.md}px`,
          textTransform: "none",
          fontSize: 16,
          fontWeight: 600,
          boxShadow: mobileTheme.shadows.md,
          "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
        }}
      >
        {saving ? <CircularProgress size={22} sx={{ color: "#FFF" }} /> : "Save Changes"}
      </Button>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack({ ...snack, open: false })}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
