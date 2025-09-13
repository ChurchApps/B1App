"use client";

import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { StableDonationForm } from "./StableDonationForm";
import { RecurringDonations } from "@churchapps/apphelper-donations";
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

export const BaseDonationPage: React.FC<Props> = (props) => {
  const [donations, setDonations] = React.useState<DonationInterface[]>([]);
  const [stripePromise, setStripe] = React.useState<Promise<Stripe>>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<StripePaymentMethod[]>(null);
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
      ApiHelper.get("/donations/my", "GivingApi").then((data: any) => {
        if (isMounted()) {
          setDonations(data);
        }
      });
      ApiHelper.get("/gateways", "GivingApi").then((data: any) => {
        if (data.length && data[0]?.publicKey) {
          if (isMounted()) {
            setStripe(loadStripe(data[0].publicKey));
          }
          ApiHelper.get("/paymentmethods/personid/" + props.personId, "GivingApi").then((results: any) => {
            if (!isMounted()) {
              return;
            }
            if (!results.length) setPaymentMethods([]);
            else {
              let cards = results[0].cards.data.map((card: any) => new StripePaymentMethod(card));
              let banks = results[0].banks.data.map((bank: any) => new StripePaymentMethod(bank));
              let methods = cards.concat(banks);
              setCustomerId(results[0].customer.id);
              setPaymentMethods(methods);
            }
            setIsLoading(false);
          });
          ApiHelper.get("/people/" + props.personId, "MembershipApi").then((data: any) => {
            if (isMounted()) {
              setPerson(data);
            }
          });
        }
        else {
          setPaymentMethods([]);
          setIsLoading(false);
        }
      });
    } else {
      setPaymentMethods([]);
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

    const current_year = donations.filter((d: any) => new Date(d.donationDate).getFullYear() === currentY);
    const last_year = donations.filter((d: any) => new Date(d.donationDate).getFullYear() === lastY);
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
      rows.push(
        <TableRow key={i}>
          {appName !== "B1App" && <TableCell><Link href={"/donations/" + d.batchId}>{d.batchId}</Link></TableCell>}
          <TableCell>{DateHelper.prettyDate(new Date(d.donationDate))}</TableCell>
          <TableCell>{d.method} - {d.methodDetails}</TableCell>
          <TableCell>{d.fund.name}</TableCell>
          <TableCell>{CurrencyHelper.formatCurrency(d.fund.amount)}</TableCell>
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

  React.useEffect(loadData, [isMounted, props.personId]); //eslint-disable-line

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
        paymentMethods={paymentMethods}
        stripePromise={stripePromise}
        donationSuccess={handleDataUpdate}
        church={props?.church}
        churchLogo={props?.churchLogo}
      />
      <DisplayBox headerIcon="payments" headerText="Donations" editContent={getEditContent()} data-testid="donations-display-box">
        {getTable()}
      </DisplayBox>
      <RecurringDonations customerId={customerId} paymentMethods={paymentMethods || []} appName={appName} dataUpdate={handleDataUpdate} data-testid="recurring-donations" />
      <PaymentMethods person={person} customerId={customerId} paymentMethods={paymentMethods || []} appName={appName} stripePromise={stripePromise} dataUpdate={handleDataUpdate} data-testid="payment-methods" />
    </>
  );
}
