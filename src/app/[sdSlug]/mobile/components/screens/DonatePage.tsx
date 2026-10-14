"use client";

import React, { Suspense, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Alert, Box, Button, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiHelper,
  AppearanceHelper,
  CurrencyHelper,
  DateHelper,
  Locale,
  UniqueIdHelper,
  UserHelper
} from "@churchapps/apphelper";
import {
  RecurringDonations,
  PaymentMethods,
  SavedPaymentMethod,
  MultiGatewayDonationForm,
  getPaymentProvider
} from "@churchapps/apphelper/donations";
import type { PaymentGateway } from "@churchapps/apphelper/donations";
import { NonAuthDonationWrapper } from "@churchapps/apphelper/website";
import type {
  ChurchInterface,
  DonationInterface,
  PersonInterface
} from "@churchapps/helpers";
import { CampaignProgress } from "@/components/donate/CampaignProgress";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { BackVerb, BigNumber, FilterPills, PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, StatusBadge, TextLink, useSliceView } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

interface SubscriptionRow {
  id: string;
  plan?: { amount?: number; interval?: string; interval_count?: number; currency?: string };
  billing_cycle_anchor?: number;
  default_payment_method?: string;
  default_source?: string;
  funds?: { id: string; name: string; amount: number }[];
}

const tc = mobileTheme.colors;

// apphelper's InputBox/DisplayBox are Papers with their own padding + shadow; inside a plate section they read as nested cards.
const flatBoxes = {
  "& #donation-form, & #input-box, & #display-box": { boxShadow: "none", backgroundImage: "none", bgcolor: "transparent", p: 0, mb: 0 },
  "& #input-box-icon, & #display-box-icon": { display: "none" },
  "& #input-box-title, & #display-box-title": { ml: 0, fontSize: 12, lineHeight: "18px", fontWeight: 650, letterSpacing: "0.07em", textTransform: "uppercase", color: tc.eyebrow }
} satisfies SxProps<Theme>;

const campaignSx: SxProps<Theme> = {
  "&:empty": { display: "none" },
  "& [data-testid^='campaign-card-']": { border: 0, borderRadius: 0, p: 0, mb: 0, bgcolor: "transparent" },
  "& [data-testid^='campaign-card-'] + [data-testid^='campaign-card-']": { borderTop: `1px solid ${tc.border}`, mt: "18px", pt: "18px" }
};

const amountOf = (d: DonationInterface) => ((d as any).fund?.amount ?? (d as any).amount ?? 0) as number;

const Amount = ({ value, pending }: { value: string; pending?: boolean }) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flex: "none" }}>
    <Typography component="span" sx={{ fontSize: 15, fontWeight: 600, color: tc.text, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
    {pending && <StatusBadge tone="warn">{Locale.label("mobile.screens.pending")}</StatusBadge>}
  </Box>
);

function DonatePageInner({ config }: Props) {
  const context = useContext(UserContext);
  const personId = context?.userChurch?.person?.id || UserHelper.currentUserChurch?.person?.id;
  const church: ChurchInterface | undefined = config?.church;
  const churchLogo = AppearanceHelper.getLogo(config?.appearance, "", "", "#FFF");
  const queryClient = useQueryClient();
  const isAuthenticated = !!context?.user?.firstName && !UniqueIdHelper.isMissing(personId);
  const donationsEnabled = config?.allowDonations !== false && isAuthenticated;
  const pathname = usePathname() || "/mobile/donate";
  const [view, setView] = useSliceView();
  const currentYear = new Date().getFullYear();

  const [message, setMessage] = useState<string | null>(null);
  const [historyYear, setHistoryYear] = useState<string>(String(currentYear));

  const { data: donations = [], isLoading: donationsLoading } = useQuery<DonationInterface[]>({
    queryKey: ["donations", personId],
    queryFn: async () => {
      const data = await ApiHelper.get("/donations/my", "GivingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: donationsEnabled
  });

  interface PaymentData {
    paymentMethods: SavedPaymentMethod[];
    customerId: string | null;
    person: PersonInterface | null;
    currency: string;
    paymentGateways: PaymentGateway[];
  }

  const { data: paymentData, isLoading: isMethodsLoading } = useQuery<PaymentData>({
    queryKey: ["donate-payment-data", personId],
    queryFn: async () => {
      const gateways: PaymentGateway[] = await ApiHelper.get("/gateways", "GivingApi");
      if (!gateways?.length) {
        return { paymentMethods: [], customerId: null, person: null, currency: "usd", paymentGateways: [] };
      }
      const [methodsResult, personResult] = await Promise.all([
        ApiHelper.get("/paymentmethods/personid/" + personId, "GivingApi") as Promise<{ provider?: string; customerId?: string }[]>,
        ApiHelper.get("/people/" + personId, "MembershipApi") as Promise<PersonInterface>
      ]);
      const pms: SavedPaymentMethod[] = [];
      let customerId: string | null = null;
      if (Array.isArray(methodsResult)) {
        for (const pm of methodsResult) {
          if (getPaymentProvider(pm.provider).capabilities.savedCard) pms.push(new SavedPaymentMethod(pm));
          if (pm.customerId && !customerId) customerId = pm.customerId;
        }
      }
      return { paymentMethods: pms, customerId, person: personResult || null, currency: gateways[0].currency || "usd", paymentGateways: gateways };
    },
    enabled: donationsEnabled,
    // Always refetch on mount — never serve stale financial state.
    staleTime: 0
  });

  // Exchange rates for the church currency, fetched and cached by the Api. Gifts keep their own currency in the
  // list; only the year totals are converted, and the rates are never supplied by the browser.
  const { data: exchangeRates = {} } = useQuery<Record<string, number>>({
    queryKey: ["donate-exchange-rates", personId],
    queryFn: async () => {
      const table = await ApiHelper.get("/donations/exchange-rates", "GivingApi");
      return table?.rates || {};
    },
    enabled: donationsEnabled
  });

  const paymentMethods = paymentData?.paymentMethods ?? null;
  const customerId = paymentData?.customerId ?? null;
  const person = paymentData?.person ?? null;
  const pageCurrency = paymentData?.currency ?? "usd";
  const paymentGateways = paymentData?.paymentGateways ?? [];

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
    staleTime: 0
  });

  const handleDataUpdate = (msg?: string) => {
    setMessage(msg || null);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["donations", personId] });
      queryClient.invalidateQueries({ queryKey: ["donate-payment-data", personId] });
      queryClient.invalidateQueries({ queryKey: ["donate-subscriptions", customerId] });
    }, 2000);
  };

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(id);
  }, [message]);

  const toChurchCurrency = (d: DonationInterface) =>
    CurrencyHelper.convertAmount(amountOf(d), (d as any).currency || pageCurrency, pageCurrency, exchangeRates);
  const isConvertedGift = (d: DonationInterface) => {
    const giftCurrency = ((d as any).currency || pageCurrency).toUpperCase();
    return giftCurrency !== pageCurrency.toUpperCase() && !!exchangeRates[giftCurrency];
  };
  const giftYear = (d: DonationInterface) => DateHelper.toDate(d.donationDate).getFullYear();

  const sortedDonations = useMemo(
    () => [...donations].sort((a, b) => DateHelper.toDate(b.donationDate).getTime() - DateHelper.toDate(a.donationDate).getTime()),
    [donations]
  );

  const summarize = (list: DonationInterface[]) => ({
    total: list.reduce((sum, d) => sum + toChurchCurrency(d), 0),
    count: list.length,
    pending: list.filter((d) => (d as any).status === "pending").length,
    isConverted: list.some(isConvertedGift)
  });

  const ytd = useMemo(
    () => summarize(donations.filter((d) => giftYear(d) === currentYear)),
    [donations, pageCurrency, exchangeRates, currentYear]
  );

  const years = useMemo(() => {
    const set = new Set<number>([currentYear]);
    donations.forEach((d) => set.add(giftYear(d)));
    return [...set].sort((a, b) => b - a);
  }, [donations, currentYear]);

  const historyDonations = useMemo(
    () => (historyYear === "all" ? sortedDonations : sortedDonations.filter((d) => String(giftYear(d)) === historyYear)),
    [sortedDonations, historyYear]
  );
  const history = useMemo(() => summarize(historyDonations), [historyDonations, pageCurrency, exchangeRates]);

  const giftsLabel = (n: number) => (n === 1 ? Locale.label("mobile.giving.giftCountOne") : Locale.label("mobile.giving.giftCount")).replace("{}", String(n));

  const getSubPaymentMethod = (sub: SubscriptionRow) => {
    const pm = (paymentMethods || []).find(
      (p) => (p as any).id === (sub.default_payment_method || sub.default_source)
    );
    if (!pm) return Locale.label("mobile.screens.paymentMethodNotFound");
    return `${(pm as any).name} ****${(pm as any).last4 || ""}`;
  };

  const handlePrintStatement = (year?: string) => {
    if (typeof window === "undefined") return;
    window.open("/mobile/donate/print" + (year ? "?year=" + year : ""), "_blank", "noopener,noreferrer");
  };

  const sliceHref = (slice: string) => `${pathname}?view=${slice}`;
  const backToGiving = <BackVerb label={Locale.label("mobile.giving.backToGiving")} href={pathname} />;
  const messageAlert = message && (
    <Alert severity="success" sx={{ mx: { xs: "12px", md: 0 }, mb: "12px", borderRadius: "10px" }}>{message}</Alert>
  );

  if (config?.allowDonations === false) {
    return (
      <Box>
        <PageHead title={Locale.label("mobile.screenTitles.donation")} />
        <Plate>
          <PlateSection>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>{Locale.label("mobile.screens.givingNotSetUp")}</Typography>
            <QuietEmpty>{Locale.label("mobile.screens.givingNotSetUpBody")}</QuietEmpty>
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  const donationRow = (d: DonationInterface, i: number) => {
    const method = (d as any).method;
    const methodDetails = (d as any).methodDetails;
    const subtitle = DateHelper.prettyDate(DateHelper.toDate(d.donationDate)) + (method ? ` · ${method}${methodDetails ? ` - ${methodDetails}` : ""}` : "");
    return (
      <Row
        key={(d as any).id || i}
        title={(d as any).fund?.name || "—"}
        subtitle={subtitle}
        trailing={<Amount value={CurrencyHelper.formatCurrencyWithLocale(amountOf(d), (d as any).currency || pageCurrency)} pending={(d as any).status === "pending"} />}
      />
    );
  };

  if (!isAuthenticated) {
    return (
      <Box>
        <PageHead
          title={Locale.label("mobile.screenTitles.donation")}
          lede={Locale.label("mobile.screens.supportChurch").replace("{}", church?.name || Locale.label("mobile.screens.ourChurch"))}
        />
        {messageAlert}
        <Plate>
          <PlateSection sx={flatBoxes}>
            {church?.id
              ? <NonAuthDonationWrapper churchId={church.id} showHeader={false} churchLogo={churchLogo} mainContainerCssProps={{ sx: { boxShadow: "none", padding: 0 } }} />
              : <QuietEmpty>{Locale.label("mobile.screens.unableToLoadChurch")}</QuietEmpty>}
          </PlateSection>
          <PlateSection>
            <Typography sx={{ fontSize: 14, color: tc.textSecondary }}>
              {Locale.label("mobile.screens.alreadyHaveAccount")}{" "}
              <TextLink href="/mobile/login?returnUrl=/mobile/donate">{Locale.label("mobile.screens.signInToManageGifts")}</TextLink>
            </Typography>
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  if (view === "give") {
    return (
      <Box>
        {backToGiving}
        <PageHead title={Locale.label("mobile.giving.give")} />
        {messageAlert}
        <Plate>
          <PlateSection sx={flatBoxes}>
            {isMethodsLoading
              ? <QuietEmpty>{Locale.label("mobile.screens.loadingForm")}</QuietEmpty>
              : (
                // The slice can open on cached methods; remount when the refetch changes them so the form picks its default again.
                <MultiGatewayDonationForm
                  key={(paymentMethods || []).map((pm) => pm.id).join(",")}
                  person={person!}
                  customerId={customerId!}
                  paymentMethods={paymentMethods || []}
                  paymentGateways={paymentGateways}
                  donationSuccess={handleDataUpdate}
                  church={church!}
                  churchLogo={churchLogo}
                />
              )}
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  if (view === "manage") {
    return (
      <Box>
        {backToGiving}
        <PageHead title={Locale.label("mobile.giving.manageTitle")} />
        {messageAlert}
        <Plate>
          {isMethodsLoading
            ? <PlateSection><QuietEmpty>{Locale.label("mobile.screens.loading")}</QuietEmpty></PlateSection>
            : (
              <>
                {subscriptions.length > 0 && (
                  <PlateSection sx={{ ...flatBoxes, "& #display-box-content": { overflowX: "auto !important" }, "& .MuiTable-root": { minWidth: 600 } }}>
                    <RecurringDonations customerId={customerId!} paymentMethods={paymentMethods || []} appName="B1App" dataUpdate={handleDataUpdate} />
                  </PlateSection>
                )}
                <PlateSection sx={flatBoxes}>
                  <PaymentMethods person={person!} customerId={customerId!} paymentMethods={paymentMethods || []} appName="B1App" dataUpdate={handleDataUpdate} />
                </PlateSection>
              </>
            )}
        </Plate>
      </Box>
    );
  }

  if (view === "history") {
    const months: { key: string; label: string; items: DonationInterface[] }[] = [];
    historyDonations.forEach((d) => {
      const dt = DateHelper.toDate(d.donationDate);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      let group = months[months.length - 1];
      if (!group || group.key !== key) {
        group = { key, label: dt.toLocaleDateString(undefined, historyYear === "all" ? { month: "long", year: "numeric" } : { month: "long" }), items: [] };
        months.push(group);
      }
      group.items.push(d);
    });
    const yearOptions = [...years.map((y) => ({ value: String(y), label: String(y) })), { value: "all", label: Locale.label("mobile.giving.allYears") }];
    return (
      <Box>
        {backToGiving}
        <PageHead title={Locale.label("mobile.screens.tabHistory")} />
        <Plate>
          <PlateSection>
            <FilterPills options={yearOptions} value={historyYear} onChange={setHistoryYear} label={Locale.label("mobile.giving.years")} />
            {donationsLoading
              ? <QuietEmpty sx={{ mt: "14px" }}>{Locale.label("mobile.screens.loading")}</QuietEmpty>
              : (
                <Box sx={{ mt: "14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <Box>
                    <Box data-testid="giving-period-total"><BigNumber>{CurrencyHelper.formatCurrencyWithLocale(history.total, pageCurrency)}</BigNumber></Box>
                    <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>
                      {giftsLabel(history.count)}{history.pending > 0 && ` · ${Locale.label("mobile.giving.pendingCount").replace("{}", String(history.pending))}`}
                    </Typography>
                    {history.isConverted && (
                      <Typography data-testid="giving-period-converted-note" sx={{ fontSize: 13.5, color: tc.textSecondary }}>{Locale.label("mobile.screens.convertedAtCurrentRates")}</Typography>
                    )}
                  </Box>
                  {historyYear !== "all" && history.count > 0 && (
                    <TextLink onClick={() => handlePrintStatement(historyYear)}>{Locale.label("mobile.screens.printStatement")}</TextLink>
                  )}
                </Box>
              )}
          </PlateSection>
          {!donationsLoading && historyDonations.length === 0 && (
            <PlateSection><QuietEmpty>{Locale.label("mobile.screens.noRecentTransactions")}</QuietEmpty></PlateSection>
          )}
          {months.map((m) => (
            <PlateSection key={m.key} title={m.label}>
              <RowList>{m.items.map(donationRow)}</RowList>
            </PlateSection>
          ))}
        </Plate>
      </Box>
    );
  }

  const recent = sortedDonations.slice(0, 3);

  return (
    <Box>
      <PageHead title={Locale.label("mobile.screenTitles.donation")} lede={church?.name}>
        <Button variant="contained" onClick={() => setView("give")}>{Locale.label("mobile.giving.give")}</Button>
        {donations.length > 0 && <Button variant="outlined" onClick={() => handlePrintStatement()}>{Locale.label("mobile.screens.printStatement")}</Button>}
      </PageHead>
      {messageAlert}
      <Plate>
        <PlateSection title={String(currentYear)} action={<TextLink href={sliceHref("history")}>{Locale.label("mobile.giving.allHistory")}</TextLink>}>
          <Box data-testid="giving-ytd-total"><BigNumber>{CurrencyHelper.formatCurrencyWithLocale(ytd.total || 0, pageCurrency)}</BigNumber></Box>
          <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>
            {(ytd.count === 1 ? Locale.label("mobile.screens.totalThisYearGift") : Locale.label("mobile.screens.totalThisYearGifts")).replace("{}", String(ytd.count))}
          </Typography>
          {ytd.isConverted && (
            <Typography data-testid="giving-ytd-converted-note" sx={{ fontSize: 13.5, color: tc.textSecondary }}>{Locale.label("mobile.screens.convertedAtCurrentRates")}</Typography>
          )}
        </PlateSection>

        <PlateSection title={Locale.label("mobile.screens.recurring")} action={<TextLink href={sliceHref("manage")}>{Locale.label("mobile.screens.tabManage")}</TextLink>}>
          {subscriptions.length === 0
            ? <QuietEmpty>{Locale.label("mobile.giving.noRecurring")}</QuietEmpty>
            : (
              <RowList>
                {subscriptions.map((sub) => {
                  const intervalCount = sub.plan?.interval_count || 1;
                  const interval = `${intervalCount} ${sub.plan?.interval || "month"}${intervalCount > 1 ? "s" : ""}`;
                  const subCurrency = sub.plan?.currency || pageCurrency;
                  const funds = (sub.funds || []).map((f) => f.name).join(", ");
                  return (
                    <Row
                      key={sub.id}
                      title={CurrencyHelper.formatCurrencyWithLocale((sub.plan?.amount || 0) / 100, subCurrency) + (funds ? ` · ${funds}` : "")}
                      subtitle={`${Locale.label("mobile.screens.everyInterval").replace("{}", interval)} · ${getSubPaymentMethod(sub)}`}
                    />
                  );
                })}
              </RowList>
            )}
        </PlateSection>

        <PlateSection
          title={Locale.label("mobile.screens.recentActivity")}
          action={recent.length > 0 && <TextLink onClick={() => setView("give")}>{Locale.label("mobile.giving.repeatLastGift")}</TextLink>}
        >
          {donationsLoading && <QuietEmpty>{Locale.label("mobile.screens.loading")}</QuietEmpty>}
          {!donationsLoading && recent.length === 0 && <QuietEmpty>{Locale.label("mobile.screens.donationsWillAppear")}</QuietEmpty>}
          {recent.length > 0 && <RowList>{recent.map(donationRow)}</RowList>}
        </PlateSection>

        <PlateSection title={Locale.label("mobile.giving.paymentMethods")} action={<TextLink href={sliceHref("manage")}>{Locale.label("mobile.screens.tabManage")}</TextLink>}>
          {isMethodsLoading && <QuietEmpty>{Locale.label("mobile.screens.loading")}</QuietEmpty>}
          {!isMethodsLoading && !paymentMethods?.length && <QuietEmpty>{Locale.label("mobile.giving.noPaymentMethods")}</QuietEmpty>}
          {!!paymentMethods?.length && (
            <RowList>
              {paymentMethods.map((pm) => (
                <Row
                  key={pm.id}
                  leading={pm.type === "bank" ? <AccountBalanceIcon sx={{ color: tc.textSecondary }} /> : <CreditCardIcon sx={{ color: tc.textSecondary }} />}
                  title={pm.type === "paypal" ? (pm.email || pm.name) : `${pm.name || ""} ****${pm.last4 || ""}`}
                  subtitle={pm.exp_month && pm.exp_year ? `${String(pm.exp_month).padStart(2, "0")}/${String(pm.exp_year).slice(-2)}` : undefined}
                />
              ))}
            </RowList>
          )}
        </PlateSection>

        {church?.id && (
          <PlateSection sx={campaignSx}>
            <CampaignProgress churchId={church.id} isAuthenticated={isAuthenticated} currency={pageCurrency} />
          </PlateSection>
        )}
      </Plate>
    </Box>
  );
}

export const DonatePage = (props: Props) => (
  <Suspense>
    <DonatePageInner {...props} />
  </Suspense>
);
