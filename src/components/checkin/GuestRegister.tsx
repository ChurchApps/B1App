"use client";
import React, { useEffect, useState } from "react";
import { Button, Icon, Box, Typography, TextField, IconButton, MenuItem } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { HeaderSection, HeaderIconContainer, HeaderImage, CheckinCard, colors } from "./CheckinStyles";

interface GuestMember {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  grade?: string;
}

interface GuestAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

type FieldMode = "off" | "optional" | "required";
type FieldKey = "email" | "phone" | "address" | "birthDate" | "gender" | "maritalStatus" | "grade" | "comments";
type FieldModes = Record<FieldKey, FieldMode>;

// Matches the Api default, so the form looks like it always has until the church changes the checklist.
const DEFAULT_MODES: FieldModes = { email: "optional", phone: "optional", address: "off", birthDate: "off", gender: "off", maritalStatus: "off", grade: "off", comments: "off" };
const GENDERS = ["Unspecified", "Male", "Female"];
const MARITAL_STATUSES = ["Unknown", "Single", "Married", "Divorced", "Widowed"];
const GRADES = [
  "PreK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Graduated"
];
const emptyMember = (lastName = ""): GuestMember => ({ firstName: "", lastName, email: "", phone: "", birthDate: "", gender: "", grade: "" });

interface Props {
  churchId: string;
  imageUrl?: string;
}

export function GuestRegister({ churchId, imageUrl }: Props) {
  const [members, setMembers] = useState<GuestMember[]>([emptyMember(), emptyMember()]);
  const [address, setAddress] = useState<GuestAddress>({ address1: "", address2: "", city: "", state: "", zip: "" });
  const [maritalStatus, setMaritalStatus] = useState("");
  const [comments, setComments] = useState("");
  const [modes, setModes] = useState<FieldModes>(DEFAULT_MODES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!churchId) return;
    ApiHelper.getAnonymous("/people/guest-register/options?churchId=" + encodeURIComponent(churchId), "MembershipApi")
      .then((data: Partial<FieldModes>) => { if (data && typeof data === "object") setModes({ ...DEFAULT_MODES, ...data }); })
      .catch(() => { /* keep the default form */ });
  }, [churchId]);

  const on = (key: FieldKey) => modes[key] !== "off";
  const required = (key: FieldKey) => modes[key] === "required";

  const updateMember = (index: number, field: keyof GuestMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const addMember = () => {
    if (members.length >= 10) return;
    const lastName = members[0]?.lastName || "";
    setMembers([...members, emptyMember(lastName)]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");
    for (const m of members) {
      if (!m.firstName.trim() || !m.lastName.trim()) {
        setError(Locale.label("checkin.guestRegister.validate.namesRequired"));
        return;
      }
    }
    const primary = members[0];
    const missingRequired = (required("email") && !primary.email?.trim())
      || (required("phone") && !primary.phone?.trim())
      || (required("address") && (!address.address1.trim() || !address.city.trim() || !address.state.trim() || !address.zip.trim()))
      || (required("maritalStatus") && !maritalStatus)
      || (required("comments") && !comments.trim())
      || members.some(m => (required("birthDate") && !m.birthDate) || (required("gender") && !m.gender) || (required("grade") && !m.grade));
    if (missingRequired) {
      setError(Locale.label("checkin.guestRegister.validate.fieldsRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Only the fields the church included are sent.
      const payload = {
        churchId,
        members: members.map((m, i) => ({
          firstName: m.firstName.trim(),
          lastName: m.lastName.trim(),
          email: (i === 0 && on("email") && m.email?.trim()) || undefined,
          phone: (i === 0 && on("phone") && m.phone?.trim()) || undefined,
          birthDate: (on("birthDate") && m.birthDate) || undefined,
          gender: (on("gender") && m.gender) || undefined,
          grade: (on("grade") && m.grade) || undefined
        })),
        address: on("address") ? {
          address1: address.address1.trim(),
          address2: address.address2.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          zip: address.zip.trim()
        } : undefined,
        maritalStatus: (on("maritalStatus") && maritalStatus) || undefined,
        comments: (on("comments") && comments.trim()) || undefined
      };
      await ApiHelper.postAnonymous("/people/guest-register", payload, "MembershipApi");
      setIsComplete(true);
    } catch {
      setError(Locale.label("checkin.guestRegister.registrationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <>
        <HeaderSection>
          {imageUrl
            ? <HeaderImage src={imageUrl} alt="" data-testid="guest-register-header-photo" />
            : <HeaderIconContainer>
              <Icon sx={{ fontSize: 48, color: colors.success }}>check_circle</Icon>
            </HeaderIconContainer>}
          <Typography variant="h4" component="h1" sx={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 1 }}>
            {Locale.label("checkin.guestRegister.complete.title")}
          </Typography>
          <Typography variant="body1" sx={{ color: colors.textSecondary }}>
            {Locale.label("checkin.guestRegister.complete.message")}
          </Typography>
        </HeaderSection>
      </>
    );
  }

  return (
    <>
      <HeaderSection>
        {imageUrl
          ? <HeaderImage src={imageUrl} alt="" data-testid="guest-register-header-photo" />
          : <HeaderIconContainer>
            <Icon sx={{ fontSize: 48, color: colors.primary }}>person_add</Icon>
          </HeaderIconContainer>}
        <Typography variant="h4" component="h1" sx={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 1 }}>
          {Locale.label("checkin.guestRegister.title")}
        </Typography>
        <Typography variant="body1" sx={{ color: colors.textSecondary }}>
          {Locale.label("checkin.guestRegister.subtitle")}
        </Typography>
      </HeaderSection>

      {members.map((member, index) => (
        <CheckinCard key={index} sx={{ padding: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
            <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
              {index === 0 ? Locale.label("checkin.guestRegister.primaryContact") : Locale.label("checkin.guestRegister.familyMember").replace("{}", String(index + 1))}
            </Typography>
            {index > 0 && (
              <IconButton size="small" onClick={() => removeMember(index)}>
                <Icon sx={{ color: colors.textSecondary }}>close</Icon>
              </IconButton>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 2, marginBottom: 1 }}>
            <TextField
              label={Locale.label("person.firstName")}
              value={member.firstName}
              onChange={(e) => updateMember(index, "firstName", e.target.value)}
              size="small"
              required
              fullWidth
            />
            <TextField
              label={Locale.label("person.lastName")}
              value={member.lastName}
              onChange={(e) => updateMember(index, "lastName", e.target.value)}
              size="small"
              required
              fullWidth
            />
          </Box>
          {index === 0 && (on("email") || on("phone")) && (
            <Box sx={{ display: "flex", gap: 2, marginBottom: 1 }}>
              {on("email") && (
                <TextField
                  label={Locale.label("person.email")}
                  type="email"
                  value={member.email}
                  onChange={(e) => updateMember(index, "email", e.target.value)}
                  size="small"
                  required={required("email")}
                  fullWidth
                />
              )}
              {on("phone") && (
                <TextField
                  label={Locale.label("checkin.guestRegister.phone")}
                  type="tel"
                  value={member.phone}
                  onChange={(e) => updateMember(index, "phone", e.target.value)}
                  size="small"
                  required={required("phone")}
                  fullWidth
                />
              )}
            </Box>
          )}
          {(on("birthDate") || on("gender") || on("grade")) && (
            <Box sx={{ display: "flex", gap: 2, marginBottom: 1 }}>
              {on("birthDate") && (
                <TextField
                  label={Locale.label("checkin.guestRegister.birthDate")}
                  type="date"
                  value={member.birthDate}
                  onChange={(e) => updateMember(index, "birthDate", e.target.value)}
                  size="small"
                  required={required("birthDate")}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
              {on("gender") && (
                <TextField
                  select
                  label={Locale.label("checkin.guestRegister.gender")}
                  value={member.gender}
                  onChange={(e) => updateMember(index, "gender", e.target.value)}
                  size="small"
                  required={required("gender")}
                  fullWidth
                >
                  {GENDERS.map(g => <MenuItem key={g} value={g}>{Locale.label("checkin.guestRegister.genders." + g)}</MenuItem>)}
                </TextField>
              )}
              {on("grade") && (
                <TextField
                  select
                  label={Locale.label("checkin.guestRegister.grade")}
                  value={member.grade}
                  onChange={(e) => updateMember(index, "grade", e.target.value)}
                  size="small"
                  required={required("grade")}
                  fullWidth
                >
                  {GRADES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              )}
            </Box>
          )}
          {index === 0 && on("maritalStatus") && (
            <Box sx={{ marginBottom: 1 }}>
              <TextField
                select
                label={Locale.label("checkin.guestRegister.maritalStatus")}
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                size="small"
                required={required("maritalStatus")}
                fullWidth
              >
                {MARITAL_STATUSES.map(m => <MenuItem key={m} value={m}>{Locale.label("checkin.guestRegister.maritalStatuses." + m)}</MenuItem>)}
              </TextField>
            </Box>
          )}
          {index === 0 && on("address") && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: colors.textSecondary }}>{Locale.label("checkin.guestRegister.address")}</Typography>
              <TextField label={Locale.label("checkin.guestRegister.address1")} value={address.address1} onChange={(e) => setAddress({ ...address, address1: e.target.value })} size="small" required={required("address")} fullWidth />
              <TextField label={Locale.label("checkin.guestRegister.address2")} value={address.address2} onChange={(e) => setAddress({ ...address, address2: e.target.value })} size="small" fullWidth />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField label={Locale.label("checkin.guestRegister.city")} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} size="small" required={required("address")} fullWidth />
                <TextField label={Locale.label("checkin.guestRegister.state")} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} size="small" required={required("address")} sx={{ maxWidth: 110 }} />
                <TextField label={Locale.label("checkin.guestRegister.zip")} value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} size="small" required={required("address")} sx={{ maxWidth: 130 }} />
              </Box>
            </Box>
          )}
        </CheckinCard>
      ))}

      <Box sx={{ marginBottom: 2 }}>
        <Button
          variant="outlined"
          onClick={addMember}
          startIcon={<Icon>add</Icon>}
          disabled={members.length >= 10}
          sx={{ borderRadius: 2, color: colors.primary, borderColor: colors.primary }}
        >
          {Locale.label("checkin.guestRegister.addFamilyMember")}
        </Button>
      </Box>

      {on("comments") && (
        <CheckinCard sx={{ padding: 2 }}>
          <TextField
            label={Locale.label("checkin.guestRegister.comments")}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            size="small"
            required={required("comments")}
            multiline
            minRows={3}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
        </CheckinCard>
      )}

      {error && (
        <Typography sx={{ color: "error.main", marginBottom: 2 }}>{error}</Typography>
      )}

      <Button
        fullWidth
        size="large"
        variant="contained"
        onClick={handleSubmit}
        disabled={isSubmitting}
        startIcon={<Icon>{isSubmitting ? "hourglass_empty" : "how_to_reg"}</Icon>}
        sx={{
          backgroundColor: colors.primary,
          borderRadius: 3,
          height: 56,
          fontWeight: 700,
          fontSize: 16,
          boxShadow: `0 2px 4px ${colors.primary}33`,
          "&:hover": { backgroundColor: colors.primaryHover }
        }}
      >
        {isSubmitting ? Locale.label("checkin.guestRegister.registering") : Locale.label("login.register")}
      </Button>
    </>
  );
}
