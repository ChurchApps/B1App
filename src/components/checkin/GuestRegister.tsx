"use client";
import React, { useState } from "react";
import { Button, Icon, Box, Typography, TextField, IconButton } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { HeaderSection, HeaderIconContainer, CheckinCard, colors } from "./CheckinStyles";

interface GuestMember {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Props {
  churchId: string;
}

export function GuestRegister({ churchId }: Props) {
  const [members, setMembers] = useState<GuestMember[]>([
    { firstName: "", lastName: "", email: "", phone: "" },
    { firstName: "", lastName: "", email: "", phone: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const updateMember = (index: number, field: keyof GuestMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const addMember = () => {
    if (members.length >= 10) return;
    const lastName = members[0]?.lastName || "";
    setMembers([...members, { firstName: "", lastName, email: "", phone: "" }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");
    for (const m of members) {
      if (!m.firstName.trim() || !m.lastName.trim()) {
        setError("First name and last name are required for each member.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        churchId,
        members: members.map(m => ({
          firstName: m.firstName.trim(),
          lastName: m.lastName.trim(),
          email: m.email?.trim() || undefined,
          phone: m.phone?.trim() || undefined
        }))
      };
      await ApiHelper.postAnonymous("/people/guest-register", payload, "MembershipApi");
      setIsComplete(true);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <>
        <HeaderSection>
          <HeaderIconContainer>
            <Icon sx={{ fontSize: 48, color: colors.success }}>check_circle</Icon>
          </HeaderIconContainer>
          <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 1 }}>
            Registration Complete
          </Typography>
          <Typography variant="body1" sx={{ color: colors.textSecondary }}>
            You&apos;re all set! A staff member will check you in shortly.
          </Typography>
        </HeaderSection>
      </>
    );
  }

  return (
    <>
      <HeaderSection>
        <HeaderIconContainer>
          <Icon sx={{ fontSize: 48, color: colors.primary }}>person_add</Icon>
        </HeaderIconContainer>
        <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 1 }}>
          Guest Registration
        </Typography>
        <Typography variant="body1" sx={{ color: colors.textSecondary }}>
          Register your family as guests
        </Typography>
      </HeaderSection>

      {members.map((member, index) => (
        <CheckinCard key={index} sx={{ padding: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
            <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
              {index === 0 ? "Primary Contact" : `Family Member ${index + 1}`}
            </Typography>
            {index > 0 && (
              <IconButton size="small" onClick={() => removeMember(index)}>
                <Icon sx={{ color: colors.textSecondary }}>close</Icon>
              </IconButton>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 2, marginBottom: 1 }}>
            <TextField
              label="First Name"
              value={member.firstName}
              onChange={(e) => updateMember(index, "firstName", e.target.value)}
              size="small"
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={member.lastName}
              onChange={(e) => updateMember(index, "lastName", e.target.value)}
              size="small"
              required
              fullWidth
            />
          </Box>
          {index === 0 && (
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={member.email}
                onChange={(e) => updateMember(index, "email", e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Phone"
                type="tel"
                value={member.phone}
                onChange={(e) => updateMember(index, "phone", e.target.value)}
                size="small"
                fullWidth
              />
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
          Add Family Member
        </Button>
      </Box>

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
        {isSubmitting ? "Registering..." : "Register"}
      </Button>
    </>
  );
}
