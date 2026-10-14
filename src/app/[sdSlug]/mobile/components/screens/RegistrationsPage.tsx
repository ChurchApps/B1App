"use client";

import React, { Suspense, useContext, useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Icon, IconButton, MenuItem, Select, Skeleton, TextField, Typography } from "@mui/material";
import { ApiHelper, DateHelper, Locale, UserHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RegistrationInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { BackVerb, PageHead, Plate, PlateSection, QuietEmpty, Row, Sheet, StatusBadge, TextLink, useSliceView, type BadgeTone } from "../kit";
import { apiPut, formatMoney, type RegType, type RegSelection } from "@/components/registration/useEventRegistration";
import { RegistrationPaymentForm } from "@/components/registration/RegistrationPaymentForm";

interface Props {
  config: ConfigurationInterface;
}

const tc = mobileTheme.colors;
const num = (v: any): number => (v == null || isNaN(Number(v)) ? 0 : Number(v));
const balanceOf = (reg: RegistrationInterface) => Math.round((num((reg as any).totalAmount) - num((reg as any).amountPaid)) * 100) / 100;

const statusBadge = (status?: string): [BadgeTone, string] => {
  switch (status) {
    case "pending": return ["warn", Locale.label("mobile.registrations.statusPending")];
    case "waitlisted": return ["pri", Locale.label("mobile.registrations.statusWaitlisted")];
    case "cancelled": return ["bad", Locale.label("mobile.registrations.statusCancelled")];
    default: return ["ok", Locale.label("mobile.registrations.statusRegistered")];
  }
};

const RegistrationsPageInner = ({ config: _config }: Props) => {
  const context = useContext(UserContext);
  const personId = context?.person?.id || context?.userChurch?.person?.id || UserHelper.currentUserChurch?.person?.id;
  const churchId = _config?.church?.id || "";
  const queryClient = useQueryClient();
  const [view] = useSliceView();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [payReg, setPayReg] = useState<RegistrationInterface | null>(null);
  const [editReg, setEditReg] = useState<RegistrationInterface | null>(null);

  const { data: registrations = null } = useQuery<RegistrationInterface[]>({
    queryKey: ["registrations", personId],
    queryFn: async () => {
      const data = await ApiHelper.get("/registrations/person/" + personId, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!personId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["registrations", personId] });

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelError("");
    try {
      await ApiHelper.post("/registrations/" + cancelId + "/cancel", {}, "ContentApi");
      setCancelId(null);
      refetch();
    } catch {
      setCancelError(Locale.label("mobile.screens.unableToSaveChanges"));
    }
  };

  const renderItem = (reg: RegistrationInterface) => {
    const isCancelled = reg.status === "cancelled";
    const eventStart = (reg as any).event?.start;
    const eventTitle = (reg as any).event?.title || "Event";
    const total = num((reg as any).totalAmount);
    const paid = num((reg as any).amountPaid);
    const balance = balanceOf(reg);
    const hasBalance = !isCancelled && reg.status !== "waitlisted" && balance > 0;
    const names = (reg.members || []).map((m: any) => [m.firstName, m.lastName].filter(Boolean).join(" ")).filter(Boolean).join(", ");
    const subtitle = [eventStart ? DateHelper.prettyDateTime(new Date(eventStart)) : "", names].filter(Boolean).join(" · ");
    const [tone, label]: [BadgeTone, string] = hasBalance ? ["warn", Locale.label("registration.mine.balanceLabel")] : statusBadge(reg.status);

    return (
      <Box key={reg.id} className="reg-item" sx={{ py: "6px" }}>
        <Row title={eventTitle} subtitle={subtitle || undefined} trailing={<StatusBadge tone={tone} dot={tone === "ok"}>{label}</StatusBadge>} />
        {!isCancelled && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", pb: "10px" }}>
            {hasBalance && (
              <>
                <Typography sx={{ fontSize: 15, color: tc.text }}>
                  {Locale.label("mobile.registrations.balanceOf").replace("{}", formatMoney(balance)).replace("{}", formatMoney(total))}
                </Typography>
                <Box><Button size="small" variant="contained" onClick={() => setPayReg(reg)}>{Locale.label("registration.mine.completePayment")}</Button></Box>
              </>
            )}
            {!hasBalance && total > 0 && (
              <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>{`${Locale.label("registration.payment.total")}: ${formatMoney(paid)} / ${formatMoney(total)}`}</Typography>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <TextLink onClick={() => setEditReg(reg)}>{Locale.label("registration.mine.edit")}</TextLink>
              <TextLink danger onClick={() => setCancelId(reg.id || null)}>{Locale.label("registration.mine.cancel")}</TextLink>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const list = (items: RegistrationInterface[]) => (
    <Box sx={{ "& > .reg-item + .reg-item": { borderTop: `1px solid ${tc.border}` } }}>{items.map(renderItem)}</Box>
  );

  const now = Date.now();
  const isPast = (reg: RegistrationInterface) => {
    const start = (reg as any).event?.start;
    return !!start && new Date(start).getTime() < now;
  };
  const byCancelledLast = (a: RegistrationInterface, b: RegistrationInterface) => (a.status === "cancelled" ? 1 : 0) - (b.status === "cancelled" ? 1 : 0);
  const upcoming = registrations ? registrations.filter((r) => !isPast(r)).sort(byCancelledLast) : null;
  const past = registrations ? registrations.filter(isPast).sort(byCancelledLast) : [];

  const dialogs = (
    <>
      <Dialog open={!!cancelId} onClose={() => { setCancelId(null); setCancelError(""); }}>
        <DialogTitle>{Locale.label("mobile.screens.cancelRegistration")}</DialogTitle>
        <DialogContent>
          {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
          <DialogContentText>{Locale.label("registration.mine.cancelConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { setCancelId(null); setCancelError(""); }}>{Locale.label("mobile.screens.keep")}</Button>
          <Button onClick={handleCancel} variant="contained" color="error">{Locale.label("registration.mine.cancel")}</Button>
        </DialogActions>
      </Dialog>

      <Sheet open={!!payReg} onClose={() => setPayReg(null)} title={Locale.label("registration.mine.completePayment")}>
        {payReg && (
          <RegistrationPaymentForm
            churchId={churchId}
            personId={personId}
            personEmail={context?.person?.contactInfo?.email}
            personName={context?.person?.name?.display}
            amount={balanceOf(payReg)}
            currency={((payReg as any).event?.currency) as any}
            summaryLines={[{ label: Locale.label("registration.mine.balanceLabel"), amount: balanceOf(payReg) }]}
            subtotal={balanceOf(payReg)}
            discountAmount={0}
            couponCode=""
            setCouponCode={() => { /* n/a */ }}
            appliedCoupon={null}
            couponError=""
            applyCoupon={() => { /* n/a */ }}
            removeCoupon={() => { /* n/a */ }}
            hideCoupon
            onPay={(p) => ApiHelper.post("/registrations/" + payReg.id + "/pay", p, "ContentApi")}
            onFinalized={() => { setPayReg(null); refetch(); }}
            onBack={() => setPayReg(null)}
          />
        )}
      </Sheet>

      {editReg && (
        <EditRegistrationDialog
          registration={editReg}
          churchId={churchId}
          onClose={() => setEditReg(null)}
          onSaved={() => { setEditReg(null); refetch(); }}
        />
      )}
    </>
  );

  if (view === "past") {
    return (
      <Box>
        <BackVerb label={Locale.label("mobile.registrations.backToRegistrations")} href="/mobile/registrations" />
        <PageHead title={Locale.label("mobile.screens.tabPast")} />
        <Plate>
          <PlateSection>
            {past.length === 0 ? <QuietEmpty>{Locale.label("mobile.registrations.noPast")}</QuietEmpty> : list(past)}
          </PlateSection>
        </Plate>
        {dialogs}
      </Box>
    );
  }

  return (
    <Box>
      <PageHead title={Locale.label("mobile.screenTitles.registrations")} lede={Locale.label("mobile.registrations.lede")} />
      <Plate>
        <PlateSection title={Locale.label("mobile.screens.tabUpcoming")}>
          {upcoming === null && [0, 1].map((i) => (
            <Box key={i} sx={{ py: "8px" }}>
              <Skeleton variant="text" width="60%" height={22} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          ))}
          {upcoming !== null && upcoming.length === 0 && (
            <QuietEmpty>{registrations?.length ? Locale.label("mobile.registrations.noUpcoming") : Locale.label("registration.mine.emptyBody")}</QuietEmpty>
          )}
          {upcoming !== null && upcoming.length > 0 && list(upcoming)}
        </PlateSection>
        {past.length > 0 && (
          <PlateSection
            title={Locale.label("mobile.screens.tabPast")}
            action={past.length > 3 && <TextLink href="/mobile/registrations?view=past">{Locale.label("mobile.registrations.allPast")}</TextLink>}
          >
            {list(past.slice(0, 3))}
          </PlateSection>
        )}
      </Plate>
      {dialogs}
    </Box>
  );
};

export const RegistrationsPage = (props: Props) => (
  <Suspense>
    <RegistrationsPageInner {...props} />
  </Suspense>
);

interface EditProps {
  registration: RegistrationInterface;
  churchId: string;
  onClose: () => void;
  onSaved: () => void;
}

const EditRegistrationDialog = ({ registration, churchId, onClose, onSaved }: EditProps) => {
  const eventId = (registration as any).eventId;
  const [members, setMembers] = useState<{ firstName: string; lastName: string; registrationTypeId?: string }[]>([]);
  const [types, setTypes] = useState<RegType[]>([]);
  const [selections, setSelections] = useState<RegSelection[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [full, t, s]: any[] = await Promise.all([
        ApiHelper.get("/registrations/" + registration.id, "ContentApi"),
        ApiHelper.getAnonymous("/registrations/types/event/" + eventId + "?churchId=" + churchId, "ContentApi"),
        ApiHelper.getAnonymous("/registrations/selections/event/" + eventId + "?churchId=" + churchId, "ContentApi")
      ]);
      setTypes(Array.isArray(t) ? t : []);
      setSelections(Array.isArray(s) ? s : []);
      setMembers((full?.members || []).map((m: any) => ({ firstName: m.firstName, lastName: m.lastName, registrationTypeId: m.registrationTypeId || "" })));
      const q: Record<string, number> = {};
      for (const c of (full?.selectionChoices || [])) q[c.selectionId] = (q[c.selectionId] || 0) + num(c.quantity);
      setQty(q);
    })().catch(() => setError(Locale.label("registration.errors.registrationFailed")));
  }, [registration.id, eventId, churchId]);

  const hasTypes = types.length > 0;

  const updateMember = (i: number, field: string, value: string) => {
    const next = [...members];
    (next[i] as any)[field] = value;
    setMembers(next);
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const body: any = {
        members: members.map((m) => ({ firstName: m.firstName.trim(), lastName: m.lastName.trim(), registrationTypeId: m.registrationTypeId || undefined })),
        selections: Object.entries(qty).filter(([, q]) => q > 0).map(([selectionId, quantity]) => ({ selectionId, quantity }))
      };
      const result: any = await apiPut("/registrations/" + registration.id, body, "ContentApi");
      if (result?.error) {
        setError(result.status === "type-full" ? Locale.label("registration.errors.typeFull") : result.status === "selection-full" ? Locale.label("registration.errors.selectionFull") : result.error);
        return;
      }
      onSaved();
    } catch {
      setError(Locale.label("registration.errors.registrationFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={Locale.label("registration.mine.editTitle")}
      actions={(
        <>
          <Button variant="outlined" onClick={onClose}>{Locale.label("registration.back")}</Button>
          <Button variant="contained" onClick={save} disabled={saving} data-testid="edit-save">{Locale.label("common.save")}</Button>
        </>
      )}
    >
      <>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {members.map((m, i) => (
          <Box key={i} sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField label={Locale.label("person.firstName")} value={m.firstName} onChange={(e) => updateMember(i, "firstName", e.target.value)} size="small" fullWidth />
              <TextField label={Locale.label("person.lastName")} value={m.lastName} onChange={(e) => updateMember(i, "lastName", e.target.value)} size="small" fullWidth />
            </Box>
            {hasTypes && (
              <Select fullWidth size="small" displayEmpty value={m.registrationTypeId || ""} onChange={(e) => updateMember(i, "registrationTypeId", e.target.value)} data-testid={`edit-member-type-${i}`} sx={{ mt: 1 }}>
                <MenuItem value="" disabled>{Locale.label("registration.selectType")}</MenuItem>
                {types.map((t) => (<MenuItem key={t.id} value={t.id}>{t.name}{t.price != null && t.price > 0 ? ` (${formatMoney(t.price)})` : ""}</MenuItem>))}
              </Select>
            )}
          </Box>
        ))}

        {selections.length > 0 && (
          <>
            <Typography sx={{ fontWeight: 600, mt: 2, mb: 1 }}>{Locale.label("registration.selections.title")}</Typography>
            {selections.map((s) => {
              const q = qty[s.id] || 0;
              const max = s.maxQuantity ?? 99;
              return (
                <Box key={s.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">{s.name}{s.price != null && s.price > 0 ? ` (${formatMoney(s.price)})` : ""}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton size="small" data-testid={`edit-sel-dec-${s.id}`} disabled={q <= 0} onClick={() => setQty({ ...qty, [s.id]: Math.max(0, q - 1) })}><Icon>remove</Icon></IconButton>
                    <Typography data-testid={`edit-sel-qty-${s.id}`}>{q}</Typography>
                    <IconButton size="small" data-testid={`edit-sel-add-${s.id}`} disabled={q >= max} onClick={() => setQty({ ...qty, [s.id]: q + 1 })}><Icon>add</Icon></IconButton>
                  </Box>
                </Box>
              );
            })}
          </>
        )}
      </>
    </Sheet>
  );
};
