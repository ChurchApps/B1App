"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Icon,
  IconButton,
  LinearProgress,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, DateHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { EventInterface, RegistrationInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { navigateBack } from "../util";

interface Props {
  eventId: string;
  config: ConfigurationInterface;
}

interface GuestMember {
  firstName: string;
  lastName: string;
}

type Step = "info" | "members" | "confirm";

const formatEventTime = (event: EventInterface) => {
  if (!event.start) return "";
  const start = new Date(event.start);
  if (isNaN(start.getTime())) return "";
  if (event.allDay) return DateHelper.prettyDate(start);
  if (!event.end) return DateHelper.prettyDateTime(start);
  const end = new Date(event.end);
  if (isNaN(end.getTime())) return DateHelper.prettyDateTime(start);
  return `${DateHelper.prettyDateTime(start)} - ${DateHelper.prettyTime(end)}`;
};

export const EventRegisterPage = ({ eventId, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = useContext(UserContext);
  const churchId = config?.church?.id || "";
  const personId = userContext?.userChurch?.person?.id;
  const personName = userContext?.userChurch?.person?.name?.display
    || [userContext?.userChurch?.person?.name?.first, userContext?.userChurch?.person?.name?.last].filter(Boolean).join(" ")
    || "";
  const isLoggedIn = !!personId;

  const [step, setStep] = useState<Step>("info");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [members, setMembers] = useState<GuestMember[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<RegistrationInterface | null>(null);

  const { data: eventData, isLoading: loading, isError: loadError } = useQuery<{ event: EventInterface | null; activeCount: number }>({
    queryKey: ["event-register", churchId, eventId],
    queryFn: async () => {
      const [eventResp, countResp] = await Promise.all([
        ApiHelper.getAnonymous(`/events/public/${churchId}/${eventId}`, "ContentApi"),
        ApiHelper.getAnonymous(`/registrations/event/${eventId}/count?churchId=${churchId}`, "ContentApi")
      ]);
      return { event: (eventResp as EventInterface) || null, activeCount: (countResp as any)?.count || 0 };
    },
    enabled: !!churchId && !!eventId,
    retry: false
  });

  const event = eventData?.event ?? null;
  const activeCount = eventData?.activeCount ?? 0;

  const [loadErrorAlerted, setLoadErrorAlerted] = useState(false);
  useEffect(() => {
    if (loadError && !loadErrorAlerted) {
      setLoadErrorAlerted(true);
      if (typeof window !== "undefined") window.alert("Could not load event details.");
    }
  }, [loadError, loadErrorAlerted]);

  const handleBack = () => navigateBack(router, "/mobile/dashboard");

  const isFull = useMemo(() => (event?.capacity ? activeCount >= event.capacity : false), [event, activeCount]);

  const isOpen = useMemo(() => {
    if (!event) return false;
    const now = new Date();
    if (event.registrationOpenDate && new Date(event.registrationOpenDate) > now) return false;
    if (event.registrationCloseDate && new Date(event.registrationCloseDate) < now) return false;
    return true;
  }, [event]);

  const addMember = () => {
    if (members.length >= 10) return;
    const lastName = isLoggedIn
      ? (userContext?.userChurch?.person?.name?.last || "")
      : guestLastName;
    setMembers([...members, { firstName: "", lastName }]);
  };

  const removeMember = (idx: number) => setMembers(members.filter((_, i) => i !== idx));

  const updateMember = (idx: number, field: keyof GuestMember, value: string) => {
    const next = [...members];
    next[idx] = { ...next[idx], [field]: value };
    setMembers(next);
  };

  const handleContinue = () => {
    setValidationError(null);
    if (!isLoggedIn) {
      if (!guestFirstName.trim() || !guestLastName.trim()) {
        setValidationError("First and last name are required.");
        return;
      }
      if (!guestEmail.trim()) {
        setValidationError("Email is required for guest registration.");
        return;
      }
    }
    setStep("members");
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    for (const m of members) {
      if (!m.firstName.trim() || !m.lastName.trim()) {
        setSubmitError("First and last name are required for each additional member.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload: any = { churchId, eventId };
      if (isLoggedIn) {
        payload.personId = personId;
      } else {
        payload.guestInfo = {
          firstName: guestFirstName.trim(),
          lastName: guestLastName.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim() || undefined
        };
      }
      if (members.length > 0) {
        payload.members = members.map((m) => ({ firstName: m.firstName.trim(), lastName: m.lastName.trim() }));
      }
      const result: RegistrationInterface = await ApiHelper.postAnonymous("/registrations/register", payload, "ContentApi");
      setRegistration(result);
      setStep("confirm");
    } catch {
      setSubmitError("Registration failed. The event may be full or registration may have closed.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderBack = () => (
    <IconButton
      aria-label="Back"
      onClick={handleBack}
      sx={{
        width: 40,
        height: 40,
        bgcolor: tc.surface,
        color: tc.text,
        boxShadow: mobileTheme.shadows.sm,
        mb: `${mobileTheme.spacing.md}px`,
        "&:hover": { bgcolor: tc.surface }
      }}
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {renderBack()}
      {children}
    </Box>
  );

  const StatusCard = ({ icon, title, body, color = tc.primary }: { icon: string; title: string; body: string; color?: string }) => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.md,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
      }}
    >
      <Box sx={{
        width: 72,
        height: 72,
        borderRadius: "36px",
        bgcolor: `${color}1A`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        mb: 2
      }}>
        <Icon sx={{ fontSize: 36, color }}>{icon}</Icon>
      </Box>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: 1 }}>{title}</Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, lineHeight: 1.5 }}>{body}</Typography>
    </Box>
  );

  if (loading) {
    return (
      <Shell>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
          <CircularProgress sx={{ color: tc.primary }} />
        </Box>
      </Shell>
    );
  }

  if (loadError || !event) {
    return (
      <Shell>
        <StatusCard icon="event_busy" title="Event not found" body="This event may have been removed or is no longer available." color={tc.error} />
      </Shell>
    );
  }

  if (!event.registrationEnabled) {
    return (
      <Shell>
        <StatusCard icon="block" title="Registration unavailable" body="Registration is not available for this event." color={tc.warning} />
      </Shell>
    );
  }

  if (!isOpen) {
    const opensLater = event.registrationOpenDate && new Date(event.registrationOpenDate) > new Date();
    const dateLabel = opensLater
      ? `Registration opens ${DateHelper.prettyDate(new Date(event.registrationOpenDate!))}.`
      : "Registration for this event has closed.";
    return (
      <Shell>
        <StatusCard icon="event_busy" title="Registration not open" body={dateLabel} color={tc.warning} />
      </Shell>
    );
  }

  if (isFull) {
    return (
      <Shell>
        <StatusCard
          icon="group_off"
          title="Event is full"
          body={`This event has reached its capacity of ${event.capacity}.`}
          color={tc.error}
        />
      </Shell>
    );
  }

  // Confirm step
  if (step === "confirm" && registration) {
    return (
      <Shell>
        <Box sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.xl}px`,
          boxShadow: mobileTheme.shadows.md,
          p: `${mobileTheme.spacing.lg}px`,
          textAlign: "center"
        }}>
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: "36px",
            bgcolor: "rgba(112, 220, 135, 0.18)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2
          }}>
            <Icon sx={{ fontSize: 40, color: tc.success }}>check_circle</Icon>
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text, mb: 0.5 }}>
            Registration Confirmed!
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            You are registered for <b>{event.title}</b>
          </Typography>
          {registration.status && (
            <Chip
              label={registration.status}
              size="small"
              sx={{
                mb: 1,
                bgcolor: `${tc.success}22`,
                color: tc.success,
                fontWeight: 600,
                textTransform: "capitalize"
              }}
            />
          )}
          {registration.members && registration.members.length > 0 && (
            <Box sx={{
              mt: 2,
              p: 1.5,
              bgcolor: tc.surfaceVariant,
              borderRadius: `${mobileTheme.radius.md}px`,
              textAlign: "left"
            }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: tc.text, mb: 0.5 }}>
                Registered Members:
              </Typography>
              {registration.members.map((m: any, i: number) => (
                <Typography key={i} sx={{ fontSize: 13, color: tc.textSecondary }}>
                  • {m.firstName} {m.lastName}
                </Typography>
              ))}
            </Box>
          )}
          <Button
            variant="contained"
            fullWidth
            onClick={handleBack}
            sx={{
              mt: 3,
              bgcolor: tc.primary,
              color: tc.onPrimary,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: `${mobileTheme.radius.md}px`,
              py: "10px",
              "&:hover": { bgcolor: tc.primary }
            }}
          >
            Done
          </Button>
        </Box>
      </Shell>
    );
  }

  // Event header card (used in both info/members steps)
  const eventCard = (
    <Box sx={{
      bgcolor: tc.surface,
      borderRadius: `${mobileTheme.radius.lg}px`,
      boxShadow: mobileTheme.shadows.sm,
      p: `${mobileTheme.spacing.md}px`,
      mb: `${mobileTheme.spacing.md}px`
    }}>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text, lineHeight: 1.2, mb: 1 }}>
        {event.title}
      </Typography>
      {event.start && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: event.description ? 1 : 0 }}>
          <Icon sx={{ fontSize: 16, color: tc.textMuted }}>schedule</Icon>
          <Typography sx={{ fontSize: 13, color: tc.textMuted }}>
            {formatEventTime(event)}
          </Typography>
        </Box>
      )}
      {event.description && (
        <Typography sx={{ fontSize: 14, color: tc.text, lineHeight: 1.5, whiteSpace: "pre-wrap", my: 1 }}>
          {event.description}
        </Typography>
      )}
      {event.capacity ? (() => {
        const pct = Math.min((activeCount / event.capacity) * 100, 100);
        const barColor = pct >= 90 ? tc.warning : tc.primary;
        return (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 0.5 }}>
              {activeCount} / {event.capacity} spots filled
            </Typography>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: tc.border,
                "& .MuiLinearProgress-bar": { bgcolor: barColor }
              }}
            />
          </Box>
        );
      })() : null}
    </Box>
  );

  // Members step
  if (step === "members") {
    return (
      <Shell>
        {eventCard}
        <Box sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          mb: `${mobileTheme.spacing.md}px`
        }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text, mb: 0.5 }}>
            Additional Members
          </Typography>
          <Typography sx={{ fontSize: 13, color: tc.textMuted, mb: 2 }}>
            Optionally register additional family members for this event.
          </Typography>

          {members.length === 0 && (
            <Typography sx={{ fontSize: 13, color: tc.textMuted, textAlign: "center", mb: 2 }}>
              No additional members added
            </Typography>
          )}

          {members.map((member, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1.5 }}>
              <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
                <TextField
                  label="First Name"
                  value={member.firstName}
                  onChange={(e) => updateMember(idx, "firstName", e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={member.lastName}
                  onChange={(e) => updateMember(idx, "lastName", e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>
              <IconButton aria-label="Remove member" onClick={() => removeMember(idx)} size="small">
                <Icon>close</Icon>
              </IconButton>
            </Box>
          ))}

          <Button
            variant="outlined"
            startIcon={<Icon>person_add</Icon>}
            onClick={addMember}
            disabled={members.length >= 10}
            sx={{
              textTransform: "none",
              borderColor: tc.primary,
              color: tc.primary,
              borderRadius: `${mobileTheme.radius.md}px`,
              fontWeight: 600
            }}
          >
            Add Member
          </Button>
        </Box>

        {submitError && (
          <Box sx={{
            mb: 2,
            p: 1.5,
            borderRadius: `${mobileTheme.radius.md}px`,
            bgcolor: `${tc.error}1A`,
            color: tc.error,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}>
            <Icon sx={{ fontSize: 18 }}>error_outline</Icon>
            {submitError}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setStep("info")}
            sx={{
              textTransform: "none",
              borderColor: tc.borderLight,
              color: tc.text,
              borderRadius: `${mobileTheme.radius.md}px`,
              fontWeight: 600,
              py: "10px",
              flex: 0,
              minWidth: 96
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} sx={{ color: "#FFFFFF" }} /> : <Icon>check</Icon>}
            sx={{
              flex: 1,
              bgcolor: tc.primary,
              color: tc.onPrimary,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: `${mobileTheme.radius.md}px`,
              py: "10px",
              "&:hover": { bgcolor: tc.primary }
            }}
          >
            {submitting ? "Registering..." : "Complete Registration"}
          </Button>
        </Box>
      </Shell>
    );
  }

  // Info step (default)
  return (
    <Shell>
      {eventCard}

      <Box sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
        mb: `${mobileTheme.spacing.md}px`
      }}>
        {isLoggedIn ? (
          <>
            <Typography sx={{ fontSize: 12, color: tc.textSecondary, mb: 0.5 }}>
              Registering as
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: "20px",
                bgcolor: tc.primaryLight,
                color: tc.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16
              }}>
                {(personName.charAt(0) || "?").toUpperCase()}
              </Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
                {personName || "You"}
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text, mb: 1.5 }}>
              Your Information
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  label="First Name"
                  value={guestFirstName}
                  onChange={(e) => setGuestFirstName(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={guestLastName}
                  onChange={(e) => setGuestLastName(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Phone (optional)"
                type="tel"
                autoComplete="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
          </>
        )}
      </Box>

      {validationError && (
        <Box sx={{
          mb: 2,
          p: 1.5,
          borderRadius: `${mobileTheme.radius.md}px`,
          bgcolor: `${tc.warning}1A`,
          color: tc.warning,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 1
        }}>
          <Icon sx={{ fontSize: 18 }}>warning_amber</Icon>
          {validationError}
        </Box>
      )}

      <Button
        variant="contained"
        fullWidth
        onClick={handleContinue}
        endIcon={<Icon>arrow_forward</Icon>}
        sx={{
          bgcolor: tc.primary,
          color: tc.onPrimary,
          textTransform: "none",
          fontWeight: 700,
          borderRadius: `${mobileTheme.radius.md}px`,
          py: "12px",
          fontSize: 15,
          "&:hover": { bgcolor: tc.primary }
        }}
      >
        Continue
      </Button>
    </Shell>
  );
};
