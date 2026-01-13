"use client";

import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { StableDonationForm } from "./StableDonationForm";
import { RecurringDonations, StripePaymentMethod as AppHelperStripePaymentMethod } from "@churchapps/apphelper-donations";
import { PaymentMethods } from "@churchapps/apphelper-donations";
import { DisplayBox } from "@churchapps/apphelper";
import { ExportLink } from "@churchapps/apphelper";
import { Loading } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/apphelper";
import { UniqueIdHelper } from "@churchapps/apphelper";
import { CurrencyHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { DonationInterface, PersonInterface, StripePaymentMethod, ChurchInterface } from "@churchapps/helpers";
import { Table, TableBody, TableRow, TableCell, TableHead, Alert, Button, Icon, Menu, MenuItem } from "@mui/material"

import Link from "next/link";
import { useMountedState } from "@churchapps/apphelper";

interface Props { personId: string, appName?: string, church?: ChurchInterface, churchLogo?: string }

/**
 * Converts an AppHelper StripePaymentMethod to a Helpers StripePaymentMethod.
 * These are two distinct classes from different packages with slightly different structures.
 * AppHelper version includes additional fields (provider, email, gatewayId) that the Helpers version lacks.
 */
const convertToHelpersPaymentMethod = (appHelperPM: AppHelperStripePaymentMethod): StripePaymentMethod => new StripePaymentMethod({
  id: appHelperPM.id,
  type: appHelperPM.type,
  card: appHelperPM.name && appHelperPM.type === "card"
    ? {
      brand: appHelperPM.name,
      last4: appHelperPM.last4,
      exp_month: appHelperPM.exp_month,
      exp_year: appHelperPM.exp_year
    }
    : undefined,
  bank_name: appHelperPM.type === "bank" ? appHelperPM.name : undefined,
  last4: appHelperPM.last4,
  exp_month: appHelperPM.exp_month,
  exp_year: appHelperPM.exp_year,
  status: appHelperPM.status,
  account_holder_name: appHelperPM.account_holder_name,
  account_holder_type: appHelperPM.account_holder_type,
});

export const BaseDonationPage: React.FC<Props> = (props) => {
  const [donations, setDonations] = React.useState<DonationInterface[]>([]);
  const [stripePromise, setStripe] = React.useState<Promise<Stripe>>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<StripePaymentMethod[]>(null);
  const [appHelperPaymentMethods, setAppHelperPaymentMethods] = React.useState<AppHelperStripePaymentMethod[]>(null);
  const [customerId, setCustomerId] = React.useState(null);
  const [person, setPerson] = React.useState<PersonInterface>(null);
  const [message, setMessage] = React.useState<string>(null);
  const [appName, setAppName] = React.useState<string>("");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const open = Boolean(anchorEl);
  const isMounted = useMountedState();

  const handleClose = () => {
    setAnchorEl(null);
  }

  const loadData = () => {
    if (props?.appName) setAppName(props.appName);
    if (!UniqueIdHelper.isMissing(props.personId)) {
      setIsLoading(true);
      ApiHelper.get("/donations/my", "GivingApi").then((data: DonationInterface[]) => {
        if (isMounted()) {
          setDonations(data);
        }
      });
      ApiHelper.get("/gateways", "GivingApi").then((data: { publicKey?: string }[]) => {
        if (data.length && data[0]?.publicKey) {
          if (isMounted()) {
            setStripe(loadStripe(data[0].publicKey));
          }
          ApiHelper.get("/paymentmethods/personid/" + props.personId, "GivingApi").then((results: { provider?: string; customerId?: string }[]) => {
            if (!isMounted()) {
              return;
            }
            if (!Array.isArray(results) || results.length === 0) {
              setPaymentMethods([]);
              setAppHelperPaymentMethods([]);
            } else {
              const methods: StripePaymentMethod[] = [];
              const appHelperMethods: AppHelperStripePaymentMethod[] = [];

              for (const pm of results) {
                if (pm.provider === 'stripe') {
                  // Create AppHelper version for donation components
                  const appHelperPM = new AppHelperStripePaymentMethod(pm);
                  appHelperMethods.push(appHelperPM);

                  // Convert to Helpers version for backward compatibility
                  const helpersPM = convertToHelpersPaymentMethod(appHelperPM);
                  methods.push(helpersPM);
                }

                // Extract customer ID from first payment method if we don't have one
                if (pm.customerId && !customerId) {
                  setCustomerId(pm.customerId);
                }
              }

              setPaymentMethods(methods);
              setAppHelperPaymentMethods(appHelperMethods);
            }
            setIsLoading(false);
          });
          ApiHelper.get("/people/" + props.personId, "MembershipApi").then((data: PersonInterface) => {
            if (isMounted()) {
              setPerson(data);
            }
          });
        }
        else {
          setPaymentMethods([]);
          setAppHelperPaymentMethods([]);
          setIsLoading(false);
        }
      });
    } else {
      setPaymentMethods([]);
      setAppHelperPaymentMethods([]);
      setDonations([]);
      setIsLoading(false);
    }
  }

  const handleDataUpdate = (message?: string) => {
    setMessage(message)
    // Add a small delay to allow backend to process the donation
    setTimeout(() => {
      loadData();
    }, 2000);
  }

  const getEditContent = () => {
    if (!donations) return [];
    const result: React.ReactElement[] = [];
    const date = new Date();
    const currentY = date.getFullYear();
    const lastY = date.getFullYear() - 1;

    const current_year = donations.filter((d: DonationInterface) => new Date(d.donationDate).getFullYear() === currentY);
    const last_year = donations.filter((d: DonationInterface) => new Date(d.donationDate).getFullYear() === lastY);
    const customHeaders = [
      { label: "amount", key: "amount" },
      { label: "donationDate", key: "donationDate" },
      { label: "fundName", key: "fund.name" },
      { label: "method", key: "method" },
      { label: "methodDetails", key: "methodDetails" },
    ]

    result.push(
      <React.Fragment key="export-menu">
        <Button
          id="download-button"
          aria-controls={open ? "download-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            setAnchorEl(e.currentTarget);
          }}
          data-testid="donation-download-button"
          aria-label="Download donation records"
        >
          <Icon>download</Icon>
        </Button>
        <Menu
          id="download-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{ 'aria-labelledby': "download-button" }}
        >
          <MenuItem onClick={handleClose} dense data-testid="export-current-year-csv" aria-label="Export current year donations as CSV"><ExportLink data={current_year} filename="current_year_donations" customHeaders={customHeaders} text="Current Year (CSV)" icon="table_chart" data-testid="current-year-export-link" /></MenuItem>
          <MenuItem onClick={handleClose} dense data-testid="print-current-year" aria-label="Print current year donations"><Link href="/my/donate/print"><Button data-testid="print-current-year-button" aria-label="Print current year donations"><Icon>print</Icon> &nbsp; CURRENT YEAR (PRINT)</Button></Link></MenuItem>
          <MenuItem onClick={handleClose} dense data-testid="export-last-year-csv" aria-label="Export last year donations as CSV"><ExportLink data={last_year} filename="last_year_donations" customHeaders={customHeaders} text="Last Year (CSV)" icon="table_chart" data-testid="last-year-export-link" /></MenuItem>
          <MenuItem onClick={handleClose} dense data-testid="print-last-year" aria-label="Print last year donations"><Link href="/my/donate/print?prev=1"><Button data-testid="print-last-year-button" aria-label="Print last year donations"><Icon>print</Icon> &nbsp; LAST YEAR (PRINT)</Button></Link></MenuItem>
        </Menu>
      </React.Fragment>
    );

    return result;
  }

  const getRows = () => {
    let rows: React.ReactElement[] = [];

    if (donations.length === 0) {
      rows.push(<TableRow key="0"><TableCell>{Locale.label("donation.page.willAppear")}</TableCell></TableRow>);
      return rows;
    }

    for (let i = 0; i < donations.length; i++) {
      let d = donations[i];
      const isPending = d.status === "pending";
      rows.push(
        <TableRow key={i} sx={{ opacity: isPending ? 0.8 : 1 }}>
          {appName !== "B1App" && <TableCell><Link href={"/donations/" + d.batchId}>{d.batchId}</Link></TableCell>}
          <TableCell>{DateHelper.prettyDate(new Date(d.donationDate))}</TableCell>
          <TableCell>{d.method} - {d.methodDetails}</TableCell>
          <TableCell>{d.fund.name}{isPending && " (Pending)"}</TableCell>
          <TableCell sx={{ color: isPending ? "warning.main" : undefined }}>{CurrencyHelper.formatCurrency(d.fund.amount)}</TableCell>
        </TableRow>
      );
    }
    return rows;
  }

  const getTableHeader = () => {
    const rows: React.ReactElement[] = []

    if (donations.length > 0) {
      rows.push(
        <TableRow key="header" sx={{ textAlign: "left" }}>
          {appName !== "B1App" && <th>{Locale.label("donation.page.batch")}</th>}
          <th>{Locale.label("donation.page.date")}</th>
          <th>{Locale.label("donation.page.method")}</th>
          <th>{Locale.label("donation.page.fund")}</th>
          <th>{Locale.label("donation.page.amount")}</th>
        </TableRow>
      );
    }

    return rows;
  }

  React.useEffect(loadData, [props.personId]); //eslint-disable-line

  const getTable = () => (<Table>
    <TableHead>{getTableHeader()}</TableHead>
    <TableBody>{getRows()}</TableBody>
  </Table>);

  if (isLoading) {
    return (
      <>
        {message && <Alert severity="success">{message}</Alert>}
        <Loading data-testid="payment-methods-loading" />
      </>
    );
  }

  return (
    <>
      {message && <Alert severity="success">{message}</Alert>}
      <StableDonationForm
        person={person}
        customerId={customerId}
        paymentMethods={appHelperPaymentMethods}
        stripePromise={stripePromise}
        donationSuccess={handleDataUpdate}
        church={props?.church}
        churchLogo={props?.churchLogo}
      />
      <DisplayBox headerIcon="payments" headerText="Donations" editContent={getEditContent()} data-testid="donations-display-box">
        {getTable()}
      </DisplayBox>
      <RecurringDonations customerId={customerId} paymentMethods={appHelperPaymentMethods || []} appName={appName} dataUpdate={handleDataUpdate} data-testid="recurring-donations" />
      <PaymentMethods person={person} customerId={customerId} paymentMethods={appHelperPaymentMethods || []} appName={appName} stripePromise={stripePromise} dataUpdate={handleDataUpdate} data-testid="payment-methods" />
    </>
  );
}
