"use client";

import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { StableDonationForm } from "@/components/donate/StableDonationForm";
import { RecurringDonations, StripePaymentMethod as AppHelperStripePaymentMethod } from "@churchapps/apphelper-donations";
import { PaymentMethods } from "@churchapps/apphelper-donations";
import { ApiHelper, Loading, UniqueIdHelper, useMountedState, CurrencyHelper, DateHelper, DisplayBox, ExportLink } from "@churchapps/apphelper";
import { DonationInterface, PersonInterface, StripePaymentMethod, ChurchInterface } from "@churchapps/helpers";
import { Alert, Table, TableBody, TableRow, TableCell, TableHead, Icon, Button, Menu, MenuItem } from "@mui/material";
import Link from "next/link";
import type { DonationSection } from "./DonationsMasterPanel";

interface Props {
  personId: string;
  church?: ChurchInterface;
  churchLogo?: string;
  donations: DonationInterface[];
  donationsLoading: boolean;
  onDataUpdate: () => void;
  activeSection: DonationSection;
  onBack: () => void;
}

const convertToHelpersPaymentMethod = (appHelperPM: AppHelperStripePaymentMethod): StripePaymentMethod => new StripePaymentMethod({
  id: appHelperPM.id,
  type: appHelperPM.type,
  card: appHelperPM.name && appHelperPM.type === "card"
    ? { brand: appHelperPM.name, last4: appHelperPM.last4, exp_month: appHelperPM.exp_month, exp_year: appHelperPM.exp_year }
    : undefined,
  bank_name: appHelperPM.type === "bank" ? appHelperPM.name : undefined,
  last4: appHelperPM.last4,
  exp_month: appHelperPM.exp_month,
  exp_year: appHelperPM.exp_year,
  status: appHelperPM.status,
  account_holder_name: appHelperPM.account_holder_name,
  account_holder_type: appHelperPM.account_holder_type
});

export function DonationsDetailPanel({ personId, church, churchLogo, donations, donationsLoading, onDataUpdate, activeSection, onBack }: Props) {
  const [stripePromise, setStripe] = React.useState<Promise<Stripe>>(null);
  const [appHelperPaymentMethods, setAppHelperPaymentMethods] = React.useState<AppHelperStripePaymentMethod[]>(null);
  const [customerId, setCustomerId] = React.useState(null);
  const [person, setPerson] = React.useState<PersonInterface>(null);
  const [message, setMessage] = React.useState<string>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMounted = useMountedState();

  const loadData = () => {
    if (!UniqueIdHelper.isMissing(personId)) {
      setIsLoading(true);
      ApiHelper.get("/gateways", "GivingApi").then((data: { publicKey?: string }[]) => {
        if (data.length && data[0]?.publicKey) {
          if (isMounted()) setStripe(loadStripe(data[0].publicKey));
          ApiHelper.get("/paymentmethods/personid/" + personId, "GivingApi").then((results: { provider?: string; customerId?: string }[]) => {
            if (!isMounted()) return;
            if (!Array.isArray(results) || results.length === 0) {
              setAppHelperPaymentMethods([]);
            } else {
              const appHelperMethods: AppHelperStripePaymentMethod[] = [];
              for (const pm of results) {
                if (pm.provider === "stripe") appHelperMethods.push(new AppHelperStripePaymentMethod(pm));
                if (pm.customerId && !customerId) setCustomerId(pm.customerId);
              }
              setAppHelperPaymentMethods(appHelperMethods);
            }
            setIsLoading(false);
          });
          ApiHelper.get("/people/" + personId, "MembershipApi").then((data: PersonInterface) => {
            if (isMounted()) setPerson(data);
          });
        } else {
          setAppHelperPaymentMethods([]);
          setIsLoading(false);
        }
      });
    } else {
      setAppHelperPaymentMethods([]);
      setIsLoading(false);
    }
  };

  const handleDataUpdate = (msg?: string) => {
    setMessage(msg);
    setTimeout(() => { loadData(); onDataUpdate(); }, 2000);
  };

  React.useEffect(loadData, [personId]);

  if (isLoading) {
    return (
      <>
        {message && <Alert severity="success">{message}</Alert>}
        <Loading />
      </>
    );
  }

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const currentYearDonations = donations.filter((d) => DateHelper.toDate(d.donationDate).getFullYear() === currentYear);
  const lastYearDonations = donations.filter((d) => DateHelper.toDate(d.donationDate).getFullYear() === lastYear);
  const customHeaders = [
    { label: "amount", key: "amount" },
    { label: "donationDate", key: "donationDate" },
    { label: "fundName", key: "fund.name" },
    { label: "method", key: "method" },
    { label: "methodDetails", key: "methodDetails" }
  ];
  const open = Boolean(anchorEl);

  const getHistoryContent = () => (
    <DisplayBox headerIcon="receipt_long" headerText="Donation History" editContent={
      donations.length > 0 ? (
        <>
          <Button size="small" onClick={(e) => setAnchorEl(e.currentTarget)}><Icon>download</Icon></Button>
          <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => setAnchorEl(null)} dense>
              <ExportLink data={currentYearDonations} filename="current_year_donations" customHeaders={customHeaders} text="Current Year (CSV)" icon="table_chart" />
            </MenuItem>
            <MenuItem onClick={() => setAnchorEl(null)} dense>
              <Link href="/my/donate/print"><Button><Icon>print</Icon>&nbsp;Current Year (Print)</Button></Link>
            </MenuItem>
            <MenuItem onClick={() => setAnchorEl(null)} dense>
              <ExportLink data={lastYearDonations} filename="last_year_donations" customHeaders={customHeaders} text="Last Year (CSV)" icon="table_chart" />
            </MenuItem>
            <MenuItem onClick={() => setAnchorEl(null)} dense>
              <Link href="/my/donate/print?prev=1"><Button><Icon>print</Icon>&nbsp;Last Year (Print)</Button></Link>
            </MenuItem>
          </Menu>
        </>
      ) : undefined
    }>
      {donationsLoading && <div style={{ padding: 10, color: "#666" }}>Loading...</div>}
      {!donationsLoading && donations.length === 0 && <p>Your donations will appear here once you make your first gift.</p>}
      {!donationsLoading && donations.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Fund</TableCell>
              <TableCell>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donations.map((d, i) => {
              const isPending = d.status === "pending";
              return (
                <TableRow key={i} sx={{ opacity: isPending ? 0.8 : 1 }}>
                  <TableCell>{DateHelper.prettyDate(DateHelper.toDate(d.donationDate))}</TableCell>
                  <TableCell>{d.method} - {d.methodDetails}</TableCell>
                  <TableCell>{d.fund.name}{isPending && " (Pending)"}</TableCell>
                  <TableCell sx={{ color: isPending ? "warning.main" : undefined }}>{CurrencyHelper.formatCurrency(d.fund.amount)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </DisplayBox>
  );

  const getGiveContent = () => (
    <>
      {message && <Alert severity="success">{message}</Alert>}
      <StableDonationForm
        person={person}
        customerId={customerId}
        paymentMethods={appHelperPaymentMethods}
        stripePromise={stripePromise}
        donationSuccess={handleDataUpdate}
        church={church}
        churchLogo={churchLogo}
      />
    </>
  );

  const getRecurringContent = () => (
    <>
      <RecurringDonations customerId={customerId} paymentMethods={appHelperPaymentMethods || []} appName="B1App" dataUpdate={handleDataUpdate} />
      <PaymentMethods person={person} customerId={customerId} paymentMethods={appHelperPaymentMethods || []} appName="B1App" stripePromise={stripePromise} dataUpdate={handleDataUpdate} />
    </>
  );

  return (
    <>
      <button className="detailBackBtn" onClick={onBack}>
        <Icon sx={{ fontSize: 20 }}>arrow_back</Icon>
        Back to menu
      </button>
      {activeSection === "give" && getGiveContent()}
      {activeSection === "history" && getHistoryContent()}
      {activeSection === "recurring" && getRecurringContent()}
    </>
  );
}
