"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Icon,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { FormSubmissionEdit } from "@churchapps/apphelper/forms";
import { useQuery } from "@tanstack/react-query";
import type { EventInterface, FormSubmissionInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { navigateBack } from "../util";
import { formatMoney, useEventRegistration, type RegType } from "@/components/registration/useEventRegistration";
import { RegistrationPaymentForm } from "@/components/registration/RegistrationPaymentForm";

interface Props {
  eventId: string;
  config: ConfigurationInterface;
}

type StatusCardProps = {
  icon: string;
  title: string;
  body: string;
  color: string;
  tc: typeof mobileTheme.colors;
}

type ShellProps = { children: React.ReactNode; backButton: React.ReactNode; backgroundColor: string }

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

const Shell = ({ children, backButton, backgroundColor }: ShellProps) => (
  <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: backgroundColor, minHeight: "100%" }}>
    {backButton}
    {children}
  </Box>
);

const StatusCard = ({ icon, title, body, color, tc }: StatusCardProps) => (
  <Box sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.xl}px`, boxShadow: mobileTheme.shadows.md, p: `${mobileTheme.spacing.lg}px`, textAlign: "center" }}>
    <Box sx={{ width: 72, height: 72, borderRadius: "36px", bgcolor: `${color}1A`, display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
      <Icon sx={{ fontSize: 36, color }}>{icon}</Icon>
    </Box>
    <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: 1 }}>{title}</Typography>
    <Typography sx={{ fontSize: 14, color: tc.textMuted, lineHeight: 1.5 }}>{body}</Typography>
  </Box>
);

export const EventRegisterPage = ({ eventId, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = useContext(UserContext);
  const churchId = config?.church?.id || "";
  const person = userContext?.userChurch?.person;
  const personId = person?.id;
  const personName = person?.name?.display || userContext?.person?.name?.display
    || [person?.name?.first, person?.name?.last].filter(Boolean).join(" ") || "";
  const isLoggedIn = !!personId;

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

  const reg = useEventRegistration({
    churchId,
    eventId,
    event: event || {},
    isLoggedIn,
    person: { id: personId, email: person?.contactInfo?.email, firstName: person?.name?.first, lastName: person?.name?.last }
  });

  const [loadErrorAlerted, setLoadErrorAlerted] = useState(false);
  useEffect(() => {
    if (loadError && !loadErrorAlerted) {
      setLoadErrorAlerted(true);
      if (typeof window !== "undefined") window.alert("Could not load event details.");
    }
  }, [loadError, loadErrorAlerted]);

  const handleBack = () => navigateBack(router, "/mobile/dashboard");

  const isFull = useMemo(() => (event?.capacity ? activeCount >= event.capacity : false), [event, activeCount]);
  useEffect(() => { reg.setAtCapacity(isFull); }, [isFull, reg]);

  const isOpen = useMemo(() => {
    if (!event) return false;
    const now = new Date();
    if (event.registrationOpenDate && new Date(event.registrationOpenDate) > now) return false;
    if (event.registrationCloseDate && new Date(event.registrationCloseDate) < now) return false;
    return true;
  }, [event]);

  const typeLabel = (t: RegType) => {
    const price = t.price != null && t.price > 0 ? ` (${formatMoney(t.price)})` : "";
    const soldOut = t.remainingCapacity != null && t.remainingCapacity <= 0 ? ` - ${Locale.label("registration.soldOut")}` : "";
    return `${t.name}${price}${soldOut}`;
  };
  const typeDisabled = (t: RegType) => t.remainingCapacity != null && t.remainingCapacity <= 0;

  const renderBack = () => (
    <IconButton
      aria-label={Locale.label("mobile.components.back")}
      onClick={handleBack}
      sx={{ width: 40, height: 40, bgcolor: tc.surface, color: tc.text, boxShadow: mobileTheme.shadows.sm, mb: `${mobileTheme.spacing.md}px`, "&:hover": { bgcolor: tc.surface } }}
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  const surfaceCard = (children: React.ReactNode) => (
    <Box sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.md}px`, mb: `${mobileTheme.spacing.md}px` }}>
      {children}
    </Box>
  );

  const errorBox = (msg: string) => (
    <Box sx={{ mb: 2, p: 1.5, borderRadius: `${mobileTheme.radius.md}px`, bgcolor: `${tc.error}1A`, color: tc.error, fontSize: 13, display: "flex", alignItems: "center", gap: 1 }}>
      <Icon sx={{ fontSize: 18 }}>error_outline</Icon>
      {msg}
    </Box>
  );

  if (loading) {
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
          <CircularProgress sx={{ color: tc.primary }} />
        </Box>
      </Shell>
    );
  }

  if (loadError || !event) {
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        <StatusCard icon="event_busy" title={Locale.label("mobile.screens.eventNotFound")} body={Locale.label("mobile.screens.eventNotFoundBody")} color={tc.error} tc={tc} />
      </Shell>
    );
  }

  if (!event.registrationEnabled) {
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        <StatusCard icon="block" title={Locale.label("mobile.screens.registrationUnavailable")} body={Locale.label("mobile.screens.registrationUnavailableBody")} color={tc.warning} tc={tc} />
      </Shell>
    );
  }

  if (!isOpen) {
    const opensLater = event.registrationOpenDate && new Date(event.registrationOpenDate) > new Date();
    const dateLabel = opensLater
      ? Locale.label("mobile.screens.registrationOpensOn").replace("{}", DateHelper.prettyDate(new Date(event.registrationOpenDate!)))
      : Locale.label("mobile.screens.registrationHasClosed");
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        <StatusCard icon="event_busy" title={Locale.label("mobile.screens.registrationNotOpen")} body={dateLabel} color={tc.warning} tc={tc} />
      </Shell>
    );
  }

  if (isFull && !event.waitlistEnabled) {
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        <StatusCard icon="group_off" title={Locale.label("mobile.screens.eventIsFull")} body={Locale.label("mobile.screens.eventIsFullBody").replace("{}", String(event.capacity))} color={tc.error} tc={tc} />
      </Shell>
    );
  }

  if (reg.step === "confirm" && reg.registration) {
    const waitlisted = reg.registration.status === "waitlisted";
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        <Box sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.xl}px`, boxShadow: mobileTheme.shadows.md, p: `${mobileTheme.spacing.lg}px`, textAlign: "center" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "36px", bgcolor: waitlisted ? `${tc.warning}22` : "rgba(112, 220, 135, 0.18)", display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
            <Icon sx={{ fontSize: 40, color: waitlisted ? tc.warning : tc.success }}>{waitlisted ? "hourglass_top" : "check_circle"}</Icon>
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text, mb: 0.5 }}>
            {waitlisted ? Locale.label("registration.waitlist.confirmedTitle") : Locale.label("registration.confirmed")}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            {waitlisted ? Locale.label("registration.waitlist.confirmedBody") : Locale.label("registration.youAreRegistered")} <b>{event.title}</b>
          </Typography>
          {reg.registration.status && (
            <Chip label={reg.registration.status} size="small" sx={{ mb: 1, bgcolor: waitlisted ? `${tc.warning}22` : `${tc.success}22`, color: waitlisted ? tc.warning : tc.success, fontWeight: 600, textTransform: "capitalize" }} />
          )}
          {reg.registration.totalAmount > 0 && (
            <Typography sx={{ fontSize: 13, color: tc.textSecondary, mb: 1 }}>
              {Locale.label("registration.payment.total")}: {formatMoney(reg.registration.amountPaid || 0)} / {formatMoney(reg.registration.totalAmount)}
            </Typography>
          )}
          {reg.registration.members && reg.registration.members.length > 0 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: tc.surfaceVariant, borderRadius: `${mobileTheme.radius.md}px`, textAlign: "left" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: tc.text, mb: 0.5 }}>{Locale.label("registration.registeredMembers")}:</Typography>
              {reg.registration.members.map((m: any, i: number) => (
                <Typography key={i} sx={{ fontSize: 13, color: tc.textSecondary }}>• {m.firstName} {m.lastName}</Typography>
              ))}
            </Box>
          )}
          <Button variant="contained" fullWidth onClick={handleBack} sx={{ mt: 3, bgcolor: tc.primary, color: tc.onPrimary, textTransform: "none", fontWeight: 600, borderRadius: `${mobileTheme.radius.md}px`, py: "10px", "&:hover": { bgcolor: tc.primary } }}>
            {Locale.label("mobile.screens.done")}
          </Button>
        </Box>
      </Shell>
    );
  }

  const eventCard = surfaceCard(
    <>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text, lineHeight: 1.2, mb: 1 }}>{event.title}</Typography>
      {event.start && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: event.description ? 1 : 0 }}>
          <Icon sx={{ fontSize: 16, color: tc.textMuted }}>schedule</Icon>
          <Typography sx={{ fontSize: 13, color: tc.textMuted }}>{formatEventTime(event)}</Typography>
        </Box>
      )}
      {event.description && (
        <Typography sx={{ fontSize: 14, color: tc.text, lineHeight: 1.5, whiteSpace: "pre-wrap", my: 1 }}>{event.description}</Typography>
      )}
      {isFull && event.waitlistEnabled && (
        <Alert severity="warning" sx={{ mt: 1 }} icon={<Icon>hourglass_top</Icon>}>{Locale.label("registration.waitlist.eventFullJoin")}</Alert>
      )}
      {event.capacity ? (() => {
        const pct = Math.min((activeCount / event.capacity) * 100, 100);
        const barColor = pct >= 90 ? tc.warning : tc.primary;
        return (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 12, color: tc.textMuted, mb: 0.5 }}>{activeCount} / {event.capacity} {Locale.label("registration.spotsWord")}</Typography>
            <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: tc.border, "& .MuiLinearProgress-bar": { bgcolor: barColor } }} />
          </Box>
        );
      })() : null}
    </>
  );

  // Payment step
  if (reg.step === "payment") {
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        {eventCard}
        {surfaceCard(
          <RegistrationPaymentForm
            churchId={churchId}
            personId={isLoggedIn ? personId : undefined}
            personEmail={isLoggedIn ? person?.contactInfo?.email : reg.guestEmail}
            personName={`${reg.primaryFirstName} ${reg.primaryLastName}`.trim()}
            amount={reg.total}
            currency={(event as any).currency}
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
        )}
      </Shell>
    );
  }

  // Selections step
  if (reg.step === "selections") {
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        {eventCard}
        {surfaceCard(
          <>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text, mb: 1.5 }}>{Locale.label("registration.selections.title")}</Typography>
            {reg.selections.map((s) => {
              const soldOut = s.remainingCapacity != null && s.remainingCapacity <= 0;
              const qty = reg.selectionQty[s.id] || 0;
              const max = s.maxQuantity ?? 99;
              return (
                <Box key={s.id} sx={{ p: 1.5, mb: 1.5, border: `1px solid ${tc.border}`, borderRadius: `${mobileTheme.radius.md}px`, opacity: soldOut ? 0.6 : 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>{s.name}</Typography>
                    <Typography sx={{ fontSize: 15, color: tc.text }}>{s.price != null && s.price > 0 ? formatMoney(s.price) : Locale.label("registration.free")}</Typography>
                  </Box>
                  {s.description && <Typography sx={{ fontSize: 13, color: tc.textMuted }}>{s.description}</Typography>}
                  {s.remainingCapacity != null && <Typography sx={{ fontSize: 12, color: tc.textMuted }}>{Locale.label("registration.remaining").replace("{}", String(s.remainingCapacity))}</Typography>}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <IconButton size="small" data-testid={`sel-dec-${s.id}`} disabled={soldOut || qty <= 0} onClick={() => reg.setQuantity(s.id, qty - 1)}><Icon>remove</Icon></IconButton>
                    <Typography data-testid={`sel-qty-${s.id}`} sx={{ minWidth: 20, textAlign: "center" }}>{qty}</Typography>
                    <IconButton size="small" data-testid={`sel-add-${s.id}`} disabled={soldOut || qty >= max} onClick={() => reg.setQuantity(s.id, qty + 1)}><Icon>add</Icon></IconButton>
                  </Box>
                </Box>
              );
            })}
          </>
        )}
        {reg.error && errorBox(reg.error)}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => reg.setStep("members")} sx={{ textTransform: "none", borderColor: tc.borderLight, color: tc.text, borderRadius: `${mobileTheme.radius.md}px`, fontWeight: 600, py: "10px", minWidth: 96 }}>{Locale.label("registration.back")}</Button>
          <Button variant="contained" onClick={reg.continueFromSelections} disabled={reg.isSubmitting} sx={{ flex: 1, bgcolor: tc.primary, color: tc.onPrimary, textTransform: "none", fontWeight: 700, borderRadius: `${mobileTheme.radius.md}px`, py: "10px", "&:hover": { bgcolor: tc.primary } }}>{Locale.label("registration.continue")}</Button>
        </Box>
      </Shell>
    );
  }

  // Members step
  if (reg.step === "members") {
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        {eventCard}
        {surfaceCard(
          <>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text, mb: 0.5 }}>{Locale.label("registration.additionalMembers")}</Typography>
            <Typography sx={{ fontSize: 13, color: tc.textMuted, mb: 2 }}>{Locale.label("registration.additionalMembersInfo")}</Typography>

            {reg.members.length === 0 && (
              <Typography sx={{ fontSize: 13, color: tc.textMuted, textAlign: "center", mb: 2 }}>{Locale.label("registration.noAdditional")}</Typography>
            )}

            {reg.members.map((member, idx) => (
              <Box key={idx} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
                    <TextField label={Locale.label("person.firstName")} value={member.firstName} onChange={(e) => reg.updateMember(idx, "firstName", e.target.value)} size="small" fullWidth />
                    <TextField label={Locale.label("person.lastName")} value={member.lastName} onChange={(e) => reg.updateMember(idx, "lastName", e.target.value)} size="small" fullWidth />
                  </Box>
                  <IconButton aria-label={Locale.label("mobile.screens.removeMember")} onClick={() => reg.removeMember(idx)} size="small"><Icon>close</Icon></IconButton>
                </Box>
                {reg.hasTypes && (
                  <Select fullWidth size="small" displayEmpty value={member.registrationTypeId || ""} onChange={(e) => reg.updateMember(idx, "registrationTypeId", e.target.value)} data-testid={`member-type-${idx}`} sx={{ mt: 1 }}>
                    <MenuItem value="" disabled>{Locale.label("registration.selectType")}</MenuItem>
                    {reg.types.map((t) => (<MenuItem key={t.id} value={t.id} disabled={typeDisabled(t)}>{typeLabel(t)}</MenuItem>))}
                  </Select>
                )}
              </Box>
            ))}

            <Button variant="outlined" startIcon={<Icon>person_add</Icon>} onClick={reg.addMember} disabled={reg.members.length >= 10} sx={{ textTransform: "none", borderColor: tc.primary, color: tc.primary, borderRadius: `${mobileTheme.radius.md}px`, fontWeight: 600 }}>
              {Locale.label("registration.addMember")}
            </Button>
          </>
        )}

        {reg.error && errorBox(reg.error)}

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => reg.setStep("info")} sx={{ textTransform: "none", borderColor: tc.borderLight, color: tc.text, borderRadius: `${mobileTheme.radius.md}px`, fontWeight: 600, py: "10px", minWidth: 96 }}>{Locale.label("registration.back")}</Button>
          <Button variant="contained" onClick={reg.continueFromMembers} disabled={reg.isSubmitting} startIcon={reg.isSubmitting ? <CircularProgress size={16} sx={{ color: "#FFFFFF" }} /> : <Icon>{(reg.hasSelections || reg.needsPayment) ? "arrow_forward" : "check"}</Icon>} sx={{ flex: 1, bgcolor: tc.primary, color: tc.onPrimary, textTransform: "none", fontWeight: 700, borderRadius: `${mobileTheme.radius.md}px`, py: "10px", "&:hover": { bgcolor: tc.primary } }}>
            {reg.isSubmitting ? Locale.label("registration.registering")
              : (reg.hasSelections || reg.needsPayment) ? Locale.label("registration.continue")
                : Locale.label("registration.completeRegistration")}
          </Button>
        </Box>
      </Shell>
    );
  }

  if (reg.step === "questions") {
    return (
      <Shell backButton={renderBack()} backgroundColor={tc.background}>
        {eventCard}
        {surfaceCard(
          <>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text, mb: 1.5 }}>{Locale.label("registration.questions")}</Typography>
            {reg.error && errorBox(reg.error)}
            <FormSubmissionEdit
              churchId={churchId}
              addFormId=""
              unRestrictedFormId={reg.unRestrictedFormId}
              contentType="event"
              contentId={eventId}
              formSubmissionId=""
              personId={personId}
              updatedFunction={(fs?: FormSubmissionInterface) => reg.handleFormSaved(fs)}
              cancelFunction={() => reg.setStep(reg.hasSelections ? "selections" : "members")}
              showHeader={false}
              noBackground={true}
            />
          </>
        )}
      </Shell>
    );
  }

  // Info step (default)
  return (
    <Shell backButton={renderBack()} backgroundColor={tc.background}>
      {eventCard}

      {surfaceCard(
        isLoggedIn ? (
          <>
            <Typography sx={{ fontSize: 12, color: tc.textSecondary, mb: 0.5 }}>{Locale.label("registration.registeringAs")}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "20px", bgcolor: tc.primaryLight, color: tc.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
                {(personName.charAt(0) || "?").toUpperCase()}
              </Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>{personName || "You"}</Typography>
            </Box>
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text, mb: 1.5 }}>{Locale.label("registration.yourInformation")}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField label={Locale.label("person.firstName")} value={reg.guestFirstName} onChange={(e) => reg.setGuestFirstName(e.target.value)} size="small" fullWidth />
                <TextField label={Locale.label("person.lastName")} value={reg.guestLastName} onChange={(e) => reg.setGuestLastName(e.target.value)} size="small" fullWidth />
              </Box>
              <TextField label={Locale.label("person.email")} type="email" autoComplete="email" value={reg.guestEmail} onChange={(e) => reg.setGuestEmail(e.target.value)} size="small" fullWidth />
              <TextField label={Locale.label("mobile.screens.phoneOptional")} type="tel" autoComplete="tel" value={reg.guestPhone} onChange={(e) => reg.setGuestPhone(e.target.value)} size="small" fullWidth />
            </Box>
          </>
        )
      )}

      {reg.hasTypes && surfaceCard(
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text, mb: 1 }}>{Locale.label("registration.yourType")}</Typography>
          <Select fullWidth size="small" displayEmpty value={reg.primaryTypeId} onChange={(e) => reg.setPrimaryTypeId(e.target.value)} data-testid="primary-type">
            <MenuItem value="" disabled>{Locale.label("registration.selectType")}</MenuItem>
            {reg.types.map((t) => (<MenuItem key={t.id} value={t.id} disabled={typeDisabled(t)}>{typeLabel(t)}</MenuItem>))}
          </Select>
        </>
      )}

      {reg.error && errorBox(reg.error)}

      <Button variant="contained" fullWidth onClick={reg.continueFromInfo} endIcon={<Icon>arrow_forward</Icon>} sx={{ bgcolor: tc.primary, color: tc.onPrimary, textTransform: "none", fontWeight: 700, borderRadius: `${mobileTheme.radius.md}px`, py: "12px", fontSize: 15, "&:hover": { bgcolor: tc.primary } }}>
        {Locale.label("registration.continue")}
      </Button>
    </Shell>
  );
};
