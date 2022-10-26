import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { DonationForm, RecurringDonations, PaymentMethods } from "./components";
import { DisplayBox, Loading } from "../components";
import { ApiHelper, DateHelper, UniqueIdHelper, CurrencyHelper } from "../helpers";
import { DonationInterface, PersonInterface, StripePaymentMethod } from "../interfaces";
import { Link } from "react-router-dom"
import { Table, TableBody, TableRow, TableCell, TableHead, Alert } from "@mui/material"
import useMountedState from "../hooks/useMountedState";

interface Props { personId: string, appName?: string }

export const DonationPage: React.FC<Props> = (props) => {
  const [donations, setDonations] = React.useState<DonationInterface[]>(null);
  const [stripePromise, setStripe] = React.useState<Promise<Stripe>>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<StripePaymentMethod[]>(null);
  const [customerId, setCustomerId] = React.useState(null);
  const [person, setPerson] = React.useState<PersonInterface>(null);
  const [message, setMessage] = React.useState<string>(null);
  const [appName, setAppName] = React.useState<string>("");
  const isMounted = useMountedState();

  const loadData = () => {
    if (props?.appName) setAppName(props.appName);
    if (!UniqueIdHelper.isMissing(props.personId)) {
      ApiHelper.get("/donations?personId=" + props.personId, "GivingApi").then(data => {
        if(isMounted()) {
          setDonations(data);
        }});
      ApiHelper.get("/gateways", "GivingApi").then(data => {
        if (data.length && data[0]?.publicKey) {
          if(isMounted()) {
            setStripe(loadStripe(data[0].publicKey));
          }
          ApiHelper.get("/paymentmethods/personid/" + props.personId, "GivingApi").then(results => {
            if(!isMounted()) {
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
            if(isMounted()) {
              setPerson(data);
            }
          });
        }
        else setPaymentMethods([]);
      });
    }
  }

  const handleDataUpdate = (message?: string) => {
    setMessage(message)
    setPaymentMethods(null);
    loadData();
  }

  const getRows = () => {
    let rows: JSX.Element[] = [];

    if (donations.length === 0) {
      rows.push(<TableRow key="0"><TableCell>Donations will appear once a donation has been entered.</TableCell></TableRow>);
      return rows;
    }

    for (let i = 0; i < donations.length; i++) {
      let d = donations[i];
      rows.push(
        <TableRow key={i}>
          {appName !== "B1App" && <TableCell><Link to={"/donations/" + d.batchId}>{d.batchId}</Link></TableCell>}
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
        <TableRow key="header" sx={{textAlign: "left"}}>
          {appName !== "B1App" && <th>Batch</th>}
          <th>Date</th>
          <th>Method</th>
          <th>Fund</th>
          <th>Amount</th>
        </TableRow>
      );
    }

    return rows;
  }

  React.useEffect(loadData, [isMounted]); //eslint-disable-line

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
        <DonationForm person={person} customerId={customerId} paymentMethods={paymentMethods} stripePromise={stripePromise} donationSuccess={handleDataUpdate} />
        <DisplayBox headerIcon="payments" headerText="Donations">
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
