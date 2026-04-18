"use client";

import React, { Suspense, useContext, useMemo, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Box, Button, Icon, Tab, Tabs, Typography, Alert, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
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

type TabKey = "give" | "recurring" | "history";

function DonatePageInner({ config }: Props) {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const personId = context?.userChurch?.person?.id || UserHelper.currentUserChurch?.person?.id;
  const church: ChurchInterface | undefined = config?.church;
  const churchLogo = AppearanceHelper.getLogo(config?.appearance, "", "", "#FFF");
  const queryClient = useQueryClient();
  const donationsEnabled = config?.allowDonations !== false && !UniqueIdHelper.isMissing(personId);

  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("give");

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

  const handleDataUpdate = (msg?: string) => {
    setMessage(msg || null);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["donations", personId] });
      queryClient.invalidateQueries({ queryKey: ["donate-payment-data", personId] });
    }, 2000);
  };

  const givingStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let ytd = 0;
    let lastGift: DonationInterface | null = null;
    const sorted = [...donations].sort(
      (a, b) => DateHelper.toDate(b.donationDate).getTime() - DateHelper.toDate(a.donationDate).getTime()
    );
    if (sorted.length > 0) lastGift = sorted[0];
    for (const d of donations) {
      const dt = DateHelper.toDate(d.donationDate);
      if (dt.getFullYear() === currentYear) {
        // d.fund?.amount is the shape used in the existing /my donation page
        ytd += ((d as any).fund?.amount ?? (d as any).amount ?? 0) as number;
      }
    }
    return { ytd, lastGift };
  }, [donations]);

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

  if (!UserHelper.user?.firstName) {
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
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text }}>
            Please sign in to give
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mt: 1 }}>
            Log in to access donations and giving history.
          </Typography>
        </Box>
      </Box>
    );
  }

  const renderOverview = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.md,
        p: `${mobileTheme.spacing.md}px`,
        mb: `${mobileTheme.spacing.md}px`,
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 500, color: tc.textSecondary, mb: 1 }}>
        Giving Overview
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>
            {new Date().getFullYear()} Total
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.primary }}>
            {CurrencyHelper.formatCurrency(givingStats.ytd || 0)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: "right" }}>
          <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>Last Gift</Typography>
          {givingStats.lastGift ? (
            <>
              <Typography sx={{ fontSize: 20, fontWeight: 600, color: tc.text }}>
                {CurrencyHelper.formatCurrency(
                  ((givingStats.lastGift as any).fund?.amount ?? (givingStats.lastGift as any).amount ?? 0) as number
                )}
              </Typography>
              <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>
                {DateHelper.prettyDate(DateHelper.toDate(givingStats.lastGift.donationDate))}
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: 14, color: tc.textMuted }}>No gifts yet</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );

  const renderGive = () => {
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

  const renderRecurring = () => {
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
        <RecurringDonations
          customerId={customerId!}
          paymentMethods={paymentMethods || []}
          appName="B1App"
          dataUpdate={handleDataUpdate}
        />
        <Box sx={{ mt: 2 }}>
          <PaymentMethods
            person={person!}
            customerId={customerId!}
            paymentMethods={paymentMethods || []}
            appName="B1App"
            stripePromise={stripePromise!}
            dataUpdate={handleDataUpdate}
          />
        </Box>
      </Box>
    );
  };

  const handlePrintStatement = () => {
    const year = new Date().getFullYear();
    if (typeof window === "undefined") return;
    window.open(`/my/donations/print?year=${year}`, "_blank", "noopener,noreferrer");
  };

  const renderHistory = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
        overflowX: "auto",
      }}
    >
      {!donationsLoading && donations.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
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
      {donationsLoading && <Typography sx={{ color: tc.textMuted }}>Loading...</Typography>}
      {!donationsLoading && donations.length === 0 && (
        <Typography sx={{ color: tc.textMuted }}>
          Your donations will appear here once you make your first gift.
        </Typography>
      )}
      {!donationsLoading && donations.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Fund</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donations.map((d, i) => {
              const isPending = (d as any).status === "pending";
              const amount = ((d as any).fund?.amount ?? (d as any).amount ?? 0) as number;
              return (
                <TableRow key={i} sx={{ opacity: isPending ? 0.8 : 1 }}>
                  <TableCell>
                    {DateHelper.prettyDate(DateHelper.toDate(d.donationDate))}
                  </TableCell>
                  <TableCell>
                    {(d as any).fund?.name || "—"}
                    {isPending && " (Pending)"}
                  </TableCell>
                  <TableCell align="right" sx={{ color: isPending ? tc.warning : undefined }}>
                    {CurrencyHelper.formatCurrency(amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        Giving
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: `${mobileTheme.radius.md}px` }}>
          {message}
        </Alert>
      )}

      {renderOverview()}

      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              minHeight: 44,
              color: tc.textSecondary,
            },
            "& .Mui-selected": { color: `${tc.primary} !important` },
            "& .MuiTabs-indicator": { backgroundColor: tc.primary },
          }}
        >
          <Tab value="give" label="Make a Donation" />
          <Tab value="recurring" label="Recurring" />
          <Tab value="history" label="History" />
        </Tabs>
      </Box>

      {tab === "give" && renderGive()}
      {tab === "recurring" && renderRecurring()}
      {tab === "history" && renderHistory()}
    </Box>
  );
}

export const DonatePage = (props: Props) => (
  <Suspense>
    <DonatePageInner {...props} />
  </Suspense>
);
