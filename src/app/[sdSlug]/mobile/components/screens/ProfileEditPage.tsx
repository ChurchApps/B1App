"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Icon,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface, VisibilityPreferenceInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

type TabKey = "profile" | "household" | "account" | "visibility";
type VisibilityScope = "everyone" | "members" | "groups";

// Full field definitions matching B1Mobile authority (14 directory-updatable fields)
const fieldDefinitions: { key: string; label: string }[] = [
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

const emptyPerson: PersonInterface = {
  name: { first: "", middle: "", last: "", display: "" },
  contactInfo: {
    email: "",
    mobilePhone: "",
    homePhone: "",
    workPhone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  },
} as PersonInterface;

interface HouseholdMember extends PersonInterface {
  householdRole?: string;
}

interface PersonWithPrivacy extends PersonInterface {
  optedOut?: boolean;
}

// Read a field by dotted path (e.g. "contactInfo.address1")
const readField = (obj: any, key: string): string => {
  if (!obj) return "";
  const parts = key.split(".");
  let v: any = obj;
  for (const p of parts) v = v?.[p];
  if (key === "birthDate" && v) {
    try {
      return new Date(v).toISOString().split("T")[0];
    } catch {
      return "";
    }
  }
  return v == null ? "" : String(v);
};

// Write a field by dotted path, returning a new object
const writeField = (obj: any, key: string, value: string): any => {
  const next = JSON.parse(JSON.stringify(obj || {}));
  const parts = key.split(".");
  let tgt: any = next;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!tgt[parts[i]]) tgt[parts[i]] = {};
    tgt = tgt[parts[i]];
  }
  tgt[parts[parts.length - 1]] = value;
  return next;
};

// Resize an image File to fit within 4:3 at 300px tall, output JPEG quality 0.8 as data URL
const resizePhotoToDataUrl = async (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Unable to read image file."));
  reader.onload = () => {
    const src = typeof reader.result === "string" ? reader.result : "";
    if (!src) { reject(new Error("Unable to read image file.")); return; }
    const img = new Image();
    img.onerror = () => reject(new Error("Unable to decode image."));
    img.onload = () => {
      const targetH = 300;
      const targetW = Math.round((targetH * 4) / 3); // 400x300 (4:3)
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not available.")); return; }
      // Center-crop to 4:3 aspect then draw at targetW x targetH
      const srcAspect = img.width / img.height;
      const dstAspect = targetW / targetH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcAspect > dstAspect) {
        // source is wider; crop horizontally
        sw = Math.round(img.height * dstAspect);
        sx = Math.round((img.width - sw) / 2);
      } else if (srcAspect < dstAspect) {
        // source is taller; crop vertically
        sh = Math.round(img.width / dstAspect);
        sy = Math.round((img.height - sh) / 2);
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
});

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export const ProfileEditPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const personId = UserHelper.currentUserChurch?.person?.id;

  const [tab, setTab] = useState<TabKey>("profile");
  const [person, setPerson] = useState<PersonWithPrivacy | null>(null);
  const [initial, setInitial] = useState<PersonWithPrivacy | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [pendingFamilyMembers, setPendingFamilyMembers] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "info" }>({
    open: false,
    msg: "",
    severity: "success",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Account tab state
  const accountUser = UserHelper.user;
  const [acctFirstName, setAcctFirstName] = useState<string>(accountUser?.firstName || "");
  const [acctLastName, setAcctLastName] = useState<string>(accountUser?.lastName || "");
  const [acctNameError, setAcctNameError] = useState<string | null>(null);
  const [savingAcctName, setSavingAcctName] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Visibility state
  const [addressVis, setAddressVis] = useState<VisibilityScope>("members");
  const [phoneVis, setPhoneVis] = useState<VisibilityScope>("members");
  const [emailVis, setEmailVis] = useState<VisibilityScope>("members");
  const [initialVis, setInitialVis] = useState<{ address: VisibilityScope; phone: VisibilityScope; email: VisibilityScope } | null>(null);

  const { data: serverPerson, isLoading: personLoading } = useQuery<PersonWithPrivacy>({
    queryKey: ["person", personId],
    queryFn: () => ApiHelper.get("/people/" + personId, "MembershipApi"),
    enabled: !!personId,
  });

  const householdId = serverPerson?.householdId;

  const { data: household = null } = useQuery<HouseholdMember[]>({
    queryKey: ["household", householdId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/people/household/${householdId}`, "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!householdId,
  });

  const { data: visibilityPrefs } = useQuery<VisibilityPreferenceInterface>({
    queryKey: ["visibilityPreferences", "my"],
    queryFn: () => ApiHelper.get("/visibilityPreferences/my", "MembershipApi"),
    enabled: !!personId,
  });

  useEffect(() => {
    if (!personId) {
      setPerson({ ...emptyPerson });
      setInitial({ ...emptyPerson });
      return;
    }
    if (!serverPerson) return;
    const merged: PersonWithPrivacy = {
      ...emptyPerson,
      ...serverPerson,
      name: { ...emptyPerson.name, ...(serverPerson.name || {}) },
      contactInfo: { ...emptyPerson.contactInfo, ...(serverPerson.contactInfo || {}) },
    };
    setPerson(merged);
    setInitial(JSON.parse(JSON.stringify(merged)));
    setModifiedFields(new Set());
  }, [personId, serverPerson]);

  useEffect(() => {
    if (!visibilityPrefs) return;
    const a = (visibilityPrefs.address as VisibilityScope) || "members";
    const p = (visibilityPrefs.phoneNumber as VisibilityScope) || "members";
    const e = (visibilityPrefs.email as VisibilityScope) || "members";
    setAddressVis(a);
    setPhoneVis(p);
    setEmailVis(e);
    setInitialVis({ address: a, phone: p, email: e });
  }, [visibilityPrefs]);

  const loading = personLoading && !person;

  const setField = useCallback((key: string, value: string) => {
    setPerson((prev) => (prev ? writeField(prev, key, value) : prev));
    setModifiedFields((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const isModified = useCallback((key: string) => modifiedFields.has(key), [modifiedFields]);

  const handlePhotoClick = () => {
    setPhotoError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !person) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }
    try {
      const dataUrl = await resizePhotoToDataUrl(file);
      setPerson((p) => (p ? { ...p, photo: dataUrl } : p));
      setModifiedFields((prev) => {
        const next = new Set(prev);
        next.add("photo");
        return next;
      });
    } catch (err: any) {
      setPhotoError(err?.message || "Could not process image.");
    }
  };

  const profileChanges = useMemo(() => {
    if (!person) return [];
    const changes: { field: string; label: string; value: string }[] = [];
    modifiedFields.forEach((key) => {
      const def = fieldDefinitions.find((f) => f.key === key);
      if (!def) return;
      const value = key === "photo" ? person.photo || "" : readField(person, key);
      changes.push({ field: key, label: def.label, value });
    });
    pendingFamilyMembers.forEach((name) => {
      changes.push({ field: "familyMember", label: "Add Family Member", value: name });
    });
    return changes;
  }, [person, modifiedFields, pendingFamilyMembers]);

  const hasChanges = profileChanges.length > 0;

  const handleSave = async () => {
    if (!person || !initial) return;
    if (profileChanges.length === 0) {
      setSnack({ open: true, msg: "No changes to submit.", severity: "info" });
      return;
    }
    setSaving(true);
    try {
      const churchId = UserHelper.currentUserChurch?.church?.id || config?.church?.id;
      const id = person.id || UserHelper.currentUserChurch?.person?.id;
      const displayName = [person.name?.first, person.name?.last].filter(Boolean).join(" ");

      const task: any = {
        dateCreated: new Date(),
        associatedWithType: "person",
        associatedWithId: id,
        associatedWithLabel: displayName,
        createdByType: "person",
        createdById: id,
        createdByLabel: displayName,
        title: `Profile changes for ${displayName || "member"}`,
        status: "Open",
        data: JSON.stringify(profileChanges),
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
          /* no approval group configured */
        }
      }

      await ApiHelper.post("/tasks?type=directoryUpdate", [task], "DoingApi");

      setInitial(JSON.parse(JSON.stringify(person)));
      setModifiedFields(new Set());
      setPendingFamilyMembers([]);
      setSnack({ open: true, msg: "Your changes have been submitted for approval.", severity: "success" });
      // Redirect back on success (mirror B1Mobile router.back())
      setTimeout(() => {
        try { router.back(); } catch { /* noop */ }
      }, 900);
    } catch (err: any) {
      console.error("Profile save error", err);
      setSnack({ open: true, msg: err?.message || "Unable to submit changes.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!hasChanges) return;
    if (!window.confirm("Discard your pending changes?")) return;
    if (initial) setPerson(JSON.parse(JSON.stringify(initial)));
    setModifiedFields(new Set());
    setPendingFamilyMembers([]);
  };

  const handleAddFamilyMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    setPendingFamilyMembers((prev) => [...prev, trimmed]);
    setNewMemberName("");
  };

  const handleRemoveFamilyMember = (index: number) => {
    setPendingFamilyMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // Visibility tab tracks optedOut locally; saved together with the dropdowns
  // in handleSaveVisibility (matching B1Mobile's combined Save button).
  const [optedOutLocal, setOptedOutLocal] = useState<boolean>(false);
  const [initialOptedOut, setInitialOptedOut] = useState<boolean>(false);
  useEffect(() => {
    if (person) {
      setOptedOutLocal(!!person.optedOut);
      setInitialOptedOut(!!person.optedOut);
    }
  }, [person?.optedOut]); // eslint-disable-line react-hooks/exhaustive-deps

  // Account tab handlers
  const handleSaveDisplayName = async () => {
    setAcctNameError(null);
    if (!acctFirstName.trim() || !acctLastName.trim()) {
      setAcctNameError("First and last name are required.");
      return;
    }
    setSavingAcctName(true);
    try {
      await ApiHelper.post(
        "/users/setDisplayName",
        { firstName: acctFirstName.trim(), lastName: acctLastName.trim() },
        "MembershipApi"
      );
      if (UserHelper.user) {
        UserHelper.user.firstName = acctFirstName.trim();
        UserHelper.user.lastName = acctLastName.trim();
      }
      setSnack({ open: true, msg: "Display name updated.", severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || "Could not update display name.", severity: "error" });
    } finally {
      setSavingAcctName(false);
    }
  };

  const handleSaveEmail = async () => {
    setEmailError(null);
    const trimmed = newEmail.trim();
    if (!trimmed) { setEmailError("Enter a new email address."); return; }
    if (!emailRegex.test(trimmed)) { setEmailError("Please enter a valid email address."); return; }
    setSavingEmail(true);
    try {
      const resp: any = await ApiHelper.post("/users/updateEmail", { email: trimmed }, "MembershipApi");
      if (UserHelper.user) UserHelper.user.email = trimmed;
      // Note: web cannot rotate JWT via native SecureStorage. If the response
      // includes a JWT it would need to be handled by an app-level auth flow.
      if (resp?.jwt && UserHelper.currentUserChurch) {
        try { UserHelper.currentUserChurch.jwt = resp.jwt; } catch { /* noop */ }
      }
      setNewEmail("");
      setSnack({ open: true, msg: "Email updated.", severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || "Could not update email.", severity: "error" });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError(null);
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await ApiHelper.post("/users/updatePassword", { newPassword }, "MembershipApi");
      setNewPassword("");
      setConfirmPassword("");
      setSnack({ open: true, msg: "Password updated.", severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || "Could not update password.", severity: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  const prefsChanged = initialVis
    ? addressVis !== initialVis.address || phoneVis !== initialVis.phone || emailVis !== initialVis.email
    : false;
  const optedOutChanged = optedOutLocal !== initialOptedOut;
  const visChanged = prefsChanged || optedOutChanged;

  const handleSaveVisibility = async () => {
    setSavingPrivacy(true);
    try {
      const tasks: Promise<any>[] = [];
      if (prefsChanged) {
        const payload: VisibilityPreferenceInterface = {
          ...(visibilityPrefs || {}),
          address: addressVis,
          phoneNumber: phoneVis,
          email: emailVis,
        };
        tasks.push(ApiHelper.post("/visibilityPreferences", [payload], "MembershipApi"));
      }
      if (optedOutChanged && person?.id) {
        tasks.push(
          ApiHelper.post(
            "/users/updateOptedOut",
            { personId: person.id, optedOut: optedOutLocal },
            "MembershipApi"
          )
        );
      }
      await Promise.all(tasks);
      if (prefsChanged) setInitialVis({ address: addressVis, phone: phoneVis, email: emailVis });
      if (optedOutChanged) {
        setInitialOptedOut(optedOutLocal);
        setPerson((p) => (p ? { ...p, optedOut: optedOutLocal } : p));
      }
      setSnack({ open: true, msg: "Visibility preferences saved.", severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || "Could not save visibility preferences.", severity: "error" });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: `${mobileTheme.radius.md}px` } };

  const modifiedOutlineSx = (key: string) => (
    isModified(key)
      ? {
        "& .MuiOutlinedInput-notchedOutline": { borderColor: tc.warning, borderWidth: 2 },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: tc.warning },
      }
      : {}
  );

  const modifiedDot = (key: string) => isModified(key) ? (
    <Box
      sx={{
        width: 8,
        height: 8,
        bgcolor: tc.warning,
        borderRadius: "50%",
        position: "absolute",
        top: 10,
        right: 12,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  ) : null;

  const sectionHeader = (label: string, icon?: string) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.sm}px`,
        borderBottom: `1px solid ${tc.border}`,
        pb: 1,
        mb: 2,
      }}
    >
      {icon && <Icon sx={{ color: tc.primary, fontSize: 24 }}>{icon}</Icon>}
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
        {label}
      </Typography>
    </Box>
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

  const renderField = (
    key: string,
    label: string,
    opts?: { type?: string; inputMode?: "text" | "tel" | "email" | "numeric" | "url" | "search"; autoComplete?: string }
  ) => (
    <Box sx={{ position: "relative" }}>
      <TextField
        label={label}
        value={readField(person, key)}
        onChange={(e) => setField(key, e.target.value)}
        type={opts?.type || "text"}
        inputProps={{ inputMode: opts?.inputMode, autoComplete: opts?.autoComplete }}
        variant="outlined"
        size="medium"
        fullWidth
        sx={{ ...inputSx, ...modifiedOutlineSx(key) }}
        InputLabelProps={opts?.type === "date" ? { shrink: true } : undefined}
      />
      {modifiedDot(key)}
    </Box>
  );

  const renderProfileTab = () => (
    <>
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
          ...(isModified("photo") ? { outline: `2px solid ${tc.warning}` } : {}),
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
            PNG or JPG. Images are cropped to 4:3 and resized automatically.
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

      {/* Name section */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mt: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Name")}
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm + 4}px` }}>
          {renderField("name.first", "First Name", { autoComplete: "given-name" })}
          {renderField("name.middle", "Middle Name", { autoComplete: "additional-name" })}
          {renderField("name.last", "Last Name", { autoComplete: "family-name" })}
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
          {renderField("contactInfo.email", "Email", { type: "email", inputMode: "email", autoComplete: "email" })}
          {renderField("birthDate", "Birth Date", { type: "date" })}
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
          {renderField("contactInfo.address1", "Address Line 1", { autoComplete: "address-line1" })}
          {renderField("contactInfo.address2", "Address Line 2", { autoComplete: "address-line2" })}
          {renderField("contactInfo.city", "City", { autoComplete: "address-level2" })}
          <Box sx={{ display: "flex", gap: `${mobileTheme.spacing.sm}px` }}>
            <Box sx={{ flex: 1 }}>{renderField("contactInfo.state", "State", { autoComplete: "address-level1" })}</Box>
            <Box sx={{ flex: 1 }}>{renderField("contactInfo.zip", "Zip", { inputMode: "numeric", autoComplete: "postal-code" })}</Box>
          </Box>
        </Box>
      </Box>

      {/* Phone section */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mt: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Phone")}
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm + 4}px` }}>
          {renderField("contactInfo.mobilePhone", "Mobile Phone", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
          {renderField("contactInfo.homePhone", "Home Phone", { type: "tel", inputMode: "tel" })}
          {renderField("contactInfo.workPhone", "Work Phone", { type: "tel", inputMode: "tel" })}
        </Box>
      </Box>

      {/* spacer so the sticky footer doesn't cover content */}
      <Box sx={{ height: 24 }} />
    </>
  );

  const renderHouseholdTab = () => (
    <>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Current Household", "people")}
        {household === null && <CircularProgress sx={{ color: tc.primary }} size={24} />}
        {household !== null && household.filter((h) => h.id !== person.id).length === 0 && (
          <Typography sx={{ fontSize: 14, color: tc.textMuted, fontStyle: "italic", textAlign: "center", py: 2 }}>
            No other members in your household.
          </Typography>
        )}
        {household !== null &&
          household
            .filter((h) => h.id !== person.id)
            .map((h) => (
              <Box
                key={h.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/mobile/community/${h.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/mobile/community/${h.id}`);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${mobileTheme.spacing.md}px`,
                  py: 1,
                  borderRadius: `${mobileTheme.radius.md}px`,
                  cursor: "pointer",
                  "&:hover": { bgcolor: tc.iconBackground },
                }}
              >
                <Avatar
                  src={h.photo || undefined}
                  sx={{ width: 48, height: 48, bgcolor: tc.primaryLight, color: tc.primary, fontSize: 16, fontWeight: 700 }}
                >
                  {(h.name?.first?.charAt(0) || "?").toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>
                    {h.name?.display || "Unknown"}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: tc.textSecondary }}>
                    {h.householdRole || "Household Member"}
                  </Typography>
                </Box>
                <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
              </Box>
            ))}
      </Box>

      {/* Add family member card */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mt: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Add Family Member", "person_add")}
        <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 2 }}>
          New members will be reviewed along with your other profile changes.
        </Typography>
        <Box sx={{ display: "flex", gap: `${mobileTheme.spacing.sm}px`, alignItems: "flex-start" }}>
          <TextField
            label="First Name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddFamilyMember(); } }}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <Button
            variant="contained"
            onClick={handleAddFamilyMember}
            disabled={!newMemberName.trim()}
            sx={{
              bgcolor: tc.primary,
              borderRadius: `${mobileTheme.radius.md}px`,
              textTransform: "none",
              px: 3,
              py: 1.6,
              "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
              "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
            }}
          >
            Add
          </Button>
        </Box>

        {pendingFamilyMembers.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${tc.warning}44` }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text, mb: 1.5 }}>
              Pending Family Members
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {pendingFamilyMembers.map((name, idx) => (
                <Box
                  key={`${name}-${idx}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: `${tc.warning}22`,
                    borderRadius: `${mobileTheme.radius.md}px`,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Icon sx={{ color: tc.warning, fontSize: 20 }}>person_outline</Icon>
                  <Typography sx={{ flex: 1, fontSize: 14, color: tc.text }}>{name}</Typography>
                  <IconButton size="small" onClick={() => handleRemoveFamilyMember(idx)} aria-label="Remove">
                    <Icon sx={{ color: tc.error, fontSize: 20 }}>close</Icon>
                  </IconButton>
                </Box>
              ))}
            </Box>
            <Typography sx={{ fontSize: 12, color: tc.textMuted, mt: 1, fontStyle: "italic" }}>
              These will be submitted with your profile changes for approval.
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ height: 24 }} />
    </>
  );

  const renderAccountTab = () => (
    <>
      {/* Display Name */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Display Name", "person")}
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm + 4}px` }}>
          <TextField
            label="First Name"
            value={acctFirstName}
            onChange={(e) => { setAcctFirstName(e.target.value); setAcctNameError(null); }}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <TextField
            label="Last Name"
            value={acctLastName}
            onChange={(e) => { setAcctLastName(e.target.value); setAcctNameError(null); }}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          {acctNameError && (
            <Typography sx={{ fontSize: 12, color: tc.error }}>{acctNameError}</Typography>
          )}
          {(acctFirstName !== (accountUser?.firstName || "") || acctLastName !== (accountUser?.lastName || "")) && (
            <Button
              variant="contained"
              onClick={handleSaveDisplayName}
              disabled={savingAcctName}
              sx={{
                bgcolor: tc.primary,
                borderRadius: `${mobileTheme.radius.md}px`,
                textTransform: "none",
                py: 1.1,
                "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
                "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
              }}
            >
              {savingAcctName ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Save"}
            </Button>
          )}
        </Box>
      </Box>

      {/* Email */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mt: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Change Email", "email")}
        <Typography sx={{ fontSize: 13, color: tc.textMuted, mb: 2 }}>
          Email: {accountUser?.email || "—"}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm + 4}px` }}>
          <TextField
            label="New Email"
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setEmailError(null); }}
            type="email"
            inputProps={{ inputMode: "email", autoComplete: "email" }}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          {emailError && (
            <Typography sx={{ fontSize: 12, color: tc.error }}>{emailError}</Typography>
          )}
          <Button
            variant="contained"
            onClick={handleSaveEmail}
            disabled={savingEmail || !newEmail.trim()}
            sx={{
              bgcolor: tc.primary,
              borderRadius: `${mobileTheme.radius.md}px`,
              textTransform: "none",
              py: 1.1,
              "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
              "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
            }}
          >
            {savingEmail ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Save"}
          </Button>
        </Box>
      </Box>

      {/* Password */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mt: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Change Password", "lock")}
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm + 4}px` }}>
          <TextField
            label="New Password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
            type="password"
            inputProps={{ autoComplete: "new-password" }}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <TextField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
            type="password"
            inputProps={{ autoComplete: "new-password" }}
            variant="outlined"
            size="medium"
            fullWidth
            sx={inputSx}
          />
          <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
            Password must be at least 8 characters.
          </Typography>
          {passwordError && (
            <Typography sx={{ fontSize: 12, color: tc.error }}>{passwordError}</Typography>
          )}
          <Button
            variant="contained"
            onClick={handleSavePassword}
            disabled={savingPassword || !newPassword || !confirmPassword}
            sx={{
              bgcolor: tc.primary,
              borderRadius: `${mobileTheme.radius.md}px`,
              textTransform: "none",
              py: 1.1,
              "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
              "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
            }}
          >
            {savingPassword ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Save"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 24 }} />
    </>
  );

  const renderVisDropdown = (
    label: string,
    value: VisibilityScope,
    onChange: (v: VisibilityScope) => void,
    id: string,
  ) => (
    <FormControl fullWidth sx={{ mt: 1 }}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        label={label}
        value={value}
        onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value as VisibilityScope)}
        sx={{ borderRadius: `${mobileTheme.radius.md}px` }}
      >
        <MenuItem value="everyone">Everyone</MenuItem>
        <MenuItem value="members">Members Only</MenuItem>
        <MenuItem value="groups">My Groups Only</MenuItem>
      </Select>
    </FormControl>
  );

  const renderPrivacyTab = () => (
    <>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        {sectionHeader("Visibility Preferences", "visibility")}
        <Typography sx={{ fontSize: 13, color: tc.textMuted, mb: 2 }}>
          Choose who can see each type of contact information.
        </Typography>

        {/* Hide from Directory row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
            borderBottom: `1px solid ${tc.border}`,
            mb: 2,
          }}
        >
          <Typography sx={{ flex: 1, fontSize: 14, color: tc.text }}>
            Hide me from the member directory
          </Typography>
          <Switch
            checked={optedOutLocal}
            onChange={(e) => setOptedOutLocal(e.target.checked)}
          />
        </Box>

        {renderVisDropdown("Address Visibility", addressVis, setAddressVis, "vis-address")}
        {renderVisDropdown("Phone Visibility", phoneVis, setPhoneVis, "vis-phone")}
        {renderVisDropdown("Email Visibility", emailVis, setEmailVis, "vis-email")}

        {visChanged && (
          <Button
            variant="contained"
            onClick={handleSaveVisibility}
            disabled={savingPrivacy}
            fullWidth
            sx={{
              mt: 2,
              bgcolor: tc.primary,
              borderRadius: `${mobileTheme.radius.md}px`,
              textTransform: "none",
              py: 1.1,
              "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
              "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
            }}
          >
            {savingPrivacy ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Save"}
          </Button>
        )}
      </Box>

      {/* Info card */}
      <Box
        sx={{
          bgcolor: tc.iconBackground,
          borderRadius: `${mobileTheme.radius.lg}px`,
          p: `${mobileTheme.spacing.md}px`,
          mt: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Icon sx={{ color: tc.primary, fontSize: 20 }}>info</Icon>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: tc.primary }}>
            Visibility Levels
          </Typography>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tc.text }}>Everyone</Typography>
          <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
            Visible to anyone who can view the directory.
          </Typography>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tc.text }}>Members Only</Typography>
          <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
            Visible to other signed-in church members.
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tc.text }}>My Groups Only</Typography>
          <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
            Visible only to members of groups you belong to.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: 24 }} />
    </>
  );

  // Match B1Mobile's `PendingChangesView`: shown in-flow on profile/household tabs
  // (not account or visibility).
  const showPendingChanges = hasChanges && tab !== "visibility" && tab !== "account";

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          overflow: "hidden",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 52,
            "& .MuiTabs-indicator": { backgroundColor: tc.primary, height: 2 },
            "& .MuiTab-root": {
              minHeight: 52,
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              color: tc.textSecondary,
            },
            "& .Mui-selected": { color: `${tc.primary} !important`, fontWeight: 700 },
          }}
        >
          <Tab
            value="profile"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                Profile
                {hasChanges && (
                  <Box sx={{ width: 8, height: 8, bgcolor: tc.warning, borderRadius: "50%" }} aria-hidden />
                )}
              </Box>
            }
          />
          <Tab value="household" label="Household" />
          <Tab value="account" label="Account" />
          <Tab value="visibility" label="Privacy" />
        </Tabs>
      </Box>

      {tab === "profile" && renderProfileTab()}
      {tab === "household" && renderHouseholdTab()}
      {tab === "account" && renderAccountTab()}
      {tab === "visibility" && renderPrivacyTab()}

      {/* Pending changes card (mirrors B1Mobile PendingChangesView) */}
      {showPendingChanges && (
        <Box
          sx={{
            bgcolor: `${tc.warning}22`,
            border: `1px solid ${tc.warning}`,
            borderRadius: `${mobileTheme.radius.lg}px`,
            p: `${mobileTheme.spacing.md}px`,
            mt: `${mobileTheme.spacing.md}px`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Icon sx={{ color: tc.warning, fontSize: 24 }}>pending_actions</Icon>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
              Pending Changes
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 2 }}>
            Review your changes before submitting for approval.
          </Typography>
          <Box sx={{ maxHeight: 240, overflowY: "auto", mb: 2 }}>
            {profileChanges.map((c, i) => (
              <Box
                key={`${c.field}-${i}`}
                sx={{ py: 1, borderBottom: `1px solid ${tc.warning}33` }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: tc.text, mb: 0.5 }}>
                  {c.label}
                </Typography>
                {c.field === "photo" && c.value.startsWith("data:") ? (
                  <Box
                    component="img"
                    src={c.value}
                    alt="Pending photo"
                    sx={{ width: 60, height: 45, borderRadius: `${mobileTheme.radius.sm}px`, objectFit: "cover" }}
                  />
                ) : (
                  <Typography sx={{ fontSize: 14, color: tc.text, wordBreak: "break-word" }}>
                    {c.value || "(empty)"}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving}
              sx={{
                flex: 1,
                borderColor: tc.textMuted,
                color: tc.text,
                textTransform: "none",
                borderRadius: `${mobileTheme.radius.md}px`,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                flex: 2,
                bgcolor: tc.primary,
                borderRadius: `${mobileTheme.radius.md}px`,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { bgcolor: tc.primary, opacity: 0.92 },
                "&.Mui-disabled": { bgcolor: tc.border, color: tc.textHint },
              }}
            >
              {saving ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Submit for Approval"}
            </Button>
          </Box>
        </Box>
      )}

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
