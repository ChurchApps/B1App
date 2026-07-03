"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Divider, Icon, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { loadStripe } from "@stripe/stripe-js";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { getPaymentProvider, useStripeInstance } from "@churchapps/apphelper/donations";
import type { MemberEntryHandle, PaymentGateway } from "@churchapps/apphelper/donations";
import { formatMoney, type RegistrationPayment } from "./useEventRegistration";

interface SavedMethod {
  id: string;
  type: string;
  provider: string;
  name?: string;
  last4?: string;
  customerId?: string;
}

interface Props {
  churchId: string;
  personId?: string;
  personEmail?: string;
  personName?: string;
  amount: number;
  currency?: string;
  summaryLines: { label: string; amount: number }[];
  subtotal: number;
  discountAmount: number;
  couponCode: string;
  setCouponCode: (v: string) => void;
  appliedCoupon: { code: string; discountType: string; value: number } | null;
  couponError: string;
  applyCoupon: () => void;
  removeCoupon: () => void;
  onPay: (payment: RegistrationPayment) => Promise<any>;
  onFinalized: (result: any) => void;
  onBack: () => void;
  hideCoupon?: boolean;
}

// Runs inside provider context so Stripe instance is available for 3DS finalize.
const PaymentEntry: React.FC<{
  provider: any;
  gateway: PaymentGateway;
  churchId: string;
  personId?: string;
  personEmail?: string;
  personName?: string;
  amount: number;
  currency?: string;
  savedMethods: SavedMethod[];
  onPay: (payment: RegistrationPayment) => Promise<any>;
  onFinalized: (result: any) => void;
}> = ({ provider, gateway, churchId, personId, personEmail, personName, amount, currency, savedMethods, onPay, onFinalized }) => {
  const stripe = useStripeInstance();
  const entryRef = useRef<MemberEntryHandle>(null);
  const hasSaved = savedMethods.length > 0;
  const [selectedMethod, setSelectedMethod] = useState<string>(hasSaved ? savedMethods[0].id : "new");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const useNew = selectedMethod === "new" || !hasSaved;

  const getContext = (): {
    provider: string;
    gatewayId?: string;
    churchId: string;
    amount: number;
    funds: { id: string; amount: number }[];
    person: { id?: string; email?: string; name?: string };
    currency?: string;
  } => ({
    provider: provider.key,
    gatewayId: gateway?.id,
    churchId,
    amount,
    funds: [],
    person: { id: personId, email: personEmail, name: personName },
    currency
  });

  const handlePay = async () => {
    setError("");
    setProcessing(true);
    try {
      let payment: RegistrationPayment;
      if (useNew) {
        if (!entryRef.current) throw new Error(Locale.label("registration.payment.cardNotReady"));
        const token = await entryRef.current.tokenize();
        // Gateways read method id from token/id; customerId scopes saved method; paymentMethodId for KF numeric-id path.
        payment = { provider: provider.key, gatewayId: gateway?.id, token: token.id, customerId: token.customerId, paymentMethodId: token.id, type: token.type };
      } else {
        const m = savedMethods.find((s) => s.id === selectedMethod);
        payment = { provider: m?.provider || provider.key, gatewayId: gateway?.id, token: m?.id, customerId: m?.customerId, paymentMethodId: m?.id, type: m?.type || "card" };
      }
      const result = await onPay(payment);
      if (result?.error) {
        setError(result.error);
        return;
      }
      // 3DS finalize (Stripe). Test cards 4242 never require this.
      if (result?.payment && result?.status === "pending" && provider.finalizeResult) {
        const fin = await provider.finalizeResult(result.payment, { stripe });
        if (fin?.requiresAction && !fin?.success) {
          setError(fin.error || Locale.label("registration.payment.authFailed"));
          return;
        }
      }
      onFinalized(result);
    } catch (e: any) {
      setError(e?.message || Locale.label("registration.errors.registrationFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const MemberEntry = provider.MemberEntry;

  return (
    <Box>
      {hasSaved && (
        <Select
          fullWidth
          size="small"
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          data-testid="reg-payment-method-select"
          sx={{ mb: 2 }}
        >
          {savedMethods.map((m) => (
            <MenuItem key={m.id} value={m.id}>{m.name || m.type} {m.last4 ? `••••${m.last4}` : ""}</MenuItem>
          ))}
          <MenuItem value="new">{Locale.label("registration.payment.newCard")}</MenuItem>
        </Select>
      )}

      {useNew && MemberEntry && (
        <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 2 }}>
          <MemberEntry ref={entryRef} gateway={gateway} getContext={getContext} />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handlePay}
        disabled={processing}
        data-testid="reg-pay-button"
        startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <Icon>lock</Icon>}
      >
        {processing ? Locale.label("registration.registering") : Locale.label("registration.payment.payAndRegister").replace("{}", formatMoney(amount))}
      </Button>
    </Box>
  );
};

export const RegistrationPaymentForm: React.FC<Props> = (props) => {
  const { churchId, personId, amount, summaryLines, subtotal, discountAmount, appliedCoupon } = props;
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  const [savedMethods, setSavedMethods] = useState<SavedMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp: any = await ApiHelper.getAnonymous("/donate/gateways/" + churchId, "GivingApi");
        const list: PaymentGateway[] = Array.isArray(resp) ? resp : resp?.gateways || [];
        const gw = list.find((g: any) => g.enabled !== false) || list[0] || null;
        if (!active) return;
        setGateway(gw);
        if (gw && personId) {
          const prov = getPaymentProvider((gw as any).provider);
          if (prov.capabilities.savedCard) {
            try {
              const methods: any = await ApiHelper.get("/paymentmethods/personid/" + personId, "GivingApi");
              if (active) setSavedMethods(Array.isArray(methods) ? methods : []);
            } catch { /* no saved methods */ }
          }
        }
      } catch (e: any) {
        if (active) setLoadError(e?.message || Locale.label("registration.payment.noGateway"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [churchId, personId]);

  const provider = useMemo(() => (gateway ? getPaymentProvider((gateway as any).provider) : null), [gateway]);
  const stripePromise = useMemo(
    () => (gateway && (gateway as any).publicKey ? loadStripe((gateway as any).publicKey) : null),
    [gateway]
  );

  const summary = (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{Locale.label("registration.payment.orderSummary")}</Typography>
      <Stack spacing={0.5}>
        {summaryLines.map((l, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2">{l.label}</Typography>
            <Typography variant="body2">{formatMoney(l.amount)}</Typography>
          </Box>
        ))}
        {appliedCoupon && (
          <Box sx={{ display: "flex", justifyContent: "space-between", color: "success.main" }}>
            <Typography variant="body2">{Locale.label("registration.payment.discount")} ({appliedCoupon.code})</Typography>
            <Typography variant="body2">-{formatMoney(discountAmount)}</Typography>
          </Box>
        )}
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>{Locale.label("registration.payment.total")}</Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }} data-testid="reg-total">{formatMoney(amount)}</Typography>
        </Box>
      </Stack>
    </Box>
  );

  const couponField = (
    <Box sx={{ mb: 2 }}>
      {appliedCoupon ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "success.main" }}>
            {Locale.label("registration.coupon.applied").replace("{}", appliedCoupon.code)}
          </Typography>
          <Button size="small" onClick={props.removeCoupon}>{Locale.label("registration.coupon.remove")}</Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            label={Locale.label("registration.coupon.label")}
            value={props.couponCode}
            onChange={(e) => props.setCouponCode(e.target.value)}
            data-testid="reg-coupon-input"
            fullWidth
          />
          <Button variant="outlined" onClick={props.applyCoupon} data-testid="reg-coupon-apply">{Locale.label("registration.coupon.apply")}</Button>
        </Box>
      )}
      {props.couponError && <Typography variant="caption" sx={{ color: "error.main" }}>{props.couponError}</Typography>}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{Locale.label("registration.payment.title")}</Typography>
      {summary}
      {!props.hideCoupon && couponField}
      {loading && <Box sx={{ textAlign: "center", py: 3 }}><CircularProgress size={28} /></Box>}
      {!loading && loadError && <Alert severity="error">{loadError}</Alert>}
      {!loading && !loadError && gateway && provider && (
        provider.MemberWrapper ? (
          <provider.MemberWrapper stripePromise={stripePromise}>
            <PaymentEntry
              provider={provider}
              gateway={gateway}
              churchId={churchId}
              personId={personId}
              personEmail={props.personEmail}
              personName={props.personName}
              amount={amount}
              currency={props.currency}
              savedMethods={savedMethods}
              onPay={props.onPay}
              onFinalized={props.onFinalized}
            />
          </provider.MemberWrapper>
        ) : (
          <PaymentEntry
            provider={provider}
            gateway={gateway}
            churchId={churchId}
            personId={personId}
            personEmail={props.personEmail}
            personName={props.personName}
            amount={amount}
            currency={props.currency}
            savedMethods={savedMethods}
            onPay={props.onPay}
            onFinalized={props.onFinalized}
          />
        )
      )}
      <Button sx={{ mt: 2 }} onClick={props.onBack}>{Locale.label("registration.back")}</Button>
      <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
        {formatMoney(subtotal)} {Locale.label("registration.payment.subtotalNote")}
      </Typography>
    </Box>
  );
};

