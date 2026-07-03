"use client";

import React, { useContext, useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Icon, IconButton, MenuItem, Select, Skeleton, TextField, Typography } from "@mui/material";
import { ApiHelper, DateHelper, Locale, UserHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RegistrationInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { apiPut, formatMoney, type RegType, type RegSelection } from "@/components/registration/useEventRegistration";
import { RegistrationPaymentForm } from "@/components/registration/RegistrationPaymentForm";

interface Props {
  config: ConfigurationInterface;
}

const num = (v: any): number => (v == null || isNaN(Number(v)) ? 0 : Number(v));

export const RegistrationsPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const personId = context?.person?.id || context?.userChurch?.person?.id || UserHelper.currentUserChurch?.person?.id;
  const churchId = _config?.church?.id || "";
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);
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
    await ApiHelper.post("/registrations/" + cancelId + "/cancel", {}, "ContentApi");
    setCancelId(null);
    refetch();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "confirmed": return tc.success;
      case "pending": return tc.warning;
      case "waitlisted": return tc.primary;
      case "cancelled": return tc.error;
      default: return tc.textSecondary;
    }
  };

  const renderSkeleton = (i: number) => (
    <Box key={`sk-${i}`} sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.md}px` }}>
      <Skeleton variant="text" width="60%" height={22} />
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="rounded" width={100} height={32} sx={{ mt: 1 }} />
    </Box>
  );

  const renderEmpty = () => (
    <Box sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.xl}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.lg}px`, textAlign: "center" }}>
      <Box sx={{ width: 64, height: 64, borderRadius: "32px", bgcolor: tc.iconBackground, display: "inline-flex", alignItems: "center", justifyContent: "center", mb: `${mobileTheme.spacing.md}px` }}>
        <Icon sx={{ fontSize: 32, color: tc.primary }}>event_available</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>{Locale.label("registration.mine.emptyTitle")}</Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>{Locale.label("registration.mine.emptyBody")}</Typography>
    </Box>
  );

  const renderCard = (reg: RegistrationInterface) => {
    const isCancelled = reg.status === "cancelled";
    const statusColor = getStatusColor(reg.status);
    const eventStart = (reg as any).event?.start;
    const eventTitle = (reg as any).event?.title || "Event";
    const total = num((reg as any).totalAmount);
    const paid = num((reg as any).amountPaid);
    const balance = Math.round((total - paid) * 100) / 100;
    const hasBalance = !isCancelled && reg.status !== "waitlisted" && balance > 0;

    return (
      <Box key={reg.id} sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.md}px`, opacity: isCancelled ? 0.65 : 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.25 }}>{eventTitle}</Typography>
            {eventStart && (
              <Typography sx={{ fontSize: 13, color: tc.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
                <Icon sx={{ fontSize: 14 }}>schedule</Icon>
                {DateHelper.prettyDateTime(new Date(eventStart))}
              </Typography>
            )}
          </Box>
          <Box sx={{ px: 1, py: 0.25, borderRadius: "999px", bgcolor: `${statusColor}1A`, color: statusColor, fontSize: 11, fontWeight: 600, textTransform: "capitalize", whiteSpace: "nowrap" }}>
            {reg.status || "registered"}
          </Box>
        </Box>

        {reg.members && reg.members.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: tc.text, mb: 0.25 }}>{Locale.label("registration.registeredMembers")}:</Typography>
            {reg.members.map((m: any, i: number) => (
              <Typography key={i} sx={{ fontSize: 13, color: tc.textSecondary }}>{m.firstName} {m.lastName}</Typography>
            ))}
          </Box>
        )}

        {total > 0 && !isCancelled && (
          <Typography sx={{ fontSize: 13, color: hasBalance ? tc.warning : tc.textSecondary, mt: 1, fontWeight: hasBalance ? 600 : 400 }}>
            {hasBalance
              ? Locale.label("registration.mine.balanceDue").replace("{}", formatMoney(balance))
              : `${Locale.label("registration.payment.total")}: ${formatMoney(paid)} / ${formatMoney(total)}`}
          </Typography>
        )}

        {(reg as any).registeredDate && (
          <Typography sx={{ fontSize: 12, color: tc.textMuted, mt: 1 }}>{Locale.label("registration.mine.registered")}: {DateHelper.prettyDate(new Date((reg as any).registeredDate))}</Typography>
        )}

        {!isCancelled && (
          <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
            {hasBalance && (
              <Button size="small" variant="contained" onClick={() => setPayReg(reg)} sx={{ bgcolor: tc.primary, color: tc.onPrimary, textTransform: "none", fontWeight: 600, borderRadius: `${mobileTheme.radius.md}px`, "&:hover": { bgcolor: tc.primary } }} startIcon={<Icon>payment</Icon>}>
                {Locale.label("registration.mine.completePayment")}
              </Button>
            )}
            <Button size="small" onClick={() => setEditReg(reg)} sx={{ color: tc.primary, textTransform: "none", fontWeight: 500, borderRadius: `${mobileTheme.radius.md}px` }} startIcon={<Icon>edit</Icon>}>
              {Locale.label("registration.mine.edit")}
            </Button>
            <Button size="small" onClick={() => setCancelId(reg.id || null)} sx={{ color: tc.error, textTransform: "none", fontWeight: 500, borderRadius: `${mobileTheme.radius.md}px` }} startIcon={<Icon>cancel</Icon>}>
              {Locale.label("registration.mine.cancel")}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  const sortedRegistrations = registrations
    ? [...registrations].sort((a, b) => (a.status === "cancelled" ? 1 : 0) - (b.status === "cancelled" ? 1 : 0))
    : null;

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {sortedRegistrations === null && [0, 1].map(renderSkeleton)}
        {sortedRegistrations !== null && sortedRegistrations.length === 0 && renderEmpty()}
        {sortedRegistrations !== null && sortedRegistrations.length > 0 && sortedRegistrations.map(renderCard)}
      </Box>

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)}>
        <DialogTitle>{Locale.label("mobile.screens.cancelRegistration")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{Locale.label("registration.mine.cancelConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelId(null)}>{Locale.label("mobile.screens.keep")}</Button>
          <Button onClick={handleCancel} variant="contained" sx={{ bgcolor: tc.error, color: tc.onPrimary, textTransform: "none", "&:hover": { bgcolor: tc.error } }}>
            {Locale.label("registration.mine.cancel")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!payReg} onClose={() => setPayReg(null)} fullWidth maxWidth="sm">
        <DialogContent>
          {payReg && (
            <RegistrationPaymentForm
              churchId={churchId}
              personId={personId}
              personEmail={context?.person?.contactInfo?.email}
              personName={context?.person?.name?.display}
              amount={Math.round((num((payReg as any).totalAmount) - num((payReg as any).amountPaid)) * 100) / 100}
              currency={((payReg as any).event?.currency) as any}
              summaryLines={[{ label: Locale.label("registration.mine.balanceLabel"), amount: Math.round((num((payReg as any).totalAmount) - num((payReg as any).amountPaid)) * 100) / 100 }]}
              subtotal={Math.round((num((payReg as any).totalAmount) - num((payReg as any).amountPaid)) * 100) / 100}
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
        </DialogContent>
      </Dialog>

      {editReg && (
        <EditRegistrationDialog
          registration={editReg}
          churchId={churchId}
          onClose={() => setEditReg(null)}
          onSaved={() => { setEditReg(null); refetch(); }}
        />
      )}
    </Box>
  );
};

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
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{Locale.label("registration.mine.editTitle")}</DialogTitle>
      <DialogContent>
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
            <Typography sx={{ fontWeight: 700, mt: 2, mb: 1 }}>{Locale.label("registration.selections.title")}</Typography>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{Locale.label("registration.back")}</Button>
        <Button variant="contained" onClick={save} disabled={saving} data-testid="edit-save">{Locale.label("common.save")}</Button>
      </DialogActions>
    </Dialog>
  );
};
