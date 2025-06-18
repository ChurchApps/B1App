"use client";

import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { DonationForm, RecurringDonations, PaymentMethods } from "@churchapps/apphelper/dist/donationComponents/components"
import { DisplayBox, ExportLink, Loading } from "@churchapps/apphelper/dist/components"
import { ApiHelper, DateHelper, UniqueIdHelper, CurrencyHelper, Locale } from "@churchapps/apphelper/dist/helpers";
import { DonationInterface, PersonInterface, StripePaymentMethod, ChurchInterface } from "@churchapps/helpers";
import { Table, TableBody, TableRow, TableCell, TableHead, Alert, Button, Icon, Menu, MenuItem } from "@mui/material"

import Link from "next/link";
import { useMountedState } from "@churchapps/apphelper/dist/hooks/useMountedState";

interface Props { personId: string, appName?: string, church?: ChurchInterface, churchLogo?: string }

export const BaseDonationPage: React.FC<Props> = (props) => {
  const [donations, setDonations] = React.useState<DonationInterface[]>(null);
  const [stripePromise, setStripe] = React.useState<Promise<Stripe>>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<StripePaymentMethod[]>(null);
  const [customerId, setCustomerId] = React.useState(null);
  const [person, setPerson] = React.useState<PersonInterface>(null);
  const [message, setMessage] = React.useState<string>(null);
  const [appName, setAppName] = React.useState<string>("");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isMounted = useMountedState();

  const handleClose = () => {
    setAnchorEl(null);
  }

  const loadData = () => {
    if (props?.appName) setAppName(props.appName);
    if (!UniqueIdHelper.isMissing(props.personId)) {
      ApiHelper.get("/donations/my", "GivingApi").then(data => {
        if (isMounted()) {
          setDonations(data);
        }
      });
      ApiHelper.get("/gateways", "GivingApi").then(data => {
        if (data.length && data[0]?.publicKey) {
          if (isMounted()) {
            setStripe(loadStripe(data[0].publicKey));
          }
          ApiHelper.get("/paymentmethods/personid/" + props.personId, "GivingApi").then(results => {
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
          });
          ApiHelper.get("/people/" + props.personId, "MembershipApi").then(data => {
            if (isMounted()) {
              setPerson(data);
            }
          });
        }
        else setPaymentMethods([]);
      });
    } else {
      console.log('PersonId is missing or invalid:', props.personId);
    }
  }

  const handleDataUpdate = (message?: string) => {
    setMessage(message)
    setPaymentMethods(null);
    loadData();
  }

  const getEditContent = () => {
    const result: JSX.Element[] = [];
    const date = new Date();
    const currentY = date.getFullYear();
    const lastY = date.getFullYear() - 1;

    const current_year = donations.filter(d => new Date(d.donationDate).getFullYear() === currentY);
    const last_year = donations.filter(d => new Date(d.donationDate).getFullYear() === lastY);
    const customHeaders = [
      { label: "amount", key: "amount" },
      { label: "donationDate", key: "donationDate" },
      { label: "fundName", key: "fund.name" },
      { label: "method", key: "method" },
      { label: "methodDetails", key: "methodDetails" },
    ]

    result.push(<>
      <Button
        id="download-button"
        aria-controls={open ? "download-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          setAnchorEl(e.currentTarget);
        }}
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
        <MenuItem onClick={handleClose} dense><ExportLink data={current_year} filename="current_year_donations" customHeaders={customHeaders} text="Current Year (CSV)" icon="table_chart" /></MenuItem>
        <MenuItem onClick={handleClose} dense><Link href="/my/donate/print"><Button><Icon>print</Icon> &nbsp; CURRENT YEAR (PRINT)</Button></Link></MenuItem>
        <MenuItem onClick={handleClose} dense><ExportLink data={last_year} filename="last_year_donations" customHeaders={customHeaders} text="Last Year (CSV)" icon="table_chart" /></MenuItem>
        <MenuItem onClick={handleClose} dense><Link href="/my/donate/print?prev=1"><Button><Icon>print</Icon> &nbsp; LAST YEAR (PRINT)</Button></Link></MenuItem>
      </Menu>
    </>);

    return result;
  }

  const getRows = () => {
    let rows: JSX.Element[] = [];

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
    const rows: JSX.Element[] = []

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

  const getTable = () => {
    if (!donations) return <Loading />;
    else return (<Table>
      <TableHead>{getTableHeader()}</TableHead>
      <TableBody>{getRows()}</TableBody>
    </Table>);
  }

  const getPaymentMethodComponents = () => {
    if (!paymentMethods) return <Loading />;
    else return (
      <>
        <DonationForm person={person} customerId={customerId} paymentMethods={paymentMethods} stripePromise={stripePromise} donationSuccess={handleDataUpdate} church={props?.church} churchLogo={props?.churchLogo} />
        <DisplayBox headerIcon="payments" headerText="Donations" editContent={getEditContent()}>
          {getTable()}
        </DisplayBox>
        <RecurringDonations customerId={customerId} paymentMethods={paymentMethods} appName={appName} dataUpdate={handleDataUpdate} />
        <PaymentMethods person={person} customerId={customerId} paymentMethods={paymentMethods} appName={appName} stripePromise={stripePromise} dataUpdate={handleDataUpdate} />
      </>
    );
  }

  return (
    <>
      {paymentMethods && message && <Alert severity="success">{message}</Alert>}
      {getPaymentMethodComponents()}
    </>
  );
}
