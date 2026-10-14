"use client";

import React, { useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
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
import { PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, StatusBadge, TextLink } from "../kit";

interface Props {
  eventId: string;
  config: ConfigurationInterface;
}

const tc = mobileTheme.colors;

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

const StatusPlate = ({ title, heading, body }: { title: string; heading: string; body: string }) => (
  <Box>
    <PageHead title={title} />
    <Plate>
      <PlateSection>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>{heading}</Typography>
        <QuietEmpty>{body}</QuietEmpty>
      </PlateSection>
    </Plate>
  </Box>
);

const Actions = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ px: { xs: "12px", md: 0 }, pt: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>{children}</Box>
);

export const EventRegisterPage = ({ eventId, config }: Props) => {
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
    person: { id: personId, email: person?.contactInfo?.email, firstName: person?.name?.first, lastName: person?.name?.last, householdId: userContext?.person?.householdId }
  });

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

  const errorLine = (msg: string) => (
    <Typography role="alert" sx={{ mt: "12px", color: tc.error, fontSize: 14 }}>{msg}</Typography>
  );

  const registerTitle = Locale.label("mobile.screenTitles.register");

  if (loading) {
    return (
      <Box>
        <PageHead title={registerTitle} />
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (loadError || !event) {
    return <StatusPlate title={registerTitle} heading={Locale.label("mobile.screens.eventNotFound")} body={Locale.label("mobile.screens.eventNotFoundBody")} />;
  }

  const title = event.title || registerTitle;

  if (!event.registrationEnabled) {
    return <StatusPlate title={title} heading={Locale.label("mobile.screens.registrationUnavailable")} body={Locale.label("mobile.screens.registrationUnavailableBody")} />;
  }

  if (!isOpen) {
    const opensLater = event.registrationOpenDate && new Date(event.registrationOpenDate) > new Date();
    const dateLabel = opensLater
      ? Locale.label("mobile.screens.registrationOpensOn").replace("{}", DateHelper.prettyDate(new Date(event.registrationOpenDate!)))
      : Locale.label("mobile.screens.registrationHasClosed");
    return <StatusPlate title={title} heading={Locale.label("mobile.screens.registrationNotOpen")} body={dateLabel} />;
  }

  if (isFull && !event.waitlistEnabled) {
    return <StatusPlate title={title} heading={Locale.label("mobile.screens.eventIsFull")} body={Locale.label("mobile.screens.eventIsFullBody").replace("{}", String(event.capacity))} />;
  }

  const head = <PageHead title={title} lede={formatEventTime(event) || undefined} />;

  if (reg.step === "confirm" && reg.registration) {
    const waitlisted = reg.registration.status === "waitlisted";
    return (
      <Box>
        {head}
        <Plate>
          <PlateSection>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <Typography component="h2" sx={{ fontSize: 18, fontWeight: 650, color: tc.text }}>
                {waitlisted ? Locale.label("registration.waitlist.confirmedTitle") : Locale.label("registration.confirmed")}
              </Typography>
              <StatusBadge tone={waitlisted ? "warn" : "ok"} dot={!waitlisted}>
                {waitlisted ? Locale.label("mobile.registrations.statusWaitlisted") : Locale.label("mobile.registrations.statusRegistered")}
              </StatusBadge>
            </Box>
            <QuietEmpty sx={{ mt: "4px" }}>
              {waitlisted ? Locale.label("registration.waitlist.confirmedBody") : Locale.label("registration.youAreRegistered")} {event.title}
            </QuietEmpty>
            {reg.registration.totalAmount > 0 && (
              <Typography sx={{ mt: "8px", fontSize: 14, color: tc.textSecondary }}>
                {Locale.label("registration.payment.total")}: {formatMoney(reg.registration.amountPaid || 0)} / {formatMoney(reg.registration.totalAmount)}
              </Typography>
            )}
          </PlateSection>
          {reg.registration.members && reg.registration.members.length > 0 && (
            <PlateSection title={Locale.label("registration.registeredMembers")}>
              <RowList>
                {reg.registration.members.map((m: any, i: number) => <Row key={i} title={`${m.firstName} ${m.lastName}`.trim()} />)}
              </RowList>
            </PlateSection>
          )}
        </Plate>
        <Actions>
          <Button variant="contained" fullWidth onClick={handleBack}>{Locale.label("mobile.screens.done")}</Button>
        </Actions>
      </Box>
    );
  }

  const steps = ["info", "members", ...(reg.hasSelections ? ["selections"] : []), ...(event.formId ? ["questions"] : []), ...(reg.needsPayment ? ["payment"] : [])];
  const stepTitle = (name: string) => Locale.label("mobile.register.stepOf")
    .replace("{}", String(Math.max(1, steps.indexOf(reg.step) + 1)))
    .replace("{}", String(steps.length)) + " · " + name;

  const capacityLine = event.capacity ? `${activeCount} / ${event.capacity} ${Locale.label("registration.spotsWord")}` : "";
  const eventSection = (event.description || capacityLine || (isFull && event.waitlistEnabled)) ? (
    <PlateSection title={Locale.label("mobile.register.event")}>
      {event.description && <Typography sx={{ fontSize: 15, color: tc.text, whiteSpace: "pre-wrap" }}>{event.description}</Typography>}
      {capacityLine && <Typography sx={{ mt: event.description ? "8px" : 0, fontSize: 13.5, color: tc.textSecondary }}>{capacityLine}</Typography>}
      {isFull && event.waitlistEnabled && <Typography sx={{ mt: "8px", fontSize: 14, color: tc.warning }}>{Locale.label("registration.waitlist.eventFullJoin")}</Typography>}
    </PlateSection>
  ) : null;

  if (reg.step === "payment") {
    return (
      <Box>
        {head}
        <Plate>
          <PlateSection title={stepTitle(Locale.label("registration.payment.title"))}>
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
          </PlateSection>
          {eventSection}
        </Plate>
      </Box>
    );
  }

  if (reg.step === "selections") {
    return (
      <Box>
        {head}
        <Plate>
          <PlateSection title={stepTitle(Locale.label("registration.selections.title"))}>
            <RowList>
              {reg.selections.map((s) => {
                const soldOut = s.remainingCapacity != null && s.remainingCapacity <= 0;
                const qty = reg.selectionQty[s.id] || 0;
                const max = s.maxQuantity ?? 99;
                const subtitle = [
                  s.price != null && s.price > 0 ? formatMoney(s.price) : Locale.label("registration.free"),
                  s.description,
                  s.remainingCapacity != null ? Locale.label("registration.remaining").replace("{}", String(s.remainingCapacity)) : ""
                ].filter(Boolean).join(" · ");
                return (
                  <Row
                    key={s.id}
                    title={s.name}
                    subtitle={subtitle}
                    sx={{ opacity: soldOut ? 0.6 : 1 }}
                    trailing={(
                      <Box sx={{ display: "flex", alignItems: "center", gap: "4px", flex: "none" }}>
                        <IconButton size="small" aria-label={Locale.label("mobile.register.decrease")} data-testid={`sel-dec-${s.id}`} disabled={soldOut || qty <= 0} onClick={() => reg.setQuantity(s.id, qty - 1)}><RemoveIcon fontSize="small" /></IconButton>
                        <Typography data-testid={`sel-qty-${s.id}`} sx={{ minWidth: 20, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{qty}</Typography>
                        <IconButton size="small" aria-label={Locale.label("mobile.register.increase")} data-testid={`sel-add-${s.id}`} disabled={soldOut || qty >= max} onClick={() => reg.setQuantity(s.id, qty + 1)}><AddIcon fontSize="small" /></IconButton>
                      </Box>
                    )}
                  />
                );
              })}
            </RowList>
            {reg.error && errorLine(reg.error)}
          </PlateSection>
          {eventSection}
        </Plate>
        <Actions>
          <Button variant="contained" fullWidth onClick={reg.continueFromSelections} disabled={reg.isSubmitting}>{Locale.label("registration.continue")}</Button>
          <Button variant="outlined" fullWidth onClick={() => reg.setStep("members")}>{Locale.label("registration.back")}</Button>
        </Actions>
      </Box>
    );
  }

  if (reg.step === "members") {
    return (
      <Box>
        {head}
        <Plate>
          <PlateSection title={stepTitle(Locale.label("registration.additionalMembers"))}>
            <QuietEmpty sx={{ mb: "8px" }}>{Locale.label("registration.additionalMembersInfo")}</QuietEmpty>

            {reg.householdMembers.length > 0 && (
              <Box data-testid="household-members" sx={{ display: "flex", flexDirection: "column" }}>
                <FormControlLabel sx={{ minHeight: 44 }} control={<Checkbox checked disabled />} label={`${reg.primaryFirstName} ${reg.primaryLastName} (${Locale.label("registration.you")})`} />
                {reg.householdMembers.map((hm) => {
                  const checked = reg.isHouseholdMemberSelected(hm.id);
                  const selected = reg.members.find((m) => m.personId === hm.id);
                  return (
                    <Box key={hm.id}>
                      <FormControlLabel
                        sx={{ minHeight: 44 }}
                        control={<Checkbox checked={checked} onChange={() => reg.toggleHouseholdMember(hm)} data-testid={`household-member-${hm.id}`} />}
                        label={`${hm.firstName} ${hm.lastName}`.trim()}
                      />
                      {checked && reg.hasTypes && (
                        <Select fullWidth size="small" displayEmpty value={selected?.registrationTypeId || ""} onChange={(e) => reg.updateMember(reg.members.indexOf(selected!), "registrationTypeId", e.target.value)} data-testid={`household-type-${hm.id}`} sx={{ mb: 1 }}>
                          <MenuItem value="" disabled>{Locale.label("registration.selectType")}</MenuItem>
                          {reg.types.map((t) => (<MenuItem key={t.id} value={t.id} disabled={typeDisabled(t)}>{typeLabel(t)}</MenuItem>))}
                        </Select>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            {reg.members.length === 0 && reg.householdMembers.length === 0 && (
              <QuietEmpty sx={{ mb: "8px" }}>{Locale.label("registration.noAdditional")}</QuietEmpty>
            )}

            {reg.members.map((member, idx) => (member.personId ? null : (
              <Box key={idx} sx={{ mt: "12px" }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
                    <TextField label={Locale.label("person.firstName")} value={member.firstName} onChange={(e) => reg.updateMember(idx, "firstName", e.target.value)} size="small" fullWidth />
                    <TextField label={Locale.label("person.lastName")} value={member.lastName} onChange={(e) => reg.updateMember(idx, "lastName", e.target.value)} size="small" fullWidth />
                  </Box>
                  <IconButton aria-label={Locale.label("mobile.screens.removeMember")} onClick={() => reg.removeMember(idx)} size="small"><CloseIcon fontSize="small" /></IconButton>
                </Box>
                {reg.hasTypes && (
                  <Select fullWidth size="small" displayEmpty value={member.registrationTypeId || ""} onChange={(e) => reg.updateMember(idx, "registrationTypeId", e.target.value)} data-testid={`member-type-${idx}`} sx={{ mt: 1 }}>
                    <MenuItem value="" disabled>{Locale.label("registration.selectType")}</MenuItem>
                    {reg.types.map((t) => (<MenuItem key={t.id} value={t.id} disabled={typeDisabled(t)}>{typeLabel(t)}</MenuItem>))}
                  </Select>
                )}
              </Box>
            )))}

            <Box sx={{ mt: "12px" }}>
              <TextLink onClick={reg.addMember} disabled={reg.members.length >= 10}><PersonAddIcon sx={{ fontSize: 18 }} />{Locale.label("registration.addMember")}</TextLink>
            </Box>
            {reg.error && errorLine(reg.error)}
          </PlateSection>
          {eventSection}
        </Plate>
        <Actions>
          <Button variant="contained" fullWidth onClick={reg.continueFromMembers} disabled={reg.isSubmitting} startIcon={reg.isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {reg.isSubmitting ? Locale.label("registration.registering")
              : (reg.hasSelections || reg.needsPayment) ? Locale.label("registration.continue")
                : Locale.label("registration.completeRegistration")}
          </Button>
          <Button variant="outlined" fullWidth onClick={() => reg.setStep("info")}>{Locale.label("registration.back")}</Button>
        </Actions>
      </Box>
    );
  }

  if (reg.step === "questions") {
    return (
      <Box>
        {head}
        <Plate>
          <PlateSection title={stepTitle(Locale.label("registration.questions"))}>
            {reg.error && errorLine(reg.error)}
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
          </PlateSection>
          {eventSection}
        </Plate>
      </Box>
    );
  }

  return (
    <Box>
      {head}
      <Plate>
        <PlateSection title={stepTitle(isLoggedIn ? Locale.label("registration.registeringAs") : Locale.label("registration.yourInformation"))}>
          {isLoggedIn ? (
            <Row
              leading={(
                <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: tc.chip, color: tc.onChip, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 15, flex: "none" }}>
                  {(personName.charAt(0) || "?").toUpperCase()}
                </Box>
              )}
              title={personName || Locale.label("registration.you")}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField label={Locale.label("person.firstName")} value={reg.guestFirstName} onChange={(e) => reg.setGuestFirstName(e.target.value)} fullWidth />
                <TextField label={Locale.label("person.lastName")} value={reg.guestLastName} onChange={(e) => reg.setGuestLastName(e.target.value)} fullWidth />
              </Box>
              <TextField label={Locale.label("person.email")} type="email" autoComplete="email" value={reg.guestEmail} onChange={(e) => reg.setGuestEmail(e.target.value)} fullWidth />
              <TextField label={Locale.label("mobile.screens.phoneOptional")} type="tel" autoComplete="tel" value={reg.guestPhone} onChange={(e) => reg.setGuestPhone(e.target.value)} fullWidth />
            </Box>
          )}
          {reg.hasTypes && (
            <Box sx={{ mt: "16px" }}>
              <Typography component="label" sx={{ display: "block", fontSize: 14, fontWeight: 500, color: tc.text, mb: "6px" }}>{Locale.label("registration.yourType")}</Typography>
              <Select fullWidth displayEmpty value={reg.primaryTypeId} onChange={(e) => reg.setPrimaryTypeId(e.target.value)} data-testid="primary-type">
                <MenuItem value="" disabled>{Locale.label("registration.selectType")}</MenuItem>
                {reg.types.map((t) => (<MenuItem key={t.id} value={t.id} disabled={typeDisabled(t)}>{typeLabel(t)}</MenuItem>))}
              </Select>
            </Box>
          )}
          {reg.error && errorLine(reg.error)}
        </PlateSection>
        {eventSection}
      </Plate>
      <Actions>
        <Button variant="contained" fullWidth onClick={reg.continueFromInfo}>{Locale.label("registration.continue")}</Button>
      </Actions>
    </Box>
  );
};
