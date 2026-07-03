"use client";
import { useEffect, useMemo, useState } from "react";
import { ApiHelper, Locale } from "@churchapps/apphelper";

// Local casts — the Wave-1 helpers interfaces are not published yet.
export interface RegType {
  id: string;
  name: string;
  description?: string;
  price: number | null;
  capacity: number | null;
  remainingCapacity: number | null;
  sort?: number;
  active?: boolean;
}

export interface RegSelection {
  id: string;
  name: string;
  description?: string;
  price: number | null;
  maxQuantity: number | null;
  remainingCapacity: number | null;
  sort?: number;
  active?: boolean;
}

export interface AppliedCoupon {
  code: string;
  discountType: "percent" | "amount";
  value: number;
}

export interface RegistrationPayment {
  provider?: string;
  gatewayId?: string;
  token?: string;
  customerId?: string;
  paymentMethodId?: string;
  type?: string;
  currency?: string;
}

export interface WizardMember {
  firstName: string;
  lastName: string;
  registrationTypeId?: string;
}

export type RegStep = "info" | "members" | "selections" | "questions" | "payment" | "confirm";

export interface WizardPerson {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface Params {
  churchId: string;
  eventId: string;
  event: any;
  isLoggedIn: boolean;
  person?: WizardPerson;
}

export const formatMoney = (n: number): string => "$" + (Number(n) || 0).toFixed(2);

// ApiHelper exposes no PUT; compose one from its config + fetch wrapper.
export const apiPut = (path: string, data: any, apiName: string): Promise<any> => {
  const config = (ApiHelper as any).getConfig(apiName);
  return (ApiHelper as any).fetchWithErrorHandling(config.url + path, {
    method: "PUT",
    headers: { Authorization: "Bearer " + config.jwt, "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
};

const num = (v: any): number => (v == null || isNaN(Number(v)) ? 0 : Number(v));

export function useEventRegistration({ churchId, eventId, event, isLoggedIn, person }: Params) {
  const [types, setTypes] = useState<RegType[]>([]);
  const [selections, setSelections] = useState<RegSelection[]>([]);

  const [step, setStep] = useState<RegStep>("info");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [primaryTypeId, setPrimaryTypeId] = useState<string>("");
  const [members, setMembers] = useState<WizardMember[]>([]);
  const [selectionQty, setSelectionQty] = useState<Record<string, number>>({});
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registration, setRegistration] = useState<any>(null);
  const [unRestrictedFormId, setUnRestrictedFormId] = useState("");
  const [formSubmissionId, setFormSubmissionId] = useState<string | undefined>(undefined);
  const [atCapacity, setAtCapacity] = useState(false);

  useEffect(() => {
    if (!churchId || !eventId) return;
    ApiHelper.getAnonymous("/registrations/types/event/" + eventId + "?churchId=" + churchId, "ContentApi")
      .then((data: any) => setTypes(Array.isArray(data) ? data : []))
      .catch(() => setTypes([]));
    ApiHelper.getAnonymous("/registrations/selections/event/" + eventId + "?churchId=" + churchId, "ContentApi")
      .then((data: any) => setSelections(Array.isArray(data) ? data : []))
      .catch(() => setSelections([]));
  }, [churchId, eventId]);

  const hasTypes = types.length > 0;
  const hasSelections = selections.length > 0;
  const typeMap = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);

  const primaryFirstName = isLoggedIn ? (person?.firstName || "") : guestFirstName;
  const primaryLastName = isLoggedIn ? (person?.lastName || "") : guestLastName;

  const addMember = () => {
    if (members.length >= 10) return;
    setMembers([...members, { firstName: "", lastName: isLoggedIn ? "" : guestLastName, registrationTypeId: "" }]);
  };
  const removeMember = (index: number) => setMembers(members.filter((_, i) => i !== index));
  const updateMember = (index: number, field: keyof WizardMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const setQuantity = (selectionId: string, qty: number) => {
    setSelectionQty((prev) => ({ ...prev, [selectionId]: Math.max(0, qty) }));
  };

  const buildMembersPayload = (): WizardMember[] => {
    if (!hasTypes) return members.map((m) => ({ firstName: m.firstName.trim(), lastName: m.lastName.trim() }));
    const primary: WizardMember = { firstName: primaryFirstName.trim(), lastName: primaryLastName.trim() };
    if (primaryTypeId) primary.registrationTypeId = primaryTypeId;
    const extra = members.map((m) => {
      const out: WizardMember = { firstName: m.firstName.trim(), lastName: m.lastName.trim() };
      if (m.registrationTypeId) out.registrationTypeId = m.registrationTypeId;
      return out;
    });
    return [primary, ...extra];
  };

  const buildSelectionsPayload = () =>
    Object.entries(selectionQty)
      .filter(([, q]) => q > 0)
      .map(([selectionId, quantity]) => ({ selectionId, quantity }));

  const subtotal = useMemo(() => {
    let sum = 0;
    if (hasTypes) {
      const mp = buildMembersPayload();
      for (const m of mp) {
        const t = m.registrationTypeId ? typeMap.get(m.registrationTypeId) : undefined;
        if (t) sum += num(t.price);
      }
    }
    for (const s of selections) {
      const q = selectionQty[s.id] || 0;
      if (q > 0) sum += num(s.price) * q;
    }
    return Math.round(sum * 100) / 100;

  }, [types, selections, members, primaryTypeId, selectionQty, primaryFirstName, primaryLastName]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const d = appliedCoupon.discountType === "percent" ? (subtotal * appliedCoupon.value) / 100 : Math.min(appliedCoupon.value, subtotal);
    return Math.round(d * 100) / 100;
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  const isWaitlistMode = useMemo(() => !!event?.waitlistEnabled, [event]);

  const needsPayment = total > 0;

  const summaryLines = useMemo(() => {
    const lines: { label: string; amount: number }[] = [];
    if (hasTypes) {
      const mp = buildMembersPayload();
      const counts = new Map<string, number>();
      for (const m of mp) if (m.registrationTypeId) counts.set(m.registrationTypeId, (counts.get(m.registrationTypeId) || 0) + 1);
      for (const [tid, count] of counts) {
        const t = typeMap.get(tid);
        if (t) lines.push({ label: `${t.name} × ${count}`, amount: num(t.price) * count });
      }
    }
    for (const s of selections) {
      const q = selectionQty[s.id] || 0;
      if (q > 0) lines.push({ label: `${s.name} × ${q}`, amount: num(s.price) * q });
    }
    return lines;

  }, [types, selections, members, primaryTypeId, selectionQty]);

  const validateInfo = (): boolean => {
    setError("");
    if (!isLoggedIn) {
      if (!guestFirstName.trim() || !guestLastName.trim()) {
        setError(Locale.label("registration.errors.namesRequired"));
        return false;
      }
      if (!guestEmail.trim()) {
        setError(Locale.label("registration.errors.emailRequired"));
        return false;
      }
    }
    if (hasTypes && !primaryTypeId) {
      setError(Locale.label("registration.errors.typeRequired"));
      return false;
    }
    return true;
  };

  const validateMembers = (): boolean => {
    for (const m of members) {
      if (!m.firstName.trim() || !m.lastName.trim()) {
        setError(Locale.label("registration.errors.memberNamesRequired"));
        return false;
      }
      if (hasTypes && !m.registrationTypeId) {
        setError(Locale.label("registration.errors.typeRequired"));
        return false;
      }
    }
    return true;
  };

  const applyCoupon = async () => {
    setCouponError("");
    const code = couponCode.trim();
    if (!code) return;
    try {
      const memberCount = buildMembersPayload().length || 1;
      const result: any = await ApiHelper.postAnonymous("/registrations/coupons/validate", { churchId, eventId, code, memberCount }, "ContentApi");
      if (result?.valid) {
        setAppliedCoupon({ code, discountType: result.discountType, value: Number(result.value) });
      } else {
        setAppliedCoupon(null);
        setCouponError(Locale.label("registration.coupon." + (result?.reason || "invalid")) || Locale.label("registration.coupon.invalid"));
      }
    } catch {
      setAppliedCoupon(null);
      setCouponError(Locale.label("registration.coupon.invalid"));
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Resolve whether the questions step applies; returns "questions" | "next".
  const resolveFormStep = async (): Promise<"questions" | "next"> => {
    if (!event?.formId) return "next";
    try {
      const formData: any = await ApiHelper.get("/forms/standalone/" + event.formId + "?churchId=" + churchId, "MembershipApi");
      if (formData?.restricted) return "next";
      setUnRestrictedFormId(event.formId);
      return "questions";
    } catch {
      return "next";
    }
  };

  const skipPaymentForWaitlist = () => atCapacity && isWaitlistMode;

  const afterQuestions = () => {
    if (needsPayment && !skipPaymentForWaitlist()) setStep("payment");
    else void submit();
  };

  const continueFromInfo = () => {
    if (!validateInfo()) return;
    setStep("members");
  };

  const continueFromMembers = async () => {
    setError("");
    if (!validateMembers()) return;
    if (hasSelections) {
      setStep("selections");
      return;
    }
    setIsSubmitting(true);
    const next = await resolveFormStep();
    setIsSubmitting(false);
    if (next === "questions") setStep("questions");
    else afterQuestions();
  };

  const continueFromSelections = async () => {
    setError("");
    setIsSubmitting(true);
    const next = await resolveFormStep();
    setIsSubmitting(false);
    if (next === "questions") setStep("questions");
    else afterQuestions();
  };

  const handleFormSaved = (fs?: { id?: string }) => {
    setFormSubmissionId(fs?.id);
    if (needsPayment && !skipPaymentForWaitlist()) setStep("payment");
    else void submit(undefined, fs?.id);
  };

  const mapError = (result: any): string => {
    if (result?.status === "type-full") return Locale.label("registration.errors.typeFull");
    if (result?.status === "selection-full") return Locale.label("registration.errors.selectionFull");
    return result?.error || Locale.label("registration.errors.registrationFailed");
  };

  const submit = async (payment?: RegistrationPayment, fsIdOverride?: string): Promise<any> => {
    setError("");
    if (!validateMembers()) return null;
    setIsSubmitting(true);
    try {
      const payload: any = { churchId, eventId };
      if (isLoggedIn) payload.personId = person?.id;
      else payload.guestInfo = { firstName: guestFirstName.trim(), lastName: guestLastName.trim(), email: guestEmail.trim(), phone: guestPhone.trim() || undefined };

      const mp = buildMembersPayload();
      if (mp.length > 0) payload.members = mp;
      const sel = buildSelectionsPayload();
      if (sel.length > 0) payload.selections = sel;
      if (appliedCoupon) payload.couponCode = appliedCoupon.code;
      const fsId = fsIdOverride ?? formSubmissionId;
      if (fsId) payload.formSubmissionId = fsId;
      if (payment) Object.assign(payload, payment);

      const result: any = await ApiHelper.postAnonymous("/registrations/register", payload, "ContentApi");
      if (result?.error) {
        setError(mapError(result));
        return result;
      }
      // 3DS: server returns a pending registration with a charge payload for the client to finalize.
      if (result?.payment && result?.status === "pending") {
        setRegistration(result);
        return result;
      }
      setRegistration(result);
      setStep("confirm");
      return result;
    } catch {
      setError(Locale.label("registration.errors.registrationFailed"));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishConfirm = (result: any) => {
    setRegistration(result);
    setStep("confirm");
  };

  return {
    // data
    types,
    selections,
    hasTypes,
    hasSelections,
    typeMap,
    // state
    step,
    setStep,
    guestFirstName,
    setGuestFirstName,
    guestLastName,
    setGuestLastName,
    guestEmail,
    setGuestEmail,
    guestPhone,
    setGuestPhone,
    primaryTypeId,
    setPrimaryTypeId,
    members,
    addMember,
    removeMember,
    updateMember,
    selectionQty,
    setQuantity,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    error,
    setError,
    isSubmitting,
    registration,
    unRestrictedFormId,
    formSubmissionId,
    // pricing
    subtotal,
    discountAmount,
    total,
    needsPayment,
    summaryLines,
    isWaitlistMode,
    // capacity
    atCapacity,
    setAtCapacity,
    // navigation
    continueFromInfo,
    continueFromMembers,
    continueFromSelections,
    handleFormSaved,
    submit,
    finishConfirm,
    primaryFirstName,
    primaryLastName
  };
}
