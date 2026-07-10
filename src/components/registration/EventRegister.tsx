"use client";
import React, { useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Icon, IconButton,
  LinearProgress, MenuItem, Select, Stack, TextField, Typography
} from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { FormSubmissionEdit } from "@churchapps/apphelper/forms";
import type { EventInterface, FormSubmissionInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { formatMoney, useEventRegistration, type RegType } from "./useEventRegistration";

// Stripe/donations pull browser-only modules; keep them out of the server render.
const RegistrationPaymentForm = dynamic(() => import("./RegistrationPaymentForm").then((m) => m.RegistrationPaymentForm), { ssr: false });

interface Props {
  churchId: string;
  eventId: string;
  event: EventInterface;
}

export function EventRegister({ churchId, eventId, event }: Props) {
  const context = useContext(UserContext);
  const isLoggedIn = !!context?.person;
  const [activeCount, setActiveCount] = useState(0);

  const reg = useEventRegistration({
    churchId,
    eventId,
    event,
    isLoggedIn,
    person: {
      id: context?.person?.id,
      email: context?.person?.contactInfo?.email,
      firstName: context?.person?.name?.first,
      lastName: context?.person?.name?.last
    }
  });

  useEffect(() => {
    ApiHelper.getAnonymous("/registrations/event/" + eventId + "/count?churchId=" + churchId, "ContentApi")
      .then((data: any) => setActiveCount(data?.count || 0));
  }, [eventId, churchId]);

  const isFull = event.capacity ? activeCount >= event.capacity : false;
  useEffect(() => { reg.setAtCapacity(isFull); }, [isFull, reg]);

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
      const end = DateHelper.prettyDate(event.end as Date);
      return start === end ? start : `${start} - ${end}`;
    }
    const start = DateHelper.prettyDateTime(event.start);
    const endTime = DateHelper.prettyTime(event.end as Date);
    return `${start} - ${endTime}`;
  };

  const typeLabel = (t: RegType) => {
    const price = t.price != null && t.price > 0 ? ` (${formatMoney(t.price)})` : "";
    const soldOut = t.remainingCapacity != null && t.remainingCapacity <= 0 ? ` - ${Locale.label("registration.soldOut")}` : "";
    return `${t.name}${price}${soldOut}`;
  };

  const typeDisabled = (t: RegType) => t.remainingCapacity != null && t.remainingCapacity <= 0;

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

  if (isFull && !event.waitlistEnabled) {
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
  if (reg.step === "confirm" && reg.registration) {
    const waitlisted = reg.registration.status === "waitlisted";
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Icon sx={{ fontSize: 48, color: waitlisted ? "warning.main" : "success.main", mb: 1 }}>{waitlisted ? "hourglass_top" : "check_circle"}</Icon>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {waitlisted ? Locale.label("registration.waitlist.confirmedTitle") : Locale.label("registration.confirmed")}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {waitlisted ? Locale.label("registration.waitlist.confirmedBody") : Locale.label("registration.youAreRegistered")} <b>{event.title}</b>
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1} sx={{ textAlign: "left" }}>
            <Typography variant="body2"><b>{Locale.label("registration.event")}:</b> {event.title}</Typography>
            <Typography variant="body2"><b>{Locale.label("common.date")}:</b> {getDisplayTime()}</Typography>
            <Typography variant="body2"><b>{Locale.label("registration.status")}:</b> <Chip label={reg.registration.status} size="small" color={waitlisted ? "warning" : "success"} /></Typography>
            {reg.registration.totalAmount > 0 && (
              <Typography variant="body2"><b>{Locale.label("registration.payment.total")}:</b> {formatMoney(reg.registration.amountPaid || 0)} / {formatMoney(reg.registration.totalAmount)}</Typography>
            )}
            {reg.registration.members && reg.registration.members.length > 0 && (
              <>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>{Locale.label("registration.registeredMembers")}:</Typography>
                {reg.registration.members.map((m: any, i: number) => (
                  <Typography key={i} variant="body2">- {m.firstName} {m.lastName}</Typography>
                ))}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Payment step
  if (reg.step === "payment") {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <RegistrationPaymentForm
            churchId={churchId}
            personId={isLoggedIn ? context?.person?.id : undefined}
            personEmail={isLoggedIn ? context?.person?.contactInfo?.email : reg.guestEmail}
            personName={`${reg.primaryFirstName} ${reg.primaryLastName}`.trim()}
            amount={reg.total}
            currency={(event as EventInterface & { currency?: string }).currency}
            summaryLines={reg.summaryLines}
            subtotal={reg.subtotal}
            discountAmount={reg.discountAmount}
            couponCode={reg.couponCode}
            setCouponCode={reg.setCouponCode}
            appliedCoupon={reg.appliedCoupon}
            couponError={reg.couponError}
            applyCoupon={reg.applyCoupon}
            removeCoupon={reg.removeCoupon}
            onPay={(p) => reg.submit(p)}
            onFinalized={(result) => reg.finishConfirm(result)}
            onBack={() => reg.setStep(reg.hasSelections ? "selections" : "members")}
          />
        </CardContent>
      </Card>
    );
  }

  // Selections step
  if (reg.step === "selections") {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{Locale.label("registration.selections.title")}</Typography>
          <Stack spacing={2}>
            {reg.selections.map((s) => {
              const soldOut = s.remainingCapacity != null && s.remainingCapacity <= 0;
              const qty = reg.selectionQty[s.id] || 0;
              const max = s.maxQuantity ?? 99;
              return (
                <Box key={s.id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, opacity: soldOut ? 0.6 : 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                    <Typography variant="subtitle1">{s.price != null && s.price > 0 ? formatMoney(s.price) : Locale.label("registration.free")}</Typography>
                  </Box>
                  {s.description && <Typography variant="body2" color="text.secondary">{s.description}</Typography>}
                  {s.remainingCapacity != null && <Typography variant="caption" color="text.secondary">{Locale.label("registration.remaining").replace("{}", String(s.remainingCapacity))}</Typography>}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <IconButton size="small" data-testid={`sel-dec-${s.id}`} disabled={soldOut || qty <= 0} onClick={() => reg.setQuantity(s.id, qty - 1)}><Icon>remove</Icon></IconButton>
                    <Typography data-testid={`sel-qty-${s.id}`}>{qty}</Typography>
                    <IconButton size="small" data-testid={`sel-add-${s.id}`} disabled={soldOut || qty >= max} onClick={() => reg.setQuantity(s.id, qty + 1)}><Icon>add</Icon></IconButton>
                  </Box>
                </Box>
              );
            })}
          </Stack>
          {reg.error && <Alert severity="error" sx={{ mt: 2 }}>{reg.error}</Alert>}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => reg.setStep("members")}>{Locale.label("registration.back")}</Button>
            <Button variant="contained" fullWidth onClick={reg.continueFromSelections} disabled={reg.isSubmitting}>{Locale.label("registration.continue")}</Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Members step
  if (reg.step === "members") {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{Locale.label("registration.additionalMembers")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {Locale.label("registration.additionalMembersInfo")}
          </Typography>

          {reg.members.map((member, index) => (
            <Box key={index} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center", flexWrap: "wrap" }}>
              <TextField
                label={Locale.label("person.firstName")}
                value={member.firstName}
                onChange={(e) => reg.updateMember(index, "firstName", e.target.value)}
                size="small"
                required
                sx={{ flex: 1, minWidth: 120 }}
              />
              <TextField
                label={Locale.label("person.lastName")}
                value={member.lastName}
                onChange={(e) => reg.updateMember(index, "lastName", e.target.value)}
                size="small"
                required
                sx={{ flex: 1, minWidth: 120 }}
              />
              {reg.hasTypes && (
                <Select
                  size="small"
                  displayEmpty
                  value={member.registrationTypeId || ""}
                  onChange={(e) => reg.updateMember(index, "registrationTypeId", e.target.value)}
                  data-testid={`member-type-${index}`}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="" disabled>{Locale.label("registration.selectType")}</MenuItem>
                  {reg.types.map((t) => (
                    <MenuItem key={t.id} value={t.id} disabled={typeDisabled(t)}>{typeLabel(t)}</MenuItem>
                  ))}
                </Select>
              )}
              <IconButton size="small" onClick={() => reg.removeMember(index)}>
                <Icon>close</Icon>
              </IconButton>
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={reg.addMember}
            startIcon={<Icon>person_add</Icon>}
            disabled={reg.members.length >= 10}
            size="small"
            sx={{ mb: 2 }}
          >
            {Locale.label("registration.addMember")}
          </Button>

          {reg.error && <Alert severity="error" sx={{ mb: 1 }}>{reg.error}</Alert>}

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => reg.setStep("info")}>{Locale.label("registration.back")}</Button>
            <Button
              variant="contained"
              onClick={reg.continueFromMembers}
              disabled={reg.isSubmitting}
              fullWidth
              startIcon={<Icon>{reg.isSubmitting ? "hourglass_empty" : "how_to_reg"}</Icon>}
            >
              {reg.isSubmitting ? Locale.label("registration.registering")
                : (reg.hasSelections || reg.needsPayment) ? Locale.label("registration.continue")
                  : Locale.label("registration.completeRegistration")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Questions step
  if (reg.step === "questions") {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{Locale.label("registration.questions")}</Typography>
          {reg.error && <Alert severity="error" sx={{ mb: 1 }}>{reg.error}</Alert>}
          <FormSubmissionEdit
            churchId={churchId}
            addFormId=""
            unRestrictedFormId={reg.unRestrictedFormId}
            contentType="event"
            contentId={eventId}
            formSubmissionId=""
            personId={context?.person?.id}
            updatedFunction={(fs?: FormSubmissionInterface) => reg.handleFormSaved(fs)}
            cancelFunction={() => reg.setStep(reg.hasSelections ? "selections" : "members")}
            showHeader={false}
            noBackground={true}
          />
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

        {isFull && event.waitlistEnabled && (
          <Alert severity="warning" sx={{ mb: 2 }} icon={<Icon>hourglass_top</Icon>}>
            {Locale.label("registration.waitlist.eventFullJoin")}
          </Alert>
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
              <TextField label={Locale.label("person.firstName")} value={reg.guestFirstName} onChange={(e) => reg.setGuestFirstName(e.target.value)} size="small" required fullWidth />
              <TextField label={Locale.label("person.lastName")} value={reg.guestLastName} onChange={(e) => reg.setGuestLastName(e.target.value)} size="small" required fullWidth />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label={Locale.label("person.email")} type="email" value={reg.guestEmail} onChange={(e) => reg.setGuestEmail(e.target.value)} size="small" required fullWidth />
              <TextField label={Locale.label("registration.phone")} type="tel" value={reg.guestPhone} onChange={(e) => reg.setGuestPhone(e.target.value)} size="small" fullWidth />
            </Box>
          </Box>
        )}

        {reg.hasTypes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{Locale.label("registration.yourType")}:</Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={reg.primaryTypeId}
              onChange={(e) => reg.setPrimaryTypeId(e.target.value)}
              data-testid="primary-type"
            >
              <MenuItem value="" disabled>{Locale.label("registration.selectType")}</MenuItem>
              {reg.types.map((t) => (
                <MenuItem key={t.id} value={t.id} disabled={typeDisabled(t)}>{typeLabel(t)}</MenuItem>
              ))}
            </Select>
          </Box>
        )}

        {reg.error && <Alert severity="error" sx={{ mb: 1 }}>{reg.error}</Alert>}

        <Button variant="contained" onClick={reg.continueFromInfo} fullWidth size="large" startIcon={<Icon>how_to_reg</Icon>} sx={{ mt: 1 }}>
          {Locale.label("registration.continue")}
        </Button>
      </CardContent>
    </Card>
  );
}
