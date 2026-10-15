"use client";

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { ApiHelper, Locale, PersonHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PersonInterface, VisibilityPreferenceInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { Eyebrow, KeyValues, PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, Sheet, StatusBadge, TextLink } from "../kit";

interface Props {
  config?: ConfigurationInterface;
}

type SheetKey = "name" | "contact" | "household" | "account" | "privacy";
type VisibilityScope = "everyone" | "members" | "groups" | "leaders" | "staff";

const scopeLabelKeys: Record<VisibilityScope, string> = {
  everyone: "mobile.screens.everyone",
  members: "mobile.screens.membersOnly",
  groups: "mobile.screens.myGroupsOnly",
  leaders: "mobile.screens.leadersOnly",
  staff: "mobile.screens.staffOnly"
};

const scopeDescKeys: Record<VisibilityScope, string> = {
  everyone: "mobile.profileEdit.everyoneDesc",
  members: "mobile.profileEdit.membersDesc",
  groups: "mobile.profileEdit.groupsDesc",
  leaders: "mobile.profileEdit.leadersDesc",
  staff: "mobile.profileEdit.staffDesc"
};

// PersonHelper only recognizes PNG data URLs; the cropper produces JPEG.
const photoSrc = (p: PersonInterface) => (p.photo ? (p.photo.startsWith("data:") ? p.photo : PersonHelper.getPhotoUrl(p)) : undefined);

const fieldLabelKeys: Record<string, string> = {
  "name.first": "person.firstName",
  "name.middle": "mobile.profileEdit.middleName",
  "name.last": "person.lastName",
  photo: "mobile.profileEdit.photo",
  birthDate: "mobile.profileEdit.birthDate",
  "contactInfo.email": "person.email",
  "contactInfo.address1": "mobile.profileEdit.address1",
  "contactInfo.address2": "mobile.profileEdit.address2",
  "contactInfo.city": "mobile.profileEdit.city",
  "contactInfo.state": "mobile.profileEdit.state",
  "contactInfo.zip": "mobile.profileEdit.zip",
  "contactInfo.homePhone": "mobile.profileEdit.homePhone",
  "contactInfo.mobilePhone": "mobile.details.mobilePhone",
  "contactInfo.workPhone": "mobile.profileEdit.workPhone"
};

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
    zip: ""
  }
} as PersonInterface;

interface HouseholdMember extends PersonInterface {
  householdRole?: string;
}

interface PersonWithPrivacy extends PersonInterface {
  optedOut?: boolean;
}

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

const writeField = (obj: any, key: string, value: string): any => {
  const parts = key.split(".");
  const clone = (src: any, depth: number): any => {
    const copy = { ...(src || {}) };
    if (depth === parts.length - 1) {
      copy[parts[depth]] = value;
    } else {
      copy[parts[depth]] = clone(src?.[parts[depth]], depth + 1);
    }
    return copy;
  };
  return clone(obj, 0);
};

const resizePhotoToDataUrl = async (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error(Locale.label("mobile.profileEdit.unableToReadImage")));
  reader.onload = () => {
    const src = typeof reader.result === "string" ? reader.result : "";
    if (!src) { reject(new Error(Locale.label("mobile.profileEdit.unableToReadImage"))); return; }
    const img = new Image();
    img.onerror = () => reject(new Error(Locale.label("mobile.profileEdit.unableToDecodeImage")));
    img.onload = () => {
      const targetH = 300;
      const targetW = Math.round((targetH * 4) / 3);
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error(Locale.label("mobile.profileEdit.canvasNotAvailable"))); return; }

      const srcAspect = img.width / img.height;
      const dstAspect = targetW / targetH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcAspect > dstAspect) {

        sw = Math.round(img.height * dstAspect);
        sx = Math.round((img.width - sw) / 2);
      } else if (srcAspect < dstAspect) {

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ProfileEditPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = useContext(UserContext);
  const queryClient = useQueryClient();
  const personId = UserHelper.currentUserChurch?.person?.id;

  const [sheet, setSheet] = useState<SheetKey | null>(null);
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
    severity: "success"
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const accountUser = UserHelper.user;
  const [acctFirstName, setAcctFirstName] = useState<string>(accountUser?.firstName || "");
  const [acctLastName, setAcctLastName] = useState<string>(accountUser?.lastName || "");
  const [acctNameError, setAcctNameError] = useState<string | null>(null);
  const [savingAcctName, setSavingAcctName] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [addressVis, setAddressVis] = useState<VisibilityScope>("members");
  const [phoneVis, setPhoneVis] = useState<VisibilityScope>("members");
  const [emailVis, setEmailVis] = useState<VisibilityScope>("members");
  const [initialVis, setInitialVis] = useState<{ address: VisibilityScope; phone: VisibilityScope; email: VisibilityScope } | null>(null);

  const { data: serverPerson, isLoading: personLoading } = useQuery<PersonWithPrivacy>({
    queryKey: ["person", personId],
    queryFn: () => ApiHelper.get("/people/" + personId, "MembershipApi"),
    enabled: !!personId
  });

  const householdId = serverPerson?.householdId;

  const {
    data: household = [],
    isLoading: householdLoading,
    isError: householdIsError
  } = useQuery<HouseholdMember[]>({
    queryKey: ["household", householdId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/people/household/${householdId}`, "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!householdId
  });

  const { data: visibilityPrefs } = useQuery<VisibilityPreferenceInterface>({
    queryKey: ["visibilityPreferences", "my"],
    queryFn: () => ApiHelper.get("/visibilityPreferences/my", "MembershipApi"),
    enabled: !!personId
  });

  const churchId = UserHelper.currentUserChurch?.church?.id || config?.church?.id;

  const { data: publicSettings, isFetched: settingsFetched } = useQuery<any>({
    queryKey: ["publicSettings", churchId],
    queryFn: () => ApiHelper.get(`/settings/public/${churchId}`, "MembershipApi"),
    enabled: !!churchId
  });

  // Blank Directory Approval Group means member edits apply directly, with no staff review.
  // This cached copy only drives labels; handleSave re-reads settings before it picks a path.
  const requiresApproval = !!(publicSettings?.directoryApprovalGroupId || "");
  // Don't offer a button whose label promises a path we haven't confirmed yet.
  const settingsSettled = !churchId || settingsFetched;

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
      contactInfo: { ...emptyPerson.contactInfo, ...(serverPerson.contactInfo || {}) }
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

  const handlePhotoClick = () => {
    setPhotoError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !person) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError(Locale.label("mobile.profileEdit.selectImageFile"));
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
      setPhotoError(err?.message || Locale.label("mobile.screens.couldNotProcessImage"));
    }
  };

  const profileChanges = useMemo(() => {
    if (!person) return [];
    const changes: { field: string; label: string; value: string }[] = [];
    modifiedFields.forEach((key) => {
      const labelKey = fieldLabelKeys[key];
      if (!labelKey) return;
      const value = key === "photo" ? person.photo || "" : readField(person, key);
      changes.push({ field: key, label: Locale.label(labelKey), value });
    });
    pendingFamilyMembers.forEach((name) => {
      changes.push({ field: "familyMember", label: Locale.label("mobile.profileEdit.addFamilyMember"), value: name });
    });
    return changes;
  }, [person, modifiedFields, pendingFamilyMembers]);

  const hasChanges = profileChanges.length > 0;

  const handleSave = async (): Promise<boolean> => {
    if (!person || !initial) return false;
    if (profileChanges.length === 0) {
      setSnack({ open: true, msg: Locale.label("mobile.screens.noChangesToSubmit"), severity: "info" });
      return false;
    }
    setSaving(true);
    // Re-read settings on the write path so a still-loading or failed query can never
    // downgrade an approval church into a direct save.
    let saveWithApproval = requiresApproval;
    try {
      if (!churchId) throw new Error(Locale.label("mobile.screens.unableToLoadChurch"));
      const settings = await ApiHelper.get(`/settings/public/${churchId}`, "MembershipApi");
      const approvalGroupId: string = settings?.directoryApprovalGroupId || "";
      saveWithApproval = !!approvalGroupId;

      const id = person.id || UserHelper.currentUserChurch?.person?.id;
      const displayName = [person.name?.first, person.name?.last].filter(Boolean).join(" ");

      if (saveWithApproval) {
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
          data: JSON.stringify(profileChanges)
        };

        try {
          const group = await ApiHelper.get(`/groups/${approvalGroupId}`, "MembershipApi");
          task.assignedToType = "group";
          task.assignedToId = approvalGroupId;
          task.assignedToLabel = group?.name;
        } catch {

        }

        await ApiHelper.post("/tasks?type=directoryUpdate", [task], "DoingApi");
      } else {
        // Nobody would ever review an unassigned task, so save the record itself. Edit Self
        // only covers the member's own row, so pending family members stay unsaved here,
        // exactly as they did under the old unassigned-task path.
        await ApiHelper.post("/people", [{ ...person, id }], "MembershipApi");
      }

      // Photo uploads on submit, so refresh to show new image without sign-out.
      if (id) {
        try {
          const fresh = await ApiHelper.get("/people/" + id, "MembershipApi");
          if (fresh) userContext?.setPerson(fresh);
          queryClient.invalidateQueries({ queryKey: ["person", id] });
        } catch {
          // Non-fatal: the submit already succeeded.
        }
      }

      setInitial(JSON.parse(JSON.stringify(person)));
      setModifiedFields(new Set());
      setPendingFamilyMembers([]);
      setSnack({
        open: true,
        msg: saveWithApproval ? Locale.label("mobile.screens.changesSubmittedForApproval") : Locale.label("mobile.screens.changesSaved"),
        severity: "success"
      });

      setTimeout(() => {
        try { router.back(); } catch { }
      }, 900);
      return true;
    } catch (err: any) {
      console.error("Profile save error", err);
      setSnack({
        open: true,
        msg: err?.message || (saveWithApproval ? Locale.label("mobile.screens.unableToSubmitChanges") : Locale.label("mobile.screens.unableToSaveChanges")),
        severity: "error"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDiscardOpen(false);
    setSheet(null);
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

  const [discardOpen, setDiscardOpen] = useState(false);
  const [optedOutLocal, setOptedOutLocal] = useState<boolean>(false);
  const [initialOptedOut, setInitialOptedOut] = useState<boolean>(false);
  useEffect(() => {
    if (person) {
      setOptedOutLocal(!!person.optedOut);
      setInitialOptedOut(!!person.optedOut);
    }
  }, [person?.optedOut]);

  const handleSaveDisplayName = async () => {
    setAcctNameError(null);
    if (!acctFirstName.trim() || !acctLastName.trim()) {
      setAcctNameError(Locale.label("mobile.profileEdit.nameRequired"));
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
      setSnack({ open: true, msg: Locale.label("mobile.screens.displayNameUpdated"), severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || Locale.label("mobile.screens.couldNotUpdateDisplayName"), severity: "error" });
    } finally {
      setSavingAcctName(false);
    }
  };

  const handleSaveEmail = async () => {
    setEmailError(null);
    const trimmed = newEmail.trim();
    if (!trimmed) { setEmailError(Locale.label("mobile.profileEdit.enterNewEmail")); return; }
    if (!emailRegex.test(trimmed)) { setEmailError(Locale.label("mobile.profileEdit.invalidEmail")); return; }
    setSavingEmail(true);
    try {
      const resp: any = await ApiHelper.post("/users/updateEmail", { email: trimmed }, "MembershipApi");
      if (UserHelper.user) UserHelper.user.email = trimmed;

      if (resp?.jwt && UserHelper.currentUserChurch) {
        try { UserHelper.currentUserChurch.jwt = resp.jwt; } catch { }
      }
      setNewEmail("");
      setSnack({ open: true, msg: Locale.label("mobile.screens.emailUpdated"), severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || Locale.label("mobile.screens.couldNotUpdateEmail"), severity: "error" });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError(Locale.label("mobile.profileEdit.currentPasswordRequired"));
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError(Locale.label("mobile.profileEdit.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(Locale.label("mobile.profileEdit.passwordsDoNotMatch"));
      return;
    }
    setSavingPassword(true);
    try {
      await ApiHelper.post("/users/updatePassword", { currentPassword, newPassword }, "MembershipApi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSnack({ open: true, msg: Locale.label("mobile.screens.passwordUpdated"), severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || Locale.label("mobile.screens.couldNotUpdatePassword"), severity: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  const prefsChanged = initialVis
    ? addressVis !== initialVis.address || phoneVis !== initialVis.phone || emailVis !== initialVis.email
    : false;
  const optedOutChanged = optedOutLocal !== initialOptedOut;
  const visChanged = prefsChanged || optedOutChanged;

  const handleSaveVisibility = async (): Promise<boolean> => {
    setSavingPrivacy(true);
    try {
      const tasks: Promise<any>[] = [];
      if (prefsChanged) {
        const payload: VisibilityPreferenceInterface = {
          ...(visibilityPrefs || {}),
          address: addressVis,
          phoneNumber: phoneVis,
          email: emailVis
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
      if (prefsChanged) {
        setInitialVis({ address: addressVis, phone: phoneVis, email: emailVis });
        // The mobile query cache is persisted; refresh it so a reload shows the saved levels, not the stale copy.
        queryClient.invalidateQueries({ queryKey: ["visibilityPreferences", "my"] });
      }
      if (optedOutChanged) {
        setInitialOptedOut(optedOutLocal);
        setPerson((p) => (p ? { ...p, optedOut: optedOutLocal } : p));
      }
      setSnack({ open: true, msg: Locale.label("mobile.screens.visibilityPreferencesSaved"), severity: "success" });
      return true;
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || Locale.label("mobile.screens.couldNotSaveVisibility"), severity: "error" });
      return false;
    } finally {
      setSavingPrivacy(false);
    }
  };

  const profileSheetOpen = sheet === "name" || sheet === "contact" || sheet === "household";

  const closeProfileSheet = () => {
    if (hasChanges) setDiscardOpen(true);
    else setSheet(null);
  };

  const saveProfileSheet = async () => {
    if (await handleSave()) setSheet(null);
  };

  const closePrivacySheet = () => {
    if (initialVis) {
      setAddressVis(initialVis.address);
      setPhoneVis(initialVis.phone);
      setEmailVis(initialVis.email);
    }
    setOptedOutLocal(initialOptedOut);
    setSheet(null);
  };

  const savePrivacySheet = async () => {
    if (await handleSaveVisibility()) setSheet(null);
  };

  if (loading) {
    return (
      <Box sx={{ py: "48px", display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: tc.primary }} />
      </Box>
    );
  }

  if (!person) return null;

  const displayInitial = (person.name?.first?.charAt(0) || "?").toUpperCase();
  const fullName = [person.name?.first, person.name?.middle, person.name?.last].filter(Boolean).join(" ");
  const otherHousehold = household.filter((h) => h.id !== person.id);
  const address = [
    [person.contactInfo?.address1, person.contactInfo?.address2].filter(Boolean).join(", "),
    [person.contactInfo?.city, [person.contactInfo?.state, person.contactInfo?.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")
  ].filter(Boolean).join(", ");
  const contactItems = [
    { label: Locale.label("person.email"), value: person.contactInfo?.email },
    { label: Locale.label("mobile.details.mobilePhone"), value: person.contactInfo?.mobilePhone },
    { label: Locale.label("mobile.profileEdit.homePhone"), value: person.contactInfo?.homePhone },
    { label: Locale.label("mobile.profileEdit.workPhone"), value: person.contactInfo?.workPhone },
    { label: Locale.label("mobile.profileEdit.sectionAddress"), value: address },
    { label: Locale.label("mobile.profileEdit.birthDate"), value: readField(person, "birthDate") }
  ];
  const hasContact = contactItems.some((i) => !!i.value);
  const editLink = (key: SheetKey, label = Locale.label("mobile.details.edit")) => (
    <TextLink data-testid={`profile-edit-${key}`} onClick={() => setSheet(key)}>{label}</TextLink>
  );
  const fieldStack = { display: "flex", flexDirection: "column", gap: "14px", pt: "6px" } as const;
  const errorText = (msg: string | null) => msg ? <Typography sx={{ fontSize: 13, color: tc.error }}>{msg}</Typography> : null;

  const renderField = (
    key: string,
    label: string,
    opts?: { type?: string; inputMode?: "text" | "tel" | "email" | "numeric" | "url" | "search"; autoComplete?: string }
  ) => (
    <TextField
      label={label}
      value={readField(person, key)}
      onChange={(e) => setField(key, e.target.value)}
      type={opts?.type || "text"}
      inputProps={{ inputMode: opts?.inputMode, autoComplete: opts?.autoComplete }}
      fullWidth
      InputLabelProps={opts?.type === "date" ? { shrink: true } : undefined}
    />
  );

  const renderNameSheet = () => (
    <Box sx={fieldStack}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Avatar src={photoSrc(person)} sx={{ width: 72, height: 72, bgcolor: tc.chip, color: tc.onChip, fontSize: 26, fontWeight: 600 }}>
          {displayInitial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Button variant="outlined" onClick={handlePhotoClick} startIcon={<PhotoCameraOutlinedIcon />}>
            {Locale.label("mobile.profileEdit.changePhoto")}
          </Button>
          <Typography sx={{ fontSize: 12.5, color: tc.textSecondary, mt: "6px" }}>{Locale.label("mobile.profileEdit.photoHint")}</Typography>
          {errorText(photoError)}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelected} />
        </Box>
      </Box>
      {renderField("name.first", Locale.label("person.firstName"), { autoComplete: "given-name" })}
      {renderField("name.middle", Locale.label("mobile.profileEdit.middleName"), { autoComplete: "additional-name" })}
      {renderField("name.last", Locale.label("person.lastName"), { autoComplete: "family-name" })}
    </Box>
  );

  const renderContactSheet = () => (
    <Box sx={fieldStack}>
      {renderField("contactInfo.email", Locale.label("person.email"), { type: "email", inputMode: "email", autoComplete: "email" })}
      {renderField("contactInfo.mobilePhone", Locale.label("mobile.details.mobilePhone"), { type: "tel", inputMode: "tel", autoComplete: "tel" })}
      {renderField("contactInfo.homePhone", Locale.label("mobile.profileEdit.homePhone"), { type: "tel", inputMode: "tel" })}
      {renderField("contactInfo.workPhone", Locale.label("mobile.profileEdit.workPhone"), { type: "tel", inputMode: "tel" })}
      {renderField("birthDate", Locale.label("mobile.profileEdit.birthDate"), { type: "date" })}
      <Eyebrow component="h3">{Locale.label("mobile.profileEdit.sectionAddress")}</Eyebrow>
      {renderField("contactInfo.address1", Locale.label("mobile.profileEdit.address1"), { autoComplete: "address-line1" })}
      {renderField("contactInfo.address2", Locale.label("mobile.profileEdit.address2"), { autoComplete: "address-line2" })}
      {renderField("contactInfo.city", Locale.label("mobile.profileEdit.city"), { autoComplete: "address-level2" })}
      <Box sx={{ display: "flex", gap: "12px" }}>
        <Box sx={{ flex: 1 }}>{renderField("contactInfo.state", Locale.label("mobile.profileEdit.state"), { autoComplete: "address-level1" })}</Box>
        <Box sx={{ flex: 1 }}>{renderField("contactInfo.zip", Locale.label("mobile.profileEdit.zip"), { inputMode: "numeric", autoComplete: "postal-code" })}</Box>
      </Box>
    </Box>
  );

  const renderHouseholdSheet = () => (
    <Box sx={fieldStack}>
      <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>{Locale.label("mobile.profileEdit.familyMemberHint")}</Typography>
      <Box sx={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <TextField
          label={Locale.label("person.firstName")}
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddFamilyMember(); } }}
          fullWidth
        />
        <Button variant="outlined" onClick={handleAddFamilyMember} disabled={!newMemberName.trim()} sx={{ height: 56, flex: "none" }}>
          {Locale.label("mobile.group.add")}
        </Button>
      </Box>
      {pendingFamilyMembers.length > 0 && (
        <Box>
          <Eyebrow component="h3">{Locale.label("mobile.profileEdit.pendingFamilyMembers")}</Eyebrow>
          <RowList>
            {pendingFamilyMembers.map((name, idx) => (
              <Row
                key={`${name}-${idx}`}
                title={name}
                trailing={<TextLink danger onClick={() => handleRemoveFamilyMember(idx)}>{Locale.label("mobile.screens.remove")}</TextLink>}
                sx={{ minHeight: 44 }}
              />
            ))}
          </RowList>
          <Typography sx={{ fontSize: 12.5, color: tc.textSecondary, mt: "4px" }}>{Locale.label("mobile.profileEdit.pendingFamilyMembersHint")}</Typography>
        </Box>
      )}
    </Box>
  );

  const profileSheetTitle = sheet === "name"
    ? Locale.label("mobile.profileEdit.photoAndName")
    : sheet === "contact"
      ? Locale.label("mobile.profileEdit.sectionContact")
      : Locale.label("mobile.profileEdit.addFamilyMember");

  const renderAccountSheet = () => (
    <Box sx={{ display: "flex", flexDirection: "column", "& > section + section": { borderTop: `1px solid ${tc.border}` }, "& > section": { py: "16px" }, "& > section:first-of-type": { pt: "6px" } }}>
      <Box component="section" sx={fieldStack}>
        <Eyebrow component="h3">{Locale.label("mobile.profileEdit.displayName")}</Eyebrow>
        <TextField label={Locale.label("person.firstName")} value={acctFirstName} onChange={(e) => { setAcctFirstName(e.target.value); setAcctNameError(null); }} fullWidth />
        <TextField label={Locale.label("person.lastName")} value={acctLastName} onChange={(e) => { setAcctLastName(e.target.value); setAcctNameError(null); }} fullWidth />
        {errorText(acctNameError)}
        {(acctFirstName !== (accountUser?.firstName || "") || acctLastName !== (accountUser?.lastName || "")) && (
          <Button variant="contained" onClick={handleSaveDisplayName} disabled={savingAcctName} sx={{ alignSelf: "flex-start" }}>
            {savingAcctName ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : Locale.label("common.save")}
          </Button>
        )}
      </Box>
      <Box component="section" sx={fieldStack}>
        <Eyebrow component="h3">{Locale.label("mobile.profileEdit.changeEmail")}</Eyebrow>
        <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>{Locale.label("person.email")}: {accountUser?.email || "—"}</Typography>
        <TextField
          label={Locale.label("mobile.screens.newEmail")}
          value={newEmail}
          onChange={(e) => { setNewEmail(e.target.value); setEmailError(null); }}
          type="email"
          inputProps={{ inputMode: "email", autoComplete: "email" }}
          fullWidth
        />
        {errorText(emailError)}
        <Button variant="contained" onClick={handleSaveEmail} disabled={savingEmail || !newEmail.trim()} sx={{ alignSelf: "flex-start" }}>
          {savingEmail ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : Locale.label("common.save")}
        </Button>
      </Box>
      <Box component="section" sx={fieldStack}>
        <Eyebrow component="h3">{Locale.label("mobile.profileEdit.changePassword")}</Eyebrow>
        <TextField label={Locale.label("mobile.screens.currentPassword")} value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }} type="password" inputProps={{ autoComplete: "current-password" }} fullWidth />
        <TextField label={Locale.label("mobile.screens.newPassword")} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }} type="password" inputProps={{ autoComplete: "new-password" }} fullWidth />
        <TextField label={Locale.label("mobile.screens.confirmPassword")} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }} type="password" inputProps={{ autoComplete: "new-password" }} fullWidth />
        <Typography sx={{ fontSize: 12.5, color: tc.textSecondary }}>{Locale.label("mobile.profileEdit.passwordMinLength")}</Typography>
        {errorText(passwordError)}
        <Button variant="contained" onClick={handleSavePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} sx={{ alignSelf: "flex-start" }}>
          {savingPassword ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : Locale.label("common.save")}
        </Button>
      </Box>
    </Box>
  );

  const renderVisDropdown = (
    label: string,
    value: VisibilityScope,
    onChange: (v: VisibilityScope) => void,
    id: string
  ) => (
    <FormControl fullWidth>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        label={label}
        value={value}
        onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value as VisibilityScope)}
      >
        {(Object.keys(scopeLabelKeys) as VisibilityScope[]).map((s) => <MenuItem key={s} value={s}>{Locale.label(scopeLabelKeys[s])}</MenuItem>)}
      </Select>
    </FormControl>
  );

  const renderPrivacySheet = () => (
    <Box sx={fieldStack}>
      <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>{Locale.label("mobile.profileEdit.visibilityIntro")}</Typography>
      <Row
        title={Locale.label("mobile.profileEdit.hideFromDirectory")}
        trailing={<Switch checked={optedOutLocal} onChange={(e) => setOptedOutLocal(e.target.checked)} slotProps={{ input: { "aria-label": Locale.label("mobile.profileEdit.hideFromDirectory") } }} />}
        sx={{ minHeight: 48, py: 0 }}
      />
      {renderVisDropdown(Locale.label("mobile.profileEdit.addressVisibility"), addressVis, setAddressVis, "vis-address")}
      {renderVisDropdown(Locale.label("mobile.profileEdit.phoneVisibility"), phoneVis, setPhoneVis, "vis-phone")}
      {renderVisDropdown(Locale.label("mobile.profileEdit.emailVisibility"), emailVis, setEmailVis, "vis-email")}
      <Box>
        <Eyebrow component="h3">{Locale.label("mobile.profileEdit.visibilityLevels")}</Eyebrow>
        <Box sx={{ mt: "8px" }}>
          <KeyValues items={(Object.keys(scopeLabelKeys) as VisibilityScope[]).map((s) => ({ label: Locale.label(scopeLabelKeys[s]), value: Locale.label(scopeDescKeys[s]) }))} />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ pb: "24px" }}>
      <PageHead title={Locale.label("mobile.profileEdit.title")} lede={requiresApproval ? Locale.label("mobile.profileEdit.approvalLede") : undefined} />
      <Plate>
        <PlateSection title={Locale.label("mobile.profileEdit.photoAndName")} action={editLink("name")}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Avatar src={photoSrc(person)} sx={{ width: 64, height: 64, bgcolor: tc.chip, color: tc.onChip, fontSize: 24, fontWeight: 600 }}>
              {displayInitial}
            </Avatar>
            <Typography sx={{ fontSize: 18, lineHeight: "24px", fontWeight: 600, color: tc.text, overflowWrap: "anywhere" }}>{fullName || "—"}</Typography>
          </Box>
        </PlateSection>

        <PlateSection title={Locale.label("mobile.profileEdit.sectionContact")} action={editLink("contact")}>
          {hasContact ? <KeyValues items={contactItems} /> : <QuietEmpty>{Locale.label("mobile.profileEdit.noContactInfo")}</QuietEmpty>}
        </PlateSection>

        <PlateSection title={Locale.label("mobile.screens.tabHousehold")} action={editLink("household", Locale.label("mobile.profileEdit.addFamilyMember"))}>
          {householdLoading && householdId && <CircularProgress sx={{ color: tc.primary }} size={24} />}
          {!householdLoading && !householdId && <QuietEmpty>{Locale.label("mobile.profileEdit.noHouseholdLinked")}</QuietEmpty>}
          {!householdLoading && householdIsError && householdId && <QuietEmpty sx={{ color: tc.error }}>{Locale.label("mobile.profileEdit.couldNotLoadHousehold")}</QuietEmpty>}
          {!householdLoading && !householdIsError && !!householdId && otherHousehold.length === 0 && <QuietEmpty>{Locale.label("mobile.profileEdit.noOtherHouseholdMembers")}</QuietEmpty>}
          {!householdLoading && !householdIsError && otherHousehold.length > 0 && (
            <RowList>
              {otherHousehold.map((h) => (
                <Row
                  key={h.id}
                  href={`/mobile/community/${h.id}`}
                  chevron
                  leading={(
                    <Avatar src={h.photo ? PersonHelper.getPhotoUrl(h) : undefined} sx={{ width: 40, height: 40, bgcolor: tc.chip, color: tc.onChip, fontSize: 15, fontWeight: 600 }}>
                      {(h.name?.first?.charAt(0) || "?").toUpperCase()}
                    </Avatar>
                  )}
                  title={h.name?.display || Locale.label("mobile.components.unknown")}
                  subtitle={h.householdRole || Locale.label("mobile.details.householdMember")}
                />
              ))}
            </RowList>
          )}
        </PlateSection>

        <PlateSection title={Locale.label("mobile.screens.tabAccount")} action={editLink("account")}>
          <KeyValues
            items={[
              { label: Locale.label("mobile.profileEdit.signIn"), value: accountUser?.email || "—" },
              { label: Locale.label("mobile.screens.passwordLabel"), value: "••••••••" },
              { label: Locale.label("mobile.profileEdit.displayName"), value: [accountUser?.firstName, accountUser?.lastName].filter(Boolean).join(" ") }
            ]}
          />
        </PlateSection>

        <PlateSection title={Locale.label("mobile.screens.tabPrivacy")} action={editLink("privacy", Locale.label("mobile.screens.change"))}>
          <KeyValues
            items={[
              { label: Locale.label("mobile.profileEdit.directory"), value: Locale.label(optedOutLocal ? "mobile.profileEdit.hiddenFromDirectory" : "mobile.profileEdit.shownInDirectory") },
              { label: Locale.label("mobile.profileEdit.addressVisibility"), value: Locale.label(scopeLabelKeys[addressVis]) },
              { label: Locale.label("mobile.profileEdit.phoneVisibility"), value: Locale.label(scopeLabelKeys[phoneVis]) },
              { label: Locale.label("mobile.profileEdit.emailVisibility"), value: Locale.label(scopeLabelKeys[emailVis]) }
            ]}
          />
        </PlateSection>
      </Plate>

      <Sheet
        open={profileSheetOpen}
        onClose={closeProfileSheet}
        title={profileSheetTitle}
        actions={(
          <>
            <Button variant="contained" onClick={saveProfileSheet} disabled={saving || !settingsSettled} sx={{ flex: { xs: 1, sm: "none" } }}>
              {saving ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : requiresApproval ? Locale.label("mobile.profileEdit.submitForApproval") : Locale.label("mobile.profileEdit.saveChanges")}
            </Button>
            <Button variant="outlined" onClick={closeProfileSheet} disabled={saving}>{Locale.label("common.cancel")}</Button>
          </>
        )}
      >
        {sheet === "name" && renderNameSheet()}
        {sheet === "contact" && renderContactSheet()}
        {sheet === "household" && renderHouseholdSheet()}
        {requiresApproval && hasChanges && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mt: "16px" }}>
            <StatusBadge tone="warn">{Locale.label("mobile.screens.pending")}</StatusBadge>
            <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>{Locale.label("mobile.profileEdit.pendingAfterSaving")}</Typography>
          </Box>
        )}
      </Sheet>

      <Sheet open={sheet === "account"} onClose={() => setSheet(null)} title={Locale.label("mobile.screens.tabAccount")}>
        {renderAccountSheet()}
      </Sheet>

      <Sheet
        open={sheet === "privacy"}
        onClose={closePrivacySheet}
        title={Locale.label("mobile.profileEdit.visibilityPreferences")}
        actions={(
          <>
            <Button variant="contained" onClick={savePrivacySheet} disabled={savingPrivacy || !visChanged} sx={{ flex: { xs: 1, sm: "none" } }}>
              {savingPrivacy ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : Locale.label("mobile.screens.save")}
            </Button>
            <Button variant="outlined" onClick={closePrivacySheet} disabled={savingPrivacy}>{Locale.label("common.cancel")}</Button>
          </>
        )}
      >
        {renderPrivacySheet()}
      </Sheet>

      <Dialog open={discardOpen} onClose={() => setDiscardOpen(false)}>
        <DialogTitle>{Locale.label("mobile.profileEdit.discardChangesTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{Locale.label("mobile.profileEdit.discardChangesBody")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardOpen(false)}>{Locale.label("mobile.screens.keep")}</Button>
          <Button color="error" onClick={handleCancel} data-testid="confirm-discard-changes">{Locale.label("mobile.profileEdit.discard")}</Button>
        </DialogActions>
      </Dialog>

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
