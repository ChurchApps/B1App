"use client";

import React, { Suspense, useContext, useEffect, useMemo, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Box,
  Button,
  Icon,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Typography,
  Alert,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiHelper,
  AppearanceHelper,
  CurrencyHelper,
  DateHelper,
  UniqueIdHelper,
  UserHelper,
} from "@churchapps/apphelper";
import {
  RecurringDonations,
  PaymentMethods,
  StripePaymentMethod as AppHelperStripePaymentMethod,
} from "@churchapps/apphelper-donations";
import { NonAuthDonationWrapper } from "@churchapps/apphelper-website";
import type {
  ChurchInterface,
  DonationInterface,
  PersonInterface,
} from "@churchapps/helpers";
import { StableDonationForm } from "@/components/donate/StableDonationForm";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

type TabKey = "overview" | "donate" | "manage" | "history";
type PeriodKey = "ytd" | "30d" | "90d" | "all";

interface SubscriptionRow {
  id: string;
  plan?: { amount?: number; interval?: string; interval_count?: number };
  billing_cycle_anchor?: number;
  default_payment_method?: string;
  default_source?: string;
  funds?: { id: string; name: string; amount: number }[];
}

function DonatePageInner({ config }: Props) {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const personId = context?.userChurch?.person?.id || UserHelper.currentUserChurch?.person?.id;
  const church: ChurchInterface | undefined = config?.church;
  const churchLogo = AppearanceHelper.getLogo(config?.appearance, "", "", "#FFF");
  const queryClient = useQueryClient();
  const isAuthenticated = !!UserHelper.user?.firstName && !UniqueIdHelper.isMissing(personId);
  const donationsEnabled = config?.allowDonations !== false && isAuthenticated;

  const [message, setMessage] = useState<string | null>(null);
  // Guests can't have overview/manage/history data, so they default straight
  // to the Donate tab; authenticated users land on Overview like B1Mobile.
  const [tab, setTab] = useState<TabKey>(isAuthenticated ? "overview" : "donate");
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [periodAnchor, setPeriodAnchor] = useState<HTMLElement | null>(null);

  const { data: donations = [], isLoading: donationsLoading } = useQuery<DonationInterface[]>({
    queryKey: ["donations", personId],
    queryFn: async () => {
      const data = await ApiHelper.get("/donations/my", "GivingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: donationsEnabled,
  });

  interface PaymentData {
    stripePromise: Promise<Stripe> | null;
    paymentMethods: AppHelperStripePaymentMethod[];
    customerId: string | null;
    person: PersonInterface | null;
  }

  const { data: paymentData, isLoading: isMethodsLoading } = useQuery<PaymentData>({
    queryKey: ["donate-payment-data", personId],
    queryFn: async () => {
      const gateways: { publicKey?: string }[] = await ApiHelper.get("/gateways", "GivingApi");
      if (!gateways?.length || !gateways[0]?.publicKey) {
        return { stripePromise: null, paymentMethods: [], customerId: null, person: null };
      }
      const stripePromise = loadStripe(gateways[0].publicKey!) as Promise<Stripe>;
      const [methodsResult, personResult] = await Promise.all([
        ApiHelper.get("/paymentmethods/personid/" + personId, "GivingApi") as Promise<{ provider?: string; customerId?: string }[]>,
        ApiHelper.get("/people/" + personId, "MembershipApi") as Promise<PersonInterface>,
      ]);
      const pms: AppHelperStripePaymentMethod[] = [];
      let customerId: string | null = null;
      if (Array.isArray(methodsResult)) {
        for (const pm of methodsResult) {
          if (pm.provider === "stripe") pms.push(new AppHelperStripePaymentMethod(pm));
          if (pm.customerId && !customerId) customerId = pm.customerId;
        }
      }
      return { stripePromise, paymentMethods: pms, customerId, person: personResult || null };
    },
    enabled: donationsEnabled,
  });

  const stripePromise = paymentData?.stripePromise ?? null;
  const paymentMethods = paymentData?.paymentMethods ?? null;
  const customerId = paymentData?.customerId ?? null;
  const person = paymentData?.person ?? null;

  // B1Mobile shows active recurring subscriptions on the History tab. We
  const { data: subscriptions = [] } = useQuery<SubscriptionRow[]>({
    queryKey: ["donate-subscriptions", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const subResult: any = await ApiHelper.get(
        "/customers/" + customerId + "/subscriptions",
        "GivingApi"
      );
      const rows: any[] = subResult?.data || [];
      return Promise.all(
        rows.map(async (s): Promise<SubscriptionRow> => {
          const funds: any = await ApiHelper.get(
            "/subscriptionfunds?subscriptionId=" + s.id,
            "GivingApi"
          );
          return { ...s, funds };
        })
      );
    },
    enabled: donationsEnabled && !!customerId,
  });

  const handleDataUpdate = (msg?: string) => {
    setMessage(msg || null);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["donations", personId] });
      queryClient.invalidateQueries({ queryKey: ["donate-payment-data", personId] });
      queryClient.invalidateQueries({ queryKey: ["donate-subscriptions", customerId] });
    }, 2000);
  };

  // Auto-clear the toast so the next tab switch doesn't still show an old "thank you"
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(id);
  }, [message]);

  const givingStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let ytd = 0;
    let totalGifts = 0;
    let lastGift: DonationInterface | null = null;
    const sorted = [...donations].sort(
      (a, b) => DateHelper.toDate(b.donationDate).getTime() - DateHelper.toDate(a.donationDate).getTime()
    );
    if (sorted.length > 0) lastGift = sorted[0];
    for (const d of donations) {
      const dt = DateHelper.toDate(d.donationDate);
      if (dt.getFullYear() === currentYear) {
        ytd += ((d as any).fund?.amount ?? (d as any).amount ?? 0) as number;
        totalGifts += 1;
      }
    }
    return { ytd, totalGifts, lastGift };
  }, [donations]);

  const handleRepeatGift = () => {
    // Shared DonationForm doesn't accept initialDonation props; just jump to Donate tab.
    setTab("donate");
  };

  if (config?.allowDonations === false) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.xl}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "32px",
              bgcolor: tc.iconBackground,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: `${mobileTheme.spacing.md}px`,
            }}
          >
            <Icon sx={{ fontSize: 32, color: tc.primary }}>volunteer_activism</Icon>
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
            Giving is not yet set up for this church
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
            Please check back later once online giving has been configured.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Three-part overview, matching B1Mobile's GivingOverview.tsx:
  //   1. Gradient hero card (centered YTD amount, gift count)
  //   2. Recent Activity section (heading + View all, last-gift card w/ Repeat)
  //   3. Call-to-action card (volunteer_activism icon, Give Now button)
  // Guests see a simplified hero + CTA only (no activity row).
  const renderOverview = () => {
    const gradient = `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`;
    return (
      <Box>
        {/* Hero */}
        <Box
          sx={{
            borderRadius: `${mobileTheme.radius.xl}px`,
            boxShadow: mobileTheme.shadows.md,
            p: `${mobileTheme.spacing.lg}px`,
            background: gradient,
            color: tc.onPrimary,
            textAlign: "center",
            mb: `${mobileTheme.spacing.lg}px`,
            minHeight: 160,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {isAuthenticated ? (
            <>
              <Typography sx={{ fontSize: 18, fontWeight: 600, opacity: 0.95, mb: 1 }}>
                Your Giving Impact
              </Typography>
              <Typography sx={{ fontSize: 36, fontWeight: 800, mb: 1 }}>
                {CurrencyHelper.formatCurrency(givingStats.ytd || 0)}
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.9 }}>
                Total this year • {givingStats.totalGifts}{" "}
                {givingStats.totalGifts === 1 ? "gift" : "gifts"}
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 18, fontWeight: 600, opacity: 0.95, mb: 1 }}>
                Make a Difference Today
              </Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 1 }}>
                Support {church?.name || "our church"}
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.9 }}>
                Give securely as a guest — no account required.
              </Typography>
            </>
          )}
        </Box>

        {/* Recent Activity — auth only */}
        {isAuthenticated && (
          <Box sx={{ mb: `${mobileTheme.spacing.lg}px` }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: `${mobileTheme.spacing.md}px`,
              }}
            >
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text }}>
                Recent Activity
              </Typography>
              <Button
                onClick={() => setTab("history")}
                sx={{
                  textTransform: "none",
                  color: tc.primary,
                  fontWeight: 600,
                  minWidth: 0,
                }}
              >
                View All
              </Button>
            </Box>

            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                boxShadow: mobileTheme.shadows.sm,
                p: `${mobileTheme.spacing.md}px`,
                display: "flex",
                alignItems: "center",
                gap: `${mobileTheme.spacing.md}px`,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "24px",
                  bgcolor: tc.iconBackground,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ color: tc.success }}>favorite</Icon>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
                  Last Gift
                </Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: tc.primary }}>
                  {givingStats.lastGift
                    ? CurrencyHelper.formatCurrency(
                        ((givingStats.lastGift as any).fund?.amount
                          ?? (givingStats.lastGift as any).amount
                          ?? 0) as number
                      )
                    : CurrencyHelper.formatCurrency(0)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
                  {givingStats.lastGift
                    ? DateHelper.prettyDate(DateHelper.toDate(givingStats.lastGift.donationDate))
                    : "No recent gift"}
                </Typography>
              </Box>
              {givingStats.lastGift && (
                <Button
                  onClick={handleRepeatGift}
                  sx={{
                    textTransform: "none",
                    color: tc.primary,
                    bgcolor: tc.iconBackground,
                    borderRadius: "20px",
                    fontWeight: 600,
                    fontSize: 13,
                    px: 2,
                    "&:hover": { bgcolor: tc.iconBackground, opacity: 0.85 },
                  }}
                >
                  Repeat
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* CTA card — Give Now */}
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.xl}px`,
            boxShadow: mobileTheme.shadows.sm,
            border: `1px solid ${tc.borderLight}`,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
          }}
        >
          <Icon sx={{ fontSize: 48, color: tc.primary, mb: `${mobileTheme.spacing.md}px` }}>
            volunteer_activism
          </Icon>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: 1 }}>
            Make a Difference Today
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.lg}px`, px: 2 }}>
            Your generosity helps us continue our mission and support our community.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setTab("donate")}
            sx={{
              textTransform: "none",
              bgcolor: tc.primary,
              color: tc.onPrimary,
              fontWeight: 700,
              fontSize: 16,
              px: 4,
              py: 1,
              borderRadius: `${mobileTheme.radius.lg}px`,
              "&:hover": { bgcolor: tc.primary, opacity: 0.9 },
            }}
          >
            Give Now
          </Button>
        </Box>
      </Box>
    );
  };

  const renderGive = () => {
    // Guest (unauthenticated) flow — use shared NonAuthDonationWrapper which
    // supports guest card + guest ACH and auto-creates user/person records.
    if (!isAuthenticated) {
      if (!church?.id) {
        return (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ color: tc.textMuted }}>Unable to load church configuration.</Typography>
          </Box>
        );
      }
      return (
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.md}px`,
          }}
        >
          <NonAuthDonationWrapper
            churchId={church.id}
            showHeader={false}
            churchLogo={churchLogo}
            mainContainerCssProps={{ sx: { boxShadow: "none", padding: 0 } }}
          />
        </Box>
      );
    }

    if (isMethodsLoading) {
      return (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography sx={{ color: tc.textMuted }}>Loading donation form...</Typography>
        </Box>
      );
    }
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <StableDonationForm
          person={person!}
          customerId={customerId!}
          paymentMethods={paymentMethods!}
          stripePromise={stripePromise!}
          donationSuccess={handleDataUpdate}
          church={church!}
          churchLogo={churchLogo}
        />
      </Box>
    );
  };

  // Manage tab: payment methods only (matches B1Mobile's ManagePayments.tsx).
  // Recurring donations live on the History tab, also matching B1Mobile.
  const renderManage = () => {
    if (isMethodsLoading) {
      return (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography sx={{ color: tc.textMuted }}>Loading...</Typography>
        </Box>
      );
    }
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <PaymentMethods
          person={person!}
          customerId={customerId!}
          paymentMethods={paymentMethods || []}
          appName="B1App"
          stripePromise={stripePromise!}
          dataUpdate={handleDataUpdate}
        />
      </Box>
    );
  };

  const handlePrintStatement = () => {
    const year = new Date().getFullYear();
    if (typeof window === "undefined") return;
    window.open(`/my/donations/print?year=${year}`, "_blank", "noopener,noreferrer");
  };

  const periodLabels: Record<PeriodKey, string> = {
    ytd: "Year to Date",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
    all: "All Time",
  };

  const filteredDonations = useMemo(() => {
    const now = new Date();
    let cutoff: Date | null = null;
    if (period === "30d") cutoff = new Date(now.getTime() - 30 * 86400000);
    else if (period === "90d") cutoff = new Date(now.getTime() - 90 * 86400000);
    else if (period === "ytd") cutoff = new Date(now.getFullYear(), 0, 1);
    if (!cutoff) return donations;
    return donations.filter((d) => DateHelper.toDate(d.donationDate) >= cutoff!);
  }, [donations, period]);

  const filteredTotal = useMemo(
    () =>
      filteredDonations.reduce(
        (sum, d) => sum + (((d as any).fund?.amount ?? (d as any).amount ?? 0) as number),
        0
      ),
    [filteredDonations]
  );

  const getSubPaymentMethod = (sub: SubscriptionRow) => {
    const pm = (paymentMethods || []).find(
      (p) => (p as any).id === (sub.default_payment_method || sub.default_source)
    );
    if (!pm) return "Payment method not found";
    return `${(pm as any).name} ****${(pm as any).last4 || ""}`;
  };

  // History tab — mirrors B1Mobile's EnhancedGivingHistory layout:
  // summary card w/ period filter, recurring donations section, card-row list.
  const renderHistory = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      {/* Summary card */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.xl}px`,
          boxShadow: mobileTheme.shadows.md,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: `${mobileTheme.spacing.md}px`,
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text }}>Giving</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              size="small"
              endIcon={<Icon>expand_more</Icon>}
              onClick={(e) => setPeriodAnchor(e.currentTarget)}
              sx={{
                textTransform: "none",
                bgcolor: tc.iconBackground,
                color: tc.primary,
                fontWeight: 600,
                borderRadius: "20px",
                px: 2,
                "&:hover": { bgcolor: tc.iconBackground, opacity: 0.9 },
              }}
            >
              {periodLabels[period]}
            </Button>
            <Menu
              anchorEl={periodAnchor}
              open={!!periodAnchor}
              onClose={() => setPeriodAnchor(null)}
            >
              {(Object.keys(periodLabels) as PeriodKey[]).map((k) => (
                <MenuItem
                  key={k}
                  selected={period === k}
                  onClick={() => {
                    setPeriod(k);
                    setPeriodAnchor(null);
                  }}
                >
                  {periodLabels[k]}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>

        {donationsLoading ? (
          <Typography sx={{ color: tc.textMuted, textAlign: "center", py: 3 }}>Loading...</Typography>
        ) : (
          <Box sx={{ textAlign: "center", py: 1 }}>
            <Typography sx={{ fontSize: 32, fontWeight: 800, color: tc.primary }}>
              {CurrencyHelper.formatCurrency(filteredTotal)}
            </Typography>
            <Typography sx={{ fontSize: 14, color: tc.textMuted, fontWeight: 500 }}>
              {periodLabels[period]}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Print Statement (web-only, B1App feature) */}
      {!donationsLoading && donations.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="small"
            startIcon={<Icon>print</Icon>}
            onClick={handlePrintStatement}
            sx={{ textTransform: "none", color: tc.primary, fontWeight: 600 }}
          >
            Print Statement
          </Button>
        </Box>
      )}

      {/* Recurring donations — B1Mobile shows active subscriptions here */}
      {subscriptions.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.sm}px`, ml: 0.5 }}>
            Recurring
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
            {subscriptions.map((sub) => {
              const interval = `${sub.plan?.interval_count || 1} ${sub.plan?.interval || "month"}${
                (sub.plan?.interval_count || 1) > 1 ? "s" : ""
              }`;
              const total = (sub.plan?.amount || 0) / 100;
              const startDate = sub.billing_cycle_anchor
                ? DateHelper.prettyDate(new Date(sub.billing_cycle_anchor * 1000))
                : "";
              return (
                <Box
                  key={sub.id}
                  sx={{
                    bgcolor: tc.surface,
                    borderRadius: `${mobileTheme.radius.lg}px`,
                    boxShadow: mobileTheme.shadows.sm,
                    p: `${mobileTheme.spacing.md}px`,
                    display: "flex",
                    alignItems: "center",
                    gap: `${mobileTheme.spacing.md}px`,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "20px",
                      bgcolor: tc.iconBackground,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ color: tc.primary, fontSize: 22 }}>autorenew</Icon>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {sub.funds?.map((f) => (
                      <Typography key={f.id} sx={{ fontSize: 14, fontWeight: 500, color: tc.text }}>
                        {f.name} — {CurrencyHelper.formatCurrency(f.amount)}
                      </Typography>
                    ))}
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.primary }}>
                      Total: {CurrencyHelper.formatCurrency(total)}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: tc.text }}>Every {interval}</Typography>
                    <Typography sx={{ fontSize: 13, color: tc.text }}>
                      {getSubPaymentMethod(sub)}
                    </Typography>
                    {startDate && (
                      <Typography sx={{ fontSize: 12, color: tc.textMuted }}>{startDate}</Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
          {/* Inline RecurringDonations manager for edit/cancel — shared web control,
              closest equivalent to B1Mobile's modal manager. */}
          <Box sx={{ mt: `${mobileTheme.spacing.md}px` }}>
            <RecurringDonations
              customerId={customerId!}
              paymentMethods={paymentMethods || []}
              appName="B1App"
              dataUpdate={handleDataUpdate}
            />
          </Box>
        </Box>
      )}

      {/* Transaction list */}
      <Box>
        <Typography
          sx={{ fontSize: 16, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.sm}px`, ml: 0.5 }}
        >
          Recent Activity
        </Typography>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            overflow: "hidden",
          }}
        >
          {donationsLoading && (
            <Typography sx={{ color: tc.textMuted, textAlign: "center", py: 4 }}>Loading...</Typography>
          )}
          {!donationsLoading && filteredDonations.length === 0 && (
            <Box sx={{ py: 5, textAlign: "center", px: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>
                No recent transactions
              </Typography>
              <Typography sx={{ fontSize: 13, color: tc.textMuted, mt: 0.5 }}>
                Your donations will appear here once you make your first gift.
              </Typography>
            </Box>
          )}
          {!donationsLoading &&
            filteredDonations.map((d, i) => {
              const isPending = (d as any).status === "pending";
              const amount = ((d as any).fund?.amount ?? (d as any).amount ?? 0) as number;
              const fundName = (d as any).fund?.name || "—";
              const method = (d as any).method;
              const methodDetails = (d as any).methodDetails;
              return (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: `${mobileTheme.spacing.md}px`,
                    p: `${mobileTheme.spacing.md}px`,
                    borderBottom:
                      i < filteredDonations.length - 1 ? `1px solid ${tc.divider}` : "none",
                    opacity: isPending ? 0.85 : 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "24px",
                      bgcolor: tc.iconBackground,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ color: tc.primary }}>favorite</Icon>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>
                      {fundName}
                      {isPending && " (Pending)"}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
                      {DateHelper.prettyDate(DateHelper.toDate(d.donationDate))}
                      {method ? ` • ${method}${methodDetails ? ` - ${methodDetails}` : ""}` : ""}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: isPending ? tc.warning : tc.text,
                      flexShrink: 0,
                    }}
                  >
                    {CurrencyHelper.formatCurrency(amount)}
                  </Typography>
                </Box>
              );
            })}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%" }}>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderBottom: `1px solid ${tc.border}`,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 52,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              minHeight: 52,
              color: tc.textSecondary,
            },
            "& .Mui-selected": { color: `${tc.primary} !important`, fontWeight: 700 },
            "& .MuiTabs-indicator": { backgroundColor: tc.primary, height: 2 },
          }}
        >
          {isAuthenticated && <Tab value="overview" label="Overview" />}
          <Tab value="donate" label="Donate" />
          {isAuthenticated && <Tab value="manage" label="Manage" />}
          {isAuthenticated && <Tab value="history" label="History" />}
        </Tabs>
      </Box>

      <Box sx={{ p: `${mobileTheme.spacing.md}px` }}>
        {message && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: `${mobileTheme.radius.md}px` }}>
            {message}
          </Alert>
        )}

        {tab === "overview" && isAuthenticated && renderOverview()}
        {tab === "donate" && renderGive()}
        {tab === "manage" && isAuthenticated && renderManage()}
        {tab === "history" && isAuthenticated && renderHistory()}

        {!isAuthenticated && tab === "donate" && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography sx={{ fontSize: 13, color: tc.textMuted }}>
              Already have an account?{" "}
              <a href="/mobile/login?returnUrl=/mobile/donate" style={{ color: tc.primary, fontWeight: 600 }}>
                Sign in
              </a>{" "}
              to manage recurring gifts and view history.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export const DonatePage = (props: Props) => (
  <Suspense>
    <DonatePageInner {...props} />
  </Suspense>
);
