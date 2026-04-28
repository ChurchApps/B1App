"use client";
import React, { useContext, useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Divider, Icon, IconButton,
  LinearProgress, Stack, TextField, Typography
} from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import type { EventInterface, RegistrationInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";

interface GuestMember {
  firstName: string;
  lastName: string;
}

interface Props {
  churchId: string;
  eventId: string;
  event: EventInterface;
}

export function EventRegister({ churchId, eventId, event }: Props) {
  const context = useContext(UserContext);
  const isLoggedIn = !!context?.person;

  const [step, setStep] = useState<"info" | "members" | "confirm">("info");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [members, setMembers] = useState<GuestMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeCount, setActiveCount] = useState(0);
  const [registration, setRegistration] = useState<RegistrationInterface | null>(null);

  useEffect(() => {
    ApiHelper.getAnonymous("/registrations/event/" + eventId + "/count?churchId=" + churchId, "ContentApi")
      .then((data: any) => setActiveCount(data?.count || 0));
  }, [eventId, churchId]);

  const isFull = event.capacity ? activeCount >= event.capacity : false;
  const isOpen = checkDates();

  function checkDates(): boolean {
    const now = new Date();
    if (event.registrationOpenDate && new Date(event.registrationOpenDate) > now) return false;
    if (event.registrationCloseDate && new Date(event.registrationCloseDate) < now) return false;
    return true;
  }

  const getDisplayTime = () => {
    if (!event.start) return "";
    if (event.allDay) {
      const start = DateHelper.prettyDate(event.start);
      const end = DateHelper.prettyDate(event.end);
      return start === end ? start : `${start} - ${end}`;
    }
    const start = DateHelper.prettyDateTime(event.start);
    const endTime = DateHelper.prettyTime(event.end);
    return `${start} - ${endTime}`;
  };

  const addMember = () => {
    if (members.length >= 10) return;
    const lastName = isLoggedIn ? (context.person?.name?.last || "") : guestLastName;
    setMembers([...members, { firstName: "", lastName }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof GuestMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleContinue = () => {
    setError("");
    if (!isLoggedIn) {
      if (!guestFirstName.trim() || !guestLastName.trim()) {
        setError(Locale.label("registration.errors.namesRequired"));
        return;
      }
      if (!guestEmail.trim()) {
        setError(Locale.label("registration.errors.emailRequired"));
        return;
      }
    }
    setStep("members");
  };

  const handleSubmit = async () => {
    setError("");
    for (const m of members) {
      if (!m.firstName.trim() || !m.lastName.trim()) {
        setError(Locale.label("registration.errors.memberNamesRequired"));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = { churchId, eventId };

      if (isLoggedIn) {
        payload.personId = context.person.id;
      } else {
        payload.guestInfo = {
          firstName: guestFirstName.trim(),
          lastName: guestLastName.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim() || undefined
        };
      }

      if (members.length > 0) {
        payload.members = members.map((m) => ({
          firstName: m.firstName.trim(),
          lastName: m.lastName.trim()
        }));
      }

      const result = await ApiHelper.postAnonymous("/registrations/register", payload, "ContentApi");
      setRegistration(result);
      setStep("confirm");
    } catch {
      setError(Locale.label("registration.errors.registrationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status messages for closed/full
  if (!isOpen) {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Icon sx={{ fontSize: 48, color: "grey.400", mb: 1 }}>event_busy</Icon>
          <Typography variant="h6">{Locale.label("registration.notOpen")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {event.registrationOpenDate && new Date(event.registrationOpenDate) > new Date()
              ? Locale.label("registration.opensOn").replace("{}", DateHelper.prettyDate(event.registrationOpenDate))
              : Locale.label("registration.closed")}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (isFull) {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Icon sx={{ fontSize: 48, color: "error.main", mb: 1 }}>group_off</Icon>
          <Typography variant="h6">{Locale.label("registration.eventFull")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {Locale.label("registration.capacityReached").replace("{}", String(event.capacity))}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Confirmation step
  if (step === "confirm" && registration) {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Icon sx={{ fontSize: 48, color: "success.main", mb: 1 }}>check_circle</Icon>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{Locale.label("registration.confirmed")}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {Locale.label("registration.youAreRegistered")} <b>{event.title}</b>
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1} sx={{ textAlign: "left" }}>
            <Typography variant="body2"><b>{Locale.label("registration.event")}:</b> {event.title}</Typography>
            <Typography variant="body2"><b>{Locale.label("common.date")}:</b> {getDisplayTime()}</Typography>
            <Typography variant="body2"><b>{Locale.label("registration.status")}:</b> <Chip label={registration.status} size="small" color="success" /></Typography>
            {registration.members && registration.members.length > 0 && (
              <>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>{Locale.label("registration.registeredMembers")}:</Typography>
                {registration.members.map((m, i) => (
                  <Typography key={i} variant="body2">- {m.firstName} {m.lastName}</Typography>
                ))}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Members step
  if (step === "members") {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{Locale.label("registration.additionalMembers")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {Locale.label("registration.additionalMembersInfo")}
          </Typography>

          {members.map((member, index) => (
            <Box key={index} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
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
              <IconButton size="small" onClick={() => removeMember(index)}>
                <Icon>close</Icon>
              </IconButton>
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={addMember}
            startIcon={<Icon>person_add</Icon>}
            disabled={members.length >= 10}
            size="small"
            sx={{ mb: 2 }}
          >
            {Locale.label("registration.addMember")}
          </Button>

          {error && <Typography sx={{ color: "error.main", mb: 1 }}>{error}</Typography>}

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => setStep("info")}>{Locale.label("registration.back")}</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              fullWidth
              startIcon={<Icon>{isSubmitting ? "hourglass_empty" : "how_to_reg"}</Icon>}
            >
              {isSubmitting ? Locale.label("registration.registering") : Locale.label("registration.completeRegistration")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Info step (default)
  const capacityPct = event.capacity ? Math.min((activeCount / event.capacity) * 100, 100) : 0;

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{event.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <Icon sx={{ fontSize: 16, verticalAlign: "text-bottom", mr: 0.5 }}>schedule</Icon>
          {getDisplayTime()}
        </Typography>

        {event.description && (
          <Typography variant="body2" sx={{ mb: 2 }}>{event.description}</Typography>
        )}

        {event.capacity && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {Locale.label("registration.spotsFilled").replace("{0}", String(activeCount)).replace("{1}", String(event.capacity))}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={capacityPct}
              color={capacityPct >= 90 ? "warning" : "primary"}
              sx={{ mt: 0.5 }}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {isLoggedIn ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{Locale.label("registration.registeringAs")}:</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {context.person?.name?.display || ""}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{Locale.label("registration.yourInformation")}:</Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
              <TextField
                label={Locale.label("person.firstName")}
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                size="small"
                required
                fullWidth
              />
              <TextField
                label={Locale.label("person.lastName")}
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                size="small"
                required
                fullWidth
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={Locale.label("person.email")}
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                size="small"
                required
                fullWidth
              />
              <TextField
                label={Locale.label("registration.phone")}
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        )}

        {error && <Typography sx={{ color: "error.main", mb: 1 }}>{error}</Typography>}

        <Button
          variant="contained"
          onClick={handleContinue}
          fullWidth
          size="large"
          startIcon={<Icon>how_to_reg</Icon>}
          sx={{ mt: 1 }}
        >
          {Locale.label("registration.continue")}
        </Button>
      </CardContent>
    </Card>
  );
}
